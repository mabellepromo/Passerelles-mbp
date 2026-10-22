import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Export PDF du rapport validé — agrégats uniquement, pas de tableau
// nominatif de binômes (conformément au choix retenu : la version imprimée
// transmise au bureau MBP reste sur des données agrégées).

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 },
  logo: { width: 32, height: 32, marginRight: 10 },
  title: { fontSize: 16, fontWeight: 700, color: '#1a7a45' },
  subtitle: { fontSize: 9, color: '#6b7280' },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#111827' },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  kpiBox: { flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 },
  kpiLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase' },
  kpiValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  paragraph: { fontSize: 10, lineHeight: 1.5, color: '#374151' },
  item: { marginBottom: 6 },
  itemTitle: { fontSize: 10, fontWeight: 700 },
  itemBody: { fontSize: 9, color: '#6b7280' },
  quote: { fontSize: 9, fontStyle: 'italic', color: '#374151', marginBottom: 4, borderLeft: '2px solid #d4aa35', paddingLeft: 6 },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
  pageNumber: { position: 'absolute', bottom: 20, right: 36, fontSize: 8, color: '#9ca3af' },
  disclaimer: { fontSize: 8, color: '#92400e', backgroundColor: '#fffbeb', padding: 6, borderRadius: 4, marginBottom: 10 },
});

function Kpi({ label, value }) {
  return (
    <View style={styles.kpiBox}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

export default function ReviewReportPdf({ report, summaryOverride }) {
  const metrics = report?.metrics || {};
  const analysis = report?.ai_analysis || {};
  const mentorStats = (metrics.response_rate || []).find((r) => r.role === 'mentor');
  const mentoreStats = (metrics.response_rate || []).find((r) => r.role === 'mentore');
  const avgNps = (metrics.nps || []).length
    ? ((metrics.nps || []).reduce((sum, n) => sum + (n.avg_nps || 0), 0) / metrics.nps.length).toFixed(1)
    : '—';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rapport de bilan — PASSERELLES</Text>
            <Text style={styles.subtitle}>
              Ma Belle Promo · {report.period_label === 'toutes_cohortes' ? 'Toutes cohortes' : `Cohorte ${report.period_label}`} · Généré le {new Date(report.generated_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text>Analyse générée automatiquement à partir des réponses au bilan, relue et validée par la coordination avant diffusion.</Text>
        </View>

        <View style={styles.kpiRow}>
          <Kpi label="Réponse mentors" value={`${mentorStats?.response_rate_pct ?? 0}%`} />
          <Kpi label="Réponse mentorés" value={`${mentoreStats?.response_rate_pct ?? 0}%`} />
          <Kpi label="NPS moyen" value={avgNps} />
          <Kpi label="Réponses totales" value={metrics.total_responses ?? 0} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synthèse exécutive</Text>
          <Text style={styles.paragraph}>{summaryOverride ?? analysis.executive_summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points forts</Text>
          {(analysis.strengths || []).map((s, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemTitle}>{s.title}</Text>
              <Text style={styles.itemBody}>{s.evidence}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points d'amélioration</Text>
          {(analysis.improvements || []).map((imp, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemTitle}>{imp.title} ({imp.priority})</Text>
              <Text style={styles.itemBody}>{imp.evidence}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Citations marquantes</Text>
          {(analysis.notable_quotes || []).length === 0 ? (
            <Text style={styles.itemBody}>Aucune citation autorisée pour cette période.</Text>
          ) : (
            (analysis.notable_quotes || []).map((q, i) => (
              <Text key={i} style={styles.quote}>« {q.text} » — {q.role === 'mentor' ? 'Mentor' : 'Mentoré'}</Text>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommandations</Text>
          {(analysis.recommendations || []).map((r, i) => (
            <Text key={i} style={styles.paragraph}>• {r}</Text>
          ))}
        </View>

        <Text style={styles.footer}>Document confidentiel — usage interne Ma Belle Promo</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}
