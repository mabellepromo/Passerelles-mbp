-- ============================================================================
-- Remplace l'intervalle regulier de relance (tous les N jours) par un
-- calendrier de dates fixes, configurable par campagne. Permet de fixer des
-- rappels a des dates precises (ex: 31 oct, 4 nov, 8 nov) plutot qu'un
-- intervalle calcule depuis le lancement.
-- reminder_schedule = tableau de dates ISO ("YYYY-MM-DD"), dans l'ordre.
-- Le dernier element du tableau est toujours le "dernier rappel" (is_final).
-- Si reminder_schedule est null, on retombe sur l'ancien comportement par
-- intervalle (reminder_interval_days), pour ne rien casser sur d'anciennes
-- campagnes qui n'auraient pas de calendrier fixe defini.
-- ============================================================================

alter table public.review_campaigns
  add column if not exists reminder_schedule jsonb;

create or replace function public.get_review_reminder_candidates(p_campaign_id uuid)
returns table (
  token_id uuid,
  token text,
  participant_email text,
  role text,
  binome_id text,
  is_final boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_schedule jsonb;
begin
  select c.reminder_schedule into v_schedule
  from public.review_campaigns c
  where c.id = p_campaign_id;

  if v_schedule is not null then
    return query
      select
        rt.id,
        rt.token,
        rt.participant_email,
        rt.role,
        rt.binome_id,
        (sent_counts.n = jsonb_array_length(v_schedule) - 1) as is_final
      from public.review_campaigns c
      join public.review_tokens rt
        on rt.binome_id in (select id from public.binome where status = 'active' and is_test = false)
      cross join lateral (
        select count(*) as n from public.review_email_log l
        where l.token_id = rt.id and l.campaign_id = c.id
          and l.email_type in ('reminder', 'final_reminder') and l.status = 'sent'
      ) sent_counts
      where c.id = p_campaign_id
        and c.status = 'active'
        and now() < c.deadline
        and rt.used_at is null
        and rt.reminders_optout = false
        and rt.participant_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
        and not exists (select 1 from public.review_responses rr where rr.token_id = rt.id)
        and exists (
          select 1 from public.review_email_log l
          where l.token_id = rt.id and l.campaign_id = c.id and l.email_type = 'invitation' and l.status = 'sent'
        )
        -- il reste au moins une date de relance non encore envoyee
        and sent_counts.n < jsonb_array_length(v_schedule)
        -- la prochaine date programmee est atteinte
        and now() >= (v_schedule ->> sent_counts.n::int)::date;
  else
    return query
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
        and exists (
          select 1 from public.review_email_log l
          where l.token_id = rt.id and l.campaign_id = c.id and l.status = 'sent'
        );
  end if;
end;
$$;

grant execute on function public.get_review_reminder_candidates(uuid) to service_role, authenticated;

-- Calendrier fixe pour la campagne en cours (lancement 25 oct 2026) :
-- rappel 1 le 31 oct, rappel 2 le 4 nov, dernier rappel le 8 nov (deadline 9 nov 23h59).
update public.review_campaigns
set reminder_schedule = '["2026-10-31", "2026-11-04", "2026-11-08"]'::jsonb
where status in ('draft', 'active')
  and name = 'Sondage bilan — novembre 2026';
