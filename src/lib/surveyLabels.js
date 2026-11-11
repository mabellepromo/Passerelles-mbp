// src/lib/surveyLabels.js
// Libellés courts des questions du sondage de bilan, partagés par les écrans
// et par le PDF du rapport. Les identifiants sont les clés du jsonb
// review_responses.answers.

// Libellés courts des questions notées de 1 à 5 (identifiants = clés du jsonb answers).
export const QUESTION_LABELS = {
  relationship_quality: 'Qualité de la relation',
  sessions_regularity: 'Régularité des sessions (déclarée)',
  objectives_achieved: 'Atteinte des objectifs',
  platform_ease: 'Simplicité de la plateforme',
  whatsapp_adequacy: 'WhatsApp adapté aux échanges',
  monthly_forms_burden: 'Charge raisonnable des fiches mensuelles',
  communication_ease: 'Facilité de communication',
  engagement_mentee: 'Engagement du mentoré',
  own_benefit: 'Bénéfice pour le mentor',
  career_clarity: 'Clarté de l\'orientation professionnelle',
  mentor_availability: 'Disponibilité du mentor',
  trust_level: 'Niveau de confiance',
};

// Questions posées aux deux rôles (comparables), puis propres à chaque rôle.
export const COMMON_QUESTIONS = [
  'relationship_quality', 'sessions_regularity', 'objectives_achieved',
  'platform_ease', 'whatsapp_adequacy', 'monthly_forms_burden',
];
export const MENTOR_ONLY_QUESTIONS = ['communication_ease', 'engagement_mentee', 'own_benefit'];
export const MENTORE_ONLY_QUESTIONS = ['career_clarity', 'mentor_availability', 'trust_level'];
