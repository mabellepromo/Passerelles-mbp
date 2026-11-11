-- ============================================================================
-- Phase 2 (1/6) — Vue socle : official_binomes
--
-- C'est LA source unique de la règle d'exclusion : elle seule contient le
-- filtre "is_test = false". Toutes les autres vues (official_*, review_*)
-- partent d'elle et ne recopient jamais ce filtre.
--
-- security_invoker = on : la vue respecte la RLS de la table binome pour
-- l'utilisateur connecté (un admin voit tout, un participant son binôme).
-- Note : "b.*" est figé à la création ; si une colonne est ajoutée plus tard
-- à binome, il faudra recréer la vue pour qu'elle apparaisse ici.
-- ============================================================================

create or replace view public.official_binomes as
select b.*
from public.binome b
where b.is_test = false;

alter view public.official_binomes set (security_invoker = on);

revoke all on public.official_binomes from anon;
grant select on public.official_binomes to authenticated, service_role;
