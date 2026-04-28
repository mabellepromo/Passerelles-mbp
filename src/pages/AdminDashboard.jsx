import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, UserCheck, Link2, ClipboardList,
  TrendingUp, AlertTriangle, BarChart3, Upload, FileSpreadsheet,
  Download, Activity, FileText, Send, Home, Star, CheckCircle2,
  Clock, ChevronRight, Menu, X, BookOpen, Mail, Eye, Inbox, PenSquare, User, Paperclip, FileIcon
} from 'lucide-react';

import AdminStats from '@/components/admin/AdminStats.jsx';
import MentorsList from '@/components/admin/MentorsList.jsx';
import MentoresList from '@/components/admin/MentoresList.jsx';
import BinomesList from '@/components/admin/BinomesList.jsx';
import SuivisList from '@/components/admin/SuivisList.jsx';
import MatchingTool from '@/components/admin/MatchingTool.jsx';
import ImageManager from '@/components/admin/ImageManager.jsx';
import ImportCSV from '@/components/admin/ImportCSV.jsx';
import AlertesBinomes from '@/components/admin/AlertesBinomes.jsx';
import ExportCSV from '@/components/admin/ExportCSV.jsx';
import ProgrammeCharts from '@/components/admin/ProgrammeCharts.jsx';
import AnalytiqueDashboard from '@/components/admin/AnalytiqueDashboard.jsx';
import DeclenchementBinomes from '@/components/admin/DeclenchementBinomes.jsx';

const NAV = [
  { id: 'overview',      label: 'Vue d\'ensemble', icon: BarChart3,      group: 'Principal' },
  { id: 'analytique',    label: 'Analytique',       icon: Activity,       group: 'Principal' },
  { id: 'charts',        label: 'Graphiques',        icon: TrendingUp,     group: 'Principal' },
  { id: 'mentors',       label: 'Mentors',           icon: UserCheck,      group: 'Participants', count: 'totalMentors' },
  { id: 'mentores',      label: 'Mentorés',          icon: GraduationCap,  group: 'Participants', count: 'totalMentores' },
  { id: 'binomes',       label: 'Binômes',           icon: Users,          group: 'Participants', count: 'activeBinomes' },
  { id: 'matching',      label: 'Appariement',       icon: Link2,          group: 'Outils' },
  { id: 'declenchement', label: 'Déclenchement',     icon: Send,           group: 'Outils' },
  { id: 'alertes',       label: 'Alertes',           icon: AlertTriangle,  group: 'Outils', count: 'issuesReported', alert: true },
  { id: 'suivis',        label: 'Suivis',            icon: ClipboardList,  group: 'Données', count: 'totalSuivis' },
  { id: 'contacts',      label: 'Messages Contact',  icon: Inbox,          group: 'Données', count: 'unreadContacts', alert: true },
  { id: 'export',        label: 'Export CSV',        icon: Download,       group: 'Données' },
  { id: 'import',        label: 'Import CSV',        icon: FileSpreadsheet,group: 'Données' },
  { id: 'images',        label: 'Images',            icon: Upload,         group: 'Données' },
];

const GROUPS = ['Principal', 'Participants', 'Outils', 'Données'];

const DEFAULT_SIG = "L'équipe Ma Belle Promo";

const inputStyle = (focused) => ({
  background: '#fafafa', color: '#111827',
  borderColor: focused ? '#1a7a45' : '#e5e7eb',
  boxShadow: focused ? '0 0 0 3px rgba(26,122,69,0.08)' : 'none',
});

const MAX_TOTAL_MB = 3;
const fmtSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;

const toBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result.split(',')[1]);
  r.onerror = reject;
  r.readAsDataURL(file);
});

function SendForm({ fields, sending, done, onSend, onCancel, doneLabel, doneEmail }) {
  const [focused,     setFocused]     = useState(null);
  const [vals,        setVals]        = useState(fields.reduce((a, f) => ({ ...a, [f.key]: f.default || '' }), {}));
  const [attachments, setAttachments] = useState([]);
  const [sizeWarn,    setSizeWarn]    = useState('');
  const fileRef = React.useRef();

  const set = k => e => setVals(v => ({ ...v, [k]: e.target.value }));
  const required = fields.filter(f => f.required).map(f => f.key);
  const canSend  = required.every(k => vals[k]?.trim()) && !sending && !sizeWarn;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    const newList = [...attachments];
    let warn = '';
    for (const file of files) {
      const totalBytes = [...newList, file].reduce((s, a) => s + (a.size || 0), 0);
      if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
        warn = `Taille totale max ${MAX_TOTAL_MB} Mo dépassée — "${file.name}" ignoré.`;
        continue;
      }
      const content = await toBase64(file);
      newList.push({ filename: file.name, content, contentType: file.type || 'application/octet-stream', size: file.size });
    }
    setSizeWarn(warn);
    setAttachments(newList);
    e.target.value = '';
  };

  const removeAttachment = (idx) => {
    const next = attachments.filter((_, i) => i !== idx);
    setAttachments(next);
    const total = next.reduce((s, a) => s + (a.size || 0), 0);
    if (total <= MAX_TOTAL_MB * 1024 * 1024) setSizeWarn('');
  };

  if (done) return (
    <div className="flex items-center gap-3 px-6 py-4">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#1a7a45' }} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{doneLabel || 'Message envoyé'}</p>
        <p className="text-xs text-gray-400">à {doneEmail}</p>
      </div>
    </div>
  );

  return (
    <div className="px-6 py-4 space-y-3">
      {fields.map(f => (
        <div key={f.key}>
          {f.label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>}
          {f.type === 'textarea' ? (
            <textarea rows={f.rows || 5} value={vals[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
              className="w-full px-4 py-3 rounded-xl text-sm border outline-none resize-none transition-all"
              style={inputStyle(focused === f.key)}
              onFocus={() => setFocused(f.key)} onBlur={() => setFocused(null)} />
          ) : (
            <div className="relative">
              {f.icon && <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />}
              <input type={f.type || 'text'} value={vals[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                className={`w-full ${f.icon ? 'pl-9' : 'px-4'} pr-3 py-2.5 rounded-xl text-sm border outline-none transition-all`}
                style={inputStyle(focused === f.key)}
                onFocus={() => setFocused(f.key)} onBlur={() => setFocused(null)} />
            </div>
          )}
        </div>
      ))}

      {/* Pièces jointes */}
      <div>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
        <button type="button" onClick={() => fileRef.current.click()}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          style={{ background: 'rgba(26,122,69,0.06)', color: '#1a7a45', border: '1px solid rgba(26,122,69,0.15)' }}>
          <Paperclip className="h-3.5 w-3.5" /> Joindre un fichier
        </button>
        {sizeWarn && <p className="text-xs text-red-400 mt-1">{sizeWarn}</p>}
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(26,122,69,0.04)', border: '1px solid rgba(26,122,69,0.1)' }}>
                <FileIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#1a7a45' }} />
                <span className="text-xs text-gray-700 flex-1 truncate">{a.filename}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{fmtSize(a.size)}</span>
                <button onClick={() => removeAttachment(i)} className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aperçu signature */}
      <div className="px-3 py-2 rounded-lg text-xs text-gray-400 leading-relaxed"
        style={{ background: 'rgba(0,0,0,0.03)', borderLeft: '2px solid #e5e7eb' }}>
        — {vals['signature'] || DEFAULT_SIG} · Association Ma Belle Promo
      </div>

      <div className="flex items-center justify-between pt-1">
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Annuler</button>
        <button onClick={() => onSend({ ...vals, attachments })} disabled={!canSend}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)', boxShadow: '0 4px 12px rgba(26,122,69,0.25)' }}>
          {sending
            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Envoi...</>
            : <><Send className="h-3.5 w-3.5" /> Envoyer {attachments.length > 0 && `(${attachments.length} PJ)`}</>
          }
        </button>
      </div>
    </div>
  );
}

function ContactMessagesView({ messages, onMarkRead, onDelete }) {
  const [selected, setSelected]         = useState(null);
  const [replyOpen, setReplyOpen]       = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [replyDone, setReplyDone]       = useState(false);
  const [composeOpen, setComposeOpen]   = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeDone, setComposeDone]   = useState(false);

  const handleOpen = (msg) => {
    setSelected(msg);
    setComposeOpen(false);
    setReplyOpen(false);
    setReplyDone(false);
    if (!msg.read) onMarkRead(msg);
  };

  const openCompose = () => {
    setSelected(null);
    setComposeOpen(true);
    setComposeDone(false);
  };

  const sendEmail = async ({ to, recipientName, subject, message, signature, attachments }) => {
    const token = await base44.auth.getAccessToken();
    const res = await fetch('/api/send-contact-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        to, recipient_name: recipientName, subject,
        text: message.trim(),
        signature: signature?.trim() || DEFAULT_SIG,
        attachments: attachments || [],
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.smtp || body.error || 'Erreur serveur');
    }
  };

  const handleSendReply = async (vals) => {
    setReplySending(true);
    try {
      await sendEmail({
        to: selected.sender_email, recipientName: selected.sender_name,
        subject: `Re : ${selected.sender_role || 'Votre message à Ma Belle Promo'}`,
        message: vals.message, signature: vals.signature,
      });
      setReplyDone(true);
      setReplyOpen(false);
    } catch (err) { alert(`Erreur : ${err.message}`); }
    finally { setReplySending(false); }
  };

  const handleSendCompose = async (vals) => {
    setComposeSending(true);
    try {
      await sendEmail({
        to: vals.to, recipientName: vals.recipientName,
        subject: vals.subject, message: vals.message, signature: vals.signature,
      });
      setComposeDone(true);
    } catch (err) { alert(`Erreur : ${err.message}`); }
    finally { setComposeSending(false); }
  };

  const fmt = (iso) => iso
    ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const REPLY_FIELDS = [
    { key: 'message', type: 'textarea', rows: 5, required: true,
      placeholder: `Bonjour ${selected?.sender_name?.split(' ')[0] || ''},\n\n` },
    { key: 'signature', label: 'Signature', icon: User, placeholder: DEFAULT_SIG,
      default: DEFAULT_SIG },
  ];

  const COMPOSE_FIELDS = [
    { key: 'to',            label: 'Email destinataire', icon: Mail,    type: 'email', required: true, placeholder: 'exemple@email.com' },
    { key: 'recipientName', label: 'Nom (optionnel)',    icon: User,                   placeholder: 'Prénom Nom' },
    { key: 'subject',       label: 'Objet',                                            required: true, placeholder: 'Objet du message' },
    { key: 'message',       type: 'textarea', rows: 6,                 required: true, placeholder: 'Bonjour,\n\n' },
    { key: 'signature',     label: 'Signature',          icon: User,    placeholder: DEFAULT_SIG, default: DEFAULT_SIG },
  ];

  return (
    <div className="flex gap-5 min-h-[500px]">
      {/* Liste + bouton Nouveau */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-2">
        <button onClick={openCompose}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)', boxShadow: '0 4px 12px rgba(26,122,69,0.2)' }}>
          <PenSquare className="h-4 w-4" /> Nouveau message
        </button>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Inbox className="h-8 w-8 text-gray-200" />
            <p className="text-xs text-gray-400">Aucun message reçu</p>
          </div>
        ) : messages.map(msg => (
          <button key={msg.id} onClick={() => handleOpen(msg)}
            className="w-full text-left rounded-xl p-4 transition-all border"
            style={{
              background: selected?.id === msg.id ? 'rgba(26,122,69,0.06)' : '#fff',
              borderColor: selected?.id === msg.id ? 'rgba(26,122,69,0.3)' : '#f0f0f0',
              boxShadow: selected?.id === msg.id ? '0 0 0 1px rgba(26,122,69,0.15)' : 'none',
            }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {!msg.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#1a7a45' }} />}
                <p className={`text-sm truncate ${!msg.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                  {msg.sender_name || msg.sender_email}
                </p>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{fmt(msg.created_date)}</span>
            </div>
            <p className="text-xs font-semibold truncate" style={{ color: '#1a7a45' }}>{msg.sender_role || '—'}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{msg.content}</p>
          </button>
        ))}
      </div>

      {/* Panneau droit */}
      <div className="flex-1 rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ background: '#fafafa' }}>

        {/* ── Nouveau message ── */}
        {composeOpen && (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
              <PenSquare className="h-4 w-4" style={{ color: '#1a7a45' }} />
              <h3 className="font-playfair font-bold text-gray-900">Nouveau message</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SendForm
                fields={COMPOSE_FIELDS}
                sending={composeSending}
                done={composeDone}
                doneLabel="Message envoyé"
                doneEmail={composeDone ? '—' : ''}
                onSend={handleSendCompose}
                onCancel={() => setComposeOpen(false)}
              />
              {composeDone && (
                <div className="px-6 pb-4">
                  <button onClick={() => { setComposeDone(false); }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors">
                    Rédiger un autre message
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Message sélectionné ── */}
        {selected && !composeOpen && (
          <>
            <div className="px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-playfair font-bold text-gray-900 text-lg leading-tight">{selected.sender_role || 'Message'}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)' }}>
                        {(selected.sender_name || selected.sender_email || '?')[0].toUpperCase()}
                      </div>
                      {selected.sender_name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="h-3 w-3" /> {selected.sender_email}
                    </span>
                    <span className="text-xs text-gray-400">{fmt(selected.created_date)}</span>
                  </div>
                </div>
                <button onClick={() => { onDelete(selected); setSelected(null); }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors border border-red-100">
                  Supprimer
                </button>
              </div>
            </div>

            <div className="flex-1 px-6 py-5 overflow-y-auto">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
            </div>

            <div className="flex-shrink-0 border-t border-gray-100 bg-white">
              {replyDone && (
                <div className="px-6 py-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#1a7a45' }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Réponse envoyée</p>
                    <p className="text-xs text-gray-400">à {selected.sender_email}</p>
                  </div>
                  <button onClick={() => { setReplyDone(false); setReplyOpen(true); }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors">
                    Répondre à nouveau
                  </button>
                </div>
              )}
              {!replyOpen && !replyDone && (
                <div className="px-6 py-4">
                  <button onClick={() => setReplyOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#1a7a45,#2ea05c)', boxShadow: '0 4px 12px rgba(26,122,69,0.25)' }}>
                    <Send className="h-4 w-4" /> Rédiger une réponse
                  </button>
                </div>
              )}
              {replyOpen && !replyDone && (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-500 px-6 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-400 uppercase tracking-wide">À :</span>
                    <span className="font-medium text-gray-700">{selected.sender_name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{selected.sender_email}</span>
                  </div>
                  <SendForm
                    fields={REPLY_FIELDS}
                    sending={replySending}
                    done={false}
                    onSend={handleSendReply}
                    onCancel={() => setReplyOpen(false)}
                  />
                </>
              )}
            </div>
          </>
        )}

        {/* ── État vide ── */}
        {!selected && !composeOpen && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
            <Eye className="h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-400">Sélectionnez un message ou rédigez-en un nouveau</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.href); return; }
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      setUser(currentUser);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const { data: mentors = [] }        = useQuery({ queryKey: ['mentors'],        queryFn: () => base44.entities.Mentor.list('-created_date'),                          enabled: !isLoading });
  const { data: mentores = [] }       = useQuery({ queryKey: ['mentores'],       queryFn: () => base44.entities.Mentore.list('-created_date'),                         enabled: !isLoading });
  const { data: binomes = [] }        = useQuery({ queryKey: ['binomes'],        queryFn: () => base44.entities.Binome.list('-created_date'),                          enabled: !isLoading });
  const { data: suivis = [] }         = useQuery({ queryKey: ['suivis'],         queryFn: () => base44.entities.SuiviMensuel.list('-created_date'),                    enabled: !isLoading });
  const { data: contactMsgs = [], refetch: refetchContacts } = useQuery({ queryKey: ['contact_messages'], queryFn: () => base44.entities.Message.filter({ binome_id: 'contact_form' }, '-created_date'), enabled: !isLoading });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-mbp.png" alt="MBP" className="w-16 h-16 rounded-full animate-pulse" style={{ boxShadow: '0 0 0 3px rgba(184,148,31,0.5)' }} />
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" style={{ borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  const stats = {
    totalMentors:    mentors.length,
    pendingMentors:  mentors.filter(m => m.status === 'pending').length,
    approvedMentors: mentors.filter(m => m.status === 'approved').length,
    totalMentores:    mentores.length,
    pendingMentores:  mentores.filter(m => m.status === 'pending').length,
    approvedMentores: mentores.filter(m => m.status === 'approved').length,
    activeBinomes:   binomes.filter(b => b.status === 'active').length,
    totalBinomes:    binomes.length,
    totalSuivis:     suivis.length,
    issuesReported:  suivis.filter(s => s.issues_reported).length,
    unreadContacts:  contactMsgs.filter(m => !m.read).length,
    avgSatisfaction: suivis.length > 0
      ? (suivis.reduce((acc, s) => acc + ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2, 0) / suivis.length).toFixed(1)
      : 0
  };

  const currentNav = NAV.find(n => n.id === activeTab);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo-mbp.png" alt="MBP" className="w-9 h-9 rounded-full flex-shrink-0" style={{ boxShadow: '0 0 0 2px rgba(184,148,31,0.5)' }} />
          <div>
            <p className="font-playfair font-bold text-sm leading-tight" style={{ color: '#f97316' }}>Passerelles</p>
            <p className="text-[9px] text-emerald-400 uppercase tracking-widest">Administration</p>
          </div>
        </div>
      </div>

      {/* Admin badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(184,148,31,0.15)', border: '1px solid rgba(184,148,31,0.3)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(184,148,31,0.3)', color: '#f0d060' }}>
            {user?.full_name?.[0] || user?.email?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">{user?.full_name || 'Admin'}</p>
            <p className="text-[10px]" style={{ color: '#d4aa35' }}>Administrateur</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {GROUPS.map(group => {
          const items = NAV.filter(n => n.group === group);
          return (
            <div key={group}>
              <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{group}</p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const count = item.count ? stats[item.count] : null;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-sm font-medium ${
                        active
                          ? 'text-white'
                          : 'text-white/55 hover:text-white hover:bg-white/8'
                      }`}
                      style={active ? { background: 'rgba(255,255,255,0.12)', borderLeft: '3px solid #d4aa35', paddingLeft: '9px' } : {}}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count !== null && count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.alert && count > 0 ? 'bg-red-500/80 text-white' : 'bg-white/15 text-white/70'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          to="/"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-white/55 hover:text-white hover:bg-white/8 transition-all"
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          <span>Voir le site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f4' }}>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 fixed top-0 left-0 h-screen z-40"
        style={{ background: 'linear-gradient(180deg, #0a3320 0%, #0f5530 50%, #0d4428 100%)' }}>
        <SidebarContent />
      </aside>

      {/* ── SIDEBAR MOBILE overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full z-10"
            style={{ background: 'linear-gradient(180deg, #0a3320 0%, #0f5530 50%, #0d4428 100%)' }}>
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-5 py-3 border-b"
          style={{ background: 'rgba(241,245,244,0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(0,0,0,0.08)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-black/5 transition-colors">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-1">
            <span className="text-gray-400">Admin</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            <span className="font-semibold text-gray-800">{currentNav?.label || 'Vue d\'ensemble'}</span>
          </div>

          {/* KPI pills */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {binomes.filter(b => b.status === 'active').length} binômes actifs
            </div>
            {stats.issuesReported > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle className="h-3 w-3" />
                {stats.issuesReported} alerte{stats.issuesReported > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </header>

        {/* ── OVERVIEW hero strip ── */}
        {activeTab === 'overview' && (
          <div className="px-5 pt-6 pb-4">
            <div className="rounded-2xl p-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f5530 0%, #1a7a45 50%, #155f38 100%)' }}>
              {/* Decorative */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
                style={{ background: 'radial-gradient(circle, #d4aa35, transparent)' }} />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/logo-mbp.png" alt="MBP" className="w-8 h-8 rounded-full" style={{ boxShadow: '0 0 0 2px rgba(212,170,53,0.5)' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d4aa35' }}>Programme <span style={{ color: '#f97316' }}>Passerelles</span> · Cohorte 1</span>
                  </div>
                  <h1 className="font-playfair text-2xl font-bold mb-1">Tableau de Bord Administrateur</h1>
                  <p className="text-emerald-200 text-sm">Ma Belle Promo · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Mini KPI strip */}
              <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Mentors', value: stats.totalMentors, sub: `${stats.approvedMentors} approuvés`, color: '#60a5fa' },
                  { label: 'Mentorés', value: stats.totalMentores, sub: `${stats.approvedMentores} approuvés`, color: '#a78bfa' },
                  { label: 'Binômes actifs', value: stats.activeBinomes, sub: `sur ${stats.totalBinomes} total`, color: '#34d399' },
                  { label: 'Satisfaction moy.', value: `${stats.avgSatisfaction}/5`, sub: `${stats.totalSuivis} suivis soumis`, color: '#fbbf24' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs font-semibold text-white mt-0.5">{k.label}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{k.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page header for non-overview tabs */}
        {activeTab !== 'overview' && (
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-3">
              {currentNav && <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
                <currentNav.icon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>}
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{currentNav?.label}</h2>
                <p className="text-xs text-gray-400">Programme PASSERELLES · Ma Belle Promo</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 px-5 py-4 pb-10">
          <div className={activeTab !== 'overview' ? 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5' : ''}>
            {activeTab === 'overview'      && <AdminStats stats={stats} />}
            {activeTab === 'mentors'       && <MentorsList mentors={mentors} />}
            {activeTab === 'mentores'      && <MentoresList mentores={mentores} />}
            {activeTab === 'matching'      && <MatchingTool mentors={mentors.filter(m => m.status === 'approved')} mentores={mentores.filter(m => m.status === 'approved')} />}
            {activeTab === 'binomes'       && <BinomesList binomes={binomes} />}
            {activeTab === 'suivis'        && <SuivisList suivis={suivis} />}
            {activeTab === 'analytique'    && <AnalytiqueDashboard binomes={binomes} suivis={suivis} />}
            {activeTab === 'charts'        && <ProgrammeCharts mentors={mentors} mentores={mentores} binomes={binomes} suivis={suivis} />}
            {activeTab === 'export'        && <ExportCSV />}
            {activeTab === 'import'        && <ImportCSV />}
            {activeTab === 'alertes'       && <AlertesBinomes />}
            {activeTab === 'images'        && <ImageManager />}
            {activeTab === 'declenchement' && <DeclenchementBinomes />}
            {activeTab === 'contacts'      && (
              <ContactMessagesView messages={contactMsgs} onMarkRead={async (msg) => {
                await base44.entities.Message.update(msg.id, { read: true });
                refetchContacts();
              }} onDelete={async (msg) => {
                await base44.entities.Message.delete(msg.id);
                refetchContacts();
              }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
