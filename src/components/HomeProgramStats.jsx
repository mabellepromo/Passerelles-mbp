import React from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, ClipboardList, Star } from 'lucide-react';

const stats = [
  { value: 45, label: 'Candidatures reçues', icon: Users },
  { value: 11, label: 'Mentors engagés', icon: Users },
  { value: 11, label: 'Binômes formés (Cohorte 1)', icon: GraduationCap },
  { value: 0,  label: 'Séances réalisées', icon: ClipboardList },
  { value: '–', label: 'Satisfaction moyenne', icon: Star },
];

export default function HomeProgramStats() {
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
