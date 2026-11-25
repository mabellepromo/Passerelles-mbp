// Fiches d'expertise par binôme — document PDF (@react-pdf/renderer).
// Dossier complet : page de récapitulatif et synthèse, puis une fiche par page.
// Une seule fiche : sans récapitulatif (synthese et counts à null).
// Données : buildExpertise (src/lib/expertiseBinome.js), comme à l'écran.
// Document interne au bureau, nominatif.
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { citationText, questionLabel, summaryLine, REMARQUE_LABEL, ROLE } from '@/lib/expertiseBinome';
import { formatDateFr, PROGRAM } from '@/lib/reportContent';

Font.registerHyphenationCallback((word) => [word]);

const GREEN = '#1a7a45';
const DARK_GREEN = '#0f5530';
const GOLD = '#d4aa35';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const RED = '#b91c1c';
const TONE = {
  emerald: { color: '#065f46', backgroundColor: '#ecfdf5' },
  amber: { color: '#92400e', backgroundColor: '#fffbeb' },
  red: { color: '#991b1b', backgroundColor: '#fef2f2' },
  gray: { color: BODY, backgroundColor: '#f9fafb' },
};

const s = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 42, fontSize: 9.5, fontFamily: 'Helvetica', color: INK },
  header: { position: 'absolute', top: 22, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 5 },
  footerLeft: { position: 'absolute', bottom: 22, left: 42, fontSize: 7.5, color: MUTED },
  footerRight: { position: 'absolute', bottom: 22, left: 42, right: 42, textAlign: 'right', fontSize: 7.5, color: MUTED },
  h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 4 },
  h2: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK_GREEN, marginTop: 10, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: GOLD },
  p: { color: BODY, marginBottom: 4, lineHeight: 1.35 },
  muted: { color: MUTED, fontSize: 8.5 },
  badge: { alignSelf: 'flex-start', fontSize: 8.5, fontFamily: 'Helvetica-Bold', paddingVertical: 2, paddingHorizontal: 6, marginBottom: 4 },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE },
  th: { fontSize: 8, color: MUTED, padding: 3, backgroundColor: '#f9fafb' },
  td: { fontSize: 8.5, color: BODY, padding: 3 },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  box: { padding: 8, marginTop: 10 },
});

function Bullets({ items }) {
  return items.map((t, i) => (
    <View key={i} style={s.bullet} wrap={false}>
      <Text style={{ width: 10, color: GREEN }}>•</Text>
      <Text style={{ flex: 1, color: BODY, lineHeight: 1.35 }}>{t}</Text>
    </View>
  ));
}

function Summary({ fiches, synthese, counts }) {
  return (
    <>
      <Text style={s.h1}>Fiches d'expertise des binômes — {PROGRAM.cohort}</Text>
      <Text style={s.muted}>{PROGRAM.name}, lancée le {PROGRAM.startDateLabel}. Source : sondage de bilan nominatif. Aucune donnée sur le nombre ni la régularité des séances.</Text>
      <Text style={s.h2}>Récapitulatif : {summaryLine(counts)}</Text>
      <View style={{ borderWidth: 1, borderColor: LINE }}>
        <View style={[s.tr, { borderTopWidth: 0 }]}>
          <Text style={[s.th, { width: '52%' }]}>Binôme (mentor / mentoré)</Text>
          <Text style={[s.th, { width: '16%' }]}>Réponses</Text>
          <Text style={[s.th, { width: '18%' }]}>Sentence</Text>
          <Text style={[s.th, { width: '14%' }]}>Confiance</Text>
        </View>
        {fiches.map((f) => (
          <View key={f.binome_id} style={s.tr} wrap={false}>
            <Text style={[s.td, { width: '52%' }]}>{f.mentor_name} / {f.mentore_name}</Text>
            <Text style={[s.td, { width: '16%' }]}>{f.reponses}</Text>
            <Text style={[s.td, { width: '18%', fontFamily: 'Helvetica-Bold', color: TONE[f.tone].color }]}>{f.sentenceLabel}</Text>
            <Text style={[s.td, { width: '14%' }]}>{f.confianceLabel}</Text>
          </View>
        ))}
      </View>
      <Text style={[s.muted, { marginTop: 4 }]}>Tous les binômes sont clos.</Text>
      {synthese?.length > 0 && (
        <>
          <Text style={s.h2}>Synthèse transversale</Text>
          <Bullets items={synthese} />
        </>
      )}
    </>
  );
}

function Fiche({ f }) {
  if (f.missing) {
    return (
      <>
        <Text style={s.h1}>{f.mentor_name} / {f.mentore_name}</Text>
        <Text style={[s.p, { color: RED }]}>Fiche non rédigée : aucune expertise enregistrée pour ce binôme.</Text>
      </>
    );
  }
  return (
    <>
      <Text style={s.h1}>{f.mentor_name} / {f.mentore_name}</Text>
      <Text style={[s.badge, TONE[f.tone]]}>{f.sentenceLabel} · confiance {f.confianceLabel}</Text>
      <Text style={s.muted}>Réponses au sondage : {f.reponses}.{f.absents.length ? ` ${f.absents.join(' ')}` : ''}</Text>

      <Text style={s.h2}>Constat</Text>
      <Text style={[s.p, { fontFamily: 'Helvetica-Bold', color: INK }]}>{f.constat}</Text>

      <Text style={s.h2}>Preuves (réponses au sondage)</Text>
      {f.preuves.map((p, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={{ width: 10, color: p.found ? GREEN : RED }}>{p.found ? '•' : '!'}</Text>
          <Text style={{ flex: 1, color: BODY }}>
            <Text style={{ color: MUTED }}>{ROLE[p.role]} — {questionLabel(p.question)} : </Text>
            <Text style={{ fontFamily: 'Helvetica-Oblique' }}>« {citationText(p)} »</Text>
            {p.sensible ? <Text style={{ color: RED }}> (strictement interne)</Text> : null}
            {!p.found ? <Text style={{ color: RED }}> (citation introuvable)</Text> : null}
          </Text>
        </View>
      ))}

      {f.remarques.length > 0 && (
        <>
          <Text style={s.h2}>Divergences et limites</Text>
          {f.remarques.map((r, i) => (
            <Text key={i} style={s.p}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{REMARQUE_LABEL[r.type] || r.type} : </Text>{r.texte}</Text>
          ))}
        </>
      )}

      <View style={[s.box, { backgroundColor: TONE[f.tone].backgroundColor }]} wrap={false}>
        <Text style={{ fontFamily: 'Helvetica-Bold', color: TONE[f.tone].color, marginBottom: 3 }}>Sentence : {f.sentenceLabel}. Binôme clos.</Text>
        <Text style={{ color: BODY, lineHeight: 1.35 }}>{f.motif}</Text>
      </View>
    </>
  );
}

function Frame({ children }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.header} fixed>
        <Text>Fiches d'expertise des binômes — {PROGRAM.name} — {PROGRAM.cohort}</Text>
        <Text>Édité le {formatDateFr(new Date().toISOString())}</Text>
      </View>
      <Text style={s.footerLeft} fixed>Confidentiel — usage interne du bureau de Ma Belle Promo (document nominatif)</Text>
      <Text style={s.footerRight} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      {children}
    </Page>
  );
}

export default function ExpertisePdf({ fiches, synthese = null, counts = null }) {
  return (
    <Document title="Fiches d'expertise des binômes — usage interne" author="Ma Belle Promo" language="fr">
      {counts && <Frame><Summary fiches={fiches} synthese={synthese} counts={counts} /></Frame>}
      {fiches.map((f) => <Frame key={f.binome_id}><Fiche f={f} /></Frame>)}
    </Document>
  );
}
