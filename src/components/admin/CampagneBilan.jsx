import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Send, Loader2, Mail, Users, CheckCircle2, Clock, Pause, Play,
  AlertTriangle, Search,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABEL = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'En pause', className: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Clôturée', className: 'bg-gray-200 text-gray-600' },
};

const EMAIL_TYPE_LABEL = {
  invitation: 'Invitation',
  reminder: 'Rappel',
  final_reminder: 'Dernier rappel',
  thank_you: 'Remerciement',
};

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function callSendEmail(action, body) {
  const headers = await authHeader();
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Échec de la requête');
  return data;
}

function nextRunLabel() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

export default function CampagneBilan() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [launching, setLaunching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { data: campaign, isLoading: loadingCampaign } = useQuery({
    queryKey: ['review_campaign_current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_campaigns').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ['review_campaign_participants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_campaign_participants').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: emailLog = [] } = useQuery({
    queryKey: ['review_email_log', campaign?.id],
    enabled: !!campaign?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('review_email_log').select('*').eq('campaign_id', campaign.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalParticipants = participants.length;
  const responded = participants.filter((p) => p.has_responded).length;
  const responseRate = totalParticipants ? Math.round((responded / totalParticipants) * 100) : 0;
  const invitationsSent = emailLog.filter((l) => l.email_type === 'invitation' && l.status === 'sent').length;
  const remindersSent = emailLog.filter((l) => (l.email_type === 'reminder' || l.email_type === 'final_reminder') && l.status === 'sent').length;
  const failedCount = emailLog.filter((l) => l.status === 'failed').length;

  const filteredParticipants = participants.filter((p) =>
    (p.participant_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.participant_email || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleTest() {
    if (!campaign) return;
    setTesting(true);
    try {
      const data = await callSendEmail('test_review_invitation', { campaign_id: campaign.id });
      toast.success(`Email de test envoyé à ${data.to}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  }

  async function handleLaunch() {
    if (!campaign) return;
    setLaunching(true);
    try {
      const data = await callSendEmail('launch_review_campaign', { campaign_id: campaign.id });
      toast.success(`Campagne lancée : ${data.sent} invitation(s) envoyée(s)${data.failed ? `, ${data.failed} échec(s)` : ''}.`);
      queryClient.invalidateQueries({ queryKey: ['review_campaign_current'] });
      queryClient.invalidateQueries({ queryKey: ['review_campaign_participants'] });
      queryClient.invalidateQueries({ queryKey: ['review_email_log'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLaunching(false);
    }
  }

  async function handleToggleStatus() {
    if (!campaign) return;
    const nextStatus = campaign.status === 'paused' ? 'active' : 'paused';
    setToggling(true);
    try {
      const { error } = await supabase.rpc('set_review_campaign_status', { p_campaign_id: campaign.id, p_status: nextStatus });
      if (error) throw error;
      toast.success(nextStatus === 'paused' ? 'Rappels suspendus.' : 'Rappels repris.');
      queryClient.invalidateQueries({ queryKey: ['review_campaign_current'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setToggling(false);
    }
  }

  if (loadingCampaign || loadingParticipants) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-sm text-gray-400">Aucune campagne configurée.</p>;
  }

  const status = STATUS_LABEL[campaign.status] || STATUS_LABEL.draft;

  return (
    <div className="space-y-6">
      {/* En-tête campagne */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-gray-900">{campaign.name}</h2>
            <Badge className={status.className}>{status.label}</Badge>
            {campaign.test_mode && <Badge variant="outline" className="text-amber-600 border-amber-200">Mode test actif</Badge>}
          </div>
          <p className="text-xs text-gray-500">
            Date limite : {new Date(campaign.deadline).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' })} (GMT)
            {campaign.launched_at && ` · Lancée le ${new Date(campaign.launched_at).toLocaleDateString('fr-FR')}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Envoyer un test
          </Button>
          {campaign.status === 'draft' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={launching}>
                  <Send className="h-4 w-4 mr-2" /> Lancer l'envoi
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Lancer la campagne ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {campaign.test_mode
                      ? `Le mode test est actif : une seule invitation sera envoyée à ${campaign.test_email}, aucun participant réel ne recevra d'email.`
                      : `${totalParticipants - responded} invitation(s) réelle(s) seront envoyées maintenant, puis des rappels automatiques tous les ${campaign.reminder_interval_days} jours jusqu'au ${new Date(campaign.deadline).toLocaleDateString('fr-FR')}.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLaunch} disabled={launching}>
                    {launching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <Button variant="outline" onClick={handleToggleStatus} disabled={toggling}>
              {toggling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : campaign.status === 'paused' ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
              {campaign.status === 'paused' ? 'Reprendre les rappels' : 'Suspendre les rappels'}
            </Button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-100 p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Invitations envoyées</p>
          <p className="text-2xl font-bold flex items-center gap-2"><Mail className="h-4 w-4 text-emerald-600" />{invitationsSent}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Taux de réponse</p>
          <p className="text-2xl font-bold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{responseRate}%</p>
          <p className="text-xs text-gray-400 mt-0.5">{responded}/{totalParticipants}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rappels envoyés</p>
          <p className="text-2xl font-bold flex items-center gap-2"><Users className="h-4 w-4 text-amber-600" />{remindersSent}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prochaine relance</p>
          <p className="text-sm font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" />{campaign.status === 'active' ? nextRunLabel() : '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Échecs d'envoi</p>
          <p className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />{failedCount}</p>
        </div>
      </div>

      {/* Liste des participants */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle className="text-base">Participants ({filteredParticipants.length})</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 pr-4">Participant</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Rappels reçus</th>
                  <th className="py-2 pr-4">Dernier email</th>
                  <th className="py-2 pr-4">Désinscrit</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((p) => (
                  <tr key={p.token_id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-800">{p.participant_name}</p>
                      <p className="text-xs text-gray-400">{p.role === 'mentor' ? 'Mentor' : 'Mentoré'} · {p.participant_email}</p>
                    </td>
                    <td className="py-2.5 pr-4">
                      {p.has_responded ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Répondu</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 border-gray-200">En attente</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">{p.reminders_sent}</td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">
                      {p.last_email_at ? `${EMAIL_TYPE_LABEL[p.last_email_type] || p.last_email_type} · ${new Date(p.last_email_at).toLocaleDateString('fr-FR')}` : '—'}
                    </td>
                    <td className="py-2.5 pr-4">{p.reminders_optout ? <Badge variant="outline" className="text-gray-400">Oui</Badge> : '—'}</td>
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
