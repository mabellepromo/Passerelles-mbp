import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';

const SESSION_KEY = 'mbp_access';
const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD ?? 'mbp2026';

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput]       = useState('');
  const [error, setError]       = useState(false);
  const [show, setShow]         = useState(false);
  const [shaking, setShaking]   = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'ok') setUnlocked(true);
  }, []);

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'ok');
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setInput('');
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg,#0a2e18 0%,#0f5530 60%,#1a7a45 100%)' }}>

      {/* Grille de fond */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-mbp.png" alt="Ma Belle Promo"
            className="w-16 h-16 rounded-full mb-4"
            style={{ boxShadow: '0 0 0 3px rgba(184,148,31,0.5)' }} />
          <h1 className="text-2xl font-bold font-playfair text-white">Passerelles</h1>
          <p className="text-emerald-300 text-sm mt-1">Ma Belle Promo</p>
        </div>

        {/* Carte */}
        <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl transition-transform ${shaking ? 'animate-shake' : ''}`}>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,170,53,0.25)', border: '1px solid rgba(212,170,53,0.4)' }}>
              <Shield className="h-4 w-4" style={{ color: '#d4aa35' }} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Espace privé</p>
              <p className="text-emerald-300/70 text-xs">Réservé aux membres du programme</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-emerald-200 text-xs font-semibold mb-2 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(false); }}
                  placeholder="Entrez le mot de passe"
                  autoFocus
                  className="w-full px-4 py-3 pr-10 rounded-xl text-white placeholder-white/30 text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: error ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.15)',
                    boxShadow: error ? '0 0 0 3px rgba(248,113,113,0.2)' : 'none',
                  }}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Mot de passe incorrect
                </p>
              )}
            </div>

            <button type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#b8941f,#d4aa35)' }}>
              Accéder
            </button>
          </form>
        </div>

        <p className="text-center text-emerald-400/40 text-xs mt-6">
          © 2026 Association Ma Belle Promo
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .animate-shake { animation: shake 0.45s ease; }
      `}</style>
    </div>
  );
}
