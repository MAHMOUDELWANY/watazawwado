import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  Clipboard,
  Check
} from 'lucide-react';
import { OtpOrbitalGraphic } from './OtpOrbitalGraphic';
import { BrandSpinner } from '../ui/BrandLoader';
import { useTheme } from '../ThemeProvider';

export interface OtpVerificationCardProps {
  /** The target email to verify */
  initialEmail?: string;
  /** Verification handler returning success/error */
  onVerify: (code: string, email: string) => Promise<{ success: boolean; error?: string }>;
  /** Resend OTP handler */
  onResend?: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Callback fired after successful verification */
  onSuccess?: () => void;
  /** Back navigation handler (e.g., return to login) */
  onBack?: () => void;
  /** Initial language */
  lang?: 'ar' | 'en';
  /** Optional language toggle handler */
  onToggleLang?: () => void;
  /** Whether this is rendered in a full page or inside a modal dialog */
  variant?: 'modal' | 'page';
}

/**
 * Normalizes Eastern Arabic (٠-٩) and Persian (۰-۹) numerals into standard ASCII digits (0-9)
 * and strips any non-numeric characters.
 */
function normalizeDigits(text: string): string {
  if (!text) return '';
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/\D/g, '');
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  initialEmail = '',
  onVerify,
  onResend,
  onSuccess,
  onBack,
  lang: initialLang = 'ar',
  onToggleLang,
  variant = 'page',
}) => {
  const [lang, setLang] = useState<'ar' | 'en'>(initialLang);
  const [email, setEmail] = useState<string>(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!initialEmail);
  const [tempEmail, setTempEmail] = useState<string>(initialEmail);

  // 6 discrete OTP digits
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [justPasted, setJustPasted] = useState<boolean>(false);

  // Resend Countdown Timer (starts at 60 seconds)
  const RESEND_COOLDOWN = 60;
  const [countdown, setCountdown] = useState<number>(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState<boolean>(false);

  const { theme, toggleTheme } = useTheme();

  const isAr = lang === 'ar';
  const filledCount = digits.filter((d) => d !== '').length;

  // Sync initialEmail if updated
  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
      setTempEmail(initialEmail);
      setIsEditingEmail(false);
    }
  }, [initialEmail]);

  // Focus the first empty digit box on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstEmptyIndex = digits.findIndex((d) => d === '');
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer interval
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Robust code distributor when pasting or entering multiple digits
  const handlePastedCode = (rawText: string) => {
    const cleanNumbers = normalizeDigits(rawText).slice(0, 6);
    if (!cleanNumbers) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      next[i] = cleanNumbers[i] || '';
    }
    setDigits(next);
    setErrorMessage(null);
    setJustPasted(true);
    setTimeout(() => setJustPasted(false), 2000);

    // Focus target
    const targetIdx = Math.min(5, Math.max(0, cleanNumbers.length - 1));
    setTimeout(() => {
      inputRefs.current[targetIdx]?.focus();
    }, 60);

    // If full 6 digits were pasted, automatically trigger verification
    if (cleanNumbers.length === 6) {
      triggerVerification(cleanNumbers);
    }
  };

  // Handle single digit input change
  const handleDigitChange = (index: number, value: string) => {
    const cleaned = normalizeDigits(value);
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // If multiple characters entered at once (paste or browser autofill)
    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    const next = [...digits];
    next[index] = cleaned[0];
    setDigits(next);
    setErrorMessage(null);

    // Auto-advance to next input
    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus();
    }

    // If this completed the 6th digit, automatically trigger submit
    const completeCode = next.join('');
    if (completeCode.length === 6 && next.every((d) => d !== '')) {
      triggerVerification(completeCode);
    }
  };

  // Handle keyboard events (Backspace, Arrow keys)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Move back and clear previous
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft') {
      const target = isAr ? index + 1 : index - 1;
      if (target >= 0 && target <= 5) {
        inputRefs.current[target]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowRight') {
      const target = isAr ? index - 1 : index + 1;
      if (target >= 0 && target <= 5) {
        inputRefs.current[target]?.focus();
        e.preventDefault();
      }
    }
  };

  // Handle clipboard paste from event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    handlePastedCode(pasted);
  };

  // Direct 1-click clipboard paste button handler
  const handleClipboardButtonClick = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && normalizeDigits(clipText).length > 0) {
          handlePastedCode(clipText);
          return;
        }
      }
    } catch {
      // Clipboard permission denied or not supported in this iframe context
    }

    // Graceful fallback: Prompt user
    const manualPaste = window.prompt(
      isAr ? 'الصق رمز التحقق المكون من 6 أرقام هنا:' : 'Paste the 6-digit verification code here:'
    );
    if (manualPaste) {
      handlePastedCode(manualPaste);
    } else {
      inputRefs.current[0]?.focus();
    }
  };

  // Trigger verification with guaranteed cinematic orbital animation window
  const triggerVerification = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || digits.join('');
    if (finalCode.length < 6) {
      setErrorMessage(
        isAr ? 'يرجى إدخال رمز التحقق كاملاً (6 أرقام).' : 'Please enter the complete 6-digit code.'
      );
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage(
        isAr ? 'يرجى إدخال عنوان بريد إلكتروني صحيح.' : 'Please provide a valid email address.'
      );
      setIsEditingEmail(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Guarantee a minimum of ~1900ms so the user sees the gyroscopic 3D rings revolving fast around each other
      const [res] = await Promise.all([
        onVerify(finalCode, email),
        new Promise((resolve) => setTimeout(resolve, 1900))
      ]);

      if (res.success) {
        setIsSuccess(true);
        setSuccessMessage(
          isAr
            ? 'تم تأكيد الرمز بنجاح! جاري تحويلك إلى مساحتك التعليمية...'
            : 'Code verified successfully! Redirecting to your learning home...'
        );
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setIsSuccess(false);
        setErrorMessage(
          res.error ||
            (isAr
              ? 'رمز التحقق غير صحيح أو منتهي الصلاحية، يرجى المحاولة مرة أخرى.'
              : 'Invalid or expired verification code. Please try again.')
        );
        // Highlight inputs or focus first
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setIsSuccess(false);
      setErrorMessage(
        err.message ||
          (isAr ? 'حدث خطأ أثناء التحقق، يرجى المحاولة لاحقاً.' : 'An error occurred during verification.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend || isResending || !onResend) return;

    if (!email || !email.includes('@')) {
      setErrorMessage(isAr ? 'يرجى تحديد البريد الإلكتروني أولاً.' : 'Please enter your email first.');
      setIsEditingEmail(true);
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await onResend(email);
      if (res.success) {
        setCountdown(RESEND_COOLDOWN);
        setCanResend(false);
        setSuccessMessage(
          isAr
            ? 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.'
            : 'A fresh verification code has been dispatched to your inbox.'
        );
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(
          res.error || (isAr ? 'تعذر إرسال الرمز، يرجى المحاولة مجدداً.' : 'Failed to resend code.')
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || (isAr ? 'حدث خطأ أثناء إعادة الإرسال.' : 'Error while requesting new code.')
      );
    } finally {
      setIsResending(false);
    }
  };

  // Toggle language internally or via prop
  const handleLangToggle = () => {
    if (onToggleLang) {
      onToggleLang();
    }
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full max-w-lg mx-auto ${
        variant === 'page'
          ? 'glass-card border border-border/60 rounded-3xl sm:rounded-4xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl'
          : 'relative'
      }`}
    >
      {/* ── TOP UTILITIES (Theme & Language Toggle + Back) ── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {isAr ? (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لتسجيل الدخول</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </>
            )}
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleLangToggle}
            aria-label="Toggle Language"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border/70 hover:border-teal-500/50 hover:bg-surface-subtle text-foreground/80 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-lg border border-border/70 hover:border-teal-500/50 hover:bg-surface-subtle text-foreground/80 transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-sand-gold" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-teal-700" />
            )}
          </button>
        </div>
      </div>

      {/* ── 3D CELESTIAL ORBITAL GRAPHIC CENTERPIECE ("بتلف حوالين بعضها") ── */}
      <div className="flex flex-col items-center justify-center mb-5">
        <OtpOrbitalGraphic
          digitCount={filledCount}
          isVerifying={isSubmitting}
          isSuccess={isSuccess}
          size={variant === 'modal' ? 'sm' : 'md'}
        />

        {/* Verification Status Feedback beneath the rotating orbits */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-thmanyah-sans font-semibold mt-4 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-teal-400" />
              <span>
                {isAr
                  ? 'جاري فك تشفير الرمز الأمني والتحقق...'
                  : 'Decrypting & validating security code...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TITLE & BRAND TYPOGRAPHY (خط ثمانية) ── */}
      <div className="text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-thmanyah-serif font-bold text-foreground tracking-tight mb-2">
          {isAr ? 'التحقق من رمز الدخول' : 'Verify Your Security Code'}
        </h2>
        <p className="text-xs sm:text-sm font-thmanyah-sans text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {isAr
            ? 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك لتأكيد هويتك والوصول إلى مساحتك التعليمية.'
            : 'Enter the 6-digit confirmation code sent to your email to verify your identity and access your dashboard.'}
        </p>
      </div>

      {/* ── EMAIL RECIPIENT CHIP / EDIT BAR ── */}
      <div className="mb-5">
        {isEditingEmail ? (
          <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-border bg-surface-warm/40 dark:bg-surface-warm/20">
            <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400 ms-3 shrink-0" />
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-transparent border-none text-xs sm:text-sm font-thmanyah-sans text-foreground focus:outline-none px-2 py-1"
            />
            <button
              type="button"
              onClick={() => {
                if (tempEmail.includes('@')) {
                  setEmail(tempEmail);
                  setIsEditingEmail(false);
                }
              }}
              className="shrink-0 px-3 py-1 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center justify-between w-full px-4 py-2 rounded-2xl border border-border/80 bg-surface-subtle/50 text-xs font-thmanyah-sans text-foreground/80">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-mono text-xs font-medium text-foreground truncate">{email || 'example@email.com'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingEmail(true)}
              className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-300 hover:underline ms-2 shrink-0 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isAr ? 'تعديل' : 'Change'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 6 DISCRETE OTP INPUT DIGITS WITH PASTING SUPPORT ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="text-xs font-thmanyah-sans font-medium text-muted-foreground">
            {isAr ? 'رمز التحقق (6 أرقام):' : 'Verification Code (6 Digits):'}
          </label>

          {/* Quick 1-click Paste from Clipboard button */}
          <button
            type="button"
            onClick={handleClipboardButtonClick}
            disabled={isSubmitting || isSuccess}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-teal-500/30 hover:border-teal-500/60 bg-teal-500/5 hover:bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-thmanyah-sans font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title={isAr ? 'لصق الرمز المنسوخ من الحافظة' : 'Paste code from clipboard'}
          >
            {justPasted ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  {isAr ? 'تم اللصق' : 'Pasted'}
                </span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>{isAr ? 'لصق الرمز' : 'Paste Code'}</span>
              </>
            )}
          </button>
        </div>

        <div
          className="flex items-center justify-center gap-2 sm:gap-3 direction-ltr"
          dir="ltr"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => {
            const isFilled = digit !== '';
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  value={digit}
                  disabled={isSubmitting || isSuccess}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-13 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-thmanyah-sans font-bold rounded-xl sm:rounded-2xl transition-all duration-200 outline-none select-all ${
                    isFilled
                      ? 'border-2 border-teal-600 dark:border-teal-400 bg-surface shadow-md text-foreground'
                      : 'border border-border/80 bg-surface-warm/40 dark:bg-surface-subtle text-foreground/80 hover:border-border'
                  } focus:border-2 focus:border-crimson dark:focus:border-crimson focus:ring-4 focus:ring-crimson/15 focus:bg-surface focus:shadow-lg`}
                  aria-label={`Digit ${index + 1}`}
                />

                {/* Micro accent dot below filled input */}
                {isFilled && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400"
                    style={{ boxShadow: '0 0 6px rgba(8,125,145,0.6)' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── ERROR & SUCCESS ALERTS ── */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs sm:text-sm font-thmanyah-sans mb-5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="flex-1">{errorMessage}</p>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-thmanyah-sans mb-5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="flex-1">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VERIFY SUBMIT BUTTON ── */}
      <div className="space-y-4">
        <button
          type="button"
          disabled={isSubmitting || isSuccess || filledCount < 6}
          onClick={() => triggerVerification()}
          className="w-full relative group overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#087D91] via-[#0B95AC] to-[#C51F24] hover:from-[#066576] hover:to-[#A7181C] text-white font-thmanyah-sans font-bold text-sm sm:text-base shadow-lg shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <BrandSpinner size="sm" />
              <span>{isAr ? 'جارٍ فك تشفير وتأكيد الرمز...' : 'Verifying Security Code...'}</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
              <span>{isAr ? 'تم التحقق بنجاح!' : 'Verified Successfully!'}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>{isAr ? 'تأكيد الرمز والمتابعة' : 'Verify & Continue'}</span>
              <Sparkles className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </button>

        {/* ── RESEND COUNTDOWN & ACTION ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs font-thmanyah-sans">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>{isAr ? 'لم يصلك الرمز؟' : "Didn't receive the code?"}</span>
            {!canResend && (
              <span className="font-mono font-semibold text-foreground">
                ({formatTime(countdown)})
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!canResend || isResending || isSubmitting}
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جارٍ الإرسال...' : 'Resending...'}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة إرسال الرمز' : 'Resend Code'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
