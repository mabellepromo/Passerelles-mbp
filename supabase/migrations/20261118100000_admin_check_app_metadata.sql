-- ============================================================================
-- M1 — Sécurité : qui est administrateur ?
--
-- AVANT : is_admin_user() acceptait aussi user_metadata.role = 'admin'.
--         user_metadata est MODIFIABLE PAR L'UTILISATEUR LUI-MÊME
--         (supabase.auth.updateUser({ data: { role: 'admin' } })) : n'importe
--         quel participant connecté pouvait donc se donner les droits d'admin
--         sur les binômes, mentors, mentorés, messages et fiches.
--
-- APRÈS : seuls comptent
--   - la liste des emails administrateurs (identique à l'ancienne) ;
--   - app_metadata.role = 'admin', que seul le serveur peut écrire.
--
-- Compatible avec le code en production : la fonction garde le même nom et
-- la même signature ; aucune table n'est modifiée.
-- ============================================================================

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
           'mabellepromo@gmail.com',
           'contact@mabellepromo.org',
           'senayhola@gmail.com'
         )
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;
