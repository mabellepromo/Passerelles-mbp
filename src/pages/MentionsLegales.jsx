import React, { useState } from 'react';
import { Shield, Globe, Server, Mail, Building2, User } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContactModal from '@/components/ContactModal';

const Section = ({ icon: Icon, color, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ background: `${color}08` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
        <Icon className="text-white" style={{ height: 18, width: 18 }} />
      </div>
      <h2 className="font-bold text-gray-900 text-base">{title}</h2>
    </div>
    <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
    <span className="font-semibold text-gray-600 w-52 flex-shrink-0">{label}</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

export default function MentionsLegales() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f4' }}>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0a2e18 0%,#0f5530 50%,#1a7a45 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(212,170,53,0.4)', color: '#fde68a' }}>
            <Shield className="h-3.5 w-3.5" /> Informations légales
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-white mb-4">
            Mentions Légales
          </h1>
          <p className="text-emerald-200 text-sm max-w-xl mx-auto leading-relaxed">
            Plateforme Passerelles · Association Ma Belle Promo
          </p>
          <p className="text-emerald-300/60 text-xs mt-3">Dernière mise à jour : 25 avril 2026</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-5">

        {/* Éditeur */}
        <Section icon={Building2} color="#1a7a45" title="Éditeur du site">
          <Row label="Dénomination" value="Association Ma Belle Promo (MBP)" />
          <Row label="Forme juridique" value="Association à but non lucratif" />
          <Row label="Adresse du siège" value="12 BP 335 Baguida, Lomé, Togo" />
          <Row label="Téléphone" value="+228 96 09 07 07" />
          <div className="flex gap-3 py-2 border-b border-gray-50">
            <span className="font-semibold text-gray-600 w-52 flex-shrink-0">Email</span>
            <button onClick={() => setContactOpen(true)}
              className="text-emerald-700 underline font-semibold hover:text-emerald-900 text-sm text-left">
              contact@mabellepromo.org
            </button>
          </div>
          <Row label="Site web" value="passerelles.vercel.app" />
        </Section>

        {/* Directeur de publication */}
        <Section icon={User} color="#2563eb" title="Directeur de la publication">
          <p>
            Le directeur de la publication est le représentant légal de l'Association Ma Belle Promo,
            joignable à l'adresse : <button onClick={() => setContactOpen(true)}
              className="text-emerald-700 underline font-semibold hover:text-emerald-900">
              contact@mabellepromo.org
            </button>
          </p>
        </Section>

        {/* Hébergeur */}
        <Section icon={Server} color="#7c3aed" title="Hébergeur">
          <Row label="Société" value="Vercel Inc." />
          <Row label="Adresse" value="340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis" />
          <Row label="Site web" value="vercel.com" />
          <p className="text-gray-500 text-xs mt-2">
            L'application est déployée sur l'infrastructure Vercel avec des serveurs disponibles en Europe.
          </p>
        </Section>

        {/* Base de données */}
        <Section icon={Globe} color="#0891b2" title="Hébergeur des données">
          <Row label="Société" value="Supabase Inc." />
          <Row label="Adresse" value="970 Toa Payoh North, #07-04, Singapore 318992" />
          <Row label="Site web" value="supabase.com" />
          <p className="text-gray-500 text-xs mt-2">
            Les données personnelles sont hébergées sur des infrastructures conformes au RGPD.
            Un accord de traitement des données (DPA) est en vigueur avec Supabase.
          </p>
        </Section>

        {/* Propriété intellectuelle */}
        <Section icon={Shield} color="#d97706" title="Propriété intellectuelle">
          <p>
            L'ensemble des contenus présents sur la plateforme Passerelles (textes, images, logotypes,
            structure, mise en page) est la propriété exclusive de l'Association Ma Belle Promo ou de
            ses partenaires, et est protégé par les lois applicables en matière de propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification ou exploitation, totale ou partielle,
            sans autorisation écrite préalable de l'Association Ma Belle Promo, est strictement interdite.
          </p>
        </Section>

        {/* Responsabilité */}
        <Section icon={Shield} color="#059669" title="Limitation de responsabilité">
          <p>
            L'Association Ma Belle Promo s'efforce de maintenir la plateforme accessible et à jour.
            Elle ne saurait être tenue responsable des interruptions de service liées à des opérations
            de maintenance, à des pannes techniques ou à des causes indépendantes de sa volonté.
          </p>
          <p>
            Les informations présentes sur la plateforme sont fournies à titre indicatif.
            L'association se réserve le droit de les modifier à tout moment sans préavis.
          </p>
        </Section>

        {/* Contact */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900 text-sm mb-1">Une question ?</p>
            <p className="text-gray-500 text-xs">Notre équipe vous répond dans les meilleurs délais.</p>
          </div>
          <button onClick={() => setContactOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0f5530,#1a7a45)' }}>
            <Mail className="h-4 w-4" /> Nous contacter
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
}
