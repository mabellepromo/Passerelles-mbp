-- ============================================================================
-- ROLLBACK DE LA PHASE 2 (couche de données unifiée)
--
-- Ce fichier N'EST PAS une migration : il n'est jamais exécuté tout seul.
-- Il contient les définitions des six vues telles qu'elles étaient en
-- production le 11 novembre 2026, AVANT la Phase 2 (relevées avec
-- pg_get_viewdef). Pour revenir en arrière, copier le bloc voulu dans le
-- SQL Editor de Supabase et l'exécuter.
--
-- Les six vues gardent exactement les mêmes colonnes avant et après la
-- Phase 2 : un simple "create or replace view" suffit donc pour revenir.
--
-- Fonction build_review_report_metrics : sa version d'avant la Phase 2 est
-- le fichier supabase/migrations/20261107000000_review_report_contributions.sql
-- (le ré-exécuter tel quel la restaure).
-- ============================================================================

-- 1. review_by_participant (avant : aucun filtre is_test) ---------------------
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
join public.binome b on b.id = rr.binome_id;

-- 2. review_pair_comparison (avant : filtre is_test recopié dans la vue) ------
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
from public.binome b
left join public.review_responses mentor_r on mentor_r.binome_id = b.id and mentor_r.role = 'mentor'
left join public.review_responses mentore_r on mentore_r.binome_id = b.id and mentore_r.role = 'mentore'
where b.status = 'active' and b.is_test = false;

-- 3. review_global_stats (avant : aucun filtre is_test) -----------------------
create or replace view public.review_global_stats as
select
  rt.role,
  count(rt.id) as total_tokens,
  count(rr.id) as total_responses,
  round(count(rr.id)::numeric / nullif(count(rt.id), 0) * 100, 1) as response_rate_pct,
  round(avg(rr.nps_score), 1) as avg_nps,
  round(
    (
      (count(*) filter (where rr.nps_score >= 9))::numeric
      - (count(*) filter (where rr.nps_score <= 6))::numeric
    ) / nullif(count(rr.nps_score), 0) * 100,
    1
  ) as nps_score_pct
from public.review_tokens rt
left join public.review_responses rr on rr.token_id = rt.id
group by rt.role;

-- 4. review_links_admin (avant : aucun filtre is_test) ------------------------
create or replace view public.review_links_admin as
select
  rt.id as token_id,
  rt.token,
  rt.role,
  rt.participant_email,
  case when rt.role = 'mentor' then m1.full_name else m2.full_name end as participant_name,
  coalesce(m1.phone, m2.phone) as participant_phone,
  rt.binome_id,
  b.mentor_name,
  b.mentore_name,
  b.cohorte,
  rt.used_at,
  rt.draft_saved_at,
  rt.expires_at,
  rt.created_at
from public.review_tokens rt
join public.binome b on b.id = rt.binome_id
left join public.mentor m1 on m1.email = rt.participant_email and rt.role = 'mentor'
left join public.mentore m2 on m2.email = rt.participant_email and rt.role = 'mentore'
order by rt.created_at desc;

-- 5. review_campaign_participants (avant : filtre is_test recopié) ------------
create or replace view public.review_campaign_participants as
select distinct on (rt.participant_email, rt.role)
  rt.id as token_id,
  rt.token,
  rt.participant_email,
  rt.role,
  rt.binome_id,
  case when rt.role = 'mentor' then b.mentor_name else b.mentore_name end as participant_name,
  rt.reminders_optout,
  rt.draft_saved_at,
  (rr.id is not null) as has_responded,
  rr.submitted_at as responded_at,
  (select count(*) from public.review_email_log l
   where l.token_id = rt.id and l.email_type in ('reminder', 'final_reminder') and l.status = 'sent') as reminders_sent,
  (select max(l.sent_at) from public.review_email_log l where l.token_id = rt.id) as last_email_at,
  (select l.email_type from public.review_email_log l where l.token_id = rt.id order by l.sent_at desc limit 1) as last_email_type
from public.review_tokens rt
join public.binome b on b.id = rt.binome_id
left join public.review_responses rr on rr.token_id = rt.id
where b.status = 'active' and b.is_test = false
order by rt.participant_email, rt.role, (rr.id is not null) desc, rt.created_at desc;

-- 6. review_pair_vigilance : NON modifiée par la Phase 2 (elle lit
--    review_pair_comparison). Définition conservée ici pour mémoire.
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

-- ----------------------------------------------------------------------------
-- OBLIGATOIRE après avoir exécuté un ou plusieurs blocs ci-dessus :
-- "create or replace view" remet à zéro les options de la vue. Sans ces
-- lignes, les vues ne respectent plus la RLS (données du sondage exposées).
-- ----------------------------------------------------------------------------
alter view public.review_by_participant set (security_invoker = on);
alter view public.review_pair_comparison set (security_invoker = on);
alter view public.review_global_stats set (security_invoker = on);
alter view public.review_links_admin set (security_invoker = on);
alter view public.review_campaign_participants set (security_invoker = on);
alter view public.review_pair_vigilance set (security_invoker = on);

-- ----------------------------------------------------------------------------
-- 7. Nouvelles vues créées par la Phase 2. À supprimer SEULEMENT après avoir
--    restauré les six vues ci-dessus et la fonction (elles en dépendent), et
--    après avoir remis le front sur les tables brutes. Lignes laissées en
--    commentaire volontairement.
-- ----------------------------------------------------------------------------
-- drop view if exists public.official_fiche_satisfaction;
-- drop view if exists public.official_survey_summary;
-- drop view if exists public.official_binome_overview;
-- drop view if exists public.official_review_email_log;
-- drop view if exists public.official_review_tokens;
-- drop view if exists public.official_review_responses;
-- drop view if exists public.official_bilans_finaux;
-- drop view if exists public.official_messages;
-- drop view if exists public.official_journal;
-- drop view if exists public.official_suivis;
-- drop view if exists public.official_binomes;
