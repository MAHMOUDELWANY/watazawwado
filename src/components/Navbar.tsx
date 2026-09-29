import { BrandLogo } from './ui/BrandLogo';
import { ThemeToggle } from './ui/ThemeToggle';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, Compass } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { ARABIC_TRANSLATIONS } from '../data/content';

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
  onOpenManageModal,
  onStartTour
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/about', label: lang === 'en' ? 'About' : 'عن المنصة' },
    { href: '/how-it-works', label: lang === 'en' ? 'How It Works' : 'كيف نعمل' },
    { href: '/learning', label: lang === 'en' ? 'Lessons' : 'الدروس' },
    { href: '/pricing', label: lang === 'en' ? 'Pricing' : 'الأسعار' },
    { href: '/faq', label: lang === 'en' ? 'FAQ' : 'الأسئلة' },
  ];

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-surface/90 dark:bg-surface/85 backdrop-blur-md shadow-xs border-b border-border/60'
          : 'bg-background/80 backdrop-blur-xs border-b border-border/30'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20 transition-all duration-300">
        {/* Brand identity (Clean Watazawwado without sub-line) */}
        <Link
          to="/"
          id="nav-brand"
          data-tour="nav-brand"
          className="group flex items-center gap-2.5 text-foreground focus:outline-none rounded-lg"
        >
          <BrandLogo variant="compact" />
          
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {lang === 'ar' ? 'وتزودوا' : 'Watazawwado'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav id="nav-links-desktop" data-tour="nav-links-desktop" className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-semibold text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300 transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}

          {onOpenManageModal && (
            <button
              type="button"
              onClick={onOpenManageModal}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-s border-border ps-4"
            >
              {lang === 'en' ? 'Manage' : 'إدارة الحجز'}
            </button>
          )}
        </nav>

        {/* Right Controls: Tour, Lang, Theme, and CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Site Tour Guide Button in Glazed Teal Accent */}
          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              id="nav-tour-btn"
              data-tour="nav-tour-btn"
              title={lang === 'en' ? 'Site Tour' : 'جولة استكشافية'}
              aria-label={lang === 'en' ? 'Site Tour' : 'جولة استكشافية'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all cursor-pointer shadow-2xs"
            >
              <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400 transition-colors" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Tour' : 'جولة'}</span>
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
            <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center"><ThemeToggle /></div>

          {/* Primary CTA */}
          <button
            onClick={() => onOpenTrialModal()}
            id="header-get-started-cta"
            data-tour="header-get-started-cta"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary-material text-white text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <span>{lang === 'en' ? 'Free Trial' : 'جلسة تجريبية'}</span>
          </button>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            aria-label="Open mobile menu"
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-surface-subtle border border-border/80"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-surface border-b border-border/80 px-6 py-6 shadow-xl overflow-hidden"
          >
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-foreground hover:text-primary transition-colors py-1.5"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-border/60 space-y-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTrialModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover font-bold text-sm shadow-xs active:scale-95 transition-all"
                >
                  <span>{lang === 'en' ? 'Book Free Trial' : 'احجز جلستك التجريبية'}</span>
                </button>

                {onStartTour && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onStartTour();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-accent" />
                    <span>{lang === 'en' ? 'Explore Tour' : 'جولة استكشافية'}</span>
                  </button>
                )}

                {onOpenManageModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenManageModal();
                    }}
                    className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {lang === 'en' ? 'Manage Booking' : 'إدارة الحجز'}
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

