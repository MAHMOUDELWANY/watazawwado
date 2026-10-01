import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TeacherAuthProvider } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { PublicLayout } from './components/public/layout/PublicLayout';
import { PublicHomepage } from './components/public/homepage/PublicHomepage';
import { AboutPage } from './components/public/about/AboutPage';
import { LearningPage } from './components/public/learning/LearningPage';
import { HowItWorksPage } from './components/public/how-it-works/HowItWorksPage';
import { PricingPage } from './components/public/pricing/PricingPage';
import { FAQPage } from './components/public/faq/FAQPage';
import { DashboardApp } from './dashboard/DashboardApp';
import StudentApp from './student/StudentApp';
import StaffLoginPage from './pages/StaffLoginPage';
import SEOProtection from './components/SEOProtection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useScrollPaletteTransition } from './lib/useScrollPaletteTransition';

export default function App() {
  useScrollPaletteTransition();

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
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FAQPage />} />
              </Route>

              {/* Authenticated and Special Routes */}
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/staff" element={<Navigate to="/staff/login" replace />} />
              <Route path="/teacher/login" element={<Navigate to="/staff/login" replace />} />
              <Route path="/teacher/*" element={<DashboardApp />} />
              <Route path="/dashboard/*" element={<DashboardApp />} />
              <Route path="/student/login" element={<Navigate to="/student?auth=login" replace />} />
              <Route path="/student/*" element={<StudentApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TeacherAuthProvider>
    </ThemeProvider>
  );
}
