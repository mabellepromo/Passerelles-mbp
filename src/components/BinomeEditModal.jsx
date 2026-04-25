import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BinomeEditModal({ binome, mentor, mentore, onClose, onSave }) {
  const [saving, setSaving] = useState(false);

  const [mentorForm, setMentorForm] = useState({
    full_name: mentor?.full_name || '',
    profession: mentor?.profession || '',
    years_experience: mentor?.years_experience || '',
    phone: mentor?.phone || '',
    email: mentor?.email || '',
    organization: mentor?.organization || '',
    city_other: mentor?.city_other || '',
    career_summary: mentor?.career_summary || '',
    available_days: (mentor?.available_days || []).join(', '),
    time_slots: mentor?.time_slots || '',
    availability: mentor?.availability || '',
    preferred_format: mentor?.preferred_format || '',
  });

  const [mentoreForm, setMentoreForm] = useState({
    full_name: mentore?.full_name || '',
    level: mentore?.level || '',
    specialization: mentore?.specialization || '',
    university_other: mentore?.university_other || '',
    phone: mentore?.phone || '',
    email: mentore?.email || '',
    selection_score: mentore?.selection_score || '',
    civic_engagement: mentore?.civic_engagement || '',
    motivation_letter: mentore?.motivation_letter || '',
    available_days: (mentore?.available_days || []).join(', '),
    time_slots: mentore?.time_slots || '',
    availability: mentore?.availability || '',
    preferred_format: mentore?.preferred_format || '',
  });

  const [binomeForm, setBinomeForm] = useState({
    notes: binome?.notes || '',
    match_score: binome?.match_score || '',
  });

  const setM = (key) => (e) => setMentorForm(f => ({ ...f, [key]: e.target.value }));
  const setMe = (key) => (e) => setMentoreForm(f => ({ ...f, [key]: e.target.value }));
  const setB = (key) => (e) => setBinomeForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [];

      if (mentor?.id) {
        console.log('📝 Saving Mentor:', mentor.id, {
          full_name: mentorForm.full_name,
          phone: mentorForm.phone,
          email: mentorForm.email,
        });
        promises.push(base44.entities.Mentor.update(mentor.id, {
          full_name: mentorForm.full_name,
          profession: mentorForm.profession,
          years_experience: Number(mentorForm.years_experience),
          phone: mentorForm.phone,
          email: mentorForm.email,
          organization: mentorForm.organization,
          city_other: mentorForm.city_other,
          career_summary: mentorForm.career_summary,
          available_days: mentorForm.available_days ? mentorForm.available_days.split(',').map(s => s.trim()).filter(Boolean) : [],
          time_slots: mentorForm.time_slots,
          availability: mentorForm.availability || undefined,
          preferred_format: mentorForm.preferred_format || undefined,
        }));
      }

      if (mentore?.id) {
        console.log('📝 Saving Mentore:', mentore.id, {
          full_name: mentoreForm.full_name,
          phone: mentoreForm.phone,
          email: mentoreForm.email,
        });
        promises.push(base44.entities.Mentore.update(mentore.id, {
          full_name: mentoreForm.full_name,
          level: mentoreForm.level,
          specialization: mentoreForm.specialization,
          university_other: mentoreForm.university_other,
          phone: mentoreForm.phone,
          email: mentoreForm.email,
          selection_score: Number(mentoreForm.selection_score),
          civic_engagement: mentoreForm.civic_engagement,
          motivation_letter: mentoreForm.motivation_letter,
          available_days: mentoreForm.available_days ? mentoreForm.available_days.split(',').map(s => s.trim()).filter(Boolean) : [],
          time_slots: mentoreForm.time_slots,
          availability: mentoreForm.availability || undefined,
          preferred_format: mentoreForm.preferred_format || undefined,
        }));
      }

      promises.push(base44.entities.Binome.update(binome.id, {
        notes: binomeForm.notes,
        match_score: Number(binomeForm.match_score),
        mentor_name: mentorForm.full_name,
        mentore_name: mentoreForm.full_name,
      }));

      await Promise.all(promises);
      setSaving(false);
      toast.success('✅ Données enregistrées avec succès !', { duration: 3000 });
      onSave();
    } catch (error) {
      setSaving(false);
      console.error('❌ Erreur lors de l\'enregistrement:', error);
      toast.error('❌ Erreur : ' + (error?.message || 'Enregistrement échoué'), { duration: 4000 });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-[#1e5631] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            <h2 className="text-lg font-bold font-playfair">Modifier le Binôme</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* MENTOR */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-[#1e5631] uppercase tracking-widest mb-3">👨‍💼 Mentor(e)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nom complet</label>
                <Input value={mentorForm.full_name} onChange={setM('full_name')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Profession</label>
                <Input value={mentorForm.profession} onChange={setM('profession')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Organisation</label>
                <Input value={mentorForm.organization} onChange={setM('organization')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Années d'expérience</label>
                <Input type="number" value={mentorForm.years_experience} onChange={setM('years_experience')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Téléphone</label>
                <Input value={mentorForm.phone} onChange={setM('phone')} placeholder="+228..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                <Input value={mentorForm.email} onChange={setM('email')} placeholder="email@..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Résumé de parcours</label>
                <Textarea rows={3} value={mentorForm.career_summary} onChange={setM('career_summary')} className="text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Jours disponibles (séparés par virgule)</label>
                <Input value={mentorForm.available_days} onChange={setM('available_days')} placeholder="Ex: Lundi, Vendredi, Samedi" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Créneaux horaires</label>
                <Input value={mentorForm.time_slots} onChange={setM('time_slots')} placeholder="Ex: Soirs semaine, Week-ends" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Flexibilité</label>
                <select value={mentorForm.availability} onChange={setM('availability')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                  <option value="">—</option>
                  <option value="weekday_morning">Matin semaine</option>
                  <option value="weekday_afternoon">Après-midi semaine</option>
                  <option value="weekday_evening">Soir semaine</option>
                  <option value="weekend">Week-ends</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Mode préféré</label>
                <select value={mentorForm.preferred_format} onChange={setM('preferred_format')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                  <option value="">—</option>
                  <option value="presentiel">Présentiel</option>
                  <option value="virtuel">En ligne</option>
                  <option value="mixte">Hybride</option>
                </select>
              </div>
            </div>
          </div>

          {/* MENTORÉ */}
          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200 space-y-3">
            <h3 className="text-sm font-bold text-purple-700 uppercase tracking-widest mb-3">🎓 Mentoré(e)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nom complet</label>
                <Input value={mentoreForm.full_name} onChange={setMe('full_name')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Niveau</label>
                <Input value={mentoreForm.level} onChange={setMe('level')} placeholder="L3, M1, M2..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Score /100</label>
                <Input type="number" value={mentoreForm.selection_score} onChange={setMe('selection_score')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Spécialisation</label>
                <Input value={mentoreForm.specialization} onChange={setMe('specialization')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Établissement (si privé)</label>
                <Input value={mentoreForm.university_other} onChange={setMe('university_other')} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Téléphone</label>
                <Input value={mentoreForm.phone} onChange={setMe('phone')} placeholder="+228..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                <Input value={mentoreForm.email} onChange={setMe('email')} placeholder="email@..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Engagement civique & associatif</label>
                <Input value={mentoreForm.civic_engagement} onChange={setMe('civic_engagement')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Lettre de motivation</label>
                <Textarea rows={5} value={mentoreForm.motivation_letter} onChange={setMe('motivation_letter')} className="text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Jours disponibles (séparés par virgule)</label>
                <Input value={mentoreForm.available_days} onChange={setMe('available_days')} placeholder="Ex: Mardi, Jeudi, Samedi" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Créneaux horaires</label>
                <Input value={mentoreForm.time_slots} onChange={setMe('time_slots')} placeholder="Ex: Soir Semaine" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Flexibilité</label>
                <select value={mentoreForm.availability} onChange={setMe('availability')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                  <option value="">—</option>
                  <option value="weekday_morning">Matin semaine</option>
                  <option value="weekday_afternoon">Après-midi semaine</option>
                  <option value="weekday_evening">Soir semaine</option>
                  <option value="weekend">Week-ends</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Mode préféré</label>
                <select value={mentoreForm.preferred_format} onChange={setMe('preferred_format')} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                  <option value="">—</option>
                  <option value="presentiel">Présentiel</option>
                  <option value="virtuel">En ligne</option>
                  <option value="mixte">Hybride</option>
                </select>
              </div>
            </div>
          </div>

          {/* BINÔME */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 space-y-3">
            <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-widest mb-3">🤝 Infos Binôme</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Score de compatibilité /100</label>
                <Input type="number" value={binomeForm.match_score} onChange={setB('match_score')} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Notes internes</label>
                <Textarea rows={2} value={binomeForm.notes} onChange={setB('notes')} className="text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose} className="gap-2">
              <X className="h-4 w-4" /> Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1e5631] hover:bg-[#2d7a47] text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}