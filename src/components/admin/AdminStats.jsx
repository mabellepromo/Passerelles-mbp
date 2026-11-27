import React from 'react';
import { UserCheck, GraduationCap, Mail, Users } from 'lucide-react';
import ExpertiseSummary from '@/components/admin/donnees/ExpertiseSummary';

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4" style={{ background: '#fafafa' }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-4 w-4" style={{ color: color || '#1a7a45' }} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: color || '#111827' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Page d'accueil de l'admin, volontairement allégée : compteurs, messages
// non lus et bilan d'expertise de la cohorte 1 (répartition des sentences).
// Les autres indicateurs du programme vivent dans la rubrique « Données & Bilan ».
export default function AdminStats({ stats, onOpenDonnees, onOpenExpertise }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Mentors" value={stats.totalMentors} sub={`${stats.pendingMentors} en attente`} icon={UserCheck} color="#2563eb" />
        <StatCard label="Mentorés" value={stats.totalMentores} sub={`${stats.pendingMentores} en attente`} icon={GraduationCap} color="#7c3aed" />
        <StatCard label="Messages non lus" value={stats.unreadContacts} sub="Formulaire de contact" icon={Mail} color={stats.unreadContacts > 0 ? '#dc2626' : '#6b7280'} />
        <StatCard label="Total candidatures" value={stats.totalMentors + stats.totalMentores} sub="Mentors + mentorés" icon={Users} color="#1a7a45" />
      </div>

      {/* Bilan d'expertise de la cohorte 1 (sentences par binôme) */}
      <ExpertiseSummary compact onOpen={onOpenExpertise} />

      {/* Renvoi vers la rubrique des indicateurs du programme */}
      <button
        onClick={onOpenDonnees}
        className="w-full text-left rounded-xl border border-emerald-100 bg-emerald-50 p-4 hover:bg-emerald-100 transition-colors"
      >
        <p className="text-sm font-semibold text-emerald-900">Indicateurs du programme et bilan</p>
        <p className="text-xs text-emerald-800 mt-0.5">
          Binômes, sondage, rapport de bilan : tout est regroupé dans la rubrique « Données & Bilan ».
        </p>
      </button>
    </div>
  );
}
