// Onglet « Sondage » : trois volets.
//   1. Résultats : taux de réponse, NPS par rôle, questions notées mentors / mentorés
//   2. Réponses  : comparaison par binôme et réponses individuelles (BilanReview)
//   3. Liens     : gestion des liens et des relances (reprise de « Sondage & liens »)
// Les chiffres viennent de la fonction SQL build_review_report_metrics et de la
// vue official_survey_summary (binôme test exclu).
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchSurveySummary, fetchSurveyMetrics } from '@/lib/programData';
import BilanReview from '@/components/admin/BilanReview.jsx';
import CampagneBilan from '@/components/admin/CampagneBilan.jsx';
import {
  StatCard, NpsBar, Loader, formatShare, formatNumber,
  ROLE_COLORS, ROLE_LABELS, QUESTION_LABELS,
  COMMON_QUESTIONS, MENTOR_ONLY_QUESTIONS, MENTORE_ONLY_QUESTIONS,
} from './shared';

const SECTIONS = [
  { id: 'resultats', label: 'Résultats' },
  { id: 'reponses', label: 'Réponses par binôme et par personne' },
  { id: 'liens', label: 'Liens et relances' },
];

const CONTINUATION_LABELS = {
  yes_definitely: 'Oui, certainement',
  yes_probably: 'Oui, probablement',
  unsure: 'Incertain(e)',
  probably_not: 'Probablement pas',
  no: 'Non',
};

// Une note moyenne sur 5, dessinée en barre horizontale avec sa valeur écrite.
function ScoreBar({ role, stat }) {
  if (!stat) return <span className="text-xs text-gray-400">non posée</span>;
  return (
    <div className="flex items-center gap-2" title={`${ROLE_LABELS[role]} : ${formatNumber(stat.avg_value, 2)}/5 sur ${stat.n} réponse(s)`}>
      <div className="h-2.5 w-28 rounded bg-gray-100 overflow-hidden">
        <div className="h-full rounded" style={{ width: `${(stat.avg_value / 5) * 100}%`, background: ROLE_COLORS[role] }} />
      </div>
      <span className="text-sm font-semibold text-gray-800">{formatNumber(stat.avg_value, 2)}</span>
      <span className="text-xs text-gray-500">n={stat.n}</span>
    </div>
  );
}

// Tableau « option / mentors / mentorés » pour une question à choix.
function DistributionTable({ rows, options, labels = {} }) {
  const count = (role, option) => rows.find((r) => r.role === role && (r.bucket ?? r.option) === option)?.n ?? 0;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
          <th className="py-2 pr-4">Réponse</th>
          <th className="py-2 pr-4">Mentors</th>
          <th className="py-2 pr-4">Mentorés</th>
        </tr>
      </thead>
      <tbody>
        {options.map((option) => (
          <tr key={option} className="border-b border-gray-50">
            <td className="py-2 pr-4 text-gray-700">{labels[option] || option}</td>
            <td className="py-2 pr-4">{count('mentor', option)}</td>
            <td className="py-2 pr-4">{count('mentore', option)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Resultats() {
  const { data: survey, isLoading: loadingSurvey } = useQuery({
    queryKey: ['official_survey_summary'], queryFn: fetchSurveySummary,
  });
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['survey_metrics'], queryFn: () => fetchSurveyMetrics(null),
  });

  if (loadingSurvey || loadingMetrics) return <Loader />;
  if (!survey || !metrics) return <p className="text-sm text-gray-400">Donnée non disponible.</p>;

  const likert = metrics.likert_by_question || [];
  const likertStat = (role, questionId) => likert.find((l) => l.role === role && l.question_id === questionId);
  const gapStat = (questionId) => (metrics.pair_gaps || []).find((g) => g.question_id === questionId);
  const npsByRole = (role) => (metrics.nps || []).find((n) => n.role === role);
  const contributions = metrics.contribution_distribution || [];
  const contributionOptions = [...new Set(contributions.map((c) => c.option))];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Mentors répondants" value={`${survey.mentor_responses}/${survey.mentors_invited}`} sub={formatShare(survey.mentor_responses, survey.mentors_invited)} color={ROLE_COLORS.mentor} />
        <StatCard label="Mentorés répondants" value={`${survey.mentore_responses}/${survey.mentores_invited}`} sub={formatShare(survey.mentore_responses, survey.mentores_invited)} color={ROLE_COLORS.mentore} />
        <StatCard label="Réponses au total" value={survey.responses_total} sub={`sur ${survey.mentors_invited + survey.mentores_invited} personnes invitées`} />
        <StatCard label="Binômes complets" value={`${survey.pairs_with_both_responses}/${survey.binomes_count}`} sub="les deux ont répondu" />
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Recommandation du programme (note de 0 à 10), par rôle</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {['mentor', 'mentore'].map((role) => {
            const nps = npsByRole(role);
            return (
              <div key={role}>
                <p className="text-sm font-semibold text-gray-800 mb-1.5">
                  {ROLE_LABELS[role]} — {nps?.total_nps ?? 0} réponse(s), note moyenne {formatNumber(nps?.avg_nps)}/10
                </p>
                <NpsBar promoters={nps?.promoters} passives={nps?.passives} detractors={nps?.detractors} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Questions notées de 1 à 5 : mentors et mentorés</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-5 mb-3">
            {['mentor', 'mentore'].map((role) => (
              <span key={role} className="flex items-center gap-1.5 text-xs text-gray-700">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ROLE_COLORS[role] }} /> {ROLE_LABELS[role]}
              </span>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Question</th>
                  <th className="py-2 pr-4">Mentors (moyenne /5)</th>
                  <th className="py-2 pr-4">Mentorés (moyenne /5)</th>
                  <th className="py-2 pr-4">Écart moyen dans les binômes</th>
                </tr>
              </thead>
              <tbody>
                {[...COMMON_QUESTIONS, ...MENTOR_ONLY_QUESTIONS, ...MENTORE_ONLY_QUESTIONS].map((questionId) => {
                  const gap = gapStat(questionId);
                  return (
                    <tr key={questionId} className="border-b border-gray-50">
                      <td className="py-2.5 pr-4 text-gray-800">{QUESTION_LABELS[questionId] || questionId}</td>
                      <td className="py-2.5 pr-4"><ScoreBar role="mentor" stat={likertStat('mentor', questionId)} /></td>
                      <td className="py-2.5 pr-4"><ScoreBar role="mentore" stat={likertStat('mentore', questionId)} /></td>
                      <td className="py-2.5 pr-4 text-gray-700">
                        {gap ? `${formatNumber(gap.avg_gap, 2)} point (${gap.n_pairs} binômes)` : <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            n = nombre de réponses. L'écart moyen compare, question par question, la note du mentor et celle du mentoré
            d'un même binôme, sur les seuls binômes où les deux ont répondu. « Régularité des sessions » est une
            appréciation déclarée par les participants, pas une mesure.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Nombre de sessions déclaré</CardTitle></CardHeader>
          <CardContent>
            <DistributionTable rows={metrics.sessions_distribution || []} options={['0-1', '2-3', '4-5', '6 et plus']} />
            <p className="text-xs text-gray-500 mt-3">
              Déclarations des participants, par tranche : ce n'est pas un comptage et ces réponses ne s'additionnent pas
              en un total de séances.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Intérêt pour une nouvelle expérience de mentorat</CardTitle></CardHeader>
          <CardContent>
            <DistributionTable rows={metrics.continuation_distribution || []} options={Object.keys(CONTINUATION_LABELS)} labels={CONTINUATION_LABELS} />
            <p className="text-xs text-gray-500 mt-3">Question posée de manière hypothétique et générale.</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Apports du mentorat (plusieurs choix possibles)</CardTitle></CardHeader>
          <CardContent>
            <DistributionTable rows={contributions} options={contributionOptions} />
            <p className="text-xs text-gray-500 mt-3">Mentors : ce qu'ils disent avoir apporté. Mentorés : ce qu'ils disent avoir reçu.</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">La plateforme a-t-elle gêné le binôme ?</CardTitle></CardHeader>
          <CardContent>
            <DistributionTable rows={metrics.platform_impact_distribution || []} options={['Oui', 'Partiellement', 'Non', 'Non concerné(e)']} />
            <p className="text-xs text-gray-500 mt-3">Question facultative.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SondageTab() {
  const [section, setSection] = useState('resultats');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              section === s.id
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'resultats' && <Resultats />}
      {section === 'reponses' && <BilanReview />}
      {section === 'liens' && <CampagneBilan />}
    </div>
  );
}
