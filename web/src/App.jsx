import React, { lazy, Suspense } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import PWAInstallPrompt from '@/components/PWAInstallPrompt.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('@/pages/SignupPage.jsx'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage.jsx'));
const ClientsPage = lazy(() => import('@/pages/ClientsPage.jsx'));
const EquipmentsPage = lazy(() => import('@/pages/EquipmentsPage.jsx'));
const SchedulesPage = lazy(() => import('@/pages/SchedulesPage.jsx'));
const ScheduleViewPage = lazy(() => import('@/pages/ScheduleViewPage.jsx'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage.jsx'));
const ReportViewer = lazy(() => import('@/pages/ReportViewer.jsx'));
const ProposalsPage = lazy(() => import('@/pages/ProposalsPage.jsx'));
const ProposalViewer = lazy(() => import('@/pages/ProposalViewer.jsx'));
const ReportForm = lazy(() => import('@/components/ReportForm.jsx'));
const ReportFormEditor = lazy(() => import('@/components/ReportFormEditor.jsx'));
const ReportEditor = lazy(() => import('@/components/ReportEditor.jsx'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

const ReportFormWrapper = ({ isEdit }) => (
  <div className="min-h-screen flex flex-col bg-muted/20">
    <Header />
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {isEdit ? <ReportFormEditor /> : <ReportForm />}
      </div>
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
              <Route path="/equipments" element={<ProtectedRoute><EquipmentsPage /></ProtectedRoute>} />
              <Route path="/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
              <Route path="/schedules/:id" element={<ProtectedRoute><ScheduleViewPage /></ProtectedRoute>} />
              
              <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
              <Route path="/reports/new" element={<ProtectedRoute excludedRoles={['Técnico']}><ReportFormWrapper isEdit={false} /></ProtectedRoute>} />
              <Route path="/reports/new/:clientId/:scheduleId" element={<ProtectedRoute excludedRoles={['Técnico']}><ReportFormWrapper isEdit={false} /></ProtectedRoute>} />
              <Route path="/reports/:id" element={<ProtectedRoute><ReportViewer /></ProtectedRoute>} />
              <Route path="/reports/:id/edit" element={<ProtectedRoute><ReportFormWrapper isEdit={true} /></ProtectedRoute>} />
              
              <Route path="/proposals" element={<ProtectedRoute><ProposalsPage /></ProtectedRoute>} />
              <Route path="/proposals/:id" element={<ProtectedRoute><ProposalViewer /></ProtectedRoute>} />
              
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" richColors />
          <PWAInstallPrompt />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;