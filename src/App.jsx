import AuthCallback from './pages/AuthCallback';
import Login from './pages/Login';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import PageTransition from '@/components/PageTransition';
import PageTitle from '@/components/PageTitle';
import ScrollToTop from '@/components/ScrollToTop';
import MonSuivi from './pages/MonSuivi';
import ResultatsCohorte1 from './pages/ResultatsCohorte1';
import AProposMBP from './pages/AProposMBP';
import GuideNavigation from './pages/GuideNavigation';
import ProgrammeComplet from './pages/ProgrammeComplet';
import SuiviMensuel from './pages/SuiviMensuel';
import JournalDeBord from './pages/JournalDeBord';
import MonEspace from './pages/MonEspace';
import BilanFinal from './pages/BilanFinal';
import Messagerie from './pages/Messagerie';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RequireAuth from '@/components/RequireAuth';
import GuideMentor from './pages/GuideMentor';
import GuideMentore from './pages/GuideMentore';
import CharteEngagement from './pages/CharteEngagement';
import CriteresSelection from './pages/CriteresSelection';
import MentorRegistration from './pages/MentorRegistration';
import MentoreRegistration from './pages/MentoreRegistration';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import MentionsLegales from './pages/MentionsLegales';


const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError } = useAuth();


  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <PageTransition>
      <Routes>
        <Route path="/GuideMentor" element={<LayoutWrapper currentPageName="GuideMentor"><GuideMentor /></LayoutWrapper>} />
        <Route path="/GuideMentore" element={<LayoutWrapper currentPageName="GuideMentore"><GuideMentore /></LayoutWrapper>} />
        <Route path="/CharteEngagement" element={<LayoutWrapper currentPageName="CharteEngagement"><CharteEngagement /></LayoutWrapper>} />
        <Route path="/CriteresSelection" element={<LayoutWrapper currentPageName="CriteresSelection"><CriteresSelection /></LayoutWrapper>} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset" element={<AuthCallback forceReset={true} />} />
        <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
        {Object.entries(Pages)
          .filter(([path]) => !['AdminDashboard', 'SuiviMensuel', 'Home'].includes(path))
          .map(([path, Page]) => (
            <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
          ))}
        <Route path="/AdminDashboard" element={<RequireAuth><LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper></RequireAuth>} />
        <Route path="/MonSuivi" element={<RequireAuth><LayoutWrapper currentPageName="MonSuivi"><MonSuivi /></LayoutWrapper></RequireAuth>} />
        <Route path="/SuiviMensuel" element={<RequireAuth><LayoutWrapper currentPageName="SuiviMensuel"><SuiviMensuel /></LayoutWrapper></RequireAuth>} />
        <Route path="/JournalDeBord" element={<RequireAuth><LayoutWrapper currentPageName="JournalDeBord"><JournalDeBord /></LayoutWrapper></RequireAuth>} />
        <Route path="/MonEspace" element={<RequireAuth><LayoutWrapper currentPageName="MonEspace"><MonEspace /></LayoutWrapper></RequireAuth>} />
        <Route path="/BilanFinal" element={<RequireAuth><LayoutWrapper currentPageName="BilanFinal"><BilanFinal /></LayoutWrapper></RequireAuth>} />
        <Route path="/Messagerie" element={<RequireAuth><LayoutWrapper currentPageName="Messagerie"><Messagerie /></LayoutWrapper></RequireAuth>} />
        <Route path="/ResultatsCohorte1" element={<LayoutWrapper currentPageName="ResultatsCohorte1"><ResultatsCohorte1 /></LayoutWrapper>} />
        <Route path="/AProposMBP" element={<LayoutWrapper currentPageName="AProposMBP"><AProposMBP /></LayoutWrapper>} />
        <Route path="/GuideNavigation" element={<LayoutWrapper currentPageName="GuideNavigation"><GuideNavigation /></LayoutWrapper>} />
        <Route path="/ProgrammeComplet" element={<LayoutWrapper currentPageName="ProgrammeComplet"><ProgrammeComplet /></LayoutWrapper>} />
        <Route path="/MentorRegistration" element={<LayoutWrapper currentPageName="MentorRegistration"><MentorRegistration /></LayoutWrapper>} />
        <Route path="/MentoreRegistration" element={<LayoutWrapper currentPageName="MentoreRegistration"><MentoreRegistration /></LayoutWrapper>} />
        <Route path="/PolitiqueConfidentialite" element={<LayoutWrapper currentPageName="PolitiqueConfidentialite"><PolitiqueConfidentialite /></LayoutWrapper>} />
        <Route path="/MentionsLegales" element={<LayoutWrapper currentPageName="MentionsLegales"><MentionsLegales /></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </PageTransition>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <PageTitle />
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App