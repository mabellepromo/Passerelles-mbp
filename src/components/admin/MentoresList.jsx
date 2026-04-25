import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NotificationMentoresModal from './NotificationMentoresModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, CheckCircle2, XCircle, Eye, Mail, Phone, GraduationCap,
  Target, Edit2, Clock, Pencil, Plus, Loader2, X, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MentoreEvaluation from './MentoreEvaluation';

const INTERESTS = [
  "Droit des affaires", "Droit pénal", "Droit civil", "Droit public",
  "Droit international", "Droit du travail", "Droit fiscal",
  "Magistrature", "Avocature", "Notariat", "Droit numérique",
  "Droits de l'homme", "Autres"
];

const CAREER_GOALS = [
  "Avocat", "Magistrat", "Notaire", "Juriste d'entreprise",
  "Enseignant-chercheur", "Fonctionnaire international",
  "Consultant juridique", "Huissier de justice", "Autres"
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  matched: 'bg-blue-100 text-blue-800',
  waitlist: 'bg-gray-100 text-gray-800'
};
const statusLabels = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  matched: 'Apparié',
  waitlist: "Liste d'attente"
};
const universityLabels = {
  universite_lome: 'Université de Lomé',
  universite_kara: 'Université de Kara',
  etablissement_prive: 'Établissement privé'
};

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', sexe: '',
  university: '', university_other: '', level: '', specialization: '',
  average_grade: '', career_goals: [], interests: [],
  availability: '', preferred_format: '', motivation_letter: '',
  civic_engagement: '', city: '', charter_accepted: false, status: 'pending'
};

function MentoreFormDialog({ mentore, open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mentore) {
      setForm({ ...EMPTY_FORM, ...mentore });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mentore, open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleArrayItem = (field, item) => {
    const arr = form[field] || [];
    set(field, arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) return;
    setSaving(true);
    try {
      const payload = { ...form, average_grade: form.average_grade ? Number(form.average_grade) : undefined };
      if (mentore?.id) {
        await base44.entities.Mentore.update(mentore.id, payload);
      } else {
        await base44.entities.Mentore.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!mentore?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4 text-purple-600" /> : <Plus className="h-4 w-4 text-purple-600" />}
            {isEdit ? 'Modifier le mentoré' : 'Inscrire un mentoré'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Identité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label>Nom complet *</Label>
              <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Prénom Nom" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Genre</Label>
              <Select value={form.sexe} onValueChange={v => set('sexe', v)}>
                <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homme">Homme</SelectItem>
                  <SelectItem value="femme">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+228 ..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Ville</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lomé..." />
            </div>
          </div>

          {/* Formation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label>Université</Label>
              <Select value={form.university} onValueChange={v => set('university', v)}>
                <SelectTrigger><SelectValue placeholder="Université..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="universite_lome">Université de Lomé</SelectItem>
                  <SelectItem value="universite_kara">Université de Kara</SelectItem>
                  <SelectItem value="etablissement_prive">Établissement privé</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              {form.university === 'autre' && (
                <Input className="mt-1" value={form.university_other}
                  onChange={e => set('university_other', e.target.value)} placeholder="Préciser..." />
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Niveau</Label>
              <Select value={form.level} onValueChange={v => set('level', v)}>
                <SelectTrigger><SelectValue placeholder="Niveau..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L3">Licence 3 (L3)</SelectItem>
                  <SelectItem value="M1">Master 1 (M1)</SelectItem>
                  <SelectItem value="M2">Master 2 (M2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Spécialisation</Label>
              <Input value={form.specialization} onChange={e => set('specialization', e.target.value)}
                placeholder="Droit privé, Droit public..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Moyenne /20</Label>
              <Input type="number" min="0" max="20" step="0.01"
                value={form.average_grade} onChange={e => set('average_grade', e.target.value)} />
            </div>
          </div>

          {/* Objectifs de carrière */}
          <div>
            <Label>Objectifs de carrière</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CAREER_GOALS.map(g => (
                <button key={g} type="button"
                  onClick={() => toggleArrayItem('career_goals', g)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.career_goals?.includes(g)
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-200'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Domaines d'intérêt */}
          <div>
            <Label>Domaines d'intérêt</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {INTERESTS.map(i => (
                <button key={i} type="button"
                  onClick={() => toggleArrayItem('interests', i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.interests?.includes(i)
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-200'
                  }`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Disponibilités */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Disponibilité</Label>
              <Select value={form.availability} onValueChange={v => set('availability', v)}>
                <SelectTrigger><SelectValue placeholder="Fréquence..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_par_mois">1 fois/mois</SelectItem>
                  <SelectItem value="2_par_mois">2 fois/mois</SelectItem>
                  <SelectItem value="1_par_semaine">1 fois/semaine</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format préféré</Label>
              <Select value={form.preferred_format} onValueChange={v => set('preferred_format', v)}>
                <SelectTrigger><SelectValue placeholder="Format..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentiel">Présentiel</SelectItem>
                  <SelectItem value="visio">Visioconférence</SelectItem>
                  <SelectItem value="mixte">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="matched">Apparié</SelectItem>
                  <SelectItem value="waitlist">Liste d'attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Textes libres */}
          <div>
            <Label>Engagement civique</Label>
            <Textarea rows={3} value={form.civic_engagement}
              onChange={e => set('civic_engagement', e.target.value)}
              placeholder="Associations, bénévolat, activités..." />
          </div>
          <div>
            <Label>Lettre de motivation</Label>
            <Textarea rows={5} value={form.motivation_letter}
              onChange={e => set('motivation_letter', e.target.value)}
              placeholder="Pourquoi souhaitez-vous intégrer le programme ?" />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !form.full_name || !form.email}
            className="bg-purple-600 hover:bg-purple-700 text-white">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</> : isEdit ? 'Enregistrer' : 'Inscrire'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MentoresList({ mentores }) {
  const [search, setSearch] = useState('');
  const [selectedMentore, setSelectedMentore] = useState(null);
  const [evaluatingMentore, setEvaluatingMentore] = useState(null);
  const [editingMentore, setEditingMentore] = useState(undefined);
  const [deletingMentore, setDeletingMentore] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Mentore.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentores'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mentore.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentores'] })
  });

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleToggleAll = (ids) => {
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);
  };
  const handleBulkStatusChange = async (status) => {
    if (!status || selectedIds.length === 0) return;
    await Promise.all(selectedIds.map(id => updateStatusMutation.mutateAsync({ id, status })));
    setSelectedIds([]);
    setBulkStatus('');
  };

  const filteredMentores = mentores
    .filter(m =>
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.university?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.selection_score ?? -1) - (a.selection_score ?? -1));

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle>Liste des Mentorés</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => setNotifOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap">
                <Mail className="h-4 w-4" /> Notifier
              </Button>
              <Button onClick={() => setEditingMentore(null)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap">
                <Plus className="h-4 w-4" /> Nouveau mentoré
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-blue-800">{selectedIds.length} sélectionné(s)</span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Changer le statut..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Acceptation</span></SelectItem>
                  <SelectItem value="rejected"><span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" />Refus</span></SelectItem>
                  <SelectItem value="waitlist"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" />Liste d'attente</span></SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!bulkStatus || updateStatusMutation.isPending}
                onClick={() => handleBulkStatusChange(bulkStatus)}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8">
                Appliquer
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-gray-500" onClick={() => setSelectedIds([])}>
                Annuler
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" className="rounded"
                      checked={selectedIds.length === filteredMentores.length && filteredMentores.length > 0}
                      onChange={() => handleToggleAll(filteredMentores.map(m => m.id))} />
                  </TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Université</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentores.map(mentore => (
                  <TableRow key={mentore.id} className={selectedIds.includes(mentore.id) ? 'bg-blue-50' : ''}>
                    <TableCell>
                      <input type="checkbox" className="rounded"
                        checked={selectedIds.includes(mentore.id)}
                        onChange={() => handleToggleSelect(mentore.id)} />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mentore.full_name}</p>
                        <p className="text-sm text-gray-500">{mentore.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {universityLabels[mentore.university] || mentore.university}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mentore.level}</Badge>
                    </TableCell>
                    <TableCell>
                      {mentore.selection_score ? (
                        <Badge variant="outline" className={`
                          ${mentore.selection_score >= 75 ? 'bg-green-50 text-green-700 border-green-300' :
                            mentore.selection_score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-300' :
                            'bg-red-50 text-red-700 border-red-300'}
                        `}>
                          {mentore.selection_score}/100
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">Non évalué</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[mentore.status]}>
                        {statusLabels[mentore.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mentore.created_date && format(new Date(mentore.created_date), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" title="Modifier"
                          onClick={() => setEditingMentore(mentore)}>
                          <Pencil className="h-4 w-4 text-purple-600" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Évaluer"
                          onClick={() => setEvaluatingMentore(mentore)}>
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Voir détails"
                          onClick={() => setSelectedMentore(mentore)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Supprimer"
                          onClick={() => setDeletingMentore(mentore)}>
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                        </Button>
                        {mentore.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => updateStatusMutation.mutate({ id: mentore.id, status: 'approved' })}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateStatusMutation.mutate({ id: mentore.id, status: 'rejected' })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMentores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun mentoré trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Detail Dialog (lecture seule) */}
        <Dialog open={!!selectedMentore} onOpenChange={() => setSelectedMentore(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du Mentoré</DialogTitle>
            </DialogHeader>
            {selectedMentore && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-purple-700">
                      {selectedMentore.full_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedMentore.full_name}</h3>
                    <Badge className={statusColors[selectedMentore.status]}>
                      {statusLabels[selectedMentore.status]}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="flex items-center gap-1.5"
                    onClick={() => { setSelectedMentore(null); setEditingMentore(selectedMentore); }}>
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" /><span>{selectedMentore.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" /><span>{selectedMentore.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="h-4 w-4" />
                    <span>{universityLabels[selectedMentore.university] || selectedMentore.university} — {selectedMentore.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Moyenne : {selectedMentore.average_grade || 'Non spécifié'}/20</span>
                  </div>
                </div>

                {selectedMentore.career_goals?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Objectifs de carrière</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMentore.career_goals.map(g => (
                        <Badge key={g} variant="secondary">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMentore.interests?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Domaines d'intérêt</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMentore.interests.map(i => (
                        <Badge key={i} className="bg-amber-100 text-amber-800">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMentore.civic_engagement && (
                  <div>
                    <h4 className="font-semibold mb-2">Engagement civique</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{selectedMentore.civic_engagement}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Lettre de motivation</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{selectedMentore.motivation_letter}</p>
                </div>

                {selectedMentore.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => { updateStatusMutation.mutate({ id: selectedMentore.id, status: 'approved' }); setSelectedMentore(null); }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approuver
                    </Button>
                    <Button variant="destructive" className="flex-1"
                      onClick={() => { updateStatusMutation.mutate({ id: selectedMentore.id, status: 'rejected' }); setSelectedMentore(null); }}>
                      <XCircle className="h-4 w-4 mr-2" /> Rejeter
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Evaluation Modal */}
        <MentoreEvaluation
          mentore={evaluatingMentore}
          isOpen={!!evaluatingMentore}
          onClose={() => setEvaluatingMentore(null)}
        />
      </Card>

      {/* Formulaire création / édition */}
      <MentoreFormDialog
        open={editingMentore !== undefined}
        mentore={editingMentore}
        onClose={() => setEditingMentore(undefined)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['mentores'] })}
      />

      {/* Confirmation suppression */}
      <AlertDialog open={!!deletingMentore} onOpenChange={() => setDeletingMentore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce mentoré ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-gray-800">{deletingMentore?.full_name}</span> ({deletingMentore?.email}) sera définitivement supprimé de la base de données. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { deleteMutation.mutate(deletingMentore.id); setDeletingMentore(null); }}>
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NotificationMentoresModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        mentores={mentores}
      />
    </>
  );
}
