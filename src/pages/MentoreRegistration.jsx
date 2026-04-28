import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import ContactModal from '@/components/ContactModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  GraduationCap, 
  Loader2, 
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';

const INTERESTS = [
  "Droit des affaires",
  "Droit pénal",
  "Droit civil",
  "Droit public",
  "Droit international",
  "Droit du travail",
  "Droit fiscal",
  "Magistrature",
  "Avocature",
  "Notariat",
  "Droit numérique",
  "Droits de l'homme",
  "Autres"
];

const DAYS_OF_WEEK = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
  { value: 'dimanche', label: 'Dimanche' },
  { value: 'flexible', label: 'Flexible' }
];

const CAREER_GOALS = [
  "Avocat",
  "Magistrat",
  "Notaire",
  "Juriste d'entreprise",
  "Enseignant-chercheur",
  "Fonctionnaire international",
  "Consultant juridique",
  "Huissier de justice",
  "Autres"
];

export default function MentoreRegistration() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    sexe: '',
    university: '',
    university_other: '',
    level: '',
    specialization: '',
    average_grade: '',
    career_goals: [],
    interests: [],
    availability: '',
    preferred_format: '',
    motivation_letter: '',
    civic_engagement: '',
    city: '',
    charter_accepted: false,
    rgpd_accepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [otherCareerGoal, setOtherCareerGoal] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [otherInterest, setOtherInterest] = useState('');
  const [availableDays, setAvailableDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState('');
  const [programCommitment, setProgramCommitment] = useState('');
  const [commitmentConstraints, setCommitmentConstraints] = useState('');
  const [mbpValuesAlignment, setMbpValuesAlignment] = useState(null);
  const [mentoringInterest, setMentoringInterest] = useState('');
  const [minimumTimeCommitment, setMinimumTimeCommitment] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    const current = formData[field];
    if (current.includes(item)) {
      handleChange(field, current.filter(i => i !== item));
    } else {
      handleChange(field, [...current, item]);
    }
  };

  const toggleDay = (day) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const urls = [];

    for (const file of files) {
      const result = await base44.integrations.Core.UploadFile({ file });
      urls.push(result.file_url);
    }

    setUploadedDocs([...uploadedDocs, ...urls]);
    setIsUploading(false);
  };

  const removeDocument = (url) => {
    setUploadedDocs(uploadedDocs.filter(doc => doc !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
    // Évaluation automatique par IA
    const aiEvaluation = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un évaluateur pour le programme de mentorat PASSERELLES de Ma Belle Promo (MBP).
      
Évalue cette candidature de mentoré selon la grille suivante (total 100 points) :

**MOTIVATION (30 points)**
- Authenticité de la motivation (15 points)
- Clarté des objectifs (10 points)
- Alignement avec les valeurs MBP (excellence, entraide, équité, leadership) (5 points)

**NIVEAU D'ÉTUDES (25 points)**
- Inscription L3/M1/M2 (10 points) - automatique selon niveau
- Performance académique (10 points) - basé sur la moyenne
- Pertinence du parcours (5 points)

**DISPONIBILITÉ (20 points)**
- Respect du calendrier (10 points)
- Participation aux activités collectives (7 points)
- Engagement déclaré (3 points)

**ENGAGEMENT (25 points)**
- Implication associative (10 points)
- Alignement valeurs MBP (10 points)
- Potentiel de leadership (5 points)

**Données du candidat :**
- Nom : ${formData.full_name}
- Niveau : ${formData.level}
- Université : ${formData.university}
- Moyenne : ${formData.average_grade || 'Non fournie'}
- Spécialisation : ${formData.specialization || 'Non spécifiée'}
- Objectifs de carrière : ${formData.career_goals.join(', ')}${otherCareerGoal ? ` (Autres: ${otherCareerGoal})` : ''}
- Domaines d'intérêt : ${formData.interests.join(', ')}${otherInterest ? ` (Autres: ${otherInterest})` : ''}
- Alignement valeurs MBP : ${mbpValuesAlignment}/5
- Intérêt pour le mentorat : ${mentoringInterest}
- Jours disponibles : ${availableDays.join(', ')}
- Créneaux horaires : ${timeSlots}
- Format préféré : ${formData.preferred_format}
- Engagement au programme : ${programCommitment}${programCommitment === 'selon_disponibilite' ? ` (Contraintes: ${commitmentConstraints})` : ''}
- Engagement 2h/mois : ${minimumTimeCommitment}
- Engagement civique : ${formData.civic_engagement}
- Lettre de motivation : ${formData.motivation_letter}

Fournis une évaluation détaillée avec les scores pour chaque sous-critère et un commentaire général.`,
      response_json_schema: {
        type: "object",
        properties: {
          motivation_authenticite: { type: "number" },
          motivation_clarte: { type: "number" },
          motivation_alignement: { type: "number" },
          niveau_inscription: { type: "number" },
          niveau_performance: { type: "number" },
          niveau_pertinence: { type: "number" },
          disponibilite_calendrier: { type: "number" },
          disponibilite_activites: { type: "number" },
          disponibilite_engagement: { type: "number" },
          engagement_associatif: { type: "number" },
          engagement_valeurs: { type: "number" },
          engagement_leadership: { type: "number" },
          total_ai: { type: "number" },
          commentaire_ai: { type: "string" }
        }
      }
    });
    
    await base44.entities.Mentore.create({
      ...formData,
      average_grade: formData.average_grade ? Number(formData.average_grade) : null,
      documents_urls: uploadedDocs,
      ai_evaluation: aiEvaluation,
      selection_score: aiEvaluation.total_ai,
      status: 'pending',
      other_career_goal: otherCareerGoal || null,
      other_interest: otherInterest || null,
      available_days: availableDays,
      time_slots: timeSlots,
      program_commitment: programCommitment,
      commitment_constraints: commitmentConstraints || null,
      mbp_values_alignment: mbpValuesAlignment,
      mentoring_interest: mentoringInterest,
      minimum_time_commitment: minimumTimeCommitment
    });
    
    setIsSuccess(true);
    } catch (err) {
      alert(`Erreur lors de l'envoi : ${err instanceof Error ? err.message : 'Veuillez réessayer.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-[#1e5631] shadow-2xl">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-[#1e5631]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Candidature Envoyée !</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Merci de votre intérêt pour le programme PASSERELLES. Votre candidature sera évaluée selon nos critères de sélection. 
                Vous recevrez une réponse par email dans les 2 semaines suivant la clôture des candidatures.
              </p>
              <Link to={createPageUrl('Home')}>
                <Button className="bg-[#1e5631] hover:bg-[#2d7a47] text-sm sm:text-base">
                  Retour à l'accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      {/* Header */}
      <header className="bg-[#1e5631] text-white py-6 sm:py-8 px-4">
        <div className="w-full max-w-[80%] mx-auto">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-emerald-100 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Candidature Mentoré - Programme PASSERELLES</h1>
              <p className="text-xs sm:text-sm text-emerald-200">Relier Ambitions & Opportunités</p>
            </div>
          </div>
        </div>
      </header>

      {/* Introduction */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="w-full max-w-[80%] mx-auto">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
            Bienvenue ! L'Association <strong>Ma Belle Promo (MBP)</strong> lance le programme de mentorat <strong>PASSERELLES</strong> pour accompagner 20 étudiants en droit. 
            Ce formulaire évalue votre parcours académique, votre motivation et vos objectifs professionnels.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 sm:p-4 rounded mb-4">
            <p className="text-sm text-amber-900">
              <strong>Critères d'éligibilité :</strong> Étudiants en L3, M1 ou M2 en droit dans une université togolaise 
              (Université de Lomé, Université de Kara ou établissement privé).
            </p>
          </div>

          {/* Grille d'Évaluation */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-[#1e5631] mb-3">📊 Grille d'Évaluation (Total: 100 points)</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">1. Motivation (30 points)</h4>
                <ul className="space-y-1 ml-4 text-gray-700">
                  <li>• Authenticité: <strong>15 pts</strong></li>
                  <li>• Clarté objectifs: <strong>10 pts</strong></li>
                  <li>• Alignement MBP: <strong>5 pts</strong></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">2. Niveau d'Études (25 points)</h4>
                <ul className="space-y-1 ml-4 text-gray-700">
                  <li>• Inscription L3/M1/M2: <strong>10 pts</strong></li>
                  <li>• Performance académique: <strong>10 pts</strong></li>
                  <li>• Pertinence parcours: <strong>5 pts</strong></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">3. Disponibilité (20 points)</h4>
                <ul className="space-y-1 ml-4 text-gray-700">
                  <li>• Respect calendrier: <strong>10 pts</strong></li>
                  <li>• Activités collectives: <strong>7 pts</strong></li>
                  <li>• Engagement déclaré: <strong>3 pts</strong></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 mb-2">4. Engagement (25 points)</h4>
                <ul className="space-y-1 ml-4 text-gray-700">
                  <li>• Implication associative: <strong>10 pts</strong></li>
                  <li>• Alignement valeurs MBP: <strong>10 pts</strong></li>
                  <li>• Potentiel leadership: <strong>5 pts</strong></li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4 italic">
              💡 Votre candidature sera évaluée automatiquement selon cette grille par notre système d'aide à la décision, puis révisée par notre équipe.
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-3">
            Contact : <button onClick={() => setContactOpen(true)} className="text-[#1e5631] hover:underline">contact@mabellepromo.org</button> |
            <a href="tel:+22896090707" className="text-[#1e5631] hover:underline ml-1">+228 96 09 07 07</a>
          </p>
        </div>
      </div>

      {/* Form */}
      <main className="w-full max-w-[80%] mx-auto px-4 py-8 sm:py-12">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Personal Information */}
          <Card className="border-2 border-gray-200 shadow-md">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">Informations Personnelles</CardTitle>
              <CardDescription className="text-sm">Vos coordonnées et informations de base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Ex: Ama Kofi MENSAH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+228 XX XX XX XX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select value={formData.sexe} onValueChange={(v) => handleChange('sexe', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculin">Masculin</SelectItem>
                      <SelectItem value="feminin">Féminin</SelectItem>
                      <SelectItem value="ne_se_prononce_pas">Ne souhaite pas se prononcer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Select value={formData.city} onValueChange={(v) => handleChange('city', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lome">Lomé</SelectItem>
                      <SelectItem value="kara">Kara</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.city === 'autre' && (
                <div className="space-y-2">
                  <Label htmlFor="city_other">Précisez votre ville *</Label>
                  <Input
                    id="city_other"
                    value={formData.city_other}
                    onChange={(e) => handleChange('city_other', e.target.value)}
                    placeholder="Ex: Atakpamé, Sokodé, Tsévié..."
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="border-2 border-green-300 shadow-md">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">📚 Parcours Académique</CardTitle>
              <CardDescription className="text-sm">
                <strong className="text-green-700">Critère 2: Niveau d'Études (25 points)</strong> - Inscription (10 pts) + Performance (10 pts) + Pertinence (5 pts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Université *</Label>
                  <Select value={formData.university} onValueChange={(v) => handleChange('university', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez votre université" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="universite_lome">Université de Lomé</SelectItem>
                      <SelectItem value="universite_kara">Université de Kara</SelectItem>
                      <SelectItem value="etablissement_prive">Établissement privé</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.university === 'etablissement_prive' && (
                    <div className="mt-2 space-y-1">
                      <Label htmlFor="university_other">Nom de l'établissement *</Label>
                      <Input
                        id="university_other"
                        value={formData.university_other}
                        onChange={(e) => handleChange('university_other', e.target.value)}
                        placeholder="Ex: IULD, CERCO, ESAG-NDE..."
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Niveau d'études *</Label>
                  <Select value={formData.level} onValueChange={(v) => handleChange('level', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Votre niveau actuel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L3">Licence 3 (L3)</SelectItem>
                      <SelectItem value="M1">Master 1 (M1)</SelectItem>
                      <SelectItem value="M2">Master 2 (M2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Spécialisation</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                    placeholder="Ex: Droit privé, Droit public..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="average_grade">Moyenne générale (sur 20)</Label>
                  <Input
                    id="average_grade"
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={formData.average_grade}
                    onChange={(e) => handleChange('average_grade', e.target.value)}
                    placeholder="Ex: 13.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Goals & Interests */}
          <Card className="border-2 border-blue-300 shadow-md">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">🎯 Objectifs et Intérêts</CardTitle>
              <CardDescription className="text-sm">
                <strong className="text-blue-700">Critère 1: Motivation (30 points)</strong> - Authenticité (15 pts) + Clarté (10 pts) + Alignement MBP (5 pts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Objectifs de carrière (sélectionnez jusqu'à 3)</Label>
                <div className="flex flex-wrap gap-2">
                  {CAREER_GOALS.map(goal => (
                    <Badge
                      key={goal}
                      variant={formData.career_goals.includes(goal) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        formData.career_goals.includes(goal) 
                          ? "bg-emerald-600 hover:bg-emerald-700" 
                          : "hover:bg-emerald-50"
                      }`}
                      onClick={() => {
                        if (formData.career_goals.includes(goal) || formData.career_goals.length < 3) {
                          toggleArrayItem('career_goals', goal);
                        }
                      }}
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
                {formData.career_goals.includes('Autres') && (
                  <div className="space-y-2">
                    <Label htmlFor="other_career_goal">Précisez votre objectif de carrière</Label>
                    <Input
                      id="other_career_goal"
                      value={otherCareerGoal}
                      onChange={(e) => setOtherCareerGoal(e.target.value)}
                      placeholder="Décrivez votre objectif de carrière..."
                      className="border-emerald-300 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Domaines d'intérêt en droit (sélectionnez jusqu'à 4)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        formData.interests.includes(interest) 
                          ? "bg-amber-500 hover:bg-amber-600" 
                          : "hover:bg-amber-50"
                      }`}
                      onClick={() => {
                        if (formData.interests.includes(interest) || formData.interests.length < 4) {
                          toggleArrayItem('interests', interest);
                        }
                      }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                {formData.interests.includes('Autres') && (
                  <div className="space-y-2">
                    <Label htmlFor="other_interest">Précisez votre domaine d'intérêt</Label>
                    <Input
                      id="other_interest"
                      value={otherInterest}
                      onChange={(e) => setOtherInterest(e.target.value)}
                      placeholder="Décrivez votre domaine d'intérêt..."
                      className="border-amber-300 focus:border-amber-500"
                    />
                  </div>
                )}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                <Label>Alignement avec les valeurs MBP *</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Sur une échelle de 1 (faible) à 5 (fort), comment vous alignez-vous avec les valeurs MBP (excellence, entraide, leadership) ?
                </p>
                <div className="flex gap-2 justify-center items-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMbpValuesAlignment(value)}
                      className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                        mbpValuesAlignment === value
                          ? 'bg-[#1e5631] text-white border-[#1e5631] scale-110'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#1e5631] hover:text-[#1e5631]'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>Faible</span>
                  <span>Fort</span>
                </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-200">
                <Label htmlFor="mentoring_interest">Intérêt pour le mentorat *</Label>
                <Textarea
                  id="mentoring_interest"
                  value={mentoringInterest}
                  onChange={(e) => setMentoringInterest(e.target.value)}
                  placeholder="Décrivez votre intérêt pour le mentorat (ex: orientation Master, stage) et vos aspirations académiques/professionnelles..."
                  className="min-h-[100px]"
                  required
                />
                <p className="text-xs text-gray-500">
                  Partagez ce que vous espérez obtenir de cette expérience de mentorat
                </p>
                </div>
                </CardContent>
                </Card>

          {/* Availability */}
          <Card className="border-2 border-amber-300 shadow-md">
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">📅 Disponibilité</CardTitle>
              <CardDescription className="text-sm">
                <strong className="text-amber-700">Critère 3: Disponibilité (20 points)</strong> - Calendrier (10 pts) + Activités (7 pts) + Engagement (3 pts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Jours disponibles * (sélectionnez au moins un jour)</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Badge
                      key={day.value}
                      variant={availableDays.includes(day.value) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        availableDays.includes(day.value)
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "hover:bg-amber-50"
                      }`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_slots">Créneaux horaires disponibles *</Label>
                <Textarea
                  id="time_slots"
                  value={timeSlots}
                  onChange={(e) => setTimeSlots(e.target.value)}
                  placeholder="Ex: Lundi et Mercredi 14h-17h, Samedi 9h-12h"
                  className="min-h-[80px]"
                  required
                />
                <p className="text-xs text-gray-500">
                  Précisez vos créneaux horaires disponibles pour les rencontres de mentorat
                </p>
              </div>

              <div className="space-y-2">
                <Label>Format préféré *</Label>
                <Select value={formData.preferred_format} onValueChange={(v) => handleChange('preferred_format', v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Format de rencontre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presentiel">Présentiel</SelectItem>
                    <SelectItem value="virtuel">Virtuel (Zoom/WhatsApp)</SelectItem>
                    <SelectItem value="mixte">Mixte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Disponibilité principale *</Label>
                <Select value={formData.availability} onValueChange={(v) => handleChange('availability', v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre disponibilité principale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday_morning">Semaine - Matin</SelectItem>
                    <SelectItem value="weekday_afternoon">Semaine - Après-midi</SelectItem>
                    <SelectItem value="weekday_evening">Semaine - Soir</SelectItem>
                    <SelectItem value="weekend">Week-end</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Engagement au programme *</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Vous engageriez-vous à respecter le calendrier de ce programme de mentorat, à participer ou assister aux webinaires/conférences organisés par Ma Belle Promo?
                </p>
                <Select value={programCommitment} onValueChange={(v) => setProgramCommitment(v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre engagement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                    <SelectItem value="selon_disponibilite">Selon disponibilité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {programCommitment === 'selon_disponibilite' && (
                <div className="space-y-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <Label htmlFor="commitment_constraints">Précisez vos contraintes</Label>
                  <Textarea
                    id="commitment_constraints"
                    value={commitmentConstraints}
                    onChange={(e) => setCommitmentConstraints(e.target.value)}
                    placeholder="Décrivez les contraintes qui pourraient limiter votre disponibilité (travail, études, obligations familiales, etc.)"
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-amber-700">
                    Cela nous aidera à évaluer si un accompagnement adapté est possible.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Engagement de temps *</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Pouvez-vous consacrer au minimum 2 heures par mois au suivi du mentorat (rencontre + préparation + objectifs) ?
                </p>
                <Select value={minimumTimeCommitment} onValueChange={(v) => setMinimumTimeCommitment(v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre réponse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui</SelectItem>
                    <SelectItem value="non">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Civic Engagement */}
          <Card className="border-2 border-purple-300 shadow-md">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">🤝 Engagement Civique</CardTitle>
              <CardDescription className="text-sm">
                <strong className="text-purple-700">Critère 4: Engagement (25 points)</strong> - Associatif (10 pts) + Valeurs MBP (10 pts) + Leadership (5 pts)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.civic_engagement}
                onChange={(e) => handleChange('civic_engagement', e.target.value)}
                placeholder="Décrivez votre implication associative, bénévolat, projets communautaires, etc."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Motivation Letter */}
          <Card className="border-2 border-blue-300 shadow-md">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">✍️ Lettre de Motivation</CardTitle>
              <CardDescription className="text-sm">
                <strong className="text-blue-700">Critère 1: Motivation</strong> - Cette section est cruciale (30 points au total). Soyez authentique et précis dans vos objectifs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.motivation_letter}
                onChange={(e) => {
                  const words = e.target.value.trim() === '' ? 0 : e.target.value.trim().split(/\s+/).length;
                  if (words <= 500) handleChange('motivation_letter', e.target.value);
                }}
                placeholder="Expliquez vos motivations pour rejoindre le programme, vos objectifs, ce que vous espérez apprendre et comment vous comptez contribuer à votre tour..."
                className="min-h-[200px]"
                required
              />
              <p className={`text-sm mt-2 ${(formData.motivation_letter.trim() === '' ? 0 : formData.motivation_letter.trim().split(/\s+/).length) >= 480 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                {formData.motivation_letter.trim() === '' ? 0 : formData.motivation_letter.trim().split(/\s+/).length} / 500 mots
              </p>
            </CardContent>
          </Card>

          {/* Documents Justificatifs */}
          <Card className="border-2 border-gray-300 shadow-md">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">📎 Documents Justificatifs</CardTitle>
              <CardDescription className="text-sm">
                Téléversez vos documents de preuve: relevé de notes (Performance académique), carte d'étudiant (Inscription), certificats d'engagement associatif, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Télécharger des documents (PDF, JPG, PNG)</Label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Téléversement en cours...
                  </div>
                )}
              </div>
              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Documents téléversés :</Label>
                  <div className="space-y-2">
                    {uploadedDocs.map((url, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                        <span className="text-sm text-gray-700 truncate flex-1">Document {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(url)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charter */}
          <Card className="border-2 border-amber-400 shadow-md bg-amber-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  id="charter"
                  checked={formData.charter_accepted}
                  onCheckedChange={(checked) => handleChange('charter_accepted', checked)}
                  required
                />
                <label htmlFor="charter" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                  Je m'engage à respecter l'ensemble des principes énoncés dans la{' '}
                  <a
                    href="https://drive.google.com/file/d/1MlZJFaOlL52ZyKeRYoNgQUyiCW4kXsxs/view?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1e5631] underline hover:text-[#2d7a47] font-semibold"
                  >
                    charte d'engagement
                  </a>
                  {' '}du programme PASSERELLES, notamment le droit à un environnement sûr et mon droit de signaler tout comportement inapproprié ou toute forme d'abus.
                  Je confirme être étudiant(e) en L3, M1 ou M2 en droit dans une université togolaise. *
                </label>
              </div>
            </CardContent>
          </Card>

          {/* RGPD */}
          <Card className="border-2 border-blue-300 shadow-md bg-blue-50">
            <CardContent className="p-4 sm:p-6 space-y-3">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Protection des données personnelles (RGPD)</p>
              <div className="flex items-start gap-4">
                <Checkbox
                  id="rgpd"
                  checked={formData.rgpd_accepted}
                  onCheckedChange={(checked) => handleChange('rgpd_accepted', checked)}
                  required
                />
                <label htmlFor="rgpd" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  J'ai pris connaissance de la{' '}
                  <a
                    href="/PolitiqueConfidentialite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline hover:text-blue-900 font-semibold"
                  >
                    politique de confidentialité
                  </a>
                  {' '}de Ma Belle Promo et j'accepte que mes données personnelles (identité, parcours académique, lettre de motivation, documents justificatifs) soient traitées pour l'évaluation de ma candidature et le suivi du programme PASSERELLES. Je comprends qu'un système d'aide à la décision automatisé est utilisé lors de la sélection, et que je peux demander une explication ou une révision humaine à contact@mabellepromo.org. *
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !formData.charter_accepted || !formData.rgpd_accepted || availableDays.length === 0 || !timeSlots || !programCommitment || (programCommitment === 'selon_disponibilite' && !commitmentConstraints) || !mbpValuesAlignment || !mentoringInterest || !minimumTimeCommitment}
              className="bg-[#1e5631] hover:bg-[#2d7a47] px-6 sm:px-8 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Soumettre ma candidature
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}