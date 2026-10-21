import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../Navbar';
import { Footer } from '../../Footer';
// Dialogs load on first open: they pull in booking, auth and country data the first paint doesn't need.
const StudentAuthModal = lazy(() => import('../../StudentAuthModal').then((m) => ({ default: m.StudentAuthModal })));
const GetStartedModal = lazy(() => import('../../GetStartedModal').then((m) => ({ default: m.GetStartedModal })));
import { Language } from '../../../types';
import { LearningGuide } from '../../LearningGuide';
import { useTheme } from '../../ThemeProvider';
import { OnboardingGuide, OnboardingStep } from '../../ui/OnboardingGuide';
import { useAppLanguage } from '../../../lib/language';
import { WelcomeStopButton } from '../WelcomeRecitation';
import { BackToTop } from './BackToTop';
import { Analytics } from '@vercel/analytics/react';

export interface PublicLayoutContextType {
  lang: Language;
  onOpenTrialModal: (serviceId?: string) => void;
}

interface PublicLayoutProps {
  initialGetStartedOpen?: boolean;
}

export function PublicLayout({ initialGetStartedOpen = false }: PublicLayoutProps) {
  const { lang, toggleLanguage: handleToggleLang } = useAppLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [getStartedModalOpen, setGetStartedModalOpen] = useState<boolean>(Boolean(initialGetStartedOpen));
  const [preselectedService, setPreselectedService] = useState<string | undefined>();
  const [studentModalOpen, setStudentModalOpen] = useState<boolean>(false);
  const [studentModalInitialView, setStudentModalInitialView] = useState<'login' | 'signup'>('login');
  const [publicTourOpen, setPublicTourOpen] = useState<boolean>(false);

  // Scroll to top on every page change, or to the linked section (e.g. /terms#refunds).
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const publicTourSteps: OnboardingStep[] = [
    {
      targetId: 'nav-brand',
      title: lang === 'ar' ? 'وتزودوا' : 'Watazawwado',
      description: lang === 'ar'
        ? 'أكاديمية أونلاين لحصص فردية في القرآن والتجويد ومسار الأثر والعربية والإنجليزية.'
        : 'An online academy for one-on-one lessons in Quran, Tajweed, the Zad Path, Arabic and English.',
      position: 'bottom',
    },
    {
      targetId: ['nav-links-desktop', 'mobile-menu-toggle', 'hero-learn-more-btn'],
      title: lang === 'ar' ? 'أقسام الموقع' : 'The sections',
      description: lang === 'ar'
        ? 'من القائمة تلاقي المواد، وطريقتنا في التدريس، والأسعار، والأسئلة الشائعة.'
        : 'The menu has the subjects, how we teach, prices and common questions.',
      position: 'bottom',
    },
    {
      targetId: 'hero-get-started-btn',
      title: lang === 'ar' ? 'حصة تجريبية مجانية' : 'A free trial lesson',
      description: lang === 'ar'
        ? 'أول حصة مجاناً: ٣٠ دقيقة نعرف فيها مستواك وهدفك، من غير أي التزام.'
        : 'Your first lesson is free: 30 minutes to find your level and your goal, with no obligation.',
      position: 'bottom',
    },
    {
      targetId: 'verse-sound-btn',
      title: lang === 'ar' ? 'تلاوة الترحيب 🎧' : 'Welcome recitation 🎧',
      description: lang === 'ar'
        ? 'تحت آية ﴿وتزودوا فإن خير الزاد التقوى﴾ في الصفحة الرئيسية، اضغط "استمع للتلاوة" وقت ما تحب.'
        : 'Under the verse on the homepage, tap “Listen to the recitation” whenever you like.',
      position: 'top',
    },
    {
      targetId: 'lang-switch-btn',
      title: lang === 'ar' ? 'اللغة' : 'Language',
      description: lang === 'ar'
        ? 'بدّل بين العربي والإنجليزي بلمسة واحدة.'
        : 'Switch between Arabic and English with one tap.',
      position: 'bottom',
    },
    {
      targetId: 'theme-toggle-btn',
      title: lang === 'ar' ? 'نهاري وليلي' : 'Day and night',
      description: lang === 'ar'
        ? 'اختار الإضاءة اللي ترتاح لها عينك.'
        : 'Choose the light that is easiest on your eyes.',
      position: 'bottom',
    },
  ];

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
        // No guest bookings (RULES.md §2): booking starts by signing in or creating an account.
        setGetStartedModalOpen(true);
      } else if (hash === '#manage' || hash === '#reschedule') {
        // Lessons are moved or cancelled from the student account (sign-in required).
        navigate('/student/lessons');
      } else if (hash === '#reset-password' || hash.includes('type=recovery')) {
        setStudentModalOpen(true);
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  const handleOpenGetStarted = (serviceId?: string) => {
    setPreselectedService(serviceId);
    setGetStartedModalOpen(true);
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
          onStartTour={() => setPublicTourOpen(true)}
        />

        <Outlet context={{ lang, onOpenTrialModal: handleOpenGetStarted } as PublicLayoutContextType} />
        {/* Cookie-free page views, public pages only (docs/marketing/PLAN.md §8). */}
        <Analytics />

        {/* Footer */}
        <Footer
          lang={lang}
          onToggleLang={handleToggleLang}
          onOpenTrialModal={() => handleOpenGetStarted(undefined)}
        />


        <Suspense fallback={null}>

        {/* Get Started Choice Modal (Guest Demo, Account Creation, Login) */}
        {getStartedModalOpen && <GetStartedModal
          isOpen={getStartedModalOpen}
          onClose={() => setGetStartedModalOpen(false)}
          onOpenStudentSignup={() => {
            setStudentModalInitialView('signup');
            setStudentModalOpen(true);
          }}
          onOpenStudentLogin={() => {
            setStudentModalInitialView('login');
            setStudentModalOpen(true);
          }}
          lang={lang}
        />}

        {/* Student Auth Modal */}
        {studentModalOpen && <StudentAuthModal
          isOpen={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          lang={lang}
          initialView={studentModalInitialView}
        />}
        </Suspense>

        {/* AI Learning Guide (end corner) and back to top (the opposite corner) */}
        <LearningGuide lang={lang} />
        <BackToTop isAr={lang === 'ar'} />

        {/* Stop button while the welcome recitation plays (started from the homepage or the menu) */}
        <WelcomeStopButton isAr={lang === 'ar'} />

        {/* Interactive Site Tour Guide */}
        <OnboardingGuide
          steps={publicTourSteps}
          isOpen={publicTourOpen}
          onClose={() => setPublicTourOpen(false)}
          isAr={lang === 'ar'}
        />
      </div>
  );
}
