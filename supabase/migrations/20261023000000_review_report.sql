-- ============================================================================
-- Rapport de bilan PASSERELLES : agrégats SQL + stockage des rapports générés
-- Les chiffres sont toujours calculés ici, jamais par l'IA (voir Edge/API
-- generate-review-report) : l'IA ne fait que lire ces agrégats et les
-- réponses ouvertes pseudonymisées pour produire une interprétation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table review_reports
-- ----------------------------------------------------------------------------

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id) on delete set null,
  period_label text not null,
  metrics jsonb not null,
  ai_analysis jsonb,
  status text not null default 'draft' check (status in ('draft', 'validated')),
  validated_at timestamptz,
  validated_by uuid references auth.users(id) on delete set null
);

create index if not exists review_reports_period_label_idx on public.review_reports (period_label);
create index if not exists review_reports_status_idx on public.review_reports (status);
create index if not exists review_reports_generated_at_idx on public.review_reports (generated_at desc);

alter table public.review_reports enable row level security;
revoke all on public.review_reports from anon, authenticated;

-- is_review_admin() est déjà défini par 20261019120000_review_system.sql

create policy review_reports_admin_select on public.review_reports
  for select to authenticated
  using (public.is_review_admin());

create policy review_reports_admin_insert on public.review_reports
  for insert to authenticated
  with check (public.is_review_admin());

create policy review_reports_admin_update on public.review_reports
  for update to authenticated
  using (public.is_review_admin())
  with check (public.is_review_admin());

grant select, insert, update on public.review_reports to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Fonction d'agrégation : toutes les métriques pour une période donnée
--    p_cohorte = null => toutes les cohortes confondues
--    Accessible aux admins authentifiés ET au rôle service_role (appelé par
--    la fonction serveur generate-review-report, qui a déjà vérifié
--    elle-même que l'appelant est admin).
-- ----------------------------------------------------------------------------

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
  -- Toutes les questions de type "likert" sont stockées en entier (1-5) dans
  -- answers ; les questions select/multi-select/text sont des chaînes. Le
  -- filtre jsonb_typeof = 'number' isole donc automatiquement les likert
  -- sans avoir à dupliquer la liste des ids ici.
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
  -- Écart mentor/mentoré par binôme, pour chaque question likert commune
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
  )
  select jsonb_build_object(
    'cohorte', p_cohorte,
    'computed_at', now(),
    'response_rate', (select coalesce(jsonb_agg(response_rate), '[]'::jsonb) from response_rate),
    'nps', (select coalesce(jsonb_agg(nps_stats), '[]'::jsonb) from nps_stats),
    'likert_by_question', (select coalesce(jsonb_agg(likert_stats), '[]'::jsonb) from likert_stats),
    'pair_gaps', (select coalesce(jsonb_agg(pair_gaps order by avg_gap desc), '[]'::jsonb) from pair_gaps),
    'sessions_distribution', (select coalesce(jsonb_agg(sessions_distribution), '[]'::jsonb) from sessions_distribution),
    'total_responses', (select count(*) from scoped_responses)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.build_review_report_metrics(text) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Vue des binômes à vigilance (vert / orange / rouge), réutilisable par
--    la page rapport sans redupliquer la logique côté front.
-- ----------------------------------------------------------------------------

create or replace view public.review_pair_vigilance as
select
  pc.binome_id,
  pc.cohorte,
  pc.mentor_name,
  pc.mentore_name,
  pc.mentor_nps,
  pc.mentore_nps,
  case
    when pc.mentor_nps is null and pc.mentore_nps is null then 'en_attente'
    when (pc.mentor_nps is not null and pc.mentor_nps <= 6)
      or (pc.mentore_nps is not null and pc.mentore_nps <= 6)
      or (pc.mentor_nps is not null and pc.mentore_nps is not null and abs(pc.mentor_nps - pc.mentore_nps) >= 4)
      then 'rouge'
    when (pc.mentor_nps is not null and pc.mentor_nps between 7 and 8)
      or (pc.mentore_nps is not null and pc.mentore_nps between 7 and 8)
      then 'orange'
    else 'vert'
  end as vigilance
from public.review_pair_comparison pc;

alter view public.review_pair_vigilance set (security_invoker = on);
grant select on public.review_pair_vigilance to authenticated;

-- ----------------------------------------------------------------------------
-- 4. (Optionnel) Planification hebdomadaire pendant une période de collecte.
--    Désactivé par défaut : le déclenchement est manuel (bouton admin).
--    Pour activer une régénération automatique sur une cohorte en cours,
--    décommenter et adapter après avoir activé l'extension pg_cron :
--
-- select cron.schedule(
--   'weekly-review-report',
--   '0 6 * * 1', -- tous les lundis à 6h
--   $$ select public.build_review_report_metrics('COHORTE_EN_COURS'); $$
-- );
--
-- NB : pg_cron ne peut pas appeler l'API Anthropic (pas de réseau sortant
-- HTTP natif sans l'extension pg_net) ; une régénération automatique
-- complète doit déclencher la fonction serveur generate-review-report via
-- un webhook/cron Vercel plutôt que directement depuis Postgres.
