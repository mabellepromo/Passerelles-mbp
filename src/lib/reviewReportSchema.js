// Schéma de l'analyse IA du rapport de bilan — copie ESM, pour le front.
// Doit rester synchronisée avec api/_reviewReportSchema.js (CommonJS, utilisé
// côté serveur par generate-review-report.js). Les deux fichiers existent
// séparément car les fonctions Vercel api/ sont en CommonJS alors que le
// front est bundlé en ESM par Vite : un import direct entre les deux serait
// fragile selon l'environnement de build.

import { z } from 'zod';

export const StrengthSchema = z.object({
  title: z.string(),
  evidence: z.string(),
});

export const ImprovementSchema = z.object({
  title: z.string(),
  priority: z.enum(['haute', 'moyenne', 'basse']),
  evidence: z.string(),
});

export const RecurringThemeSchema = z.object({
  theme: z.string(),
  frequency: z.number().int().nonnegative(),
  field: z.string().optional(),
});

export const PairToWatchSchema = z.object({
  binome_ref: z.string(),
  reason: z.string(),
  binome_id: z.string().nullable().optional(),
});

export const NotableQuoteSchema = z.object({
  // L'IA renvoie seulement l'identifiant du verbatim (V-xx). Le texte exact
  // et la signature sont remis côté serveur selon quote_consent.
  verbatim_id: z.string(),
});

// État de la relation d'un binôme, déduit des réponses au sondage.
export const PairStatusSchema = z.object({
  binome_ref: z.string(),
  status: z.enum(['active', 'limitee', 'non_etablie', 'inconnue']),
  basis: z.string(),
});

export const RecommendationSchema = z.object({
  text: z.string(),
  priority: z.enum(['haute', 'moyenne', 'basse']),
  owner: z.string(),
  // Constat de la cohorte 1 qui justifie l'action, avec la donnée et son
  // effectif ; ou la mention « Bonne pratique » si aucune donnée ne l'appuie.
  basis: z.string().optional(),
});

export const ReviewReportAnalysisSchema = z.object({
  executive_summary: z.string().min(1),
  key_findings: z.array(z.string()).max(5),
  strengths: z.array(StrengthSchema).max(5),
  improvements: z.array(ImprovementSchema).max(5),
  recurring_themes: z.array(RecurringThemeSchema),
  pairs_to_watch: z.array(PairToWatchSchema),
  pair_status: z.array(PairStatusSchema).default([]),
  key_learnings: z.array(z.string()).max(5),
  recommendations: z.array(RecommendationSchema).max(8),
  notable_quotes: z.array(NotableQuoteSchema),
  // Citations du paragraphe « Le suivi entre les séances » (même règle de
  // consentement que notable_quotes : texte et signature remis côté serveur).
  follow_up_quotes: z.array(NotableQuoteSchema).default([]),
  // Lecture rédigée (modifiable) des constats sur le suivi entre les séances.
  follow_up_summary: z.string().optional(),
  conclusion: z.string().min(1),
  sample_warning: z.string().nullable(),
});

export const PRIORITY_LABEL = {
  haute: 'Priorité haute',
  moyenne: 'Priorité moyenne',
  basse: 'Priorité basse',
};
