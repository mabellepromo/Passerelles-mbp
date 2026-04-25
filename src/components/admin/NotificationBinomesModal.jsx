import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, CheckCircle2, Users, UserCheck, GraduationCap, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatName } from '@/lib/formatName';

const DEFAULT_MENTOR_SUBJECT = '🎉 Votre binôme PASSERELLES est formé !';
const DEFAULT_MENTOR_BODY = `Bonjour {{mentor_name}},

C'est avec un grand enthousiasme que nous vous annonçons le lancement de votre mentorat ! Vous avez été officiellement apparié(e) avec {{mentore_name}} pour cette édition du programme PASSERELLES.

Votre score de compatibilité de {{match_score}}% promet des échanges riches et une belle synergie pour la suite.

🚀 Prêt(e) pour le décollage ?
Pour bien démarrer et prendre en main vos outils de bord, nous vous invitons à suivre ces deux étapes :

Équipement : Consultez votre guide de navigation pour découvrir votre boîte à outils :
👉 https://passerelles.base44.app/GuideNavigation

Rencontre : Connectez-vous dès maintenant à votre espace personnel pour découvrir le profil de votre mentoré(e) et initier le premier contact :
👉 https://passerelles.base44.app/MonEspace

Nous sommes impatients de vous voir évoluer au sein de cette nouvelle aventure humaine et professionnelle.

Belle découverte et à très bientôt,

L'équipe Ma Belle Promo
Programme PASSERELLES`;

const DEFAULT_MENTORE_SUBJECT = '🚀 Votre mentorat PASSERELLES commence !';
const DEFAULT_MENTORE_BODY = `Bonjour {{mentore_name}},

C'est avec un grand enthousiasme que nous vous annonçons le lancement de votre mentorat ! Vous avez été officiellement apparié(e) avec {{mentor_name}} pour cette édition du programme PASSERELLES.

Votre score de compatibilité de {{match_score}}% promet des échanges riches et une belle synergie pour la suite.

🚀 Prêt(e) pour le décollage ?
Pour bien démarrer et prendre en main vos outils de bord, nous vous invitons à suivre ces deux étapes :

Équipement : Consultez votre guide de navigation pour découvrir votre boîte à outils :
👉 https://passerelles.base44.app/GuideNavigation

Rencontre : Connectez-vous dès maintenant à votre espace personnel pour découvrir le profil de votre mentor et initier le premier contact :
👉 https://passerelles.base44.app/MonEspace

Nous sommes impatients de vous voir évoluer au sein de cette nouvelle aventure humaine et professionnelle.

Belle découverte et à très bientôt,

L'équipe Ma Belle Promo
Programme PASSERELLES`;

function fillTemplate(template, binome) {
  return template
    .replace(/\{\{mentor_name\}\}/g, binome.mentor_name || '')
    .replace(/\{\{mentore_name\}\}/g, binome.mentore_name || '')
    .replace(/\{\{match_score\}\}/g, binome.match_score || '—')
    .replace(/\{\{match_date\}\}/g, binome.match_date || '—')
    .replace(/\{\{mentor_email\}\}/g, binome.mentor_email || '')
    .replace(/\{\{mentore_email\}\}/g, binome.mentore_email || '');
}

function textToHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n\n')
    .map(para => `<p style="margin:0 0 16px 0;line-height:1.6;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function StepSelection({ activeBinomes, selectedIds, setSelectedIds, onNext, onClose }) {
  const allSelected = selectedIds.size === activeBinomes.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(activeBinomes.map(b => b.id)));
  };

  const toggle = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-gray-800">{selectedIds.size}</span> / {activeBinomes.length} binômes sélectionnés
        </p>
        <button onClick={toggleAll} className="text-xs font-semibold text-emerald-700 hover:underline">
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {activeBinomes.map((b) => {
          const checked = selectedIds.has(b.id);
          return (
            <div
              key={b.id}
              onClick={() => toggle(b.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                checked ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                checked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
              }`}>
                {checked && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Mentor</span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{formatName(b.mentor_name)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Mentoré</span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{formatName(b.mentore_name)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{b.mentor_email} · {b.mentore_email}</p>
              </div>
              {b.match_score && (
                <span className="text-xs font-bold text-gray-400 flex-shrink-0">{b.match_score}/100</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button
          onClick={onNext}
          disabled={selectedIds.size === 0}
          className="gap-2"
          style={{ background: 'var(--brand-green)', color: 'white' }}>
          Suivant — Rédiger l'email
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepCompose({ selectedBinomes, onBack, onClose, onDone }) {
  const [tab, setTab] = useState('mentor');
  const [mentorSubject, setMentorSubject] = useState(DEFAULT_MENTOR_SUBJECT);
  const [mentorBody, setMentorBody] = useState(DEFAULT_MENTOR_BODY);
  const [mentoreSubject, setMentoreSubject] = useState(DEFAULT_MENTORE_SUBJECT);
  const [mentoreBody, setMentoreBody] = useState(DEFAULT_MENTORE_BODY);
  const [sending, setSending] = useState(false);

  const variables = ['{{mentor_name}}', '{{mentore_name}}', '{{match_score}}', '{{match_date}}', '{{mentor_email}}', '{{mentore_email}}'];

  const handleSend = async () => {
    if (!window.confirm(`Envoyer les emails à ${selectedBinomes.length * 2} participants (${selectedBinomes.length} mentors + ${selectedBinomes.length} mentorés) ?`)) return;
    setSending(true);
    let count = 0;
    for (const b of selectedBinomes) {
      if (b.mentor_email) {
        await base44.integrations.Core.SendEmail({
          to: b.mentor_email,
          subject: fillTemplate(mentorSubject, b),
          body: textToHtml(fillTemplate(mentorBody, b)),
        }).catch(() => {});
        count++;
      }
      if (b.mentore_email) {
        await base44.integrations.Core.SendEmail({
          to: b.mentore_email,
          subject: fillTemplate(mentoreSubject, b),
          body: textToHtml(fillTemplate(mentoreBody, b)),
        }).catch(() => {});
        count++;
      }
    }
    setSending(false);
    onDone(count);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
        <Users className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span className="text-emerald-800 font-medium">
          {selectedBinomes.length} binômes sélectionnés → {selectedBinomes.length * 2} emails au total
        </span>
      </div>

      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1.5">Variables disponibles :</p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map(v => (
                <code key={v} className="text-[11px] bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-mono">{v}</code>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setTab('mentor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === 'mentor' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
          <UserCheck className="h-3.5 w-3.5" /> Email Mentor
        </button>
        <button
          onClick={() => setTab('mentore')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === 'mentore' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
          <GraduationCap className="h-3.5 w-3.5" /> Email Mentoré
        </button>
      </div>

      {tab === 'mentor' ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Objet</label>
            <Input value={mentorSubject} onChange={e => setMentorSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Corps du message</label>
            <Textarea value={mentorBody} onChange={e => setMentorBody(e.target.value)} rows={12} className="font-mono text-sm resize-y" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Objet</label>
            <Input value={mentoreSubject} onChange={e => setMentoreSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Corps du message</label>
            <Textarea value={mentoreBody} onChange={e => setMentoreBody(e.target.value)} rows={12} className="font-mono text-sm resize-y" />
          </div>
        </div>
      )}

      {selectedBinomes.length > 0 && (
        <details className="border border-gray-200 rounded-xl overflow-hidden">
          <summary className="px-4 py-2.5 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none">
            Aperçu — {formatName(selectedBinomes[0].mentor_name)} ↔ {formatName(selectedBinomes[0].mentore_name)}
          </summary>
          <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold text-emerald-700 mb-1 uppercase tracking-wide">Email Mentor</p>
              <p className="font-semibold text-gray-800">{fillTemplate(mentorSubject, selectedBinomes[0])}</p>
              <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap font-sans">{fillTemplate(mentorBody, selectedBinomes[0])}</pre>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-bold text-purple-700 mb-1 uppercase tracking-wide">Email Mentoré</p>
              <p className="font-semibold text-gray-800">{fillTemplate(mentoreSubject, selectedBinomes[0])}</p>
              <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap font-sans">{fillTemplate(mentoreBody, selectedBinomes[0])}</pre>
            </div>
          </div>
        </details>
      )}

      <div className="flex justify-between gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onBack} disabled={sending} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Retour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>Annuler</Button>
          <Button
            onClick={handleSend}
            disabled={sending}
            className="gap-2"
            style={{ background: 'var(--brand-green)', color: 'white' }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Envoi en cours...' : `Envoyer ${selectedBinomes.length * 2} emails`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationBinomesModal({ open, onClose, binomes }) {
  const activeBinomes = binomes.filter(b => b.status === 'active');

  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set(activeBinomes.map(b => b.id)));
  const [sentCount, setSentCount] = useState(0);

  const selectedBinomes = activeBinomes.filter(b => selectedIds.has(b.id));

  const handleClose = () => {
    setStep(1);
    setSelectedIds(new Set(activeBinomes.map(b => b.id)));
    setSentCount(0);
    onClose();
  };

  const handleDone = (count) => {
    setSentCount(count);
    setStep(3);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-600" />
            Notifier les binômes par email
            {step < 3 && (
              <span className="ml-auto text-xs font-normal text-gray-400">Étape {step} / 2</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 3 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">{sentCount} emails envoyés !</p>
            <p className="text-sm text-gray-500">Tous les participants sélectionnés ont été notifiés.</p>
            <Button onClick={handleClose} className="mt-4" style={{ background: 'var(--brand-green)', color: 'white' }}>Fermer</Button>
          </div>
        ) : step === 1 ? (
          <StepSelection
            activeBinomes={activeBinomes}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onNext={() => setStep(2)}
            onClose={handleClose}
          />
        ) : (
          <StepCompose
            selectedBinomes={selectedBinomes}
            onBack={() => setStep(1)}
            onClose={handleClose}
            onDone={handleDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}