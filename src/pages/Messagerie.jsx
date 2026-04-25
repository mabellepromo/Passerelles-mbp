import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle, Loader2, Users, CheckCheck, Search, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatDay = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#1a7a45,#0f5530)',
  'linear-gradient(135deg,#7c3aed,#4f46e5)',
  'linear-gradient(135deg,#0891b2,#0e7490)',
  'linear-gradient(135deg,#d97706,#b45309)',
];

export default function Messagerie() {
  const urlParams    = new URLSearchParams(window.location.search);
  const prefilledId  = urlParams.get('binome_id') || '';

  const [user, setUser]             = useState(null);
  const [selectedBinomeId, setSelectedBinomeId] = useState(prefilledId);
  const [draft, setDraft]           = useState('');
  const [sending, setSending]       = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(!!prefilledId);
  const messagesEndRef = useRef(null);
  const queryClient    = useQueryClient();
  const textareaRef    = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: binomes = [], isLoading: binomesLoading } = useQuery({
    queryKey: ['binomes-messagerie', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('getMyBinomes', {});
      return res.data?.binomes || [];
    },
    enabled: !!user?.email
  });

  const { data: allBinomes = [] } = useQuery({
    queryKey: ['all-binomes-msg'],
    queryFn: () => base44.entities.Binome.filter({ status: 'active', cohorte: '1' }, '-match_date'),
    enabled: user?.role === 'admin'
  });

  const visibleBinomes = user?.role === 'admin'
    ? allBinomes.filter(b => b.mentor_id && b.mentore_id)
    : binomes;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedBinomeId],
    queryFn: () => base44.entities.Message.filter({ binome_id: selectedBinomeId }, 'created_date'),
    enabled: !!selectedBinomeId,
    staleTime: 0,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!selectedBinomeId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.binome_id === selectedBinomeId) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedBinomeId] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      }
    });
    return unsub;
  }, [selectedBinomeId, queryClient]);

  useEffect(() => {
    if (!user || !messages.length) return;
    const unread = messages.filter(m => m.recipient_email === user.email && !m.read);
    unread.forEach(m => base44.entities.Message.update(m.id, { read: true }));
    if (unread.length) queryClient.invalidateQueries({ queryKey: ['unread-count'] });
  }, [messages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { data: allMyMessages = [] } = useQuery({
    queryKey: ['unread-count', user?.email],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user.email }),
    enabled: !!user?.email
  });

  const unreadByBinome = allMyMessages.reduce((acc, m) => {
    if (!m.read) acc[m.binome_id] = (acc[m.binome_id] || 0) + 1;
    return acc;
  }, {});

  const getPartner = (b) => {
    if (!user || !b) return { name: '', email: '', role: '' };
    if (b.mentor_email === user.email) return { name: b.mentore_name, email: b.mentore_email, role: 'Mentoré(e)' };
    return { name: b.mentor_name, email: b.mentor_email, role: 'Mentor' };
  };

  const getMyRole = (b) => !user || !b ? 'mentor' : b.mentor_email === user.email ? 'mentor' : 'mentore';

  const selectedBinome = visibleBinomes.find(b => b.id === selectedBinomeId);

  const handleSend = async () => {
    if (!draft.trim() || !selectedBinome || !user) return;
    setSending(true);
    const partner = getPartner(selectedBinome);
    const myRole  = getMyRole(selectedBinome);
    const content = draft.trim();
    setDraft('');
    setSending(false);
    await base44.entities.Message.create({
      binome_id:       selectedBinomeId,
      sender_email:    user.email,
      sender_name:     user.full_name || user.email,
      sender_role:     myRole,
      recipient_email: partner.email,
      recipient_name:  partner.name,
      content,
      read: false
    });
    queryClient.invalidateQueries({ queryKey: ['messages', selectedBinomeId] });
    if (partner.email) {
      base44.integrations.Core.SendEmail({
        to: partner.email,
        subject: `💬 Nouveau message de ${user.full_name || user.email} — PASSERELLES`,
        body: `Bonjour ${partner.name},\n\n${user.full_name || user.email} vous a envoyé un message :\n\n"${content}"\n\nConnectez-vous pour répondre.\n\nCordialement,\nL'équipe Ma Belle Promo`
      }).catch(() => {});
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectBinome = (id) => {
    setSelectedBinomeId(id);
    setMobileShowChat(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'linear-gradient(135deg,#0f5530,#1a7a45)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const totalUnread = Object.values(unreadByBinome).reduce((a, b) => a + b, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background:'#f1f5f4' }}>
      <NavBar />

      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-72 lg:w-80 flex-shrink-0 h-full`}
          style={{ background:'linear-gradient(180deg,#0a2e18 0%,#0f5530 100%)' }}>

          {/* Header sidebar */}
          <div className="px-5 pt-5 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-playfair font-bold text-white text-lg">Messagerie</h1>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:'#ef4444', color:'white' }}>
                  {totalUnread}
                </span>
              )}
            </div>
            <p className="text-emerald-400 text-xs">Conversations avec votre binôme</p>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
            {binomesLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              </div>
            )}
            {!binomesLoading && visibleBinomes.length === 0 && (
              <div className="text-center py-10">
                <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Aucun binôme actif</p>
              </div>
            )}
            {visibleBinomes.map((b, idx) => {
              const partner  = getPartner(b);
              const unread   = unreadByBinome[b.id] || 0;
              const isSelected = selectedBinomeId === b.id;
              const avatarGrad = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const displayName = user.role === 'admin' ? `${b.mentor_name} ↔ ${b.mentore_name}` : partner.name;

              return (
                <motion.button
                  key={b.id}
                  onClick={() => selectBinome(b.id)}
                  whileHover={{ x: 2 }}
                  className="w-full text-left"
                >
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isSelected ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/8'
                  }`}
                    style={isSelected ? { background:'rgba(255,255,255,0.12)', borderLeft:'3px solid #d4aa35', paddingLeft: 9 } : {}}>
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: avatarGrad }}>
                        {initials(user.role === 'admin' ? b.mentor_name : partner.name)}
                      </div>
                      {unread > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white border border-[#0f5530]">
                          {unread}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${unread > 0 ? 'text-white' : ''}`}>{displayName}</p>
                      <p className="text-[10px] opacity-50 capitalize truncate">
                        {user.role === 'admin' ? 'Conversation binôme' : partner.role}
                      </p>
                    </div>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:'#d4aa35' }} />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* User info bas sidebar */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background:'rgba(184,148,31,0.25)', color:'#f0d060', border:'1px solid rgba(212,170,53,0.4)' }}>
              {initials(user?.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Moi'}</p>
              <p className="text-[10px] text-emerald-400 truncate">{user?.email}</p>
            </div>
          </div>
        </aside>

        {/* ── ZONE CHAT ── */}
        <div className={`${!mobileShowChat ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden`}
          style={{ background:'#f8faf8' }}>

          {!selectedBinomeId ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,rgba(15,85,48,0.08),rgba(26,122,69,0.12))', border:'2px solid rgba(15,85,48,0.12)' }}>
                <MessageCircle className="h-9 w-9" style={{ color:'#1a7a45' }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700 text-lg">Sélectionnez une conversation</p>
                <p className="text-sm text-gray-400 mt-1">Choisissez un binôme dans la liste pour démarrer</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 px-5 py-4 flex items-center gap-3 border-b border-gray-100 bg-white shadow-sm">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="h-4 w-4 text-gray-500" />
                </button>
                {selectedBinome && (() => {
                  const partner = getPartner(selectedBinome);
                  const displayName = user.role === 'admin'
                    ? `${selectedBinome.mentor_name} ↔ ${selectedBinome.mentore_name}`
                    : partner.name;
                  return (
                    <>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background:'linear-gradient(135deg,#1a7a45,#0f5530)' }}>
                        {initials(user.role === 'admin' ? selectedBinome.mentor_name : partner.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-xs text-gray-400">
                            {user.role === 'admin' ? 'Conversation binôme' : partner.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', color:'#059669' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Actif
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMessages && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                  </div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:'rgba(0,0,0,0.04)' }}>
                      <MessageCircle className="h-7 w-7 opacity-30" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-400">Aucun message</p>
                      <p className="text-xs text-gray-300 mt-0.5">Démarrez la conversation !</p>
                    </div>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isMe    = msg.sender_email === user?.email;
                    const showDay = i === 0 || new Date(msg.created_date).toDateString() !== new Date(messages[i - 1]?.created_date).toDateString();
                    return (
                      <React.Fragment key={msg.id}>
                        {showDay && (
                          <div className="flex items-center gap-3 my-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{formatDay(msg.created_date)}</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 self-end"
                              style={{ background:'linear-gradient(135deg,#1a7a45,#0f5530)' }}>
                              {initials(msg.sender_name)}
                            </div>
                          )}
                          <div className={`max-w-[68%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <p className="text-[10px] text-gray-400 px-1 mb-0.5 font-medium">{msg.sender_name}</p>}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isMe
                                ? 'text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                            }`}
                              style={isMe ? { background:'linear-gradient(135deg,#1a7a45,#2ea05c)' } : {}}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 px-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] text-gray-400">{formatTime(msg.created_date)}</span>
                              {isMe && <CheckCheck className={`h-3 w-3 ${msg.read ? 'text-blue-400' : 'text-gray-300'}`} />}
                            </div>
                          </div>
                          {isMe && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 self-end"
                              style={{ background:'linear-gradient(135deg,#b8941f,#d4aa35)' }}>
                              {initials(user.full_name)}
                            </div>
                          )}
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrivez votre message…"
                      className="resize-none text-sm rounded-2xl border-gray-200 focus:border-emerald-400 pr-2 min-h-[44px] max-h-[120px]"
                      rows={1}
                      style={{ paddingRight: 8 }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                    style={{ background:'linear-gradient(135deg,#1a7a45,#2ea05c)' }}>
                    {sending
                      ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                      : <Send className="h-4 w-4 text-white" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 px-1">Entrée pour envoyer · Shift+Entrée pour saut de ligne</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
