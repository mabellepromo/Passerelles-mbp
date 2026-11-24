// Onglet « Fiches binômes » de la rubrique « Données & Bilan ».
// Une fiche bilan par binôme pour la clôture de la cohorte 1, en deux versions :
//   - Interne (bureau) : réponses du sondage des deux membres, constat,
//     points pour la clôture. Ne jamais remettre aux participants.
//   - Clôture (binôme) : noms, programme, message de clôture du bureau ;
//     aucune note ni réponse individuelle.
// Le message de clôture est stocké avec le bilan « version bureau »
// (ai_analysis.pair_notes[].message_cloture) : modifiable tant que ce bilan
// est en brouillon, figé une fois validé.
import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2, Save, RotateCcw, Lock, ShieldAlert, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fetchReviewResponses } from '@/lib/programData';
import { BUREAU_FORMAT } from '@/lib/bilanBureau/values';
import { buildFiches, fillMessage, defaultClosingMessage } from '@/lib/ficheBinome';
import { Loader, WarningBanner } from '@/components/admin/donnees/shared';
import FichesBinomesPdf from './FichesBinomesPdf';

const COHORTE = '1';
// Même clé que l'onglet Rapport : une modification ici est vue là-bas.
const REPORTS_KEY = ['review_reports_all', COHORTE];

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
const slug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

function InternalView({ f }) {
  const side = (label, x) => (x.responded ? `${label} : a répondu le ${x.submitted_at}` : `${label} : pas de réponse au sondage`);
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50">{f.statusLabel}</Badge>
        <span className="text-xs text-gray-500">{side('Mentor', f.mentor)} · {side('Mentoré', f.mentore)}</span>
      </div>
      {f.constat && <p><span className="font-semibold">Constat :</span> {f.constat}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>{['Question', 'Mentor', 'Mentoré'].map((h) => <th key={h} className="text-left font-normal text-gray-500 px-3 py-1.5 border-b border-gray-200">{h}</th>)}</tr>
          </thead>
          <tbody>
            {f.scoreRows.map((r) => (
              <tr key={r.label} className="border-b border-gray-100">
                <td className="px-3 py-1.5">{r.label}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{r.mentor}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{r.mentore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-1">
        <p><span className="font-semibold">Apports cités par le mentor :</span> {f.mentor.responded ? (f.mentor.contributions.join(', ') || 'aucun apport coché') : 'pas de réponse'}</p>
        <p><span className="font-semibold">Apports cités par le mentoré :</span> {f.mentore.responded ? (f.mentore.contributions.join(', ') || 'aucun apport coché') : 'pas de réponse'}</p>
        <p><span className="font-semibold">Intérêt pour une nouvelle expérience</span> (question hypothétique) : mentor, {f.mentor.continuation || 'pas de réponse'} ; mentoré, {f.mentore.continuation || 'pas de réponse'}.</p>
        <p><span className="font-semibold">Citation :</span> mentor, {f.mentor.consent || 'pas de réponse'} ; mentoré, {f.mentore.consent || 'pas de réponse'}.</p>
      </div>
      {[['Mentor', f.mentor], ['Mentoré', f.mentore]].some(([, x]) => x.open.length) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Réponses libres (usage interne)</p>
          {[['Mentor', f.mentor], ['Mentoré', f.mentore]].map(([label, x]) => x.open.map((o) => (
            <blockquote key={`${label}-${o.key}`} className="border-l-2 border-amber-300 pl-3">
              <p className="text-xs text-gray-500">{label} — {o.label}</p>
              <p className="italic">« {o.text} »</p>
            </blockquote>
          )))}
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Points pour la clôture</p>
        <ul className="list-disc pl-5 space-y-1">{f.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </div>
  );
}

function ClosingView({ f, editable, draft, onChange, onReset }) {
  const text = draft ?? f.message;
  return (
    <div className="grid xl:grid-cols-2 gap-4">
      {editable && (
        <div className="space-y-2">
          <Textarea value={text} onChange={(e) => onChange(e.target.value)} rows={14} className="text-sm" />
          <p className="text-[11px] text-gray-500">
            Repères remplacés automatiquement : {'{{mentor_prenom}}'}, {'{{mentore_prenom}}'}, {'{{date_debut}}'}. Ligne vide = nouveau paragraphe.
            Rester neutre sur l'avenir du programme : la fiche annonce la fin de la cohorte 1.
          </p>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revenir au message proposé
          </Button>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 text-sm text-gray-700">
        <p className="text-xs tracking-widest text-amber-600">PASSERELLES — COHORTE 1</p>
        <p className="text-lg font-semibold text-emerald-900">Fiche de clôture du binôme</p>
        <p>Mentor : {f.mentor_name}<br />Mentoré : {f.mentore_name}</p>
        {fillMessage(text, f).split(/\n\s*\n/).filter((t) => t.trim()).map((t, i) => <p key={i}>{t}</p>)}
        <p className="pt-2">Le bureau de Ma Belle Promo</p>
      </div>
    </div>
  );
}

export default function FichesBinomes() {
  const queryClient = useQueryClient();
  const [variant, setVariant] = useState('internal');
  const [selected, setSelected] = useState(null);
  const [drafts, setDrafts] = useState({}); // binome_id -> message en cours
  const [busy, setBusy] = useState(null);

  const { data: reports = [], isLoading: l1 } = useQuery({
    queryKey: REPORTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('review_reports').select('*').eq('period_label', COHORTE).order('generated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: responses = [], isLoading: l2 } = useQuery({ queryKey: ['review-responses-fiches'], queryFn: () => fetchReviewResponses() });

  const report = reports.find((r) => r.ai_analysis?.report_format === BUREAU_FORMAT) || null;
  const fiches = useMemo(() => (report ? buildFiches(report, responses) : []), [report, responses]);

  if (l1 || l2) return <Loader />;
  if (!report) return <WarningBanner title="Bilan « version bureau » introuvable">Génère d'abord le bilan dans l'onglet Rapport : les fiches en reprennent les binômes, l'état des relations et les constats.</WarningBanner>;

  if (!fiches.length) return <WarningBanner title="Aucun binôme">Le bilan ne contient aucun binôme officiel.</WarningBanner>;

  const current = fiches.find((f) => f.binome_id === selected) || fiches[0];
  const editable = report.status !== 'validated';
  const dirtyIds = Object.keys(drafts);
  // Fiches telles qu'affichées, messages en cours compris.
  const withDrafts = fiches.map((f) => (drafts[f.binome_id] !== undefined ? { ...f, message: drafts[f.binome_id] } : f));

  async function save() {
    setBusy('save');
    try {
      const analysis = structuredClone(report.ai_analysis);
      for (const p of analysis.pair_notes) if (drafts[p.binome_id] !== undefined) p.message_cloture = drafts[p.binome_id];
      const { data, error } = await supabase.from('review_reports').update({ ai_analysis: analysis }).eq('id', report.id).select('*').single();
      if (error) throw error;
      queryClient.setQueryData(REPORTS_KEY, (rows) => (rows || []).map((r) => (r.id === data.id ? data : r)));
      setDrafts({});
      toast.success('Messages de clôture enregistrés.');
    } catch (err) {
      toast.error(`Échec de l'enregistrement : ${err.message}`);
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf(list, name) {
    setBusy('export');
    try {
      download(await pdf(<FichesBinomesPdf fiches={list} variant={variant} />).toBlob(), name);
    } catch (err) {
      toast.error(`Échec de l'export PDF : ${err.message}`);
    } finally {
      setBusy(null);
    }
  }
  const suffix = variant === 'internal' ? 'interne' : 'cloture';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[['internal', 'Fiche bilan (bureau)'], ['closing', 'Fiche de clôture (binôme)']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setVariant(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${variant === key ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {variant === 'closing' && editable && (
            <Button onClick={save} disabled={!dirtyIds.length || busy !== null} className="bg-emerald-700 hover:bg-emerald-800">
              {busy === 'save' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Enregistrer{dirtyIds.length ? ` (${dirtyIds.length})` : ''}
            </Button>
          )}
          <Button variant="outline" onClick={() => exportPdf([withDrafts.find((f) => f.binome_id === current.binome_id)], `fiche-${suffix}-${slug(current.mentor_name)}.pdf`)} disabled={busy !== null}>
            <Download className="h-4 w-4 mr-2" /> Cette fiche
          </Button>
          <Button variant="outline" onClick={() => exportPdf(withDrafts, `fiches-binomes-cohorte-${COHORTE}-${suffix}.pdf`)} disabled={busy !== null}>
            {busy === 'export' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Les {fiches.length} fiches
          </Button>
        </div>
      </div>

      {variant === 'internal' ? (
        <p className="text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg p-3 flex gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" /> Document interne et nominatif : le sondage était nominatif, les réponses d'un membre ne doivent jamais être transmises à l'autre ni au binôme.
        </p>
      ) : (
        <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 flex gap-2">
          <Mail className="h-4 w-4 shrink-0" /> Fiche destinée aux deux membres du binôme : aucune note, aucune réponse au sondage, aucun constat.
          {!editable && <span className="flex items-center gap-1 text-amber-700"><Lock className="h-3.5 w-3.5" /> Bilan validé : messages figés (rouvrir le rapport pour les modifier).</span>}
        </p>
      )}

      <div className="grid lg:grid-cols-[16rem_1fr] gap-4">
        <div className="space-y-1">
          {fiches.map((f) => (
            <button key={f.binome_id} type="button" onClick={() => setSelected(f.binome_id)}
              className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${current.binome_id === f.binome_id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 bg-white hover:border-emerald-200'}`}>
              <span className="block font-medium text-gray-800">{f.mentor_name}</span>
              <span className="block text-gray-500">{f.mentore_name}</span>
              <span className="block text-[11px] text-gray-400 mt-0.5">{f.statusLabel}{drafts[f.binome_id] !== undefined ? ' · modifié' : ''}</span>
            </button>
          ))}
        </div>
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">{current.mentor_name} / {current.mentore_name}</CardTitle></CardHeader>
          <CardContent>
            {variant === 'internal' ? <InternalView f={current} /> : (
              <ClosingView
                f={current}
                editable={editable}
                draft={drafts[current.binome_id]}
                onChange={(v) => setDrafts((d) => ({ ...d, [current.binome_id]: v }))}
                onReset={() => setDrafts((d) => ({ ...d, [current.binome_id]: defaultClosingMessage(current.status) }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
