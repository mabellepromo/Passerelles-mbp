-- ============================================================================
-- Fiches d'expertise par binôme (clôture de la cohorte 1, 25/11/2026)
--
-- Une ligne par binôme officiel : sentence (réussite / réussite partielle /
-- échec), niveau de confiance, constat, preuves et remarques. Plus une ligne
-- de synthèse transversale par cohorte.
--
-- Table à part, et non dans review_reports.ai_analysis : la régénération du
-- bilan réécrit ai_analysis, les sentences doivent lui survivre.
--
-- preuves : [{ "role": "mentor"|"mentore", "question": "<id de question>",
--              "citation": "<extrait exact de la réponse>", "sensible": bool }]
--   L'onglet vérifie en direct que chaque citation figure bien dans
--   review_responses.answers ->> question.
-- remarques : [{ "type": "divergence"|"limite"|"signal", "texte": "..." }]
--
-- Données nominatives : lecture et écriture réservées à l'admin du bilan
-- (is_review_admin()), comme review_responses et review_reports.
-- Aucune donnée sur le nombre ni la régularité des séances.
-- ============================================================================

create table if not exists public.binome_expertise (
  binome_id   text primary key,
  cohorte     text not null default '1',
  sentence    text not null check (sentence in ('reussite', 'reussite_partielle', 'echec')),
  confiance   text not null check (confiance in ('elevee', 'moyenne', 'faible')),
  constat     text not null,
  motif       text not null,
  preuves     jsonb not null default '[]'::jsonb,
  remarques   jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.binome_expertise_synthese (
  cohorte     text primary key,
  points      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.binome_expertise enable row level security;
alter table public.binome_expertise_synthese enable row level security;

revoke all on public.binome_expertise, public.binome_expertise_synthese from anon;
grant select, insert, update on public.binome_expertise, public.binome_expertise_synthese to authenticated;

create policy binome_expertise_admin_select on public.binome_expertise
  for select to authenticated using (is_review_admin());
create policy binome_expertise_admin_insert on public.binome_expertise
  for insert to authenticated with check (is_review_admin());
create policy binome_expertise_admin_update on public.binome_expertise
  for update to authenticated using (is_review_admin()) with check (is_review_admin());

create policy binome_expertise_synthese_admin_select on public.binome_expertise_synthese
  for select to authenticated using (is_review_admin());
create policy binome_expertise_synthese_admin_insert on public.binome_expertise_synthese
  for insert to authenticated with check (is_review_admin());
create policy binome_expertise_synthese_admin_update on public.binome_expertise_synthese
  for update to authenticated using (is_review_admin()) with check (is_review_admin());
