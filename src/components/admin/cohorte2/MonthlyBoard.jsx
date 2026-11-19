// Tableau du mois : pour chaque binôme, check-in du mentor et du mentoré
// (reçu / en attente / manquant), humeur et niveau d'alerte avec ses raisons.
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { computeAlert, ALERT_STYLE, STATUS_LABEL } from '@/lib/cohort2Alerts';
import { firstNameOf, periodLabel } from '@/lib/cohort2Data';
import { MOOD_EMOJI } from '@/config/coordinationRules';

const STATUS_CLASS = {
  received: 'text-emerald-700',
  pending: 'text-amber-700',
  missed: 'text-red-700 font-semibold',
  not_tracked: 'text-gray-400',
};

function RoleCell({ state }) {
  const c = state?.checkin;
  return (
    <div className="text-sm">
      <span className={STATUS_CLASS[state?.status] || 'text-gray-400'}>{STATUS_LABEL[state?.status] || '—'}</span>
      {c && <span className="ml-2" title="Humeur">{MOOD_EMOJI[c.mood] || ''}</span>}
      {c?.entered_by === 'coordinator' && <span className="ml-1 text-[10px] text-gray-400">(saisi par la coordination)</span>}
    </div>
  );
}

export default function MonthlyBoard({ data, period, openSheet }) {
  if (data.binomes.length === 0) {
    return <p className="text-sm text-gray-500 p-4">Aucun binôme de la cohorte 2 pour l'instant. Ajoutez-en dans « Réglages et binômes ».</p>;
  }

  const rows = data.binomes.map((b) => ({ binome: b, alert: computeAlert(data, b, period) }));

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-x-auto">
      <p className="px-4 pt-4 text-sm text-gray-600">Check-ins de {periodLabel(period)}.</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
            <th className="p-3">Binôme</th>
            <th className="p-3">Mentor</th>
            <th className="p-3">Mentoré(e)</th>
            <th className="p-3">Alerte</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ binome: b, alert }) => (
            <tr key={b.id} className="border-b border-gray-50 align-top">
              <td className="p-3">
                <p className="font-medium text-gray-800">{firstNameOf(b.mentor_name)} / {firstNameOf(b.mentore_name)}</p>
                {b.is_test && <Badge variant="outline" className="text-[10px] mt-1">binôme test</Badge>}
              </td>
              <td className="p-3"><RoleCell state={alert.statuses.mentor} /></td>
              <td className="p-3"><RoleCell state={alert.statuses.mentore} /></td>
              <td className="p-3 min-w-[16rem]">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ALERT_STYLE[alert.level].className}`}>{ALERT_STYLE[alert.level].label}</span>
                {alert.reasons.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-xs text-gray-600 space-y-0.5">
                    {alert.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </td>
              <td className="p-3">
                <Button variant="outline" size="sm" onClick={() => openSheet(b.id)}>Fiche</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
