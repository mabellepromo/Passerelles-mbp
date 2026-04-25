import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ClipboardList, Loader2, CheckCircle2, Star, AlertTriangle, Users
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const StarRating = ({ value, onChange, color = 'amber' }) => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map(n => (
      <Star
        key={n}
        className={`h-7 w-7 cursor-pointer transition-colors ${
          n <= value
            ? color === 'emerald' ? 'text-emerald-500 fill-emerald-500' : 'text-amber-500 fill-amber-500'
            : 'text-gray-300 hover:text-gray-400'
        }`}
        onClick={() => onChange(n)}
      />
    ))}
    <span className="ml-2 text-sm font-semibold text-gray-600">{value}/5</span>
  </div>
);

const SectionHeader = ({ number, title, description, color = 'emerald' }) => (
  <CardHeader className={`bg-${color}-50 border-b border-${color}-100`}>
    <CardTitle className={`text-${color}-800 flex items-center gap-3`}>
      <span className={`w-7 h-7 rounded-full bg-${color}-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
        {number}
      </span>
      {title}
    </CardTitle>
    {description && <CardDescription>{description}</CardDescription>}
  </CardHeader>
);

export default function SuiviMensuel() {
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledBinomeId = urlParams.get('binome_id') || '';
  const editSuiviId = urlParams.get('edit_id') || '';

  const [formData, setFormData] = useState({
    binome_id: prefilledBinomeId,
    submitted_by: '',
    meeting_date: '',
    meeting_number: 1,
    duration_hours: 2,
    format: '',
    // Section 1 — Objectifs
    objectives_discussed: '',
    objectives_comments: '',
    // Section 2 — Points discutés
    successes: '',
    challenges: '',
    advice_given: '',
    other_topics: '',
    // Section 3 — Actions
    action_items_mentore: '',
    action_items_mentor: '',
    action_deadlines: '',
    // Section 4 — Évaluation satisfaction
    satisfaction_mentor: 4,
    satisfaction_mentore: 4,
    progress_mentor: 4,
    progress_mentore: 4,
    qualitative_comments: '',
    // Section 5 — Défis
    challenges_resolved: '',
    challenges_pending: '',
    // Section 6 — Signalement
    issues_reported: false,
    issue_description: '',
    // Section 7 — Prochaine rencontre
    next_meeting_date: '',
    next_meeting_theme: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!editSuiviId);

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Charger le suivi s'il faut le modifier
  React.useEffect(() => {
    if (editSuiviId) {
      base44.entities.SuiviMensuel.filter({ id: editSuiviId }).then(results => {
        if (results.length > 0) {
          const suivi = results[0];
          setFormData(prev => ({
            ...prev,
            binome_id: suivi.binome_id,
            submitted_by: suivi.submitted_by,
            meeting_date: suivi.meeting_date,
            meeting_number: suivi.meeting_number,
            duration_hours: suivi.duration_hours,
            format: suivi.format,
            objectives_discussed: suivi.objectives_discussed,
            successes: suivi.successes,
            challenges: suivi.challenges,
            advice_given: suivi.advice_given,
            action_items_mentore: suivi.action_items_mentore,
            action_items_mentor: suivi.action_items_mentor,
            satisfaction_mentor: suivi.satisfaction_mentor,
            satisfaction_mentore: suivi.satisfaction_mentore,
            progress_rating: suivi.progress_rating,
            issues_reported: suivi.issues_reported,
            issue_description: suivi.issue_description,
            next_meeting_date: suivi.next_meeting_date,
          }));
        }
      });
    }
  }, [editSuiviId]);

  const { data: binomes = [] } = useQuery({
    queryKey: ['binomes-active', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('getMyBinomes', {});
      return res.data?.binomes || [];
    },
    enabled: !!user?.email
  });

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const selectedBinome = binomes.find(b => b.id === formData.binome_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isEditMode && editSuiviId) {
      // Modifier le suivi existant
      await base44.entities.SuiviMensuel.update(editSuiviId, {
        binome_id: formData.binome_id,
        mentor_name: selectedBinome?.mentor_name,
        mentore_name: selectedBinome?.mentore_name,
        mentor_email: selectedBinome?.mentor_email || '',
        mentore_email: selectedBinome?.mentore_email || '',
        submitted_by: formData.submitted_by,
        meeting_date: formData.meeting_date,
        meeting_number: formData.meeting_number,
        duration_hours: formData.duration_hours,
        format: formData.format,
        objectives_discussed: [formData.objectives_discussed, formData.objectives_comments ? `Commentaires: ${formData.objectives_comments}` : ''].filter(Boolean).join('\n\n'),
        successes: formData.successes,
        challenges: formData.challenges,
        advice_given: [formData.advice_given, formData.other_topics ? `Autres sujets: ${formData.other_topics}` : ''].filter(Boolean).join('\n\n'),
        action_items_mentore: [formData.action_items_mentore, formData.action_deadlines ? `Échéances: ${formData.action_deadlines}` : ''].filter(Boolean).join('\n\n'),
        action_items_mentor: formData.action_items_mentor,
        satisfaction_mentor: formData.satisfaction_mentor,
        satisfaction_mentore: formData.satisfaction_mentore,
        progress_rating: Math.round((formData.progress_mentor + formData.progress_mentore) / 2),
        issue_description: formData.issues_reported ? formData.issue_description : undefined,
        issues_reported: formData.issues_reported,
        next_meeting_date: formData.next_meeting_date,
      });
    } else {
      // Créer un nouveau suivi
      await base44.entities.SuiviMensuel.create({
      binome_id: formData.binome_id,
      mentor_name: selectedBinome?.mentor_name,
      mentore_name: selectedBinome?.mentore_name,
      mentor_email: selectedBinome?.mentor_email || '',
      mentore_email: selectedBinome?.mentore_email || '',
      submitted_by: formData.submitted_by,
      meeting_date: formData.meeting_date,
      meeting_number: formData.meeting_number,
      duration_hours: formData.duration_hours,
      format: formData.format,
      objectives_discussed: [formData.objectives_discussed, formData.objectives_comments ? `Commentaires: ${formData.objectives_comments}` : ''].filter(Boolean).join('\n\n'),
      successes: formData.successes,
      challenges: formData.challenges,
      advice_given: [formData.advice_given, formData.other_topics ? `Autres sujets: ${formData.other_topics}` : ''].filter(Boolean).join('\n\n'),
      action_items_mentore: [formData.action_items_mentore, formData.action_deadlines ? `Échéances: ${formData.action_deadlines}` : ''].filter(Boolean).join('\n\n'),
      action_items_mentor: formData.action_items_mentor,
      satisfaction_mentor: formData.satisfaction_mentor,
      satisfaction_mentore: formData.satisfaction_mentore,
      progress_rating: Math.round((formData.progress_mentor + formData.progress_mentore) / 2),
      // Extra fields stored in issue_description if no issue
      issue_description: formData.issues_reported
        ? formData.issue_description
        : [
            formData.qualitative_comments ? `Commentaires qualitatifs: ${formData.qualitative_comments}` : '',
            formData.challenges_resolved ? `Défis résolus: ${formData.challenges_resolved}` : '',
            formData.challenges_pending ? `Défis en suspens: ${formData.challenges_pending}` : '',
          ].filter(Boolean).join('\n\n') || undefined,
      issues_reported: formData.issues_reported,
      next_meeting_date: formData.next_meeting_date,
      // Store next theme in action_items_mentor suffix
      });

      if (selectedBinome) {
        await base44.entities.Binome.update(selectedBinome.id, {
          last_meeting_date: formData.meeting_date,
          total_meetings: (selectedBinome.total_meetings || 0) + 1
        });
      }
    }

    setIsSuccess(true);
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="border-2 border-[#1e5631] shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-[#1e5631]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Fiche Enregistrée !</h2>
              <p className="text-gray-600 mb-2 text-sm">
                <strong>{selectedBinome?.mentor_name}</strong> ↔ <strong>{selectedBinome?.mentore_name}</strong>
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Rencontre #{formData.meeting_number} du {formData.meeting_date?.split('-').reverse().join('/')} archivée avec succès.
              </p>
              <div className="space-y-3">
                <Link to={createPageUrl('MonSuivi')}><Button className="w-full bg-[#1e5631] hover:bg-[#2d7a47]">Voir mes suivis</Button></Link>
                <Button variant="outline" className="w-full" onClick={() => { setIsSuccess(false); setFormData(p => ({ ...p, meeting_date: '', objectives_discussed: '', objectives_comments: '', successes: '', challenges: '', advice_given: '', other_topics: '', action_items_mentore: '', action_items_mentor: '', action_deadlines: '', qualitative_comments: '', challenges_resolved: '', challenges_pending: '', issues_reported: false, issue_description: '', next_meeting_date: '', next_meeting_theme: '' })); }}>
                  Nouvelle fiche
                </Button>
                <Link to={createPageUrl('Home')}><Button variant="outline" className="w-full">Retour à l'accueil</Button></Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5dc]">
      <NavBar />
      <header className="bg-[#1e5631] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb items={[{ label: 'Mon Espace', to: '/MonEspace' }, { label: 'Nouveau suivi' }]} />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <ClipboardList className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{isEditMode ? 'Modifier le' : 'Nouvelle'} Fiche de Suivi des Rencontres</h1>
              <p className="text-emerald-200 text-sm">Programme PASSERELLES – Ma Belle Promo (MBP)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!user ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1e5631', borderTopColor: 'transparent' }} />
              <p className="text-sm text-gray-400">Chargement de vos binômes…</p>
            </div>
          </div>
        ) : binomes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Vous n'avez pas de binôme actif</p>
            <p className="text-sm mt-2">Retournez à votre espace pour plus d'informations</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* En-tête de la fiche */}
          <Card className="border-2 border-[#1e5631] shadow-md">
            <CardHeader className="bg-[#1e5631] text-white">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" /> Identification — Rencontre Mentor/Mentoré
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Binôme *</Label>
                  <Select value={formData.binome_id} onValueChange={(v) => handleChange('binome_id', v)} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez votre binôme" /></SelectTrigger>
                    <SelectContent>
                      {binomes.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.mentor_name} ↔ {b.mentore_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBinome && (
                    <p className="text-xs text-emerald-700 font-medium">
                      Mentor : {selectedBinome.mentor_name} | Mentoré : {selectedBinome.mentore_name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fiche complétée par *</Label>
                  <Select value={formData.submitted_by} onValueChange={(v) => handleChange('submitted_by', v)} required>
                    <SelectTrigger><SelectValue placeholder="Qui remplit cette fiche ?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentor">Le Mentor</SelectItem>
                      <SelectItem value="mentore">Le Mentoré</SelectItem>
                      <SelectItem value="both">Les deux ensemble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Numéro de rencontre</Label>
                  <Input type="number" min="1" value={formData.meeting_number} onChange={(e) => handleChange('meeting_number', Number(e.target.value))} />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Date *</Label>
                  <Input type="date" value={formData.meeting_date} onChange={(e) => handleChange('meeting_date', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Format *</Label>
                  <Select value={formData.format} onValueChange={(v) => handleChange('format', v)} required>
                    <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presentiel">Présentiel</SelectItem>
                      <SelectItem value="virtuel">Virtuel (Zoom/WhatsApp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Durée *</Label>
                  <Select value={String(formData.duration_hours)} onValueChange={(v) => handleChange('duration_hours', Number(v))} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">30 min</SelectItem>
                      <SelectItem value="1">1h00</SelectItem>
                      <SelectItem value="1.5">1h30</SelectItem>
                      <SelectItem value="2">2h00</SelectItem>
                      <SelectItem value="2.5">2h30</SelectItem>
                      <SelectItem value="3">3h00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1 — Objectifs */}
          <Card className="border-0 shadow-md">
            <SectionHeader number="1" title="Objectifs de la Rencontre" description="Listez les objectifs SMART abordés lors de cette rencontre" />
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label>Objectifs prédéfinis / abordés *</Label>
                <Textarea value={formData.objectives_discussed} onChange={(e) => handleChange('objectives_discussed', e.target.value)} placeholder="Ex : Clarifier le projet de stage en droit des affaires, identifier 3 cabinets cibles d'ici fin du mois..." className="min-h-[100px]" required />
              </div>
              <div className="space-y-2">
                <Label>Commentaires sur les objectifs</Label>
                <Textarea value={formData.objectives_comments} onChange={(e) => handleChange('objectives_comments', e.target.value)} placeholder="Ex : Objectifs fixés lors de la rencontre précédente ou à l'atelier de lancement..." className="min-h-[80px]" />
              </div>
            </CardContent>
          </Card>

          {/* Section 2 — Points Discutés */}
          <Card className="border-0 shadow-md">
            <SectionHeader number="2" title="Points Discutés" description="Résumé des échanges de la rencontre" color="blue" />
            <CardContent className="pt-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>✅ Succès récents du mentoré</Label>
                  <Textarea value={formData.successes} onChange={(e) => handleChange('successes', e.target.value)} placeholder="Quels progrès ou réussites à célébrer ?" className="min-h-[90px]" />
                </div>
                <div className="space-y-2">
                  <Label>⚠️ Défis rencontrés</Label>
                  <Textarea value={formData.challenges} onChange={(e) => handleChange('challenges', e.target.value)} placeholder="Quelles difficultés ont été soulevées ?" className="min-h-[90px]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>💡 Conseils donnés / reçus</Label>
                <Textarea value={formData.advice_given} onChange={(e) => handleChange('advice_given', e.target.value)} placeholder="Quels conseils le mentor a-t-il partagés ?" className="min-h-[90px]" />
              </div>
              <div className="space-y-2">
                <Label>Autres sujets abordés</Label>
                <Textarea value={formData.other_topics} onChange={(e) => handleChange('other_topics', e.target.value)} placeholder="Sujets supplémentaires discutés en dehors des objectifs prévus..." className="min-h-[70px]" />
              </div>
            </CardContent>
          </Card>

          {/* Section 3 — Actions */}
          <Card className="border-0 shadow-md">
            <SectionHeader number="3" title="Actions à Suivre" description="Tâches concrètes avec échéances" color="amber" />
            <CardContent className="pt-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Par le mentoré</Label>
                  <Textarea value={formData.action_items_mentore} onChange={(e) => handleChange('action_items_mentore', e.target.value)} placeholder="Que doit faire le mentoré d'ici la prochaine rencontre ?" className="min-h-[90px]" />
                </div>
                <div className="space-y-2">
                  <Label>Par le mentor</Label>
                  <Textarea value={formData.action_items_mentor} onChange={(e) => handleChange('action_items_mentor', e.target.value)} placeholder="Que doit faire le mentor d'ici la prochaine rencontre ?" className="min-h-[90px]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Échéances</Label>
                <Input value={formData.action_deadlines} onChange={(e) => handleChange('action_deadlines', e.target.value)} placeholder="Ex : Avant le 30/04/2026 pour l'envoi du CV..." />
              </div>
            </CardContent>
          </Card>

          {/* Section 4 — Évaluation */}
          <Card className="border-0 shadow-md">
            <SectionHeader number="4" title="Évaluation de la Rencontre" description="Satisfaction globale et progrès perçus (échelle 1–5)" />
            <CardContent className="pt-5 space-y-6">
              <div className="bg-amber-50 rounded-xl p-5 space-y-5">
                <p className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Satisfaction globale</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Satisfaction du Mentor</Label>
                    <StarRating value={formData.satisfaction_mentor} onChange={(v) => handleChange('satisfaction_mentor', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Satisfaction du Mentoré</Label>
                    <StarRating value={formData.satisfaction_mentore} onChange={(v) => handleChange('satisfaction_mentore', v)} />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-5 space-y-5">
                <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Progrès perçus</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Évaluation du Mentor</Label>
                    <p className="text-xs text-gray-500">Ex : Progrès du mentoré en clarté des objectifs</p>
                    <StarRating value={formData.progress_mentor} onChange={(v) => handleChange('progress_mentor', v)} color="emerald" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Évaluation du Mentoré</Label>
                    <p className="text-xs text-gray-500">Ex : Confiance accrue pour postuler à un stage</p>
                    <StarRating value={formData.progress_mentore} onChange={(v) => handleChange('progress_mentore', v)} color="emerald" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commentaires qualitatifs</Label>
                <Textarea value={formData.qualitative_comments} onChange={(e) => handleChange('qualitative_comments', e.target.value)} placeholder="Observations libres sur la qualité de la rencontre, la dynamique, l'atmosphère..." className="min-h-[80px]" />
              </div>
            </CardContent>
          </Card>

          {/* Section 5 — Défis */}
          <Card className="border-0 shadow-md">
            <SectionHeader number="5" title="Défis Résolus ou en Suspens" color="purple" />
            <CardContent className="pt-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>✅ Défis résolus depuis la dernière rencontre</Label>
                  <Textarea value={formData.challenges_resolved} onChange={(e) => handleChange('challenges_resolved', e.target.value)} placeholder="Quels obstacles ont été surmontés ?" className="min-h-[80px]" />
                </div>
                <div className="space-y-2">
                  <Label>⏳ Défis encore en suspens</Label>
                  <Textarea value={formData.challenges_pending} onChange={(e) => handleChange('challenges_pending', e.target.value)} placeholder="Quels défis nécessitent encore un accompagnement ?" className="min-h-[80px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 — Signalement */}
          <Card className="border-0 shadow-md border-l-4 border-l-red-400">
            <CardHeader className="bg-red-50 border-b border-red-100">
              <CardTitle className="text-red-700 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold flex items-center justify-center">6</span>
                Signalement (si applicable)
              </CardTitle>
              <CardDescription className="text-red-600">
                Le mentor ou le mentoré a-t-il observé ou ressenti un comportement inapproprié, une violation de la charte, ou une difficulté relationnelle significative ?
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="issues" checked={formData.issues_reported} onCheckedChange={(v) => handleChange('issues_reported', v)} />
                <label htmlFor="issues" className="text-sm text-gray-700 cursor-pointer font-medium">
                  Oui — Je souhaite signaler un problème ou une préoccupation
                </label>
              </div>
              {formData.issues_reported && (
                <div className="space-y-2 bg-red-50 p-4 rounded-lg border border-red-200">
                  <Textarea value={formData.issue_description} onChange={(e) => handleChange('issue_description', e.target.value)} placeholder="Décrivez brièvement la situation. Cette information sera traitée confidentiellement par le coordinateur MBP." className="border-red-300 min-h-[100px]" />
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Action : Signaler immédiatement à contact@mabellepromo.org | +228 96 09 07 07
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 7 — Prochaine Rencontre */}
          <Card className="border-0 shadow-md">
            <SectionHeader number="7" title="Prochaine Rencontre" description="Planification de la prochaine session de mentorat" />
            <CardContent className="pt-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date proposée</Label>
                  <Input type="date" value={formData.next_meeting_date} onChange={(e) => handleChange('next_meeting_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Thème / Objectifs prévus</Label>
                  <Input value={formData.next_meeting_theme} onChange={(e) => handleChange('next_meeting_theme', e.target.value)} placeholder="Ex : Révision du CV, préparation entretien..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pb-8">
            <Link to={createPageUrl('MonSuivi')}>
              <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !formData.binome_id || !formData.submitted_by}
              className="bg-[#1e5631] hover:bg-[#2d7a47] px-8"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isEditMode ? 'Mise à jour...' : 'Enregistrement...'}</>
              ) : (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> {isEditMode ? 'Mettre à jour la fiche' : 'Soumettre la fiche de suivi'}</>
              )}
            </Button>
          </div>
        </form>
        )}
        </main>
        <Footer />
    </div>
  );
}