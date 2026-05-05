import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EB_GARAMOND = "'EB Garamond', Georgia, serif";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
  }),
};

const paragraphs = [
  {
    text: `Il y a des projets qui naissent deux fois : une première fois dans les textes, et une seconde, bien plus belle, dans la réalité.`,
    highlight: true,
  },
  {
    text: `Inscrit dans nos statuts depuis plus de huit ans, il a longtemps été une promesse que nous portions avec conviction, en attendant les conditions, les ressources, et peut-être aussi la maturité collective pour le faire bien. Aujourd'hui, cette promesse devient programme. Elle a un nom, des visages, et onze binômes qui vont écrire ensemble les premières pages d'une belle aventure.`,
  },
  {
    text: `Pour notre association, c'est une fierté immense. Pas la fierté facile de ceux qui annoncent — mais celle, plus profonde, de ceux qui ont construit.`,
  },
  {
    text: `À nos mentors, je veux adresser mes remerciements les plus sincères. Vous êtes membres de Ma Belle Promo, vous connaissez mieux que quiconque ce que représente cet engagement — et c'est précisément parce que vous le connaissez que votre « oui » a tant de valeur. Vous auriez pu décliner. Vous auriez eu toutes les raisons légitimes de le faire. Vous avez choisi d'être là. Merci. Merci pour votre temps, pour votre générosité, et pour la confiance que vous placez dans ce programme que nous avons mis huit ans à faire naître.`,
    accent: true,
  },
  {
    text: `Pour les mentorés sélectionnés, je veux que vous mesuriez pleinement ce qui vous est offert. Ces femmes et hommes qui s'engagent à vos côtés sont des professionnelles et professionnels accomplis, sollicités de toutes parts, dont l'agenda ne laisse que peu de place. Ils ont choisi d'en faire une pour vous. Ce n'est pas anodin. C'est un acte de générosité rare, que nous avons la responsabilité collective de ne pas gaspiller.`,
  },
  {
    text: `Saisissez chaque échange. Osez les questions. Montrez-vous dignes de leur confiance — non par timidité, mais par ambition.`,
    highlight: true,
  },
  {
    text: `PASSERELLES n'est pas un programme de plus. C'est le début de quelque chose qui nous ressemble : exigeant, bienveillant, et profondément utile.`,
  },
];

export default function MotPresidente() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a2e18 0%, #0f5530 45%, #1a7a45 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(184,148,31,0.2)', border: '1px solid rgba(184,148,31,0.4)', color: '#f0d060' }}>
              Programme PASSERELLES · Cohorte 1 · 2026
            </span>

            <h1 className="font-playfair font-bold text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1.15 }}>
              Mot de la Présidente
            </h1>

            <p className="text-emerald-200/70 text-sm sm:text-base max-w-xl mx-auto">
              Un programme huit ans en gestation, enfin réalité.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 20C480 40 240 60 0 30L0 60Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ── PORTRAIT + INTRO ── */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

            {/* Colonne photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="rounded-3xl flex flex-col items-center justify-center py-10 px-8"
              style={{
                background: 'linear-gradient(135deg, #f8fdf9 0%, #ecfdf5 100%)',
                border: '1px solid rgba(26,122,69,0.12)',
                boxShadow: '0 8px 32px rgba(10,46,24,0.07)',
              }}
            >
              <div className="relative mb-6">
                <div className="absolute -inset-2 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35, #1a7a45)' }}>
                </div>
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden"
                  style={{ border: '4px solid white', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
                  <img
                    src="/images/fabienne.webp"
                    alt="La Présidente de Ma Belle Promo"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <p className="font-playfair font-bold text-gray-900 text-xl text-center">Fabienne</p>
              <p className="text-sm font-semibold mt-1 text-center" style={{ color: '#1a7a45' }}>Présidente</p>
              <p className="text-xs text-gray-400 mt-0.5 text-center">Ma Belle Promo</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="w-8 h-px" style={{ background: '#d4aa35' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#d4aa35' }} />
                <span className="w-8 h-px" style={{ background: '#d4aa35' }} />
              </div>
            </motion.div>

            {/* Colonne citation */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-3xl flex flex-col justify-center p-8 sm:p-10"
              style={{
                background: 'linear-gradient(135deg, #0a2e18 0%, #0f5530 100%)',
                boxShadow: '0 24px 64px rgba(10,46,24,0.2)',
              }}
            >
              <Quote className="h-10 w-10 mb-5 opacity-30 text-yellow-300" />
              <p className="text-white leading-relaxed text-justify"
                style={{ fontFamily: EB_GARAMOND, fontSize: 'clamp(1rem, 2vw, 1.15rem)' }}>
                Il y a des projets qui naissent deux fois : une première fois dans les textes, et une seconde, bien plus belle, dans la réalité.
              </p>
              <p className="mt-5 italic"
                style={{ fontFamily: EB_GARAMOND, color: '#d4aa35', fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)' }}>
                Le programme PASSERELLES est de ceux-là.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CORPS DU MESSAGE ── */}
      <section className="pb-16 px-4 sm:px-6" style={{ background: '#fff' }}>
        <div className="max-w-3xl mx-auto">

          <div className="space-y-6">
            {paragraphs.slice(1).map((p, i) => (
              <motion.p
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={[
                  'leading-relaxed text-justify',
                  p.highlight ? 'text-gray-900' : 'text-gray-800',
                  p.accent ? 'pl-5 border-l-4 rounded-r-xl py-3 pr-4' : '',
                ].join(' ')}
                style={{
                  fontFamily: EB_GARAMOND,
                  fontSize: 'clamp(1.2rem, 2vw, 1.4rem)',
                  fontWeight: p.highlight ? 600 : 400,
                  ...(p.accent ? { borderColor: '#d4aa35', background: 'linear-gradient(90deg, rgba(212,170,53,0.06), transparent)' } : {}),
                }}
              >
                {p.text}
              </motion.p>
            ))}
          </div>

          {/* Signature */}
          <motion.div
            custom={paragraphs.length}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-14 flex flex-col items-center text-center"
          >
            <div className="w-16 h-px mb-6" style={{ background: 'linear-gradient(90deg, transparent, #d4aa35, transparent)' }} />

            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Lomé, Mai 2026</p>

            <p className="font-playfair font-bold text-2xl text-gray-900 mt-2">Bienvenue dans la Cohorte 1.</p>

            <div className="mt-6 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mb-3"
                style={{ border: '2px solid #d4aa35' }}>
                <img src="/images/fabienne.webp" alt="" className="w-full h-full object-cover object-top" />
              </div>
              <p className="font-playfair font-semibold text-gray-900">Fabienne</p>
              <p className="text-sm mt-0.5" style={{ color: '#1a7a45' }}>Présidente · Ma Belle Promo</p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/ResultatsCohorte1">
                <Button className="font-semibold px-6 py-2.5 h-auto text-sm text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #b8941f, #d4aa35)', border: 'none' }}>
                  Voir les 11 binômes officiels
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="font-semibold px-6 py-2.5 h-auto text-sm transition-all"
                  style={{ borderColor: '#1a7a45', color: '#1a7a45' }}>
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
