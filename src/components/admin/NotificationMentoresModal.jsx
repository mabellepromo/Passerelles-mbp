import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Send, Loader2, CheckCircle2, XCircle, Clock, GraduationCap,
  ChevronLeft, ChevronRight, AlertCircle, Mail,
} from 'lucide-react';

const PROGRAMME = 'PASSERELLES';
const SESSION   = 'Cohorte 1 \u2013 2026';
const LIEN_INFO = 'https://passerelles-mbp.vercel.app/GuideNavigation';

const DEFAULT_WAITLIST_SUBJECT =
  '{{programme}} \u2013 Votre candidature \u2013 Liste d\u2019attente';

const DEFAULT_WAITLIST_BODY =
`Ch\u00e8re/Cher {{prenom}} {{nom}},

Nous avons examin\u00e9 avec la plus grande attention votre candidature au {{programme}} \u2013 {{session}}.

Votre dossier a retenu toute l'attention du comit\u00e9 de s\u00e9lection. Les candidatures re\u00e7ues cette ann\u00e9e \u00e9taient d'un niveau particuli\u00e8rement \u00e9lev\u00e9, ce qui a rendu les d\u00e9cisions d'autant plus difficiles \u00e0 prendre.

Votre candidature a \u00e9t\u00e9 plac\u00e9e sur la liste d'attente.

Cela signifie concr\u00e8tement que votre dossier a \u00e9t\u00e9 jug\u00e9 solide, que vous \u00eates officiellement r\u00e9serviste pour la {{session}}, et qu'en cas de d\u00e9sistement d'un(e) participant(e) retenu(e), vous serez contact\u00e9(e) en priorit\u00e9. Votre candidature sera automatiquement reconsid\u00e9r\u00e9e pour la prochaine session, sans nouvelle d\u00e9marche de votre part.

Nous vous informerons de l'\u00e9volution de votre situation dans les meilleurs d\u00e9lais. En attendant, nous vous encourageons \u00e0 continuer \u00e0 vous investir dans votre parcours \u2014 c'est pr\u00e9cis\u00e9ment ce type d'engagement qui fait la force d'un candidat {{programme}}.

Avec nos encouragements sinc\u00e8res,
L'\u00e9quipe Ma Belle Promo
Programme {{programme}} \u00b7 {{session}}`;

const DEFAULT_REJECTED_SUBJECT =
  '{{programme}} \u2013 R\u00e9sultat de votre candidature';

const DEFAULT_REJECTED_BODY =
`Ch\u00e8re/Cher {{prenom}} {{nom}},

Nous tenons tout d'abord \u00e0 vous remercier sinc\u00e8rement pour l'int\u00e9r\u00eat que vous portez au {{programme}} et pour le temps consacr\u00e9 \u00e0 la pr\u00e9paration de votre candidature pour la {{session}}.

Apr\u00e8s d\u00e9lib\u00e9ration du comit\u00e9 de s\u00e9lection, nous avons le regret de vous informer que votre candidature n'a pas \u00e9t\u00e9 retenue pour cette session.

Cette d\u00e9cision ne remet en aucun cas en cause la valeur de votre parcours ni la qualit\u00e9 de votre dossier. Elle refl\u00e8te uniquement les contraintes li\u00e9es au nombre de places disponibles et aux \u00e9quilibres recherch\u00e9s au sein de la cohorte.

Nous vous invitons \u00e0 soumettre \u00e0 nouveau votre candidature lors de la prochaine session \u2014 votre profil sera examin\u00e9 avec la m\u00eame attention. Pour en savoir plus : {{lien_info}}

Nous restons convaincus que votre engagement et votre motivation constituent des atouts r\u00e9els pour votre avenir professionnel.

Avec nos sinc\u00e8res encouragements,
L'\u00e9quipe Ma Belle Promo
Programme {{programme}} \u00b7 {{session}}`;

const VARIABLES = ['{{prenom}}', '{{nom}}', '{{programme}}', '{{session}}', '{{lien_info}}'];

function fillPreview(template, mentore) {
  const nameParts = (mentore?.full_name || 'Exemple Nom').trim().split(' ');
  return template
    .replace(/\{\{prenom\}\}/g, nameParts[0] || '')
    .replace(/\{\{nom\}\}/g, nameParts.slice(1).join(' ') || '')
    .replace(/\{\{programme\}\}/g, PROGRAMME)
    .replace(/\{\{session\}\}/g, SESSION)
    .replace(/\{\{lien_info\}\}/g, LIEN_INFO);
}

export default function NotificationMentoresModal({ open, onClose, mentores = [] }) {
  const [step,        setStep]        = useState(1);
  const [type,        setType]        = useState('waitlist');
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject,     setSubject]     = useState(DEFAULT_WAITLIST_SUBJECT);
  const [body,        setBody]        = useState(DEFAULT_WAITLIST_BODY);
  const [sending,     setSending]     = useState(false);
  const [results,     setResults]     = useState(null);

  const filtered = useMemo(() =>
    mentores.filter(m => m.status === type),
    [mentores, type]
  );

  const handleTypeChange = (t) => {
    setType(t);
    setSelectedIds([]);
    setSubject(t === 'waitlist' ? DEFAULT_WAITLIST_SUBJECT : DEFAULT_REJECTED_SUBJECT);
    setBody(t === 'waitlist' ? DEFAULT_WAITLIST_BODY : DEFAULT_REJECTED_BODY);
  };

  const toggleAll = () =>
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(m => m.id));

  const toggle = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const insertVar = (v) => setBody(prev => prev + v);

  const handleSend = async () => {
    setSending(true);
    const recipients = mentores
      .filter(m => selectedIds.includes(m.id))
      .map(m => ({ full_name: m.full_name, email: m.email }));

    try {
      const token = await base44.auth.getAccessToken();
      const res = await fetch('/api/send-mentore-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipients,
          subject,
          body,
          programme: PROGRAMME,
          session: SESSION,
          lien_info: LIEN_INFO,
        }),
      });
      const data = await res.json();
      setResults(data);
      setStep(3);
    } catch (err) {
      setResults({ success: false, sent: 0, errors: [{ email: 'global', reason: err.message }] });
      setStep(3);
    }
    setSending(false);
  };

  const handleClose = () => {
    setStep(1);
    setType('waitlist');
    setSelectedIds([]);
    setSubject(DEFAULT_WAITLIST_SUBJECT);
    setBody(DEFAULT_WAITLIST_BODY);
    setSending(false);
    setResults(null);
    onClose();
  };

  const previewMentore = mentores.find(m => selectedIds.includes(m.id)) || filtered[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Notifier les mentor\u00e9s
            {step < 3 && (
              <span className="ml-auto text-xs font-normal text-gray-400">\u00c9tape {step} / 2</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ── \u00c9tape 1 : type + s\u00e9lection ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Tabs type */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => handleTypeChange('waitlist')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${type === 'waitlist' ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <Clock className="h-3.5 w-3.5" /> Liste d&apos;attente
              </button>
              <button
                onClick={() => handleTypeChange('rejected')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${type === 'rejected' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <XCircle className="h-3.5 w-3.5" /> Non retenus
              </button>
            </div>

            {/* S\u00e9lection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {filtered.length} mentor\u00e9{filtered.length > 1 ? 's' : ''} avec ce statut
                </span>
                {filtered.length > 0 && (
                  <button onClick={toggleAll} className="text-xs font-semibold text-emerald-700 hover:underline">
                    {selectedIds.length === filtered.length ? 'Tout d\u00e9s\u00e9lectionner' : 'Tout s\u00e9lectionner'}
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun mentor\u00e9 avec ce statut</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {filtered.map(m => (
                    <label key={m.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedIds.includes(m.id)}
                        onCheckedChange={() => toggle(m.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{m.level || ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                disabled={selectedIds.length === 0}
                onClick={() => setStep(2)}
                style={{ background: 'var(--brand-green)', color: 'white' }}
                className="gap-2">
                Suivant \u2014 R\u00e9diger l&apos;e-mail
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── \u00c9tape 2 : composition ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span><strong>{selectedIds.length}</strong> destinataire{selectedIds.length > 1 ? 's' : ''} s\u00e9lectionn\u00e9{selectedIds.length > 1 ? 's' : ''}</span>
            </div>

            {/* Variables */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Variables disponibles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(v => (
                  <button key={v} onClick={() => insertVar(v)}
                    className="text-xs px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-mono transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Objet */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Objet
              </label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            {/* Corps */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Corps du message
              </label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                className="font-mono text-xs resize-none"
              />
            </div>

            {/* Aper\u00e7u */}
            {previewMentore && (
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Aper\u00e7u \u2014 {previewMentore.full_name}
                </p>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  {fillPreview(subject, previewMentore)}
                </p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {fillPreview(body, previewMentore)}
                </pre>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Retour
              </Button>
              <Button
                disabled={sending || !subject.trim() || !body.trim()}
                onClick={handleSend}
                style={{ background: 'var(--brand-green)', color: 'white' }}
                className="gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Envoi en cours...' : `Envoyer ${selectedIds.length} e-mail${selectedIds.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}

        {/* ── \u00c9tape 3 : r\u00e9sultats ── */}
        {step === 3 && results && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: results.sent > 0 ? '#f0fdf4' : '#fef2f2' }}>
                {results.sent > 0
                  ? <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  : <AlertCircle className="h-7 w-7 text-red-500" />
                }
              </div>
              <p className="text-xl font-bold text-gray-800">{results.sent} e-mail{results.sent > 1 ? 's' : ''} envoy\u00e9{results.sent > 1 ? 's' : ''}</p>
              {results.errors?.length > 0 && (
                <p className="text-sm text-red-600 mt-1">{results.errors.length} \u00e9chec{results.errors.length > 1 ? 's' : ''}</p>
              )}
            </div>

            {results.errors?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">\u00c9checs</p>
                {results.errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-sm">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-800 font-medium">{e.email}</span>
                    <span className="text-red-500 text-xs">\u2014 {e.reason}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} style={{ background: 'var(--brand-green)', color: 'white' }}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
