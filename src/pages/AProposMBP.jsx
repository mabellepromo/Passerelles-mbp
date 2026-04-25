import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Heart, Users, BookOpen, Target, ArrowRight, Quote } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContactModal from '@/components/ContactModal';

const fade  = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay } });
const fadeX = (x, delay = 0) => ({ initial: { opacity: 0, x }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay } });

const VALEURS = [
  { emoji: '🤝', title: 'Amitié & Solidarité',  desc: 'Tisser des liens durables entre membres de la promotion dans un esprit de fraternité et d\'entraide mutuelle.' },
  { emoji: '💡', title: 'Échange & Partage',     desc: 'Mettre à disposition nos expériences, compétences et réseaux au profit des étudiants et futurs diplômés.' },
  { emoji: '⚖️', title: 'Équité & Réciprocité', desc: 'Agir dans la justice et la transparence, en donnant à chacun les moyens d\'évoluer et de s\'épanouir.' },
];

const SOUTIENS = [
  { icon: MapPin, label: 'En personne',    detail: 'Ma Belle Promo\n12 BP 335 Baguida, Togo' },
  { icon: Phone,  label: 'TMoney',         detail: '90 05 36 06 · 90 03 63 43' },
  { icon: Phone,  label: 'Flooz',          detail: '96 02 00 00 · 99 41 91 92' },
  { icon: Mail,   label: 'Email',          detail: 'contact@mabellepromo.org', isContact: true },
];

export default function AProposMBP() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-dm" style={{ background: '#f8f9fa' }}>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <NavBar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a2e18 0%, #0f5530 45%, #1a7a45 100%)' }}>
        {/* Grille */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Photo fond */}
        <div className="absolute inset-0 opacity-15">
          <img src="https://static.wixstatic.com/media/287af0_e6fbe7015aa84b02bb15ea2567f63398~mv2.png/v1/fill/w_1920,h_661,al_c,q_90,enc_avif,quality_auto/287af0_e6fbe7015aa84b02bb15ea2567f63398~mv2.png"
            alt="" className="w-full h-full object-cover object-center" />
        </div>
        {/* Glow or */}
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle,#d4aa35,transparent)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center">
          <motion.div {...fade(0)}>
            {/* Logo */}
            <div className="mb-6 relative inline-block">
              <div className="absolute inset-0 rounded-full blur-xl opacity-40" style={{ background: '#d4aa35', transform: 'scale(1.3)' }} />
              <img src="/logo-mbp.png" alt="Ma Belle Promo"
                className="relative w-20 h-20 rounded-full object-cover"
                style={{ boxShadow: '0 0 0 3px rgba(212,170,53,0.6), 0 0 0 6px rgba(212,170,53,0.15)' }} />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: 'rgba(212,170,53,0.15)', border: '1px solid rgba(212,170,53,0.4)', color: '#fde68a' }}>
              Promotion 1994 – 2000 · Faculté de Droit de Lomé
            </div>

            <h1 className="font-playfair font-bold text-white leading-tight mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)' }}>
              Ma Belle Promo
            </h1>
            <p className="text-emerald-200 text-base max-w-xl mx-auto leading-relaxed">
              Association des diplômés de la Faculté de Droit de Lomé, unie par l'amitié, la solidarité et l'ambition de transformer l'avenir juridique du Togo.
            </p>

            {/* Ligne or */}
            <div className="mt-8 h-px w-24 mx-auto" style={{ background: 'linear-gradient(90deg,transparent,#d4aa35,transparent)' }} />
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48L1440 48L1440 24C1200 48 960 0 720 16C480 32 240 48 0 24L0 48Z" fill="#f8f9fa" />
          </svg>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Image */}
            <motion.div {...fadeX(-24, 0)}>
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl opacity-10" style={{ background: 'linear-gradient(135deg,#0f5530,#d4aa35)' }} />
                <img
                  src="https://static.wixstatic.com/media/287af0_e59f560466a6428dabb88a45981aaf82~mv2.jpg/v1/fill/w_980,h_583,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/287af0_e59f560466a6428dabb88a45981aaf82~mv2.jpg"
                  alt="Mission MBP"
                  className="relative rounded-2xl w-full object-cover shadow-xl"
                  style={{ maxHeight: 340 }} />
                {/* Overlay badge */}
                <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#0f5530,#1a7a45)', border: '2px solid rgba(212,170,53,0.4)' }}>
                  🎓 Faculté de Droit de Lomé
                </div>
              </div>
            </motion.div>

            {/* Texte */}
            <motion.div {...fadeX(24, 0.1)}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#1a7a45,#0f5530)' }} />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Notre mission</span>
              </div>
              <h2 className="font-playfair font-bold text-gray-900 text-3xl mb-6 leading-tight">
                Relier une génération<br />à la suivante
              </h2>

              {/* Citation */}
              <div className="relative mb-6 pl-5 border-l-2 border-emerald-200">
                <Quote className="absolute -top-1 -left-3 h-5 w-5 text-emerald-300" />
                <p className="text-gray-500 text-sm italic leading-relaxed">
                  « Échange, partage et réciprocité sont les valeurs qui animent Ma Belle Promo. »
                </p>
              </div>

              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  Ma Belle Promo a pour mission de regrouper les diplômés de la Faculté de Droit de Lomé autour des valeurs d'<strong className="text-gray-800">amitié, de solidarité et d'entraide</strong> — constituant un réseau exclusif pour développer les contacts personnels et professionnels de ses membres.
                </p>
                <p>
                  À la FDD, nous avons vocation à être des <strong className="text-gray-800">ambassadeurs de l'institution</strong> et, du fait de nos expériences et talents, à constituer une source d'inspiration et des ressources pour les futurs diplômés.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VISION ── */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Texte */}
            <motion.div {...fadeX(-24, 0)} className="order-2 lg:order-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#1a7a45,#0f5530)' }} />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Notre vision</span>
              </div>
              <h2 className="font-playfair font-bold text-gray-900 text-3xl mb-6 leading-tight">
                Un cadre identifié<br />pour aider les jeunes
              </h2>

              <div className="space-y-4 text-gray-600 text-sm leading-relaxed mb-6">
                <p>
                  La vision première de MBP est d'être le cadre clairement identifié pour <strong className="text-gray-800">aider les jeunes étudiants</strong> qui veulent durablement impacter leur vie dans les choix et projets déterminants pour leur avenir.
                </p>
                <p>
                  Pour cela, MBP doit leur fournir les clés et idéalement des moyens pour accompagner ces choix — en agrégeant ses compétences et expériences collectives.
                </p>
              </div>

              {/* Objectif 5 ans */}
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(15,85,48,0.06),rgba(26,122,69,0.04))', border: '1.5px solid rgba(15,85,48,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Objectif d'ici 5 ans</p>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Que <strong>3 étudiants des FDD sur 5</strong> nous identifient clairement et soient au courant d'au moins une de nos actions parce qu'ils auront été impactés positivement par l'une d'elles.
                </p>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div {...fadeX(24, 0.1)} className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl opacity-10" style={{ background: 'linear-gradient(135deg,#d4aa35,#0f5530)' }} />
                <img
                  src="https://static.wixstatic.com/media/287af0_09c89a32f6ed445cb6e48e92e2d6cc62~mv2.jpg/v1/fill/w_489,h_519,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/287af0_09c89a32f6ed445cb6e48e92e2d6cc62~mv2.jpg"
                  alt="Vision MBP"
                  className="relative rounded-2xl w-full object-cover shadow-xl"
                  style={{ maxHeight: 360 }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALEURS ── */}
      <section className="py-16 px-4 sm:px-6" style={{ background: '#f8f9fa' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade(0)} className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,transparent,#1a7a45)' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Ce qui nous définit</span>
              <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,#1a7a45,transparent)' }} />
            </div>
            <h2 className="font-playfair font-bold text-gray-900 text-3xl">Nos Valeurs</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {VALEURS.map((v, i) => (
              <motion.div key={i} {...fade(i * 0.1)}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                  {/* Accent top */}
                  <div className="h-1 w-10 rounded-full mb-5" style={{ background: 'linear-gradient(90deg,#1a7a45,#d4aa35)' }} />
                  <div className="text-3xl mb-4">{v.emoji}</div>
                  <h3 className="font-playfair font-bold text-gray-900 text-base mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOUTIEN ── */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">

          <motion.div {...fade(0)} className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,transparent,#1a7a45)' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Contribuer</span>
              <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,#1a7a45,transparent)' }} />
            </div>
            <h2 className="font-playfair font-bold text-gray-900 text-3xl mb-3">Votre soutien est un accélérateur</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Plusieurs façons de contribuer à notre mission commune</p>
          </motion.div>

          {/* Cards bénévolat + dons */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                icon: Users, title: 'Bénévolat',
                img: 'https://static.wixstatic.com/media/287af0_c193a16d8efe4d9c912f622618b98d28~mv2.jpg/v1/fill/w_399,h_279,al_c,q_80,enc_avif,quality_auto/Benevolat_edited.jpg',
                text: 'Partagez vos connaissances, votre expertise et vos expériences d\'une manière qui profite à la fois à l\'Université et à la génération actuelle d\'étudiants.',
                color: '#1a7a45'
              },
              {
                icon: Heart, title: 'Dons',
                img: 'https://static.wixstatic.com/media/287af0_14228c5d3cd644dab06cefe17b868c24~mv2.jpg/v1/fill/w_399,h_276,al_c,q_80,enc_avif,quality_auto/Appel%20de%20don.jpg',
                text: 'Quel que soit le montant de votre don, votre contribution aura un impact sur la vie d\'autrui à travers les programmes que Ma Belle Promo met en place.',
                color: '#d4aa35'
              }
            ].map((card, i) => (
              <motion.div key={i} {...fade(i * 0.1)}>
                <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 bg-white h-full flex flex-col">
                  <div className="relative h-44 overflow-hidden">
                    <img src={card.img} alt={card.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent)' }} />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: card.color }}>
                        <card.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-white font-bold text-sm font-playfair">{card.title}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <p className="text-gray-500 text-sm leading-relaxed">{card.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comment soutenir */}
          <motion.div {...fade(0.2)}>
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#0f5530,#1a7a45)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,170,53,0.2)', border: '1px solid rgba(212,170,53,0.4)' }}>
                  <Heart className="h-4 w-4" style={{ color: '#d4aa35' }} />
                </div>
                <h3 className="font-playfair font-bold text-white text-lg">Comment nous soutenir</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 bg-white">
                {SOUTIENS.map((s, i) => (
                  <div key={i} className="p-5 flex flex-col items-center text-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(15,85,48,0.08)' }}>
                      <s.icon className="h-4 w-4" style={{ color: '#1a7a45' }} />
                    </div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{s.label}</p>
                    {s.isContact
                      ? <button onClick={() => setContactOpen(true)} className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors underline underline-offset-2">{s.detail}</button>
                      : <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">{s.detail}</p>
                    }
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
