// src/lib/bilanBureau/blocks.js
// Tableaux et graphiques CALCULÉS du bilan « version bureau », appelés dans
// les textes par un repère {{bloc:nom}}. Les mêmes données servent à l'écran
// et au PDF. Aucun chiffre n'est saisi ici : tout vient de values.js.

import { buildReportFigures } from '@/lib/reportFigures';
import { FIGURE_COLORS } from '@/lib/reportFigures';
import { likert, npsOf, continuationOf, relationCounts, fr1, RELATION_LABEL, RELATION_SHORT } from '@/lib/bilanBureau/values';
import { NOT_AVAILABLE } from '@/lib/reportContent';

export const SURVEY_SOURCE = 'Sondage de bilan PASSERELLES, novembre 2026';

// « 3 sur 7 donnent 4 » / « 1 sur 10 donne 4 ou plus »
const giveN = (count, n, what) => `${count} sur ${n} ${count > 1 ? 'donnent' : 'donne'} ${what}`;
// Règle unique pour toutes les questions notées de 1 à 5 : notes hautes
// (4-5), notes basses (1-2) et moyenne. Aucune réponse n'est passée sous
// silence ; les notes de 3 sont le reste (n - hautes - basses).
const likertSummary = (x) => `${giveN(x.range(4, 5), x.n, '4 ou 5')} ; ${giveN(x.range(1, 2), x.n, '1 ou 2')} ; moyenne ${fr1(x.mean)}`;

// Statut -> ordre d'affichage dans l'annexe A.
const STATUS_ORDER = { active: 0, limitee: 1, non_etablie: 2, inconnue: 3 };

/** Graphique « recommandation par rôle » (barres empilées, NPS à droite). */
function npsRolesFigure(report) {
  const rows = ['mentor', 'mentore'].map((role) => {
    const r = npsOf(report, role);
    if (!r) return null;
    const seg = (key, label, value, color) => ({ key, label, value, color });
    return {
      label: `${role === 'mentor' ? 'Mentors' : 'Mentorés'} (n = ${r.n})`,
      total: r.n,
      right: `NPS ${r.score > 0 ? '+' : ''}${r.score}`,
      segments: [
        seg('p', 'Promoteurs', r.promoters, FIGURE_COLORS.promoters),
        seg('pa', 'Passifs', r.passives, FIGURE_COLORS.passives),
        seg('d', 'Détracteurs', r.detractors, FIGURE_COLORS.detractors),
      ].filter((x) => x.value > 0),
    };
  });
  if (rows.some((r) => !r)) return null;
  return {
    id: 'nps_roles',
    subtitle: 'Note de recommandation de 0 à 10, répartition des répondants par rôle',
    source: `${SURVEY_SOURCE} · ${rows[0].total} mentors et ${rows[1].total} mentorés répondants`,
    chart: {
      type: 'stacked',
      rows,
      legend: [
        { label: 'Promoteurs (9-10)', color: FIGURE_COLORS.promoters },
        { label: 'Passifs (7-8)', color: FIGURE_COLORS.passives },
        { label: 'Détracteurs (0-6)', color: FIGURE_COLORS.detractors },
      ],
    },
  };
}

function mentoresTable(report) {
  const nps = npsOf(report, 'mentore');
  const rel = likert(report, 'mentore', 'relationship_quality');
  const trust = likert(report, 'mentore', 'trust_level');
  const obj = likert(report, 'mentore', 'objectives_achieved');
  const career = likert(report, 'mentore', 'career_clarity');
  const n = nps?.n ?? rel?.n;
  const na = (x, fn) => (x ? fn(x) : NOT_AVAILABLE);
  return {
    head: [`Indicateur (mentorés, n = ${n ?? '?'})`, 'Résultat'],
    rows: [
      ['Note de recommandation moyenne', na(nps, (x) => `${fr1(x.mean)} sur 10 ; ${x.countOf(10)} mentorés donnent 10`)],
      ['Qualité de la relation', na(rel, likertSummary)],
      ['Niveau de confiance avec le mentor', na(trust, likertSummary)],
      ['Atteinte des objectifs', na(obj, likertSummary)],
      ["Clarté de l'orientation professionnelle", na(career, likertSummary)],
    ],
  };
}

function mentorsTable(report) {
  const nps = npsOf(report, 'mentor');
  const benefit = likert(report, 'mentor', 'own_benefit');
  const rel = likert(report, 'mentor', 'relationship_quality');
  const engagement = likert(report, 'mentor', 'engagement_mentee');
  const obj = likert(report, 'mentor', 'objectives_achieved');
  const n = nps?.n ?? rel?.n;
  const na = (x, fn) => (x ? fn(x) : NOT_AVAILABLE);
  return {
    head: [`Indicateur (mentors, n = ${n ?? '?'})`, 'Résultat'],
    rows: [
      ['Note de recommandation moyenne', na(nps, (x) => `${fr1(x.mean)} sur 10 ; notes de ${x.min} à ${x.max}`)],
      ["Bénéfice de l'expérience pour eux-mêmes", na(benefit, likertSummary)],
      ['Qualité de la relation', na(rel, likertSummary)],
      ['Engagement de leur mentoré', na(engagement, likertSummary)],
      ['Atteinte des objectifs', na(obj, likertSummary)],
    ],
  };
}

function relationsTable(report) {
  const c = relationCounts(report);
  const statuses = ['active', 'limitee', 'non_etablie', 'inconnue'].filter((s) => s !== 'inconnue' || c.inconnue > 0);
  return {
    head: ['État de la relation (classement qualitatif)', 'Binômes'],
    rows: statuses.map((s) => [RELATION_LABEL[s], `${c[s]} sur ${c.total}`]),
    narrow: true,
  };
}

function envieTable(report) {
  const cont = continuationOf(report, 'mentor');
  const nps = npsOf(report, 'mentor');
  const benefit = likert(report, 'mentor', 'own_benefit');
  const n = nps?.n;
  return {
    head: [`Chez les ${n ?? '?'} mentors répondants`, 'Nombre'],
    rows: [
      ['Se disent intéressés par une nouvelle expérience', cont ? String(cont.yes) : NOT_AVAILABLE],
      ['Recommanderaient vraiment le programme (note 9 ou 10)', nps ? String(nps.promoters) : NOT_AVAILABLE],
      ["Jugent l'expérience bénéfique pour eux (note 4 ou 5)", benefit ? String(benefit.range(4, 5)) : NOT_AVAILABLE],
      ["Jugent l'expérience peu ou pas bénéfique pour eux (note 1 ou 2)", benefit ? String(benefit.range(1, 2)) : NOT_AVAILABLE],
    ],
    narrow: true,
  };
}

/** Lignes de l'annexe A : noms et notes calculés, état et constat stockés. */
export function annexeRows(report) {
  const binomes = report.metrics?.snapshot?.binomes || [];
  const notes = new Map((report.ai_analysis?.pair_notes || []).map((p) => [p.binome_id, p]));
  const score = (v) => (v === null || v === undefined ? 'pas de réponse' : `${v}/10`);
  return binomes
    .map((b) => {
      const note = notes.get(b.binome_id) || {};
      return {
        binome_id: b.binome_id,
        pair: `${b.mentor_name} / ${b.mentore_name}`,
        mentor_name: b.mentor_name,
        status: note.status || 'inconnue',
        mentorScore: score(b.mentor_nps),
        mentoreScore: score(b.mentore_nps),
        constat: note.constat || '',
      };
    })
    .sort((a, b) => (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || a.mentor_name.localeCompare(b.mentor_name));
}

export const ANNEXE_HEAD = ['Binôme (mentor / mentoré)', 'État de la relation', 'Note mentor', 'Note mentoré', 'Constat'];
export const annexeCells = (r) => [r.pair, RELATION_SHORT[r.status] || r.status, r.mentorScore, r.mentoreScore, r.constat];

// Figures détaillées de l'annexe C (profil, questions notées, apports du mentorat).
const ANNEX_FIGURES = ['profile_sexe', 'profile_level', 'profile_country', 'likert_common', 'likert_mentor', 'likert_mentore', 'contributions'];
export function annexFigures(report) {
  return buildReportFigures(report, 'internal')
    .filter((f) => ANNEX_FIGURES.includes(f.id))
    .map((f, i) => ({ ...f, number: `C${i + 1}` }));
}

/**
 * Données d'un bloc calculé. Renvoie { kind: 'table' | 'figure' | 'annexe' | 'figures', ... }
 * ou null si le bloc est inconnu.
 */
export function buildBlock(name, report) {
  switch (name) {
    case 'nps_roles': {
      const figure = npsRolesFigure(report);
      return figure ? { kind: 'figure', figure } : { kind: 'missing' };
    }
    case 'table_mentores': return { kind: 'table', ...mentoresTable(report) };
    case 'table_mentors': return { kind: 'table', ...mentorsTable(report) };
    case 'table_relations': return { kind: 'table', ...relationsTable(report) };
    case 'table_envie': return { kind: 'table', ...envieTable(report) };
    case 'annexe_binomes': return { kind: 'annexe', rows: annexeRows(report) };
    case 'figures_annexe':
    case 'figures_brouillon6': // ancien nom, accepté pour les textes déjà enregistrés
      return { kind: 'figures', figures: annexFigures(report) };
    default: return null;
  }
}

export const BLOCK_NAMES = ['nps_roles', 'table_mentores', 'table_mentors', 'table_relations', 'table_envie', 'annexe_binomes', 'figures_annexe'];
