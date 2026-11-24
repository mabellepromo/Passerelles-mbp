// src/lib/bilanBureau/values.js
// Bilan de la cohorte 1 « version bureau » : TOUS les chiffres du rapport.
//
// Les textes rédigés (stockés en base, modifiables par l'admin) ne contiennent
// aucun chiffre : ils citent des repères {{cle}} remplacés au rendu par les
// valeurs calculées ici. Les valeurs viennent uniquement des données
// enregistrées avec le rapport :
//   - report.metrics           : agrégats SQL (vues filtrées is_test = false) ;
//   - report.metrics.snapshot  : photographie des données à la génération ;
//   - report.ai_analysis.pair_notes : classement qualitatif des binômes.
// Une valeur absente s'affiche « donnée non disponible », jamais zéro.

import { NOT_AVAILABLE, formatDateFr } from '@/lib/reportContent';

export const BUREAU_FORMAT = 'bilan_bureau';

// Libellés de l'état de la relation (classement qualitatif).
export const RELATION_LABEL = {
  active: 'Relation active',
  limitee: 'Démarrage limité',
  non_etablie: 'Relation jamais établie',
  inconnue: 'Pas de réponse exploitable',
};
// Libellés courts pour l'annexe A.
export const RELATION_SHORT = { active: 'Active', limitee: 'Démarrage limité', non_etablie: 'Jamais établie', inconnue: 'Inconnu' };

const sum = (list) => list.reduce((s, v) => s + (Number(v) || 0), 0);
// Nombre à la française, une décimale : 2.43 -> « 2,4 »
export const fr1 = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? NOT_AVAILABLE : Number(v).toFixed(1).replace('.', ','));
const signed = (v) => (v === null ? NOT_AVAILABLE : v > 0 ? `+${v}` : String(v));
const npsScore = (p, d, n) => (n ? Math.round(((p - d) / n) * 100) : null);

// Répartition d'une question notée de 1 à 5 pour un rôle.
export function likert(report, role, questionId) {
  const row = (report.metrics?.likert_by_question || []).find((l) => l.role === role && l.question_id === questionId);
  if (!row) return null;
  const counts = [1, 2, 3, 4, 5].map((k) => Number(row.distribution?.[String(k)] ?? 0));
  const n = sum(counts);
  if (!n) return null;
  return {
    counts,
    n,
    mean: sum(counts.map((c, i) => c * (i + 1))) / n,
    // count(4) : nombre de réponses égales à 4 ; range(4, 5) : notes 4 ou 5.
    count: (k) => counts[k - 1],
    range: (a, b) => sum(counts.slice(a - 1, b)),
  };
}

// Notes de recommandation (0 à 10) d'un rôle.
export function npsOf(report, role) {
  const row = (report.metrics?.nps || []).find((r) => r.role === role);
  if (!row) return null;
  const hist = (report.metrics?.nps_histogram || []).filter((h) => h.role === role);
  const scores = hist.filter((h) => Number(h.n) > 0).map((h) => Number(h.score));
  const n = Number(row.total_nps);
  return {
    n,
    promoters: Number(row.promoters),
    passives: Number(row.passives),
    detractors: Number(row.detractors),
    mean: row.avg_nps,
    score: npsScore(Number(row.promoters), Number(row.detractors), n),
    countOf: (score) => Number(hist.find((h) => Number(h.score) === score)?.n ?? 0),
    min: scores.length ? Math.min(...scores) : null,
    max: scores.length ? Math.max(...scores) : null,
  };
}

// Intérêt déclaré pour une nouvelle expérience (réponses « oui »).
export function continuationOf(report, role) {
  const rows = (report.metrics?.continuation_distribution || []).filter((c) => c.role === role);
  if (!rows.length) return null;
  return {
    yes: sum(rows.filter((r) => String(r.bucket).startsWith('yes')).map((r) => r.n)),
    n: sum(rows.map((r) => r.n)),
  };
}

// Classement qualitatif des binômes (statuts stockés avec le rapport).
export function relationCounts(report) {
  const notes = report.ai_analysis?.pair_notes || [];
  const count = (status) => notes.filter((p) => p.status === status).length;
  return { active: count('active'), limitee: count('limitee'), non_etablie: count('non_etablie'), inconnue: count('inconnue'), total: notes.length };
}

// Petits nombres en lettres (« Six binômes sur onze ») ; au-delà, en chiffres.
const WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt'];
const inWords = (n) => (n === null || n === undefined ? null : WORDS[n] ?? String(n));
const capitalize = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

const dayMonth = (value) => (value
  ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Africa/Lome' })
  : NOT_AVAILABLE);

/**
 * Toutes les valeurs citables dans les textes, sous forme de texte prêt à
 * afficher. Clé -> { value, label } ; label sert à l'aide affichée à l'admin.
 */
export function buildBureauValues(report) {
  const m = report?.metrics || {};
  const snap = m.snapshot || {};
  const s = snap.survey_summary || {};
  const fu = snap.follow_up || {};
  const links = fu.survey_links || {};
  const apps = snap.applications || {};
  const binomes = snap.binomes || [];
  const campaign = snap.campaign;

  const npsM = npsOf(report, 'mentor');
  const npsE = npsOf(report, 'mentore');
  const benefit = likert(report, 'mentor', 'own_benefit');
  const objM = likert(report, 'mentor', 'objectives_achieved');
  const objE = likert(report, 'mentore', 'objectives_achieved');
  const contM = continuationOf(report, 'mentor');
  const contE = continuationOf(report, 'mentore');
  const rel = relationCounts(report);
  const ease = ['mentor', 'mentore'].map((r) => likert(report, r, 'platform_ease')).filter(Boolean);
  const burden = ['mentor', 'mentore'].map((r) => likert(report, r, 'monthly_forms_burden')).filter(Boolean);
  const themes = report?.ai_analysis?.source_themes || [];
  const availabilityTheme = themes.find((t) => /disponibilit/i.test(t.theme || ''));

  const v = (value, label) => ({ value: value === null || value === undefined || Number.isNaN(value) ? NOT_AVAILABLE : String(value), label });
  const invited = s.mentors_invited != null && s.mentores_invited != null ? s.mentors_invited + s.mentores_invited : null;

  return {
    // Périmètre et participation
    binomes: v(s.binomes_count ?? binomes.length, 'binômes officiels'),
    participants: v(invited, 'participants (mentors + mentorés)'),
    invites: v(invited, 'personnes invitées au sondage'),
    reponses: v(s.responses_total, 'réponses au sondage'),
    mentors_invites: v(s.mentors_invited, 'mentors invités'),
    mentors_repondants: v(s.mentor_responses, 'mentors répondants'),
    mentors_non_repondants: v(s.mentors_invited != null ? s.mentors_invited - s.mentor_responses : null, 'mentors sans réponse'),
    mentores_invites: v(s.mentores_invited, 'mentorés invités'),
    mentores_repondants: v(s.mentore_responses, 'mentorés répondants'),
    // Sondage et relances
    sondage_debut: v(campaign ? dayMonth(campaign.launched_at) : null, 'ouverture du sondage (jour et mois)'),
    sondage_fin: v(campaign ? formatDateFr(campaign.deadline) : null, 'clôture du sondage'),
    invitations: v(links.invitations, 'invitations envoyées par email'),
    relances_email: v(links.reminders, 'relances envoyées par email'),
    reponses_avant_relance: v(links.responses_before_first_reminder, 'réponses avant la première relance'),
    reponses_periode_relance: v(links.responses_from_last_reminder, 'réponses à partir de la dernière relance (période des relances WhatsApp)'),
    // Candidatures
    cand_mentors: v(apps.mentors, 'candidatures de mentors (tests exclus)'),
    cand_mentores: v(apps.mentores, 'candidatures de mentorés (tests exclus)'),
    mentores_non_retenus: v(apps.mentores != null && s.binomes_count != null ? apps.mentores - s.binomes_count : null, 'candidatures de mentorés non retenues'),
    // État des relations
    rel_active: v(rel.total ? rel.active : null, 'binômes en relation active'),
    rel_limitee: v(rel.total ? rel.limitee : null, 'binômes au démarrage limité'),
    rel_non_etablie: v(rel.total ? rel.non_etablie : null, 'binômes jamais établis'),
    rel_active_lettres_maj: v(rel.total ? capitalize(inWords(rel.active)) : null, 'binômes actifs, en lettres (majuscule)'),
    binomes_lettres: v(inWords(s.binomes_count ?? binomes.length), 'binômes officiels, en lettres'),
    rel_difficulte: v(rel.total ? rel.limitee + rel.non_etablie : null, 'binômes en difficulté (limité + jamais établi)'),
    // Recommandation
    nps_mentors: v(npsM ? signed(npsM.score) : null, 'NPS des mentors'),
    nps_mentores: v(npsE ? signed(npsE.score) : null, 'NPS des mentorés'),
    nps_poids_mentor: v(npsM?.n ? Math.round(100 / npsM.n) : null, 'points de NPS déplacés par une réponse de mentor'),
    mentors_promoteurs: v(npsM?.promoters, 'mentors promoteurs (9-10)'),
    mentors_passifs: v(npsM?.passives, 'mentors passifs (7-8)'),
    mentors_detracteurs: v(npsM?.detractors, 'mentors détracteurs (0-6)'),
    mentores_promoteurs: v(npsE?.promoters, 'mentorés promoteurs (9-10)'),
    mentores_passifs: v(npsE?.passives, 'mentorés passifs'),
    mentores_detracteurs: v(npsE?.detractors, 'mentorés détracteurs'),
    mentors_reco_moy: v(npsM ? fr1(npsM.mean) : null, 'note de recommandation moyenne des mentors'),
    mentores_reco_moy: v(npsE ? fr1(npsE.mean) : null, 'note de recommandation moyenne des mentorés'),
    mentores_note10: v(npsE?.countOf(10), 'mentorés donnant 10'),
    // Bénéfice pour le mentor et objectifs
    mentors_benefice_1: v(benefit?.count(1), 'mentors notant leur bénéfice 1 sur 5'),
    mentors_benefice_bas: v(benefit?.range(1, 2), 'mentors notant leur bénéfice 1 ou 2 sur 5'),
    mentors_benefice_haut: v(benefit?.range(4, 5), 'mentors notant leur bénéfice 4 ou 5 sur 5'),
    mentors_benefice_moy: v(benefit ? fr1(benefit.mean) : null, 'bénéfice moyen pour les mentors'),
    mentors_objectifs_moy: v(objM ? fr1(objM.mean) : null, 'atteinte des objectifs, moyenne mentors'),
    mentors_objectifs_haut: v(objM?.range(4, 5), "mentors notant l'atteinte des objectifs 4 ou 5"),
    mentors_objectifs_1: v(objM?.count(1), "mentors notant l'atteinte des objectifs 1"),
    mentores_objectifs_moy: v(objE ? fr1(objE.mean) : null, 'atteinte des objectifs, moyenne mentorés'),
    mentores_objectifs_haut: v(objE?.range(4, 5), "mentorés notant l'atteinte des objectifs 4 ou 5"),
    // Envie de recommencer
    mentors_interesses: v(contM?.yes, 'mentors intéressés par une nouvelle expérience'),
    mentors_interet_n: v(contM?.n, 'mentors ayant répondu à cette question'),
    mentores_interesses: v(contE?.yes, 'mentorés intéressés par une nouvelle expérience'),
    mentores_interet_n: v(contE?.n, 'mentorés ayant répondu à cette question'),
    // Suivi sur la plateforme
    binomes_avec_fiche: v(fu.binomes_with_fiche, 'binômes ayant rempli au moins une fiche'),
    binomes_avec_objectifs: v(binomes.length ? binomes.filter((b) => b.objectives_count > 0).length : null, 'binômes ayant saisi des objectifs'),
    note_fiche_preremplie: v(snap.fiche_satisfaction?.all_notes_identical ? snap.fiche_satisfaction.single_value : null, 'note préremplie des fiches de séance'),
    suivi_lourd: v(burden.length ? sum(burden.map((b) => b.range(1, 2))) : null, 'répondants jugeant les fiches lourdes (1-2)'),
    suivi_difficile: v(ease.length ? sum(ease.map((b) => b.range(1, 2))) : null, 'répondants jugeant la plateforme difficile (1-2)'),
    mentions_disponibilite: v(availabilityTheme?.frequency, 'mentions de la disponibilité du mentor (réponses libres)'),
  };
}

// Remplace les repères {{cle}} d'un texte. Un repère inconnu reste visible,
// entouré de « ⚠ », pour être corrigé avant validation.
export function fillValues(text, values) {
  return String(text ?? '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (all, key) => (values[key] ? values[key].value : `⚠${all}⚠`));
}

// Repères inconnus présents dans un texte (contrôle avant validation).
export function unknownKeys(text, values) {
  return [...String(text ?? '').matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/g)].map((x) => x[1]).filter((k) => !values[k]);
}
