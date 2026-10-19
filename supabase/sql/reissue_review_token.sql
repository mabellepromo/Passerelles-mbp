-- ============================================================================
-- Renvoyer un nouveau lien de bilan à UNE personne précise (mentor ou mentoré)
-- qui a déjà soumis mais a besoin de revenir en arrière / corriger sa réponse.
--
-- Ne supprime ni ne modifie l'ancienne réponse (review_responses) : elle reste
-- dans l'historique. Un nouveau token est créé, indépendant de l'ancien ; la
-- personne remplit un nouveau formulaire, ce qui crée une 2e ligne de réponse
-- pour le même binôme/rôle. Dans les vues admin, prenez la plus récente
-- (submitted_at le plus grand) comme réponse "active" si plusieurs existent.
--
-- À EXÉCUTER MANUELLEMENT : remplacez l'email et le rôle ci-dessous avant de lancer.
-- ============================================================================

with target as (
  select
    'prenom.nom@exemple.com'::text as participant_email,  -- <-- à remplacer
    'mentor'::text as role                                 -- <-- 'mentor' ou 'mentore'
),
target_binome as (
  select b.id as binome_id
  from public.binome b, target t
  where (t.role = 'mentor' and b.mentor_email = t.participant_email)
     or (t.role = 'mentore' and b.mentore_email = t.participant_email)
  order by b.match_date desc
  limit 1
)
insert into public.review_tokens (token, participant_email, role, binome_id, expires_at)
select
  encode(gen_random_bytes(32), 'hex'),
  t.participant_email,
  t.role,
  tb.binome_id,
  now() + interval '30 days'
from target t, target_binome tb
returning concat('https://passerelles.vercel.app/bilan/', token) as new_review_link, participant_email, role;
