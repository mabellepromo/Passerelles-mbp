// src/api/notifyAdmin.js
// Helper fire-and-forget — notifie l'admin lors d'une activité binôme

import { base44 } from './base44Client';

/**
 * @param {'message'|'suivi'|'journal'|'bilan'} event
 * @param {Record<string,string>} details  Clé → valeur affichée dans l'email admin
 */
export async function notifyAdmin(event, details) {
  try {
    const token = await base44.auth.getAccessToken();
    if (!token) return;

    await fetch('/api/notify-admin-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event, details }),
    });
  } catch {
    // Silencieux — ne pas bloquer l'action principale
  }
}
