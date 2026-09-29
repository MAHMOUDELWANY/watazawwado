import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Globe,
  Compass,
  BookOpen,
  HelpCircle,
  Sparkles,
  Info,
  Calendar,
  CreditCard,
  User,
  Shield,
  ArrowRight
} from 'lucide-react';
import { BrandLogo } from './ui/BrandLogo';
import { ThemeToggle } from './ui/ThemeToggle';
import { Language, ThemeMode } from '../types';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenTrialModal: (serviceId?: string) => void;
  onOpenManageModal?: () => void;
  onStartTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenTrialModal,
  onStartTour,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const isEn = lang === 'en';
  const isRtl = lang === 'ar';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: '/learning', label: isEn ? 'Lessons & Syllabus' : 'الدروس والبرامج', icon: BookOpen },
    { href: '/how-it-works', label: isEn ? 'How It Works' : 'كيف نعمل', icon: Sparkles },
    { href: '/about', label: isEn ? 'About Ustadh Mahmoud' : 'عن المعلم والمنصة', icon: Info },
    { href: '/pricing', label: isEn ? 'Pricing' : 'الأسعار والباقات', icon: CreditCard },
    { href: '/faq', label: isEn ? 'FAQ' : 'الأسئلة الشائعة', icon: HelpCircle },
  ];

  return (
    <>
      <header
        id="main-navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 w-full ${
          isScrolled
            ? 'bg-surface shadow-xs border-b border-border/80'
            : 'bg-background/95 backdrop-blur-xs border-b border-border/40'
        }`}
        style={{ backgroundColor: isScrolled ? 'var(--surface)' : undefined }}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20 transition-all duration-300">
          
          {/* Brand Identity */}
          <Link
            to="/"
            id="nav-brand"
            data-tour="nav-brand"
            className="group flex items-center gap-2 sm:gap-2.5 text-foreground focus:outline-none rounded-lg shrink-0 min-w-0"
          >
            <BrandLogo variant="compact" />
            <div className="flex flex-col min-w-0">
              <span className="font-display text-base sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {isEn ? 'Watazawwado' : 'وتزودوا'}
              </span>
              <span className="text-[11px] font-sans text-muted-foreground hidden sm:block truncate">
                {isEn ? 'Quran & Arabic Academy' : 'أكاديمية القرآن واللغة العربية'}
              </span>
            </div>
          </Link>

          {/* ─── DESKTOP NAVIGATION LINKS (md:flex) ─────────────────────────── */}
          <nav
            id="nav-links-desktop"
            data-tour="nav-links-desktop"
            className="hidden md:flex items-center gap-5 lg:gap-6"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-semibold transition-colors py-1 ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ─── DESKTOP CONTROLS & USER PORTALS (md:flex) ───────────────────── */}
          <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
            {/* Student Portal Link */}
            <Link
              to="/student"
              id="desktop-student-portal-link"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:text-primary hover:bg-surface-subtle border border-border/70 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? 'Student Portal' : 'بوابة الطالب'}</span>
            </Link>

            {/* Teacher Workspace Link */}
            <Link
              to="/staff"
              id="desktop-teacher-workspace-link"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>{isEn ? 'Teacher' : 'المعلم'}</span>
            </Link>

            {/* Site Tour Guide Button */}
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                id="nav-tour-btn"
                data-tour="nav-tour-btn"
                title={isEn ? 'Site Tour' : 'جولة استكشافية'}
                aria-label={isEn ? 'Site Tour' : 'جولة استكشافية'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 transition-colors" />
                <span>{isEn ? 'Tour' : 'جولة'}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              id="lang-switch-btn"
              data-tour="lang-switch-btn"
              aria-label="Toggle language between English and Arabic"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-subtle border border-border/80 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-accent transition-colors" />
              <span>{isEn ? 'العربية' : 'EN'}</span>
            </button>

            {/* Theme Switcher */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Primary CTA Button */}
            <button
              onClick={() => onOpenTrialModal()}
              id="header-get-started-cta"
              data-tour="header-get-started-cta"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl btn-primary-material text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <span>{isEn ? 'Free Trial' : 'جلسة تجريبية'}</span>
            </button>
          </div>

          {/* ─── MOBILE CONTROLS (Theme + Lang OUTSIDE for easy single-tap access) ─── */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Toggle (Right outside for quick access) */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Language Toggle (Right outside for quick access) */}
            <button
              type="button"
              onClick={onToggleLang}
              aria-label="Toggle language"
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border border-border/80 bg-surface text-xs font-bold text-foreground hover:bg-surface-subtle transition-colors cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>{isEn ? 'العربية' : 'EN'}</span>
            </button>

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              id="mobile-menu-toggle"
              aria-label={isEn ? 'Open navigation drawer' : 'فتح القائمة الجانبية'}
              aria-expanded={mobileDrawerOpen}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface hover:bg-surface-subtle text-foreground border border-border/80 shadow-2xs active:scale-95 transition-all cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </div>

        </div>
      </header>

      {/* ─── MOBILE SIDE DRAWER (Opaque, Fast, Smooth Touch Scrolling) ───────── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Drawer Panel: Fully Opaque, No Transparency, Smooth Touch Pan */}
            <motion.div
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`fixed top-0 bottom-0 ${
                isRtl ? 'right-0' : 'left-0'
              } w-full max-w-[310px] sm:max-w-[340px] bg-surface text-foreground border-inline-end border-border shadow-2xl flex flex-col justify-between z-10 overscroll-contain overflow-y-auto touch-pan-y`}
              style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
            >
              {/* Drawer Top Bar */}
              <div className="h-16 px-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-surface">
                <div className="flex items-center gap-2.5">
                  <BrandLogo variant="compact" />
                  <div className="flex flex-col text-start">
                    <span className="font-display font-bold text-base text-foreground leading-none">
                      {isEn ? 'Watazawwado' : 'وتزودوا'}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {isEn ? 'Academy Menu' : 'قائمة المنصة'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label={isEn ? 'Close menu' : 'إغلاق القائمة'}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle border border-border/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content Area */}
              <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto touch-pan-y overscroll-contain">
                
                {/* 1. BOOKING & TRIALS FIRST (قبل الأقسام والصفحات كما طُلب) */}
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/25 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{isEn ? 'Book Free Trial Lesson' : 'احجز جلستك التجريبية مجاناً'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isEn
                      ? '30-minute private trial with Ustadh Mahmoud.'
                      : 'جلسة خاصة ٣٠ دقيقة مع الأستاذ محمود للتعرف على مستواك وتحديد أهدافك.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenTrialModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-primary-material text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Claim Free Trial Now' : 'احجز جلستك المجانية'}</span>
                  </button>
                </div>

                {/* 2. MAIN NAVIGATION PAGES & SECTIONS */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pb-1 block">
                    {isEn ? 'Pages & Syllabus' : 'أقسام المنصة'}
                  </span>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary border border-primary/25'
                            : 'text-foreground hover:bg-surface-subtle hover:text-primary'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-accent'}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* 3. PORTAL DIRECT ACCESS (Student & Teacher) */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pb-1 block">
                    {isEn ? 'Platform Portals' : 'بوابات المنصة'}
                  </span>

                  <Link
                    to="/student"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span>{isEn ? 'Student Portal' : 'بوابة الطالب'}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-muted-foreground" />
                  </Link>

                  <Link
                    to="/staff"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-accent shrink-0" />
                      <span>{isEn ? 'Teacher Workspace' : 'بوابة المعلم والإدارة'}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-muted-foreground" />
                  </Link>
                </div>

              </div>

              {/* Drawer Bottom Footer (Tour guide button & copyright) */}
              <div className="p-4 border-t border-border/80 bg-surface shrink-0 space-y-2">
                {onStartTour && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onStartTour();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200 text-xs font-bold hover:bg-teal-500/20 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{isEn ? 'Start Site Tour' : 'الجولة الاستكشافية للموقع'}</span>
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
