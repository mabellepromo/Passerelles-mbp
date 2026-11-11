// api/_reviewReportSchema.js
// Schéma de validation de l'analyse IA du rapport de bilan (généré par
// generate-review-report.js). Garde une copie synchronisée côté front dans
// src/lib/reviewReportSchema.js (duplication volontaire : les fonctions
// Vercel api/ sont en CommonJS tandis que le front est en ESM/Vite — faire
// pointer directement le bundle front sur ce fichier serait fragile).

const { z } = require('zod');

const StrengthSchema = z.object({
  title: z.string(),
  evidence: z.string(),
});

const ImprovementSchema = z.object({
  title: z.string(),
  priority: z.enum(['haute', 'moyenne', 'basse']),
  evidence: z.string(),
});

const RecurringThemeSchema = z.object({
  theme: z.string(),
  frequency: z.number().int().nonnegative(),
  field: z.string().optional(),
});

const PairToWatchSchema = z.object({
  binome_ref: z.string(),
  reason: z.string(),
});

const NotableQuoteSchema = z.object({
  // L'IA renvoie seulement l'identifiant du verbatim (V-xx). Le texte exact
  // et la signature sont remis côté serveur selon quote_consent.
  verbatim_id: z.string(),
});

const RecommendationSchema = z.object({
  text: z.string(),
  priority: z.enum(['haute', 'moyenne', 'basse']),
  owner: z.string(),
});

const ReviewReportAnalysisSchema = z.object({
  executive_summary: z.string().min(1),
  key_findings: z.array(z.string()).max(5),
  strengths: z.array(StrengthSchema).max(5),
  improvements: z.array(ImprovementSchema).max(5),
  recurring_themes: z.array(RecurringThemeSchema),
  pairs_to_watch: z.array(PairToWatchSchema),
  key_learnings: z.array(z.string()).max(5),
  recommendations: z.array(RecommendationSchema).max(8),
  notable_quotes: z.array(NotableQuoteSchema),
  conclusion: z.string().min(1),
  sample_warning: z.string().nullable(),
});

module.exports = {
  StrengthSchema,
  ImprovementSchema,
  RecurringThemeSchema,
  PairToWatchSchema,
  NotableQuoteSchema,
  RecommendationSchema,
  ReviewReportAnalysisSchema,
};
