// Rapport de bilan PASSERELLES — document PDF (bibliothèque @react-pdf/renderer).
//
// Deux versions, choisies par la propriété `variant` :
//   'internal' : nominative, avec les binômes à surveiller (bureau MBP).
//   'external' : partenaires et bailleurs, SANS donnée nominative, à la seule
//                exception des verbatims dont l'auteur a accepté la citation.
//
// Les chiffres viennent de report.metrics (calculés en SQL) et les textes
// d'analyse de report.ai_analysis (IA, relus et validés). Aucun chiffre sur le
// nombre de séances n'apparaît dans ce document.
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import {
  PROGRAM, NOT_AVAILABLE, formatDateFr, share, num,
  buildPresentation, buildMethodology, buildKeyFigures, countVigilance,
  VIGILANCE_LABEL, VERBATIM_FIELD_LABEL, PAIR_STATUS_LABEL, countPairStatus,
} from '@/lib/reportContent';
import { INDICATOR_DEFINITIONS } from '@/lib/indicatorDefinitions';
import { mentorQuestions, mentoreQuestions, interpolateLabel } from '@/config/reviewQuestions';
import {
  QUESTION_LABELS, COMMON_QUESTIONS, MENTOR_ONLY_QUESTIONS, MENTORE_ONLY_QUESTIONS,
} from '@/lib/surveyLabels';

// Couleurs de Passerelles.
const GREEN = '#1a7a45';
const DARK_GREEN = '#0f5530';
const GOLD = '#d4aa35';
const PURPLE = '#7c3aed';
const INK = '#111827';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';
const NPS_COLORS = { promoters: '#059669', passives: '#d97706', detractors: '#dc2626' };

const PRIORITY_ORDER = { haute: 0, moyenne: 1, basse: 2 };
const CONTINUATION_LABELS = {
  yes_definitely: 'Oui, certainement',
  yes_probably: 'Oui, probablement',
  unsure: 'Incertain(e)',
  probably_not: 'Probablement pas',
  no: 'Non',
};

const styles = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 42, fontSize: 9.5, fontFamily: 'Helvetica', color: INK },
  // Pas d'interligne (lineHeight) sur la page : il empêche react-pdf de
  // dessiner le numéro de page. L'interligne par défaut est utilisé.
  // Page de garde
  cover: { padding: 0, fontFamily: 'Helvetica', color: '#ffffff', backgroundColor: DARK_GREEN },
  coverInner: { flex: 1, padding: 56, justifyContent: 'space-between' },
  coverLogo: { width: 64, height: 64 },
  coverKicker: { fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  coverTitle: { fontSize: 30, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  coverSubtitle: { fontSize: 13, color: '#d1fae5' },
  coverRule: { height: 3, width: 70, backgroundColor: GOLD, marginVertical: 18 },
  coverMeta: { fontSize: 10.5, color: '#d1fae5', marginBottom: 4 },
  coverBadge: { alignSelf: 'flex-start', fontSize: 9, color: DARK_GREEN, backgroundColor: GOLD, paddingVertical: 4, paddingHorizontal: 8, marginTop: 14 },
  // En-tête et pied de page
  header: { position: 'absolute', top: 22, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 5 },
  footerLeft: { position: 'absolute', bottom: 22, left: 42, fontSize: 7.5, color: MUTED },
  // AUCUN interligne (lineHeight) sur ce texte, ni hérité de la page : avec un
  // interligne, react-pdf ne dessine pas le numéro de page calculé.
  footerRight: { position: 'absolute', bottom: 22, left: 42, right: 42, textAlign: 'right', fontSize: 7.5, color: MUTED },
  // Titres et textes
  h1: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: GOLD },
  h2: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: DARK_GREEN, marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 5, color: '#374151' },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { width: 10, color: GREEN },
  bulletText: { flex: 1, color: '#374151' },
  source: { fontSize: 7, color: MUTED, marginTop: 3, marginBottom: 6 },
  note: { fontSize: 8, color: '#92400e', backgroundColor: '#fffbeb', padding: 6, marginVertical: 6 },
  section: { marginBottom: 14 },
  // Chiffres clés
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  kpiBox: { width: '33.33%', padding: 3 },
  kpiInner: { borderWidth: 1, borderColor: LINE, padding: 7, minHeight: 58 },
  kpiLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase' },
  kpiValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: INK, marginTop: 2 },
  kpiDetail: { fontSize: 7.5, color: MUTED, marginTop: 1 },
  // Tableaux
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 4, alignItems: 'center' },
  headRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: INK, paddingVertical: 4 },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MUTED, textTransform: 'uppercase' },
  td: { fontSize: 8.5, color: '#374151' },
  // Graphiques
  barTrack: { height: 7, backgroundColor: '#f3f4f6', flex: 1 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, fontSize: 8, color: '#374151' },
  legendSwatch: { width: 7, height: 7, marginRight: 4 },
  quote: { borderLeftWidth: 2, borderLeftColor: GOLD, paddingLeft: 8, marginBottom: 8 },
  quoteText: { fontFamily: 'Helvetica-Oblique', color: '#374151' },
  quoteBy: { fontSize: 8, color: MUTED, marginTop: 2 },
  item: { marginBottom: 7 },
  itemTitle: { fontFamily: 'Helvetica-Bold', color: INK },
});

// ----------------------------------------------------------------------------
// Petits composants
// ----------------------------------------------------------------------------

function Bullets({ items }) {
  return (items || []).map((text, i) => (
    <View key={i} style={styles.bullet} wrap={false}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  ));
}

function Source({ children }) {
  return <Text style={styles.source}>Source : {children}</Text>;
}

function Legend({ items }) {
  return (
    <View style={styles.legendRow}>
      {items.map((it) => (
        <View key={it.label} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: it.color }]} />
          <Text>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

// Barre NPS : trois segments proportionnels + effectifs écrits en toutes lettres.
function NpsChart({ title, promoters = 0, passives = 0, detractors = 0 }) {
  const total = promoters + passives + detractors;
  const parts = [
    { key: 'promoters', label: 'Promoteurs (9-10)', count: promoters },
    { key: 'passives', label: 'Passifs (7-8)', count: passives },
    { key: 'detractors', label: 'Détracteurs (0-6)', count: detractors },
  ];
  return (
    <View style={{ marginBottom: 8 }} wrap={false}>
      <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{title} — {total} réponse(s)</Text>
      {total > 0 ? (
        <View style={{ flexDirection: 'row', height: 12 }}>
          {parts.filter((p) => p.count > 0).map((p) => (
            <View key={p.key} style={{ flex: p.count, backgroundColor: NPS_COLORS[p.key], marginRight: 1.5 }} />
          ))}
        </View>
      ) : <Text style={styles.td}>{NOT_AVAILABLE}</Text>}
      <Legend items={parts.map((p) => ({ label: `${p.label} : ${share(p.count, total)}`, color: NPS_COLORS[p.key] }))} />
    </View>
  );
}

// Une ligne « question » avec la barre des mentors et celle des mentorés.
function LikertRow({ label, mentor, mentore, gap }) {
  const bar = (stat, color) => (stat ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1.5 }}>
      <View style={styles.barTrack}>
        <View style={{ height: 7, width: `${(stat.avg_value / 5) * 100}%`, backgroundColor: color }} />
      </View>
      <Text style={{ width: 62, fontSize: 8, textAlign: 'right' }}>{num(stat.avg_value, 2)} (n={stat.n})</Text>
    </View>
  ) : (
    <Text style={{ fontSize: 7.5, color: MUTED, marginBottom: 1.5 }}>question non posée à ce rôle</Text>
  ));
  return (
    <View style={styles.row} wrap={false}>
      <Text style={[styles.td, { width: '34%', paddingRight: 6 }]}>{label}</Text>
      <View style={{ width: '46%' }}>
        {bar(mentor, GREEN)}
        {bar(mentore, PURPLE)}
      </View>
      <Text style={[styles.td, { width: '20%', textAlign: 'right' }]}>
        {gap ? `${num(gap.avg_gap, 2)} (${gap.n_pairs} binômes)` : '—'}
      </Text>
    </View>
  );
}

// Tableau « réponse / mentors / mentorés » pour une question à choix.
function DistributionTable({ rows, options, labels = {} }) {
  const count = (role, option) => (rows || []).find((r) => r.role === role && (r.bucket ?? r.option) === option)?.n ?? 0;
  return (
    <View wrap={false}>
      <View style={styles.headRow}>
        <Text style={[styles.th, { width: '60%' }]}>Réponse</Text>
        <Text style={[styles.th, { width: '20%', textAlign: 'right' }]}>Mentors</Text>
        <Text style={[styles.th, { width: '20%', textAlign: 'right' }]}>Mentorés</Text>
      </View>
      {options.map((option) => (
        <View key={option} style={styles.row}>
          <Text style={[styles.td, { width: '60%' }]}>{labels[option] || option}</Text>
          <Text style={[styles.td, { width: '20%', textAlign: 'right' }]}>{count('mentor', option)}</Text>
          <Text style={[styles.td, { width: '20%', textAlign: 'right' }]}>{count('mentore', option)}</Text>
        </View>
      ))}
    </View>
  );
}

function PageFrame({ variant, isDraft }) {
  const confidentiality = variant === 'internal'
    ? 'Confidentiel — usage interne Ma Belle Promo (document nominatif)'
    : 'Ma Belle Promo — document destiné aux partenaires';
  return (
    <>
      <View style={styles.header} fixed>
        <Text>Rapport de bilan — Programme {PROGRAM.name} — {PROGRAM.cohort}</Text>
        <Text>{isDraft ? 'BROUILLON NON VALIDÉ' : variant === 'internal' ? 'Version interne' : 'Version externe'}</Text>
      </View>
      {/* Pied de page : deux textes positionnés séparément (un conteneur
          commun ne s'affiche pas avec react-pdf en bas de page). */}
      <Text style={styles.footerLeft} fixed>{confidentiality}</Text>
      <Text style={styles.footerRight} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </>
  );
}

// ----------------------------------------------------------------------------
// Le document
// ----------------------------------------------------------------------------

// logoSrc : adresse du logo. La valeur par défaut convient au navigateur.
export default function ReviewReportPdf({ report, variant = 'internal', summaryOverride = null, logoSrc = '/logo-mbp.png' }) {
  const isInternal = variant === 'internal';
  const isDraft = report.status !== 'validated';
  const m = report.metrics;
  const a = report.ai_analysis;
  const snap = m.snapshot;
  const s = snap.survey_summary;

  const presentation = buildPresentation(report);
  const methodology = buildMethodology(report);
  const keyFigures = buildKeyFigures(report);
  const vigilance = countVigilance(report);
  const pairStatus = countPairStatus(report);
  const hasPairStatus = (a.pair_status || []).length > 0;

  const likert = m.likert_by_question || [];
  const likertStat = (role, id) => likert.find((l) => l.role === role && l.question_id === id);
  const gapStat = (id) => (m.pair_gaps || []).find((g) => g.question_id === id);
  const npsRole = (role) => (m.nps || []).find((n) => n.role === role) || {};
  const allQuestions = [...COMMON_QUESTIONS, ...MENTOR_ONLY_QUESTIONS, ...MENTORE_ONLY_QUESTIONS];
  const objectivesMentor = likertStat('mentor', 'objectives_achieved');
  const objectivesMentore = likertStat('mentore', 'objectives_achieved');

  const recommendations = [...(a.recommendations || [])]
    .sort((x, y) => (PRIORITY_ORDER[x.priority] ?? 9) - (PRIORITY_ORDER[y.priority] ?? 9));
  const contributionOptions = [...new Set((m.contribution_distribution || []).map((c) => c.option))];
  const summaryText = summaryOverride ?? a.executive_summary;
  const editionDate = formatDateFr(report.validated_at || report.generated_at);

  return (
    <Document title={`Rapport de bilan ${PROGRAM.name} — ${PROGRAM.cohort}`} author="Ma Belle Promo">
      {/* ------------------------------------------------ 1. Page de garde */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverInner}>
          <Image src={logoSrc} style={styles.coverLogo} />
          <View>
            <Text style={styles.coverKicker}>Programme de mentorat</Text>
            <Text style={styles.coverTitle}>{PROGRAM.name}</Text>
            <Text style={styles.coverSubtitle}>Rapport de bilan — {PROGRAM.cohort}</Text>
            <View style={styles.coverRule} />
            <Text style={styles.coverMeta}>{PROGRAM.association}</Text>
            <Text style={styles.coverMeta}>Période couverte : du {PROGRAM.startDateLabel} au {formatDateFr(report.generated_at)}</Text>
            <Text style={styles.coverMeta}>Date d'édition : {editionDate}</Text>
            <Text style={styles.coverBadge}>
              {isInternal ? 'VERSION INTERNE — NOMINATIVE' : 'VERSION EXTERNE — PARTENAIRES'}{isDraft ? ' — BROUILLON' : ''}
            </Text>
          </View>
          <Text style={{ fontSize: 8.5, color: '#a7f3d0' }}>
            {isInternal
              ? 'Document confidentiel. Il contient des données nominatives et ne doit pas être diffusé hors du bureau de Ma Belle Promo.'
              : 'Document sans donnée nominative, à l\'exception des citations dont l\'auteur a accepté la publication.'}
          </Text>
        </View>
      </Page>

      {/* ------------------------------------------------ 2. Résumé exécutif (une page) */}
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />
        <Text style={styles.h1}>2. Résumé exécutif</Text>
        <View style={styles.kpiGrid}>
          {keyFigures.slice(0, 6).map((k) => (
            <View key={k.label} style={styles.kpiBox}>
              <View style={styles.kpiInner}>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiDetail}>{k.detail}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={[styles.p, { marginTop: 8 }]}>{summaryText}</Text>
        <Text style={styles.h2}>Principaux constats</Text>
        <Bullets items={a.key_findings} />
        <Text style={styles.h2}>Recommandations principales</Text>
        <Bullets items={recommendations.slice(0, 3).map((r) => `${r.text} (priorité ${r.priority})`)} />
        {a.sample_warning && <Text style={styles.note}>{a.sample_warning}</Text>}
      </Page>

      {/* ------------------------------------------------ Corps du rapport */}
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />

        {/* 3. Présentation */}
        <View style={styles.section}>
          <Text style={styles.h1}>3. Présentation du programme</Text>
          <Text style={styles.h2}>Contexte</Text>
          {presentation.context.map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}
          <Text style={styles.h2}>Objectifs</Text>
          <Bullets items={presentation.objectives} />
          <Text style={styles.h2}>Public</Text>
          <Bullets items={presentation.audience} />
          <Text style={styles.h2}>Pays et ville de résidence des mentors</Text>
          <Bullets items={presentation.mentorPlaces} />
          <Source>pages « Programme complet » et « À propos » du site ; tables mentor et mentore (candidatures) ; lieu déclaré par les mentors à l'inscription.</Source>
        </View>

        {/* 4. Méthodologie */}
        <View style={styles.section}>
          <Text style={styles.h1}>4. Méthodologie</Text>
          <Text style={styles.h2}>Sources</Text>
          <Bullets items={methodology.sources} />
          <Text style={styles.h2}>Période</Text>
          <Bullets items={methodology.period} />
          <Text style={styles.h2}>Taux de réponse au sondage</Text>
          <Bullets items={methodology.responseRate} />
          <Text style={styles.h2}>Exclusion du binôme de test</Text>
          <Text style={styles.p}>{methodology.exclusion}</Text>
          <Text style={styles.h2}>Limites</Text>
          <Bullets items={methodology.limits} />
        </View>

        {/* 5. Chiffres clés */}
        <View style={styles.section}>
          <Text style={styles.h1}>5. Chiffres clés</Text>
          <View style={styles.headRow}>
            <Text style={[styles.th, { width: '30%' }]}>Indicateur</Text>
            <Text style={[styles.th, { width: '18%' }]}>Valeur</Text>
            <Text style={[styles.th, { width: '52%' }]}>Lecture et source</Text>
          </View>
          {keyFigures.map((k) => (
            <View key={k.label} style={styles.row} wrap={false}>
              <Text style={[styles.td, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>{k.label}</Text>
              <Text style={[styles.td, { width: '18%' }]}>{k.value}</Text>
              <View style={{ width: '52%' }}>
                <Text style={styles.td}>{k.detail}</Text>
                <Text style={{ fontSize: 7, color: MUTED }}>{k.source}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.note}>
            Une partie des séances n'ayant pas été enregistrée sur la plateforme, le nombre de séances, leur durée, leur
            format et leur régularité ne sont pas présentés dans ce rapport.
          </Text>
        </View>

        {/* 6. Résultats quantitatifs */}
        {/* Nouvelle page. (La propriété "break" de react-pdf fait planter le rendu
            dans cette mise en page : on ouvre donc une vraie nouvelle <Page>.) */}
      </Page>
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />
        <View style={styles.section}>
          <Text style={styles.h1}>6. Résultats quantitatifs du sondage</Text>

          <Text style={styles.h2}>Recommandation du programme (note de 0 à 10)</Text>
          <NpsChart title="Ensemble des répondants" promoters={s.nps_promoters} passives={s.nps_passives} detractors={s.nps_detractors} />
          <NpsChart title="Mentors" promoters={npsRole('mentor').promoters} passives={npsRole('mentor').passives} detractors={npsRole('mentor').detractors} />
          <NpsChart title="Mentorés" promoters={npsRole('mentore').promoters} passives={npsRole('mentore').passives} detractors={npsRole('mentore').detractors} />
          <Text style={styles.p}>
            NPS (part des promoteurs moins part des détracteurs) : {s.nps_score > 0 ? '+' : ''}{s.nps_score}, sur {s.nps_answers} réponses.
            Note moyenne : {num(npsRole('mentor').avg_nps)}/10 pour les mentors, {num(npsRole('mentore').avg_nps)}/10 pour les mentorés.
          </Text>
          <Source>official_survey_summary (nps_*) ; build_review_report_metrics, clé nps.</Source>

          <Text style={styles.h2}>Questions notées de 1 à 5, par rôle</Text>
          <Legend items={[{ label: 'Mentors', color: GREEN }, { label: 'Mentorés', color: PURPLE }]} />
          <View style={styles.headRow}>
            <Text style={[styles.th, { width: '34%' }]}>Question</Text>
            <Text style={[styles.th, { width: '46%' }]}>Moyenne sur 5 (n = réponses)</Text>
            <Text style={[styles.th, { width: '20%', textAlign: 'right' }]}>Écart moyen dans les binômes</Text>
          </View>
          {allQuestions.map((id) => (
            <LikertRow key={id} label={QUESTION_LABELS[id] || id} mentor={likertStat('mentor', id)} mentore={likertStat('mentore', id)} gap={gapStat(id)} />
          ))}
          <Text style={[styles.p, { marginTop: 5 }]}>
            Écart moyen : différence, question par question, entre la note du mentor et celle du mentoré d'un même binôme,
            calculée sur les {s.pairs_with_both_responses} binômes où les deux ont répondu. « Régularité des sessions » est une
            appréciation déclarée par les participants.
          </Text>
          <Source>build_review_report_metrics, clés likert_by_question et pair_gaps.</Source>

          <Text style={styles.h2}>Atteinte des objectifs</Text>
          <Text style={styles.p}>
            Note moyenne déclarée : {objectivesMentor ? `${num(objectivesMentor.avg_value, 2)}/5 pour les mentors (${objectivesMentor.n} réponses)` : NOT_AVAILABLE},{' '}
            {objectivesMentore ? `${num(objectivesMentore.avg_value, 2)}/5 pour les mentorés (${objectivesMentore.n} réponses)` : NOT_AVAILABLE}.
            {gapStat('objectives_achieved') ? ` Écart moyen au sein des binômes : ${num(gapStat('objectives_achieved').avg_gap, 2)} point.` : ''}
          </Text>

          <Text style={styles.h2}>Nombre de sessions déclaré par les participants</Text>
          <DistributionTable rows={m.sessions_distribution} options={['0-1', '2-3', '4-5', '6 et plus']} />
          <Text style={styles.note}>
            Ces réponses sont des déclarations par tranche, données de mémoire par chaque participant. Elles ne constituent
            pas un comptage et ne s'additionnent pas en un total de séances.
          </Text>

          <Text style={styles.h2}>Apports du mentorat (plusieurs réponses possibles)</Text>
          <DistributionTable rows={m.contribution_distribution} options={contributionOptions} />
          <Text style={styles.source}>Mentors : ce qu'ils disent avoir apporté. Mentorés : ce qu'ils disent avoir reçu.</Text>

          <Text style={styles.h2}>La plateforme a-t-elle gêné le fonctionnement du binôme ? (question facultative)</Text>
          <DistributionTable rows={m.platform_impact_distribution} options={['Oui', 'Partiellement', 'Non', 'Non concerné(e)']} />

          <Text style={styles.h2}>Intérêt pour une nouvelle expérience de mentorat (question générale et hypothétique)</Text>
          <DistributionTable rows={m.continuation_distribution} options={Object.keys(CONTINUATION_LABELS)} labels={CONTINUATION_LABELS} />
          <Source>build_review_report_metrics, clés sessions_distribution, contribution_distribution, platform_impact_distribution, continuation_distribution.</Source>
        </View>

        {/* 7. Résultats qualitatifs */}
        {/* Nouvelle page. (La propriété "break" de react-pdf fait planter le rendu
            dans cette mise en page : on ouvre donc une vraie nouvelle <Page>.) */}
      </Page>
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />
        <View style={styles.section}>
          <Text style={styles.h1}>7. Résultats qualitatifs</Text>
          <Text style={styles.h2}>Thèmes récurrents des réponses libres</Text>
          {(a.recurring_themes || []).length === 0 ? <Text style={styles.p}>{NOT_AVAILABLE}</Text> : (
            <>
              <View style={styles.headRow}>
                <Text style={[styles.th, { width: '55%' }]}>Thème</Text>
                <Text style={[styles.th, { width: '30%' }]}>Question concernée</Text>
                <Text style={[styles.th, { width: '15%', textAlign: 'right' }]}>Mentions</Text>
              </View>
              {a.recurring_themes.map((t, i) => (
                <View key={i} style={styles.row} wrap={false}>
                  <Text style={[styles.td, { width: '55%' }]}>{t.theme}</Text>
                  <Text style={[styles.td, { width: '30%' }]}>{VERBATIM_FIELD_LABEL[t.field] || '—'}</Text>
                  <Text style={[styles.td, { width: '15%', textAlign: 'right' }]}>{t.frequency}</Text>
                </View>
              ))}
            </>
          )}
          <Source>réponses libres du sondage (points forts, améliorations, commentaire sur les objectifs), regroupées par thème avec l'aide de l'IA.</Source>

          <Text style={styles.h2}>Paroles de participants</Text>
          {(a.notable_quotes || []).length === 0 ? (
            <Text style={styles.p}>Aucune citation autorisée par les participants.</Text>
          ) : a.notable_quotes.map((q) => (
            <View key={q.verbatim_id} style={styles.quote} wrap={false}>
              <Text style={styles.quoteText}>« {q.text} »</Text>
              <Text style={styles.quoteBy}>— {q.attribution} · {VERBATIM_FIELD_LABEL[q.field] || ''}</Text>
            </View>
          ))}
          <Text style={styles.source}>
            Seules les réponses dont l'auteur a accepté la citation sont reproduites, signées du prénom seul ou du nom complet selon son choix.
          </Text>
        </View>

        {/* 8. Analyse */}
        <View style={styles.section}>
          <Text style={styles.h1}>8. Analyse</Text>
          {hasPairStatus && (
            <>
              <Text style={styles.h2}>État des relations au sein des binômes</Text>
              <Text style={styles.p}>
                Classement qualitatif établi à partir des réponses au sondage (réponses libres et déclarations des
                participants). Il ne repose pas sur un comptage des séances.
              </Text>
              {pairStatus.map((ps) => (
                <View key={ps.status} style={styles.row} wrap={false}>
                  <Text style={[styles.td, { width: '60%' }]}>{ps.label}</Text>
                  <Text style={[styles.td, { width: '40%', textAlign: 'right' }]}>{share(ps.count, ps.total)} binômes</Text>
                </View>
              ))}
              {/* Détail par binôme : VERSION INTERNE UNIQUEMENT */}
              {isInternal && (
                <View style={{ marginTop: 6 }}>
                  <View style={styles.headRow}>
                    <Text style={[styles.th, { width: '32%' }]}>Binôme (mentor / mentoré)</Text>
                    <Text style={[styles.th, { width: '18%' }]}>État</Text>
                    <Text style={[styles.th, { width: '50%' }]}>Constat</Text>
                  </View>
                  {a.pair_status.map((p) => (
                    <View key={p.binome_id} style={styles.row} wrap={false}>
                      <Text style={[styles.td, { width: '32%', paddingRight: 4 }]}>{p.mentor_name} / {p.mentore_name}</Text>
                      <Text style={[styles.td, { width: '18%' }]}>{PAIR_STATUS_LABEL[p.status]}</Text>
                      <Text style={[styles.td, { width: '50%' }]}>{p.basis}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={styles.h2}>Ce qui a fonctionné</Text>
          {(a.strengths || []).map((x, i) => (
            <View key={i} style={styles.item} wrap={false}>
              <Text style={styles.itemTitle}>{x.title}</Text>
              <Text style={styles.td}>{x.evidence}</Text>
            </View>
          ))}
          <Text style={styles.h2}>Ce qui n'a pas fonctionné</Text>
          {(a.improvements || []).map((x, i) => (
            <View key={i} style={styles.item} wrap={false}>
              <Text style={styles.itemTitle}>{x.title} (priorité {x.priority})</Text>
              <Text style={styles.td}>{x.evidence}</Text>
            </View>
          ))}

          <Text style={styles.h2}>Binômes à surveiller</Text>
          <Text style={styles.p}>
            Niveau de vigilance calculé d'après la note de recommandation du sondage : prioritaire si une note est
            inférieure ou égale à 6 ou si l'écart entre mentor et mentoré atteint 4 points ; à surveiller si une note vaut 7 ou 8.
          </Text>
          {vigilance.map((v) => (
            <View key={v.level} style={styles.row} wrap={false}>
              <Text style={[styles.td, { width: '60%' }]}>{v.label}</Text>
              <Text style={[styles.td, { width: '40%', textAlign: 'right' }]}>{share(v.count, v.total)} binômes</Text>
            </View>
          ))}
          <Source>review_pair_vigilance.</Source>

          {/* Détail nominatif : VERSION INTERNE UNIQUEMENT */}
          {isInternal && (
            <View style={{ marginTop: 6 }}>
              <View style={styles.headRow}>
                <Text style={[styles.th, { width: '32%' }]}>Binôme (mentor / mentoré)</Text>
                <Text style={[styles.th, { width: '14%' }]}>Niveau</Text>
                <Text style={[styles.th, { width: '54%' }]}>Raison</Text>
              </View>
              {(a.pairs_to_watch || []).length === 0 ? (
                <Text style={[styles.td, { paddingVertical: 4 }]}>Aucun binôme signalé par l'analyse.</Text>
              ) : a.pairs_to_watch.map((p) => (
                <View key={p.binome_id} style={styles.row} wrap={false}>
                  <Text style={[styles.td, { width: '32%', paddingRight: 4 }]}>{p.mentor_name} / {p.mentore_name}</Text>
                  <Text style={[styles.td, { width: '14%' }]}>{VIGILANCE_LABEL[p.vigilance] || '—'}</Text>
                  <Text style={[styles.td, { width: '54%' }]}>{p.reason}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 9. Recommandations */}
        <View style={styles.section}>
          <Text style={styles.h1}>9. Recommandations</Text>
          <Text style={styles.p}>Recommandations formulées dans l'hypothèse d'une cohorte 2, classées par priorité.</Text>
          <View style={styles.headRow}>
            <Text style={[styles.th, { width: '60%' }]}>Action</Text>
            <Text style={[styles.th, { width: '14%' }]}>Priorité</Text>
            <Text style={[styles.th, { width: '26%' }]}>Responsable suggéré</Text>
          </View>
          {recommendations.map((r, i) => (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={[styles.td, { width: '60%', paddingRight: 6 }]}>{r.text}</Text>
              <Text style={[styles.td, { width: '14%' }]}>{r.priority}</Text>
              <Text style={[styles.td, { width: '26%' }]}>{r.owner}</Text>
            </View>
          ))}
          {(a.key_learnings || []).length > 0 && (
            <>
              <Text style={styles.h2}>Enseignements à retenir</Text>
              <Bullets items={a.key_learnings} />
            </>
          )}
        </View>

        {/* 10. Conclusion */}
        <View style={styles.section}>
          <Text style={styles.h1}>10. Conclusion et perspectives</Text>
          <Text style={styles.p}>{a.conclusion}</Text>
        </View>

        {/* 11. Annexes */}
        {/* Nouvelle page. (La propriété "break" de react-pdf fait planter le rendu
            dans cette mise en page : on ouvre donc une vraie nouvelle <Page>.) */}
      </Page>
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />
        <View style={styles.section}>
          <Text style={styles.h1}>11. Annexes — A. Questionnaire</Text>
          <Text style={styles.h2}>Questions posées aux mentors</Text>
          <Bullets items={mentorQuestions.map((q) => interpolateLabel(q.label, 'ton binôme'))} />
          <Text style={styles.h2}>Questions posées aux mentorés</Text>
          <Bullets items={mentoreQuestions.map((q) => interpolateLabel(q.label, 'ton binôme'))} />
        </View>

        {/* Nouvelle page. (La propriété "break" de react-pdf fait planter le rendu
            dans cette mise en page : on ouvre donc une vraie nouvelle <Page>.) */}
      </Page>
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />
        <View style={styles.section}>
          <Text style={styles.h1}>11. Annexes — B. Tableaux détaillés</Text>
          <Text style={styles.h2}>Répartition des notes de 1 à 5, par question et par rôle</Text>
          <View style={styles.headRow}>
            <Text style={[styles.th, { width: '38%' }]}>Question</Text>
            <Text style={[styles.th, { width: '14%' }]}>Rôle</Text>
            {['1', '2', '3', '4', '5'].map((n) => <Text key={n} style={[styles.th, { width: '6%', textAlign: 'right' }]}>{n}</Text>)}
            <Text style={[styles.th, { width: '9%', textAlign: 'right' }]}>n</Text>
            <Text style={[styles.th, { width: '9%', textAlign: 'right' }]}>Moy.</Text>
          </View>
          {allQuestions.flatMap((id) => ['mentor', 'mentore'].map((role) => {
            const stat = likertStat(role, id);
            if (!stat) return null;
            return (
              <View key={`${id}-${role}`} style={styles.row} wrap={false}>
                <Text style={[styles.td, { width: '38%', paddingRight: 4 }]}>{QUESTION_LABELS[id] || id}</Text>
                <Text style={[styles.td, { width: '14%' }]}>{role === 'mentor' ? 'Mentors' : 'Mentorés'}</Text>
                {['1', '2', '3', '4', '5'].map((n) => (
                  <Text key={n} style={[styles.td, { width: '6%', textAlign: 'right' }]}>{stat.distribution?.[n] ?? 0}</Text>
                ))}
                <Text style={[styles.td, { width: '9%', textAlign: 'right' }]}>{stat.n}</Text>
                <Text style={[styles.td, { width: '9%', textAlign: 'right' }]}>{num(stat.avg_value, 2)}</Text>
              </View>
            );
          }))}

          {/* Tableau nominatif par binôme : VERSION INTERNE UNIQUEMENT */}
          {isInternal && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.h2}>Situation par binôme (document interne)</Text>
              <View style={styles.headRow}>
                <Text style={[styles.th, { width: '40%' }]}>Binôme (mentor / mentoré)</Text>
                <Text style={[styles.th, { width: '15%' }]}>Note mentor</Text>
                <Text style={[styles.th, { width: '15%' }]}>Note mentoré</Text>
                <Text style={[styles.th, { width: '15%' }]}>Vigilance</Text>
                <Text style={[styles.th, { width: '15%' }]}>Objectifs</Text>
              </View>
              {(snap.binomes || []).map((b) => (
                <View key={b.binome_id} style={styles.row} wrap={false}>
                  <Text style={[styles.td, { width: '40%', paddingRight: 4 }]}>{b.mentor_name} / {b.mentore_name}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{b.mentor_responded ? `${b.mentor_nps}/10` : 'pas de réponse'}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{b.mentore_responded ? `${b.mentore_nps}/10` : 'pas de réponse'}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{VIGILANCE_LABEL[b.vigilance] || '—'}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{b.objectives_count > 0 ? `${b.objectives_reached_count}/${b.objectives_count} atteint(s)` : 'non disponible'}</Text>
                </View>
              ))}
              <Text style={styles.source}>Notes : note de recommandation du sondage (0 à 10). Source : official_binome_overview.</Text>
            </View>
          )}
        </View>

        {/* Nouvelle page. (La propriété "break" de react-pdf fait planter le rendu
            dans cette mise en page : on ouvre donc une vraie nouvelle <Page>.) */}
      </Page>
      <Page size="A4" style={styles.page}>
        <PageFrame variant={variant} isDraft={isDraft} />
        <View style={styles.section}>
          <Text style={styles.h1}>11. Annexes — C. Définition des indicateurs</Text>
          {Object.entries(INDICATOR_DEFINITIONS)
            // Les sources brutes sur les séances restent internes au dashboard.
            .filter(([key]) => key !== 'sessions_raw_sources')
            .map(([key, def]) => (
              <View key={key} style={styles.item} wrap={false}>
                <Text style={styles.itemTitle}>{def.label}</Text>
                <Text style={styles.td}>{def.formula}</Text>
                <Text style={{ fontSize: 7.5, color: MUTED }}>Source : {def.source} — Période : {def.period}</Text>
              </View>
            ))}
        </View>
      </Page>
    </Document>
  );
}
