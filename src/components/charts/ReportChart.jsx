// src/components/charts/ReportChart.jsx
// Dessin des figures du rapport de bilan, écrit UNE SEULE FOIS.
//
// Le dessin reçoit un jeu d'éléments graphiques `P` :
//   - à l'écran : les éléments SVG du navigateur (DOM_PRIMITIVES) ;
//   - dans le PDF : les éléments SVG de @react-pdf/renderer (PDF_PRIMITIVES,
//     dans pdfPrimitives.jsx).
// La géométrie est donc identique à l'écran et dans le PDF, et le PDF reste
// vectoriel (net à toutes les tailles).
//
// Unités : le point typographique. La largeur par défaut (511) est la largeur
// utile d'une page A4 du rapport (595 - 2 x 42 de marge).
//
// Lisibilité en noir et blanc : les effectifs sont écrits sur les barres,
// les légendes suivent l'ordre des segments, les échelles ordonnées utilisent
// une seule teinte du clair au foncé, et les regards croisés distinguent les
// rôles par la forme (carré / rond), pas seulement par la couleur.
import React from 'react';
import { FIGURE_COLORS as C, inkOn } from '@/lib/reportFigures';

export const CHART_WIDTH = 511;
const FONT = 7.5;
const SMALL = 6.8;

// Largeur approximative d'un texte en Helvetica (suffisante pour décider si
// une étiquette tient dans une barre).
const textWidth = (text, size = FONT, bold = false) => String(text).length * size * (bold ? 0.56 : 0.52);

// Raccourcit un nom trop long pour sa colonne (« … » final).
function fit(text, maxWidth, size = SMALL) {
  const s = String(text);
  const maxChars = Math.floor(maxWidth / (size * 0.52));
  return s.length <= maxChars ? s : `${s.slice(0, maxChars - 1)}…`;
}

// ----------------------------------------------------------------------------
// Éléments graphiques du navigateur
// ----------------------------------------------------------------------------
export const DOM_PRIMITIVES = {
  Svg: ({ width, height, children }) => (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width * 1.5, display: 'block' }} role="img">
      {children}
    </svg>
  ),
  G: (props) => <g {...props} />,
  Rect: ({ x, y, width, height, fill, stroke, strokeWidth }) => (
    <rect x={x} y={y} width={Math.max(0, width)} height={height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),
  Line: ({ x1, y1, x2, y2, stroke, strokeWidth = 0.6, dash }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
  ),
  Circle: ({ cx, cy, r, fill, stroke, strokeWidth }) => <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />,
  Text: ({ x, y, size = FONT, bold = false, anchor = 'start', fill = C.ink, children }) => (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight={bold ? 'bold' : 'normal'}
      textAnchor={anchor}
      fill={fill}
    >
      {children}
    </text>
  ),
};

// ----------------------------------------------------------------------------
// Légende (sur une ou plusieurs lignes) — renvoie les éléments et la hauteur.
// ----------------------------------------------------------------------------
function legendItems(P, items, width, y0, shapes = null) {
  const out = [];
  let x = 0;
  let y = y0;
  items.forEach((it, i) => {
    const w = 10 + textWidth(it.label, SMALL) + 12;
    if (x + w > width && x > 0) { x = 0; y += 11; }
    const shape = shapes?.[i];
    if (shape === 'circle') out.push(<P.Circle key={`c${i}`} cx={x + 3.5} cy={y - 2.5} r={3.2} fill={it.color} />);
    else out.push(<P.Rect key={`r${i}`} x={x} y={y - 6} width={7} height={7} fill={it.color} stroke={it.color === C.missing ? C.muted : undefined} strokeWidth={0.4} />);
    out.push(<P.Text key={`t${i}`} x={x + 10} y={y} size={SMALL} fill={C.ink}>{it.label}</P.Text>);
    x += w;
  });
  return { elements: out, height: y - y0 + 12 };
}

// ----------------------------------------------------------------------------
// Barres empilées horizontales (une ligne = un groupe, segments = effectifs)
// rows : [{ heading } | { label, total, right, segments:[{label,value,color}] }]
// ----------------------------------------------------------------------------
function StackedBars({ P, chart, width }) {
  const ROW = 17;
  const HEAD = 13;
  const BAR = 11;
  const labelW = Math.min(150, Math.max(...chart.rows.filter((r) => !r.heading).map((r) => textWidth(r.label))) + 10);
  const rightW = Math.max(...chart.rows.filter((r) => !r.heading).map((r) => textWidth(r.right || ''))) + 10;
  const barX = labelW;
  const barW = width - labelW - rightW;

  const legend = legendItems(P, chart.legend || [], width, 8);
  const els = [...legend.elements];
  let y = legend.height + 4;

  chart.rows.forEach((row, ri) => {
    if (row.heading) {
      els.push(<P.Text key={`h${ri}`} x={0} y={y + 9} bold fill={C.ink}>{row.heading}</P.Text>);
      y += HEAD;
      return;
    }
    const top = y + (ROW - BAR) / 2;
    els.push(<P.Text key={`l${ri}`} x={0} y={top + 8} fill={C.ink}>{row.label}</P.Text>);
    // Fond de la barre = échelle complète (le total du groupe).
    els.push(<P.Rect key={`bg${ri}`} x={barX} y={top} width={barW} height={BAR} fill="#f9fafb" />);
    let x = barX;
    row.segments.forEach((s, si) => {
      const w = (s.value / row.total) * barW;
      const gap = si < row.segments.length - 1 ? 1.5 : 0;
      els.push(<P.Rect key={`s${ri}-${si}`} x={x} y={top} width={w - gap} height={BAR} fill={s.color} />);
      // Étiquette : « libellé effectif » si la place le permet, sinon l'effectif seul.
      const full = chart.scale ? String(s.value) : `${s.label} ${s.value}`;
      const text = textWidth(full) + 6 <= w ? full : textWidth(String(s.value)) + 3 <= w ? String(s.value) : null;
      if (text) {
        els.push(<P.Text key={`v${ri}-${si}`} x={x + (w - gap) / 2} y={top + 8} anchor="middle" fill={inkOn(s.color)}>{text}</P.Text>);
      }
      x += w;
    });
    if (row.right) els.push(<P.Text key={`r${ri}`} x={width} y={top + 8} anchor="end" fill={C.muted}>{row.right}</P.Text>);
    y += ROW;
  });

  return <P.Svg width={width} height={y + 2}>{els}</P.Svg>;
}

// ----------------------------------------------------------------------------
// Barres horizontales simples (un ou plusieurs panneaux empilés verticalement)
// panels : [{ title?, rows:[{label, value, total}], max, color }]
// ----------------------------------------------------------------------------
function HorizontalBars({ P, chart, width }) {
  const ROW = 15;
  const BAR = 9;
  const all = chart.panels.flatMap((p) => p.rows);
  const labelW = Math.min(170, Math.max(...all.map((r) => textWidth(r.label))) + 10);
  const valueW = 34;
  const barW = width - labelW - valueW;
  const els = [];
  let y = 0;

  chart.panels.forEach((panel, pi) => {
    if (panel.title) {
      els.push(<P.Text key={`t${pi}`} x={0} y={y + 9} bold>{panel.title}</P.Text>);
      y += 14;
    }
    const y0 = y;
    panel.rows.forEach((row, ri) => {
      const top = y + (ROW - BAR) / 2;
      const w = (row.value / panel.max) * barW;
      els.push(<P.Text key={`l${pi}-${ri}`} x={0} y={top + 7} fill={C.ink}>{row.label}</P.Text>);
      // Piste grise = échelle complète (0 à n).
      els.push(<P.Rect key={`bg${pi}-${ri}`} x={labelW} y={top} width={barW} height={BAR} fill="#f3f4f6" />);
      if (row.value > 0) els.push(<P.Rect key={`b${pi}-${ri}`} x={labelW} y={top} width={w} height={BAR} fill={panel.color} />);
      els.push(<P.Text key={`v${pi}-${ri}`} x={labelW + barW + 4} y={top + 7} fill={C.ink}>{`${row.value}/${row.total}`}</P.Text>);
      y += ROW;
    });
    // Ligne de base de l'axe.
    els.push(<P.Line key={`ax${pi}`} x1={labelW} y1={y0} x2={labelW} y2={y} stroke={C.muted} strokeWidth={0.6} />);
    y += pi < chart.panels.length - 1 ? 8 : 0;
  });

  return <P.Svg width={width} height={y + 2}>{els}</P.Svg>;
}

// ----------------------------------------------------------------------------
// Histogramme des notes 0 à 10 : deux panneaux côte à côte, même échelle.
// ----------------------------------------------------------------------------
function Histogram({ P, chart, width }) {
  const GAP = 24;
  const panelW = (width - GAP) / chart.panels.length;
  const H = 96; // hauteur de la zone de tracé
  const TOP = 26; // titre + libellés des zones
  // Une unité de marge en haut : l'effectif de la plus haute barre reste lisible.
  const yTop = Math.max(...chart.panels.flatMap((p) => p.counts)) + 1;
  const els = [];

  // Zones du NPS : 0-6 détracteurs, 7-8 passifs, 9-10 promoteurs.
  const zones = [
    { from: 0, to: 6, label: 'Détracteurs', fill: '#fdf2f1' },
    { from: 7, to: 8, label: 'Passifs', fill: '#fbf6e6' },
    { from: 9, to: 10, label: 'Promoteurs', fill: '#eef6f1' },
  ];

  chart.panels.forEach((panel, pi) => {
    const x0 = pi * (panelW + GAP);
    const axisX = x0 + 14;
    const plotW = panelW - 14;
    const colW = plotW / 11;
    const base = TOP + H;
    els.push(<P.Text key={`t${pi}`} x={x0} y={9} bold>{panel.title}</P.Text>);
    zones.forEach((z, zi) => {
      els.push(<P.Rect key={`z${pi}-${zi}`} x={axisX + z.from * colW} y={TOP - 4} width={(z.to - z.from + 1) * colW} height={H + 4} fill={z.fill} />);
      els.push(<P.Text key={`zl${pi}-${zi}`} x={axisX + ((z.from + z.to + 1) / 2) * colW} y={TOP - 7} size={SMALL - 0.6} anchor="middle" fill={C.muted}>{z.label}</P.Text>);
    });
    // Graduations entières de l'axe vertical (effectifs).
    for (let v = 0; v < yTop; v += yTop > 7 ? 2 : 1) {
      const yy = base - (v / yTop) * H;
      els.push(<P.Line key={`g${pi}-${v}`} x1={axisX} y1={yy} x2={axisX + plotW} y2={yy} stroke={C.line} strokeWidth={0.4} />);
      els.push(<P.Text key={`gy${pi}-${v}`} x={axisX - 3} y={yy + 2.5} size={SMALL} anchor="end" fill={C.muted}>{v}</P.Text>);
    }
    panel.counts.forEach((c, score) => {
      const cx = axisX + score * colW;
      if (c > 0) {
        const h = (c / yTop) * H;
        els.push(<P.Rect key={`b${pi}-${score}`} x={cx + 2} y={base - h} width={colW - 4} height={h} fill={panel.color} />);
        els.push(<P.Text key={`v${pi}-${score}`} x={cx + colW / 2} y={base - h - 2.5} anchor="middle" bold>{c}</P.Text>);
      }
      els.push(<P.Text key={`x${pi}-${score}`} x={cx + colW / 2} y={base + 9} anchor="middle" fill={C.ink}>{score}</P.Text>);
    });
    els.push(<P.Line key={`base${pi}`} x1={axisX} y1={base} x2={axisX + plotW} y2={base} stroke={C.muted} strokeWidth={0.6} />);
    els.push(<P.Text key={`xl${pi}`} x={axisX + plotW / 2} y={base + 19} size={SMALL} anchor="middle" fill={C.muted}>Note de recommandation (0 à 10)</P.Text>);
  });

  return <P.Svg width={width} height={TOP + H + 24}>{els}</P.Svg>;
}

// ----------------------------------------------------------------------------
// Regards croisés : une ligne par binôme, note du mentor (carré) et du
// mentoré (rond) sur l'échelle complète de chaque question.
// ----------------------------------------------------------------------------
function Dumbbell({ P, chart, width }) {
  const ROW = 24;
  const labelW = 150;
  const GAP = 18;
  const panelW = (width - labelW - GAP * (chart.panels.length - 1)) / chart.panels.length;
  const legend = legendItems(P, [{ label: 'Mentor', color: C.mentor }, { label: 'Mentoré', color: C.mentore }], width, 8, ['square', 'circle']);
  const els = [...legend.elements];
  const top = legend.height + 16;

  chart.panels.forEach((panel, pi) => {
    const x0 = labelW + pi * (panelW + GAP);
    const sx = (v) => x0 + 6 + ((v - panel.min) / (panel.max - panel.min)) * (panelW - 12);
    els.push(<P.Text key={`pt${pi}`} x={x0 + panelW / 2} y={top - 6} bold anchor="middle">{panel.title}</P.Text>);
    panel.ticks.forEach((t) => {
      els.push(<P.Line key={`tk${pi}-${t}`} x1={sx(t)} y1={top} x2={sx(t)} y2={top + chart.rows.length * ROW} stroke={C.line} strokeWidth={0.4} />);
      els.push(<P.Text key={`tl${pi}-${t}`} x={sx(t)} y={top + chart.rows.length * ROW + 9} size={SMALL} anchor="middle" fill={C.muted}>{t}</P.Text>);
    });
    chart.rows.forEach((row, ri) => {
      const [a, b] = row[panel.key];
      const cy = top + ri * ROW + ROW / 2;
      if (a !== null && a !== undefined && b !== null && b !== undefined) {
        els.push(<P.Line key={`ln${pi}-${ri}`} x1={sx(a)} y1={cy} x2={sx(b)} y2={cy} stroke={C.muted} strokeWidth={1} />);
      }
      // Valeur du mentor au-dessus de son carré, du mentoré sous son rond.
      const same = a === b;
      if (a !== null && a !== undefined) {
        // Notes identiques : le carré du mentor devient un contour autour du rond.
        els.push(same
          ? <P.Rect key={`a${pi}-${ri}`} x={sx(a) - 5.5} y={cy - 5.5} width={11} height={11} fill={C.white} stroke={C.mentor} strokeWidth={1.4} />
          : <P.Rect key={`a${pi}-${ri}`} x={sx(a) - 3.5} y={cy - 3.5} width={7} height={7} fill={C.mentor} />);
        els.push(<P.Text key={`av${pi}-${ri}`} x={sx(a)} y={cy - (same ? 7.5 : 5.5)} size={SMALL} anchor="middle" fill={C.ink}>{a}</P.Text>);
      }
      if (b !== null && b !== undefined) {
        els.push(<P.Circle key={`b${pi}-${ri}`} cx={sx(b)} cy={cy} r={3.6} fill={C.mentore} stroke={C.white} strokeWidth={0.8} />);
        els.push(<P.Text key={`bv${pi}-${ri}`} x={sx(b)} y={cy + (same ? 12.5 : 10.5)} size={SMALL} anchor="middle" fill={C.ink}>{b}</P.Text>);
      }
    });
  });

  chart.rows.forEach((row, ri) => {
    const cy = top + ri * ROW + ROW / 2;
    els.push(<P.Text key={`rl${ri}`} x={0} y={cy - 1} size={SMALL}>{fit(row.label, labelW - 6)}</P.Text>);
    els.push(<P.Text key={`rs${ri}`} x={0} y={cy + 7} size={SMALL} fill={C.muted}>{fit(row.sublabel, labelW - 6)}</P.Text>);
    if (ri > 0) els.push(<P.Line key={`sep${ri}`} x1={0} y1={top + ri * ROW} x2={width} y2={top + ri * ROW} stroke={C.line} strokeWidth={0.3} />);
  });

  return <P.Svg width={width} height={top + chart.rows.length * ROW + 14}>{els}</P.Svg>;
}

// ----------------------------------------------------------------------------
// Point d'entrée : dessine le graphique d'une figure avec les éléments P.
// ----------------------------------------------------------------------------
export default function ReportChart({ figure, P = DOM_PRIMITIVES, width = CHART_WIDTH }) {
  const { chart } = figure;
  switch (chart.type) {
    case 'stacked': return <StackedBars P={P} chart={chart} width={width} />;
    case 'hbar': return <HorizontalBars P={P} chart={chart} width={width} />;
    case 'histogram': return <Histogram P={P} chart={chart} width={width} />;
    case 'dumbbell': return <Dumbbell P={P} chart={chart} width={width} />;
    default: return null;
  }
}
