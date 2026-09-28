import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeacherAuthProvider } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { PublicLayout } from './components/public/layout/PublicLayout';
import { PublicHomepage } from './components/public/homepage/PublicHomepage';
import { AboutPage } from './components/public/about/AboutPage';
import { LearningPage } from './components/public/learning/LearningPage';
import { PricingPage } from './components/public/pricing/PricingPage';
import { FAQPage } from './components/public/faq/FAQPage';
import { DashboardApp } from './dashboard/DashboardApp';
import StudentApp from './student/StudentApp';
import StaffLoginPage from './pages/StaffLoginPage';
import SEOProtection from './components/SEOProtection';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <TeacherAuthProvider>
        <BrowserRouter>
          <SEOProtection />
          <ErrorBoundary>
            <Routes>
              {/* Public Routes with Shared Layout */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<PublicHomepage />} />
                <Route path="/get-started" element={<PublicHomepage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FAQPage />} />
              </Route>

              {/* Authenticated and Special Routes */}
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/teacher/*" element={<DashboardApp />} />
              <Route path="/dashboard/*" element={<DashboardApp />} />
              <Route path="/student/*" element={<StudentApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TeacherAuthProvider>
    </ThemeProvider>
  );
}
