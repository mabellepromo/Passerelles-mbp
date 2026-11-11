// Onglet « Synthèse » : indicateurs clés du programme.
// Tous les chiffres viennent des vues SQL d'indicateurs (binôme test exclu).
// Aucun chiffre sur le nombre de séances : les données sont incomplètes
// (décision du 11/11/2026), voir l'onglet « Activité ».
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, MessageSquare, CheckCircle2, Target, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchSurveySummary, fetchFicheSatisfaction, fetchBinomeOverview } from '@/lib/programData';
import { StatCard, NpsBar, VigilanceBadge, WarningBanner, Loader, formatShare, formatNumber } from './shared';

export default function SyntheseTab() {
  const { data: survey, isLoading: loadingSurvey } = useQuery({
    queryKey: ['official_survey_summary'], queryFn: fetchSurveySummary,
  });
  const { data: fiches, isLoading: loadingFiches } = useQuery({
    queryKey: ['official_fiche_satisfaction'], queryFn: fetchFicheSatisfaction,
  });
  const { data: binomes = [], isLoading: loadingBinomes } = useQuery({
    queryKey: ['official_binome_overview'], queryFn: fetchBinomeOverview,
  });

  if (loadingSurvey || loadingFiches || loadingBinomes) return <Loader />;
  if (!survey) return <p className="text-sm text-gray-400">Donnée non disponible.</p>;

  const invitedTotal = survey.mentors_invited + survey.mentores_invited;

  // Répartition des binômes par niveau de vigilance.
  const vigilanceLevels = ['rouge', 'orange', 'vert', 'en_attente'];
  const vigilanceCounts = vigilanceLevels.map((level) => ({
    level,
    count: binomes.filter((b) => (b.vigilance || 'en_attente') === level).length,
  }));

  // Objectifs suivis dans le journal de bord.
  const objectivesTotal = binomes.reduce((sum, b) => sum + (b.objectives_count || 0), 0);
  const objectivesReached = binomes.reduce((sum, b) => sum + (b.objectives_reached_count || 0), 0);
  const binomesWithObjectives = binomes.filter((b) => b.objectives_count > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Binômes" value={survey.binomes_count} sub="binômes officiels, cohorte 1" icon={Users} />
        <StatCard label="Réponses au sondage" value={`${survey.responses_total}/${invitedTotal}`} sub={`${formatShare(survey.responses_total, invitedTotal)} des personnes invitées`} icon={MessageSquare} />
        <StatCard label="Mentors répondants" value={`${survey.mentor_responses}/${survey.mentors_invited}`} sub={formatShare(survey.mentor_responses, survey.mentors_invited)} icon={CheckCircle2} color="#1a7a45" />
        <StatCard label="Mentorés répondants" value={`${survey.mentore_responses}/${survey.mentores_invited}`} sub={formatShare(survey.mentore_responses, survey.mentores_invited)} icon={CheckCircle2} color="#7c3aed" />
        <StatCard label="Binômes complets" value={`${survey.pairs_with_both_responses}/${survey.binomes_count}`} sub="mentor et mentoré ont répondu" icon={Users} />
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Recommandation du programme (NPS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            NPS de <strong>{survey.nps_score > 0 ? '+' : ''}{survey.nps_score}</strong>, calculé sur {survey.nps_answers} réponses
            (part des promoteurs moins part des détracteurs). Sur un effectif aussi réduit, une seule réponse
            déplace le score d'environ 6 points : la répartition ci-dessous est plus parlante que le score seul.
          </p>
          <NpsBar promoters={survey.nps_promoters} passives={survey.nps_passives} detractors={survey.nps_detractors} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">Niveau de vigilance des binômes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {vigilanceCounts.map(({ level, count }) => (
              <div key={level} className="flex items-center justify-between text-sm">
                <VigilanceBadge level={level} />
                <span className="font-semibold text-gray-800">{formatShare(count, binomes.length)}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500 pt-2">
              Règle unique, d'après la note de recommandation du sondage : prioritaire si une note ≤ 6 ou un écart
              ≥ 4 points entre mentor et mentoré ; à surveiller si une note de 7 ou 8. Détail dans l'onglet « Binômes ».
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-emerald-700" /> Objectifs suivis sur la plateforme</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>{objectivesTotal}</strong> objectif(s) enregistré(s) dans le journal de bord, dont{' '}
              <strong>{objectivesReached}</strong> au statut « atteint ».
            </p>
            <p>
              Seuls <strong>{formatShare(binomesWithObjectives, binomes.length)}</strong> binômes ont saisi des objectifs :
              pour les autres, la donnée n'est pas disponible. L'atteinte des objectifs déclarée par les participants
              figure dans l'onglet « Sondage ».
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4 text-amber-500" /> Satisfaction déclarée dans les fiches de séance</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          {fiches && fiches.fiches_rated > 0 ? (
            <p>
              Note moyenne de <strong>{formatNumber(fiches.avg_author_satisfaction)}/5</strong> sur {fiches.fiches_rated} fiche(s) notée(s)
              ({fiches.fiches_by_mentore} saisie(s) par un mentoré, {fiches.fiches_by_mentor} par un mentor).
              {fiches.fiches_excluded > 0 && ` ${fiches.fiches_excluded} fiche(s) exclue(s) faute d'auteur identifié.`}
            </p>
          ) : (
            <p>Donnée non disponible.</p>
          )}
          <p className="text-xs text-gray-500">
            Note retenue : celle de l'auteur de la fiche. Elle reflète surtout le point de vue des mentorés et ne mesure pas
            la satisfaction des mentors, qui vient du sondage. Le nombre de fiches n'est pas le nombre de séances.
          </p>
        </CardContent>
      </Card>

      <WarningBanner title="Limites à garder en tête">
        {survey.mentors_invited - survey.mentor_responses} mentor(s) et {survey.mentores_invited - survey.mentore_responses} mentoré(s)
        n'ont pas répondu au sondage. Une partie des séances n'a pas été enregistrée sur la plateforme : aucun indicateur
        sur le nombre de séances n'est présenté.
      </WarningBanner>
    </div>
  );
}
