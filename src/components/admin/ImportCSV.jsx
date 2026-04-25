import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';

// ─── PARSER CSV universel (virgule, point-virgule, tabulation) ───
const parseCSV = (text) => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmpty = lines.filter(l => l.trim());
  if (nonEmpty.length < 2) return null;

  // Détecter le séparateur
  const firstLine = nonEmpty[0];
  const sep = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const tokenize = (line) => {
    const tokens = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === sep && !inQ) {
        tokens.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    tokens.push(cur.trim());
    return tokens;
  };

  // Trouver la ligne d'en-tête : la première ligne qui a un email ou "nom" dans ses colonnes
  // ou simplement la première ligne non vide
  let headerIdx = 0;
  for (let i = 0; i < Math.min(10, nonEmpty.length); i++) {
    const cols = tokenize(nonEmpty[i]);
    const joined = cols.join(' ').toLowerCase();
    if (joined.includes('nom') || joined.includes('name') || joined.includes('email') || joined.includes('prenom')) {
      headerIdx = i;
      break;
    }
  }

  const headers = tokenize(nonEmpty[headerIdx]).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = [];

  for (let i = headerIdx + 1; i < nonEmpty.length; i++) {
    const line = nonEmpty[i].trim();
    if (!line) continue;
    const tokens = tokenize(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = tokens[idx] !== undefined ? tokens[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(obj);
  }

  return { headers, rows: rows.filter(r => Object.values(r).some(v => v)) };
};

// ─── AUTO-MAPPING flexible ───
const norm = (s) => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

const MENTORE_MAP = [
  { key: 'full_name',       label: 'Nom complet',           keywords: ['nom complet', 'nom', 'name', 'prenom nom', 'full name'] },
  { key: 'email',           label: 'Email',                  keywords: ['email', 'e-mail', 'adresse mail', 'courriel'] },
  { key: 'phone',           label: 'Téléphone',              keywords: ['telephone', 'phone', 'tel', 'contact'] },
  { key: 'sexe',            label: 'Genre',                  keywords: ['genre', 'sexe', 'gender'] },
  { key: 'university',      label: 'Université',             keywords: ['universite', 'university', 'etablissement', 'institution'] },
  { key: 'level',           label: 'Niveau',                 keywords: ['niveau', 'level', 'annee', 'year'] },
  { key: 'specialization',  label: 'Spécialisation',         keywords: ['specialisation', 'specialite', 'specialization', 'filiere', 'branche'] },
  { key: 'average_grade',   label: 'Moyenne /20',            keywords: ['moyenne', 'grade', 'note', 'gpa'] },
  { key: 'career_goals',    label: 'Objectifs de carrière',  keywords: ['objectif', 'carriere', 'career', 'metier', 'profession visee'] },
  { key: 'interests',       label: "Domaines d'intérêt",     keywords: ['interet', 'domaine', 'interest', 'leadership'] },
  { key: 'civic_engagement',label: 'Activités citoyennes',   keywords: ['associatif', 'citoyen', 'civic', 'benevolat', 'engagement', 'associatives'] },
  { key: 'motivation_letter',label: 'Lettre de motivation',  keywords: ['motivation', 'lettre', 'letter', 'pourquoi'] },
  { key: 'availability',    label: 'Disponibilité',          keywords: ['disponibilite', 'creneau', 'availability', 'horaire'] },
  { key: 'preferred_format',label: 'Format préféré',         keywords: ['format', 'presentiel', 'visio', 'mode'] },
  { key: 'city',            label: 'Ville',                  keywords: ['ville', 'city', 'localite', 'localisation'] },
  { key: 'selection_score', label: 'Score (/100)',           keywords: ['score', 'total', 'points', 'evaluation'] },
];

const MENTOR_MAP = [
  { key: 'full_name',       label: 'Nom complet',           keywords: ['nom complet', 'nom', 'name', 'prenom nom', 'full name'] },
  { key: 'email',           label: 'Email',                  keywords: ['email', 'e-mail', 'adresse mail', 'courriel'] },
  { key: 'phone',           label: 'Téléphone',              keywords: ['telephone', 'phone', 'tel', 'contact'] },
  { key: 'sexe',            label: 'Genre',                  keywords: ['genre', 'sexe', 'gender'] },
  { key: 'profession',      label: 'Profession',             keywords: ['profession', 'metier', 'poste', 'fonction', 'job'] },
  { key: 'organization',    label: 'Organisation',           keywords: ['organisation', 'cabinet', 'entreprise', 'structure', 'employeur', 'organization'] },
  { key: 'years_experience',label: "Années d'expérience",   keywords: ['experience', 'annees', 'years', 'anciennete'] },
  { key: 'specialties',     label: 'Spécialités',            keywords: ['specialite', 'specialites', 'domaine', 'specialty'] },
  { key: 'motivation',      label: 'Motivation',             keywords: ['motivation', 'pourquoi', 'raison'] },
  { key: 'availability',    label: 'Disponibilité',          keywords: ['disponibilite', 'creneau', 'availability', 'horaire'] },
  { key: 'preferred_format',label: 'Format préféré',         keywords: ['format', 'presentiel', 'visio', 'mode'] },
  { key: 'city',            label: 'Ville',                  keywords: ['ville', 'city', 'localite'] },
  { key: 'max_mentees',     label: 'Nb max mentorés',        keywords: ['max', 'mentores', 'capacite', 'nombre'] },
  { key: 'linkedin_url',    label: 'LinkedIn',               keywords: ['linkedin', 'profil', 'url', 'lien'] },
];

const autoMap = (headers, fieldMap) => {
  const mapping = {};
  const usedHeaders = new Set();
  fieldMap.forEach(({ key, keywords }) => {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const n = norm(header);
      if (keywords.some(kw => n.includes(kw) || kw.includes(n.slice(0, 6)))) {
        mapping[key] = header;
        usedHeaders.add(header);
        break;
      }
    }
  });
  return mapping;
};

// ─── NORMALISATION ───
const normalizeLevel = (v) => {
  if (!v) return '';
  const s = v.toLowerCase();
  if (s.includes('master 2') || s.includes('m2')) return 'M2';
  if (s.includes('master 1') || s.includes('m1')) return 'M1';
  if (s.includes('licence') || s.includes('l3') || s.includes('license')) return 'L3';
  return v;
};
const normalizeUniversity = (v) => {
  if (!v) return 'etablissement_prive';
  const s = v.toLowerCase();
  if (s.includes('lome') || s.includes('lomé')) return 'universite_lome';
  if (s.includes('kara')) return 'universite_kara';
  return 'etablissement_prive';
};
const toArray = (v) => v ? v.split(/[;|,]/).map(s => s.trim()).filter(Boolean) : [];
const toNum = (v) => { const n = parseFloat((v || '').replace(',', '.')); return isNaN(n) ? null : n; };

const buildRecord = (row, mapping, type) => {
  const get = (key) => (row[mapping[key]] || '').trim();
  const base = { status: 'pending', charter_accepted: true };

  if (type === 'mentore') {
    return {
      ...base,
      full_name: get('full_name'),
      email: get('email'),
      phone: get('phone'),
      sexe: get('sexe'),
      university: normalizeUniversity(get('university')),
      university_other: get('university'),
      level: normalizeLevel(get('level')),
      specialization: get('specialization'),
      average_grade: toNum(get('average_grade')),
      career_goals: toArray(get('career_goals')),
      interests: toArray(get('interests')),
      civic_engagement: get('civic_engagement'),
      motivation_letter: get('motivation_letter'),
      availability: get('availability'),
      preferred_format: get('preferred_format'),
      city: get('city'),
      selection_score: toNum(get('selection_score')),
    };
  } else {
    return {
      ...base,
      full_name: get('full_name'),
      email: get('email'),
      phone: get('phone'),
      sexe: get('sexe'),
      profession: get('profession'),
      organization: get('organization'),
      years_experience: parseInt(get('years_experience')) || 0,
      specialties: toArray(get('specialties')),
      motivation: get('motivation'),
      availability: get('availability'),
      preferred_format: get('preferred_format'),
      city: get('city'),
      max_mentees: parseInt(get('max_mentees')) || 1,
      linkedin_url: get('linkedin_url'),
    };
  }
};

// ─── COMPOSANT PRINCIPAL ───
export default function ImportCSV() {
  const [type, setType] = useState('mentore');
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = React.useRef();

  const fieldMap = type === 'mentore' ? MENTORE_MAP : MENTOR_MAP;

  const reset = () => {
    setParsed(null); setMapping({}); setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null); setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = parseCSV(ev.target.result);
      if (!data || data.rows.length === 0) {
        setError('Aucune donnée trouvée. Vérifiez que le fichier est bien un CSV valide.');
        return;
      }
      setParsed(data);
      setMapping(autoMap(data.headers, fieldMap));
    };
    reader.onerror = () => setError('Erreur de lecture du fichier.');
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    let success = 0, skipped = 0, duplicates = 0;
    const entity = type === 'mentore' ? base44.entities.Mentore : base44.entities.Mentor;

    // Récupérer les emails existants pour éviter les doublons
    const existing = await entity.list();
    const existingEmails = new Set(existing.map(r => r.email?.toLowerCase()).filter(Boolean));

    for (const row of parsed.rows) {
      const record = buildRecord(row, mapping, type);
      if (!record.full_name || !record.email) { skipped++; continue; }
      if (existingEmails.has(record.email.toLowerCase())) { duplicates++; continue; }
      await entity.create(record);
      existingEmails.add(record.email.toLowerCase());
      success++;
    }
    setResult({ success, skipped, duplicates });
    setImporting(false);
    setParsed(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const canImport = parsed && mapping.full_name && mapping.email;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Type selector */}
      <div className="flex gap-3">
        {['mentore', 'mentor'].map(t => (
          <button key={t} onClick={() => { setType(t); reset(); }}
            className={`px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
              type === t ? 'border-[#1e5631] bg-[#1e5631] text-white' : 'border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}>
            {t === 'mentor' ? '👨‍💼 Mentors' : '🎓 Mentorés'}
          </button>
        ))}
      </div>

      {/* Zone de dépôt */}
      <label className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center cursor-pointer hover:border-[#1e5631] hover:bg-emerald-50 transition-colors">
        <Upload className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm font-semibold text-gray-700">Cliquez pour sélectionner votre fichier CSV</p>
        <p className="text-xs text-gray-400 mt-1">Tout CSV standard — virgule, point-virgule ou tabulation</p>
        <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,.xlsx" onChange={handleFile} className="hidden" />
      </label>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Aperçu + mapping automatique */}
      {parsed && !result && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                <span className="text-emerald-700 font-bold">{parsed.rows.length} ligne{parsed.rows.length > 1 ? 's' : ''}</span> détectée{parsed.rows.length > 1 ? 's' : ''}
              </CardTitle>
              <button onClick={reset} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <CardDescription>Colonnes reconnues automatiquement :</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Colonnes mappées */}
            <div className="flex flex-wrap gap-2">
              {fieldMap.map(({ key, label }) => {
                const col = mapping[key];
                return col ? (
                  <span key={key} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> {label}
                  </span>
                ) : null;
              })}
              {fieldMap.filter(f => !mapping[f.key]).map(({ key, label }) => (
                <span key={key} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                  {label}
                </span>
              ))}
            </div>

            {/* Aperçu des 3 premières lignes */}
            <div className="overflow-x-auto rounded-lg border text-xs">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {parsed.headers.slice(0, 6).map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 truncate max-w-[100px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsed.rows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {parsed.headers.slice(0, 6).map(h => (
                        <td key={h} className="px-3 py-1.5 text-gray-600 truncate max-w-[100px]">{row[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!canImport && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Les colonnes <strong>Nom</strong> et <strong>Email</strong> n'ont pas été reconnues. Vérifiez que votre CSV a bien des en-têtes.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={reset}>Annuler</Button>
              <Button onClick={handleImport} disabled={importing || !canImport}
                className="bg-[#1e5631] hover:bg-[#2d7a47] text-white gap-2">
                {importing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Import en cours...</>
                  : <><Upload className="h-4 w-4" /> Importer {parsed.rows.length} {type === 'mentor' ? 'mentor' : 'mentoré'}{parsed.rows.length > 1 ? 's' : ''}</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultat */}
      {result && (
        <Card className="border-2 border-emerald-300 bg-emerald-50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-bold text-lg text-gray-900">Import terminé !</p>
                <div className="flex flex-wrap gap-4 mt-1 text-sm">
                  <span className="text-emerald-700 font-semibold">{result.success} importé{result.success > 1 ? 's' : ''}</span>
                  {result.duplicates > 0 && <span className="text-amber-600">{result.duplicates} doublon{result.duplicates > 1 ? 's' : ''} ignoré{result.duplicates > 1 ? 's' : ''}</span>}
                  {result.skipped > 0 && <span className="text-gray-500">{result.skipped} ligne{result.skipped > 1 ? 's' : ''} sans nom/email</span>}
                </div>
              </div>
            </div>
            <Button onClick={reset} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Nouvel import
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
