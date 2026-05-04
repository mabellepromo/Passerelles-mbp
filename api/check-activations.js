// api/check-activations.js
// Vérifie quels emails ont activé leur compte (last_sign_in_at dans Supabase Auth)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const { ADMIN_EMAILS } = require('./_admin');

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
  if (origin === (process.env.SITE_URL || 'https://passerelles.vercel.app')) return origin;
  if (origin.endsWith('.vercel.app') && origin.includes('passerelles')) return origin;
  return null;
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);

  res.setHeader('Access-Control-Allow-Origin', allowOrigin || 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisée' });

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Configuration Supabase manquante' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Vérifier que l'appelant est admin
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
  const callerEmail = userData.user.email;
  const callerRole  = userData.user.user_metadata?.role || userData.user.app_metadata?.role;
  if (!ADMIN_EMAILS.includes(callerEmail) && callerRole !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { emails } = req.body || {};
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'Tableau emails requis' });
  }

  try {
    const emailsLower = emails.map(e => e.toLowerCase().trim());

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_activation_status', {
      email_list: emailsLower,
    });
    if (rpcError) throw rpcError;

    const found = rpcData || {};

    // Compléter avec les emails absents de auth.users (jamais invités)
    const result = { ...found };
    emailsLower.forEach(email => {
      if (!result[email]) result[email] = { activated: false, last_sign_in_at: null, confirmed_at: null };
    });

    return res.status(200).json({ activations: result });
  } catch (e) {
    console.error('check-activations error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
