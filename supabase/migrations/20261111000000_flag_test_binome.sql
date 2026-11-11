-- ============================================================================
-- Étape 0 — Marque le binôme de test John DOE / Jane DOE-G comme test.
-- Sa colonne is_test valait false : il passait donc à travers tous les
-- filtres "is_test = false" (vues du sondage, listes admin, rapport).
-- Aucune donnée n'est supprimée : le binôme et ses données restent en base.
-- ============================================================================

update public.binome
set is_test = true
where id = '69cc72777bca1841344bf688'
  and is_test = false;
