import { BrandLogo } from './ui/BrandLogo';
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Globe, ArrowUp } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenTrialModal: () => void;
  onOpenManageModal?: () => void;
  onOpenTeacherModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onToggleLang,
  onOpenTrialModal,
  onOpenManageModal,
}) => {
  const isEn = lang === 'en';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="glass-surface border-t-0 mt-8 rounded-t-3xl mx-2 sm:mx-4 mb-2 sm:mb-4 py-14 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border">
          
          {/* Brand & Purpose (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div className="font-display text-2xl font-medium text-foreground flex items-center gap-2.5"><BrandLogo variant="compact" />
              Watazawwado <span className="text-muted-foreground font-light text-xl">/ وتزودوا</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
              {isEn
                ? 'Dedicated space for direct 1-on-1 instruction in Quran reading, Tajweed, Arabic language, and Islamic Studies for international students and families.'
                : 'مساحة مخصصة للتعليم الفردي المباشر في القرآن الكريم وأحكام التجويد واللغة العربية والدراسات الإسلامية للطلاب والعائلات المسلمة حول العالم.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onToggleLang}
                className="inline-flex items-center gap-1.5 text-sm text-interactive hover:underline cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isEn ? 'Switch to العربية' : 'Switch to English'}</span>
              </button>
            </div>
          </div>

          {/* Quick Navigation (4 cols on md) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-sm sm:text-base">
            <div>
              <div className="font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 text-xs mb-3">
                {isEn ? 'Teaching' : 'الدروس والبرامج'}
              </div>
              <ul className="space-y-2 text-muted-foreground font-medium">
                <li>
                  <Link to="/learning" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Quran & Tajweed' : 'القرآن والتجويد'}
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Islamic Studies' : 'الدراسات الإسلامية'}
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Arabic Language' : 'اللغة العربية'}
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'English Coaching' : 'اللغة الإنجليزية'}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Pricing & Packages' : 'باقات الأسعار'}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-bold uppercase tracking-wider text-accent text-xs mb-3">
                {isEn ? 'Experience' : 'التجربة'}
              </div>
              <ul className="space-y-2 text-muted-foreground font-medium">
                <li>
                  <Link to="/about" className="hover:text-accent transition-colors">
                    {isEn ? 'About Mahmoud' : 'عن المعلم'}
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-accent font-semibold transition-colors">
                    {isEn ? 'How It Works' : 'كيف نعمل'}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-accent transition-colors">
                    {isEn ? 'Pricing' : 'الأسعار'}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-accent transition-colors">
                    {isEn ? 'FAQ' : 'الأسئلة الشائعة'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Action & Contact (3 cols on md) */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-bold uppercase tracking-wider text-primary text-xs mb-2">
              {isEn ? 'Get Started' : 'ابدأ الآن'}
            </div>
            <button
              onClick={onOpenTrialModal}
              className="w-full py-2.5 px-4 rounded-xl btn-primary-material text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              {isEn ? 'Book Free 30-Min Trial' : 'احجز جلسة تجريبية مجانية'}
            </button>
          </div>

        </div>

        {/* Bottom Credits & Policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Watazawwado • Ustadh Mahmoud. {isEn ? 'Personal Teaching Practice. All rights reserved.' : 'جميع الحقوق محفوظة للأستاذ محمود.'}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>{isEn ? '3-Hour Reschedule Policy' : 'إعادة الجدولة حتى ٣ ساعات قبل الدرس'}</span>
            <span>•</span>
            <span>{isEn ? 'Flexible Booking' : 'حجز مرن ومباشر'}</span>
            <span>•</span>
            <Link
              to="/staff/login"
              className="text-muted-foreground hover:text-foreground hover:underline font-medium flex items-center gap-1"
            >
              <span>{isEn ? 'Teacher Login' : 'دخول المعلم'}</span>
            </Link>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="p-1.5 rounded-lg hover:bg-surface-subtle text-muted-foreground transition-colors cursor-pointer"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
