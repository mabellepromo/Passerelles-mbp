// Onglet « Rapport » de la rubrique « Données & Bilan ».
//
// Parcours :
//   1. Générer  : le serveur lit les données filtrées, fait rédiger la partie
//                 qualitative par l'IA et enregistre un BROUILLON (status 'draft').
//   2. Relire   : tout le texte rédigé est modifiable tant que le rapport est
//                 en brouillon ; « Enregistrer » conserve les modifications en base.
//   3. Valider  : status 'validated' ; le rapport est alors figé. Il peut être
//                 rouvert (retour en brouillon) pour une nouvelle modification.
//   4. Exporter : PDF en version interne (nominative) ou externe (partenaires),
//                 complet ou réduit au résumé exécutif.
//
// Les chiffres (metrics) ne sont jamais modifiables : seule l'analyse rédigée
// (ai_analysis) l'est. Le texte des citations non plus : ce sont les mots
// exacts des participants ; on peut seulement retirer une citation.
//
// La version externe n'est exportable qu'une fois le rapport validé.
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Download, MessageSquareQuote, ShieldAlert, Save, Undo2, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRIORITY_LABEL } from '@/lib/reviewReportSchema';
import { EXPECTED_BINOME_COUNT, getBinomeCountWarning } from '@/lib/programData';
import { isReportUsable, buildKeyFigures, buildMethodology, VIGILANCE_LABEL, VERBATIM_FIELD_LABEL, PAIR_STATUS_LABEL, countPairStatus } from '@/lib/reportContent';
import { WarningBanner, Loader } from '@/components/admin/donnees/shared';
import ReviewReportPdf from './ReviewReportPdf';
import ReportFigures from '@/components/charts/ReportFigures';
import { Field, ChoiceField, RemoveButton, AddButton, cleanAnalysis } from './reportEditing';

// Le rapport porte sur la cohorte 1.
const COHORTE = '1';
const QUERY_KEY = ['review_reports_latest', COHORTE];

const CONSENT_LABEL = {
  first_name: 'citation autorisée avec le prénom',
  full_name: 'citation autorisée avec le nom complet',
};

// Nombre maximal d'éléments par liste (format de l'analyse, voir reviewReportSchema).
const MAX = { key_findings: 5, strengths: 5, improvements: 5, key_learnings: 5, recommendations: 8 };

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function RapportBilan() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(null); // 'save' | 'validate' | 'reopen' | null
  const [exporting, setExporting] = useState(null); // ex. 'internal-full', 'external-summary' ou null
  // Copie de travail de l'analyse ; null tant que rien n'a été modifié.
  const [draft, setDraft] = useState(null);

  // Dernier rapport généré pour la cohorte (les anciens brouillons restent en base).
  const { data: report, isLoading } = useQuery({
    queryKey: QUERY_KEY,
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
  const isValidated = report?.status === 'validated';
  const editable = usable && !isValidated;
  const isDirty = draft !== null;
  const analysis = draft ?? report?.ai_analysis ?? null;
  // Rapport tel qu'il s'affiche et s'exporte, modifications en cours comprises.
  const workingReport = report ? { ...report, ai_analysis: analysis } : null;
  // GARDE-FOU : le rapport doit porter sur le nombre de binômes attendu.
  const countWarning = usable ? getBinomeCountWarning(report.metrics.binomes_count) : null;

  // Prévient avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    if (!isDirty) return undefined;
    const onLeave = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [isDirty]);

  // --- Édition de la copie de travail -------------------------------------
  function edit(change) {
    setDraft((current) => {
      const next = structuredClone(current ?? report.ai_analysis);
      change(next);
      return next;
    });
  }
  const setField = (key, value) => edit((a) => { a[key] = value; });
  // value : texte (listes de phrases) ou champs partiels (listes d'objets).
  const setItem = (key, i, value) => edit((a) => {
    a[key][i] = typeof value === 'object' ? { ...a[key][i], ...value } : value;
  });
  const removeItem = (key, i) => edit((a) => { a[key].splice(i, 1); });
  const addItem = (key, blank) => edit((a) => { a[key] = [...(a[key] || []), blank]; });

  // --- Enregistrement ------------------------------------------------------
  // Écrit l'analyse (nettoyée) et, le cas échéant, le changement de statut.
  async function persist(kind, extra = {}) {
    const cleaned = cleanAnalysis(analysis);
    if (!cleaned.executive_summary || !cleaned.conclusion) {
      toast.error('Le résumé exécutif et la conclusion ne peuvent pas être vides.');
      return false;
    }
    setSaving(kind);
    try {
      const { data, error } = await supabase
        .from('review_reports')
        .update({ ai_analysis: cleaned, ...extra })
        .eq('id', report.id)
        .select('*')
        .single();
      if (error) throw error;
      queryClient.setQueryData(QUERY_KEY, data);
      setDraft(null);
      return true;
    } catch (err) {
      toast.error(`Échec de l'enregistrement : ${err.message}`);
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function handleSave() {
    if (await persist('save')) toast.success('Modifications enregistrées.');
  }

  async function handleValidate() {
    const { data: { user } } = await supabase.auth.getUser();
    const ok = await persist('validate', { status: 'validated', validated_at: new Date().toISOString(), validated_by: user?.id });
    if (ok) toast.success('Rapport validé.');
  }

  async function handleReopen() {
    if (!window.confirm('Rouvrir le rapport pour le modifier ? Il repassera en brouillon et devra être validé de nouveau ; la version externe ne sera plus exportable d\'ici là.')) return;
    const ok = await persist('reopen', { status: 'draft', validated_at: null, validated_by: null });
    if (ok) toast.success('Rapport rouvert en brouillon : il est de nouveau modifiable.');
  }

  function handleCancel() {
    if (window.confirm('Abandonner les modifications non enregistrées ?')) setDraft(null);
  }

  async function handleGenerate() {
    if (isDirty && !window.confirm('Des modifications ne sont pas enregistrées. Régénérer le rapport les perdra. Continuer ?')) return;
    if (report && !isDirty && !window.confirm('Régénérer le rapport ? Un nouveau brouillon rédigé par l\'IA remplacera celui-ci à l\'écran (l\'ancien reste en base).')) return;
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
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ['review_reports_latest'] });
    } catch (err) {
      toast.error(err.message, { duration: 10000 });
    } finally {
      setGenerating(false);
    }
  }

  // scope : 'full' (rapport complet) ou 'summary' (page de garde + résumé exécutif).
  // Le PDF reprend le texte affiché, modifications non enregistrées comprises.
  async function handleExport(variant, scope = 'full') {
    if (!report) return;
    setExporting(`${variant}-${scope}`);
    try {
      const blob = await pdf(
        <ReviewReportPdf report={{ ...workingReport, ai_analysis: cleanAnalysis(analysis) }} variant={variant} scope={scope} />
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
    <Button onClick={handleGenerate} disabled={generating || saving !== null}>
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

  const keyFigures = buildKeyFigures(workingReport);
  const methodology = buildMethodology(workingReport);
  const exportBlocked = Boolean(countWarning);
  const spin = (kind, Icon) => (saving === kind ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Icon className="h-4 w-4 mr-2" />);

  return (
    <div className="space-y-6">
      {countWarning && (
        <WarningBanner title="Export bloqué : contrôle du nombre de binômes" tone="red">{countWarning}</WarningBanner>
      )}

      {/* État du rapport et actions (barre collante pour enregistrer pendant la relecture) */}
      {/* top-16 : sous l'en-tête collant de l'administration */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-gray-600">Cohorte {COHORTE}</Badge>
          <span className="text-xs text-gray-500">Généré le {new Date(report.generated_at).toLocaleString('fr-FR')}</span>
          {isValidated ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Validé</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1"><AlertTriangle className="h-3 w-3" /> Brouillon</Badge>
          )}
          {isDirty && <span className="text-xs font-medium text-amber-700">Modifications non enregistrées</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={!isDirty || saving !== null}>
                <Undo2 className="h-4 w-4 mr-2" /> Annuler
              </Button>
              <Button onClick={handleSave} disabled={!isDirty || saving !== null} className="bg-emerald-700 hover:bg-emerald-800">
                {spin('save', Save)} Enregistrer
              </Button>
              <Button variant="outline" onClick={handleValidate} disabled={saving !== null || exportBlocked}>
                {spin('validate', CheckCircle2)} {isDirty ? 'Enregistrer et valider' : 'Valider le rapport'}
              </Button>
            </>
          )}
          {isValidated && (
            <Button variant="outline" onClick={handleReopen} disabled={saving !== null}>
              {spin('reopen', PencilLine)} Rouvrir pour modifier
            </Button>
          )}
          {generateButton}
        </div>
      </div>

      {/* Export */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Export PDF</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
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
              <p className="text-xs text-gray-500">Partenaires et bailleurs. Aucun nom de participant, citations comprises (signées par le rôle).</p>
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
          </div>
          {isDirty && <p className="text-xs text-amber-700">Le PDF reprend le texte affiché, y compris les modifications pas encore enregistrées.</p>}
        </CardContent>
      </Card>

      {editable && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
          Texte rédigé par l'IA à partir de données pseudonymisées. Tout le texte ci-dessous est modifiable tant que le rapport est en brouillon ;
          pense à cliquer sur « Enregistrer ». Les chiffres et les figures, calculés à partir des données, ne se modifient pas ici.
        </p>
      )}

      {/* Figures du rapport : mêmes composants et mêmes calculs que le PDF */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Figures du rapport</CardTitle></CardHeader>
        <CardContent><ReportFigures report={workingReport} /></CardContent>
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

      {/* Résumé exécutif et constats clés */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-amber-500" /> Résumé exécutif</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field value={analysis.executive_summary} onChange={(v) => setField('executive_summary', v)} editable={editable} multiline rows={8} className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Constats clés</p>
            {editable ? (
              <>
                {(analysis.key_findings || []).map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1"><Field value={f} onChange={(v) => setItem('key_findings', i, v)} editable multiline rows={2} /></div>
                    <RemoveButton onClick={() => removeItem('key_findings', i)} />
                  </div>
                ))}
                <AddButton onClick={() => addItem('key_findings', '')} count={(analysis.key_findings || []).length} max={MAX.key_findings} label="Ajouter un constat" />
              </>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {(analysis.key_findings || []).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Limites écrites dans le rapport</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {methodology.limits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avertissement sur la taille de l'échantillon</p>
            <Field value={analysis.sample_warning || ''} onChange={(v) => setField('sample_warning', v)} editable={editable} multiline rows={2} placeholder="Laisser vide pour ne pas afficher d'avertissement." className="text-sm text-gray-700" />
          </div>
        </CardContent>
      </Card>

      {(analysis.pair_status || []).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">État des relations au sein des binômes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {countPairStatus(workingReport).map((ps) => (
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
                  {analysis.pair_status.map((p, i) => (
                    <tr key={p.binome_id} className="border-b border-gray-50 align-top">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-800">{p.mentor_name}</p>
                        <p className="text-xs text-gray-500">{p.mentore_name}</p>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        {editable
                          ? <ChoiceField value={p.status} onChange={(v) => setItem('pair_status', i, { status: v })} editable labels={PAIR_STATUS_LABEL} />
                          : PAIR_STATUS_LABEL[p.status]}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-600 min-w-[16rem]">
                        <Field value={p.basis} onChange={(v) => setItem('pair_status', i, { basis: v })} editable={editable} multiline rows={2} />
                      </td>
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
              <div key={i} className="border-b border-gray-50 pb-3 last:border-0 space-y-1.5">
                <Field value={s.title} onChange={(v) => setItem('strengths', i, { title: v })} editable={editable} placeholder="Titre" className="text-sm font-semibold text-gray-800" />
                <Field value={s.evidence} onChange={(v) => setItem('strengths', i, { evidence: v })} editable={editable} multiline rows={3} placeholder="Éléments qui l'établissent" className="text-xs text-gray-600" />
                {editable && <RemoveButton onClick={() => removeItem('strengths', i)} />}
              </div>
            ))}
            {editable && <AddButton onClick={() => addItem('strengths', { title: '', evidence: '' })} count={(analysis.strengths || []).length} max={MAX.strengths} label="Ajouter un point" />}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Ce qui n'a pas fonctionné</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(analysis.improvements || []).map((imp, i) => (
              <div key={i} className="border-b border-gray-50 pb-3 last:border-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Field value={imp.title} onChange={(v) => setItem('improvements', i, { title: v })} editable={editable} placeholder="Titre" className="text-sm font-semibold text-gray-800" />
                  </div>
                  <ChoiceField value={imp.priority} onChange={(v) => setItem('improvements', i, { priority: v })} editable={editable} labels={PRIORITY_LABEL} />
                </div>
                <Field value={imp.evidence} onChange={(v) => setItem('improvements', i, { evidence: v })} editable={editable} multiline rows={3} placeholder="Éléments qui l'établissent" className="text-xs text-gray-600" />
                {editable && <RemoveButton onClick={() => removeItem('improvements', i)} />}
              </div>
            ))}
            {editable && <AddButton onClick={() => addItem('improvements', { title: '', priority: 'moyenne', evidence: '' })} count={(analysis.improvements || []).length} max={MAX.improvements} label="Ajouter un point" />}
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
                <li key={i} className="flex items-center justify-between gap-4 border-b border-gray-50 py-1">
                  {editable ? (
                    <div className="flex-1"><Field value={t.theme} onChange={(v) => setItem('recurring_themes', i, { theme: v })} editable /></div>
                  ) : (
                    <span>{t.theme} <span className="text-xs text-gray-500">— {VERBATIM_FIELD_LABEL[t.field] || 'réponses libres'}</span></span>
                  )}
                  <span className="text-xs text-gray-500 whitespace-nowrap">{t.frequency} mention(s)</span>
                  {editable && <RemoveButton onClick={() => removeItem('recurring_themes', i)} />}
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
            <p className="text-sm text-gray-500">Aucune citation retenue.</p>
          ) : analysis.notable_quotes.map((q, i) => (
            <div key={q.verbatim_id} className="flex items-start justify-between gap-3">
              <blockquote className="border-l-2 border-amber-300 pl-3">
                <p className="text-sm text-gray-700 italic">« {q.text} »</p>
                <p className="text-xs text-gray-500 mt-0.5">— {q.attribution} · {CONSENT_LABEL[q.quote_consent]}</p>
              </blockquote>
              {editable && <RemoveButton onClick={() => removeItem('notable_quotes', i)} />}
            </div>
          ))}
          <p className="text-xs text-gray-500">
            Les réponses dont l'auteur a refusé la citation ne peuvent pas apparaître ici : le serveur les écarte avant l'enregistrement.
            {editable && ' Le texte d\'une citation n\'est pas modifiable (ce sont les mots exacts du participant) ; elle peut seulement être retirée.'}
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
                    {editable && <th className="py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {analysis.pairs_to_watch.map((p, i) => (
                    <tr key={p.binome_id} className="border-b border-gray-50 align-top">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-800">{p.mentor_name}</p>
                        <p className="text-xs text-gray-500">{p.mentore_name}</p>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">{VIGILANCE_LABEL[p.vigilance] || '—'}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-600 min-w-[16rem]">
                        <Field value={p.reason} onChange={(v) => setItem('pairs_to_watch', i, { reason: v })} editable={editable} multiline rows={2} />
                      </td>
                      {editable && <td className="py-2.5"><RemoveButton onClick={() => removeItem('pairs_to_watch', i)} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Enseignements</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {editable ? (
            <>
              {(analysis.key_learnings || []).map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1"><Field value={l} onChange={(v) => setItem('key_learnings', i, v)} editable multiline rows={2} /></div>
                  <RemoveButton onClick={() => removeItem('key_learnings', i)} />
                </div>
              ))}
              <AddButton onClick={() => addItem('key_learnings', '')} count={(analysis.key_learnings || []).length} max={MAX.key_learnings} label="Ajouter un enseignement" />
            </>
          ) : (analysis.key_learnings || []).length === 0 ? (
            <p className="text-sm text-gray-500">Aucun enseignement rédigé.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {analysis.key_learnings.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Recommandations (dans l'hypothèse d'une cohorte 2)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Priorité</th>
                  <th className="py-2 pr-4">Responsable suggéré</th>
                  {editable && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {(analysis.recommendations || []).map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 align-top">
                    <td className="py-2.5 pr-4 text-gray-700 min-w-[16rem]">
                      <Field value={r.text} onChange={(v) => setItem('recommendations', i, { text: v })} editable={editable} multiline rows={2} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <ChoiceField value={r.priority} onChange={(v) => setItem('recommendations', i, { priority: v })} editable={editable} labels={PRIORITY_LABEL} />
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-600">
                      <Field value={r.owner} onChange={(v) => setItem('recommendations', i, { owner: v })} editable={editable} />
                    </td>
                    {editable && <td className="py-2.5"><RemoveButton onClick={() => removeItem('recommendations', i)} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editable && <AddButton onClick={() => addItem('recommendations', { text: '', priority: 'moyenne', owner: '' })} count={(analysis.recommendations || []).length} max={MAX.recommendations} label="Ajouter une recommandation" />}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Conclusion et perspectives</CardTitle></CardHeader>
        <CardContent>
          <Field value={analysis.conclusion} onChange={(v) => setField('conclusion', v)} editable={editable} multiline rows={6} className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" />
        </CardContent>
      </Card>
    </div>
  );
}
