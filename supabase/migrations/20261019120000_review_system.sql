-- ============================================================================
-- Bilan nominatif PASSERELLES (mentors + mentorés) — accès par lien à token
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------

create table if not exists public.review_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  participant_email text not null,
  role text not null check (role in ('mentor', 'mentore')),
  binome_id text not null references public.binome(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  draft_answers jsonb,
  draft_saved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists review_tokens_binome_id_idx on public.review_tokens (binome_id);
create index if not exists review_tokens_participant_email_idx on public.review_tokens (participant_email);

create table if not exists public.review_responses (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null unique references public.review_tokens(id) on delete cascade,
  participant_email text not null,
  role text not null check (role in ('mentor', 'mentore')),
  binome_id text not null references public.binome(id) on delete cascade,
  answers jsonb not null,
  nps_score smallint check (nps_score between 0 and 10),
  quote_consent text not null default 'none' check (quote_consent in ('none', 'first_name', 'full_name')),
  submitted_at timestamptz not null default now()
);

create index if not exists review_responses_binome_id_idx on public.review_responses (binome_id);
create index if not exists review_responses_participant_email_idx on public.review_responses (participant_email);

-- ----------------------------------------------------------------------------
-- 2. RLS — aucun accès direct pour anon ni authenticated, tout passe par RPC
--    ou par les vues admin (section 5)
-- ----------------------------------------------------------------------------

alter table public.review_tokens enable row level security;
alter table public.review_responses enable row level security;

-- Aucune policy n'est créée pour anon/authenticated : par défaut, RLS activée
-- sans policy = accès refusé à tout le monde sauf aux fonctions SECURITY DEFINER
-- (qui s'exécutent avec les droits du propriétaire, en contournant RLS) et au
-- rôle service_role (toujours exempté de RLS).

revoke all on public.review_tokens from anon, authenticated;
revoke all on public.review_responses from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Fonction utilitaire admin (même liste que ADMIN_EMAILS côté client)
-- ----------------------------------------------------------------------------

create or replace function public.is_review_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'contact@mabellepromo.org',
    'senayhola@gmail.com',
    'mabellepromo@gmail.com'
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC get_review_context(token) — accessible à anon, lecture minimale
-- ----------------------------------------------------------------------------

create or replace function public.get_review_context(p_token text)
returns table (
  first_name text,
  last_name text,
  role text,
  pair_first_name text,
  draft_answers jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
  v_full_name text;
  v_pair_full_name text;
begin
  select rt.id, rt.role, rt.binome_id, rt.participant_email, rt.expires_at, rt.used_at, rt.draft_answers
  into v_token
  from public.review_tokens rt
  where rt.token = p_token;

  if v_token is null then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  if v_token.used_at is not null then
    raise exception 'token_already_used' using errcode = 'P0002';
  end if;

  -- L'expiration n'est pas bloquante pour quelqu'un qui remplit déjà son
  -- formulaire : elle ne sert que de repère pour les relances côté admin.
  -- Le seul vrai blocage est "déjà soumis" (used_at).

  if v_token.role = 'mentor' then
    select m.full_name into v_full_name from public.mentor m where m.email = v_token.participant_email limit 1;
    select b.mentore_name into v_pair_full_name from public.binome b where b.id = v_token.binome_id;
  else
    select m.full_name into v_full_name from public.mentore m where m.email = v_token.participant_email limit 1;
    select b.mentor_name into v_pair_full_name from public.binome b where b.id = v_token.binome_id;
  end if;

  return query
  select
    split_part(coalesce(v_full_name, ''), ' ', 1) as first_name,
    trim(substring(coalesce(v_full_name, '') from length(split_part(coalesce(v_full_name, ''), ' ', 1)) + 1)) as last_name,
    v_token.role as role,
    split_part(coalesce(v_pair_full_name, ''), ' ', 1) as pair_first_name,
    v_token.draft_answers as draft_answers;
end;
$$;

grant execute on function public.get_review_context(text) to anon;

-- ----------------------------------------------------------------------------
-- 5. RPC save_review_draft(token, answers) — sauvegarde intermédiaire, accessible à anon
--    Permet à un mentor/mentoré de reprendre son formulaire plus tard, sur un
--    autre appareil, sans dépendre du localStorage du navigateur.
-- ----------------------------------------------------------------------------

create or replace function public.save_review_draft(p_token text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token record;
begin
  select rt.id, rt.used_at, rt.expires_at
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

  update public.review_tokens
  set draft_answers = p_answers, draft_saved_at = now()
  where id = v_token.id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.save_review_draft(text, jsonb) to anon;

-- ----------------------------------------------------------------------------
-- 6. RPC submit_review(token, answers, nps, quote_consent) — accessible à anon
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

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.submit_review(text, jsonb, smallint, text) to anon;

-- ----------------------------------------------------------------------------
-- 7. Vues admin (accès restreint via RLS + is_review_admin())
-- ----------------------------------------------------------------------------

create or replace view public.review_by_participant as
select
  rr.id,
  rr.participant_email,
  rr.role,
  case when rr.role = 'mentor' then b.mentor_name else b.mentore_name end as participant_name,
  rr.binome_id,
  b.mentor_name,
  b.mentore_name,
  b.cohorte,
  rr.nps_score,
  rr.quote_consent,
  rr.answers,
  rr.submitted_at
from public.review_responses rr
join public.binome b on b.id = rr.binome_id;

create or replace view public.review_pair_comparison as
select
  b.id as binome_id,
  b.mentor_name,
  b.mentore_name,
  b.cohorte,
  mentor_r.nps_score as mentor_nps,
  mentore_r.nps_score as mentore_nps,
  mentor_r.answers as mentor_answers,
  mentore_r.answers as mentore_answers,
  mentor_r.submitted_at as mentor_submitted_at,
  mentore_r.submitted_at as mentore_submitted_at
from public.binome b
left join public.review_responses mentor_r on mentor_r.binome_id = b.id and mentor_r.role = 'mentor'
left join public.review_responses mentore_r on mentore_r.binome_id = b.id and mentore_r.role = 'mentore'
where b.status = 'active' and b.is_test = false;

create or replace view public.review_global_stats as
select
  rt.role,
  count(rt.id) as total_tokens,
  count(rr.id) as total_responses,
  round(count(rr.id)::numeric / nullif(count(rt.id), 0) * 100, 1) as response_rate_pct,
  round(avg(rr.nps_score), 1) as avg_nps,
  round(
    (
      (count(*) filter (where rr.nps_score >= 9))::numeric
      - (count(*) filter (where rr.nps_score <= 6))::numeric
    ) / nullif(count(rr.nps_score), 0) * 100,
    1
  ) as nps_score_pct
from public.review_tokens rt
left join public.review_responses rr on rr.token_id = rt.id
group by rt.role;

alter view public.review_by_participant set (security_invoker = on);
alter view public.review_pair_comparison set (security_invoker = on);
alter view public.review_global_stats set (security_invoker = on);

-- Les vues avec security_invoker=on respectent la RLS des tables sous-jacentes
-- pour le rôle appelant. Comme review_responses/review_tokens n'ont aucune
-- policy pour authenticated, on ajoute des policies dédiées "admin only" :

create policy review_responses_admin_select on public.review_responses
  for select to authenticated
  using (public.is_review_admin());

create policy review_tokens_admin_select on public.review_tokens
  for select to authenticated
  using (public.is_review_admin());

grant select on public.review_by_participant, public.review_pair_comparison, public.review_global_stats to authenticated;
grant select on public.binome to authenticated; -- déjà probablement accordé ; no-op sinon
