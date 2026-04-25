// api/send-email.js
// Fonction serverless générique — envoi d'email via Brevo pour utilisateurs authentifiés

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAllowedOrigin = (origin) => {
  const allowed = [
    process.env.SITE_URL || 'https://passerelles-mbp.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  return allowed.includes(origin) ? origin : null;
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

  // Vérification authentification (tout utilisateur connecté)
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  if (SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Session invalide' });
  }

  const { to, subject, text, html } = req.body || {};
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Champs to, subject et text/html requis' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) return res.status(400).json({ error: 'Email destinataire invalide' });

  const htmlContent = html || text.split('\n\n')
    .map(p => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const emailBody = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:linear-gradient(135deg,#0f5530,#1a7a45);padding:24px 30px;text-align:center;">
      <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;font-family:Arial,sans-serif;">Association Ma Belle Promo</p>
      <h1 style="color:white;font-size:22px;margin:0;font-weight:bold;">Programme PASSERELLES</h1>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent);"></div>
    <div style="padding:28px 30px;">${htmlContent}</div>
    <div style="background:#f3f4f6;padding:14px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0;">Association Ma Belle Promo · Lomé, Togo · contact@mabellepromo.org</p>
    </div>
  </div>
</body></html>`;

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Ma Belle Promo – PASSERELLES', email: 'contact@mabellepromo.org' },
        to: [{ email: to }],
        replyTo: { email: 'contact@mabellepromo.org' },
        subject,
        htmlContent: emailBody,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      throw new Error(err.message || `Brevo error ${brevoRes.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('send-email error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
