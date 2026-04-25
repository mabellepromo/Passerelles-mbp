import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44, supabase } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  User, Users, BookOpen, ClipboardList, Plus, ArrowRight,
  CheckCircle2, Clock, TrendingUp, Target, Calendar, AlertCircle,
  UserCheck, GraduationCap, Trophy, MessageCircle, Star,
  Flame, Zap, BarChart3, BookMarked, ChevronRight, LogOut, Trash2, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { formatName } from '@/lib/formatName';
import Footer from '@/components/Footer';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay }
});

export default function MonEspace() {
  const [user, setUser] = useState(null);
  const [allUserBinomes, setAllUserBinomes] = useState([]);
  const [suivis, setSuivis] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'SUPPRIMER') return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur inconnue');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      setDeleteError(e.message);
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const u = await base44.auth.me();
        if (!u) { base44.auth.redirectToLogin(window.location.href); return; }
        setUser(u);
        const [binomesRes, sv, journal] = await Promise.all([
          base44.functions.invoke('getMyBinomes', {}),
          base44.entities.SuiviMensuel.list('-meeting_date', 30),
          base44.entities.JournalDeBord.list('-date_entree', 100),
        ]);
        setAllUserBinomes(binomesRes.data?.binomes || []);
        setSuivis(sv);
        setJournalEntries(journal);
      } catch (e) {
        if (e?.status === 401 || e?.status === 403) base44.auth.redirectToLogin(window.location.href);
      } finally {
        setPageLoading(false);
      }
    };
    loadAll();
  }, []);

  const mentorBinomes  = allUserBinomes.filter(b => b.mentor_email  === user?.email);
  const mentoreBinomes = allUserBinomes.filter(b => b.mentore_email === user?.email);
  const allBinomes     = [...mentorBinomes, ...mentoreBinomes];
  const isMentor  = mentorBinomes.length  > 0;
  const isMentore = mentoreBinomes.length > 0;

  const objectives       = journalEntries.filter(e => e.type === 'objectif');
  const objectifsAtteints = objectives.filter(e => e.objectif_statut === 'atteint').length;
  const objectifsEnCours  = objectives.filter(e => e.objectif_statut === 'en_cours').length;
  const avgProgress       = objectives.length > 0
    ? Math.round(objectives.reduce((s, e) => s + (e.objectif_progression || 0), 0) / objectives.length) : 0;
  const lastSuivi  = suivis[0];
  const daysSince  = lastSuivi ? Math.floor((new Date() - new Date(lastSuivi.meeting_date)) / 86400000) : null;
  const needsReminder = (daysSince === null || daysSince > 35) && allBinomes.length > 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f5530,#1a7a45)' }}>
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-mbp.png" alt="MBP" className="w-14 h-14 rounded-full animate-pulse" style={{ boxShadow: '0 0 0 3px rgba(212,170,53,0.5)' }} />
          <div className="w-7 h-7 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  const initials = (name) => name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';

  const QUICK = [
    { to: createPageUrl('MonSuivi'),     icon: ClipboardList, label: 'Mes Suivis',     sub: 'Historique séances',    grad: ['#2563eb','#1d4ed8'], light: '#eff6ff' },
    { to: createPageUrl('JournalDeBord'),icon: BookMarked,    label: 'Journal',         sub: 'Notes & objectifs',     grad: ['#7c3aed','#6d28d9'], light: '#f5f3ff' },
    { to: createPageUrl('SuiviMensuel'), icon: Plus,          label: 'Nouvelle séance', sub: 'Enregistrer une séance',grad: ['#059669','#047857'], light: '#ecfdf5' },
    { to: createPageUrl('Messagerie'),   icon: MessageCircle, label: 'Messagerie',      sub: 'Chat binôme',           grad: ['#0891b2','#0e7490'], light: '#ecfeff' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f4' }}>
      <NavBar />

      {/* ── HERO HEADER ── */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0a2e18 0%,#0f5530 45%,#1a7a45 100%)' }}>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle,#d4aa35,transparent)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Gold bar */}
          <div className="h-0.5 w-16 rounded-full mb-6" style={{ background: 'linear-gradient(90deg,#b8941f,#d4aa35)' }} />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white font-playfair"
                  style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))', border: '1.5px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                  {initials(user?.full_name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0f5530] flex items-center justify-center"
                  style={{ background: '#34d399' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div>
                <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">Mon espace</p>
                <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-white leading-tight">
                  Bonjour, {user?.full_name || 'vous'} 👋
                </h1>
                <p className="text-emerald-300/80 text-sm mt-1">{user?.email}</p>
              </div>
            </div>

            {/* Role badges */}
            <div className="flex gap-2 flex-wrap">
              {isMentor  && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',color:'#a7f3d0' }}><UserCheck className="h-3 w-3" />Mentor</span>}
              {isMentore && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',color:'#c4b5fd' }}><GraduationCap className="h-3 w-3" />Mentoré(e)</span>}
              {user?.role === 'admin' && <Link to="/AdminDashboard" className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background:'rgba(184,148,31,0.25)',border:'1px solid rgba(212,170,53,0.5)',color:'#fde68a' }}>⚙ Admin</Link>}
            </div>
          </div>

          {/* KPI strip */}
          {allBinomes.length > 0 && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Calendar,     label: 'Séances',         value: suivis.length,      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
                { icon: Target,       label: 'En cours',        value: objectifsEnCours,   color: '#c4b5fd', bg: 'rgba(196,181,253,0.12)' },
                { icon: CheckCircle2, label: 'Atteints',        value: objectifsAtteints,  color: '#6ee7b7', bg: 'rgba(110,231,183,0.12)' },
                { icon: TrendingUp,   label: 'Progression moy.',value: `${avgProgress}%`, color: '#fcd34d', bg: 'rgba(252,211,77,0.12)'  },
              ].map(k => (
                <div key={k.label} className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: k.bg, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                  <k.icon className="h-5 w-5 flex-shrink-0" style={{ color: k.color }} />
                  <div>
                    <p className="text-lg font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* ── ALERTE ── */}
        {needsReminder && (
          <motion.div {...fade(0)} className="rounded-2xl p-4 flex items-start gap-3 border"
            style={{ background:'#fffbeb', borderColor:'#fcd34d' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#fef3c7' }}>
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">Suivi mensuel à enregistrer</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {daysSince === null ? 'Aucun suivi enregistré pour le moment.' : `Votre dernier suivi date de ${daysSince} jours.`} Pensez à documenter votre séance !
              </p>
            </div>
            <Link to={createPageUrl('SuiviMensuel')} className="flex-shrink-0">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 rounded-lg">Créer un suivi</Button>
            </Link>
          </motion.div>
        )}

        {/* ── BINÔME(S) ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full" style={{ background:'linear-gradient(180deg,#1a7a45,#0f5530)' }} />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">{allBinomes.length > 1 ? 'Mes Binômes' : 'Mon Binôme'}</h2>
          </div>

          {allBinomes.length === 0 ? (
            <motion.div {...fade(0.1)} className="rounded-2xl p-10 text-center bg-white shadow-sm border border-gray-100">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background:'#f0fdf4' }}>
                <Users className="h-8 w-8 text-emerald-200" />
              </div>
              <p className="font-semibold text-gray-600">Aucun binôme actif pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">Vous serez notifié par email dès qu'un appariement sera réalisé.</p>
            </motion.div>
          ) : allBinomes.map((binome, idx) => {
            const iAmMentor = binome.mentor_email === user?.email;
            const partner   = formatName(iAmMentor ? binome.mentore_name : binome.mentor_name);
            const binomeSuivis  = suivis.filter(s => s.binome_id === binome.id);
            const binomeJournal = journalEntries.filter(j => j.binome_id === binome.id);
            const statusLabel   = { active:'Actif', paused:'Suspendu', completed:'Complété', terminated:'Terminé' }[binome.status] || binome.status;
            const statusColor   = binome.status === 'active' ? '#10b981' : binome.status === 'paused' ? '#f59e0b' : '#94a3b8';

            return (
              <motion.div key={binome.id} {...fade(idx * 0.1)}>
                <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
                  {/* Card header */}
                  <div className="relative p-6 overflow-hidden text-white"
                    style={{ background:'linear-gradient(135deg,#0a2e18 0%,#0f5530 50%,#1a7a45 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.05]"
                      style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize:'24px 24px' }} />
                    <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-10"
                      style={{ background:'radial-gradient(circle,#d4aa35,transparent)' }} />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        {/* Partner avatar */}
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                          style={{ background: iAmMentor ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,#1a7a45,#0f5530)', border:'2px solid rgba(255,255,255,0.2)' }}>
                          {initials(partner)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: iAmMentor ? '#c4b5fd' : '#6ee7b7' }}>
                            {iAmMentor ? 'Votre mentoré(e)' : 'Votre mentor(e)'}
                          </p>
                          <p className="text-xl font-bold font-playfair">{partner}</p>
                          {binome.match_date && <p className="text-xs text-white/50 mt-0.5">Binôme formé le {binome.match_date}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background:`${statusColor}22`, border:`1px solid ${statusColor}55`, color: statusColor }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                        {statusLabel}
                      </div>
                    </div>
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    {[
                      { value: binomeSuivis.length,  label: 'Séances',     color:'#059669', bg:'#f0fdf4' },
                      { value: binomeJournal.length,  label: 'Notes',       color:'#7c3aed', bg:'#f5f3ff' },
                      { value: binome.meeting_frequency === 'weekly' ? 'Hebdo' : binome.meeting_frequency === 'biweekly' ? 'Bimensuel' : 'Mensuel', label:'Fréquence', color:'#d97706', bg:'#fffbeb' },
                    ].map(s => (
                      <div key={s.label} className="py-4 text-center" style={{ background: s.bg }}>
                        <p className="text-xl font-bold capitalize" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar (séances vs objectif 12/an) */}
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400">Progression annuelle</span>
                      <span className="text-xs font-bold text-emerald-700">{binomeSuivis.length}/12 séances</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width:`${Math.min(100, Math.round(binomeSuivis.length / 12 * 100))}%`, background:'linear-gradient(90deg,#1a7a45,#34d399)' }} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="p-4 flex gap-2 flex-wrap bg-white">
                    <Link to={`${createPageUrl('SuiviMensuel')}?binome_id=${binome.id}`}>
                      <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-white transition-all hover:opacity-90"
                        style={{ background:'linear-gradient(135deg,#1a7a45,#2ea05c)' }}>
                        <Plus className="h-3.5 w-3.5" /> Nouveau suivi
                      </button>
                    </Link>
                    <Link to={`${createPageUrl('JournalDeBord')}?binome_id=${binome.id}`}>
                      <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-violet-50"
                        style={{ border:'1.5px solid #ddd6fe', color:'#7c3aed' }}>
                        <BookOpen className="h-3.5 w-3.5" /> Journal
                      </button>
                    </Link>
                    <Link to={`${createPageUrl('BilanFinal')}?binome_id=${binome.id}`}>
                      <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-amber-50"
                        style={{ border:'1.5px solid #fcd34d', color:'#d97706' }}>
                        <Trophy className="h-3.5 w-3.5" /> Bilan final
                      </button>
                    </Link>
                    <Link to={`${createPageUrl('Messagerie')}?binome_id=${binome.id}`}>
                      <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-sky-50"
                        style={{ border:'1.5px solid #bae6fd', color:'#0891b2' }}>
                        <MessageCircle className="h-3.5 w-3.5" /> Messages
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── ACCÈS RAPIDE ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full" style={{ background:'linear-gradient(180deg,#1a7a45,#0f5530)' }} />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Accès rapide</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK.map(({ to, icon: Icon, label, sub, grad, light }, i) => (
              <motion.div key={to} {...fade(i * 0.07)}>
                <Link to={to}>
                  <div className="group rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer">
                    <div className="h-1 w-full" style={{ background:`linear-gradient(90deg,${grad[0]},${grad[1]})` }} />
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                        style={{ background:`linear-gradient(135deg,${grad[0]},${grad[1]})` }}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── DERNIÈRES SÉANCES ── */}
        {suivis.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full" style={{ background:'linear-gradient(180deg,#1a7a45,#0f5530)' }} />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Dernières séances</h2>
              </div>
              <Link to={createPageUrl('MonSuivi')} className="text-xs text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
                Tout voir <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {suivis.slice(0, 4).map((s, i) => (
                <motion.div key={s.id} {...fade(i * 0.05)}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#0f5530,#1a7a45)' }}>
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {s.mentor_name && s.mentore_name ? `${s.mentor_name} ↔ ${s.mentore_name}` : `Séance #${s.meeting_number || i + 1}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.meeting_date} · {s.duration_hours}h · {s.format === 'presentiel' ? '📍 Présentiel' : '💻 Virtuel'}
                      </p>
                    </div>
                    {(s.satisfaction_mentor || s.satisfaction_mentore) && (
                      <div className="flex-shrink-0 flex items-center gap-0.5">
                        {[...Array(s.satisfaction_mentor || s.satisfaction_mentore || 0)].map((_, k) => (
                          <Star key={k} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {/* ── COMPTE & DONNÉES ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#1a7a45,#0f5530)' }} />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Compte &amp; Données</h2>
          </div>
          <motion.div {...fade(0)}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                  <Shield className="h-4.5 w-4.5 text-emerald-600" style={{ height: 18, width: 18 }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Vos données personnelles</p>
                  <p className="text-xs text-gray-400">Consultez notre politique de confidentialité ou demandez la suppression de votre compte.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/PolitiqueConfidentialite">
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-emerald-50"
                    style={{ border: '1.5px solid #a7f3d0', color: '#059669' }}>
                    <Shield className="h-3.5 w-3.5" /> Politique de confidentialité
                  </button>
                </Link>
                <button
                  onClick={() => { setDeleteConfirm(true); setDeleteInput(''); setDeleteError(''); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-red-50"
                  style={{ border: '1.5px solid #fecaca', color: '#dc2626' }}>
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer mon compte
                </button>
              </div>

              {/* Confirmation suppression */}
              {deleteConfirm && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <p className="font-bold text-red-800 text-sm">Supprimer définitivement votre compte</p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Cette action est irréversible. Toutes vos données personnelles (profil, suivis, journal, messages) seront effacées dans un délai de 30 jours.
                  </p>
                  <p className="text-xs text-red-600 font-medium">Tapez <strong>SUPPRIMER</strong> pour confirmer :</p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                  {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteInput !== 'SUPPRIMER' || isDeleting}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg text-white disabled:opacity-40 transition-all"
                      style={{ background: '#dc2626' }}>
                      {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
