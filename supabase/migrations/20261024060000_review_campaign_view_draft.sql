-- Ajoute le statut "brouillon en cours" à la vue de suivi des participants,
-- nécessaire pour fusionner l'ancien outil "Liens bilan" dans l'onglet
-- "Campagne sondage" (un seul endroit pour gérer les liens + les envois).

drop view if exists public.review_campaign_participants;

create or replace view public.review_campaign_participants as
select
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
where b.status = 'active' and b.is_test = false;

alter view public.review_campaign_participants set (security_invoker = on);
grant select on public.review_campaign_participants to authenticated;
