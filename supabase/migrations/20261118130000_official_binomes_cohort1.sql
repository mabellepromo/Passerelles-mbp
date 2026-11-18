-- ============================================================================
-- M3 — Isolation de la cohorte 1
--
-- official_binomes est la source de tous les écrans de la cohorte 1
-- (Alertes, Déclenchement, Données & Bilan, Export CSV, rapport de bilan).
-- Elle ne filtrait pas la cohorte : les binômes de la cohorte 2 y seraient
-- apparus et le contrôle « 11 binômes » du rapport aurait bloqué.
--
-- Aujourd'hui tous les binômes sont de la cohorte 1 : cette migration ne
-- change aucun chiffre. L'espace « Cohorte 2 » lira ses binômes par ses
-- propres fonctions (cohorte = '2', is_test = false).
--
-- PIÈGE POSTGRES (voir 20261111045000) : « create or replace view » remet
-- security_invoker à off. On le rétablit juste après.
-- ============================================================================

create or replace view public.official_binomes as
select b.*
from public.binome b
where b.is_test = false
  and b.cohorte = '1';

alter view public.official_binomes set (security_invoker = on);

revoke all on public.official_binomes from anon;
grant select on public.official_binomes to authenticated, service_role;
