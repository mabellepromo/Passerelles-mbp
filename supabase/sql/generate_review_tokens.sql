-- ============================================================================
-- Génération en masse des tokens de bilan pour tous les binômes actifs
-- À exécuter une fois dans l'éditeur SQL de Supabase (pas une migration : effet
-- de bord, pas un changement de schéma). Génère un token par participant
-- (mentor ET mentoré) pour chaque binôme actif hors tests.
-- ============================================================================

-- Durée de validité des liens : 30 jours. Ajuster si besoin.
with active_pairs as (
  select id as binome_id, mentor_email, mentore_name, mentor_name, mentore_email
  from public.binome
  where status = 'active' and is_test = false
),
new_tokens as (
  insert into public.review_tokens (token, participant_email, role, binome_id, expires_at)
  select
    encode(gen_random_bytes(32), 'hex'),
    mentor_email,
    'mentor',
    binome_id,
    now() + interval '30 days'
  from active_pairs
  union all
  select
    encode(gen_random_bytes(32), 'hex'),
    mentore_email,
    'mentore',
    binome_id,
    now() + interval '30 days'
  from active_pairs
  returning id, token, participant_email, role, binome_id
)
-- Liste exportable : nom, rôle, email, téléphone, lien à envoyer.
-- Copier le résultat (clic droit > Export CSV dans l'éditeur SQL Supabase).
select
  case when nt.role = 'mentor' then m1.full_name else m2.full_name end as full_name,
  nt.role,
  nt.participant_email as email,
  coalesce(m1.phone, m2.phone) as phone,
  concat('https://passerelles.vercel.app/bilan/', nt.token) as review_link,
  nt.binome_id
from new_tokens nt
left join public.mentor m1 on m1.email = nt.participant_email and nt.role = 'mentor'
left join public.mentore m2 on m2.email = nt.participant_email and nt.role = 'mentore'
order by nt.role, full_name;
