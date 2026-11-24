// Bilan de la cohorte 1 « version bureau » — document PDF (@react-pdf/renderer).
//
// Version INTERNE uniquement (nominative) : la version externe est suspendue
// tant que le bureau n'a pas statué sur l'avenir du programme.
//
// Textes : report.ai_analysis.sections (stockés en base, modifiables).
// Chiffres : repères {{cle}} remplacés par values.js ; tableaux et graphiques :
// repères {{bloc:nom}} construits par blocks.js. Mêmes données qu'à l'écran.
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { parseMarkup, splitBold } from '@/lib/bilanBureau/markup';
import { buildBureauValues, fillValues } from '@/lib/bilanBureau/values';
import { buildBlock, ANNEXE_HEAD, annexeCells } from '@/lib/bilanBureau/blocks';
import { formatDateFr } from '@/lib/reportContent';
import ReportChart, { CHART_WIDTH } from '@/components/charts/ReportChart';
import { PDF_PRIMITIVES } from '@/components/charts/pdfPrimitives';

const GREEN = '#1a7a45';
const DARK_GREEN = '#0f5530';
const GOLD = '#d4aa35';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';

// Pas de césure automatique : elle coupait les noms propres (« ATTIS-SO »).
Font.registerHyphenationCallback((word) => [word]);

const CONFIDENTIALITY ='Confidentiel — usage interne Ma Belle Promo (document nominatif)';

const styles = StyleSheet.create({
  // Pas d'interligne (lineHeight) sur la page : il empêche react-pdf de
  // dessiner le numéro de page (même règle que le brouillon n° 6).
  page: { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 42, fontSize: 9.5, fontFamily: 'Helvetica', color: INK },
  header: { position: 'absolute', top: 22, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 5 },
  footerLeft: { position: 'absolute', bottom: 22, left: 42, fontSize: 7.5, color: MUTED },
  footerRight: { position: 'absolute', bottom: 22, left: 42, right: 42, textAlign: 'right', fontSize: 7.5, color: MUTED },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK_GREEN, marginBottom: 6 },
  meta: { fontSize: 8.5, color: MUTED, marginBottom: 12 },
  h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN, marginTop: 14, marginBottom: 7, paddingBottom: 3, borderBottomWidth: 1.5, borderBottomColor: GOLD },
  h2: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: DARK_GREEN, marginTop: 8, marginBottom: 4 },
  p: { marginBottom: 6, color: BODY },
  note: { fontSize: 8.5, color: '#92400e', backgroundColor: '#fffbeb', padding: 6, marginBottom: 6 },
  item: { flexDirection: 'row', marginBottom: 3 },
  mark: { width: 14, color: GREEN },
  box: { width: 7, height: 7, borderWidth: 0.8, borderColor: MUTED, marginTop: 1.5, marginRight: 7 },
  itemText: { flex: 1, color: BODY },
  table: { borderWidth: 1, borderColor: LINE, marginBottom: 8 },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE },
  th: { fontSize: 8, color: MUTED, padding: 4, backgroundColor: '#f9fafb' },
  td: { fontSize: 8.5, color: BODY, padding: 4 },
  figure: { marginTop: 4, marginBottom: 8 },
  caption: { fontSize: 7, color: MUTED, marginTop: 3 },
});

// Texte avec **gras** et valeurs {{cle}} remplacées.
function Rich({ text, values, style }) {
  return (
    <Text style={style}>
      {splitBold(fillValues(text, values)).map((s, i) => (
        <Text key={i} style={s.bold ? { fontFamily: 'Helvetica-Bold', color: INK } : undefined}>{s.text}</Text>
      ))}
    </Text>
  );
}

// Tableau : largeurs proportionnelles (première colonne plus large si 2 colonnes).
function Table({ head, rows, values, widths }) {
  const n = head.length;
  const w = widths || (n === 2 ? ['55%', '45%'] : Array(n).fill(`${100 / n}%`));
  return (
    <View style={styles.table}>
      <View style={[styles.tr, { borderTopWidth: 0 }]} wrap={false}>
        {head.map((h, i) => <View key={i} style={{ width: w[i] }}><Rich text={h} values={values} style={styles.th} /></View>)}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.tr} wrap={false}>
          {r.map((c, j) => <View key={j} style={{ width: w[j] }}><Rich text={c} values={values} style={styles.td} /></View>)}
        </View>
      ))}
    </View>
  );
}

function Figure({ figure, title }) {
  return (
    <View style={styles.figure} wrap={false}>
      {title && <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{title}</Text>}
      {figure.subtitle && <Text style={{ fontSize: 7.5, color: MUTED, marginBottom: 4 }}>{figure.subtitle}</Text>}
      <ReportChart figure={figure} P={PDF_PRIMITIVES} width={CHART_WIDTH} />
      <Text style={styles.caption}>{figure.source}</Text>
      {figure.reading && <Text style={{ fontSize: 7.5, color: BODY, marginTop: 2, fontFamily: 'Helvetica-Oblique' }}>Lecture : {figure.reading}</Text>}
    </View>
  );
}

function Block({ name, report, values }) {
  const block = buildBlock(name, report);
  if (!block || block.kind === 'missing') return <Text style={styles.note}>Donnée non disponible.</Text>;
  if (block.kind === 'table') return <Table head={block.head} rows={block.rows} values={values} widths={block.narrow ? ['70%', '30%'] : undefined} />;
  if (block.kind === 'figure') return <Figure figure={block.figure} />;
  if (block.kind === 'annexe') {
    return <Table head={ANNEXE_HEAD} rows={block.rows.map(annexeCells)} values={{}} widths={['30%', '15%', '12%', '12%', '31%']} />;
  }
  if (block.kind === 'figures') return block.figures.map((f) => <Figure key={f.id} figure={f} title={`Figure ${f.number} — ${f.title}`} />);
  return null;
}

function Body({ body, report, values }) {
  return parseMarkup(body).map((b, i) => {
    switch (b.type) {
      case 'p': return <Rich key={i} text={b.text} values={values} style={styles.p} />;
      case 'h': return <Rich key={i} text={b.text} values={values} style={styles.h2} />;
      case 'note': return <Rich key={i} text={b.text} values={values} style={styles.note} />;
      case 'bullet':
      case 'numbered':
      case 'task':
        return (
          <View key={i} style={{ marginBottom: 5 }}>
            {b.items.map((t, j) => (
              <View key={j} style={styles.item} wrap={false}>
                {b.type === 'task'
                  ? <View style={styles.box} />
                  : <Text style={styles.mark}>{b.type === 'numbered' ? `${j + 1}.` : '•'}</Text>}
                <Rich text={t} values={values} style={styles.itemText} />
              </View>
            ))}
          </View>
        );
      case 'table': return <Table key={i} head={b.rows[0]} rows={b.rows.slice(1)} values={values} />;
      case 'block': return <Block key={i} name={b.name} report={report} values={values} />;
      default: return null;
    }
  });
}

export default function BureauReportPdf({ report }) {
  const a = report.ai_analysis;
  const values = buildBureauValues(report);
  const isDraft = report.status !== 'validated';
  return (
    <Document title={a.title} author="Ma Belle Promo" language="fr">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text>{a.title}</Text>
          <Text>{isDraft ? 'BROUILLON NON VALIDÉ' : 'Version interne'}</Text>
        </View>
        <Text style={styles.footerLeft} fixed>{CONFIDENTIALITY}</Text>
        <Text style={styles.footerRight} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />

        <Text style={styles.title}>{a.title}</Text>
        <Text style={styles.meta}>
          {formatDateFr(report.generated_at)} · Document interne{isDraft ? ' · brouillon' : ` · validé le ${formatDateFr(report.validated_at)}`}
        </Text>
        {a.sections.map((s) => (
          <View key={s.key} break={s.key === 'annexe_a'}>
            {s.title ? <Text style={styles.h1} minPresenceAhead={40}>{s.title}</Text> : null}
            <Body body={s.body} report={report} values={values} />
          </View>
        ))}
      </Page>
    </Document>
  );
}
