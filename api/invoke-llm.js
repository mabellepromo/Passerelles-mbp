// api/invoke-llm.js
// Vercel serverless — appels IA via Claude (Anthropic) :
// - action par défaut : invocation générique (évaluation des candidatures, etc.)
// - action "generate_review_report" : génération du rapport de bilan PASSERELLES
//   (métriques SQL + verbatims pseudonymisés -> analyse Claude -> validation zod)
// Les deux actions partagent le même fichier pour rester sous la limite de
// fonctions serverless du plan Vercel Hobby.

const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isUserAdmin } = require('./_admin');
const { ReviewReportAnalysisSchema } = require('./_reviewReportSchema');
const {
  EXPECTED_BINOME_COUNT, loadReportSources, buildSnapshot, buildPseudonymMaps,
  buildVerbatims, toAiVerbatim, buildFicheNotes, buildAnalysisPrompt, resolveAnalysis,
} = require('./_reviewReportData');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const supabaseService = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Haiku plutôt que Sonnet : la génération de ~4096 tokens de sortie en Sonnet
// dépassait systématiquement les 57s disponibles (plan Vercel Hobby, plafond
// dur de 60s de maxDuration) avant même d'avoir reçu de réponse — voir logs
// "Anthropic call aborted after 57003ms". Une tâche de synthèse structurée en
// JSON contraint par un schéma strict (listes plafonnées, pas de raisonnement
// ouvert) ne justifie pas Sonnet ici ; Haiku est nettement plus rapide.
const ANTHROPIC_REPORT_MODEL = process.env.ANTHROPIC_REPORT_MODEL || 'claude-haiku-4-5-20251001';
const MIN_RESPONSES = Number(process.env.REVIEW_REPORT_MIN_RESPONSES || 1);

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://passerelles.vercel.app',
];

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  const siteUrl = process.env.SITE_URL || 'https://passerelles.vercel.app';
  if (ALLOWED_ORIGINS.includes(origin) || origin === siteUrl) return origin;
  // Déploiement de preview Vercel : on accepte uniquement l'adresse du
  // déploiement lui-même (VERCEL_URL) et celle de sa branche, pour pouvoir
  // tester la génération du rapport avant la mise en production.
  if (process.env.VERCEL_ENV === 'preview') {
    const previewOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
      .filter(Boolean).map((host) => `https://${host}`);
    if (previewOrigins.includes(origin)) return origin;
  }
  return null;
};

// ----------------------------------------------------------------------------
// Action générique : InvokeLLM(prompt, response_json_schema)
// ----------------------------------------------------------------------------

async function handleGenericInvoke(req, res) {
  if (!ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Service IA non configuré (ANTHROPIC_API_KEY manquant)' });

  const { prompt, response_json_schema } = req.body || {};
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt manquant' });

  const systemPrompt = response_json_schema
    ? `Tu es un assistant d'évaluation. Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks. Le JSON doit respecter ce schéma : ${JSON.stringify(response_json_schema)}`
    : "Tu es un assistant. Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.";

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic error ${anthropicRes.status}`);
    }

    const result = await anthropicRes.json();
    const text = result.content?.[0]?.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('invoke-llm error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ----------------------------------------------------------------------------
// Action generate_review_report : rapport de bilan PASSERELLES
//
// Étapes :
//   1. Lecture des données par les vues filtrées (binôme test exclu).
//   2. Garde-fou : refus si le nombre de binômes n'est pas celui attendu.
//   3. Pseudonymisation, puis appel à l'IA pour la seule partie qualitative.
//   4. Validation du JSON, remise des identités et des verbatims côté serveur.
//   5. Enregistrement en brouillon (status = 'draft').
// Les fonctions d'aide sont dans api/_reviewReportData.js.
// ----------------------------------------------------------------------------

// Extraction tolérante du JSON renvoyé par le modèle : certains modèles
// ajoutent des balises markdown (```json ... ```) ou du texte autour du JSON
// malgré la consigne. On retire les balises éventuelles puis on isole le
// premier objet JSON complet trouvé dans le texte.
function extractJson(rawText) {
  let text = rawText.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  try {
    return JSON.parse(text);
  } catch {
    // ignore, on tente l'extraction par accolades ci-dessous
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function handleGenerateReviewReport(req, res, adminUserId) {
  if (!ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Service IA non configuré (ANTHROPIC_API_KEY manquant)' });
  if (!supabaseService) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur' });

  const { cohorte = null } = req.body || {};
  const t0 = Date.now();
  // Budget total aligné sur maxDuration=60s (vercel.json).
  const HARD_BUDGET_MS = 57000;

  try {
    // 1. Métriques du sondage — calculées en SQL, jamais par l'IA.
    const { data: metrics, error: metricsError } = await supabaseService
      .rpc('build_review_report_metrics', { p_cohorte: cohorte });
    if (metricsError) throw new Error(`Agrégation SQL : ${metricsError.message}`);

    // 2. GARDE-FOU : on ne produit pas un rapport en silence si le nombre de
    //    binômes analysés n'est pas celui attendu.
    const binomesCount = metrics?.binomes_count ?? 0;
    if (binomesCount !== EXPECTED_BINOME_COUNT) {
      return res.status(409).json({
        error: `Rapport non généré : ${binomesCount} binôme(s) analysé(s) au lieu de ${EXPECTED_BINOME_COUNT} attendus. Vérifie la colonne is_test de la table binome avant de relancer.`,
      });
    }

    const totalResponses = metrics?.total_responses ?? 0;
    if (totalResponses < MIN_RESPONSES) {
      return res.status(422).json({
        error: `Pas assez de réponses pour générer un rapport (${totalResponses} reçue(s), minimum requis : ${MIN_RESPONSES}).`,
      });
    }

    // 3. Autres données du rapport, toutes lues par les vues filtrées.
    const sources = await loadReportSources(supabaseService);
    const snapshot = buildSnapshot(sources);
    console.log(`generate_review_report: données lues, ${sources.responses.length} réponses (${Date.now() - t0}ms)`);

    // 4. Pseudonymisation : l'IA ne voit ni nom ni email.
    const { binomeMap, participantMap } = buildPseudonymMaps(sources.overview, sources.responses);
    const verbatims = buildVerbatims(sources.responses, participantMap, binomeMap);
    const ficheNotes = buildFicheNotes(sources.fiches, binomeMap);
    const pairsForAi = sources.overview.map((b) => ({
      binome_ref: binomeMap.get(b.binome_id),
      vigilance: b.vigilance,
      mentor_nps: b.mentor_nps,
      mentore_nps: b.mentore_nps,
    }));

    const prompt = buildAnalysisPrompt({
      metrics,
      verbatims: verbatims.map(toAiVerbatim),
      ficheNotes,
      pairsForAi,
    });

    const remainingBudget = HARD_BUDGET_MS - (Date.now() - t0);
    if (remainingBudget < 5000) {
      return res.status(504).json({ error: "Préparation des données trop longue, l'appel IA n'a pas pu démarrer à temps." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingBudget);

    let anthropicRes;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_REPORT_MODEL,
          max_tokens: 4096,
          system: "Tu es un assistant d'analyse de données pour un programme de mentorat associatif. Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, sans balises markdown ni backticks. Ta réponse doit commencer directement par '{' et se terminer par '}'. N'invente jamais de donnée absente des informations fournies.",
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        console.error(`generate_review_report: appel IA interrompu après ${Date.now() - t0}ms`);
        return res.status(504).json({ error: "Délai d'attente dépassé lors de l'appel à l'IA. Relance la génération." });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }
    console.log(`generate_review_report: réponse IA reçue (${Date.now() - t0}ms)`);

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      const status = anthropicRes.status === 429 ? 429 : 502;
      return res.status(status).json({ error: err.error?.message || `Erreur Anthropic (${anthropicRes.status})` });
    }

    const anthropicJson = await anthropicRes.json();
    const rawText = anthropicJson.content?.[0]?.text?.trim() || '';

    const parsedAnalysis = extractJson(rawText);
    if (parsedAnalysis === null) {
      console.error('generate_review_report: réponse IA non lisible (début) :', rawText.slice(0, 500));
      return res.status(502).json({ error: 'Réponse IA invalide : JSON non lisible. Relance la génération.' });
    }

    // 5. Validation stricte du schéma avant toute écriture.
    const validation = ReviewReportAnalysisSchema.safeParse(parsedAnalysis);
    if (!validation.success) {
      console.error('generate_review_report: schéma non respecté', validation.error.flatten());
      return res.status(502).json({ error: 'Réponse IA invalide : schéma non respecté. Relance la génération.' });
    }

    // 6. Remise des identités et des verbatims exacts, côté serveur.
    const analysis = resolveAnalysis(validation.data, { verbatims, binomeMap, overview: sources.overview });

    // 7. Enregistrement en brouillon. La photographie des données (snapshot)
    //    est rangée dans metrics : le rapport validé ne bougera plus.
    const { data: inserted, error: insertError } = await supabaseService
      .from('review_reports')
      .insert({
        generated_by: adminUserId,
        period_label: cohorte || 'toutes_cohortes',
        metrics: { ...metrics, snapshot },
        ai_analysis: analysis,
        status: 'draft',
      })
      .select()
      .single();
    if (insertError) throw new Error(`Enregistrement du rapport : ${insertError.message}`);

    return res.status(200).json(inserted);
  } catch (err) {
    console.error('generate_review_report error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ----------------------------------------------------------------------------
// Entrée commune : auth, CORS, puis routage par action
// ----------------------------------------------------------------------------

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(origin);
  if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!allowOrigin) return res.status(403).json({ error: 'Origine non autorisée' });

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !userData?.user) return res.status(401).json({ error: 'Non authentifié' });
  if (!isUserAdmin(userData.user)) return res.status(403).json({ error: 'Accès réservé aux administrateurs' });

  const { action } = req.body || {};
  if (action === 'generate_review_report') {
    return handleGenerateReviewReport(req, res, userData.user.id);
  }
  return handleGenericInvoke(req, res);
};
