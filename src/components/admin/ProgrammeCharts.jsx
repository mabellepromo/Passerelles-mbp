import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { TrendingUp, Users, Star, Activity, Target, Calendar } from 'lucide-react';

const COLORS = ['#1e5631', '#2d7a47', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

const StatCard = ({ label, value, sub, icon: IconComp, color }) => (
  <Card className="border-0 shadow-sm">
    <CardContent className={`p-4 flex items-center gap-3 rounded-xl ${color}`}>
      <IconComp className="h-5 w-5 flex-shrink-0" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium">{label}</p>
        {sub && <p className="text-xs opacity-70">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

export default function ProgrammeCharts({ mentors, mentores, binomes, suivis }) {

  // ── 1. Évolution des candidatures par mois ──
  const candidaturesParMois = useMemo(() => {
    const map = {};
    [...mentors, ...mentores].forEach(c => {
      const d = c.created_date?.slice(0, 7);
      if (!d) return;
      if (!map[d]) map[d] = { mois: d, mentors: 0, mentores: 0 };
      mentors.includes(c) ? map[d].mentors++ : map[d].mentores++;
    });
    return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
  }, [mentors, mentores]);

  // ── 2. Satisfaction mensuelle ──
  const satisfactionParMois = useMemo(() => {
    const map = {};
    suivis.forEach(s => {
      const d = s.meeting_date?.slice(0, 7);
      if (!d) return;
      if (!map[d]) map[d] = { mois: d, total: 0, count: 0 };
      const avg = ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2;
      if (avg > 0) { map[d].total += avg; map[d].count++; }
    });
    return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12)
      .map(m => ({ ...m, satisfaction: m.count > 0 ? +(m.total / m.count).toFixed(2) : 0 }));
  }, [suivis]);

  // ── 3. Statut des binômes ──
  const binomsStatuts = useMemo(() => {
    const map = {};
    binomes.forEach(b => { map[b.status] = (map[b.status] || 0) + 1; });
    const labels = { active: 'Actif', paused: 'En pause', completed: 'Terminé', terminated: 'Arrêté' };
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [binomes]);

  // ── 4. Taux d'activité (séances / mois) ──
  const seancesParMois = useMemo(() => {
    const map = {};
    suivis.forEach(s => {
      const d = s.meeting_date?.slice(0, 7);
      if (!d) return;
      if (!map[d]) map[d] = { mois: d, seances: 0, heures: 0 };
      map[d].seances++;
      map[d].heures += s.duration_hours || 0;
    });
    return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12)
      .map(m => ({ ...m, heures: +m.heures.toFixed(1) }));
  }, [suivis]);

  // ── 5. Statuts candidatures ──
  const statusMentors = useMemo(() => {
    const s = { pending: 0, approved: 0, rejected: 0, matched: 0 };
    mentors.forEach(m => { s[m.status] = (s[m.status] || 0) + 1; });
    return [
      { label: 'En attente', mentors: s.pending },
      { label: 'Acceptés', mentors: s.approved },
      { label: 'Appariés', mentors: s.matched },
      { label: 'Refusés', mentors: s.rejected },
    ];
  }, [mentors]);

  const statusMentores = useMemo(() => {
    const s = { pending: 0, approved: 0, rejected: 0, matched: 0, waitlist: 0 };
    mentores.forEach(m => { s[m.status] = (s[m.status] || 0) + 1; });
    return [
      { label: 'En attente', mentores: s.pending },
      { label: 'Acceptés', mentores: s.approved },
      { label: 'Appariés', mentores: s.matched },
      { label: 'Refusés', mentores: s.rejected },
      { label: 'Liste att.', mentores: s.waitlist },
    ];
  }, [mentores]);

  // ── Stats globales ──
  const activeBinomes = binomes.filter(b => b.status === 'active').length;
  const tauxActivite = binomes.length > 0 ? Math.round(activeBinomes / binomes.length * 100) : 0;
  const avgSatisfaction = suivis.length > 0
    ? (suivis.reduce((acc, s) => acc + ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2, 0) / suivis.length).toFixed(1)
    : '–';
  const totalHeures = suivis.reduce((s, r) => s + (r.duration_hours || 0), 0).toFixed(0);
  const issuesCount = suivis.filter(s => s.issues_reported).length;

  const formatMois = (m) => {
    if (!m) return '';
    const [y, mo] = m.split('-');
    const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analyse & Graphiques</h2>
        <p className="text-sm text-gray-500 mt-1">Progression et indicateurs de performance du programme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Taux d'activité" value={`${tauxActivite}%`} sub={`${activeBinomes}/${binomes.length} binômes`} icon={Activity} color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Satisfaction globale" value={avgSatisfaction !== '–' ? `${avgSatisfaction}/5` : '–'} sub={`${suivis.length} séances`} icon={Star} color="bg-amber-50 text-amber-700" />
        <StatCard label="Heures de mentorat" value={`${totalHeures}h`} sub="Total programme" icon={Calendar} color="bg-blue-50 text-blue-700" />
        <StatCard label="Signalements" value={issuesCount} sub="Problèmes reportés" icon={Target} color={issuesCount > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"} />
      </div>

      {/* Row 1: Candidatures + Statuts binômes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#1e5631]" /> Candidatures par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={candidaturesParMois} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tickFormatter={formatMois} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v, n) => [v, n === 'mentors' ? 'Mentors' : 'Mentorés']} labelFormatter={formatMois} />
                <Legend formatter={(v) => v === 'mentors' ? 'Mentors' : 'Mentorés'} />
                <Bar dataKey="mentors" fill="#1e5631" radius={[3,3,0,0]} />
                <Bar dataKey="mentores" fill="#3b82f6" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1e5631]" /> Répartition des binômes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {binomsStatuts.length === 0 ? (
              <p className="text-gray-400 text-sm py-8">Aucun binôme</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={binomsStatuts} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {binomsStatuts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Satisfaction + Séances */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Satisfaction mensuelle (sur 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={satisfactionParMois} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tickFormatter={formatMois} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={formatMois} formatter={(v) => [`${v}/5`, 'Satisfaction']} />
                <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Séances & heures par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={seancesParMois} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tickFormatter={formatMois} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={formatMois} />
                <Legend />
                <Bar yAxisId="left" dataKey="seances" fill="#3b82f6" name="Séances" radius={[3,3,0,0]} />
                <Bar yAxisId="right" dataKey="heures" fill="#8b5cf6" name="Heures" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Statuts candidatures */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statuts des candidatures – Mentors</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusMentors} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="mentors" fill="#1e5631" radius={[0,3,3,0]} name="Mentors" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Statuts des candidatures – Mentorés</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusMentores} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="mentores" fill="#3b82f6" radius={[0,3,3,0]} name="Mentorés" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}