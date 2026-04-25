import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Plus, Target, FileText, Lightbulb,
  BookMarked, Star, ChevronDown, ChevronUp, Edit2, Trash2,
  CheckCircle2, Clock, TrendingUp, Loader2, X, Filter, Search
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const TYPE_CONFIG = {
  note_seance:  { label: 'Note de séance',     icon: FileText,   color: 'blue',   bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700'   },
  compte_rendu: { label: 'Compte-rendu',        icon: BookMarked, color: 'emerald',bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700'},
  objectif:     { label: 'Objectif',            icon: Target,     color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  reflexion:    { label: 'Réflexion',           icon: Lightbulb,  color: 'amber',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
  ressource:    { label: 'Ressource partagée',  icon: Star,       color: 'rose',   bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700'   },
};

const STATUT_CONFIG = {
  en_cours:   { label: 'En cours',  color: 'bg-amber-100 text-amber-800'  },
  atteint:    { label: 'Atteint ✓', color: 'bg-emerald-100 text-emerald-800' },
  abandonne:  { label: 'Abandonné', color: 'bg-gray-100 text-gray-600'    },
};

const ROLE_LABELS = { mentor: '👨‍💼 Mentor', mentore: '🎓 Mentoré' };

export default function JournalDeBord() {
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledBinomeId = urlParams.get('binome_id') || '';

  const [selectedBinomeId, setSelectedBinomeId] = useState(prefilledBinomeId);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'note_seance', titre: '', contenu: '', date_entree: new Date().toISOString().split('T')[0],
    auteur_role: 'mentor', objectif_titre: '', objectif_statut: 'en_cours',
    objectif_progression: 0, objectif_echeance: '', visible_par: 'les_deux', tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: binomes = [] } = useQuery({
    queryKey: ['binomes-journal', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('getMyBinomes', {});
      return res.data?.binomes || [];
    },
    enabled: !!user?.email
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', selectedBinomeId],
    queryFn: () => selectedBinomeId
      ? base44.entities.JournalDeBord.filter({ binome_id: selectedBinomeId }, '-date_entree')
      : [],
    enabled: !!selectedBinomeId
  });

  const selectedBinome = binomes.find(b => b.id === selectedBinomeId);

  const createMutation = useMutation({
  mutationFn: (data) => editEntry
    ? base44.entities.JournalDeBord.update(editEntry.id, data)
    : base44.entities.JournalDeBord.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['journal', selectedBinomeId] });
    resetForm();
  },
  onError: (error) => {
    console.error('Erreur journal:', error);
    alert('Erreur: ' + (error?.message || JSON.stringify(error)));
  }
});

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JournalDeBord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal', selectedBinomeId] })
  });

  const resetForm = () => {
    setShowForm(false); setEditEntry(null);
    setFormData({ type: 'note_seance', titre: '', contenu: '', date_entree: new Date().toISOString().split('T')[0], auteur_role: 'mentor', objectif_titre: '', objectif_statut: 'en_cours', objectif_progression: 0, objectif_echeance: '', visible_par: 'les_deux', tags: [] });
    setTagInput('');
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setFormData({ type: entry.type, titre: entry.titre, contenu: entry.contenu || '', date_entree: entry.date_entree, auteur_role: entry.auteur_role, objectif_titre: entry.objectif_titre || '', objectif_statut: entry.objectif_statut || 'en_cours', objectif_progression: entry.objectif_progression || 0, objectif_echeance: entry.objectif_echeance || '', visible_par: entry.visible_par || 'les_deux', tags: entry.tags || [] });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  const data = {
    ...formData,
    binome_id: selectedBinomeId,
    mentor_name: selectedBinome?.mentor_name,
    mentore_name: selectedBinome?.mentore_name,
    mentor_email: selectedBinome?.mentor_email || '',
    mentore_email: selectedBinome?.mentore_email || '',
    // Nettoyer les dates vides
    objectif_echeance: formData.objectif_echeance || null,
    date_entree: formData.date_entree || null,
  };
  createMutation.mutate(data);
};

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(p => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const filteredEntries = entries
    .filter(e => filterType === 'all' || e.type === filterType)
    .filter(e => !searchQuery.trim() || 
      e.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.contenu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Stats
  const objectifs = entries.filter(e => e.type === 'objectif');
  const atteints = objectifs.filter(e => e.objectif_statut === 'atteint').length;
  const avgProgress = objectifs.length > 0 ? Math.round(objectifs.reduce((s, e) => s + (e.objectif_progression || 0), 0) / objectifs.length) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5dc]">
      <NavBar />
      <header className="bg-[#1e5631] text-white py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb items={[{ label: 'Mon Espace', to: '/MonEspace' }, { label: 'Journal de Bord' }]} />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Journal de Bord</h1>
              <p className="text-emerald-200 text-sm">Suivi des progrès · Notes · Objectifs</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {!user ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1e5631', borderTopColor: 'transparent' }} />
              <p className="text-sm text-gray-400">Chargement de vos binômes…</p>
            </div>
          </div>
        ) : binomes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Vous n'avez pas de binôme</p>
            <p className="text-sm mt-2">Retournez à votre espace pour plus d'informations</p>
          </div>
        ) : (
        <>
        {/* Sélection du binôme */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="font-semibold text-gray-700 flex-shrink-0">Binôme :</Label>
              <Select value={selectedBinomeId} onValueChange={setSelectedBinomeId}>
                <SelectTrigger className="flex-1 min-w-[200px]">
                  <SelectValue placeholder="Sélectionnez votre binôme" />
                </SelectTrigger>
                <SelectContent>
                  {binomes.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.mentor_name} ↔ {b.mentore_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBinomeId && (
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#1e5631] hover:bg-[#2d7a47] gap-2">
                  <Plus className="h-4 w-4" /> Nouvelle entrée
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedBinomeId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Entrées totales', value: entries.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Objectifs', value: objectifs.length, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Objectifs atteints', value: atteints, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Progression moy.', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(s => (
                <Card key={s.label} className="border-0 shadow-sm">
                  <CardContent className={`p-4 flex items-center gap-3 ${s.bg} rounded-xl`}>
                    <s.icon className={`h-5 w-5 ${s.color} flex-shrink-0`} />
                    <div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Barre de progression globale */}
            {objectifs.length > 0 && (
              <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-blue-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-700">Progression globale des objectifs</p>
                    <span className="text-lg font-bold text-[#1e5631]">{avgProgress}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${avgProgress}%` }} transition={{ duration: 0.8 }}
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-[#1e5631]" />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>{atteints}/{objectifs.length} objectifs atteints</span>
                    <span>{objectifs.filter(e => e.objectif_statut === 'en_cours').length} en cours</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulaire */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                  <Card className="border-2 border-[#1e5631] shadow-lg">
                    <CardHeader className="bg-[#1e5631] text-white py-4 px-6 flex flex-row items-center justify-between">
                      <CardTitle className="text-white text-base">{editEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}</CardTitle>
                      <button onClick={resetForm} className="text-emerald-200 hover:text-white"><X className="h-5 w-5" /></button>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Rédigé par *</Label>
                            <Select value={formData.auteur_role} onValueChange={v => setFormData(p => ({ ...p, auteur_role: v }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mentor">👨‍💼 Mentor</SelectItem>
                                <SelectItem value="mentore">🎓 Mentoré</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Date *</Label>
                            <Input type="date" value={formData.date_entree} onChange={e => setFormData(p => ({ ...p, date_entree: e.target.value }))} required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Titre *</Label>
                          <Input value={formData.titre} onChange={e => setFormData(p => ({ ...p, titre: e.target.value }))} placeholder="Ex : Séance #3 - Préparation CV" required />
                        </div>

                        <div className="space-y-2">
                          <Label>Contenu</Label>
                          <Textarea value={formData.contenu} onChange={e => setFormData(p => ({ ...p, contenu: e.target.value }))} placeholder="Décrivez le contenu, les échanges, les enseignements..." className="min-h-[120px]" />
                        </div>

                        {/* Champs spécifiques aux objectifs */}
                        {formData.type === 'objectif' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
                            <p className="text-sm font-semibold text-purple-800">🎯 Détails de l'objectif</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Statut</Label>
                                <Select value={formData.objectif_statut} onValueChange={v => setFormData(p => ({ ...p, objectif_statut: v }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="en_cours">⏳ En cours</SelectItem>
                                    <SelectItem value="atteint">✅ Atteint</SelectItem>
                                    <SelectItem value="abandonne">❌ Abandonné</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Échéance</Label>
                                <Input type="date" value={formData.objectif_echeance} onChange={e => setFormData(p => ({ ...p, objectif_echeance: e.target.value }))} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Progression : {formData.objectif_progression}%</Label>
                              <Slider min={0} max={100} step={5} value={[formData.objectif_progression]}
                                onValueChange={([v]) => setFormData(p => ({ ...p, objectif_progression: v }))}
                                className="w-full" />
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-2">
                          <Label>Tags</Label>
                          <div className="flex gap-2">
                            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Ajouter un tag..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="flex-1" />
                            <Button type="button" variant="outline" onClick={addTag}>Ajouter</Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <button onClick={() => setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}><X className="h-3 w-3" /></button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                          <Button type="submit" disabled={createMutation.isPending} className="bg-[#1e5631] hover:bg-[#2d7a47]">
                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {editEntry ? 'Mettre à jour' : 'Enregistrer'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans le journal (titre, contenu, tags)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1e5631] focus:ring-1 focus:ring-[#1e5631] shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-400" />
              <button onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterType === 'all' ? 'bg-[#1e5631] text-white border-[#1e5631]' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                Tous ({entries.length})
              </button>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                const count = entries.filter(e => e.type === k).length;
                if (count === 0) return null;
                return (
                  <button key={k} onClick={() => setFilterType(k)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterType === k ? `bg-${v.color}-600 text-white border-${v.color}-600` : `bg-white text-gray-600 border-gray-200 hover:border-${v.color}-300`}`}>
                    {v.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Entrées */}
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#1e5631]" /></div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Aucune entrée pour le moment</p>
                <p className="text-sm mt-1">Commencez par créer une note de séance ou un objectif</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredEntries.map((entry, i) => {
                    const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.note_seance;
                    const Icon = cfg.icon;
                    const isExpanded = expandedId === entry.id;
                    return (
                      <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card className={`border ${cfg.border} shadow-sm hover:shadow-md transition-shadow`}>
                          <CardContent className="p-0">
                            <div className={`p-4 ${cfg.bg} rounded-t-xl cursor-pointer`} onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm`}>
                                  <Icon className={`h-5 w-5 ${cfg.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-gray-900">{entry.titre}</p>
                                    <Badge className={`text-xs ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{cfg.label}</Badge>
                                    {entry.auteur_role && <Badge variant="outline" className="text-xs">{ROLE_LABELS[entry.auteur_role]}</Badge>}
                                    {entry.type === 'objectif' && entry.objectif_statut && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUT_CONFIG[entry.objectif_statut]?.color}`}>
                                        {STATUT_CONFIG[entry.objectif_statut]?.label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{entry.date_entree}</p>
                                    {entry.tags?.length > 0 && entry.tags.map(t => <span key={t} className="text-xs bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>)}
                                  </div>
                                  {/* Barre progression objectif */}
                                  {entry.type === 'objectif' && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex-1 bg-white rounded-full h-2">
                                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${entry.objectif_progression || 0}%` }} />
                                      </div>
                                      <span className="text-xs font-bold text-purple-700">{entry.objectif_progression || 0}%</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button onClick={e => { e.stopPropagation(); handleEdit(entry); }} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-700" /></button>
                                  <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(entry.id); }} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" /></button>
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isExpanded && entry.contenu && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden">
                                  <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.contenu}</p>
                                    {entry.type === 'objectif' && entry.objectif_echeance && (
                                      <p className="mt-3 text-xs text-purple-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Échéance : {entry.objectif_echeance}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {!selectedBinomeId && (
          <div className="text-center py-20 text-gray-400">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Sélectionnez un binôme pour accéder à son journal</p>
            <p className="text-sm mt-2">Notes de séances, comptes-rendus, objectifs et réflexions</p>
          </div>
        )}
        </>
        )}
        </main>
        <Footer />
        </div>
        );
        }