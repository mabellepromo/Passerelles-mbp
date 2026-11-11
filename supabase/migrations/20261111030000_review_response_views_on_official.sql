-- ============================================================================
-- Phase 2 (3/6) — Vues des RÉPONSES au sondage, rebranchées sur la source
-- filtrée : review_by_participant, review_pair_comparison, review_global_stats.
--
-- Mêmes noms de vues, mêmes colonnes, même ordre : les écrans existants
-- (onglets « Bilan » et « Rapport de bilan ») continuent de fonctionner.
-- review_pair_vigilance n'est pas touchée : elle lit review_pair_comparison.
-- Définitions d'avant : supabase/rollback/20261111_phase2_rollback.sql
-- ============================================================================

-- 1. Une ligne par réponse (avant : aucun filtre, le binôme test y figurait).
create or replace view public.review_by_participant as
select
  rr.id,
  rr.participant_email,
  rr.role,
  case when rr.role = 'mentor' then b.mentor_name else b.mentore_name end as participant_name,
  rr.binome_id,
  b.mentor_name,
  b.mentore_name,
  b.cohorte,
  rr.nps_score,
  rr.quote_consent,
  rr.answers,
  rr.submitted_at
from public.review_responses rr
join public.official_binomes b on b.id = rr.binome_id;

-- 2. Une ligne par binôme, réponses mentor et mentoré côte à côte
--    (avant : le filtre is_test était recopié ici ; il vient maintenant du socle).
create or replace view public.review_pair_comparison as
select
  b.id as binome_id,
  b.mentor_name,
  b.mentore_name,
  b.cohorte,
  mentor_r.nps_score as mentor_nps,
  mentore_r.nps_score as mentore_nps,
  mentor_r.answers as mentor_answers,
  mentore_r.answers as mentore_answers,
  mentor_r.submitted_at as mentor_submitted_at,
  mentore_r.submitted_at as mentore_submitted_at
from public.official_binomes b
left join public.review_responses mentor_r on mentor_r.binome_id = b.id and mentor_r.role = 'mentor'
left join public.review_responses mentore_r on mentore_r.binome_id = b.id and mentore_r.role = 'mentore'
where b.status = 'active';

-- 3. Statistiques par rôle.
--    DÉFINITION UNIQUE du taux de réponse (reprise partout ailleurs) :
--      répondants / personnes invitées, par rôle.
--      Une personne invitée = un couple (binôme, rôle) qui a reçu au moins un
--      lien. Si un lien est régénéré pour la même personne, elle n'est comptée
--      qu'une fois (avant, chaque lien comptait : le taux baissait à tort).
--    total_tokens garde son nom pour ne pas casser les écrans, mais il compte
--    désormais des PERSONNES invitées, pas des liens.
create or replace view public.review_global_stats as
with invited as (
  select distinct rt.binome_id, rt.role
  from public.official_review_tokens rt
),
answered as (
  select rr.binome_id, rr.role, rr.id, rr.nps_score
  from public.official_review_responses rr
)
select
  i.role,
  count(*) as total_tokens,
  count(a.id) as total_responses,
  round(count(a.id)::numeric / nullif(count(*), 0) * 100, 1) as response_rate_pct,
  round(avg(a.nps_score), 1) as avg_nps,
  round(
    (
      (count(*) filter (where a.nps_score >= 9))::numeric
      - (count(*) filter (where a.nps_score <= 6))::numeric
    ) / nullif(count(a.nps_score), 0) * 100,
    1
  ) as nps_score_pct
from invited i
left join answered a on a.binome_id = i.binome_id and a.role = i.role
group by i.role;
