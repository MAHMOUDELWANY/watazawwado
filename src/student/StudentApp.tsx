import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, User, Menu, X, Sparkles, Calendar, ArrowRight, Loader2, Moon, Sun, Globe, Package, CreditCard } from 'lucide-react';
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
import { StudentAuthModal } from '../components/StudentAuthModal';

export default function StudentApp() {
  const { user, session, isTeacherAuthenticated, userRole, signOut } = useTeacherAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  // Load student profile when authenticated.
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

        const res = await fetch('/api/student/me', { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setProfile(data);
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

  const navItems = [
    { 
      name: isAr ? 'الرئيسية والمواعيد' : 'Home & Schedule', 
      path: '/student', 
      icon: BookOpen 
    },
    { 
      name: isAr ? 'جدول كافة الدروس' : 'My Lessons', 
      path: '/student/lessons', 
      icon: Calendar 
    },
    { 
      name: isAr ? 'رصيد الباقات' : 'Package Credits', 
      path: '/student/packages', 
      icon: Package 
    },
    { 
      name: isAr ? 'المدفوعات والفواتير' : 'Billing & Payments', 
      path: '/student/payments', 
      icon: CreditCard 
    },
    { 
      name: isAr ? 'الملف الشخصي والأهداف' : 'Profile & Goals', 
      path: '/student/profile', 
      icon: User 
    },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

      {/* Main Student Sidebar */}
      <aside
        ref={drawerRef}
        id="student-sidebar"
        role={sidebarOpen ? 'dialog' : undefined}
        aria-modal={sidebarOpen ? 'true' : undefined}
        aria-label={isAr ? 'شريط التنقل الجانبي للطالب' : 'Student Navigation Sidebar'}
        className={`
          fixed md:static inset-y-0 start-0 z-50 w-72 max-w-[85vw] bg-surface border-e border-border
          flex flex-col transform transition-transform duration-250 ease-out shadow-xs
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
            <div className="flex flex-col">
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

        {/* Student Profile Card in Sidebar */}
        <div className="p-4 flex items-center gap-3 border-b border-border bg-surface-subtle/50">
          <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-foreground">
              {profile?.name || user?.email?.split('@')[0] || (isAr ? 'طالب' : 'Student')}
            </div>
            <div className="text-xs text-muted-foreground truncate capitalize">
              {profile?.learnerType || (isAr ? 'متعلم' : 'Learner')} • {profile?.currentLevel || (isAr ? 'مبتدئ' : 'Beginner')}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav 
          className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5"
          aria-label={isAr ? 'روابط التنقل الرئيسية' : 'Primary Navigation Links'}
        >
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isActive
                    ? 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/20'
                    : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Primary Action: Book New Lesson */}
          <div className="pt-2">
            <Link
              to="/student/book"
              onClick={() => setSidebarOpen(false)}
              aria-current={location.pathname === '/student/book' ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation min-h-[44px] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${location.pathname === '/student/book'
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                  : 'bg-primary hover:bg-primary-hover text-primary-foreground hover:shadow-xs'
                }
              `}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              {isAr ? <span>حجز درس جديد</span> : <span>Book New Lesson</span>}
            </Link>
          </div>
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

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
        aria-hidden={sidebarOpen ? true : undefined}
      >
        {/* Mobile Top Navigation Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 bg-surface border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              ref={menuTriggerRef}
              onClick={toggleSidebar}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isAr ? 'فتح القائمة الرئيسية' : 'Open menu'}
              aria-expanded={sidebarOpen}
              aria-controls="student-sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-serif font-bold text-foreground text-base">
              {isAr ? 'بوابة الطالب' : 'Student Portal'}
            </span>
          </div>

          <button
            onClick={toggleLang}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-surface-subtle border border-border transition-colors cursor-pointer"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
        </header>

        {/* Scrollable Main View */}
        <main 
          id="student-main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 focus:outline-none"
          tabIndex={-1}
        >
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/" element={<StudentHomePage lang={lang} />} />
              <Route path="/lessons" element={<StudentLessonsPage lang={lang} session={session} />} />
              <Route path="/packages" element={<StudentPackagesPage lang={lang} session={session} />} />
              <Route path="/payments" element={<StudentPaymentsPage lang={lang} session={session} />} />
              <Route path="/book" element={<StudentBookingPage profile={profile} session={session} />} />
              <Route path="/profile" element={
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
      </div>

      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
