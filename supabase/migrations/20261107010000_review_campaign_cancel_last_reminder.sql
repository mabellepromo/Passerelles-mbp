-- ============================================================================
-- Annule le dernier rappel programme (8 nov 2026) du sondage bilan en cours :
-- retire cette date de reminder_schedule pour que le cron de relance
-- (get_review_reminder_candidates) ne l'envoie jamais. Les rappels deja
-- envoyes (31 oct, 4 nov) restent inchanges dans l'historique.
-- ============================================================================

update public.review_campaigns
set reminder_schedule = '["2026-10-31", "2026-11-04"]'::jsonb
where status in ('draft', 'active')
  and name = 'Sondage bilan — novembre 2026';
