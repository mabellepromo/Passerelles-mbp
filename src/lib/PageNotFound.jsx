import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

const SUGGESTIONS = [
  { label: 'Accueil',        to: '/' },
  { label: 'Mon Espace',     to: '/MonEspace' },
  { label: 'Cohorte 1',      to: '/ResultatsCohorte1' },
  { label: 'Messagerie',     to: '/Messagerie' },
];

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #0a2e18 0%, #0f5530 50%, #1a7a45 100%)' }}>

      {/* Grid décoratif */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full"
      >
        {/* Logo */}
        <div className="mb-8">
          <img src="/logo-mbp.png" alt="Ma Belle Promo" className="w-14 h-14 rounded-full mx-auto"
            style={{ boxShadow: '0 0 0 3px rgba(212,170,53,0.5)' }} />
        </div>

        {/* 404 */}
        <div className="mb-6">
          <p className="font-playfair font-bold text-white/10 leading-none select-none"
            style={{ fontSize: 'clamp(6rem, 20vw, 9rem)', lineHeight: 1 }}>
            404
          </p>
          <div className="h-px w-20 mx-auto -mt-4" style={{ background: 'linear-gradient(90deg,transparent,#d4aa35,transparent)' }} />
        </div>

        {/* Message */}
        <div className="mb-8">
          <h1 className="font-playfair font-bold text-white text-2xl mb-2">Page introuvable</h1>
          <p className="text-emerald-200/70 text-sm leading-relaxed">
            {pageName
              ? <>La page <span className="text-white font-medium">« {pageName} »</span> n'existe pas ou a été déplacée.</>
              : <>Cette page n'existe pas ou a été déplacée.</>
            }
          </p>
        </div>

        {/* Boutons principaux */}
        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          <Link to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#b8941f,#d4aa35)', boxShadow: '0 4px 16px rgba(184,148,31,0.4)' }}>
            <Home className="h-4 w-4" /> Accueil
          </Link>
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/15"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
        </div>

        {/* Suggestions */}
        <div className="w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <p className="text-xs text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="h-3 w-3" /> Pages disponibles
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map(({ label, to }) => (
              <Link key={to} to={to}
                className="text-xs px-3 py-1.5 rounded-full text-white/60 hover:text-white transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Note admin */}
        {isFetched && authData?.user?.role === 'admin' && (
          <div className="mt-6 p-3 rounded-xl text-left w-full"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <p className="text-xs font-semibold text-amber-300 mb-0.5">Note Admin</p>
            <p className="text-xs text-amber-200/70">Cette page n'a pas encore été implémentée.</p>
          </div>
        )}

        <p className="mt-8 text-xs text-white/25">Programme PASSERELLES · Ma Belle Promo</p>
      </motion.div>
    </div>
  );
}
