import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function RequireAdmin({ children }) {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();

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

  if (!isAuthenticated || !base44.auth.isUserAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: '#fef2f2' }}>
            <ShieldOff className="h-8 w-8" style={{ color: '#dc2626' }} />
          </div>
          <h2 className="text-2xl font-bold font-playfair text-gray-900 mb-3">Accès restreint</h2>
          <p className="text-gray-500 text-sm mb-6">Cette section est réservée aux administrateurs du programme.</p>
          <p className="mt-4 text-xs text-gray-400">
            <Link to="/" className="text-emerald-600 hover:underline">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
