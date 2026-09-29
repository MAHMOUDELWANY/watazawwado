import { BrandLogo } from './ui/BrandLogo';
import { ThemeToggle } from './ui/ThemeToggle';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
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
    { href: '/about', label: lang === 'en' ? 'About' : ARABIC_TRANSLATIONS.nav.about },
    { href: '/learning', label: lang === 'en' ? 'Lessons' : ARABIC_TRANSLATIONS.nav.services },
    { href: '/pricing', label: lang === 'en' ? 'Pricing' : 'الأسعار' },
    { href: '/faq', label: lang === 'en' ? 'FAQ' : ARABIC_TRANSLATIONS.nav.faqs },
  ];

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav border-b-0 py-3'
          : 'glass-nav py-4 sm:py-5 border-b-0 shadow-sm'
      }`}
    >
      <div className={`w-full transition-all duration-300 flex items-center justify-between ${
        isScrolled 
          ? 'max-w-6xl px-4 sm:px-6 lg:px-8 py-2.5 glass-nav rounded-full shadow-sm'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5'
      }`}>
        {/* Brand identity */}
        <Link
          to="/"
          className="group flex items-center gap-3 text-foreground focus:outline-none rounded-md"
        >
          <BrandLogo variant="compact" />
          
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold  text-foreground group-hover:text-interactive transition-colors">
              Watazawwado
            </span>
            <span className="text-[13px] text-muted-foreground tracking-wider uppercase">
              Ustadh Mahmoud
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-interactive transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}

          {onOpenManageModal && (
            <button
              type="button"
              onClick={onOpenManageModal}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-l border-border pl-4"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-surface-subtle border border-border transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4 text-interactive transition-colors" />
            <span>{lang === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Theme Switcher */}
          <div className="flex items-center"><ThemeToggle /></div>

          {/* Primary CTA */}
          <button
            onClick={() => onOpenTrialModal()}
            id="header-get-started-cta"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-primary-material text-sm font-medium transition-all shadow-xs cursor-pointer"
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
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground hover:text-interactive transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border space-y-2.5">

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTrialModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-primary-material font-medium text-sm shadow-xs"
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
                    className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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

