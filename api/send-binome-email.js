// api/send-binome-email.js
// Fonction serverless Vercel pour envoyer les emails de déclenchement des binômes

const { createClient } = require('@supabase/supabase-js');

const sendBrevoEmail = async ({ to, toName, subject, html, attachments = [] }) => {
  const body = {
    sender: { name: 'Ma Belle Promo – PASSERELLES', email: 'contact@mabellepromo.org' },
    to: [{ email: to, name: toName || '' }],
    replyTo: { email: 'contact@mabellepromo.org' },
    subject,
    htmlContent: html,
  };
  if (attachments.length > 0) {
    body.attachment = attachments.map(a => ({ name: a.filename, content: a.content }));
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Brevo API error ${res.status}`);
  }
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAuth = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const { ADMIN_EMAILS, isUserAdmin } = require('./_admin');

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

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
  if (origin === (process.env.SITE_URL || 'https://passerelles.vercel.app')) return origin;
  if (origin.endsWith('.vercel.app') && origin.includes('passerelles')) return origin;
  return null;
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

  if (!supabaseAuth) {
    return res.status(500).json({ error: 'Configuration Supabase manquante' });
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

const emailMentor = (mentor_name, mentore_name, mentore_specialisation, mentore_universite, notes, activation_link) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;">
    <tr><td align="center" style="padding:20px 10px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

        <tr>
          <td bgcolor="#0f5530" align="center" valign="middle" style="background-color:#0f5530;padding:30px 30px 20px;">
            <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;font-family:Arial,sans-serif;">Association Ma Belle Promo</p>
            <h1 style="color:#ffffff;font-size:26px;margin:0 0 6px;font-weight:bold;font-family:Arial,sans-serif;">Programme PASSERELLES</h1>
            <p style="color:#a7f3d0;font-size:13px;margin:0;font-family:Arial,sans-serif;">Cohorte 1 &ndash; 2026</p>
          </td>
        </tr>
        <tr>
          <td bgcolor="#d4aa35" style="background-color:#d4aa35;height:3px;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr>

        <tr>
          <td style="padding:30px;">
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;font-family:Georgia,serif;">Cher(e) <strong>${mentor_name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;font-family:Georgia,serif;">Nous avons le plaisir de vous annoncer officiellement le démarrage du <strong>Programme PASSERELLES – Cohorte 1</strong> et de vous présenter votre binôme.</p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4;border:1px solid #a7f3d0;margin:20px 0;">
              <tr>
                <td style="padding:20px;">
                  <p style="color:#0f5530;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif;">Votre Mentoré(e)</p>
                  <h2 style="color:#1a7a45;font-size:20px;margin:0 0 8px;font-family:Arial,sans-serif;">${mentore_name}</h2>
                  <p style="color:#374151;font-size:13px;margin:0 0 4px;font-family:Arial,sans-serif;">📌 ${mentore_specialisation}</p>
                  <p style="color:#374151;font-size:13px;margin:0 0 12px;font-family:Arial,sans-serif;">📌 ${mentore_universite}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-left:3px solid #1a7a45;padding:10px 14px;background-color:#ffffff;">
                        <p style="color:#374151;font-size:13px;font-style:italic;margin:0;line-height:1.6;font-family:Georgia,serif;">${notes}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;font-family:Georgia,serif;">Vous trouverez en pièce jointe la fiche complète de votre binôme avec toutes les informations nécessaires pour votre premier contact.</p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #1a7a45;margin:20px 0;">
              <tr>
                <td align="center" style="padding:20px;">
                  <p style="color:#0f5530;font-size:14px;font-weight:bold;margin:0 0 8px;font-family:Arial,sans-serif;">🔐 Accédez à votre espace personnel</p>
                  <p style="color:#374151;font-size:13px;margin:0 0 16px;line-height:1.6;font-family:Arial,sans-serif;">Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder directement à votre espace binôme. Ce lien est personnel et valable 24h.</p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#0f5530" align="center" style="background-color:#0f5530;">
                        <a href="${activation_link}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;font-family:Arial,sans-serif;display:inline-block;padding:16px 40px;">Activer mon compte</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;font-family:Arial,sans-serif;">Pour toute question, n'hésitez pas à nous contacter à <a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a></p>
          </td>
        </tr>

        <tr>
          <td bgcolor="#f3f4f6" align="center" style="background-color:#f3f4f6;padding:16px 30px;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px;font-family:Arial,sans-serif;">Association Ma Belle Promo &ndash; Lomé, Togo</p>
            <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,sans-serif;"><a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a> &ndash; +228 96 09 07 07</p>
            <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;font-family:Arial,sans-serif;">© 2026 Ma Belle Promo – Programme PASSERELLES</p>
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;font-family:Arial,sans-serif;"><a href="${siteUrl}/PolitiqueConfidentialite" style="color:#9ca3af;text-decoration:underline;">Politique de confidentialité</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const emailMentore = (mentore_name, mentor_name, mentor_profession, mentor_organisation, notes, activation_link) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;">
    <tr><td align="center" style="padding:20px 10px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

        <tr>
          <td bgcolor="#0f5530" align="center" valign="middle" style="background-color:#0f5530;padding:30px 30px 20px;">
            <p style="color:#d4aa35;font-size:11px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;font-family:Arial,sans-serif;">Association Ma Belle Promo</p>
            <h1 style="color:#ffffff;font-size:26px;margin:0 0 6px;font-weight:bold;font-family:Arial,sans-serif;">Programme PASSERELLES</h1>
            <p style="color:#a7f3d0;font-size:13px;margin:0;font-family:Arial,sans-serif;">Cohorte 1 &ndash; 2026</p>
          </td>
        </tr>
        <tr>
          <td bgcolor="#d4aa35" style="background-color:#d4aa35;height:3px;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr>

        <tr>
          <td style="padding:30px;">
            <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;font-family:Georgia,serif;">Cher(e) <strong>${mentore_name}</strong>,</p>
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;font-family:Georgia,serif;">Félicitations ! Votre candidature au <strong>Programme PASSERELLES – Cohorte 1</strong> a été retenue. Nous avons le plaisir de vous présenter votre mentor(e).</p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4;border:1px solid #a7f3d0;margin:20px 0;">
              <tr>
                <td style="padding:20px;">
                  <p style="color:#0f5530;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif;">Votre Mentor(e)</p>
                  <h2 style="color:#1a7a45;font-size:20px;margin:0 0 8px;font-family:Arial,sans-serif;">${mentor_name}</h2>
                  <p style="color:#374151;font-size:13px;margin:0 0 4px;font-family:Arial,sans-serif;">📌 ${mentor_profession}</p>
                  <p style="color:#374151;font-size:13px;margin:0 0 12px;font-family:Arial,sans-serif;">📌 ${mentor_organisation}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-left:3px solid #1a7a45;padding:10px 14px;background-color:#ffffff;">
                        <p style="color:#374151;font-size:13px;font-style:italic;margin:0;line-height:1.6;font-family:Georgia,serif;">${notes}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px;font-family:Georgia,serif;">Vous trouverez en pièce jointe la fiche complète de votre binôme. Nous vous encourageons à prendre contact avec votre mentor(e) dans les meilleurs délais pour planifier votre première rencontre.</p>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #1a7a45;margin:20px 0;">
              <tr>
                <td align="center" style="padding:20px;">
                  <p style="color:#0f5530;font-size:14px;font-weight:bold;margin:0 0 8px;font-family:Arial,sans-serif;">🔐 Accédez à votre espace personnel</p>
                  <p style="color:#374151;font-size:13px;margin:0 0 16px;line-height:1.6;font-family:Arial,sans-serif;">Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder directement à votre espace binôme. Ce lien est personnel et valable 24h.</p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#0f5530" align="center" style="background-color:#0f5530;">
                        <a href="${activation_link}" style="color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;font-family:Arial,sans-serif;display:inline-block;padding:16px 40px;">Activer mon compte</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">Pour toute question : <a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a></p>
          </td>
        </tr>

        <tr>
          <td bgcolor="#f3f4f6" align="center" style="background-color:#f3f4f6;padding:16px 30px;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px;font-family:Arial,sans-serif;">Association Ma Belle Promo &ndash; Lomé, Togo</p>
            <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,sans-serif;"><a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;">contact@mabellepromo.org</a> &ndash; +228 96 09 07 07</p>
            <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;font-family:Arial,sans-serif;">© 2026 Ma Belle Promo – Programme PASSERELLES</p>
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;font-family:Arial,sans-serif;"><a href="${siteUrl}/PolitiqueConfidentialite" style="color:#9ca3af;text-decoration:underline;">Politique de confidentialité</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
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

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const authError = await authorizeRequest(req, res);
  if (authError) return authError;

  try {
    const {
      mentor_name, mentor_email, mentor_profession, mentor_organisation,
      mentore_name, mentore_email, mentore_specialisation, mentore_universite,
      notes,
      pdf_base64,
      pdf_filename,
      send_to = 'both', // 'both' | 'mentor' | 'mentore'
    } = req.body;

    if (!mentor_name || !mentor_email || !mentore_name || !mentore_email) {
      return res.status(400).json({ error: 'Champs mentor et mentoré requis.' });
    }
    if (!validateEmail(mentor_email) || !validateEmail(mentore_email)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const site_url = process.env.SITE_URL || 'https://passerelles.vercel.app';

    const mentorNameSafe = escapeHtml(mentor_name.trim());
    const mentorProfessionSafe = escapeHtml((mentor_profession || '').trim());
    const mentorOrganisationSafe = escapeHtml((mentor_organisation || '').trim());
    const mentoreNameSafe = escapeHtml(mentore_name.trim());
    const mentoreSpecialisationSafe = escapeHtml((mentore_specialisation || '').trim());
    const mentoreUniversiteSafe = escapeHtml((mentore_universite || '').trim());
    const notesSafe = escapeHtml((notes || `Binome ${mentor_name} ↔ ${mentore_name}`).trim());
    const safeMentorEmail = mentor_email.trim();
    const safeMentoreEmail = mentore_email.trim();

    const sendToMentor  = send_to === 'both' || send_to === 'mentor';
    const sendToMentore = send_to === 'both' || send_to === 'mentore';

    // Générer les liens d'activation personnalisés (nécessite SUPABASE_SERVICE_ROLE_KEY)
    const redirectTo = `${site_url}/auth/callback`;
    let mentorActivationLink = site_url;
    let mentoreActivationLink = site_url;
    if (supabaseAuth) {
      try {
        const linkRequests = [];
        if (sendToMentor)  linkRequests.push(supabaseAuth.auth.admin.generateLink({ type: 'recovery', email: safeMentorEmail,  options: { redirectTo } }));
        if (sendToMentore) linkRequests.push(supabaseAuth.auth.admin.generateLink({ type: 'recovery', email: safeMentoreEmail, options: { redirectTo } }));
        const [r1, r2] = await Promise.all(linkRequests);
        if (sendToMentor)  mentorActivationLink  = r1?.data?.properties?.action_link || site_url;
        if (sendToMentore) mentoreActivationLink = (sendToMentor ? r2 : r1)?.data?.properties?.action_link || site_url;
      } catch (e) {
        console.error('generateLink error:', e.message);
      }
    }

    const attachments = pdf_base64 ? [{
      filename: escapeHtml(pdf_filename || 'fiche-binome-passerelles.pdf'),
      content: pdf_base64,
      encoding: 'base64',
      contentType: 'application/pdf',
    }] : [];

    if (sendToMentor) {
      await sendBrevoEmail({
        to: safeMentorEmail,
        toName: mentorNameSafe,
        subject: `PASSERELLES – Votre binôme : ${mentoreNameSafe}`,
        html: emailMentor(mentorNameSafe, mentoreNameSafe, mentoreSpecialisationSafe, mentoreUniversiteSafe, notesSafe, mentorActivationLink),
        attachments,
      });
    }

    if (sendToMentore) {
      await sendBrevoEmail({
        to: safeMentoreEmail,
        toName: mentoreNameSafe,
        subject: `PASSERELLES – Votre mentor(e) : ${mentorNameSafe}`,
        html: emailMentore(mentoreNameSafe, mentorNameSafe, mentorProfessionSafe, mentorOrganisationSafe, notesSafe, mentoreActivationLink),
        attachments,
      });
    }

    const sent = [sendToMentor && safeMentorEmail, sendToMentore && safeMentoreEmail].filter(Boolean).join(' et ');
    return res.status(200).json({ success: true, message: `Email(s) envoyé(s) à ${sent}` });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erreur interne' });
  }
};
