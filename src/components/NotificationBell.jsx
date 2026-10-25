import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44, supabase } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, MessageCircle, ClipboardList, BookOpen, X, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAILS = ['contact@mabellepromo.org', 'senayhola@gmail.com', 'mabellepromo@gmail.com'];
const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

const lastSeenKey = (email) => `passerelles_notif_seen_${email}`;

const getLastSeen = (email) => {
  try {
    const v = localStorage.getItem(lastSeenKey(email));
    return v ? new Date(v) : new Date(Date.now() - LOOKBACK_MS);
  } catch {
    return new Date(Date.now() - LOOKBACK_MS);
  }
};

const setLastSeen = (email) => {
  try { localStorage.setItem(lastSeenKey(email), new Date().toISOString()); } catch {}
};

const formatRelative = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
};

// ── Config visuelle par type ──────────────────────────────────
const TYPE_CFG = {
  message: {
    Icon: MessageCircle,
    color: '#1a7a45',
    bg: 'rgba(26,122,69,0.12)',
    label: 'Message',
  },
  suivi: {
    Icon: ClipboardList,
    color: '#0e7490',
    bg: 'rgba(14,116,144,0.12)',
    label: 'Fiche de suivi',
  },
  journal: {
    Icon: BookOpen,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    label: 'Journal',
  },
};

// ── Récupération activité admin (7 derniers jours) ────────────
const fetchAdminActivity = async () => {
  const since = new Date(Date.now() - LOOKBACK_MS).toISOString();

  const [{ data: msgs }, { data: suivis }, { data: journals }] = await Promise.all([
    supabase
      .from('message')
      .select('id,binome_id,sender_name,sender_role,mentor_name,mentore_name,content,created_date')
      .neq('binome_id', 'contact_form')
      .gte('created_date', since)
      .order('created_date', { ascending: false })
      .limit(40),
    supabase
      .from('suivi_mensuel')
      .select('id,binome_id,mentor_name,mentore_name,submitted_by,meeting_number,issues_reported,created_date')
      .gte('created_date', since)
      .order('created_date', { ascending: false })
      .limit(20),
    supabase
      .from('journal_de_bord')
      .select('id,binome_id,mentor_name,mentore_name,type,titre,auteur_role,created_date')
      .gte('created_date', since)
      .order('created_date', { ascending: false })
      .limit(20),
  ]);

  return [
    ...(msgs || []).map(m => ({ ...m, _type: 'message' })),
    ...(suivis || []).map(s => ({ ...s, _type: 'suivi' })),
    ...(journals || []).map(j => ({ ...j, _type: 'journal' })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
};

// ── Composant principal ───────────────────────────────────────
export default function NotificationBell({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeenState] = useState(() => getLastSeen(userEmail));
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // ── Requête messages non lus (utilisateurs normaux) ──────────
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['notif-bell-msgs', userEmail],
    queryFn: () => base44.entities.Message.filter({ recipient_email: userEmail }),
    enabled: !!userEmail && !isAdmin,
    refetchInterval: 30000,
    select: (msgs) => msgs.filter(m => !m.read),
  });

  // ── Requête activité admin ────────────────────────────────────
  const { data: adminActivity = [] } = useQuery({
    queryKey: ['notif-bell-admin', userEmail],
    queryFn: fetchAdminActivity,
    enabled: !!userEmail && isAdmin,
    refetchInterval: 30000,
    staleTime: 0,
  });

  // ── Temps réel ───────────────────────────────────────────────
  useEffect(() => {
    if (!userEmail) return;
    if (!isAdmin) {
      const unsub = base44.entities.Message.subscribe((event) => {
        if (event.data?.recipient_email === userEmail) {
          queryClient.invalidateQueries({ queryKey: ['notif-bell-msgs', userEmail] });
        }
      });
      return unsub;
    }
    // Admin : subscribe to all 3 tables
    const unsubMsg = base44.entities.Message.subscribe(() =>
      queryClient.invalidateQueries({ queryKey: ['notif-bell-admin', userEmail] }));
    const unsubSuivi = base44.entities.SuiviMensuel.subscribe(() =>
      queryClient.invalidateQueries({ queryKey: ['notif-bell-admin', userEmail] }));
    const unsubJournal = base44.entities.JournalDeBord.subscribe(() =>
      queryClient.invalidateQueries({ queryKey: ['notif-bell-admin', userEmail] }));
    return () => { unsubMsg(); unsubSuivi(); unsubJournal(); };
  }, [userEmail, isAdmin, queryClient]);

  // ── Fermeture clic extérieur ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Ouvrir le panel : marquer comme vu ───────────────────────
  const handleOpen = useCallback(() => {
    setOpen(o => {
      if (!o && isAdmin) {
        setLastSeen(userEmail);
        setLastSeenState(new Date());
      }
      return !o;
    });
  }, [isAdmin, userEmail]);

  // ── Compteurs ────────────────────────────────────────────────
  const adminNew = isAdmin
    ? adminActivity.filter(a => new Date(a.created_date) > lastSeen).length
    : 0;
  const total = isAdmin ? adminNew : unreadMessages.length;

  // ── Render item admin ─────────────────────────────────────────
  const renderAdminItem = (item) => {
    const cfg = TYPE_CFG[item._type] || TYPE_CFG.message;
    const { Icon, color, bg } = cfg;
    const isNew = new Date(item.created_date) > lastSeen;

    let title = '';
    let subtitle = '';
    let to = createPageUrl('AdminDashboard');

    if (item._type === 'message') {
      title = item.sender_name || 'Inconnu';
      subtitle = item.content?.length > 55 ? item.content.slice(0, 55) + '…' : item.content;
      to = `${createPageUrl('Messagerie')}?binome_id=${item.binome_id}`;
    } else if (item._type === 'suivi') {
      title = `${item.mentor_name} ↔ ${item.mentore_name}`;
      const by = item.submitted_by === 'mentor' ? 'Mentor' : item.submitted_by === 'mentore' ? 'Mentoré' : 'Les deux';
      subtitle = `Rencontre #${item.meeting_number ?? '?'} · ${by}${item.issues_reported ? ' · ⚠️ Signalement' : ''}`;
    } else if (item._type === 'journal') {
      title = item.titre || 'Entrée sans titre';
      subtitle = `${item.mentor_name} ↔ ${item.mentore_name} · ${item.auteur_role === 'mentor' ? 'Mentor' : 'Mentoré'}`;
      to = `${createPageUrl('JournalDeBord')}?binome_id=${item.binome_id}`;
    }

    return (
      <Link
        key={`${item._type}-${item.id}`}
        to={to}
        onClick={() => setOpen(false)}
        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
        style={{ borderLeft: isNew ? `3px solid ${color}` : '3px solid transparent' }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: bg }}>
          {item._type === 'suivi' && item.issues_reported
            ? <AlertTriangle className="h-4 w-4" style={{ color: '#dc2626' }} />
            : <Icon className="h-4 w-4" style={{ color }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${isNew ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
              {title}
            </p>
            {isNew && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{formatRelative(item.created_date)}</p>
        </div>
      </Link>
    );
  };

  // ── Render item messages normaux ─────────────────────────────
  const byBinome = unreadMessages.reduce((acc, m) => {
    if (!acc[m.binome_id]) acc[m.binome_id] = { binomeId: m.binome_id, senderName: m.sender_name, count: 0 };
    acc[m.binome_id].count++;
    return acc;
  }, {});

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-white" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 text-white"
              style={{ background: 'linear-gradient(135deg,#0f5530,#1a7a45)' }}>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {isAdmin ? 'Activité récente' : 'Notifications'}
                </span>
                {total > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500">
                    {total} nouveau{total > 1 ? 'x' : ''}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Légende types (admin) */}
            {isAdmin && adminActivity.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50">
                {Object.entries(TYPE_CFG).map(([key, { Icon, color, label }]) => (
                  <div key={key} className="flex items-center gap-1">
                    <Icon className="h-3 w-3" style={{ color }} />
                    <span className="text-[10px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Contenu */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {isAdmin ? (
                adminActivity.length === 0 ? (
                  <EmptyState />
                ) : (
                  adminActivity.map(renderAdminItem)
                )
              ) : (
                Object.keys(byBinome).length === 0 ? (
                  <EmptyState />
                ) : (
                  Object.values(byBinome).map(({ binomeId, senderName, count }) => (
                    <Link
                      key={binomeId}
                      to={`${createPageUrl('Messagerie')}?binome_id=${binomeId}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
                      style={{ borderLeft: '3px solid #1a7a45' }}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1e5631] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {senderName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{senderName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {count} message{count > 1 ? 's' : ''} non lu{count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                    </Link>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <Link to={createPageUrl('Messagerie')} onClick={() => setOpen(false)}
                className="text-xs font-semibold hover:underline" style={{ color: '#1a7a45' }}>
                Messagerie →
              </Link>
              {isAdmin && (
                <Link to={createPageUrl('AdminDashboard')} onClick={() => setOpen(false)}
                  className="text-xs font-semibold hover:underline" style={{ color: '#0e7490' }}>
                  Tableau de bord →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center text-gray-400">
      <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
      <p className="text-sm">Aucune activité récente</p>
    </div>
  );
}
