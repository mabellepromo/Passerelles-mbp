import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle2, Star, Loader2, Trophy } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <button key={i} type="button" onClick={() => onChange(i)}
        className={`transition-colors ${i <= value ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400`}>
        <Star className="h-7 w-7 fill-current" />
      </button>
    ))}
    <span className="ml-2 text-sm text-gray-500 self-center">{value ? `${value}/5` : 'Non noté'}</span>
  </div>
);

const COMPETENCES = [
  'Rédaction juridique', 'Recherche juridique', 'Plaidoirie', 'Négociation',
  'Gestion de carrière', 'Réseautage professionnel', 'Droit des affaires',
  'Droit public', 'Droit pénal', 'Droit international', 'Confiance en soi', 'Communication'
];

export default function BilanFinal() {
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledBinomeId = urlParams.get('binome_id') || '';

  const [binomeId, setBinomeId] = useState(prefilledBinomeId);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    role_evaluateur: 'mentore',
    objectifs_atteints: 0,
    qualite_accompagnement: 0,
    satisfaction_globale: 0,
    competences_developpees: [],
    points_forts: '',
    axes_amelioration: '',
    recommanderait_programme: true,
    temoignage: ''
  });

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: binomes = [] } = useQuery({
    queryKey: ['binomes-bilan', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('getMyBinomes', {});
      return res.data?.binomes || [];
    },
    enabled: !!user?.email
  });

  const selectedBinome = binomes.find(b => b.id === binomeId);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.BilanFinal.create({
      ...data,
      binome_id: binomeId,
      mentor_name: selectedBinome?.mentor_name || '',
      mentore_name: selectedBinome?.mentore_name || '',
      mentor_email: selectedBinome?.mentor_email || '',
      mentore_email: selectedBinome?.mentore_email || '',
    }),
    onSuccess: () => setSubmitted(true)
  });

  const toggleCompetence = (c) => {
    setForm(prev => ({
      ...prev,
      competences_developpees: prev.competences_developpees.includes(c)
        ? prev.competences_developpees.filter(x => x !== c)
        : [...prev.competences_developpees, c]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-[#1e5631]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bilan soumis ! 🎉</h2>
              <p className="text-gray-600 mb-6">Merci pour votre retour. Votre évaluation contribue à améliorer le programme PASSERELLES.</p>
              <Link to={createPageUrl('MonEspace')}>
                <Button className="w-full bg-[#1e5631] hover:bg-[#2d7a47]">Retour à mon espace</Button>
              </Link>
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
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={[{ label: 'Mon Espace', to: '/MonEspace' }, { label: 'Bilan Final' }]} />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bilan de Fin de Programme</h1>
              <p className="text-emerald-200 text-sm">Évaluez votre expérience PASSERELLES</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {!user ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1e5631', borderTopColor: 'transparent' }} />
              <p className="text-sm text-gray-400">Chargement de vos binômes…</p>
            </div>
          </div>
        ) : binomes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Vous n'avez pas de binôme</p>
            <p className="text-sm mt-2">Retournez à votre espace pour plus d'informations</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Binôme & rôle */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Votre binôme *</Label>
                <Select value={binomeId} onValueChange={setBinomeId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez votre binôme" /></SelectTrigger>
                  <SelectContent>
                    {binomes.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.mentor_name} ↔ {b.mentore_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vous êtes *</Label>
                <Select value={form.role_evaluateur} onValueChange={v => setForm(p => ({ ...p, role_evaluateur: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentore">🎓 Mentoré(e)</SelectItem>
                    <SelectItem value="mentor">👨‍💼 Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Évaluation (1 à 5 étoiles)</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'objectifs_atteints', label: 'Objectifs atteints' },
                { key: 'qualite_accompagnement', label: "Qualité de l'accompagnement" },
                { key: 'satisfaction_globale', label: 'Satisfaction globale du programme' },
              ].map(item => (
                <div key={item.key} className="space-y-2">
                  <Label className="font-semibold">{item.label}</Label>
                  <StarRating value={form[item.key]} onChange={v => setForm(p => ({ ...p, [item.key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compétences */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Compétences développées</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COMPETENCES.map(c => (
                  <button key={c} type="button" onClick={() => toggleCompetence(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all font-medium ${
                      form.competences_developpees.includes(c)
                        ? 'bg-[#1e5631] text-white border-[#1e5631]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commentaires */}
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Retours qualitatifs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Points forts du programme</Label>
                <Textarea value={form.points_forts} onChange={e => setForm(p => ({ ...p, points_forts: e.target.value }))}
                  placeholder="Ce qui a le mieux fonctionné..." className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Axes d'amélioration</Label>
                <Textarea value={form.axes_amelioration} onChange={e => setForm(p => ({ ...p, axes_amelioration: e.target.value }))}
                  placeholder="Ce qui pourrait être amélioré..." className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Témoignage <span className="text-gray-400 font-normal">(optionnel, peut être partagé)</span></Label>
                <Textarea value={form.temoignage} onChange={e => setForm(p => ({ ...p, temoignage: e.target.value }))}
                  placeholder="Partagez votre expérience en quelques mots..." className="min-h-[100px]" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Label className="font-semibold flex-1">Recommanderiez-vous ce programme ?</Label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(p => ({ ...p, recommanderait_programme: true }))}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${form.recommanderait_programme ? 'bg-[#1e5631] text-white border-[#1e5631]' : 'bg-white text-gray-600 border-gray-200'}`}>
                    Oui 👍
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, recommanderait_programme: false }))}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border-2 ${!form.recommanderait_programme ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                    Non 👎
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={!binomeId || mutation.isPending}
            className="w-full bg-[#1e5631] hover:bg-[#2d7a47] h-12 text-base gap-2">
            {mutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...</>
              : <><CheckCircle2 className="h-4 w-4" /> Soumettre mon bilan</>
            }
          </Button>
        </form>
        )}
        </main>
        <Footer />
        </div>
        );
        }