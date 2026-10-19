-- ============================================================================
-- La vue review_links_admin a `security_invoker = on` : elle s'exécute avec
-- les droits de l'utilisateur appelant, pas du propriétaire de la vue.
-- Comme la migration précédente avait fait
-- `revoke all on public.review_tokens from anon, authenticated`, le rôle
-- authenticated n'avait plus le droit SELECT sur la table sous-jacente, donc
-- la vue renvoyait "permission denied" (silencieusement avalé côté front en
-- liste vide). La RLS is_review_admin() reste la seule protection réelle.
-- ============================================================================

grant select on public.review_tokens to authenticated;
