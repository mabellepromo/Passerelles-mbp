-- ============================================================================
-- Campagne d'invitation/rappels pour le sondage de bilan PASSERELLES
-- Date limite : lundi 9 novembre 2026 à 23h59, heure de Lomé (= UTC/GMT,
-- Lomé n'applique pas de changement d'heure).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions nécessaires (planification + appels HTTP sortants depuis
--    Postgres). Suit la convention du projet : extensions dans le schéma
--    "extensions".
-- ----------------------------------------------------------------------------

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. Config applicative minimale (secret webhook + URL de base), accessible
--    uniquement aux fonctions SECURITY DEFINER et au rôle service_role —
--    jamais à anon/authenticated. Évite de coder le secret en dur dans les
--    fonctions SQL.
-- ----------------------------------------------------------------------------

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

insert into public.app_config (key, value)
values
  ('review_webhook_secret', encode(gen_random_bytes(24), 'hex')),
  ('site_api_base_url', 'https://passerelles.vercel.app')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Alignement des tokens existants sur la date limite de la campagne, et
--    mise à jour des fonctions d'émission de tokens pour qu'elles utilisent
--    désormais cette date fixe au lieu de "now() + 30 jours".
-- ----------------------------------------------------------------------------

update public.review_tokens
set expires_at = '2026-11-09 23:59:59+00'
where used_at is null;

create or replace function public.generate_missing_review_tokens()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_created int;
begin
  if not public.is_review_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  with active_pairs as (
    select id as binome_id, mentor_email, mentore_email
    from public.binome
    where status = 'active' and is_test = false
  ),
  candidates as (
    select binome_id, mentor_email as participant_email, 'mentor'::text as role from active_pairs
    union all
    select binome_id, mentore_email as participant_email, 'mentore'::text as role from active_pairs
  ),
  missing as (
    select c.* from candidates c
    where not exists (
      select 1 from public.review_tokens rt
      where rt.binome_id = c.binome_id and rt.participant_email = c.participant_email and rt.role = c.role
    )
  ),
  inserted as (
    insert into public.review_tokens (token, participant_email, role, binome_id, expires_at)
    select encode(gen_random_bytes(32), 'hex'), participant_email, role, binome_id, '2026-11-09 23:59:59+00'
    from missing
    returning id
  )
  select count(*) into v_created from inserted;

  return jsonb_build_object('created', v_created);
end;
$function$;

create or replace function public.admin_reissue_review_token(p_participant_email text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_binome_id text;
  v_token text;
begin
  if not public.is_review_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_role not in ('mentor', 'mentore') then
    raise exception 'invalid_role' using errcode = 'P0006';
  end if;

  select b.id into v_binome_id
  from public.binome b
  where (p_role = 'mentor' and b.mentor_email = p_participant_email)
     or (p_role = 'mentore' and b.mentore_email = p_participant_email)
  order by b.match_date desc
  limit 1;

  if v_binome_id is null then
    raise exception 'no_binome_found' using errcode = 'P0007';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.review_tokens (token, participant_email, role, binome_id, expires_at)
  values (v_token, p_participant_email, p_role, v_binome_id, '2026-11-09 23:59:59+00');

  return jsonb_build_object('token', v_token);
end;
$function$;

-- ----------------------------------------------------------------------------
-- 3. Colonne de désinscription des rappels (conformité / délivrabilité)
-- ----------------------------------------------------------------------------

alter table public.review_tokens
  add column if not exists reminders_optout boolean not null default false;

-- ----------------------------------------------------------------------------
-- 4. Tables de campagne et de journalisation des envois
-- ----------------------------------------------------------------------------

create table if not exists public.review_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  deadline timestamptz not null,
  reminder_interval_days int not null default 3,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'closed')),
  test_mode boolean not null default true,
  test_email text,
  launched_at timestamptz,
  launched_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.review_email_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.review_campaigns(id) on delete set null,
  token_id uuid not null references public.review_tokens(id) on delete cascade,
  participant_email text not null,
  email_type text not null check (email_type in ('invitation', 'reminder', 'final_reminder', 'thank_you')),
  sent_at timestamptz not null default now(),
  provider_message_id text,
  status text not null default 'sent' check (status in ('sent', 'failed', 'bounced')),
  error text
);

create index if not exists review_email_log_token_id_idx on public.review_email_log (token_id);
create index if not exists review_email_log_campaign_id_idx on public.review_email_log (campaign_id);

alter table public.review_campaigns enable row level security;
alter table public.review_email_log enable row level security;
revoke all on public.review_campaigns from anon, authenticated;
revoke all on public.review_email_log from anon, authenticated;

create policy review_campaigns_admin_select on public.review_campaigns
  for select to authenticated using (public.is_review_admin());
create policy review_campaigns_admin_insert on public.review_campaigns
  for insert to authenticated with check (public.is_review_admin());
create policy review_campaigns_admin_update on public.review_campaigns
  for update to authenticated using (public.is_review_admin()) with check (public.is_review_admin());
create policy review_email_log_admin_select on public.review_email_log
  for select to authenticated using (public.is_review_admin());

grant select, insert, update on public.review_campaigns to authenticated;
grant select on public.review_email_log to authenticated;

-- Campagne par défaut (brouillon), modifiable ensuite depuis l'admin.
insert into public.review_campaigns (name, deadline, reminder_interval_days, status, test_mode, test_email)
select 'Sondage bilan — novembre 2026', '2026-11-09 23:59:59+00', 3, 'draft', true, 'mamaneric@gmail.com'
where not exists (select 1 from public.review_campaigns);

-- ----------------------------------------------------------------------------
-- 5. RPC de désinscription des rappels — accessible sans connexion (lien
--    dans chaque email de rappel)
-- ----------------------------------------------------------------------------

create or replace function public.unsubscribe_review_reminders(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.review_tokens set reminders_optout = true where token = p_token;
  if not found then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.unsubscribe_review_reminders(text) to anon;

-- ----------------------------------------------------------------------------
-- 6. RPC admin : lancement et changement de statut d'une campagne
-- ----------------------------------------------------------------------------

create or replace function public.launch_review_campaign(p_campaign_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_review_admin() then
    raise exception 'access_denied' using errcode = '42501';
  end if;

  update public.review_campaigns
  set status = 'active', launched_at = now(), launched_by = auth.uid()
  where id = p_campaign_id and status = 'draft';

  if not found then
    raise exception 'campaign_not_launchable' using errcode = 'P0008';
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.launch_review_campaign(uuid) to authenticated;

create or replace function public.set_review_campaign_status(p_campaign_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_review_admin() then
    raise exception 'access_denied' using errcode = '42501';
  end if;

  if p_status not in ('active', 'paused', 'closed') then
    raise exception 'invalid_status' using errcode = 'P0009';
  end if;

  update public.review_campaigns
  set status = p_status,
      closed_at = case when p_status = 'closed' then now() else closed_at end
  where id = p_campaign_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.set_review_campaign_status(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Fermeture automatique des campagnes dont la date limite est dépassée
-- ----------------------------------------------------------------------------

create or replace function public.close_expired_review_campaigns()
returns void
language sql
security definer
set search_path = public
as $$
  update public.review_campaigns
  set status = 'closed', closed_at = now()
  where status = 'active' and deadline < now();
$$;

grant execute on function public.close_expired_review_campaigns() to service_role, authenticated;

-- ----------------------------------------------------------------------------
-- 8. Fonction retournant les participants à relancer pour une campagne
--    active : pas de réponse, pas désinscrit, date limite non dépassée,
--    dernier envoi datant d'au moins "reminder_interval_days" jours.
--    is_final = true si le prochain rappel régulier tomberait après la
--    date limite (c'est alors le "dernier rappel").
-- ----------------------------------------------------------------------------

create or replace function public.get_review_reminder_candidates(p_campaign_id uuid)
returns table (
  token_id uuid,
  token text,
  participant_email text,
  role text,
  binome_id text,
  is_final boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    rt.id,
    rt.token,
    rt.participant_email,
    rt.role,
    rt.binome_id,
    (now() + (c.reminder_interval_days || ' days')::interval) >= c.deadline as is_final
  from public.review_campaigns c
  join public.review_tokens rt
    on rt.binome_id in (select id from public.binome where status = 'active' and is_test = false)
  where c.id = p_campaign_id
    and c.status = 'active'
    and now() < c.deadline
    and rt.used_at is null
    and rt.reminders_optout = false
    and rt.participant_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    and not exists (select 1 from public.review_responses rr where rr.token_id = rt.id)
    and coalesce(
      (select max(l.sent_at) from public.review_email_log l
       where l.token_id = rt.id and l.campaign_id = c.id and l.status = 'sent'),
      '-infinity'::timestamptz
    ) <= now() - (c.reminder_interval_days || ' days')::interval
    -- un rappel ne part que si une invitation (ou un rappel précédent) a
    -- déjà été journalisée : coalesce à -infinity rend la condition vraie
    -- même sans historique, donc on exclut explicitement ce cas ici :
    and exists (
      select 1 from public.review_email_log l
      where l.token_id = rt.id and l.campaign_id = c.id and l.status = 'sent'
    )
$$;

grant execute on function public.get_review_reminder_candidates(uuid) to service_role, authenticated;

-- ----------------------------------------------------------------------------
-- 9. Vue de suivi des participants pour l'admin (statut, rappels, dernier
--    email) — un seul endroit pour alimenter le tableau de la campagne.
-- ----------------------------------------------------------------------------

create or replace view public.review_campaign_participants as
select
  rt.id as token_id,
  rt.token,
  rt.participant_email,
  rt.role,
  rt.binome_id,
  case when rt.role = 'mentor' then b.mentor_name else b.mentore_name end as participant_name,
  rt.reminders_optout,
  (rr.id is not null) as has_responded,
  rr.submitted_at as responded_at,
  (select count(*) from public.review_email_log l
   where l.token_id = rt.id and l.email_type in ('reminder', 'final_reminder') and l.status = 'sent') as reminders_sent,
  (select max(l.sent_at) from public.review_email_log l where l.token_id = rt.id) as last_email_at,
  (select l.email_type from public.review_email_log l where l.token_id = rt.id order by l.sent_at desc limit 1) as last_email_type
from public.review_tokens rt
join public.binome b on b.id = rt.binome_id
left join public.review_responses rr on rr.token_id = rt.id
where b.status = 'active' and b.is_test = false;

alter view public.review_campaign_participants set (security_invoker = on);
grant select on public.review_campaign_participants to authenticated;

-- ----------------------------------------------------------------------------
-- 10. Déclenchement du mail de remerciement à la soumission du bilan — un
--     appel HTTP asynchrone (pg_net) vers l'API d'envoi, après l'insertion
--     de la réponse. submit_review garantit déjà l'unicité par token
--     (used_at), donc un seul envoi possible par participant.
-- ----------------------------------------------------------------------------

create or replace function public.submit_review(
  p_token text,
  p_answers jsonb,
  p_nps_score smallint,
  p_quote_consent text default 'none'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
  v_base_url text;
  v_secret text;
begin
  if p_quote_consent not in ('none', 'first_name', 'full_name') then
    raise exception 'invalid_quote_consent' using errcode = 'P0004';
  end if;

  if p_nps_score is not null and (p_nps_score < 0 or p_nps_score > 10) then
    raise exception 'invalid_nps_score' using errcode = 'P0005';
  end if;

  select rt.id, rt.participant_email, rt.role, rt.binome_id, rt.expires_at, rt.used_at
  into v_token
  from public.review_tokens rt
  where rt.token = p_token
  for update;

  if v_token is null then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  if v_token.used_at is not null then
    raise exception 'token_already_used' using errcode = 'P0002';
  end if;

  insert into public.review_responses (
    token_id, participant_email, role, binome_id, answers, nps_score, quote_consent
  ) values (
    v_token.id, v_token.participant_email, v_token.role, v_token.binome_id,
    p_answers, p_nps_score, p_quote_consent
  );

  update public.review_tokens set used_at = now(), draft_answers = null where id = v_token.id;

  select value into v_base_url from public.app_config where key = 'site_api_base_url';
  select value into v_secret from public.app_config where key = 'review_webhook_secret';

  if v_base_url is not null and v_secret is not null then
    perform net.http_post(
      url := v_base_url || '/api/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
      body := jsonb_build_object(
        'action', 'review_thank_you',
        'token_id', v_token.id,
        'participant_email', v_token.participant_email,
        'role', v_token.role
      )
    );
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.submit_review(text, jsonb, smallint, text) to anon;

-- ----------------------------------------------------------------------------
-- 11. Planification quotidienne des rappels — 09h00 UTC (= 09h00 Lomé).
-- ----------------------------------------------------------------------------

select cron.schedule(
  'send-review-reminders-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url := (select value from public.app_config where key = 'site_api_base_url') || '/api/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select value from public.app_config where key = 'review_webhook_secret')
    ),
    body := jsonb_build_object('action', 'send_review_reminders')
  );
  $$
);
