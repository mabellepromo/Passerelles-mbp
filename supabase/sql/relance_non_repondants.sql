-- ============================================================================
-- Liste des participants n'ayant pas encore répondu au bilan (pour relance J+5)
-- Le lien reste utilisable même après la date d'expiration affichée (elle ne
-- bloque plus rien) : seul un bilan déjà soumis (used_at renseigné) l'exclut.
-- ============================================================================

select
  case when rt.role = 'mentor' then m1.full_name else m2.full_name end as full_name,
  rt.role,
  rt.participant_email as email,
  coalesce(m1.phone, m2.phone) as phone,
  concat('https://passerelles.vercel.app/bilan/', rt.token) as review_link,
  rt.draft_saved_at,
  rt.expires_at,
  rt.created_at
from public.review_tokens rt
left join public.mentor m1 on m1.email = rt.participant_email and rt.role = 'mentor'
left join public.mentore m2 on m2.email = rt.participant_email and rt.role = 'mentore'
where rt.used_at is null
order by rt.role, full_name;
