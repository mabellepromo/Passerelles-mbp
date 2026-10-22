import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Sparkles, Loader2, CheckCircle2, AlertTriangle, Download,
  FileText, MessageSquareQuote, ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { PRIORITY_LABEL } from '@/lib/reviewReportSchema';
import ReviewReportPdf from './ReviewReportPdf';
import { pdf } from '@react-pdf/renderer';

const VIGILANCE_STYLE = {
  vert: { label: 'OK', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  orange: { label: 'À surveiller', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  rouge: { label: 'Prioritaire', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  en_attente: { label: 'En attente', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
};

const NPS_COLORS = { promoters: '#059669', passives: '#d97706', detractors: '#dc2626' };

function KpiCard({ label, value, sub, icon: Icon, color = '#1a7a45' }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 bg-white">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-4 w-4" style={{ color }} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: '#111827' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function RapportBilan() {
  const queryClient = useQueryClient();
  const [cohorte, setCohorte] = useState('toutes');
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [editedSummary, setEditedSummary] = useState(null);

  const { data: cohortes = [] } = useQuery({
    queryKey: ['review_report_cohortes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('binome').select('cohorte').eq('is_test', false);
      if (error) throw error;
      return [...new Set((data ?? []).map((b) => b.cohorte).filter(Boolean))].sort();
    },
  });

  const periodLabel = cohorte === 'toutes' ? 'toutes_cohortes' : cohorte;

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ['review_reports_latest', periodLabel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_reports')
        .select('*')
        .eq('period_label', periodLabel)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: vigilance = [] } = useQuery({
    queryKey: ['review_pair_vigilance', cohorte],
    queryFn: async () => {
      let query = supabase.from('review_pair_vigilance').select('*');
      if (cohorte !== 'toutes') query = query.eq('cohorte', cohorte);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const metrics = report?.metrics || null;
  const analysis = report?.ai_analysis || null;
  const summaryText = editedSummary ?? analysis?.executive_summary ?? '';

  const npsChartData = useMemo(() => {
    if (!metrics?.nps) return [];
    return metrics.nps.map((n) => ({
      role: n.role === 'mentor' ? 'Mentors' : 'Mentorés',
      promoters: n.promoters,
      passives: n.passives,
      detractors: n.detractors,
    }));
  }, [metrics]);

  const likertChartData = useMemo(() => {
    if (!metrics?.likert_by_question) return [];
    const byQuestion = {};
    for (const row of metrics.likert_by_question) {
      byQuestion[row.question_id] = byQuestion[row.question_id] || { question_id: row.question_id };
      byQuestion[row.question_id][row.role] = row.avg_value;
    }
    return Object.values(byQuestion);
  }, [metrics]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/generate-review-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ cohorte: cohorte === 'toutes' ? null : cohorte }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Échec de la génération');
      toast.success('Rapport généré (brouillon).');
      setEditedSummary(null);
      queryClient.invalidateQueries({ queryKey: ['review_reports_latest'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleValidate() {
    if (!report) return;
    setValidating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedAnalysis = editedSummary !== null
        ? { ...analysis, executive_summary: editedSummary }
        : analysis;
      const { error } = await supabase
        .from('review_reports')
        .update({ status: 'validated', validated_at: new Date().toISOString(), validated_by: user?.id, ai_analysis: updatedAnalysis })
        .eq('id', report.id);
      if (error) throw error;
      toast.success('Rapport validé.');
      queryClient.invalidateQueries({ queryKey: ['review_reports_latest'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setValidating(false);
    }
  }

  async function handleExportPdf() {
    if (!report) return;
    setExportingPdf(true);
    try {
      const blob = await pdf(
        <ReviewReportPdf report={report} vigilance={vigilance} summaryOverride={editedSummary} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-bilan-passerelles-${periodLabel}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Échec de l'export PDF : " + err.message);
    } finally {
      setExportingPdf(false);
    }
  }

  const mentorStats = metrics?.response_rate?.find((r) => r.role === 'mentor');
  const mentoreStats = metrics?.response_rate?.find((r) => r.role === 'mentore');
  const avgNps = metrics?.nps?.length
    ? (metrics.nps.reduce((sum, n) => sum + (n.avg_nps || 0), 0) / metrics.nps.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Rapport de bilan</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Agrégats calculés automatiquement, analyse IA à relire avant diffusion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={cohorte} onValueChange={setCohorte}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes cohortes</SelectItem>
              {cohortes.map((c) => (
                <SelectItem key={c} value={c}>Cohorte {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Générer le rapport
          </Button>
        </div>
      </div>

      {loadingReport ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        </div>
      ) : !report ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center text-sm text-gray-400">
            Aucun rapport généré pour cette période. Clique sur « Générer le rapport ».
          </CardContent>
        </Card>
      ) : (
        <>
          {/* En-tête statut */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-gray-500">{periodLabel === 'toutes_cohortes' ? 'Toutes cohortes' : `Cohorte ${cohorte}`}</Badge>
              <span className="text-xs text-gray-400">
                Généré le {new Date(report.generated_at).toLocaleString('fr-FR')}
              </span>
              {report.status === 'validated' ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Validé
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                  <AlertTriangle className="h-3 w-3" /> Brouillon
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportPdf} disabled={exportingPdf}>
                {exportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export PDF
              </Button>
              {report.status !== 'validated' && (
                <Button onClick={handleValidate} disabled={validating}>
                  {validating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Valider le rapport
                </Button>
              )}
            </div>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Taux de réponse mentors" value={`${mentorStats?.response_rate_pct ?? 0}%`} sub={`${mentorStats?.total_responses ?? 0}/${mentorStats?.total_tokens ?? 0}`} icon={FileText} />
            <KpiCard label="Taux de réponse mentorés" value={`${mentoreStats?.response_rate_pct ?? 0}%`} sub={`${mentoreStats?.total_responses ?? 0}/${mentoreStats?.total_tokens ?? 0}`} icon={FileText} color="#7c3aed" />
            <KpiCard label="NPS moyen" value={avgNps} icon={Sparkles} color="#d97706" />
            <KpiCard label="Réponses totales" value={metrics?.total_responses ?? 0} icon={CheckCircle2} />
          </div>

          {/* Graphiques */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">Répartition NPS</CardTitle></CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={npsChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="promoters" name="Promoteurs" fill={NPS_COLORS.promoters} stackId="nps" />
                    <Bar dataKey="passives" name="Passifs" fill={NPS_COLORS.passives} stackId="nps" />
                    <Bar dataKey="detractors" name="Détracteurs" fill={NPS_COLORS.detractors} stackId="nps" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">Moyennes par question (mentors vs mentorés)</CardTitle></CardHeader>
              <CardContent style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={likertChartData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="question_id" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="mentor" name="Mentors" fill="#1a7a45" />
                    <Bar dataKey="mentore" name="Mentorés" fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Synthèse IA */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-amber-500" /> Synthèse exécutive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                Analyse générée automatiquement, à relire avant diffusion.
              </p>
              <Textarea
                value={summaryText}
                onChange={(e) => setEditedSummary(e.target.value)}
                disabled={report.status === 'validated'}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Points forts / amélioration */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">Points forts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(analysis?.strengths || []).map((s, i) => (
                  <div key={i} className="border-b border-gray-50 pb-2 last:border-0">
                    <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.evidence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base">Points d'amélioration</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(analysis?.improvements || []).map((imp, i) => (
                  <div key={i} className="border-b border-gray-50 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{imp.title}</p>
                      <Badge variant="outline" className="text-[10px]">{PRIORITY_LABEL[imp.priority] || imp.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{imp.evidence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Binômes à vigilance */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4 w-4 text-red-500" /> Binômes à surveiller</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="py-2 pr-4">Binôme</th>
                      <th className="py-2 pr-4">NPS mentor</th>
                      <th className="py-2 pr-4">NPS mentoré</th>
                      <th className="py-2 pr-4">Raison (IA)</th>
                      <th className="py-2 pr-4">Vigilance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vigilance.map((pair) => {
                      const aiNote = (analysis?.pairs_to_watch || []).find((p) => p.binome_id === pair.binome_id);
                      const style = VIGILANCE_STYLE[pair.vigilance] || VIGILANCE_STYLE.en_attente;
                      return (
                        <tr key={pair.binome_id} className="border-b border-gray-50">
                          <td className="py-2.5 pr-4">
                            <p className="font-medium text-gray-800">{pair.mentor_name}</p>
                            <p className="text-xs text-gray-400">{pair.mentore_name}</p>
                          </td>
                          <td className="py-2.5 pr-4">{pair.mentor_nps ?? '—'}</td>
                          <td className="py-2.5 pr-4">{pair.mentore_nps ?? '—'}</td>
                          <td className="py-2.5 pr-4 text-xs text-gray-500 max-w-xs">{aiNote?.reason || '—'}</td>
                          <td className="py-2.5 pr-4"><Badge className={style.className}>{style.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Citations */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquareQuote className="h-4 w-4 text-amber-500" /> Citations marquantes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(analysis?.notable_quotes || []).length === 0 ? (
                <p className="text-sm text-gray-400">Aucune citation autorisée pour cette période.</p>
              ) : (
                (analysis?.notable_quotes || []).map((q, i) => (
                  <blockquote key={i} className="border-l-2 border-amber-300 pl-3 text-sm text-gray-700 italic">
                    « {q.text} » <span className="text-xs text-gray-400 not-italic">— {q.role === 'mentor' ? 'Mentor' : 'Mentoré'}</span>
                  </blockquote>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recommandations */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-base">Recommandations</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {(analysis?.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
