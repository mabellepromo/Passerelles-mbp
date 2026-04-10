import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/base44Client';
import { Scale } from 'lucide-react';

export default function AuthCallback() {
  const [mode, setMode] = useState('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [callbackError, setCallbackError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const allParams = new URLSearchParams(hash.replace('#', '') + '&' + search.replace('?', ''));
      const type = allParams.get('type');
      const errorParam = allParams.get('error');

      if (errorParam === 'access_denied') {
        window.location.href = '/login?error=expired';
        return;
      }

      if (type === 'recovery') {
        setMode('reset');
        return;
      }

      if (!hash && !search) {
        setCallbackError('Aucun paramètre de session trouvé. Retournez à la page de connexion.');
        setMode('error');
        return;
      }

      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (error) {
        console.error('AuthCallback getSessionFromUrl error:', error);
        setCallbackError('Impossible de récupérer la session : ' + error.message);
        setMode('error');
        return;
      }

      if (data?.session) {
        window.location.href = '/';
        return;
      }

      setCallbackError('La session n\'a pas pu être établie à partir du lien.');
      setMode('error');
    };

    handleAuthCallback();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCallback event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
      } else if (event === 'SIGNED_IN' && session) {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const type = params.get('type');
        if (type === 'recovery') {
          setMode('reset');
        } else {
          window.location.href = '/';
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Minimum 6 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Erreur : ' + error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => { window.location.href = '/'; }, 2000);
    }
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#fee2e2' }}>
            <Scale className="h-7 w-7" style={{ color: '#dc2626' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Échec de la connexion</h1>
          <p className="text-gray-500 text-sm mb-6">{callbackError || 'Une erreur est survenue pendant la validation du lien.'}</p>
          <a href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
            <Scale className="h-7 w-7" style={{ color: '#1a7a45' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-gray-500 text-sm mt-1">Programme PASSERELLES · Ma Belle Promo</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-emerald-600 font-semibold">Mot de passe modifié !</p>
            <p className="text-gray-400 text-sm mt-1">Redirection en cours...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-xl mb-4 text-sm text-red-700" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="minimum 6 caractères" required minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="minimum 6 caractères" required minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
                {loading ? 'Enregistrement...' : 'Enregistrer mon mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
