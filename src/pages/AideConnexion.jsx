import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, CheckCircle, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const steps = [
  {
    phase: 'PHASE 1 · DEMANDE DE LIEN',
    number: 1,
    icon: <HelpCircle className="h-6 w-6" />,
    title: 'Rendez-vous sur la page de connexion',
    color: '#1a7a45',
    content: (
      <>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Ouvrez votre navigateur et accédez à{' '}
          <a href="https://passerelles.vercel.app/login" className="font-semibold text-emerald-700 underline underline-offset-2">
            passerelles.vercel.app/login
          </a>.
          Cliquez sur l'onglet{' '}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-800 text-white mx-1">
            Premiere fois
          </span>
          puis saisissez l'adresse email avec laquelle vous avez reçu votre invitation.
        </p>
        <p className="text-sm leading-relaxed mb-3 text-gray-700">
          Cliquez ensuite sur{' '}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-800 text-white mx-1">
            Recevoir mon lien d'accès
          </span>.
        </p>
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-amber-800"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            <strong>Adresse exacte obligatoire</strong> — utilisez celle renseignée lors de votre candidature,
            sinon la base de données ne vous reconnaîtra pas.
          </span>
        </div>
      </>
    ),
  },
  {
    phase: 'PHASE 2 · EMAIL',
    number: 2,
    icon: <Mail className="h-6 w-6" />,
    title: 'Ouvrez votre boîte mail et cliquez sur le bouton',
    color: '#b8941f',
    content: (
      <>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Vous recevez un email de{' '}
          <strong>contact@mabellepromo.org</strong> en quelques secondes.
          Selon votre situation, le bouton s'appelle :
        </p>
        <ul className="space-y-2 mb-3">
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
            <span><strong>« Créer mon compte »</strong> — si c'est votre toute première connexion</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span><strong>« Accéder à mon espace »</strong> — si vous avez déjà un compte (cas le plus fréquent)</span>
          </li>
        </ul>
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-emerald-800 mb-2"
          style={{ background: 'rgba(26,122,69,0.07)', border: '1px solid rgba(26,122,69,0.18)' }}>
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>
            Ce lien est valable <strong>24 heures</strong> et est à usage unique — un clic = lien expiré.
            Chaque nouveau lien annule le précédent.
          </span>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-gray-600"
          style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
          <span>Email introuvable ? Vérifiez votre dossier <strong>Spams</strong> ou <strong>Courrier indésirable</strong>.</span>
        </div>
      </>
    ),
  },
  {
    phase: 'PHASE 3 · MOT DE PASSE',
    number: 3,
    icon: <Lock className="h-6 w-6" />,
    title: 'Choisissez votre mot de passe',
    color: '#1a7a45',
    content: (
      <>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Le lien vous redirige vers la page <strong>« Nouveau mot de passe »</strong>.
          Saisissez votre mot de passe dans les deux champs (minimum <strong>6 caractères</strong>).
        </p>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Une fois les deux champs remplis, cliquez sur{' '}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-800 text-white mx-1">
            Enregistrer mon mot de passe
          </span>.
          Votre compte est créé — vous serez redirigé(e) automatiquement.
        </p>
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-amber-800"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            Notez votre mot de passe dans un endroit sûr — vous en aurez besoin à chaque connexion.
          </span>
        </div>
      </>
    ),
  },
  {
    phase: 'PHASE 4 · CONNEXION',
    number: 4,
    icon: <LogIn className="h-6 w-6" />,
    title: 'Connectez-vous avec votre email et mot de passe',
    color: '#b8941f',
    content: (
      <>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Revenez sur{' '}
          <a href="https://passerelles.vercel.app/login" className="font-semibold text-emerald-700 underline underline-offset-2">
            passerelles.vercel.app/login
          </a>,
          choisissez l'onglet{' '}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-800 text-white mx-1">
            Connexion
          </span>,
          entrez votre email et votre mot de passe, puis cliquez sur{' '}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-800 text-white mx-1">
            Se connecter
          </span>.
        </p>
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-emerald-800"
          style={{ background: 'rgba(26,122,69,0.07)', border: '1px solid rgba(26,122,69,0.18)' }}>
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>
            Pour toutes vos prochaines connexions, c'est cet onglet que vous utiliserez —
            <strong> plus besoin de lien magique</strong>.
          </span>
        </div>
      </>
    ),
  },
];

export default function AideConnexion() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f6f0' }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a2e18 0%, #0f5530 45%, #1a7a45 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(184,148,31,0.4)', color: '#f0d060' }}>
              Programme PASSERELLES · Support connexion
            </span>
            <h1 className="font-bold text-white mb-4"
              style={{ fontFamily: 'Libre Baskerville, serif', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.2 }}>
              Problème de connexion ?
            </h1>
            <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Suivez ces 4 étapes dans l'ordre — vous serez connecté(e) en moins de 5 minutes.
            </p>
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
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(26,122,69,0.07)', border: '1px solid rgba(26,122,69,0.15)' }}
        >
          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#1a7a45' }} />
          <p className="text-sm text-gray-700 leading-relaxed">
            La connexion à PASSERELLES fonctionne par <strong>lien à usage unique</strong>.
            Chaque lien est personnel, temporaire et s'invalide après utilisation.
            Ce guide vous explique comment créer votre compte ou retrouver l'accès à votre espace.
          </p>
        </motion.div>
      </div>

      {/* ── ÉTAPES ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1">
        <div className="relative">
          {/* Ligne verticale de connexion */}
          <div className="absolute left-7 top-8 bottom-8 w-px hidden sm:block"
            style={{ background: 'linear-gradient(to bottom, #1a7a45, #b8941f, #1a7a45, #b8941f)' }} />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative flex gap-4 sm:gap-6"
              >
                {/* Numéro */}
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-md z-10"
                  style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}>
                  <span className="text-lg leading-none">{step.number}</span>
                </div>

                {/* Contenu */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* En-tête de phase */}
                  <div className="px-5 pt-3 pb-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: step.color }}>
                      {step.phase}
                    </span>
                  </div>
                  <div className="px-5 pb-5">
                    <h2 className="font-semibold text-gray-900 text-base mb-3">{step.title}</h2>
                    {step.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── SUCCÈS ── */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 rounded-2xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0a2e18 0%, #0f5530 100%)', boxShadow: '0 16px 48px rgba(10,46,24,0.18)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-300" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>
            Bienvenue sur PASSERELLES !
          </h3>
          <p className="text-emerald-200/80 text-sm mb-1">
            Votre nom apparaît en haut à droite — vous êtes bien connecté(e).
          </p>
          <p className="text-emerald-200/60 text-xs">
            Pour les prochaines connexions, utilisez toujours l'onglet <strong className="text-emerald-200/90">Connexion</strong> avec votre email et mot de passe.
          </p>
        </motion.div>

        {/* ── PROBLÈME PERSISTANT ── */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-6 rounded-2xl p-5"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(184,148,31,0.25)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#b8941f' }} />
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Un problème persistant ?</p>
              <p className="text-gray-600 text-xs leading-relaxed mb-2">
                Si malgré ces étapes vous n'arrivez pas à vous connecter, contactez l'équipe PASSERELLES.
                Précisez votre nom, prénom et l'adresse email utilisée pour candidater.
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
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
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

      {/* ── FOOTER MINIMALISTE ── */}
      <footer className="py-6 text-center border-t border-gray-200 mt-4">
        <p className="text-xs text-gray-400">
          Association Ma Belle Promo · Programme PASSERELLES · Lomé, Togo
        </p>
        <p className="text-xs text-gray-400 mt-1">© 2026 Ma Belle Promo</p>
      </footer>
    </div>
  );
}
