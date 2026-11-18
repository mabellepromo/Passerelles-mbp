-- ============================================================================
-- M2a — Lectures publiques sûres (préparation de M2b)
--
-- Aujourd'hui, quatre politiques ouvrent des tables à tout le monde, même aux
-- visiteurs non connectés : binome (emails), mentor et mentore (dossiers
-- complets), suivi_mensuel (toutes les fiches), binome_fichier (fichiers).
-- Elles servent à deux écrans :
--   - le bandeau de chiffres de la page d'accueil (HomeProgramStats) ;
--   - la page « Cohorte 1 » (ResultatsCohorte1, réservée aux connectés).
--
-- Cette migration AJOUTE seulement deux fonctions qui renvoient ce dont ces
-- écrans ont besoin, et rien de plus. Les politiques publiques ne sont
-- retirées qu'en M2b, une fois le nouveau code en production.
-- ============================================================================

-- 1. Chiffres de la page d'accueil : seulement des agrégats.
--    Même calcul qu'aujourd'hui (HomeProgramStats) pour que l'affichage
--    ne change pas.
create or replace function public.get_public_program_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'fiches_count', count(*),
    'avg_satisfaction', round(avg((coalesce(satisfaction_mentor, 0) + coalesce(satisfaction_mentore, 0)) / 2.0)::numeric, 1)
  )
  from public.suivi_mensuel;
$$;

revoke all on function public.get_public_program_stats() from public;
grant execute on function public.get_public_program_stats() to anon, authenticated;

-- 2. Page « Cohorte 1 » : annuaire des binômes de la cohorte 1.
--    Pour tout utilisateur connecté : noms, scores affichés dans la liste.
--    Coordonnées et dossier (téléphone, email, motivation...) : seulement
--    pour un admin ou pour les deux membres du binôme (can_view).
--    Jamais : évaluations internes, moyenne, documents, avis de l'IA.
create or replace function public.get_cohort1_directory()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select coalesce(auth.jwt() ->> 'email', '') as email, public.is_admin_user() as is_admin
  ),
  pairs as (
    select b.*, (me.is_admin or me.email in (b.mentor_email, b.mentore_email)) as can_view
    from public.binome b, me
    where b.cohorte = '1' and b.status = 'active' and b.is_test = false
      and auth.uid() is not null
  )
  select jsonb_build_object(
    'binomes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'mentor_id', p.mentor_id,
        'mentore_id', p.mentore_id,
        'mentor_name', p.mentor_name,
        'mentore_name', p.mentore_name,
        'match_score', p.match_score,
        'match_date', p.match_date,
        'can_view', p.can_view,
        'notes', case when p.can_view then p.notes end,
        'mentor_email', case when p.can_view then p.mentor_email end,
        'mentore_email', case when p.can_view then p.mentore_email end
      ) order by p.match_date)
      from pairs p), '[]'::jsonb),
    'mentors', coalesce((
      select jsonb_agg(case when p.can_view then jsonb_build_object(
        'id', m.id, 'email', m.email, 'phone', m.phone, 'organization', m.organization,
        'city', m.city, 'city_other', m.city_other, 'years_experience', m.years_experience,
        'availability', m.availability, 'available_days', m.available_days,
        'time_slots', m.time_slots, 'preferred_format', m.preferred_format
      ) else jsonb_build_object('id', m.id) end)
      from pairs p join public.mentor m on m.id = p.mentor_id), '[]'::jsonb),
    'mentores', coalesce((
      select jsonb_agg(case when p.can_view then jsonb_build_object(
        'id', e.id, 'email', e.email, 'phone', e.phone, 'level', e.level,
        'university', e.university, 'university_other', e.university_other,
        'city', e.city, 'city_other', e.city_other, 'availability', e.availability,
        'available_days', e.available_days, 'time_slots', e.time_slots,
        'preferred_format', e.preferred_format, 'career_goals', e.career_goals,
        'other_career_goal', e.other_career_goal, 'civic_engagement', e.civic_engagement,
        'motivation_letter', e.motivation_letter, 'selection_score', e.selection_score
      ) else jsonb_build_object('id', e.id, 'selection_score', e.selection_score) end)
      from pairs p join public.mentore e on e.id = p.mentore_id), '[]'::jsonb)
  );
$$;

revoke all on function public.get_cohort1_directory() from public;
-- Supabase accorde par défaut l'exécution des nouvelles fonctions au rôle
-- anon : on le retire explicitement (annuaire réservé aux connectés).
revoke execute on function public.get_cohort1_directory() from anon;
grant execute on function public.get_cohort1_directory() to authenticated;
