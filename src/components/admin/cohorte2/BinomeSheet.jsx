// Fiche binôme : objectifs (en cours et historiques, avec leurs
// remplacements), courbe d'avancement mentor / mentoré par objectif,
// historique des check-ins, journal de coordination et ajout rapide.
import React, { useState } from 'react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink } from 'lucide-react';
import { coordinationApi, errorText, firstNameOf, periodLabel } from '@/lib/cohort2Data';
import { computeAlert, ALERT_STYLE } from '@/lib/cohort2Alerts';
import {
  ROLE_LABEL, CHANNEL_LABEL, MOOD_EMOJI, OBJECTIVE_STATUS_LABEL, EVENT_TYPE_OPTIONS, EVENT_TYPE_LABEL,
} from '@/config/coordinationRules';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const SERIES = [
  { key: 'mentor', label: 'Mentor', color: '#1a7a45' },
  { key: 'mentore', label: 'Mentoré(e)', color: '#7c3aed' },
  { key: 'coordinator', label: 'Coordination', color: '#6b7280' },
];

// Courbe d'avancement d'un objectif : une ligne par déclarant.
function ProgressChart({ rows }) {
  if (rows.length === 0) return <p className="text-xs text-gray-400">Aucun avancement déclaré pour l'instant.</p>;
  // Une ligne de données par déclaration (date), avec la valeur du déclarant.
  const points = rows.map((p) => ({ date: fmtDate(p.created_at), [p.declared_by]: p.progress_pct }));
  const present = SERIES.filter((s) => rows.some((p) => p.declared_by === s.key));
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit=" %" />
          <Tooltip formatter={(v) => `${v} %`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {present.map((s) => (
            <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} connectNulls dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Formulaire d'objectif (création ou ajustement).
function ObjectiveForm({ initial = {}, withReason = false, onSubmit, onCancel, submitLabel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [criteria, setCriteria] = useState(initial.success_criteria || '');
  const [dueDate, setDueDate] = useState(initial.due_date || '');
  const [reason, setReason] = useState('');
  const valid = title.trim() && (!withReason || reason.trim());
  return (
    <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Objectif (spécifique, réaliste)" />
      <Input value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Critère de réussite (mesurable)" />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        Échéance <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-44" />
      </label>
      {withReason && <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison de l'ajustement (obligatoire)" />}
      <div className="flex gap-2">
        <Button size="sm" disabled={!valid} onClick={() => onSubmit({ title: title.trim(), criteria, dueDate, reason: reason.trim() })}>{submitLabel}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

function ObjectiveCard({ objective, data, refresh }) {
  const [mode, setMode] = useState(null); // 'adjust' | 'achieved' | 'abandoned' | 'progress'
  const [reason, setReason] = useState('');
  const [pct, setPct] = useState(0);
  const rows = data.progress.filter((p) => p.objective_id === objective.id);
  const replaced = data.objectives.find((o) => o.id === objective.replaces_objective_id);
  const active = objective.status === 'in_progress';

  const run = async (action, success) => {
    try {
      await action();
      toast.success(success);
      setMode(null);
      setReason('');
      refresh();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${active ? 'border-gray-100 bg-white' : 'border-dashed border-gray-200 bg-gray-50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800">{objective.title}</p>
          <p className="text-xs text-gray-500">
            {objective.success_criteria && <>Critère : {objective.success_criteria} · </>}
            Échéance : {fmtDate(objective.due_date)} · {OBJECTIVE_STATUS_LABEL[objective.status]}
          </p>
          {replaced && <p className="text-xs text-gray-500">Remplace : « {replaced.title} »</p>}
          {objective.status_reason && <p className="text-xs text-gray-500">Raison : {objective.status_reason}</p>}
        </div>
        {active && (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" onClick={() => setMode('progress')}>Avancement</Button>
            <Button size="sm" variant="outline" onClick={() => setMode('adjust')}>Ajuster</Button>
            <Button size="sm" variant="outline" onClick={() => setMode('achieved')}>Atteint</Button>
            <Button size="sm" variant="outline" onClick={() => setMode('abandoned')}>Abandonné</Button>
          </div>
        )}
      </div>

      {mode === 'adjust' && (
        <ObjectiveForm
          initial={objective} withReason submitLabel="Créer l'objectif ajusté" onCancel={() => setMode(null)}
          onSubmit={(f) => run(() => coordinationApi.adjustObjective(objective.id, f.title, f.criteria, f.dueDate, f.reason), 'Objectif ajusté.')}
        />
      )}
      {(mode === 'achieved' || mode === 'abandoned') && (
        <div className="flex flex-wrap gap-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison (obligatoire)" className="flex-1 min-w-[12rem]" />
          <Button size="sm" disabled={!reason.trim()}
            onClick={() => run(() => coordinationApi.closeObjective(objective.id, mode, reason.trim()), 'Objectif mis à jour.')}>
            Marquer {mode === 'achieved' ? 'atteint' : 'abandonné'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(null)}>Annuler</Button>
        </div>
      )}
      {mode === 'progress' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">Avancement constaté par la coordination</span>
          <Input type="number" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-24" />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Commentaire (facultatif)" className="flex-1 min-w-[12rem]" />
          <Button size="sm" onClick={() => run(() => coordinationApi.declareProgress(objective.id, pct, reason), 'Avancement enregistré.')}>Enregistrer</Button>
          <Button size="sm" variant="ghost" onClick={() => setMode(null)}>Annuler</Button>
        </div>
      )}

      <ProgressChart rows={rows} />
    </div>
  );
}

function LogForm({ binomeId, refresh }) {
  const [eventType, setEventType] = useState('reminder');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState('');
  const submit = async () => {
    try {
      await coordinationApi.addLogEntry(binomeId, eventDate, eventType, summary.trim());
      toast.success('Ligne ajoutée au journal.');
      setSummary('');
      refresh();
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  return (
    <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="flex flex-wrap gap-2">
        <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
          {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-44" />
      </div>
      <Textarea value={summary} onChange={(e) => setSummary(e.target.value.slice(0, 500))} rows={2} placeholder="Une ou deux phrases factuelles." />
      <Button size="sm" disabled={!summary.trim()} onClick={submit}>Ajouter au journal</Button>
    </div>
  );
}

export default function BinomeSheet({ data, period, refresh, binomeId, onSelect }) {
  const [creating, setCreating] = useState(false);
  const binome = data.binomes.find((b) => b.id === binomeId) || null;

  const selector = (
    <select value={binomeId || ''} onChange={(e) => onSelect(e.target.value || null)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
      <option value="">Choisir un binôme…</option>
      {data.binomes.map((b) => (
        <option key={b.id} value={b.id}>{firstNameOf(b.mentor_name)} / {firstNameOf(b.mentore_name)}{b.is_test ? ' (test)' : ''}</option>
      ))}
    </select>
  );

  if (!binome) return <div className="p-4 space-y-2">{selector}<p className="text-sm text-gray-500">Choisissez un binôme pour afficher sa fiche.</p></div>;

  const objectives = data.objectives.filter((o) => o.binome_id === binome.id);
  const activeObjectives = objectives.filter((o) => o.status === 'in_progress');
  const pastObjectives = objectives.filter((o) => o.status !== 'in_progress');
  const checkins = data.checkins.filter((c) => c.binome_id === binome.id).sort((a, b) => b.period.localeCompare(a.period));
  const log = data.log.filter((l) => l.binome_id === binome.id);
  const links = data.links.filter((l) => l.binome_id === binome.id && !l.revoked_at);
  const alert = computeAlert(data, binome, period);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          {selector}
          <p className="text-sm text-gray-700">{binome.mentor_name} (mentor) · {binome.mentore_name} (mentoré·e)</p>
          <p className="text-xs text-gray-500">Démarrage : {fmtDate(binome.match_date)} · {binome.checkin_enabled || binome.is_test ? 'check-in activé' : 'check-in non activé'}</p>
        </div>
        <div className="text-right space-y-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ALERT_STYLE[alert.level].className}`}>{ALERT_STYLE[alert.level].label} · {periodLabel(period)}</span>
          {alert.reasons.map((r, i) => <p key={i} className="text-xs text-gray-600">{r}</p>)}
        </div>
      </div>

      {/* Saisie par le coordinateur : ouvre la page de check-in en mode coordination. */}
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.id} href={`/m/${l.token}?saisie=coordinateur`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <ExternalLink className="h-4 w-4" /> Saisir la réponse WhatsApp du {ROLE_LABEL[l.role].toLowerCase()}
          </a>
        ))}
        {links.length === 0 && <p className="text-xs text-gray-500">Aucun lien actif : générez-les dans l'onglet « Liens ».</p>}
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Objectifs en cours ({activeObjectives.length}/3)</h3>
          {activeObjectives.length < 3 && !creating && <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Ajouter un objectif</Button>}
        </div>
        {creating && (
          <ObjectiveForm
            submitLabel="Créer l'objectif" onCancel={() => setCreating(false)}
            onSubmit={async (f) => {
              try {
                await coordinationApi.createObjective(binome.id, f.title, f.criteria, f.dueDate);
                toast.success('Objectif créé.');
                setCreating(false);
                refresh();
              } catch (err) {
                toast.error(errorText(err));
              }
            }}
          />
        )}
        {activeObjectives.map((o) => <ObjectiveCard key={o.id} objective={o} data={data} refresh={refresh} />)}
        {activeObjectives.length === 0 && !creating && <p className="text-sm text-gray-500">Aucun objectif en cours.</p>}
        {pastObjectives.length > 0 && (
          <details className="pt-2">
            <summary className="cursor-pointer text-sm text-gray-600">Objectifs historiques ({pastObjectives.length})</summary>
            <div className="space-y-2 pt-2">{pastObjectives.map((o) => <ObjectiveCard key={o.id} objective={o} data={data} refresh={refresh} />)}</div>
          </details>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800">Historique des check-ins</h3>
        {checkins.length === 0 ? <p className="text-sm text-gray-500">Aucun check-in reçu.</p> : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="p-2">Mois</th><th className="p-2">Rôle</th><th className="p-2">Échanges</th>
                  <th className="p-2">Humeur</th><th className="p-2">Blocage ou besoin</th><th className="p-2">Saisie</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 align-top">
                    <td className="p-2 whitespace-nowrap">{periodLabel(c.period)}</td>
                    <td className="p-2">{ROLE_LABEL[c.role]}</td>
                    <td className="p-2">
                      {c.had_exchange
                        ? `Oui · ${c.exchange_count ?? '?'} fois · ${(c.exchange_channel || []).map((x) => CHANNEL_LABEL[x]).join(', ') || '—'}${c.approx_duration_minutes ? ` · ${c.approx_duration_minutes} min` : ''}`
                        : 'Non'}
                    </td>
                    <td className="p-2">{MOOD_EMOJI[c.mood] || '—'}</td>
                    <td className="p-2 text-xs text-gray-600 max-w-xs">{c.blocker_text || '—'}</td>
                    <td className="p-2 text-xs text-gray-500">{c.entered_by === 'coordinator' ? 'Coordination' : 'Participant'} · {fmtDate(c.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800">Journal de coordination</h3>
        <LogForm binomeId={binome.id} refresh={refresh} />
        {log.length === 0 ? <p className="text-sm text-gray-500">Aucune action enregistrée.</p> : (
          <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100 bg-white">
            {log.map((l) => (
              <li key={l.id} className="p-3 text-sm">
                <span className="text-xs text-gray-500">{fmtDate(l.event_date)} · {EVENT_TYPE_LABEL[l.event_type]} · {l.created_by}</span>
                <p className="text-gray-800">{l.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
