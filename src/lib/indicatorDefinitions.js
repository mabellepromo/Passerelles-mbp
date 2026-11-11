// src/lib/indicatorDefinitions.js
// ============================================================================
// DÉFINITION UNIQUE de chaque indicateur du programme.
// Ce fichier sert de référence aux écrans et sera repris tel quel dans
// l'annexe « Définition des indicateurs » du rapport de bilan.
//
// Pour chaque indicateur :
//   label   : nom affiché
//   formula : comment il est calculé
//   source  : vue SQL (et colonne) d'où vient le chiffre -> traçabilité
//   period  : période couverte
//
// Toutes les sources partent de la vue official_binomes (binôme test exclu).
// ============================================================================

const WHOLE_COHORT = 'Cohorte 1, du 5 mai 2026 à la date d\'édition';
const SURVEY_PERIOD = 'Sondage bilan de novembre 2026 (clos le 9 novembre 2026)';

export const INDICATOR_DEFINITIONS = {
  binomes_count: {
    label: 'Binômes analysés',
    formula: 'Nombre de binômes officiels (hors binôme de test).',
    source: 'official_survey_summary.binomes_count',
    period: WHOLE_COHORT,
  },
  response_rate: {
    label: 'Taux de réponse au sondage',
    formula: 'Répondants / personnes invitées, par rôle. Une personne invitée = un binôme et un rôle ayant reçu au moins un lien.',
    source: 'official_survey_summary (mentor_responses / mentors_invited, mentore_responses / mentores_invited)',
    period: SURVEY_PERIOD,
  },
  pairs_with_both_responses: {
    label: 'Binômes avec les deux réponses',
    formula: 'Nombre de binômes dont le mentor ET le mentoré ont répondu au sondage.',
    source: 'official_survey_summary.pairs_with_both_responses',
    period: SURVEY_PERIOD,
  },
  nps: {
    label: 'NPS (recommandation du programme)',
    formula: 'Part des promoteurs (notes 9-10) moins part des détracteurs (notes 0-6), sur l\'ensemble des réponses. Toujours présenté avec la répartition promoteurs / passifs / détracteurs.',
    source: 'official_survey_summary (nps_promoters, nps_passives, nps_detractors, nps_answers, nps_score)',
    period: SURVEY_PERIOD,
  },
  likert_by_question: {
    label: 'Questions notées (1 à 5), par rôle',
    formula: 'Moyenne et répartition des notes de chaque question, séparément pour les mentors et les mentorés.',
    source: 'fonction build_review_report_metrics, clé likert_by_question',
    period: SURVEY_PERIOD,
  },
  pair_gaps: {
    label: 'Écart mentor / mentoré au sein des binômes',
    formula: 'Pour chaque question commune, moyenne de l\'écart absolu entre la note du mentor et celle du mentoré, sur les binômes où les deux ont répondu.',
    source: 'fonction build_review_report_metrics, clé pair_gaps',
    period: SURVEY_PERIOD,
  },
  vigilance: {
    label: 'Niveau de vigilance d\'un binôme',
    formula: 'Rouge : une note de recommandation inférieure ou égale à 6, ou un écart de 4 points ou plus entre mentor et mentoré. Orange : une note de 7 ou 8. Vert : sinon. En attente : aucune réponse.',
    source: 'review_pair_vigilance.vigilance (repris dans official_binome_overview)',
    period: SURVEY_PERIOD,
  },
  fiche_satisfaction: {
    label: 'Satisfaction déclarée dans les fiches de séance',
    formula: 'Moyenne de la note de l\'auteur de chaque fiche (note du mentoré si le mentoré a saisi la fiche, note du mentor si c\'est le mentor), sur 5. Les fiches sans auteur identifié sont exclues. Cette note reflète surtout le point de vue des mentorés ; la satisfaction des mentors est mesurée par le sondage.',
    source: 'official_fiche_satisfaction (avg_author_satisfaction, fiches_rated, fiches_excluded)',
    period: WHOLE_COHORT,
  },
  objectives: {
    label: 'Objectifs suivis dans le journal de bord',
    formula: 'Nombre d\'entrées de type « objectif » dans le journal de bord, et nombre d\'entre elles au statut « atteint ».',
    source: 'official_binome_overview (objectives_count, objectives_reached_count)',
    period: WHOLE_COHORT,
  },
  // Nombre de séances : AUCUNE règle retenue pour l'instant (décision du
  // 11/11/2026). Les trois chiffres bruts sont présentés côte à côte.
  sessions_raw_sources: {
    label: 'Séances : trois sources brutes (aucun indicateur calculé)',
    formula: 'Présentation côte à côte, sans arbitrage : nombre de fiches enregistrées, compteur du binôme, tranche déclarée dans le sondage par le mentor et par le mentoré.',
    source: 'official_binome_overview (fiches_count, counter_total_meetings, sessions_declared_mentor, sessions_declared_mentore)',
    period: WHOLE_COHORT,
  },
};
