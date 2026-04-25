import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Search, CheckCircle2, XCircle, Eye, Mail, Phone, Building,
  Briefcase, Pencil, Plus, Loader2, X, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SPECIALTIES = [
  "Droit des affaires", "Droit pénal", "Droit civil", "Droit public",
  "Droit international", "Droit du travail", "Droit fiscal",
  "Droit de la propriété intellectuelle", "Droit de l'environnement",
  "Droit numérique", "Droits de l'homme", "Droit administratif"
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  matched: 'bg-blue-100 text-blue-800'
};
const statusLabels = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  matched: 'Apparié'
};

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', sexe: '', profession: '',
  organization: '', years_experience: '', specialties: [],
  availability: '', preferred_format: '', motivation: '',
  city: '', linkedin_url: '', max_mentees: 1,
  charter_accepted: false, status: 'pending'
};

function MentorFormDialog({ mentor, open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (mentor) {
      setForm({ ...EMPTY_FORM, ...mentor });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mentor, open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addSpecialty = (s) => {
    const val = s || specialtyInput.trim();
    if (val && !form.specialties.includes(val)) {
      set('specialties', [...form.specialties, val]);
    }
    setSpecialtyInput('');
  };

  const removeSpecialty = (s) => set('specialties', form.specialties.filter(x => x !== s));

  const handleSave = async () => {
    if (!form.full_name || !form.email) return;
    setSaving(true);
    try {
      const payload = { ...form, years_experience: Number(form.years_experience) || 0, max_mentees: Number(form.max_mentees) || 1 };
      if (mentor?.id) {
        await base44.entities.Mentor.update(mentor.id, payload);
      } else {
        await base44.entities.Mentor.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!mentor?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4 text-emerald-600" /> : <Plus className="h-4 w-4 text-emerald-600" />}
            {isEdit ? 'Modifier le mentor' : 'Inscrire un mentor'}
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
          </div>

          {/* Profil pro */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label>Profession</Label>
              <Input value={form.profession} onChange={e => set('profession', e.target.value)} placeholder="Avocat, Magistrat..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Organisation</Label>
              <Input value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Cabinet, institution..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Années d'expérience</Label>
              <Input type="number" min="0" value={form.years_experience} onChange={e => set('years_experience', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Ville</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lomé..." />
            </div>
            <div className="col-span-2">
              <Label>LinkedIn (optionnel)</Label>
              <Input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          {/* Spécialités */}
          <div>
            <Label>Spécialités</Label>
            <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
              {form.specialties.map(s => (
                <span key={s} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {s}
                  <button type="button" onClick={() => removeSpecialty(s)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <Select onValueChange={addSpecialty}>
              <SelectTrigger><SelectValue placeholder="Ajouter une spécialité..." /></SelectTrigger>
              <SelectContent>
                {SPECIALTIES.filter(s => !form.specialties.includes(s)).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <Input value={specialtyInput} onChange={e => setSpecialtyInput(e.target.value)}
                placeholder="Autre spécialité personnalisée..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())} />
              <Button type="button" size="sm" variant="outline" onClick={() => addSpecialty()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
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
              <Label>Nb. max de mentorés</Label>
              <Input type="number" min="1" max="5" value={form.max_mentees} onChange={e => set('max_mentees', e.target.value)} />
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Motivation */}
          <div>
            <Label>Motivation</Label>
            <Textarea rows={4} value={form.motivation} onChange={e => set('motivation', e.target.value)}
              placeholder="Pourquoi souhaitez-vous devenir mentor ?" />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !form.full_name || !form.email}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</> : isEdit ? 'Enregistrer' : 'Inscrire'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MentorsList({ mentors }) {
  const [search, setSearch] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [editingMentor, setEditingMentor] = useState(undefined);
  const [deletingMentor, setDeletingMentor] = useState(null);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Mentor.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentors'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mentor.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentors'] })
  });

  const filteredMentors = mentors.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.profession?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle>Liste des Mentors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Rechercher..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => setEditingMentor(null)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap">
                <Plus className="h-4 w-4" /> Nouveau mentor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Expérience</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentors.map(mentor => (
                  <TableRow key={mentor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mentor.full_name}</p>
                        <p className="text-sm text-gray-500">{mentor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{mentor.profession}</TableCell>
                    <TableCell>{mentor.years_experience} ans</TableCell>
                    <TableCell className="capitalize">{mentor.city}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[mentor.status]}>
                        {statusLabels[mentor.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mentor.created_date && format(new Date(mentor.created_date), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" title="Modifier"
                          onClick={() => setEditingMentor(mentor)}>
                          <Pencil className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Voir détails"
                          onClick={() => setSelectedMentor(mentor)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Supprimer"
                          onClick={() => setDeletingMentor(mentor)}>
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                        </Button>
                        {mentor.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => updateStatusMutation.mutate({ id: mentor.id, status: 'approved' })}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateStatusMutation.mutate({ id: mentor.id, status: 'rejected' })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMentors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Aucun mentor trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Detail Dialog (lecture seule) */}
        <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du Mentor</DialogTitle>
            </DialogHeader>
            {selectedMentor && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-700">
                      {selectedMentor.full_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedMentor.full_name}</h3>
                    <Badge className={statusColors[selectedMentor.status]}>
                      {statusLabels[selectedMentor.status]}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="flex items-center gap-1.5"
                    onClick={() => { setSelectedMentor(null); setEditingMentor(selectedMentor); }}>
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" /><span>{selectedMentor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" /><span>{selectedMentor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span>{selectedMentor.profession} ({selectedMentor.years_experience} ans)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{selectedMentor.organization || 'Non spécifié'}</span>
                  </div>
                </div>

                {selectedMentor.career_summary && (
                  <div>
                    <h4 className="font-semibold mb-2">Parcours professionnel</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{selectedMentor.career_summary}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Spécialités</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMentor.specialties?.map(s => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Motivation</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{selectedMentor.motivation}</p>
                </div>

                {selectedMentor.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => { updateStatusMutation.mutate({ id: selectedMentor.id, status: 'approved' }); setSelectedMentor(null); }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approuver
                    </Button>
                    <Button variant="destructive" className="flex-1"
                      onClick={() => { updateStatusMutation.mutate({ id: selectedMentor.id, status: 'rejected' }); setSelectedMentor(null); }}>
                      <XCircle className="h-4 w-4 mr-2" /> Rejeter
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>

      {/* Formulaire création / édition */}
      <MentorFormDialog
        open={editingMentor !== undefined}
        mentor={editingMentor}
        onClose={() => setEditingMentor(undefined)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['mentors'] })}
      />

      {/* Confirmation suppression */}
      <AlertDialog open={!!deletingMentor} onOpenChange={() => setDeletingMentor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce mentor ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-gray-800">{deletingMentor?.full_name}</span> ({deletingMentor?.email}) sera définitivement supprimé de la base de données. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { deleteMutation.mutate(deletingMentor.id); setDeletingMentor(null); }}>
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
