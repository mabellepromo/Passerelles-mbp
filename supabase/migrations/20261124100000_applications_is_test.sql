-- ============================================================================
-- Candidatures de test : colonne is_test sur mentor et mentore
--
-- Même principe que binome.is_test : une candidature créée pour tester la
-- plateforme ne doit compter dans aucun chiffre du rapport de bilan.
-- Ajout pur : aucune ligne, table ou colonne supprimée.
--
-- La candidature mentor dont l'identifiant commence par
-- 00000000-0000-0000-0000-000000000001 (rattachée à aucun binôme) est la
-- candidature de test signalée par la coordination le 24/11/2026 : le nombre
-- de candidatures de mentors passe de 12 à 11.
-- ============================================================================

alter table public.mentor  add column if not exists is_test boolean not null default false;
alter table public.mentore add column if not exists is_test boolean not null default false;

-- L'identifiant en base se termine par un retour à la ligne : on compare
-- donc sur le début de la chaîne.
update public.mentor
   set is_test = true
 where id like '00000000-0000-0000-0000-000000000001%';
