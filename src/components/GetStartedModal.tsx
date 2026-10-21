import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Language } from '../booking/types';
import { Button } from './ui/Button';
import { AuthCard, AuthPortal } from './auth/AuthFrame';
import FocusTrap from './FocusTrap';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStudentSignup: () => void;
  onOpenStudentLogin: () => void;
  lang?: Language;
}

/** First step of every booking (no guests, RULES.md §2): open an account or sign in. */
export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onOpenStudentSignup,
  onOpenStudentLogin,
  lang = 'en'
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const points = isAr
    ? ['٣٠ دقيقة على Zoom، مجاناً', 'بدون بطاقة بنكية', 'تختار معلّم أو معلّمة']
    : ['30 minutes on Zoom, free', 'No card needed', 'Choose a male or female teacher'];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="get-started-title"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <FocusTrap onEscape={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#05363F]/45 dark:bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full flex justify-center my-auto"
        >
          <AuthCard className="relative">
            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              className="absolute top-3 end-3 z-20 w-11 h-11 flex items-center justify-center rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/25 transition-colors cursor-pointer focus-ring"
            >
              <X className="w-4 h-4" />
            </button>

            <AuthPortal
              titleId="get-started-title"
              heading="h2"
              title={isAr ? 'حصتك الأولى علينا' : 'Your first lesson is on us'}
              subtitle={isAr
                ? 'عشان نحجزلك ونبعتلك رابط الحصة، محتاجين حساب. بياخد دقيقة.'
                : 'To book it and send you the lesson link, you need an account. It takes a minute.'}
            />

            <div className="px-6 sm:px-8 pt-5 pb-7">
              <ul className="space-y-2 mb-6">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Check className="w-4 h-4 text-[var(--teal)] shrink-0" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <Button
                  type="button"
                  id="get-started-student-signup-btn"
                  onClick={() => { onClose(); onOpenStudentSignup(); }}
                  className="w-full !rounded-full"
                >
                  {isAr ? 'افتح حساب جديد' : 'Create an account'}
                </Button>
                <button
                  type="button"
                  id="get-started-student-login-btn"
                  onClick={() => { onClose(); onOpenStudentLogin(); }}
                  className="btn-glass is-pill w-full"
                >
                  {isAr ? 'عندي حساب، ادخل' : 'I have an account, sign in'}
                </button>
              </div>

              <p className="mt-6 pt-4 border-t border-border text-center text-sm">
                <Link
                  to="/staff/login"
                  onClick={onClose}
                  id="get-started-staff-link"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isAr ? 'معلم في وتزودوا؟ ادخل من هنا' : 'Teaching with us? Sign in here'}
                </Link>
              </p>
            </div>
          </AuthCard>
        </motion.div>
        </FocusTrap>
      </div>
    </AnimatePresence>
  );
};
