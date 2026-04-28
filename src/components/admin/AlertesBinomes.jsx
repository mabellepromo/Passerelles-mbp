import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, Mail, CheckCircle2, Clock, Loader2, Send,
  Users, FileX, MessageSquareOff, Bell, Info
} from 'lucide-react';

const SEUIL_JOURS = 30;
const SEUIL_FICHE = 30; // jours sans fiche de suivi = alerte

function buildEmailBody(type, { nom, partner, binomeName, daysSince, totalSuivis }) {
  const salutation = `Bonjour ${nom},`;
  const signature = `\n\nCordialement,\nL'équipe Ma Belle Promo\ncontact@mabellepromo.org | +228 96 09 07 07\n\n---\nCe message est automatique. Ne répondez pas directement à cet e-mail.`;

  if (type === 'no_suivi') {
    return `${salutation}

Nous espérons que votre parcours dans le programme PASSERELLES se passe bien !

Nous avons remarqué qu'aucune fiche de suivi mensuel n'a encore été enregistrée pour votre binôme avec ${partner}.

Les fiches de suivi sont essentielles pour :
• Documenter vos échanges et progrès
• Suivre l'évolution de vos objectifs SMART
• Permettre à l'équipe MBP d'assurer un accompagnement de qualité

👉 Connectez-vous dès maintenant sur la plateforme PASSERELLES pour créer votre première fiche de suivi.

Si vous rencontrez des difficultés techniques ou avez des questions, n'hésitez pas à nous contacter.${signature}`;
  }

  if (type === 'inactive') {
    return `${salutation}

Nous espérons que tout se passe bien pour vous et votre binôme avec ${partner}.

Nous avons constaté qu'aucune interaction n'a été enregistrée depuis ${daysSince} jours (vous avez réalisé ${totalSuivis} séance${totalSuivis !== 1 ? 's' : ''} au total).

Le programme PASSERELLES recommande au minimum une rencontre par mois (2h). Une présence régulière est essentielle pour atteindre vos objectifs communs.

Si vous traversez une période difficile ou si des obstacles empêchent vos rencontres, l'équipe MBP est là pour vous aider. Contactez-nous en toute confidentialité.

👉 Connectez-vous sur la plateforme pour enregistrer votre prochain suivi ou nous contacter.${signature}`;
  }

  return '';
}

function buildEmailSubject(type) {
  if (type === 'no_suivi') return '📋 Action requise : Votre première fiche de suivi PASSERELLES';
  if (type === 'inactive') return `⏰ Programme PASSERELLES — Vos rencontres nous manquent !`;
  return 'Programme PASSERELLES — Rappel';
}

export default function AlertesBinomes() {
  const [sentLog, setSentLog] = useState({}); // { [binomeId]: { type, date, count } }
  const [sendingId, setSendingId] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [activeTab, setActiveTab] = useState('alertes');

  const { data: binomes = [] } = useQuery({
    queryKey: ['binomes-alertes'],
    queryFn: () => base44.entities.Binome.filter({ status: 'active' })
  });

  const { data: suivis = [] } = useQuery({
    queryKey: ['suivis-alertes'],
    queryFn: () => base44.entities.SuiviMensuel.list('-meeting_date', 500)
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages-alertes'],
    queryFn: () => base44.entities.Message.list('-created_date', 200)
  });

  // Calcul des alertes pour chaque binôme
  const binomesAnalyses = binomes.map(b => {
    const binomeSuivis = suivis.filter(s => s.binome_id === b.id);
    const binomeMessages = messages.filter(m => m.binome_id === b.id);
    const lastSuivi = binomeSuivis[0];
    const lastMessage = binomeMessages[0];

    const daysSinceSuivi = lastSuivi
      ? Math.floor((new Date() - new Date(lastSuivi.meeting_date)) / 86400000)
      : null;

    const daysSinceMessage = lastMessage
      ? Math.floor((new Date() - new Date(lastMessage.created_date)) / 86400000)
      : null;

    // Calcul de la dernière activité (suivi ou message)
    const dates = [lastSuivi?.meeting_date, lastMessage?.created_date].filter(Boolean);
    const lastActivityDate = dates.length ? dates.sort().reverse()[0] : null;
    const daysSinceActivity = lastActivityDate
      ? Math.floor((new Date() - new Date(lastActivityDate)) / 86400000)
      : null;

    const alertType = binomeSuivis.length === 0
      ? 'no_suivi'
      : daysSinceSuivi > SEUIL_FICHE
        ? 'inactive'
        : null;

    return {
      ...b,
      lastSuivi,
      daysSinceSuivi,
      daysSinceActivity,
      daysSinceMessage,
      totalSuivis: binomeSuivis.length,
      totalMessages: binomeMessages.length,
      alertType,
    };
  });

  const alertBinomes = binomesAnalyses.filter(b => b.alertType !== null);
  const okBinomes = binomesAnalyses.filter(b => b.alertType === null);
  const noSuiviCount = alertBinomes.filter(b => b.alertType === 'no_suivi').length;
  const inactiveCount = alertBinomes.filter(b => b.alertType === 'inactive').length;

  const sendReminderEmails = async (binome) => {
    const type = binome.alertType;
    const pairs = [
      { email: binome.mentor_email, nom: binome.mentor_name, partner: binome.mentore_name },
      { email: binome.mentore_email, nom: binome.mentore_name, partner: binome.mentor_name }
    ].filter(p => p.email);

    for (const p of pairs) {
      await base44.integrations.Core.SendEmail({
        to: p.email,
        subject: buildEmailSubject(type),
        body: buildEmailBody(type, {
          nom: p.nom,
          partner: p.partner,
          daysSince: binome.daysSinceSuivi,
          totalSuivis: binome.totalSuivis,
        })
      });
    }

    setSentLog(prev => ({
      ...prev,
      [binome.id]: {
        type,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        recipients: pairs.length
      }
    }));
  };

  const handleSendOne = async (binome) => {
    setSendingId(binome.id);
    try {
      await sendReminderEmails(binome);
    } catch (err) {
      alert(`Erreur lors de l'envoi : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setSendingId(null);
    }
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    try {
      for (const b of alertBinomes) {
        if (!sentLog[b.id]) await sendReminderEmails(b);
      }
    } catch (err) {
      alert(`Erreur lors de l'envoi : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setSendingAll(false);
    }
  };

  const AlertRow = ({ b }) => {
    const isSent = !!sentLog[b.id];
    const isSending = sendingId === b.id;
    return (
      <div className={`flex items-center gap-4 p-4 rounded-xl border flex-wrap
        ${b.alertType === 'no_suivi' ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'}`}>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-gray-900">{b.mentor_name} ↔ {b.mentore_name}</p>
            <Badge className={`text-xs border-0 ${b.alertType === 'no_suivi' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
              {b.alertType === 'no_suivi' ? '📋 Aucune fiche' : `⏰ ${b.daysSinceSuivi}j sans suivi`}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="h-3 w-3 flex-shrink-0" />
            {b.alertType === 'no_suivi'
              ? 'Aucune fiche de suivi enregistrée depuis l\'appariement'
              : `Dernier suivi il y a ${b.daysSinceSuivi} jours · ${b.totalSuivis} séance${b.totalSuivis !== 1 ? 's' : ''} au total`}
          </p>
          {b.daysSinceMessage !== null && (
            <p className="text-xs text-gray-400">Dernier message il y a {b.daysSinceMessage}j</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSent ? (
            <div className="text-right">
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Envoyé
              </Badge>
              <p className="text-xs text-gray-400 mt-0.5">{sentLog[b.id].date} · {sentLog[b.id].recipients} destinataire{sentLog[b.id].recipients > 1 ? 's' : ''}</p>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className={`gap-1 text-xs ${b.alertType === 'no_suivi' ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
              disabled={isSending}
              onClick={() => handleSendOne(b)}>
              {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
              Envoyer rappel
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileX className="h-8 w-8 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{noSuiviCount}</p>
              <p className="text-xs text-gray-600 font-medium">Sans aucune fiche</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <MessageSquareOff className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
              <p className="text-xs text-gray-600 font-medium">Inactifs +{SEUIL_JOURS}j</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{okBinomes.length}</p>
              <p className="text-xs text-gray-600 font-medium">Binômes à jour</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{binomes.length}</p>
              <p className="text-xs text-gray-600 font-medium">Total actifs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info seuil */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
        <p>Les alertes se déclenchent si un binôme n'a <strong>aucune fiche de suivi</strong>, ou si le <strong>dernier suivi date de plus de {SEUIL_JOURS} jours</strong>. Les e-mails sont personnalisés selon le type d'alerte et envoyés aux deux membres du binôme.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="alertes" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertes ({alertBinomes.length})
          </TabsTrigger>
          <TabsTrigger value="ok" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            À jour ({okBinomes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alertes" className="mt-4 space-y-4">
          {alertBinomes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20 text-emerald-500" />
              <p className="font-medium">Tous les binômes sont à jour !</p>
              <p className="text-sm mt-1">Aucune alerte pour le moment.</p>
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    {alertBinomes.length} binôme{alertBinomes.length > 1 ? 's' : ''} nécessitant un rappel
                  </CardTitle>
                  <CardDescription>{Object.keys(sentLog).length} rappel{Object.keys(sentLog).length > 1 ? 's' : ''} envoyé{Object.keys(sentLog).length > 1 ? 's' : ''} cette session</CardDescription>
                </div>
                <Button
                  onClick={handleSendAll}
                  disabled={sendingAll || alertBinomes.every(b => sentLog[b.id])}
                  className="bg-[#1e5631] hover:bg-[#2d7a47] gap-2"
                  size="sm">
                  {sendingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer tous les rappels
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {alertBinomes.map(b => <AlertRow key={b.id} b={b} />)}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ok" className="mt-4">
          {okBinomes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Aucun binôme à jour pour le moment.</p>
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 space-y-2">
                {okBinomes.map(b => (
                  <div key={b.id} className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{b.mentor_name} ↔ {b.mentore_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Dernier suivi il y a {b.daysSinceSuivi}j · {b.totalSuivis} séance{b.totalSuivis !== 1 ? 's' : ''}
                        {b.totalMessages > 0 && ` · ${b.totalMessages} message${b.totalMessages !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">✓ Actif</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}