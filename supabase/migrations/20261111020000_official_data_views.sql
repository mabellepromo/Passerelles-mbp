-- ============================================================================
-- Phase 2 (2/6) — Vues de données filtrées, toutes construites sur
-- official_binomes. Aucune ne recopie le filtre is_test : il vient de la
-- jointure avec la vue socle.
--
-- Ce sont de NOUVELLES vues : aucun écran existant n'est modifié par cette
-- migration. Aucune table, aucune colonne, aucune donnée n'est modifiée.
-- ============================================================================

-- 1. Fiches de séance ---------------------------------------------------------
-- Colonnes ajoutées par rapport à la table suivi_mensuel :
--   cohorte                     : cohorte du binôme
--   author_satisfaction         : LA note de satisfaction retenue (décision du
--                                 11/11/2026) = la note de l'AUTEUR de la fiche.
--                                   submitted_by = 'mentore' -> satisfaction_mentore
--                                   submitted_by = 'mentor'  -> satisfaction_mentor
--                                   autre valeur ou vide     -> null (on ne devine pas)
--   author_satisfaction_excluded : true si la fiche est exclue du calcul de
--                                 satisfaction (auteur vide/ambigu ou note absente).
-- Les colonnes satisfaction_mentor / satisfaction_mentore restent visibles
-- (écrans existants) mais ne doivent plus servir à calculer une moyenne.
create or replace view public.official_suivis as
select
  s.*,
  b.cohorte,
  case
    when s.submitted_by = 'mentore' then s.satisfaction_mentore
    when s.submitted_by = 'mentor' then s.satisfaction_mentor
    else null
  end as author_satisfaction,
  (case
    when s.submitted_by = 'mentore' then s.satisfaction_mentore
    when s.submitted_by = 'mentor' then s.satisfaction_mentor
    else null
  end) is null as author_satisfaction_excluded
from public.suivi_mensuel s
join public.official_binomes b on b.id = s.binome_id;

-- 2. Journal de bord (contient les objectifs : type = 'objectif') -------------
create or replace view public.official_journal as
select j.*, b.cohorte
from public.journal_de_bord j
join public.official_binomes b on b.id = j.binome_id;

-- 3. Messagerie des binômes ---------------------------------------------------
-- La jointure écarte aussi les messages du formulaire de contact
-- (binome_id = 'contact_form' / 'contact_reply'), qui ne sont pas des
-- messages de binôme.
create or replace view public.official_messages as
select m.*, b.cohorte
from public.message m
join public.official_binomes b on b.id = m.binome_id;

-- 4. Bilans finaux (table vide aujourd'hui, vue prête pour les exports) -------
create or replace view public.official_bilans_finaux as
select f.*, b.cohorte
from public.bilan_final f
join public.official_binomes b on b.id = f.binome_id;

-- 5. Sondage : réponses, liens, journal d'emails ------------------------------
create or replace view public.official_review_responses as
select rr.*, b.cohorte
from public.review_responses rr
join public.official_binomes b on b.id = rr.binome_id;

create or replace view public.official_review_tokens as
select rt.*, b.cohorte
from public.review_tokens rt
join public.official_binomes b on b.id = rt.binome_id;

-- Les emails sans lien (ex. email de test envoyé à l'admin) sont écartés par
-- la jointure : ils ne concernent aucun binôme officiel.
create or replace view public.official_review_email_log as
select l.*, rt.binome_id
from public.review_email_log l
join public.official_review_tokens rt on rt.id = l.token_id;

-- Sécurité : chaque vue respecte la RLS des tables sous-jacentes pour
-- l'utilisateur connecté, et n'est pas accessible aux visiteurs anonymes.
alter view public.official_suivis set (security_invoker = on);
alter view public.official_journal set (security_invoker = on);
alter view public.official_messages set (security_invoker = on);
alter view public.official_bilans_finaux set (security_invoker = on);
alter view public.official_review_responses set (security_invoker = on);
alter view public.official_review_tokens set (security_invoker = on);
alter view public.official_review_email_log set (security_invoker = on);

revoke all on
  public.official_suivis, public.official_journal, public.official_messages,
  public.official_bilans_finaux, public.official_review_responses,
  public.official_review_tokens, public.official_review_email_log
from anon;

grant select on
  public.official_suivis, public.official_journal, public.official_messages,
  public.official_bilans_finaux, public.official_review_responses,
  public.official_review_tokens, public.official_review_email_log
to authenticated, service_role;
