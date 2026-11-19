// Non-répondants du mois : nom, rôle, et deux boutons pour WhatsApp :
// « Copier le lien » et « Copier le message de relance ».
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare } from 'lucide-react';
import { checkinStatus } from '@/lib/cohort2Alerts';
import { checkinUrl, copyText, fillTemplate, firstNameOf, periodLabel } from '@/lib/cohort2Data';
import { ROLE_LABEL } from '@/config/coordinationRules';

export default function NonRespondents({ data, period, settings }) {
  const rows = [];
  for (const b of data.binomes) {
    if (!b.checkin_enabled && !b.is_test) continue;
    for (const role of ['mentor', 'mentore']) {
      const { status } = checkinStatus(data, b.id, role, period);
      if (status !== 'pending' && status !== 'missed') continue;
      const link = data.links.find((l) => l.binome_id === b.id && l.role === role && !l.revoked_at);
      const fullName = role === 'mentor' ? b.mentor_name : b.mentore_name;
      rows.push({ key: `${b.id}-${role}`, binome: b, role, fullName, status, link });
    }
  }

  const copy = async (text, what) => {
    try {
      await copyText(text);
      toast.success(`${what} copié.`);
    } catch {
      toast.error('Copie impossible : sélectionnez le texte à la main.');
    }
  };

  const reminderFor = (row) => fillTemplate(settings?.templates?.reminder, {
    prenom: firstNameOf(row.fullName),
    lien: row.link ? checkinUrl(row.link.token) : '',
    mois: periodLabel(period),
  });

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 p-4">Aucun non-répondant pour {periodLabel(period)} parmi les binômes activés.</p>;
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
      <p className="p-4 text-sm text-gray-600">
        {rows.length} réponse(s) manquante(s) pour {periodLabel(period)}. Copiez le message, puis collez-le dans WhatsApp.
      </p>
      {rows.map((row) => (
        <div key={row.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium text-gray-800">{row.fullName}</p>
            <p className="text-xs text-gray-500">
              {ROLE_LABEL[row.role]} · {row.status === 'missed' ? 'mois clos, check-in manquant' : 'en attente'}
              {!row.link && ' · aucun lien actif (onglet « Liens »)'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!row.link} onClick={() => copy(checkinUrl(row.link.token), 'Lien')}>
              <Copy className="h-4 w-4 mr-1" /> Copier le lien
            </Button>
            <Button size="sm" disabled={!row.link} onClick={() => copy(reminderFor(row), 'Message de relance')} className="bg-emerald-700 hover:bg-emerald-800">
              <MessageSquare className="h-4 w-4 mr-1" /> Copier le message de relance
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
