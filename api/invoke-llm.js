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

// Un appel à l'IA pour une partie du rapport. On pré-remplit la réponse avec
// "{" : le modèle ne peut alors ni ajouter de balises markdown ni de texte
// avant le JSON. Une réponse coupée (max_tokens atteint) est signalée clairement.
async function callReportPart(prompt, signal, part) {
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_REPORT_MODEL,
      max_tokens: 4096,
      system: "Tu es un assistant d'analyse de données pour un programme de mentorat associatif. Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, sans balises markdown. N'invente jamais de donnée absente des informations fournies.",
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    const error = new Error(err.error?.message || `Erreur Anthropic (${anthropicRes.status})`);
    error.httpStatus = anthropicRes.status === 429 ? 429 : 502;
    throw error;
  }

  const anthropicJson = await anthropicRes.json();
  const rawText = '{' + (anthropicJson.content?.[0]?.text || '');
  if (anthropicJson.stop_reason === 'max_tokens') {
    console.error(`generate_review_report: partie "${part}" coupée (max_tokens)`);
    throw new Error('Réponse IA trop longue (coupée). Relance la génération.');
  }
  const parsed = extractJson(rawText);
  if (parsed === null) {
    console.error(`generate_review_report: partie "${part}" non lisible (début) :`, rawText.slice(0, 500));
    throw new Error('Réponse IA invalide : JSON non lisible. Relance la génération.');
  }
  return parsed;
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
      mentor_responded: b.mentor_responded,
      mentore_responded: b.mentore_responded,
      sessions_declared_mentor: b.sessions_declared_mentor,
      sessions_declared_mentore: b.sessions_declared_mentore,
    }));

    const promptData = {
      metrics,
      verbatims: verbatims.map(toAiVerbatim),
      ficheNotes,
      pairsForAi,
    };

    const remainingBudget = HARD_BUDGET_MS - (Date.now() - t0);
    if (remainingBudget < 5000) {
      return res.status(504).json({ error: "Préparation des données trop longue, l'appel IA n'a pas pu démarrer à temps." });
    }

    // Deux appels EN PARALLÈLE, chacun rédigeant la moitié du rapport : une
    // réponse unique était trop longue (JSON coupé) et trop lente (> 60 s).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingBudget);
    let parts;
    try {
      parts = await Promise.all(['constats', 'binomes'].map((part) => callReportPart(
        buildAnalysisPrompt(promptData, part), controller.signal, part,
      )));
    } catch (callErr) {
      if (callErr.name === 'AbortError') {
        console.error(`generate_review_report: appel IA interrompu après ${Date.now() - t0}ms`);
        return res.status(504).json({ error: "Délai d'attente dépassé lors de l'appel à l'IA. Relance la génération." });
      }
      console.error('generate_review_report:', callErr.message);
      return res.status(callErr.httpStatus || 502).json({ error: callErr.message });
    } finally {
      clearTimeout(timeout);
    }
    console.log(`generate_review_report: réponses IA reçues (${Date.now() - t0}ms)`);
    const parsedAnalysis = { ...parts[0], ...parts[1] };

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
// Action generate_bureau_report : bilan « version bureau » (24/11/2026)
//
// Aucun appel à l'IA. Le serveur :
//   1. recalcule les métriques SQL et la photographie des données (mêmes
//      fonctions et mêmes vues filtrées que le brouillon n° 6) ;
//   2. reprend du dernier brouillon n° 6 (ligne sans report_format) le
//      classement qualitatif des binômes, les thèmes récurrents et sa date ;
//   3. enregistre une NOUVELLE ligne en brouillon avec les textes envoyés par
//      l'onglet « Rapport » (textes par défaut ou textes déjà modifiés).
// Le brouillon n° 6 n'est jamais modifié.
// ----------------------------------------------------------------------------

const BUREAU_FORMAT = 'bilan_bureau';
const PAIR_STATUSES = ['active', 'limitee', 'non_etablie', 'inconnue'];

// Contrôle de forme des textes envoyés par le navigateur.
function cleanSections(sections) {
  if (!Array.isArray(sections) || !sections.length || sections.length > 30) return null;
  const out = [];
  for (const s of sections) {
    if (!s || typeof s.key !== 'string' || typeof s.title !== 'string' || typeof s.body !== 'string') return null;
    if (s.key.length > 40 || s.title.length > 200 || s.body.length > 30000) return null;
    out.push({ key: s.key, title: s.title, body: s.body });
  }
  return out;
}

async function handleGenerateBureauReport(req, res, adminUserId) {
  if (!supabaseService) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur' });
  const { cohorte = '1', title, sections, pair_notes = null } = req.body || {};

  const cleanedSections = cleanSections(sections);
  if (!cleanedSections || typeof title !== 'string' || title.length > 200) {
    return res.status(400).json({ error: 'Textes du rapport invalides.' });
  }

  try {
    // 1. Chiffres : mêmes calculs que le brouillon n° 6.
    const { data: metrics, error: metricsError } = await supabaseService
      .rpc('build_review_report_metrics', { p_cohorte: cohorte });
    if (metricsError) throw new Error(`Agrégation SQL : ${metricsError.message}`);
    const binomesCount = metrics?.binomes_count ?? 0;
    if (binomesCount !== EXPECTED_BINOME_COUNT) {
      return res.status(409).json({
        error: `Rapport non généré : ${binomesCount} binôme(s) analysé(s) au lieu de ${EXPECTED_BINOME_COUNT} attendus. Vérifie la colonne is_test de la table binome avant de relancer.`,
      });
    }
    const sources = await loadReportSources(supabaseService);
    const snapshot = buildSnapshot(sources);
    const binomeIds = new Set(snapshot.binomes.map((b) => b.binome_id));

    // 2. Brouillon n° 6 : dernière ligne de la cohorte sans report_format.
    const { data: legacyRows, error: legacyError } = await supabaseService
      .from('review_reports')
      .select('id, generated_at, ai_analysis')
      .eq('period_label', cohorte)
      .is('ai_analysis->>report_format', null)
      .order('generated_at', { ascending: false })
      .limit(1);
    if (legacyError) throw new Error(`Lecture du brouillon n° 6 : ${legacyError.message}`);
    const legacy = legacyRows?.[0];
    if (!legacy?.ai_analysis?.pair_status) {
      return res.status(409).json({ error: 'Brouillon n° 6 introuvable : le classement des binômes ne peut pas être repris.' });
    }

    // 3. État et constat par binôme. Régénération : on garde ceux du bilan
    //    en cours (pair_notes) ; première génération : état du brouillon n° 6.
    const legacyStatus = new Map(legacy.ai_analysis.pair_status.map((p) => [p.binome_id, p.status]));
    const previous = Array.isArray(pair_notes) ? new Map(pair_notes.map((p) => [p.binome_id, p])) : null;
    const notes = [...binomeIds].map((id) => {
      const prev = previous?.get(id);
      const status = PAIR_STATUSES.includes(prev?.status) ? prev.status : (legacyStatus.get(id) || 'inconnue');
      // Constat : saisi par l'admin dans l'annexe A (vide à la première génération).
      const constat = typeof prev?.constat === 'string' ? prev.constat : '';
      // Message de clôture (fiches binômes) : conservé tel quel s'il existe.
      const message = typeof prev?.message_cloture === 'string' ? { message_cloture: prev.message_cloture.slice(0, 4000) } : {};
      return { binome_id: id, status, constat: constat.slice(0, 500), ...message };
    });

    const analysis = {
      report_format: BUREAU_FORMAT,
      title: title.trim(),
      sections: cleanedSections,
      pair_notes: notes,
      source_report_id: legacy.id,
      source_generated_at: legacy.generated_at,
      source_themes: (legacy.ai_analysis.recurring_themes || []).map((t) => ({ theme: t.theme, frequency: t.frequency })),
    };

    const { data: inserted, error: insertError } = await supabaseService
      .from('review_reports')
      .insert({
        generated_by: adminUserId,
        period_label: cohorte,
        metrics: { ...metrics, snapshot },
        ai_analysis: analysis,
        status: 'draft',
      })
      .select()
      .single();
    if (insertError) throw new Error(`Enregistrement du rapport : ${insertError.message}`);
    return res.status(200).json(inserted);
  } catch (err) {
    console.error('generate_bureau_report error:', err.message);
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
  if (action === 'generate_bureau_report') {
    return handleGenerateBureauReport(req, res, userData.user.id);
  }
  return handleGenericInvoke(req, res);
};
