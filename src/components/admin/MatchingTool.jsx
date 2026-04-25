import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Link2, Sparkles, CheckCircle2, UserCheck, GraduationCap,
  MapPin, Clock, Loader2, Search, Filter, Users, Zap,
  ChevronRight, Trophy, Medal, Star, Plus, X, Info,
  AlertCircle, Mail, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ══════════════════════════════════════════════════════
//  ALGORITHME DE COMPATIBILITÉ (100 pts max)
// ══════════════════════════════════════════════════════
const calculateScore = (mentor, mentore) => {
  const reasons = [];

  // ① Ville (25 pts)
  let villeScore = 0;
  if (mentor.city && mentore.city) {
    if (mentor.city === mentore.city) { villeScore = 25; reasons.push({ label: 'Même ville', pts: 25, type: 'success' }); }
    else if (mentor.preferred_format === 'virtuel' || mentore.preferred_format === 'virtuel') { villeScore = 10; reasons.push({ label: 'Ville différente (virtuel OK)', pts: 10, type: 'partial' }); }
    else { reasons.push({ label: 'Villes différentes', pts: 0, type: 'warning' }); }
  }

  // ② Disponibilité (25 pts)
  let dispoScore = 0;
  const mAvail = mentor.availability || '';
  const meAvail = mentore.availability || '';
  if (mAvail && meAvail) {
    if (mAvail === meAvail) { dispoScore = 25; reasons.push({ label: 'Disponibilité identique', pts: 25, type: 'success' }); }
    else if (mAvail === 'weekend' || meAvail === 'weekend') { dispoScore = 10; reasons.push({ label: 'Disponibilité partielle', pts: 10, type: 'partial' }); }
    else { dispoScore = 5; reasons.push({ label: 'Disponibilité différente', pts: 5, type: 'partial' }); }
  }

  // ③ Spécialisation (30 pts max)
  const mentorText = ((mentor.specialties || []).join(' ') + ' ' + (mentor.profession || '')).toLowerCase();
  const mentoreText = ((mentore.specialization || '') + ' ' + (mentore.interests || []).join(' ') + ' ' + (mentore.career_goals || []).join(' ')).toLowerCase();
  const keywords = ['affaires', 'public', 'privé', 'prive', 'pénal', 'penal', 'fiscal', 'international', 'travail', 'commercial', 'bancaire', 'numérique', 'numerique', 'humains', 'constitutionnel', 'administratif', 'civil', 'notariat', 'barreau', 'magistrature'];
  const matched = keywords.filter(kw => mentorText.includes(kw) && mentoreText.includes(kw));
  const specScore = Math.min(matched.length * 6, 30);
  if (specScore > 0) reasons.push({ label: `${matched.length} domaine(s) en commun : ${matched.slice(0,3).join(', ')}`, pts: specScore, type: specScore >= 18 ? 'success' : 'partial' });
  else reasons.push({ label: 'Aucune spécialisation commune détectée', pts: 0, type: 'warning' });

  // ④ Format préféré (10 pts)
  let formatScore = 0;
  if (mentor.preferred_format && mentore.preferred_format) {
    if (mentor.preferred_format === mentore.preferred_format) { formatScore = 10; reasons.push({ label: 'Format de travail identique', pts: 10, type: 'success' }); }
    else if (mentor.preferred_format === 'mixte' || mentore.preferred_format === 'mixte') { formatScore = 5; reasons.push({ label: 'Format mixte compatible', pts: 5, type: 'partial' }); }
  }

  // ⑤ Expérience & niveau académique (10 pts)
  let expScore = 0;
  const years = mentor.years_experience || 0;
  const level = mentore.level || '';
  const grade = mentore.average_grade || 0;
  if (years >= 10 && level === 'M2') { expScore = 10; reasons.push({ label: 'Expert ↔ Master 2 – correspondance idéale', pts: 10, type: 'success' }); }
  else if (years >= 7 && (level === 'M1' || level === 'M2')) { expScore = 8; reasons.push({ label: 'Expérience adaptée au niveau master', pts: 8, type: 'success' }); }
  else if (years >= 5 && level === 'L3') { expScore = 6; reasons.push({ label: 'Profil adapté à la licence', pts: 6, type: 'partial' }); }
  else if (years > 0) { expScore = 3; reasons.push({ label: 'Profil globalement compatible', pts: 3, type: 'partial' }); }
  if (grade >= 15) { expScore = Math.min(expScore + 2, 10); reasons.push({ label: `Mention TB (${grade}/20)`, pts: 2, type: 'success' }); }
  else if (grade >= 12) reasons.push({ label: `Bon niveau académique (${grade}/20)`, pts: 0, type: 'info' });

  // ⑥ Bonus priorité Master (M2 et M1 prioritaires pour le Top 3)
  let priorityBonus = 0;
  if (level === 'M2') { priorityBonus = 15; reasons.push({ label: 'Priorité Master 2 (programme)', pts: 15, type: 'success' }); }
  else if (level === 'M1') { priorityBonus = 10; reasons.push({ label: 'Priorité Master 1 (programme)', pts: 10, type: 'success' }); }

  const total = Math.min(villeScore + dispoScore + specScore + formatScore + expScore + priorityBonus, 100);
  return { score: total, reasons, breakdown: { ville: villeScore, dispo: dispoScore, spec: specScore, format: formatScore, exp: expScore } };
};

// ══════════════════════════════════════════════════════
//  ALGORITHME MATCHING AUTO EN LOT (1 mentor = 1 meilleur mentoré non encore assigné)
// ══════════════════════════════════════════════════════
const autoMatchAll = (mentors, mentores) => {
  const availMentores = [...mentores.filter(m => !['matched'].includes(m.status))];
  const usedMentoreIds = new Set();
  const suggestions = [];

  const sorted = [...mentors.filter(m => !['matched'].includes(m.status))].sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));

  for (const mentor of sorted) {
    const candidates = availMentores
      .filter(m => !usedMentoreIds.has(m.id))
      .map(m => ({ ...m, ...calculateScore(mentor, m) }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const best = candidates[0];
      if (best.score >= 20) { // seuil minimal de pertinence
        usedMentoreIds.add(best.id);
        suggestions.push({ mentor, mentore: best, score: best.score, reasons: best.reasons });
      }
    }
  }
  return suggestions;
};

// ══════════════════════════════════════════════════════
//  HELPERS UI
// ══════════════════════════════════════════════════════
const scoreColor = (s) => s >= 70 ? 'text-emerald-600' : s >= 50 ? 'text-amber-600' : 'text-red-500';
const scoreBg   = (s) => s >= 70 ? 'bg-emerald-50 border-emerald-300' : s >= 50 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-200';
const scoreBar  = (s) => s >= 70 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-400';
const CITY_LABELS = { lome: 'Lomé', kara: 'Kara', autre: 'Autre' };
const AVAIL_LABELS = { weekday_morning: 'Matin semaine', weekday_afternoon: 'Après-midi semaine', weekday_evening: 'Soir semaine', weekend: 'Weekend' };
const FORMAT_LABELS = { presentiel: 'Présentiel', virtuel: 'Virtuel', mixte: 'Mixte' };
const LEVEL_COLORS = { L3: 'bg-blue-100 text-blue-800', M1: 'bg-purple-100 text-purple-800', M2: 'bg-indigo-100 text-indigo-800' };
const TOP3_STYLE = [
  { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-300', label: '#1' },
  { icon: Medal,  color: 'text-gray-400',   bg: 'bg-gray-50',   border: 'border-gray-300',   label: '#2' },
  { icon: Star,   color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-300',  label: '#3' },
];
const REASON_COLORS = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  warning: 'bg-red-50 text-red-600 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

// ══════════════════════════════════════════════════════
//  SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════
const ScoreBreakdown = ({ breakdown, reasons }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-5 gap-1 text-center">
      {[
        { label: 'Ville', val: breakdown.ville, max: 25 },
        { label: 'Dispo', val: breakdown.dispo, max: 25 },
        { label: 'Spécia.', val: breakdown.spec, max: 30 },
        { label: 'Format', val: breakdown.format, max: 10 },
        { label: 'Niveau', val: breakdown.exp, max: 10 },
      ].map(c => (
        <div key={c.label} className="bg-gray-50 rounded-lg p-2">
          <p className={`text-sm font-black ${scoreColor(c.val / c.max * 100)}`}>{c.val}</p>
          <p className="text-[10px] text-gray-400">/{c.max}</p>
          <p className="text-[10px] text-gray-600 font-medium">{c.label}</p>
        </div>
      ))}
    </div>
    <div className="space-y-1">
      {reasons.map((r, i) => (
        <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-xs ${REASON_COLORS[r.type] || REASON_COLORS.info}`}>
          <span className="flex-1">{r.label}</span>
          {r.pts > 0 && <span className="font-bold flex-shrink-0">+{r.pts}</span>}
        </div>
      ))}
    </div>
  </div>
);

const MentorCard = ({ mentor, selected, onClick }) => (
  <motion.div whileHover={{ scale: 1.01 }} onClick={onClick}
    className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${selected ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'}`}>
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${selected ? 'bg-emerald-600' : 'bg-gray-400'}`}>
        {mentor.full_name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{mentor.full_name}</p>
        <p className="text-xs text-gray-500 truncate">{mentor.profession}{mentor.organization ? ` · ${mentor.organization}` : ''}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {mentor.city && <Badge variant="outline" className="text-xs px-1.5 py-0"><MapPin className="h-2.5 w-2.5 mr-0.5 inline" />{CITY_LABELS[mentor.city] || mentor.city}</Badge>}
          {mentor.availability && <Badge variant="outline" className="text-xs px-1.5 py-0"><Clock className="h-2.5 w-2.5 mr-0.5 inline" />{AVAIL_LABELS[mentor.availability]?.split(' ')[0]}</Badge>}
          {(mentor.specialties || []).slice(0, 2).map(s => (
            <span key={s} className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
        {mentor.max_mentees > 1 && <p className="text-xs text-emerald-600 mt-1 font-medium">Capacité : {mentor.max_mentees} mentorés</p>}
      </div>
      {selected && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
    </div>
  </motion.div>
);

const MentoreRowCard = ({ mentore, selected, onToggle, score, rank, onDetail }) => (
  <motion.div whileHover={{ scale: 1.005 }}
    className={`rounded-xl border-2 p-3 transition-all flex items-center gap-3 ${selected ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'}`}>
    {rank !== undefined && rank < 3 && (
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${TOP3_STYLE[rank].bg} ${TOP3_STYLE[rank].border} border`}>
        {React.createElement(TOP3_STYLE[rank].icon, { className: `h-4 w-4 ${TOP3_STYLE[rank].color}` })}
      </div>
    )}
    <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
      <div className="flex items-center gap-2">
        <p className="font-semibold text-gray-900 truncate text-sm">{mentore.full_name}</p>
        {mentore.level && <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${LEVEL_COLORS[mentore.level] || 'bg-gray-100'}`}>{mentore.level}</span>}
      </div>
      <p className="text-xs text-gray-500 truncate">{mentore.specialization || ''}</p>
      <div className="flex items-center gap-2 mt-0.5">
        {mentore.city && <span className="text-xs text-gray-400"><MapPin className="h-2.5 w-2.5 inline mr-0.5" />{CITY_LABELS[mentore.city]}</span>}
        {mentore.availability && <span className="text-xs text-gray-400"><Clock className="h-2.5 w-2.5 inline mr-0.5" />{AVAIL_LABELS[mentore.availability]?.split(' ')[0]}</span>}
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      {score !== undefined && (
        <>
          <span className={`text-sm font-black ${scoreColor(score)}`}>{score}%</span>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${scoreBar(score)}`} style={{ width: `${score}%` }} />
          </div>
        </>
      )}
      <div className="flex items-center gap-1 mt-0.5">
        <button onClick={e => { e.stopPropagation(); onDetail(); }}
          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
          <Info className="h-3.5 w-3.5" />
        </button>
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${selected ? 'bg-purple-500 border-purple-500' : 'border-gray-300 hover:border-purple-400'}`}
          onClick={onToggle}>
          {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
        </div>
      </div>
    </div>
  </motion.div>
);

const Top3Card = ({ mentore, score, rank, selected, onToggle, onDetail }) => {
  const style = TOP3_STYLE[rank];
  const IconComp = style.icon;
  return (
    <motion.div whileHover={{ scale: 1.02 }}
      className={`rounded-2xl border-2 p-4 transition-all ${selected ? 'border-purple-500 bg-purple-50 shadow-xl ring-2 ring-purple-300' : `${style.border} ${style.bg} hover:shadow-lg`}`}>
      <div className="flex items-center gap-2 mb-3">
        <IconComp className={`h-5 w-5 ${style.color}`} />
        <span className={`text-xs font-bold ${style.color}`}>TOP {style.label}</span>
        <span className={`ml-auto text-lg font-black ${scoreColor(score)}`}>{score}%</span>
      </div>
      <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={onToggle}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${selected ? 'bg-purple-600' : 'bg-gray-500'}`}>
          {mentore.full_name?.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{mentore.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{mentore.specialization}</p>
        </div>
      </div>
      <div className="w-full bg-white rounded-full h-2 mb-2">
        <div className={`h-2 rounded-full ${scoreBar(score)}`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {mentore.level && <Badge className={`text-xs ${LEVEL_COLORS[mentore.level] || ''}`}>{mentore.level}</Badge>}
        {mentore.city && <Badge variant="outline" className="text-xs"><MapPin className="h-2.5 w-2.5 inline mr-0.5" />{CITY_LABELS[mentore.city]}</Badge>}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onDetail} className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg py-1 hover:bg-blue-50 transition-colors">
          <Info className="h-3.5 w-3.5" /> Détails
        </button>
        <button onClick={onToggle} className={`flex-1 flex items-center justify-center gap-1 text-xs font-semibold rounded-lg py-1 transition-colors ${selected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
          {selected ? <><CheckCircle2 className="h-3.5 w-3.5" /> Sélectionné</> : <><Plus className="h-3.5 w-3.5" /> Choisir</>}
        </button>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
//  PANNEAU DE DÉTAIL COMPATIBILITÉ
// ══════════════════════════════════════════════════════
const CompatibilityPanel = ({ mentor, mentore, onClose, onSelect, selected }) => {
  const { score, reasons, breakdown } = useMemo(() => calculateScore(mentor, mentore), [mentor, mentore]);
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      <div className="bg-[#1e5631] text-white p-4 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="font-bold text-sm">Analyse de compatibilité</p>
          <p className="text-xs text-emerald-200">{mentor.full_name} ↔ {mentore.full_name}</p>
        </div>
        <button onClick={onClose} className="text-emerald-200 hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Score global */}
        <div className={`rounded-xl border-2 p-4 text-center ${scoreBg(score)}`}>
          <p className={`text-5xl font-black ${scoreColor(score)}`}>{score}%</p>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            {score >= 70 ? '🎯 Excellente compatibilité' : score >= 50 ? '✅ Bonne compatibilité' : '⚠️ Compatibilité limitée'}
          </p>
          <div className="w-full bg-white rounded-full h-3 mt-3">
            <div className={`h-3 rounded-full ${scoreBar(score)} transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* Profils */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs font-bold text-emerald-800 mb-1">👨‍💼 Mentor</p>
            <p className="text-xs font-semibold">{mentor.full_name}</p>
            <p className="text-xs text-gray-500">{mentor.profession}</p>
            <p className="text-xs text-gray-500">{mentor.years_experience} ans exp.</p>
            <p className="text-xs text-gray-500">{CITY_LABELS[mentor.city]}</p>
            <p className="text-xs text-gray-500">{FORMAT_LABELS[mentor.preferred_format]}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs font-bold text-purple-800 mb-1">🎓 Mentoré(e)</p>
            <p className="text-xs font-semibold">{mentore.full_name}</p>
            <p className="text-xs text-gray-500">{mentore.level} · {mentore.specialization}</p>
            <p className="text-xs text-gray-500">{CITY_LABELS[mentore.city]}</p>
            <p className="text-xs text-gray-500">{FORMAT_LABELS[mentore.preferred_format]}</p>
            {mentore.average_grade > 0 && <p className="text-xs text-gray-500">Moy: {mentore.average_grade}/20</p>}
          </div>
        </div>

        {/* Détail du score */}
        <div>
          <p className="text-xs font-bold text-gray-700 mb-2">Détail par critère</p>
          <ScoreBreakdown breakdown={breakdown} reasons={reasons} />
        </div>

        {/* Spécialités communes */}
        {mentor.specialties?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Spécialités du mentor</p>
            <div className="flex flex-wrap gap-1">
              {mentor.specialties.map(s => <span key={s} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{s}</span>)}
            </div>
          </div>
        )}
        {mentore.interests?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Intérêts du mentoré</p>
            <div className="flex flex-wrap gap-1">
              {mentore.interests.map(s => <span key={s} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{s}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <Button onClick={onSelect}
          className={`w-full gap-2 ${selected ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#1e5631] hover:bg-[#2d7a47]'}`}>
          {selected ? <><CheckCircle2 className="h-4 w-4" /> Désélectionner</> : <><Plus className="h-4 w-4" /> Sélectionner ce binôme</>}
        </Button>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
//  MODAL MATCHING AUTO
// ══════════════════════════════════════════════════════
const AutoMatchModal = ({ suggestions, onClose, onConfirm, loading }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
      <div className="bg-[#1e5631] text-white p-5 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="font-bold text-lg flex items-center gap-2"><Wand2 className="h-5 w-5" /> Matching automatique</p>
          <p className="text-sm text-emerald-200">{suggestions.length} binôme{suggestions.length > 1 ? 's' : ''} suggéré{suggestions.length > 1 ? 's' : ''} par l'algorithme</p>
        </div>
        <button onClick={onClose}><X className="h-5 w-5 text-emerald-200 hover:text-white" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune suggestion possible (seuil minimal de compatibilité non atteint)</p>
          </div>
        ) : (
          suggestions.map(({ mentor, mentore, score }, i) => (
            <div key={i} className={`rounded-xl border-2 p-4 ${scoreBg(score)}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 font-semibold">Mentor</p>
                    <p className="font-bold text-gray-900 text-sm">{mentor.full_name}</p>
                    <p className="text-xs text-gray-500">{mentor.profession}</p>
                    <div className="flex gap-1 mt-1">
                      {mentor.city && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 rounded">{CITY_LABELS[mentor.city]}</span>}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 font-semibold">Mentoré(e)</p>
                    <p className="font-bold text-gray-900 text-sm">{mentore.full_name}</p>
                    <p className="text-xs text-gray-500">{mentore.level} · {mentore.specialization}</p>
                    <div className="flex gap-1 mt-1">
                      {mentore.city && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 rounded">{CITY_LABELS[mentore.city]}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-center flex-shrink-0 w-16">
                  <p className={`text-2xl font-black ${scoreColor(score)}`}>{score}%</p>
                  <div className="w-full bg-white rounded-full h-2 mt-1">
                    <div className={`h-2 rounded-full ${scoreBar(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">compatibilité</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-[#1e5631] hover:bg-[#2d7a47] gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : <><CheckCircle2 className="h-4 w-4" /> Confirmer {suggestions.length} binôme{suggestions.length > 1 ? 's' : ''}</>}
          </Button>
        </div>
      )}
    </motion.div>
  </motion.div>
);

// ══════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════
export default function MatchingTool({ mentors, mentores }) {
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentoreIds, setSelectedMentoreIds] = useState(new Set());
  const [searchMentor, setSearchMentor] = useState('');
  const [searchMentore, setSearchMentore] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [createdCount, setCreatedCount] = useState(0);
  const [detailPair, setDetailPair] = useState(null); // { mentor, mentore }
  const [autoSuggestions, setAutoSuggestions] = useState(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const queryClient = useQueryClient();

  const createBinomeMutation = useMutation({
    mutationFn: async ({ mentor, mentore, score }) => {
      await base44.entities.Binome.create({
        mentor_id: mentor.id, mentore_id: mentore.id,
        mentor_name: mentor.full_name, mentore_name: mentore.full_name,
        mentor_email: mentor.email || '', mentore_email: mentore.email || '',
        match_date: new Date().toISOString().split('T')[0],
        match_score: score, status: 'active'
      });
      await base44.entities.Mentore.update(mentore.id, { status: 'matched' });
      // Email notification
      if (mentor.email) {
        base44.integrations.Core.SendEmail({
          to: mentor.email,
          subject: '🎉 Votre binôme PASSERELLES est formé !',
          body: `Bonjour ${mentor.full_name},\n\nNous avons le plaisir de vous informer que vous êtes désormais apparié(e) avec ${mentore.full_name} (${mentore.level} – ${mentore.specialization || 'Droit'}).\n\nScore de compatibilité : ${score}%\n\nConnectez-vous à votre espace personnel pour découvrir votre binôme et commencer votre accompagnement.\n\nCordialement,\nL'équipe Ma Belle Promo – Programme PASSERELLES`
        }).catch(() => {});
      }
      if (mentore.email) {
        base44.integrations.Core.SendEmail({
          to: mentore.email,
          subject: '🎉 Votre mentor PASSERELLES est trouvé !',
          body: `Bonjour ${mentore.full_name},\n\nNous avons le plaisir de vous informer que vous êtes désormais apparié(e) avec ${mentor.full_name} (${mentor.profession}${mentor.organization ? ', ' + mentor.organization : ''}).\n\nScore de compatibilité : ${score}%\n\nConnectez-vous à votre espace personnel pour découvrir votre mentor et démarrer cette belle aventure !\n\nCordialement,\nL'équipe Ma Belle Promo – Programme PASSERELLES`
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      // Invalidate ALL query keys used across the app for these entities
      queryClient.invalidateQueries({ queryKey: ['binomes'] });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      queryClient.invalidateQueries({ queryKey: ['mentores'] });
      queryClient.invalidateQueries({ queryKey: ['stats-binomes-home'] });
      queryClient.invalidateQueries({ queryKey: ['stats-mentors'] });
      queryClient.invalidateQueries({ queryKey: ['stats-mentores'] });
      queryClient.invalidateQueries({ queryKey: ['binomes-mon-suivi'] });
    }
  });

  const filteredMentors = useMemo(() =>
    mentors
      .filter(m => filterStatus === 'all' ? ['approved', 'pending'].includes(m.status) : m.status === filterStatus)
      .filter(m => !searchMentor || m.full_name?.toLowerCase().includes(searchMentor.toLowerCase()) || (m.profession || '').toLowerCase().includes(searchMentor.toLowerCase())),
    [mentors, filterStatus, searchMentor]
  );

  const availableMentores = useMemo(() =>
    mentores.filter(m => filterStatus === 'all' ? ['approved', 'pending'].includes(m.status) : m.status === filterStatus),
    [mentores, filterStatus]
  );

  const scoredMentores = useMemo(() => {
    if (!selectedMentor) return [];
    return availableMentores
      .map(m => {
        const { score, reasons, breakdown } = calculateScore(selectedMentor, m);
        return { ...m, _score: score, _reasons: reasons, _breakdown: breakdown };
      })
      .sort((a, b) => b._score - a._score);
  }, [selectedMentor, availableMentores]);

  const top3 = scoredMentores.slice(0, 3);

  const filteredScoredMentores = useMemo(() =>
    scoredMentores.filter(m => !searchMentore || m.full_name?.toLowerCase().includes(searchMentore.toLowerCase()) || (m.specialization || '').toLowerCase().includes(searchMentore.toLowerCase())),
    [scoredMentores, searchMentore]
  );

  const toggleMentore = (id) => {
    setSelectedMentoreIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleSelectMentor = (mentor) => {
    setSelectedMentor(prev => prev?.id === mentor.id ? null : mentor);
    setSelectedMentoreIds(new Set());
    setCreatedCount(0);
    setDetailPair(null);
  };

  const handleCreateBinomes = async () => {
    if (!selectedMentor || selectedMentoreIds.size === 0) return;
    const toCreate = scoredMentores.filter(m => selectedMentoreIds.has(m.id));
    for (const mentore of toCreate) {
      await createBinomeMutation.mutateAsync({ mentor: selectedMentor, mentore, score: mentore._score });
    }
    setCreatedCount(toCreate.length);
    setSelectedMentoreIds(new Set());
    if (toCreate.length >= (selectedMentor.max_mentees || 1)) {
      await base44.entities.Mentor.update(selectedMentor.id, { status: 'matched' });
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      queryClient.invalidateQueries({ queryKey: ['stats-mentors'] });
      setSelectedMentor(null);
    }
  };

  const handleAutoMatch = () => {
    const suggestions = autoMatchAll(mentors, mentores);
    setAutoSuggestions(suggestions);
  };

  const handleConfirmAutoMatch = async () => {
    setAutoLoading(true);
    for (const { mentor, mentore, score } of autoSuggestions) {
      await createBinomeMutation.mutateAsync({ mentor, mentore, score });
    }
    setCreatedCount(autoSuggestions.length);
    setAutoSuggestions(null);
    setAutoLoading(false);
  };

  const unmatched = {
    mentors: mentors.filter(m => !['matched'].includes(m.status)).length,
    mentores: mentores.filter(m => !['matched'].includes(m.status)).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats + Bouton auto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-emerald-700">{unmatched.mentors}</p><p className="text-xs text-gray-500">Mentors disponibles</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-purple-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><GraduationCap className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-purple-700">{unmatched.mentores}</p><p className="text-xs text-gray-500">Mentorés disponibles</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50 col-span-2">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Wand2 className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="font-bold text-amber-900 text-sm">Matching automatique</p>
                <p className="text-xs text-gray-500">L'IA apparie tous les profils en 1 clic</p>
              </div>
            </div>
            <Button onClick={handleAutoMatch} className="bg-amber-500 hover:bg-amber-600 gap-2 flex-shrink-0">
              <Sparkles className="h-4 w-4" /> Lancer
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {[['all', 'Tous'], ['approved', 'Approuvés'], ['pending', 'En attente']].map(([v, l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${filterStatus === v ? 'bg-[#1e5631] text-white border-[#1e5631]' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Succès */}
      <AnimatePresence>
        {createdCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">{createdCount} binôme{createdCount > 1 ? 's' : ''} créé{createdCount > 1 ? 's' : ''} avec succès !</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1"><Mail className="h-3 w-3" /> Emails de notification envoyés aux participants</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout 2 colonnes */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">

        {/* ── Mentors ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-gray-700">① Choisir un Mentor</span>
            <Badge className="bg-emerald-100 text-emerald-700 ml-auto">{filteredMentors.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher un mentor..." className="pl-9 h-9 text-sm" value={searchMentor} onChange={e => setSearchMentor(e.target.value)} />
          </div>
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredMentors.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Aucun mentor trouvé</p>}
            {filteredMentors.map(m => (
              <MentorCard key={m.id} mentor={m} selected={selectedMentor?.id === m.id} onClick={() => handleSelectMentor(m)} />
            ))}
          </div>
        </div>

        {/* ── Mentorés ── */}
        <div className="space-y-4">
          {!selectedMentor ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
              <ChevronRight className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium text-gray-400">Sélectionnez un mentor à gauche</p>
              <p className="text-sm text-gray-300 mt-1">Le Top 3 des mentorés compatibles s'affichera ici</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {selectedMentor.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-emerald-900">{selectedMentor.full_name}</p>
                  <p className="text-xs text-emerald-700">{selectedMentor.profession} · {selectedMentor.years_experience} ans · Capacité : {selectedMentor.max_mentees || 1}</p>
                  <div className="flex gap-1 mt-1">
                    {selectedMentor.city && <Badge variant="outline" className="text-xs px-1.5 py-0">{CITY_LABELS[selectedMentor.city]}</Badge>}
                    {selectedMentor.availability && <Badge variant="outline" className="text-xs px-1.5 py-0">{AVAIL_LABELS[selectedMentor.availability]}</Badge>}
                    {selectedMentor.preferred_format && <Badge variant="outline" className="text-xs px-1.5 py-0">{FORMAT_LABELS[selectedMentor.preferred_format]}</Badge>}
                  </div>
                </div>
                <button onClick={() => setSelectedMentor(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>

              {/* TOP 3 */}
              {top3.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-gray-700">② Top 3 suggestions</span>
                    <span className="text-xs text-gray-400 ml-1">— cliquez Détails pour analyser</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {top3.map((mentore, i) => (
                      <Top3Card key={mentore.id} mentore={mentore} score={mentore._score} rank={i}
                        selected={selectedMentoreIds.has(mentore.id)}
                        onToggle={() => toggleMentore(mentore.id)}
                        onDetail={() => setDetailPair({ mentor: selectedMentor, mentore })} />
                    ))}
                  </div>
                </div>
              )}

              {/* Liste complète */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-gray-700">Tous les mentorés</span>
                  <Badge className="bg-purple-100 text-purple-700 ml-auto">{scoredMentores.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Filtrer les mentorés..." className="pl-9 h-9 text-sm" value={searchMentore} onChange={e => setSearchMentore(e.target.value)} />
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredScoredMentores.map((m) => (
                    <MentoreRowCard key={m.id} mentore={m} score={m._score}
                      rank={scoredMentores.indexOf(m)}
                      selected={selectedMentoreIds.has(m.id)}
                      onToggle={() => toggleMentore(m.id)}
                      onDetail={() => setDetailPair({ mentor: selectedMentor, mentore: m })} />
                  ))}
                </div>
              </div>

              {/* Barre de confirmation */}
              <AnimatePresence>
                {selectedMentoreIds.size > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="sticky bottom-0 bg-white border-2 border-[#1e5631] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1e5631] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {selectedMentoreIds.size}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedMentoreIds.size} mentoré{selectedMentoreIds.size > 1 ? 's' : ''} sélectionné{selectedMentoreIds.size > 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" /> Emails automatiques à la création</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedMentoreIds(new Set())}><X className="h-4 w-4 mr-1" /> Effacer</Button>
                      <Button className="bg-[#1e5631] hover:bg-[#2d7a47] gap-2" disabled={createBinomeMutation.isPending} onClick={handleCreateBinomes}>
                        {createBinomeMutation.isPending
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</>
                          : <><Plus className="h-4 w-4" /> Créer {selectedMentoreIds.size} binôme{selectedMentoreIds.size > 1 ? 's' : ''}</>}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Panneau de détail compatibilité */}
      <AnimatePresence>
        {detailPair && (
          <CompatibilityPanel
            mentor={detailPair.mentor}
            mentore={detailPair.mentore}
            onClose={() => setDetailPair(null)}
            selected={selectedMentoreIds.has(detailPair.mentore.id)}
            onSelect={() => { toggleMentore(detailPair.mentore.id); setDetailPair(null); }}
          />
        )}
      </AnimatePresence>

      {/* Modal matching auto */}
      <AnimatePresence>
        {autoSuggestions && (
          <AutoMatchModal
            suggestions={autoSuggestions}
            onClose={() => setAutoSuggestions(null)}
            onConfirm={handleConfirmAutoMatch}
            loading={autoLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}