// api/delete-account.js
// Fonction serverless Vercel : suppression du compte utilisateur (RGPD - droit à l'effacement)

const { createClient } = require('@supabase/supabase-js');

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://passerelles.vercel.app',
];

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';
  if (ALLOWED_ORIGINS.includes(origin) || origin === siteUrl) return origin;
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
  const accessToken = authHeader.replace('Bearer ', '').trim();
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

  const email = user.email;

  // Trouver les binômes liés pour nettoyer les données associées
  const { data: binomes } = await supabaseAdmin
    .from('binome')
    .select('id')
    .or(`mentor_email.eq.${email},mentore_email.eq.${email}`);
  const binomeIds = (binomes || []).map(b => b.id);

  if (binomeIds.length > 0) {
    // Récupérer les fichiers storage avant suppression
    const { data: fichiers } = await supabaseAdmin
      .from('binome_fichier')
      .select('file_url')
      .in('binome_id', binomeIds);

    const storagePaths = (fichiers || [])
      .map(f => {
        try {
          const match = f.file_url?.match(/\/passerelles-files\/(.+)/);
          return match ? decodeURIComponent(match[1]) : null;
        } catch { return null; }
      })
      .filter(Boolean);

    if (storagePaths.length > 0) {
      await supabaseAdmin.storage.from('passerelles-files').remove(storagePaths);
    }

    // Supprimer toutes les données liées aux binômes
    await Promise.all([
      supabaseAdmin.from('suivi_mensuel').delete().in('binome_id', binomeIds),
      supabaseAdmin.from('journal_de_bord').delete().in('binome_id', binomeIds),
      supabaseAdmin.from('bilan_final').delete().in('binome_id', binomeIds),
      supabaseAdmin.from('binome_fichier').delete().in('binome_id', binomeIds),
    ]);
  }

  // Anonymiser les données dans les tables mentor/mentore
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
