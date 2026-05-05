const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://passerelles.vercel.app',
];

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null;

  res.setHeader('Access-Control-Allow-Origin', allowOrigin || 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisée' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const emailLower = email.toLowerCase().trim();

  // Vérifier que l'email est dans le programme
  const [mentorRes, mentoreRes] = await Promise.all([
    supabase.from('mentor').select('email').ilike('email', emailLower).maybeSingle(),
    supabase.from('mentore').select('email').ilike('email', emailLower).maybeSingle(),
  ]);

  if (!mentorRes.data && !mentoreRes.data) {
    return res.status(404).json({ error: 'Email non trouvé dans le programme' });
  }

  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: emailLower,
    options: { redirectTo: `${siteUrl}/auth/reset` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return res.status(500).json({ error: `Impossible de générer le lien : ${linkError?.message || 'erreur inconnue'}` });
  }

  return res.status(200).json({ link: linkData.properties.action_link });
};
