import { BrandLogo } from '../components/ui/BrandLogo';
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
  Shield
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
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl transition-all duration-base font-medium shadow-xs min-h-[44px]"
          >
            Go to Teacher Login
          </Link>
        </div>
      </div>
    );
  }

  // Role-scoped navigation
  const superAdminNavigation = [
    { name: lang === 'ar' ? 'نظرة عامة' : 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: lang === 'ar' ? 'اليوم' : 'Today', path: '/dashboard/today', icon: Clock },
    { name: lang === 'ar' ? 'الجدول القادم' : 'Upcoming', path: '/dashboard/upcoming', icon: Calendar },
    { name: lang === 'ar' ? 'المعلمون' : 'Teachers', path: '/dashboard/teachers', icon: Shield },
    { name: lang === 'ar' ? 'الطلاب' : 'Students', path: '/dashboard/students', icon: Users },
    { name: lang === 'ar' ? 'الحجوزات' : 'Bookings', path: '/dashboard/bookings', icon: BookOpen },
    { name: lang === 'ar' ? 'التجريبية' : 'Trials', path: '/dashboard/trials', icon: Sparkles },
    { name: lang === 'ar' ? 'التواصل' : 'Leads', path: '/dashboard/leads', icon: UserPlus },
    { name: lang === 'ar' ? 'مراجعة الطلبات' : 'Intake Review', path: '/dashboard/intakes', icon: ClipboardCheck },
    { name: lang === 'ar' ? 'التقارير' : 'Analytics', path: '/dashboard/analytics', icon: TrendingUp },
    { name: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const teacherNavigation = [
    { name: lang === 'ar' ? 'اليوم' : 'Today', path: '/dashboard', icon: LayoutDashboard },
    { name: lang === 'ar' ? 'الجدول القادم' : 'Upcoming', path: '/dashboard/upcoming', icon: Calendar },
    { name: lang === 'ar' ? 'التجريبية' : 'Trials', path: '/dashboard/trials', icon: Sparkles },
    { name: lang === 'ar' ? 'طلابي' : 'My Students', path: '/dashboard/students', icon: Users },
    { name: lang === 'ar' ? 'حجوزاتي' : 'My Bookings', path: '/dashboard/bookings', icon: BookOpen },
    { name: lang === 'ar' ? 'إحصائياتي' : 'My Analytics', path: '/dashboard/analytics', icon: TrendingUp },
    { name: lang === 'ar' ? 'الإعدادات' : 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const navigation = isSuperAdmin ? superAdminNavigation : teacherNavigation;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
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

      {/* Sidebar */}
      <aside 
        ref={drawerRef}
        id="teacher-sidebar"
        role={isMobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobileMenuOpen ? 'true' : undefined}
        aria-label={lang === 'ar' ? 'شريط التنقل للمعلم' : 'Teacher Navigation Sidebar'}
        className={`
          fixed inset-y-0 start-0 z-50 w-64 max-w-[85vw] glass-sheet border-r-0
          transform transition-transform duration-300 ease-premium md:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full md:ltr:translate-x-0 md:rtl:translate-x-0'}
          flex flex-col shadow-xs
        `}
      >
        {/* Workspace Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
            <BrandLogo variant="compact" />
            <div>
              <span className="text-sm font-display font-semibold tracking-tight text-foreground block">
                {lang === 'ar' ? 'وتزودوا — المعلم' : 'Watazawwado'}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                {isSuperAdmin ? (lang === 'ar' ? 'الإدارة العامة' : 'Super Admin') : (lang === 'ar' ? 'مساحة المعلم' : 'Teacher Workspace')}
              </span>
            </div>
          </Link>
          <button 
            ref={closeButtonRef}
            onClick={toggleMobileMenu} 
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:glass-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav 
          className="flex-1 overflow-y-auto py-5 px-3 space-y-1"
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
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-base touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isActive 
                    ? 'bg-secondary/30 text-accent dark:bg-primary/20 font-semibold shadow-2xs' 
                    : 'text-muted-foreground hover:text-foreground hover:glass-surface'
                  }
                `}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'opacity-70'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Teacher Profile Card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl glass-surface border border-border">
            <div className="w-8 h-8 rounded-full bg-secondary/40 text-accent flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {lang === 'ar' ? (isSuperAdmin ? 'أستاذ محمود (إدارة)' : 'الأستاذ') : (user?.user_metadata?.name || (isSuperAdmin ? 'Ustadh Mahmoud (Admin)' : 'Ustadh Mahmoud'))}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
              isSuperAdmin ? 'bg-secondary/30 text-accent font-bold' : 'bg-secondary/30 text-primary'
            }`}>
              {isSuperAdmin ? 'Admin' : 'Teacher'}
            </span>
          </div>

          
        </div>
      
          </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 glass-nav border-b-0 z-10">
            {/* Left: Mobile Toggle & BrandLogo */}
            <div className="flex items-center gap-4">
              <button 
                ref={menuTriggerRef}
                onClick={toggleMobileMenu} 
                className="md:hidden p-2 -ms-1 text-muted-foreground hover:text-foreground rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link to="/" className="flex items-center gap-2">
                <BrandLogo variant="compact" />
                <span className="font-display font-semibold text-foreground text-sm hidden md:inline-block">
                  {lang === "ar" ? '\u0645\u0633\u0627\u062D\u0629 \u0639\u0645\u0644 \u0648\u062A\u0632\u0648\u062F\u0648\u0627' : "Watazawwado Workspace"}
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-1.5 px-4">
              {navigation.map((item) => {
                const isExactMatch = location.pathname === item.path;
                const isSubPath = item.path !== "/dashboard" && location.pathname.startsWith(item.path);
                const isActive = isExactMatch || isSubPath;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isActive ? "bg-secondary/20 text-accent font-semibold" : "text-muted-foreground hover:text-foreground hover:glass-surface"}`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="hidden md:flex p-2 text-primary hover:glass-surface rounded-xl text-xs font-semibold"
              >
                {lang === "en" ? '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' : "EN"}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <AccountDropdown initials={user?.email?.charAt(0)?.toUpperCase() || "M"} isAr={lang === "ar"} />
            </div>
          </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
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
      </main>
    </div>
  );
}

