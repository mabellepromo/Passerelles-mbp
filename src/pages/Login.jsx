import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/base44Client';
import { Scale } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('login');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'expired') {
      setError('Votre lien a expire. Demandez un nouveau lien ci-dessous.');
      setMode('reset');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email ou mot de passe incorrect. Verifiez vos identifiants ou utilisez "Mot de passe oublie".');
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`
    });
    if (error) {
      setError('Erreur lors de l\'envoi. Verifiez votre email.');
    } else {
      setSuccess('Un lien de reinitialisation a ete envoye a votre adresse email.');
    }
    setLoading(false);
  };

  const handleFirstLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`
    });
    if (error) {
      setError('Cet email n\'est pas enregistre dans le programme. Contactez contact@mabellepromo.org.');
    } else {
      setSuccess('Un lien de reinitialisation vous a ete envoye. Cliquez dessus pour choisir votre mot de passe et acceder a votre espace.');
    }
    setLoading(false);
  };

  const reset = () => { setError(''); setSuccess(''); setEmail(''); setPassword(''); };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
            <Scale className="h-7 w-7" style={{ color: '#1a7a45' }} />
          </div>
          <h1 className="text-2xl font-bold font-playfair text-gray-900">
            {mode === 'login' ? 'Connexion' : mode === 'reset' ? 'Mot de passe oublie' : 'Premiere connexion'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Programme PASSERELLES · Ma Belle Promo</p>
        </div>

        {!success && (
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
            {[
              { key: 'login', label: 'Connexion' },
              { key: 'first', label: 'Premiere fois' },
              { key: 'reset', label: 'Mot de passe oublie' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => { setMode(tab.key); reset(); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={mode === tab.key
                  ? { background: 'linear-gradient(135deg, #0f5530, #1a7a45)', color: 'white' }
                  : { color: '#6b7280' }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {success ? (
          <div className="text-center p-6 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
            <p className="text-2xl mb-3">📧</p>
            <p className="text-emerald-700 font-semibold mb-2">Email envoye !</p>
            <p className="text-sm text-emerald-600 leading-relaxed">{success}</p>
            <button onClick={() => { setMode('login'); reset(); }}
              className="mt-4 text-sm text-emerald-600 underline">
              Retour a la connexion
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-xl mb-4 text-sm text-red-700" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            )}

            {mode === 'first' && (
              <form onSubmit={handleFirstLogin} className="space-y-4">
                <div className="p-3 rounded-xl text-xs text-gray-600" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  Vous etes mentor ou mentore selectionne ? Entrez votre email pour recevoir un lien et creer votre mot de passe.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre adresse email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
                  {loading ? 'Envoi...' : "Recevoir mon lien d'acces"}
                </button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre adresse email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #0f5530, #1a7a45)' }}>
                  {loading ? 'Envoi...' : 'Envoyer le lien de reinitialisation'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
