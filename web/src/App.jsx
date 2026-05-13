import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import ClientsPage from '@/pages/ClientsPage.jsx';
import EquipmentsPage from '@/pages/EquipmentsPage.jsx';
import SchedulesPage from '@/pages/SchedulesPage.jsx';
import ScheduleViewPage from '@/pages/ScheduleViewPage.jsx';
import ReportsPage from '@/pages/ReportsPage.jsx';
import ReportViewer from '@/pages/ReportViewer.jsx';
import ReportForm from '@/components/ReportForm.jsx';
import ReportEditor from '@/components/ReportEditor.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const ReportFormWrapper = ({ isEdit }) => (
  <div className="min-h-screen flex flex-col bg-muted/20">
    <Header />
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {isEdit ? <ReportEditor /> : <ReportForm />}
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
            
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;