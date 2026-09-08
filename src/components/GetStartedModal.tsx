import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, UserPlus, LogIn, X, BookOpen, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStudentSignup: () => void;
  onOpenStudentLogin: () => void;
  onOpenDirectTrialBooking: () => void;
  lang?: 'en' | 'ar';
}

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onOpenStudentSignup,
  onOpenStudentLogin,
  onOpenDirectTrialBooking,
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

  const handleDirectBooking = () => {
    onClose();
    onOpenDirectTrialBooking();
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
          className="relative w-full max-w-xl bg-[#FBF9F5] dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#30332F] dark:text-[#F8F6F0] z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-full text-[#7A827B] hover:text-[#30332F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center max-w-md mx-auto mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B] mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 id="get-started-title" className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#30332F] dark:text-[#F8F6F0]">
              {isAr ? 'ابدأ رحلتك التعليمية' : 'Begin Your Learning Journey'}
            </h2>
            <p className="mt-2 text-sm text-[#626A64] dark:text-[#D5D0CA] leading-relaxed">
              {isAr 
                ? 'اختر الطريقة التي تفضلها للتعرف على المنصة وجدولة دروسك المباشرة 1-على-1 مع الأستاذ محمود.'
                : 'Choose how you would like to explore the platform and schedule your direct 1-on-1 sessions with Ustadh Mahmoud.'}
            </p>
          </div>

          {/* Pathways Selection */}
          <div className="space-y-3.5">
            {/* Option 1: Explore as Guest (Interactive Demo) */}
            <button
              onClick={handleLaunchDemo}
              className="w-full text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#473D50] hover:border-[#8FAE9B] dark:hover:border-[#8FAE9B] hover:shadow-md transition-all group cursor-pointer flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base text-[#30332F] dark:text-[#F8F6F0] group-hover:text-[#6F907D] dark:group-hover:text-[#8FAE9B] transition-colors">
                    {isAr ? 'استكشف كضيف (عرض توضيحي تفاعلي)' : 'Explore as Guest (Interactive Demo)'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                    {isAr ? 'بدون تسجيل' : 'No Account'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] mt-1 leading-relaxed">
                  {isAr 
                    ? 'جرب لوحة تحكم الطالب، ونظام متابعة ولي الأمر، ومعاينة الحجز التجريبي ببيانات واقعية دون إنشاء حساب.'
                    : 'Experience the live student dashboard, parent view, and booking preview with sample data — completely risk-free.'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8FAE9B] self-center shrink-0 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
            </button>

            {/* Option 2: Create Student Account */}
            <button
              onClick={handleOpenSignup}
              className="w-full text-left p-4 sm:p-5 rounded-2xl bg-[#8FAE9B]/10 dark:bg-[#8FAE9B]/15 border border-[#8FAE9B]/40 hover:border-[#6F907D] hover:shadow-md transition-all group cursor-pointer flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-[#6F907D] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base text-[#30332F] dark:text-[#F8F6F0] group-hover:text-[#6F907D] dark:group-hover:text-[#8FAE9B] transition-colors">
                    {isAr ? 'إنشاء حساب طالب جديد' : 'Create Student Account'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#8FAE9B]/20 text-[#557161] dark:text-[#A8C9B4]">
                    {isAr ? 'موصى به' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] mt-1 leading-relaxed">
                  {isAr
                    ? 'سجل للبدء في خطة تعلم مخصصة مع الأستاذ محمود، وتحديد مستواك، وحجز جلستك المجانية الأولى.'
                    : 'Register for personalized 1-on-1 mentorship, complete quick onboarding, and secure your complimentary trial.'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6F907D] dark:text-[#8FAE9B] self-center shrink-0 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
            </button>

            {/* Option 3: Student Sign In */}
            <button
              onClick={handleOpenLogin}
              className="w-full text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#2D2635] border border-[#E2DDD5] dark:border-[#473D50] hover:border-[#8FAE9B] hover:shadow-md transition-all group cursor-pointer flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-[#6B5B73]/10 text-[#6B5B73] dark:text-[#B8A9C9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LogIn className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-base text-[#30332F] dark:text-[#F8F6F0] group-hover:text-[#6B5B73] dark:group-hover:text-[#B8A9C9] transition-colors">
                  {isAr ? 'تسجيل دخول الطالب' : 'Student Sign In'}
                </span>
                <p className="text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA] mt-1 leading-relaxed">
                  {isAr
                    ? 'لديك حساب بالفعل؟ سجل دخولك لمتابعة دروسك القادمة، والانضمام لفصل Zoom، ومراجعة ملاحظات المعلم.'
                    : 'Already registered? Sign in to view scheduled classes, join your private Zoom room, and review teacher notes.'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B5B73] dark:text-[#B8A9C9] self-center shrink-0 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Direct Guest Booking Link (Honoring Section 5) */}
          <div className="mt-6 pt-5 border-t border-[#E2DDD5] dark:border-[#3E3545] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A827B] dark:text-[#A69FA8]">
            <button
              onClick={handleDirectBooking}
              className="inline-flex items-center gap-1.5 font-medium text-[#6F907D] dark:text-[#8FAE9B] hover:underline cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'أو احجز جلسة تجريبية مباشرة كضيف' : 'Or book a 1-on-1 free trial directly as a guest'}</span>
            </button>

            <a
              href="/staff/login"
              className="text-[#7A827B] dark:text-[#A69FA8] hover:text-[#30332F] dark:hover:text-white transition-colors"
            >
              {isAr ? 'دخول المعلم / الإدارة' : 'Staff / Teacher Entrance'}
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
