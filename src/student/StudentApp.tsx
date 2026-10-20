import { BrandLogo } from '../components/ui/BrandLogo';
import { AccountDropdown } from '../components/ui/AccountDropdown';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { BrandLoader } from '../components/ui/BrandLoader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { MobileTabBar, isTabActive, MOBILE_TAB_BAR_PADDING } from '../components/ui/MobileTabBar';
import { WelcomeLoader, useWelcomeGate, markJustSignedIn } from '../components/ui/WelcomeLoader';
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { HelpCircle, Globe, LogOut, BookOpen,
  User,
  Menu,
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
} from 'lucide-react';
import { useTeacherAuth } from '../lib/auth';
import { useAppLanguage } from '../lib/language';

import { ErrorBoundary } from '../components/ErrorBoundary';
import StudentHomePage from './pages/StudentHomePage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentOnboardingPage from './pages/StudentOnboardingPage';
import StudentBookingPage from './pages/StudentBookingPage';
import StudentLessonsPage from './pages/StudentLessonsPage';
import StudentPackagesPage from './pages/StudentPackagesPage';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import StudentNotificationsPage from './pages/StudentNotificationsPage';
import StudentOffersPage from './pages/StudentOffersPage';
import StudentPlacementPage from './pages/StudentPlacementPage';
import StudentPlacementReportPage from './pages/StudentPlacementReportPage';
import StudentCurriculumPage, { StudentCurriculumLessonPage } from './pages/StudentCurriculumPage';
import StudentProgressPage from './pages/StudentProgressPage';
import { ChatPanel } from '../components/chat/ChatPanel';
import IntakeConversation from '../components/intake/IntakeConversation';
import { Button } from '../components/ui/Button';
import { ActiveLearnerProvider, ChildSwitcher, PROFILE_CHANGED_EVENT } from './activeLearner';
import { StudentAuthModal } from '../components/StudentAuthModal';
import { AuthPage, AuthCard, AuthPortal } from '../components/auth/AuthFrame';
import { useOtpCelebrating } from '../components/auth/otpCelebration';
import {  buildStudentNotifications,
  countUnread,
  notificationReadStateKey,
  getSavedNotificationReadIds
} from './notificationsPresentation';

export default function StudentApp() {
  const { user, session, loading, isTeacherAuthenticated, userRole, signOut } = useTeacherAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
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

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
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
      // If drawer was open previously and is now closed, restore focus to menu trigger
      if (prevSidebarOpenRef.current) {
        menuTriggerRef.current?.focus();
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

  const isDevProgressPreview =
    Boolean((import.meta as any).env?.DEV) &&
    location.pathname.endsWith('/progress') &&
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

  // Information Architecture Navigation Items (Reduced words, friendly, concise)
  const navItems = [
    { 
      name: isAr ? 'الرئيسية' : 'Home', 
      path: '/student', 
      icon: BookOpen,
      badge: null
    },
    { 
      name: isAr ? 'الدروس' : 'Lessons', 
      path: '/student/lessons', 
      icon: Calendar,
      badge: null
    },
    {
      name: isAr ? 'مسيرتي' : 'My progress',
      path: '/student/progress',
      icon: Compass,
      badge: null
    },
    { 
      name: isAr ? 'حجز جديد' : 'Book', 
      path: '/student/book', 
      icon: Plus,
      badge: null
    },
    {
      name: isAr ? 'منهجي' : 'My curriculum',
      path: '/student/curriculum',
      icon: Library,
      badge: null
    },
    {
      name: isAr ? 'الرسائل' : 'Messages',
      path: '/student/messages',
      icon: MessageCircle,
      badge: unreadChats || null
    },
    { 
      name: isAr ? 'المرشد' : 'Guide', 
      path: '/student/guide', 
      icon: Sparkles,
      badge: null
    },
    { 
      name: isAr ? 'حسابي' : 'Account', 
      path: '/student/account', 
      icon: User,
      badge: null
    }
  ];

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

  // Dynamic Header Title & Subtitle helper (Concise & friendly)
  const getHeaderInfo = (pathname: string) => {
    if (pathname === '/student' || pathname === '/student/') {
      return {
        title: isAr ? 'لوحة التحكم' : 'Overview',
        subtitle: isAr ? 'مرحباً بك في مساحتك التعليمية' : 'Welcome to your learning space'
      };
    }
    if (pathname.startsWith('/student/lessons')) {
      return {
        title: isAr ? 'الدروس' : 'Lessons',
        subtitle: isAr ? 'جدول الجلسات المباشرة' : 'Your scheduled 1-on-1 sessions'
      };
    }
    if (pathname.startsWith('/student/progress')) {
      return {
        title: isAr ? 'مسيرتي التعليمية' : 'Learning Path',
        subtitle: isAr ? 'خطواتك وإنجازاتك درساً بعد درس' : 'Your steps and milestones lesson by lesson'
      };
    }
    if (pathname.startsWith('/student/packages')) {
      return {
        title: isAr ? 'الباقات' : 'Packages',
        subtitle: isAr ? 'رصيد الحصص والسجل' : 'Lesson credits and history'
      };
    }
    if (pathname.startsWith('/student/book')) {
      return {
        title: isAr ? 'حجز درس' : 'Book a Lesson',
        subtitle: isAr ? 'اختر الوقت المناسب لك' : 'Choose your preferred time'
      };
    }
    if (pathname.startsWith('/student/guide')) {
      return {
        title: isAr ? 'مرشد التعلم' : 'Learning Guide',
        subtitle: isAr ? 'مساعدك الذكي للتخطيط' : 'AI study assistant'
      };
    }
    if (pathname.startsWith('/student/account') || pathname.startsWith('/student/profile')) {
      return {
        title: isAr ? 'حسابي' : 'Account',
        subtitle: isAr ? 'إعدادات الملف الشخصي' : 'Profile & settings'
      };
    }
    if (pathname.startsWith('/student/notifications')) {
      return {
        title: isAr ? 'التنبيهات' : 'Notifications',
        subtitle: isAr ? 'آخر التحديثات والإشعارات' : 'Recent updates and alerts'
      };
    }
    if (pathname.startsWith('/student/messages')) {
      return {
        title: isAr ? 'الرسائل' : 'Messages',
        subtitle: isAr ? 'كلّم فريقنا ومعلمك' : 'Chat with our team and your teacher'
      };
    }
    if (pathname.startsWith('/student/placement')) {
      return {
        title: isAr ? 'اختبار تحديد المستوى' : 'Placement test',
        subtitle: isAr ? 'أسئلة قصيرة على حسب مادتك' : 'Short questions for your subject'
      };
    }
    if (pathname.startsWith('/student/payments')) {
      return {
        title: isAr ? 'المدفوعات' : 'Payments',
        subtitle: isAr ? 'سجل الحصص والإيصالات' : 'Receipts & payment history'
      };
    }
    return {
      title: isAr ? 'لوحة التحكم' : 'Overview',
      subtitle: isAr ? 'مساحتك التعليمية' : 'Learning Space'
    };
  };

  const currentHeader = getHeaderInfo(location.pathname);
  const studentInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'S');

  return (
    <ActiveLearnerProvider profile={profile}>
    <div
      className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      lang={lang}
    >
      {/* Mobile & Tablet Backdrop (< lg) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN PERSISTENT STUDENT SIDEBAR (Desktop lg: ~280px persistent, accessible drawer on mobile & tablet) */}
      {/* ========================================================================= */}
      <aside
        ref={drawerRef}
        id="student-sidebar"
        role={sidebarOpen ? 'dialog' : undefined}
        aria-modal={sidebarOpen ? 'true' : undefined}
        aria-label={isAr ? 'شريط التنقل الجانبي للطالب' : 'Student Navigation Sidebar'}
        className={`
          fixed inset-y-0 z-50 flex flex-col transition-transform duration-250 ease-out shrink-0
          /* Mobile styling: solid opaque surface drawer with shadow */
          max-lg:bg-surface max-lg:text-foreground max-lg:border-e max-lg:border-border max-lg:shadow-2xl max-lg:w-72 max-lg:max-w-[85vw] max-lg:inset-inline-start-0
          ${sidebarOpen 
            ? 'max-lg:translate-x-0' 
            : (isAr ? 'max-lg:translate-x-full' : 'max-lg:-translate-x-full')
          }
          /* Desktop styling: floating glass sidebar */
          ${desktopSidebarOpen ? 'lg:static lg:translate-x-0 lg:w-[280px] lg:m-4 lg:rounded-3xl lg:glass-nav lg:shadow-xl lg:border lg:border-border/50' : 'lg:hidden lg:w-0 lg:m-0'}
        `}
      >
        {/* Brand & Portal Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
          <Link 
            to="/student" 
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <BrandLogo variant="compact" />
            <div className="flex flex-col text-start">
              <span className="font-display font-bold text-xl sm:text-2xl leading-none text-foreground">
                {isAr ? 'وتزودوا' : 'Watazawwado'}
              </span>
              <span className="text-xs text-muted-foreground tracking-wider uppercase mt-1.5">
                {isAr ? 'مساحة الطالب' : 'Student Space'}
              </span>
            </div>
          </Link>
          <button
            ref={closeButtonRef}
            onClick={toggleSidebar}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile Quick Card in Sidebar */}
        <Link
          to="/student/account"
          onClick={() => setSidebarOpen(false)}
          className="p-4 m-4 rounded-2xl border border-border/50 bg-surface-subtle/30 hover:bg-surface-subtle transition-colors flex items-center gap-3 text-start group"
          data-tour="student-account"
        >
          <div className="w-10 h-10 rounded-full bg-secondary/30 border border-secondary/50 text-interactive flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {studentInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
              {profile?.name || user?.email?.split('@')[0] || (isAr ? 'طالب' : 'Student')}
            </div>
            <div className="text-[11px] text-muted-foreground truncate capitalize mt-0.5">
              {profile?.learnerType || (isAr ? 'طالب منتظم' : 'Active Learner')}
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform ${isAr ? 'rotate-180' : ''}`} />
        </Link>

        {/* Navigation Links */}
        <nav 
          className="flex-1 overflow-y-auto px-3 space-y-1.5"
          aria-label={isAr ? 'روابط التنقل الرئيسية' : 'Primary Navigation Links'}
        >
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path === '/student/account' && location.pathname === '/student/profile');
            const Icon = item.icon;
            
            // Generate robust data-tour target from path (e.g. '/student/lessons' -> 'student-lessons')
            const tourTarget = item.path === '/student' ? 'student-home' : item.path.replace(/^\//, '').replace(/\//g, '-');

            return (
              <Link
                key={item.path}
                to={item.path}
                id={item.path === '/student/book' ? 'nav-book-link-desktop' : item.path === '/student/account' ? 'nav-account-link-desktop' : undefined}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                data-tour={tourTarget}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group
                  ${isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                    : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${isActive ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-border/50 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">{isAr ? 'المظهر' : 'Theme'}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">{isAr ? 'اللغة' : 'Language'}</span>
            <button
              onClick={toggleLang} data-tour="language-toggle"
              className="px-3 py-1 rounded-lg text-xs font-semibold hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              {isAr ? 'English' : 'عربي'}
            </button>
          </div>
        
    
      <div className="p-4 mt-auto mb-[env(safe-area-inset-bottom)] lg:mb-0 border-t border-border/10">
        <button 
          onClick={() => { setSidebarOpen(false); setShowGlobalTour(true); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-sm cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isAr ? 'دليل الاستخدام' : 'Tour Guide'}</span>
        </button>
        <button 
        onClick={() => signOut()}
        data-tour="student-logout"
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-semibold text-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
      </button>
    </div>
  </div>
</aside>

      {/* ========================================================================= */}
      {/* MAIN APPLICATION VIEWPORT & HEADER */}
      {/* ========================================================================= */}
      <div 
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
        aria-hidden={sidebarOpen ? true : undefined}
      >
        {/* TOP APPLICATION HEADER (Responsive for Desktop and Mobile) */}
        <header className="h-16 sm:h-20 flex items-center justify-between px-3 sm:px-6 lg:px-10 shrink-0 z-10 border-b border-border/10 bg-background/50 backdrop-blur-md">
          {/* Left Side: Mobile Menu Button + Dynamic Page Title */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            <button
              ref={menuTriggerRef}
              onClick={toggleSidebar}
              className="lg:hidden min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
              aria-label={isAr ? 'فتح القائمة الرئيسية' : 'Open menu'}
              aria-expanded={sidebarOpen}
              aria-controls="student-sidebar"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex flex-col text-start min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-display font-bold text-foreground leading-tight truncate">
                {currentHeader.title}
              </h2>
              <span className="text-xs sm:text-sm text-muted-foreground truncate hidden xs:block">
                {currentHeader.subtitle}
              </span>
            </div>
          </div>

          {/* Right Side: Quick Action Utilities (Tour, Lang, Notifications, Account) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ChildSwitcher isAr={isAr} />
            {/* Quick Tour Button (hidden on phone, accessible via drawer/settings) */}
            <button
              type="button"
              id="student-header-tour-btn"
              data-tour="student-header-tour-btn"
              onClick={() => setShowGlobalTour(true)}
              title={isAr ? 'دليل الاستخدام' : 'Tour Guide'}
              aria-label={isAr ? 'دليل الاستخدام' : 'Tour Guide'}
              className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full text-teal-800 dark:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer shadow-2xs"
            >
              <Compass className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              id="header-lang-btn"
              data-tour="header-lang-btn"
              onClick={toggleLang}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-subtle border border-border/80 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            <Link
              to="/student/messages"
              className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer border border-border/60 shrink-0"
              aria-label={isAr ? 'الرسائل' : 'Messages'}
            >
              <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {unreadChats > 0 && (
                <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
              )}
            </Link>
            <Link
              to="/student/notifications"
              id="student-notifications"
              data-tour="student-notifications"
              className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer border border-border/60 shrink-0"
              aria-label={isAr ? 'التنبيهات' : 'Notifications'}
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface animate-pulse" />
              )}
            </Link>
            <AccountDropdown 
              initials={profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'S'} 
              isAr={isAr} 
            />
          </div>
        </header>

        {/* Scrollable Main Application Content (Using full available viewport width intelligently) */}
        <main 
          id="student-main-content"
          className={`flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8 focus:outline-none ${MOBILE_TAB_BAR_PADDING}`}
          tabIndex={-1}
        >
          <div className="w-full max-w-7xl mx-auto min-w-0">
            <ErrorBoundary>
              <Routes>
              <Route path="/" element={<StudentHomePage lang={lang} />} />
              <Route path="/lessons" element={<StudentLessonsPage lang={lang} session={session} />} />
              <Route path="/progress" element={<StudentProgressPage lang={lang} />} />
              <Route path="/packages" element={<StudentPackagesPage lang={lang} session={session} />} />
              <Route path="/payments" element={<StudentPaymentsPage lang={lang} session={session} />} />
              <Route path="/notifications" element={<StudentNotificationsPage lang={lang} session={session} />} />
              <Route path="/guide" element={<IntakeConversation session={session} lang={lang} />} />
              <Route path="/offers" element={<StudentOffersPage session={session} lang={lang} />} />
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

        {/* Mobile bottom tab bar (Navigation Tabs V5, liquid notch) */}
        <MobileTabBar
          label={isAr ? 'التنقل السفلي' : 'Bottom mobile navigation'}
          hidden={sidebarOpen}
          isAr={isAr}
          tabs={[
            { key: 'home', label: isAr ? 'الرئيسية' : 'Home', icon: BookOpen, to: '/student', id: 'nav-home-link', tour: 'student-home' },
            { key: 'lessons', label: isAr ? 'الدروس' : 'Lessons', icon: Calendar, to: '/student/lessons', id: 'nav-lessons-link', tour: 'student-lessons' },
            { key: 'book', label: isAr ? 'احجز' : 'Book', icon: Plus, to: '/student/book', id: 'nav-book-link', tour: 'student-book', primary: true },
            { key: 'messages', label: isAr ? 'الرسائل' : 'Messages', icon: MessageCircle, to: '/student/messages', badge: unreadChats },
            { key: 'account', label: isAr ? 'حسابي' : 'Profile', icon: User, to: '/student/account', id: 'nav-account-link', tour: 'student-account' },
          ].map((tab) => ({
            ...tab,
            active: isTabActive(tab.to, location.pathname, '/student') || (tab.key === 'account' && isTabActive('/student/profile', location.pathname, '/student')),
          }))}
        />
      </div>

      {/* Global Onboarding Guide */}
      <OnboardingGuide
        steps={globalTourSteps}
        isOpen={showGlobalTour}
        onClose={() => setShowGlobalTour(false)}
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


