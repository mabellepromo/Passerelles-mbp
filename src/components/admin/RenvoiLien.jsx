import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Send, Loader2, CheckCircle2, XCircle, UserCheck, GraduationCap, Copy, Link2 } from 'lucide-react';

async function fetchParticipants() {
  const [{ data: mentors }, { data: mentores }] = await Promise.all([
    supabase.from('mentor').select('id, full_name, email, status').order('full_name'),
    supabase.from('mentore').select('id, full_name, email, status').order('full_name'),
  ]);
  return {
    mentors: (mentors || []).map(m => ({ ...m, role: 'mentor' })),
    mentores: (mentores || []).map(m => ({ ...m, role: 'mentore' })),
  };
}

export default function RenvoiLien() {
  const [search, setSearch] = useState('');
  const [sending, setSending]   = useState({}); // { email: 'loading'|'ok'|'error'|string }
  const [copying, setCopying]   = useState({}); // { email: 'loading'|'ok'|'error'|string }
  const [copiedLink, setCopiedLink] = useState(null); // lien affiché dans la modale

  const { data, isLoading } = useQuery({
    queryKey: ['participants-renvoi'],
    queryFn: fetchParticipants,
  });

  const all = useMemo(() => {
    const list = [...(data?.mentors || []), ...(data?.mentores || [])];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(p =>
      p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  /* ── Envoi par email ── */
  const sendLink = async (email) => {
    setSending(s => ({ ...s, [email]: 'loading' }));
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSending(s => ({ ...s, [email]: 'ok' }));
        setTimeout(() => setSending(s => { const n = { ...s }; delete n[email]; return n; }), 4000);
      } else {
        const body = await res.json().catch(() => ({}));
        setSending(s => ({ ...s, [email]: body.error || 'error' }));
        setTimeout(() => setSending(s => { const n = { ...s }; delete n[email]; return n; }), 6000);
      }
    } catch {
      setSending(s => ({ ...s, [email]: 'error' }));
      setTimeout(() => setSending(s => { const n = { ...s }; delete n[email]; return n; }), 6000);
    }
  };

  /* ── Génération + copie du lien ── */
  const copyLink = async (email, name) => {
    setCopying(s => ({ ...s, [email]: 'loading' }));
    try {
      const res = await fetch('/api/generate-invite-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.link) {
        await navigator.clipboard.writeText(body.link);
        setCopying(s => ({ ...s, [email]: 'ok' }));
        setCopiedLink({ link: body.link, name, email });
        setTimeout(() => setCopying(s => { const n = { ...s }; delete n[email]; return n; }), 5000);
      } else {
        setCopying(s => ({ ...s, [email]: body.error || 'error' }));
        setTimeout(() => setCopying(s => { const n = { ...s }; delete n[email]; return n; }), 6000);
      }
    } catch {
      setCopying(s => ({ ...s, [email]: 'error' }));
      setTimeout(() => setCopying(s => { const n = { ...s }; delete n[email]; return n; }), 6000);
    }
  };

  const statusBadge = (stateMap, email, okText) => {
    const s = stateMap[email];
    if (!s) return null;
    if (s === 'loading') return { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: '…', color: '#6b7280' };
    if (s === 'ok')      return { icon: <CheckCircle2 className="h-3.5 w-3.5" />,          text: okText,  color: '#1a7a45' };
    return { icon: <XCircle className="h-3.5 w-3.5" />, text: s === 'error' ? 'Erreur' : s, color: '#dc2626' };
  };

  const groups = [
    { label: 'Mentors',  icon: UserCheck,     role: 'mentor',  color: '#1a7a45' },
    { label: 'Mentorés', icon: GraduationCap, role: 'mentore', color: '#7c3aed' },
  ];

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div>
        <h2 className="text-base font-bold text-gray-900">Lien d'accès</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          <strong>Envoyer</strong> transmet un email via Brevo.
          <strong> Copier</strong> génère un lien direct à partager par WhatsApp ou SMS — utile si l'email ne fonctionne pas.
        </p>
      </div>

      {/* Modale lien copié */}
      {copiedLink && (
        <div className="rounded-xl p-4 space-y-2"
          style={{ background: '#f0fdf4', border: '2px solid #1a7a45' }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Lien copié pour {copiedLink.name}
            </span>
            <button onClick={() => setCopiedLink(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Envoyez ce lien directement à la personne (WhatsApp, SMS…).
            Il est valable <strong>24h</strong> et à usage unique.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-700 truncate">
              {copiedLink.link}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(copiedLink.link)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#1a7a45' }}>
              <Copy className="h-3 w-3" />
              Recopier
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="pl-9 text-sm"
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, icon: Icon, role, color }) => {
            const items = all.filter(p => p.role === role);
            if (!items.length) return null;
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" style={{ color }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                    {label} ({items.length})
                  </span>
                </div>
                <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {items.map(p => {
                    const sendSt = statusBadge(sending, p.email, 'Email envoyé !');
                    const copySt = statusBadge(copying, p.email, 'Copié !');
                    const busy = sending[p.email] === 'loading' || copying[p.email] === 'loading';
                    return (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.full_name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{p.email}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Statut envoi email */}
                          {sendSt && (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: sendSt.color }}>
                              {sendSt.icon}{sendSt.text}
                            </span>
                          )}
                          {/* Statut copie lien */}
                          {copySt && (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: copySt.color }}>
                              {copySt.icon}{copySt.text}
                            </span>
                          )}

                          {/* Boutons actifs */}
                          {!sendSt && !copySt && (
                            <>
                              <button
                                onClick={() => sendLink(p.email)}
                                disabled={busy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                              >
                                <Send className="h-3.5 w-3.5" />
                                Envoyer
                              </button>
                              <button
                                onClick={() => copyLink(p.email, p.full_name || p.email)}
                                disabled={busy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                              >
                                <Link2 className="h-3.5 w-3.5" />
                                Copier
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {all.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Aucun participant trouvé pour « {search} »
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div className="rounded-xl p-4 text-xs text-gray-500 space-y-1"
        style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
        <p className="font-semibold text-gray-700 mb-2">Les deux options</p>
        <p>• <strong>Envoyer</strong> — envoie l'email via Brevo (valable 24h)</p>
        <p>• <strong>Copier</strong> — génère un lien direct à transmettre par WhatsApp/SMS (valable 24h, usage unique)</p>
        <p className="text-amber-600">⚠ Le lien copié donne un accès direct — ne le partagez qu'avec la bonne personne</p>
      </div>
    </div>
  );
}
