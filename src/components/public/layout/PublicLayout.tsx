import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
import { useAppLanguage, applyUrlLanguage, arabicTwin, localizedPath, stripLangPrefix } from '../../../lib/language';
import { BackToTop } from './BackToTop';
import { ReferralWelcome } from './ReferralWelcome';
import { InstallAppNudge } from '../../pwa/InstallApp';
import { WelcomeMuteButton } from '../WelcomeRecitation';
import { LanguageWelcome } from '../LanguageWelcome';
import { Analytics } from '@vercel/analytics/react';
import { loadLaunch, useLaunch, zaadPath } from '../../../lib/launch';

export interface PublicLayoutContextType {
  lang: Language;
  onOpenTrialModal: (serviceId?: string) => void;
}

interface PublicLayoutProps {
  initialGetStartedOpen?: boolean;
}

export function PublicLayout({ initialGetStartedOpen = false }: PublicLayoutProps) {
  const { lang, setLanguage } = useAppLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const launch = useLaunch();

  // The toggle moves between a page's English and /ar address; elsewhere it only switches language.
  const handleToggleLang = () => {
    const next: Language = lang === 'ar' ? 'en' : 'ar';
    const target = localizedPath(location.pathname, next);
    if (target !== location.pathname) navigate(target + location.search + location.hash);
    setLanguage(next);
  };

  // Arriving at an /ar address picks Arabic; someone who chose Arabic and lands on an English address goes to its /ar twin.
  useEffect(() => {
    applyUrlLanguage(location.pathname);
    const twin = arabicTwin(location.pathname);
    if (twin) navigate(twin + location.search + location.hash, { replace: true });
  }, [location.pathname]);

  const [getStartedModalOpen, setGetStartedModalOpen] = useState<boolean>(Boolean(initialGetStartedOpen));
  const [preselectedService, setPreselectedService] = useState<string | undefined>();
  const [studentModalOpen, setStudentModalOpen] = useState<boolean>(false);
  const [studentModalInitialView, setStudentModalInitialView] = useState<'login' | 'signup'>('login');
  const [publicTourOpen, setPublicTourOpen] = useState<boolean>(false);

  // Scroll to top on every page change, or to the linked section (e.g. /terms#refunds).
  // Switching the same page between Arabic and English keeps the reader where they are.
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    const page = stripLangPrefix(location.pathname);
    const samePage = page === lastPage.current;
    lastPage.current = page;
    if (samePage) return;
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
        ? 'اختر الإضاءة التي ترتاح لها عينك.'
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
        handleOpenGetStarted();
      } else if (hash === '#book' || hash === '#trial' || hash === '#free-trial') {
        // No guest bookings (RULES.md §2): booking starts by signing in or creating an account.
        handleOpenGetStarted();
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

  // While sign-up opens in waves, /get-started leads to the waitlist.
  useEffect(() => {
    if (launch.signupMode === 'waitlist' && stripLangPrefix(location.pathname) === '/get-started') navigate(zaadPath(lang !== 'ar'), { replace: true });
  }, [launch.signupMode, location.pathname]);

  function handleOpenGetStarted(serviceId?: string) {
    // Sign-up opens in waves (RULES.md, launch): the call to action leads to the waitlist instead.
    // loadLaunch() is cached after the first call, so this waits only if the mode is not known yet.
    loadLaunch().then(({ signupMode }) => {
      if (signupMode === 'waitlist') { navigate(zaadPath(lang !== 'ar')); return; }
      setPreselectedService(serviceId);
      setGetStartedModalOpen(true);
    });
  }


  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
        {/* First stop for a keyboard or screen reader: past the menu, straight to the page (P4-037). */}
        <a href="#site-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:px-4 focus:py-3 focus:rounded-xl focus:bg-foreground focus:text-background focus:font-bold" data-testid="skip-link">
          {lang === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to main content'}
        </a>
        {/* Global Navigation */}
        <Navbar
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenTrialModal={(serviceId) => handleOpenGetStarted(serviceId)}
          onStartTour={() => setPublicTourOpen(true)}
        />
        <ReferralWelcome lang={lang} />

        <div id="site-content" tabIndex={-1} className="outline-none">
          <Outlet context={{ lang, onOpenTrialModal: handleOpenGetStarted } as PublicLayoutContextType} />
        </div>
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
          onToggleLang={handleToggleLang}
          initialView={studentModalInitialView}
        />}
        </Suspense>

        {/* AI Learning Guide (end corner) and back to top (the opposite corner) */}
        <LearningGuide lang={lang} />
        <BackToTop isAr={lang === 'ar'} />
        <InstallAppNudge isAr={lang === 'ar'} />
        <WelcomeMuteButton isAr={lang === 'ar'} />
        <LanguageWelcome />

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
