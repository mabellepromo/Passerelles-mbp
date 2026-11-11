// src/lib/reportContent.js
// Textes et chiffres du rapport de bilan qui NE viennent PAS de l'IA :
// présentation du programme, méthodologie, limites, chiffres clés.
// Ils sont construits à partir des données enregistrées avec le rapport
// (report.metrics et report.metrics.snapshot), jamais saisis à la main.
//
// Règles appliquées ici :
//   - toujours l'effectif avec le pourcentage (« 7/11 (64 %) ») ;
//   - aucun chiffre sur le nombre de séances (décision du 11/11/2026) ;
//   - si une information manque : « donnée non disponible » ;
//   - aucune phrase ne dit que le programme continuera ou s'arrêtera.

export const PROGRAM = {
  name: 'PASSERELLES',
  association: 'Association Ma Belle Promo (MBP)',
  cohort: 'Cohorte 1',
  startDateLabel: '5 mai 2026',
};

export const NOT_AVAILABLE = 'donnée non disponible';

export function formatDateFr(value) {
  if (!value) return NOT_AVAILABLE;
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// « 7/11 (64 %) »
export function share(count, total) {
  if (count === null || count === undefined || !total) return NOT_AVAILABLE;
  return `${count}/${total} (${Math.round((count / total) * 100)} %)`;
}

// Nombre à la française : 4.25 -> « 4,25 »
export function num(value, digits = 1) {
  if (value === null || value === undefined) return NOT_AVAILABLE;
  return Number(value).toFixed(digits).replace('.', ',');
}

// Un rapport généré avant la refonte n'a pas de photographie des données.
export function isReportUsable(report) {
  return Boolean(report?.metrics?.snapshot?.survey_summary && report?.ai_analysis?.conclusion);
}

// ----------------------------------------------------------------------------
// Section 3 — Présentation du programme (textes repris des pages du site)
// ----------------------------------------------------------------------------
export function buildPresentation(report) {
  const snap = report.metrics.snapshot;
  const s = snap.survey_summary;
  const places = snap.mentor_places || [];
  const applications = snap.applications || {};

  return {
    context: [
      'PASSERELLES est une initiative de l\'Association Ma Belle Promo (MBP) visant à accompagner des étudiants en droit des universités togolaises — Université de Lomé, Université de Kara et établissements privés — dans leur épanouissement académique, professionnel et personnel.',
      'Ma Belle Promo est l\'association des diplômés de la Faculté de Droit de Lomé. Elle met à disposition les expériences, compétences et réseaux de ses membres au profit des étudiants et futurs diplômés.',
    ],
    objectives: [
      'Relier ambitions et opportunités : créer des passerelles durables entre les talents et les opportunités.',
      'Mettre chaque étudiant retenu en relation avec un professionnel du droit, au sein d\'un binôme mentor / mentoré.',
      'Proposer un cadre de suivi : objectifs fixés en binôme, rencontres régulières (le programme recommande au minimum une rencontre par mois) et fiches de suivi sur la plateforme.',
    ],
    audience: [
      `Mentorés : étudiants en droit (L3, M1, M2). ${applications.mentores ?? NOT_AVAILABLE} candidatures reçues, ${s.binomes_count} mentorés retenus.`,
      `Mentors : professionnels du droit. ${applications.mentors ?? NOT_AVAILABLE} candidatures reçues, ${s.binomes_count} mentors engagés dans un binôme.`,
      `${s.binomes_count} binômes constitués pour la ${PROGRAM.cohort.toLowerCase()}, lancée le ${PROGRAM.startDateLabel}.`,
    ],
    // Lieu de résidence déclaré par les mentors à l'inscription.
    mentorPlaces: places.length
      ? places.map((p) => `${p.place} : ${p.count}`)
      : [NOT_AVAILABLE],
  };
}

// ----------------------------------------------------------------------------
// Section 4 — Méthodologie
// ----------------------------------------------------------------------------
export function buildMethodology(report) {
  const m = report.metrics;
  const snap = m.snapshot;
  const s = snap.survey_summary;
  const campaign = snap.campaign;
  const fiches = snap.fiche_satisfaction || {};
  const binomes = snap.binomes || [];
  const binomesWithObjectives = binomes.filter((b) => b.objectives_count > 0).length;
  const missingMentors = s.mentors_invited - s.mentor_responses;
  const missingMentores = s.mentores_invited - s.mentore_responses;
  const onePointWeight = s.nps_answers ? Math.round(100 / s.nps_answers) : null;

  const limits = [
    `${missingMentors} mentor(s) sur ${s.mentors_invited} et ${missingMentores} mentoré(s) sur ${s.mentores_invited} n'ont pas répondu au sondage : leur point de vue est absent des résultats.`,
    'Une partie des séances n\'ayant pas été enregistrée sur la plateforme, le nombre de séances n\'est pas présenté. Les réponses du sondage sur le nombre et la régularité des sessions sont des déclarations des participants, pas un comptage.',
    `Les résultats reposent sur ${s.responses_total} réponses : chaque réponse pèse lourd${onePointWeight ? ` (une seule réponse déplace le NPS d'environ ${onePointWeight} points)` : ''}. Les chiffres sont à lire comme des tendances.`,
    `Seuls ${share(binomesWithObjectives, binomes.length)} binômes ont saisi des objectifs sur la plateforme : pour les autres, l'atteinte des objectifs n'est connue que par le sondage.`,
    'Le contenu des fiches de séance (objectifs abordés, difficultés) a nourri l\'analyse qualitative. Il ne provient que d\'une partie des binômes et n\'est pas représentatif de l\'ensemble.',
  ];

  if (fiches.rated > 0) {
    limits.push(
      `Satisfaction déclarée dans les fiches de séance : la note retenue est celle de l'auteur de la fiche. Elle reflète surtout le point de vue des mentorés (${fiches.by_mentore} fiche(s) sur ${fiches.rated}) et ne mesure pas la satisfaction des mentors, qui vient du sondage.`
      + (fiches.all_notes_identical
        ? ` Toutes les notes sont égales à ${fiches.single_value}/5, soit la valeur préremplie du formulaire : cette note n'est donc pas interprétée dans ce rapport.`
        : ''),
    );
  }

  return {
    sources: [
      'Sondage de bilan en ligne adressé aux mentors et aux mentorés (questions notées de 1 à 5, note de recommandation de 0 à 10, questions à choix et réponses libres).',
      'Données de la plateforme PASSERELLES : binômes, journal de bord (objectifs), fiches de séance (contenu qualitatif uniquement).',
      'Analyse qualitative des réponses libres assistée par un outil d\'intelligence artificielle, sur des données pseudonymisées, puis relue et validée par la coordination.',
    ],
    period: [
      `Programme : du ${PROGRAM.startDateLabel} au ${formatDateFr(report.generated_at)} (date d'extraction des données).`,
      campaign
        ? `Sondage « ${campaign.name} » : ouvert le ${formatDateFr(campaign.launched_at)}, clos le ${formatDateFr(campaign.deadline)}.`
        : `Sondage : ${NOT_AVAILABLE}.`,
    ],
    responseRate: [
      `Mentors : ${share(s.mentor_responses, s.mentors_invited)} ont répondu.`,
      `Mentorés : ${share(s.mentore_responses, s.mentores_invited)} ont répondu.`,
      `Binômes dont le mentor et le mentoré ont tous deux répondu : ${share(s.pairs_with_both_responses, s.binomes_count)}.`,
    ],
    exclusion: `Un binôme de test, créé pour vérifier la plateforme, est exclu de tous les calculs, graphiques, listes et verbatims. L'analyse porte sur les ${s.binomes_count} binômes officiels.`,
    limits,
  };
}

// ----------------------------------------------------------------------------
// Section 5 — Chiffres clés (chaque chiffre porte sa source)
// ----------------------------------------------------------------------------
export function buildKeyFigures(report) {
  const snap = report.metrics.snapshot;
  const s = snap.survey_summary;
  const binomes = snap.binomes || [];
  const objectivesTotal = binomes.reduce((sum, b) => sum + (b.objectives_count || 0), 0);
  const objectivesReached = binomes.reduce((sum, b) => sum + (b.objectives_reached_count || 0), 0);
  const binomesWithObjectives = binomes.filter((b) => b.objectives_count > 0).length;
  const invited = s.mentors_invited + s.mentores_invited;

  return [
    { label: 'Binômes', value: String(s.binomes_count), detail: 'binômes officiels', source: 'official_survey_summary.binomes_count' },
    { label: 'Réponses au sondage', value: `${s.responses_total}/${invited}`, detail: `${share(s.responses_total, invited)} des personnes invitées`, source: 'official_survey_summary.responses_total' },
    { label: 'Mentors répondants', value: `${s.mentor_responses}/${s.mentors_invited}`, detail: share(s.mentor_responses, s.mentors_invited), source: 'official_survey_summary.mentor_responses' },
    { label: 'Mentorés répondants', value: `${s.mentore_responses}/${s.mentores_invited}`, detail: share(s.mentore_responses, s.mentores_invited), source: 'official_survey_summary.mentore_responses' },
    { label: 'Binômes complets', value: `${s.pairs_with_both_responses}/${s.binomes_count}`, detail: 'mentor et mentoré ont répondu', source: 'official_survey_summary.pairs_with_both_responses' },
    {
      label: 'Recommandation (NPS)',
      value: `${s.nps_promoters} / ${s.nps_passives} / ${s.nps_detractors}`,
      detail: `promoteurs / passifs / détracteurs sur ${s.nps_answers} réponses (NPS ${s.nps_score > 0 ? '+' : ''}${s.nps_score})`,
      source: 'official_survey_summary (nps_*)',
    },
    {
      label: 'Objectifs saisis sur la plateforme',
      value: objectivesTotal > 0 ? `${objectivesReached}/${objectivesTotal}` : NOT_AVAILABLE,
      detail: `objectif(s) atteint(s) ; saisis par ${share(binomesWithObjectives, binomes.length)} binômes`,
      source: 'official_binome_overview (objectives_*)',
    },
  ];
}

// Répartition des binômes par niveau de vigilance (version externe : sans nom).
export function countVigilance(report) {
  const binomes = report.metrics.snapshot.binomes || [];
  const levels = [
    ['rouge', 'Prioritaire'],
    ['orange', 'À surveiller'],
    ['vert', 'Sans alerte'],
    ['en_attente', 'Aucune réponse au sondage'],
  ];
  return levels.map(([level, label]) => ({
    level,
    label,
    count: binomes.filter((b) => (b.vigilance || 'en_attente') === level).length,
    total: binomes.length,
  }));
}

export const VIGILANCE_LABEL = {
  rouge: 'Prioritaire',
  orange: 'À surveiller',
  vert: 'Sans alerte',
  en_attente: 'Aucune réponse',
};

export const VERBATIM_FIELD_LABEL = {
  strengths: 'Ce qui a le mieux fonctionné',
  improvements: 'Ce qui pourrait être amélioré',
  objectives_comment: 'Atteinte des objectifs',
  suggestions: 'Suggestions',
};
