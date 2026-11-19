// Données de l'espace « Cohorte 2 » (admin seulement).
//
// Lectures : directement sur les tables, protégées par RLS (seul un admin
// obtient des lignes). Écritures : uniquement par les fonctions SQL admin_*
// (migration M6), qui vérifient elles-mêmes le rôle admin.
//
// Périmètre : binômes de la cohorte 2 (is_test = false). Le binôme test n'est
// ajouté que si la case « Inclure le binôme test (essais) » est cochée.
import { supabase } from '@/api/base44Client';
import { CHECKIN_CLOSING_DAY } from '@/config/coordinationRules';

// ---------------------------------------------------------------------------
// Mois au format 'YYYY-MM'
// ---------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');

export function toPeriod(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

// Décale un mois : shiftPeriod('2026-01', -1) -> '2025-12'
export function shiftPeriod(period, delta) {
  const [y, m] = period.split('-').map(Number);
  return toPeriod(new Date(Date.UTC(y, m - 1 + delta, 1)));
}

// Même règle que la fonction SQL current_checkin_period() (heure de Lomé = UTC).
export function currentCheckinPeriod(now = new Date()) {
  return now.getUTCDate() <= CHECKIN_CLOSING_DAY ? shiftPeriod(toPeriod(now), -1) : toPeriod(now);
}

// Fin de la période de modification d'un mois : le 10 du mois suivant, 23 h 59.
export function periodClosesAt(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m, CHECKIN_CLOSING_DAY, 23, 59, 59));
}

export function isPeriodClosed(period, now = new Date()) {
  return now > periodClosesAt(period);
}

// '2026-11' -> 'novembre 2026'
export function periodLabel(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Prénom à partir d'un nom « NOM Prénoms » (même règle que first_name_of en SQL)
// ---------------------------------------------------------------------------
export function firstNameOf(fullName) {
  const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const isLastName = (w) => {
    const letters = w.replace(/[^\p{L}]/gu, '');
    return letters.length > 1 && w === w.toUpperCase();
  };
  const given = words.filter((w) => !isLastName(w));
  return given.find((w) => w.replace(/\./g, '').length > 2) || given[0] || words[0] || '';
}

// ---------------------------------------------------------------------------
// Liens et messages
// ---------------------------------------------------------------------------
export function checkinUrl(token) {
  return `${window.location.origin}/m/${token}`;
}

// Remplace {prenom}, {lien}, {mois} dans un message type.
export function fillTemplate(text, values) {
  return String(text || '').replace(/\{(prenom|lien|mois)\}/g, (_, key) => values[key] ?? '');
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------
const check = ({ data, error }) => {
  if (error) throw error;
  return data ?? [];
};

const BINOME_COLUMNS = 'id, cohorte, mentor_id, mentore_id, mentor_name, mentore_name, mentor_email, mentore_email, match_date, status, is_test, checkin_enabled';

// Tout ce dont l'espace a besoin, en une fois (une dizaine de binômes).
export async function fetchCoordinationData({ includeTest = false } = {}) {
  const binomes = check(await supabase.from('binome').select(BINOME_COLUMNS)
    .or('cohorte.eq.2,is_test.eq.true').eq('status', 'active').order('match_date'))
    .filter((b) => (b.is_test ? includeTest : b.cohorte === '2'));

  const ids = binomes.map((b) => b.id);
  if (ids.length === 0) {
    return { binomes, objectives: [], progress: [], links: [], checkins: [], log: [] };
  }

  const [objectives, links, checkins, log] = await Promise.all([
    supabase.from('cohort_objectives').select('*').in('binome_id', ids).order('created_at').then(check),
    supabase.from('checkin_links').select('*').in('binome_id', ids).order('created_at').then(check),
    supabase.from('checkins').select('*').in('binome_id', ids).order('period').then(check),
    supabase.from('coordination_log').select('*').in('binome_id', ids).order('event_date', { ascending: false }).then(check),
  ]);

  const objectiveIds = objectives.map((o) => o.id);
  const progress = objectiveIds.length
    ? check(await supabase.from('objective_progress').select('*').in('objective_id', objectiveIds).order('created_at'))
    : [];

  return { binomes, objectives, progress, links, checkins, log };
}

// Profils disponibles pour créer un binôme de la cohorte 2.
export async function fetchProfiles() {
  const [mentors, mentores] = await Promise.all([
    supabase.from('mentor').select('id, full_name, email, status').order('full_name').then(check),
    supabase.from('mentore').select('id, full_name, email, status').order('full_name').then(check),
  ]);
  return { mentors, mentores };
}

// ---------------------------------------------------------------------------
// Écritures (fonctions SQL admin_*)
// ---------------------------------------------------------------------------
async function rpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data;
}

export const coordinationApi = {
  getSettings: () => rpc('admin_get_coordination_settings'),
  setCheckinsOpen: (open) => rpc('admin_set_checkins_open', { p_open: open }),
  setTemplates: (templates) => rpc('admin_set_message_templates', { p_templates: templates }),
  setCheckinEnabled: (binomeId, enabled) => rpc('admin_set_checkin_enabled', { p_binome_id: binomeId, p_enabled: enabled }),
  createBinome: (mentorId, mentoreId, startDate) =>
    rpc('admin_create_cohort2_binome', { p_mentor_id: mentorId, p_mentore_id: mentoreId, p_start_date: startDate || null }),
  createObjective: (binomeId, title, criteria, dueDate) =>
    rpc('admin_create_objective', { p_binome_id: binomeId, p_title: title, p_success_criteria: criteria || null, p_due_date: dueDate || null }),
  adjustObjective: (objectiveId, title, criteria, dueDate, reason) =>
    rpc('admin_adjust_objective', { p_objective_id: objectiveId, p_title: title, p_success_criteria: criteria || null, p_due_date: dueDate || null, p_reason: reason }),
  closeObjective: (objectiveId, status, reason) =>
    rpc('admin_close_objective', { p_objective_id: objectiveId, p_status: status, p_reason: reason }),
  declareProgress: (objectiveId, pct, comment) =>
    rpc('admin_declare_progress', { p_objective_id: objectiveId, p_progress_pct: pct, p_comment: comment || null }),
  generateLinks: (binomeId = null) => rpc('admin_generate_checkin_links', { p_binome_id: binomeId }),
  regenerateLink: (binomeId, role) => rpc('admin_regenerate_checkin_link', { p_binome_id: binomeId, p_role: role }),
  revokeLink: (binomeId, role) => rpc('admin_revoke_checkin_link', { p_binome_id: binomeId, p_role: role }),
  addLogEntry: (binomeId, eventDate, eventType, summary) =>
    rpc('admin_add_coordination_entry', { p_binome_id: binomeId, p_event_date: eventDate || null, p_event_type: eventType, p_summary: summary }),
};

// Message d'erreur lisible à partir d'une erreur Supabase.
const ERROR_TEXT = {
  not_authorized: 'Action réservée aux administrateurs.',
  max_active_objectives: 'Ce binôme a déjà 3 objectifs en cours.',
  mentore_already_paired: 'Ce mentoré fait déjà partie d\'un binôme actif de la cohorte 2.',
  objective_not_active: 'Cet objectif n\'est plus en cours.',
  binome_not_in_cohort2: 'Ce binôme ne fait pas partie de la cohorte 2.',
  cohort_objectives_reason_required: 'Une raison est obligatoire.',
};
export function errorText(error) {
  const message = error?.message || '';
  const key = Object.keys(ERROR_TEXT).find((k) => message.includes(k));
  return key ? ERROR_TEXT[key] : `Erreur : ${message || 'inconnue'}`;
}
