import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function RequireAuth({ children }) {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white shadow-lg border border-gray-100">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-gray-600">Vérification de votre session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
            <Lock className="h-8 w-8" style={{ color: '#1a7a45' }} />
          </div>
          <h2 className="text-2xl font-bold font-playfair text-gray-900 mb-3">Connexion requise</h2>
          <p className="text-gray-500 text-sm mb-6">Cette section est réservée aux participants du Programme PASSERELLES.</p>
          <a href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
            Se connecter
          </a>
          <p className="mt-4 text-xs text-gray-400">
            <Link to="/" className="text-emerald-600 hover:underline">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    );
  }

  return children;
}