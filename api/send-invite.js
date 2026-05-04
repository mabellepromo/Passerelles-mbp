const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';
  if (origin === siteUrl) return origin;
  if (origin.endsWith('.vercel.app') && origin.includes('passerelles')) return origin;
  return null;
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);

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

  // Vérifier que l'email est dans le programme (table mentor ou mentore)
  // ilike = insensible à la casse (couvre les emails stockés en majuscules)
  const [mentorRes, mentoreRes] = await Promise.all([
    supabase.from('mentor').select('email, full_name').ilike('email', emailLower).maybeSingle(),
    supabase.from('mentore').select('email, full_name').ilike('email', emailLower).maybeSingle(),
  ]);

  const member = mentorRes.data || mentoreRes.data;
  if (!member) {
    return res.status(404).json({ error: 'not_in_program' });
  }

  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';

  // Générer un magic link (crée le compte auth si inexistant, valable 24h)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: emailLower,
    options: { redirectTo: `${siteUrl}/auth/reset` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('generateLink error:', linkError);
    return res.status(500).json({ error: 'Erreur génération du lien' });
  }

  const link = linkData.properties.action_link;
  const prenom = member.full_name ? member.full_name.split(' ')[0] : 'Membre';
  const role = mentoreRes.data ? 'mentoré(e)' : 'mentor(e)';

  const htmlContent = `
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">Bonjour <strong>${prenom}</strong>,</p>
<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">
  Votre adresse email a été reconnue en tant que <strong>${role}</strong> du <strong>Programme PASSERELLES</strong>.
  Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace personnel.
</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td align="center">
      <a href="${link}"
        style="display:inline-block;background-color:#0f5530;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">
        Créer mon compte
      </a>
    </td>
  </tr>
</table>
<p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
  Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
</p>`;

  const emailBody = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;">
    <tr><td align="center" style="padding:20px 10px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
        <tr>
          <td bgcolor="#0f5530" align="center" valign="middle" style="background-color:#0f5530;padding:32px 30px 24px;">
            <img src="${siteUrl}/logo-mbp.png" alt="MBP" width="72" height="72"
              style="display:block;width:72px;height:72px;border-radius:50%;margin:0 auto 14px;border:3px solid #d4aa35;" />
            <h1 style="color:#ffffff;font-size:22px;margin:0 0 6px;font-weight:bold;font-family:Arial,sans-serif;line-height:1.3;">
              Association Ma Belle Promo (MBP)
            </h1>
            <p style="color:#a7f3d0;font-size:13px;margin:0;font-family:Arial,sans-serif;">
              Programme PASSERELLES &middot; Cohorte 1 &ndash; 2026
            </p>
          </td>
        </tr>
        <tr>
          <td bgcolor="#d4aa35" style="background-color:#d4aa35;height:3px;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:30px 30px 24px;color:#374151;font-size:15px;line-height:1.8;">
            ${htmlContent}
          </td>
        </tr>
        <tr>
          <td bgcolor="#f3f4f6" align="center" style="background-color:#f3f4f6;padding:16px 30px;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px;font-family:Arial,sans-serif;">Association Ma Belle Promo &ndash; Lomé, Togo</p>
            <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,sans-serif;">
              <a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;text-decoration:none;">contact@mabellepromo.org</a>
              &nbsp;&ndash;&nbsp;+228 96 09 07 07
            </p>
            <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;font-family:Arial,sans-serif;">© 2026 Ma Belle Promo – Programme PASSERELLES</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: 'Ma Belle Promo – PASSERELLES', email: 'contact@mabellepromo.org' },
        to: [{ email: emailLower }],
        replyTo: { email: 'contact@mabellepromo.org' },
        subject: 'Votre accès au Programme PASSERELLES',
        htmlContent: emailBody,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({}));
      throw new Error(err.message || `Brevo error ${brevoRes.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('send-invite error:', e.message);
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
};
