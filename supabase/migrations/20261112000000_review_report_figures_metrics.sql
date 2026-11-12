-- ============================================================================
-- Figures du rapport de bilan : trois clés AJOUTÉES à build_review_report_metrics
-- (aucune clé retirée ni modifiée ; version précédente :
-- 20261111050000_review_report_metrics_on_official.sql, à ré-exécuter pour
-- revenir en arrière).
--
--   nps_histogram : nombre de réponses par note de recommandation (0 à 10),
--                   par rôle. Sert à l'histogramme des notes.
--   pair_scores   : pour les SEULS binômes où le mentor ET le mentoré ont
--                   répondu, leurs notes de recommandation (0-10) et de
--                   qualité de la relation (1-5). Sert aux « regards croisés »
--                   (version interne du rapport uniquement).
--   profile       : sexe des mentors et des mentorés, niveau d'études des
--                   mentorés, sur les binômes officiels (profil de la cohorte).
--
-- Toujours la même source : official_binomes (is_test = false).
-- ============================================================================

create or replace function public.build_review_report_metrics(p_cohorte text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not (public.is_review_admin() or auth.role() = 'service_role') then
    raise exception 'access_denied' using errcode = '42501';
  end if;

  with scoped_binomes as (
    -- Source unique : seuls les binômes officiels (is_test = false).
    select b.*
    from public.official_binomes b
    where p_cohorte is null or b.cohorte = p_cohorte
  ),
  scoped_tokens as (
    select rt.*
    from public.review_tokens rt
    join scoped_binomes b on b.id = rt.binome_id
  ),
  scoped_responses as (
    select rr.*
    from public.review_responses rr
    join scoped_binomes b on b.id = rr.binome_id
  ),
  invited as (
    -- Une personne invitée = un couple (binôme, rôle), même si son lien a été régénéré.
    select distinct binome_id, role from scoped_tokens
  ),
  response_rate as (
    select
      i.role,
      count(*) as total_tokens,
      count(rr.id) as total_responses,
      round(count(rr.id)::numeric / nullif(count(*), 0) * 100, 1) as response_rate_pct
    from invited i
    left join scoped_responses rr on rr.binome_id = i.binome_id and rr.role = i.role
    group by i.role
  ),
  nps_stats as (
    select
      role,
      round(avg(nps_score), 1) as avg_nps,
      count(*) filter (where nps_score >= 9) as promoters,
      count(*) filter (where nps_score between 7 and 8) as passives,
      count(*) filter (where nps_score <= 6) as detractors,
      count(nps_score) as total_nps
    from scoped_responses
    group by role
  ),
  nps_global as (
    -- NPS = % de promoteurs (9-10) moins % de détracteurs (0-6), tous rôles confondus.
    select
      count(*) filter (where nps_score >= 9) as promoters,
      count(*) filter (where nps_score between 7 and 8) as passives,
      count(*) filter (where nps_score <= 6) as detractors,
      count(nps_score) as total_nps,
      round(
        (count(*) filter (where nps_score >= 9) - count(*) filter (where nps_score <= 6))::numeric
        / nullif(count(nps_score), 0) * 100
      ) as nps_score
    from scoped_responses
  ),
  likert_long as (
    select
      rr.role,
      kv.key as question_id,
      (kv.value)::numeric as value
    from scoped_responses rr,
      lateral jsonb_each(rr.answers) kv
    where jsonb_typeof(kv.value) = 'number'
  ),
  likert_stats as (
    select
      role,
      question_id,
      round(avg(value), 2) as avg_value,
      count(*) as n,
      jsonb_build_object(
        '1', count(*) filter (where value = 1),
        '2', count(*) filter (where value = 2),
        '3', count(*) filter (where value = 3),
        '4', count(*) filter (where value = 4),
        '5', count(*) filter (where value = 5)
      ) as distribution
    from likert_long
    group by role, question_id
  ),
  pair_gaps as (
    select
      kv_m.key as question_id,
      round(avg(abs((kv_m.value)::numeric - (kv_e.value)::numeric)), 2) as avg_gap,
      count(*) as n_pairs
    from public.review_pair_comparison pc
    cross join lateral jsonb_each(coalesce(pc.mentor_answers, '{}'::jsonb)) kv_m
    cross join lateral jsonb_each(coalesce(pc.mentore_answers, '{}'::jsonb)) kv_e
    where kv_m.key = kv_e.key
      and jsonb_typeof(kv_m.value) = 'number'
      and jsonb_typeof(kv_e.value) = 'number'
      and (p_cohorte is null or pc.cohorte = p_cohorte)
    group by kv_m.key
  ),
  sessions_distribution as (
    select role, answers ->> 'sessions_count' as bucket, count(*) as n
    from scoped_responses
    where answers ->> 'sessions_count' is not null
    group by role, bucket
  ),
  continuation_distribution as (
    select role, answers ->> 'continuation_interest' as bucket, count(*) as n
    from scoped_responses
    where answers ->> 'continuation_interest' is not null
    group by role, bucket
  ),
  -- Questions à choix multiples (contribution_type côté mentor,
  -- contribution_received côté mentoré) : stockées en tableau JSON.
  contribution_distribution as (
    select
      rr.role,
      kv.key as question_id,
      elem.option as option,
      count(*) as n
    from scoped_responses rr,
      lateral jsonb_each(rr.answers) kv,
      lateral jsonb_array_elements_text(kv.value) as elem(option)
    where kv.key in ('contribution_type', 'contribution_received')
      and jsonb_typeof(kv.value) = 'array'
    group by rr.role, kv.key, elem.option
  ),
  platform_impact_distribution as (
    select role, answers ->> 'platform_impact' as bucket, count(*) as n
    from scoped_responses
    where answers ->> 'platform_impact' is not null
    group by role, bucket
  ),
  -- Nombre de réponses par note de recommandation (seules les notes données).
  nps_histogram as (
    select role, nps_score as score, count(*) as n
    from scoped_responses
    where nps_score is not null
    group by role, nps_score
  ),
  -- Binômes où les deux ont répondu : notes côte à côte. Une note absente
  -- reste null (jamais remplacée par 0).
  pair_scores as (
    select
      pc.binome_id,
      pc.mentor_nps,
      pc.mentore_nps,
      case when jsonb_typeof(pc.mentor_answers -> 'relationship_quality') = 'number'
        then (pc.mentor_answers ->> 'relationship_quality')::numeric end as mentor_relationship,
      case when jsonb_typeof(pc.mentore_answers -> 'relationship_quality') = 'number'
        then (pc.mentore_answers ->> 'relationship_quality')::numeric end as mentore_relationship
    from public.review_pair_comparison pc
    join scoped_binomes b on b.id = pc.binome_id
    where pc.mentor_answers is not null and pc.mentore_answers is not null
  ),
  -- Profil de la cohorte : une ligne par valeur, 'non_renseigne' si la
  -- colonne est vide (affiché comme tel, jamais réparti ailleurs).
  profile_mentor_sexe as (
    select coalesce(nullif(m.sexe, ''), 'non_renseigne') as value, count(*) as n
    from scoped_binomes b left join public.mentor m on m.id = b.mentor_id
    group by 1
  ),
  profile_mentore_sexe as (
    select coalesce(nullif(e.sexe, ''), 'non_renseigne') as value, count(*) as n
    from scoped_binomes b left join public.mentore e on e.id = b.mentore_id
    group by 1
  ),
  profile_mentore_level as (
    select coalesce(nullif(e.level, ''), 'non_renseigne') as value, count(*) as n
    from scoped_binomes b left join public.mentore e on e.id = b.mentore_id
    group by 1
  )
  select jsonb_build_object(
    'cohorte', p_cohorte,
    'computed_at', now(),
    'binomes_count', (select count(*) from scoped_binomes),
    'response_rate', (select coalesce(jsonb_agg(response_rate), '[]'::jsonb) from response_rate),
    'nps', (select coalesce(jsonb_agg(nps_stats), '[]'::jsonb) from nps_stats),
    'nps_global', (select to_jsonb(nps_global) from nps_global),
    'likert_by_question', (select coalesce(jsonb_agg(likert_stats), '[]'::jsonb) from likert_stats),
    'pair_gaps', (select coalesce(jsonb_agg(pair_gaps order by avg_gap desc), '[]'::jsonb) from pair_gaps),
    'sessions_distribution', (select coalesce(jsonb_agg(sessions_distribution), '[]'::jsonb) from sessions_distribution),
    'continuation_distribution', (select coalesce(jsonb_agg(continuation_distribution), '[]'::jsonb) from continuation_distribution),
    'contribution_distribution', (select coalesce(jsonb_agg(contribution_distribution order by n desc), '[]'::jsonb) from contribution_distribution),
    'platform_impact_distribution', (select coalesce(jsonb_agg(platform_impact_distribution), '[]'::jsonb) from platform_impact_distribution),
    'total_responses', (select count(*) from scoped_responses),
    'nps_histogram', (select coalesce(jsonb_agg(nps_histogram order by role, score), '[]'::jsonb) from nps_histogram),
    'pair_scores', (select coalesce(jsonb_agg(pair_scores), '[]'::jsonb) from pair_scores),
    'profile', jsonb_build_object(
      'mentor_sexe', (select coalesce(jsonb_agg(profile_mentor_sexe order by n desc), '[]'::jsonb) from profile_mentor_sexe),
      'mentore_sexe', (select coalesce(jsonb_agg(profile_mentore_sexe order by n desc), '[]'::jsonb) from profile_mentore_sexe),
      'mentore_level', (select coalesce(jsonb_agg(profile_mentore_level order by value), '[]'::jsonb) from profile_mentore_level)
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.build_review_report_metrics(text) to authenticated, service_role;
