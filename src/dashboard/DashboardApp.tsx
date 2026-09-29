import { BrandLogo } from '../components/ui/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { AccountDropdown } from '../components/ui/AccountDropdown';
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTeacherAuth } from '../lib/auth';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BookOpen, 
  Settings, 

  Menu,
  X,
  Sparkles,
  UserPlus,
  TrendingUp,
  Moon,
  Sun,
  ShieldCheck,

  Clock,
  ClipboardCheck,
  Shield,
  Compass,
  Globe,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useTheme } from "../components/ThemeProvider";
import OverviewPage from './pages/OverviewPage';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import TrialsPage from './pages/TrialsPage';
import LeadsPage from './pages/LeadsPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import BookingsPage from './pages/BookingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import IntakeReviewPage from './pages/IntakeReviewPage';
import TeachersPage from './pages/TeachersPage';
import { TeacherAuthDiagnosticPanel } from './components/TeacherAuthDiagnosticPanel';
import { Language } from '../booking/types';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function DashboardApp() {
  const { isTeacherAuthenticated, user, signOut, teacherRole } = useTeacherAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showGlobalTour, setShowGlobalTour] = useState(false);
  const location = useLocation();
  const [lang, setLang] = useState<Language>('en');

  const isSuperAdmin = teacherRole === 'super_admin';

  const drawerRef = React.useRef<HTMLElement>(null);
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const prevMobileMenuOpenRef = React.useRef(isMobileMenuOpen);

  // Manage body scroll lock and focus when mobile drawer opens/closes
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';

      // Move focus inside the drawer
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileMenuOpen(false);
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
      if (prevMobileMenuOpenRef.current) {
        menuTriggerRef.current?.focus();
      }
    }
    prevMobileMenuOpenRef.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle unauthorized state
  if (!isTeacherAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border-none rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary/30 text-accent flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-display font-semibold text-foreground mb-2">Teacher Workspace</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You must be logged in as an authorized teacher to access the workspace.
          </p>
          <Link 
            to="/staff/login" 
            className="inline-flex items-center justify-center px-6 py-2.5 btn-primary-material text-primary-foreground rounded-xl transition-all duration-base font-medium shadow-xs min-h-[44px]"
          >
            Go to Teacher Login
          </Link>
        </div>
      </div>
    );
  }

  // Role-scoped navigation (Concise, friendly, uncluttered)
  const superAdminNavigation = [
    { name: lang === 'ar' ? 'الرئيسية' : 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: lang === 'ar' ? 'اليوم' : 'Today', path: '/dashboard/today', icon: Clock },
    { name: lang === 'ar' ? 'الجدول' : 'Schedule', path: '/dashboard/upcoming', icon: Calendar },
    { name: lang === 'ar' ? 'المعلمون' : 'Faculty', path: '/dashboard/teachers', icon: Shield },
    { name: lang === 'ar' ? 'الطلاب' : 'Students', path: '/dashboard/students', icon: Users },
    { name: lang === 'ar' ? 'الحجوزات' : 'Bookings', path: '/dashboard/bookings', icon: BookOpen },
    { name: lang === 'ar' ? 'التجريبية' : 'Trials', path: '/dashboard/trials', icon: Sparkles },
    { name: lang === 'ar' ? 'المهتمون' : 'Leads', path: '/dashboard/leads', icon: UserPlus },
    { name: lang === 'ar' ? 'الطلبات' : 'Requests', path: '/dashboard/intakes', icon: ClipboardCheck },
    { name: lang === 'ar' ? 'التقارير' : 'Reports', path: '/dashboard/analytics', icon: TrendingUp },
    { name: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const teacherNavigation = [
    { name: lang === 'ar' ? 'اليوم' : 'Today', path: '/dashboard', icon: Clock },
    { name: lang === 'ar' ? 'الجدول' : 'Schedule', path: '/dashboard/upcoming', icon: Calendar },
    { name: lang === 'ar' ? 'التجريبية' : 'Trials', path: '/dashboard/trials', icon: Sparkles },
    { name: lang === 'ar' ? 'طلابي' : 'Students', path: '/dashboard/students', icon: Users },
    { name: lang === 'ar' ? 'الحجوزات' : 'Bookings', path: '/dashboard/bookings', icon: BookOpen },
    { name: lang === 'ar' ? 'التقارير' : 'Reports', path: '/dashboard/analytics', icon: TrendingUp },
    { name: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const navigation = isSuperAdmin ? superAdminNavigation : teacherNavigation;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const globalTourSteps = [
    {
      targetId: ['teacher-sidebar', 'teacher-mobile-menu-btn'],
      title: lang === 'ar' ? 'القائمة الرئيسية' : 'Workspace Navigation',
      description: lang === 'ar' ? 'التنقل بين الدروس، جدول المواعيد، قائمة الطلاب، وإدارة المنصة.' : 'Easily navigate between sessions, schedule, student roster, and workspace controls.',
      position: 'bottom' as const,
    },
    {
      targetId: ['teacher-header-tour-btn', 'teacher-lang-btn', 'language-toggle'],
      title: lang === 'ar' ? 'تغيير اللغة والعرض' : 'Language & Display',
      description: lang === 'ar' ? 'تبديل واجهة المعلم بين العربية والإنجليزية بلمسة واحدة.' : 'Toggle teacher workspace between Arabic and English with one tap.',
      position: 'bottom' as const,
    },
    {
      targetId: ['teacher-account-dropdown', 'teacher-logout'],
      title: lang === 'ar' ? 'الحساب وتسجيل الخروج' : 'Account & Access',
      description: lang === 'ar' ? 'إدارة تفاصيل الحساب وتسجيل الخروج بأمان عند الانتهاء.' : 'Manage account details and securely sign out when done.',
      position: 'bottom' as const,
    }
  ];
  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  return (
    <div 
      className={`min-h-screen bg-background text-foreground font-sans flex overflow-hidden ${lang === 'ar' ? 'font-arabic' : ''}`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside 
        ref={drawerRef}
        id="teacher-sidebar"
        role={isMobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobileMenuOpen ? 'true' : undefined}
        aria-label={lang === 'ar' ? 'شريط التنقل للمعلم' : 'Teacher Navigation Sidebar'}
        className={`
          fixed inset-y-0 z-50 flex flex-col transition-transform duration-300 ease-premium shrink-0
          /* Mobile styling */
          max-md:glass-sheet max-md:w-64 max-md:max-w-[85vw] max-md:inset-inline-start-0
          ${isMobileMenuOpen 
            ? 'max-md:translate-x-0' 
            : 'max-md:ltr:-translate-x-full max-md:rtl:translate-x-full'
          }
          /* Desktop styling */
          ${desktopSidebarOpen ? 'md:static md:translate-x-0 md:w-[280px] md:m-4 md:rounded-3xl md:glass-nav md:shadow-xl md:border md:border-border/50' : 'md:hidden md:w-0 md:m-0'}
        `}
      >
        {/* Workspace Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
          <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
            <BrandLogo variant="compact" />
            <div>
              <span className="text-lg font-display font-bold text-foreground block leading-none">
                {lang === 'ar' ? 'وتزودوا' : 'Watazawwado'}
              </span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mt-1">
                {isSuperAdmin ? (lang === 'ar' ? 'الإدارة العامة' : 'Super Admin') : (lang === 'ar' ? 'مساحة المعلم' : 'Teacher Workspace')}
              </span>
            </div>
          </Link>
          <button 
            ref={closeButtonRef}
            onClick={toggleMobileMenu} 
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav 
          className="flex-1 overflow-y-auto py-4 px-4 space-y-1.5"
          aria-label={lang === 'ar' ? 'روابط التنقل الرئيسية للمعلم' : 'Teacher Primary Navigation'}
        >
          {navigation.map((item) => {
            const isExactMatch = location.pathname === item.path;
            const isSubPath = item.path !== '/dashboard' && location.pathname.startsWith(item.path);
            const isActive = isExactMatch || isSubPath;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-base touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group
                  ${isActive 
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
                  }
                `}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-border/50 space-y-3">
          {/* Teacher Profile Card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-surface-subtle/30 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-secondary/30 text-accent flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-secondary/50">
              {user?.email?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {lang === 'ar' ? (isSuperAdmin ? 'أستاذ محمود (إدارة)' : 'الأستاذ') : (user?.user_metadata?.name || (isSuperAdmin ? 'Ustadh Mahmoud (Admin)' : 'Ustadh Mahmoud'))}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          
          
            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'السمة' : 'Theme'}</span>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-medium text-muted-foreground">{lang === 'ar' ? 'اللغة' : 'Language'}</span>
              <button
                onClick={toggleLanguage}
                data-tour="language-toggle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === "en" ? 'عربي' : 'EN'}</span>
              </button>
            </div>
            
            <div className="pt-2 flex flex-col gap-2">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); setShowGlobalTour(true); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-sm cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'دليل الاستخدام' : 'Tour Guide'}</span>
              </button>
              <button 
                onClick={() => signOut()}
                data-tour="teacher-logout"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-semibold text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="h-16 sm:h-20 shrink-0 flex items-center justify-between px-3 sm:px-6 lg:px-10 border-b border-border/10 bg-background/50 backdrop-blur-md z-10">
            {/* Left: Mobile Toggle & BrandLogo */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
              <button 
                ref={menuTriggerRef}
                id="teacher-mobile-menu-btn"
                data-tour="teacher-mobile-menu-btn"
                onClick={toggleMobileMenu} 
                className="md:hidden min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle touch-manipulation cursor-pointer shrink-0"
                aria-label={lang === 'ar' ? 'القائمة الجانبية' : 'Menu'}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <div className="flex flex-col text-start min-w-0 md:hidden">
                <span className="text-lg sm:text-2xl font-display font-bold text-foreground leading-tight truncate">
                  {lang === "ar" ? 'مساحة العمل' : "Workspace"}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Tour Guide Button (hidden on phone) */}
              <button
                type="button"
                id="teacher-header-tour-btn"
                data-tour="teacher-header-tour-btn"
                onClick={() => setShowGlobalTour(true)}
                title={lang === 'ar' ? 'دليل الاستخدام' : 'Tour Guide'}
                aria-label={lang === 'ar' ? 'دليل الاستخدام' : 'Tour Guide'}
                className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full text-teal-800 dark:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer shadow-2xs"
              >
                <Compass className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                id="teacher-lang-btn"
                data-tour="teacher-lang-btn"
                onClick={toggleLanguage}
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-subtle border border-border/80 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span>{lang === "en" ? 'عربي' : 'EN'}</span>
              </button>

              <div id="teacher-account-dropdown" data-tour="teacher-account-dropdown">
                <AccountDropdown initials={user?.email?.charAt(0)?.toUpperCase() || "M"} isAr={lang === "ar"} />
              </div>
            </div>
          </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 bg-background w-full max-w-full">
          <div className="max-w-5xl mx-auto space-y-6 min-w-0">
            <TeacherAuthDiagnosticPanel />
            <ErrorBoundary>
              <Routes>
                {/* If super_admin, root /dashboard is Overview; if teacher, root /dashboard is Today */}
                <Route path="/" element={isSuperAdmin ? <OverviewPage /> : <TodayPage />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/today" element={<TodayPage />} />
                <Route path="/upcoming" element={<UpcomingPage />} />
                <Route path="/trials" element={<TrialsPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/intakes" element={<IntakeReviewPage />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>

        {/* Mobile Bottom Quick Navigation Bar (Navigation Tabs V5) */}
        <div className="md:hidden fixed bottom-4 inset-x-3 sm:inset-x-6 max-w-sm mx-auto z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
          <nav 
            className="pointer-events-auto relative w-full h-[60px] bg-surface/92 dark:bg-surface/90 backdrop-blur-xl rounded-full flex items-center justify-around px-2 shadow-2xl border border-border/80"
            aria-label={lang === 'ar' ? 'التنقل السريع' : 'Quick mobile navigation'}
          >
            {navigation.slice(0, 4).map((item) => {
              const isExactMatch = location.pathname === item.path;
              const isSubPath = item.path !== '/dashboard' && location.pathname.startsWith(item.path);
              const isActive = isExactMatch || isSubPath;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center justify-center flex-1 h-full touch-manipulation group"
                  aria-label={item.name}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    isActive ? 'text-teal-700 dark:text-teal-300 bg-teal-500/15 shadow-2xs' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    <Icon className="w-5 h-5 transition-transform group-active:scale-90" />
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Menu button to open full drawer */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="relative flex items-center justify-center flex-1 h-full touch-manipulation group text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={lang === 'ar' ? 'القائمة الكاملة' : 'Full menu'}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-surface-subtle transition-colors">
                <Menu className="w-5 h-5" />
              </div>
            </button>
          </nav>
        </div>
      </main>
      {/* Global Onboarding Guide */}
      <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={lang === 'ar'} />
    </div>
  );
}
