import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion } from 'motion/react';
import type { AnimationPlaybackControls } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Globe, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  OTP_LENGTH,
  applyBackspace,
  applyInput,
  emptyDigits,
  isBusy,
  isComplete,
  otpTransition,
  type OtpEvent,
  type OtpPhase,
} from './otpLogic';

export interface OtpVerificationCardProps {
  initialEmail?: string;
  /** Must resolve only after the server has checked the code. */
  onVerify: (code: string, email: string) => Promise<{ success: boolean; error?: string }>;
  onResend?: (email: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  onBack?: () => void;
  lang?: 'ar' | 'en';
  onToggleLang?: () => void;
  variant?: 'modal' | 'page';
}

const RESEND_COOLDOWN = 60;
// Motion timings (ms), from the reference: lift, one orbit turn, converge, success hold.
const LIFT_MS = 260;
const ORBIT_MS = 1200;
const CONVERGE_MS = 800;
const SUCCESS_HOLD_MS = 1500;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const GOLD_TEXT = 'text-[#A06E14] dark:text-[#E5A93C]';

/** Eight-point khatam star holding a key: the card's emblem. */
function KeyEmblem({ done }: { done: boolean }) {
  return (
    <div className="relative mx-auto w-16 h-16" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full">
        <g
          fill="none"
          strokeWidth="1.5"
          className={`transition-colors duration-500 ${done ? 'stroke-emerald-500' : 'stroke-[#C99130] dark:stroke-[#E5A93C]'}`}
        >
          <rect x="14" y="14" width="36" height="36" rx="5" />
          <rect x="14" y="14" width="36" height="36" rx="5" transform="rotate(45 32 32)" />
        </g>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {done ? (
          <ShieldCheck className="w-6 h-6 text-emerald-500" strokeWidth={2} />
        ) : (
          <KeyRound className={`w-6 h-6 ${GOLD_TEXT}`} strokeWidth={1.8} />
        )}
      </span>
    </div>
  );
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
  const isAr = lang === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(emptyDigits);
  const [phase, setPhaseState] = useState<OtpPhase>('idle');
  const phaseRef = useRef<OtpPhase>('idle');
  const [focused, setFocused] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mounted = useRef(true);
  const reduced = !!useReducedMotion();
  const spin = useMotionValue(0);
  const spinCtrl = useRef<AnimationPlaybackControls | null>(null);

  const busy = isBusy(phase);
  const success = phase === 'success';
  const compact = variant === 'modal';
  const [stageW, setStageW] = useState(360);
  const stageRef = useRef<HTMLDivElement>(null);
  const gap = compact ? 8 : 10;
  // Boxes shrink to fit narrow phones; the orbit radius follows.
  const boxW = Math.min(compact ? 44 : 50, Math.floor((stageW + gap) / OTP_LENGTH) - gap);
  const boxH = Math.round(boxW * 1.2);
  const step = boxW + gap;
  const radius = Math.round(boxW * 1.6);

  const dispatch = (ev: OtpEvent) => {
    phaseRef.current = otpTransition(phaseRef.current, ev);
    setPhaseState(phaseRef.current);
  };

  useEffect(() => {
    mounted.current = true;
    const id = setTimeout(() => inputRefs.current[0]?.focus(), 120);
    return () => {
      mounted.current = false;
      clearTimeout(id);
      spinCtrl.current?.stop();
    };
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setStageW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const focusBox = (i: number) => setTimeout(() => inputRefs.current[i]?.select(), 0);

  const stopSpin = () => {
    spinCtrl.current?.stop();
    spinCtrl.current = null;
    // Finish on a whole turn so the circle does not jump.
    const target = Math.ceil(spin.get() / 360) * 360;
    animate(spin, target, { duration: 0.25, ease: 'easeOut' });
  };

  const verify = async (code: string) => {
    if (isBusy(phaseRef.current)) return;
    if (!email.includes('@')) {
      setError(t('اكتب بريدك الإلكتروني أولاً.', 'Enter your email first.'));
      return;
    }
    setError(null);
    setNotice(null);
    dispatch('submit');

    const request = onVerify(code, email).catch((err: unknown) => ({
      success: false,
      error: err instanceof Error ? err.message : undefined,
    }));

    await wait(reduced ? 0 : LIFT_MS);
    if (!mounted.current) return;
    dispatch('lifted');
    if (!reduced) {
      spin.set(0);
      spinCtrl.current = animate(spin, 360, { duration: ORBIT_MS / 1000, ease: 'linear', repeat: Infinity });
    }

    // Keep orbiting for at least one turn, and for as long as the server takes.
    const [res] = await Promise.all([request, wait(reduced ? 0 : ORBIT_MS)]);
    if (!mounted.current) return;
    if (!reduced) stopSpin();

    if (res.success) {
      dispatch('verified');
      await wait(reduced ? 0 : CONVERGE_MS);
      if (!mounted.current) return;
      dispatch('converged');
      await wait(SUCCESS_HOLD_MS);
      if (mounted.current) onSuccess?.();
      return;
    }

    dispatch('rejected');
    setShakeKey((k) => k + 1);
    setError(
      t('الكود غير صحيح أو انتهت صلاحيته. اكتبه مرة أخرى.', 'That code is wrong or has expired. Enter it again.')
    );
    setDigits(emptyDigits());
    focusBox(0);
  };

  const commit = (next: string[], focus: number) => {
    setDigits(next);
    if (phaseRef.current === 'error') dispatch('edit');
    setError(null);
    if (isComplete(next)) verify(next.join(''));
    else focusBox(focus);
  };

  const onChange = (i: number, value: string) => {
    const r = applyInput(digits, i, value);
    commit(r.digits, r.focus);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const r = applyBackspace(digits, i);
      commit(r.digits, r.focus);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Boxes are always laid out left-to-right (digits stay LTR), so arrows map directly.
      e.preventDefault();
      const target = i + (e.key === 'ArrowLeft' ? -1 : 1);
      if (target >= 0 && target < OTP_LENGTH) focusBox(target);
    } else if (e.key === 'Enter' && isComplete(digits)) {
      verify(digits.join(''));
    }
  };

  const onPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const r = applyInput(digits, i, e.clipboardData.getData('text'));
    commit(r.digits, r.focus);
  };

  const resend = async () => {
    if (!onResend || countdown > 0 || isResending || busy) return;
    if (!email.includes('@')) {
      setError(t('اكتب بريدك الإلكتروني أولاً.', 'Enter your email first.'));
      return;
    }
    setIsResending(true);
    setError(null);
    const res = await onResend(email).catch(() => ({ success: false }));
    if (!mounted.current) return;
    setIsResending(false);
    if (res.success) {
      setCountdown(RESEND_COOLDOWN);
      setNotice(t('أرسلنا كوداً جديداً إلى بريدك.', 'We sent a new code to your email.'));
      setDigits(emptyDigits());
      if (phaseRef.current === 'error') dispatch('edit');
      focusBox(0);
    } else {
      setError(t('تعذّر إرسال الكود، حاول بعد قليل.', 'The code could not be sent. Try again shortly.'));
    }
  };

  const toggleLang = () => {
    onToggleLang?.();
    setLang((l) => (l === 'ar' ? 'en' : 'ar'));
  };

  // Where each box sits in every phase.
  const boxTarget = (i: number) => {
    const rowX = (i - (OTP_LENGTH - 1) / 2) * step;
    if (reduced) {
      return { x: rowX, y: 0, rotate: 0, scale: 1, opacity: phase === 'converge' || success ? 0 : 1 };
    }
    switch (phase) {
      case 'lift':
        return { x: rowX, y: -14, rotate: i % 2 ? 9 : -9, scale: 1.06, opacity: 1 };
      case 'orbit': {
        const a = ((i * 360) / OTP_LENGTH - 90) * (Math.PI / 180);
        return { x: Math.cos(a) * radius, y: Math.sin(a) * radius, rotate: 0, scale: 0.9, opacity: 1 };
      }
      case 'converge': {
        // Gather into a tight cluster (as in the reference), then fold into the single centre box.
        const a = ((i * 360) / OTP_LENGTH - 90) * (Math.PI / 180);
        const r = boxW * 0.62;
        return {
          x: [Math.cos(a) * r, Math.cos(a) * r, 0],
          y: [Math.sin(a) * r, Math.sin(a) * r, 0],
          rotate: 0,
          scale: [0.9, 0.9, 0.7],
          opacity: [1, 1, 0],
        };
      }
      case 'success':
        return { x: 0, y: 0, rotate: 0, scale: 0.7, opacity: 0 };
      default:
        return { x: rowX, y: 0, rotate: 0, scale: 1, opacity: 1 };
    }
  };

  const stageH = !reduced && (phase === 'orbit' || phase === 'converge' || success) ? radius * 2 + boxH + 8 : boxH + 24;
  const status = busy && !success && phase !== 'converge'
    ? t('نتحقق من الكود…', 'Checking your code…')
    : success
    ? t('تم التأكيد بنجاح', 'Verified successfully')
    : error || notice || '';

  const card =
    variant === 'page'
      ? 'rounded-[2rem] border p-6 sm:p-10 backdrop-blur-2xl bg-white/60 border-white/80 shadow-[0_30px_80px_-30px_rgba(5,54,63,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-[#06343C]/55 dark:border-[#E5A93C]/20 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(229,169,60,0.15)]'
      : '';

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`relative w-full max-w-md mx-auto overflow-hidden ${card}`}>
      {/* Soft green wash over the card once the server confirms. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 40%, rgba(16,185,129,0.22), transparent 70%)' }}
        initial={false}
        animate={{ opacity: success ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />

      <div className="relative flex items-center justify-between mb-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t('رجوع', 'Back')}
          </button>
        ) : (
          <span />
        )}
        {variant === 'page' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg text-foreground/80 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Globe className="w-4 h-4" />
              {isAr ? 'English' : 'عربي'}
            </button>
            <ThemeToggle compact />
          </div>
        )}
      </div>

      <div className="relative text-center">
        <KeyEmblem done={success} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={success ? 'ok' : 'ask'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-2xl sm:text-3xl font-editorial font-bold text-foreground"
          >
            {success ? (
              isAr ? (
                <>
                  تم التأكيد <span className="text-emerald-600 dark:text-emerald-400">بنجاح</span>
                </>
              ) : (
                <>
                  Verified <span className="text-emerald-600 dark:text-emerald-400">successfully</span>
                </>
              )
            ) : isAr ? (
              <>
                تأكيد <span className={GOLD_TEXT}>الكود</span>
              </>
            ) : (
              <>
                Verify your <span className={GOLD_TEXT}>code</span>
              </>
            )}
          </motion.h2>
        </AnimatePresence>
        <p className="mt-2 text-sm text-muted-foreground">
          {success ? t('تأكّد بريدك، أهلاً بك في بيتك.', 'Your email is confirmed. Welcome home.') : t('أرسلناه إلى', 'We sent it to')}
          {!success && email && (
            <>
              {' '}
              <bdi dir="ltr" className="font-medium text-foreground">
                {email}
              </bdi>
            </>
          )}
        </p>
      </div>

      {!initialEmail && !success && (
        <div className="relative mt-4">
          <label htmlFor="otp-email" className="sr-only">
            {t('البريد الإلكتروني', 'Email')}
          </label>
          <Input
            id="otp-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder="name@example.com"
            disabled={busy}
          />
        </div>
      )}

      {/* The stage: boxes live here and move through lift → orbit → converge. */}
      <motion.div
        ref={stageRef}
        dir="ltr"
        role="group"
        aria-label={t('الكود المكوّن من 6 أرقام', '6-digit code')}
        className="relative mx-auto mt-6"
        initial={false}
        animate={{ height: stageH }}
        transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          key={shakeKey}
          className="absolute inset-0"
          animate={shakeKey && !reduced ? { x: [0, -12, 12, -8, 8, -3, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.div className="absolute left-1/2 top-1/2" style={{ rotate: spin }}>
            {digits.map((d, i) => {
              const active = focused === i && !busy;
              const target = boxTarget(i);
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ width: boxW, height: boxH, left: -boxW / 2, top: -boxH / 2 }}
                  initial={false}
                  animate={target}
                  transition={
                    reduced
                      ? { duration: phase === 'success' || phase === 'converge' ? 0.4 : 0 }
                      : phase === 'converge'
                      ? { duration: CONVERGE_MS / 1000, times: [0, 0.55, 1], ease: 'easeInOut' }
                      : { type: 'spring', stiffness: 260, damping: 24, delay: phase === 'lift' ? i * 0.03 : 0 }
                  }
                >
                  <div className="relative w-full h-full">
                    <input
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      pattern="[0-9]*"
                      maxLength={OTP_LENGTH}
                      value={d}
                      disabled={busy}
                      aria-label={t(`الرقم ${i + 1} من 6`, `Digit ${i + 1} of 6`)}
                      aria-invalid={!!error}
                      onFocus={(e) => {
                        setFocused(i);
                        e.target.select();
                      }}
                      onBlur={() => setFocused((f) => (f === i ? null : f))}
                      onChange={(e) => onChange(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      onPaste={(e) => onPaste(i, e)}
                      className={`w-full h-full text-center text-2xl font-bold tabular-nums rounded-2xl outline-none caret-transparent backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-200 disabled:opacity-100
                        bg-white/70 dark:bg-white/[0.06] text-foreground border
                        ${
                          busy
                            ? 'border-[#C99130]/60 dark:border-[#E5A93C]/50 border-t-[#C51F24] dark:border-t-[#E82C32] shadow-[0_-3px_14px_-2px_rgba(197,31,36,0.55)]'
                            : error
                            ? 'border-[#C51F24]/60 dark:border-[#E82C32]/60'
                            : active
                            ? 'border-[#C99130] dark:border-[#E5A93C] shadow-[0_0_0_4px_rgba(229,169,60,0.18),0_0_24px_rgba(229,169,60,0.35)]'
                            : d
                            ? 'border-[#087D91]/50 dark:border-[#12A4BC]/50'
                            : 'border-[#05363F]/12 dark:border-white/12'
                        }`}
                    />
                    {active && !d && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 rounded bg-[#C99130] dark:bg-[#E5A93C] motion-safe:animate-pulse"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* The single box the six become; it shows the check only after a real success. */}
          <AnimatePresence>
            {(phase === 'converge' || success) && (
              <motion.div
                className="absolute left-1/2 top-1/2"
                style={{ width: boxW + 12, height: boxH + 12, marginLeft: -(boxW + 12) / 2, marginTop: -(boxH + 12) / 2 }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduced ? { duration: 0.4 } : { delay: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
              >
                {success && !reduced && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl border-2 border-emerald-500"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 3.4, opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut', repeat: 1 }}
                  />
                )}
                <div
                  className={`relative w-full h-full rounded-2xl border flex items-center justify-center backdrop-blur-md transition-colors duration-300 ${
                    success
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_32px_rgba(16,185,129,0.45)]'
                      : 'border-[#C99130] dark:border-[#E5A93C] bg-white/70 dark:bg-white/[0.06]'
                  }`}
                >
                  {success && (
                    <motion.span
                      initial={reduced ? { opacity: 0 } : { scale: 0, rotate: -30 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    >
                      <Check className="w-8 h-8 text-emerald-500" strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <p
        role={error ? 'alert' : 'status'}
        aria-live={error ? 'assertive' : 'polite'}
        className={`relative mt-4 min-h-5 text-center text-sm ${
          error ? 'text-[#C51F24] dark:text-[#E82C32] font-medium' : success ? 'sr-only' : 'text-muted-foreground'
        }`}
      >
        {status}
      </p>

      {!success && (
        <div className="relative mt-4 space-y-4">
          <Button
            type="button"
            size="lg"
            className="w-full"
            isLoading={busy}
            disabled={!isComplete(digits)}
            onClick={() => verify(digits.join(''))}
          >
            {busy ? t('نتحقق…', 'Checking…') : t('تأكيد', 'Verify')}
          </Button>

          {onResend && (
            <div className="text-center text-sm text-muted-foreground">
              {t('لم يصلك الكود؟', "Didn't get it?")}{' '}
              <button
                type="button"
                onClick={resend}
                disabled={countdown > 0 || isResending || busy}
                className={`inline-flex items-center gap-1 font-semibold rounded px-1 text-[#087D91] dark:text-[#12A4BC] hover:underline disabled:no-underline disabled:text-muted-foreground disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
              >
                {isResending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {t('أعد الإرسال', 'Resend')}
                {countdown > 0 && (
                  <bdi dir="ltr" className="tabular-nums">
                    ({countdown}s)
                  </bdi>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
