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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const supabaseService = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_REPORT_MODEL = process.env.ANTHROPIC_REPORT_MODEL || 'claude-sonnet-4-5-20250929';
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
// ----------------------------------------------------------------------------

const OPEN_TEXT_FIELDS = ['strengths', 'improvements', 'objectives_comment'];

// Pseudonymisation : table de correspondance en mémoire pour cette seule
// requête, jamais persistée ni renvoyée au front.
function buildPseudonymMaps(responses) {
  const participantMap = new Map(); // participant_email -> "M-01" / "E-01"
  const binomeMap = new Map(); // binome_id -> "B-01"
  let mentorCount = 0;
  let mentoreCount = 0;
  let binomeCount = 0;

  for (const r of responses) {
    if (!binomeMap.has(r.binome_id)) {
      binomeCount += 1;
      binomeMap.set(r.binome_id, `B-${String(binomeCount).padStart(2, '0')}`);
    }
    if (!participantMap.has(r.participant_email)) {
      if (r.role === 'mentor') {
        mentorCount += 1;
        participantMap.set(r.participant_email, `M-${String(mentorCount).padStart(2, '0')}`);
      } else {
        mentoreCount += 1;
        participantMap.set(r.participant_email, `E-${String(mentoreCount).padStart(2, '0')}`);
      }
    }
  }

  return { participantMap, binomeMap };
}

function buildPseudonymizedVerbatims(responses, participantMap, binomeMap) {
  return responses.flatMap((r) => {
    const participantRef = participantMap.get(r.participant_email);
    const binomeRef = binomeMap.get(r.binome_id);
    return OPEN_TEXT_FIELDS
      .filter((field) => r.answers?.[field])
      .map((field) => ({
        participant_ref: participantRef,
        binome_ref: binomeRef,
        role: r.role,
        field,
        text: String(r.answers[field]),
        nps_score: r.nps_score,
        quotable: r.quote_consent !== 'none',
      }));
  });
}

function buildAnalysisPrompt({ cohorte, metrics, verbatims }) {
  return `Tu analyses les résultats d'un bilan de mentorat (programme PASSERELLES, association Ma Belle Promo).
Période analysée : ${cohorte || 'toutes cohortes confondues'}.

MÉTRIQUES (déjà calculées, chiffres exacts — ne les recalcule jamais, utilise-les tels quels) :
${JSON.stringify(metrics)}

VERBATIMS pseudonymisés (M-xx = mentor, E-xx = mentoré, B-xx = binôme ; ce sont des identifiants opaques, ne tente jamais de deviner de vrais noms à partir d'eux) :
${JSON.stringify(verbatims)}

Règles strictes, à respecter impérativement :
1. N'invente AUCUN chiffre, nom, binôme ou citation absent des données ci-dessus.
2. Chaque affirmation de ta synthèse doit être traçable dans les métriques ou les verbatims fournis.
3. "notable_quotes" : ne reprends QUE des verbatims dont "quotable" vaut true, en recopiant exactement leur "participant_ref".
4. "pairs_to_watch" : utilise uniquement des "binome_ref" présents dans les données (pair_gaps ou verbatims).
5. Si une rubrique ne peut pas être remplie à partir des données fournies, renvoie un tableau vide plutôt que d'inventer du contenu.

Réponds UNIQUEMENT en JSON valide (sans markdown, sans balises de code), avec exactement cette forme :
{
  "executive_summary": "string, 5 à 7 phrases",
  "strengths": [{ "title": "string", "evidence": "string avec chiffres et/ou verbatims" }],
  "improvements": [{ "title": "string", "priority": "haute|moyenne|basse", "evidence": "string" }],
  "recurring_themes": [{ "theme": "string", "frequency": number }],
  "pairs_to_watch": [{ "binome_ref": "string", "reason": "string" }],
  "recommendations": ["string"],
  "notable_quotes": [{ "participant_ref": "string", "role": "mentor|mentore", "text": "string" }]
}`;
}

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

// Ré-association des pseudonymes aux vraies identités, uniquement côté
// serveur, juste avant l'enregistrement du rapport en base.
function reassociateRefs(analysis, participantMap, binomeMap) {
  const emailByRef = new Map([...participantMap.entries()].map(([email, ref]) => [ref, email]));
  const binomeIdByRef = new Map([...binomeMap.entries()].map(([id, ref]) => [ref, id]));

  return {
    ...analysis,
    pairs_to_watch: analysis.pairs_to_watch.map((p) => ({
      ...p,
      binome_id: binomeIdByRef.get(p.binome_ref) || null,
    })),
    notable_quotes: analysis.notable_quotes.map((q) => ({
      ...q,
      participant_email: emailByRef.get(q.participant_ref) || null,
    })),
  };
}

async function handleGenerateReviewReport(req, res, adminUserId) {
  if (!ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Service IA non configuré (ANTHROPIC_API_KEY manquant)' });
  if (!supabaseService) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur' });

  const { cohorte = null } = req.body || {};

  try {
    // 1. Métriques agrégées — calculées en SQL, jamais par l'IA.
    const { data: metrics, error: metricsError } = await supabaseService
      .rpc('build_review_report_metrics', { p_cohorte: cohorte });
    if (metricsError) throw new Error(`Agrégation SQL : ${metricsError.message}`);

    const totalResponses = metrics?.total_responses ?? 0;
    if (totalResponses < MIN_RESPONSES) {
      return res.status(422).json({
        error: `Pas assez de réponses pour générer un rapport (${totalResponses} reçue(s), minimum requis : ${MIN_RESPONSES}).`,
      });
    }

    // 2. Réponses détaillées, pour les verbatims et la pseudonymisation.
    let query = supabaseService.from('review_by_participant').select('*');
    if (cohorte) query = query.eq('cohorte', cohorte);
    const { data: responses, error: responsesError } = await query;
    if (responsesError) throw new Error(`Lecture des réponses : ${responsesError.message}`);

    const { participantMap, binomeMap } = buildPseudonymMaps(responses || []);
    const verbatims = buildPseudonymizedVerbatims(responses || [], participantMap, binomeMap);

    // 3. Appel Claude — uniquement sur données pseudonymisées.
    const prompt = buildAnalysisPrompt({ cohorte, metrics, verbatims });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

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
          max_tokens: 8192,
          system: "Tu es un assistant d'analyse de données pour un programme de mentorat associatif. Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, sans balises markdown ni backticks (pas de ```json). Ta réponse doit commencer directement par '{' et se terminer par '}'. N'invente jamais de donnée absente des informations fournies.",
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: "Délai d'attente dépassé lors de l'appel à l'IA" });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      const status = anthropicRes.status === 429 ? 429 : 502;
      return res.status(status).json({ error: err.error?.message || `Erreur Anthropic (${anthropicRes.status})` });
    }

    const anthropicJson = await anthropicRes.json();
    const rawText = anthropicJson.content?.[0]?.text?.trim() || '';

    const parsedAnalysis = extractJson(rawText);
    if (parsedAnalysis === null) {
      console.error('generate_review_report: unparsable AI response (truncated):', rawText.slice(0, 500));
      return res.status(502).json({ error: "Réponse IA invalide : JSON non parsable" });
    }

    // 4. Validation stricte du schéma avant toute ré-association/écriture.
    const validation = ReviewReportAnalysisSchema.safeParse(parsedAnalysis);
    if (!validation.success) {
      console.error('generate_review_report: schema validation failed', validation.error.flatten());
      return res.status(502).json({ error: 'Réponse IA invalide : schéma non respecté' });
    }

    // 5. Ré-association des pseudonymes aux vraies identités, côté serveur.
    const analysis = reassociateRefs(validation.data, participantMap, binomeMap);

    // 6. Enregistrement du rapport en brouillon.
    const { data: inserted, error: insertError } = await supabaseService
      .from('review_reports')
      .insert({
        generated_by: adminUserId,
        period_label: cohorte || 'toutes_cohortes',
        metrics,
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
