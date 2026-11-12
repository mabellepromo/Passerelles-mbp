// src/components/charts/pdfPrimitives.jsx
// Éléments graphiques de @react-pdf/renderer, avec la même interface que
// DOM_PRIMITIVES (ReportChart.jsx) : le même dessin produit donc un SVG
// vectoriel dans le PDF, identique à celui de l'écran.
import React from 'react';
import { Svg, G, Rect, Line, Circle, Text } from '@react-pdf/renderer';

export const PDF_PRIMITIVES = {
  Svg: ({ width, height, children }) => (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{children}</Svg>
  ),
  G: (props) => <G {...props} />,
  Rect: ({ x, y, width, height, fill, stroke, strokeWidth }) => (
    <Rect x={x} y={y} width={Math.max(0, width)} height={height} fill={fill} stroke={stroke} strokeWidth={stroke ? strokeWidth : undefined} />
  ),
  Line: ({ x1, y1, x2, y2, stroke, strokeWidth = 0.6, dash }) => (
    <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
  ),
  Circle: ({ cx, cy, r, fill, stroke, strokeWidth }) => (
    <Circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={stroke ? strokeWidth : undefined} />
  ),
  Text: ({ x, y, size = 7.5, bold = false, anchor = 'start', fill = '#111827', children }) => (
    <Text
      x={x}
      y={y}
      fill={fill}
      textAnchor={anchor}
      style={{ fontSize: size, fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica' }}
    >
      {String(children)}
    </Text>
  ),
};
