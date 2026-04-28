// api/invoke-llm.js
// Vercel serverless — Évaluation IA des candidatures via Claude (Anthropic)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, { auth: { persistSession: false } });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const getAllowedOrigin = (origin) => {
  if (!origin) return null;
  if (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') return origin;
  if (origin === (process.env.SITE_URL || 'https://passerelles.vercel.app')) return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  return null;
};

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
};
