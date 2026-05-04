// api/delete-account.js
// Fonction serverless Vercel : suppression du compte utilisateur (RGPD - droit à l'effacement)

const { createClient } = require('@supabase/supabase-js');

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisée' });

  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.replace('Bearer ', '');
  if (!accessToken) return res.status(401).json({ error: 'Token manquant' });

  // Client avec le token utilisateur pour vérifier l'identité
  const supabaseUser = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !user) return res.status(401).json({ error: 'Session invalide' });

  // Client admin pour supprimer l'utilisateur
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Anonymiser les données liées dans les tables métier
  const email = user.email;
  const tables = ['mentor', 'mentore'];
  for (const table of tables) {
    await supabaseAdmin.from(table).update({
      full_name: '[Compte supprimé]',
      email: `deleted_${user.id}@supprime.local`,
      phone: null,
    }).eq('email', email);
  }

  // Supprimer les messages
  await supabaseAdmin.from('message').delete().eq('sender_email', email);

  // Supprimer le compte auth
  const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteErr) return res.status(500).json({ error: 'Erreur lors de la suppression : ' + deleteErr.message });

  return res.status(200).json({ ok: true, message: 'Compte supprimé avec succès' });
};
