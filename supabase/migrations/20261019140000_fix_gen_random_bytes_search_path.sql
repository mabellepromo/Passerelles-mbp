-- ============================================================================
-- Fix : gen_random_bytes() vit dans le schéma `extensions` sur Supabase, pas
-- dans `public`. Les RPC de génération de tokens de bilan avaient
-- `set search_path = public`, donc l'appel échouait avec
-- "function gen_random_bytes(integer) does not exist".
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_missing_review_tokens()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
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
    select encode(gen_random_bytes(32), 'hex'), participant_email, role, binome_id, now() + interval '30 days'
    from missing
    returning id
  )
  select count(*) into v_created from inserted;

  return jsonb_build_object('created', v_created);
end;
$$;

create or replace function public.admin_reissue_review_token(p_participant_email text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
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
  values (v_token, p_participant_email, p_role, v_binome_id, now() + interval '30 days');

  return jsonb_build_object('token', v_token);
end;
$$;
