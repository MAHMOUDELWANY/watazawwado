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
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
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

  // Lock body scroll safely when drawer is open
  useEffect(() => {
    if (sideDrawerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [sideDrawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    setSideDrawerOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: '/learning', label: isEn ? 'Lessons & Syllabus' : 'الدروس والبرامج', icon: BookOpen },
    { href: '/how-it-works', label: isEn ? 'How It Works' : 'كيف نعمل', icon: Sparkles },
    { href: '/about', label: isEn ? 'About Ustadh Mahmoud' : 'عن المعلم والمنصة', icon: Info },
    { href: '/pricing', label: isEn ? 'Pricing & Packages' : 'الأسعار والباقات', icon: CreditCard },
    { href: '/faq', label: isEn ? 'FAQ' : 'الأسئلة الشائعة', icon: HelpCircle },
  ];

  return (
    <>
      {/* ─── SLEEK, UNCLUTTERED TOP NAVIGATION BAR (Desktop & Mobile) ─────────── */}
      <header
        id="main-navigation"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 w-full ${
          isScrolled
            ? 'shadow-xs border-b border-border/80'
            : 'border-b border-border/40'
        }`}
        style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
      >
        <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20 transition-all duration-300">
          
          {/* Brand Identity */}
          <Link
            to="/"
            id="nav-brand"
            data-tour="nav-brand"
            className="group flex items-center gap-2 sm:gap-2.5 text-foreground focus:outline-none rounded-lg shrink-0 min-w-0"
          >
            <BrandLogo variant="compact" />
            <div className="flex flex-col min-w-0">
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {isEn ? 'Watazawwado' : 'وتزودوا'}
              </span>
              <span className="text-[11px] font-sans text-muted-foreground hidden sm:block truncate">
                {isEn ? 'Quran & Arabic Academy' : 'أكاديمية القرآن واللغة العربية'}
              </span>
            </div>
          </Link>

          {/* ─── RIGHT CONTROLS: Clean, Spacious, and Accessible on Both Desktop & Mobile ─── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              id="lang-switch-btn"
              data-tour="lang-switch-btn"
              aria-label="Toggle language between English and Arabic"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-subtle border border-border/80 transition-colors cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-accent transition-colors" />
              <span>{isEn ? 'العربية' : 'EN'}</span>
            </button>

            {/* Primary CTA Button (Free Trial) */}
            <button
              onClick={() => onOpenTrialModal()}
              id="header-get-started-cta"
              data-tour="header-get-started-cta"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl btn-primary-material text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <span>{isEn ? 'Free Trial' : 'جلسة تجريبية'}</span>
            </button>

            {/* ─── SIDEBAR TOGGLE BUTTON (Opens the side menu on Desktop and Mobile) ─── */}
            <button
              type="button"
              onClick={() => setSideDrawerOpen(true)}
              id="mobile-menu-toggle"
              data-tour="mobile-menu-toggle"
              aria-label={isEn ? 'Open side navigation menu' : 'فتح القائمة الجانبية'}
              aria-expanded={sideDrawerOpen}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-foreground border border-border/80 shadow-2xs active:scale-95 transition-all cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="w-5 h-5 text-foreground" />
              <span className="hidden md:inline text-xs sm:text-sm font-bold">
                {isEn ? 'Menu' : 'القائمة'}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* ─── DEDICATED SIDE DRAWER NAVIGATION (Desktop & Mobile) ─────────────── */}
      <AnimatePresence>
        {sideDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSideDrawerOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
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
              } w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] text-foreground border-inline-end border-border shadow-2xl flex flex-col justify-between z-10 overscroll-contain overflow-y-auto touch-pan-y`}
              style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
            >
              {/* Drawer Top Bar */}
              <div className="h-16 sm:h-20 px-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-surface">
                <div className="flex items-center gap-2.5">
                  <BrandLogo variant="compact" />
                  <div className="flex flex-col text-start">
                    <span className="font-display font-bold text-base sm:text-lg text-foreground leading-none">
                      {isEn ? 'Watazawwado' : 'وتزودوا'}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      {isEn ? 'Main Navigation' : 'قائمة المنصة'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSideDrawerOpen(false)}
                  aria-label={isEn ? 'Close menu' : 'إغلاق القائمة'}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle border border-border/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content Area */}
              <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto touch-pan-y overscroll-contain">
                
                {/* 1. BOOKINGS & TRIALS FIRST */}
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
                      setSideDrawerOpen(false);
                      onOpenTrialModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-primary-material text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Claim Free Trial Now' : 'احجز جلستك المجانية'}</span>
                  </button>
                </div>

                {/* 2. PAGES & SYLLABUS NAVIGATION LINKS */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pb-1 block">
                    {isEn ? 'Pages & Syllabus' : 'صفحات وأقسام المنصة'}
                  </span>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setSideDrawerOpen(false)}
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
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pb-1 block">
                    {isEn ? 'Platform Portals' : 'بوابات المنصة'}
                  </span>

                  <Link
                    to="/student"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span>{isEn ? 'Student Portal' : 'بوابة الطالب (تسجيل الدخول)'}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-muted-foreground" />
                  </Link>

                  <Link
                    to="/staff"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-accent shrink-0" />
                      <span>{isEn ? 'Teacher Workspace' : 'بوابة المعلم والإدارة'}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-muted-foreground" />
                  </Link>
                </div>

              </div>

              {/* Drawer Bottom Footer (Tour guide button) */}
              <div className="p-4 border-t border-border/80 bg-surface shrink-0 space-y-2">
                {onStartTour && (
                  <button
                    type="button"
                    onClick={() => {
                      setSideDrawerOpen(false);
                      onStartTour();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200 text-xs sm:text-sm font-bold hover:bg-teal-500/20 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isEn ? 'Start Interactive Site Tour' : 'الجولة الاستكشافية للموقع'}</span>
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
