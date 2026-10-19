-- ============================================================================
-- Même cause que la migration précédente (20261019150000) : les vues
-- review_global_stats, review_pair_comparison et review_by_participant
-- tournent en security_invoker et dépendent de review_responses, dont le
-- GRANT SELECT avait été révoqué pour authenticated. La RLS
-- review_responses_admin_select (is_review_admin()) reste la seule
-- protection réelle d'accès.
-- ============================================================================

grant select on public.review_responses to authenticated;
