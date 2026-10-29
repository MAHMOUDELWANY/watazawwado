import { InstallAppEntry } from '../components/pwa/InstallApp';
import { BrandLogo } from '../components/ui/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { OnboardingGuide } from '../components/ui/OnboardingGuide';
import { AccountDropdown } from '../components/ui/AccountDropdown';
import { MobileTabBar, isTabActive, MOBILE_TAB_BAR_PADDING, type MobileTab } from '../components/ui/MobileTabBar';
import { BrandLoader } from '../components/ui/BrandLoader';
import { SidebarHandle, useSidebarOpen } from '../components/ui/SidebarHandle';
import { WelcomeLoader, useWelcomeGate, type WelcomeGender } from '../components/ui/WelcomeLoader';
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTeacherAuth, wasJustSignedOut } from '../lib/auth';
import { dashboardFetch } from './lib/dashboardApi';
import {
  LayoutDashboard,
  Calendar,
  CalendarClock,
  Users,
  BookOpen,
  Settings,
  X,
  Sparkles,
  UserPlus,
  TrendingUp,
  ShieldCheck,
  Clock,
  ClipboardCheck,
  Shield,
  Compass,
  Globe,
  HelpCircle,
  LogOut,
  Bell,
  Wallet,
  MessageCircle,
  GraduationCap,
  Search,
  MoreHorizontal,
  Library,
  Activity,
  Tag,
  Banknote,
  Award,
  Trophy,
} from 'lucide-react';
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
import DiscountsPage from './pages/DiscountsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import NotificationsPage, { useUnreadDashboardNotifications } from './pages/NotificationsPage';
import PayLaterPage from './pages/PayLaterPage';
import PayrollPage from './pages/PayrollPage';
import HonorPage from './pages/HonorPage';
import ClassBoardPage from './pages/ClassBoardPage';
import MyMonthPage from './pages/MyMonthPage';
import HealthPage from './pages/HealthPage';
import PlacementTestsPage from './pages/PlacementTestsPage';
import CurriculumPage, { CurriculumGroupPage, CurriculumTrackPage, CurriculumLessonPage } from './pages/CurriculumPage';
import { ChatPanel } from '../components/chat/ChatPanel';
import { TeacherAuthDiagnosticPanel } from './components/TeacherAuthDiagnosticPanel';
import { CommandSearch } from './components/CommandSearch';
import { useAppLanguage } from '../lib/language';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FeedbackHost } from '../components/ui/Feedback';
import { TimezoneCheck } from '../components/ui/TimezoneCheck';

type NavItem = { name: string; path: string; icon: typeof Clock; group?: string };

/** Dark ink glass used by the rail and the active top tab. */
const INK = 'bg-[#0A2E35]/92 dark:bg-[#0B1C1F]/90';

export function DashboardApp() {
  const { isTeacherAuthenticated, user, signOut, teacherRole, loading, userRole } = useTeacherAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGlobalTour, setShowGlobalTour] = useState(false);
  const [search, setSearch] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // Same language as the rest of the site (cookie + account preference), RULES.md §6.
  const { lang, toggleLanguage } = useAppLanguage();
  const unreadNotifications = useUnreadDashboardNotifications(isTeacherAuthenticated);

  const isSuperAdmin = teacherRole === 'super_admin';

  const drawerRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const prevMobileMenuOpenRef = React.useRef(isMobileMenuOpen);

  // A teacher who has not accepted the current teacher agreement goes to read it first (server enforces it too).
  // The same call gives the name for the welcome screen.
  const [agreementRequired, setAgreementRequired] = useState(false);
  const [me, setMe] = useState<{ displayName?: string; display_name?: string; gender?: WelcomeGender } | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  useEffect(() => {
    if (!isTeacherAuthenticated) return;
    dashboardFetch('/api/dashboard/me')
      .then((data: any) => {
        setAgreementRequired(data?.user?.agreementRequired === true);
        setMe(data?.user || null);
      })
      .catch(() => {})
      .finally(() => setMeLoaded(true));
  }, [isTeacherAuthenticated]);

  // The welcome greets a signed-in person; a visitor without a session sees the plain brand loader.
  const showWelcome = useWelcomeGate((loading && Boolean(user)) || (isTeacherAuthenticated && !meLoaded));

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
        document.getElementById('teacher-more-btn')?.focus();
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

  // CRM-06: Ctrl/Cmd+K opens the admin search across accounts, bookings and payments.
  useEffect(() => {
    if (!isSuperAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCommandOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSuperAdmin]);

  // Hooks must run before any early return (the login / loading screens below), or React crashes after sign-in.
  const [railOpen, toggleRail] = useSidebarOpen('teacher-rail-open');

  if (isTeacherAuthenticated && agreementRequired) {
    return <Navigate to="/staff/agreement" replace />;
  }

  if (loading && !user) return <BrandLoader size="page" />;

  if (showWelcome) {
    return (
      <WelcomeLoader
        // Until the role is known, the neutral academy line (never "your students are waiting" to the admin).
        role={teacherRole === 'teacher' ? 'teacher' : 'admin'}
        lang={lang === 'ar' ? 'ar' : 'en'}
        name={me?.displayName || me?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name}
        gender={me?.gender}
      />
    );
  }

  // Not a signed-in teacher: no dead-end screen. A student goes to their own area; someone who just logged out goes
  // to the shared sign-in door (/student, where the installed app opens); anyone else to the staff sign-in.
  if (!isTeacherAuthenticated) {
    if (user && userRole === 'student') return <Navigate to="/student" replace />;
    return <Navigate to={wasJustSignedOut() ? '/student' : '/staff/login'} replace />;
  }

  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);

  // Role-scoped navigation (Concise, friendly, uncluttered)
  // The admin menu in groups (audit 2026-10-28): the day, people, money, the academy, the system.
  const G = {
    people: L('People', 'الناس'),
    money: L('Money', 'الفلوس'),
    academy: L('Academy', 'الأكاديمية'),
    system: L('System', 'النظام'),
  };
  const superAdminNavigation: NavItem[] = [
    { name: L('Overview', 'الرئيسية'), path: '/dashboard', icon: LayoutDashboard },
    { name: L('Today', 'اليوم'), path: '/dashboard/today', icon: Clock },
    { name: L('Schedule', 'الجدول'), path: '/dashboard/upcoming', icon: Calendar },
    { name: L('Messages', 'الرسائل'), path: '/dashboard/messages', icon: MessageCircle },
    { name: L('Notifications', 'الإشعارات'), path: '/dashboard/notifications', icon: Bell },
    { name: L('Students', 'الطلاب'), path: '/dashboard/students', icon: Users, group: G.people },
    { name: L('Leads', 'المهتمون'), path: '/dashboard/leads', icon: UserPlus, group: G.people },
    { name: L('Requests', 'الطلبات'), path: '/dashboard/intakes', icon: ClipboardCheck, group: G.people },
    { name: L('Trials', 'التجريبية'), path: '/dashboard/trials', icon: Sparkles, group: G.people },
    { name: L('Placement', 'تحديد المستوى'), path: '/dashboard/placement', icon: GraduationCap, group: G.people },
    { name: L('Bookings', 'الحجوزات'), path: '/dashboard/bookings', icon: BookOpen, group: G.money },
    { name: L('Pay later', 'ادفع لاحقاً'), path: '/dashboard/pay-later', icon: Wallet, group: G.money },
    { name: L('Discounts', 'الخصومات'), path: '/dashboard/discounts', icon: Tag, group: G.money },
    { name: L('Teacher pay', 'مرتبات المعلمين'), path: '/dashboard/payroll', icon: Banknote, group: G.money },
    { name: L('Faculty', 'المعلمون'), path: '/dashboard/teachers', icon: Shield, group: G.academy },
    { name: L('Curriculum', 'المنهج'), path: '/dashboard/curriculum', icon: Library, group: G.academy },
    { name: L('Hall of Honor', 'لوحة الشرف'), path: '/dashboard/honor', icon: Award, group: G.academy },
    { name: L('Class board', 'لوحة الحلقة'), path: '/dashboard/class-board', icon: Trophy, group: G.academy },
    { name: L('My hours', 'مواعيدي'), path: '/dashboard/availability', icon: CalendarClock, group: G.academy },
    { name: L('Reports', 'التقارير'), path: '/dashboard/analytics', icon: TrendingUp, group: G.academy },
    { name: L('Health', 'صحة النظام'), path: '/dashboard/health', icon: Activity, group: G.system },
    { name: L('Settings', 'الإعدادات'), path: '/dashboard/settings', icon: Settings, group: G.system },
  ];

  const teacherNavigation: NavItem[] = [
    { name: L('Today', 'اليوم'), path: '/dashboard', icon: Clock },
    { name: L('Schedule', 'الجدول'), path: '/dashboard/upcoming', icon: Calendar },
    { name: L('Trials', 'التجريبية'), path: '/dashboard/trials', icon: Sparkles },
    { name: L('Students', 'طلابي'), path: '/dashboard/students', icon: Users },
    { name: L('Messages', 'الرسائل'), path: '/dashboard/messages', icon: MessageCircle },
    { name: L('Notifications', 'الإشعارات'), path: '/dashboard/notifications', icon: Bell },
    // Schedule = what is coming; All lessons = past and future, where summaries are written.
    { name: L('All lessons', 'كل الحصص'), path: '/dashboard/bookings', icon: BookOpen },
    { name: L('My hours', 'مواعيدي'), path: '/dashboard/availability', icon: CalendarClock },
    { name: L('My month', 'شهري'), path: '/dashboard/month', icon: Banknote },
    { name: L('Curriculum', 'المنهج'), path: '/dashboard/curriculum', icon: Library },
    { name: L('Class board', 'لوحة الحلقة'), path: '/dashboard/class-board', icon: Trophy },
    { name: L('Settings', 'الإعدادات'), path: '/dashboard/settings', icon: Settings },
  ];

  const navigation = isSuperAdmin ? superAdminNavigation : teacherNavigation;
  const isActive = (path: string) => isTabActive(path, location.pathname, '/dashboard')
    // The root also lives at /overview (admin) and /today (teacher).
    || (path === '/dashboard' && isTabActive(isSuperAdmin ? '/dashboard/overview' : '/dashboard/today', location.pathname, '/dashboard'));

  // Main sections: pill tabs on desktop, tab bar on phones.
  const byPath = (list: NavItem[], paths: string[]) => paths.map((p) => list.find((i) => i.path === p)!).filter(Boolean);
  const topTabs: NavItem[] = isSuperAdmin
    ? byPath(superAdminNavigation, ['/dashboard', '/dashboard/bookings', '/dashboard/students', '/dashboard/messages'])
    : byPath(teacherNavigation, ['/dashboard', '/dashboard/upcoming', '/dashboard/students', '/dashboard/messages']);

  // Phones show the same main sections as the desktop tabs, so a page never moves between screen sizes.
  const mobileTabs: MobileTab[] = [
    ...topTabs.map((item) => ({ key: item.path, label: item.name, icon: item.icon, to: item.path, active: isActive(item.path) })),
    { key: 'more', id: 'teacher-more-btn', label: L('More', 'المزيد'), icon: MoreHorizontal, onClick: () => setIsMobileMenuOpen(true) },
  ];

  // Each page has one place per screen size (owner, 2026-10-23): header tabs + bell on tablets and up, the rail holds the
  // rest; on phones the bottom bar holds the main sections and the "More" drawer the rest.
  const railItems = navigation.filter((item) => item.path !== '/dashboard/notifications' && !topTabs.includes(item));
  const drawerItems = navigation.filter((item) => item.path !== '/dashboard/notifications' && !mobileTabs.some((tab) => tab.to === item.path));

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const globalTourSteps = [
    {
      targetId: ['teacher-rail', 'teacher-sidebar', 'teacher-more-btn'],
      title: L('Workspace Navigation', 'القائمة الرئيسية'),
      description: L('Easily navigate between sessions, schedule, student roster, and workspace controls.', 'التنقل بين الدروس، جدول المواعيد، قائمة الطلاب، وإدارة المنصة.'),
      position: 'bottom' as const,
    },
    {
      targetId: ['teacher-header-tour-btn', 'teacher-lang-btn', 'language-toggle'],
      title: L('Language & Display', 'تغيير اللغة والعرض'),
      description: L('Toggle teacher workspace between Arabic and English with one tap.', 'تبديل واجهة المعلم بين العربية والإنجليزية بلمسة واحدة.'),
      position: 'bottom' as const,
    },
    {
      targetId: ['teacher-account-dropdown', 'teacher-logout'],
      title: L('Account & Access', 'الحساب وتسجيل الخروج'),
      description: L('Manage account details and securely sign out when done.', 'إدارة تفاصيل الحساب وتسجيل الخروج بأمان عند الانتهاء.'),
      position: 'bottom' as const,
    }
  ];

  // Search jumps to a page by its name.
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    const hit = q && navigation.find((item) => item.name.toLowerCase().includes(q));
    if (hit) {
      navigate(hit.path);
      setSearch('');
    }
  };

  const displayName = me?.displayName || me?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name;
  const roleLabel = isSuperAdmin ? L('Super Admin', 'الإدارة العامة') : L('Teacher Workspace', 'مساحة المعلم');
  const iconButton = 'relative w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <div
      className={`relative isolate h-screen supports-[height:100dvh]:h-dvh bg-background text-foreground font-sans flex overflow-hidden ${ar ? 'font-arabic' : ''}`}
      dir={ar ? 'rtl' : 'ltr'}
    >
      {/* Desktop: floating ink rail with every page */}
      <aside
        id="teacher-rail"
        aria-label={L('Teacher Navigation Sidebar', 'شريط التنقل للمعلم')}
        inert={!railOpen}
        className={`hidden md:flex fixed start-4 top-1/2 -translate-y-1/2 z-30 w-[68px] max-h-[calc(100vh-2rem)] flex-col items-center gap-2 rounded-[2.25rem] py-3 ${INK} backdrop-blur-xl text-white/70 ring-1 ring-white/10 shadow-[0_24px_48px_-24px_rgba(5,54,63,0.65)] transition-[opacity,translate] duration-300 ease-out ${railOpen ? '' : 'opacity-0 -translate-x-[140%] rtl:translate-x-[140%] pointer-events-none'}`}
      >
        <Link to="/" aria-label={L('Watazawwado website', 'موقع وتزودوا')} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">
          <BrandLogo variant="compact" />
        </Link>
        <span className="w-6 h-px bg-white/15" aria-hidden="true" />
        <nav
          aria-label={L('Teacher Primary Navigation', 'روابط التنقل الرئيسية للمعلم')}
          className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] flex flex-col items-center gap-1 px-2"
        >
          {railItems.map((item, idx) => {
            const active = isActive(item.path);
            const startsGroup = Boolean(item.group && item.group !== railItems[idx - 1]?.group);
            return (
              <React.Fragment key={item.path}>
              {startsGroup && <span className="shrink-0 w-6 h-px my-1 bg-white/15" aria-hidden="true" />}
              <Link
                to={item.path}
                title={item.group ? `${item.group} · ${item.name}` : item.name}
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
                className={`relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${active ? 'text-white' : 'hover:text-white hover:bg-white/10'}`}
              >
                {active && <motion.span layoutId="rail-active" className="absolute inset-0 rounded-full bg-crimson shadow-md shadow-black/30" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                <item.icon className="relative w-[18px] h-[18px]" aria-hidden="true" />
                {item.path === '/dashboard/notifications' && unreadNotifications > 0 && (
                  <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[#E5A93C] ring-2 ring-[#0A2E35]" />
                )}
              </Link>
              </React.Fragment>
            );
          })}
        </nav>
      </aside>

      <SidebarHandle
        open={railOpen} onToggle={toggleRail} controls="teacher-rail"
        labelOpen={L('Hide the sidebar', 'اخفي الشريط الجانبي')} labelClosed={L('Show the sidebar', 'اظهر الشريط الجانبي')}
        className={`hidden md:flex fixed top-1/2 -translate-y-1/2 ${railOpen ? 'start-[88px]' : 'start-0'}`}
      />

      {/* Phone drawer (opened by the menu button or "More") */}
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
        aria-label={L('Teacher Navigation Sidebar', 'شريط التنقل للمعلم')}
        className={`md:hidden fixed inset-y-0 start-0 z-50 flex flex-col w-72 max-w-[85vw] bg-surface text-foreground border-e border-border shadow-2xl transition-transform duration-300 ease-premium ${
          isMobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
          <Link to="/" className="tap-44 relative flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
            <BrandLogo variant="compact" />
            <div>
              <span className="text-xl font-display font-bold text-foreground block leading-none">
                {L('Watazawwado', 'وتزودوا')}
              </span>
              <span className="text-[12px] text-muted-foreground block mt-1.5">{roleLabel}</span>
            </div>
          </Link>
          <button
            ref={closeButtonRef}
            onClick={toggleMobileMenu}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={L('Close menu', 'إغلاق القائمة')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto py-4 px-4 space-y-1"
          aria-label={L('Teacher Primary Navigation', 'روابط التنقل الرئيسية للمعلم')}
        >
          {drawerItems.map((item, idx) => {
            const active = isActive(item.path);
            const startsGroup = Boolean(item.group && item.group !== drawerItems[idx - 1]?.group);
            return (
              <React.Fragment key={item.path}>
              {startsGroup && <p className="px-4 pt-4 pb-1 text-xs font-semibold text-muted-foreground">{item.group}</p>}
              <Link
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-colors touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active ? `${INK} text-white font-bold` : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
                }`}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                <span className="truncate">{item.name}</span>
                {item.path === '/dashboard/notifications' && unreadNotifications > 0 && (
                  <span className="ms-auto min-w-[20px] h-5 px-1.5 rounded-full bg-crimson text-white text-[11px] font-bold flex items-center justify-center" aria-label={L(`${unreadNotifications} new`, `${unreadNotifications} إشعار جديد`)}>
                    {unreadNotifications}
                  </span>
                )}
              </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border/50 space-y-3">
          <InstallAppEntry isAr={ar} onOpen={() => setIsMobileMenuOpen(false)} />
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-surface-subtle/40 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-secondary/30 text-accent flex items-center justify-center font-bold text-sm shrink-0 border border-secondary/50">
              {(displayName || user?.email || 'M').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {displayName || (isSuperAdmin ? L('Admin', 'المدير') : L('Teacher', 'المعلم'))}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5" dir="ltr">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">{L('Theme', 'السمة')}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium text-muted-foreground">{L('Language', 'اللغة')}</span>
            <button
              onClick={toggleLanguage}
              data-tour="language-toggle"
              className="tap-44 relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setIsMobileMenuOpen(false); setShowGlobalTour(true); }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold text-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{L('Tour Guide', 'دليل الاستخدام')}</span>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-semibold text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
              <span>{L('Log Out', 'تسجيل الخروج')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 h-screen supports-[height:100dvh]:h-dvh overflow-hidden transition-[padding] duration-300 ease-out ${railOpen ? 'md:ps-[100px]' : 'md:ps-6'}`}>
        <header className="shrink-0 z-20 px-4 sm:px-6 lg:px-8 pt-3 md:pt-4">
          <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
            {/* Start: menu (phones) and workspace name */}
            <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none">
              <div className="min-w-0 text-start">
                <span className="block font-display font-bold text-lg leading-tight truncate">{L('Watazawwado', 'وتزودوا')}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{roleLabel}</span>
              </div>
            </div>

            {/* Centre: main sections as pill tabs */}
            <nav aria-label={L('Main sections', 'الأقسام الرئيسية')} className="hidden md:flex mx-auto items-center gap-1 p-1 rounded-full bg-surface/80 dark:bg-surface/70 backdrop-blur-xl ring-1 ring-border/60 shadow-xs">
              {topTabs.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-2 px-4 h-9 rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {active && <motion.span layoutId="top-tab-active" className={`absolute inset-0 rounded-full ${INK}`} transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                    <item.icon className="relative w-4 h-4" aria-hidden="true" />
                    <span className="relative">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* End: search, bell, language, theme, account */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-surface/80 dark:bg-surface/70 backdrop-blur-xl ring-1 ring-border/60 shadow-xs shrink-0">
              <form onSubmit={onSearch} role="search" className="hidden lg:flex items-center gap-2 ps-3 pe-1 h-10 rounded-full bg-surface-subtle/60">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  list="dashboard-pages"
                  placeholder={L('Find a page', 'دوّر على صفحة')}
                  aria-label={L('Find a page', 'دوّر على صفحة')}
                  className="w-36 xl:w-44 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <datalist id="dashboard-pages">
                  {navigation.map((item) => <option key={item.path} value={item.name} />)}
                </datalist>
              </form>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  aria-label={L('Search everything (Ctrl K)', 'ابحث في كل حاجة (Ctrl K)')}
                  title={L('Search everything (Ctrl K)', 'ابحث في كل حاجة (Ctrl K)')}
                  className="w-10 h-10 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer focus-ring"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                id="teacher-header-tour-btn"
                data-tour="teacher-header-tour-btn"
                onClick={() => setShowGlobalTour(true)}
                title={L('Tour Guide', 'دليل الاستخدام')}
                aria-label={L('Tour Guide', 'دليل الاستخدام')}
                className={`hidden md:flex ${iconButton} text-teal`}
              >
                <Compass className="w-[18px] h-[18px]" />
              </button>
              <Link to="/dashboard/notifications" aria-label={L('Notifications', 'الإشعارات')} className={iconButton}>
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
              <button
                type="button"
                id="teacher-lang-btn"
                data-tour="teacher-lang-btn"
                onClick={toggleLanguage}
                aria-label={L('Switch to Arabic', 'Switch to English')}
                className="h-10 px-2.5 rounded-full text-xs font-semibold text-foreground hover:bg-surface-subtle transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
              </button>
              <span className="hidden md:contents"><ThemeToggle compact /></span>
              <div id="teacher-account-dropdown" data-tour="teacher-account-dropdown">
                <AccountDropdown initials={(displayName || user?.email || 'M').charAt(0).toUpperCase()} isAr={ar} accountPath="/dashboard/settings" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 ${MOBILE_TAB_BAR_PADDING} w-full max-w-full`}>
          <div className="max-w-6xl mx-auto space-y-6 min-w-0">
            <TeacherAuthDiagnosticPanel />
            <FeedbackHost />
            <TimezoneCheck isAr={ar} />
            {isSuperAdmin && <CommandSearch open={commandOpen} onClose={() => setCommandOpen(false)} />}
            <ErrorBoundary>
              <Routes>
                {/* If super_admin, root /dashboard is Overview; if teacher, root /dashboard is Today */}
                <Route path="/" element={isSuperAdmin ? <OverviewPage /> : <TodayPage />} />
                <Route path="/overview" element={isSuperAdmin ? <OverviewPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/today" element={<TodayPage />} />
                <Route path="/upcoming" element={<UpcomingPage />} />
                <Route path="/trials" element={<TrialsPage />} />
                <Route path="/leads" element={isSuperAdmin ? <LeadsPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/intakes" element={isSuperAdmin ? <IntakeReviewPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/teachers" element={isSuperAdmin ? <TeachersPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/analytics" element={isSuperAdmin ? <AnalyticsPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/availability" element={<AvailabilityPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/pay-later" element={isSuperAdmin ? <PayLaterPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/payroll" element={isSuperAdmin ? <PayrollPage /> : <Navigate to="/dashboard/month" replace />} />
                <Route path="/month" element={<MyMonthPage />} />
                <Route path="/honor" element={isSuperAdmin ? <HonorPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/class-board" element={<ClassBoardPage />} />
                <Route path="/pay" element={<Navigate to="/dashboard/month" replace />} />
                <Route path="/discounts" element={isSuperAdmin ? <DiscountsPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/health" element={isSuperAdmin ? <HealthPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/messages" element={<ChatPanel lang={ar ? 'ar' : 'en'} />} />
                <Route path="/assistant" element={<Navigate to="/dashboard" replace />} />
                <Route path="/curriculum" element={<CurriculumPage />} />
                <Route path="/curriculum/:group" element={<CurriculumGroupPage />} />
                <Route path="/curriculum/:group/:track" element={<CurriculumTrackPage />} />
                <Route path="/curriculum/:group/:track/:number" element={<CurriculumLessonPage />} />
                <Route path="/placement" element={isSuperAdmin ? <PlacementTestsPage /> : <Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>

        <MobileTabBar tabs={mobileTabs} label={L('Quick mobile navigation', 'التنقل السريع')} hidden={isMobileMenuOpen} isAr={ar} />
      </main>
      {/* Global Onboarding Guide */}
      <OnboardingGuide steps={globalTourSteps} isOpen={showGlobalTour} onClose={() => setShowGlobalTour(false)} isAr={ar} />
    </div>
  );
}
