// src/components/admin/reportEditing.jsx
// Petits champs d'édition du rapport de bilan (onglet « Rapport »).
// En brouillon, chaque texte est un champ modifiable ; une fois le rapport
// validé, le même composant affiche le texte seul.
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Texte simple (une ligne) ou paragraphe (multiline).
export function Field({ value, onChange, editable, multiline = false, rows = 3, className = '', placeholder }) {
  if (!editable) return value ? <p className={className}>{value}</p> : null;
  return multiline ? (
    <Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="text-sm" />
  ) : (
    <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
  );
}

// Liste déroulante (priorité, état d'un binôme) ; badge en lecture seule.
export function ChoiceField({ value, onChange, editable, labels }) {
  if (!editable) return <Badge variant="outline" className="text-[10px]">{labels[value] || value}</Badge>;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700"
    >
      {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  );
}

export function RemoveButton({ onClick, label = 'Retirer' }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} className="h-7 px-2 text-xs text-gray-500 hover:text-red-600" title={label}>
      <Trash2 className="h-3.5 w-3.5 mr-1" /> {label}
    </Button>
  );
}

// Bouton d'ajout, masqué une fois la limite du format atteinte.
export function AddButton({ onClick, count, max, label }) {
  if (max !== undefined && count >= max) return <p className="text-xs text-gray-400">Limite de {max} éléments atteinte.</p>;
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="h-8 text-xs">
      <Plus className="h-3.5 w-3.5 mr-1" /> {label}
    </Button>
  );
}

// Nettoyage avant enregistrement : espaces superflus retirés, éléments vides
// supprimés, avertissement vide => null (format attendu par le PDF).
export function cleanAnalysis(a) {
  const t = (s) => (typeof s === 'string' ? s.trim() : s);
  const keepText = (list) => (list || []).map(t).filter(Boolean);
  return {
    ...a,
    executive_summary: t(a.executive_summary),
    conclusion: t(a.conclusion),
    sample_warning: t(a.sample_warning) || null,
    key_findings: keepText(a.key_findings),
    key_learnings: keepText(a.key_learnings),
    strengths: (a.strengths || []).map((s) => ({ ...s, title: t(s.title), evidence: t(s.evidence) })).filter((s) => s.title || s.evidence),
    improvements: (a.improvements || []).map((s) => ({ ...s, title: t(s.title), evidence: t(s.evidence) })).filter((s) => s.title || s.evidence),
    recurring_themes: (a.recurring_themes || []).map((r) => ({ ...r, theme: t(r.theme) })).filter((r) => r.theme),
    recommendations: (a.recommendations || []).map((r) => ({ ...r, text: t(r.text), owner: t(r.owner) })).filter((r) => r.text),
    pair_status: (a.pair_status || []).map((p) => ({ ...p, basis: t(p.basis) })),
    pairs_to_watch: (a.pairs_to_watch || []).map((p) => ({ ...p, reason: t(p.reason) })),
  };
}
