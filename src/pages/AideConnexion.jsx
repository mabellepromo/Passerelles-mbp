import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, CheckCircle, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

/* ── Composant "fenêtre navigateur" réutilisable ── */
function BrowserFrame({ label, children }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 mt-4">
      {/* Barre navigateur */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200" style={{ background: '#f1f3f4' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 mx-2 px-3 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-500">
          <svg className="h-3 w-3 text-gray-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2z"/><path d="M7.5 4v4.5H5l3 3.5 3-3.5H8.5V4z" opacity=".4"/></svg>
          passerelles.vercel.app/login
        </div>
      </div>
      {/* Label de la capture */}
      <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-white"
        style={{ background: '#374151' }}>
        {label}
      </div>
      {/* Contenu */}
      <div style={{ background: '#1a7a45' }} className="p-6 flex justify-center">
        {children}
      </div>
    </div>
  );
}

/* ── Maquette : carte login ── */
function LoginCard({ activeTab = 'premiere', showFilled = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
      <div className="flex flex-col items-center mb-5">
        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
          <svg className="h-5 w-5" style={{ color: '#1a7a45' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <h2 className="font-bold text-gray-900 text-base">
          {activeTab === 'connexion' ? 'Connexion' : 'Premiere connexion'}
        </h2>
        <p className="text-gray-400 text-xs mt-0.5">Programme PASSERELLES · Ma Belle Promo</p>
      </div>

      {/* Onglets */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 text-xs font-semibold">
        <button className={`flex-1 py-1.5 text-center transition-all ${activeTab === 'connexion' ? 'bg-emerald-800 text-white' : 'bg-gray-50 text-gray-500'}`}>
          Connexion
        </button>
        <button className={`flex-1 py-1.5 text-center transition-all ${activeTab === 'premiere' ? 'bg-emerald-800 text-white' : 'bg-gray-50 text-gray-500'}`}>
          Premiere fois
        </button>
        <button className={`flex-1 py-1.5 text-center transition-all ${activeTab === 'oubli' ? 'bg-emerald-800 text-white' : 'bg-gray-50 text-gray-500'}`}>
          Mot de passe oublié
        </button>
      </div>

      {activeTab === 'premiere' && (
        <>
          <p className="text-xs text-gray-500 mb-3 text-center">
            Vous êtes mentor ou mentore sélectionné ? Entrez votre email pour recevoir un lien et créer votre mot de passe.
          </p>
          <label className="block text-xs font-medium text-gray-700 mb-1">Votre adresse email</label>
          <div className="w-full px-3 py-2 rounded-lg border text-xs mb-3"
            style={{ borderColor: showFilled ? '#1a7a45' : '#d1d5db', background: showFilled ? '#f0fdf4' : '#f9fafb', color: showFilled ? '#111' : '#9ca3af' }}>
            {showFilled ? 'votre.nom@exemple.com' : 'votre@email.com'}
          </div>
          <button className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
            Recevoir mon lien d'accès
          </button>
        </>
      )}

      {activeTab === 'connexion' && (
        <>
          <label className="block text-xs font-medium text-gray-700 mb-1">Adresse email</label>
          <div className="w-full px-3 py-2 rounded-lg border text-xs mb-3"
            style={{ borderColor: showFilled ? '#1a7a45' : '#d1d5db', background: showFilled ? '#f0fdf4' : '#f9fafb', color: showFilled ? '#111' : '#9ca3af' }}>
            {showFilled ? 'votre.nom@exemple.com' : 'votre@email.com'}
          </div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe</label>
          <div className="w-full px-3 py-2 rounded-lg border text-xs mb-3 flex items-center justify-between"
            style={{ borderColor: showFilled ? '#1a7a45' : '#d1d5db', background: showFilled ? '#f0fdf4' : '#f9fafb', color: '#111' }}>
            <span>{showFilled ? '••••••••' : ''}</span>
            <Eye className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <button className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
            Se connecter
          </button>
        </>
      )}
    </div>
  );
}

/* ── Maquette : page mot de passe ── */
function PasswordCard({ filled = false }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6">
      <div className="flex flex-col items-center mb-5">
        <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
          <svg className="h-5 w-5" style={{ color: '#1a7a45' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h2 className="font-bold text-gray-900 text-base">Nouveau mot de passe</h2>
        <p className="text-gray-400 text-xs mt-0.5">Programme PASSERELLES · Ma Belle Promo</p>
      </div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
      <div className="w-full px-3 py-2 rounded-lg border text-xs mb-3"
        style={{ borderColor: filled ? '#1a7a45' : '#d1d5db', background: filled ? '#f0fdf4' : '#f9fafb', color: '#111' }}>
        {filled ? '••••••••••' : <span className="text-gray-400">minimum 6 caractères</span>}
      </div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
      <div className="w-full px-3 py-2 rounded-lg border text-xs mb-3"
        style={{ borderColor: filled ? '#1a7a45' : '#d1d5db', background: filled ? '#f0fdf4' : '#f9fafb', color: '#111' }}>
        {filled ? '••••••••••' : <span className="text-gray-400">minimum 6 caractères</span>}
      </div>
      <button className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
        Enregistrer mon mot de passe
      </button>
    </div>
  );
}

/* ── Maquette : aperçu email ── */
function EmailPreview({ isReset = false }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden w-full max-w-sm shadow">
      {/* En-tête email client */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1a7a45' }}>C</div>
        <div>
          <p className="text-xs font-semibold text-gray-800">contact@mabellepromo.org</p>
          <p className="text-[10px] text-gray-400">À : moi · {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        </div>
      </div>
      {/* Corps email */}
      <div>
        {/* Header email */}
        <div className="px-6 py-5 text-center" style={{ background: '#0f5530' }}>
          <div className="w-12 h-12 rounded-full bg-white/10 border-2 mx-auto mb-3 flex items-center justify-center" style={{ borderColor: '#d4aa35' }}>
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <p className="text-white font-bold text-sm">Association Ma Belle Promo (MBP)</p>
          <p className="text-emerald-200 text-[10px] mt-0.5">Programme PASSERELLES · Cohorte 1 – 2026</p>
        </div>
        {/* Bande or */}
        <div className="h-0.5" style={{ background: '#d4aa35' }} />
        {/* Corps */}
        <div className="bg-white px-5 py-4">
          <p className="text-xs text-gray-700 mb-2">Bonjour <strong>Prénom</strong>,</p>
          <p className="text-xs text-gray-700 leading-relaxed mb-4">
            {isReset
              ? 'Un compte existe déjà pour cette adresse dans le Programme PASSERELLES. Cliquez sur le bouton ci-dessous pour définir ou réinitialiser votre mot de passe et accéder à votre espace personnel.'
              : 'Votre adresse email a été reconnue en tant que mentoré(e) du Programme PASSERELLES. Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace personnel.'}
          </p>
          <div className="text-center mb-4">
            <span className="inline-block px-6 py-2.5 rounded-lg text-white text-xs font-bold" style={{ background: '#0f5530' }}>
              {isReset ? 'Accéder à mon espace' : 'Créer mon compte'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 text-center">Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
        {/* Footer email */}
        <div className="bg-gray-100 px-5 py-3 text-center border-t border-gray-200">
          <p className="text-[10px] text-gray-500">Association Ma Belle Promo – Lomé, Togo</p>
          <p className="text-[10px] text-gray-400">contact@mabellepromo.org · +228 96 09 07 07</p>
        </div>
      </div>
    </div>
  );
}

/* ── Maquette : espace personnel ── */
function DashboardPreview() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-full max-w-sm shadow">
      {/* NavBar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100" style={{ background: '#0a2e18' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border flex items-center justify-center" style={{ borderColor: '#d4aa35' }}>
            <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
          </div>
          <span className="text-white text-[10px] font-bold">Passerelles</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-300 text-[10px] hidden sm:block">Accueil</span>
          <span className="text-emerald-300 text-[10px] hidden sm:block">Mon Espace</span>
          <span className="text-emerald-300 text-[10px] hidden sm:block">Guide</span>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">J</div>
            <span className="text-white text-[10px] font-medium">Jane John</span>
          </div>
          <span className="text-red-300 text-[10px]">⊣ Quitter</span>
        </div>
      </div>
      {/* Indicateur succès */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>
        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-800 font-semibold">Votre nom apparaît en haut à droite — vous êtes connecté(e) !</p>
      </div>
      {/* Mini hero */}
      <div className="px-4 py-4" style={{ background: 'linear-gradient(135deg, #0a2e18, #1a7a45)' }}>
        <p className="text-emerald-200 text-[10px] mb-1">Association Ma Belle Promo · Lomé, Togo</p>
        <p className="text-white font-bold text-sm leading-tight">Façonnez l'avenir<br /><span style={{ color: '#d4aa35' }}>juridique</span> du Togo</p>
        <div className="flex gap-2 mt-3">
          <span className="text-[10px] text-white bg-white/15 rounded-lg px-2 py-1">Mon Espace →</span>
          <span className="text-[10px] text-white bg-white/15 rounded-lg px-2 py-1">Voir les binômes</span>
        </div>
      </div>
    </div>
  );
}

/* ── Bloc étape ── */
function Step({ number, phase, phaseColor, title, icon, notes = [], children, custom }) {
  return (
    <motion.div
      custom={custom}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative"
    >
      {/* Étiquette de phase */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow"
          style={{ background: `linear-gradient(135deg, ${phaseColor}, ${phaseColor}bb)` }}>
          {number}
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: phaseColor }}>
          {phase}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Titre */}
        <div className="px-6 pt-5 pb-1 flex items-center gap-2">
          <span style={{ color: phaseColor }}>{icon}</span>
          <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
        </div>

        <div className="px-6 pb-6">
          {/* Instructions */}
          <div className="text-sm text-gray-700 leading-relaxed space-y-2 mt-3">
            {children}
          </div>

          {/* Notes */}
          {notes.map((note, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-xs mt-3 ${note.type === 'warning' ? 'text-amber-800' : note.type === 'tip' ? 'text-gray-600' : 'text-emerald-800'}`}
              style={
                note.type === 'warning'
                  ? { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }
                  : note.type === 'tip'
                  ? { background: '#f9fafb', border: '1px solid #e5e7eb' }
                  : { background: 'rgba(26,122,69,0.07)', border: '1px solid rgba(26,122,69,0.18)' }
              }>
              <span className="mt-0.5 flex-shrink-0">
                {note.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                  : note.type === 'tip' ? <Mail className="h-4 w-4 text-gray-400" />
                  : <CheckCircle className="h-4 w-4 text-emerald-600" />}
              </span>
              <span dangerouslySetInnerHTML={{ __html: note.text }} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════ */
export default function AideConnexion() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f6f0' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a2e18 0%, #0f5530 45%, #1a7a45 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(184,148,31,0.4)', color: '#f0d060' }}>
              Programme PASSERELLES · Guide de connexion
            </span>
            <h1 className="font-bold text-white mb-4"
              style={{ fontFamily: 'Libre Baskerville, serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.2 }}>
              Première connexion :<br />mode d'emploi illustré
            </h1>
            <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Suivez ces étapes dans l'ordre — vous serez connecté(e) en moins de 5 minutes.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-emerald-300/70">
              <span className="w-8 h-px bg-emerald-300/30" />
              6 étapes
              <span className="w-8 h-px bg-emerald-300/30" />
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48L1440 48L1440 24C1200 48 960 0 720 16C480 32 240 48 0 24L0 48Z" fill="#f8f6f0" />
          </svg>
        </div>
      </section>

      {/* ── INTRO ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(26,122,69,0.07)', border: '1px solid rgba(26,122,69,0.15)' }}>
          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#1a7a45' }} />
          <p className="text-sm text-gray-700 leading-relaxed">
            La connexion à PASSERELLES fonctionne par <strong>lien magique à usage unique</strong>.
            Chaque lien est personnel, temporaire et s'invalide dès qu'il est cliqué.
            Ce guide illustré vous explique pas à pas comment créer votre compte.
          </p>
        </motion.div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1 space-y-10">

        {/* ════ PHASE 1 ════ */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: 'rgba(26,122,69,0.2)' }} />
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-white"
              style={{ background: '#1a7a45' }}>Phase 1 · Demande de lien</span>
            <div className="h-px flex-1" style={{ background: 'rgba(26,122,69,0.2)' }} />
          </div>

          <Step
            number={1} custom={0}
            phase="Étape 1"
            phaseColor="#1a7a45"
            icon={<LogIn className="h-5 w-5" />}
            title='Rendez-vous sur la page de connexion, onglet "Premiere fois"'
            notes={[
              {
                type: 'warning',
                text: '<strong>Adresse exacte obligatoire</strong> — utilisez celle renseignée lors de votre candidature, sinon la base de données ne vous reconnaîtra pas.',
              },
            ]}
          >
            <p>
              Ouvrez votre navigateur, accédez à{' '}
              <a href="https://passerelles.vercel.app/login" className="font-semibold text-emerald-700 underline underline-offset-2">
                passerelles.vercel.app/login
              </a>,
              puis cliquez sur l'onglet{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-800 text-white mx-0.5">
                Premiere fois
              </span>.
              Saisissez l'adresse email avec laquelle vous avez reçu votre invitation, puis cliquez sur{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-800 text-white mx-0.5">
                Recevoir mon lien d'accès
              </span>.
            </p>

            <BrowserFrame label="PAGE LOGIN — ONGLET « PREMIERE FOIS » ACTIF">
              <LoginCard activeTab="premiere" />
            </BrowserFrame>
          </Step>
        </div>

        {/* ════ PHASE 2 ════ */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: 'rgba(184,148,31,0.25)' }} />
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-white"
              style={{ background: '#b8941f' }}>Phase 2 · Email d'invitation</span>
            <div className="h-px flex-1" style={{ background: 'rgba(184,148,31,0.25)' }} />
          </div>

          <Step
            number={2} custom={1}
            phase="Étape 2"
            phaseColor="#b8941f"
            icon={<Mail className="h-5 w-5" />}
            title='Ouvrez votre boîte mail et cliquez sur le bouton'
            notes={[
              {
                type: 'success',
                text: 'Ce lien est valable <strong>24 heures</strong> et est à usage unique — un clic = lien expiré. Chaque nouveau lien annule le précédent.',
              },
              {
                type: 'tip',
                text: 'Email introuvable ? Vérifiez votre dossier <strong>Spams</strong> ou <strong>Courrier indésirable</strong>.',
              },
            ]}
          >
            <p>
              Vous recevez un email de{' '}
              <strong>contact@mabellepromo.org</strong>{' '}
              en quelques secondes. Selon votre situation, le bouton dans l'email s'appelle :
            </p>
            <ul className="space-y-1.5 pl-1">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#1a7a45' }} />
                <span>
                  <strong>« Créer mon compte »</strong> — si c'est votre toute première connexion à PASSERELLES
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#b8941f' }} />
                <span>
                  <strong>« Accéder à mon espace »</strong> — si vous aviez déjà un compte (cas le plus fréquent pour ceux qui ont reçu l'email binôme)
                </span>
              </li>
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 text-center">
                  Cas 1 · Nouveau compte
                </p>
                <BrowserFrame label='EMAIL REÇU — BOUTON "CRÉER MON COMPTE"'>
                  <EmailPreview isReset={false} />
                </BrowserFrame>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 text-center">
                  Cas 2 · Compte existant
                </p>
                <BrowserFrame label='EMAIL REÇU — BOUTON "ACCÉDER À MON ESPACE"'>
                  <EmailPreview isReset={true} />
                </BrowserFrame>
              </div>
            </div>
          </Step>
        </div>

        {/* ════ PHASE 3 ════ */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: 'rgba(26,122,69,0.2)' }} />
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-white"
              style={{ background: '#1a7a45' }}>Phase 3 · Création du mot de passe</span>
            <div className="h-px flex-1" style={{ background: 'rgba(26,122,69,0.2)' }} />
          </div>

          <div className="space-y-6">
            <Step
              number={3} custom={2}
              phase="Étape 3"
              phaseColor="#1a7a45"
              icon={<Lock className="h-5 w-5" />}
              title="Choisissez votre mot de passe (minimum 6 caractères)"
            >
              <p>
                Le lien vous redirige vers la page <strong>« Nouveau mot de passe »</strong>.
                Saisissez votre mot de passe dans les deux champs.
              </p>

              <BrowserFrame label='PAGE "NOUVEAU MOT DE PASSE" — CHAMPS À REMPLIR'>
                <PasswordCard filled={false} />
              </BrowserFrame>
            </Step>

            <Step
              number={4} custom={3}
              phase="Étape 4"
              phaseColor="#1a7a45"
              icon={<CheckCircle className="h-5 w-5" />}
              title="Confirmez et enregistrez votre mot de passe"
              notes={[
                {
                  type: 'warning',
                  text: 'Notez votre mot de passe dans un endroit sûr — vous en aurez besoin à chaque connexion suivante.',
                },
              ]}
            >
              <p>
                Une fois les deux champs remplis, cliquez sur{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-800 text-white mx-0.5">
                  Enregistrer mon mot de passe
                </span>.
                Votre compte est créé — vous serez redirigé(e) automatiquement vers votre espace.
              </p>

              <BrowserFrame label="MOT DE PASSE SAISI — PRÊT À ENREGISTRER">
                <PasswordCard filled={true} />
              </BrowserFrame>
            </Step>
          </div>
        </div>

        {/* ════ PHASE 4 ════ */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1" style={{ background: 'rgba(184,148,31,0.25)' }} />
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-white"
              style={{ background: '#b8941f' }}>Phase 4 · Accès à votre espace</span>
            <div className="h-px flex-1" style={{ background: 'rgba(184,148,31,0.25)' }} />
          </div>

          <div className="space-y-6">
            <Step
              number={5} custom={4}
              phase="Étape 5"
              phaseColor="#b8941f"
              icon={<LogIn className="h-5 w-5" />}
              title="Connectez-vous avec votre email et mot de passe"
              notes={[
                {
                  type: 'success',
                  text: 'Pour toutes vos prochaines connexions, c\'est cet onglet que vous utiliserez — <strong>plus besoin de lien magique</strong>.',
                },
              ]}
            >
              <p>
                Revenez sur{' '}
                <a href="https://passerelles.vercel.app/login" className="font-semibold text-emerald-700 underline underline-offset-2">
                  passerelles.vercel.app/login
                </a>,
                choisissez l'onglet{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-800 text-white mx-0.5">
                  Connexion
                </span>,
                entrez votre email et votre mot de passe, puis cliquez sur{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-800 text-white mx-0.5">
                  Se connecter
                </span>.
              </p>

              <BrowserFrame label="CONNEXION AVEC EMAIL + MOT DE PASSE">
                <LoginCard activeTab="connexion" showFilled={true} />
              </BrowserFrame>
            </Step>

            <Step
              number={6} custom={5}
              phase="Étape 6"
              phaseColor="#b8941f"
              icon={<CheckCircle className="h-5 w-5" />}
              title="Vous êtes dans votre espace personnel !"
            >
              <p>
                Votre <strong>nom apparaît en haut à droite</strong> de la page — c'est la confirmation que vous êtes bien connecté(e).
                Vous avez accès à tout ce qu'il faut pour interagir avec votre Mentor(e) ou Mentoré(e).
              </p>

              <BrowserFrame label="ESPACE PERSONNEL — CONNEXION CONFIRMÉE">
                <DashboardPreview />
              </BrowserFrame>
            </Step>
          </div>
        </div>

        {/* ── SUCCÈS ── */}
        <motion.div
          custom={6} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #0a2e18 0%, #0f5530 100%)', boxShadow: '0 16px 48px rgba(10,46,24,0.18)' }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎓</span>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                Bienvenue sur PASSERELLES !
              </p>
              <p className="text-emerald-200/80 text-sm leading-relaxed">
                Pour les prochaines connexions, utilisez toujours l'onglet{' '}
                <strong className="text-white">Connexion</strong> avec votre email et votre mot de passe.
                Le lien magique ne sert qu'à la toute première fois.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-4">
                <div className="flex items-center gap-1.5 text-xs text-emerald-300/80">
                  <CheckCircle className="h-3.5 w-3.5" />
                  PASSERELLES · Ma Belle Promo
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-300/80">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Faculté de Droit — Université de Lomé
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── PROBLÈME PERSISTANT ── */}
        <motion.div
          custom={7} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(184,148,31,0.25)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#b8941f' }} />
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Un problème persistant ?</p>
              <p className="text-gray-600 text-xs leading-relaxed mb-2">
                Si malgré ces étapes vous n'arrivez toujours pas à vous connecter, contactez l'équipe PASSERELLES.
                Précisez votre <strong>nom, prénom</strong> et l'<strong>adresse email</strong> utilisée pour candidater.
              </p>
              <a href="mailto:contact@mabellepromo.org"
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: '#b8941f' }}>
                <Mail className="h-3.5 w-3.5" />
                contact@mabellepromo.org
              </a>
            </div>
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4">
          <a href="https://passerelles.vercel.app/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
            <LogIn className="h-4 w-4" />
            Aller à la page de connexion
          </a>
          <Link to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all"
            style={{ borderColor: '#1a7a45', color: '#1a7a45' }}>
            Retour à l'accueil
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-6 text-center border-t border-gray-200">
        <p className="text-xs text-gray-400">Association Ma Belle Promo · Programme PASSERELLES · Lomé, Togo</p>
        <p className="text-xs text-gray-400 mt-1">© 2026 Ma Belle Promo</p>
      </footer>
    </div>
  );
}
