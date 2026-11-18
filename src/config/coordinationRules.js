// Réglages du suivi de la cohorte 2 : TOUS les seuils d'alerte sont ici.
// Pour changer un seuil, modifier ce fichier seulement (puis redéployer).

// Jour du mois suivant jusqu'auquel un check-in peut encore être modifié.
// Doit rester égal à la fonction SQL public.checkin_closing_day().
export const CHECKIN_CLOSING_DAY = 10;

// Seuils des alertes (voir src/lib/cohort2Alerts.js).
export const ALERT_RULES = {
  // Rouge : nombre de check-ins manqués consécutifs (mentor ou mentoré).
  redMissedInARow: 2,
  // Orange : nombre de check-ins manqués (mois choisi).
  orangeMissed: 1,
  // Orange : objectif sans progression depuis ce nombre de mois.
  orangeNoProgressMonths: 2,
  // Orange : écart (en points) entre l'avancement déclaré par le mentor et
  // celui déclaré par le mentoré pour un même objectif.
  orangeProgressGap: 30,
};

export const ROLE_LABEL = { mentor: 'Mentor', mentore: 'Mentoré(e)' };

export const CHANNEL_OPTIONS = [
  { value: 'call', label: 'Appel' },
  { value: 'video', label: 'Visio' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'in_person', label: 'En personne' },
];
export const CHANNEL_LABEL = Object.fromEntries(CHANNEL_OPTIONS.map((c) => [c.value, c.label]));

export const MOOD_OPTIONS = [
  { value: 'good', emoji: '😊', label: 'Bien' },
  { value: 'neutral', emoji: '😐', label: 'Moyen' },
  { value: 'bad', emoji: '😟', label: 'Difficile' },
];
export const MOOD_EMOJI = Object.fromEntries(MOOD_OPTIONS.map((m) => [m.value, m.emoji]));

export const OBJECTIVE_STATUS_LABEL = {
  in_progress: 'En cours',
  achieved: 'Atteint',
  adjusted: 'Ajusté',
  abandoned: 'Abandonné',
};

export const EVENT_TYPE_OPTIONS = [
  { value: 'reminder', label: 'Relance' },
  { value: 'mediation', label: 'Médiation' },
  { value: 'blocker_resolved', label: 'Blocage résolu' },
  { value: 'objective_change', label: 'Changement d\'objectif' },
  { value: 'call', label: 'Appel' },
  { value: 'other', label: 'Autre' },
];
export const EVENT_TYPE_LABEL = Object.fromEntries(EVENT_TYPE_OPTIONS.map((e) => [e.value, e.label]));

// Messages types : libellés des clés stockées en base (app_config).
export const TEMPLATE_LABEL = {
  checkin: 'Check-in du 25',
  reminder: 'Relance J+3',
  thanks: 'Remerciement',
  midpoint: 'Point de mi-parcours',
};

// Texte d'information affiché en bas de la page de check-in (à valider).
export const CHECKIN_PRIVACY_NOTE =
  'Ma Belle Promo enregistre tes réponses (échanges du mois, avancement de vos objectifs, ressenti et '
  + 'éventuel blocage) pour suivre ton binôme et t\'aider si besoin. Seule la coordination du programme y a accès.';
