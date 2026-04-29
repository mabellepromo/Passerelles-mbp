import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import HomeProgramStats from '@/components/HomeProgramStats';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import {
  Mail, BookOpen, Plus, Users, Scale, ChevronRight, Award, GraduationCap,
  ArrowRight, Shield, Heart, Zap, CheckCircle, Calendar, Trophy, MessageCircle, LayoutDashboard
} from 'lucide-react';
import ContactModal from '@/components/ContactModal';

const piliers = [
  { icon: Shield,       label: 'Bienveillance', desc: 'Accompagnement volontaire et co-construit' },
  { icon: Users,        label: 'Équité',         desc: 'Accès égal, transparent, sans discrimination' },
  { icon: Scale,        label: 'Intégrité',      desc: 'Éthique et interdiction du quid pro quo dans ce programme' },
  { icon: Heart,        label: 'Responsabilité', desc: 'Engagements clairs et suivi régulier durant tout le processus' },
];

const documents = [
  { title: 'Programme Complet',     icon: '📄', url: '/ProgrammeComplet',   internal: true },
  { title: 'Guide du Mentor',       icon: '📗', url: '/GuideMentor',        internal: true },
  { title: 'Guide du Mentoré',      icon: '🎓', url: '/GuideMentore',       internal: true },
  { title: "Charte d'Engagement",   icon: '🤝', url: '/CharteEngagement',   internal: true },
  { title: 'Critères de Sélection', icon: '✅', url: 'https://drive.google.com/file/d/1tDekqPO1ygUMcgtQtWThebOqM92_53q1/view?usp=drive_link' },
];

const roles = [
  {
    image: '/Mentor%20mentore%20fille.png',
    tag: 'Espace binôme',
    title: 'Mon Espace Binôme',
    description: 'Consultez votre binôme, suivez votre progression et accédez à tous les outils du programme.',
    link: createPageUrl('MonEspace'),
    buttonText: 'Accéder à Mon Espace',
    color: '#1a7a45',
  },
  {
    image: 'https://images.unsplash.com/photo-1583026411217-9d05a70d5230?w=600&q=80&fit=crop&auto=format',
    tag: 'Suivi',
    title: 'Suivi Mensuel',
    description: 'Archive sécurisée de toutes vos rencontres. Créez et consultez vos fiches de suivi.',
    link: createPageUrl('MonSuivi'),
    buttonText: 'Accéder à mes Suivis',
    color: '#2563eb',
  },
  {
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80&fit=crop&auto=format',
    tag: 'Journal',
    title: 'Journal de Bord',
    description: 'Notez vos objectifs et réflexions dans un espace privé partagé avec votre binôme.',
    link: createPageUrl('JournalDeBord'),
    buttonText: 'Ouvrir mon Journal',
    color: '#7c3aed',
  },
];

const faqs = [
  { q: "C'est quoi « Passerelles » ?",       a: "Un programme de mentorat lancé par Ma Belle Promo pour accompagner des étudiants en droit au Togo dans leurs études et leur carrière." },
  { q: "Quels sont les 4 piliers ?",          a: "Bienveillance, Équité, Intégrité éthique et Responsabilité partagée. Tout est basé sur le respect et la transparence totale." },
  { q: "Qui peut être mentoré ?",             a: "Tout étudiant en L3, M1 ou M2 en droit à Lomé, Kara ou dans un établissement privé, motivé et prêt à s'investir activement." },
  { q: "Qui peut être mentor ?",              a: "Tout professionnel du droit avec au moins 5 ans d'expérience, animé par l'envie de transmettre et d'aider la nouvelle génération." },
  { q: "Est-ce payant ?",                     a: "Non ! C'est 100% bénévole, dans un esprit solidaire et sociétal de contribution à la société." },
  { q: "Durée du programme ?",               a: "Calquée sur l'année universitaire, avec au minimum 2 heures d'échange par mois entre le mentor et le mentoré." },
  { q: "Comment les binômes sont-ils formés ?", a: "On associe mentor et mentoré selon leurs spécialités, disponibilités et objectifs pour créer des paires harmonieuses." },
  { q: "Y a-t-il un suivi ?",                a: "Oui ! Une fiche de suivi mensuelle pour noter les progrès, succès et éventuels défis à surmonter." },
  { q: "En cas de problème ?",               a: "Tout signalement est pris très au sérieux. Contactez immédiatement MBP en toute confidentialité." },
  { q: "Certificat à la fin ?",              a: "Oui ! Un certificat officiel pour les mentorés et mentors ayant respecté leurs engagements." },
  { q: "Besoin d'aide ?",                    a: "Écrivez-nous à contact@mabellepromo.org ou appelez le +228 96 09 07 07. On répond rapidement !" },
  { q: "Quelle est la langue du programme ?", a: "Le programme se déroule entièrement en français, tant à l'oral que dans les documents et échanges écrits." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#ffffff' }}>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <NavBar />

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a2e18 0%, #0f5530 40%, #1a7a45 100%)' }}>
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1653566031587-74f7d86a2e71?w=1400&q=80&fit=crop&auto=format" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(10,46,24,0.92) 0%, rgba(15,85,48,0.88) 40%, rgba(26,122,69,0.82) 100%)' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Contenu gauche */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(184,148,31,0.4)', color: '#f0d060' }}>
                <Scale className="h-3 w-3" />
                Association Ma Belle Promo · Lomé, Togo
              </div>

              <h1 className="font-playfair font-bold leading-tight mb-4 text-white"
                style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)' }}>
                Façonnez l'avenir<br />
                <span style={{ color: '#d4aa35' }}>juridique</span> du Togo
              </h1>

              <p className="text-emerald-100/75 leading-relaxed mb-8 text-sm max-w-md">
                <strong className="text-white">Passerelles</strong> connecte les étudiants en droit avec des professionnels expérimentés pour un accompagnement structuré, éthique et transformateur.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link to={createPageUrl('MonEspace')}>
                  <Button className="font-semibold px-5 py-2.5 h-auto text-sm text-white hover:bg-white/20 transition-all"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    Mon Espace →
                  </Button>
                </Link>
                <Link to="/ResultatsCohorte1">
                  <Button className="font-semibold px-5 py-2.5 h-auto text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35)', color: 'white', border: 'none' }}>
                    Voir les binômes
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Carte résultats */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full">
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="px-5 py-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35)' }}>
                  <div className="flex items-center gap-2.5">
                    <Trophy className="h-5 w-5 text-white flex-shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm leading-none">Résultats officiels</p>
                      <p className="text-white/80 text-xs mt-0.5">Cohorte 1 · Programme PASSERELLES</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white flex-shrink-0">2026</span>
                </div>

                <div className="grid grid-cols-3 divide-x"
                  style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    { value: '45', label: 'candidatures reçues' },
                    { value: '11', label: 'binômes formés' },
                    { value: '4:1', label: 'taux de compétition' },
                  ].map((s) => (
                    <div key={s.label} className="py-4 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <p className="text-xl sm:text-2xl font-bold font-playfair text-white">{s.value}</p>
                      <p className="text-[10px] text-emerald-300 mt-0.5 leading-tight px-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-5 relative overflow-hidden" style={{ background: 'rgba(10,46,24,0.7)' }}>
                  <div className="absolute inset-0">
                    <img src="/Mentor%20mentore%20fille.png" alt=""
                      className="w-full h-full object-cover object-top opacity-15" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-300 font-medium">Démarrage officiel — 07 Mai 2026</span>
                    </div>
                    <div className="space-y-2 mb-5">
                      {[
                        '11 mentors professionnels engagés',
                        "4 systèmes d'aide à la décision utilisés avec pondération MBP pour une sélection transparente",
                        'Universités de Lomé, Kara & établissements privés',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-emerald-100/80">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <Link to="/ResultatsCohorte1" className="block">
                      <Button className="w-full font-bold text-sm py-2.5 h-auto transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35)', color: 'white', border: 'none' }}>
                        Voir les 11 binômes officiels
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 20C480 40 240 60 0 30L0 60Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ══════════ PILIERS ══════════ */}
      <section className="py-7 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {piliers.map((p, i) => (
              <motion.div key={p.label} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="p-4 sm:p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 transition-all duration-300 h-full"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                    style={{ background: '#f0fdf4' }}>
                    <p.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#1a7a45' }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1">{p.label}</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-6 px-4 sm:px-6" style={{ background: 'var(--brand-cream)' }}>
        <div className="max-w-6xl mx-auto">
          <HomeProgramStats />
        </div>
      </section>

      {/* ══════════ OUTILS ══════════ */}
      <section className="py-9 px-4 sm:px-6" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
              style={{ background: '#ecfdf5', color: '#1a7a45', border: '1px solid #a7f3d0' }}>
              <Zap className="h-3.5 w-3.5" /> Outils du programme
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-gray-900 mb-3">Votre espace de travail</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Tout ce dont vous avez besoin pour un mentorat structuré et efficace</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {roles.map((role, i) => (
              <motion.div key={role.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="border-0 overflow-hidden group h-full transition-all duration-500"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="relative overflow-hidden h-44 sm:h-52">
                      <img src={role.image} alt={role.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
                      <div className="absolute top-3 left-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ background: `${role.color}cc`, border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}>
                          {role.tag}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col flex-1">
                      <h3 className="text-base sm:text-lg font-bold font-playfair text-gray-900 mb-2">{role.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex-1 leading-relaxed">{role.description}</p>
                      <Link to={role.link}>
                        <Button className="w-full font-semibold text-sm transition-all"
                          style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}cc)`, color: 'white', border: 'none' }}>
                          {role.buttonText}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="py-9 px-4 sm:px-6" style={{ background: '#f8f9fa' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-gray-900 mb-3">Questions fréquentes</h2>
            <p className="text-gray-500 text-sm">Tout ce que vous devez savoir sur le programme PASSERELLES</p>
          </div>

          <div className="space-y-2 sm:columns-2 sm:gap-3 sm:space-y-0">
            {faqs.map((faq, index) => (
              <div key={index} className="break-inside-avoid mb-2">
                <div className="rounded-2xl overflow-hidden border transition-all duration-200"
                  style={{
                    background: 'white',
                    borderColor: openFaq === index ? '#a7f3d0' : '#f3f4f6',
                    boxShadow: openFaq === index ? '0 4px 20px rgba(26,122,69,0.08)' : 'none',
                  }}>
                  <button onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-4 py-3.5 flex justify-between items-center text-left hover:bg-emerald-50/60 transition-colors">
                    <span className="font-semibold text-xs text-gray-800 pr-3">{faq.q}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: openFaq === index ? '#1a7a45' : '#e8f5ee',
                        color: openFaq === index ? 'white' : '#1a7a45',
                        border: `1.5px solid ${openFaq === index ? '#1a7a45' : '#a7f3d0'}`,
                      }}>
                      <Plus className={`h-3 w-3 transition-transform duration-300 ${openFaq === index ? 'rotate-45' : ''}`} />
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-3 pt-1 text-xs text-gray-600 leading-relaxed border-t border-emerald-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
