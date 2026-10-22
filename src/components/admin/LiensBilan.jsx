import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Copy, CheckCircle2, Loader2, UserCheck, GraduationCap,
  RefreshCw, Sparkles, Send,
} from 'lucide-react';
import { toast } from 'sonner';

const SITE_URL = 'https://passerelles.vercel.app';

function buildMessage(link, url) {
  const prenom = (link.participant_name || '').split(' ')[0] || '';
  const roleLabel = link.role === 'mentor' ? 'mentor' : 'mentoré(e)';
  return {
    subject: 'Votre sondage — Programme PASSERELLES',
    text: `Bonjour ${prenom},\n\nDans le cadre du programme PASSERELLES, nous vous invitons à compléter votre sondage en tant que ${roleLabel}. Cela ne prend que quelques minutes et nous aide à suivre le bon déroulement de votre binôme.\n\nVoici votre lien personnel (valable 30 jours) :\n${url}\n\nMerci pour votre implication !\n\nL'équipe Ma Belle Promo`,
  };
}

function statusOf(link) {
  if (link.used_at) return { label: 'Répondu', color: '#059669', bg: '#ecfdf5' };
  if (link.draft_saved_at) return { label: 'Brouillon en cours', color: '#d97706', bg: '#fffbeb' };
  return { label: 'Pas encore ouvert', color: '#6b7280', bg: '#f9fafb' };
}

export default function LiensBilan() {
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [reissuing, setReissuing] = useState({});
  const [sending, setSending] = useState({});
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['review_links_admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('review_links_admin').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return links;
    const q = search.toLowerCase();
    return links.filter(l =>
      l.participant_name?.toLowerCase().includes(q) || l.participant_email?.toLowerCase().includes(q)
    );
  }, [links, search]);

  const copyLink = async (link) => {
    const url = `${SITE_URL}/bilan/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(link.token_id);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const generateMissing = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_missing_review_tokens');
      if (error) throw error;
      toast.success(`${data?.created ?? 0} nouveau(x) lien(s) généré(s)`);
      queryClient.invalidateQueries({ queryKey: ['review_links_admin'] });
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const sendLink = async (link) => {
    if (!link.participant_email) {
      toast.error('Aucun email connu pour cette personne');
      return;
    }
    setSending(s => ({ ...s, [link.token_id]: true }));
    try {
      const url = `${SITE_URL}/bilan/${link.token}`;
      const { subject, text } = buildMessage(link, url);
      const token = await base44.auth.getAccessToken();
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: link.participant_email, subject, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Échec de l\'envoi');
      toast.success(`Lien envoyé par email à ${link.participant_name || link.participant_email}`);
      queryClient.invalidateQueries({ queryKey: ['review_links_admin'] });
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setSending(s => { const n = { ...s }; delete n[link.token_id]; return n; });
    }
  };

  const reissue = async (link) => {
    setReissuing(s => ({ ...s, [link.token_id]: true }));
    try {
      const { data, error } = await supabase.rpc('admin_reissue_review_token', {
        p_participant_email: link.participant_email,
        p_role: link.role,
      });
      if (error) throw error;
      await navigator.clipboard.writeText(`${SITE_URL}/bilan/${data.token}`);
      toast.success(`Nouveau lien généré et copié pour ${link.participant_name}`);
      queryClient.invalidateQueries({ queryKey: ['review_links_admin'] });
    } catch (err) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setReissuing(s => { const n = { ...s }; delete n[link.token_id]; return n; });
    }
  };

  const groups = [
    { label: 'Mentors', icon: UserCheck, role: 'mentor', color: '#1a7a45' },
    { label: 'Mentorés', icon: GraduationCap, role: 'mentore', color: '#7c3aed' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Liens du bilan</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Envoyez le lien par email en un clic, ou copiez-le pour le transmettre vous-même (WhatsApp…).
          </p>
        </div>
        <button
          onClick={generateMissing}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)' }}
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Générer les liens manquants
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou email…" className="pl-9 text-sm" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aucun lien généré pour le moment. Cliquez sur « Générer les liens manquants » pour créer les premiers.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, icon: Icon, role, color }) => {
            const items = filtered.filter(l => l.role === role);
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
                  {items.map((link) => {
                    const st = statusOf(link);
                    const isCopied = copiedToken === link.token_id;
                    const isReissuing = !!reissuing[link.token_id];
                    return (
                      <div key={link.token_id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{link.participant_name || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{link.participant_email}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge style={{ background: st.bg, color: st.color }} className="hover:bg-inherit">{st.label}</Badge>

                          {link.used_at ? (
                            <button
                              onClick={() => reissue(link)}
                              disabled={isReissuing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                              title="Génère un nouveau lien pour que cette personne puisse remplir à nouveau"
                            >
                              {isReissuing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              Renvoyer un lien
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => sendLink(link)}
                                disabled={!!sending[link.token_id]}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                                title="Envoyer le lien par email directement à la personne"
                              >
                                {sending[link.token_id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                Envoyer par email
                              </button>
                              <button
                                onClick={() => copyLink(link)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                              >
                                {isCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {isCopied ? 'Copié !' : 'Copier'}
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

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Aucun participant trouvé pour « {search} »
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl p-4 text-xs text-gray-500 space-y-1" style={{ background: '#f8f9fa', border: '1px solid #e5e7eb' }}>
        <p className="font-semibold text-gray-700 mb-2">Comment ça marche</p>
        <p>• <strong>Générer les liens manquants</strong> — crée un lien pour chaque mentor/mentoré d'un binôme actif qui n'en a pas encore. N'écrase rien, n'envoie rien.</p>
        <p>• <strong>Envoyer par email</strong> — envoie directement le lien à la personne avec un message prêt à l'emploi.</p>
        <p>• <strong>Copier</strong> — copie le lien dans le presse-papier pour l'envoyer vous-même (WhatsApp…).</p>
        <p>• <strong>Renvoyer un lien</strong> — pour quelqu'un qui a déjà répondu et doit corriger : génère un nouveau lien indépendant, sans toucher à sa réponse précédente.</p>
      </div>
    </div>
  );
}
