import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44, supabase } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Send, Loader2, CheckCircle2, XCircle, Search,
  UserCheck, GraduationCap, Users, ChevronRight, ChevronLeft, Info,
  Paperclip, Trash2, FileIcon,
} from 'lucide-react';

const MAX_MB   = 4;
const toBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload  = () => resolve(r.result.split(',')[1]);
  r.onerror = reject;
  r.readAsDataURL(file);
});
const fmtSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`;

const VARIABLES = ['{{prenom}}', '{{nom}}', '{{email}}'];

function fillTemplate(tpl, person) {
  const parts = (person.full_name || '').trim().split(' ');
  return tpl
    .replace(/\{\{prenom\}\}/g, parts[0] || '')
    .replace(/\{\{nom\}\}/g,    parts.slice(1).join(' ') || '')
    .replace(/\{\{email\}\}/g,  person.email || '');
}

function textToHtml(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .split('\n\n')
    .map(p => `<p style="margin:0 0 14px;line-height:1.7;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export default function EnvoiEmailLibre() {
  const [step,        setStep]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('tous');
  const [selected,    setSelected]    = useState(new Set());
  const [subject,     setSubject]     = useState('');
  const [body,        setBody]        = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sizeWarn,    setSizeWarn]    = useState('');
  const [sending,     setSending]     = useState(false);
  const [results,     setResults]     = useState(null);
  const fileRef = useRef();

  const { data: mentors  = [] } = useQuery({ queryKey: ['mentors-email'],  queryFn: () => base44.entities.Mentor.list()  });
  const { data: mentores = [] } = useQuery({ queryKey: ['mentores-email'], queryFn: () => base44.entities.Mentore.list() });

  const allParticipants = useMemo(() => [
    ...mentors .map(m => ({ ...m, _role: 'mentor'  })),
    ...mentores.map(m => ({ ...m, _role: 'mentore' })),
  ], [mentors, mentores]);

  const filtered = useMemo(() => {
    let list = allParticipants;
    if (filter !== 'tous') list = list.filter(p => p._role === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email     || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allParticipants, filter, search]);

  const toggle     = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll  = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  const allChecked = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  const selectedPeople = allParticipants.filter(p => selected.has(p.id));
  const preview        = selectedPeople[0];

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    const list  = [...attachments];
    let warn = '';
    for (const file of files) {
      const totalBytes = [...list, file].reduce((s, a) => s + (a.size || 0), 0);
      if (totalBytes > MAX_MB * 1024 * 1024) { warn = `Taille totale limitée à ${MAX_MB} Mo`; break; }
      const content = await toBase64(file);
      list.push({ name: file.name, content, size: file.size });
    }
    setSizeWarn(warn);
    setAttachments(list);
    e.target.value = '';
  };

  const removeAttachment = (i) => {
    const next = attachments.filter((_, idx) => idx !== i);
    setAttachments(next);
    if (next.reduce((s, a) => s + a.size, 0) <= MAX_MB * 1024 * 1024) setSizeWarn('');
  };

  const handleSend = async () => {
    setSending(true);
    const token = await base44.auth.getAccessToken();
    const sent = [], errors = [];
    const brevoAttachments = attachments.map(a => ({ name: a.name, content: a.content }));
    for (const person of selectedPeople) {
      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            to:          person.email,
            subject:     fillTemplate(subject, person),
            html:        textToHtml(fillTemplate(body, person)),
            attachments: brevoAttachments,
          }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erreur');
        sent.push(person.email);
      } catch (e) {
        errors.push({ email: person.email, reason: e.message });
      }
    }
    setResults({ sent, errors });
    setSending(false);
    setStep(3);
  };

  const reset = () => {
    setStep(1); setSearch(''); setFilter('tous'); setSelected(new Set());
    setSubject(''); setBody(''); setAttachments([]); setSizeWarn(''); setResults(null);
  };

  const ROLE_COLORS = {
    mentor:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Mentor' },
    mentore: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  label: 'Mentoré(e)' },
  };

  /* ── Étape 1 : Sélection ── */
  if (step === 1) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">{selected.size}</span> destinataire{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
          <span className="mx-2 text-gray-300">·</span>
          {allParticipants.length} participants au total
        </p>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
            Tout désélectionner
          </button>
        )}
      </div>

      {/* Filtres + recherche */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl flex-shrink-0">
          {[
            { key: 'tous',    label: 'Tous',          icon: Users },
            { key: 'mentor',  label: 'Mentors',       icon: UserCheck },
            { key: 'mentore', label: 'Mentorés',      icon: GraduationCap },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === key ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="pl-8 text-sm h-9"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-100">
          <div
            onClick={toggleAll}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${
              allChecked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 hover:border-emerald-400'
            }`}>
            {allChecked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
          {filtered.length > 0 && (
            <button onClick={toggleAll} className="ml-auto text-xs text-emerald-700 font-semibold hover:underline">
              {allChecked ? 'Désélectionner' : 'Sélectionner tout'}
            </button>
          )}
        </div>

        {/* Lignes */}
        <div className="max-h-[52vh] overflow-y-auto divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Aucun résultat</div>
          ) : filtered.map(person => {
            const c = ROLE_COLORS[person._role];
            const checked = selected.has(person.id);
            return (
              <div key={person.id} onClick={() => toggle(person.id)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  checked ? 'bg-emerald-50/60' : 'hover:bg-gray-50'
                }`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  checked ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                }`}>
                  {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.bg} ${c.text}`}>
                  {(person.full_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{person.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{person.email}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${c.bg} ${c.text} ${c.border}`}>
                  {c.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          disabled={selected.size === 0}
          onClick={() => setStep(2)}
          className="gap-2"
          style={{ background: 'var(--brand-green)', color: 'white' }}>
          Suivant — Rédiger l'email
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  /* ── Étape 2 : Rédaction ── */
  if (step === 2) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
        <Send className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span className="text-emerald-800 font-medium">
          {selectedPeople.length} destinataire{selectedPeople.length > 1 ? 's' : ''} sélectionné{selectedPeople.length > 1 ? 's' : ''}
        </span>
        <div className="ml-2 flex flex-wrap gap-1">
          {selectedPeople.slice(0, 5).map(p => (
            <span key={p.id} className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full truncate max-w-[120px]">
              {p.full_name?.split(' ')[0]}
            </span>
          ))}
          {selectedPeople.length > 5 && (
            <span className="text-xs text-emerald-600 font-semibold">+{selectedPeople.length - 5} autres</span>
          )}
        </div>
      </div>

      {/* Variables */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700 mb-1.5">Variables personnalisées</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.map(v => (
              <button key={v} onClick={() => setBody(b => b + v)}
                className="text-[11px] px-2 py-0.5 rounded-full border border-blue-200 bg-white text-blue-700 font-mono hover:bg-blue-100 transition-colors">
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Objet */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Objet <span className="text-red-400">*</span>
        </label>
        <Input
          value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="Ex : Rappel — Programme PASSERELLES"
        />
      </div>

      {/* Corps */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Message <span className="text-red-400">*</span>
        </label>
        <Textarea
          value={body} onChange={e => setBody(e.target.value)}
          rows={12}
          placeholder={`Bonjour {{prenom}},\n\n...`}
          className="font-mono text-sm resize-y"
        />
      </div>

      {/* Aperçu */}
      {preview && subject && body && (
        <details className="border border-gray-100 rounded-xl overflow-hidden">
          <summary className="px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 select-none">
            Aperçu — {preview.full_name}
          </summary>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 mb-1">Objet</p>
            <p className="text-sm font-semibold text-gray-800 mb-3">{fillTemplate(subject, preview)}</p>
            <p className="text-xs font-bold text-gray-500 mb-1">Message</p>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
              {fillTemplate(body, preview)}
            </pre>
          </div>
        </details>
      )}

      {/* Pièces jointes */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Pièces jointes <span className="text-gray-300 font-normal normal-case">(max {MAX_MB} Mo total)</span>
        </label>
        <div className="space-y-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <FileIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-sm text-gray-700 truncate">{a.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{fmtSize(a.size)}</span>
              <button onClick={() => removeAttachment(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {sizeWarn && <p className="text-xs text-red-500">{sizeWarn}</p>}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors w-full">
            <Paperclip className="h-4 w-4" />
            Joindre un fichier
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
        </div>
      </div>

      <div className="flex justify-between pt-2 border-t">
        <Button variant="outline" onClick={() => setStep(1)} disabled={sending} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Retour
        </Button>
        <Button
          disabled={sending || !subject.trim() || !body.trim() || !!sizeWarn}
          onClick={handleSend}
          className="gap-2"
          style={{ background: 'var(--brand-green)', color: 'white' }}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Envoi en cours...' : `Envoyer ${selectedPeople.length} email${selectedPeople.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );

  /* ── Étape 3 : Résultats ── */
  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ background: results.sent.length > 0 ? '#f0fdf4' : '#fef2f2' }}>
          {results.sent.length > 0
            ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            : <XCircle      className="h-8 w-8 text-red-500" />}
        </div>
        <p className="text-xl font-bold text-gray-800">
          {results.sent.length} email{results.sent.length > 1 ? 's' : ''} envoyé{results.sent.length > 1 ? 's' : ''}
        </p>
        {results.errors.length > 0 && (
          <p className="text-sm text-red-500 mt-1">{results.errors.length} échec{results.errors.length > 1 ? 's' : ''}</p>
        )}
      </div>

      {results.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Échecs</p>
          {results.errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-sm">
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="font-medium text-red-800">{e.email}</span>
              <span className="text-red-400 text-xs">— {e.reason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={reset} style={{ background: 'var(--brand-green)', color: 'white' }}>
          Nouvel envoi
        </Button>
      </div>
    </div>
  );
}
