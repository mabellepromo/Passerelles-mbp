// src/lib/ficheBinome.js
// Fiches bilan par binôme (clôture de la cohorte 1), en deux versions :
//   - 'internal' : bureau de Ma Belle Promo. Nominative ; réponses des deux
//     membres côte à côte, constat, points pour la clôture. Jamais remise
//     aux participants.
//   - 'closing'  : remise au binôme. Aucune note, aucune réponse individuelle,
//     aucun jugement : noms, programme, message de clôture du bureau.
//
// Sources (aucune requête ici, aucun chiffre saisi) :
//   - report   : bilan « version bureau » (review_reports) : binômes et notes de
//                recommandation photographiés (metrics.snapshot), état de la
//                relation, constat et message de clôture (ai_analysis.pair_notes) ;
//   - responses: réponses au sondage (vue review_by_participant, binômes
//                officiels uniquement, binôme de test exclu).
// Règles : aucune donnée sur le nombre ni la régularité des séances
// (décision du 11/11/2026) ; une réponse absente s'écrit « pas de réponse ».

import { QUESTION_LABELS, COMMON_QUESTIONS, MENTOR_ONLY_QUESTIONS, MENTORE_ONLY_QUESTIONS } from '@/lib/surveyLabels';
import { RELATION_LABEL } from '@/lib/bilanBureau/values';
import { formatDateFr, PROGRAM } from '@/lib/reportContent';

export const NO_ANSWER = 'pas de réponse';

// Questions notées affichées (séances exclues).
const COMMON = COMMON_QUESTIONS.filter((id) => id !== 'sessions_regularity');

const CONTINUATION_LABEL = {
  yes_definitely: 'Oui, certainement',
  yes_probably: 'Oui, probablement',
  unsure: 'Incertain(e)',
  probably_not: 'Probablement pas',
  no: 'Non',
};
const CONSENT_LABEL = {
  none: 'aucune citation autorisée',
  first_name: 'citation autorisée avec le prénom',
  full_name: 'citation autorisée avec le nom complet',
};
export const OPEN_FIELDS = [
  ['strengths', 'Ce qui a le mieux fonctionné'],
  ['improvements', 'Ce qui aurait pu être amélioré'],
  ['objectives_comment', 'Sur l\'atteinte des objectifs'],
];
const STATUS_ORDER = { active: 0, limitee: 1, non_etablie: 2, inconnue: 3 };

// Prénoms : mots qui ne sont pas entièrement en majuscules (« KOUTOH Kokou
// Georges » -> « Kokou Georges »), même règle que src/lib/formatName.js.
export function firstNames(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  const isLast = (w) => {
    const l = w.replace(/['\-.]/g, '');
    return l.length > 0 && l === l.toUpperCase() && /[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ]/.test(l);
  };
  const first = parts.filter((p) => !isLast(p));
  return first.length ? first.join(' ') : String(fullName || '');
}

// Message de clôture : repères {{mentor_prenom}}, {{mentore_prenom}} et {{date_debut}}.
export function fillMessage(text, fiche) {
  return String(text || '')
    .replace(/\{\{\s*mentor_prenom\s*\}\}/g, firstNames(fiche.mentor_name))
    .replace(/\{\{\s*mentore_prenom\s*\}\}/g, firstNames(fiche.mentore_name))
    .replace(/\{\{\s*date_debut\s*\}\}/g, PROGRAM.startDateLabel);
}

// Messages de clôture proposés par défaut, selon l'état de la relation.
// Neutres sur l'avenir du programme : ils annoncent la fin de la COHORTE 1,
// rien de plus. Ils ne servent qu'à préremplir ; le texte retenu est stocké
// en base (pair_notes[].message_cloture) et modifiable dans l'onglet.
const MESSAGE_ACTIVE = `Bonjour {{mentor_prenom}} et {{mentore_prenom}},

La cohorte 1 du programme PASSERELLES s'achève. Au nom du bureau de Ma Belle Promo, merci pour le temps et l'énergie que vous avez consacrés à votre binôme depuis le {{date_debut}}. La relation que vous avez construite compte parmi les réussites de cette cohorte.

Si vous souhaitez continuer à échanger, vous pouvez le faire librement, en dehors du cadre du programme.

Merci encore pour votre engagement.`;

const MESSAGE_OTHER = `Bonjour {{mentor_prenom}} et {{mentore_prenom}},

La cohorte 1 du programme PASSERELLES s'achève. Au nom du bureau de Ma Belle Promo, merci de vous être engagés dans ce programme depuis le {{date_debut}}.

Les emplois du temps de chacun n'ont pas toujours permis aux échanges de se développer comme prévu. Les retours recueillis à la fin de la cohorte nous aident à en tirer les enseignements.

Merci encore pour votre participation.`;

export const defaultClosingMessage = (status) => (status === 'active' ? MESSAGE_ACTIVE : MESSAGE_OTHER);

const score = (v) => (v === null || v === undefined || v === '' ? NO_ANSWER : String(v));

// Points pour la clôture (version interne), déduits des données.
function closingPoints(f) {
  const points = [];
  const of = { mentor: `du mentor (${f.mentor_name})`, mentore: `du mentoré (${f.mentore_name})` };
  const who = { mentor: `le mentor (${f.mentor_name})`, mentore: `le mentoré (${f.mentore_name})` };
  points.push('Attestation de participation pour le mentoré ; attestation ou mot de remerciement pour le mentor.');
  if (f.status === 'active') {
    points.push('Relation active : dire clairement au binôme qu\'il peut poursuivre librement, hors du cadre du programme.');
  } else {
    points.push('Relation limitée ou non établie : message de clôture neutre, sans reproche, qui remercie pour l\'engagement initial.');
  }
  for (const role of ['mentor', 'mentore']) {
    if (!f[role].responded) points.push(`Pas de réponse au sondage ${of[role]} : soigner le message personnel de clôture.`);
    else if (f[role].nps !== null && f[role].nps <= 6) points.push(`Note de recommandation de ${f[role].nps}/10 chez ${who[role]} : point d'attention pour le message de clôture.`);
  }
  if (f.mentor.nps !== null && f.mentore.nps !== null && Math.abs(f.mentor.nps - f.mentore.nps) >= 4) {
    points.push(`Perception différente de la relation (${Math.abs(f.mentor.nps - f.mentore.nps)} points d'écart sur la recommandation) : ne jamais transmettre les réponses de l'un à l'autre.`);
  }
  points.push('Réponses du sondage : document interne ; elles ne figurent pas sur la fiche remise au binôme.');
  return points;
}

/**
 * Construit les fiches de tous les binômes officiels du rapport.
 * @param {object} report    ligne review_reports au format 'bilan_bureau'
 * @param {Array}  responses lignes de review_by_participant
 */
export function buildFiches(report, responses = []) {
  const binomes = report?.metrics?.snapshot?.binomes || [];
  const notes = new Map((report?.ai_analysis?.pair_notes || []).map((p) => [p.binome_id, p]));

  return binomes.map((b) => {
    const note = notes.get(b.binome_id) || {};
    const status = note.status || 'inconnue';
    const side = (role) => {
      const r = responses.find((x) => x.binome_id === b.binome_id && x.role === role);
      const a = r?.answers || {};
      return {
        responded: Boolean(r),
        submitted_at: r?.submitted_at ? formatDateFr(r.submitted_at) : null,
        nps: r ? (r.nps_score ?? null) : null,
        answers: a,
        contributions: Array.isArray(a[role === 'mentor' ? 'contribution_type' : 'contribution_received'])
          ? a[role === 'mentor' ? 'contribution_type' : 'contribution_received'] : [],
        // Une réponse d'une version antérieure du questionnaire ne contient pas
        // cette question : on le dit, plutôt que « pas de réponse ».
        continuation: a.continuation_interest
          ? (CONTINUATION_LABEL[a.continuation_interest] || a.continuation_interest)
          : (r ? 'question non posée (version antérieure du questionnaire)' : null),
        consent: r ? (CONSENT_LABEL[r.quote_consent] || r.quote_consent || null) : null,
        open: OPEN_FIELDS.map(([key, label]) => ({ key, label, text: typeof a[key] === 'string' ? a[key].trim() : '' })).filter((o) => o.text),
      };
    };
    const f = {
      binome_id: b.binome_id,
      mentor_name: b.mentor_name,
      mentore_name: b.mentore_name,
      status,
      statusLabel: RELATION_LABEL[status] || status,
      constat: note.constat || '',
      message: note.message_cloture ?? defaultClosingMessage(status),
      messageIsDefault: note.message_cloture === undefined || note.message_cloture === null,
      mentor: side('mentor'),
      mentore: side('mentore'),
    };

    // Tableau des notes : recommandation, questions communes, questions propres.
    const val = (s, id) => (s.responded ? score(s.answers[id]) : NO_ANSWER);
    f.scoreRows = [
      { label: 'Recommandation du programme (0 à 10)', mentor: f.mentor.responded ? score(f.mentor.nps) : NO_ANSWER, mentore: f.mentore.responded ? score(f.mentore.nps) : NO_ANSWER },
      ...COMMON.map((id) => ({ label: `${QUESTION_LABELS[id]} (1 à 5)`, mentor: val(f.mentor, id), mentore: val(f.mentore, id) })),
      ...MENTOR_ONLY_QUESTIONS.map((id) => ({ label: `${QUESTION_LABELS[id]} (1 à 5)`, mentor: val(f.mentor, id), mentore: '—' })),
      ...MENTORE_ONLY_QUESTIONS.map((id) => ({ label: `${QUESTION_LABELS[id]} (1 à 5)`, mentor: '—', mentore: val(f.mentore, id) })),
    ];
    f.points = closingPoints(f);
    return f;
  }).sort((x, y) => (STATUS_ORDER[x.status] - STATUS_ORDER[y.status]) || x.mentor_name.localeCompare(y.mentor_name));
}

export const CLOSING_INTRO = `${PROGRAM.name} — programme de mentorat de l'${PROGRAM.association}`;
