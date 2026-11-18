-- ============================================================================
-- M5 — Cohorte 2 : fonctions de la page publique de check-in (/m/<token>)
--
-- Le participant n'a pas de compte : il passe UNIQUEMENT par ces deux
-- fonctions, qui vérifient le jeton et ne renvoient que les données de SON
-- binôme. Aucune table n'est lisible directement par un visiteur.
--
--   get_checkin_context(token)            : prénom, binôme, objectifs, mois
--   submit_checkin(token, réponses, coord) : enregistre le check-in du mois
--
-- Règles :
--   - mois concerné : jusqu'au 10 inclus, le mois précédent ; ensuite, le
--     mois en cours (le message part le 25, la relance le 28) ;
--   - une nouvelle saisie du même mois remplace la précédente tant que le
--     mois n'est pas clos (le 10 du mois suivant à 23 h 59, heure de Lomé =
--     UTC) ; l'ancienne version est copiée dans checkin_revisions ;
--   - page ouverte si : interrupteur « checkins_open » ET binôme activé
--     (checkin_enabled) ET cohorte 2 active ; le binôme test est toujours
--     ouvert ; l'admin (saisie coordinateur) passe toujours.
-- ============================================================================

-- Jour du mois suivant jusqu'auquel un check-in peut encore être remplacé.
-- (Même valeur dans src/config/coordinationRules.js, pour l'affichage.)
create or replace function public.checkin_closing_day()
returns integer
language sql
immutable
as $$ select 10 $$;

-- Mois en cours de saisie, format 'YYYY-MM' (heure de Lomé = UTC).
create or replace function public.current_checkin_period()
returns text
language sql
stable
as $$
  select case
    when extract(day from (now() at time zone 'Africa/Lome')) <= public.checkin_closing_day()
      then to_char(date_trunc('month', now() at time zone 'Africa/Lome') - interval '1 month', 'YYYY-MM')
    else to_char(now() at time zone 'Africa/Lome', 'YYYY-MM')
  end;
$$;

-- Fin de la période de modification d'un mois : le 10 du mois suivant à 23 h 59.
create or replace function public.checkin_period_closes_at(p_period text)
returns timestamptz
language sql
immutable
as $$
  select ((to_date(p_period || '-01', 'YYYY-MM-DD') + interval '1 month'
           + make_interval(days => public.checkin_closing_day()))::timestamp
          at time zone 'Africa/Lome');
$$;

-- Prénom à partir d'un nom enregistré « NOM Prénoms » (le NOM est en majuscules).
create or replace function public.first_name_of(p_full_name text)
returns text
language sql
immutable
as $$
  select coalesce(
    (select w
     from regexp_split_to_table(trim(coalesce(p_full_name, '')), '\s+') with ordinality as t(w, i)
     where not (length(regexp_replace(w, '[^[:alpha:]]', '', 'g')) > 1 and w = upper(w))
     order by (length(replace(w, '.', '')) > 2) desc, i
     limit 1),
    split_part(trim(coalesce(p_full_name, '')), ' ', 1)
  );
$$;

-- Interrupteur général « Check-ins ouverts ».
create or replace function public.checkins_are_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value = 'true' from public.app_config where key = 'checkins_open'), false);
$$;

-- ----------------------------------------------------------------------------
-- Contexte de la page : renvoie seulement les données du binôme du jeton.
-- ----------------------------------------------------------------------------
create or replace function public.get_checkin_context(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_link public.checkin_links;
  v_binome public.binome;
  v_open boolean;
  v_period text;
begin
  select * into v_link from public.checkin_links where token = p_token;
  if not found then
    raise exception 'invalid_token' using errcode = 'P0201';
  end if;
  if v_link.revoked_at is not null then
    raise exception 'revoked_token' using errcode = 'P0202';
  end if;

  select * into v_binome from public.binome where id = v_link.binome_id;

  v_open := v_binome.is_test
    or (public.checkins_are_open() and v_binome.checkin_enabled
        and v_binome.cohorte = '2' and v_binome.status = 'active');

  -- Page fermée : on ne renvoie rien de personnel (sauf à l'admin).
  if not v_open and not public.is_admin_user() then
    return jsonb_build_object('status', 'closed');
  end if;

  v_period := public.current_checkin_period();

  return jsonb_build_object(
    'status', 'open',
    'access_open', v_open,
    'role', v_link.role,
    'first_name', public.first_name_of(case when v_link.role = 'mentor' then v_binome.mentor_name else v_binome.mentore_name end),
    'pair_name', case when v_link.role = 'mentor' then v_binome.mentore_name else v_binome.mentor_name end,
    'period', v_period,
    'closes_at', public.checkin_period_closes_at(v_period),
    'objectives', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'title', o.title,
        'success_criteria', o.success_criteria,
        'due_date', o.due_date,
        -- Dernière valeur déclarée par CE participant (préremplissage).
        'last_progress', (
          select p.progress_pct from public.objective_progress p
          where p.objective_id = o.id and p.declared_by = v_link.role
          order by p.created_at desc limit 1)
      ) order by o.created_at)
      from public.cohort_objectives o
      where o.binome_id = v_binome.id and o.status = 'in_progress'), '[]'::jsonb),
    -- Check-in déjà envoyé ce mois-ci (il peut être modifié jusqu'à la clôture).
    'existing', (
      select jsonb_build_object(
        'had_exchange', c.had_exchange, 'exchange_count', c.exchange_count,
        'exchange_channel', c.exchange_channel, 'approx_duration_minutes', c.approx_duration_minutes,
        'mood', c.mood, 'blocker_text', c.blocker_text, 'submitted_at', c.submitted_at)
      from public.checkins c
      where c.binome_id = v_binome.id and c.role = v_link.role and c.period = v_period)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Enregistrement du check-in du mois.
-- p_answers : { had_exchange, exchange_count, exchange_channel[], approx_duration_minutes,
--               mood, blocker_text, progress: [{ objective_id, progress_pct }] }
-- p_as_coordinator : saisie par le coordinateur (admin connecté obligatoire).
-- ----------------------------------------------------------------------------
create or replace function public.submit_checkin(p_token text, p_answers jsonb, p_as_coordinator boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.checkin_links;
  v_binome public.binome;
  v_open boolean;
  v_period text;
  v_had boolean;
  v_existing public.checkins;
  v_checkin_id uuid;
  v_item jsonb;
  v_pct integer;
begin
  select * into v_link from public.checkin_links where token = p_token;
  if not found then
    raise exception 'invalid_token' using errcode = 'P0201';
  end if;
  if v_link.revoked_at is not null then
    raise exception 'revoked_token' using errcode = 'P0202';
  end if;
  if p_as_coordinator and not public.is_admin_user() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select * into v_binome from public.binome where id = v_link.binome_id;
  v_open := v_binome.is_test
    or (public.checkins_are_open() and v_binome.checkin_enabled
        and v_binome.cohorte = '2' and v_binome.status = 'active');
  if not v_open and not p_as_coordinator then
    raise exception 'checkins_closed' using errcode = 'P0203';
  end if;

  if jsonb_typeof(p_answers -> 'had_exchange') is distinct from 'boolean' then
    raise exception 'invalid_answers' using errcode = 'P0204';
  end if;
  v_had := (p_answers ->> 'had_exchange')::boolean;
  v_period := public.current_checkin_period();

  select * into v_existing from public.checkins
  where binome_id = v_binome.id and role = v_link.role and period = v_period
  for update;

  if found then
    if now() > public.checkin_period_closes_at(v_period) then
      raise exception 'period_closed' using errcode = 'P0205';
    end if;
    -- L'ancienne version est conservée avant d'être remplacée.
    insert into public.checkin_revisions (checkin_id, previous) values (v_existing.id, to_jsonb(v_existing));
    update public.checkins set
      link_id = v_link.id,
      had_exchange = v_had,
      exchange_count = case when v_had then nullif(p_answers ->> 'exchange_count', '')::integer end,
      exchange_channel = case when v_had then coalesce(array(select jsonb_array_elements_text(p_answers -> 'exchange_channel')), '{}') else '{}' end,
      approx_duration_minutes = case when v_had then nullif(p_answers ->> 'approx_duration_minutes', '')::integer end,
      mood = nullif(p_answers ->> 'mood', ''),
      blocker_text = nullif(trim(coalesce(p_answers ->> 'blocker_text', '')), ''),
      entered_by = case when p_as_coordinator then 'coordinator' else 'participant' end,
      entered_by_email = case when p_as_coordinator then auth.jwt() ->> 'email' end,
      submitted_at = now()
    where id = v_existing.id
    returning id into v_checkin_id;
  else
    insert into public.checkins (
      binome_id, role, link_id, period, had_exchange, exchange_count, exchange_channel,
      approx_duration_minutes, mood, blocker_text, entered_by, entered_by_email
    ) values (
      v_binome.id, v_link.role, v_link.id, v_period, v_had,
      case when v_had then nullif(p_answers ->> 'exchange_count', '')::integer end,
      case when v_had then coalesce(array(select jsonb_array_elements_text(p_answers -> 'exchange_channel')), '{}') else '{}' end,
      case when v_had then nullif(p_answers ->> 'approx_duration_minutes', '')::integer end,
      nullif(p_answers ->> 'mood', ''),
      nullif(trim(coalesce(p_answers ->> 'blocker_text', '')), ''),
      case when p_as_coordinator then 'coordinator' else 'participant' end,
      case when p_as_coordinator then auth.jwt() ->> 'email' end
    )
    returning id into v_checkin_id;
  end if;

  -- Avancement des objectifs : toujours une NOUVELLE ligne (historique).
  -- Seuls les objectifs en cours de CE binôme sont acceptés.
  for v_item in select * from jsonb_array_elements(coalesce(p_answers -> 'progress', '[]'::jsonb)) loop
    v_pct := (v_item ->> 'progress_pct')::integer;
    if v_pct is not null and exists (
      select 1 from public.cohort_objectives o
      where o.id = (v_item ->> 'objective_id')::uuid and o.binome_id = v_binome.id and o.status = 'in_progress'
    ) then
      insert into public.objective_progress (objective_id, checkin_id, progress_pct, declared_by)
      values ((v_item ->> 'objective_id')::uuid, v_checkin_id, v_pct, v_link.role);
    end if;
  end loop;

  return jsonb_build_object('success', true, 'period', v_period, 'replaced', v_existing.id is not null);
end;
$$;

-- Droits : seules ces deux fonctions sont ouvertes aux visiteurs.
revoke all on function public.get_checkin_context(text) from public;
revoke all on function public.submit_checkin(text, jsonb, boolean) from public;
grant execute on function public.get_checkin_context(text) to anon, authenticated;
grant execute on function public.submit_checkin(text, jsonb, boolean) to anon, authenticated;

-- Fonctions internes : pas d'appel direct par les visiteurs.
revoke all on function public.checkins_are_open() from public, anon;
