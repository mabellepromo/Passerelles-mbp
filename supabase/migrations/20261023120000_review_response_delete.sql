-- ============================================================================
-- Suppression admin d'une réponse de bilan, et nettoyage des doublons déjà
-- présents (un même répondant a pu soumettre plusieurs fois via des liens
-- réémis).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPC admin_delete_review_response : supprime une réponse et réinitialise
--    son token pour que le lien redevienne utilisable si besoin (sinon le
--    lien resterait bloqué sur "déjà répondu" sans qu'aucune réponse n'existe
--    plus en base).
-- ----------------------------------------------------------------------------

create or replace function public.admin_delete_review_response(p_response_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token_id uuid;
begin
  if not public.is_review_admin() then
    raise exception 'access_denied' using errcode = '42501';
  end if;

  select token_id into v_token_id
  from public.review_responses
  where id = p_response_id;

  if v_token_id is null then
    raise exception 'response_not_found' using errcode = 'P0006';
  end if;

  delete from public.review_responses where id = p_response_id;

  update public.review_tokens
  set used_at = null, draft_answers = null, draft_saved_at = null
  where id = v_token_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.admin_delete_review_response(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Nettoyage ponctuel des doublons existants : ne garde que la réponse la
--    plus récente par (participant_email, role), supprime les autres.
-- ----------------------------------------------------------------------------

with ranked as (
  select id, token_id,
    row_number() over (
      partition by participant_email, role
      order by submitted_at desc
    ) as rn
  from public.review_responses
),
to_delete as (
  select id, token_id from ranked where rn > 1
)
update public.review_tokens rt
set used_at = null, draft_answers = null, draft_saved_at = null
from to_delete td
where rt.id = td.token_id;

delete from public.review_responses
where id in (
  select id from (
    select id,
      row_number() over (
        partition by participant_email, role
        order by submitted_at desc
      ) as rn
    from public.review_responses
  ) ranked
  where rn > 1
);
