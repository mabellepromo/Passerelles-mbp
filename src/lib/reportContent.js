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
  // Fuseau du Togo (UTC) : la date limite du sondage (9 nov. 23h59 UTC) ne doit pas
  // devenir le 10 novembre sur un ordinateur réglé à l'heure de Paris.
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lome' });
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
    'Une partie des séances n\'ayant pas été enregistrée sur la plateforme, le nombre de séances n\'est pas présenté. Les réponses du sondage sur le nombre et la régularité des sessions sont des déclarations des participants, pas un comptage. Un suivi plus léger, qui n\'aurait de sens que si une cohorte 2 avait lieu, est présenté dans les recommandations (section 9) : il améliorerait la documentation du parcours, pas la disponibilité des mentors.',
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

// ----------------------------------------------------------------------------
// Section 8 — Le suivi entre les séances
// Constats chiffrés sur la plateforme, les fiches mensuelles et WhatsApp,
// construits à partir des données enregistrées avec le rapport. Aucun nombre
// de séances. La lecture rédigée (modifiable) est ai_analysis.follow_up_summary.
// ----------------------------------------------------------------------------

// Fait rapporté par la coordination (absent des données) : pendant la
// campagne du sondage de bilan, des relances ont aussi été envoyées par WhatsApp.
export const SURVEY_WHATSAPP_REMINDERS = 'entre le 4 et le 10 novembre 2026';

// Formulaire de fiche de séance de la cohorte 1 (page « Suivi mensuel »).
const FICHE_FORM_SIZE = 'une vingtaine de champs par séance, dont 7 obligatoires';

// Effectifs « défavorables » (1-2), neutres (3) et « favorables » (4-5)
// d'une question notée, pour un rôle ou pour les deux.
function likertSplit(report, questionId, role = null) {
  const rows = (report.metrics.likert_by_question || [])
    .filter((l) => l.question_id === questionId && (!role || l.role === role));
  if (!rows.length) return null;
  const count = (keys) => rows.reduce((s, l) => s + keys.reduce((t, k) => t + Number(l.distribution?.[k] ?? 0), 0), 0);
  return { low: count(['1', '2']), mid: count(['3']), high: count(['4', '5']), n: rows.reduce((s, l) => s + Number(l.n || 0), 0) };
}

const dayFr = (isoDay) => (isoDay ? formatDateFr(`${isoDay}T12:00:00Z`) : NOT_AVAILABLE);

export function buildFollowUp(report) {
  const fu = report.metrics.snapshot?.follow_up;
  const ease = likertSplit(report, 'platform_ease');
  const burden = likertSplit(report, 'monthly_forms_burden');
  const whatsapp = likertSplit(report, 'whatsapp_adequacy');
  if (!fu || !ease || !burden || !whatsapp) return null;
  const by = (q, role, key) => {
    const r = likertSplit(report, q, role);
    return r ? share(r[key], r.n) : NOT_AVAILABLE;
  };

  const impact = report.metrics.platform_impact_distribution || [];
  const impactAnswers = impact.reduce((s, r) => s + Number(r.n || 0), 0);
  const impactYes = impact.filter((r) => r.bucket === 'Oui' || r.bucket === 'Partiellement').reduce((s, r) => s + Number(r.n || 0), 0);

  const links = fu.survey_links || {};
  const s = report.metrics.snapshot.survey_summary;
  const lastReminder = (links.reminder_days || []).slice(-1)[0];

  return {
    platform: `La plateforme a été jugée difficile à utiliser (note de 1 ou 2 sur 5) par ${share(ease.low, ease.n)} répondants — ${by('platform_ease', 'mentor', 'low')} des mentors et ${by('platform_ease', 'mentore', 'low')} des mentorés — et simple (4 ou 5) par ${share(ease.high, ease.n)} ; ${ease.mid} restent neutres.`
      + (impactAnswers ? ` À la question facultative, ${share(impactYes, impactAnswers)} répondants estiment qu'elle a gêné, au moins en partie, le fonctionnement de leur binôme.` : '')
      + (fu.platform_messages?.count
        ? ` Les ${fu.platform_messages.count} messages échangés par la messagerie de la plateforme datent tous de la période du ${dayFr(fu.platform_messages.first_day)} au ${dayFr(fu.platform_messages.last_day)}.`
        : ''),
    forms: `Les fiches de séance (${FICHE_FORM_SIZE}) ont été jugées une charge peu raisonnable (note de 1 ou 2) par ${share(burden.low, burden.n)} répondants — ${by('monthly_forms_burden', 'mentor', 'low')} des mentors et ${by('monthly_forms_burden', 'mentore', 'low')} des mentorés — et raisonnable (4 ou 5) par ${share(burden.high, burden.n)} ; ${burden.mid} restent neutres.`
      + ` ${share(fu.binomes_with_fiche, fu.binomes_total)} binômes ont rempli au moins une fiche.`
      + (fu.binomes_exchanges_few_fiches >= 2
        ? ' Plusieurs binômes qui décrivent des échanges suivis n\'en ont laissé aucune ou une seule, tandis qu\'une partie des binômes sans fiche n\'a pas démarré : l\'absence de fiche ne mesure donc pas l\'activité d\'un binôme, elle signale surtout un suivi incomplet.'
        : ''),
    whatsapp: `WhatsApp est jugé adapté aux échanges au sein du binôme (note de 4 ou 5) par ${share(whatsapp.high, whatsapp.n)} répondants — ${by('whatsapp_adequacy', 'mentor', 'high')} des mentors et ${by('whatsapp_adequacy', 'mentore', 'high')} des mentorés — et peu adapté (1 ou 2) par ${share(whatsapp.low, whatsapp.n)}. La question portait sur les échanges entre mentor et mentoré, pas sur les rappels envoyés par l'équipe.`,
    personalLink: links.sent
      ? `Le sondage de bilan a déjà fonctionné avec un lien personnel, sans identifiant ni mot de passe : ${share(links.answered, links.sent)} des personnes invitées ont répondu (mentors ${share(s.mentor_responses, s.mentors_invited)}, mentorés ${share(s.mentore_responses, s.mentores_invited)}), après ${links.invitations} invitations et ${links.reminders} relances par email.`
        + (links.responses_before_first_reminder !== null
          ? ` ${links.responses_before_first_reminder} réponses seulement sont arrivées avant la première relance.`
          : '')
        + (lastReminder && links.responses_from_last_reminder !== null
          ? ` ${links.responses_from_last_reminder} réponses sont arrivées à partir du ${dayFr(lastReminder)}, période pendant laquelle la coordination a aussi relancé les participants par WhatsApp (${SURVEY_WHATSAPP_REMINDERS}).`
          : '')
        + ' Les mentors ont moins répondu que les mentorés : le lien seul ne suffit pas, les relances comptent.'
      : null,
  };
}

// ----------------------------------------------------------------------------
// Binômes cités dans les principaux constats
// Un constat peut contenir des repères :
//   [[etat:active]] (ou limitee, non_etablie, inconnue) : la liste des binômes
//                   classés dans cet état ;
//   [[binome:<id>]] : un binôme précis.
// Version interne : remplacés par « Mentor / Mentoré ». Version externe : la
// liste disparaît et un binôme précis devient « un binôme » (aucun nom).
// ----------------------------------------------------------------------------
const pairLabel = (p) => `${p.mentor_name} / ${p.mentore_name}`;

export function renderBinomeMarkers(text, report, variant = 'internal') {
  if (typeof text !== 'string' || !text.includes('[[')) return text;
  const isInternal = variant === 'internal';
  const pairs = report.ai_analysis?.pair_status || [];
  const binomes = report.metrics?.snapshot?.binomes || [];
  // Version externe : une parenthèse qui ne contient que des binômes cités
  // disparaît entière (jamais « (un binôme, un binôme) »).
  const onlyPairs = /\s*\(\s*(?:\[\[binome:[^\]]+\]\]\s*(?:,|;|et)?\s*)+\)/g;
  return (isInternal ? text : text.replace(onlyPairs, ''))
    .replace(/\s*\[\[etat:([a-z_]+)\]\]/g, (_, status) => {
      if (!isInternal) return '';
      const names = pairs.filter((p) => p.status === status).map(pairLabel);
      return names.length ? ` (${names.join(' ; ')})` : '';
    })
    .replace(/\[\[binome:([^\]]+)\]\]/g, (_, id) => {
      const b = binomes.find((x) => x.binome_id === id);
      return isInternal && b ? pairLabel(b) : 'un binôme';
    });
}

// Annexe E — version interne uniquement : points de vigilance repris de la
// note « Passerelles — Simplifier les échanges entre binômes ».
export const NEW_METHOD_VIGILANCE = [
  'Lien transféré : quelqu\'un d\'autre pourrait remplir le check-in à la place du participant. Le risque est faible pour ce programme ; prévoir de pouvoir remplacer le lien d\'un participant depuis l\'espace de coordination.',
  'Registre RGPD : si la note vocale est retenue, l\'ajouter au registre, car c\'est une nouvelle donnée.',
  'Tester avant de généraliser : faire tester la nouvelle méthode à 2 ou 3 binômes pendant un mois.',
];

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

// État des relations (classement qualitatif d'après le sondage).
export const PAIR_STATUS_LABEL = {
  active: 'Relation active',
  limitee: 'Démarrage limité',
  non_etablie: 'Relation non établie',
  inconnue: 'Pas de réponse exploitable',
};

export function countPairStatus(report) {
  const list = report.ai_analysis?.pair_status || [];
  const total = report.metrics.snapshot.binomes?.length || 0;
  return Object.entries(PAIR_STATUS_LABEL).map(([status, label]) => ({
    status, label, total,
    count: list.filter((p) => p.status === status).length,
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
