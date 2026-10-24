// api/send-email.js
// Fonction serverless — deux usages distincts, regroupés dans un seul fichier
// pour rester sous la limite de fonctions du plan Vercel Hobby :
// 1. Envoi d'email générique via Brevo, pour les admins authentifiés (sans
//    "action" dans le corps, comportement historique inchangé).
// 2. Actions de la campagne de sondage PASSERELLES (action="launch_review_campaign"
//    | "test_review_invitation" | "send_review_reminders" | "review_thank_you") :
//    les deux premières sont déclenchées par l'admin (bearer token), les deux
//    dernières par pg_cron / par la RPC submit_review via un secret partagé
//    (en-tête x-webhook-secret), jamais par le front.

const { createClient } = require('@supabase/supabase-js');
const {
  buildInvitationEmail,
  buildReminderEmail,
  buildFinalReminderEmail,
  buildThankYouEmail,
} = require('./_reviewEmails');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://passerelles.vercel.app';
const REVIEW_WEBHOOK_SECRET = process.env.REVIEW_WEBHOOK_SECRET || '';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://passerelles.vercel.app',
];

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.includes(origin) || origin === SITE_URL) return origin;
  return null;
};

const supabaseService = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

// ----------------------------------------------------------------------------
// Envoi brut via Brevo (utilisé par toutes les actions)
// ----------------------------------------------------------------------------

async function sendViaBrevo({ to, subject, html, text }) {
  const htmlContent = html || text.split('\n\n')
    .map((p) => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Ma Belle Promo – PASSERELLES', email: 'contact@mabellepromo.org' },
      to: [{ email: to }],
      replyTo: { email: 'contact@mabellepromo.org' },
      subject,
      htmlContent,
    }),
  });

  const data = await brevoRes.json().catch(() => ({}));
  if (!brevoRes.ok) throw new Error(data.message || `Brevo error ${brevoRes.status}`);
  return data.messageId || null;
}

async function logEmail({ campaignId, tokenId, participantEmail, emailType, status, providerMessageId, error }) {
  await supabaseService.from('review_email_log').insert({
    campaign_id: campaignId,
    token_id: tokenId,
    participant_email: participantEmail,
    email_type: emailType,
    status,
    provider_message_id: providerMessageId || null,
    error: error || null,
  });
}

function firstNameOf(fullName) {
  return (fullName || '').split(' ')[0] || 'bonjour';
}

async function participantFirstName(tokenRow) {
  const table = tokenRow.role === 'mentor' ? 'mentor' : 'mentore';
  const { data } = await supabaseService.from(table).select('full_name').eq('email', tokenRow.participant_email).limit(1).maybeSingle();
  return firstNameOf(data?.full_name);
}

function daysUntil(deadline) {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

// ----------------------------------------------------------------------------
// Action admin : lancer la campagne (invitations à tous les participants
// actifs n'ayant pas encore de réponse). Idempotente : ne renvoie jamais une
// invitation déjà journalisée pour un token donné.
// ----------------------------------------------------------------------------

async function handleLaunchCampaign(req, res, adminUser) {
  const { campaign_id: campaignId } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaign_id manquant' });

  const { data: campaign, error: campaignError } = await supabaseService
    .from('review_campaigns').select('*').eq('id', campaignId).single();
  if (campaignError || !campaign) return res.status(404).json({ error: 'Campagne introuvable' });
  if (campaign.status !== 'draft') return res.status(409).json({ error: 'Cette campagne a déjà été lancée' });

  // Passage en "active" via la RPC (vérifie l'admin et pose launched_at/launched_by)
  const { error: launchError } = await supabaseService.rpc('launch_review_campaign', { p_campaign_id: campaignId });
  if (launchError) return res.status(500).json({ error: launchError.message });

  const { data: participants, error: participantsError } = await supabaseService
    .from('review_campaign_participants')
    .select('*')
    .eq('has_responded', false);
  if (participantsError) return res.status(500).json({ error: participantsError.message });

  const targets = campaign.test_mode
    ? participants.slice(0, 1) // mode test : un seul envoi réel, vers test_email
    : participants;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const participant of targets) {
    // Idempotence : si une invitation est déjà journalisée pour ce token sur
    // cette campagne, on ne renvoie rien (protège contre un double clic).
    const { data: existingLog } = await supabaseService
      .from('review_email_log')
      .select('id')
      .eq('token_id', participant.token_id)
      .eq('campaign_id', campaignId)
      .eq('email_type', 'invitation')
      .limit(1)
      .maybeSingle();
    if (existingLog) { skipped += 1; continue; }

    const to = campaign.test_mode ? campaign.test_email : participant.participant_email;
    const link = `${SITE_URL}/bilan/${participant.token}`;
    const unsubscribeLink = `${SITE_URL}/desinscription/${participant.token}`;
    const { subject, html, text } = buildInvitationEmail({
      firstName: participant.participant_name ? firstNameOf(participant.participant_name) : 'bonjour',
      role: participant.role,
      link,
      unsubscribeLink,
    });

    try {
      const messageId = await sendViaBrevo({ to, subject, html, text });
      await logEmail({ campaignId, tokenId: participant.token_id, participantEmail: to, emailType: 'invitation', status: 'sent', providerMessageId: messageId });
      sent += 1;
    } catch (err) {
      await logEmail({ campaignId, tokenId: participant.token_id, participantEmail: to, emailType: 'invitation', status: 'failed', error: err.message });
      failed += 1;
    }
  }

  return res.status(200).json({ sent, skipped, failed, test_mode: campaign.test_mode });
}

// ----------------------------------------------------------------------------
// Action admin : envoyer une invitation d'exemple à l'adresse de test, sans
// toucher au statut de la campagne ni à la journalisation (pure prévisualisation).
// ----------------------------------------------------------------------------

async function handleTestInvitation(req, res) {
  const { campaign_id: campaignId } = req.body || {};
  const { data: campaign, error: campaignError } = await supabaseService
    .from('review_campaigns').select('*').eq('id', campaignId).single();
  if (campaignError || !campaign) return res.status(404).json({ error: 'Campagne introuvable' });
  if (!campaign.test_email) return res.status(400).json({ error: "Aucune adresse de test définie sur la campagne" });

  const { subject, html, text } = buildInvitationEmail({
    firstName: 'Eric',
    role: 'mentor',
    link: `${SITE_URL}/bilan/exemple-de-token`,
    unsubscribeLink: `${SITE_URL}/desinscription/exemple-de-token`,
  });

  try {
    await sendViaBrevo({ to: campaign.test_email, subject: `[TEST] ${subject}`, html, text });
    return res.status(200).json({ sent: true, to: campaign.test_email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ----------------------------------------------------------------------------
// Action webhook (pg_cron) : rappels quotidiens
// ----------------------------------------------------------------------------

async function handleSendReminders(req, res) {
  await supabaseService.rpc('close_expired_review_campaigns');

  const { data: campaign } = await supabaseService
    .from('review_campaigns').select('*').eq('status', 'active').order('launched_at', { ascending: false }).limit(1).maybeSingle();
  if (!campaign) return res.status(200).json({ skipped: true, reason: 'no_active_campaign' });

  const { data: candidates, error: candidatesError } = await supabaseService
    .rpc('get_review_reminder_candidates', { p_campaign_id: campaign.id });
  if (candidatesError) return res.status(500).json({ error: candidatesError.message });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates || []) {
    // Vérification juste avant l'envoi : on ne relance jamais quelqu'un qui
    // vient de répondre entre la sélection des candidats et maintenant.
    const { data: existingResponse } = await supabaseService
      .from('review_responses').select('id').eq('token_id', candidate.token_id).limit(1).maybeSingle();
    if (existingResponse) { skipped += 1; continue; }

    const to = campaign.test_mode ? campaign.test_email : candidate.participant_email;
    const firstName = await participantFirstName(candidate);
    const link = `${SITE_URL}/bilan/${candidate.token}`;
    const unsubscribeLink = `${SITE_URL}/desinscription/${candidate.token}`;
    const emailType = candidate.is_final ? 'final_reminder' : 'reminder';

    const builder = candidate.is_final ? buildFinalReminderEmail : buildReminderEmail;
    const { subject, html, text } = builder({
      firstName,
      role: candidate.role,
      link,
      unsubscribeLink,
      daysLeft: daysUntil(campaign.deadline),
    });

    try {
      const messageId = await sendViaBrevo({ to, subject, html, text });
      await logEmail({ campaignId: campaign.id, tokenId: candidate.token_id, participantEmail: to, emailType, status: 'sent', providerMessageId: messageId });
      sent += 1;
    } catch (err) {
      await logEmail({ campaignId: campaign.id, tokenId: candidate.token_id, participantEmail: to, emailType, status: 'failed', error: err.message });
      failed += 1;
    }
  }

  return res.status(200).json({ sent, skipped, failed });
}

// ----------------------------------------------------------------------------
// Action webhook (RPC submit_review) : email de remerciement, une seule fois
// ----------------------------------------------------------------------------

async function handleThankYou(req, res) {
  const { token_id: tokenId, participant_email: participantEmail, role } = req.body || {};
  if (!tokenId || !participantEmail || !role) return res.status(400).json({ error: 'Paramètres manquants' });

  const { data: existingLog } = await supabaseService
    .from('review_email_log').select('id').eq('token_id', tokenId).eq('email_type', 'thank_you').limit(1).maybeSingle();
  if (existingLog) return res.status(200).json({ skipped: true });

  const { data: campaign } = await supabaseService
    .from('review_campaigns').select('id, test_mode, test_email').in('status', ['active', 'closed']).order('launched_at', { ascending: false }).limit(1).maybeSingle();

  const table = role === 'mentor' ? 'mentor' : 'mentore';
  const { data: participant } = await supabaseService.from(table).select('full_name').eq('email', participantEmail).limit(1).maybeSingle();
  const firstName = firstNameOf(participant?.full_name);
  const to = campaign?.test_mode ? campaign.test_email : participantEmail;

  const { subject, html, text } = buildThankYouEmail({ firstName, role });

  try {
    const messageId = await sendViaBrevo({ to, subject, html, text });
    await logEmail({ campaignId: campaign?.id || null, tokenId, participantEmail: to, emailType: 'thank_you', status: 'sent', providerMessageId: messageId });
    return res.status(200).json({ sent: true });
  } catch (err) {
    await logEmail({ campaignId: campaign?.id || null, tokenId, participantEmail: to, emailType: 'thank_you', status: 'failed', error: err.message });
    return res.status(500).json({ error: err.message });
  }
}

// ----------------------------------------------------------------------------
// Envoi générique historique (admin authentifié, pas d'action)
// ----------------------------------------------------------------------------

async function handleGenericSend(req, res) {
  const { to, subject, text, html, attachments = [] } = req.body || {};
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Champs to, subject et text/html requis' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) return res.status(400).json({ error: 'Email destinataire invalide' });

  const htmlContent = html || text.split('\n\n')
    .map((p) => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

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
            <img src="${SITE_URL}/logo-mbp.png" alt="MBP" width="72" height="72"
              style="display:block;width:72px;height:72px;border-radius:50%;margin:0 auto 14px;border:3px solid #d4aa35;" />
            <h1 style="color:#ffffff;font-size:22px;margin:0 0 6px;font-weight:bold;font-family:Arial,sans-serif;line-height:1.3;">
              Association Ma Belle Promo (MBP)
            </h1>
            <p style="color:#a7f3d0;font-size:13px;margin:0;font-family:Arial,sans-serif;">
              Programme PASSERELLES &middot; Cohorte 1 &ndash; 2026
            </p>
          </td>
        </tr>
        <tr><td bgcolor="#d4aa35" style="background-color:#d4aa35;height:3px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
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
            <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;font-family:Arial,sans-serif;"><a href="${SITE_URL}/PolitiqueConfidentialite" style="color:#9ca3af;text-decoration:underline;">Politique de confidentialité</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const brevoBody = {
    sender: { name: 'Ma Belle Promo – PASSERELLES', email: 'contact@mabellepromo.org' },
    to: [{ email: to }],
    replyTo: { email: 'contact@mabellepromo.org' },
    subject,
    htmlContent: emailBody,
  };
  if (Array.isArray(attachments) && attachments.length > 0) {
    brevoBody.attachment = attachments.map((a) => ({ name: a.name, content: a.content }));
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
      body: JSON.stringify(brevoBody),
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
}

// ----------------------------------------------------------------------------
// Entrée
// ----------------------------------------------------------------------------

const WEBHOOK_ACTIONS = new Set(['send_review_reminders', 'review_thank_you']);
const ADMIN_ACTIONS = new Set(['launch_review_campaign', 'test_review_invitation']);

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);
  res.setHeader('Access-Control-Allow-Origin', allowOrigin || 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-secret');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!supabaseService) return res.status(500).json({ error: 'Configuration serveur manquante' });

  const { action } = req.body || {};

  // Appels serveur-à-serveur (pg_cron, RPC submit_review) : secret partagé,
  // pas d'origine CORS à vérifier (aucun navigateur impliqué).
  if (WEBHOOK_ACTIONS.has(action)) {
    const providedSecret = req.headers['x-webhook-secret'];
    if (!REVIEW_WEBHOOK_SECRET || providedSecret !== REVIEW_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Secret invalide' });
    }
    if (action === 'send_review_reminders') return handleSendReminders(req, res);
    if (action === 'review_thank_you') return handleThankYou(req, res);
  }

  // Tout le reste passe par le navigateur admin : origine + bearer token requis.
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisée' });

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  const { isUserAdmin } = require('./_admin');
  const { data: userData, error: authError } = await supabaseService.auth.getUser(token);
  if (authError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
  if (!isUserAdmin(userData.user)) return res.status(403).json({ error: 'Accès réservé aux administrateurs' });

  if (ADMIN_ACTIONS.has(action)) {
    if (action === 'launch_review_campaign') return handleLaunchCampaign(req, res, userData.user);
    if (action === 'test_review_invitation') return handleTestInvitation(req, res);
  }

  return handleGenericSend(req, res);
};
