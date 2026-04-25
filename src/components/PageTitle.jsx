import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/':                    'Accueil',
  '/MonEspace':           'Mon Espace',
  '/Messagerie':          'Messagerie',
  '/MonSuivi':            'Mes Suivis',
  '/JournalDeBord':       'Journal de Bord',
  '/SuiviMensuel':        'Suivi Mensuel',
  '/BilanFinal':          'Bilan Final',
  '/ResultatsCohorte1':   'Cohorte 1 — Résultats',
  '/AdminDashboard':      'Administration',
  '/AProposMBP':          'À propos · MBP',
  '/GuideNavigation':     'Guide · Plateforme',
  '/GuideMentor':         'Guide du Mentor',
  '/GuideMentore':        'Guide du Mentoré',
  '/CharteEngagement':    "Charte d'Engagement",
  '/ProgrammeComplet':    'Programme Complet',
  '/MentorRegistration':  'Inscription Mentor',
  '/MentoreRegistration': 'Inscription Mentoré',
};

const APP = 'Passerelles · MBP';

export default function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    const label = TITLES[location.pathname];
    document.title = label ? `${label} | ${APP}` : APP;
  }, [location.pathname]);

  return null;
}
