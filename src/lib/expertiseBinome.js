// src/lib/expertiseBinome.js
// Fiches d'expertise par binôme (clôture de la cohorte 1, 25/11/2026).
//
// Sources (aucun chiffre ni texte saisi ici) :
//   - binome_expertise          : sentence, confiance, constat, motif, preuves,
//                                 remarques (une ligne par binôme officiel) ;
//   - binome_expertise_synthese : synthèse transversale de la cohorte ;
//   - official_binomes          : noms (binôme de test exclu) ;
//   - review_by_participant     : réponses au sondage, pour vérifier en direct
//                                 que chaque citation figure dans les données.
// Règles : aucune donnée sur le nombre ni la régularité des séances ; une
// réponse absente s'écrit « Réponse du mentor/mentoré non disponible ».
// Document interne au bureau : aucune partie n'est destinée aux binômes.

import { QUESTION_LABELS } from '@/lib/surveyLabels';

// color : couleur de statut des graphiques (palette validée en mode clair ;
// l'ambre est peu contrasté : chaque segment porte un libellé visible).
export const SENTENCE = {
  reussite: { label: 'Réussite', plural: 'réussites', tone: 'emerald', color: '#047857', order: 0 },
  reussite_partielle: { label: 'Réussite partielle', plural: 'réussites partielles', tone: 'amber', color: '#f59e0b', order: 1 },
  echec: { label: 'Échec', plural: 'échecs', tone: 'red', color: '#b91c1c', order: 2 },
};
export const SENTENCE_KEYS = Object.keys(SENTENCE);

/**
 * Répartition des sentences pour les tableaux de bord.
 * @param {Array} rows     lignes de binome_expertise
 * @param {Array} overview lignes de official_binome_overview (binômes officiels)
 * @returns {{ total, written, counts, byResponse, vigilanceMismatch }}
 *   byResponse : sentences selon que les deux membres ou un seul ont répondu ;
 *   vigilanceMismatch : binômes dont l'alerte de recommandation (NPS) contredit
 *   la sentence (vert ou orange pour un échec, rouge pour un binôme qui a
 *   produit un résultat).
 */
export function summarizeExpertise(rows = [], overview = []) {
  const byId = new Map(rows.map((r) => [r.binome_id, r]));
  const official = overview.filter((b) => byId.has(b.binome_id));
  const counts = Object.fromEntries(SENTENCE_KEYS.map((k) => [k, official.filter((b) => byId.get(b.binome_id).sentence === k).length]));
  const group = (label, list) => ({
    label, total: list.length,
    ...Object.fromEntries(SENTENCE_KEYS.map((k) => [k, list.filter((b) => byId.get(b.binome_id).sentence === k).length])),
  });
  const both = official.filter((b) => b.mentor_responded && b.mentore_responded);
  const one = official.filter((b) => b.mentor_responded !== b.mentore_responded);
  const none = official.filter((b) => !b.mentor_responded && !b.mentore_responded);
  const byResponse = [group('Les deux ont répondu', both), group('Un seul a répondu', one)];
  if (none.length) byResponse.push(group('Aucune réponse', none));
  const vigilanceMismatch = official.filter((b) => {
    const s = byId.get(b.binome_id).sentence;
    return (s === 'echec' && ['vert', 'orange'].includes(b.vigilance)) || (s !== 'echec' && b.vigilance === 'rouge');
  });
  return { total: overview.length, written: official.length, counts, byResponse, vigilanceMismatch };
}

// « 3 réussites, 3 réussites partielles, 5 échecs »
export const summaryLine = (counts) => Object.entries(SENTENCE)
  .map(([k, s]) => `${counts[k]} ${counts[k] > 1 ? s.plural : s.label.toLowerCase()}`)
  .join(', ');
export const CONFIANCE = { elevee: 'élevée', moyenne: 'moyenne', faible: 'faible' };
const CONFIANCE_ORDER = { elevee: 0, moyenne: 1, faible: 2 };
export const REMARQUE_LABEL = { divergence: 'Divergence', signal: 'À signaler', limite: 'Limite' };
export const ROLE = { mentor: 'Mentor', mentore: 'Mentoré' };

const EXTRA_LABELS = {
  strengths: 'Ce qui a le mieux fonctionné',
  improvements: 'Ce qui pourrait être amélioré',
  objectives_comment: 'Ce qui a aidé ou freiné les objectifs',
  contribution_type: 'Apports (mentor)',
  contribution_received: 'Apports reçus',
  platform_impact: 'La plateforme a-t-elle empêché le binôme de fonctionner ?',
  continuation_interest: 'Intérêt pour une future expérience de mentorat',
  continue_same_pair: 'Poursuite avec ce binôme (version antérieure du questionnaire)',
};
const CONTINUATION_LABEL = {
  yes_definitely: 'Oui, certainement', yes_probably: 'Oui, probablement', unsure: 'Incertain(e)',
  probably_not: 'Probablement pas', no: 'Non',
};
const SCALE_QUESTIONS = new Set(Object.keys(QUESTION_LABELS));

export const questionLabel = (id) => QUESTION_LABELS[id] || EXTRA_LABELS[id] || id;

// Citation telle qu'affichée : « 3/5 » pour une note, libellé pour un code.
export function citationText(p) {
  if (SCALE_QUESTIONS.has(p.question)) return `${p.citation}/5`;
  if (p.question === 'continuation_interest') return CONTINUATION_LABEL[p.citation] || p.citation;
  return p.citation;
}

// La citation figure-t-elle dans la réponse ? (texte : extrait exact ;
// choix multiple : option cochée ; note ou code : valeur identique)
export function citationFound(answers, p) {
  const v = answers?.[p.question];
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.includes(p.citation);
  if (typeof v === 'string') return v.includes(p.citation);
  return String(v) === String(p.citation);
}

/**
 * @param {Array} rows      lignes de binome_expertise
 * @param {Array} binomes   lignes de official_binomes
 * @param {Array} responses lignes de review_by_participant
 */
export function buildExpertise(rows = [], binomes = [], responses = []) {
  const byId = new Map(rows.map((r) => [r.binome_id, r]));
  const fiches = binomes.map((b) => {
    const r = byId.get(b.id);
    const answersOf = (role) => responses.find((x) => x.binome_id === b.id && x.role === role)?.answers ?? null;
    const answers = { mentor: answersOf('mentor'), mentore: answersOf('mentore') };
    const reponses = answers.mentor && answers.mentore ? 'Les deux'
      : answers.mentor ? 'Mentor seul' : answers.mentore ? 'Mentoré seul' : 'Aucun';
    const absents = [
      !answers.mentor && 'Réponse du mentor non disponible.',
      !answers.mentore && 'Réponse du mentoré non disponible.',
    ].filter(Boolean);
    const preuves = (r?.preuves ?? []).map((p) => ({ ...p, found: citationFound(answers[p.role], p) }));
    return {
      binome_id: b.id,
      mentor_name: b.mentor_name,
      mentore_name: b.mentore_name,
      reponses,
      absents,
      missing: !r,
      sentence: r?.sentence ?? null,
      sentenceLabel: r ? SENTENCE[r.sentence]?.label ?? r.sentence : 'Fiche non rédigée',
      tone: r ? SENTENCE[r.sentence]?.tone ?? 'gray' : 'gray',
      confiance: r?.confiance ?? null,
      confianceLabel: r ? CONFIANCE[r.confiance] ?? r.confiance : '—',
      constat: r?.constat ?? '',
      motif: r?.motif ?? '',
      preuves,
      unverified: preuves.filter((p) => !p.found).length,
      remarques: r?.remarques ?? [],
    };
  });
  // Fiches orphelines : binôme absent de la liste officielle (test, cohorte 2…).
  const orphans = rows.filter((r) => !binomes.some((b) => b.id === r.binome_id)).map((r) => r.binome_id);
  fiches.sort((a, b) => ((SENTENCE[a.sentence]?.order ?? 9) - (SENTENCE[b.sentence]?.order ?? 9))
    || ((CONFIANCE_ORDER[a.confiance] ?? 9) - (CONFIANCE_ORDER[b.confiance] ?? 9))
    || a.mentor_name.localeCompare(b.mentor_name));
  const counts = Object.fromEntries(Object.keys(SENTENCE).map((k) => [k, fiches.filter((f) => f.sentence === k).length]));
  return { fiches, orphans, counts };
}
