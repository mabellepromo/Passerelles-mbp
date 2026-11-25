// Onglet « Expertise binômes » de la rubrique « Données & Bilan ».
// Fiche d'expertise par binôme (sentence, confiance, constat, preuves),
// tableau récapitulatif et synthèse transversale de la cohorte 1.
// Tout est lu depuis Supabase (src/lib/expertiseBinome.js) ; chaque citation
// est vérifiée en direct contre les réponses au sondage.
// Document interne au bureau : rien ici n'est destiné aux binômes.
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2, ShieldAlert, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchOfficialBinomes, fetchReviewResponses } from '@/lib/programData';
import { buildExpertise, citationText, questionLabel, summaryLine, REMARQUE_LABEL, ROLE } from '@/lib/expertiseBinome';
import { Loader, WarningBanner } from '@/components/admin/donnees/shared';
import ExpertisePdf from './ExpertisePdf';

const COHORTE = '1';
const EXPECTED = 11;

const TONE = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-800 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

async function readTable(table, build) {
  const { data, error } = await build(supabase.from(table).select('*'));
  if (error) throw error;
  return data ?? [];
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
const slug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

function SentenceBadge({ f }) {
  return <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${TONE[f.tone]}`}>{f.sentenceLabel}</span>;
}

function Fiche({ f }) {
  if (f.missing) {
    return <WarningBanner title="Fiche non rédigée">Aucune expertise enregistrée pour ce binôme dans binome_expertise.</WarningBanner>;
  }
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <div className="flex flex-wrap items-center gap-2">
        <SentenceBadge f={f} />
        <Badge variant="outline">Confiance {f.confianceLabel}</Badge>
        <span className="text-xs text-gray-500">Réponses : {f.reponses}</span>
      </div>
      {f.absents.map((a) => <p key={a} className="text-xs text-gray-500">{a}</p>)}

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Constat</p>
        <p className="font-medium text-gray-900">{f.constat}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Preuves (réponses au sondage)</p>
        <ul className="space-y-1.5">
          {f.preuves.map((p, i) => (
            <li key={i} className="flex gap-2">
              {p.found
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-label="Citation vérifiée" />
                : <XCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" aria-label="Citation introuvable" />}
              <span>
                <span className="text-gray-500">{ROLE[p.role]} — {questionLabel(p.question)} :</span>{' '}
                <span className="italic">« {citationText(p)} »</span>
                {p.sensible && <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-red-700"><Lock className="h-3 w-3" /> strictement interne</span>}
                {!p.found && <span className="ml-2 text-[11px] text-red-700">citation introuvable dans les réponses</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {f.remarques.length > 0 && (
        <div className="space-y-1">
          {f.remarques.map((r, i) => (
            <p key={i}><span className="font-semibold">{REMARQUE_LABEL[r.type] || r.type} :</span> {r.texte}</p>
          ))}
        </div>
      )}

      <div className={`rounded-lg border p-3 ${TONE[f.tone]}`}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1">Sentence : {f.sentenceLabel}. Binôme clos.</p>
        <p>{f.motif}</p>
      </div>
    </div>
  );
}

export default function ExpertiseBinomes() {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const rowsQ = useQuery({ queryKey: ['binome_expertise', COHORTE], queryFn: () => readTable('binome_expertise', (x) => x.eq('cohorte', COHORTE)) });
  const synthQ = useQuery({ queryKey: ['binome_expertise_synthese', COHORTE], queryFn: () => readTable('binome_expertise_synthese', (x) => x.eq('cohorte', COHORTE)) });
  const binomesQ = useQuery({ queryKey: ['official_binomes'], queryFn: () => fetchOfficialBinomes('mentor_name') });
  const respQ = useQuery({ queryKey: ['review-responses-fiches'], queryFn: () => fetchReviewResponses() });

  const { fiches, orphans, counts } = useMemo(
    () => buildExpertise(rowsQ.data, binomesQ.data, respQ.data),
    [rowsQ.data, binomesQ.data, respQ.data],
  );
  const synthese = synthQ.data?.[0]?.points ?? [];

  const queries = [rowsQ, synthQ, binomesQ, respQ];
  if (queries.some((x) => x.isLoading)) return <Loader />;
  const failed = queries.find((x) => x.error);
  if (failed) return <WarningBanner title="Lecture des données impossible" tone="red">{failed.error.message}</WarningBanner>;
  if (!fiches.length) return <WarningBanner title="Aucun binôme">Aucun binôme officiel trouvé.</WarningBanner>;

  const current = fiches.find((f) => f.binome_id === selected) || fiches[0];
  const unverified = fiches.reduce((n, f) => n + f.unverified, 0);
  const missing = fiches.filter((f) => f.missing).length;

  async function exportPdf(list, name, withSummary) {
    setBusy(true);
    try {
      download(await pdf(<ExpertisePdf fiches={list} synthese={withSummary ? synthese : null} counts={withSummary ? counts : null} />).toBlob(), name);
    } catch (err) {
      toast.error(`Échec de l'export PDF : ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {fiches.length !== EXPECTED && (
        <WarningBanner title="Nombre de binômes" tone="red">{fiches.length} binômes officiels lus, {EXPECTED} attendus.</WarningBanner>
      )}
      {orphans.length > 0 && (
        <WarningBanner title="Fiches hors binômes officiels" tone="red">Ignorées : {orphans.join(', ')}.</WarningBanner>
      )}
      {(unverified > 0 || missing > 0) && (
        <WarningBanner title="Contrôle des fiches" tone="red">
          {unverified > 0 && `${unverified} citation(s) introuvable(s) dans les réponses au sondage. `}
          {missing > 0 && `${missing} binôme(s) sans fiche d'expertise.`}
        </WarningBanner>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg p-3 flex gap-2 flex-1 min-w-[16rem]">
          <ShieldAlert className="h-4 w-4 shrink-0" /> Document interne et nominatif, réservé au bureau. Ne jamais transmettre aux binômes.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportPdf([current], `expertise-${slug(current.mentor_name)}.pdf`, false)} disabled={busy}>
            <Download className="h-4 w-4 mr-2" /> Cette fiche
          </Button>
          <Button variant="outline" onClick={() => exportPdf(fiches, `expertise-binomes-cohorte-${COHORTE}.pdf`, true)} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Dossier complet
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">
            Récapitulatif : {summaryLine(counts)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-gray-50">
                <tr>{['Binôme (mentor / mentoré)', 'Réponses', 'Sentence', 'Confiance'].map((h) => <th key={h} className="text-left font-normal text-gray-500 px-3 py-1.5 border-b border-gray-200">{h}</th>)}</tr>
              </thead>
              <tbody>
                {fiches.map((f) => (
                  <tr key={f.binome_id} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => setSelected(f.binome_id)}>
                    <td className="px-3 py-1.5">{f.mentor_name} / {f.mentore_name}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{f.reponses}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap"><SentenceBadge f={f} /></td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{f.confianceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Tous les binômes sont clos. Aucune donnée sur le nombre ni la régularité des séances n'est utilisée.</p>
        </CardContent>
      </Card>

      {synthese.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Synthèse transversale</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">{synthese.map((t) => <li key={t}>{t}</li>)}</ul>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-[16rem_1fr] gap-4">
        <div className="space-y-1">
          {fiches.map((f) => (
            <button key={f.binome_id} type="button" onClick={() => setSelected(f.binome_id)}
              className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${current.binome_id === f.binome_id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 bg-white hover:border-emerald-200'}`}>
              <span className="block font-medium text-gray-800">{f.mentor_name}</span>
              <span className="block text-gray-500">{f.mentore_name}</span>
              <span className="block text-[11px] text-gray-400 mt-0.5">{f.sentenceLabel} · confiance {f.confianceLabel}</span>
            </button>
          ))}
        </div>
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">{current.mentor_name} / {current.mentore_name}</CardTitle></CardHeader>
          <CardContent><Fiche f={current} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
