import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Sun, Moon, Globe, Sparkles } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { ARABIC_TRANSLATIONS } from '../data/content';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenTrialModal: (serviceId?: string) => void;
  onOpenManageModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onOpenTrialModal,
  onOpenManageModal
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
    { href: '#about', label: lang === 'en' ? 'About' : ARABIC_TRANSLATIONS.nav.about },
    { href: '#services', label: lang === 'en' ? 'Lessons' : ARABIC_TRANSLATIONS.nav.services },
    { href: '#approach', label: lang === 'en' ? 'Approach' : 'المنهجية' },
    { href: '#testimonials', label: lang === 'en' ? 'Reviews' : ARABIC_TRANSLATIONS.nav.testimonials },
    { href: '#contact', label: lang === 'en' ? 'Contact' : ARABIC_TRANSLATIONS.nav.contact },
  ];

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-md shadow-xs border-b border-border py-3'
          : 'bg-background py-4 sm:py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand identity */}
        <a
          href="#"
          className="group flex items-center gap-3 text-foreground focus:outline-none rounded-md"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-serif font-bold text-base transition-transform group-hover:scale-105">
            و
          </div>
          
          <div className="flex flex-col">
            <span className="font-serif text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Watazawwado
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
              Ustadh Mahmoud
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {link.label}
            </a>
          ))}

          <a
            href="/student/demo"
            id="nav-demo-link"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-subtle transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{lang === 'en' ? 'Explore as Guest' : 'استكشف كضيف'}</span>
          </a>

          {onOpenManageModal && (
            <button
              type="button"
              onClick={onOpenManageModal}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-l border-border pl-4"
            >
              {lang === 'en' ? 'Manage Booking' : 'إدارة الحجز'}
            </button>
          )}
        </nav>

        {/* Right Controls: Theme, Language, and CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            id="lang-switch-btn"
            aria-label="Toggle language between English and Arabic"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-surface-subtle border border-border transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            id="theme-switch-btn"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 rounded-lg text-foreground hover:bg-surface-subtle border border-border transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-primary" />
            ) : (
              <Sun className="w-4 h-4 text-primary" />
            )}
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => onOpenTrialModal()}
            id="header-get-started-cta"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <span>{lang === 'en' ? 'Free 30-Min Trial' : 'ابدأ جلستك الأولى'}</span>
          </button>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            aria-label="Open mobile menu"
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-surface-subtle border border-border"
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
            className="md:hidden bg-background border-b border-border px-6 py-6 shadow-lg overflow-hidden"
          >
            <nav className="flex flex-col gap-3.5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground hover:text-primary transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-2.5">
                <a
                  href="/student/demo"
                  id="mobile-demo-link"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle text-foreground font-medium text-xs border border-border transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{lang === 'en' ? 'Explore as Guest (Interactive Demo)' : 'استكشف كضيف (عرض تجريبي)'}</span>
                </a>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTrialModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm shadow-xs"
                >
                  <span>{lang === 'en' ? 'Book Free 30-Min Trial' : 'احجز جلستك المجانية (٣٠ دقيقة)'}</span>
                </button>

                {onOpenManageModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenManageModal();
                    }}
                    className="w-full py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {lang === 'en' ? 'Manage or Reschedule Booking' : 'إدارة أو تعديل موعد الحجز'}
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
