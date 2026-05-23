import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, ClipboardList, Star } from 'lucide-react';
import { supabase } from '@/api/base44Client';

export default function HomeProgramStats() {
  const [seancesCount, setSeancesCount] = useState(0);
  const [avgSatisfaction, setAvgSatisfaction] = useState('–');

  useEffect(() => {
    supabase
      .from('suivi_mensuel')
      .select('satisfaction_mentor, satisfaction_mentore', { count: 'exact' })
      .then(({ data, count, error }) => {
        if (error || !data) return;
        setSeancesCount(count ?? data.length);
        if (data.length > 0) {
          const avg = data.reduce(
            (acc, s) => acc + ((s.satisfaction_mentor || 0) + (s.satisfaction_mentore || 0)) / 2,
            0
          ) / data.length;
          setAvgSatisfaction(`${avg.toFixed(1)}/5`);
        }
      });
  }, []);

  const stats = [
    { value: 45,           label: 'Candidatures reçues',        icon: Users },
    { value: 11,           label: 'Mentors engagés',             icon: Users },
    { value: 11,           label: 'Binômes formés (Cohorte 1)', icon: GraduationCap },
    { value: seancesCount, label: 'Séances réalisées',           icon: ClipboardList },
    { value: avgSatisfaction, label: 'Satisfaction moyenne',     icon: Star },
  ];

  return (
    <div className="py-8 bg-[#1e5631]">
      <div className="w-full max-w-5xl mx-auto px-4">
        <p className="text-center text-emerald-200 text-xs uppercase tracking-widest font-semibold mb-6">Le programme en chiffres</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center border border-white/20" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-white font-playfair leading-none">{s.value}</p>
              <p className="text-[11px] text-emerald-200 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
