// Onglet « Rapport » — bilan de la cohorte 1 « version bureau » (24/11/2026).
//
// Parcours :
//   1. Générer : le serveur recalcule les chiffres (sans IA) et crée une
//      NOUVELLE ligne de review_reports en brouillon, préremplie avec les
//      textes du document de référence (defaultSections.js). Le brouillon
//      n° 6 reste en base, consultable dans l'historique.
//   2. Relire : chaque section rédigée est modifiable (bouton « Modifier »),
//      avec un aperçu immédiat ; « Enregistrer » écrit en base.
//   3. Valider : status 'validated' (bouton existant), réouverture possible.
//   4. Exporter : PDF interne nominatif. La version externe est suspendue.
//
// Les chiffres ne se saisissent jamais : les textes citent des repères {{cle}}
// (values.js) et des blocs calculés {{bloc:nom}} (blocks.js).
import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { Loader2, CheckCircle2, AlertTriangle, Download, Save, Undo2, PencilLine, RefreshCw, FileText, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { getBinomeCountWarning } from '@/lib/programData';
import { WarningBanner } from '@/components/admin/donnees/shared';
import { buildBureauValues, unknownKeys } from '@/lib/bilanBureau/values';
import { BLOCK_NAMES } from '@/lib/bilanBureau/blocks';
import { DEFAULT_SECTIONS, DEFAULT_TITLE } from '@/lib/bilanBureau/defaultSections';
import { MarkupView } from './BureauContent';
import BureauReportPdf from './BureauReportPdf';

export const EXTERNAL_SUSPENDED_MESSAGE = 'Version externe suspendue tant que le bureau n\'a pas statué sur l\'avenir du programme';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

// Appel serveur : création d'un nouveau bilan (textes fournis par l'écran).
export async function generateBureauReport({ cohorte, title, sections, pairNotes = null }) {
  const headers = await getAuthHeader();
  const res = await fetch('/api/invoke-llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      action: 'generate_bureau_report',
      cohorte,
      title,
      sections,
      pair_notes: pairNotes,
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'Échec de la génération');
  return payload;
}

// Aide : liste des repères disponibles, repliable.
function ValuesHelp({ values }) {
  return (
    <details className="text-xs text-gray-600">
      <summary className="cursor-pointer select-none text-gray-500">Repères disponibles (chiffres calculés) et mise en forme</summary>
      <p className="mt-2">
        Mise en forme : ligne vide entre deux paragraphes ; **gras** ; « - » puce ; « 1. » liste numérotée ; « [ ] » case à cocher ;
        « ## » sous-titre ; « | a | b | » ligne de tableau (la première ligne est l'en-tête) ; « &gt; » encadré.
        Blocs calculés, seuls sur leur ligne : {BLOCK_NAMES.map((b) => `{{bloc:${b}}}`).join(', ')}.
      </p>
      <div className="mt-2 grid md:grid-cols-2 gap-x-6 gap-y-0.5">
        {Object.entries(values).map(([key, v]) => (
          <div key={key} className="flex justify-between gap-3 border-b border-gray-50 py-0.5">
            <code className="text-emerald-800">{`{{${key}}}`}</code>
            <span className="text-right">{v.value} <span className="text-gray-400">— {v.label}</span></span>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function RapportBureau({ report, cohorte, queryKey }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(null); // copie de travail de ai_analysis
  const [editing, setEditing] = useState({}); // section en cours de modification
  const [busy, setBusy] = useState(null); // 'save' | 'validate' | 'reopen' | 'generate' | 'export'

  const isValidated = report.status === 'validated';
  const editable = !isValidated;
  const isDirty = draft !== null;
  const analysis = draft ?? report.ai_analysis;
  const working = useMemo(() => ({ ...report, ai_analysis: analysis }), [report, analysis]);
  const values = useMemo(() => buildBureauValues(working), [working]);
  const countWarning = getBinomeCountWarning(report.metrics?.binomes_count);
  const unknown = [...new Set(analysis.sections.flatMap((s) => unknownKeys(s.body, values)))];

  useEffect(() => {
    if (!isDirty) return undefined;
    const onLeave = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [isDirty]);

  function edit(change) {
    setDraft((current) => {
      const next = structuredClone(current ?? report.ai_analysis);
      change(next);
      return next;
    });
  }
  const setSection = (key, body) => edit((a) => { a.sections.find((s) => s.key === key).body = body; });
  const setPair = (binomeId, patch) => edit((a) => {
    const p = a.pair_notes.find((x) => x.binome_id === binomeId);
    if (p) Object.assign(p, patch);
  });

  async function persist(kind, extra = {}) {
    if (!analysis.title?.trim()) { toast.error('Le titre ne peut pas être vide.'); return false; }
    setBusy(kind);
    try {
      const { data, error } = await supabase
        .from('review_reports')
        .update({ ai_analysis: analysis, ...extra })
        .eq('id', report.id)
        .select('*')
        .single();
      if (error) throw error;
      queryClient.setQueryData(queryKey, (rows) => (rows || []).map((r) => (r.id === data.id ? data : r)));
      setDraft(null);
      setEditing({});
      return true;
    } catch (err) {
      toast.error(`Échec de l'enregistrement : ${err.message}`);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleValidate() {
    if (unknown.length) { toast.error(`Repères inconnus à corriger avant validation : ${unknown.join(', ')}`); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (await persist('validate', { status: 'validated', validated_at: new Date().toISOString(), validated_by: user?.id })) toast.success('Rapport validé.');
  }

  async function handleReopen() {
    if (!window.confirm('Rouvrir le rapport pour le modifier ? Il repassera en brouillon et devra être validé de nouveau.')) return;
    if (await persist('reopen', { status: 'draft', validated_at: null, validated_by: null })) toast.success('Rapport rouvert en brouillon.');
  }

  // Régénérer : chiffres recalculés, textes et constats ACTUELS conservés,
  // nouvelle ligne en base (la ligne actuelle reste dans l'historique).
  async function handleRegenerate() {
    if (!window.confirm('Recalculer les chiffres à partir des données actuelles ? Un nouveau brouillon est créé avec les textes affichés (modifications non enregistrées comprises) ; la version actuelle reste en base.')) return;
    setBusy('generate');
    try {
      await generateBureauReport({ cohorte, title: analysis.title, sections: analysis.sections, pairNotes: analysis.pair_notes });
      setDraft(null);
      setEditing({});
      toast.success('Nouveau brouillon créé avec les chiffres recalculés.');
      queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err.message, { duration: 10000 });
    } finally {
      setBusy(null);
    }
  }

  async function handleExport() {
    setBusy('export');
    try {
      const blob = await pdf(<BureauReportPdf report={working} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bilan-passerelles-cohorte-${cohorte}-bureau-interne${isValidated ? '' : '-brouillon'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Échec de l'export PDF : ${err.message}`);
    } finally {
      setBusy(null);
    }
  }

  const spin = (kind, Icon) => (busy === kind ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Icon className="h-4 w-4 mr-2" />);

  return (
    <div className="space-y-6">
      {countWarning && <WarningBanner title="Export bloqué : contrôle du nombre de binômes" tone="red">{countWarning}</WarningBanner>}
      {unknown.length > 0 && (
        <WarningBanner title="Repères inconnus dans le texte" tone="red">
          {unknown.map((k) => `{{${k}}}`).join(', ')} : corrige-les (liste des repères en bas de la barre d'actions) avant de valider.
        </WarningBanner>
      )}

      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-gray-600">Cohorte {cohorte} · version bureau</Badge>
          <span className="text-xs text-gray-500">Chiffres calculés le {new Date(report.generated_at).toLocaleString('fr-FR')}</span>
          {isValidated
            ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Validé</Badge>
            : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1"><AlertTriangle className="h-3 w-3" /> Brouillon</Badge>}
          {isDirty && <span className="text-xs font-medium text-amber-700">Modifications non enregistrées</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <>
              <Button variant="ghost" onClick={() => window.confirm('Abandonner les modifications non enregistrées ?') && (setDraft(null), setEditing({}))} disabled={!isDirty || busy !== null}>
                <Undo2 className="h-4 w-4 mr-2" /> Annuler
              </Button>
              <Button onClick={async () => (await persist('save')) && toast.success('Modifications enregistrées.')} disabled={!isDirty || busy !== null} className="bg-emerald-700 hover:bg-emerald-800">
                {spin('save', Save)} Enregistrer
              </Button>
              <Button variant="outline" onClick={handleValidate} disabled={busy !== null || Boolean(countWarning)}>
                {spin('validate', CheckCircle2)} {isDirty ? 'Enregistrer et valider' : 'Valider le rapport'}
              </Button>
            </>
          )}
          {isValidated && (
            <Button variant="outline" onClick={handleReopen} disabled={busy !== null}>{spin('reopen', PencilLine)} Rouvrir pour modifier</Button>
          )}
          <Button variant="outline" onClick={handleRegenerate} disabled={busy !== null}>{spin('generate', RefreshCw)} Recalculer les chiffres</Button>
        </div>
        <div className="w-full"><ValuesHelp values={values} /></div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Export PDF</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-800">Version interne</p>
            <p className="text-xs text-gray-500">Nominative, réservée au bureau de Ma Belle Promo. Pied de page : « Confidentiel — usage interne Ma Belle Promo (document nominatif) ».</p>
            <Button variant="outline" onClick={handleExport} disabled={busy !== null || Boolean(countWarning)}>
              {spin('export', Download)} Rapport complet{isValidated ? '' : ' (brouillon)'}
            </Button>
            {isDirty && <p className="text-xs text-amber-700">Le PDF reprend le texte affiché, modifications non enregistrées comprises.</p>}
          </div>
          <div className="rounded-xl border border-gray-100 p-4 space-y-2 bg-gray-50">
            <p className="text-sm font-semibold text-gray-500">Version externe</p>
            <p className="text-xs text-gray-600 flex items-start gap-2"><Ban className="h-4 w-4 shrink-0 text-gray-400" /> {EXTERNAL_SUSPENDED_MESSAGE}.</p>
            <Button variant="outline" disabled>Rapport complet</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6 space-y-2">
          {editable && editing.__title ? (
            <Input value={analysis.title} onChange={(e) => edit((a) => { a.title = e.target.value; })} className="text-lg font-semibold" />
          ) : (
            <h2 className="text-2xl font-semibold text-gray-900">{analysis.title}</h2>
          )}
          {editable && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing((e) => ({ ...e, __title: !e.__title }))}>
              <PencilLine className="h-3.5 w-3.5 mr-1" /> {editing.__title ? 'Fermer' : 'Modifier le titre'}
            </Button>
          )}
        </CardContent>
      </Card>

      {analysis.sections.map((s) => (
        <Card key={s.key} className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-700" /> {s.title || 'Avertissement'}
            </CardTitle>
            {editable && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditing((e) => ({ ...e, [s.key]: !e[s.key] }))}>
                <PencilLine className="h-3.5 w-3.5 mr-1" /> {editing[s.key] ? 'Fermer l\'éditeur' : 'Modifier'}
              </Button>
            )}
          </CardHeader>
          <CardContent className={editing[s.key] ? 'grid xl:grid-cols-2 gap-4' : ''}>
            {editing[s.key] && (
              <div className="space-y-1">
                <Textarea value={s.body} onChange={(e) => setSection(s.key, e.target.value)} rows={Math.min(40, s.body.split('\n').length + 4)} className="font-mono text-xs" />
                <p className="text-[11px] text-gray-500">Les chiffres s'écrivent avec un repère (ex. {'{{binomes}}'}) : ils restent calculés. Aperçu à droite.</p>
              </div>
            )}
            <MarkupView body={s.body} report={working} values={values} editable={editable} onPairChange={setPair} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Textes de départ d'un nouveau bilan.
export const DEFAULT_REPORT_TEXTS = { title: DEFAULT_TITLE, sections: DEFAULT_SECTIONS };
