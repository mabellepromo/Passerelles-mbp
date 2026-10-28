import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck,
  GraduationCap,
  Link2,
  ClipboardList,
  Star,
  AlertTriangle,
  Mail,
  Users,
} from 'lucide-react';

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

export default function AdminStats({ stats }) {
  const candidatureRows = [
    {
      label: 'Mentors',
      total: stats.totalMentors,
      pending: stats.pendingMentors,
      approved: stats.approvedMentors,
    },
    {
      label: 'Mentorés',
      total: stats.totalMentores,
      pending: stats.pendingMentores,
      approved: stats.approvedMentores,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Mentors" value={stats.totalMentors} sub={`${stats.pendingMentors} en attente`} icon={UserCheck} color="#2563eb" />
        <StatCard label="Mentorés" value={stats.totalMentores} sub={`${stats.pendingMentores} en attente`} icon={GraduationCap} color="#7c3aed" />
        <StatCard label="Binômes actifs" value={stats.activeBinomes} sub={`sur ${stats.totalBinomes} total`} icon={Link2} color="#059669" />
        <StatCard label="Suivis mensuels" value={stats.totalSuivis} sub="Fiches soumises" icon={ClipboardList} color="#d97706" />
        <StatCard label="Satisfaction moyenne" value={`${stats.avgSatisfaction}/5`} sub="Note globale" icon={Star} color="#ca8a04" />
        <StatCard label="Signalements" value={stats.issuesReported} sub="Problèmes signalés" icon={AlertTriangle} color={stats.issuesReported > 0 ? '#dc2626' : '#6b7280'} />
        <StatCard label="Messages non lus" value={stats.unreadContacts} sub="Formulaire de contact" icon={Mail} color={stats.unreadContacts > 0 ? '#dc2626' : '#6b7280'} />
        <StatCard label="Total participants" value={stats.totalMentors + stats.totalMentores} sub="Mentors + mentorés" icon={Users} color="#1a7a45" />
      </div>

      {/* Candidatures */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">État des candidatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Catégorie</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">En attente</th>
                  <th className="py-2 pr-4">Approuvés</th>
                  <th className="py-2 pr-4">Progression</th>
                </tr>
              </thead>
              <tbody>
                {candidatureRows.map(row => (
                  <tr key={row.label} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{row.label}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{row.total}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="text-amber-600 border-amber-200">{row.pending}</Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{row.approved}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 w-40">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${row.total > 0 ? (row.approved / row.total * 100) : 0}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
