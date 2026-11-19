// Messages types (check-in du 25, relance J+3, remerciement, mi-parcours).
// Le texte est stocké à un seul endroit (app_config) et modifiable ici.
// Variables : {prenom}, {lien}, {mois}.
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Save } from 'lucide-react';
import { coordinationApi, copyText, errorText } from '@/lib/cohort2Data';
import { TEMPLATE_LABEL } from '@/config/coordinationRules';

export default function TemplatesPanel({ settings, refresh }) {
  const [templates, setTemplates] = useState({});
  useEffect(() => { setTemplates(settings?.templates || {}); }, [settings]);

  const save = async () => {
    try {
      await coordinationApi.setTemplates(templates);
      toast.success('Messages enregistrés.');
      refresh();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">
        Variables remplacées automatiquement : <code>{'{prenom}'}</code>, <code>{'{lien}'}</code>, <code>{'{mois}'}</code>.
        Les boutons « Copier » de l'onglet « Non-répondants » et « Liens » remplissent ces variables pour chaque participant.
      </p>
      {Object.entries(TEMPLATE_LABEL).map(([key, label]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <Button variant="ghost" size="sm" onClick={() => copyText(templates[key] || '').then(() => toast.success('Message copié.'))}>
              <Copy className="h-4 w-4 mr-1" /> Copier le modèle
            </Button>
          </div>
          <Textarea rows={3} value={templates[key] || ''} onChange={(e) => setTemplates((t) => ({ ...t, [key]: e.target.value }))} />
        </div>
      ))}
      <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Enregistrer les messages</Button>
    </div>
  );
}
