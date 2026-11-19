// Page publique de check-in mensuel : /m/<token>
//
// Ouverte depuis WhatsApp sur un téléphone, sans compte ni mot de passe.
// Toutes les données passent par deux fonctions SQL qui vérifient le jeton :
//   get_checkin_context(token) et submit_checkin(token, réponses, coord).
//
// Mode « saisie par le coordinateur » : /m/<token>?saisie=coordinateur,
// utilisable seulement par un admin connecté (vérifié par la base) ; la
// réponse est enregistrée avec entered_by = 'coordinator'.
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { CHANNEL_OPTIONS, MOOD_OPTIONS, CHECKIN_PRIVACY_NOTE } from '@/config/coordinationRules';
import { periodLabel } from '@/lib/cohort2Data';

const ERROR_MESSAGES = {
  invalid_token: 'Ce lien n\'est pas valide. Vérifie que tu as bien ouvert le lien complet, ou écris au coordinateur sur WhatsApp.',
  revoked_token: 'Ce lien n\'est plus actif. Écris au coordinateur sur WhatsApp pour recevoir ton nouveau lien.',
  period_closed: 'Le check-in de ce mois est clos. Écris au coordinateur sur WhatsApp si tu veux ajouter quelque chose.',
  not_authorized: 'La saisie par le coordinateur est réservée aux administrateurs connectés.',
  default: 'Une erreur est survenue. Réessaie dans quelques instants ou écris au coordinateur sur WhatsApp.',
};

function errorCode(error) {
  const message = error?.message || '';
  return Object.keys(ERROR_MESSAGES).find((k) => message.includes(k)) || (message.includes('checkins_closed') ? 'closed' : 'default');
}

// « NOM Prénoms » -> « Prénoms NOM »
function displayName(fullName) {
  const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  const isUpper = (w) => w.replace(/[^\p{L}]/gu, '').length > 1 && w === w.toUpperCase();
  return [...words.filter((w) => !isUpper(w)), ...words.filter(isUpper)].join(' ');
}

const Screen = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-6">
    <div className="w-full max-w-md space-y-4">{children}</div>
  </div>
);

const Block = ({ number, title, children }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
    <h2 className="text-base font-semibold text-gray-900">
      <span className="text-emerald-700 mr-1">{number}.</span> {title}
    </h2>
    {children}
  </section>
);

// Bouton de choix (oui / non, moyens, humeur), assez grand pour le doigt.
const Choice = ({ selected, onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition ${selected
      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
      : 'border-gray-200 bg-white text-gray-700'} ${className}`}
  >
    {children}
  </button>
);

const DURATIONS = [15, 30, 45, 60, 90, 120];

// 45 -> « 45 min », 60 -> « 1 h », 90 -> « 1 h 30 »
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest}` : `${hours} h`;
}

export default function CheckIn() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const coordinatorMode = searchParams.get('saisie') === 'coordinateur' && base44.auth.isUserAdmin(user);

  const [status, setStatus] = useState('loading'); // loading | error | closed | ready | submitting | done
  const [error, setError] = useState('default');
  const [context, setContext] = useState(null);
  const [answers, setAnswers] = useState({
    had_exchange: null, exchange_count: 1, exchange_channel: [], approx_duration_minutes: null,
    mood: null, blocker_text: '', progress: {},
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: rpcError } = await supabase.rpc('get_checkin_context', { p_token: token });
      if (!alive) return;
      if (rpcError || !data) {
        setError(errorCode(rpcError));
        setStatus('error');
        return;
      }
      if (data.status === 'closed') {
        setStatus('closed');
        return;
      }
      setContext(data);
      // Préremplissage : réponse déjà envoyée ce mois-ci, sinon dernier avancement déclaré.
      const progress = Object.fromEntries((data.objectives || []).map((o) => [o.id, o.last_progress ?? 0]));
      const existing = data.existing;
      setAnswers((a) => ({
        ...a,
        ...(existing ? {
          had_exchange: existing.had_exchange,
          exchange_count: existing.exchange_count ?? 1,
          exchange_channel: existing.exchange_channel || [],
          approx_duration_minutes: existing.approx_duration_minutes,
          mood: existing.mood,
          blocker_text: existing.blocker_text || '',
        } : {}),
        progress,
      }));
      setStatus('ready');
    })();
    return () => { alive = false; };
  }, [token]);

  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));
  const toggleChannel = (value) => set('exchange_channel',
    answers.exchange_channel.includes(value)
      ? answers.exchange_channel.filter((c) => c !== value)
      : [...answers.exchange_channel, value]);

  const canSubmit = answers.had_exchange !== null && answers.mood !== null && status === 'ready';

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus('submitting');
    const payload = {
      had_exchange: answers.had_exchange,
      exchange_count: answers.had_exchange ? answers.exchange_count : null,
      exchange_channel: answers.had_exchange ? answers.exchange_channel : [],
      approx_duration_minutes: answers.had_exchange ? answers.approx_duration_minutes : null,
      mood: answers.mood,
      blocker_text: answers.blocker_text,
      progress: Object.entries(answers.progress).map(([objective_id, progress_pct]) => ({ objective_id, progress_pct })),
    };
    const { error: rpcError } = await supabase.rpc('submit_checkin', {
      p_token: token, p_answers: payload, p_as_coordinator: coordinatorMode,
    });
    if (rpcError) {
      const code = errorCode(rpcError);
      if (code === 'closed') {
        setStatus('closed');
      } else {
        setError(code);
        setStatus('error');
      }
      return;
    }
    setStatus('done');
  }

  if (status === 'loading') {
    return <Screen><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div></Screen>;
  }

  if (status === 'closed') {
    return (
      <Screen>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
          <Clock className="h-10 w-10 text-emerald-600 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Le suivi mensuel ouvrira bientôt</h1>
          <p className="text-sm text-gray-600">Garde ce lien : il te servira chaque mois. Le coordinateur te préviendra sur WhatsApp.</p>
        </div>
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-sm text-gray-700">{ERROR_MESSAGES[error] || ERROR_MESSAGES.default}</p>
        </div>
      </Screen>
    );
  }

  if (status === 'done') {
    return (
      <Screen>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Merci{coordinatorMode ? '' : ` ${context.first_name}`} !</h1>
          <p className="text-sm text-gray-600">
            {coordinatorMode
              ? 'La réponse a été enregistrée au nom du participant.'
              : `Ton check-in de ${periodLabel(context.period)} est bien enregistré.`}
          </p>
        </div>
      </Screen>
    );
  }

  const closesAt = new Date(context.closes_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <Screen>
      {coordinatorMode && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          Saisie par le coordinateur : la réponse sera enregistrée comme reçue sur WhatsApp.
          {!context.access_open && ' (Check-in fermé pour ce participant : seule la coordination peut saisir.)'}
        </div>
      )}

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">PASSERELLES · check-in de {periodLabel(context.period)}</p>
        <h1 className="text-xl font-bold text-gray-900">Bonjour {context.first_name} !</h1>
        <p className="text-sm text-gray-600">Ton binôme : <strong>{displayName(context.pair_name)}</strong>. Moins d'une minute.</p>
        {context.existing && (
          <p className="text-xs text-gray-500">Tu as déjà répondu ce mois-ci : tu peux modifier ta réponse jusqu'au {closesAt}.</p>
        )}
      </header>

      <Block number={1} title="Avez-vous échangé ce mois-ci ?">
        <div className="grid grid-cols-2 gap-2">
          <Choice selected={answers.had_exchange === true} onClick={() => set('had_exchange', true)}>Oui</Choice>
          <Choice selected={answers.had_exchange === false} onClick={() => set('had_exchange', false)}>Non</Choice>
        </div>
        {answers.had_exchange && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Combien de fois ?</span>
              <div className="flex items-center gap-2">
                <Choice onClick={() => set('exchange_count', Math.max(1, answers.exchange_count - 1))} className="w-11">−</Choice>
                <span className="w-6 text-center font-semibold">{answers.exchange_count}</span>
                <Choice onClick={() => set('exchange_count', Math.min(30, answers.exchange_count + 1))} className="w-11">+</Choice>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-2">Par quel moyen ?</p>
              <div className="grid grid-cols-2 gap-2">
                {CHANNEL_OPTIONS.map((c) => (
                  <Choice key={c.value} selected={answers.exchange_channel.includes(c.value)} onClick={() => toggleChannel(c.value)}>{c.label}</Choice>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-2">Durée approximative (au total)</p>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <Choice key={d} selected={answers.approx_duration_minutes === d} onClick={() => set('approx_duration_minutes', d)}>
                    {formatDuration(d)}
                  </Choice>
                ))}
              </div>
            </div>
          </div>
        )}
      </Block>

      {(context.objectives || []).length > 0 && (
        <Block number={2} title="Où en sont vos objectifs ?">
          {context.objectives.map((o) => (
            <div key={o.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800">{o.title}</p>
                <span className="text-sm font-semibold text-emerald-700 whitespace-nowrap">{answers.progress[o.id] ?? 0} %</span>
              </div>
              <Slider
                min={0} max={100} step={5}
                value={[answers.progress[o.id] ?? 0]}
                onValueChange={([v]) => set('progress', { ...answers.progress, [o.id]: v })}
                aria-label={`Avancement : ${o.title}`}
              />
            </div>
          ))}
        </Block>
      )}

      <Block number={(context.objectives || []).length > 0 ? 3 : 2} title="Comment ça se passe ?">
        <div className="grid grid-cols-3 gap-2">
          {MOOD_OPTIONS.map((m) => (
            <Choice key={m.value} selected={answers.mood === m.value} onClick={() => set('mood', m.value)} className="flex flex-col items-center">
              <span className="text-2xl" aria-hidden="true">{m.emoji}</span>
              <span className="text-xs">{m.label}</span>
            </Choice>
          ))}
        </div>
      </Block>

      <Block number={(context.objectives || []).length > 0 ? 4 : 3} title="Un blocage ou un besoin ? (facultatif)">
        <Textarea
          value={answers.blocker_text}
          onChange={(e) => set('blocker_text', e.target.value.slice(0, 2000))}
          rows={3}
          placeholder="Écris ici si quelque chose bloque ou si tu as besoin d'aide."
        />
      </Block>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-12 text-base bg-emerald-700 hover:bg-emerald-800">
        {status === 'submitting' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Envoyer'}
      </Button>
      {!canSubmit && status === 'ready' && (
        <p className="text-xs text-center text-gray-500">Réponds aux questions 1 et « Comment ça se passe ? » pour envoyer.</p>
      )}

      <p className="text-xs text-gray-400 leading-relaxed pt-2">{CHECKIN_PRIVACY_NOTE}</p>
    </Screen>
  );
}
