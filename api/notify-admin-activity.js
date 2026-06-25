// api/notify-admin-activity.js
// Notifie l'admin à chaque activité binôme : message, suivi mensuel, journal de bord, bilan final

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
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

const ADMIN_EMAIL = 'mabellepromo@gmail.com';

const EVENT_CONFIG = {
  message: { icon: '💬', label: 'Nouveau message binôme',      color: '#1a7a45' },
  suivi:   { icon: '📋', label: 'Nouvelle Fiche de Suivi',     color: '#0e7490' },
  journal: { icon: '📓', label: 'Entrée Journal de Bord',      color: '#7c3aed' },
  bilan:   { icon: '🏆', label: 'Bilan Final soumis',          color: '#d97706' },
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

  // Vérification : utilisateur connecté (non nécessairement admin)
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Configuration serveur manquante' });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Session invalide' });

  const { event, details } = req.body || {};
  if (!event || !EVENT_CONFIG[event]) {
    return res.status(400).json({ error: 'Événement invalide' });
  }

  const cfg = EVENT_CONFIG[event];
  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';

  const rows = Object.entries(details || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:7px 12px 7px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;width:130px;">${escapeHtml(k)}</td>
        <td style="padding:7px 0;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(String(v))}</td>
      </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#0f5530,#1a7a45);padding:24px 30px;text-align:center;">
      <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;font-family:Arial,sans-serif;">PASSERELLES · Ma Belle Promo</p>
      <h1 style="color:white;font-size:20px;margin:0;font-weight:bold;">${cfg.icon} ${escapeHtml(cfg.label)}</h1>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent);"></div>
    <div style="padding:28px 30px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${rows}
      </table>
      <div style="text-align:center;margin-top:24px;">
        <a href="${siteUrl}/AdminDashboard"
          style="background:linear-gradient(135deg,#0f5530,#1a7a45);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;">
          Voir le tableau de bord
        </a>
      </div>
    </div>
    <div style="background:#f3f4f6;padding:14px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Association Ma Belle Promo · Programme PASSERELLES</p>
    </div>
  </div>
</body>
</html>`;

  const binomeLabel = details?.['Binôme'] ? ` — ${details['Binôme']}` : '';

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'PASSERELLES – Activité', email: 'contact@mabellepromo.org' },
        to: [{ email: ADMIN_EMAIL, name: 'Ma Belle Promo' }],
        subject: `[PASSERELLES] ${cfg.icon} ${cfg.label}${binomeLabel}`,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      throw new Error(err.message || `Brevo error ${brevoRes.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('notify-admin-activity error:', e.message);
    // Non-bloquant — ne pas faire échouer l'action principale
    return res.status(200).json({ ok: false, warn: e.message });
  }
};
