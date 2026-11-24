// Affichage à l'écran des textes et des blocs calculés du bilan « version bureau ».
// Même découpage (markup.js) et mêmes données (blocks.js) que le PDF.
import React from 'react';
import { parseMarkup, splitBold } from '@/lib/bilanBureau/markup';
import { fillValues } from '@/lib/bilanBureau/values';
import { buildBlock, ANNEXE_HEAD, annexeCells } from '@/lib/bilanBureau/blocks';
import { RELATION_SHORT } from '@/lib/bilanBureau/values';
import ReportChart, { DOM_PRIMITIVES } from '@/components/charts/ReportChart';
import { ChoiceField } from '@/components/admin/reportEditing';
import { Textarea } from '@/components/ui/textarea';

// Texte avec **gras** et valeurs {{cle}} remplacées ; repère inconnu en rouge.
export function Inline({ text, values }) {
  return splitBold(fillValues(text, values)).map((seg, i) => {
    const parts = seg.text.split(/(⚠\{\{[^}]+\}\}⚠)/g);
    const content = parts.map((p, j) => (p.startsWith('⚠') ? <span key={j} className="bg-red-100 text-red-700 px-1 rounded">{p}</span> : p));
    return seg.bold ? <strong key={i} className="text-gray-900">{content}</strong> : <React.Fragment key={i}>{content}</React.Fragment>;
  });
}

function SimpleTable({ head, rows, narrow, values }) {
  return (
    <div className="overflow-x-auto">
      <table className={`text-sm border border-gray-200 ${narrow ? 'w-auto' : 'w-full'}`}>
        <thead className="bg-gray-50">
          <tr>{head.map((h, i) => <th key={i} className="text-left font-normal text-gray-500 px-3 py-2 border-b border-gray-200"><Inline text={h} values={values} /></th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 align-top">
              {r.map((c, j) => <td key={j} className="px-3 py-2 text-gray-700"><Inline text={c} values={values} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FigureBlock({ figure, title }) {
  return (
    <figure className="rounded-xl border border-gray-100 bg-white p-4 space-y-2">
      {title && <figcaption className="text-sm font-semibold text-gray-900">{title}</figcaption>}
      {figure.subtitle && <p className="text-xs text-gray-500">{figure.subtitle}</p>}
      <ReportChart figure={figure} P={DOM_PRIMITIVES} />
      <p className="text-[11px] text-gray-500">{figure.source}</p>
      {figure.reading && <p className="text-xs text-gray-700 italic">Lecture : {figure.reading}</p>}
    </figure>
  );
}

// Annexe A : en brouillon, l'état et le constat de chaque binôme sont modifiables.
function AnnexeBinomes({ rows, editable, onPairChange }) {
  if (!editable) return <SimpleTable head={ANNEXE_HEAD} rows={rows.map(annexeCells)} values={{}} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-gray-50">
          <tr>{ANNEXE_HEAD.map((h) => <th key={h} className="text-left font-normal text-gray-500 px-3 py-2 border-b border-gray-200">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.binome_id} className="border-b border-gray-100 align-top">
              <td className="px-3 py-2 text-gray-800">{r.pair}</td>
              <td className="px-3 py-2"><ChoiceField value={r.status} onChange={(v) => onPairChange(r.binome_id, { status: v })} editable labels={RELATION_SHORT} /></td>
              <td className="px-3 py-2 whitespace-nowrap">{r.mentorScore}</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.mentoreScore}</td>
              <td className="px-3 py-2 min-w-[14rem]">
                <Textarea value={r.constat} rows={2} className="text-sm" onChange={(e) => onPairChange(r.binome_id, { constat: e.target.value })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-1">Noms et notes calculés à partir des données ; l'état et le constat sont modifiables. L'état alimente le tableau « Les binômes » de la section 4.</p>
    </div>
  );
}

export function BlockView({ name, report, values, editable, onPairChange, pendingTitle }) {
  const block = buildBlock(name, report);
  if (!block) return <p className="text-sm text-red-700 bg-red-50 rounded p-2">Bloc inconnu : {`{{bloc:${name}}}`}</p>;
  if (block.kind === 'missing') return <p className="text-sm text-gray-500">Graphique non disponible : données absentes.</p>;
  if (block.kind === 'table') return <SimpleTable {...block} values={values} />;
  if (block.kind === 'figure') return <FigureBlock figure={block.figure} title={pendingTitle} />;
  if (block.kind === 'annexe') return <AnnexeBinomes rows={block.rows} editable={editable} onPairChange={onPairChange} />;
  if (block.kind === 'figures') {
    return (
      <div className="grid xl:grid-cols-2 gap-4">
        {block.figures.map((f) => <FigureBlock key={f.id} figure={f} title={`Figure ${f.number} — ${f.title}`} />)}
      </div>
    );
  }
  return null;
}

// Texte complet d'une section, mis en forme.
export function MarkupView({ body, report, values, editable, onPairChange }) {
  const blocks = parseMarkup(body);
  return (
    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p': return <p key={i}><Inline text={b.text} values={values} /></p>;
          case 'h': return <h4 key={i} className="text-base font-semibold text-gray-900 pt-2"><Inline text={b.text} values={values} /></h4>;
          case 'note': return <p key={i} className="text-xs bg-amber-50 border border-amber-100 rounded p-2"><Inline text={b.text} values={values} /></p>;
          case 'bullet': return <ul key={i} className="list-disc pl-5 space-y-1">{b.items.map((t, j) => <li key={j}><Inline text={t} values={values} /></li>)}</ul>;
          case 'numbered': return <ol key={i} className="list-decimal pl-5 space-y-1">{b.items.map((t, j) => <li key={j}><Inline text={t} values={values} /></li>)}</ol>;
          case 'task': return (
            <ul key={i} className="space-y-1">
              {b.items.map((t, j) => <li key={j} className="flex gap-2"><span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded border border-gray-400" /><span><Inline text={t} values={values} /></span></li>)}
            </ul>
          );
          case 'table': return <SimpleTable key={i} head={b.rows[0]} rows={b.rows.slice(1)} values={values} />;
          case 'block': return <BlockView key={i} name={b.name} report={report} values={values} editable={editable} onPairChange={onPairChange} />;
          default: return null;
        }
      })}
    </div>
  );
}
