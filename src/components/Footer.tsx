import { BrandLogo } from './ui/BrandLogo';
import React from 'react';
import { SocialLinks } from './ui/SocialLinks';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenTrialModal: () => void;
  onOpenManageModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onToggleLang,
  onOpenTrialModal,
  onOpenManageModal,
}) => {
  const isEn = lang === 'en';

  return (
    <footer className="glass-surface border-t-0 mt-8 rounded-t-3xl mx-2 sm:mx-4 mb-2 sm:mb-4 py-14 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-border">
          
          {/* Brand & Purpose (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <BrandLogo variant="compact" />
              <span>Watazawwado</span> <span className="text-muted-foreground font-normal text-xl sm:text-2xl">/ وتزودوا</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
              {isEn
                ? 'Provision that lasts, for you and your family. One-on-one lessons with a teacher who knows you by name.'
                : 'زادٌ يبقى، لك ولأهل بيتك. حصص فردية مع معلّم يعرفك باسمك.'}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onToggleLang}
                className="inline-flex items-center gap-1.5 min-h-[40px] text-sm text-interactive hover:underline cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isEn ? 'العربية' : 'English'}</span>
              </button>
            </div>
          </div>

          {/* Quick Navigation (4 cols on md) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-sm sm:text-base">
            <div>
              <div className="font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 text-xs mb-3">
                {isEn ? 'Subjects' : 'المواد'}
              </div>
              <ul className="space-y-0.5 text-muted-foreground font-medium">
                <li>
                  <Link to="/learning" className="inline-block py-1.5 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Quran & Tajweed' : 'القرآن والتجويد'}
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="inline-block py-1.5 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'The Zad Path' : 'مسار الأثر'}
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="inline-block py-1.5 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Arabic' : 'اللغة العربية'}
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="inline-block py-1.5 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'English' : 'اللغة الإنجليزية'}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="inline-block py-1.5 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                    {isEn ? 'Prices & packages' : 'الأسعار والباقات'}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-bold uppercase tracking-wider text-accent text-xs mb-3">
                {isEn ? 'The academy' : 'الأكاديمية'}
              </div>
              <ul className="space-y-0.5 text-muted-foreground font-medium">
                <li>
                  <Link to="/about" className="inline-block py-1.5 hover:text-accent transition-colors">
                    {isEn ? 'About us' : 'من نحن'}
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="inline-block py-1.5 hover:text-accent font-semibold transition-colors">
                    {isEn ? 'How it works' : 'كيف نعمل'}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="inline-block py-1.5 hover:text-accent transition-colors">
                    {isEn ? 'Pricing' : 'الأسعار'}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="inline-block py-1.5 hover:text-accent transition-colors">
                    {isEn ? 'FAQ' : 'الأسئلة الشائعة'}
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="inline-block py-1.5 hover:text-accent transition-colors">
                    {isEn ? 'Child safety' : 'أمان الأطفال'}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="inline-block py-1.5 hover:text-accent transition-colors">
                    {isEn ? 'Privacy' : 'الخصوصية'}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="inline-block py-1.5 hover:text-accent transition-colors">
                    {isEn ? 'Terms' : 'الشروط'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Action & Contact (3 cols on md) */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-bold uppercase tracking-wider text-primary text-xs mb-2">
              {isEn ? 'Start here' : 'ابدأ من هنا'}
            </div>
            <button
              onClick={onOpenTrialModal}
              className="w-full py-2.5 px-4 rounded-xl btn-primary-material text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              {isEn ? 'Book your free trial' : 'احجز حصتك المجانية'}
            </button>
            <div className="pt-4">
              <div className="font-bold text-sm text-foreground mb-3">
                {isEn ? 'Follow us' : 'تابعنا'}
              </div>
              <SocialLinks isAr={!isEn} />
            </div>
          </div>

        </div>

        {/* Bottom Credits & Policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Watazawwado Academy. {isEn ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <Link to="/privacy" className="hover:text-foreground hover:underline transition-colors">
              {isEn ? 'Privacy' : 'الخصوصية'}
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-foreground hover:underline transition-colors">
              {isEn ? 'Terms' : 'الشروط'}
            </Link>
            <span>•</span>
<span>{isEn ? 'Reschedule up to 1 hour before' : 'تغيير الموعد حتى ساعة قبل الدرس'}</span>
            <span>•</span>
            <span>{isEn ? 'Cancel up to 3 hours before' : 'إلغاء لحد ٣ ساعات قبل الحصة'}</span>
            <span>•</span>
            <Link
              to="/staff/login"
              className="text-muted-foreground hover:text-foreground hover:underline font-medium flex items-center gap-1"
            >
              <span>{isEn ? 'Teacher sign-in' : 'دخول المعلمين'}</span>
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
