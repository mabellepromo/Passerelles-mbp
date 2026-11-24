-- ============================================================================
-- M2b — Fermeture des lectures publiques
--
-- À APPLIQUER SEULEMENT APRÈS la mise en production du code qui utilise
-- get_public_program_stats() et get_cohort1_directory() (M2a). Avant, la
-- page d'accueil et la page « Cohorte 1 » perdraient leurs données.
--
-- Supprime 5 politiques (aucune table, colonne ou donnée supprimée) :
--   binomes_public_read     : binômes actifs + emails, lisibles par tous
--   mentors_public_read     : dossier complet des mentors appariés
--   mentores_public_read    : dossier complet des mentorés appariés
--   "public stats read"     : toutes les fiches de séance (condition true)
--   fichiers_public_read    : fichiers joints aux binômes (condition true)
-- Les accès légitimes restent couverts par les politiques existantes :
-- admin (is_admin_user) et membres du binôme (leur propre email).
-- ============================================================================

drop policy if exists binomes_public_read on public.binome;
drop policy if exists mentors_public_read on public.mentor;
drop policy if exists mentores_public_read on public.mentore;
drop policy if exists "public stats read" on public.suivi_mensuel;
drop policy if exists fichiers_public_read on public.binome_fichier;

-- Fichiers d'un binôme : admin ou membres de ce binôme.
create policy binome_fichier_pair_read on public.binome_fichier
  for select
  using (
    public.is_admin_user()
    or exists (
      select 1 from public.binome b
      where b.id = binome_fichier.binome_id
        and coalesce(auth.jwt() ->> 'email', '') in (b.mentor_email, b.mentore_email)
    )
  );
