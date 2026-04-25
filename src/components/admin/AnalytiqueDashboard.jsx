import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, CheckCircle2, AlertTriangle, Clock, Star, Users, Target, Activity } from 'lucide-react';

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const COLORS = ['#1e5631', '#2d7a47', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9'];

// Taux de complétion attendu : 1 suivi/mois par binôme actif
function getTauxCompletion(binomes, suivis) {
  if (!binomes.length) return [];

  // Trouver les 6 derniers mois
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS_FR[d.getMonth()] });
  }

  const activeBinomes = binomes.filter(b => b.status === 'active').length || 1;

  return months.map(({ key, label }) => {
    const count = suivis.filter(s => s.meeting_date?.startsWith(key)).length;
    const taux = Math.min(100, Math.round((count / activeBinomes) * 100));
    return { month: label, suivis: count, attendus: activeBinomes, taux };
  });
}

function getEngagementParBinome(binomes, suivis) {
  return binomes
    .filter(b => b.status === 'active')
    .map(b => {
      const bs = suivis.filter(s => s.binome_id === b.id);
      const avgSat = bs.length
        ? (bs.reduce((a, s) => a + ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2, 0) / bs.length).toFixed(1)
        : 0;
      const avgProg = bs.length
        ? (bs.reduce((a, s) => a + (s.progress_rating || 0), 0) / bs.length).toFixed(1)
        : 0;
      const label = `${b.mentor_name?.split(' ')[0]} / ${b.mentore_name?.split(' ')[0]}`;
      return {
        binome: label,
        rencontres: bs.length,
        satisfaction: Number(avgSat),
        progression: Number(avgProg),
        heures: bs.reduce((a, s) => a + (s.duration_hours || 0), 0),
      };
    })
    .sort((a, b) => b.rencontres - a.rencontres);
}

function getProgressionMensuelle(suivis) {
  const grouped = {};
  suivis.forEach(s => {
    if (!s.meeting_date) return;
    const key = s.meeting_date.slice(0, 7);
    if (!grouped[key]) grouped[key] = { satisfaction: [], progression: [], heures: 0 };
    grouped[key].satisfaction.push(((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2);
    grouped[key].progression.push(s.progress_rating || 0);
    grouped[key].heures += s.duration_hours || 0;
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => {
      const [yr, mo] = key.split('-');
      return {
        month: MONTHS_FR[parseInt(mo) - 1],
        satisfaction: val.satisfaction.length ? Number((val.satisfaction.reduce((a, v) => a + v, 0) / val.satisfaction.length).toFixed(2)) : 0,
        progression: val.progression.length ? Number((val.progression.reduce((a, v) => a + v, 0) / val.progression.length).toFixed(2)) : 0,
        heures: val.heures,
      };
    });
}

function getRadarData(suivis) {
  if (!suivis.length) return [];
  const avg = (arr) => arr.length ? (arr.reduce((a, v) => a + v, 0) / arr.length) : 0;
  return [
    { subject: 'Satisfaction mentor', A: avg(suivis.map(s => s.satisfaction_mentor || 0)) },
    { subject: 'Satisfaction mentoré', A: avg(suivis.map(s => s.satisfaction_mentore || 0)) },
    { subject: 'Progression', A: avg(suivis.map(s => s.progress_rating || 0)) },
    { subject: 'Durée (h)', A: Math.min(5, avg(suivis.map(s => s.duration_hours || 0)) * 2) },
    { subject: 'Régularité', A: Math.min(5, suivis.length / Math.max(1, new Set(suivis.map(s => s.binome_id)).size)) },
  ];
}

const StatCard = ({ icon: IconComp, label, value, sub, color = 'emerald' }) => (
  <Card className="border-0 shadow-md">
    <CardContent className={`p-5 flex items-center gap-4 bg-${color}-50 rounded-xl`}>
      <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
        <IconComp className={`h-6 w-6 text-${color}-700`} />
      </div>
      <div>
        <p className={`text-2xl font-bold text-${color}-800`}>{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

export default function AnalytiqueDashboard({ binomes, suivis }) {
  const tauxCompletion = useMemo(() => getTauxCompletion(binomes, suivis), [binomes, suivis]);
  const engagementData = useMemo(() => getEngagementParBinome(binomes, suivis), [binomes, suivis]);
  const progressionData = useMemo(() => getProgressionMensuelle(suivis), [suivis]);
  const radarData = useMemo(() => getRadarData(suivis), [suivis]);

  const activeBinomes = binomes.filter(b => b.status === 'active').length;
  const totalHeures = suivis.reduce((a, s) => a + (s.duration_hours || 0), 0);
  const avgSat = suivis.length
    ? (suivis.reduce((a, s) => a + ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2, 0) / suivis.length).toFixed(1)
    : '–';
  const tauxMoyenCompletion = tauxCompletion.length
    ? Math.round(tauxCompletion.reduce((a, t) => a + t.taux, 0) / tauxCompletion.length)
    : 0;
  const binomesActifsAvecSuivi = new Set(suivis.map(s => s.binome_id)).size;

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Taux de complétion moyen" value={`${tauxMoyenCompletion}%`} sub="sur les 6 derniers mois" color="emerald" />
        <StatCard icon={Clock} label="Heures de mentorat" value={`${totalHeures}h`} sub={`${suivis.length} rencontres au total`} color="blue" />
        <StatCard icon={Star} label="Satisfaction moyenne" value={`${avgSat}/5`} sub="mentor + mentoré" color="amber" />
        <StatCard icon={Activity} label="Binômes avec suivi" value={`${binomesActifsAvecSuivi}/${activeBinomes}`} sub="binômes actifs" color="purple" />
      </div>

      {/* Taux de complétion mensuel */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="h-5 w-5 text-emerald-600" />
            Taux de complétion des suivis (6 derniers mois)
          </CardTitle>
          <CardDescription>Ratio suivis effectués / binômes actifs attendus par mois</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tauxCompletion} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val, name) => name === 'taux' ? [`${val}%`, 'Taux'] : [val, name === 'suivis' ? 'Suivis réalisés' : 'Binômes attendus']} />
              <Bar dataKey="suivis" fill="#4caf50" name="Suivis réalisés" radius={[4, 4, 0, 0]} />
              <Bar dataKey="attendus" fill="#e0e0e0" name="Binômes attendus" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Progression mensuelle */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Évolution globale — Satisfaction & Progression
          </CardTitle>
          <CardDescription>Moyennes mensuelles calculées sur tous les suivis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 5 }} name="Satisfaction moy." />
              <Line type="monotone" dataKey="progression" stroke="#1e5631" strokeWidth={2.5} dot={{ r: 5 }} name="Progression moy." />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement par binôme */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Users className="h-5 w-5 text-purple-600" />
            Engagement par binôme
          </CardTitle>
          <CardDescription>Nombre de rencontres, satisfaction et heures par binôme actif</CardDescription>
        </CardHeader>
        <CardContent>
          {engagementData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Aucune donnée de suivi disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="binome" type="category" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rencontres" fill="#1e5631" name="Rencontres" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="heures" fill="#81c784" name="Heures totales" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Radar + Tableau de bord individuel */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar qualité programme */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-800 text-base">Qualité globale du programme</CardTitle>
            <CardDescription>Vue radar sur 5 dimensions clés (éch. /5)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar name="Programme" dataKey="A" stroke="#1e5631" fill="#1e5631" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tableau satisfaction par binôme */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-gray-800 text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Satisfaction détaillée par binôme
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[260px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Binôme</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Séances</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Satisfaction</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Progression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {engagementData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{row.binome}</td>
                      <td className="text-center px-3 py-2.5">
                        <Badge variant="outline" className="text-xs">{row.rencontres}</Badge>
                      </td>
                      <td className="text-center px-3 py-2.5">
                        <span className={`text-xs font-bold ${row.satisfaction >= 4 ? 'text-emerald-600' : row.satisfaction >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                          {row.satisfaction > 0 ? `${row.satisfaction}/5` : '–'}
                        </span>
                      </td>
                      <td className="text-center px-3 py-2.5">
                        <span className={`text-xs font-bold ${row.progression >= 4 ? 'text-emerald-600' : row.progression >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                          {row.progression > 0 ? `${row.progression}/5` : '–'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {engagementData.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-xs">Aucune donnée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes engagement faible */}
      {engagementData.filter(b => b.rencontres === 0).length > 0 && (
        <Card className="border-2 border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Binômes sans aucun suivi enregistré</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {engagementData.filter(b => b.rencontres === 0).map((b, i) => (
                  <Badge key={i} className="bg-red-100 text-red-700 border border-red-300">{b.binome}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}