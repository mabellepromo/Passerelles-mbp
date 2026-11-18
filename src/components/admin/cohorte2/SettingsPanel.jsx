// Réglages et binômes :
//   - interrupteur « Check-ins ouverts » (fermé : la page affiche « Le suivi
//     mensuel ouvrira bientôt », sauf pour le binôme test) ;
//   - activation binôme par binôme pour le pilote ;
//   - ajout d'un binôme de la cohorte 2 (mentor, mentoré, date de démarrage).
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { coordinationApi, errorText, fetchProfiles } from '@/lib/cohort2Data';

export default function SettingsPanel({ data, settings, refresh }) {
  const [mentorId, setMentorId] = useState('');
  const [mentoreId, setMentoreId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: profiles } = useQuery({ queryKey: ['cohorte2-profiles'], queryFn: fetchProfiles });

  const run = async (action, success) => {
    try {
      await action();
      toast.success(success);
      refresh();
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const toggleOpen = (open) => {
    const question = open
      ? 'Ouvrir les check-ins ? Les binômes activés pourront répondre avec leur lien.'
      : 'Fermer les check-ins ? Les liens afficheront « Le suivi mensuel ouvrira bientôt ».';
    if (window.confirm(question)) run(() => coordinationApi.setCheckinsOpen(open), open ? 'Check-ins ouverts.' : 'Check-ins fermés.');
  };

  const addBinome = () => run(async () => {
    await coordinationApi.createBinome(mentorId, mentoreId, startDate);
    setMentorId('');
    setMentoreId('');
  }, 'Binôme de la cohorte 2 créé.');

  const realBinomes = data.binomes.filter((b) => !b.is_test);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-800">Check-ins ouverts</p>
          <p className="text-xs text-gray-500">Fermé : la page des participants affiche « Le suivi mensuel ouvrira bientôt ». Le binôme test reste toujours ouvert.</p>
        </div>
        <Switch checked={Boolean(settings?.checkins_open)} onCheckedChange={toggleOpen} aria-label="Check-ins ouverts" />
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
        <p className="font-semibold text-gray-800">Binômes activés pour le check-in (pilote)</p>
        <p className="text-xs text-gray-500">Seuls les binômes activés peuvent répondre quand les check-ins sont ouverts.</p>
        {realBinomes.length === 0 && <p className="text-sm text-gray-500">Aucun binôme de la cohorte 2.</p>}
        {realBinomes.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 border-t border-gray-50 pt-2">
            <span className="text-sm text-gray-700">{b.mentor_name} / {b.mentore_name}</span>
            <Switch checked={b.checkin_enabled}
              onCheckedChange={(v) => run(() => coordinationApi.setCheckinEnabled(b.id, v), v ? 'Binôme activé.' : 'Binôme désactivé.')}
              aria-label={`Activer ${b.mentor_name} / ${b.mentore_name}`} />
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <p className="font-semibold text-gray-800">Ajouter un binôme à la cohorte 2</p>
        <div className="grid gap-2 md:grid-cols-3">
          <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
            <option value="">Mentor…</option>
            {(profiles?.mentors || []).map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          <select value={mentoreId} onChange={(e) => setMentoreId(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
            <option value="">Mentoré(e)…</option>
            {(profiles?.mentores || []).map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Démarrage <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Le binôme est créé en cohorte 2, non activé. Les fiches du mentor et du mentoré ne sont pas modifiées.
          Ajoutez ensuite ses 2 à 3 objectifs dans « Fiche binôme ».
        </p>
        <Button disabled={!mentorId || !mentoreId} onClick={addBinome}>Créer le binôme</Button>
      </section>
    </div>
  );
}
