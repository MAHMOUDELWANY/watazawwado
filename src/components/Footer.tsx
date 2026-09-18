import React from 'react';
import { motion } from 'motion/react';
import { Globe, MessageCircle, ArrowUp } from 'lucide-react';
import { Language } from '../types';
import { buildWhatsAppUrl, MAHMOUD_OFFICIAL_PHONE_INTL } from '../lib/whatsapp';

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
    <footer className="bg-surface border-t border-border py-14 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border">
          
          {/* Brand & Purpose (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div className="font-serif text-2xl font-medium text-foreground tracking-tight">
              Watazawwado <span className="text-muted-foreground font-light text-xl">/ وتزودوا</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              {isEn
                ? 'Personal teaching platform of Ustadh Mahmoud. Direct 1-on-1 instruction in Quran reading, Tajweed, Arabic language, and Islamic Studies for international students and families.'
                : 'المنصة التعليمية الخاصة بالأستاذ محمود. تعليم فردي مباشر للقرآن الكريم وأحكام التجويد واللغة العربية والدراسات الإسلامية للطلاب والعائلات المسلمة حول العالم.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onToggleLang}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isEn ? 'Switch to العربية' : 'Switch to English'}</span>
              </button>
            </div>
          </div>

          {/* Quick Navigation (4 cols on md) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <div className="font-semibold uppercase tracking-wider text-primary text-xs mb-3">
                {isEn ? 'Teaching' : 'الدروس والبرامج'}
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#services" className="hover:text-foreground transition-colors">
                    {isEn ? 'Quran & Tajweed' : 'القرآن والتجويد'}
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-foreground transition-colors">
                    {isEn ? 'Islamic Studies' : 'الدراسات الإسلامية'}
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-foreground transition-colors">
                    {isEn ? 'Arabic Language' : 'اللغة العربية'}
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-foreground transition-colors">
                    {isEn ? 'English Coaching' : 'اللغة الإنجليزية'}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold uppercase tracking-wider text-primary text-xs mb-3">
                {isEn ? 'Experience' : 'التجربة'}
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#about" className="hover:text-foreground transition-colors">
                    {isEn ? 'About Mahmoud' : 'عن المعلم'}
                  </a>
                </li>
                <li>
                  <a href="#approach" className="hover:text-foreground transition-colors">
                    {isEn ? 'Our Approach' : 'المنهجية'}
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-foreground transition-colors">
                    {isEn ? 'How It Works' : 'كيف نعمل'}
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="hover:text-foreground transition-colors">
                    {isEn ? 'Student Reviews' : 'آراء الطلاب'}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Action & Contact (3 cols on md) */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-semibold uppercase tracking-wider text-primary text-xs mb-2">
              {isEn ? 'Get Started' : 'ابدأ الآن'}
            </div>
            <button
              onClick={onOpenTrialModal}
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              {isEn ? 'Book Free 30-Min Trial' : 'احجز جلسة تجريبية مجانية'}
            </button>
            <a
              href={buildWhatsAppUrl('Assalamu Alaikum Ustadh Mahmoud, I am visiting your website and have a question.')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-xs text-foreground hover:bg-surface-subtle transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
              <span>WhatsApp: {MAHMOUD_OFFICIAL_PHONE_INTL}</span>
            </a>
          </div>

        </div>

        {/* Bottom Credits & Policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Watazawwado • Ustadh Mahmoud. {isEn ? 'Personal Teaching Practice. All rights reserved.' : 'جميع الحقوق محفوظة للأستاذ محمود.'}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>{isEn ? '3-Hour Reschedule Policy' : 'إعادة الجدولة حتى ٣ ساعات قبل الدرس'}</span>
            <span>•</span>
            {onOpenManageModal ? (
              <button
                type="button"
                onClick={onOpenManageModal}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                {isEn ? 'Manage or Reschedule Booking' : 'إدارة أو تعديل الحجز'}
              </button>
            ) : (
              <span>{isEn ? 'Flexible Booking' : 'حجز مرن ومباشر'}</span>
            )}
            <span>•</span>
            <a
              href="/student/demo"
              id="footer-demo-link"
              className="hover:underline font-medium text-primary transition-colors"
            >
              {isEn ? 'Explore as Guest' : 'استكشف كضيف'}
            </a>
            <span>•</span>
            <a
              href="/staff/login"
              className="text-muted-foreground hover:text-foreground hover:underline font-medium flex items-center gap-1"
            >
              <span>{isEn ? 'Teacher Login' : 'دخول المعلم'}</span>
            </a>
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
