-- ============================================================================
-- M6 — Cohorte 2 : fonctions de l'espace de coordination (admin seulement)
--
-- Toutes les ÉCRITURES de la cohorte 2 passent par ces fonctions. Chacune
-- commence par vérifier is_admin_user() : un utilisateur non admin, ou un
-- visiteur, reçoit l'erreur « not_authorized », même en appelant l'API
-- directement. Les LECTURES se font sur les tables, protégées par RLS (M4).
--
-- Binômes concernés : cohorte 2 (is_test = false), plus le binôme test pour
-- les essais. Les binômes de la cohorte 1 sont refusés.
-- ============================================================================

-- Refuse tout appel qui ne vient pas d'un admin.
create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
end;
$$;

-- Binôme géré par l'espace Cohorte 2 : cohorte 2 réelle, ou binôme test.
create or replace function public.assert_coordination_binome(p_binome_id text)
returns public.binome
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_binome public.binome;
begin
  select * into v_binome from public.binome where id = p_binome_id;
  if not found or not (v_binome.is_test or v_binome.cohorte = '2') then
    raise exception 'binome_not_in_cohort2' using errcode = 'P0301';
  end if;
  return v_binome;
end;
$$;

-- Nouveau jeton : 32 octets aléatoires en hexadécimal (comme le sondage).
create or replace function public.new_checkin_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$ select encode(gen_random_bytes(32), 'hex') $$;

-- ----------------------------------------------------------------------------
-- Réglages
-- ----------------------------------------------------------------------------
create or replace function public.admin_get_coordination_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'checkins_open', public.checkins_are_open(),
    'templates', coalesce((select value::jsonb from public.app_config where key = 'coordination_message_templates'), '{}'::jsonb),
    'current_period', public.current_checkin_period()
  );
end;
$$;

create or replace function public.admin_set_checkins_open(p_open boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.app_config set value = case when p_open then 'true' else 'false' end, updated_at = now()
  where key = 'checkins_open';
end;
$$;

create or replace function public.admin_set_message_templates(p_templates jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  if jsonb_typeof(p_templates) is distinct from 'object' then
    raise exception 'invalid_templates' using errcode = 'P0302';
  end if;
  update public.app_config set value = p_templates::text, updated_at = now()
  where key = 'coordination_message_templates';
end;
$$;

-- Activation d'un binôme pour le pilote.
create or replace function public.admin_set_checkin_enabled(p_binome_id text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  perform public.assert_coordination_binome(p_binome_id);
  update public.binome set checkin_enabled = p_enabled, updated_date = now() where id = p_binome_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Binômes de la cohorte 2
-- ----------------------------------------------------------------------------
create or replace function public.admin_create_cohort2_binome(p_mentor_id text, p_mentore_id text, p_start_date date)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_mentor public.mentor;
  v_mentore public.mentore;
  v_id text;
begin
  perform public.assert_admin();

  select * into v_mentor from public.mentor where id = p_mentor_id;
  if not found then raise exception 'mentor_not_found' using errcode = 'P0303'; end if;
  select * into v_mentore from public.mentore where id = p_mentore_id;
  if not found then raise exception 'mentore_not_found' using errcode = 'P0304'; end if;

  -- Un mentoré ne fait partie que d'un seul binôme actif de la cohorte 2.
  if exists (select 1 from public.binome where cohorte = '2' and status = 'active' and mentore_id = p_mentore_id) then
    raise exception 'mentore_already_paired' using errcode = 'P0305';
  end if;

  -- Identifiant au même format que les binômes existants (24 caractères hexadécimaux).
  v_id := encode(gen_random_bytes(12), 'hex');

  -- Les fiches mentor et mentoré ne sont pas modifiées.
  insert into public.binome (
    id, cohorte, mentor_id, mentore_id, mentor_name, mentore_name, mentor_email, mentore_email,
    match_date, status, is_test, checkin_enabled
  ) values (
    v_id, '2', v_mentor.id, v_mentore.id, v_mentor.full_name, v_mentore.full_name,
    v_mentor.email, v_mentore.email, coalesce(p_start_date, current_date), 'active', false, false
  );
  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Objectifs SMART
-- ----------------------------------------------------------------------------
create or replace function public.admin_create_objective(p_binome_id text, p_title text, p_success_criteria text, p_due_date date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform public.assert_admin();
  perform public.assert_coordination_binome(p_binome_id);
  insert into public.cohort_objectives (binome_id, title, success_criteria, due_date, created_by)
  values (p_binome_id, trim(p_title), nullif(trim(coalesce(p_success_criteria, '')), ''), p_due_date, auth.jwt() ->> 'email')
  returning id into v_id;
  return v_id;
end;
$$;

-- Ajuster = clore l'ancien (statut « adjusted », raison obligatoire) et créer
-- un nouvel objectif lié à l'ancien.
create or replace function public.admin_adjust_objective(
  p_objective_id uuid, p_title text, p_success_criteria text, p_due_date date, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.cohort_objectives;
  v_id uuid;
begin
  perform public.assert_admin();
  select * into v_old from public.cohort_objectives where id = p_objective_id for update;
  if not found or v_old.status <> 'in_progress' then
    raise exception 'objective_not_active' using errcode = 'P0306';
  end if;
  perform public.assert_coordination_binome(v_old.binome_id);

  update public.cohort_objectives
  set status = 'adjusted', status_reason = trim(p_reason), updated_at = now()
  where id = v_old.id;

  insert into public.cohort_objectives (binome_id, title, success_criteria, due_date, replaces_objective_id, created_by)
  values (v_old.binome_id, trim(p_title), nullif(trim(coalesce(p_success_criteria, '')), ''), p_due_date, v_old.id, auth.jwt() ->> 'email')
  returning id into v_id;
  return v_id;
end;
$$;

-- Marquer un objectif atteint ou abandonné (raison obligatoire).
create or replace function public.admin_close_objective(p_objective_id uuid, p_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.cohort_objectives;
begin
  perform public.assert_admin();
  if p_status not in ('achieved', 'abandoned') then
    raise exception 'invalid_status' using errcode = 'P0307';
  end if;
  select * into v_old from public.cohort_objectives where id = p_objective_id for update;
  if not found or v_old.status <> 'in_progress' then
    raise exception 'objective_not_active' using errcode = 'P0306';
  end if;
  perform public.assert_coordination_binome(v_old.binome_id);
  update public.cohort_objectives
  set status = p_status, status_reason = trim(p_reason), updated_at = now()
  where id = v_old.id;
end;
$$;

-- Avancement déclaré par le coordinateur lui-même (hors check-in).
create or replace function public.admin_declare_progress(p_objective_id uuid, p_progress_pct integer, p_comment text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_obj public.cohort_objectives;
begin
  perform public.assert_admin();
  select * into v_obj from public.cohort_objectives where id = p_objective_id;
  if not found or v_obj.status <> 'in_progress' then
    raise exception 'objective_not_active' using errcode = 'P0306';
  end if;
  perform public.assert_coordination_binome(v_obj.binome_id);
  insert into public.objective_progress (objective_id, progress_pct, declared_by, comment)
  values (p_objective_id, p_progress_pct, 'coordinator', nullif(trim(coalesce(p_comment, '')), ''));
end;
$$;

-- ----------------------------------------------------------------------------
-- Liens personnels
-- ----------------------------------------------------------------------------
-- Crée les liens manquants : pour un binôme précis, ou pour tous les binômes
-- actifs de la cohorte 2 (le binôme test seulement s'il est désigné).
create or replace function public.admin_generate_checkin_links(p_binome_id text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created integer;
begin
  perform public.assert_admin();
  if p_binome_id is not null then
    perform public.assert_coordination_binome(p_binome_id);
  end if;

  with pairs as (
    select id, mentor_email, mentore_email from public.binome
    where (p_binome_id is not null and id = p_binome_id)
       or (p_binome_id is null and cohorte = '2' and status = 'active' and is_test = false)
  ),
  candidates as (
    select id as binome_id, 'mentor'::text as role, mentor_email as email from pairs
    union all
    select id, 'mentore', mentore_email from pairs
  ),
  inserted as (
    insert into public.checkin_links (binome_id, role, participant_email, token)
    select c.binome_id, c.role, c.email, public.new_checkin_token()
    from candidates c
    where c.email is not null
      and not exists (
        select 1 from public.checkin_links l
        where l.binome_id = c.binome_id and l.role = c.role and l.revoked_at is null)
    returning id
  )
  select count(*) into v_created from inserted;
  return v_created;
end;
$$;

-- Révoque le lien actif d'un participant et en crée un nouveau.
create or replace function public.admin_regenerate_checkin_link(p_binome_id text, p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_binome public.binome;
  v_old_id uuid;
  v_new_id uuid;
  v_token text;
begin
  perform public.assert_admin();
  v_binome := public.assert_coordination_binome(p_binome_id);
  if p_role not in ('mentor', 'mentore') then
    raise exception 'invalid_role' using errcode = 'P0308';
  end if;

  update public.checkin_links set revoked_at = now()
  where binome_id = p_binome_id and role = p_role and revoked_at is null
  returning id into v_old_id;

  v_token := public.new_checkin_token();
  insert into public.checkin_links (binome_id, role, participant_email, token)
  values (p_binome_id, p_role,
          case when p_role = 'mentor' then v_binome.mentor_email else v_binome.mentore_email end,
          v_token)
  returning id into v_new_id;

  if v_old_id is not null then
    update public.checkin_links set replaced_by = v_new_id where id = v_old_id;
  end if;
  return v_token;
end;
$$;

-- Révoque le lien actif sans en créer d'autre.
create or replace function public.admin_revoke_checkin_link(p_binome_id text, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  perform public.assert_coordination_binome(p_binome_id);
  update public.checkin_links set revoked_at = now()
  where binome_id = p_binome_id and role = p_role and revoked_at is null;
end;
$$;

-- ----------------------------------------------------------------------------
-- Journal de coordination
-- ----------------------------------------------------------------------------
create or replace function public.admin_add_coordination_entry(
  p_binome_id text, p_event_date date, p_event_type text, p_summary text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform public.assert_admin();
  perform public.assert_coordination_binome(p_binome_id);
  insert into public.coordination_log (binome_id, event_date, event_type, summary, created_by)
  values (p_binome_id, coalesce(p_event_date, current_date), p_event_type, trim(p_summary), auth.jwt() ->> 'email')
  returning id into v_id;
  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Droits : fonctions appelables par un utilisateur connecté (elles vérifient
-- elles-mêmes le rôle admin) ; jamais par un visiteur non connecté.
-- ----------------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.admin_get_coordination_settings()',
    'public.admin_set_checkins_open(boolean)',
    'public.admin_set_message_templates(jsonb)',
    'public.admin_set_checkin_enabled(text, boolean)',
    'public.admin_create_cohort2_binome(text, text, date)',
    'public.admin_create_objective(text, text, text, date)',
    'public.admin_adjust_objective(uuid, text, text, date, text)',
    'public.admin_close_objective(uuid, text, text)',
    'public.admin_declare_progress(uuid, integer, text)',
    'public.admin_generate_checkin_links(text)',
    'public.admin_regenerate_checkin_link(text, text)',
    'public.admin_revoke_checkin_link(text, text)',
    'public.admin_add_coordination_entry(text, date, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;

  -- Outils internes : jamais appelés directement depuis le navigateur.
  foreach f in array array[
    'public.assert_admin()',
    'public.assert_coordination_binome(text)',
    'public.new_checkin_token()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end;
$$;
