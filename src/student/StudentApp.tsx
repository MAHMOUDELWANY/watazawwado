import { BrandLogo } from '../components/ui/BrandLogo';
import { AccountDropdown } from '../components/ui/AccountDropdown';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { BrandLoader } from '../components/ui/BrandLoader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
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
import IntakeConversation from '../components/intake/IntakeConversation';
import { StudentAuthModal } from '../components/StudentAuthModal';
import {  buildStudentNotifications,
  countUnread,
  notificationReadStateKey,
  getSavedNotificationReadIds
} from './notificationsPresentation';

export default function StudentApp() {
  const { user, session, isTeacherAuthenticated, userRole, signOut } = useTeacherAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showGlobalTour, setShowGlobalTour] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const location = useLocation();
  const shouldAutoOpenAuth = location.search.includes('auth=login') || location.pathname.includes('/login');
  const [authModalOpen, setAuthModalOpen] = useState(shouldAutoOpenAuth);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  useEffect(() => {
    if (location.search.includes('auth=login') || location.pathname.includes('/login')) {
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

  // Load student profile & notification count when authenticated.
  // Rules of Hooks compliance: Hook is called unconditionally before any early returns.
  // Single auth source: Uses strictly session.access_token from the auth architecture (no storage fallback).
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (
        isTeacherAuthenticated ||
        !user ||
        userRole !== 'student' ||
        !session?.access_token
      ) {
        if (isMounted) setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const headers: Record<string, string> = {
          Authorization: `Bearer ${session.access_token}`,
        };

        // Compute the unread badge from the SAME notification projection used by
        // StudentNotificationsPage, so the badge and the list never diverge.
        // Read state is the current per-user storage contract.
        const readIds: Set<string> = getSavedNotificationReadIds(user?.id);

        const [profileRes, bookingsRes, paymentsRes, packagesRes] = await Promise.all([
          fetch('/api/student/me', { headers }),
          fetch('/api/student/bookings', { headers }),
          fetch('/api/student/payments', { headers }),
          fetch('/api/student/packages', { headers })
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          if (isMounted) setProfile(data);
        }

        // Only compute a truthful badge when the authoritative inputs loaded.
        if (bookingsRes.ok && paymentsRes.ok) {
          const bookings = await bookingsRes.json();
          const paymentsJson = await paymentsRes.json();
          const packagesData = packagesRes.ok ? await packagesRes.json() : null;

          const items = buildStudentNotifications(
            Array.isArray(bookings) ? bookings : [],
            Array.isArray(paymentsJson?.payments) ? paymentsJson.payments : [],
            packagesData,
            readIds
          );
          const count = countUnread(items);

          if (isMounted) setUnreadNotificationsCount(count);
        }
      } catch (err) {
        console.error('Error fetching student profile & notification count:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user, userRole, session, isTeacherAuthenticated, location.pathname]);


  // If a teacher lands here, redirect to the teacher dashboard
  if (isTeacherAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, provide choices: Sign In, Create Account
  if (!user || userRole !== 'student') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
        <div className="max-w-md w-full glass-card border-none rounded-3xl p-8 sm:p-10 shadow-xs text-center">
          <div className="flex justify-center mx-auto mb-5">
            <BrandLogo variant="large" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2 ">
            {isAr ? 'مساحتك التعليمية — وتزودوا' : 'Learning Home Access'}
          </h1>
          <p className="text-sm sm:text-sm text-muted-foreground mb-6 leading-relaxed">
            {isAr
              ? 'سجّل الدخول للوصول إلى مواعيد دروسك الفردية المباشرة مع الأستاذ محمود ورابط فصل زووم.'
              : 'Sign in to view your scheduled 1-on-1 lessons, join your Zoom classroom, or review teacher feedback.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 btn-primary-material text-primary-foreground rounded-xl transition-all font-medium text-sm shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>{isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Create Account'}</span>
              <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>

            <div className="pt-4 border-t border-border text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors hover:underline">
                {isAr ? '← العودة إلى الصفحة الرئيسية' : '← Back to Ustadh Mahmoud Homepage'}
              </Link>
            </div>
          </div>
        </div>

        <StudentAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          lang={lang}
        />
      </div>
    );
  }

  // Profile is loading
  if (loadingProfile && !profile) {
    return (
        <BrandLoader 
          size="page" 
          text={isAr ? 'جارٍ تحميل مساحتك التعليمية...' : 'Loading your learning home...'} 
          subtext={isAr ? 'أهلاً بك في منصة وتزودوا للقرآن واللغة العربية' : 'Welcome to Watazawwado for Quran & Arabic Studies'}
        />
    );
  }

  // Onboarding Gate: If onboarding is not completed, lock dashboard until onboarding is completed
  const needsOnboarding = profile && profile.onboardingCompleted === false;
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
      name: isAr ? 'حجز جديد' : 'Book', 
      path: '/student/book', 
      icon: Plus,
      badge: null
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
      position: 'bottom' as const,
    },
    {
      targetId: ['nav-lessons-link', 'nav-lessons-link-desktop', 'student-lessons'],
      title: isAr ? 'جدول الدروس' : 'My Lessons',
      description: isAr ? 'متابعة جميع حصصك القادمة والسابقة وروابط زووم المباشرة.' : 'Review your upcoming schedule, past sessions, and direct Zoom links.',
      position: 'bottom' as const,
    },
    {
      targetId: ['nav-account-link', 'nav-account-link-desktop', 'student-account'],
      title: isAr ? 'إدارة الحساب' : 'Account & Profile',
      description: isAr ? 'تعديل بياناتك، متابعة رصيدك، وضبط أهدافك التعليمية.' : 'Manage your profile, track active credits, and adjust preferences.',
      position: 'bottom' as const,
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
          /* Mobile styling: glass drawer attached to the edge */
          max-lg:glass-sheet max-lg:w-64 max-lg:max-w-[85vw] max-lg:inset-inline-start-0
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
              <span className="font-display font-bold text-lg leading-none text-foreground">
                Watazawwado
              </span>
              <span className="text-xs text-muted-foreground tracking-wider uppercase mt-1">
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
          className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8 focus:outline-none pb-24 md:pb-8"
          tabIndex={-1}
        >
          <div className="w-full max-w-7xl mx-auto min-w-0">
            <ErrorBoundary>
              <Routes>
              <Route path="/" element={<StudentHomePage lang={lang} />} />
              <Route path="/lessons" element={<StudentLessonsPage lang={lang} session={session} />} />
              <Route path="/packages" element={<StudentPackagesPage lang={lang} session={session} />} />
              <Route path="/payments" element={<StudentPaymentsPage lang={lang} session={session} />} />
              <Route path="/notifications" element={<StudentNotificationsPage lang={lang} session={session} />} />
              <Route path="/guide" element={<IntakeConversation session={session} lang={lang} />} />
              <Route path="/offers" element={<StudentOffersPage session={session} lang={lang} />} />
              <Route path="/book" element={<StudentBookingPage profile={profile} session={session} />} />
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

        {/* Mobile Bottom Navigation Bar (Floating Pill Design V5) */}
        <div className="lg:hidden fixed bottom-4 inset-x-3 sm:inset-x-6 max-w-sm mx-auto z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
          <nav 
            className="pointer-events-auto relative w-full h-[62px] bg-surface/95 dark:bg-surface/90 backdrop-blur-xl rounded-full flex items-center justify-around px-2 shadow-2xl border border-border/80"
            aria-label={isAr ? 'التنقل السفلي' : 'Bottom mobile navigation'}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/student' && location.pathname.startsWith(item.path));
              const isBook = item.path === '/student/book';
              const Icon = item.icon;

              if (isBook) {
                return (
                  <div key={item.path} className="relative flex-1 flex justify-center">
                    <Link
                      to={item.path}
                      id="nav-book-link"
                      data-tour="student-book"
                      className="absolute -top-5 w-12 h-12 rounded-full bg-islamic-gradient text-white flex items-center justify-center shadow-lg shadow-teal-900/30 active:scale-90 hover:opacity-95 transition-all border-[3px] border-background"
                      aria-label={item.name}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </Link>
                  </div>
                );
              }

              const itemNavId = item.path === '/student' ? 'nav-home-link' : item.path === '/student/lessons' ? 'nav-lessons-link' : item.path === '/student/account' ? 'nav-account-link' : undefined;
              const itemTourId = item.path === '/student' ? 'student-home' : item.path === '/student/lessons' ? 'student-lessons' : item.path === '/student/account' ? 'student-account' : undefined;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={itemNavId}
                  data-tour={itemTourId}
                  className="relative flex items-center justify-center flex-1 h-full touch-manipulation group"
                  aria-label={item.name}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isActive ? 'text-teal-700 dark:text-teal-300 bg-teal-500/15 shadow-2xs' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    <Icon className="w-5 h-5 transition-transform group-active:scale-90" />
                    {/* Active Dot Indicator in Teal */}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
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
      />
    </div>
  );
}


