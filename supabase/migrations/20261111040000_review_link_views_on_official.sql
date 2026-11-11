-- ============================================================================
-- Phase 2 (4/6) — Vues des LIENS du sondage, rebranchées sur la source
-- filtrée : review_links_admin, review_campaign_participants.
--
-- Mêmes noms, mêmes colonnes, même ordre : l'onglet « Sondage & liens » et
-- l'envoi des emails (api/send-email.js) continuent de fonctionner.
-- Définitions d'avant : supabase/rollback/20261111_phase2_rollback.sql
-- ============================================================================

-- 1. Tous les liens (avant : aucun filtre, les 3 liens du binôme test y figuraient).
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
join public.official_binomes b on b.id = rt.binome_id
left join public.mentor m1 on m1.email = rt.participant_email and rt.role = 'mentor'
left join public.mentore m2 on m2.email = rt.participant_email and rt.role = 'mentore'
order by rt.created_at desc;

-- 2. Un participant par (email, rôle) — priorité au lien répondu, sinon au
--    plus récent (avant : le filtre is_test était recopié ici).
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
join public.official_binomes b on b.id = rt.binome_id
left join public.review_responses rr on rr.token_id = rt.id
where b.status = 'active'
order by rt.participant_email, rt.role, (rr.id is not null) desc, rt.created_at desc;
