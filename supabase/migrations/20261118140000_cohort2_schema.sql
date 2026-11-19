-- ============================================================================
-- M4 — Cohorte 2 : schéma du suivi par check-in mensuel
--
-- Ajouts seulement (aucune table, colonne ni donnée existante modifiée) :
--   binome.checkin_enabled       : binôme ouvert au check-in (pilote)
--   cohort_objectives            : objectifs SMART, une ligne par objectif
--   checkin_links                : un lien personnel par participant
--   checkins                     : un check-in par binôme, rôle et mois
--   checkin_revisions            : versions remplacées d'un check-in
--   objective_progress           : historique d'avancement (jamais modifié)
--   coordination_log             : journal des actions du coordinateur
--   app_config                   : interrupteur et messages types
--
-- Sécurité :
--   - RLS activé partout ; l'admin peut LIRE (is_admin_user) ;
--   - personne n'écrit directement dans ces tables : toutes les écritures
--     passent par des fonctions security definer (M5 participant, M6 admin) ;
--   - aucun droit pour les visiteurs non connectés (anon).
--
-- Compatible avec le code en production : la nouvelle colonne de binome a
-- une valeur par défaut, et official_binomes (b.*) garde ses colonnes.
-- ============================================================================

-- 1. Activation du pilote, binôme par binôme ---------------------------------
alter table public.binome
  add column if not exists checkin_enabled boolean not null default false;

-- 2. Objectifs SMART ---------------------------------------------------------
create table public.cohort_objectives (
  id uuid primary key default gen_random_uuid(),
  binome_id text not null references public.binome(id),
  title text not null check (length(trim(title)) > 0),
  success_criteria text,
  due_date date,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'achieved', 'adjusted', 'abandoned')),
  replaces_objective_id uuid references public.cohort_objectives(id),
  -- Raison obligatoire dès que l'objectif n'est plus « en cours ».
  status_reason text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohort_objectives_reason_required
    check (status = 'in_progress' or length(trim(coalesce(status_reason, ''))) > 0)
);
create index cohort_objectives_binome_idx on public.cohort_objectives (binome_id);

-- Au plus 3 objectifs « en cours » par binôme (vérifié par la base, pas
-- seulement par l'écran).
create or replace function public.check_max_active_objectives()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'in_progress' and (
    select count(*) from public.cohort_objectives
    where binome_id = new.binome_id and status = 'in_progress' and id <> new.id
  ) >= 3 then
    raise exception 'max_active_objectives' using errcode = 'P0101',
      hint = 'Un binôme a au plus 3 objectifs en cours.';
  end if;
  return new;
end;
$$;

create trigger cohort_objectives_max_active
  before insert or update of status on public.cohort_objectives
  for each row execute function public.check_max_active_objectives();

-- 3. Liens personnels --------------------------------------------------------
create table public.checkin_links (
  id uuid primary key default gen_random_uuid(),
  binome_id text not null references public.binome(id),
  role text not null check (role in ('mentor', 'mentore')),
  participant_email text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  replaced_by uuid references public.checkin_links(id)
);
-- Un seul lien actif par binôme et par rôle.
create unique index checkin_links_one_active
  on public.checkin_links (binome_id, role) where revoked_at is null;

-- 4. Check-ins mensuels ------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  binome_id text not null references public.binome(id),
  role text not null check (role in ('mentor', 'mentore')),
  link_id uuid references public.checkin_links(id),
  period text not null check (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  had_exchange boolean not null,
  exchange_count integer check (exchange_count between 0 and 100),
  exchange_channel text[] not null default '{}'
    check (exchange_channel <@ array['call', 'video', 'whatsapp', 'in_person']),
  approx_duration_minutes integer check (approx_duration_minutes between 0 and 1440),
  mood text check (mood in ('good', 'neutral', 'bad')),
  blocker_text text check (length(blocker_text) <= 2000),
  entered_by text not null check (entered_by in ('participant', 'coordinator')),
  -- Email de l'admin quand la saisie est faite par le coordinateur.
  entered_by_email text,
  submitted_at timestamptz not null default now(),
  constraint checkins_one_per_month unique (binome_id, role, period)
);

-- Version précédente d'un check-in remplacé (saisie refaite avant la clôture).
create table public.checkin_revisions (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id),
  previous jsonb not null,
  replaced_at timestamptz not null default now()
);

-- 5. Historique d'avancement des objectifs -----------------------------------
create table public.objective_progress (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.cohort_objectives(id),
  checkin_id uuid references public.checkins(id),
  progress_pct integer not null check (progress_pct between 0 and 100),
  declared_by text not null check (declared_by in ('mentor', 'mentore', 'coordinator')),
  comment text,
  created_at timestamptz not null default now()
);
create index objective_progress_objective_idx on public.objective_progress (objective_id, created_at);

-- 6. Journal de coordination -------------------------------------------------
create table public.coordination_log (
  id uuid primary key default gen_random_uuid(),
  binome_id text not null references public.binome(id),
  event_date date not null default current_date,
  event_type text not null
    check (event_type in ('reminder', 'mediation', 'blocker_resolved', 'objective_change', 'call', 'other')),
  summary text not null check (length(trim(summary)) between 1 and 500),
  created_by text not null,
  created_at timestamptz not null default now()
);
create index coordination_log_binome_idx on public.coordination_log (binome_id, event_date);

-- 7. Historiques jamais modifiés ni supprimés --------------------------------
create or replace function public.prevent_history_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'history_is_append_only' using errcode = 'P0102';
end;
$$;

create trigger objective_progress_append_only
  before update or delete on public.objective_progress
  for each row execute function public.prevent_history_change();

create trigger checkin_revisions_append_only
  before update or delete on public.checkin_revisions
  for each row execute function public.prevent_history_change();

-- 8. Sécurité : RLS, lecture admin seulement, aucune écriture directe ---------
alter table public.cohort_objectives enable row level security;
alter table public.checkin_links enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_revisions enable row level security;
alter table public.objective_progress enable row level security;
alter table public.coordination_log enable row level security;

create policy cohort_objectives_admin_read on public.cohort_objectives for select using (public.is_admin_user());
create policy checkin_links_admin_read on public.checkin_links for select using (public.is_admin_user());
create policy checkins_admin_read on public.checkins for select using (public.is_admin_user());
create policy checkin_revisions_admin_read on public.checkin_revisions for select using (public.is_admin_user());
create policy objective_progress_admin_read on public.objective_progress for select using (public.is_admin_user());
create policy coordination_log_admin_read on public.coordination_log for select using (public.is_admin_user());

revoke all on public.cohort_objectives, public.checkin_links, public.checkins,
  public.checkin_revisions, public.objective_progress, public.coordination_log
  from anon, authenticated;
grant select on public.cohort_objectives, public.checkin_links, public.checkins,
  public.checkin_revisions, public.objective_progress, public.coordination_log
  to authenticated;

-- 9. Réglages (nouvelles lignes seulement) -----------------------------------
insert into public.app_config (key, value, updated_at) values
  ('checkins_open', 'false', now()),
  ('coordination_message_templates', $json${
    "checkin": "Bonjour {prenom} ! Ton check-in PASSERELLES de {mois}, une minute chrono : {lien}",
    "reminder": "Bonjour {prenom}, petit rappel : ton check-in de {mois} t'attend (une minute) : {lien}",
    "thanks": "Merci {prenom} pour ton check-in de {mois} !",
    "midpoint": "Bonjour {prenom}, nous arrivons à mi-parcours. Peux-tu nous dire en quelques mots comment avance ton binôme ? Ton lien : {lien}"
  }$json$, now())
on conflict (key) do nothing;
