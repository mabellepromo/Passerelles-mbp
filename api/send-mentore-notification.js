// api/send-mentore-notification.js
// Vercel serverless — Notifications aux mentorés (liste d'attente / non retenus)

const { createClient } = require('@supabase/supabase-js');

const sendBrevoEmail = async ({ to, toName, subject, html }) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Ma Belle Promo – PASSERELLES', email: 'contact@mabellepromo.org' },
      to: [{ email: to, name: toName || '' }],
      replyTo: { email: 'contact@mabellepromo.org' },
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo API error ${res.status}`);
  }
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ADMIN_EMAILS = ['contact@mabellepromo.org', 'senayhola@gmail.com'];

const escapeHtml = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const validateEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isUserAdmin = (user) => {
  if (!user?.email) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  const role = user.user_metadata?.role || user.app_metadata?.role;
  return role === 'admin';
};

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
  if (origin === (process.env.SITE_URL || 'https://passerelles-mbp.vercel.app')) return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  return null;
};

const fillTemplate = (template, vars) =>
  template
    .replace(/\{\{prenom\}\}/g, vars.prenom || '')
    .replace(/\{\{nom\}\}/g, vars.nom || '')
    .replace(/\{\{programme\}\}/g, vars.programme || 'PASSERELLES')
    .replace(/\{\{session\}\}/g, vars.session || 'Cohorte 1 \u2013 2026')
    .replace(/\{\{lien_info\}\}/g, vars.lien_info || (process.env.SITE_URL || 'https://passerelles-mbp.vercel.app'));

const textToHtmlBody = (text) =>
  escapeHtml(text)
    .split('\n\n')
    .map(para =>
      `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;">${para.replace(/\n/g, '<br>')}</p>`
    )
    .join('');

const htmlEmail = (bodyText, site_url) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#0f5530,#1a7a45);padding:30px 30px 20px;text-align:center;">
      <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;font-family:Arial,sans-serif;">Association Ma Belle Promo</p>
      <h1 style="color:white;font-size:26px;margin:0 0 6px;font-weight:bold;">Programme PASSERELLES</h1>
      <p style="color:#a7f3d0;font-size:13px;margin:0;">Cohorte 1 \u2013 2026</p>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent);"></div>
    <div style="padding:30px;">
      ${textToHtmlBody(bodyText)}
      <div style="text-align:center;margin:30px 0;">
        <a href="${site_url}" style="background:linear-gradient(135deg,#0f5530,#1a7a45);color:white;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;">Accéder au programme</a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Pour toute question : <a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a></p>
    </div>
    <div style="background:#f3f4f6;padding:16px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Association Ma Belle Promo \u00b7 Lom\u00e9, Togo</p>
      <p style="color:#6b7280;font-size:12px;margin:0;"><a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a></p>
      <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;">\u00a9 2026 Ma Belle Promo \u2013 Programme PASSERELLES</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non autorisee' });

  // Auth check
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisee' });
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Jeton manquant' });
  const { data, error: authErr } = await supabaseAuth.auth.getUser(token);
  if (authErr || !data?.user) return res.status(401).json({ error: 'Non authentifie' });
  if (!isUserAdmin(data.user)) return res.status(403).json({ error: 'Acces refuse' });

  const { recipients, subject, body, programme, session, lien_info } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0)
    return res.status(400).json({ error: 'Aucun destinataire fourni.' });
  if (!subject?.trim() || !body?.trim())
    return res.status(400).json({ error: 'Objet et corps du message requis.' });

  const site_url = lien_info || process.env.SITE_URL || 'https://passerelles-mbp.vercel.app';
  const errors = [];
  let sent = 0;

  for (const r of recipients) {
    if (!r.email || !validateEmail(r.email)) {
      errors.push({ email: r.email || '?', reason: 'Email invalide' });
      continue;
    }

    const nameParts = (r.full_name || '').trim().split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || '';

    const vars = { prenom, nom, programme: programme || 'PASSERELLES', session: session || 'Cohorte 1 \u2013 2026', lien_info: site_url };
    const filledSubject = fillTemplate(subject, vars);
    const filledBody = fillTemplate(body, vars);

    try {
      await sendBrevoEmail({
        to: r.email.trim(),
        toName: r.full_name || '',
        subject: filledSubject,
        html: htmlEmail(filledBody, site_url),
      });
      sent++;
    } catch (err) {
      errors.push({ email: r.email, reason: err.message });
    }
  }

  return res.status(200).json({ success: true, sent, errors });
};
