// api/notify-contact.js
// Vercel serverless — Notification admin quand un visiteur envoie un message de contact

const getAllowedOrigin = (origin) => {
  const allowed = [
    process.env.SITE_URL || 'https://passerelles-mbp.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
  return allowed.includes(origin) ? origin : null;
};

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

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisée' });

  const { name, email, subject, message } = req.body || {};

  if (!name?.trim() || !message?.trim() || !subject?.trim()) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const safeName    = escapeHtml(name.trim());
  const safeEmail   = escapeHtml((email || '').trim());
  const safeSubject = escapeHtml(subject.trim());
  const safeMessage = escapeHtml(message.trim());

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#0f5530,#1a7a45);padding:24px 30px;text-align:center;">
      <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;font-family:Arial,sans-serif;">Ma Belle Promo</p>
      <h1 style="color:white;font-size:20px;margin:0;font-weight:bold;">Nouveau message de contact</h1>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent);"></div>
    <div style="padding:28px 30px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;">Nom</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:bold;">${safeName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#1a7a45;font-size:14px;">${safeEmail || '(non renseigné)'}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Objet</td><td style="padding:8px 0;color:#111827;font-size:14px;">${safeSubject}</td></tr>
      </table>
      <div style="background:#f8fffe;border:1px solid #d1fae5;border-radius:10px;padding:18px 20px;border-left:4px solid #1a7a45;">
        <p style="color:#374151;font-size:14px;line-height:1.8;margin:0;white-space:pre-wrap;">${safeMessage}</p>
      </div>
      <div style="text-align:center;margin:24px 0 0;">
        <a href="https://passerelles-mbp.vercel.app/AdminDashboard" style="background:linear-gradient(135deg,#0f5530,#1a7a45);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;">Répondre depuis le tableau de bord</a>
      </div>
    </div>
    <div style="background:#f3f4f6;padding:14px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Association Ma Belle Promo · Programme PASSERELLES</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Passerelles – Formulaire', email: 'contact@mabellepromo.org' },
        to: [{ email: 'mabellepromo@gmail.com', name: 'Ma Belle Promo' }],
        replyTo: safeEmail ? { email: safeEmail, name: safeName } : undefined,
        subject: `[Contact] ${safeSubject} — ${safeName}`,
        htmlContent: html,
      }),
    });
    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      throw new Error(err.message || `Brevo error ${brevoRes.status}`);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur notify-contact:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
