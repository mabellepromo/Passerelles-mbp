// Onglet « Binômes » : une fiche par binôme officiel (les 11).
// Vue d'ensemble : vue SQL official_binome_overview.
// Détail (au clic) : objectifs du journal de bord et contenu des fiches de séance.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Check, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchBinomeOverview, fetchOfficialJournal, fetchOfficialSuivis } from '@/lib/programData';
import { VigilanceBadge, Loader } from './shared';

const OBJECTIVE_STATUS_LABEL = {
  en_cours: 'En cours',
  atteint: 'Atteint',
  abandonne: 'Abandonné',
  reporte: 'Reporté',
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

// « A répondu » / « n'a pas répondu », avec icône ET texte (pas la couleur seule).
function Responded({ value, nps }) {
  return value
    ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" /> {nps ?? '—'}/10</span>
    : <span className="inline-flex items-center gap-1 text-gray-400"><Minus className="h-3.5 w-3.5" /> pas de réponse</span>;
}

function BinomeDetail({ binome, objectives, fiches }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Objectifs (journal de bord)</p>
        {objectives.length === 0 ? (
          <p className="text-sm text-gray-500">Donnée non disponible : aucun objectif saisi sur la plateforme.</p>
        ) : (
          <ul className="space-y-2">
            {objectives.map((o) => (
              <li key={o.id} className="text-sm bg-white rounded-lg border border-gray-100 p-3">
                <p className="font-medium text-gray-800">{o.objectif_titre || o.titre || 'Objectif sans titre'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {OBJECTIVE_STATUS_LABEL[o.objectif_statut] || o.objectif_statut || 'Statut non renseigné'}
                  {' · '}progression {o.objectif_progression ?? 0} %
                  {' · '}échéance {formatDate(o.objectif_echeance)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Messages échangés sur la plateforme : {binome.messages_count}. Binôme formé le {formatDate(binome.match_date)}.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contenu des fiches de séance</p>
        {fiches.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune fiche enregistrée sur la plateforme (ce qui ne veut pas dire qu'aucune séance n'a eu lieu).</p>
        ) : (
          <ul className="space-y-2">
            {fiches.map((f) => (
              <li key={f.id} className="text-sm bg-white rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500">
                  {formatDate(f.meeting_date)} · saisie par {f.submitted_by === 'mentor' ? 'le mentor' : f.submitted_by === 'mentore' ? 'le mentoré' : 'auteur non identifié'}
                  {f.author_satisfaction ? ` · satisfaction de l'auteur ${f.author_satisfaction}/5` : ''}
                </p>
                {f.objectives_discussed && <p className="text-gray-700 mt-1"><strong>Objectifs abordés :</strong> {f.objectives_discussed}</p>}
                {f.challenges && <p className="text-gray-700 mt-1"><strong>Difficultés :</strong> {f.challenges}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function BinomesTab() {
  const [openId, setOpenId] = useState(null);

  const { data: binomes = [], isLoading } = useQuery({
    queryKey: ['official_binome_overview'], queryFn: fetchBinomeOverview,
  });
  const { data: journal = [] } = useQuery({
    queryKey: ['official_journal'], queryFn: () => fetchOfficialJournal('-date_entree'),
  });
  const { data: suivis = [] } = useQuery({
    queryKey: ['official_suivis', 'by_date'], queryFn: () => fetchOfficialSuivis('meeting_date'),
  });

  if (isLoading) return <Loader />;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Fiche par binôme ({binomes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 pr-2 w-6" />
                <th className="py-2 pr-4">Binôme</th>
                <th className="py-2 pr-4">Vigilance</th>
                <th className="py-2 pr-4">Sondage mentor</th>
                <th className="py-2 pr-4">Sondage mentoré</th>
                <th className="py-2 pr-4">Objectifs saisis</th>
              </tr>
            </thead>
            <tbody>
              {binomes.map((b) => {
                const isOpen = openId === b.binome_id;
                return (
                  <React.Fragment key={b.binome_id}>
                    <tr
                      className="border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                      onClick={() => setOpenId(isOpen ? null : b.binome_id)}
                    >
                      <td className="py-2.5 pr-2 text-gray-400">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-800">{b.mentor_name}</p>
                        <p className="text-xs text-gray-500">{b.mentore_name}</p>
                      </td>
                      <td className="py-2.5 pr-4"><VigilanceBadge level={b.vigilance} /></td>
                      <td className="py-2.5 pr-4"><Responded value={b.mentor_responded} nps={b.mentor_nps} /></td>
                      <td className="py-2.5 pr-4"><Responded value={b.mentore_responded} nps={b.mentore_nps} /></td>
                      <td className="py-2.5 pr-4">
                        {b.objectives_count > 0
                          ? <Badge variant="outline">{b.objectives_reached_count}/{b.objectives_count} atteint(s)</Badge>
                          : <span className="text-xs text-gray-400">donnée non disponible</span>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="py-3">
                          <BinomeDetail
                            binome={b}
                            objectives={journal.filter((j) => j.binome_id === b.binome_id && j.type === 'objectif')}
                            fiches={suivis.filter((s) => s.binome_id === b.binome_id)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Les notes affichées dans les colonnes « Sondage » sont les notes de recommandation (0 à 10). Clique sur un
          binôme pour voir ses objectifs et le contenu de ses fiches. Les réponses détaillées sont dans l'onglet « Sondage ».
        </p>
      </CardContent>
    </Card>
  );
}
