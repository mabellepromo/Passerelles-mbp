// api/send-contact-reply.js
// Vercel serverless — Réponse aux messages de contact (Brevo API)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
// La clé anon suffit pour valider un token utilisateur (auth.getUser)
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, { auth: { persistSession: false } });
// Client admin pour les écritures en base (contourne le RLS)
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

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

const validateEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isUserAdmin = (user) => {
  if (!user?.email) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  const role = user.user_metadata?.role || user.app_metadata?.role;
  return role === 'admin';
};

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
  if (origin === (process.env.SITE_URL || 'https://passerelles.vercel.app')) return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  return null;
};

const sendBrevoEmail = async ({ to, toName, subject, html, text, attachments = [] }) => {
  const body = {
    sender: { name: 'Ma Belle Promo', email: 'contact@mabellepromo.org' },
    to: [{ email: to, name: toName || '' }],
    replyTo: { email: 'contact@mabellepromo.org' },
    subject,
    htmlContent: html,
    textContent: text,
  };
  if (attachments.length > 0) {
    body.attachment = attachments.map(a => ({
      name: a.filename,
      content: a.content,
    }));
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo API error ${res.status}`);
  }
};

const authorizeRequest = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);
  if (!allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', 'null');
    return res.status(403).json({ error: 'Origine non autorisée' });
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ error: "Jeton d'authentification manquant" });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  if (!isUserAdmin(data.user)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  return null;
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const authError = await authorizeRequest(req, res);
  if (authError) return authError;

  try {
    const { to, subject, text, recipient_name, signature, attachments = [] } = req.body;
    const senderName = (signature && signature.trim()) ? escapeHtml(signature.trim()) : "L'équipe Ma Belle Promo";

    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Champs manquants : to, subject, text requis' });
    }
    if (!validateEmail(to)) {
      return res.status(400).json({ error: 'Adresse email destinataire invalide' });
    }

    const safeSubject = escapeHtml(subject.trim());
    const safeText = escapeHtml(text.trim());
    const safeRecipientName = escapeHtml((recipient_name || '').trim());
    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#ffffff;padding:28px 30px 16px;text-align:center;border-bottom:3px solid transparent;border-image:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent) 1;">
      <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 12px;overflow:hidden;border:3px solid rgba(212,170,53,0.5);box-shadow:0 0 0 5px rgba(212,170,53,0.1);">
        <img src="https://passerelles.vercel.app/logo-mbp.png" alt="Ma Belle Promo" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <h1 style="color:#111827;font-size:20px;margin:0 0 4px;font-weight:bold;font-family:Georgia,serif;">Ma Belle Promo</h1>
      <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,sans-serif;">Association · Lomé, Togo</p>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,transparent,#b8941f,#d4aa35,#b8941f,transparent);"></div>
    <div style="padding:32px 30px;">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">Bonjour${safeRecipientName ? ` <strong>${safeRecipientName}</strong>` : ''},</p>
      <div style="background:#f8fffe;border:1px solid #d1fae5;border-radius:10px;padding:20px 22px;margin:0 0 24px;border-left:4px solid #1a7a45;white-space:pre-wrap;">${safeText}</div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 6px;">Cordialement,</p>
      <p style="color:#0f5530;font-size:14px;font-weight:bold;margin:0 0 2px;">${senderName}</p>
      <p style="color:#6b7280;font-size:12px;margin:0;">Association Ma Belle Promo · Lomé, Togo</p>
    </div>
    <div style="background:#f3f4f6;padding:14px 30px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Association Ma Belle Promo · Lomé, Togo</p>
      <p style="color:#6b7280;font-size:12px;margin:0;"><a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a> · +228 96 09 07 07</p>
      <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;">© 2026 Association Ma Belle Promo</p>
    </div>
  </div>
</body>
</html>`;

    await sendBrevoEmail({
      to: to.trim(),
      toName: recipient_name || '',
      subject: safeSubject,
      html,
      text: text.trim(),
      attachments,
    });

    // Sauvegarde de la réponse en base
    if (supabaseAdmin) {
      try {
        const now = new Date().toISOString();
        let contentToStore = text.trim();
        if (attachments.length > 0) {
          const fileNames = attachments.map(a => a.filename).filter(Boolean).join(', ');
          if (fileNames) contentToStore += `\n\n📎 Pièces jointes : ${fileNames}`;
        }
        await supabaseAdmin.from('message').insert({
          id:              crypto.randomUUID(),
          binome_id:       'contact_reply',
          sender_email:    'contact@mabellepromo.org',
          sender_name:     (signature && signature.trim()) ? signature.trim() : "L'équipe Ma Belle Promo",
          sender_role:     `Réponse : ${subject.trim()}`,
          recipient_email: to.trim(),
          recipient_name:  (recipient_name || '').trim(),
          content:         contentToStore,
          read:            true,
          created_date:    now,
          updated_date:    now,
        });
      } catch (_) { /* non-critique */ }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur envoi réponse contact:', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Erreur interne' });
  }
};
