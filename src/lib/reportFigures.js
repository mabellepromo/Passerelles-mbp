// src/lib/reportFigures.js
// SOURCE UNIQUE des figures du rapport de bilan.
//
// Cette fonction est appelée À LA FOIS par l'onglet « Rapport » du dashboard
// et par le PDF : les chiffres affichés sont donc forcément les mêmes.
//
// Elle ne lit que les données enregistrées avec le rapport (report.metrics,
// calculé en SQL par build_review_report_metrics sur les vues filtrées
// is_test = false, et report.metrics.snapshot). Elle ne fait aucune requête.
//
// Règles appliquées :
//   - une figure dont la donnée manque n'est PAS produite (jamais de zéro à la
//     place d'une absence de réponse) ;
//   - les effectifs sont toujours affichés (« 7/11 »), jamais un pourcentage seul ;
//   - moyenne : une décimale au plus, toujours avec le n ;
//   - version externe : aucune figure par binôme, aucun nom, pays regroupés ;
//   - aucune figure sur le nombre de séances ni sur la régularité.
//
// Chaque figure porte une liste `checks` : la somme des effectifs dessinés et
// le n annoncé, pour la vérification.

import { COMMON_QUESTIONS, MENTOR_ONLY_QUESTIONS, MENTORE_ONLY_QUESTIONS, QUESTION_LABELS } from '@/lib/surveyLabels';

// ----------------------------------------------------------------------------
// Palette (identique dans tout le rapport, écran et PDF)
// ----------------------------------------------------------------------------
export const FIGURE_COLORS = {
  mentor: '#1a7a45', // vert Passerelles
  mentore: '#7c3aed', // violet
  promoters: '#1a7a45',
  passives: '#d4aa35', // or Passerelles (peu contrasté : effectifs toujours écrits)
  detractors: '#b42318',
  missing: '#e5e7eb', // non-répondants
  neutral: '#4b5563', // barres sans notion de rôle
  // Échelle ordonnée (1 = clair -> 5 = foncé), une seule teinte : lisible en
  // noir et blanc parce que la clarté suit l'ordre des réponses.
  scale5: ['#d3eadb', '#a6d3b6', '#6fb48c', '#2f8a57', '#0f5530'],
  ink: '#111827',
  muted: '#6b7280',
  line: '#e5e7eb',
  white: '#ffffff',
};

// Couleur du texte posé sur une couleur de fond (clair sur foncé, foncé sur clair).
const DARK_FILLS = new Set(['#1a7a45', '#7c3aed', '#b42318', '#4b5563', '#2f8a57', '#0f5530']);
export const inkOn = (fill) => (DARK_FILLS.has(fill) ? FIGURE_COLORS.white : FIGURE_COLORS.ink);

const SURVEY_SOURCE = 'Source : sondage de bilan PASSERELLES, novembre 2026';
const ROLE_LABEL = { mentor: 'Mentors', mentore: 'Mentorés' };

// Libellés de l'échelle réelle du formulaire (src/pages/Bilan.jsx).
export const LIKERT_SCALE = ['Pas du tout', 'Un peu', 'Moyennement', 'Beaucoup', 'Totalement'];

// Questions notées retenues : la régularité des sessions est écartée des
// figures (déclarative, formulée différemment selon le rôle) ; elle reste
// dans le tableau des annexes.
const FIGURE_COMMON_QUESTIONS = COMMON_QUESTIONS.filter((id) => id !== 'sessions_regularity');

const CONTINUATION_OPTIONS = [
  ['yes_definitely', 'Oui, certainement'],
  ['yes_probably', 'Oui, probablement'],
  ['unsure', 'Incertain(e)'],
  ['probably_not', 'Probablement pas'],
  ['no', 'Non'],
];

const SEXE_LABEL = { masculin: 'Hommes', feminin: 'Femmes', ne_se_prononce_pas: 'Ne se prononce pas', non_renseigne: 'Non renseigné' };
const LEVEL_LABEL = { L3: 'Licence 3 (L3)', M1: 'Master 1 (M1)', M2: 'Master 2 (M2)', non_renseigne: 'Non renseigné' };

// ----------------------------------------------------------------------------
// Petits outils
// ----------------------------------------------------------------------------
const sum = (values) => values.reduce((s, v) => s + (Number(v) || 0), 0);
// Nombre à la française, une décimale au plus : 4.25 -> « 4,3 »
export const fr1 = (v) => Number(v).toFixed(1).replace('.', ',');
const signed = (v) => (v > 0 ? `+${v}` : String(v));
const plural = (n, one, many) => (n > 1 ? many : one);
const quote = (t) => `« ${t} »`;
// « a », « a et b », « a, b et c »
const joinFr = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`);

function npsScore(p, d, n) {
  return n ? Math.round(((p - d) / n) * 100) : null;
}

// Moyenne exacte recalculée à partir de la répartition (et non arrondie deux fois).
function likertFromStat(stat) {
  if (!stat || !stat.n) return null;
  const counts = [1, 2, 3, 4, 5].map((k) => Number(stat.distribution?.[String(k)] ?? 0));
  const total = sum(counts);
  const mean = total ? sum(counts.map((c, i) => c * (i + 1))) / total : null;
  return { counts, n: Number(stat.n), total, mean };
}

// Pays déduit du lieu déclaré par le mentor à l'inscription (texte libre).
// « Lomé, Togo » -> Togo ; « Idaho, USA » -> États-Unis ; dernière partie après la virgule sinon.
const COUNTRY_ALIASES = { usa: 'États-Unis', 'etats-unis': 'États-Unis', 'états-unis': 'États-Unis', us: 'États-Unis', togo: 'Togo' };
export function placeToCountry(place) {
  const raw = String(place || '').trim();
  if (!raw || raw === 'Non renseigné') return null;
  const lower = raw.toLowerCase();
  if (lower === 'lomé, togo' || lower === 'lome' || lower === 'kara') return 'Togo';
  const last = raw.split(',').pop().trim();
  return COUNTRY_ALIASES[last.toLowerCase()] || last;
}

// Segment d'une barre empilée (on ne garde pas les segments vides : les
// catégories à zéro restent lisibles dans la légende et dans le tableau).
const seg = (key, label, value, color) => ({ key, label, value, color });

// ----------------------------------------------------------------------------
// Construction des figures
// ----------------------------------------------------------------------------

/**
 * Renvoie la liste ordonnée des figures du rapport pour une version.
 * @param {object} report  ligne de review_reports (metrics + snapshot)
 * @param {'internal'|'external'} variant
 * @returns {Array<object>} figures numérotées { id, number, section, title, source, reading, chart, checks, values }
 */
export function buildReportFigures(report, variant = 'internal') {
  const m = report?.metrics;
  const snap = m?.snapshot;
  if (!m || !snap) return [];
  const isInternal = variant === 'internal';
  const figures = [];
  const add = (fig) => { if (fig) figures.push(fig); };

  const respondents = {
    mentor: Number((m.response_rate || []).find((r) => r.role === 'mentor')?.total_responses ?? NaN),
    mentore: Number((m.response_rate || []).find((r) => r.role === 'mentore')?.total_responses ?? NaN),
  };

  // ======================================================== 3. Présentation
  const profile = m.profile;
  if (profile?.mentor_sexe?.length && profile?.mentore_sexe?.length) {
    const rows = [['mentor', profile.mentor_sexe], ['mentore', profile.mentore_sexe]].map(([role, list]) => {
      const get = (v) => Number(list.find((x) => x.value === v)?.n ?? 0);
      const others = list.filter((x) => !['masculin', 'feminin'].includes(x.value));
      const total = sum(list.map((x) => x.n));
      return {
        label: ROLE_LABEL[role],
        total,
        right: `n = ${total}`,
        segments: [
          seg('h', 'Hommes', get('masculin'), FIGURE_COLORS.neutral),
          seg('f', 'Femmes', get('feminin'), FIGURE_COLORS.passives),
          ...others.map((o) => seg(o.value, SEXE_LABEL[o.value] || o.value, Number(o.n), FIGURE_COLORS.missing)),
        ].filter((s) => s.value > 0),
      };
    });
    const [rm, re] = rows;
    const v = (row, key) => row.segments.find((s) => s.key === key)?.value ?? 0;
    add({
      id: 'profile_sexe',
      section: 'presentation',
      title: `Mentors : ${v(rm, 'h')} hommes et ${v(rm, 'f')} ${plural(v(rm, 'f'), 'femme', 'femmes')} ; mentorés : ${v(re, 'h')} hommes et ${v(re, 'f')} ${plural(v(re, 'f'), 'femme', 'femmes')}`,
      source: `Source : fiches d'inscription des participants des binômes officiels, n = ${rm.total} mentors et ${re.total} mentorés`,
      reading: 'Sexe déclaré à l\'inscription. Chaque barre compte les participants des binômes officiels, binôme de test exclu.',
      chart: { type: 'stacked', rows: [rm, re], legend: [{ label: 'Hommes', color: FIGURE_COLORS.neutral }, { label: 'Femmes', color: FIGURE_COLORS.passives }] },
      checks: rows.map((r) => ({ label: r.label, drawn: sum(r.segments.map((s) => s.value)), announced: r.total })),
    });
  }

  if (profile?.mentore_level?.length) {
    const list = profile.mentore_level;
    const total = sum(list.map((x) => x.n));
    const rows = list.map((x) => ({ label: LEVEL_LABEL[x.value] || x.value, value: Number(x.n), total }));
    const top = [...rows].sort((a, b) => b.value - a.value)[0];
    add({
      id: 'profile_level',
      section: 'presentation',
      title: `${top.label.replace(/ \(.*\)/, '')} est le niveau le plus représenté parmi les mentorés (${top.value} sur ${total})`,
      source: `Source : fiches d'inscription des mentorés des binômes officiels, n = ${total}`,
      reading: 'Niveau déclaré à l\'inscription, au début du programme.',
      chart: { type: 'hbar', panels: [{ rows, max: total, color: FIGURE_COLORS.mentore }] },
      checks: [{ label: 'Mentorés', drawn: sum(rows.map((r) => r.value)), announced: total }],
    });
  }

  if ((snap.mentor_places || []).length) {
    const byCountry = new Map();
    let unknown = 0;
    for (const p of snap.mentor_places) {
      const country = placeToCountry(p.place);
      if (!country) { unknown += p.count; continue; }
      // Version externe : un pays représenté par une seule personne l'identifie.
      const key = isInternal || country === 'Togo' ? country : 'Étranger';
      byCountry.set(key, (byCountry.get(key) || 0) + p.count);
    }
    if (unknown) byCountry.set('Non renseigné', unknown);
    const total = sum([...byCountry.values()]);
    const rows = [...byCountry.entries()].map(([label, value]) => ({ label, value, total })).sort((a, b) => b.value - a.value);
    const togo = byCountry.get('Togo') ?? 0;
    add({
      id: 'profile_country',
      section: 'presentation',
      title: `${togo} mentors sur ${total} résident au Togo, ${total - togo - unknown} à l'étranger`,
      source: `Source : lieu de résidence déclaré par les mentors à l'inscription, n = ${total}`,
      reading: isInternal
        ? 'Le pays est déduit de la ville déclarée par chaque mentor (texte libre à l\'inscription).'
        : 'Les pays étrangers sont regroupés : certains ne comptent qu\'un seul mentor, qui serait reconnaissable.',
      chart: { type: 'hbar', panels: [{ rows, max: total, color: FIGURE_COLORS.mentor }] },
      checks: [{ label: 'Mentors', drawn: sum(rows.map((r) => r.value)), announced: total }],
    });
  }

  // ======================================================== 4. Méthodologie
  if ((m.response_rate || []).length === 2) {
    const rows = ['mentor', 'mentore'].map((role) => {
      const r = m.response_rate.find((x) => x.role === role);
      const invited = Number(r.total_tokens);
      const answered = Number(r.total_responses);
      return {
        label: ROLE_LABEL[role],
        total: invited,
        right: `${answered}/${invited}`,
        segments: [
          seg('yes', 'Répondants', answered, FIGURE_COLORS[role]),
          seg('no', 'Sans réponse', invited - answered, FIGURE_COLORS.missing),
        ].filter((s) => s.value > 0),
      };
    });
    const [rm, re] = rows;
    const ans = (row) => row.segments.find((s) => s.key === 'yes')?.value ?? 0;
    add({
      id: 'response_rate',
      section: 'methodology',
      title: `${ans(re)} mentorés sur ${re.total} et ${ans(rm)} mentors sur ${rm.total} ont répondu au sondage`,
      source: `${SURVEY_SOURCE}, personnes invitées : n = ${rm.total} mentors et ${re.total} mentorés`,
      reading: `Le point de vue de ${rm.total - ans(rm)} ${plural(rm.total - ans(rm), 'mentor', 'mentors')} et de ${re.total - ans(re)} ${plural(re.total - ans(re), 'mentoré', 'mentorés')} manque : les résultats des mentors reposent sur ${ans(rm)} réponses.`,
      chart: {
        type: 'stacked',
        rows,
        legend: [
          { label: 'Mentors répondants', color: FIGURE_COLORS.mentor },
          { label: 'Mentorés répondants', color: FIGURE_COLORS.mentore },
          { label: 'Sans réponse', color: FIGURE_COLORS.missing },
        ],
      },
      checks: rows.map((r) => ({ label: r.label, drawn: sum(r.segments.map((s) => s.value)), announced: r.total })),
    });
  }

  const binomes = snap.binomes || [];
  if (binomes.length) {
    const total = binomes.length;
    const count = (fn) => binomes.filter(fn).length;
    const both = count((b) => b.mentor_responded && b.mentore_responded);
    const rows = [
      { label: 'Mentor et mentoré', value: both, total },
      { label: 'Mentoré seulement', value: count((b) => !b.mentor_responded && b.mentore_responded), total },
      { label: 'Mentor seulement', value: count((b) => b.mentor_responded && !b.mentore_responded), total },
      { label: 'Aucun des deux', value: count((b) => !b.mentor_responded && !b.mentore_responded), total },
    ];
    add({
      id: 'pair_coverage',
      section: 'methodology',
      title: `Dans ${both} binômes sur ${total}, le mentor et le mentoré ont tous deux répondu`,
      source: `${SURVEY_SOURCE}, n = ${total} binômes`,
      reading: `Les comparaisons au sein d'un même binôme ne portent que sur ces ${both} binômes.`,
      chart: { type: 'hbar', panels: [{ rows, max: total, color: FIGURE_COLORS.neutral }] },
      checks: [{ label: 'Binômes', drawn: sum(rows.map((r) => r.value)), announced: total }],
    });
  }

  // ======================================================== 6. Résultats quantitatifs
  const npsRole = (role) => (m.nps || []).find((n) => n.role === role);
  if (npsRole('mentor') && npsRole('mentore') && m.nps_global) {
    const mk = (label, p, pa, d, n) => ({
      label,
      total: n,
      right: `NPS ${signed(npsScore(p, d, n))}`,
      segments: [
        seg('p', 'Promoteurs', p, FIGURE_COLORS.promoters),
        seg('pa', 'Passifs', pa, FIGURE_COLORS.passives),
        seg('d', 'Détracteurs', d, FIGURE_COLORS.detractors),
      ].filter((s) => s.value > 0),
    });
    const r = (role) => npsRole(role);
    const g = m.nps_global;
    const rows = [
      mk(`Mentors (n = ${r('mentor').total_nps})`, r('mentor').promoters, r('mentor').passives, r('mentor').detractors, Number(r('mentor').total_nps)),
      mk(`Mentorés (n = ${r('mentore').total_nps})`, r('mentore').promoters, r('mentore').passives, r('mentore').detractors, Number(r('mentore').total_nps)),
      mk(`Ensemble (n = ${g.total_nps})`, g.promoters, g.passives, g.detractors, Number(g.total_nps)),
    ];
    const sM = npsScore(r('mentor').promoters, r('mentor').detractors, r('mentor').total_nps);
    const sE = npsScore(r('mentore').promoters, r('mentore').detractors, r('mentore').total_nps);
    const nM = Number(r('mentor').total_nps);
    add({
      id: 'nps',
      section: 'quantitative',
      title: sE === sM
        ? `Mentors et mentorés recommandent le programme au même niveau (NPS ${signed(sE)})`
        : `Les ${sE > sM ? 'mentorés' : 'mentors'} recommandent davantage le programme (NPS ${signed(Math.max(sE, sM))}) que les ${sE > sM ? 'mentors' : 'mentorés'} (NPS ${signed(Math.min(sE, sM))})`,
      source: `${SURVEY_SOURCE}, n = ${nM} mentors et ${r('mentore').total_nps} mentorés`,
      reading: `NPS = part des promoteurs (notes 9-10) moins part des détracteurs (0-6). Avec ${nM} réponses de mentors, une seule réponse déplace leur score d'environ ${Math.round(100 / nM)} points : l'écart est une tendance, pas une mesure précise.`,
      chart: {
        type: 'stacked',
        rows,
        legend: [
          { label: 'Promoteurs (9-10)', color: FIGURE_COLORS.promoters },
          { label: 'Passifs (7-8)', color: FIGURE_COLORS.passives },
          { label: 'Détracteurs (0-6)', color: FIGURE_COLORS.detractors },
        ],
      },
      checks: rows.map((row) => ({ label: row.label, drawn: sum(row.segments.map((s) => s.value)), announced: row.total })),
    });
  }

  if ((m.nps_histogram || []).length) {
    const panels = ['mentor', 'mentore'].map((role) => {
      const counts = Array.from({ length: 11 }, (_, score) => Number(m.nps_histogram.find((h) => h.role === role && Number(h.score) === score)?.n ?? 0));
      const n = sum(counts);
      return { role, title: `${ROLE_LABEL[role]} (n = ${n})`, counts, n, color: FIGURE_COLORS[role] };
    });
    const range = (p) => {
      const given = p.counts.map((c, i) => (c > 0 ? i : null)).filter((i) => i !== null);
      return [Math.min(...given), Math.max(...given)];
    };
    const [pm, pe] = panels;
    const [minM, maxM] = range(pm);
    const [minE, maxE] = range(pe);
    add({
      id: 'nps_histogram',
      section: 'quantitative',
      title: `${pe.counts[10]} mentorés sur ${pe.n} donnent la note de 10 ; les notes des mentors vont de ${minM} à ${maxM}`,
      source: `${SURVEY_SOURCE}, n = ${pm.n} mentors et ${pe.n} mentorés`,
      reading: `Chaque barre compte des personnes. Notes des mentorés : de ${minE} à ${maxE}. Zones du NPS : détracteurs de 0 à 6, passifs 7 et 8, promoteurs 9 et 10.`,
      chart: { type: 'histogram', panels },
      checks: panels.map((p) => ({ label: p.title, drawn: p.n, announced: respondents[p.role] })),
    });
  }

  // Questions notées de 1 à 5
  const likert = m.likert_by_question || [];
  const statOf = (role, id) => likertFromStat(likert.find((l) => l.role === role && l.question_id === id));
  const likertRows = (ids, roles) => ids.flatMap((id) => {
    const items = roles.map((role) => ({ role, s: statOf(role, id) })).filter((x) => x.s);
    if (!items.length) return [];
    return [
      { heading: QUESTION_LABELS[id] || id },
      ...items.map(({ role, s }) => ({
        label: ROLE_LABEL[role],
        total: s.total,
        right: `moy. ${fr1(s.mean)} · n = ${s.n}`,
        segments: s.counts.map((c, i) => seg(String(i + 1), String(i + 1), c, FIGURE_COLORS.scale5[i])).filter((x) => x.value > 0),
        meta: { id, role, mean: s.mean, n: s.n, counts: s.counts },
      })),
    ];
  });
  const likertLegend = LIKERT_SCALE.map((label, i) => ({ label: `${i + 1} ${label}`, color: FIGURE_COLORS.scale5[i] }));
  const likertChecks = (rows) => rows.filter((r) => r.meta).map((r) => ({
    label: `${QUESTION_LABELS[r.meta.id]} — ${r.label}`, drawn: sum(r.meta.counts), announced: r.meta.n,
  }));

  {
    const rows = likertRows(FIGURE_COMMON_QUESTIONS, ['mentor', 'mentore']);
    if (rows.length) {
      // Constat : la question où les moyennes des deux rôles s'écartent le plus.
      const gaps = FIGURE_COMMON_QUESTIONS.map((id) => ({ id, a: statOf('mentor', id), b: statOf('mentore', id) }))
        .filter((g) => g.a && g.b)
        .map((g) => ({ ...g, gap: g.b.mean - g.a.mean }))
        .sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap));
      const top = gaps[0];
      add({
        id: 'likert_common',
        section: 'quantitative',
        title: top
          ? `L'écart le plus marqué entre les deux rôles porte sur ${quote(QUESTION_LABELS[top.id])} : moyenne ${fr1(top.a.mean)} chez les mentors, ${fr1(top.b.mean)} chez les mentorés`
          : 'Questions posées aux deux rôles',
        source: `${SURVEY_SOURCE}, n = ${respondents.mentor} mentors et ${respondents.mentore} mentorés`,
        reading: 'Échelle du questionnaire : 1 Pas du tout, 2 Un peu, 3 Moyennement, 4 Beaucoup, 5 Totalement. Avec 7 et 10 réponses, lire d\'abord la répartition ; la moyenne n\'est qu\'un repère.',
        chart: { type: 'stacked', rows, legend: likertLegend, scale: true },
        checks: likertChecks(rows),
      });
    }
  }

  for (const [id, role, ids] of [['likert_mentor', 'mentor', MENTOR_ONLY_QUESTIONS], ['likert_mentore', 'mentore', MENTORE_ONLY_QUESTIONS]]) {
    const rows = likertRows(ids, [role]);
    if (!rows.length) continue;
    const ranked = ids.map((q) => ({ q, s: statOf(role, q) })).filter((x) => x.s).sort((a, b) => b.s.mean - a.s.mean);
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    const who = role === 'mentor' ? 'mentors' : 'mentorés';
    add({
      id,
      section: 'quantitative',
      title: `Questions propres aux ${who} : ${quote(QUESTION_LABELS[best.q])} obtient la moyenne la plus haute (${fr1(best.s.mean)} sur 5)`,
      source: `${SURVEY_SOURCE}, n = ${respondents[role]} ${who}`,
      reading: `La moyenne la plus basse concerne ${quote(QUESTION_LABELS[worst.q])} (${fr1(worst.s.mean)} sur 5). Échelle : 1 Pas du tout à 5 Totalement.`,
      chart: { type: 'stacked', rows, legend: likertLegend, scale: true },
      checks: likertChecks(rows),
    });
  }

  // Apports du mentorat (plusieurs réponses possibles)
  if ((m.contribution_distribution || []).length) {
    const panels = [
      ['mentor', 'contribution_type', 'Mentors : ce qu\'ils disent avoir apporté'],
      ['mentore', 'contribution_received', 'Mentorés : ce qu\'ils disent avoir reçu'],
    ].map(([role, question, title]) => {
      const total = respondents[role];
      const rows = m.contribution_distribution
        .filter((c) => c.role === role && c.question_id === question)
        .map((c) => ({ label: c.option, value: Number(c.n), total }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
      return { role, title: `${title} (n = ${total})`, rows, max: total, color: FIGURE_COLORS[role] };
    }).filter((p) => p.rows.length);
    const tops = (p) => p.rows.filter((r) => r.value === p.rows[0].value).map((r) => quote(r.label));
    const [pm, pe] = panels;
    if (pm && pe) {
      add({
        id: 'contributions',
        section: 'quantitative',
        title: `Apport le plus cité : ${joinFr(tops(pm))} chez les mentors (${pm.rows[0].value}/${pm.max}), ${joinFr(tops(pe))} chez les mentorés (${pe.rows[0].value}/${pe.max})`,
        source: `${SURVEY_SOURCE}, n = ${pm.max} mentors et ${pe.max} mentorés`,
        reading: 'Plusieurs réponses possibles : les effectifs ne s\'additionnent pas. Le questionnaire ne demandait pas de préciser « Autre ».',
        chart: { type: 'hbar', panels },
        // Choix multiples : chaque barre ne peut dépasser le nombre de répondants.
        checks: panels.map((p) => ({ label: p.title, drawn: Math.max(...p.rows.map((r) => r.value)), announced: p.max, rule: 'max <= n' })),
      });
    }
  }

  // Souhait de poursuivre (choix fermés, question hypothétique)
  if ((m.continuation_distribution || []).length) {
    const rows = ['mentor', 'mentore'].map((role) => {
      const get = (key) => Number(m.continuation_distribution.find((c) => c.role === role && c.bucket === key)?.n ?? 0);
      const n = sum(CONTINUATION_OPTIONS.map(([k]) => get(k)));
      // Échelle foncé (oui, certainement) -> clair (non).
      const colors = [...FIGURE_COLORS.scale5].reverse();
      return {
        role,
        label: ROLE_LABEL[role],
        total: n,
        right: `n = ${n}`,
        segments: CONTINUATION_OPTIONS.map(([k, label], i) => seg(k, label, get(k), colors[i])).filter((s) => s.value > 0),
        missing: respondents[role] - n,
      };
    });
    const yes = (row) => sum(row.segments.filter((s) => s.key.startsWith('yes')).map((s) => s.value));
    const [rm, re] = rows;
    const missingNotes = rows.filter((r) => r.missing > 0)
      .map((r) => `${r.missing} réponse${r.missing > 1 ? 's' : ''} de ${r.role === 'mentor' ? 'mentor' : 'mentoré'} ne contien${r.missing > 1 ? 'nent' : 't'} pas cette question (version antérieure du questionnaire) et n'est pas comptée.`);
    add({
      id: 'continuation',
      section: 'quantitative',
      title: `${yes(rm)} mentors sur ${rm.total} et ${yes(re)} mentorés sur ${re.total} se disent intéressés par une nouvelle expérience de mentorat`,
      source: `${SURVEY_SOURCE}, n = ${rm.total} mentors et ${re.total} mentorés`,
      reading: ['Question générale et hypothétique : elle ne vaut pas engagement.', ...missingNotes].join(' '),
      chart: {
        type: 'stacked',
        rows,
        legend: CONTINUATION_OPTIONS.map(([, label], i) => ({ label, color: [...FIGURE_COLORS.scale5].reverse()[i] })),
      },
      checks: rows.flatMap((r) => [
        { label: r.label, drawn: sum(r.segments.map((s) => s.value)), announced: r.total },
        { label: `${r.label} : n + réponses sans cette question = répondants`, drawn: r.total + r.missing, announced: respondents[r.role] },
      ]),
    });
  }

  // ======================================================== 8. Analyse (version interne)
  if (isInternal && (m.pair_scores || []).length) {
    const names = new Map(binomes.map((b) => [b.binome_id, b]));
    const rows = m.pair_scores
      .map((p) => ({
        label: names.get(p.binome_id)?.mentor_name || '—',
        sublabel: names.get(p.binome_id)?.mentore_name || '—',
        nps: [p.mentor_nps, p.mentore_nps],
        relation: [p.mentor_relationship, p.mentore_relationship],
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const bigGaps = rows.filter((r) => r.nps[0] !== null && r.nps[1] !== null && Math.abs(r.nps[0] - r.nps[1]) >= 4).length;
    add({
      id: 'pair_views',
      section: 'analysis',
      title: `Sur ${rows.length} binômes où les deux ont répondu, ${bigGaps} présentent un écart de 4 points ou plus sur la note de recommandation`,
      source: `${SURVEY_SOURCE}, n = ${rows.length} binômes (mentor et mentoré répondants)`,
      reading: 'Un écart ne dit pas qui a raison : il signale une perception différente de la relation, à discuter avec le binôme. Document interne.',
      chart: {
        type: 'dumbbell',
        rows,
        panels: [
          { key: 'nps', title: 'Recommandation (0 à 10)', min: 0, max: 10, ticks: [0, 2, 4, 6, 8, 10] },
          { key: 'relation', title: 'Qualité de la relation (1 à 5)', min: 1, max: 5, ticks: [1, 2, 3, 4, 5] },
        ],
      },
      checks: [{ label: 'Binômes', drawn: rows.length, announced: binomes.filter((b) => b.mentor_responded && b.mentore_responded).length }],
    });
  }

  if (isInternal && binomes.length) {
    const total = binomes.length;
    const count = (level) => binomes.filter((b) => (b.vigilance || 'en_attente') === level).length;
    const rows = [
      { label: 'Prioritaire', value: count('rouge'), total },
      { label: 'À surveiller', value: count('orange'), total },
      { label: 'Sans alerte', value: count('vert'), total },
      { label: 'Aucune réponse au sondage', value: count('en_attente'), total },
    ];
    add({
      id: 'vigilance',
      section: 'analysis',
      title: `${rows[0].value} binômes sur ${total} sont classés prioritaires, ${rows[1].value} à surveiller`,
      source: `${SURVEY_SOURCE}, n = ${total} binômes`,
      reading: 'Prioritaire : une note de recommandation inférieure ou égale à 6, ou 4 points d\'écart entre mentor et mentoré. À surveiller : une note de 7 ou 8. Document interne.',
      chart: { type: 'hbar', panels: [{ rows, max: total, color: FIGURE_COLORS.neutral }] },
      checks: [{ label: 'Binômes', drawn: sum(rows.map((r) => r.value)), announced: total }],
    });
  }

  // Numérotation dans l'ordre du document.
  return figures.map((f, i) => ({ ...f, number: i + 1 }));
}

// Renvoi « figure 3 » / « figures 3 et 4 » à partir des identifiants.
// Une figure absente n'est pas citée ; aucune -> chaîne vide.
export function figureRef(figures, ...ids) {
  const nums = ids.map((id) => figures.find((f) => f.id === id)?.number).filter(Boolean);
  if (!nums.length) return '';
  return nums.length === 1 ? `voir figure ${nums[0]}` : `voir figures ${joinFr(nums.map(String))}`;
}

export const SECTION_LABEL = {
  presentation: '3. Présentation du programme',
  methodology: '4. Méthodologie',
  quantitative: '6. Résultats quantitatifs du sondage',
  analysis: '8. Analyse',
};
