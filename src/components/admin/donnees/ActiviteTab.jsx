// Onglet « Activité » : uniquement le tableau des trois sources sur les séances.
//
// DÉCISION DU 11/11/2026 : une partie des séances n'a pas été enregistrée en
// ligne. Aucune des trois sources n'est fiable, donc :
//   - aucun graphique d'évolution, aucun indicateur de régularité ;
//   - ce tableau est à usage interne et n'apparaît dans AUCUN export du rapport.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBinomeOverview } from '@/lib/programData';
import { WarningBanner, Loader } from './shared';

// Tranches proposées dans le sondage -> [minimum, maximum] de séances.
const DECLARED_RANGES = {
  '0-1': [0, 1],
  '2-3': [2, 3],
  '4-5': [4, 5],
  '6 et plus': [6, Infinity],
};

// Liste les écarts entre les trois sources pour un binôme (texte lisible).
function describeGaps(b) {
  const gaps = [];
  if ((b.counter_total_meetings ?? 0) !== b.fiches_count) {
    gaps.push(`Compteur (${b.counter_total_meetings ?? 0}) différent du nombre de fiches (${b.fiches_count}).`);
  }
  const declared = [
    ['le mentor', b.sessions_declared_mentor],
    ['le mentoré', b.sessions_declared_mentore],
  ];
  for (const [who, bucket] of declared) {
    const range = DECLARED_RANGES[bucket];
    if (!range) continue;
    if (b.fiches_count < range[0]) gaps.push(`Moins de fiches (${b.fiches_count}) que la tranche déclarée par ${who} (${bucket}).`);
    if (b.fiches_count > range[1]) gaps.push(`Plus de fiches (${b.fiches_count}) que la tranche déclarée par ${who} (${bucket}).`);
  }
  if (b.sessions_declared_mentor && b.sessions_declared_mentore
    && b.sessions_declared_mentor !== b.sessions_declared_mentore) {
    gaps.push('Le mentor et le mentoré ne déclarent pas la même tranche.');
  }
  return gaps;
}

export default function ActiviteTab() {
  const { data: binomes = [], isLoading } = useQuery({
    queryKey: ['official_binome_overview'], queryFn: fetchBinomeOverview,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <WarningBanner title="Données incomplètes, usage interne" tone="red">
        Une partie des séances n'a pas été enregistrée sur la plateforme. Aucune de ces trois sources ne donne le nombre
        réel de séances : elles sont présentées côte à côte, sans total ni moyenne. Ce tableau n'apparaît dans aucun
        export du rapport de bilan.
      </WarningBanner>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Séances : trois sources par binôme</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Binôme</th>
                  <th className="py-2 pr-4">Fiches enregistrées</th>
                  <th className="py-2 pr-4">Compteur du binôme</th>
                  <th className="py-2 pr-4">Déclaré par le mentor</th>
                  <th className="py-2 pr-4">Déclaré par le mentoré</th>
                  <th className="py-2 pr-4">Écarts constatés</th>
                </tr>
              </thead>
              <tbody>
                {binomes.map((b) => {
                  const gaps = describeGaps(b);
                  return (
                    <tr key={b.binome_id} className="border-b border-gray-50 align-top">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-800">{b.mentor_name}</p>
                        <p className="text-xs text-gray-500">{b.mentore_name}</p>
                      </td>
                      <td className="py-2.5 pr-4">{b.fiches_count}</td>
                      <td className="py-2.5 pr-4">{b.counter_total_meetings ?? 0}</td>
                      <td className="py-2.5 pr-4">{b.sessions_declared_mentor || <span className="text-gray-400">pas de réponse</span>}</td>
                      <td className="py-2.5 pr-4">{b.sessions_declared_mentore || <span className="text-gray-400">pas de réponse</span>}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-600 max-w-sm">
                        {gaps.length === 0
                          ? <span className="text-gray-400">Aucun écart</span>
                          : <ul className="list-disc pl-4 space-y-0.5">{gaps.map((g) => <li key={g}>{g}</li>)}</ul>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p><strong>Fiches enregistrées</strong> : fiches de séance saisies sur la plateforme (table suivi_mensuel).</p>
            <p><strong>Compteur du binôme</strong> : colonne binome.total_meetings, augmentée de 1 par le navigateur à chaque fiche créée ; jamais corrigée si une fiche est supprimée.</p>
            <p><strong>Déclaré</strong> : tranche choisie dans le sondage de bilan (déclaration du participant, pas un comptage).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
