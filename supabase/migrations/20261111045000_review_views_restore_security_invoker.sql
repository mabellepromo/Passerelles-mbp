-- ============================================================================
-- Phase 2 (correctif des étapes 3/6 et 4/6) — Rétablit security_invoker.
--
-- PIÈGE POSTGRES : "create or replace view" REMET À ZÉRO les options de la
-- vue. Les cinq vues réécrites avaient donc perdu security_invoker = on :
-- elles s'exécutaient avec les droits de leur propriétaire, sans appliquer la
-- RLS des tables (les réponses au sondage n'étaient plus réservées aux
-- admins). Corrigé quelques minutes après, par cette migration.
--
-- RÈGLE À RETENIR : après tout "create or replace view" sur une vue review_*
-- ou official_*, toujours remettre la ligne "alter view ... set
-- (security_invoker = on)".
-- ============================================================================

alter view public.review_by_participant set (security_invoker = on);
alter view public.review_pair_comparison set (security_invoker = on);
alter view public.review_global_stats set (security_invoker = on);
alter view public.review_links_admin set (security_invoker = on);
alter view public.review_campaign_participants set (security_invoker = on);
