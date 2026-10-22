import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, TrendingUp, Users, MessageSquareQuote, Eye, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const QUOTE_CONSENT_LABEL = {
  none: 'Pas de citation',
  first_name: 'Citation (prénom)',
  full_name: 'Citation (nom complet)',
};

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

function NpsBadge({ score }) {
  if (score === null || score === undefined) return <span className="text-xs text-gray-300">—</span>;
  const color = score >= 9 ? '#059669' : score >= 7 ? '#d97706' : '#dc2626';
  return <span className="text-sm font-bold" style={{ color }}>{score}/10</span>;
}

// Un binôme est "à risque" si un des deux NPS est bas, ou si l'écart de
// perception entre mentor et mentoré est important.
function isPairAtRisk(pair) {
  const { mentor_nps, mentore_nps } = pair;
  if (mentor_nps !== null && mentor_nps <= 6) return true;
  if (mentore_nps !== null && mentore_nps <= 6) return true;
  if (mentor_nps !== null && mentore_nps !== null && Math.abs(mentor_nps - mentore_nps) >= 4) return true;
  return false;
}

export default function BilanReview() {
  const [search, setSearch] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const deleteResponse = async (responseId) => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('admin_delete_review_response', { p_response_id: responseId });
      if (error) throw error;
      toast.success('Réponse supprimée.');
      setSelectedResponse(null);
      queryClient.invalidateQueries({ queryKey: ['review_by_participant'] });
      queryClient.invalidateQueries({ queryKey: ['review_pair_comparison'] });
      queryClient.invalidateQueries({ queryKey: ['review_global_stats'] });
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const { data: globalStats = [], isLoading: loadingStats } = useQuery({
    queryKey: ['review_global_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_global_stats').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pairs = [], isLoading: loadingPairs } = useQuery({
    queryKey: ['review_pair_comparison'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_pair_comparison').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: responses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ['review_by_participant'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_by_participant').select('*').order('submitted_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const mentorStats = globalStats.find(s => s.role === 'mentor');
  const mentoreStats = globalStats.find(s => s.role === 'mentore');
  const pairsAtRisk = pairs.filter(isPairAtRisk);

  const filteredResponses = responses.filter(r =>
    (r.participant_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.mentor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.mentore_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = loadingStats || loadingPairs || loadingResponses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Taux de réponse mentors"
          value={`${mentorStats?.response_rate_pct ?? 0}%`}
          sub={`${mentorStats?.total_responses ?? 0} / ${mentorStats?.total_tokens ?? 0}`}
          icon={Users}
        />
        <StatCard
          label="Taux de réponse mentorés"
          value={`${mentoreStats?.response_rate_pct ?? 0}%`}
          sub={`${mentoreStats?.total_responses ?? 0} / ${mentoreStats?.total_tokens ?? 0}`}
          icon={Users}
          color="#7c3aed"
        />
        <StatCard
          label="NPS moyen mentors"
          value={mentorStats?.avg_nps ?? '—'}
          sub={`NPS score ${mentorStats?.nps_score_pct ?? 0}%`}
          icon={TrendingUp}
          color="#d97706"
        />
        <StatCard
          label="NPS moyen mentorés"
          value={mentoreStats?.avg_nps ?? '—'}
          sub={`NPS score ${mentoreStats?.nps_score_pct ?? 0}%`}
          icon={TrendingUp}
          color="#d97706"
        />
      </div>

      {/* Binômes à risque */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Binômes à surveiller ({pairsAtRisk.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pairsAtRisk.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun binôme signalé à risque pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {pairsAtRisk.map(pair => (
                <div key={pair.binome_id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-red-100 bg-red-50/50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {pair.mentor_name} <span className="text-gray-400">↔</span> {pair.mentore_name}
                    </p>
                    <p className="text-xs text-gray-400">Cohorte {pair.cohorte}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Mentor</p>
                      <NpsBadge score={pair.mentor_nps} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Mentoré</p>
                      <NpsBadge score={pair.mentore_nps} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparaison par binôme */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Comparaison mentor / mentoré par binôme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Binôme</th>
                  <th className="py-2 pr-4">NPS mentor</th>
                  <th className="py-2 pr-4">NPS mentoré</th>
                  <th className="py-2 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map(pair => (
                  <tr key={pair.binome_id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-800">{pair.mentor_name}</p>
                      <p className="text-xs text-gray-400">{pair.mentore_name}</p>
                    </td>
                    <td className="py-2.5 pr-4"><NpsBadge score={pair.mentor_nps} /></td>
                    <td className="py-2.5 pr-4"><NpsBadge score={pair.mentore_nps} /></td>
                    <td className="py-2.5 pr-4">
                      {pair.mentor_nps === null && pair.mentore_nps === null ? (
                        <Badge variant="outline" className="text-gray-400 border-gray-200">En attente</Badge>
                      ) : isPairAtRisk(pair) ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">À surveiller</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Réponses individuelles */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle className="text-base">Réponses individuelles ({filteredResponses.length})</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher un participant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResponses.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune réponse pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {filteredResponses.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResponse(r)}
                  className="w-full flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.participant_name}</p>
                    <p className="text-xs text-gray-400">{r.role === 'mentor' ? 'Mentor' : 'Mentoré'} · {new Date(r.submitted_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {r.quote_consent !== 'none' && (
                      <MessageSquareQuote className="h-3.5 w-3.5 text-amber-500" title={QUOTE_CONSENT_LABEL[r.quote_consent]} />
                    )}
                    <NpsBadge score={r.nps_score} />
                    <Eye className="h-3.5 w-3.5 text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détail d'une réponse */}
      <Dialog open={!!selectedResponse} onOpenChange={(open) => !open && setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedResponse && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedResponse.participant_name} — {selectedResponse.role === 'mentor' ? 'Mentor' : 'Mentoré'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">NPS :</span> <NpsBadge score={selectedResponse.nps_score} />
                  <Badge variant="outline">{QUOTE_CONSENT_LABEL[selectedResponse.quote_consent]}</Badge>
                </div>
                <div className="space-y-2">
                  {Object.entries(selectedResponse.answers || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-50 pb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{key}</p>
                      <p className="text-sm text-gray-700">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer cette réponse
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette réponse ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          La réponse de {selectedResponse.participant_name} sera définitivement supprimée.
                          Son lien de bilan redeviendra utilisable pour une nouvelle soumission.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteResponse(selectedResponse.id)}
                          disabled={deleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
