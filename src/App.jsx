import React, { lazy, Suspense } from 'react';
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
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RequireAuth from '@/components/RequireAuth';
import RequireAdmin from '@/components/RequireAdmin';

const MonSuivi           = lazy(() => import('./pages/MonSuivi'));
const ResultatsCohorte1  = lazy(() => import('./pages/ResultatsCohorte1'));
const AProposMBP         = lazy(() => import('./pages/AProposMBP'));
const GuideNavigation    = lazy(() => import('./pages/GuideNavigation'));
const ProgrammeComplet   = lazy(() => import('./pages/ProgrammeComplet'));
const SuiviMensuel       = lazy(() => import('./pages/SuiviMensuel'));
const JournalDeBord      = lazy(() => import('./pages/JournalDeBord'));
const MonEspace          = lazy(() => import('./pages/MonEspace'));
const BilanFinal         = lazy(() => import('./pages/BilanFinal'));
const Messagerie         = lazy(() => import('./pages/Messagerie'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const GuideMentor        = lazy(() => import('./pages/GuideMentor'));
const GuideMentore       = lazy(() => import('./pages/GuideMentore'));
const CharteEngagement   = lazy(() => import('./pages/CharteEngagement'));
const CriteresSelection  = lazy(() => import('./pages/CriteresSelection'));
const MentorRegistration   = lazy(() => import('./pages/MentorRegistration'));
const MentoreRegistration  = lazy(() => import('./pages/MentoreRegistration'));
const PolitiqueConfidentialite = lazy(() => import('./pages/PolitiqueConfidentialite'));
const MentionsLegales    = lazy(() => import('./pages/MentionsLegales'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
  </div>
);


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
      <Suspense fallback={<PageLoader />}>
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
        <Route path="/AdminDashboard" element={<RequireAdmin><LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper></RequireAdmin>} />
        <Route path="/MonSuivi" element={<RequireAuth><LayoutWrapper currentPageName="MonSuivi"><MonSuivi /></LayoutWrapper></RequireAuth>} />
        <Route path="/SuiviMensuel" element={<RequireAuth><LayoutWrapper currentPageName="SuiviMensuel"><SuiviMensuel /></LayoutWrapper></RequireAuth>} />
        <Route path="/JournalDeBord" element={<RequireAuth><LayoutWrapper currentPageName="JournalDeBord"><JournalDeBord /></LayoutWrapper></RequireAuth>} />
        <Route path="/MonEspace" element={<RequireAuth><LayoutWrapper currentPageName="MonEspace"><MonEspace /></LayoutWrapper></RequireAuth>} />
        <Route path="/BilanFinal" element={<RequireAuth><LayoutWrapper currentPageName="BilanFinal"><BilanFinal /></LayoutWrapper></RequireAuth>} />
        <Route path="/Messagerie" element={<RequireAuth><LayoutWrapper currentPageName="Messagerie"><Messagerie /></LayoutWrapper></RequireAuth>} />
        <Route path="/ResultatsCohorte1" element={<RequireAuth><LayoutWrapper currentPageName="ResultatsCohorte1"><ResultatsCohorte1 /></LayoutWrapper></RequireAuth>} />
        <Route path="/AProposMBP" element={<LayoutWrapper currentPageName="AProposMBP"><AProposMBP /></LayoutWrapper>} />
        <Route path="/GuideNavigation" element={<LayoutWrapper currentPageName="GuideNavigation"><GuideNavigation /></LayoutWrapper>} />
        <Route path="/ProgrammeComplet" element={<LayoutWrapper currentPageName="ProgrammeComplet"><ProgrammeComplet /></LayoutWrapper>} />
        <Route path="/MentorRegistration" element={<LayoutWrapper currentPageName="MentorRegistration"><MentorRegistration /></LayoutWrapper>} />
        <Route path="/MentoreRegistration" element={<LayoutWrapper currentPageName="MentoreRegistration"><MentoreRegistration /></LayoutWrapper>} />
        <Route path="/PolitiqueConfidentialite" element={<LayoutWrapper currentPageName="PolitiqueConfidentialite"><PolitiqueConfidentialite /></LayoutWrapper>} />
        <Route path="/MentionsLegales" element={<LayoutWrapper currentPageName="MentionsLegales"><MentionsLegales /></LayoutWrapper>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
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