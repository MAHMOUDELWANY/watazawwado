import { InstallAppEntry } from './pwa/InstallApp';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import FocusTrap from './FocusTrap';
import { useLocation } from 'react-router-dom';
import { Link } from './public/LangLink';
import { stripLangPrefix } from '../lib/language';
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
import { useScrollPaletteTransition } from '../lib/useScrollPaletteTransition';

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

  // Close drawer on route or language change
  useEffect(() => {
    setSideDrawerOpen(false);
  }, [location.pathname, lang]);

  const navLinks = [
    { href: '/learning', label: isEn ? 'Subjects' : 'المواد', icon: BookOpen },
    { href: '/how-it-works', label: isEn ? 'How it works' : 'كيف نعمل', icon: Sparkles },
    { href: '/about', label: isEn ? 'About us' : 'من نحن', icon: Info },
    { href: '/pricing', label: isEn ? 'Prices & packages' : 'الأسعار والباقات', icon: CreditCard },
    { href: '/faq', label: isEn ? 'FAQ' : 'الأسئلة الشائعة', icon: HelpCircle },
  ];

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 35,
    restDelta: 0.001
  });

  const { currentColor } = useScrollPaletteTransition();

  return (
    <>
      {/* ─── 4-COLOR HERITAGE SCROLL PROGRESS BAR AT TOP OF SCREEN ────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3.5px] z-50 pointer-events-none origin-left rtl:origin-right transition-shadow duration-300"
        style={{
          scaleX: smoothProgress,
          background: isRtl
            ? 'linear-gradient(to left, #087D91 0%, #C51F24 35%, #8B4935 70%, #E5A93C 100%)'
            : 'linear-gradient(to right, #087D91 0%, #C51F24 35%, #8B4935 70%, #E5A93C 100%)',
          boxShadow: `0 1px 12px ${currentColor.hex}70, 0 1px 4px rgba(8, 125, 145, 0.4)`,
        }}
      />

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
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20 transition-all duration-300">
          
          {/* Brand Identity */}
          <Link
            to="/"
            id="nav-brand"
            data-tour="nav-brand"
            className="group flex items-center gap-2 sm:gap-3 text-foreground focus-ring rounded-lg shrink min-w-0"
          >
            <BrandLogo variant="compact" />
            <span className="font-display text-base sm:text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {isEn ? 'Watazawwado' : 'وتزودوا'}
            </span>
          </Link>

          {/* ─── RIGHT CONTROLS: Clean, Spacious, and Accessible on Both Desktop & Mobile ─── */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Theme Toggle: Compact icon button on mobile, sliding switch on desktop */}
            <div className="flex items-center">
              <div className="sm:hidden">
                <ThemeToggle compact={true} />
              </div>
              <div className="hidden sm:inline-flex">
                <ThemeToggle />
              </div>
            </div>

            {/* Language Switcher: Compact 'عربي' / 'EN' to ensure zero overflow on mobile */}
            <button
              onClick={onToggleLang}
              id="lang-switch-btn"
              data-tour="lang-switch-btn"
              aria-label={isEn ? 'التبديل إلى العربية' : 'Switch to English'}
              className="flex items-center justify-center gap-1 sm:gap-1.5 min-h-11 px-2 py-1.5 sm:px-2.5 rounded-xl text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-subtle border border-border/80 transition-colors cursor-pointer shadow-2xs shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-accent transition-colors shrink-0" />
              <span>{isEn ? 'عربي' : 'EN'}</span>
            </button>

            {/* ─── SIDEBAR TOGGLE BUTTON (Opens the side menu on Desktop and Mobile) ─── */}
            <button
              type="button"
              onClick={() => setSideDrawerOpen(true)}
              id="mobile-menu-toggle"
              data-tour="mobile-menu-toggle"
              aria-label={isEn ? 'Open the menu' : 'افتح القائمة'}
              aria-expanded={sideDrawerOpen}
              className="flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-surface hover:bg-surface-subtle text-foreground border border-border/80 shadow-2xs active:scale-95 transition-all cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            >
              <Menu className="w-5 h-5 text-foreground shrink-0" />
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
          <FocusTrap onEscape={() => setSideDrawerOpen(false)}>
          <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label={isEn ? 'Site menu' : 'قائمة الموقع'}>
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

            {/* Drawer Panel: Fully Opaque, Anchored cleanly on the side with smooth slide */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 bottom-0 right-0 w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] text-foreground border-l border-border shadow-2xl flex flex-col justify-between z-10 overscroll-contain overflow-y-auto touch-pan-y"
              style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
            >
              {/* Drawer Top Bar */}
              <div className="h-16 sm:h-20 px-5 border-b border-border/80 flex items-center justify-between shrink-0 bg-surface">
                <div className="flex items-center gap-2.5">
                  <BrandLogo variant="compact" />
                  <div className="flex flex-col text-start">
                    <span className="font-display font-bold text-lg sm:text-xl text-foreground leading-none">
                      {isEn ? 'Watazawwado' : 'وتزودوا'}
                    </span>
                    <span className="text-[12px] text-muted-foreground mt-1">
                      {isEn ? 'Menu' : 'القائمة'}
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
                    <span>{isEn ? 'Your first lesson is free' : 'أول حصة مجاناً'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isEn
                      ? '30 minutes on Zoom with your teacher, to find your level and your goal.'
                      : '٣٠ دقيقة على Zoom مع معلمك، نعرف فيها مستواك وهدفك.'}
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
                    <span>{isEn ? 'Book your free trial' : 'احجز حصتك المجانية'}</span>
                  </button>
                </div>

                {/* 2. PAGES & SYLLABUS NAVIGATION LINKS */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 pb-1 block">
                    {isEn ? 'Pages' : 'الصفحات'}
                  </span>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = stripLangPrefix(location.pathname) === link.href;
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
                    {isEn ? 'Accounts' : 'الحسابات'}
                  </span>

                  <Link
                    to="/student?auth=login"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span>{isEn ? 'Student account' : 'حساب الطالب'}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-muted-foreground" />
                  </Link>

                  <Link
                    to="/staff/login"
                    onClick={() => setSideDrawerOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/80 bg-surface-subtle/50 hover:bg-surface-subtle text-foreground text-sm font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-accent shrink-0" />
                      <span>{isEn ? 'Teachers and admins' : 'المعلمين والإدارة'}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 text-muted-foreground" />
                  </Link>

                  <InstallAppEntry isAr={!isEn} onOpen={() => setSideDrawerOpen(false)} />
                </div>

              </div>

              {/* Drawer Bottom Footer (Quick settings & Tour guide) */}
              <div className="p-4 border-t border-border/80 bg-surface shrink-0 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {isEn ? 'Day or night' : 'نهاري أو ليلي'}
                  </span>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isEn ? 'Language' : 'اللغة'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleLang}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-foreground bg-surface-subtle hover:bg-surface border border-border/80 transition-colors cursor-pointer"
                  >
                    <span>{isEn ? 'العربية' : 'English'}</span>
                  </button>
                </div>

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
                    <span>{isEn ? 'Take a tour of the site' : 'لفّة سريعة في الموقع'}</span>
                  </button>
                )}
              </div>

            </motion.div>
          </div>
          </FocusTrap>
        )}
      </AnimatePresence>
    </>
  );
};
