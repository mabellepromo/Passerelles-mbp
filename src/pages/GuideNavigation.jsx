import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContactModal from '@/components/ContactModal';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, ClipboardList, BookMarked, MessageCircle,
  Trophy, ChevronRight, ChevronDown, CheckCircle,
  Home, UserCheck, FileText, Calendar, ArrowRight,
  Lightbulb, AlertCircle, LogIn, BarChart2, Zap, Star, Smartphone
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'recommandations', icon: Smartphone, color: '#6366f1',
    grad: 'linear-gradient(135deg,#4f46e5,#6366f1)',
    light: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',
    title: 'Recommandations',
    subtitle: 'Installez Passerelles comme une application',
    steps: [
      { label: "Qu'est-ce qu'une PWA ?", desc: "Une Progressive Web App (PWA) est une application web pouvant être installée directement sur un smartphone. Elle offre une expérience proche d'une application native : accès depuis l'écran d'accueil, affichage en plein écran et utilisation fluide, sans passer par les stores." },
      { label: '📱 Sur Android', desc: "Ouvrez la PWA dans Chrome ou un navigateur compatible. Une invite d'installation peut apparaître automatiquement — sinon, ouvrez le menu du navigateur et sélectionnez Installer ou Ajouter à l'écran d'accueil. L'icône est alors ajoutée comme une application classique." },
      { label: '🍎 Sur iPhone (iOS)', desc: "Ouvrez la PWA dans Safari. Appuyez sur le bouton Partager, sélectionnez Ajouter à l'écran d'accueil, puis confirmez le nom du raccourci pour finaliser l'installation." },
    ],
    tip: "Un accès simplifié — Une fois installée, la PWA permet d'accéder à Passerelles de manière rapide, stable et intégrée, directement depuis l'écran d'accueil du téléphone.",
  },
  {
    id: 'connexion', icon: LogIn, color: '#1a7a45',
    grad: 'linear-gradient(135deg,#0f5530,#1a7a45)',
    light: 'rgba(26,122,69,0.08)', border: 'rgba(26,122,69,0.2)',
    title: 'Se connecter',
    subtitle: 'Point de départ indispensable',
    steps: [
      { label: 'Cliquez sur "Connexion"', desc: 'Bouton en haut à droite de la barre de navigation (ou via le menu hamburger ☰ sur mobile).' },
      { label: 'Email + mot de passe', desc: 'Utilisez les identifiants reçus par invitation. Sans invitation, contactez contact@mabellepromo.org.' },
      { label: 'Vérifiez votre accès', desc: 'Votre initiale apparaît en haut à droite et la barre personnalisée s\'affiche sur la page d\'accueil.' },
    ],
    tip: 'Si vous vous déconnectez, toutes vos données restent sauvegardées — reconnectez-vous simplement.',
  },
  {
    id: 'espace', icon: Home, color: '#2563eb',
    grad: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
    light: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)',
    title: 'Mon Espace',
    subtitle: 'Votre hub central',
    steps: [
      { label: 'Accédez via la navbar → "Mon Espace"', desc: 'Ou cliquez "Accéder à Mon Espace" depuis la page d\'accueil.' },
      { label: 'Consultez votre binôme', desc: 'Nom, spécialité et informations de contact de votre mentor/mentoré.' },
      { label: 'Utilisez les boutons d\'action rapide', desc: '"Nouvelle séance", "Journal", "Messagerie", "Bilan" — tout en 1 clic.' },
      { label: 'Suivez le compteur de séances', desc: 'Progression annuelle et prochain rendez-vous planifié.' },
    ],
    tip: 'C\'est votre point de départ à chaque connexion. Tout est accessible depuis ici en 1 clic.',
  },
  {
    id: 'suivi', icon: ClipboardList, color: '#7c3aed',
    grad: 'linear-gradient(135deg,#6d28d9,#7c3aed)',
    light: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)',
    title: 'Suivi Mensuel',
    subtitle: 'Obligatoire chaque mois après chaque séance',
    steps: [
      { label: '"Mon Espace" → "Nouvelle séance"', desc: 'Ou via la navbar → "Mon Suivi" pour l\'historique.' },
      { label: 'Remplissez les champs essentiels', desc: '📅 Date · ⏱ Durée · 📍 Format (présentiel/virtuel) · 📌 Objectifs abordés.' },
      { label: 'Notez succès et défis', desc: '"Succès récents du mentoré" + "Défis rencontrés" — soyez précis.' },
      { label: 'Actions à suivre', desc: '"Pour le mentoré" + "Pour le mentor" — deux colonnes d\'engagement.' },
      { label: 'Évaluez (1-5 étoiles)', desc: 'Satisfaction mentor + mentoré + progrès. Cochez "Signalement" si nécessaire.' },
      { label: 'Planifiez la prochaine séance', desc: 'Permet les rappels automatiques des séances manquées.' },
      { label: 'Cliquez "Enregistrer"', desc: 'Fiche sauvegardée et visible dans Mon Suivi + Mon Espace.' },
    ],
    tip: 'Remplissez la fiche le jour même ou au plus tard 48h après la séance.',
    warning: 'Une fiche par séance — ne regroupez pas plusieurs séances dans une seule fiche.',
  },
  {
    id: 'journal', icon: BookMarked, color: '#d97706',
    grad: 'linear-gradient(135deg,#b45309,#d97706)',
    light: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)',
    title: 'Journal de Bord',
    subtitle: 'Vos notes privées & objectifs',
    steps: [
      { label: '"Mon Espace" → "Journal"', desc: 'Journal privé — accessible uniquement à vous et votre binôme.' },
      { label: 'Cliquez "+ Nouvelle entrée"', desc: 'Types : Note de séance, Compte rendu, Objectif, Réflexion, Ressource.' },
      { label: 'Objectif SMART', desc: 'Type = "Objectif" → titre, échéance, progression (%), statut (En cours / Atteint / Abandonné).' },
      { label: 'Définissez la visibilité', desc: '"Les deux", "Mentor seulement", ou "Mentoré seulement".' },
      { label: 'Ajoutez des tags', desc: 'Mots-clés pour retrouver rapidement (ex: "carrière", "OHADA").' },
    ],
    tip: 'Complémentaire au suivi : pour réflexions profondes et objectifs long terme.',
  },
  {
    id: 'messagerie', icon: MessageCircle, color: '#e11d48',
    grad: 'linear-gradient(135deg,#be123c,#e11d48)',
    light: 'rgba(225,29,72,0.08)', border: 'rgba(225,29,72,0.2)',
    title: 'Messagerie',
    subtitle: 'Communiquer avec votre binôme',
    steps: [
      { label: 'Navbar → "Messagerie"', desc: 'Ou depuis "Mon Espace" → bouton "Messages". Connexion obligatoire.' },
      { label: 'Sélectionnez votre binôme', desc: 'La conversation apparaît automatiquement dans la liste.' },
      { label: 'Écrivez et envoyez', desc: 'Entrée pour envoyer · Shift+Entrée pour saut de ligne.' },
      { label: 'Notifications 🔔', desc: 'La cloche en navbar indique les messages non lus en temps réel.' },
    ],
    tip: 'Utilisez la messagerie pour planifier les séances, partager des ressources, confirmer les disponibilités.',
  },
  {
    id: 'cohorte', icon: Trophy, color: '#0891b2',
    grad: 'linear-gradient(135deg,#0e7490,#0891b2)',
    light: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.2)',
    title: 'Résultats Cohorte 1',
    subtitle: 'Consulter les 11 binômes officiels',
    steps: [
      { label: '"Cohorte 1" dans la navbar', desc: 'Page publique — accessible sans connexion.' },
      { label: 'Parcourez les 11 binômes', desc: 'Mentor, mentoré, domaine et score de compatibilité.' },
      { label: 'Cliquez pour la fiche complète', desc: 'Contact, disponibilités, spécialisations, justificatif d\'appariement.' },
      { label: 'Sections complémentaires', desc: 'Réservistes, Méthodologie (100 pts, 5 IA), "Et Ensuite ?".' },
    ],
    tip: 'La fiche détaillée n\'est accessible qu\'aux membres du binôme et à l\'admin.',
  },
  {
    id: 'bilan', icon: BarChart2, color: '#059669',
    grad: 'linear-gradient(135deg,#047857,#059669)',
    light: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.2)',
    title: 'Bilan Final',
    subtitle: 'En fin de programme',
    steps: [
      { label: '"Mon Espace" → "Bilan"', desc: 'Disponible en fin d\'année universitaire.' },
      { label: 'Remplissez votre évaluation', desc: 'Objectifs atteints, qualité d\'accompagnement, satisfaction (1-5), compétences.' },
      { label: 'Rédigez votre témoignage', desc: 'Optionnel mais précieux pour les prochaines cohortes.' },
      { label: 'Soumettez', desc: 'Transmis à MBP pour délivrance des certificats.' },
    ],
    tip: 'Mentor ET mentoré doivent chacun remplir leur propre bilan.',
  },
];

const QUICKLINKS = [
  { label: 'Accueil',      to: '/',                    icon: Home,          color: '#1a7a45' },
  { label: 'Mon Espace',   to: '/MonEspace',            icon: UserCheck,     color: '#2563eb' },
  { label: 'Mon Suivi',    to: '/MonSuivi',             icon: ClipboardList, color: '#7c3aed' },
  { label: 'Journal',      to: '/JournalDeBord',        icon: BookMarked,    color: '#d97706' },
  { label: 'Messagerie',   to: '/Messagerie',           icon: MessageCircle, color: '#e11d48' },
  { label: 'Cohorte 1',    to: '/ResultatsCohorte1',    icon: Trophy,        color: '#0891b2' },
];

const PARCOURS = [
  { icon: '🔐', label: 'Connexion',      sub: 'Navbar → Connexion' },
  { icon: '🏠', label: 'Mon Espace',     sub: 'Vue globale' },
  { icon: '📅', label: 'Séance',         sub: 'Rencontre binôme' },
  { icon: '📝', label: 'Suivi Mensuel',  sub: 'Remplir la fiche' },
  { icon: '📒', label: 'Journal',        sub: 'Notes & objectifs' },
  { icon: '💬', label: 'Messagerie',     sub: 'Prochain RDV' },
];

export default function GuideNavigation() {
  const [openSection, setOpenSection] = useState('connexion');
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f4' }}>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <NavBar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0a2e18 0%,#0f5530 50%,#1a7a45 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute -top-24 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle,#d4aa35,transparent)' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background:'rgba(184,148,31,0.2)', border:'1px solid rgba(212,170,53,0.4)', color:'#fde68a' }}>
            <BookOpen className="h-3.5 w-3.5" /> Guide pratique · Plateforme Passerelles
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-white mb-4 leading-tight">
            Comment utiliser la plateforme
          </h1>
          <p className="text-emerald-200 text-sm max-w-xl mx-auto leading-relaxed">
            Tout ce qu'il faut savoir : connexion, suivi mensuel, journal de bord, messagerie et plus.
          </p>

          {/* Quick links pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {QUICKLINKS.map(({ label, to, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.color = color; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARCOURS RECOMMANDÉ ── */}
      <section className="bg-white border-b border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-5">Parcours recommandé chaque mois</p>
          <div className="flex flex-wrap items-center justify-center gap-0">
            {PARCOURS.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center text-center w-[80px] sm:w-[90px]">
                  <div className="w-12 h-12 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center text-xl shadow-sm mb-2 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    {step.icon}
                  </div>
                  <p className="text-xs font-bold text-gray-700">{step.label}</p>
                  <p className="text-[10px] text-gray-400">{step.sub}</p>
                </div>
                {i < PARCOURS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-200 flex-shrink-0 mx-1 -mt-5 hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTIONS GUIDE ── */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">

            {/* Sidebar navigation (desktop) */}
            <aside className="hidden lg:flex flex-col gap-1 self-start sticky top-20">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Sections</p>
              {SECTIONS.map((sec, i) => {
                const Icon = sec.icon;
                const isOpen = openSection === sec.id;
                return (
                  <button key={sec.id} onClick={() => setOpenSection(isOpen ? null : sec.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm"
                    style={isOpen
                      ? { background: sec.light, color: sec.color, fontWeight: 700, borderLeft: `3px solid ${sec.color}`, paddingLeft: 9 }
                      : { color: '#6b7280', fontWeight: 500 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isOpen ? sec.grad : 'rgba(0,0,0,0.05)' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: isOpen ? 'white' : '#9ca3af' }} />
                    </div>
                    <span className="text-xs truncate">{i + 1}. {sec.title}</span>
                  </button>
                );
              })}
            </aside>

            {/* Content */}
            <div className="space-y-3">
              {SECTIONS.map((sec, idx) => {
                const Icon = sec.icon;
                const isOpen = openSection === sec.id;
                return (
                  <motion.div key={sec.id}
                    initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: idx * 0.04 }}>

                    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border"
                      style={{ borderColor: isOpen ? sec.border : '#f3f4f6', transition:'border-color 0.2s' }}>

                      {/* Header */}
                      <button onClick={() => setOpenSection(isOpen ? null : sec.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: sec.grad, boxShadow: `0 4px 12px ${sec.color}30` }}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: sec.light, color: sec.color }}>
                              {idx + 1}
                            </span>
                            <p className="font-bold text-gray-900 text-sm">{sec.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{sec.subtitle}</p>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-300 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Content */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden">
                            <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${sec.border}` }}>
                              {/* Colored top strip */}
                              <div className="h-0.5 w-12 rounded-full mt-4" style={{ background: sec.grad }} />

                              {/* Steps */}
                              <ol className="space-y-3.5">
                                {sec.steps.map((step, i) => (
                                  <li key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                                      style={{ background: sec.grad }}>
                                      {i + 1}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                                    </div>
                                  </li>
                                ))}
                              </ol>

                              {/* Tip */}
                              {sec.tip && (
                                <div className="flex gap-3 rounded-xl p-3.5" style={{ background: sec.light, border: `1px solid ${sec.border}` }}>
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sec.grad }}>
                                    <Lightbulb className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed"><strong style={{ color: sec.color }}>Conseil :</strong> {sec.tip}</p>
                                </div>
                              )}

                              {/* Warning */}
                              {sec.warning && (
                                <div className="flex gap-3 bg-amber-50 rounded-xl p-3.5 border border-amber-200">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500">
                                    <AlertCircle className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed"><strong className="text-amber-700">Important :</strong> {sec.warning}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
