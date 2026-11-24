// Onglet « Rapport » de la rubrique « Données & Bilan ».
//
// Depuis le 24/11/2026, le rapport de référence est le bilan « version
// bureau » (bilanBureau/RapportBureau.jsx) : il ne suppose plus qu'une
// cohorte 2 va suivre. Le brouillon n° 6 (rapport rédigé par l'IA, 12/11/2026)
// reste en base et consultable en lecture seule (RapportBrouillon6.jsx).
//
// Les deux formats sont des lignes de review_reports ; le bilan bureau se
// reconnaît à ai_analysis.report_format = 'bilan_bureau'.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EXPECTED_BINOME_COUNT } from '@/lib/programData';
import { Loader } from '@/components/admin/donnees/shared';
import { BUREAU_FORMAT } from '@/lib/bilanBureau/values';
import RapportBureau, { generateBureauReport, DEFAULT_REPORT_TEXTS } from './bilanBureau/RapportBureau';
import RapportBrouillon6 from './RapportBrouillon6';

const COHORTE = '1';
const QUERY_KEY = ['review_reports_all', COHORTE];

const isBureau = (r) => r?.ai_analysis?.report_format === BUREAU_FORMAT;

export default function RapportBilan() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('bureau'); // 'bureau' | 'brouillon6'
  const [generating, setGenerating] = useState(false);

  // Tous les rapports de la cohorte, du plus récent au plus ancien.
  const { data: reports = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_reports')
        .select('*')
        .eq('period_label', COHORTE)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Loader />;

  const bureau = reports.find(isBureau) || null;
  const legacy = reports.find((r) => !isBureau(r)) || null;

  async function handleFirstGeneration() {
    setGenerating(true);
    try {
      await generateBureauReport({ cohorte: COHORTE, ...DEFAULT_REPORT_TEXTS });
      toast.success('Bilan créé en brouillon, prérempli avec les textes de référence. Relis-le avant de le valider.');
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      toast.error(err.message, { duration: 10000 });
    } finally {
      setGenerating(false);
    }
  }

  const tabs = [['bureau', 'Bilan pour le bureau'], ['brouillon6', 'Brouillon n° 6 (historique)']];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              view === key ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'bureau' && (bureau ? (
        <RapportBureau key={bureau.id} report={bureau} cohorte={COHORTE} queryKey={QUERY_KEY} />
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-gray-600">
              Le bilan « version bureau » n'a pas encore été généré. Il remplace le brouillon n° 6 sans l'effacer.
            </p>
            <Button onClick={handleFirstGeneration} disabled={generating || !legacy}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Générer le bilan
            </Button>
            <p className="text-xs text-gray-500">
              Les chiffres sont recalculés à partir des {EXPECTED_BINOME_COUNT} binômes officiels (binôme de test exclu) ; le classement des binômes est repris du brouillon n° 6.
              {!legacy && ' Brouillon n° 6 introuvable : génération impossible.'}
            </p>
          </CardContent>
        </Card>
      ))}

      {view === 'brouillon6' && (legacy
        ? <RapportBrouillon6 report={legacy} />
        : <p className="text-sm text-gray-500">Aucun brouillon n° 6 en base.</p>)}
    </div>
  );
}
