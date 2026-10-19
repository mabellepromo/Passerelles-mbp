import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { getQuestionsForRole, interpolateLabel, REVIEW_SECTIONS } from '@/config/reviewQuestions';

const LIKERT_LABELS = ['1 - Pas du tout', '2 - Un peu', '3 - Moyennement', '4 - Beaucoup', '5 - Totalement'];

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
  </div>
);

const ERROR_MESSAGES = {
  invalid_token: 'Ce lien de bilan n\'est pas valide. Vérifie que tu as copié le lien complet, ou contacte la coordination du programme.',
  token_already_used: 'Tu as déjà répondu à ce bilan. Merci pour ta participation ! Si tu penses qu\'il s\'agit d\'une erreur, contacte la coordination.',
  default: 'Une erreur est survenue. Réessaie dans quelques instants ou contacte la coordination du programme.',
};

function parseSupabaseErrorCode(error) {
  if (!error) return 'default';
  const message = error.message || '';
  if (message.includes('invalid_token')) return 'invalid_token';
  if (message.includes('token_already_used')) return 'token_already_used';
  return 'default';
}

function getDraftKey(token) {
  return `bilan_draft_${token}`;
}

function loadDraft(token) {
  try {
    const raw = localStorage.getItem(getDraftKey(token));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft(token, answers) {
  try {
    localStorage.setItem(getDraftKey(token), JSON.stringify(answers));
  } catch {
    // stockage indisponible (navigation privée, quota) : on continue sans persister
  }
}

function clearDraft(token) {
  try {
    localStorage.removeItem(getDraftKey(token));
  } catch {
    // ignorer
  }
}

export default function Bilan() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | error | ready | submitting | done
  const [errorCode, setErrorCode] = useState('default');
  const [context, setContext] = useState(null); // { first_name, last_name, role, pair_first_name }
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data, error } = await supabase.rpc('get_review_context', { p_token: token });
      if (!isMounted) return;
      if (error || !data || data.length === 0) {
        setErrorCode(parseSupabaseErrorCode(error));
        setStatus('error');
        return;
      }
      const ctx = data[0];
      setContext(ctx);
      // Le brouillon enregistré côté serveur (autre appareil) prime sur celui du
      // navigateur local ; on fusionne pour ne jamais perdre de réponses locales
      // plus récentes que le dernier autosave serveur.
      const localDraft = loadDraft(token);
      setAnswers({ ...(ctx.draft_answers || {}), ...localDraft });
      setStatus('ready');
    })();
    return () => { isMounted = false; };
  }, [token]);

  // Sauvegarde serveur du brouillon, avec un court délai pour éviter un appel
  // réseau à chaque frappe (permet de reprendre le formulaire sur un autre appareil).
  useEffect(() => {
    if (status !== 'ready' || Object.keys(answers).length === 0) return;
    const timer = setTimeout(() => {
      supabase.rpc('save_review_draft', { p_token: token, p_answers: answers }).then(({ error }) => {
        if (error) console.error('save_review_draft error:', error);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, status, token]);

  const questions = useMemo(() => (context ? getQuestionsForRole(context.role) : []), [context]);

  const sections = useMemo(() => {
    const present = new Set(questions.map((q) => q.section));
    return REVIEW_SECTIONS.filter((s) => present.has(s));
  }, [questions]);

  const currentSection = sections[stepIndex];
  const currentQuestions = questions.filter((q) => q.section === currentSection);

  const setAnswer = useCallback((id, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      saveDraft(token, next);
      return next;
    });
  }, [token]);

  const toggleMultiSelectOption = useCallback((id, option) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? prev[id] : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      const updated = { ...prev, [id]: next };
      saveDraft(token, updated);
      return updated;
    });
  }, [token]);

  const isStepValid = currentQuestions.every((q) => {
    if (!q.required) return true;
    const value = answers[q.id];
    if (q.type === 'multi-select') return Array.isArray(value) && value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });

  const goNext = () => {
    if (!isStepValid) {
      toast.error('Merci de répondre aux questions obligatoires avant de continuer.');
      return;
    }
    setStepIndex((i) => Math.min(i + 1, sections.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async () => {
    if (!isStepValid) {
      toast.error('Merci de répondre aux questions obligatoires avant d\'envoyer.');
      return;
    }
    setStatus('submitting');
    const { quote_consent, nps, ...otherAnswers } = answers;
    const { error } = await supabase.rpc('submit_review', {
      p_token: token,
      p_answers: otherAnswers,
      p_nps_score: typeof nps === 'number' ? nps : Number(nps),
      p_quote_consent: quote_consent || 'none',
    });
    if (error) {
      setErrorCode(parseSupabaseErrorCode(error));
      setStatus(parseSupabaseErrorCode(error) === 'default' ? 'ready' : 'error');
      toast.error('L\'envoi a échoué. Réessaie dans quelques instants.');
      return;
    }
    clearDraft(token);
    setStatus('done');
  };

  if (status === 'loading') return <PageLoader />;

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: '#fef2f2' }}>
            <AlertTriangle className="h-8 w-8" style={{ color: '#dc2626' }} />
          </div>
          <h2 className="text-2xl font-bold font-playfair text-gray-900 mb-3">Lien indisponible</h2>
          <p className="text-gray-500 text-sm">{ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default}</p>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold font-playfair text-gray-900 mb-3">Merci {context?.first_name} !</h2>
          <p className="text-gray-500 text-sm">
            Ton bilan a bien été enregistré. La coordination du programme PASSERELLES va l'analyser avec attention.
          </p>
        </div>
      </div>
    );
  }

  const progressPct = ((stepIndex + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-playfair text-gray-900">
            Bonjour {context?.first_name}, bilan PASSERELLES
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tes réponses sont nominatives et lues uniquement par la coordination du programme. Durée estimée : 10-12 minutes.
          </p>
          <Progress value={progressPct} className="mt-4" />
          <p className="text-xs text-gray-400 mt-1">Étape {stepIndex + 1} / {sections.length} — {currentSection}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentSection}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={answers[q.id]}
                pairFirstName={context?.pair_first_name}
                onChange={(val) => setAnswer(q.id, val)}
                onToggleOption={(opt) => toggleMultiSelectOption(q.id, opt)}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Précédent
          </Button>
          {stepIndex < sections.length - 1 ? (
            <Button onClick={goNext}>
              Suivant <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={status === 'submitting'}>
              {status === 'submitting' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Envoyer mon bilan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionField({ question, value, pairFirstName, onChange, onToggleOption }) {
  const label = interpolateLabel(question.label, pairFirstName);

  return (
    <div>
      <Label htmlFor={question.id} className="text-sm font-medium text-gray-800">
        {label}{question.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {question.type === 'likert' && (
        <RadioGroup
          value={value != null ? String(value) : ''}
          onValueChange={(v) => onChange(Number(v))}
          className="mt-3 space-y-2"
        >
          {LIKERT_LABELS.map((text, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <RadioGroupItem value={String(idx + 1)} id={`${question.id}-${idx + 1}`} />
              <Label htmlFor={`${question.id}-${idx + 1}`} className="font-normal text-sm text-gray-600">{text}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === 'nps' && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={label}>
          {Array.from({ length: 11 }, (_, n) => n).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={value === n}
              onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                value === n ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {question.type === 'select' && (
        <RadioGroup
          value={value != null ? String(typeof value === 'object' ? value.value : value) : ''}
          onValueChange={onChange}
          className="mt-3 space-y-2"
        >
          {question.options.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <div key={optValue} className="flex items-center gap-2">
                <RadioGroupItem value={optValue} id={`${question.id}-${optValue}`} />
                <Label htmlFor={`${question.id}-${optValue}`} className="font-normal text-sm text-gray-600">{optLabel}</Label>
              </div>
            );
          })}
        </RadioGroup>
      )}

      {question.type === 'multi-select' && (
        <div className="mt-3 space-y-2">
          {question.options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                id={`${question.id}-${opt}`}
                checked={Array.isArray(value) && value.includes(opt)}
                onCheckedChange={() => onToggleOption(opt)}
              />
              <Label htmlFor={`${question.id}-${opt}`} className="font-normal text-sm text-gray-600">{opt}</Label>
            </div>
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <Textarea
          id={question.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3"
          rows={3}
        />
      )}
    </div>
  );
}
