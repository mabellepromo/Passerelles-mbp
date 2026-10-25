-- ============================================================================
-- Ajoute la répartition des réponses à la question "continuation_interest"
-- (poursuite hypothétique du programme) aux métriques du rapport de bilan.
-- Remplace build_review_report_metrics (même signature) pour ajouter la clé
-- "continuation_distribution", sur le même modèle que "sessions_distribution".
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

  with scoped_tokens as (
    select rt.*
    from public.review_tokens rt
    join public.binome b on b.id = rt.binome_id
    where p_cohorte is null or b.cohorte = p_cohorte
  ),
  scoped_responses as (
    select rr.*
    from public.review_responses rr
    join public.binome b on b.id = rr.binome_id
    where p_cohorte is null or b.cohorte = p_cohorte
  ),
  response_rate as (
    select
      rt.role,
      count(rt.id) as total_tokens,
      count(rr.id) as total_responses,
      round(count(rr.id)::numeric / nullif(count(rt.id), 0) * 100, 1) as response_rate_pct
    from scoped_tokens rt
    left join scoped_responses rr on rr.token_id = rt.id
    group by rt.role
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
  -- Répartition des réponses à "continuation_interest" (poursuite hypothétique
  -- du programme), par rôle. Question de type select -> valeur texte, donc
  -- absente de likert_long (qui ne garde que les valeurs numériques).
  continuation_distribution as (
    select role, answers ->> 'continuation_interest' as bucket, count(*) as n
    from scoped_responses
    where answers ->> 'continuation_interest' is not null
    group by role, bucket
  )
  select jsonb_build_object(
    'cohorte', p_cohorte,
    'computed_at', now(),
    'response_rate', (select coalesce(jsonb_agg(response_rate), '[]'::jsonb) from response_rate),
    'nps', (select coalesce(jsonb_agg(nps_stats), '[]'::jsonb) from nps_stats),
    'likert_by_question', (select coalesce(jsonb_agg(likert_stats), '[]'::jsonb) from likert_stats),
    'pair_gaps', (select coalesce(jsonb_agg(pair_gaps order by avg_gap desc), '[]'::jsonb) from pair_gaps),
    'sessions_distribution', (select coalesce(jsonb_agg(sessions_distribution), '[]'::jsonb) from sessions_distribution),
    'continuation_distribution', (select coalesce(jsonb_agg(continuation_distribution), '[]'::jsonb) from continuation_distribution),
    'total_responses', (select count(*) from scoped_responses)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.build_review_report_metrics(text) to authenticated, service_role;
