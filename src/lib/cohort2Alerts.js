// Calcul des alertes de la cohorte 2, pour un binôme et un mois donnés.
// Les seuils viennent de src/config/coordinationRules.js (un seul endroit).
//
// Statut d'un check-in pour un rôle et un mois :
//   received    : check-in reçu
//   pending     : pas encore reçu, mais le mois n'est pas clos (le 10 suivant)
//   missed      : pas reçu et le mois est clos
//   not_tracked : mois antérieur au premier lien envoyé à ce participant
//
// Niveaux : 'red', 'orange', 'green', ou 'inactive' (binôme pas encore activé).
import { ALERT_RULES, ROLE_LABEL } from '@/config/coordinationRules';
import { isPeriodClosed, shiftPeriod, toPeriod, periodClosesAt, periodLabel } from '@/lib/cohort2Data';

const ROLES = ['mentor', 'mentore'];

// Premier mois suivi pour un rôle : le mois du premier lien créé.
function trackingStart(links, binomeId, role) {
  const first = links
    .filter((l) => l.binome_id === binomeId && l.role === role)
    .map((l) => l.created_at)
    .sort()[0];
  return first ? toPeriod(new Date(first)) : null;
}

export function checkinStatus(data, binomeId, role, period, now = new Date()) {
  const received = data.checkins.find((c) => c.binome_id === binomeId && c.role === role && c.period === period);
  if (received) return { status: 'received', checkin: received };
  const start = trackingStart(data.links, binomeId, role);
  if (!start || period < start) return { status: 'not_tracked', checkin: null };
  return { status: isPeriodClosed(period, now) ? 'missed' : 'pending', checkin: null };
}

// Dernier avancement déclaré pour un objectif avant une date (tous déclarants,
// ou un seul si declaredBy est donné). null si aucune déclaration.
export function progressAt(progress, objectiveId, date, declaredBy = null) {
  const rows = progress.filter((p) => p.objective_id === objectiveId
    && (!declaredBy || p.declared_by === declaredBy)
    && new Date(p.created_at) <= date);
  return rows.length ? rows[rows.length - 1].progress_pct : null;
}

export function computeAlert(data, binome, period, now = new Date()) {
  if (!binome.checkin_enabled && !binome.is_test) {
    return { level: 'inactive', reasons: ['Binôme pas encore activé pour le check-in.'], statuses: {} };
  }

  const red = [];
  const orange = [];
  const statuses = {};

  for (const role of ROLES) {
    const current = checkinStatus(data, binome.id, role, period, now);
    statuses[role] = current;
    const who = ROLE_LABEL[role];

    if (current.checkin?.mood === 'bad') red.push(`${who} : humeur 😟 en ${periodLabel(period)}.`);
    if (current.checkin?.blocker_text) red.push(`${who} : blocage ou besoin signalé (« ${current.checkin.blocker_text} »).`);

    // Check-ins manqués consécutifs, en remontant depuis le mois choisi.
    let missedInARow = 0;
    for (let p = period; missedInARow < ALERT_RULES.redMissedInARow; p = shiftPeriod(p, -1)) {
      if (checkinStatus(data, binome.id, role, p, now).status !== 'missed') break;
      missedInARow += 1;
    }
    if (missedInARow >= ALERT_RULES.redMissedInARow) {
      red.push(`${who} : ${missedInARow} check-ins manqués de suite.`);
    } else if (missedInARow >= ALERT_RULES.orangeMissed) {
      orange.push(`${who} : check-in de ${periodLabel(period)} manqué.`);
    }
  }

  // Désaccord sur « avez-vous échangé ? » le même mois.
  const m = statuses.mentor?.checkin;
  const e = statuses.mentore?.checkin;
  if (m && e && m.had_exchange !== e.had_exchange) {
    red.push(`Désaccord sur les échanges du mois : le mentor dit « ${m.had_exchange ? 'oui' : 'non'} », le mentoré « ${e.had_exchange ? 'oui' : 'non'} ».`);
  }

  // Objectifs en cours.
  const periodEnd = periodClosesAt(period);
  const earlier = periodClosesAt(shiftPeriod(period, -ALERT_RULES.orangeNoProgressMonths));
  for (const o of data.objectives.filter((x) => x.binome_id === binome.id && x.status === 'in_progress')) {
    // Sans progression depuis N mois (seulement si l'objectif existait déjà).
    if (new Date(o.created_at) <= earlier) {
      const before = progressAt(data.progress, o.id, earlier) ?? 0;
      const after = progressAt(data.progress, o.id, periodEnd) ?? 0;
      if (after <= before) {
        orange.push(`Objectif « ${o.title} » sans progression depuis ${ALERT_RULES.orangeNoProgressMonths} mois (${after} %).`);
      }
    }
    // Écart entre mentor et mentoré.
    const pm = progressAt(data.progress, o.id, periodEnd, 'mentor');
    const pe = progressAt(data.progress, o.id, periodEnd, 'mentore');
    if (pm !== null && pe !== null && Math.abs(pm - pe) > ALERT_RULES.orangeProgressGap) {
      orange.push(`Objectif « ${o.title} » : avancement de ${pm} % selon le mentor, ${pe} % selon le mentoré.`);
    }
  }

  if (red.length) return { level: 'red', reasons: [...red, ...orange], statuses };
  if (orange.length) return { level: 'orange', reasons: orange, statuses };
  return { level: 'green', reasons: [], statuses };
}

export const ALERT_STYLE = {
  red: { label: 'Rouge', className: 'bg-red-100 text-red-700' },
  orange: { label: 'Orange', className: 'bg-amber-100 text-amber-700' },
  green: { label: 'Vert', className: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Non activé', className: 'bg-gray-100 text-gray-500' },
};

export const STATUS_LABEL = {
  received: 'Reçu',
  pending: 'En attente',
  missed: 'Manquant',
  not_tracked: '—',
};
