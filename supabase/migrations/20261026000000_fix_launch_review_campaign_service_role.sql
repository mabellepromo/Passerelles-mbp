-- ============================================================================
-- Corrige launch_review_campaign : elle est appelee depuis api/send-email.js
-- avec le client service-role (apres verification admin cote serveur via
-- isUserAdmin()), donc auth.jwt() n'a pas d'email utilisateur a ce moment-la
-- et is_review_admin() renvoie toujours faux -> "access_denied" systematique
-- au clic sur "Lancer l'envoi". Meme correctif que build_review_report_metrics :
-- autoriser aussi auth.role() = 'service_role'.
-- ============================================================================

create or replace function public.launch_review_campaign(p_campaign_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_review_admin() or auth.role() = 'service_role') then
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

grant execute on function public.launch_review_campaign(uuid) to authenticated, service_role;
