// Bilan d'expertise de la cohorte 1 : répartition des sentences par binôme
// (réussite / réussite partielle / échec), lue dans binome_expertise.
//   compact : bandeau pour la vue d'ensemble (répartition + lien) ;
//   complet : + sentences selon les réponses au sondage, tableau, synthèse,
//             contradictions avec l'alerte de recommandation (NPS).
// Couleurs de statut toujours accompagnées d'un libellé et d'un nombre.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gavel, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchExpertise, fetchExpertiseSynthese, fetchBinomeOverview } from '@/lib/programData';
import { SENTENCE, SENTENCE_KEYS, summarizeExpertise, summaryLine } from '@/lib/expertiseBinome';
import { Loader, WarningBanner } from './shared';

const INK_ON = { reussite: '#ffffff', reussite_partielle: '#111827', echec: '#ffffff' };

// Barre segmentée : un segment par sentence, libellé et nombre dans le segment.
function SegmentedBar({ counts, total }) {
  const parts = SENTENCE_KEYS.filter((k) => counts[k] > 0);
  return (
    <div>
      <div className="flex gap-[2px] h-9 w-full" role="img"
        aria-label={`Sentences sur ${total} binômes : ${summaryLine(counts)}`}>
        {parts.map((k, i) => (
          <div key={k} title={`${SENTENCE[k].label} : ${counts[k]} sur ${total}`}
            className={`flex items-center justify-center text-xs font-semibold ${i === 0 ? 'rounded-l' : ''} ${i === parts.length - 1 ? 'rounded-r' : ''}`}
            style={{ width: `${(counts[k] / total) * 100}%`, background: SENTENCE[k].color, color: INK_ON[k] }}>
            {counts[k]}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
        {SENTENCE_KEYS.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SENTENCE[k].color }} />
            {SENTENCE[k].label} : <strong className="text-gray-800">{counts[k]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function ByResponseChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={56 + data.length * 44}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: '#f9fafb' }}
          formatter={(v, key) => [`${v} binôme(s)`, SENTENCE[key]?.label || key]} />
        {SENTENCE_KEYS.map((k) => (
          <Bar key={k} dataKey={k} stackId="s" fill={SENTENCE[k].color} stroke="#ffffff" strokeWidth={2} name={k}>
            <LabelList dataKey={k} position="center" formatter={(v) => (v > 0 ? v : '')}
              style={{ fontSize: 11, fontWeight: 600, fill: INK_ON[k] }} />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ExpertiseSummary({ compact = false, onOpen }) {
  const rowsQ = useQuery({ queryKey: ['binome_expertise', '1'], queryFn: () => fetchExpertise('1') });
  const overviewQ = useQuery({ queryKey: ['official_binome_overview'], queryFn: fetchBinomeOverview });
  const synthQ = useQuery({ queryKey: ['binome_expertise_synthese_points', '1'], queryFn: () => fetchExpertiseSynthese('1'), enabled: !compact });

  if (rowsQ.isLoading || overviewQ.isLoading) return <Loader />;
  const error = rowsQ.error || overviewQ.error;
  if (error) return <WarningBanner title="Bilan d'expertise illisible" tone="red">{error.message}</WarningBanner>;

  const s = summarizeExpertise(rowsQ.data, overviewQ.data);
  if (!s.written) return null;
  const result = s.counts.reussite + s.counts.reussite_partielle;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4 text-emerald-700" /> Bilan d'expertise des binômes — cohorte 1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          Sur {s.total} binômes : <strong>{summaryLine(s.counts)}</strong>. {result} binôme(s) classé(s) en réussite
          ou réussite partielle, {s.counts.echec} en échec. Tous les binômes sont clos.
          {s.written < s.total && <span className="text-red-700"> {s.total - s.written} binôme(s) sans fiche d'expertise.</span>}
        </p>
        <SegmentedBar counts={s.counts} total={s.written} />

        {!compact && (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sentence selon les réponses au sondage</p>
              <ByResponseChart data={s.byResponse} />
              <table className="w-full text-xs text-gray-600 border border-gray-100 mt-1">
                <thead className="bg-gray-50">
                  <tr>{['', ...SENTENCE_KEYS.map((k) => SENTENCE[k].label), 'Total'].map((h) => <th key={h} className="text-left font-normal px-2 py-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {s.byResponse.map((r) => (
                    <tr key={r.label} className="border-t border-gray-100">
                      <td className="px-2 py-1 text-gray-700">{r.label}</td>
                      {SENTENCE_KEYS.map((k) => <td key={k} className="px-2 py-1">{r[k]}</td>)}
                      <td className="px-2 py-1 font-semibold text-gray-800">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {s.vigilanceMismatch.length > 0 && (
              <WarningBanner title="L'alerte de recommandation ne mesure pas le fonctionnement du binôme">
                Pour {s.vigilanceMismatch.length} binôme(s) sur {s.written}, l'alerte calculée sur la note de recommandation du
                programme (NPS) contredit la sentence : échec classé vert ou orange, ou résultat obtenu classé rouge. Pour juger
                un binôme, la sentence fait foi.
              </WarningBanner>
            )}

            {synthQ.data?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Synthèse transversale</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">{synthQ.data.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
          </>
        )}

        {onOpen && (
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline">
            Voir les fiches d'expertise <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
