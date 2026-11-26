import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
// Note de satisfaction d'une fiche = note de son auteur (voir src/lib/programData.js)
import { ficheSatisfaction } from '@/lib/programData';
import { Users, Star } from 'lucide-react';
import ExpertiseSummary from '@/components/admin/donnees/ExpertiseSummary';

// Graphiques du programme (cohorte 1, binôme test exclu).
// Aucun indicateur sur le nombre de séances ni les heures : une partie des
// séances n'a pas été enregistrée (décision du 11/11/2026). Le jugement sur
// les binômes vient des fiches d'expertise (sentences), pas du statut technique.

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
      const avg = ficheSatisfaction(s);
      if (avg > 0) { map[d].total += avg; map[d].count++; }
    });
    return Object.values(map).sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12)
      .map(m => ({ ...m, satisfaction: m.count > 0 ? +(m.total / m.count).toFixed(2) : 0 }));
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

  // Couverture réelle des fiches de séance notées (la courbe ne vaut que pour elles).
  const fichesNotees = suivis.filter(s => ficheSatisfaction(s) > 0);
  const binomesCouverts = new Set(fichesNotees.map(s => s.binome_id)).size;

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
        <p className="text-sm text-gray-500 mt-1">Bilan des binômes, candidatures et satisfaction déclarée — cohorte 1</p>
      </div>

      {/* Jugement sur les binômes : sentences d'expertise */}
      <ExpertiseSummary />

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
              <Bar dataKey="mentors" fill="#1e5631" stroke="#ffffff" strokeWidth={2} radius={[3,3,0,0]} />
              <Bar dataKey="mentores" fill="#3b82f6" stroke="#ffffff" strokeWidth={2} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Satisfaction déclarée dans les fiches de séance */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" /> Satisfaction déclarée dans les fiches de séance (sur 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fichesNotees.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Donnée non disponible.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={satisfactionParMois} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tickFormatter={formatMois} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={formatMois} formatter={(v, _n, item) => [`${v}/5 (${item.payload.count} fiche(s))`, 'Satisfaction']} />
                <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {fichesNotees.length} fiche(s) notée(s), saisies par {binomesCouverts} binôme(s) sur {binomes.length} seulement :
            cette courbe ne représente pas la cohorte. Note retenue : celle de l'auteur de la fiche.
          </p>
        </CardContent>
      </Card>

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