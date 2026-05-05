import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Send, Loader2, CheckCircle2, XCircle, UserCheck, GraduationCap, RefreshCw } from 'lucide-react';

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
  const [sending, setSending] = useState({}); // { email: 'loading' | 'ok' | 'error' | string }

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
        setTimeout(() => setSending(s => { const n = { ...s }; delete n[email]; return n; }), 5000);
      }
    } catch {
      setSending(s => ({ ...s, [email]: 'error' }));
      setTimeout(() => setSending(s => { const n = { ...s }; delete n[email]; return n; }), 5000);
    }
  };

  const statusLabel = (email) => {
    const s = sending[email];
    if (!s) return null;
    if (s === 'loading') return { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Envoi…', color: '#6b7280' };
    if (s === 'ok')      return { icon: <CheckCircle2 className="h-4 w-4" />,          text: 'Lien envoyé !', color: '#1a7a45' };
    return { icon: <XCircle className="h-4 w-4" />, text: s === 'error' ? 'Erreur' : s, color: '#dc2626' };
  };

  const groups = [
    { label: 'Mentors',  icon: UserCheck,    role: 'mentor',  color: '#1a7a45' },
    { label: 'Mentorés', icon: GraduationCap, role: 'mentore', color: '#7c3aed' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Renvoyer un lien d'accès</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cliquez sur <strong>Envoyer</strong> pour transmettre un nouveau lien à n'importe quel participant.
            Le système détecte automatiquement s'il s'agit d'une création de compte ou d'une réinitialisation.
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
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
          <span className="text-sm">Chargement des participants…</span>
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
                    const st = statusLabel(p.email);
                    const isLoading = sending[p.email] === 'loading';
                    return (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.full_name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{p.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {st ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: st.color }}>
                              {st.icon}
                              {st.text}
                            </span>
                          ) : (
                            <button
                              onClick={() => sendLink(p.email)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Envoyer
                            </button>
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
        <p className="font-semibold text-gray-700 mb-2">Comment ça fonctionne</p>
        <p>• Participant <strong>sans compte</strong> → reçoit un lien <em>« Créer mon compte »</em> (valable 24h)</p>
        <p>• Participant <strong>avec compte existant</strong> → reçoit un lien <em>« Accéder à mon espace »</em> pour réinitialiser son mot de passe</p>
        <p>• Seuls les emails enregistrés dans la base Supabase peuvent recevoir un lien</p>
      </div>
    </div>
  );
}
