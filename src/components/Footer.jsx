import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, UserCheck, GraduationCap, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ContactModal from '@/components/ContactModal';

const navLinks = [
  { label: 'Cohorte 1',  to: '/ResultatsCohorte1' },
  { label: 'Mon Espace', to: '/MonEspace' },
  { label: 'Messagerie', to: '/Messagerie' },
  { label: 'Journal',    to: '/JournalDeBord' },
  { label: 'À propos',   to: '/AProposMBP' },
];

const resources = [
  { label: 'Guide Mentor',  url: '/GuideMentor',              internal: true },
  { label: 'Guide Mentoré', url: '/GuideMentore',             internal: true },
  { label: 'Charte',        url: '/CharteEngagement',         internal: true },
  { label: 'Programme',     url: '/ProgrammeComplet',         internal: true },
  { label: 'Confidentialité', url: '/PolitiqueConfidentialite', internal: true },
];

export default function Footer() {
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [contactOpen,  setContactOpen]  = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin')).catch(() => {});
  }, []);

  return (
    <footer className="mt-auto text-white" style={{ background: '#0d1117' }}>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Filet or */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,#b8941f 30%,#d4aa35 50%,#b8941f 70%,transparent)' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Rangée principale : logo + liens ── */}
        <div className="py-4 flex flex-col items-center md:flex-row md:items-center gap-3 md:gap-0 border-b border-white/[0.06]">

          {/* Logo */}
          <div className="flex items-center gap-2.5 md:w-52 flex-shrink-0">
            <img src="/logo-mbp.png" alt="Ma Belle Promo" className="w-7 h-7 rounded-full flex-shrink-0"
              style={{ boxShadow: '0 0 0 1.5px rgba(184,148,31,0.5)' }} />
            <div className="leading-none">
              <span className="font-playfair font-bold text-sm" style={{ color: '#f97316' }}>Passerelles</span>
              <span className="text-slate-500 text-xs"> · Ma Belle Promo</span>
            </div>
          </div>

          {/* Liens nav + ressources */}
          <nav className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-1.5 flex-1">
            {navLinks.map(({ label, to }) => (
              <Link key={to} to={to}
                className="text-xs text-slate-400 hover:text-white transition-colors whitespace-nowrap">
                {label}
              </Link>
            ))}
            <span className="text-slate-700 hidden md:block">·</span>
            {resources.map(({ label, url }) => (
              <Link key={url} to={url}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Rangée bas : copyright · contact · boutons ── */}
        <div className="py-3 flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2">

          {/* Copyright */}
          <p className="text-[11px] text-slate-600 text-center sm:text-left">
            © 2026 Association Ma Belle Promo · Lomé, Togo
          </p>

          {/* Contact */}
          <div className="flex items-center gap-3">
            <a href="tel:+22896090707"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <Phone className="h-3 w-3 flex-shrink-0" style={{ color: '#d4aa35' }} />
              +228 96 09 07 07
            </a>
            <button onClick={() => setContactOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'rgba(212,170,53,0.12)', border: '1px solid rgba(212,170,53,0.25)', color: '#d4aa35' }}>
              <Mail className="h-3 w-3" /> Contact
            </button>
          </div>

          {/* Boutons candidature */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <Link to="/MentorRegistration"
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                  style={{ background: 'rgba(26,122,69,0.3)', border: '1px solid rgba(26,122,69,0.5)', color: '#6ee7b7' }}>
                  <UserCheck className="h-3 w-3" /> Devenir Mentor
                </Link>
                <Link to="/MentoreRegistration"
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                  style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)', color: '#c4b5fd' }}>
                  <GraduationCap className="h-3 w-3" /> Devenir Mentoré
                </Link>
              </>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-600 cursor-not-allowed">
                <Lock className="h-3 w-3" /> Candidatures closes
              </span>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
