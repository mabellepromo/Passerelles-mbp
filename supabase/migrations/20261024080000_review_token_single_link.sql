-- ============================================================================
-- Garantir un seul lien actif par participant (mentor/mentoré) : nettoyage
-- des doublons existants, et modification des fonctions de génération pour
-- qu'elles ne puissent plus en recréer. Ajoute aussi la suppression d'un
-- lien par l'admin.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Nettoyage : pour chaque (participant_email, role), ne garder que le
--    token non répondu (used_at is null) le plus récent. Les tokens déjà
--    répondus (used_at not null) ne sont jamais touchés : ils portent une
--    vraie réponse en base.
-- ----------------------------------------------------------------------------

delete from public.review_tokens rt
where rt.used_at is null
  and exists (
    select 1 from public.review_tokens rt2
    where rt2.participant_email = rt.participant_email
      and rt2.role = rt.role
      and rt2.used_at is null
      and rt2.created_at > rt.created_at
  );

-- ----------------------------------------------------------------------------
-- 2. admin_reissue_review_token : supprime désormais l'éventuel lien non
--    répondu existant avant d'en créer un nouveau, pour qu'il n'y en ait
--    jamais deux en même temps pour la même personne.
-- ----------------------------------------------------------------------------

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

  -- Supprime le lien non répondu existant (s'il y en a un) pour éviter les
  -- doublons ; les liens déjà répondus (historique, used_at not null) sont
  -- préservés.
  delete from public.review_tokens
  where participant_email = p_participant_email and role = p_role and used_at is null;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.review_tokens (token, participant_email, role, binome_id, expires_at)
  values (v_token, p_participant_email, p_role, v_binome_id, '2026-11-09 23:59:59+00');

  return jsonb_build_object('token', v_token);
end;
$function$;

-- ----------------------------------------------------------------------------
-- 3. Suppression d'un lien non répondu par l'admin.
-- ----------------------------------------------------------------------------

create or replace function public.admin_delete_review_token(p_token_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_review_admin() then
    raise exception 'access_denied' using errcode = '42501';
  end if;

  delete from public.review_tokens
  where id = p_token_id and used_at is null;

  if not found then
    raise exception 'token_not_deletable' using errcode = 'P0010';
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.admin_delete_review_token(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Vue participants : un seul enregistrement par (participant_email, role),
--    même en cas d'anomalie future — priorité au lien répondu, sinon au plus
--    récent.
-- ----------------------------------------------------------------------------

drop view if exists public.review_campaign_participants;

create or replace view public.review_campaign_participants as
select distinct on (rt.participant_email, rt.role)
  rt.id as token_id,
  rt.token,
  rt.participant_email,
  rt.role,
  rt.binome_id,
  case when rt.role = 'mentor' then b.mentor_name else b.mentore_name end as participant_name,
  rt.reminders_optout,
  rt.draft_saved_at,
  (rr.id is not null) as has_responded,
  rr.submitted_at as responded_at,
  (select count(*) from public.review_email_log l
   where l.token_id = rt.id and l.email_type in ('reminder', 'final_reminder') and l.status = 'sent') as reminders_sent,
  (select max(l.sent_at) from public.review_email_log l where l.token_id = rt.id) as last_email_at,
  (select l.email_type from public.review_email_log l where l.token_id = rt.id order by l.sent_at desc limit 1) as last_email_type
from public.review_tokens rt
join public.binome b on b.id = rt.binome_id
left join public.review_responses rr on rr.token_id = rt.id
where b.status = 'active' and b.is_test = false
order by rt.participant_email, rt.role, (rr.id is not null) desc, rt.created_at desc;

alter view public.review_campaign_participants set (security_invoker = on);
grant select on public.review_campaign_participants to authenticated;
