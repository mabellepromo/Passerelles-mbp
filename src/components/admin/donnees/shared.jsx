// Petits composants et libellés partagés par les onglets de « Données & Bilan ».
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Couleurs des deux rôles (identiques dans tous les graphiques de la rubrique).
export const ROLE_COLORS = { mentor: '#1a7a45', mentore: '#7c3aed' };
export const ROLE_LABELS = { mentor: 'Mentors', mentore: 'Mentorés' };

// Couleurs du NPS. Elles sont toujours accompagnées d'un libellé et d'un effectif.
export const NPS_COLORS = { promoters: '#059669', passives: '#d97706', detractors: '#dc2626' };

// Libellés des questions du sondage : définis dans src/lib/surveyLabels.js
// (fichier sans interface, réutilisé par le PDF) et ré-exportés ici.
export {
  QUESTION_LABELS, COMMON_QUESTIONS, MENTOR_ONLY_QUESTIONS, MENTORE_ONLY_QUESTIONS,
} from '@/lib/surveyLabels';

// « 7/11 (64 %) » : on donne toujours l'effectif avec le pourcentage.
export function formatShare(count, total) {
  if (!total) return `${count ?? 0}/0`;
  return `${count}/${total} (${Math.round((count / total) * 100)} %)`;
}

// Nombre décimal à la française : 4.25 -> « 4,25 ».
export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(digits).replace('.', ',');
}

export function StatCard({ label, value, sub, icon: Icon, color = '#1a7a45' }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 bg-white">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-4 w-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// Bandeau d'avertissement (garde-fou, données incomplètes, limites).
export function WarningBanner({ title, children, tone = 'amber' }) {
  const styles = tone === 'red'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles}`} role="alert">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

const VIGILANCE_STYLE = {
  vert: { label: 'OK', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  orange: { label: 'À surveiller', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  rouge: { label: 'Prioritaire', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  en_attente: { label: 'Aucune réponse', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
};

// Le niveau de vigilance vient de la vue SQL review_pair_vigilance (règle unique).
export function VigilanceBadge({ level }) {
  const style = VIGILANCE_STYLE[level] || VIGILANCE_STYLE.en_attente;
  return <Badge className={style.className}>{style.label}</Badge>;
}

// Barre du NPS : trois segments proportionnels, chacun avec libellé et effectif.
export function NpsBar({ promoters = 0, passives = 0, detractors = 0 }) {
  const total = promoters + passives + detractors;
  const segments = [
    { key: 'promoters', label: 'Promoteurs (9-10)', count: promoters },
    { key: 'passives', label: 'Passifs (7-8)', count: passives },
    { key: 'detractors', label: 'Détracteurs (0-6)', count: detractors },
  ];
  if (!total) return <p className="text-sm text-gray-400">Donnée non disponible.</p>;
  return (
    <div>
      <div className="flex h-5 w-full gap-0.5 rounded overflow-hidden" aria-hidden="true">
        {segments.filter((s) => s.count > 0).map((s) => (
          <div
            key={s.key}
            title={`${s.label} : ${formatShare(s.count, total)}`}
            style={{ width: `${(s.count / total) * 100}%`, background: NPS_COLORS[s.key] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-700">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: NPS_COLORS[s.key] }} />
            {s.label} : <strong>{formatShare(s.count, total)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
    </div>
  );
}
