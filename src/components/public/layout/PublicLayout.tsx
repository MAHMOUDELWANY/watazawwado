import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../../Navbar';
import { Footer } from '../../Footer';
import { TrialBookingModal } from '../../TrialBookingModal';
import { ManageBookingModal } from '../../booking/ManageBookingModal';
import { TeacherAuthModal } from '../../TeacherAuthModal';
import { StudentAuthModal } from '../../StudentAuthModal';
import { GetStartedModal } from '../../GetStartedModal';
import { Language } from '../../../types';
import { BookingMode } from '../../../booking/types';
import { LearningGuide } from '../../LearningGuide';
import { useTheme } from '../../ThemeProvider';

export interface PublicLayoutContextType {
  lang: Language;
  onOpenTrialModal: (serviceId?: string) => void;
}

interface PublicLayoutProps {
  initialGetStartedOpen?: boolean;
}

export function PublicLayout({ initialGetStartedOpen = false }: PublicLayoutProps) {
  const [lang, setLang] = useState<Language>('en');
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
        {/* Global Navigation */}
        <Navbar
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenTrialModal={(serviceId) => handleOpenGetStarted(serviceId)}
          onOpenManageModal={() => setManageModalOpen(true)}
        />

        <Outlet context={{ lang, onOpenTrialModal: handleOpenGetStarted } as PublicLayoutContextType} />

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

        {/* Get Started Choice Modal (Guest Demo, Account Creation, Login) */}
        <GetStartedModal
          isOpen={getStartedModalOpen}
          onClose={() => setGetStartedModalOpen(false)}
          onOpenStudentSignup={() => setStudentModalOpen(true)}
          onOpenStudentLogin={() => setStudentModalOpen(true)}
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
