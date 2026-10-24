import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/api/base44Client';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

// Page publique (sans connexion) accessible depuis le lien "Ne plus recevoir
// les rappels" présent dans les emails de rappel du sondage de bilan.
export default function DesinscriptionBilan() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | done | error

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { error } = await supabase.rpc('unsubscribe_review_reminders', { p_token: token });
      if (cancelled) return;
      setStatus(error ? 'error' : 'done');
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 mx-auto mb-4 text-emerald-600 animate-spin" />
            <p className="text-gray-500 text-sm">Traitement en cours...</p>
          </>
        )}
        {status === 'done' && (
          <>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold font-playfair text-gray-900 mb-3">C'est noté</h2>
            <p className="text-gray-500 text-sm">
              Vous ne recevrez plus de rappels pour ce sondage. Vous pouvez toujours y répondre via votre lien personnel si vous changez d'avis.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold font-playfair text-gray-900 mb-3">Lien invalide</h2>
            <p className="text-gray-500 text-sm">
              Ce lien de désinscription n'est pas valide. Contactez la coordination du programme si besoin.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
