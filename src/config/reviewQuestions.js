// Définitions des questions du bilan PASSERELLES, par rôle.
// {pairFirstName} est remplacé dynamiquement par le prénom du binôme au rendu.

export const REVIEW_SECTIONS = [
  'Engagement',
  'Relation',
  'Objectifs',
  'Apports',
  'Organisation',
  'Satisfaction',
  'Pour conclure',
];

export const mentorQuestions = [
  { id: 'sessions_count', section: 'Engagement', type: 'select', required: true,
    label: 'Combien de sessions as-tu eues avec {pairFirstName} depuis le début du programme ?',
    options: ['0-1', '2-3', '4-5', '6 et plus'] },
  { id: 'sessions_regularity', section: 'Engagement', type: 'likert', required: true,
    label: 'As-tu réussi à maintenir un rythme mensuel régulier avec {pairFirstName} ?' },
  { id: 'engagement_mentee', section: 'Engagement', type: 'likert', required: true,
    label: 'Comment évalues-tu l\'engagement de {pairFirstName} dans la relation de mentorat ?' },

  { id: 'relationship_quality', section: 'Relation', type: 'likert', required: true,
    label: 'Comment évalues-tu ta relation avec {pairFirstName} ?' },
  { id: 'communication_ease', section: 'Relation', type: 'likert', required: true,
    label: 'La communication avec {pairFirstName} a-t-elle été facile et fluide ?' },

  { id: 'objectives_achieved', section: 'Objectifs', type: 'likert', required: true,
    label: 'Dans quelle mesure les objectifs fixés avec {pairFirstName} ont-ils été atteints ?' },
  { id: 'objectives_comment', section: 'Objectifs', type: 'text', required: false,
    label: 'Précise ce qui a aidé ou freiné l\'atteinte de ces objectifs (facultatif).' },

  { id: 'contribution_type', section: 'Apports', type: 'multi-select', required: true,
    label: 'Qu\'as-tu apporté concrètement à {pairFirstName} ?',
    options: ['Compétences juridiques', 'Réseau professionnel', 'Orientation de carrière', 'Opportunités (stage, emploi)', 'Soutien moral/confiance en soi', 'Autre'] },
  { id: 'own_benefit', section: 'Apports', type: 'likert', required: true,
    label: 'En tant que mentor, dans quelle mesure cette expérience t\'a-t-elle été bénéfique à toi aussi ?' },

  { id: 'platform_ease', section: 'Organisation', type: 'likert', required: true,
    label: 'La plateforme PASSERELLES est-elle simple à utiliser ?' },
  { id: 'monthly_forms_burden', section: 'Organisation', type: 'likert', required: true,
    label: 'Les formulaires de suivi mensuel représentent-ils une charge administrative raisonnable ?' },
  { id: 'whatsapp_adequacy', section: 'Organisation', type: 'likert', required: true,
    label: 'WhatsApp est-il un canal adapté pour échanger avec {pairFirstName} ?' },

  { id: 'nps', section: 'Satisfaction', type: 'nps', required: true,
    label: 'Sur une échelle de 0 à 10, recommanderais-tu le programme PASSERELLES à un autre professionnel du droit ?' },
  { id: 'strengths', section: 'Satisfaction', type: 'text', required: true,
    label: 'Qu\'est-ce qui a le mieux fonctionné dans ton expérience de mentorat ?' },
  { id: 'improvements', section: 'Satisfaction', type: 'text', required: true,
    label: 'Qu\'est-ce qui pourrait être amélioré dans le programme ?' },

  { id: 'suggestions', section: 'Pour conclure', type: 'text', required: false,
    label: 'As-tu des suggestions pour améliorer le programme ? (facultatif)' },
  { id: 'quote_consent', section: 'Pour conclure', type: 'select', required: true,
    label: 'Acceptes-tu que certaines de tes réponses soient citées dans les communications de Ma Belle Promo ?',
    options: [
      { value: 'none', label: 'Non, pas de citation' },
      { value: 'first_name', label: 'Oui, avec mon prénom uniquement' },
      { value: 'full_name', label: 'Oui, avec mon nom complet' },
    ] },
];

export const mentoreQuestions = [
  { id: 'sessions_count', section: 'Engagement', type: 'select', required: true,
    label: 'Combien de sessions as-tu eues avec {pairFirstName} depuis le début du programme ?',
    options: ['0-1', '2-3', '4-5', '6 et plus'] },
  { id: 'sessions_regularity', section: 'Engagement', type: 'likert', required: true,
    label: 'Le rythme mensuel des sessions avec {pairFirstName} a-t-il été respecté ?' },
  { id: 'mentor_availability', section: 'Engagement', type: 'likert', required: true,
    label: 'Comment évalues-tu la disponibilité de {pairFirstName} pour toi ?' },

  { id: 'relationship_quality', section: 'Relation', type: 'likert', required: true,
    label: 'Comment évalues-tu ta relation avec {pairFirstName} ?' },
  { id: 'trust_level', section: 'Relation', type: 'likert', required: true,
    label: 'À quel point te sens-tu à l\'aise pour échanger ouvertement avec {pairFirstName} ?' },

  { id: 'objectives_achieved', section: 'Objectifs', type: 'likert', required: true,
    label: 'Dans quelle mesure les objectifs fixés avec {pairFirstName} ont-ils été atteints ?' },
  { id: 'objectives_comment', section: 'Objectifs', type: 'text', required: false,
    label: 'Précise ce qui a aidé ou freiné l\'atteinte de ces objectifs (facultatif).' },

  { id: 'contribution_received', section: 'Apports', type: 'multi-select', required: true,
    label: 'Qu\'est-ce que {pairFirstName} t\'a apporté concrètement ?',
    options: ['Compétences juridiques', 'Réseau professionnel', 'Orientation de carrière', 'Opportunités (stage, emploi)', 'Soutien moral/confiance en soi', 'Autre'] },
  { id: 'career_clarity', section: 'Apports', type: 'likert', required: true,
    label: 'Te sens-tu plus clair·e sur ton orientation professionnelle depuis le début du mentorat ?' },

  { id: 'platform_ease', section: 'Organisation', type: 'likert', required: true,
    label: 'La plateforme PASSERELLES est-elle simple à utiliser ?' },
  { id: 'monthly_forms_burden', section: 'Organisation', type: 'likert', required: true,
    label: 'Les formulaires de suivi mensuel représentent-ils une charge raisonnable ?' },
  { id: 'whatsapp_adequacy', section: 'Organisation', type: 'likert', required: true,
    label: 'WhatsApp est-il un canal adapté pour échanger avec {pairFirstName} ?' },

  { id: 'nps', section: 'Satisfaction', type: 'nps', required: true,
    label: 'Sur une échelle de 0 à 10, recommanderais-tu le programme PASSERELLES à un autre étudiant en droit ?' },
  { id: 'strengths', section: 'Satisfaction', type: 'text', required: true,
    label: 'Qu\'est-ce qui a le mieux fonctionné dans ton expérience de mentorat ?' },
  { id: 'improvements', section: 'Satisfaction', type: 'text', required: true,
    label: 'Qu\'est-ce qui pourrait être amélioré dans le programme ?' },

  { id: 'suggestions', section: 'Pour conclure', type: 'text', required: false,
    label: 'As-tu des suggestions pour améliorer le programme ? (facultatif)' },
  { id: 'quote_consent', section: 'Pour conclure', type: 'select', required: true,
    label: 'Acceptes-tu que certaines de tes réponses soient citées dans les communications de Ma Belle Promo ?',
    options: [
      { value: 'none', label: 'Non, pas de citation' },
      { value: 'first_name', label: 'Oui, avec mon prénom uniquement' },
      { value: 'full_name', label: 'Oui, avec mon nom complet' },
    ] },
];

export function getQuestionsForRole(role) {
  return role === 'mentor' ? mentorQuestions : mentoreQuestions;
}

export function interpolateLabel(label, pairFirstName) {
  return label.replace('{pairFirstName}', pairFirstName || 'ton binôme');
}
