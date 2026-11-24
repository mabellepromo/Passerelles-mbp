-- ============================================================================
-- Lecture réservée à l'admin (et à chacun pour ses propres données)
-- Complète 20261118120000_drop_public_read_policies.sql (lectures publiques).
--
-- 1. Candidatures : tout utilisateur CONNECTÉ pouvait lire l'ensemble des
--    dossiers de mentors et de mentorés (condition auth.role() = 'authenticated').
--    Restent : admin (is_admin_user / mentor_admin, mentore_admin) et la
--    personne elle-même (mentor_self, mentore_self, *_select).
-- 2. Fiches PDF des binômes (bucket fiches-binomes) : bucket public, noms de
--    fichiers prévisibles. Le bucket devient privé, lisible par l'admin seul.
--    Le code admin télécharge désormais les fiches par l'API de stockage
--    authentifiée (DeclenchementBinomes.jsx).
-- Aucune donnée, table ou colonne supprimée.
-- ============================================================================

drop policy if exists mentor_select_for_authenticated on public.mentor;
drop policy if exists mentore_select_for_authenticated on public.mentore;

update storage.buckets set public = false where id = 'fiches-binomes';

drop policy if exists fiches_binomes_admin_read on storage.objects;
create policy fiches_binomes_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'fiches-binomes' and public.is_admin_user());
