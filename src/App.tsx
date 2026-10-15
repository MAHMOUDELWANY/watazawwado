import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getAuthLinkType } from './lib/supabase';
import { TeacherAuthProvider } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import { PublicLayout } from './components/public/layout/PublicLayout';
import { PublicHomepage } from './components/public/homepage/PublicHomepage';
import { AboutPage } from './components/public/about/AboutPage';
import { LearningPage } from './components/public/learning/LearningPage';
import { HowItWorksPage } from './components/public/how-it-works/HowItWorksPage';
import { PricingPage } from './components/public/pricing/PricingPage';
import { FAQPage } from './components/public/faq/FAQPage';
import { PrivacyPolicyPage } from './components/public/privacy/PrivacyPolicyPage';
import { TermsPage } from './components/public/terms/TermsPage';
import SEOProtection from './components/SEOProtection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useScrollPaletteTransition } from './lib/useScrollPaletteTransition';
import { BrandLoader } from './components/ui/BrandLoader';

/**
 * After a new deployment the old page's lazy files no longer exist, so the next page change failed
 * with "Something went wrong". Reload once to pick up the new version (guarded against loops).
 */
const RELOAD_KEY = 'wz_chunk_reload_at';
function lazyWithReload<T extends React.ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((err) => {
      let last = 0;
      try { last = Number(sessionStorage.getItem(RELOAD_KEY) || 0); } catch {}
      if (Date.now() - last > 30000) {
        try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch {}
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    })
  );
}

// The dashboard, student portal and auth pages load on demand so public visitors don't download them.
const DashboardApp = lazyWithReload(() => import('./dashboard/DashboardApp').then(m => ({ default: m.DashboardApp })));
const StudentApp = lazyWithReload(() => import('./student/StudentApp'));
const StaffLoginPage = lazyWithReload(() => import('./pages/StaffLoginPage'));
const OtpVerificationPage = lazyWithReload(() => import('./pages/OtpVerificationPage'));
const StaffSetPasswordPage = lazyWithReload(() => import('./pages/StaffSetPasswordPage'));

/** An invitation link signs the teacher in; send them to choose a password wherever they landed. */
function InviteRedirect() {
  const { pathname } = useLocation();
  if (getAuthLinkType() === 'invite' && pathname !== '/staff/set-password') {
    return <Navigate to="/staff/set-password" replace />;
  }
  return null;
}

export default function App() {
  useScrollPaletteTransition();

  return (
    <ThemeProvider>
      <TeacherAuthProvider>
        <BrowserRouter>
          <SEOProtection />
          <InviteRedirect />
          <ErrorBoundary>
            <Suspense fallback={<BrandLoader size="page" />}>
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
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
              </Route>

              {/* Authenticated and Special Routes */}
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/staff/set-password" element={<StaffSetPasswordPage />} />
              <Route path="/staff" element={<Navigate to="/staff/login" replace />} />
              <Route path="/teacher/login" element={<Navigate to="/staff/login" replace />} />
              <Route path="/teacher/*" element={<DashboardApp />} />
              <Route path="/dashboard/*" element={<DashboardApp />} />
              <Route path="/student/login" element={<Navigate to="/student?auth=login" replace />} />
              <Route path="/student/verify" element={<OtpVerificationPage />} />
              <Route path="/otp" element={<OtpVerificationPage />} />
              <Route path="/verify-otp" element={<OtpVerificationPage />} />
              <Route path="/verify" element={<OtpVerificationPage />} />
              <Route path="/student/*" element={<StudentApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TeacherAuthProvider>
    </ThemeProvider>
  );
}
