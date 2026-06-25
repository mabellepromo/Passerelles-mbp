// api/admin-send-message.js
// Admin envoie un email libre à un ou plusieurs membres d'un binôme

const { createClient } = require('@supabase/supabase-js');
const { isUserAdmin } = require('./_admin');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

const escapeHtml = (v) =>
  typeof v === 'string'
    ? v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    : '';

const validateEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

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

  if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Configuration serveur manquante' });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Session invalide' });
  if (!isUserAdmin(data.user)) return res.status(403).json({ error: 'Accès refusé — admin uniquement' });

  const { recipients, subject, body } = req.body || {};
  if (!Array.isArray(recipients) || !recipients.length || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Champs manquants : recipients, subject, body' });
  }
  for (const r of recipients) {
    if (!validateEmail(r.email)) return res.status(400).json({ error: `Email invalide : ${r.email}` });
  }

  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';
  const bodyHtml = escapeHtml(body).replace(/\n/g, '<br>');
  const subjectSafe = escapeHtml(subject.trim());

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#0f5530,#1a7a45);padding:24px 30px;text-align:center;">
      <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;font-family:Arial,sans-serif;">PASSERELLES · Ma Belle Promo</p>
      <h1 style="color:white;font-size:20px;margin:0;font-weight:bold;">${subjectSafe}</h1>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent);"></div>
    <div style="padding:28px 30px;">
      <p style="color:#374151;font-size:15px;line-height:1.8;font-family:Georgia,serif;">${bodyHtml}</p>
      <div style="text-align:center;margin-top:28px;">
        <a href="${siteUrl}"
          style="background:linear-gradient(135deg,#0f5530,#1a7a45);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;">
          Accéder à PASSERELLES
        </a>
      </div>
    </div>
    <div style="background:#f3f4f6;padding:14px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Association Ma Belle Promo · Programme PASSERELLES</p>
    </div>
  </div>
</body>
</html>`;

  try {
    for (const { email, name } of recipients) {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: 'PASSERELLES – Ma Belle Promo', email: 'contact@mabellepromo.org' },
          to: [{ email: email.trim(), name: name || '' }],
          replyTo: { email: 'contact@mabellepromo.org' },
          subject: `[PASSERELLES] ${subject.trim()}`,
          htmlContent: html,
        }),
      });
      if (!brevoRes.ok) {
        const err = await brevoRes.json().catch(() => ({}));
        throw new Error(err.message || `Brevo error ${brevoRes.status}`);
      }
    }
    return res.status(200).json({ ok: true, sent: recipients.map(r => r.email) });
  } catch (e) {
    console.error('admin-send-message error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
