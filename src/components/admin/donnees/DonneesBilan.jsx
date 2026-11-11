// Rubrique unique « Données & Bilan » du dashboard admin.
// Elle remplace les anciennes rubriques Analytique, Sondage & liens, Bilan et
// Rapport de bilan, et reprend les indicateurs de l'ancienne Vue d'ensemble.
//
// Cinq onglets. L'onglet ouvert est écrit dans l'adresse de la page
// (/AdminDashboard?tab=donnees&onglet=sondage), ce qui permet de partager un
// lien direct et de garder l'onglet après un rechargement.
//
// Toutes les données passent par src/lib/programData.js (binôme test exclu).
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Activity, Users, MessageSquare, FileText } from 'lucide-react';
import { fetchOfficialBinomes, getBinomeCountWarning } from '@/lib/programData';
import { WarningBanner } from './shared';
import SyntheseTab from './SyntheseTab';
import ActiviteTab from './ActiviteTab';
import BinomesTab from './BinomesTab';
import SondageTab from './SondageTab';
import RapportBilan from '@/components/admin/RapportBilan.jsx';

const SUB_TABS = [
  { id: 'synthese', label: 'Synthèse', icon: LayoutDashboard },
  { id: 'activite', label: 'Activité', icon: Activity },
  { id: 'binomes', label: 'Binômes', icon: Users },
  { id: 'sondage', label: 'Sondage', icon: MessageSquare },
  { id: 'rapport', label: 'Rapport', icon: FileText },
];

export default function DonneesBilan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('onglet');
  const activeSubTab = SUB_TABS.some((t) => t.id === requested) ? requested : 'synthese';

  // GARDE-FOU : on compte les binômes réellement analysés. Si ce n'est pas 11,
  // un avertissement s'affiche en haut de TOUS les onglets.
  const { data: binomes, isLoading, error } = useQuery({
    queryKey: ['official_binomes'], queryFn: () => fetchOfficialBinomes('mentor_name'),
  });
  const countWarning = isLoading || error ? null : getBinomeCountWarning((binomes ?? []).length);

  const openSubTab = (id) => setSearchParams({ tab: 'donnees', onglet: id });

  return (
    <div className="space-y-5">
      {error && (
        <WarningBanner title="Lecture des données impossible" tone="red">
          {error.message}
        </WarningBanner>
      )}
      {countWarning && (
        <WarningBanner title="Contrôle du nombre de binômes" tone="red">{countWarning}</WarningBanner>
      )}

      <div className="flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === activeSubTab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => openSubTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'synthese' && <SyntheseTab />}
      {activeSubTab === 'activite' && <ActiviteTab />}
      {activeSubTab === 'binomes' && <BinomesTab />}
      {activeSubTab === 'sondage' && <SondageTab />}
      {activeSubTab === 'rapport' && <RapportBilan />}
    </div>
  );
}
