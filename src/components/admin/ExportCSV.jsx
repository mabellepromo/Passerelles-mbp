import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Download, Loader2, CheckCircle2 } from 'lucide-react';

const toCSV = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join(' | ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(headers.map(h => escape(row[h])).join(',')));
  return lines.join('\n');
};

const downloadCSV = (content, filename) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const EXPORTS = [
  {
    key: 'mentors',
    label: 'Candidatures Mentors',
    icon: '👨‍💼',
    description: 'Toutes les candidatures mentors avec statuts et évaluations',
    fetch: () => base44.entities.Mentor.list('-created_date', 500),
    filename: 'passerelles_mentors',
    fields: ['full_name','email','phone','profession','organization','years_experience','specialties','city','availability','preferred_format','status','max_mentees','charter_accepted','created_date'],
  },
  {
    key: 'mentores',
    label: 'Candidatures Mentorés',
    icon: '🎓',
    description: 'Toutes les candidatures mentorés avec scores et évaluations IA',
    fetch: () => base44.entities.Mentore.list('-created_date', 500),
    filename: 'passerelles_mentores',
    fields: ['full_name','email','phone','university','level','specialization','average_grade','city','availability','preferred_format','status','selection_score','charter_accepted','created_date'],
  },
  {
    key: 'binomes',
    label: 'Binômes',
    icon: '🤝',
    description: 'Tous les binômes formés avec statistiques de rencontres',
    fetch: () => base44.entities.Binome.list('-created_date', 500),
    filename: 'passerelles_binomes',
    fields: ['mentor_name','mentor_email','mentore_name','mentore_email','match_date','status','meeting_frequency','total_meetings','last_meeting_date','match_score','created_date'],
  },
  {
    key: 'suivis',
    label: 'Suivis Mensuels',
    icon: '📋',
    description: 'Toutes les fiches de suivi mensuel avec évaluations et satisfaction',
    fetch: () => base44.entities.SuiviMensuel.list('-meeting_date', 1000),
    filename: 'passerelles_suivis_mensuels',
    fields: ['mentor_name','mentor_email','mentore_name','mentore_email','meeting_date','meeting_number','duration_hours','format','objectives_discussed','successes','challenges','advice_given','action_items_mentore','action_items_mentor','next_meeting_date','satisfaction_mentor','satisfaction_mentore','progress_rating','issues_reported','issue_description','submitted_by','created_date'],
  },
  {
    key: 'journal',
    label: 'Journal de Bord',
    icon: '📓',
    description: 'Toutes les entrées du journal de bord',
    fetch: () => base44.entities.JournalDeBord.list('-date_entree', 1000),
    filename: 'passerelles_journal',
    fields: ['binome_id','mentor_name','mentore_name','type','titre','date_entree','auteur_role','objectif_statut','objectif_progression','objectif_echeance','visible_par','tags','created_date'],
  },
  {
    key: 'bilans',
    label: 'Bilans Finaux',
    icon: '🏆',
    description: 'Tous les bilans de fin de programme avec témoignages',
    fetch: () => base44.entities.BilanFinal.list('-created_date', 500),
    filename: 'passerelles_bilans_finaux',
    fields: ['mentor_name','mentor_email','mentore_name','mentore_email','role_evaluateur','objectifs_atteints','qualite_accompagnement','satisfaction_globale','competences_developpees','points_forts','axes_amelioration','recommanderait_programme','temoignage','certificat_eligible','created_date'],
  },
];

export default function ExportCSV() {
  const [loading, setLoading] = useState({});
  const [done, setDone] = useState({});

  const handleExport = async (exp) => {
    setLoading(p => ({ ...p, [exp.key]: true }));
    setDone(p => ({ ...p, [exp.key]: false }));
    const rawData = await exp.fetch();
    const filtered = rawData.map(row => {
      const out = {};
      exp.fields.forEach(f => { out[f] = row[f] ?? ''; });
      return out;
    });
    const csv = toCSV(filtered);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `${exp.filename}_${date}.csv`);
    setLoading(p => ({ ...p, [exp.key]: false }));
    setDone(p => ({ ...p, [exp.key]: true }));
    setTimeout(() => setDone(p => ({ ...p, [exp.key]: false })), 3000);
  };

  const handleExportAll = async () => {
    for (const exp of EXPORTS) {
      await handleExport(exp);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Export des données</h2>
          <p className="text-sm text-gray-500 mt-1">Téléchargez toutes les données en format CSV (compatible Excel)</p>
        </div>
        <Button onClick={handleExportAll} className="bg-[#1e5631] hover:bg-[#2d7a47] gap-2">
          <Download className="h-4 w-4" />
          Tout exporter
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORTS.map(exp => (
          <Card key={exp.key} className="border border-gray-200 hover:border-[#1e5631] transition-colors shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">{exp.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{exp.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{exp.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {exp.fields.length} colonnes
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleExport(exp)}
                  disabled={loading[exp.key]}
                  className={done[exp.key] ? 'bg-emerald-600 hover:bg-emerald-700 gap-1' : 'bg-[#1e5631] hover:bg-[#2d7a47] gap-1'}
                >
                  {loading[exp.key] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : done[exp.key] ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Téléchargé</>
                  ) : (
                    <><FileSpreadsheet className="h-3.5 w-3.5" /> Exporter CSV</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-blue-100 bg-blue-50 shadow-sm">
        <CardContent className="p-4 flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Compatibilité Excel</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Les fichiers CSV sont encodés en UTF-8 avec BOM pour une compatibilité parfaite avec Microsoft Excel et Google Sheets.
              Les champs multi-valeurs (tableaux) sont séparés par « | ».
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}