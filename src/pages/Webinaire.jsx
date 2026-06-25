import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Calendar, Clock, Monitor, ArrowRight, Users, BookOpen, CheckCircle, MapPin, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import afficheImg from '@/assets/affiche-webinaire-assurance.png';

const intervenants = [
  {
    nom: 'Mary Jocelyne Bamba Koumagnanou',
    role: 'Directrice des Prestations',
    org: 'NSIA Assurances – Filiale Togo',
    bio: 'Elle connaît chaque rouage du système d\'assurance. Elle vous parlera du terrain et de cas réels.',
    type: 'Intervenante',
    photo: '/images/Jocelyne.webp',
  },
  {
    nom: 'Georges Kokou Koutoh',
    role: 'Directeur Risques d\'Entreprises & Réassurance',
    org: 'SanlamAllianz Togo · Enseignant-chercheur au CFBT, Expert Agréé',
    bio: 'Garant de la rigueur et du dialogue constructif entre intervenants et participants.',
    type: 'Modérateur',
    photo: '/images/Georges Koutoh.webp',
  },
  {
    nom: 'Augustin K. Akata',
    role: 'Directeur Santé, SanlamAllianz Togo',
    org: 'Enseignant indépendant à l\'ISDI, l\'UCAO et le CFBT',
    bio: 'Spécialiste de la santé assurantielle et formateur reconnu.',
    type: 'Intervenant',
    photo: '/images/Akata.webp',
  },
];

const themes = [
  {
    num: '01',
    titre: 'Les bases de l\'assurance',
    desc: 'Comment ça marche, pour qui, pourquoi ça compte — sans jargon inutile.',
  },
  {
    num: '02',
    titre: 'Types d\'assurances et utilité concrète',
    desc: 'Vie professionnelle et personnelle : quels contrats choisir et pourquoi.',
  },
];

const publics = [
  'Étudiants en droit',
  'Jeunes professionnels',
  'Entrepreneurs',
  'Toute personne souhaitant vraiment comprendre l\'assurance',
  'Alumni, mentors et mentorés du programme PASSERELLES',
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

const AFFICHE_URL = afficheImg;

function downloadAffiche() {
  fetch(AFFICHE_URL)
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'affiche-webinaire-assurance-mbp.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}

export default function Webinaire() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4 sm:px-6"
        style={{ background: 'linear-gradient(160deg, #0d1f4e 0%, #1a3a7a 50%, #0d1f4e 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(184,148,31,0.4)', color: '#f0d060' }}>
              <Calendar className="h-3 w-3" />
              Association Ma Belle Promo · Webinaire
            </div>

            <h1 className="font-playfair font-bold text-white mb-4 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
              Les Fondamentaux et l'Utilité Concrète<br />
              <span style={{ color: '#d4aa35' }}>de l'Assurance</span>
            </h1>

            <p className="text-blue-100/80 text-sm sm:text-base max-w-xl mx-auto mb-7 leading-relaxed">
              Une soirée d'experts pour comprendre l'assurance sans jargon — et faire les bons choix pour vous et vos projets.
            </p>

            {/* Infos clés */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-7">
              {[
                { icon: Calendar, label: 'Vendredi 26 juin 2026' },
                { icon: Clock, label: '18h30' },
                { icon: Monitor, label: 'Format hybride · Gratuit' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm font-semibold text-white">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: '#d4aa35' }} />
                  </div>
                  {label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <a href="https://www.mabellepromo.org/activites/webinaires" target="_blank" rel="noreferrer">
                <Button className="font-bold px-6 py-2.5 h-auto text-sm"
                  style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35)', color: 'white', border: 'none' }}>
                  S'inscrire maintenant <ArrowRight className="h-4 w-4 ml-1 inline" />
                </Button>
              </a>
              <Link to="/">
                <Button className="font-semibold px-5 py-2.5 h-auto text-sm"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}>
                  ← Retour à l'accueil
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L1440 40L1440 20C1200 40 960 0 720 15C480 30 240 40 0 20L0 40Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ══════════ AFFICHE + INFOS PRATIQUES ══════════ */}
      <section className="py-14 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* Affiche cliquable */}
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#b8941f' }}>Affiche officielle</p>
              <a href={AFFICHE_URL} target="_blank" rel="noreferrer" className="block group relative rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 8px 40px rgba(13,31,78,0.18)', border: '2px solid rgba(13,31,78,0.1)' }}>
                <img
                  src={AFFICHE_URL}
                  alt="Affiche officielle — Webinaire Assurance MBP 26 juin 2026"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{ display: 'block' }}
                />
                {/* overlay au survol */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(13,31,78,0.55)' }}>
                  <div className="flex flex-col items-center gap-2 text-white">
                    <ExternalLink className="h-8 w-8" />
                    <span className="text-sm font-semibold">Ouvrir en plein écran</span>
                  </div>
                </div>
              </a>
              {/* Boutons sous l'affiche */}
              <div className="flex gap-3 mt-4">
                <Button asChild className="flex-1 font-semibold text-sm h-auto py-2.5"
                  style={{ background: 'rgba(13,31,78,0.06)', color: '#0d1f4e', border: '1px solid rgba(13,31,78,0.15)' }}>
                  <a href={AFFICHE_URL} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-2" /> Voir l'affiche
                  </a>
                </Button>
                <Button className="flex-1 font-semibold text-sm h-auto py-2.5"
                  style={{ background: 'rgba(184,148,31,0.1)', color: '#b8941f', border: '1px solid rgba(184,148,31,0.3)' }}
                  onClick={downloadAffiche}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Télécharger
                </Button>
              </div>
            </motion.div>

            {/* Infos pratiques */}
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0d1f4e' }}>Informations pratiques</p>

              <div className="space-y-4 mb-7">
                {[
                  { icon: Calendar, label: 'Date', val: 'Vendredi 26 juin 2026' },
                  { icon: Clock, label: 'Heure', val: '18h30' },
                  { icon: Monitor, label: 'Format', val: 'Hybride — présentiel & Zoom (lien communiqué prochainement)' },
                  { icon: MapPin, label: 'Lieu présentiel', val: 'Centre de Formation Bancaire du Togo (CFBT) — Rue Dr Kalao, Tokoin Tamé, en face de la Résidence du Bénin, non loin de la Pharmacie Yembla' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex gap-4 items-start p-4 rounded-xl"
                    style={{ background: '#f8f9ff', border: '1px solid rgba(13,31,78,0.07)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(13,31,78,0.08)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#0d1f4e' }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm text-gray-800 font-medium leading-snug">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* QR code + inscription */}
              <div className="rounded-2xl p-6 text-center"
                style={{ background: 'linear-gradient(135deg, #0d1f4e, #1a3a7a)', boxShadow: '0 8px 32px rgba(13,31,78,0.2)' }}>
                <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#d4aa35' }}>Inscription gratuite</p>
                <img
                  src="/images/qr code.png"
                  alt="QR code inscription webinaire"
                  className="w-32 h-32 rounded-xl mx-auto mb-4"
                  style={{ border: '2px solid rgba(255,255,255,0.2)' }}
                />
                <p className="text-blue-100/70 text-xs mb-4">Scannez le QR code ou cliquez ci-dessous</p>
                <a href="https://www.mabellepromo.org/activites/webinaires" target="_blank" rel="noreferrer">
                  <Button className="font-bold px-8 py-3 h-auto text-sm w-full"
                    style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35)', color: 'white', border: 'none' }}>
                    S'inscrire maintenant <ArrowRight className="h-4 w-4 ml-1 inline" />
                  </Button>
                </a>
                <p className="text-blue-100/50 text-xs mt-4">
                  Infos : <strong className="text-blue-100/80">+228 96 09 07 07</strong>
                  {' · '}
                  <a href="https://www.facebook.com/mabellepromo" target="_blank" rel="noreferrer"
                    className="underline hover:text-white transition-colors">
                    facebook.com/mabellepromo
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ THÉMATIQUES ══════════ */}
      <section className="py-12 px-4 sm:px-6" style={{ background: '#f8f9fa' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-3"
              style={{ background: '#ecfdf5', color: '#1a7a45', border: '1px solid #a7f3d0' }}>
              <BookOpen className="h-3.5 w-3.5" /> Programme
            </div>
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-gray-900">Deux thématiques au programme</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {themes.map((t, i) => (
              <motion.div key={t.num} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="rounded-2xl p-6 h-full"
                  style={{ background: 'white', border: '1px solid rgba(13,31,78,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <span className="text-3xl font-bold font-playfair" style={{ color: 'rgba(13,31,78,0.12)' }}>{t.num}</span>
                  <h3 className="font-bold text-gray-900 mt-1 mb-2 text-sm sm:text-base">{t.titre}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Vous découvrirez */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="rounded-2xl p-6 sm:p-8 space-y-3 mt-6"
              style={{ background: 'white', border: '1px solid rgba(13,31,78,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0d1f4e' }}>Vous découvrirez</p>
              {[
                'Les bases de l\'assurance : comment ça marche, pour qui, pourquoi ça compte.',
                'Les types d\'assurances et leur utilité concrète dans votre vie professionnelle et personnelle.',
                'Comment faire les bons choix sans vous laisser dépasser par la complexité.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#1a7a45' }} />
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ INTERVENANTS ══════════ */}
      <section className="py-14 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-3"
              style={{ background: 'rgba(13,31,78,0.05)', color: '#0d1f4e', border: '1px solid rgba(13,31,78,0.12)' }}>
              <Users className="h-3.5 w-3.5" /> Intervenants
            </div>
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl text-gray-900">Vos experts du soir</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {intervenants.map((p, i) => (
              <motion.div key={p.nom} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="rounded-2xl overflow-hidden h-full flex flex-col text-center"
                  style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                  <div className="relative overflow-hidden" style={{ height: '200px', background: '#f0f2f8' }}>
                    <img src={p.photo} alt={p.nom} className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)' }} />
                  </div>
                  <div className="pb-2 px-4 -mt-1 text-center" style={{ background: 'white' }}>
                    <span className="inline-block mt-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                      style={{
                        background: p.type === 'Modérateur' ? 'rgba(184,148,31,0.12)' : 'rgba(26,122,69,0.1)',
                        color: p.type === 'Modérateur' ? '#b8941f' : '#1a7a45',
                        border: `1px solid ${p.type === 'Modérateur' ? 'rgba(184,148,31,0.3)' : 'rgba(26,122,69,0.2)'}`,
                      }}>
                      {p.type}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{p.nom}</h3>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#0d1f4e' }}>{p.role}</p>
                    <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">{p.org}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mt-auto">{p.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PUBLIC CIBLE ══════════ */}
      <section className="py-12 px-4 sm:px-6" style={{ background: '#f8f9fa' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="rounded-2xl p-6 sm:p-8"
              style={{ background: 'linear-gradient(135deg, #0d1f4e, #1a3a7a)', boxShadow: '0 8px 32px rgba(13,31,78,0.2)' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#d4aa35' }}>Qui devrait venir ?</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {publics.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#d4aa35' }} />
                    <span className="text-sm text-blue-50/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
