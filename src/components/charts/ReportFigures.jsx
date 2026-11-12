// src/components/charts/ReportFigures.jsx
// Les figures du rapport à l'écran (onglet « Rapport » du dashboard).
// Mêmes données (buildReportFigures) et même dessin (ReportChart) que le PDF.
import React, { useState } from 'react';
import { buildReportFigures, SECTION_LABEL } from '@/lib/reportFigures';
import ReportChart, { DOM_PRIMITIVES } from '@/components/charts/ReportChart';

function FigureCard({ figure }) {
  return (
    <figure className="rounded-xl border border-gray-100 bg-white p-4 space-y-2">
      <figcaption className="text-sm font-semibold text-gray-900">
        Figure {figure.number} — {figure.title}
      </figcaption>
      <ReportChart figure={figure} P={DOM_PRIMITIVES} />
      <p className="text-[11px] text-gray-500">{figure.source}.</p>
      <p className="text-xs text-gray-700 italic">Lecture : {figure.reading}</p>
    </figure>
  );
}

export default function ReportFigures({ report }) {
  // Aperçu de la version choisie : la numérotation et les figures diffèrent
  // (la version externe n'a pas de figure par binôme).
  const [variant, setVariant] = useState('internal');
  const figures = buildReportFigures(report, variant);
  if (!figures.length) return <p className="text-sm text-gray-500">Aucune figure : les données du rapport ne les contiennent pas.</p>;

  const sections = [...new Set(figures.map((f) => f.section))];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[['internal', 'Version interne'], ['external', 'Version externe']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setVariant(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              variant === key ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-gray-500">{figures.length} figures, identiques à celles du PDF de cette version.</span>
      </div>
      {sections.map((section) => (
        <div key={section} className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{SECTION_LABEL[section]}</p>
          <div className="grid xl:grid-cols-2 gap-4">
            {figures.filter((f) => f.section === section).map((f) => <FigureCard key={f.id} figure={f} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
