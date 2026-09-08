import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MarqueeTicker } from './components/MarqueeTicker';
import { UnifiedMentorshipConvergence } from './components/UnifiedMentorshipConvergence';
import { DisciplineSwitcherShowcase } from './components/DisciplineSwitcherShowcase';
import { LessonStudioShowcase } from './components/LessonStudioShowcase';
import { ServicesSection } from './components/ServicesSection';
import { AboutSection } from './components/AboutSection';
import { TeachingApproach } from './components/TeachingApproach';
import { HowItWorks } from './components/HowItWorks';
import { FreeTrialSection } from './components/FreeTrialSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { TrialBookingModal } from './components/TrialBookingModal';
import { ManageBookingModal } from './components/booking/ManageBookingModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { StudentAuthModal } from './components/StudentAuthModal';
import { GetStartedModal } from './components/GetStartedModal';
import { TeacherAuthProvider } from './lib/auth';
import { Language, ThemeMode } from './types';
import { BookingMode } from './booking/types';

import { LearningGuide } from './components/LearningGuide';

interface LandingPageProps {
  initialGetStartedOpen?: boolean;
}

export function LandingPage({ initialGetStartedOpen = false }: LandingPageProps) {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('mahmoud_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore
    }
    return 'light';
  });

  const [getStartedModalOpen, setGetStartedModalOpen] = useState<boolean>(Boolean(initialGetStartedOpen));
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [bookingMode, setBookingMode] = useState<BookingMode>('trial');
  const [preselectedService, setPreselectedService] = useState<string | undefined>();
  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState<boolean>(false);
  const [studentModalOpen, setStudentModalOpen] = useState<boolean>(false);

  // Manage RTL / LTR layout and HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Manage Dark / Light theme class on html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('mahmoud_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Listen to hash / URL changes for direct routes (#book, #free-trial, #manage, #manage)
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#get-started' || hash === '#start') {
        setGetStartedModalOpen(true);
      } else if (hash === '#book' || hash === '#trial' || hash === '#free-trial') {
        setBookingMode('trial');
        setBookingModalOpen(true);
      } else if (hash === '#manage' || hash === '#reschedule') {
        setManageModalOpen(true);
      } else if (hash === '#reset-password' || hash.includes('type=recovery')) {
        setStudentModalOpen(true);
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOpenGetStarted = (serviceId?: string) => {
    setPreselectedService(serviceId);
    setGetStartedModalOpen(true);
  };

  const handleOpenBooking = (serviceId?: string, mode: BookingMode = 'trial') => {
    setPreselectedService(serviceId);
    setBookingMode(mode);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] transition-colors duration-300 font-sans">
        {/* Global Navigation */}
        <Navbar
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenTrialModal={(serviceId) => handleOpenGetStarted(serviceId)}
          onOpenManageModal={() => setManageModalOpen(true)}
        />

        <main id="main-content">
          {/* Editorial Hero */}
          <Hero lang={lang} onOpenTrialModal={() => handleOpenGetStarted(undefined)} />

          {/* Running Marquee Ticker (00:00 in video) */}
          <MarqueeTicker lang={lang} />

          {/* Convergence Scroll Animation: 3 Scattered Subscriptions -> 1 Unified Mentorship (00:01 - 00:04 in video) */}
          <UnifiedMentorshipConvergence
            lang={lang}
            onOpenTrialModal={() => handleOpenGetStarted(undefined)}
          />

          {/* Interactive Discipline Switcher with Active Accent Bar & Connection Diagram (00:04 - 00:07 in video) */}
          <DisciplineSwitcherShowcase
            lang={lang}
            onOpenTrialModal={(serviceId) => handleOpenGetStarted(serviceId)}
          />

          {/* 3D Scroll Perspective Classroom & Terminal Showcase (00:08 - 00:10 in video) */}
          <LessonStudioShowcase
            lang={lang}
            onOpenTrialModal={() => handleOpenGetStarted(undefined)}
          />

          {/* 13 Core Services Arranged by Pillars */}
          <ServicesSection
            lang={lang}
            onSelectServiceForTrial={(id) => handleOpenGetStarted(id)}
          />

          {/* About Mahmoud & Verified Trust Credentials */}
          <AboutSection lang={lang} />

          {/* Teaching Philosophy & 4 Core Pillars */}
          <TeachingApproach lang={lang} />

          {/* How It Works (Student Journey) */}
          <HowItWorks lang={lang} onOpenTrialModal={() => handleOpenGetStarted(undefined)} />

          {/* Primary Free Trial Invitation */}
          <FreeTrialSection lang={lang} onOpenTrialModal={() => handleOpenGetStarted(undefined)} />

          {/* Authentic Student & Parent Reflections */}
          <TestimonialsSection lang={lang} />

          {/* Practical Questions & FAQ */}
          <FAQSection lang={lang} />

          {/* Direct Contact & WhatsApp */}
          <ContactSection lang={lang} onOpenTrialModal={() => handleOpenGetStarted(undefined)} />
        </main>

        {/* Footer */}
        <Footer
          lang={lang}
          onToggleLang={handleToggleLang}
          onOpenTrialModal={() => handleOpenGetStarted(undefined)}
          onOpenManageModal={() => setManageModalOpen(true)}
          onOpenTeacherModal={() => setTeacherModalOpen(true)}
        />

        {/* 6-Step Guided Booking Engine Modal */}
        <TrialBookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          lang={lang}
          preselectedServiceId={preselectedService}
          initialMode={bookingMode}
        />

        {/* Manage / Reschedule Booking Modal (3-hour rule policy foundation) */}
        <ManageBookingModal
          isOpen={manageModalOpen}
          onClose={() => setManageModalOpen(false)}
          lang={lang}
        />

        {/* Teacher Auth & Diagnostics Modal (Phase 3 Backend Foundation) */}
        <TeacherAuthModal
          isOpen={teacherModalOpen}
          onClose={() => setTeacherModalOpen(false)}
          lang={lang}
        />

        {/* Get Started Choice Modal (Guest Demo, Account Creation, Login, Direct Trial) */}
        <GetStartedModal
          isOpen={getStartedModalOpen}
          onClose={() => setGetStartedModalOpen(false)}
          onOpenStudentSignup={() => setStudentModalOpen(true)}
          onOpenStudentLogin={() => setStudentModalOpen(true)}
          onOpenDirectTrialBooking={() => handleOpenBooking(preselectedService, 'trial')}
          lang={lang}
        />

        {/* Student Auth Modal */}
        <StudentAuthModal
          isOpen={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          lang={lang}
        />

        {/* AI Learning Guide */}
        <LearningGuide lang={lang} />
      </div>
  );
}
