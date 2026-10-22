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
});

export const PairToWatchSchema = z.object({
  binome_ref: z.string(),
  reason: z.string(),
  binome_id: z.string().nullable().optional(),
});

export const NotableQuoteSchema = z.object({
  participant_ref: z.string(),
  role: z.enum(['mentor', 'mentore']),
  text: z.string(),
  participant_email: z.string().nullable().optional(),
});

export const ReviewReportAnalysisSchema = z.object({
  executive_summary: z.string().min(1),
  strengths: z.array(StrengthSchema).max(5),
  improvements: z.array(ImprovementSchema).max(5),
  recurring_themes: z.array(RecurringThemeSchema),
  pairs_to_watch: z.array(PairToWatchSchema),
  recommendations: z.array(z.string()),
  notable_quotes: z.array(NotableQuoteSchema),
});

export const PRIORITY_LABEL = {
  haute: 'Priorité haute',
  moyenne: 'Priorité moyenne',
  basse: 'Priorité basse',
};
