import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  UserCheck, 
  LogIn, 
  UserPlus, 
  X, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Language } from '../booking/types';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStudentSignup: () => void;
  onOpenStudentLogin: () => void;
  lang?: Language;
}

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onOpenStudentSignup,
  onOpenStudentLogin,
  lang = 'en'
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const handleLaunchDemo = () => {
    onClose();
    navigate('/student/demo');
  };

  const handleOpenSignup = () => {
    onClose();
    onOpenStudentSignup();
  };

  const handleOpenLogin = () => {
    onClose();
    onOpenStudentLogin();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="get-started-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="get-started-title"
          className="relative w-full max-w-xl bg-surface border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close modal'}
            className="absolute top-5 end-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 text-primary mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 id="get-started-title" className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              {isAr ? 'ابدأ رحلتك التعليمية' : 'Begin Your Learning Journey'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {isAr 
                ? 'اختر كيف ترغب في جدولة دروسك المباشرة 1-على-1 مع الأستاذ محمود.'
                : 'Choose how you would like to schedule your direct 1-on-1 sessions with Ustadh Mahmoud.'}
            </p>
          </div>

          {/* Primary Pathways Selection: Guest vs Student */}
          <div className="space-y-4">
            {/* OPTION 1: Explore as Guest (Interactive Demo) */}
            <div 
              className="p-5 rounded-2xl bg-surface-subtle border border-border hover:border-warning/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-base text-foreground group-hover:text-warning transition-colors">
                      {isAr ? 'استكشف كضيف' : 'Explore as Guest'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-warning/15 text-warning whitespace-nowrap">
                      {isAr ? 'عرض تجريبي' : 'Interactive Demo'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {isAr 
                      ? 'جرب عملية الحجز بدون إنشاء حساب. هذا عرض توضيحي - لن يتم إنشاء حجز حقيقي.'
                      : 'Experience the booking process without creating an account. This is a guided demo — no real booking is created.'}
                  </p>
                  
                  <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-warning" />
                      <span>{isAr ? 'بدون حساب' : 'No account required'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLaunchDemo}
                      id="get-started-demo-btn"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'جرب العرض التوضيحي' : 'Try the Demo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* OPTION 2: Continue as Student (Student Account) */}
            <div 
              className="p-5 rounded-2xl bg-surface-subtle border border-primary/30 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                      {isAr ? 'المتابعة كطالب مسجل' : 'Continue as Student'}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary whitespace-nowrap">
                      {isAr ? 'حجز حقيقي' : 'Real Booking'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {isAr
                      ? 'سجل دخولك أو أنشئ حساباً لحجز درس حقيقي، وربط حجوزاتك، واستلام رابط Zoom الخاص بك.'
                      : 'Sign in or create an account to book an actual lesson, keep your bookings connected, and receive your Zoom link.'}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleOpenSignup}
                      id="get-started-student-signup-btn"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إنشاء حساب طالب' : 'Create Account'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenLogin}
                      id="get-started-student-login-btn"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-foreground text-xs sm:text-sm font-medium transition-colors cursor-pointer border border-border"
                    >
                      <LogIn className="w-3.5 h-3.5 text-primary" />
                      <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Pathways: Staff Entrance */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-center text-xs text-muted-foreground">
            <a
              href="/staff/login"
              id="get-started-staff-link"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isAr ? 'دخول المعلم / الإدارة' : 'Staff / Teacher Entrance'}
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
