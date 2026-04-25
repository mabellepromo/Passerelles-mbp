import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContactModal from '@/components/ContactModal';
import { Shield, Database, Users, Lock, Mail, Clock, Eye, Trash2, Download, AlertTriangle } from 'lucide-react';

const Section = ({ icon: Icon, color, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ background: `${color}08` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
        <Icon className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} />
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
    <span className="font-semibold text-gray-600 w-44 flex-shrink-0">{label}</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

export default function PolitiqueConfidentialite() {
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
            <Shield className="h-3.5 w-3.5" /> RGPD · Protection des données
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-white mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-emerald-200 text-sm max-w-xl mx-auto leading-relaxed">
            Plateforme Passerelles · Association Ma Belle Promo
          </p>
          <p className="text-emerald-300/60 text-xs mt-3">Dernière mise à jour : 25 avril 2026</p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-5">

        {/* Responsable */}
        <Section icon={Shield} color="#1a7a45" title="Responsable du traitement">
          <Row label="Organisation" value="Association Ma Belle Promo (MBP)" />
          <Row label="Adresse" value="12 BP 335 Baguida, Lomé, Togo" />
          <div className="flex gap-3 py-2 border-b border-gray-50">
            <span className="font-semibold text-gray-600 w-44 flex-shrink-0">Email</span>
            <button onClick={() => setContactOpen(true)} className="text-emerald-700 underline font-semibold hover:text-emerald-900 text-sm text-left">contact@mabellepromo.org</button>
          </div>
          <Row label="Téléphone" value="+228 96 09 07 07" />
          <p className="text-gray-500 text-xs mt-2">
            Pour toute question relative à la protection de vos données personnelles, <button onClick={() => setContactOpen(true)} className="text-emerald-700 underline hover:text-emerald-900">contactez-nous</button>.
          </p>
        </Section>

        {/* Données collectées */}
        <Section icon={Database} color="#2563eb" title="Données personnelles collectées">
          <p>Dans le cadre du programme de mentorat Passerelles, nous collectons les catégories de données suivantes :</p>
          <div className="space-y-2 mt-2">
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="font-semibold text-blue-800 text-xs uppercase tracking-wide mb-2">Données d'identité et de contact</p>
              <p>Nom complet, adresse email, numéro de téléphone, ville de résidence, profil LinkedIn (optionnel).</p>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
              <p className="font-semibold text-purple-800 text-xs uppercase tracking-wide mb-2">Données académiques et professionnelles</p>
              <p>Université, niveau d'études, spécialisation, moyenne académique, profession, organisation, années d'expérience, domaines de spécialisation.</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="font-semibold text-amber-800 text-xs uppercase tracking-wide mb-2">Données de suivi du programme</p>
              <p>Notes de séances, objectifs, journaux de bord, messages échangés avec votre binôme, évaluations mensuelles, bilan final.</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="font-semibold text-red-800 text-xs uppercase tracking-wide mb-2">Documents justificatifs (mentorés uniquement)</p>
              <p>Relevés de notes, carte d'étudiant, certificats (fichiers PDF, JPG, PNG).</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">Données d'évaluation (mentorés)</p>
              <p>Un score d'aide à la sélection est calculé automatiquement lors de l'inscription. Ce score est utilisé uniquement comme outil d'aide à la décision de l'équipe MBP, qui procède à une révision humaine systématique. Vous pouvez demander une explication de ce score en nous contactant.</p>
            </div>
          </div>
        </Section>

        {/* Finalités et base légale */}
        <Section icon={Eye} color="#7c3aed" title="Finalités et base légale du traitement">
          <div className="space-y-3">
            {[
              { fin: "Gestion des candidatures", base: "Consentement explicite (formulaire d'inscription)" },
              { fin: "Appariement mentor / mentoré", base: "Consentement explicite + intérêt légitime de l'association" },
              { fin: "Suivi du programme (séances, journal)", base: "Exécution du programme auquel vous participez" },
              { fin: "Communication entre binômes", base: "Consentement + exécution du programme" },
              { fin: "Envoi d'emails transactionnels", base: "Consentement explicite" },
              { fin: "Statistiques anonymisées", base: "Intérêt légitime (amélioration du programme)" },
            ].map(({ fin, base }) => (
              <div key={fin} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="font-medium text-gray-800 flex-1">{fin}</span>
                <span className="text-gray-500 text-xs text-right w-52 flex-shrink-0">{base}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Destinataires */}
        <Section icon={Users} color="#0891b2" title="Destinataires de vos données">
          <p>Vos données sont accessibles aux personnes et services suivants :</p>
          <ul className="list-none space-y-2 mt-2">
            {[
              "L'équipe de Ma Belle Promo (gestion du programme, appariement)",
              "Votre binôme (mentor ou mentoré) — uniquement les informations liées au programme",
              "Supabase (hébergement base de données et authentification) — sous-traitant conforme au RGPD",
              "Brevo / Sendinblue (envoi d'emails transactionnels) — sous-traitant basé en France",
            ].map(d => (
              <li key={d} className="flex gap-2">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">→</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-500 text-xs mt-3">
            Aucune donnée n'est vendue, louée ou cédée à des tiers à des fins commerciales.
          </p>
        </Section>

        {/* Conservation */}
        <Section icon={Clock} color="#d97706" title="Durée de conservation">
          <Row label="Données de candidature" value="Durée du programme + 3 ans après la fin de votre participation" />
          <Row label="Données de suivi" value="Durée du programme + 3 ans (archivage légal associatif)" />
          <Row label="Messages" value="Durée du programme + 1 an" />
          <Row label="Documents uploadés" value="Durée du programme + 1 an, puis suppression définitive" />
          <Row label="Données de connexion" value="13 mois maximum (Supabase Auth)" />
          <p className="text-gray-500 text-xs mt-2">
            À l'expiration de ces délais, vos données sont supprimées définitivement ou anonymisées pour usage statistique.
          </p>
        </Section>

        {/* Sécurité */}
        <Section icon={Lock} color="#059669" title="Sécurité des données">
          <p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
          <ul className="list-none space-y-1.5 mt-2">
            {[
              "Chiffrement des communications en transit (HTTPS / TLS obligatoire via Vercel)",
              "Authentification sécurisée par email + mot de passe (Supabase Auth)",
              "Données hébergées chez Supabase (infrastructure conforme au RGPD, chiffrement au repos)",
              "Accès aux données restreint par rôle (utilisateur ne voit que ses propres données et celles de son binôme)",
              "Clés d'API sensibles stockées en variables d'environnement serveur (jamais exposées côté client)",
            ].map(m => (
              <li key={m} className="flex gap-2">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Cookies */}
        <Section icon={AlertTriangle} color="#f59e0b" title="Cookies et stockage local">
          <p>La plateforme Passerelles utilise uniquement des données de session techniques, strictement nécessaires au fonctionnement :</p>
          <div className="mt-3 rounded-xl border border-amber-100 overflow-hidden">
            <div className="grid grid-cols-3 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
              <span>Type</span><span>Finalité</span><span>Durée</span>
            </div>
            {[
              ["Session Supabase", "Maintien de la connexion", "Durée de la session"],
              ["Token d'accès (localStorage)", "Authentification API", "Durée de la session"],
            ].map(([type, fin, dur]) => (
              <div key={type} className="grid grid-cols-3 px-4 py-2.5 text-xs border-t border-amber-100">
                <span className="font-medium">{type}</span><span>{fin}</span><span className="text-gray-500">{dur}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-3">
            Aucun cookie publicitaire, aucun outil de tracking analytique (Google Analytics, etc.) n'est utilisé sur cette plateforme.
          </p>
        </Section>

        {/* Droits */}
        <Section icon={Download} color="#6366f1" title="Vos droits">
          <p>Conformément à la réglementation applicable sur la protection des données, vous disposez des droits suivants :</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              { titre: "Droit d'accès", desc: "Obtenir une copie de vos données personnelles" },
              { titre: "Droit de rectification", desc: "Corriger vos données inexactes ou incomplètes" },
              { titre: "Droit à l'effacement", desc: "Demander la suppression de votre compte et de vos données" },
              { titre: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré" },
              { titre: "Droit d'opposition", desc: "Vous opposer à certains traitements de vos données" },
              { titre: "Droit à la limitation", desc: "Suspendre temporairement l'utilisation de vos données" },
            ].map(({ titre, desc }) => (
              <div key={titre} className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                <p className="font-semibold text-indigo-800 text-sm">{titre}</p>
                <p className="text-gray-600 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="font-semibold text-emerald-800 text-sm mb-1">Exercer vos droits</p>
            <p>Envoyez votre demande via notre <button onClick={() => setContactOpen(true)} className="text-emerald-700 font-semibold underline hover:text-emerald-900">formulaire de contact</button> en précisant votre identité. Nous répondrons dans un délai de 30 jours.</p>
            <p className="text-xs text-gray-500 mt-2">Vous pouvez également supprimer votre compte directement depuis la page <Link to="/MonEspace" className="text-emerald-700 underline">Mon Espace</Link>.</p>
          </div>
        </Section>

        {/* Suppression */}
        <Section icon={Trash2} color="#e11d48" title="Suppression du compte">
          <p>
            Vous pouvez demander la suppression de votre compte et de l'ensemble de vos données à tout moment, de deux façons :
          </p>
          <ul className="list-none space-y-2 mt-2">
            <li className="flex gap-2">
              <span className="text-red-400 flex-shrink-0 mt-0.5">→</span>
              <span>Directement depuis <Link to="/MonEspace" className="text-emerald-700 underline font-semibold">Mon Espace</Link> → section « Compte » → bouton « Supprimer mon compte »</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 flex-shrink-0 mt-0.5">→</span>
              <span>Via notre <button onClick={() => setContactOpen(true)} className="text-emerald-700 underline font-semibold hover:text-emerald-900">formulaire de contact</button></span>
            </li>
          </ul>
          <p className="text-gray-500 text-xs mt-3">
            La suppression entraîne l'effacement de vos données personnelles dans un délai de 30 jours. Certaines données peuvent être conservées sous forme anonymisée pour les statistiques du programme.
          </p>
        </Section>

        {/* Contact */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900 text-sm mb-1">Une question sur vos données ?</p>
            <p className="text-gray-500 text-xs">Notre équipe vous répond dans les 30 jours ouvrables.</p>
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
