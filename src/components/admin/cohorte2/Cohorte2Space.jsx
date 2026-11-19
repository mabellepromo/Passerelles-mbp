// Espace « Cohorte 2 » du tableau de bord admin : coordination du suivi par
// check-in mensuel. Réservé aux admins à trois niveaux :
//   - la page /AdminDashboard est protégée par <RequireAdmin> ;
//   - les tables ne renvoient des lignes qu'à un admin (RLS, migration M4) ;
//   - les écritures passent par des fonctions qui vérifient le rôle (M6).
//
// Périmètre : binômes de la cohorte 2 (is_test = false). Le binôme test
// n'apparaît que si « Inclure le binôme test (essais) » est coché.
import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { fetchCoordinationData, coordinationApi, currentCheckinPeriod, shiftPeriod, periodLabel } from '@/lib/cohort2Data';
import MonthlyBoard from './MonthlyBoard';
import NonRespondents from './NonRespondents';
import BinomeSheet from './BinomeSheet';
import LinksPanel from './LinksPanel';
import TemplatesPanel from './TemplatesPanel';
import SettingsPanel from './SettingsPanel';

export const COHORT2_QUERY_KEY = ['cohorte2-coordination'];

export default function Cohorte2Space() {
  const queryClient = useQueryClient();
  const [includeTest, setIncludeTest] = useState(false);
  const [period, setPeriod] = useState(currentCheckinPeriod());
  const [selectedBinomeId, setSelectedBinomeId] = useState(null);
  const [tab, setTab] = useState('board');

  const { data, isLoading, error } = useQuery({
    queryKey: [...COHORT2_QUERY_KEY, includeTest],
    queryFn: () => fetchCoordinationData({ includeTest }),
  });
  const { data: settings } = useQuery({
    queryKey: [...COHORT2_QUERY_KEY, 'settings'],
    queryFn: coordinationApi.getSettings,
  });

  // Après chaque écriture : on recharge tout l'espace.
  const refresh = () => queryClient.invalidateQueries({ queryKey: COHORT2_QUERY_KEY });

  // Les 12 derniers mois, jusqu'au mois en cours de saisie.
  const periods = useMemo(() => {
    const current = currentCheckinPeriod();
    return Array.from({ length: 12 }, (_, i) => shiftPeriod(current, -i));
  }, []);

  const openSheet = (binomeId) => {
    setSelectedBinomeId(binomeId);
    setTab('binome');
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (error) return <p className="text-sm text-red-600">Impossible de charger les données de la cohorte 2 : {error.message}</p>;

  const shared = { data, period, settings, refresh, openSheet };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cohorte 2 — coordination</h2>
          <p className="text-xs text-gray-500">
            {data.binomes.filter((b) => !b.is_test).length} binôme(s) · check-ins {settings?.checkins_open ? 'ouverts' : 'fermés'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Mois
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
              {periods.map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox checked={includeTest} onCheckedChange={(v) => setIncludeTest(Boolean(v))} />
            Inclure le binôme test (essais)
          </label>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="board">Tableau du mois</TabsTrigger>
          <TabsTrigger value="missing">Non-répondants</TabsTrigger>
          <TabsTrigger value="binome">Fiche binôme</TabsTrigger>
          <TabsTrigger value="links">Liens</TabsTrigger>
          <TabsTrigger value="templates">Messages types</TabsTrigger>
          <TabsTrigger value="settings">Réglages et binômes</TabsTrigger>
        </TabsList>
        <TabsContent value="board"><MonthlyBoard {...shared} /></TabsContent>
        <TabsContent value="missing"><NonRespondents {...shared} /></TabsContent>
        <TabsContent value="binome">
          <BinomeSheet {...shared} binomeId={selectedBinomeId} onSelect={setSelectedBinomeId} />
        </TabsContent>
        <TabsContent value="links"><LinksPanel {...shared} /></TabsContent>
        <TabsContent value="templates"><TemplatesPanel {...shared} /></TabsContent>
        <TabsContent value="settings"><SettingsPanel {...shared} /></TabsContent>
      </Tabs>
    </div>
  );
}
