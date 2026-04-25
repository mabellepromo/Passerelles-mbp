import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import ContactModal from '@/components/ContactModal';
// contactOpen state added below in component
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
  UserCheck, 
  Loader2, 
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';

const SPECIALTIES = [
  "Droit des affaires",
  "Droit pénal",
  "Droit civil",
  "Droit public",
  "Droit international",
  "Droit du travail",
  "Droit fiscal",
  "Droit de la propriété intellectuelle",
  "Droit de l'environnement",
  "Droit numérique",
  "Droits de l'homme",
  "Droit administratif"
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

export default function MentorRegistration() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    sexe: '',
    profession: '',
    organization: '',
    years_experience: '',
    specialties: [],
    availability: '',
    preferred_format: '',
    motivation: '',
    city: '',
    city_other: '',
    linkedin_url: '',
    max_mentees: 1,
    charter_accepted: false,
    rgpd_accepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [availableDays, setAvailableDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState('');
  const [contactOpen, setContactOpen] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSpecialty = (specialty) => {
    if (specialty && !formData.specialties.includes(specialty)) {
      handleChange('specialties', [...formData.specialties, specialty]);
    }
  };

  const removeSpecialty = (specialty) => {
    handleChange('specialties', formData.specialties.filter(s => s !== specialty));
  };

  const toggleDay = (day) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await base44.entities.Mentor.create({
      ...formData,
      years_experience: Number(formData.years_experience),
      max_mentees: Number(formData.max_mentees),
      status: 'pending',
      available_days: availableDays,
      time_slots: timeSlots
    });
    
    setIsSuccess(true);
    setIsSubmitting(false);
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
                Merci de votre intérêt pour le programme PASSERELLES. Votre candidature sera examinée par notre équipe et vous recevrez une réponse par email.
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
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Candidature Mentor - Programme PASSERELLES</h1>
              <p className="text-xs sm:text-sm text-emerald-200">Relier Ambitions & Opportunités</p>
            </div>
          </div>
        </div>
      </header>

      {/* Introduction */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="w-full max-w-[80%] mx-auto">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Bienvenue ! L'Association <strong>Ma Belle Promo (MBP)</strong> lance le programme de mentorat <strong>PASSERELLES</strong> pour accompagner 20 étudiants en droit. 
            En tant que mentor, vous offrirez un accompagnement bienveillant, structuré et éthique (volontaire, non rémunéré). 
            Ce formulaire évalue votre motivation, disponibilité et adhésion aux valeurs MBP (excellence, entraide, équité, leadership). 
            Confidentialité assurée.
          </p>
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
                    placeholder="Ex: Jean Kodjo AMEGAN"
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
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">Profil LinkedIn (optionnel)</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/votre-profil"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="border-2 border-gray-200 shadow-md">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">Expérience Professionnelle</CardTitle>
              <CardDescription className="text-sm">Votre parcours et expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession actuelle *</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    placeholder="Ex: Avocat, Magistrat, Juriste d'entreprise..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organisation / Cabinet</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleChange('organization', e.target.value)}
                    placeholder="Nom de votre organisation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Années d'expérience *</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min="5"
                    value={formData.years_experience}
                    onChange={(e) => handleChange('years_experience', e.target.value)}
                    placeholder="Minimum 5 ans"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_mentees">Nombre de mentorés souhaités</Label>
                  <Select value={String(formData.max_mentees)} onValueChange={(v) => handleChange('max_mentees', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mentoré</SelectItem>
                      <SelectItem value="2">2 mentorés</SelectItem>
                      <SelectItem value="3">3 mentorés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="career_summary">Parcours professionnel *</Label>
                <Textarea
                  id="career_summary"
                  value={formData.career_summary || ''}
                  onChange={(e) => {
                    const words = e.target.value.trim() === '' ? 0 : e.target.value.trim().split(/\s+/).length;
                    if (words <= 200) handleChange('career_summary', e.target.value);
                  }}
                  placeholder="Décrivez votre parcours professionnel, vos expériences marquantes et votre expertise en droit..."
                  className="min-h-[120px]"
                  required
                />
                <p className={`text-sm ${(formData.career_summary?.trim() === '' || !formData.career_summary) ? false : formData.career_summary.trim().split(/\s+/).length >= 190 ? 'text-red-500 font-semibold' : 'text-gray-500'} text-gray-500`}>
                  {!formData.career_summary || formData.career_summary.trim() === '' ? 0 : formData.career_summary.trim().split(/\s+/).length} / 200 mots
                </p>
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label>Domaines de spécialisation *</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary" className="bg-emerald-100 text-emerald-800 pl-3 pr-2 py-1">
                      {specialty}
                      <button type="button" onClick={() => removeSpecialty(specialty)} className="ml-2 hover:text-emerald-600">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.filter(s => !formData.specialties.includes(s)).map(specialty => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Autre spécialité..."
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (customSpecialty.trim()) {
                        addSpecialty(customSpecialty.trim());
                        setCustomSpecialty('');
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="border-2 border-gray-200 shadow-md">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">Disponibilité</CardTitle>
              <CardDescription className="text-sm">Vos préférences pour les rencontres de mentorat</CardDescription>
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
                          ? "bg-[#1e5631] hover:bg-[#2d7a47]"
                          : "hover:bg-emerald-50"
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
            </CardContent>
          </Card>

          {/* Motivation */}
          <Card className="border-2 border-gray-200 shadow-md">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-[#1e5631] text-lg sm:text-xl">Motivation</CardTitle>
              <CardDescription className="text-sm">Partagez vos raisons de devenir mentor (500 mots maximum)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.motivation}
                onChange={(e) => {
                  const words = e.target.value.trim() === '' ? 0 : e.target.value.trim().split(/\s+/).length;
                  if (words <= 500) handleChange('motivation', e.target.value);
                }}
                placeholder="Expliquez pourquoi vous souhaitez devenir mentor et ce que vous espérez apporter aux mentorés..."
                className="min-h-[150px]"
                required
              />
              <p className={`text-sm mt-2 ${(formData.motivation.trim() === '' ? 0 : formData.motivation.trim().split(/\s+/).length) >= 480 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                {formData.motivation.trim() === '' ? 0 : formData.motivation.trim().split(/\s+/).length} / 500 mots
              </p>
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
                  {' '}du programme PASSERELLES, notamment les clauses d'intégrité éthique, l'interdiction du quid pro quo et du harcèlement, et le respect
                  des droits et de la dignité de chacun. *
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
                  {' '}de Ma Belle Promo et j'accepte que mes données personnelles soient traitées dans le cadre du programme de mentorat PASSERELLES (gestion des candidatures, appariement, suivi du programme). Je comprends que je peux exercer mes droits d'accès, de rectification et de suppression à tout moment en contactant contact@mabellepromo.org. *
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !formData.charter_accepted || !formData.rgpd_accepted || availableDays.length === 0 || !timeSlots}
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