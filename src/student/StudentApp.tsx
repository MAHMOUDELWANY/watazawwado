import { InstallAppEntry } from '../components/pwa/InstallApp';
import { BrandLogo } from '../components/ui/BrandLogo';
import { AccountDropdown } from '../components/ui/AccountDropdown';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { BrandLoader } from '../components/ui/BrandLoader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { MobileTabBar, isTabActive, MOBILE_TAB_BAR_PADDING } from '../components/ui/MobileTabBar';
import { SidebarHandle, useSidebarOpen } from '../components/ui/SidebarHandle';
import { WelcomeLoader, useWelcomeGate, markJustSignedIn } from '../components/ui/WelcomeLoader';
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { HelpCircle, Globe, LogOut, BookOpen,
  User,
  MoreHorizontal,
  X,
  Sparkles,
  Calendar,
  Plus,
  ArrowRight,
  Compass,
  Bell,
  ChevronRight,
  MessageCircle,
  Library,
  CalendarDays,
  Gift,
  Wallet,
} from 'lucide-react';
import { useTeacherAuth } from '../lib/auth';
import { useAppLanguage } from '../lib/language';

import { ErrorBoundary } from '../components/ErrorBoundary';
import StudentHomePage from './pages/StudentHomePage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentOnboardingPage from './pages/StudentOnboardingPage';
import StudentBookingPage from './pages/StudentBookingPage';
import StudentLessonsPage from './pages/StudentLessonsPage';


import StudentNotificationsPage from './pages/StudentNotificationsPage';
import StudentOffersPage from './pages/StudentOffersPage';
import StudentInvitePage from './pages/StudentInvitePage';
import StudentPlacementPage from './pages/StudentPlacementPage';
import StudentPlacementReportPage from './pages/StudentPlacementReportPage';
import StudentCurriculumPage, { StudentCurriculumLessonPage } from './pages/StudentCurriculumPage';
import StudentProgressPage from './pages/StudentProgressPage';
import StudentProgressReportPage from './pages/StudentProgressReportPage';
import StudentCalendarPage from './pages/StudentCalendarPage';
import { ChatPanel } from '../components/chat/ChatPanel';
import IntakeConversation from '../components/intake/IntakeConversation';
import { Button } from '../components/ui/Button';
import { ActiveLearnerProvider, ChildSwitcher, PROFILE_CHANGED_EVENT } from './activeLearner';
import { familyTourSteps, isFamilyAccount, markFamilyTourSeen, shouldAutoOpenFamilyTour } from './familyTour';
import { StudentAuthModal } from '../components/StudentAuthModal';
import { AuthPage, AuthCard, AuthPortal } from '../components/auth/AuthFrame';
import { useOtpCelebrating } from '../components/auth/otpCelebration';
import {  buildStudentNotifications,
  countUnread,
  notificationReadStateKey,
  getSavedNotificationReadIds
} from './notificationsPresentation';
import { FeedbackHost } from '../components/ui/Feedback';
import { TimezoneCheck } from '../components/ui/TimezoneCheck';
import { setActiveWorkingTimezone } from '../lib/countryTimezones';
import { authedJson } from '../lib/authedJson';
import { DateTime } from 'luxon';
import StudentWalletPage from './pages/StudentWalletPage';

export default function StudentApp() {
  const { user, session, loading, isTeacherAuthenticated, userRole, signOut } = useTeacherAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, toggleDesktopSidebar] = useSidebarOpen('student-sidebar-open');
  const [showGlobalTour, setShowGlobalTour] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const location = useLocation();
  const isSignupParam = location.search.includes('auth=signup') || location.pathname.includes('/signup');
  const isLoginParam = location.search.includes('auth=login') || location.pathname.includes('/login');
  const shouldAutoOpenAuth = isLoginParam || isSignupParam;
  const [authModalOpen, setAuthModalOpen] = useState(shouldAutoOpenAuth);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'signup'>(isSignupParam ? 'signup' : 'login');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [unreadChats, setUnreadChats] = useState<number>(0);

  useEffect(() => {
    if (location.search.includes('auth=signup') || location.pathname.includes('/signup')) {
      setAuthInitialView('signup');
      setAuthModalOpen(true);
    } else if (location.search.includes('auth=login') || location.pathname.includes('/login')) {
      setAuthInitialView('login');
      setAuthModalOpen(true);
    }
  }, [location.search, location.pathname]);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const prevSidebarOpenRef = useRef<boolean>(false);

  // Synchronized language management across public & student apps
  const { lang, isAr, toggleLanguage: toggleLang } = useAppLanguage();

  // Mobile drawer accessibility: focus management, scroll lock, keyboard trap, and Escape key
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';

      // Move focus inside the drawer when opened
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSidebarOpen(false);
          return;
        }

        if (e.key === 'Tab' && drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
      // If the sheet was open and is now closed, give focus back to the "More" tab that opened it
      if (prevSidebarOpenRef.current) {
        document.getElementById('nav-more-btn')?.focus();
      }
    }
    prevSidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load the student profile once per signed-in user. Page changes and token refreshes must not
  // bring back the full-page loader: that remounted every page and threw away what the user was doing.
  const accessToken = session?.access_token || null;
  const userId = user?.id || null;
  // A page that changes the family (PA-02 add a child) asks for a quiet reload, so the header switcher,
  // booking and home see the change without a full page reload.
  const [profileVersion, setProfileVersion] = useState(0);
  useEffect(() => {
    const reload = () => setProfileVersion((v) => v + 1);
    window.addEventListener(PROFILE_CHANGED_EVENT, reload);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, reload);
  }, []);
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (isTeacherAuthenticated || !userId) {
        if (isMounted) setLoadingProfile(false);
        return;
      }
      // Role or token still resolving: keep the loader until they are ready.
      if (userRole !== 'student' || !accessToken) return;

      try {
        const profileRes = await fetch('/api/student/me', { headers: { Authorization: `Bearer ${accessToken}` } });
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (isMounted) setProfile(data);
          // The zone saved on the account wins on every device; TimezoneCheck offers the device's zone if it differs.
          if (data?.timezone && DateTime.now().setZone(data.timezone).isValid) setActiveWorkingTimezone(data.timezone);
        } else if (profileRes.status === 404) {
          // Brand new student record in auth without DB profile row yet -> requires onboarding
          if (isMounted) {
            setProfile({
              id: null,
              name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
              email: user?.email,
              onboardingCompleted: false,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
    // accessToken is read at call time; a refreshed token for the same user must not reload the profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole, Boolean(accessToken), isTeacherAuthenticated, profileVersion]);

  // PA-05: a family account sees its short tour once, after onboarding, when no sign-in modal is open.
  useEffect(() => {
    if (authModalOpen) return;
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* blocked storage: never auto-open */ }
    if (!storage || !shouldAutoOpenFamilyTour(profile, storage)) return;
    const timer = window.setTimeout(() => setShowGlobalTour(true), 900);
    return () => window.clearTimeout(timer);
  }, [profile, authModalOpen]);

  // Unread badge: refreshed in the background on page changes, never blocks the page.
  useEffect(() => {
    if (!userId || userRole !== 'student' || !accessToken || isTeacherAuthenticated) return;
    let isMounted = true;
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      fetch('/api/student/bookings', { headers }),
      fetch('/api/student/payments', { headers }),
      fetch('/api/student/packages', { headers }),
      fetch('/api/me/notifications', { headers })
    ])
      .then(async ([bookingsRes, paymentsRes, packagesRes, inboxRes]) => {
        if (!bookingsRes.ok || !paymentsRes.ok) return;
        const bookings = await bookingsRes.json();
        const paymentsJson = await paymentsRes.json();
        const packagesData = packagesRes.ok ? await packagesRes.json() : null;
        const inbox = inboxRes.ok ? await inboxRes.json() : null;
        const items = buildStudentNotifications(
          Array.isArray(bookings) ? bookings : [],
          Array.isArray(paymentsJson?.payments) ? paymentsJson.payments : [],
          packagesData,
          getSavedNotificationReadIds(userId)
        );
        if (isMounted) {
          setUnreadNotificationsCount(countUnread(items) + Number(inbox?.unreadCount || 0));
          setUnreadChats(Number(inbox?.unreadChats || 0));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole, Boolean(accessToken), isTeacherAuthenticated, location.pathname]);


  // A sign-in made here (the auth modal) after we saw no session earns the short welcome.
  const sawSignedOut = useRef(false);
  useEffect(() => {
    if (!loading && !userId) sawSignedOut.current = true;
    else if (userId && sawSignedOut.current) {
      sawSignedOut.current = false;
      markJustSignedIn();
    }
  }, [loading, userId]);

  const studentLoading = !isTeacherAuthenticated && Boolean(user) &&
    (loading || !userRole || !session?.access_token || (userRole === 'student' && (loadingProfile || !profile)));
  const showWelcome = useWelcomeGate(studentLoading);
  // Keep the sign-up modal on screen while its OTP card plays the verified sequence.
  const otpCelebrating = useOtpCelebrating();

  // If a teacher lands here, redirect to the teacher dashboard
  if (isTeacherAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Dev builds only (never production): ?preview opens any student page's shell without signing in, so the layout can be
  // checked in a browser.
  const isDevProgressPreview =
    Boolean((import.meta as any).env?.DEV) &&
    new URLSearchParams(location.search).has('preview');

  if (showWelcome && user && !otpCelebrating && !isDevProgressPreview) {
    return (
      <WelcomeLoader
        role="student"
        lang={isAr ? 'ar' : 'en'}
        name={profile?.name || user.user_metadata?.full_name || user.user_metadata?.name}
      />
    );
  }

  // Auth Hydration Gate: Show BrandLoader while auth session or user role is resolving
  if (!isDevProgressPreview && !otpCelebrating && (loading || (user && (!userRole || !session?.access_token)))) {
    return (
      <BrandLoader 
        size="page" 
        text={isAr ? 'لحظة، بنجهّز حسابك…' : 'One moment, getting your account ready…'}
        subtext={isAr ? 'أهلاً بيك في وتزودوا' : 'Welcome to Watazawwado'}
      />
    );
  }

  // If not authenticated, provide choices: Sign In, Create Account
  if (!isDevProgressPreview && (otpCelebrating || !user || userRole !== 'student')) {
    return (
      <AuthPage isAr={isAr} onToggleLang={toggleLang}>
        <AuthCard>
          <AuthPortal
            title={isAr ? 'ركنك في وتزودوا' : 'Your corner of Watazawwado'}
            subtitle={isAr
              ? 'ادخل حسابك تشوف حصصك ورابط Zoom وملاحظات معلمك، أو افتح حساب جديد في دقيقة.'
              : 'Sign in to see your lessons, your Zoom link and your teacher’s notes, or open a new account in a minute.'}
          />
          <div className="px-6 sm:px-8 pt-6 pb-7 space-y-3">
            <Button onClick={() => { setAuthInitialView('login'); setAuthModalOpen(true); }} className="w-full !rounded-full gap-2">
              <span>{isAr ? 'ادخل حسابك' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
            <button type="button" onClick={() => { setAuthInitialView('signup'); setAuthModalOpen(true); }} className="btn-glass is-pill w-full">
              {isAr ? 'افتح حساب جديد' : 'Create an account'}
            </button>
            <InstallAppEntry isAr={isAr} className="!mt-5" />
            <p className="pt-3 text-center text-sm text-muted-foreground">
              {isAr ? 'معلم أو من الإدارة؟ ' : 'Teacher or admin? '}
              <Link to="/staff/login" className="font-bold text-[var(--teal)] hover:underline">{isAr ? 'ادخل من هنا' : 'Sign in here'}</Link>
            </p>
          </div>
        </AuthCard>

        <StudentAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          lang={lang}
          initialView={authInitialView}
        />
      </AuthPage>
    );
  }

  // Authenticated Student: Show BrandLoader until profile is definitively loaded.
  // This guarantees that newly verified students NEVER see the dashboard before onboarding!
  if (!isDevProgressPreview && (loadingProfile || !profile)) {
    return (
      <BrandLoader 
        size="page" 
        text={isAr ? 'جارٍ تحميل مساحتك التعليمية...' : 'Loading your learning home...'} 
        subtext={isAr ? 'أهلاً بك في منصة وتزودوا للقرآن واللغة العربية' : 'Welcome to Watazawwado for Quran & Arabic Studies'}
      />
    );
  }

  // Onboarding Gate: If onboarding is not completed, lock dashboard until onboarding is completed
  const needsOnboarding = !isDevProgressPreview && profile && profile.onboardingCompleted === false;
  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <StudentOnboardingPage
          currentProfile={profile}
          session={session}
          onCompleted={(updated) => {
            setProfile((prev: any) => ({ ...prev, ...updated, onboardingCompleted: true }));
          }}
        />
      </div>
    );
  }

  // Every page lives in exactly one place per screen size (owner, 2026-10-23: nothing shown twice).
  // Tablet/desktop, like the teacher's workspace: main sections as labelled pill tabs in the header, the other pages on
  // the floating ink rail, notifications / language / theme / account in the utilities pill.
  // Phone: main sections in the bottom bar, the other pages in the "More" sheet.
  type NavItem = { name: string; path: string; icon: typeof BookOpen; badge?: number | null; id?: string; tour: string };
  const home: NavItem = { name: isAr ? 'الرئيسية' : 'Home', path: '/student', icon: BookOpen, tour: 'student-home' };
  const lessons: NavItem = { name: isAr ? 'الدروس' : 'Lessons', path: '/student/lessons', icon: Calendar, tour: 'student-lessons' };
  const book: NavItem = { name: isAr ? 'احجز' : 'Book', path: '/student/book', icon: Plus, tour: 'student-book' };
  const curriculum: NavItem = { name: isAr ? 'منهجي' : 'My curriculum', path: '/student/curriculum', icon: Library, tour: 'student-curriculum' };
  const messages: NavItem = { name: isAr ? 'الرسائل' : 'Messages', path: '/student/messages', icon: MessageCircle, badge: unreadChats || null, tour: 'student-messages' };
  const calendar: NavItem = { name: isAr ? 'تقويم العيلة' : 'Calendar', path: '/student/calendar', icon: CalendarDays, tour: 'student-calendar' };
  const progress: NavItem = { name: isAr ? 'مسيرتي' : 'My progress', path: '/student/progress', icon: Compass, tour: 'student-progress' };
  const guide: NavItem = { name: isAr ? 'المرشد' : 'Guide', path: '/student/guide', icon: Sparkles, tour: 'student-guide' };
  const wallet: NavItem = { name: isAr ? 'محفظتي' : 'My wallet', path: '/student/wallet', icon: Wallet, tour: 'student-wallet' };
  const invite: NavItem = { name: isAr ? 'ادعُ صاحبك' : 'Invite friends', path: '/student/invite', icon: Gift, tour: 'student-invite' };

  const topTabs = [home, lessons, book, curriculum];
  const railItems = [messages, wallet, calendar, progress, guide, invite];
  const moreItems = [curriculum, wallet, calendar, progress, guide, invite];
  const isActive = (path: string) =>
    isTabActive(path, location.pathname, '/student') || (path === '/student/account' && isTabActive('/student/profile', location.pathname, '/student'));

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const globalTourSteps = [
    {
      targetId: ['nav-book-link', 'nav-book-link-desktop', 'student-book'],
      title: isAr ? 'حجز الدروس' : 'Book Lessons',
      description: isAr ? 'من هنا يمكنك حجز مواعيد حصصك الفردية المباشرة بكل سهولة.' : 'Schedule your personalized 1-on-1 sessions at your preferred times.',
      position: 'top' as const,
    },
    {
      targetId: ['nav-lessons-link', 'nav-lessons-link-desktop', 'student-lessons'],
      title: isAr ? 'جدول الدروس' : 'My Lessons',
      description: isAr ? 'متابعة جميع حصصك القادمة والسابقة وروابط زووم المباشرة.' : 'Review your upcoming schedule, past sessions, and direct Zoom links.',
      position: 'top' as const,
    },
    {
      targetId: ['nav-account-link', 'nav-account-link-desktop', 'student-account'],
      title: isAr ? 'إدارة الحساب' : 'Account & Profile',
      description: isAr ? 'تعديل بياناتك، متابعة رصيدك، وضبط أهدافك التعليمية.' : 'Manage your profile, track active credits, and adjust preferences.',
      position: 'top' as const,
    },
    {
      targetId: ['student-notifications', 'header-notification-btn'],
      title: isAr ? 'التنبيهات' : 'Notifications',
      description: isAr ? 'إشعارات فورية بمواعيد الجلسات وتأكيدات الدفع والتحديثات.' : 'Instant alerts for lesson timings, payment confirmations, and updates.',
      position: 'bottom' as const,
    },
    {
      targetId: ['student-header-tour-btn', 'header-lang-btn', 'language-toggle'],
      title: isAr ? 'اللغة والإعدادات' : 'Language & Settings',
      description: isAr ? 'التبديل بين العربية والإنجليزية، وتغيير المظهر الليلي والنهاري.' : 'Switch between Arabic & English, or toggle between light and dark modes.',
      position: 'bottom' as const,
    }
  ];

  const displayName = profile?.name || user?.email?.split('@')[0] || (isAr ? 'طالب' : 'Student');
  const studentInitial = (profile?.name || user?.email || 'S').charAt(0).toUpperCase();
  const spaceLabel = isFamilyAccount(profile) ? (isAr ? 'مساحة العيلة' : 'Family space') : (isAr ? 'مساحة الطالب' : 'Student space');
  const INK = 'bg-[#0A2E35]/92 dark:bg-[#0B1C1F]/90';
  const iconButton = 'tap-44 relative w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const pill = 'rounded-full bg-surface/80 dark:bg-surface/70 backdrop-blur-xl ring-1 ring-border/60 shadow-xs';

  return (
    <ActiveLearnerProvider profile={profile}>
    <div
      className="relative isolate h-screen supports-[height:100dvh]:h-dvh bg-background text-foreground font-sans flex overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      lang={lang}
    >
      {/* Tablet & desktop: floating ink rail with the pages that are not header tabs */}
      <aside
        id="student-rail"
        aria-label={isAr ? 'صفحات أخرى' : 'More pages'}
        inert={!desktopSidebarOpen}
        className={`hidden md:flex fixed start-4 top-1/2 -translate-y-1/2 z-30 w-[68px] max-h-[calc(100vh-2rem)] flex-col items-center gap-2 rounded-[2.25rem] py-3 ${INK} backdrop-blur-xl text-white/70 ring-1 ring-white/10 shadow-[0_24px_48px_-24px_rgba(5,54,63,0.65)] transition-[opacity,translate] duration-300 ease-out ${desktopSidebarOpen ? '' : 'opacity-0 -translate-x-[140%] rtl:translate-x-[140%] pointer-events-none'}`}
      >
        <Link to="/" aria-label={isAr ? 'موقع وتزودوا' : 'Watazawwado website'} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">
          <BrandLogo variant="compact" />
        </Link>
        <span className="w-6 h-px bg-white/15" aria-hidden="true" />
        <nav className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] flex flex-col items-center gap-1 px-2">
          {railItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.name}
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
                data-tour={item.tour}
                className={`group relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${active ? 'text-white' : 'hover:text-white hover:bg-white/10'}`}
              >
                {active && <motion.span layoutId="student-rail-active" className="absolute inset-0 rounded-full bg-crimson shadow-md shadow-black/30" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                <item.icon className="relative w-[18px] h-[18px]" aria-hidden="true" />
                {item.badge ? <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[#E5A93C] ring-2 ring-[#0A2E35]" /> : null}
                {/* A visible name on hover/focus, so nobody has to guess an icon. */}
                <span className="pointer-events-none absolute start-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0A2E35] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <SidebarHandle
        open={desktopSidebarOpen} onToggle={toggleDesktopSidebar} controls="student-rail"
        labelOpen={isAr ? 'اخفي الشريط الجانبي' : 'Hide the sidebar'} labelClosed={isAr ? 'اظهر الشريط الجانبي' : 'Show the sidebar'}
        className={`hidden md:flex fixed top-1/2 -translate-y-1/2 ${desktopSidebarOpen ? 'start-[88px]' : 'start-0'}`}
      />

      {/* Phone: the "More" sheet (pages that are not in the bottom bar, the account and settings) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <aside
        ref={drawerRef}
        id="student-sidebar"
        role={sidebarOpen ? 'dialog' : undefined}
        aria-modal={sidebarOpen ? 'true' : undefined}
        aria-label={isAr ? 'المزيد' : 'More'}
        inert={!sidebarOpen}
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85dvh] rounded-t-[28px] bg-surface text-foreground shadow-2xl transition-transform duration-300 ease-premium ${sidebarOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-center pt-2.5" aria-hidden="true"><span className="h-1.5 w-10 rounded-full bg-border" /></div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <span className="font-display text-xl font-bold">{isAr ? 'المزيد' : 'More'}</span>
          <button
            ref={closeButtonRef}
            onClick={toggleSidebar}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-surface-subtle text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-4">
          <Link
            to="/student/account"
            id="nav-account-link"
            onClick={() => setSidebarOpen(false)}
            aria-current={isActive('/student/account') ? 'page' : undefined}
            data-tour="student-account"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-subtle/60 border border-border/60 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="w-12 h-12 rounded-full bg-secondary/30 border border-secondary/50 text-interactive flex items-center justify-center font-bold shrink-0">{studentInitial}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold truncate">{displayName}</span>
              <span className="block text-xs text-muted-foreground">{isAr ? 'حسابي وبياناتي' : 'My account and details'}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
          </Link>
          {/* Big labelled tiles: easy to read and to hit, also for parents who rarely use apps. */}
          <nav className="grid grid-cols-2 gap-2.5" aria-label={isAr ? 'صفحات أخرى' : 'More pages'}>
            {moreItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  data-tour={item.tour}
                  className={`flex flex-col items-start gap-3 rounded-2xl p-4 min-h-[96px] text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? `${INK} text-white` : 'bg-surface-subtle/60 border border-border/60 text-foreground active:scale-[0.98]'}`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-crimson text-white' : 'bg-background text-primary'}`}>
                    <item.icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold leading-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <InstallAppEntry isAr={isAr} onOpen={() => setSidebarOpen(false)} className="mb-3" />
          <div className="rounded-2xl border border-border/60 divide-y divide-border/60">
            <div className="flex items-center justify-between px-4 min-h-[56px]">
              <span className="text-sm font-medium">{isAr ? 'المظهر' : 'Theme'}</span>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => { setSidebarOpen(false); setShowGlobalTour(true); }}
              className="w-full flex items-center gap-3 px-4 min-h-[56px] text-sm font-medium text-start cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 text-teal" /> {isAr ? 'جولة سريعة في الحساب' : 'Quick tour of your account'}
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              data-tour="student-logout"
              className="w-full flex items-center gap-3 px-4 min-h-[56px] text-sm font-medium text-destructive text-start cursor-pointer"
            >
              <LogOut className="w-5 h-5 rtl:rotate-180" /> {isAr ? 'تسجيل الخروج' : 'Log out'}
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-w-0 h-screen supports-[height:100dvh]:h-dvh overflow-hidden transition-[padding] duration-300 ease-out ${desktopSidebarOpen ? 'md:ps-[100px]' : 'md:ps-6'}`}
        aria-hidden={sidebarOpen ? true : undefined}
      >
        <header className="shrink-0 z-20 px-4 sm:px-6 lg:px-8 pt-3 md:pt-4">
          <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
            {/* Start: who and where (phones show the logo here; tablets and up have it on the rail) */}
            <Link to="/student" className="flex md:hidden xl:flex items-center gap-2 min-w-0 flex-1 md:flex-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="md:hidden shrink-0"><BrandLogo variant="compact" /></span>
              <span className="min-w-0 text-start">
                <span className="block font-display font-bold text-lg leading-tight truncate">{isAr ? 'وتزودوا' : 'Watazawwado'}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{spaceLabel}</span>
              </span>
            </Link>

            {/* Centre: main sections */}
            <nav aria-label={isAr ? 'الأقسام الرئيسية' : 'Main sections'} className={`hidden md:flex mx-auto items-center gap-1 p-1 ${pill}`}>
              {topTabs.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    id={item === book ? 'nav-book-link-desktop' : item === lessons ? 'nav-lessons-link-desktop' : undefined}
                    data-tour={item.tour}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-2 px-3.5 lg:px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'text-white' : item === book ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {active && <motion.span layoutId="student-top-tab" className={`absolute inset-0 rounded-full ${INK}`} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                    <item.icon className="relative w-4 h-4" aria-hidden="true" />
                    <span className="relative">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* End: child, tour, notifications, language, theme, account */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ChildSwitcher isAr={isAr} />
              <div className={`flex items-center gap-1 p-1 ${pill}`}>
                <button
                  type="button"
                  id="student-header-tour-btn"
                  data-tour="student-header-tour-btn"
                  onClick={() => setShowGlobalTour(true)}
                  title={isAr ? 'جولة سريعة' : 'Quick tour'}
                  aria-label={isAr ? 'جولة سريعة' : 'Quick tour'}
                  className={`hidden md:flex ${iconButton} text-teal`}
                >
                  <HelpCircle className="w-[18px] h-[18px]" />
                </button>
                <Link to="/student/notifications" id="student-notifications" data-tour="student-notifications" aria-label={isAr ? 'التنبيهات' : 'Notifications'} aria-current={isActive('/student/notifications') ? 'page' : undefined} className={iconButton}>
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  id="header-lang-btn"
                  data-tour="header-lang-btn"
                  onClick={toggleLang}
                  aria-label={isAr ? 'Switch to English' : 'التبديل للعربية'}
                  className="h-10 px-2.5 rounded-full text-xs font-semibold text-foreground hover:bg-surface-subtle transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <span>{isAr ? 'EN' : 'عربي'}</span>
                </button>
                <span className="hidden md:contents"><ThemeToggle compact /></span>
                <div id="nav-account-link-desktop" className="hidden md:block">
                  <AccountDropdown initials={studentInitial} isAr={isAr} accountPath="/student/account" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main
          id="student-main-content"
          className={`flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 focus:outline-none ${MOBILE_TAB_BAR_PADDING}`}
          tabIndex={-1}
        >
          <div className="w-full max-w-6xl mx-auto min-w-0">
            {profile?.id && (
              <div className="mb-4">
                <TimezoneCheck
                  isAr={isAr}
                  onUse={async (tz) => {
                    await authedJson('/api/student/me', { method: 'PATCH', body: JSON.stringify({ timezone: tz }) });
                    setProfile((prev: any) => ({ ...prev, timezone: tz }));
                  }}
                />
              </div>
            )}
            <ErrorBoundary>
              <Routes>
              <Route path="/" element={<StudentHomePage lang={lang} />} />
              <Route path="/lessons" element={<StudentLessonsPage lang={lang} session={session} />} />
              <Route path="/progress" element={<StudentProgressPage lang={lang} />} />
              <Route path="/progress/report" element={<StudentProgressReportPage lang={lang} />} />
              <Route path="/calendar" element={<StudentCalendarPage lang={lang} />} />
              <Route path="/wallet" element={<StudentWalletPage lang={lang} session={session} />} />
              {/* The wallet replaced these pages (2026-10-28); payment returns keep their query (Stripe ?payment_status=...). */}
              <Route path="/packages" element={<WalletRedirect tab="packages" />} />
              <Route path="/payments" element={<WalletRedirect tab="payments" />} />
              <Route path="/notifications" element={<StudentNotificationsPage lang={lang} session={session} />} />
              <Route path="/guide" element={<IntakeConversation session={session} lang={lang} />} />
              <Route path="/offers" element={<StudentOffersPage session={session} lang={lang} />} />
              <Route path="/invite" element={<StudentInvitePage lang={lang} />} />
              <Route path="/messages" element={<ChatPanel lang={lang} />} />
              <Route path="/placement" element={<StudentPlacementPage lang={lang} />} />
              <Route path="/curriculum" element={<StudentCurriculumPage lang={lang} />} />
              <Route path="/curriculum/:learner/:subject/:number" element={<StudentCurriculumLessonPage lang={lang} />} />
              <Route path="/placement/report/:id" element={<StudentPlacementReportPage lang={lang} />} />
              <Route path="/book" element={<StudentBookingPage profile={profile} session={session} lang={lang} />} />
              <Route path="/account" element={
                <StudentProfilePage
                  profile={profile}
                  session={session}
                  lang={lang}
                  onToggleLang={toggleLang}
                  onProfileUpdated={(updated) => {
                    setProfile((prev: any) => ({ ...prev, ...updated }));
                  }}
                />
              } />
              <Route path="/profile" element={<Navigate to="/student/account" replace />} />
              <Route path="/onboarding" element={
                <StudentOnboardingPage
                  currentProfile={profile}
                  session={session}
                  onCompleted={(updated) => {
                    setProfile((prev: any) => ({ ...prev, ...updated, onboardingCompleted: true }));
                  }}
                />
              } />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
            </ErrorBoundary>
          </div>
        </main>

        {/* Phone bottom bar: the main sections, then "More" for everything else */}
        <MobileTabBar
          label={isAr ? 'التنقل السفلي' : 'Bottom mobile navigation'}
          hidden={sidebarOpen}
          tabs={[
            { key: 'home', label: home.name, icon: home.icon, to: home.path, id: 'nav-home-link', tour: home.tour, active: isActive(home.path) },
            { key: 'lessons', label: lessons.name, icon: lessons.icon, to: lessons.path, id: 'nav-lessons-link', tour: lessons.tour, active: isActive(lessons.path) },
            { key: 'book', label: book.name, icon: book.icon, to: book.path, id: 'nav-book-link', tour: book.tour, primary: true, active: isActive(book.path) },
            { key: 'messages', label: messages.name, icon: messages.icon, to: messages.path, tour: messages.tour, badge: unreadChats, active: isActive(messages.path) },
            {
              key: 'more', id: 'nav-more-btn', label: isAr ? 'المزيد' : 'More', icon: MoreHorizontal, onClick: () => setSidebarOpen(true),
              active: [...moreItems.map((i) => i.path), '/student/account'].some(isActive),
            },
          ]}
        />
      </div>

      {/* Global Onboarding Guide */}
      <FeedbackHost />
      <OnboardingGuide
        steps={isFamilyAccount(profile) ? familyTourSteps(isAr) : globalTourSteps}
        isOpen={showGlobalTour}
        onClose={() => {
          setShowGlobalTour(false);
          if (isFamilyAccount(profile)) {
            try { markFamilyTourSeen(profile, window.localStorage); } catch { /* blocked storage */ }
          }
        }}
        isAr={isAr}
      />

      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        lang={lang}
        initialView={authInitialView}
      />
    </div>
    </ActiveLearnerProvider>
  );
}

/** Old /student/packages and /student/payments addresses open the matching wallet tab, keeping their query. */
function WalletRedirect({ tab }: { tab: 'packages' | 'payments' }) {
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.set('tab', tab);
  return <Navigate to={`/student/wallet?${params.toString()}${hash}`} replace />;
}
