import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  Link2, 
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star
} from 'lucide-react';

export default function AdminStats({ stats }) {
  const statCards = [
    {
      title: "Mentors",
      value: stats.totalMentors,
      subtitle: `${stats.pendingMentors} en attente`,
      icon: UserCheck,
      color: "bg-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Mentorés",
      value: stats.totalMentores,
      subtitle: `${stats.pendingMentores} en attente`,
      icon: GraduationCap,
      color: "bg-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "Binômes Actifs",
      value: stats.activeBinomes,
      subtitle: "Relations en cours",
      icon: Link2,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Suivis Mensuels",
      value: stats.totalSuivis,
      subtitle: "Fiches soumises",
      icon: ClipboardList,
      color: "bg-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "Satisfaction Moyenne",
      value: `${stats.avgSatisfaction}/5`,
      subtitle: "Note globale",
      icon: Star,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Signalements",
      value: stats.issuesReported,
      subtitle: "Problèmes signalés",
      icon: AlertTriangle,
      color: stats.issuesReported > 0 ? "bg-red-500" : "bg-gray-500",
      bgColor: stats.issuesReported > 0 ? "bg-red-50" : "bg-gray-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Overview Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              État des Candidatures Mentors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">En attente</span>
                </div>
                <span className="font-semibold text-amber-600">{stats.pendingMentors}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Approuvés</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats.approvedMentors}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${stats.totalMentors > 0 ? (stats.approvedMentors / stats.totalMentors * 100) : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-500" />
              État des Candidatures Mentorés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">En attente</span>
                </div>
                <span className="font-semibold text-amber-600">{stats.pendingMentores}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Approuvés</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats.approvedMentores}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${stats.totalMentores > 0 ? (stats.approvedMentores / stats.totalMentores * 100) : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}