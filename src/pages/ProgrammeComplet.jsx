import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600&display=swap');

  .pc-wrap {
    --vert: #0f5530;
    --vert-med: #1a7a45;
    --vert-clair: #f0fdf4;
    --or: #b8941f;
    --or-clair: #d4aa35;
    --or-pale: #fef9e7;
    --ivoire: #faf8f2;
    --gris: #374151;
    --gris-clair: #6b7280;
    font-family: 'EB Garamond', Georgia, serif;
    background: var(--ivoire);
    color: var(--gris);
    line-height: 1.8;
    font-size: 17px;
  }
  .pc-wrap * { box-sizing: border-box; }

  /* HERO */
  .pc-wrap .hero {
    background: linear-gradient(160deg, #071f14 0%, #0f5530 45%, #1a7a45 100%);
    position: relative;
    overflow: hidden;
  }
  .pc-wrap .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(ellipse at 10% 50%, rgba(212,170,53,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 20%, rgba(212,170,53,0.04) 0%, transparent 50%),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 50px);
  }
  .pc-wrap .gold-line { height: 3px; background: linear-gradient(90deg, transparent, var(--or), var(--or-clair), var(--or), transparent); }
  .pc-wrap .hero-inner { position: relative; max-width: 900px; margin: 0 auto; padding: 70px 40px 60px; text-align: center; }
  .pc-wrap .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 3px;
    color: var(--or-clair); background: rgba(184,148,31,0.15);
    border: 1px solid rgba(184,148,31,0.35); padding: 8px 18px;
    border-radius: 50px; margin-bottom: 24px; text-transform: uppercase;
  }
  .pc-wrap .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 5vw, 56px); color: white; font-weight: 700; line-height: 1.15; margin-bottom: 12px; }
  .pc-wrap .hero-title span { color: var(--or-clair); }
  .pc-wrap .hero-tagline { font-style: italic; color: rgba(255,255,255,0.55); font-size: 18px; margin-bottom: 40px; }
  .pc-wrap .hero-pillars { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }
  .pc-wrap .pillar-badge { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); padding: 7px 16px; border-radius: 50px; font-size: 13px; display: flex; align-items: center; gap: 6px; }
  .pc-wrap .pillar-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--or-clair); }
  .pc-wrap .hero-nav { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
  .pc-wrap .nav-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-family: 'Cinzel', serif; letter-spacing: 0.5px; text-decoration: none; transition: all 0.2s; cursor: pointer; }
  .pc-wrap .nav-btn-or { background: linear-gradient(135deg, var(--or), var(--or-clair)); color: white; }
  .pc-wrap .nav-btn-ghost { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
  .pc-wrap .nav-btn:hover { transform: translateY(-2px); opacity: 0.9; }

  /* TOC */
  .pc-wrap .toc { max-width: 900px; margin: 0 auto; padding: 48px 40px 0; }
  .pc-wrap .toc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 60px; }
  .pc-wrap .toc-item { background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); padding: 18px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.2s; text-decoration: none; color: var(--gris); }
  .pc-wrap .toc-item:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: rgba(184,148,31,0.3); }
  .pc-wrap .toc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .pc-wrap .toc-num { font-family: 'Cinzel', serif; font-size: 11px; color: var(--gris-clair); letter-spacing: 1px; margin-bottom: 2px; }
  .pc-wrap .toc-label { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; }

  /* CONTENU */
  .pc-wrap .content { max-width: 900px; margin: 0 auto; padding: 0 40px 80px; }
  .pc-wrap .doc-section { margin-bottom: 80px; scroll-margin-top: 20px; }
  .pc-wrap .section-hero { border-radius: 20px; padding: 36px 40px; margin-bottom: 36px; position: relative; overflow: hidden; }
  .pc-wrap .section-hero::before { content: attr(data-icon); position: absolute; right: 30px; top: 50%; transform: translateY(-50%); font-size: 80px; opacity: 0.1; }
  .pc-wrap .section-label { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; opacity: 0.7; }
  .pc-wrap .section-title { font-family: 'Playfair Display', serif; font-size: clamp(22px, 3vw, 30px); font-weight: 700; }

  .pc-wrap .s-green { background: linear-gradient(135deg, #0a3320, #0f5530); color: white; }
  .pc-wrap .s-green .section-label { color: var(--or-clair); }
  .pc-wrap .s-violet { background: linear-gradient(135deg, #1e0a4e, #3b0764); color: white; }
  .pc-wrap .s-violet .section-label { color: #c4b5fd; }
  .pc-wrap .s-or { background: linear-gradient(135deg, #451a03, #78350f); color: white; }
  .pc-wrap .s-or .section-label { color: var(--or-clair); }
  .pc-wrap .s-blue { background: linear-gradient(135deg, #0c1a3e, #1e3a8a); color: white; }
  .pc-wrap .s-blue .section-label { color: #93c5fd; }
  .pc-wrap .s-teal { background: linear-gradient(135deg, #042f2e, #0d5354); color: white; }
  .pc-wrap .s-teal .section-label { color: #5eead4; }

  /* PRÉAMBULE */
  .pc-wrap .preambule { background: white; border-left: 4px solid var(--or); border-radius: 0 14px 14px 0; padding: 32px 36px; margin-bottom: 36px; box-shadow: 0 2px 16px rgba(0,0,0,0.05); }
  .pc-wrap .preambule-label { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 3px; color: var(--or); text-transform: uppercase; margin-bottom: 14px; }
  .pc-wrap .preambule-text { font-size: 17px; line-height: 1.9; }
  .pc-wrap .pillars-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin: 28px 0; }
  .pc-wrap .pillar-card { background: white; border-radius: 12px; padding: 20px 22px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; gap: 14px; align-items: flex-start; }
  .pc-wrap .pillar-icon { font-size: 22px; flex-shrink: 0; }
  .pc-wrap .pillar-name { font-family: 'Playfair Display', serif; font-size: 15px; color: var(--vert); font-weight: 600; margin-bottom: 4px; }
  .pc-wrap .pillar-desc { font-size: 14px; color: var(--gris-clair); line-height: 1.5; }

  /* CRITÈRES */
  .pc-wrap .criteres-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 36px; }
  .pc-wrap .critere-card { background: white; border-radius: 14px; padding: 24px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 12px rgba(0,0,0,0.04); position: relative; overflow: hidden; transition: all 0.2s; }
  .pc-wrap .critere-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .pc-wrap .critere-points { position: absolute; top: 16px; right: 16px; background: var(--or-pale); color: var(--or); font-family: 'Cinzel', serif; font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 50px; border: 1px solid rgba(184,148,31,0.25); }
  .pc-wrap .critere-title { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--vert); font-weight: 700; margin-bottom: 10px; padding-right: 60px; }
  .pc-wrap .critere-desc { font-size: 14px; color: var(--gris-clair); line-height: 1.6; margin-bottom: 14px; }
  .pc-wrap .critere-subs { display: flex; flex-direction: column; gap: 6px; }
  .pc-wrap .critere-sub { font-size: 13px; color: var(--gris); display: flex; gap: 8px; align-items: flex-start; }
  .pc-wrap .critere-sub::before { content: '›'; color: var(--or); font-size: 16px; flex-shrink: 0; }

  /* PROCESSUS */
  .pc-wrap .processus { display: flex; flex-direction: column; gap: 0; margin-bottom: 36px; position: relative; }
  .pc-wrap .processus::before { content: ''; position: absolute; left: 20px; top: 24px; bottom: 24px; width: 2px; background: linear-gradient(180deg, var(--vert-med), var(--or-clair)); z-index: 0; }
  .pc-wrap .process-step { display: flex; gap: 20px; align-items: flex-start; padding: 20px 0; position: relative; z-index: 1; }
  .pc-wrap .step-num { width: 42px; height: 42px; border-radius: 50%; background: white; border: 2px solid var(--vert-med); color: var(--vert); font-family: 'Cinzel', serif; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 600; }
  .pc-wrap .step-content { flex: 1; padding-top: 8px; }
  .pc-wrap .step-title { font-family: 'Playfair Display', serif; font-size: 16px; color: var(--vert); font-weight: 600; margin-bottom: 4px; }
  .pc-wrap .step-desc { font-size: 14px; color: var(--gris-clair); line-height: 1.6; }
  .pc-wrap .step-date { display: inline-block; font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 1px; color: var(--or); background: var(--or-pale); border: 1px solid rgba(184,148,31,0.25); padding: 3px 10px; border-radius: 50px; margin-top: 6px; }

  /* FICHE */
  .pc-wrap .fiche-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 36px; }
  .pc-wrap .fiche-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04); text-align: center; }
  .pc-wrap .fiche-icon { font-size: 28px; margin-bottom: 10px; }
  .pc-wrap .fiche-title { font-family: 'Playfair Display', serif; font-size: 14px; color: #0d5354; font-weight: 600; margin-bottom: 6px; }
  .pc-wrap .fiche-desc { font-size: 13px; color: var(--gris-clair); line-height: 1.5; }

  /* LISTE */
  .pc-wrap .items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .pc-wrap .list-item { display: flex; gap: 14px; align-items: flex-start; padding: 14px 18px; background: white; border-radius: 10px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 1px 4px rgba(0,0,0,0.04); transition: all 0.2s; }
  .pc-wrap .list-item:hover { border-color: rgba(26,122,69,0.2); transform: translateX(4px); }
  .pc-wrap .list-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--vert-med); flex-shrink: 0; margin-top: 9px; }
  .pc-wrap .list-text { font-size: 16px; line-height: 1.7; }

  /* CONTACT */
  .pc-wrap .contact-box { background: linear-gradient(135deg, var(--vert), var(--vert-med)); border-radius: 20px; padding: 40px; text-align: center; color: white; margin-top: 60px; }
  .pc-wrap .contact-title { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 12px; }
  .pc-wrap .contact-sub { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 24px; }
  .pc-wrap .contact-links { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .pc-wrap .contact-link { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: white; padding: 10px 20px; border-radius: 8px; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.5px; text-decoration: none; transition: all 0.2s; }
  .pc-wrap .contact-link:hover { background: rgba(255,255,255,0.2); }
  .pc-wrap .contact-link-platform {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #b8941f, #d4aa35);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 11px 26px;
    border-radius: 8px;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    letter-spacing: 1px;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(184,148,31,0.35);
  }
  .pc-wrap .contact-link-platform:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(184,148,31,0.5); }

  /* FOOTER */
  .pc-wrap .pc-footer { background: linear-gradient(180deg, #0a3320, #071f14); padding: 32px 40px; text-align: center; margin-top: 80px; }
  .pc-wrap .footer-inner { max-width: 900px; margin: 0 auto; }
  .pc-wrap .footer-logo { font-family: 'Playfair Display', serif; color: white; font-size: 18px; margin-bottom: 8px; }
  .pc-wrap .footer-logo span { color: var(--or-clair); }
  .pc-wrap .footer-sub { font-size: 13px; color: rgba(255,255,255,0.4); }
  .pc-wrap .footer-line { height: 1px; background: linear-gradient(90deg, transparent, rgba(212,170,53,0.4), transparent); margin: 20px 0; }

  .pc-wrap .lien-section { color: var(--vert-med); font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 1px; text-decoration: none; border-bottom: 1px solid var(--vert-med); padding-bottom: 2px; }

  @media (max-width: 640px) {
    .pc-wrap .hero-inner { padding: 48px 20px 40px; }
    .pc-wrap .toc { padding: 32px 20px 0; }
    .pc-wrap .content { padding: 0 20px 60px; }
    .pc-wrap .pillars-grid { grid-template-columns: 1fr; }
    .pc-wrap .criteres-grid { grid-template-columns: 1fr; }
    .pc-wrap .fiche-grid { grid-template-columns: repeat(2, 1fr); }
    .pc-wrap .section-hero { padding: 24px; }
  }
`;

export default function ProgrammeComplet() {
  useEffect(() => {
    document.title = 'Programme Complet PASSERELLES — Ma Belle Promo';
  }, []);

  return (
    <div className="pc-wrap">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* HERO */}
      <div className="hero">
        <div className="gold-line" />
        <div className="hero-inner">
          <div className="hero-badge">
            <img src="/logo-mbp.png" alt="MBP" style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0 }} />
            Association Ma Belle Promo · Lomé, Togo · 2026
          </div>
          <h1 className="hero-title">
            Programme de Mentorat<br />
            <span>« PASSERELLES »</span>
          </h1>
          <p className="hero-tagline">
            Relier Ambitions &amp; Opportunités · Créer des passerelles durables entre les talents et les opportunités
          </p>
          <div className="hero-pillars">
            {['Bienveillance', 'Équité', 'Intégrité éthique', 'Responsabilité partagée'].map(p => (
              <div key={p} className="pillar-badge"><div className="dot" />{p}</div>
            ))}
          </div>
          <div className="hero-nav">
            <a href="#preambule" className="nav-btn nav-btn-or">Lire le programme ↓</a>
            <Link to="/" className="nav-btn nav-btn-ghost">Retour à l'accueil</Link>
          </div>
        </div>
      </div>

      {/* TABLE DES MATIÈRES */}
      <div className="toc">
        <div className="toc-grid">
          {[
            { href: '#mentor',   icon: '👨‍💼', bg: '#f0fdf4', color: '#0f5530', num: 'SECTION I',   label: 'Guide du Mentor' },
            { href: '#mentore',  icon: '🎓',   bg: '#f5f3ff', color: '#6d28d9', num: 'SECTION II',  label: 'Guide du Mentoré' },
            { href: '#charte',   icon: '🤝',   bg: '#fef9e7', color: '#92400e', num: 'SECTION III', label: "Charte d'Engagement" },
            { href: '#criteres', icon: '✅',   bg: '#eff6ff', color: '#1e3a8a', num: 'SECTION IV',  label: 'Critères de Sélection' },
            { href: '#suivi',    icon: '📋',   bg: '#f0fdfa', color: '#0d5354', num: 'SECTION V',   label: 'Fiche de Suivi' },
          ].map(({ href, icon, bg, color, num, label }) => (
            <a key={href} href={href} className="toc-item">
              <div className="toc-icon" style={{ background: bg, color }}>{icon}</div>
              <div>
                <div className="toc-num">{num}</div>
                <div className="toc-label">{label}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* CONTENU */}
      <div className="content">

        {/* PRÉAMBULE */}
        <div id="preambule" className="doc-section">
          <div className="preambule">
            <div className="preambule-label">Préambule Général</div>
            <p className="preambule-text">
              Le programme <strong>PASSERELLES</strong> est une initiative de l'Association Ma Belle Promo (MBP) visant à
              accompagner des étudiants en droit des universités togolaises — Université de Lomé, Université de Kara et
              établissements privés — dans leur épanouissement académique, professionnel et personnel.
            </p>
          </div>
          <div className="pillars-grid">
            {[
              { icon: '🛡', name: 'Bienveillance structurée', desc: 'Accompagnement volontaire, non rémunéré et co-construit' },
              { icon: '⚖',  name: 'Équité et inclusion',       desc: 'Accès égal, transparent, sans discrimination' },
              { icon: '🔒', name: 'Intégrité éthique',         desc: 'Interdiction absolue du quid pro quo, du harcèlement et de tout abus' },
              { icon: '🤝', name: 'Responsabilité partagée',   desc: 'Engagements clairs, suivi régulier, mécanismes de signalement' },
            ].map(({ icon, name, desc }) => (
              <div key={name} className="pillar-card">
                <div className="pillar-icon">{icon}</div>
                <div>
                  <div className="pillar-name">{name}</div>
                  <div className="pillar-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* I. GUIDE DU MENTOR */}
        <div id="mentor" className="doc-section">
          <div className="section-hero s-green" data-icon="👨‍💼">
            <div className="section-label">Section I</div>
            <div className="section-title">Guide du Mentor</div>
          </div>
          <div className="items-list">
            {[
              { titre: 'Engagement volontaire', desc: 'Le mentor agit dans un cadre non rémunéré et sociétal, motivé par la transmission et l\'accompagnement.' },
              { titre: 'Disponibilité', desc: 'Minimum 2h/mois, avec préparation de chaque séance selon le profil du mentoré.' },
              { titre: 'Pratiques pédagogiques', desc: 'Écoute active, feedback constructif, encouragement de l\'autonomie et co-construction du parcours.' },
              { titre: 'Confidentialité absolue', desc: 'Tous les échanges sont strictement confidentiels, sauf obligation légale.' },
              { titre: 'Intégrité éthique', desc: 'Interdiction formelle de tout quid pro quo, harcèlement ou comportement inapproprié.' },
            ].map(({ titre, desc }) => (
              <div key={titre} className="list-item">
                <div className="list-dot" />
                <div className="list-text"><strong>{titre}</strong> : {desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/GuideMentor" className="lien-section">Lire le guide complet du mentor →</Link>
          </p>
        </div>

        {/* II. GUIDE DU MENTORÉ */}
        <div id="mentore" className="doc-section">
          <div className="section-hero s-violet" data-icon="🎓">
            <div className="section-label">Section II</div>
            <div className="section-title">Guide du Mentoré</div>
          </div>
          <div className="items-list">
            {[
              { titre: 'Droits fondamentaux', desc: 'Environnement sûr, respectueux, sans demande de contrepartie de quelque nature.' },
              { titre: 'Engagement actif', desc: 'Préparation de chaque séance, définition d\'objectifs clairs, communication proactive.' },
              { titre: 'Co-construction', desc: 'Le mentoré est acteur de son évolution, avec l\'appui du mentor.' },
              { titre: 'Signalement', desc: 'Droit inviolable de signaler tout comportement inapproprié sans crainte de représailles.' },
              { titre: 'Clôture active', desc: 'Bilan final, valorisation du programme, invitation potentielle à devenir mentor.' },
            ].map(({ titre, desc }) => (
              <div key={titre} className="list-item">
                <div className="list-dot" style={{ background: '#6d28d9' }} />
                <div className="list-text"><strong>{titre}</strong> : {desc}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/GuideMentore" style={{ color: '#6d28d9', fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '1px', textDecoration: 'none', borderBottom: '1px solid #6d28d9', paddingBottom: '2px' }}>
              Lire le guide complet du mentoré →
            </Link>
          </p>
        </div>

        {/* III. CHARTE */}
        <div id="charte" className="doc-section">
          <div className="section-hero s-or" data-icon="🤝">
            <div className="section-label">Section III</div>
            <div className="section-title">Charte d'Engagement Mutuel</div>
          </div>
          <div className="items-list">
            {[
              <><strong>Volontariat et équité</strong> · <strong>Respect mutuel</strong> · <strong>Confidentialité absolue</strong></>,
              <><strong>Objectifs SMART</strong> co-construits et suivis régulièrement par les deux parties.</>,
              <><strong>Interdiction absolue</strong> du quid pro quo, du harcèlement moral, sexuel ou sexiste, et de tout abus de position.</>,
              <><strong>Rupture possible</strong> à tout moment avec un préavis recommandé de 2 semaines et bilan partagé.</>,
              <><strong>Révision annuelle</strong> de la charte pour intégrer les retours d'expérience.</>,
            ].map((content, i) => (
              <div key={i} className="list-item">
                <div className="list-dot" style={{ background: '#92400e' }} />
                <div className="list-text">{content}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/CharteEngagement" style={{ color: '#92400e', fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '1px', textDecoration: 'none', borderBottom: '1px solid #92400e', paddingBottom: '2px' }}>
              Lire la charte complète →
            </Link>
          </p>
        </div>

        {/* IV. CRITÈRES DE SÉLECTION */}
        <div id="criteres" className="doc-section">
          <div className="section-hero s-blue" data-icon="✅">
            <div className="section-label">Section IV</div>
            <div className="section-title">Critères de Sélection des Mentorés</div>
          </div>
          <p style={{ marginBottom: '28px', fontStyle: 'italic', color: '#6b7280' }}>
            Sélection parmi un minimum de 50 candidatures, exclusivement parmi les étudiants en <strong>L3, M1 et M2</strong>, sur une grille pondérée sur 100 points.
          </p>
          <div className="criteres-grid">
            {[
              { pts: '30 pts', titre: 'Motivation', desc: 'Identifier un engagement sincère envers le programme et des aspirations claires en droit.', subs: ['Authenticité de la motivation (15 pts)', 'Clarté des objectifs (10 pts)', 'Alignement avec les valeurs MBP (5 pts)'] },
              { pts: '25 pts', titre: "Niveau d'Études", desc: 'Prioriser les étudiants en L3, M1 et M2, phases critiques pour l\'orientation professionnelle.', subs: ['Inscription en L3/M1/M2 (10 pts)', 'Performance académique (10 pts)', 'Pertinence du parcours (5 pts)'] },
              { pts: '20 pts', titre: 'Disponibilité', desc: 'Garantir l\'engagement actif dans les rencontres mensuelles et activités collectives.', subs: ['Respect du calendrier (10 pts)', 'Flexibilité pour activités collectives (7 pts)', 'Engagement déclaré (3 pts)'] },
              { pts: '25 pts', titre: 'Engagement Civique et Leadership', desc: 'Sélectionner des candidats avec un potentiel d\'impact dans leur communauté.', subs: ['Implication associative ou citoyenne (10 pts)', 'Alignement avec les valeurs MBP (10 pts)', 'Potentiel de leadership (5 pts)'] },
            ].map(({ pts, titre, desc, subs }) => (
              <div key={titre} className="critere-card">
                <div className="critere-points">{pts}</div>
                <div className="critere-title">{titre}</div>
                <div className="critere-desc">{desc}</div>
                <div className="critere-subs">
                  {subs.map(s => <div key={s} className="critere-sub">{s}</div>)}
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#0f5530', marginBottom: '20px', marginTop: '36px' }}>
            Processus de Sélection
          </h3>
          <div className="processus">
            {[
              { num: '1', titre: 'Appel à Candidatures', desc: 'Diffusion via réseaux sociaux, affiches dans les universités et courriers ciblés aux doyens. Cible : minimum 50 candidatures de L3/M1/M2.', date: 'À communiquer' },
              { num: '2', titre: 'Réception des Dossiers', desc: 'Formulaire en ligne incluant CV, relevé de notes, lettre de motivation et déclaration d\'engagement.', date: 'Date limite : À communiquer' },
              { num: '3', titre: 'Analyse par le Comité', desc: 'Évaluation par un comité de 3 à 5 membres MBP, scores pondérés sur 100. Durée : 1 semaine.' },
              { num: '4', titre: 'Notification des Résultats', desc: 'Lettres d\'acceptation envoyées sous 2 semaines. Les candidats acceptés reçoivent une invitation à l\'atelier de lancement.' },
              { num: '5', titre: 'Appel de Réserve', desc: 'Liste d\'attente constituée pour pallier tout désistement des mentorés sélectionnés.' },
            ].map(({ num, titre, desc, date }) => (
              <div key={num} className="process-step">
                <div className="step-num">{num}</div>
                <div className="step-content">
                  <div className="step-title">{titre}</div>
                  <div className="step-desc">{desc}</div>
                  {date && <div className="step-date">{date}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* V. FICHE DE SUIVI */}
        <div id="suivi" className="doc-section">
          <div className="section-hero s-teal" data-icon="📋">
            <div className="section-label">Section V</div>
            <div className="section-title">Fiche de Suivi des Rencontres</div>
          </div>
          <div className="preambule" style={{ borderColor: '#0d5354' }}>
            <div className="preambule-label" style={{ color: '#0d5354' }}>Objectif</div>
            <p>La fiche de suivi garantit un suivi <strong>structuré, mesurable et aligné</strong> sur les objectifs du programme. Elle est utilisée mensuellement pour tracker les progrès, identifier les défis et planifier les actions futures.</p>
          </div>
          <div className="fiche-grid">
            {[
              { icon: '📝', titre: 'Documenter',       desc: 'Enregistrer les points clés des rencontres : objectifs, discussions, actions.' },
              { icon: '📊', titre: 'Évaluer',           desc: 'Mesurer la satisfaction et les progrès académiques, professionnels et personnels.' },
              { icon: '🗓', titre: 'Planifier',         desc: 'Définir des actions concrètes avec échéances pour maintenir la dynamique.' },
              { icon: '🌍', titre: "Assurer l'inclusion", desc: 'Permettre des ajustements pour répondre aux besoins spécifiques.' },
              { icon: '🔔', titre: 'Signaler',          desc: 'Documenter tout incident, préoccupation ou comportement inapproprié.' },
              { icon: '💻', titre: 'Format numérique',  desc: 'Disponible directement sur la plateforme PASSERELLES.' },
            ].map(({ icon, titre, desc }) => (
              <div key={titre} className="fiche-card">
                <div className="fiche-icon">{icon}</div>
                <div className="fiche-title">{titre}</div>
                <div className="fiche-desc">{desc}</div>
              </div>
            ))}
          </div>
          <div className="items-list">
            {[
              { titre: 'Fréquence', desc: 'Une fiche par rencontre mensuelle (1 à 2 heures, présentiel ou virtuel).' },
              { titre: 'Responsabilité', desc: 'Complétée conjointement par le mentor et le mentoré à la fin de chaque rencontre.' },
              { titre: 'Archivage', desc: "Soumise à l'équipe MBP pour suivi et analyse." },
              { titre: 'Confidentialité', desc: "Les informations restent confidentielles, conformément à la Charte d'Engagement." },
            ].map(({ titre, desc }) => (
              <div key={titre} className="list-item">
                <div className="list-dot" style={{ background: '#0d5354' }} />
                <div className="list-text"><strong>{titre}</strong> : {desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
