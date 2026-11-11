// src/lib/programData.js
// ============================================================================
// SOURCE UNIQUE des données du programme pour le dashboard admin.
//
// RÈGLE D'EXCLUSION : le binôme de test ne doit apparaître dans aucun écran
// ni aucun export. Le filtre "is_test = false" n'existe qu'à UN endroit : la
// vue SQL "official_binomes". Toutes les vues lues ici partent d'elle.
//
// => Dans un composant, ne lis JAMAIS directement les tables binome,
//    suivi_mensuel, journal_de_bord, message, bilan_final, review_responses
//    ou review_tokens pour afficher ou exporter des données. Passe par les
//    fonctions de ce fichier. (Les écritures — créer, modifier, supprimer —
//    continuent d'aller sur les tables.)
// ============================================================================

import { supabase } from '@/api/base44Client';

// Nombre de binômes officiels attendu pour la cohorte 1.
// Si le nombre réel est différent, les écrans affichent un avertissement.
export const EXPECTED_BINOME_COUNT = 11;

// Petite fonction commune : lit une vue entière, avec un tri optionnel.
// orderBy suit la convention du projet : '-colonne' = tri décroissant.
async function readView(viewName, orderBy = null, limit = 1000) {
  let query = supabase.from(viewName).select('*').limit(limit);
  if (orderBy) {
    const column = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
    query = query.order(column, { ascending: !orderBy.startsWith('-') });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ----------------------------------------------------------------------------
// Données de base (une ligne = un enregistrement, binôme test exclu)
// ----------------------------------------------------------------------------

// Les binômes officiels (attendu : 11).
export const fetchOfficialBinomes = (orderBy = '-created_date') =>
  readView('official_binomes', orderBy);

// Les fiches de séance. Chaque fiche porte en plus :
//   author_satisfaction          : note de l'auteur de la fiche (seule note retenue)
//   author_satisfaction_excluded : true si la fiche est exclue du calcul
export const fetchOfficialSuivis = (orderBy = '-created_date') =>
  readView('official_suivis', orderBy);

// Le journal de bord (les objectifs sont les entrées de type 'objectif').
export const fetchOfficialJournal = (orderBy = '-date_entree') =>
  readView('official_journal', orderBy);

// Les messages échangés dans les binômes (hors formulaire de contact).
export const fetchOfficialMessages = (orderBy = '-created_date') =>
  readView('official_messages', orderBy);

// Les bilans finaux (table vide à ce jour).
export const fetchOfficialBilansFinaux = (orderBy = '-created_date') =>
  readView('official_bilans_finaux', orderBy);

// Les réponses au sondage, avec le nom du participant et du binôme.
export const fetchReviewResponses = (orderBy = '-submitted_at') =>
  readView('review_by_participant', orderBy);

// ----------------------------------------------------------------------------
// Indicateurs (définitions : voir src/lib/indicatorDefinitions.js)
// ----------------------------------------------------------------------------

// Une ligne par binôme : fiches, compteur, séances déclarées, NPS, vigilance, objectifs.
export const fetchBinomeOverview = () =>
  readView('official_binome_overview', 'mentor_name');

// Une seule ligne : chiffres clés du sondage (réponses, taux, NPS).
export async function fetchSurveySummary() {
  const rows = await readView('official_survey_summary');
  return rows[0] ?? null;
}

// Une seule ligne : satisfaction déclarée dans les fiches (note de l'auteur).
export async function fetchFicheSatisfaction() {
  const rows = await readView('official_fiche_satisfaction');
  return rows[0] ?? null;
}

// ----------------------------------------------------------------------------
// Garde-fou et aides de calcul
// ----------------------------------------------------------------------------

// Renvoie null si tout va bien, sinon le message d'avertissement à afficher.
// À appeler avec le nombre de binômes réellement analysés.
export function getBinomeCountWarning(binomeCount) {
  if (binomeCount === EXPECTED_BINOME_COUNT) return null;
  return `Attention : ${binomeCount} binôme(s) analysé(s) au lieu de ${EXPECTED_BINOME_COUNT} attendus. `
    + 'Les chiffres affichés ne sont pas fiables tant que cet écart n\'est pas expliqué.';
}

// Note de satisfaction d'une fiche = note de son AUTEUR (décision du 11/11/2026).
// On n'utilise plus la moyenne des colonnes satisfaction_mentor et
// satisfaction_mentore : la plupart des fiches sont saisies par le mentoré,
// et la case "mentor" est préremplie à 4.
// Renvoie 0 si la fiche est exclue (auteur vide ou ambigu), comme le faisaient
// déjà les écrans existants pour une note absente.
export function ficheSatisfaction(suivi) {
  return suivi?.author_satisfaction || 0;
}
