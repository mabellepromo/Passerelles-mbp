// Onglet « Rapport » de la rubrique « Données & Bilan ».
//
// Parcours :
//   1. Générer  : le serveur lit les données filtrées, fait rédiger la partie
//                 qualitative par l'IA et enregistre un BROUILLON (status 'draft').
//   2. Relire   : la synthèse est modifiable tant que le rapport est en brouillon.
//   3. Valider  : status 'validated' ; le rapport est alors figé.
//   4. Exporter : PDF en version interne (nominative) ou externe (partenaires),
//                 complet ou réduit au résumé exécutif.
//
// La version externe n'est exportable qu'une fois le rapport validé.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Download, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PRIORITY_LABEL } from '@/lib/reviewReportSchema';
import { EXPECTED_BINOME_COUNT, getBinomeCountWarning } from '@/lib/programData';
import { isReportUsable, buildKeyFigures, buildMethodology, VIGILANCE_LABEL, VERBATIM_FIELD_LABEL, PAIR_STATUS_LABEL, countPairStatus } from '@/lib/reportContent';
import { WarningBanner, Loader } from '@/components/admin/donnees/shared';
import ReviewReportPdf from './ReviewReportPdf';
import ReportFigures from '@/components/charts/ReportFigures';

// Le rapport porte sur la cohorte 1.
const COHORTE = '1';

const CONSENT_LABEL = {
  first_name: 'citation autorisée avec le prénom',
  full_name: 'citation autorisée avec le nom complet',
};

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function RapportBilan() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(null); // ex. 'internal-full', 'external-summary' ou null
  const [editedSummary, setEditedSummary] = useState(null);

  // Dernier rapport généré pour la cohorte (les anciens brouillons restent en base).
  const { data: report, isLoading } = useQuery({
    queryKey: ['review_reports_latest', COHORTE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_reports')
        .select('*')
        .eq('period_label', COHORTE)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const usable = isReportUsable(report);
  const analysis = report?.ai_analysis || null;
  const isValidated = report?.status === 'validated';
  const summaryText = editedSummary ?? analysis?.executive_summary ?? '';
  // GARDE-FOU : le rapport doit porter sur le nombre de binômes attendu.
  const countWarning = usable ? getBinomeCountWarning(report.metrics.binomes_count) : null;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/invoke-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action: 'generate_review_report', cohorte: COHORTE }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Échec de la génération');
      toast.success('Rapport généré en brouillon. Relis-le avant de le valider.');
      setEditedSummary(null);
      queryClient.invalidateQueries({ queryKey: ['review_reports_latest'] });
    } catch (err) {
      toast.error(err.message, { duration: 10000 });
    } finally {
      setGenerating(false);
    }
  }

  async function handleValidate() {
    if (!report) return;
    setValidating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedAnalysis = editedSummary !== null ? { ...analysis, executive_summary: editedSummary } : analysis;
      const { error } = await supabase
        .from('review_reports')
        .update({ status: 'validated', validated_at: new Date().toISOString(), validated_by: user?.id, ai_analysis: updatedAnalysis })
        .eq('id', report.id);
      if (error) throw error;
      toast.success('Rapport validé.');
      setEditedSummary(null);
      queryClient.invalidateQueries({ queryKey: ['review_reports_latest'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setValidating(false);
    }
  }

  // scope : 'full' (rapport complet) ou 'summary' (page de garde + résumé exécutif).
  async function handleExport(variant, scope = 'full') {
    if (!report) return;
    setExporting(`${variant}-${scope}`);
    try {
      const blob = await pdf(
        <ReviewReportPdf report={report} variant={variant} scope={scope} summaryOverride={editedSummary} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const base = scope === 'summary' ? 'resume-executif' : 'rapport-bilan';
      link.download = `${base}-passerelles-cohorte-${COHORTE}-${variant === 'internal' ? 'interne' : 'externe'}${isValidated ? '' : '-brouillon'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Échec de l'export PDF : ${err.message}`);
    } finally {
      setExporting(null);
    }
  }

  if (isLoading) return <Loader />;

  const generateButton = (
    <Button onClick={handleGenerate} disabled={generating}>
      {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      {generating ? 'Génération en cours (jusqu\'à 1 minute)...' : report ? 'Régénérer le rapport' : 'Générer le rapport'}
    </Button>
  );

  // Aucun rapport, ou rapport d'un ancien format : on propose seulement de générer.
  if (!usable) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-10 text-center space-y-4">
          <p className="text-sm text-gray-600">
            {report
              ? 'Le dernier rapport enregistré a été produit avec l\'ancien format : il est périmé et doit être régénéré.'
              : `Aucun rapport n'a encore été généré pour la cohorte ${COHORTE}.`}
          </p>
          {generateButton}
          <p className="text-xs text-gray-500">
            La génération lit les données des {EXPECTED_BINOME_COUNT} binômes officiels. Elle est refusée, avec un message, si ce nombre n'est pas retrouvé.
          </p>
        </CardContent>
      </Card>
    );
  }

  const keyFigures = buildKeyFigures(report);
  const methodology = buildMethodology(report);
  const exportBlocked = Boolean(countWarning);

  return (
    <div className="space-y-6">
      {countWarning && (
        <WarningBanner title="Export bloqué : contrôle du nombre de binômes" tone="red">{countWarning}</WarningBanner>
      )}

      {/* État du rapport et actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-gray-600">Cohorte {COHORTE}</Badge>
          <span className="text-xs text-gray-500">Généré le {new Date(report.generated_at).toLocaleString('fr-FR')}</span>
          {isValidated ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Validé</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1"><AlertTriangle className="h-3 w-3" /> Brouillon</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {generateButton}
          {!isValidated && (
            <Button variant="outline" onClick={handleValidate} disabled={validating || exportBlocked}>
              {validating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Valider le rapport
            </Button>
          )}
        </div>
      </div>

      {/* Export */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Export PDF</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-800">Version interne</p>
            <p className="text-xs text-gray-500">Nominative, avec les binômes à surveiller. Réservée au bureau de Ma Belle Promo.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleExport('internal')} disabled={exporting !== null || exportBlocked}>
                {exporting === 'internal-full' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Rapport complet{isValidated ? '' : ' (brouillon)'}
              </Button>
              <Button variant="ghost" onClick={() => handleExport('internal', 'summary')} disabled={exporting !== null || exportBlocked}>
                {exporting === 'internal-summary' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Résumé exécutif seul
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-800">Version externe</p>
            <p className="text-xs text-gray-500">Partenaires et bailleurs. Aucun nom, sauf les citations autorisées par leur auteur.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleExport('external')} disabled={exporting !== null || exportBlocked || !isValidated}>
                {exporting === 'external-full' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Rapport complet
              </Button>
              <Button variant="ghost" onClick={() => handleExport('external', 'summary')} disabled={exporting !== null || exportBlocked || !isValidated}>
                {exporting === 'external-summary' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Résumé exécutif seul
              </Button>
            </div>
            {!isValidated && <p className="text-xs text-amber-700">Disponible une fois le rapport validé.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Figures du rapport : mêmes composants et mêmes calculs que le PDF */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Figures du rapport</CardTitle></CardHeader>
        <CardContent><ReportFigures report={report} /></CardContent>
      </Card>

      {/* Chiffres clés (calculés en SQL) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {keyFigures.map((k) => (
          <div key={k.label} className="rounded-xl border border-gray-100 p-4 bg-white" title={`Source : ${k.source}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.detail}</p>
          </div>
        ))}
      </div>

      {/* Synthèse, modifiable en brouillon */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-amber-500" /> Résumé exécutif</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
            Texte rédigé par l'IA à partir de données pseudonymisées. À relire avant validation ; modifiable tant que le rapport est en brouillon.
          </p>
          <Textarea value={summaryText} onChange={(e) => setEditedSummary(e.target.value)} disabled={isValidated} rows={7} />
          {(analysis.key_findings || []).length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {analysis.key_findings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Limites écrites dans le rapport</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {methodology.limits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </CardContent>
      </Card>

      {(analysis.pair_status || []).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">État des relations au sein des binômes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {countPairStatus(report).map((ps) => (
                <span key={ps.status} className="text-sm text-gray-700 rounded-lg border border-gray-100 px-3 py-1.5">
                  {ps.label} : <strong>{ps.count}/{ps.total}</strong>
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="py-2 pr-4">Binôme</th>
                    <th className="py-2 pr-4">État</th>
                    <th className="py-2 pr-4">Constat</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.pair_status.map((p) => (
                    <tr key={p.binome_id} className="border-b border-gray-50 align-top">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-800">{p.mentor_name}</p>
                        <p className="text-xs text-gray-500">{p.mentore_name}</p>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">{PAIR_STATUS_LABEL[p.status]}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-600">{p.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">Classement qualitatif d'après le sondage. Le détail nominatif ne figure que dans la version interne.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Ce qui a fonctionné</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(analysis.strengths || []).map((s, i) => (
              <div key={i} className="border-b border-gray-50 pb-2 last:border-0">
                <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-600">{s.evidence}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Ce qui n'a pas fonctionné</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(analysis.improvements || []).map((imp, i) => (
              <div key={i} className="border-b border-gray-50 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{imp.title}</p>
                  <Badge variant="outline" className="text-[10px]">{PRIORITY_LABEL[imp.priority] || imp.priority}</Badge>
                </div>
                <p className="text-xs text-gray-600">{imp.evidence}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Thèmes récurrents</CardTitle></CardHeader>
        <CardContent>
          {(analysis.recurring_themes || []).length === 0 ? (
            <p className="text-sm text-gray-500">Donnée non disponible.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700">
              {analysis.recurring_themes.map((t, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-gray-50 py-1">
                  <span>{t.theme} <span className="text-xs text-gray-500">— {VERBATIM_FIELD_LABEL[t.field] || 'réponses libres'}</span></span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{t.frequency} mention(s)</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquareQuote className="h-4 w-4 text-amber-500" /> Verbatims retenus</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(analysis.notable_quotes || []).length === 0 ? (
            <p className="text-sm text-gray-500">Aucune citation autorisée par les participants.</p>
          ) : analysis.notable_quotes.map((q) => (
            <blockquote key={q.verbatim_id} className="border-l-2 border-amber-300 pl-3">
              <p className="text-sm text-gray-700 italic">« {q.text} »</p>
              <p className="text-xs text-gray-500 mt-0.5">— {q.attribution} · {CONSENT_LABEL[q.quote_consent]}</p>
            </blockquote>
          ))}
          <p className="text-xs text-gray-500">
            Les réponses dont l'auteur a refusé la citation ne peuvent pas apparaître ici : le serveur les écarte avant l'enregistrement.
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4 text-red-500" /> Binômes à surveiller (version interne uniquement)</CardTitle></CardHeader>
        <CardContent>
          {(analysis.pairs_to_watch || []).length === 0 ? (
            <p className="text-sm text-gray-500">Aucun binôme signalé par l'analyse.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="py-2 pr-4">Binôme</th>
                    <th className="py-2 pr-4">Niveau</th>
                    <th className="py-2 pr-4">Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.pairs_to_watch.map((p) => (
                    <tr key={p.binome_id} className="border-b border-gray-50 align-top">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-800">{p.mentor_name}</p>
                        <p className="text-xs text-gray-500">{p.mentore_name}</p>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">{VIGILANCE_LABEL[p.vigilance] || '—'}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-600">{p.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Recommandations (dans l'hypothèse d'une cohorte 2)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Priorité</th>
                  <th className="py-2 pr-4">Responsable suggéré</th>
                </tr>
              </thead>
              <tbody>
                {(analysis.recommendations || []).map((r, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 text-gray-700">{r.text}</td>
                    <td className="py-2.5 pr-4"><Badge variant="outline" className="text-[10px]">{PRIORITY_LABEL[r.priority] || r.priority}</Badge></td>
                    <td className="py-2.5 pr-4 text-xs text-gray-600">{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Conclusion et perspectives</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-gray-700 leading-relaxed">{analysis.conclusion}</p></CardContent>
      </Card>
    </div>
  );
}
