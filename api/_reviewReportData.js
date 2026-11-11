// api/_reviewReportData.js
// Fonctions d'aide pour la génération du rapport de bilan (appelées par
// api/invoke-llm.js). Le nom commence par "_" : Vercel ne le compte pas comme
// une fonction serverless.
//
// Principes :
//   - Toutes les lectures passent par les vues filtrées (official_*, review_*) :
//     le binôme de test n'entre dans aucun chiffre ni aucun texte.
//   - L'IA ne reçoit que des données pseudonymisées (M-01, E-01, B-01, V-01...).
//   - L'IA ne recopie JAMAIS un verbatim : elle renvoie seulement son identifiant
//     (V-xx). Le texte exact et la signature sont remis ici, côté serveur, en
//     respectant quote_consent à la lettre.
//   - Aucun chiffre sur le nombre de séances (décision du 11/11/2026).

// Nombre de binômes officiels attendu. Si le nombre réel est différent, la
// génération est refusée avec un message clair (garde-fou).
const EXPECTED_BINOME_COUNT = Number(process.env.REVIEW_REPORT_EXPECTED_BINOMES || 11);

// Réponses libres du sondage transmises à l'IA.
const OPEN_TEXT_FIELDS = ['strengths', 'improvements', 'objectives_comment', 'suggestions'];

// ----------------------------------------------------------------------------
// Signature d'un verbatim selon le consentement donné dans le sondage
//   'none'       -> jamais cité (renvoie null)
//   'first_name' -> prénom seul
//   'full_name'  -> nom complet
// ----------------------------------------------------------------------------

// Les noms sont enregistrés au format « NOM Prénoms » : le NOM est en majuscules.
function isLastNameWord(word) {
  const letters = word.replace(/['\-.]/g, '');
  return letters.length > 1 && letters === letters.toUpperCase();
}

function extractFirstName(fullName) {
  const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const givenNames = words.filter((w) => !isLastNameWord(w));
  // On évite les initiales seules (« K. ») quand un vrai prénom existe.
  const realFirstName = givenNames.find((w) => w.replace(/\./g, '').length > 2);
  return realFirstName || givenNames[0] || null;
}

function buildAttribution(response) {
  const roleLabel = response.role === 'mentor' ? 'mentor' : 'mentoré(e)';
  if (response.quote_consent === 'full_name' && response.participant_name) {
    return `${response.participant_name}, ${roleLabel}`;
  }
  if (response.quote_consent === 'first_name') {
    const firstName = extractFirstName(response.participant_name);
    return firstName ? `${firstName}, ${roleLabel}` : null;
  }
  return null; // 'none' ou valeur inconnue : jamais cité
}

// ----------------------------------------------------------------------------
// Pseudonymisation
// ----------------------------------------------------------------------------

function pad(n) {
  return String(n).padStart(2, '0');
}

// binomes : lignes de official_binome_overview ; responses : review_by_participant
function buildPseudonymMaps(binomes, responses) {
  const binomeMap = new Map(); // binome_id -> "B-01"
  binomes.forEach((b, i) => binomeMap.set(b.binome_id, `B-${pad(i + 1)}`));

  const participantMap = new Map(); // id de la réponse -> "M-01" / "E-01"
  let mentorCount = 0;
  let mentoreCount = 0;
  for (const r of responses) {
    if (r.role === 'mentor') {
      mentorCount += 1;
      participantMap.set(r.id, `M-${pad(mentorCount)}`);
    } else {
      mentoreCount += 1;
      participantMap.set(r.id, `E-${pad(mentoreCount)}`);
    }
  }
  return { binomeMap, participantMap };
}

// Liste complète des verbatims, avec ce qui reste côté serveur (texte exact,
// signature) et ce qui part vers l'IA (voir toAiVerbatim).
function buildVerbatims(responses, participantMap, binomeMap) {
  const verbatims = [];
  for (const r of responses) {
    for (const field of OPEN_TEXT_FIELDS) {
      const text = r.answers?.[field];
      if (!text || !String(text).trim()) continue;
      const attribution = buildAttribution(r);
      verbatims.push({
        id: `V-${pad(verbatims.length + 1)}`,
        participant_ref: participantMap.get(r.id),
        binome_ref: binomeMap.get(r.binome_id),
        role: r.role,
        field,
        text: String(text).trim(),
        nps_score: r.nps_score,
        quote_consent: r.quote_consent,
        attribution,
        quotable: attribution !== null,
      });
    }
  }
  return verbatims;
}

// Ce que l'IA voit d'un verbatim : aucun nom, aucun email.
function toAiVerbatim(v) {
  return {
    id: v.id,
    participant_ref: v.participant_ref,
    binome_ref: v.binome_ref,
    role: v.role,
    field: v.field,
    text: v.text,
    nps_score: v.nps_score,
    quotable: v.quotable,
  };
}

// Contenu qualitatif des fiches de séance (objectifs abordés, difficultés).
// Il nourrit l'analyse mais n'est PAS représentatif des 11 binômes.
function buildFicheNotes(fiches, binomeMap) {
  return fiches
    .map((f) => ({
      binome_ref: binomeMap.get(f.binome_id),
      author_role: f.submitted_by === 'mentor' || f.submitted_by === 'mentore' ? f.submitted_by : 'inconnu',
      objectives_discussed: f.objectives_discussed || null,
      challenges: f.challenges || null,
    }))
    .filter((n) => n.objectives_discussed || n.challenges);
}

// ----------------------------------------------------------------------------
// Photographie des données au moment de la génération (enregistrée avec le
// rapport, pour que le PDF validé ne change plus ensuite).
// ----------------------------------------------------------------------------

async function readAll(supabase, viewName) {
  const { data, error } = await supabase.from(viewName).select('*');
  if (error) throw new Error(`Lecture de ${viewName} : ${error.message}`);
  return data ?? [];
}

async function loadReportSources(supabase) {
  const [summaryRows, overview, responses, fiches, binomes, campaigns] = await Promise.all([
    readAll(supabase, 'official_survey_summary'),
    readAll(supabase, 'official_binome_overview'),
    readAll(supabase, 'review_by_participant'),
    readAll(supabase, 'official_suivis'),
    readAll(supabase, 'official_binomes'),
    supabase.from('review_campaigns').select('name, status, deadline, launched_at')
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data, error }) => { if (error) throw new Error(error.message); return data ?? []; }),
  ]);

  // Lieu de résidence déclaré par les mentors des binômes officiels.
  const mentorIds = binomes.map((b) => b.mentor_id).filter(Boolean);
  const { data: mentors, error: mentorsError } = await supabase
    .from('mentor').select('id, city, city_other').in('id', mentorIds);
  if (mentorsError) throw new Error(`Lecture des mentors : ${mentorsError.message}`);

  // Nombre de candidatures reçues (tables mentor et mentore, toutes candidatures).
  const [{ count: mentorApplications }, { count: mentoreApplications }] = await Promise.all([
    supabase.from('mentor').select('id', { count: 'exact', head: true }),
    supabase.from('mentore').select('id', { count: 'exact', head: true }),
  ]);

  // Tri stable : les pseudonymes B-01, B-02... suivent l'ordre alphabétique des mentors.
  overview.sort((a, b) => String(a.mentor_name).localeCompare(String(b.mentor_name)));
  responses.sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)));

  return {
    summary: summaryRows[0] || null,
    overview,
    responses,
    fiches,
    campaign: campaigns[0] || null,
    mentors: mentors ?? [],
    mentorApplications: mentorApplications ?? null,
    mentoreApplications: mentoreApplications ?? null,
  };
}

// Regroupe les lieux de résidence : [{ place: 'Lomé', count: 7 }, ...]
function countMentorPlaces(mentors) {
  const counts = new Map();
  for (const m of mentors) {
    const raw = (m.city_other && m.city_other.trim()) || m.city || '';
    const place = raw.trim().toLowerCase() === 'lome' ? 'Lomé, Togo' : (raw.trim() || 'Non renseigné');
    counts.set(place, (counts.get(place) || 0) + 1);
  }
  return [...counts.entries()].map(([place, count]) => ({ place, count })).sort((a, b) => b.count - a.count);
}

function buildSnapshot(sources) {
  const fichesRated = sources.fiches.filter((f) => !f.author_satisfaction_excluded);
  const satisfactionValues = [...new Set(fichesRated.map((f) => f.author_satisfaction))];

  return {
    expected_binome_count: EXPECTED_BINOME_COUNT,
    survey_summary: sources.summary,
    campaign: sources.campaign,
    applications: { mentors: sources.mentorApplications, mentores: sources.mentoreApplications },
    mentor_places: countMentorPlaces(sources.mentors),
    // Fiche par binôme SANS aucune colonne de séances : ces chiffres ne
    // doivent apparaître dans aucun export du rapport.
    binomes: sources.overview.map((b) => ({
      binome_id: b.binome_id,
      mentor_name: b.mentor_name,
      mentore_name: b.mentore_name,
      mentor_responded: b.mentor_responded,
      mentore_responded: b.mentore_responded,
      mentor_nps: b.mentor_nps,
      mentore_nps: b.mentore_nps,
      vigilance: b.vigilance,
      objectives_count: b.objectives_count,
      objectives_reached_count: b.objectives_reached_count,
    })),
    // Satisfaction des fiches : on garde seulement de quoi dire si la note est
    // exploitable (toutes les notes identiques = valeur préremplie du formulaire).
    fiche_satisfaction: {
      rated: fichesRated.length,
      by_mentore: fichesRated.filter((f) => f.submitted_by === 'mentore').length,
      by_mentor: fichesRated.filter((f) => f.submitted_by === 'mentor').length,
      excluded: sources.fiches.length - fichesRated.length,
      all_notes_identical: fichesRated.length > 0 && satisfactionValues.length === 1,
      single_value: satisfactionValues.length === 1 ? satisfactionValues[0] : null,
    },
  };
}

// ----------------------------------------------------------------------------
// Consigne envoyée à l'IA
// ----------------------------------------------------------------------------

function buildAnalysisPrompt({ metrics, verbatims, ficheNotes, pairsForAi }) {
  // On retire des métriques ce qui ne doit pas être analysé comme un comptage.
  const metricsForAi = { ...metrics };
  delete metricsForAi.snapshot;

  return `Tu rédiges la partie qualitative du rapport de bilan d'un programme de mentorat (programme PASSERELLES, association Ma Belle Promo, cohorte 1, lancée le 5 mai 2026), en français soutenu, neutre et factuel, sans superlatif gratuit. Le rapport est lu par le bureau de l'association, puis par des partenaires et bailleurs.

MÉTRIQUES DU SONDAGE (déjà calculées, chiffres exacts — ne les recalcule jamais) :
${JSON.stringify(metricsForAi)}
Notes de lecture : "nps_global" donne la répartition promoteurs / passifs / détracteurs sur l'ensemble des réponses. "sessions_distribution" et la question "sessions_regularity" sont des DÉCLARATIONS des participants, pas un comptage.

BINÔMES (pseudonymisés, B-xx) avec leur niveau de vigilance calculé d'après les notes de recommandation :
${JSON.stringify(pairsForAi)}

VERBATIMS du sondage, pseudonymisés (V-xx = identifiant du verbatim, M-xx = mentor, E-xx = mentoré, B-xx = binôme). Champs : strengths = ce qui a le mieux fonctionné ; improvements = ce qui pourrait être amélioré ; objectives_comment = ce qui a aidé ou freiné l'atteinte des objectifs ; suggestions = suggestions libres :
${JSON.stringify(verbatims)}

NOTES DES FICHES DE SÉANCE (pseudonymisées). ATTENTION : seuls quelques binômes ont rempli des fiches ; ces notes illustrent des situations, elles ne sont PAS représentatives de l'ensemble des binômes :
${JSON.stringify(ficheNotes)}

Règles strictes :
1. N'invente AUCUN chiffre, nom, binôme ou citation. Si une rubrique ne peut pas être remplie, renvoie un tableau vide.
2. Tout chiffre cité est accompagné de son effectif (ex. « 7 mentors sur 11 », « 64 % (7/11) »), jamais un pourcentage seul. Le NPS n'est jamais cité comme un score isolé : donne la répartition promoteurs / passifs / détracteurs sur le nombre de réponses.
3. NOMBRE DE SÉANCES : une partie des séances n'a pas été enregistrée sur la plateforme. Ne donne AUCUN nombre, total ou moyenne de séances, aucune fréquence ni évolution mensuelle. Tu peux mentionner les déclarations du sondage uniquement en les présentant comme déclaratives et sans les additionner.
4. NEUTRALITÉ SUR L'AVENIR DU PROGRAMME : la poursuite du programme n'est ni décidée ni annoncée. N'écris jamais que le programme continuera, sera reconduit ou s'arrêtera. Formule les recommandations et la conclusion au conditionnel (« dans l'hypothèse d'une nouvelle cohorte », « si une cohorte 2 était lancée »).
5. "recurring_themes" : thèmes qui reviennent dans les verbatims (strengths, improvements, objectives_comment). "frequency" = nombre de verbatims différents qui l'évoquent. "field" = le champ dominant.
6. "notable_quotes" : 4 à 8 identifiants de verbatims (V-xx) dont "quotable" vaut true, représentatifs des thèmes, mêlant points forts et points à améliorer. Ne recopie pas le texte : renvoie uniquement l'identifiant.
7. "pairs_to_watch" : uniquement des "binome_ref" de niveau "rouge" ou "orange" présents ci-dessus, avec une raison factuelle (notes, écart mentor / mentoré, verbatims), sans jugement sur les personnes.
8. "recommendations" : 4 à 6 actions concrètes et priorisées ("haute", "moyenne", "basse"), chacune avec un "owner" associatif plausible (ex. « Coordination PASSERELLES », « Bureau de Ma Belle Promo ») — jamais un nom de personne. Tu DOIS inclure l'enregistrement systématique des séances sur la plateforme comme point d'amélioration.
9. "key_findings" : 3 à 5 constats courts et chiffrés pour le résumé exécutif.
10. "conclusion" : 4 à 6 phrases, bilan équilibré et perspectives formulées au conditionnel (règle 4).
11. "sample_warning" : une phrase rappelant que les résultats reposent sur un petit effectif et doivent être lus avec prudence.
12. N'écris JAMAIS un identifiant technique (M-01, E-02, B-03, V-04...) dans un texte : écris « un mentor », « une mentorée », « un binôme ». Les identifiants ne servent que dans "binome_ref" et "verbatim_id".

Réponds UNIQUEMENT en JSON valide (sans markdown, sans balises de code), avec exactement cette forme :
{
  "executive_summary": "string, 5 à 8 phrases",
  "key_findings": ["string"],
  "strengths": [{ "title": "string", "evidence": "string avec effectifs" }],
  "improvements": [{ "title": "string", "priority": "haute|moyenne|basse", "evidence": "string" }],
  "recurring_themes": [{ "theme": "string", "frequency": number, "field": "strengths|improvements|objectives_comment|suggestions" }],
  "pairs_to_watch": [{ "binome_ref": "string", "reason": "string" }],
  "key_learnings": ["string"],
  "recommendations": [{ "text": "string", "priority": "haute|moyenne|basse", "owner": "string" }],
  "notable_quotes": [{ "verbatim_id": "string" }],
  "conclusion": "string",
  "sample_warning": "string"
}`;
}

// ----------------------------------------------------------------------------
// Après la réponse de l'IA : on remet les vraies identités, côté serveur.
// ----------------------------------------------------------------------------

// Filet de sécurité : si l'IA a malgré tout écrit un identifiant technique
// (M-01, B-03...) dans un texte, on le remplace par une formule neutre.
function scrubRefs(value) {
  if (typeof value === 'string') {
    return value
      .replace(/\bM-\d{2}\b/g, 'un mentor')
      .replace(/\bE-\d{2}\b/g, 'un(e) mentoré(e)')
      .replace(/\bB-\d{2}\b/g, 'un binôme')
      .replace(/\s*\(?\bV-\d{2}\b\)?/g, '');
  }
  if (Array.isArray(value)) return value.map(scrubRefs);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubRefs(v)]));
  }
  return value;
}

function resolveAnalysis(analysis, { verbatims, binomeMap, overview }) {
  const verbatimById = new Map(verbatims.map((v) => [v.id, v]));
  const binomeIdByRef = new Map([...binomeMap.entries()].map(([id, ref]) => [ref, id]));
  const binomeById = new Map(overview.map((b) => [b.binome_id, b]));

  // Citations : texte EXACT du verbatim, signature selon le consentement.
  // Un identifiant inconnu ou non citable ('none') est écarté sans exception.
  const seen = new Set();
  const notableQuotes = [];
  for (const q of analysis.notable_quotes) {
    const v = verbatimById.get(q.verbatim_id);
    if (!v || !v.quotable || seen.has(v.id)) continue;
    seen.add(v.id);
    notableQuotes.push({
      verbatim_id: v.id,
      role: v.role,
      field: v.field,
      text: v.text,
      attribution: v.attribution,
      quote_consent: v.quote_consent,
    });
  }

  const pairsToWatch = analysis.pairs_to_watch
    .map((p) => {
      const binomeId = binomeIdByRef.get(p.binome_ref) || null;
      const binome = binomeId ? binomeById.get(binomeId) : null;
      if (!binome) return null;
      return {
        binome_ref: p.binome_ref,
        reason: p.reason,
        binome_id: binomeId,
        mentor_name: binome.mentor_name,
        mentore_name: binome.mentore_name,
        vigilance: binome.vigilance,
      };
    })
    .filter(Boolean);

  // Les textes rédigés par l'IA sont nettoyés ; les citations (texte exact des
  // participants) et les identités remises ci-dessus ne sont pas touchées.
  const freeText = { ...analysis };
  delete freeText.notable_quotes;
  delete freeText.pairs_to_watch;
  return {
    ...scrubRefs(freeText),
    notable_quotes: notableQuotes,
    pairs_to_watch: pairsToWatch.map((p) => ({ ...p, reason: scrubRefs(p.reason) })),
  };
}

module.exports = {
  EXPECTED_BINOME_COUNT,
  loadReportSources,
  buildSnapshot,
  buildPseudonymMaps,
  buildVerbatims,
  toAiVerbatim,
  buildFicheNotes,
  buildAnalysisPrompt,
  resolveAnalysis,
};
