-- ============================================================================
-- Phase 2 (6/6) — Vues d'indicateurs : UNE SEULE définition par indicateur.
-- Nouvelles vues, construites uniquement sur les vues official_* et review_*
-- (donc sur les binômes officiels). Aucun écran existant n'est modifié.
--
-- Période couverte : toute la cohorte, du lancement (5 mai 2026) à aujourd'hui.
--
-- IMPORTANT — nombre de séances : AUCUNE source n'est retenue pour l'instant
-- (décision du 11/11/2026). official_binome_overview expose donc les trois
-- chiffres bruts côte à côte, sans en tirer d'indicateur.
-- ============================================================================

-- 1. Synthèse du sondage (une seule ligne) ------------------------------------
--   binomes_count            : nombre de binômes officiels (attendu : 11)
--   mentors_invited / mentores_invited : personnes ayant reçu un lien
--   mentor_responses / mentore_responses / responses_total : réponses reçues
--   pairs_with_both_responses : binômes dont le mentor ET le mentoré ont répondu
--   nps_promoters (notes 9-10), nps_passives (7-8), nps_detractors (0-6)
--   nps_score = % promoteurs - % détracteurs, arrondi à l'entier
create or replace view public.official_survey_summary as
select
  (select count(*) from public.official_binomes) as binomes_count,
  (select count(distinct binome_id) from public.official_review_tokens where role = 'mentor') as mentors_invited,
  (select count(distinct binome_id) from public.official_review_tokens where role = 'mentore') as mentores_invited,
  count(*) filter (where rr.role = 'mentor') as mentor_responses,
  count(*) filter (where rr.role = 'mentore') as mentore_responses,
  count(*) as responses_total,
  (select count(*) from (
     select binome_id from public.official_review_responses
     group by binome_id having count(distinct role) = 2
   ) both_roles) as pairs_with_both_responses,
  count(*) filter (where rr.nps_score >= 9) as nps_promoters,
  count(*) filter (where rr.nps_score between 7 and 8) as nps_passives,
  count(*) filter (where rr.nps_score <= 6) as nps_detractors,
  count(rr.nps_score) as nps_answers,
  round(
    (count(*) filter (where rr.nps_score >= 9) - count(*) filter (where rr.nps_score <= 6))::numeric
    / nullif(count(rr.nps_score), 0) * 100
  ) as nps_score
from public.official_review_responses rr;

-- 2. Satisfaction déclarée dans les fiches (une seule ligne) ------------------
--   Note retenue = note de l'AUTEUR de la fiche (colonne author_satisfaction
--   de official_suivis). Les fiches sans auteur clair sont exclues et comptées
--   dans fiches_excluded. Échelle de 1 à 5.
--   Cette note reflète surtout le point de vue des mentorés (auteurs de la
--   grande majorité des fiches) ; la satisfaction des mentors vient du sondage.
create or replace view public.official_fiche_satisfaction as
select
  count(*) as fiches_count,
  count(*) filter (where not s.author_satisfaction_excluded) as fiches_rated,
  count(*) filter (where s.author_satisfaction_excluded) as fiches_excluded,
  count(*) filter (where s.submitted_by = 'mentore') as fiches_by_mentore,
  count(*) filter (where s.submitted_by = 'mentor') as fiches_by_mentor,
  round(avg(s.author_satisfaction), 2) as avg_author_satisfaction
from public.official_suivis s;

-- 3. Fiche par binôme (une ligne par binôme officiel) -------------------------
--   Séances : trois chiffres BRUTS côte à côte, aucune règle appliquée.
--     fiches_count               : fiches suivi_mensuel enregistrées
--     counter_total_meetings     : compteur binome.total_meetings (peu fiable)
--     sessions_declared_mentor / _mentore : tranche déclarée dans le sondage
--   Sondage : mentor_responded, mentore_responded, mentor_nps, mentore_nps
--   vigilance : règle unique de review_pair_vigilance (vert/orange/rouge/en_attente)
--   Objectifs : entrées du journal de bord de type 'objectif'
create or replace view public.official_binome_overview as
select
  b.id as binome_id,
  b.cohorte,
  b.mentor_name,
  b.mentore_name,
  b.match_date,
  b.status,
  (select count(*) from public.official_suivis s where s.binome_id = b.id) as fiches_count,
  (select max(s.meeting_date) from public.official_suivis s where s.binome_id = b.id) as last_fiche_date,
  b.total_meetings as counter_total_meetings,
  v.mentor_answers ->> 'sessions_count' as sessions_declared_mentor,
  v.mentore_answers ->> 'sessions_count' as sessions_declared_mentore,
  (v.mentor_submitted_at is not null) as mentor_responded,
  (v.mentore_submitted_at is not null) as mentore_responded,
  v.mentor_nps,
  v.mentore_nps,
  vig.vigilance,
  (select count(*) from public.official_journal j
   where j.binome_id = b.id and j.type = 'objectif') as objectives_count,
  (select count(*) from public.official_journal j
   where j.binome_id = b.id and j.type = 'objectif' and j.objectif_statut = 'atteint') as objectives_reached_count,
  (select count(*) from public.official_messages m where m.binome_id = b.id) as messages_count
from public.official_binomes b
left join public.review_pair_comparison v on v.binome_id = b.id
left join public.review_pair_vigilance vig on vig.binome_id = b.id;

alter view public.official_survey_summary set (security_invoker = on);
alter view public.official_fiche_satisfaction set (security_invoker = on);
alter view public.official_binome_overview set (security_invoker = on);

revoke all on
  public.official_survey_summary, public.official_fiche_satisfaction, public.official_binome_overview
from anon;

grant select on
  public.official_survey_summary, public.official_fiche_satisfaction, public.official_binome_overview
to authenticated, service_role;
