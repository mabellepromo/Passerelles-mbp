import React, { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContactModal from '@/components/ContactModal';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { formatName } from '@/lib/formatName';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Award, BookOpen, Star, ChevronDown, ArrowRight,
  Mail, Phone, CheckCircle, Clock, Trophy, Target,
  Briefcase, GraduationCap, Globe, Heart, Shield, Zap, X, MapPin, Calendar, BookMarked,
  Paperclip, Upload, FileText, ExternalLink, Trash2, Loader2, Pencil, Lock } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import BinomeEditModal from '@/components/BinomeEditModal';

const STATS = [
{ label: "Candidatures reçues", value: "45", icon: Users, color: "bg-emerald-50 text-[#1e5631]" },
{ label: "Mentors engagés", value: "11", icon: Briefcase, color: "bg-blue-50 text-blue-700" },
{ label: "Mentorés sélectionnés", value: "11", icon: GraduationCap, color: "bg-purple-50 text-purple-700" },
{ label: "Taux de compétition", value: "4,1:1", icon: Trophy, color: "bg-rose-50 text-rose-700" },
{ label: "Systèmes d'aide à la décision + Pondéraion Comité", value: "4+1", icon: Zap, color: "bg-indigo-50 text-indigo-700" }];


const SECTIONS = [
{ id: "accueil", label: "Accueil" },
{ id: "binomes", label: "11 Binômes" },
{ id: "selectionnes", label: "Prochaines étapes" },
{ id: "reservistes", label: "Réservistes" },
{ id: "methodologie", label: "Méthodologie" },
{ id: "suite", label: "Et Ensuite ?" }];


// Helpers
const availabilityLabel = (val) => {
  const map = {
    weekday_morning: 'Matin semaine', weekday_afternoon: 'Après-midi semaine',
    weekday_evening: 'Soir semaine', weekend: 'Week-ends', flexible: 'Flexible'
  };
  return map[val] || val || 'Flexible';
};

const universityLabel = (val, other) => {
  if (val === 'universite_lome') return 'Univ. Lomé';
  if (val === 'universite_kara') return 'Univ. Kara';
  if (val === 'etablissement_prive') return other || 'Étab. privé';
  return val || '';
};

const cityLabel = (val, other) => {
  if (val === 'lome') return 'Lomé';
  if (val === 'kara') return 'Kara';
  if (val === 'autre') return other || 'Autre';
  return val || '';
};

// score ici est le match_score sur 100
const consensusTag = (score) => {
  if (score >= 90) return { tag: "Unanimité · 5/5 SAD + Comité MBP", color: "emerald" };
  if (score >= 78) return { tag: "Fort consensus · 4/5 SAD + Comité MBP", color: "blue" };
  return { tag: "Consensus · 3/5 SAD + Comité MBP", color: "amber" };
};

// Extrait le justificatif depuis le champ notes (texte après le premier "—")
const extractJustificatif = (notes) => {
  if (!notes) return null;
  // Le format est "Titre court — Justificatif. Détail mentor."
  // On retourne tout le texte des notes
  return notes;
};

const colorMap = {
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200"
};

function BinomeFichiers({ binomeId }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: fichiers = [] } = useQuery({
    queryKey: ['binome-fichiers', binomeId],
    queryFn: () => base44.entities.BinomeFichier.filter({ binome_id: binomeId })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BinomeFichier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['binome-fichiers', binomeId] })
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.BinomeFichier.create({ binome_id: binomeId, nom: file.name, file_url, type_fichier: file.type });
    queryClient.invalidateQueries({ queryKey: ['binome-fichiers', binomeId] });
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Fichiers joints ({fichiers.length})</span>
        </div>
        <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${uploading ? 'opacity-50 pointer-events-none' : 'bg-white border-gray-300 hover:border-[#1e5631] hover:text-[#1e5631]'}`}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Upload...' : 'Ajouter un fichier'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {fichiers.length === 0 ?
      <p className="text-xs text-gray-400 text-center py-3">Aucun fichier joint pour ce binôme</p> :
      <div className="space-y-2">
            {fichiers.map((f) =>
        <div key={f.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{f.nom}</span>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-[#1e5631] hover:text-[#2d7a47]">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button onClick={() => deleteMutation.mutate(f.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
        )}
          </div>
      }
    </div>);

}

function BinomeModal({ binome, mentor, mentore: mentoreInit, onClose, isAdmin, isAuthenticated, onEdit, onRefresh }) {
  if (!binome) return null;

  // Récupère le mentoré frais depuis la DB à chaque ouverture
  const { data: mentoreFresh } = useQuery({
    queryKey: ['mentore-fresh', binome.mentore_id || binome.mentore_email],
    queryFn: async () => {
      if (binome.mentore_id) {
        const list = await base44.entities.Mentore.filter({ id: binome.mentore_id });
        return list[0] || mentoreInit;
      }
      if (binome.mentore_email) {
        const list = await base44.entities.Mentore.filter({ email: binome.mentore_email });
        return list[0] || mentoreInit;
      }
      return mentoreInit;
    },
    staleTime: 0,
    gcTime: 0
  });
  const mentore = mentoreFresh || mentoreInit;

  const { tag, color } = consensusTag(binome.match_score || 0);
  const binomeTag = tag;

  return (
    <Dialog open={!!binome} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-[#1e5631] text-white p-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-emerald-200 text-sm font-medium">Score de compatibilité : {binome.match_score}/100</span>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs border ${colorMap[color]}`}>{binomeTag}</Badge>
              {isAdmin &&
              <button onClick={() => onEdit(binome)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all border border-white/30">
                  <Pencil className="h-3 w-3" /> Modifier
                </button>
              }
            </div>
          </div>
          <h2 className="text-xl font-bold font-playfair">Fiche Binôme Complète</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Mentor */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#1e5631] flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-bold text-[#1e5631] uppercase tracking-widest">Mentor(e)</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{formatName(binome.mentor_name)}</h3>
            <p className="text-sm text-gray-600 mb-4">{mentor?.profession || '—'}</p>
            <div className="grid grid-cols-2 gap-3">
              {mentor?.years_experience &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Award className="h-4 w-4 text-[#1e5631]" />
                  <span><strong>{mentor.years_experience}</strong> ans d'expérience</span>
                </div>
              }
              {mentor?.city &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-[#1e5631]" />
                  <span>{cityLabel(mentor.city, mentor.city_other)}</span>
                </div>
              }
              {mentor?.available_days?.length > 0 &&
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                  <Calendar className="h-4 w-4 text-[#1e5631]" />
                  <span>Jours : <strong>{mentor.available_days.join(', ')}</strong></span>
                </div>
              }
              {mentor?.time_slots &&
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                  <Clock className="h-4 w-4 text-[#1e5631]" />
                  <span>Créneaux : <strong>{mentor.time_slots}</strong></span>
                </div>
              }
              {mentor?.availability &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-[#1e5631]" />
                  <span>Flexibilité : <strong>{availabilityLabel(mentor.availability)}</strong></span>
                </div>
              }
              {mentor?.preferred_format &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-[#1e5631]" />
                  <span>Mode : <strong>{mentor.preferred_format === 'presentiel' ? 'Présentiel' : mentor.preferred_format === 'virtuel' ? 'En ligne' : 'Hybride'}</strong></span>
                </div>
              }
              {mentor?.phone && isAuthenticated &&
              <div className="flex items-center gap-2 text-sm col-span-2">
                  <Phone className="h-4 w-4 text-[#1e5631]" />
                  <a href={`tel:${mentor.phone}`} className="text-[#1e5631] hover:underline font-medium">{mentor.phone}</a>
                </div>
              }
              {mentor?.email && isAuthenticated &&
              <div className="flex items-center gap-2 text-sm col-span-2">
                  <Mail className="h-4 w-4 text-[#1e5631]" />
                  <a href={`mailto:${mentor.email}`} className="text-[#1e5631] hover:underline font-medium">{mentor.email}</a>
                </div>
              }
              {!isAuthenticated &&
              <div className="col-span-2 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Connectez-vous pour voir les coordonnées</span>
                </div>
              }
              {mentor?.organization &&
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                  <Briefcase className="h-4 w-4 text-[#1e5631]" />
                  <span>{mentor.organization}</span>
                </div>
              }
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-px bg-emerald-200 w-16" />
              <ArrowRight className="h-5 w-5 text-emerald-400" />
              <div className="h-px bg-emerald-200 w-16" />
            </div>
          </div>

          {/* Mentoré */}
          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Mentoré(e)</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{formatName(binome.mentore_name)}</h3>
            <p className="text-sm text-gray-600 mb-4">{mentore?.specialization || '—'}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {mentore?.level &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookMarked className="h-4 w-4 text-purple-600" />
                  <span>Niveau : <strong>{mentore.level}</strong></span>
                </div>
              }
              {mentore?.university &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <span>{universityLabel(mentore.university, mentore.university_other)}</span>
                </div>
              }
              {mentore?.city &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <span>{cityLabel(mentore.city, mentore.city_other)}</span>
                </div>
              }
              {mentore?.available_days?.length > 0 &&
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span>Jours : <strong>{mentore.available_days.join(', ')}</strong></span>
                </div>
              }
              {mentore?.time_slots &&
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span>Créneaux : <strong>{mentore.time_slots}</strong></span>
                </div>
              }
              {mentore?.availability &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span>Flexibilité : <strong>{availabilityLabel(mentore.availability)}</strong></span>
                </div>
              }
              {mentore?.preferred_format &&
              <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <span>Mode : <strong>{mentore.preferred_format === 'presentiel' ? 'Présentiel' : mentore.preferred_format === 'virtuel' ? 'En ligne' : 'Hybride'}</strong></span>
                </div>
              }
              {mentore?.phone && isAuthenticated &&
              <div className="flex items-center gap-2 text-sm col-span-2">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <a href={`tel:${mentore.phone}`} className="text-purple-700 hover:underline font-medium">{mentore.phone}</a>
                </div>
              }
              {mentore?.email && isAuthenticated &&
              <div className="flex items-center gap-2 text-sm col-span-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  <a href={`mailto:${mentore.email}`} className="text-purple-700 hover:underline font-medium">{mentore.email}</a>
                </div>
              }
              {!isAuthenticated &&
              <div className="col-span-2 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Connectez-vous pour voir les coordonnées</span>
                </div>
              }
            </div>

            {mentore?.career_goals?.length > 0 &&
            <div className="mb-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Objectifs de carrière</p>
                <p className="text-sm text-gray-700">{mentore.career_goals.join(', ')}{mentore.other_career_goal ? `, ${mentore.other_career_goal}` : ''}</p>
              </div>
            }

            {mentore?.civic_engagement &&
            <div className="mb-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Engagement civique & associatif</p>
                <p className="text-sm text-gray-700">{mentore.civic_engagement}</p>
              </div>
            }

            {mentore?.selection_score != null &&
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Score de sélection</span>
                  <span className="text-sm font-bold text-purple-700">{mentore.selection_score}/100</span>
                </div>
                <div className="w-full bg-purple-100 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${mentore.selection_score}%` }} />
                </div>
              </div>
            }

            {mentore?.motivation_letter &&
            <div className="bg-white rounded-xl p-4 border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">✉️ Lettre de motivation</p>
                <p className="text-sm text-gray-700 leading-relaxed italic">"{mentore.motivation_letter}"</p>
              </div>
            }
          </div>

          {/* Fichiers joints */}
          <BinomeFichiers binomeId={binome.id} />

          {/* Justificatif de l'appariement */}
          {binome.notes &&
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorMap[color]}`}>{binomeTag}</div>
                <span className="text-xs text-gray-400">Score de compatibilité : <strong className="text-gray-700">{binome.match_score}/100</strong></span>
              </div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-2">💬 Justificatif de l'appariement</p>
              <p className="text-sm text-emerald-900 leading-relaxed">{binome.notes}</p>
            </div>
          }
        </div>
      </DialogContent>
    </Dialog>);

}

export default function ResultatsCohorte1() {
  const [activeSection, setActiveSection] = useState("accueil");
  const [selectedBinome, setSelectedBinome] = useState(null);
  const [editingBinome, setEditingBinome] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const sectionRefs = useRef({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setIsAdmin(u?.role === 'admin');
      setUserEmail(u?.email || null);
    }).catch(() => {});
  }, []);

  // Détermine si l'utilisateur courant peut ouvrir la fiche d'un binôme
  const canView = (b) =>
    isAdmin ||
    (userEmail && (userEmail === b.mentor_email || userEmail === b.mentore_email));

  // Charger tous les binômes, mentors et mentorés via fonction publique (service role)
  const { data: cohorteData, isLoading } = useQuery({
    queryKey: ['cohorte1-public'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCohorte1Binomes', {});
      return res?.data ?? res;
    },
    staleTime: 60000,
    retry: 2
  });

  const binomes = cohorteData?.binomes || [];
  const mentors = cohorteData?.mentors || [];
  const mentores = cohorteData?.mentores || [];

  // Maps par email pour accès rapide
  const mentorByEmail = Object.fromEntries(mentors.map((m) => [m.email, m]));
  const mentoreByEmail = Object.fromEntries(mentores.map((m) => [m.email, m]));
  // Maps par id
  const mentorById = Object.fromEntries(mentors.map((m) => [m.id, m]));
  const mentoreById = Object.fromEntries(mentores.map((m) => [m.id, m]));

  const getMentor = (b) => mentorByEmail[b.mentor_email] || mentorById[b.mentor_id] || null;
  const getMentore = (b) => mentoreByEmail[b.mentore_email] || mentoreById[b.mentore_id] || null;

  // Charger tous les fichiers des binômes
  const { data: allFichiers = [] } = useQuery({
    queryKey: ['all-binome-fichiers'],
    queryFn: () => base44.entities.BinomeFichier.list(),
    staleTime: 0,
    gcTime: 0
  });

  // Map binome.id -> fichiers
  const fichiersByBinome = allFichiers.reduce((acc, f) => {
    if (!acc[f.binome_id]) acc[f.binome_id] = [];
    acc[f.binome_id].push(f);
    return acc;
  }, {});

  // Filtre pour n'afficher que les vrais binômes cohorte 1 (exclut ceux créés après importation)
  const cohorte1Binomes = binomes.
  filter((b) => b.mentor_id && b.mentore_id).
  sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  useEffect(() => {
    const handleScroll = () => {
      for (const id of SECTIONS.map((s) => s.id)) {
        const el = sectionRefs.current[id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) setActiveSection(id);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setRef = (id) => (el) => {sectionRefs.current[id] = el;};

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1e5631]" />
        </div>
        <Footer />
      </div>);

  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-white font-inter overflow-x-hidden">
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <NavBar />


      {/* HERO */}
      <section ref={setRef("accueil")} className="relative w-full bg-[#1e5631] text-white flex flex-col justify-center text-center px-4 py-6">
        <div className="my-48 opacity-10 absolute inset-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="mb-1 text-sm font-playfair leading-tight sm:text-2xl">
              Programme <span style={{ color: '#d4aa35' }}>PASSERELLES</span>
            </h1>
            <p className="text-base text-emerald-100 font-light mb-1">Résultats officiels — Cohorte 1</p>

            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {SECTIONS.filter((s) => s.id !== 'accueil').map((s) =>
              <button key={s.id} onClick={() => scrollTo(s.id)}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-all">
                  {s.label}
                </button>
              )}
            </div>
            <button onClick={() => scrollTo("binomes")} className="flex flex-col items-center gap-1.5 text-emerald-200 hover:text-white transition-colors mx-auto animate-bounce self-center">
              <span className="text-xs uppercase tracking-widest">Découvrir</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 11 BINÔMES */}
      <section ref={setRef("binomes")} className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2d1a 40%, #0d1f2d 70%, #111827 100%)' }}>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #1a7a45, transparent)' }} />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />

        <div className="w-full max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(26,122,69,0.2)', borderColor: 'rgba(26,122,69,0.4)', color: '#6ee7b7' }}>
              Cohorte 1 · 2026
            </div>
            <h2 className="text-4xl font-bold text-white font-playfair mb-3">
              Les {cohorte1Binomes.length} Binômes Officiels
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm">Consensus du SAD,   pondéré par le comité  MBP

            </p>
            <p className="text-slate-500 text-xs mt-2">
              ✦ Cliquez sur votre binôme pour voir la fiche complète ·
              <Lock className="inline h-3 w-3 mx-1 text-slate-600" />
              <span className="text-slate-600">Fiches privées pour les non-membres</span>
            </p>
          </div>

          {/* Binômes grid */}
          <div className="space-y-3">
            {cohorte1Binomes.map((b, i) => {
              const mentor = getMentor(b);
              const mentore = getMentore(b);
              const { tag, color } = consensusTag(b.match_score || 0);
              const scoreColor = color === 'emerald' ? '#10b981' : color === 'blue' ? '#3b82f6' : '#f59e0b';
              const scoreBg = color === 'emerald' ? 'rgba(16,185,129,0.15)' : color === 'blue' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)';
              const scoreBorder = color === 'emerald' ? 'rgba(16,185,129,0.35)' : color === 'blue' ? 'rgba(59,130,246,0.35)' : 'rgba(245,158,11,0.35)';
              const mentorInitials = b.mentor_name?.split(' ').slice(0, 2).map((w) => w[0]).join('') || '?';
              const mentoreInitials = b.mentore_name?.split(' ').slice(0, 2).map((w) => w[0]).join('') || '?';

              const viewable = canView(b);

              return (
                <motion.div key={b.id}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <div
                  onClick={viewable ? () => setSelectedBinome(b) : undefined}
                  className={`group rounded-2xl border transition-all duration-300 ${viewable ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default opacity-80'}`}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={viewable ? (e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.07)';e.currentTarget.style.borderColor = `${scoreColor}55`;} : undefined}
                  onMouseLeave={viewable ? (e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.04)';e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';} : undefined}>

                    {/* Layout mobile + tablette : vertical enrichi */}
                    <div className="flex lg:hidden flex-col p-4 gap-3">
                      {/* Header : numéro + score + verrou */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold font-playfair" style={{ color: scoreColor }}>#{i + 1}</span>
                          <div className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}` }}>
                            {color === 'emerald' ? '5/5 SAD ✓' : color === 'blue' ? '4/5 SAD ✓' : '3/5 SAD ✓'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center justify-center w-11 h-11 rounded-full border-2"
                          style={{ background: scoreBg, borderColor: scoreColor }}>
                            <span className="text-sm font-bold leading-none" style={{ color: scoreColor }}>{b.match_score}</span>
                            <span className="text-[8px] text-slate-400 leading-none">/100</span>
                          </div>
                          {viewable
                            ? <ArrowRight className="h-4 w-4 text-slate-500" />
                            : <Lock className="h-4 w-4 text-slate-600" title="Accès réservé" />
                          }
                        </div>
                      </div>
                      {/* Grille 2 colonnes : Mentor | Mentoré */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Mentor */}
                        <div className="flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: 'rgba(26,122,69,0.1)', border: '1px solid rgba(26,122,69,0.2)' }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
                          style={{ background: 'linear-gradient(135deg, #1a7a45, #0f5530)' }}>
                            {mentorInitials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 mb-0.5">
                              <Briefcase className="h-2.5 w-2.5 flex-shrink-0" style={{ color: '#6ee7b7' }} />
                              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#6ee7b7' }}>Mentor</span>
                            </div>
                            <p className="font-bold text-white text-sm leading-tight truncate">{formatName(b.mentor_name)}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{mentor?.profession || '—'}</p>
                            {mentor?.city && <p className="text-[10px] text-slate-500">{cityLabel(mentor.city, mentor.city_other)}</p>}
                          </div>
                        </div>
                        {/* Mentoré */}
                        <div className="flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                            {mentoreInitials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 mb-0.5">
                              <GraduationCap className="h-2.5 w-2.5 flex-shrink-0 text-violet-400" />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">Mentoré(e)</span>
                            </div>
                            <p className="font-bold text-white text-sm leading-tight truncate">{formatName(b.mentore_name)}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{mentore?.level ? `${mentore.level} · ` : ''}{mentore?.specialization || '—'}</p>
                            {mentore?.selection_score != null &&
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 rounded-full h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                  <div className="h-1 rounded-full" style={{ width: `${mentore.selection_score}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
                                </div>
                                <span className="text-[10px] font-bold text-violet-300">{mentore.selection_score}</span>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Layout desktop (≥1024px) : horizontal */}
                    <div className="hidden lg:flex items-center gap-0">
                      {/* Numéro */}
                      <div className="flex-shrink-0 w-12 h-full flex items-center justify-center py-5 px-3">
                        <span className="text-lg font-bold font-playfair" style={{ color: scoreColor }}>{i + 1}</span>
                      </div>
                      {/* Séparateur */}
                      <div className="w-px h-12 self-center" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      {/* MENTOR */}
                      <div className="flex-1 flex items-center gap-3 px-4 py-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                        style={{ background: 'linear-gradient(135deg, #1a7a45, #0f5530)' }}>
                          {mentorInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Briefcase className="h-3 w-3 flex-shrink-0" style={{ color: '#6ee7b7' }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6ee7b7' }}>Mentor</span>
                          </div>
                          <p className="font-bold text-white text-sm leading-tight truncate">{formatName(b.mentor_name)}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{mentor?.profession || '—'}</p>
                          <p className="text-[11px] text-slate-500">{mentor?.years_experience ? `${mentor.years_experience} ans` : ''}{mentor?.city ? ` · ${cityLabel(mentor.city, mentor.city_other)}` : ''}</p>
                        </div>
                      </div>
                      {/* Score central */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 mx-1">
                        <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center border-2"
                        style={{ background: scoreBg, borderColor: scoreColor }}>
                          <span className="text-lg font-bold leading-none" style={{ color: scoreColor }}>{b.match_score}</span>
                          <span className="text-[9px] text-slate-400 leading-none">/ 100</span>
                        </div>
                        <div className="mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-center leading-tight max-w-[80px]"
                        style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}` }}>
                          {color === 'emerald' ? '5/5 SAD ✓' : color === 'blue' ? '4/5 SAD ✓' : '3/5 SAD ✓'}
                        </div>
                      </div>
                      {/* MENTORÉ */}
                      <div className="flex-1 flex items-center gap-3 px-4 py-4 border-l" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                          {mentoreInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <GraduationCap className="h-3 w-3 flex-shrink-0 text-violet-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Mentoré(e)</span>
                          </div>
                          <p className="font-bold text-white text-sm leading-tight truncate">{formatName(b.mentore_name)}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{mentore?.level ? `${mentore.level} · ` : ''}{mentore?.specialization || '—'}</p>
                          {mentore?.selection_score != null &&
                          <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 rounded-full h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <div className="h-1 rounded-full" style={{ width: `${mentore.selection_score}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
                              </div>
                              <span className="text-[11px] font-bold text-violet-300">{mentore.selection_score}</span>
                            </div>
                          }
                        </div>
                      </div>
                      {/* Fichiers + flèche */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 pr-4 pl-2">
                        {fichiersByBinome[b.id]?.length > 0 &&
                        <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1">
                            {fichiersByBinome[b.id].map((f) =>
                          <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all"
                          style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                          onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(26,122,69,0.3)';e.currentTarget.style.color = '#6ee7b7';}}
                          onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.07)';e.currentTarget.style.color = '#94a3b8';}}>
                                <FileText className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="max-w-[60px] truncate">{f.nom}</span>
                              </a>
                          )}
                          </div>
                        }
                        {viewable
                          ? <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                          : (
                            <div title="Accès réservé aux membres du binôme et à l'administrateur"
                              className="flex flex-col items-center gap-1">
                              <Lock className="h-4 w-4 text-slate-600" />
                              <span className="text-[9px] text-slate-600 uppercase tracking-wide">Privé</span>
                            </div>
                          )
                        }
                      </div>
                    </div>

                  </div>
                </motion.div>);

            })}
          </div>

          {/* Légende */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {[
            { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', label: 'Unanimité · 5/5 SAD + Comité MBP' },
            { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', label: 'Fort consensus · 4/5 SAD + Comité MBP' },
            { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', label: 'Consensus · 3/5 SAD + Comité MBP' }].
            map((l) =>
            <div key={l.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: l.bg, border: `1px solid ${l.border}`, color: l.color }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROCHAINES ÉTAPES */}
      <section ref={setRef("selectionnes")} className="w-full py-10 px-4 bg-[#1e5631]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white font-playfair">📋 Prochaines étapes pour les mentorés</h2>
              <p className="text-emerald-300 text-xs mt-1">Démarrage officiel — Mai 2026</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
            { step: "1", title: "Confirmation", desc: "Confirmer votre participation par email avant le 07 Mai 2026" },
            { step: "2", title: "Prise de contact", desc: "Prenez l'initiative de contacter votre mentor — ses coordonnées vous ont été transmises. Présentez-vous brièvement : parcours, motivations et attentes." },
            { step: "3", title: "Objectifs SMART", desc: "Co-définir vos objectifs avec votre mentor lors de la 1ère séance" },
            { step: "4", title: "Démarrage", desc: "Lancement Mai 2026 · Minimum 2h/mois d'échange" }].
            map((s) =>
            <div key={s.step} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">{s.step}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  <p className="text-emerald-200 text-xs mt-0.5 leading-snug">{s.desc}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>



      {/* RÉSERVISTES */}
      <section ref={setRef("reservistes")} className="w-full py-10 px-4" style={{ background: '#f5f0e8' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border" style={{ background: 'rgba(180,120,20,0.1)', borderColor: 'rgba(180,120,20,0.3)', color: '#92600a' }}>⏳ Liste de réserve — Cohorte 1</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 font-playfair">Les 11 Réservistes</h2>
            <p className="text-gray-500 text-sm mt-1 max-w-2xl">Contactés en cas de désistement. Priorité absolue pour la Cohorte 2.</p>
          </div>

          {/* Graphical cards */}
          <div className="space-y-2">
            {[
            { rg: 12, name: "AMEGANVI Kossi Corneille Joël", s: "M", niv: "L3", etab: "UL", ai: 77.3, p: 77, domaine: "Droit privé · Droit numérique" },
            { rg: 13, name: "TOÏ Daniel Essognim", s: "M", niv: "L3", etab: "UL", ai: 66.9, p: 67, domaine: "Droit privé · Juriste d'entreprise" },
            { rg: 14, name: "KELOUWANI Yawo Lucien", s: "M", niv: "M1", etab: "ISDI", ai: 57.8, p: 58, domaine: "OHADA · Magistrature · Doctorat" },
            { rg: 15, name: "LAWSON-TOGLA Latevi Jonas-Théodore", s: "M", niv: "L3", etab: "UL", ai: 56.6, p: 57, domaine: "Droit privé · IT · Réseau" },
            { rg: 16, name: "DAVI Koffi Marcus", s: "M", niv: "M1", etab: "UL", ai: 56.6, p: 57, domaine: "Droit privé · Magistrature · Doctorat" },
            { rg: 17, name: "P'KLA Médéwa Raven Christian", s: "M", niv: "L3", etab: "ISDI", ai: 54.1, p: 54, domaine: "Droit public · Avocat" },
            { rg: 18, name: "AKOUETE-AKUE Adoudé Jecolia", s: "F", niv: "L3", etab: "ISDI", ai: 53.8, p: 54, domaine: "Droit privé · Avocate" },
            { rg: 19, name: "ANITEOU Ismaël", s: "M", niv: "L3", etab: "UL", ai: 53.1, p: 53, domaine: "Droit privé · Fiscalité · Judiciaire" },
            { rg: 20, name: "WOAYIKPO Akossia", s: "F", niv: "L3", etab: "UL", ai: 51.6, p: 52, domaine: "Droit privé · Droits humains" },
            { rg: 21, name: "AGBODENOU Kokou Marcelin", s: "M", niv: "L3", etab: "UL", ai: 49.4, p: 49, domaine: "Droit privé · Juriste d'entreprise" },
            { rg: 22, name: "MELENYA Abra Jeacqueline", s: "F", niv: "M2", etab: "ISDI", ai: 47.1, p: 47, domaine: "Droit public · Marchés Publics" }].
            map((row, i) => {
              const maxScore = 77;
              const pct = Math.round(row.p / maxScore * 100);
              const initials = row.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
              return (
                <motion.div key={row.rg} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-amber-100/60 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-0">
                      {/* Rang */}
                      <div className="flex-shrink-0 w-11 flex flex-col items-center justify-center py-4 px-2 bg-amber-50 border-r border-amber-100">
                        <span className="text-xs text-amber-400 font-semibold">#{row.rg}</span>
                      </div>

                      {/* Avatar + nom */}
                      <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                        style={{ background: row.s === 'F' ? 'linear-gradient(135deg, #db2777, #9d174d)' : 'linear-gradient(135deg, #b45309, #78350f)' }}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{row.name}</p>
                          <p className="text-xs text-gray-400 truncate">{row.domaine}</p>
                        </div>
                      </div>

                      {/* Badges niveau + étab */}
                      <div className="flex items-center gap-1.5 px-2 flex-shrink-0">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{row.niv}</span>
                        <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{row.etab}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.s === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{row.s === 'F' ? '♀' : '♂'}</span>
                      </div>

                      {/* Barre de score */}
                      <div className="hidden lg:flex flex-col justify-center px-4 flex-shrink-0 w-40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Score</span>
                          <span className="text-xs font-bold text-amber-700">{row.p}<span className="text-gray-400 font-normal">/100</span></span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-amber-100">
                          <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #f59e0b, #d97706)` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-gray-400">IA : {row.ai}</span>
                          <span className="text-[9px] text-gray-400">{pct}% du top</span>
                        </div>
                      </div>

                      {/* Flèche */}
                      <div className="flex-shrink-0 w-8 flex items-center justify-center text-amber-200 group-hover:text-amber-400 transition-colors pr-3">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>);

            })}
          </div>

          

          
        </div>
      </section>

      {/* MÉTHODOLOGIE */}
      <section ref={setRef("methodologie")} className="w-full px-4 py-10" style={{ background: '#f0ede8' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 font-playfair mb-1">🔬 Méthodologie de Sélection</h2>
            <p className="text-gray-500 text-sm">Grille de 100 pts · 4 systèmes d'aide à la décision + Pondération Comité</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Grille de 100 points</h3>
              <div className="space-y-2">
                {[
                { label: "Motivation", points: 30, color: "bg-emerald-500", desc: "Authenticité, clarté, alignement MBP" },
                { label: "Niveau d'études", points: 25, color: "bg-blue-500", desc: "Inscription, performance, pertinence" },
                { label: "Disponibilité", points: 20, color: "bg-purple-500", desc: "Calendrier, activités, engagement temps" },
                { label: "Engagement civique", points: 25, color: "bg-amber-500", desc: "Associatif, valeurs, leadership" }].
                map((c) =>
                <div key={c.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-gray-800 text-sm">{c.label}</span>
                      <span className="text-sm font-bold text-gray-700">{c.points} pts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div className={`${c.color} h-1.5 rounded-full`} style={{ width: `${c.points}%` }} />
                    </div>
                    <p className="text-xs text-gray-400">{c.desc}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3">Processus de décision</h3>
              <div className="space-y-2">
                {[
                { name: "Claude (Anthropic)", approach: "Appariement par domaines de spécialité", icon: "🤖" },
                { name: "Grok", approach: "Alignement de personnalité et complémentarité", icon: "⚡" },
                { name: "Deepseek", approach: "Potentiel de développement long terme", icon: "🔮" },
                { name: "Perplexity", approach: "Optimisation globale de la cohorte", icon: "🌐" },
                { name: "Pondération Comité MBP", approach: "Analyse croisée disponibilité + spécialité", icon: "✨" }].
                map((ia) =>
                <div key={ia.name} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
                    <span className="text-xl flex-shrink-0">{ia.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{ia.name}</p>
                      <p className="text-xs text-gray-400">{ia.approach}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ET ENSUITE */}
      <section ref={setRef("suite")} className="w-full py-10 px-4" style={{ background: '#e8e4dc' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 font-playfair mb-1">🚀 Et Ensuite ?</h2>
            <p className="text-gray-500 text-sm">Accédez à votre espace ou rejoignez la communauté</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl p-6 shadow-sm border border-white/60 hover:shadow-md transition-all flex flex-col" style={{ background: 'rgba(255,255,255,0.75)' }}>
              <Trophy className="h-8 w-8 text-emerald-600 mb-3" />
              <h3 className="font-bold text-gray-900 font-playfair mb-1 text-base">Mon Espace</h3>
              <p className="text-sm text-gray-500 mb-4 flex-1">Démarrage Mai 2026. Minimum 2h/mois. Durée : 1 année universitaire.</p>
              <Link to="/MonEspace">
                <Button className="w-full bg-[#1e5631] hover:bg-[#2d7a47] text-white text-sm">Accéder à Mon Espace</Button>
              </Link>
            </div>
            <div className="rounded-2xl p-6 shadow-sm border border-white/60 hover:shadow-md transition-all flex flex-col" style={{ background: 'rgba(255,255,255,0.75)' }}>
              <Clock className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-bold text-gray-900 font-playfair mb-1 text-base">Prochaine Cohorte</h3>
              <p className="text-sm text-gray-500 mb-4 flex-1">Réservistes et non-retenus : priorité à la Cohorte 2.</p>
              <button onClick={() => setContactOpen(true)} className="w-full">
                <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 text-sm">Me tenir informé(e)</Button>
              </button>
            </div>
            <div className="rounded-2xl p-6 shadow-sm border border-white/60 hover:shadow-md transition-all flex flex-col" style={{ background: 'rgba(255,255,255,0.75)' }}>
              <Heart className="h-8 w-8 text-rose-500 mb-3" />
              <h3 className="font-bold text-gray-900 font-playfair mb-1 text-base">Rejoindre MBP</h3>
              <p className="text-sm text-gray-500 mb-4 flex-1">Bénévolat, événements, réseau Alumni — Ma Belle Promo.</p>
              <button onClick={() => setContactOpen(true)} className="w-full">
                <Button variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 text-sm">Nous contacter</Button>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BINOME MODAL */}
      {selectedBinome &&
      <BinomeModal
        binome={selectedBinome}
        mentor={getMentor(selectedBinome)}
        mentore={getMentore(selectedBinome)}
        isAdmin={isAdmin}
        isAuthenticated={!!userEmail}
        onEdit={(b) => {setEditingBinome(b);setSelectedBinome(null);}}
        onClose={() => setSelectedBinome(null)}
        onRefresh={() => {
          queryClient.invalidateQueries({ queryKey: ['cohorte1-public'] });
        }} />

      }

      {/* EDIT MODAL — admin only, modifie directement les entités Mentor/Mentore/Binome */}
      {editingBinome &&
      <BinomeEditModal
        binome={editingBinome}
        mentor={getMentor(editingBinome)}
        mentore={getMentore(editingBinome)}
        onClose={() => setEditingBinome(null)}
        onSave={() => {
          queryClient.invalidateQueries({ queryKey: ['cohorte1-public'] });
          queryClient.invalidateQueries({ queryKey: ['mentore-fresh'] });
          setEditingBinome(null);
        }} />

      }

      <Footer />
    </div>);

}