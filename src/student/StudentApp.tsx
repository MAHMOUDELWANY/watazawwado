import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
  Calendar,
  ArrowRight,
  Loader2,
  Moon,
  Sun,
  Globe,
  Package,
  CreditCard,
  Bell,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useTeacherAuth } from '../lib/auth';
import { useTheme } from '../components/ThemeProvider';

import StudentHomePage from './pages/StudentHomePage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentOnboardingPage from './pages/StudentOnboardingPage';
import StudentDemoPage from './pages/StudentDemoPage';
import StudentBookingPage from './pages/StudentBookingPage';
import StudentLessonsPage from './pages/StudentLessonsPage';
import StudentPackagesPage from './pages/StudentPackagesPage';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import StudentNotificationsPage from './pages/StudentNotificationsPage';
import { StudentAuthModal } from '../components/StudentAuthModal';

export default function StudentApp() {
  const { user, session, isTeacherAuthenticated, userRole, signOut } = useTeacherAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const location = useLocation();

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const prevSidebarOpenRef = useRef<boolean>(false);

  // Language management with document synchronization
  const [lang, setLang] = useState<'en' | 'ar'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.lang === 'ar') {
      return 'ar';
    }
    return 'en';
  });

  const isAr = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [lang, isAr]);

  const toggleLang = () => {
    setLang(prev => (prev === 'en' ? 'ar' : 'en'));
  };

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
        location.pathname.startsWith('/student/demo') ||
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

        const [profileRes, bookingsRes, paymentsRes] = await Promise.all([
          fetch('/api/student/me', { headers }),
          fetch('/api/student/bookings', { headers }),
          fetch('/api/student/payments', { headers })
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          if (isMounted) setProfile(data);
        }

        // Compute pending items requiring student attention
        let count = 0;

        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();
          if (Array.isArray(bookings)) {
            bookings.forEach(b => {
              if (b.status === 'pending') count++;
            });
          }
        }

        if (paymentsRes.ok) {
          const payments = await paymentsRes.json();
          if (Array.isArray(payments)) {
            payments.forEach(p => {
              if (p.status === 'under_review') count++;
            });
          }
        }

        if (isMounted) {
          setUnreadNotificationsCount(count);
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

  // If user navigated to /student/demo, always allow direct demo access without requiring authentication
  if (location.pathname.startsWith('/student/demo')) {
    return (
      <>
        <StudentDemoPage onOpenSignupModal={() => setAuthModalOpen(true)} />
        <StudentAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          lang={lang}
        />
      </>
    );
  }

  // If a teacher lands here, redirect to the teacher dashboard
  if (isTeacherAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, provide choices: Sign In, Create Account, or Explore as Guest Demo
  if (!user || userRole !== 'student') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground">
        <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 sm:p-10 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-5 font-serif font-bold text-xl">
            و
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2 tracking-tight">
            {isAr ? 'بوابة الطالب — وتزودوا' : 'Student Portal Access'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
            {isAr
              ? 'سجّل الدخول للوصول إلى مواعيد دروسك الفردية المباشرة مع الأستاذ محمود ورابط فصل زووم.'
              : 'Sign in to view your scheduled 1-on-1 lessons, join your Zoom classroom, or review teacher feedback.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl transition-all font-medium text-sm shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>{isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Create Account'}</span>
              <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>

            <Link
              to="/student/demo"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl transition-all font-medium text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{isAr ? 'استكشف كضيف (عرض تجريبي)' : 'Explore as Guest (Interactive Demo)'}</span>
            </Link>

            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs text-muted-foreground">
          {isAr ? 'جارٍ تحميل بيانات الطالب...' : 'Loading your learning portal...'}
        </p>
      </div>
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

  // Information Architecture Navigation Items
  const navItems = [
    { 
      name: isAr ? 'لوحة التحكم' : 'Overview', 
      path: '/student', 
      icon: BookOpen,
      badge: null
    },
    { 
      name: isAr ? 'جدول الدروس' : 'My Lessons', 
      path: '/student/lessons', 
      icon: Calendar,
      badge: null
    },
    { 
      name: isAr ? 'الباقات والرصيد' : 'Packages', 
      path: '/student/packages', 
      icon: Package,
      badge: null
    },
    { 
      name: isAr ? 'المدفوعات' : 'Payments', 
      path: '/student/payments', 
      icon: CreditCard,
      badge: null
    },
    { 
      name: isAr ? 'التنبيهات' : 'Notifications', 
      path: '/student/notifications', 
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null
    },
    { 
      name: isAr ? 'الحساب والإعدادات' : 'Account', 
      path: '/student/account', 
      icon: User,
      badge: null
    },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Dynamic Header Title & Subtitle helper
  const getHeaderInfo = (pathname: string) => {
    if (pathname === '/student' || pathname === '/student/') {
      return {
        title: isAr ? 'لوحة التحكم' : 'Overview',
        subtitle: isAr ? 'مركز متابعة رحلتك التعليمية' : 'Learning Command Center'
      };
    }
    if (pathname.startsWith('/student/lessons')) {
      return {
        title: isAr ? 'جدول كافة الدروس' : 'My Lessons',
        subtitle: isAr ? 'الجلسات القادمة والمكتملة مع الأستاذ محمود' : 'Scheduled & past 1-on-1 sessions'
      };
    }
    if (pathname.startsWith('/student/packages')) {
      return {
        title: isAr ? 'باقات الحصص والرصيد' : 'Packages & Credits',
        subtitle: isAr ? 'رصيد الحصص المدفوعة مسبقاً والاشتراكات' : 'Prepaid lesson balances & learning plans'
      };
    }
    if (pathname.startsWith('/student/payments')) {
      return {
        title: isAr ? 'سجل المدفوعات والحوالات' : 'Payments',
        subtitle: isAr ? 'إثباتات الدفع وتعليمات التحويل البنكي' : 'Transfer instructions & verified receipts'
      };
    }
    if (pathname.startsWith('/student/notifications')) {
      return {
        title: isAr ? 'التنبيهات والإشعارات' : 'Notifications',
        subtitle: isAr ? 'آخر تحديثات المواعيد وتأكيدات الدفع' : 'Updates on lessons, payments, and packages'
      };
    }
    if (pathname.startsWith('/student/account') || pathname.startsWith('/student/profile')) {
      return {
        title: isAr ? 'الحساب والإعدادات' : 'Account & Settings',
        subtitle: isAr ? 'بياناتك الشخصية وتفضيلات التعلم' : 'Personal information, timezone & learning profile'
      };
    }
    if (pathname.startsWith('/student/book')) {
      return {
        title: isAr ? 'حجز درس جديد' : 'Book a Lesson',
        subtitle: isAr ? 'جلسة فردية مباشرة مع الأستاذ محمود' : '1-on-1 private session with Ustadh Mahmoud'
      };
    }
    return {
      title: isAr ? 'بوابة الطالب' : 'Student Portal',
      subtitle: isAr ? 'وتزودوا — الأستاذ محمود' : 'Watazawwado with Ustadh Mahmoud'
    };
  };

  const currentHeader = getHeaderInfo(location.pathname);
  const studentInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'S');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================================= */}
      {/* MAIN PERSISTENT STUDENT SIDEBAR (Desktop ~260px, Accessible drawer on mobile) */}
      {/* ========================================================================= */}
      <aside
        ref={drawerRef}
        id="student-sidebar"
        role={sidebarOpen ? 'dialog' : undefined}
        aria-modal={sidebarOpen ? 'true' : undefined}
        aria-label={isAr ? 'شريط التنقل الجانبي للطالب' : 'Student Navigation Sidebar'}
        className={`
          fixed md:static inset-y-0 start-0 z-50 w-64 lg:w-72 max-w-[85vw] bg-surface border-e border-border
          flex flex-col transform transition-transform duration-250 ease-out shadow-xs shrink-0
          ${sidebarOpen ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand & Portal Header */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-border">
          <Link 
            to="/student" 
            className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-serif font-bold text-base">
              و
            </div>
            <div className="flex flex-col text-start">
              <span className="font-serif font-bold text-base tracking-tight leading-none text-foreground">
                Watazawwado
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">
                {isAr ? 'بوابة الطالب' : 'Student Portal'}
              </span>
            </div>
          </Link>
          <button
            ref={closeButtonRef}
            onClick={toggleSidebar}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile Quick Card in Sidebar */}
        <Link
          to="/student/account"
          onClick={() => setSidebarOpen(false)}
          className="p-3.5 m-3 rounded-xl border border-border/80 bg-surface-subtle/40 hover:bg-surface-subtle transition-colors flex items-center gap-3 text-start group"
        >
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {studentInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">
              {profile?.name || user?.email?.split('@')[0] || (isAr ? 'طالب' : 'Student')}
            </div>
            <div className="text-[11px] text-muted-foreground truncate capitalize">
              {profile?.learnerType || (isAr ? 'طالب منتظم' : 'Active Learner')}
            </div>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform ${isAr ? 'rotate-180' : ''}`} />
        </Link>

        {/* Primary Action Button: Book New Lesson (Prominent, tested invariant) */}
        <div className="px-3 pb-3">
          <Link
            to="/student/book"
            onClick={() => setSidebarOpen(false)}
            aria-current={location.pathname === '/student/book' ? 'page' : undefined}
            className={`
              flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation min-h-[44px] shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${location.pathname === '/student/book'
                ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                : 'bg-primary hover:bg-primary-hover text-primary-foreground hover:shadow-sm'
              }
            `}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Book New Lesson</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav 
          className="flex-1 overflow-y-auto px-3 space-y-1"
          aria-label={isAr ? 'روابط التنقل الرئيسية' : 'Primary Navigation Links'}
        >
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path === '/student/account' && location.pathname === '/student/profile');
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isActive
                    ? 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility Controls */}
        <div className="p-3 border-t border-border space-y-1">
          {/* Back to Public Site */}
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors min-h-[38px]"
          >
            <span>{isAr ? '← الصفحة الرئيسية' : '← Public Homepage'}</span>
          </Link>

          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer min-h-[38px]"
            aria-label={isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>{isAr ? 'اللغة / Language' : 'Language / اللغة'}</span>
            </span>
            <span className="font-semibold text-primary">{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer min-h-[38px]"
            aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              <span>{theme === 'light' ? (isAr ? 'الوضع الليلي' : 'Dark Mode') : (isAr ? 'الوضع النهاري' : 'Light Mode')}</span>
            </span>
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer touch-manipulation min-h-[38px]"
          >
            <LogOut className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
          </button>
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
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-surface border-b border-border shrink-0 z-10">
          {/* Left Side: Mobile Menu Button + Dynamic Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={menuTriggerRef}
              onClick={toggleSidebar}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isAr ? 'فتح القائمة الرئيسية' : 'Open menu'}
              aria-expanded={sidebarOpen}
              aria-controls="student-sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-col text-start min-w-0">
              <h2 className="text-base sm:text-lg font-serif font-bold text-foreground leading-tight truncate">
                {currentHeader.title}
              </h2>
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block truncate">
                {currentHeader.subtitle}
              </span>
            </div>
          </div>

          {/* Right Side: Quick Action Utilities (Notifications, Lang, Theme, User Pill) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <Link
              to="/student/notifications"
              className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              aria-label={isAr ? 'التنبيهات' : 'Notifications'}
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface animate-pulse" />
              )}
            </Link>

            {/* Language Switch */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-surface-subtle border border-border transition-colors cursor-pointer"
            >
              {isAr ? 'EN' : 'عربي'}
            </button>

            {/* Theme Switch */}
            <button
              onClick={toggleTheme}
              className="min-h-[40px] min-w-[40px] hidden sm:flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
              aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
            </button>

            {/* User Profile Avatar Pill */}
            <Link
              to="/student/account"
              className="flex items-center gap-2 p-1.5 pe-3 rounded-full bg-surface-subtle hover:bg-surface border border-border transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                {studentInitial}
              </div>
              <span className="text-xs font-medium text-foreground hidden md:inline-block max-w-[100px] truncate">
                {profile?.name ? profile.name.split(' ')[0] : 'Student'}
              </span>
            </Link>
          </div>
        </header>

        {/* Scrollable Main Application Content (Using full available viewport width intelligently) */}
        <main 
          id="student-main-content"
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none pb-20 md:pb-8"
          tabIndex={-1}
        >
          <div className="w-full max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<StudentHomePage lang={lang} />} />
              <Route path="/lessons" element={<StudentLessonsPage lang={lang} session={session} />} />
              <Route path="/packages" element={<StudentPackagesPage lang={lang} session={session} />} />
              <Route path="/payments" element={<StudentPaymentsPage lang={lang} session={session} />} />
              <Route path="/notifications" element={<StudentNotificationsPage lang={lang} session={session} />} />
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
              <Route path="/demo" element={<StudentDemoPage onOpenSignupModal={() => setAuthModalOpen(true)} />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Fast 1-thumb switching for mobile users) */}
        <nav 
          className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-30"
          aria-label={isAr ? 'شريط التنقل السفلي' : 'Bottom mobile navigation'}
        >
          <Link
            to="/student"
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] transition-colors ${
              location.pathname === '/student' ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-1" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </Link>

          <Link
            to="/student/lessons"
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] transition-colors ${
              location.pathname.startsWith('/student/lessons') ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="w-4 h-4 mb-1" />
            <span>{isAr ? 'الدروس' : 'Lessons'}</span>
          </Link>

          <Link
            to="/student/book"
            className="flex flex-col items-center justify-center py-1 px-3 text-[10px] text-primary-foreground font-bold -mt-4"
          >
            <div className="w-11 h-11 rounded-full bg-primary shadow-md flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-foreground text-[10px] mt-0.5">{isAr ? 'حجز' : 'Book'}</span>
          </Link>

          <Link
            to="/student/packages"
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] transition-colors ${
              location.pathname.startsWith('/student/packages') ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Package className="w-4 h-4 mb-1" />
            <span>{isAr ? 'الباقات' : 'Packages'}</span>
          </Link>

          <Link
            to="/student/account"
            className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] min-h-[44px] transition-colors ${
              location.pathname.startsWith('/student/account') || location.pathname.startsWith('/student/profile')
                ? 'text-primary font-bold' 
                : 'text-muted-foreground'
            }`}
          >
            <User className="w-4 h-4 mb-1" />
            <span>{isAr ? 'حسابي' : 'Account'}</span>
          </Link>
        </nav>
      </div>

      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
