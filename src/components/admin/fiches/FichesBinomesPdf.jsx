// Fiches bilan par binôme — document PDF (@react-pdf/renderer), une fiche par page.
//   variant 'internal' : bureau seulement (nominatif, réponses du sondage).
//   variant 'closing'  : fiche remise au binôme (aucune note ni réponse).
// Données : buildFiches (src/lib/ficheBinome.js), comme à l'écran.
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { fillMessage, CLOSING_INTRO } from '@/lib/ficheBinome';
import { formatDateFr, PROGRAM } from '@/lib/reportContent';

Font.registerHyphenationCallback((word) => [word]);

const GREEN = '#1a7a45';
const DARK_GREEN = '#0f5530';
const GOLD = '#d4aa35';
const INK = '#111827';
const BODY = '#374151';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';

const s = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 42, fontSize: 9.5, fontFamily: 'Helvetica', color: INK },
  header: { position: 'absolute', top: 22, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 5 },
  footerLeft: { position: 'absolute', bottom: 22, left: 42, fontSize: 7.5, color: MUTED },
  footerRight: { position: 'absolute', bottom: 22, left: 42, right: 42, textAlign: 'right', fontSize: 7.5, color: MUTED },
  h1: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 4 },
  h2: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK_GREEN, marginTop: 10, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: GOLD },
  p: { color: BODY, marginBottom: 4 },
  muted: { color: MUTED, fontSize: 8.5 },
  badge: { alignSelf: 'flex-start', fontSize: 8, color: DARK_GREEN, backgroundColor: '#ecfdf3', paddingVertical: 2, paddingHorizontal: 6, marginBottom: 6 },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE },
  th: { fontSize: 8, color: MUTED, padding: 3, backgroundColor: '#f9fafb' },
  td: { fontSize: 8.5, color: BODY, padding: 3 },
  bullet: { flexDirection: 'row', marginBottom: 2 },
  quote: { borderLeftWidth: 2, borderLeftColor: GOLD, paddingLeft: 6, marginBottom: 4 },
  // Fiche de clôture
  closingTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK_GREEN, marginTop: 14 },
  closingRule: { height: 3, width: 60, backgroundColor: GOLD, marginVertical: 12 },
  closingName: { fontSize: 11, color: INK, marginBottom: 3 },
  closingText: { fontSize: 10.5, color: BODY, marginBottom: 9, lineHeight: 1.45 },
});

function Bullets({ items }) {
  return items.map((t, i) => (
    <View key={i} style={s.bullet} wrap={false}>
      <Text style={{ width: 10, color: GREEN }}>•</Text>
      <Text style={{ flex: 1, color: BODY }}>{t}</Text>
    </View>
  ));
}

function InternalFiche({ f }) {
  const side = (label, x) => (x.responded ? `${label} : a répondu le ${x.submitted_at}` : `${label} : pas de réponse au sondage`);
  const list = (arr) => (arr.length ? arr.join(', ') : 'aucun apport coché');
  return (
    <>
      <Text style={s.h1}>{f.mentor_name} / {f.mentore_name}</Text>
      <Text style={s.badge}>{f.statusLabel}</Text>
      {f.constat ? <Text style={s.p}>Constat : {f.constat}</Text> : null}
      <Text style={s.muted}>{side('Mentor', f.mentor)} · {side('Mentoré', f.mentore)}</Text>

      <Text style={s.h2}>Notes données au sondage</Text>
      <View style={{ borderWidth: 1, borderColor: LINE }}>
        <View style={[s.tr, { borderTopWidth: 0 }]}>
          <Text style={[s.th, { width: '60%' }]}>Question</Text>
          <Text style={[s.th, { width: '20%' }]}>Mentor</Text>
          <Text style={[s.th, { width: '20%' }]}>Mentoré</Text>
        </View>
        {f.scoreRows.map((r) => (
          <View key={r.label} style={s.tr} wrap={false}>
            <Text style={[s.td, { width: '60%' }]}>{r.label}</Text>
            <Text style={[s.td, { width: '20%' }]}>{r.mentor}</Text>
            <Text style={[s.td, { width: '20%' }]}>{r.mentore}</Text>
          </View>
        ))}
      </View>

      <Text style={s.h2}>Apports et suite</Text>
      <Text style={s.p}>Apports cités par le mentor : {f.mentor.responded ? list(f.mentor.contributions) : 'pas de réponse'}</Text>
      <Text style={s.p}>Apports cités par le mentoré : {f.mentore.responded ? list(f.mentore.contributions) : 'pas de réponse'}</Text>
      <Text style={s.p}>Intérêt pour une nouvelle expérience (question hypothétique) : mentor, {f.mentor.continuation || 'pas de réponse'} ; mentoré, {f.mentore.continuation || 'pas de réponse'}.</Text>
      <Text style={s.p}>Citation : mentor, {f.mentor.consent || 'pas de réponse'} ; mentoré, {f.mentore.consent || 'pas de réponse'}.</Text>

      {(f.mentor.open.length > 0 || f.mentore.open.length > 0) && (
        <>
          <Text style={s.h2}>Réponses libres (usage interne)</Text>
          {[['Mentor', f.mentor], ['Mentoré', f.mentore]].map(([label, x]) => x.open.map((o) => (
            <View key={`${label}-${o.key}`} style={s.quote}>
              <Text style={s.muted}>{label} — {o.label}</Text>
              <Text style={{ color: BODY, fontFamily: 'Helvetica-Oblique' }}>« {o.text} »</Text>
            </View>
          )))}
        </>
      )}

      <Text style={s.h2}>Points pour la clôture</Text>
      <Bullets items={f.points} />
    </>
  );
}

function ClosingFiche({ f, logoSrc, closingDate }) {
  const paragraphs = fillMessage(f.message, f).split(/\n\s*\n/).map((t) => t.replace(/\n/g, ' ').trim()).filter(Boolean);
  return (
    <>
      {logoSrc ? <Image src={logoSrc} style={{ width: 54, height: 54 }} /> : null}
      <Text style={{ fontSize: 9, color: GOLD, letterSpacing: 1.5, marginTop: 10 }}>{PROGRAM.name.toUpperCase()} — {PROGRAM.cohort.toUpperCase()}</Text>
      <Text style={s.closingTitle}>Fiche de clôture du binôme</Text>
      <View style={s.closingRule} />
      <Text style={s.closingName}>Mentor : {f.mentor_name}</Text>
      <Text style={s.closingName}>Mentoré : {f.mentore_name}</Text>
      <Text style={[s.muted, { marginTop: 4, marginBottom: 18 }]}>{CLOSING_INTRO} — {PROGRAM.cohort.toLowerCase()}, lancée le {PROGRAM.startDateLabel}.</Text>
      {paragraphs.map((t, i) => <Text key={i} style={s.closingText}>{t}</Text>)}
      <Text style={[s.closingText, { marginTop: 10 }]}>Le bureau de Ma Belle Promo</Text>
      <Text style={s.muted}>{closingDate}</Text>
    </>
  );
}

export default function FichesBinomesPdf({ fiches, variant = 'internal', logoSrc = '/logo-mbp.png', closingDate = formatDateFr(new Date().toISOString()) }) {
  const internal = variant === 'internal';
  return (
    <Document title={internal ? 'Fiches bilan des binômes — usage interne' : 'Fiches de clôture des binômes'} author="Ma Belle Promo" language="fr">
      {fiches.map((f) => (
        <Page key={f.binome_id} size="A4" style={s.page}>
          <View style={s.header} fixed>
            <Text>{internal ? `Fiches bilan des binômes — ${PROGRAM.name} — ${PROGRAM.cohort}` : `${PROGRAM.name} — ${PROGRAM.cohort}`}</Text>
            <Text>{internal ? 'Version interne' : 'Ma Belle Promo'}</Text>
          </View>
          <Text style={s.footerLeft} fixed>
            {internal ? 'Confidentiel — usage interne Ma Belle Promo (document nominatif)' : 'Association Ma Belle Promo — programme PASSERELLES'}
          </Text>
          {internal && <Text style={s.footerRight} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />}
          {internal ? <InternalFiche f={f} /> : <ClosingFiche f={f} logoSrc={logoSrc} closingDate={closingDate} />}
        </Page>
      ))}
    </Document>
  );
}
