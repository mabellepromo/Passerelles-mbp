// api/_reviewEmails.js
// Gabarits des emails de la campagne de sondage PASSERELLES (invitation,
// rappel, dernier rappel, remerciement) — HTML compatible clients mail
// (tables, styles inline, largeur max 600px) + texte brut.

const DEADLINE_LABEL = 'lundi 9 novembre 2026 à 23h59 (heure de Lomé, GMT)';

function emailShell(bodyHtml, { unsubscribeLink } = {}) {
  return `<!DOCTYPE html>
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
            <h1 style="color:#ffffff;font-size:22px;margin:0 0 6px;font-weight:bold;font-family:Arial,sans-serif;line-height:1.3;">
              Association Ma Belle Promo (MBP)
            </h1>
            <p style="color:#a7f3d0;font-size:13px;margin:0;font-family:Arial,sans-serif;">
              Programme PASSERELLES &middot; Sondage de bilan
            </p>
          </td>
        </tr>
        <tr><td bgcolor="#d4aa35" style="background-color:#d4aa35;height:3px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
        <tr>
          <td style="padding:30px 30px 24px;color:#374151;font-size:15px;line-height:1.8;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td bgcolor="#f3f4f6" align="center" style="background-color:#f3f4f6;padding:16px 30px;border-top:1px solid #e5e7eb;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px;font-family:Arial,sans-serif;">Association Ma Belle Promo &ndash; Lomé, Togo</p>
            <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,sans-serif;">
              <a href="mailto:contact@mabellepromo.org" style="color:#1a7a45;text-decoration:none;">contact@mabellepromo.org</a>
              &nbsp;&ndash;&nbsp;+228 96 09 07 07
            </p>
            ${unsubscribeLink ? `<p style="color:#9ca3af;font-size:11px;margin:10px 0 0;font-family:Arial,sans-serif;"><a href="${unsubscribeLink}" style="color:#9ca3af;text-decoration:underline;">Ne plus recevoir les rappels pour ce sondage</a></p>` : ''}
            <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;font-family:Arial,sans-serif;">© 2026 Ma Belle Promo – Programme PASSERELLES</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label, url) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr><td align="center" bgcolor="#1a7a45" style="border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

function roleLabel(role) {
  return role === 'mentor' ? 'mentor' : 'mentoré(e)';
}

// ----------------------------------------------------------------------------
// Email d'invitation
// ----------------------------------------------------------------------------

function buildInvitationEmail({ firstName, role, link, unsubscribeLink }) {
  const subject = 'Votre sondage de bilan — Programme PASSERELLES';
  const p = (t) => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${t}</p>`;

  const html = emailShell(`
    ${p(`Bonjour ${firstName},`)}
    ${p(`Dans le cadre du programme PASSERELLES, nous vous invitons à compléter votre sondage de bilan en tant que ${roleLabel(role)}. Vos réponses nous aident à comprendre comment se déroule votre binôme et à améliorer le programme pour la suite.`)}
    ${p(`Vos réponses sont nominatives et lues uniquement par la coordination. Le sondage prend environ <strong>10 à 12 minutes</strong>.`)}
    ${button('Répondre au sondage', link)}
    ${p(`<strong>Merci de répondre avant le ${DEADLINE_LABEL}.</strong>`)}
    ${p(`Merci pour votre implication dans le programme !`)}
    ${p(`Eric<br/>Président de Ma Belle Promo — Coordination PASSERELLES`)}
  `, { unsubscribeLink });

  const text = `Bonjour ${firstName},

Dans le cadre du programme PASSERELLES, nous vous invitons à compléter votre sondage de bilan en tant que ${roleLabel(role)}. Vos réponses nous aident à comprendre comment se déroule votre binôme et à améliorer le programme pour la suite.

Vos réponses sont nominatives et lues uniquement par la coordination. Le sondage prend environ 10 à 12 minutes.

Votre lien personnel :
${link}

Merci de répondre avant le ${DEADLINE_LABEL}.

Merci pour votre implication dans le programme !

Eric
Président de Ma Belle Promo — Coordination PASSERELLES`;

  return { subject, html, text };
}

// ----------------------------------------------------------------------------
// Email de rappel (gabarit unique, jours restants calculés)
// ----------------------------------------------------------------------------

function buildReminderEmail({ firstName, role, link, daysLeft, unsubscribeLink }) {
  const subject = `Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} pour répondre au sondage PASSERELLES`;
  const p = (t) => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${t}</p>`;

  const html = emailShell(`
    ${p(`Bonjour ${firstName},`)}
    ${p(`Un petit rappel amical : nous n'avons pas encore reçu votre réponse au sondage de bilan PASSERELLES en tant que ${roleLabel(role)}.`)}
    ${p(`Il vous reste <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> pour y répondre — cela ne prend que 10 à 12 minutes, et votre avis compte vraiment pour nous.`)}
    ${button('Répondre au sondage', link)}
    ${p(`Date limite : <strong>${DEADLINE_LABEL}</strong>.`)}
    ${p(`Merci pour votre engagement dans le programme.`)}
    ${p(`Eric<br/>Président de Ma Belle Promo — Coordination PASSERELLES`)}
  `, { unsubscribeLink });

  const text = `Bonjour ${firstName},

Un petit rappel amical : nous n'avons pas encore reçu votre réponse au sondage de bilan PASSERELLES en tant que ${roleLabel(role)}.

Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} pour y répondre — cela ne prend que 10 à 12 minutes, et votre avis compte vraiment pour nous.

Votre lien personnel :
${link}

Date limite : ${DEADLINE_LABEL}.

Merci pour votre engagement dans le programme.

Eric
Président de Ma Belle Promo — Coordination PASSERELLES`;

  return { subject, html, text };
}

// ----------------------------------------------------------------------------
// Email de dernier rappel
// ----------------------------------------------------------------------------

function buildFinalReminderEmail({ firstName, role, link, unsubscribeLink }) {
  const subject = 'Dernier jour pour répondre au sondage PASSERELLES';
  const p = (t) => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${t}</p>`;

  const html = emailShell(`
    ${p(`Bonjour ${firstName},`)}
    ${p(`C'est aujourd'hui le <strong>dernier jour</strong> pour répondre au sondage de bilan PASSERELLES en tant que ${roleLabel(role)} — la date limite est fixée à ce soir, <strong>${DEADLINE_LABEL}</strong>.`)}
    ${p(`Si vous n'avez pas encore eu l'occasion de répondre, voici votre lien personnel :`)}
    ${button('Répondre maintenant', link)}
    ${p(`Cela ne prend que 10 à 12 minutes, et votre retour est précieux pour la suite du programme.`)}
    ${p(`Merci pour votre engagement.`)}
    ${p(`Eric<br/>Président de Ma Belle Promo — Coordination PASSERELLES`)}
  `, { unsubscribeLink });

  const text = `Bonjour ${firstName},

C'est aujourd'hui le dernier jour pour répondre au sondage de bilan PASSERELLES en tant que ${roleLabel(role)} — la date limite est fixée à ce soir, ${DEADLINE_LABEL}.

Si vous n'avez pas encore eu l'occasion de répondre, voici votre lien personnel :
${link}

Cela ne prend que 10 à 12 minutes, et votre retour est précieux pour la suite du programme.

Merci pour votre engagement.

Eric
Président de Ma Belle Promo — Coordination PASSERELLES`;

  return { subject, html, text };
}

// ----------------------------------------------------------------------------
// Email de remerciement (après soumission)
// ----------------------------------------------------------------------------

function buildThankYouEmail({ firstName, role }) {
  const subject = 'Merci pour votre réponse au sondage PASSERELLES';
  const p = (t) => `<p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 14px;">${t}</p>`;

  const html = emailShell(`
    ${p(`Bonjour ${firstName},`)}
    ${p(`Merci d'avoir pris le temps de répondre au sondage de bilan en tant que ${roleLabel(role)}. Votre retour est précieux et sera lu avec attention par la coordination du programme PASSERELLES.`)}
    ${p(`Merci pour votre implication !`)}
    ${p(`Eric<br/>Président de Ma Belle Promo — Coordination PASSERELLES`)}
  `);

  const text = `Bonjour ${firstName},

Merci d'avoir pris le temps de répondre au sondage de bilan en tant que ${roleLabel(role)}. Votre retour est précieux et sera lu avec attention par la coordination du programme PASSERELLES.

Merci pour votre implication !

Eric
Président de Ma Belle Promo — Coordination PASSERELLES`;

  return { subject, html, text };
}

module.exports = {
  DEADLINE_LABEL,
  buildInvitationEmail,
  buildReminderEmail,
  buildFinalReminderEmail,
  buildThankYouEmail,
};
