// Gestion des liens personnels : générer les liens manquants, copier un lien
// (ou le message du check-in du 25), révoquer, régénérer.
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Ban, Link2, MessageSquare } from 'lucide-react';
import { coordinationApi, checkinUrl, copyText, errorText, fillTemplate, firstNameOf, periodLabel } from '@/lib/cohort2Data';
import { ROLE_LABEL } from '@/config/coordinationRules';

export default function LinksPanel({ data, period, settings, refresh }) {
  const run = async (action, success) => {
    try {
      const result = await action();
      toast.success(typeof success === 'function' ? success(result) : success);
      refresh();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const copy = async (text, what) => {
    try {
      await copyText(text);
      toast.success(`${what} copié.`);
    } catch {
      toast.error('Copie impossible : sélectionnez le texte à la main.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">
          Un lien par participant, valable toute la cohorte. Révoquer un lien le rend inutilisable ; régénérer en crée un nouveau.
        </p>
        <Button onClick={() => run(() => coordinationApi.generateLinks(null), (n) => `${n} lien(s) créé(s).`)}>
          <Link2 className="h-4 w-4 mr-1" /> Générer les liens manquants (cohorte 2)
        </Button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
        {data.binomes.map((b) => ['mentor', 'mentore'].map((role) => {
          const link = data.links.find((l) => l.binome_id === b.id && l.role === role && !l.revoked_at);
          const fullName = role === 'mentor' ? b.mentor_name : b.mentore_name;
          const message = link ? fillTemplate(settings?.templates?.checkin, {
            prenom: firstNameOf(fullName), lien: checkinUrl(link.token), mois: periodLabel(period),
          }) : '';
          return (
            <div key={`${b.id}-${role}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-gray-800">{fullName}{b.is_test ? ' (binôme test)' : ''}</p>
                <p className="text-xs text-gray-500">{ROLE_LABEL[role]} · {link ? `lien créé le ${new Date(link.created_at).toLocaleDateString('fr-FR')}` : 'aucun lien actif'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {link ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => copy(checkinUrl(link.token), 'Lien')}><Copy className="h-4 w-4 mr-1" /> Lien</Button>
                    <Button variant="outline" size="sm" onClick={() => copy(message, 'Message du check-in')}><MessageSquare className="h-4 w-4 mr-1" /> Message du 25</Button>
                    <Button variant="outline" size="sm"
                      onClick={() => window.confirm('Régénérer ce lien ? L\'ancien ne fonctionnera plus.')
                        && run(() => coordinationApi.regenerateLink(b.id, role), 'Nouveau lien créé.')}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Régénérer
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600"
                      onClick={() => window.confirm('Révoquer ce lien ? Le participant ne pourra plus répondre avec.')
                        && run(() => coordinationApi.revokeLink(b.id, role), 'Lien révoqué.')}>
                      <Ban className="h-4 w-4 mr-1" /> Révoquer
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => run(() => coordinationApi.generateLinks(b.id), 'Lien créé.')}>Créer le lien</Button>
                )}
              </div>
            </div>
          );
        }))}
        {data.binomes.length === 0 && <p className="p-4 text-sm text-gray-500">Aucun binôme.</p>}
      </div>
    </div>
  );
}
