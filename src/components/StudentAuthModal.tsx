import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Users, X, Eye, EyeOff, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { ThemeToggle } from './ui/ThemeToggle';
import FocusTrap from './FocusTrap';
import { useTeacherAuth } from '../lib/auth'; // it's now AuthProvider
import { LEAKED_PASSWORD_MESSAGE } from '../lib/pwnedPassword';
import { useNavigate } from 'react-router-dom';
import { OtpVerificationCard } from './auth/OtpVerificationCard';
import { markJustSignedIn } from './ui/WelcomeLoader';
import { ADULT_MIN_AGE, GUARDIAN_MIN_AGE, MAX_AGE, parseAge, signupAgeProblem, SIGNUP_CHOICE_KEY } from '../lib/ageRules';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
  initialView?: 'login' | 'signup' | 'verify' | 'forgot' | 'update-password';
}

type View = 'login' | 'signup' | 'verify' | 'forgot' | 'update-password';

const VERSE_TEXT = '﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾';
// Thmanyah has no ornate Quranic brackets: the verse uses Amiri Quran, loaded for these letters only (as on the homepage).
function loadVerseFont() {
  if (typeof document === 'undefined' || document.getElementById('verse-font-auth') || document.getElementById('verse-font')) return;
  const link = document.createElement('link');
  link.id = 'verse-font-auth';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap&text=' + encodeURIComponent(Array.from(new Set(VERSE_TEXT)).join(''));
  document.head.appendChild(link);
}

export function StudentAuthModal({ isOpen, onClose, lang = 'en', initialView = 'login' }: StudentAuthModalProps) {
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Sign-up age gate (owner decision 2026-10-16): checked before the account (and its email) is created.
  const [accountType, setAccountType] = useState<'self' | 'family'>('self');
  const [confirmedAdult, setConfirmedAdult] = useState(false);
  const [guardianAge, setGuardianAge] = useState('');
  const { signIn, signUp, signInWithGoogle, verifyOtp, resendOtp, resetPassword, updatePassword, signOut } = useTeacherAuth();
  const navigate = useNavigate();

  /** Sign-up only: the age gate's message, or '' when the form may create the account. */
  const ageGateError = () => {
    const problem = signupAgeProblem({ accountType, confirmedAdult, guardianAge });
    if (problem === 'confirm_adult') {
      return isAr
        ? `أكّد إن سنك ${ADULT_MIN_AGE} سنة أو أكتر. لو أقل، ولي أمرك يفتح "حساب عائلة" ويسجّلك فيه.`
        : `Please confirm you are ${ADULT_MIN_AGE} or over. Under ${ADULT_MIN_AGE}? A parent opens a family account for you.`;
    }
    if (problem === 'guardian_age') {
      return isAr
        ? `حساب العائلة بيفتحه ولي أمر عنده ${GUARDIAN_MIN_AGE} سنة أو أكتر. اكتب سنك بالأرقام.`
        : `A family account is opened by a parent or guardian aged ${GUARDIAN_MIN_AGE} or over. Enter your age in numbers.`;
    }
    return '';
  };

  const rememberSignupChoice = () => {
    try {
      localStorage.setItem(SIGNUP_CHOICE_KEY, JSON.stringify({ accountType, guardianAge: accountType === 'family' ? parseAge(guardianAge) : null }));
    } catch {}
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (view === 'signup') {
      const gate = ageGateError();
      if (gate) {
        setError(gate);
        return;
      }
      rememberSignupChoice();
    }
    setIsSubmitting(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setError(res.error || (isAr ? 'معرفناش ندخّلك بحساب Google. جرّب تاني.' : 'We could not sign you in with Google. Please try again.'));
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVerseFont();
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('type=recovery') || hash === '#reset-password') {
          setView('update-password');
          return;
        } else if (window.location.search.includes('auth=verify') || hash.includes('verify')) {
          setView('verify');
          return;
        }
      }
      setView(initialView);
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  // The leaked-password message is bilingual ("English / Arabic"); show only the UI language's half.
  const leakedPasswordText = LEAKED_PASSWORD_MESSAGE.split(' / ')[isAr ? 1 : 0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (view === 'signup') {
      const gate = ageGateError();
      if (gate) {
        setError(gate);
        return;
      }
    }
    setIsSubmitting(true);

    try {
      if (view === 'login') {
        const { success, role, error: authError } = await signIn(email, password, 'student');
        // Teacher and admin accounts sign in on the staff page (RULES.md); say so plainly with the way there.
        if (!success && role === 'teacher') {
          setError(
            isAr
              ? 'الحساب ده حساب معلم. ادخل من صفحة دخول المعلمين (/staff/login).'
              : 'This is a teacher account. Please sign in from the teacher sign-in page (/staff/login).'
          );
          return;
        }
        if (success) {
          if (role === 'teacher') {
            await signOut();
            setError(
              isAr
                ? 'الحساب ده حساب معلم. ادخل من صفحة دخول المعلمين.'
                : 'This is a teacher account. Please sign in from the teacher sign-in page.'
            );
            return;
          }
          markJustSignedIn();
          onClose();
          navigate('/student');
        } else {
          setError(
            authError
              ? (isAr ? 'الإيميل أو كلمة السر مش صح. راجعهم وجرّب تاني.' : authError)
              : (isAr ? 'معرفناش ندخّلك دلوقتي. جرّب تاني بعد شوية.' : 'We could not sign you in. Please try again shortly.')
          );
        }
      } else if (view === 'signup') {
        const { success, error: authError } = await signUp(email, password, name, {
          accountType,
          guardianAge: accountType === 'family' ? parseAge(guardianAge) ?? undefined : undefined,
          confirmedAdult: accountType === 'self' ? confirmedAdult : undefined
        });
        if (success) {
          rememberSignupChoice();
          setSuccess(isAr ? 'بعتنالك رمز التأكيد على إيميلك. بص في صندوق الوارد.' : 'We sent a confirmation code to your email. Check your inbox.');
          setView('verify');
        } else {
          setError(authError === LEAKED_PASSWORD_MESSAGE ? leakedPasswordText : authError ? (isAr ? 'معرفناش نفتح الحساب. ممكن الإيميل ده مستخدم قبل كده.' : authError) : (isAr ? 'معرفناش نفتح الحساب. جرّب تاني.' : 'We could not create the account. Please try again.'));
        }
      } else if (view === 'forgot') {
        const { success, error: authError } = await resetPassword(email);
        if (success) {
          setSuccess(isAr ? 'بعتنالك رابط على إيميلك تختار بيه كلمة سر جديدة.' : 'We sent you a link to choose a new password.');
          setTimeout(() => setView('login'), 3000);
        } else {
          setError(isAr ? 'معرفناش نبعت الرابط. اتأكد من الإيميل وجرّب تاني.' : (authError || 'We could not send the link. Please try again.'));
        }
      } else if (view === 'update-password') {
        const { success, error: authError } = await updatePassword(password);
        if (success) {
          setSuccess(isAr ? 'كلمة السر الجديدة اتحفظت. بننقلك لحسابك…' : 'Your new password is saved. Taking you to your account…');
          setTimeout(() => {
            onClose();
            navigate('/student');
          }, 1500);
        } else {
          setError(authError === LEAKED_PASSWORD_MESSAGE ? leakedPasswordText : isAr ? 'معرفناش نحفظ كلمة السر. جرّب تاني.' : (authError || 'We could not save the password. Please try again.'));
        }
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'حصلت مشكلة. جرّب تاني.' : 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles: Record<Exclude<View, 'verify'>, [string, string]> = {
    login: [isAr ? 'أهلاً بيك تاني' : 'Welcome back', isAr ? 'ادخل حسابك وكمّل رحلتك.' : 'Sign in and pick up where you left off.'],
    signup: [isAr ? 'افتح حسابك' : 'Create your account', isAr ? 'دقيقة واحدة، وبعدها تحجز حصتك المجانية.' : 'One minute, then you can book your free trial.'],
    forgot: [isAr ? 'نسيت كلمة السر؟' : 'Forgot your password?', isAr ? 'اكتب إيميلك ونبعتلك رابط تختار بيه كلمة جديدة.' : 'Write your email and we will send you a link to choose a new one.'],
    'update-password': [isAr ? 'كلمة سر جديدة' : 'A new password', isAr ? 'اختار كلمة سر جديدة لحسابك.' : 'Choose a new password for your account.'],
  };
  const submitLabel: Record<Exclude<View, 'verify'>, string> = {
    login: isAr ? 'ادخل' : 'Sign in',
    signup: isAr ? 'افتح الحساب' : 'Create account',
    forgot: isAr ? 'ابعت الرابط' : 'Send the link',
    'update-password': isAr ? 'احفظ كلمة السر' : 'Save password',
  };
  const isSignup = view === 'signup';
  const showTabs = view === 'login' || isSignup;
  const isWide = view !== 'verify';
  const width = view === 'verify' ? 'sm:max-w-lg' : 'sm:max-w-[30rem] lg:max-w-[58rem]';

  const googleButton = (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isSubmitting}
      className="auth-google"
    >
      <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{isAr ? 'كمّل بحساب Google' : 'Continue with Google'}</span>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <FocusTrap onEscape={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#05363F]/50 dark:bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Phones: a bottom sheet; tablets: one card; desktop: the brand pane beside the form. */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className={`auth-sheet relative w-full ${width} max-h-[94dvh] overflow-y-auto overscroll-contain`}
          >
            {view === 'verify' ? (
              <div className="relative p-6 sm:p-8">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                  className="absolute top-4 end-4 z-20 w-11 h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer focus-ring"
                >
                  <X className="w-4 h-4" />
                </button>
                <OtpVerificationCard
                  initialEmail={email}
                  onVerify={async (code, targetEmail) => {
                    const res = await verifyOtp(targetEmail, code, 'signup');
                    if (res.success) {
                      if (password) {
                        await signIn(targetEmail, password, 'student');
                      }
                      return { success: true };
                    }
                    return { success: false, error: res.error };
                  }}
                  onResend={async (targetEmail) => {
                    return await resendOtp(targetEmail, 'signup');
                  }}
                  onSuccess={() => {
                    markJustSignedIn();
                    onClose();
                    navigate('/student');
                  }}
                  onBack={() => setView('login')}
                  lang={lang}
                  variant="modal"
                />
              </div>
            ) : (
              <div className={isWide ? 'lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]' : ''}>
                {/* Brand pane (desktop): the verse, three promises, quiet pattern. */}
                <aside className="auth-brand-pane hidden lg:flex" aria-hidden="true">
                  <div className="relative flex items-center gap-3">
                    <span className="grid place-items-center w-11 h-11 rounded-2xl bg-[#FAF7F2] ring-1 ring-[#E5A93C]/60">
                      <img src="/logo-256.png" alt="" className="w-8 h-auto" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-editorial text-lg font-bold text-[#FAF7F2]">{isAr ? 'وتزودوا' : 'Watazawwado'}</span>
                      <span className="block text-xs text-white/65">{isAr ? 'أكاديمية حصص فردية أونلاين' : 'One-to-one online academy'}</span>
                    </span>
                  </div>

                  <div className="relative">
                    <p className="text-[2rem] leading-[1.9] text-[#F6D58E]" dir="rtl" lang="ar" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>{VERSE_TEXT}</p>
                    <p className="mt-3 font-editorial text-2xl leading-snug text-[#FAF7F2]">
                      {isAr ? <>زادٌ يبقى،<br />لك ولأهل بيتك.</> : <>Provision that lasts,<br />for you and your family.</>}
                    </p>
                  </div>

                  <ul className="relative space-y-3.5 text-[0.95rem] text-white/90">
                    {(isAr
                      ? ['حصص فردية مع معلم بيعرفك باسمك', 'حصة تجريبية مجانية قبل أي دفع', 'حساب عائلة واحد لكل أولادك']
                      : ['One-to-one lessons with a teacher who knows you', 'A free trial before any payment', 'One family account for all your children']
                    ).map((line) => (
                      <li key={line} className="flex items-center gap-3">
                        <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-[#E5A93C]/20 text-[#F6D58E] ring-1 ring-[#E5A93C]/40"><Check className="w-3.5 h-3.5" /></span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </aside>

                <div className="relative">
                  {/* Top bar: the mark on phones and tablets, day/night and close everywhere. */}
                  <div className="flex items-center justify-between gap-2 px-5 sm:px-7 pt-3 sm:pt-5">
                    <span className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
                    <span className="lg:invisible grid place-items-center w-11 h-11 mt-2 sm:mt-0 rounded-2xl bg-[#FAF7F2] ring-1 ring-[#E5A93C]/50 shadow-[var(--shadow-1)]" aria-hidden="true">
                      <img src="/logo-256.png" alt="" className="w-8 h-auto" />
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                      <ThemeToggle compact className="!w-10 !h-10 !rounded-full" />
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label={isAr ? 'إغلاق' : 'Close'}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground bg-surface-subtle hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-ring"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-5 sm:px-7 pt-3 lg:pt-1">
                    <h2 id="auth-modal-title" className="font-editorial text-[1.7rem] sm:text-[1.9rem] font-bold text-foreground leading-tight">{titles[view][0]}</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{titles[view][1]}</p>
                  </div>

                  <div className="px-5 sm:px-7 pt-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
                    {showTabs && (
                      <div className="auth-tabs mb-5" role="tablist" aria-label={isAr ? 'دخول أو حساب جديد' : 'Sign in or new account'}>
                        {(['login', 'signup'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            role="tab"
                            aria-selected={view === v}
                            onClick={() => { setView(v); setError(''); setSuccess(''); }}
                            className="relative z-10 min-h-10 rounded-full text-sm font-bold transition-colors cursor-pointer focus-ring aria-selected:text-foreground text-muted-foreground hover:text-foreground"
                          >
                            {view === v && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-full bg-surface shadow-[var(--shadow-1)] ring-1 ring-border/60" transition={{ type: 'spring', stiffness: 460, damping: 36 }} />}
                            {v === 'login' ? (isAr ? 'دخول' : 'Sign in') : (isAr ? 'حساب جديد' : 'New account')}
                          </button>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                      {isSignup && (
                        <fieldset className="space-y-2.5">
                          <legend className="text-sm font-semibold text-foreground mb-2">{isAr ? 'الحساب ده لمين؟' : 'Who is this account for?'}</legend>
                          <div role="radiogroup" aria-label={isAr ? 'نوع الحساب' : 'Account type'} className="grid grid-cols-2 gap-2.5">
                            {([
                              { id: 'self' as const, Icon: User, title: isAr ? 'ليا أنا' : 'For myself', sub: isAr ? `${ADULT_MIN_AGE} سنة وأكبر` : `Aged ${ADULT_MIN_AGE}+` },
                              { id: 'family' as const, Icon: Users, title: isAr ? 'لعيلتي' : 'For my family', sub: isAr ? 'ولي أمر يسجّل أولاده' : 'A parent enrols children' }
                            ]).map(({ id, Icon, title, sub }) => {
                              const selected = accountType === id;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  onClick={() => { setAccountType(id); setError(''); }}
                                  className={`auth-choice ${selected ? 'is-selected' : ''}`}
                                >
                                  <span className="auth-choice-icon"><Icon className="w-[18px] h-[18px]" aria-hidden="true" /></span>
                                  <span className="min-w-0 text-start">
                                    <span className="block text-sm font-bold text-foreground leading-tight">{title}</span>
                                    <span className="block text-xs text-muted-foreground leading-tight mt-0.5">{sub}</span>
                                  </span>
                                  <span className="auth-choice-dot" aria-hidden="true">{selected && <Check className="w-3 h-3" />}</span>
                                </button>
                              );
                            })}
                          </div>

                          {accountType === 'self' ? (
                            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={confirmedAdult}
                                onChange={(e) => { setConfirmedAdult(e.target.checked); setError(''); }}
                                className="mt-0.5 w-[18px] h-[18px] shrink-0 accent-[#087D91] cursor-pointer"
                              />
                              <span className="text-sm text-foreground leading-snug">
                                {isAr ? `أؤكد إن سني ${ADULT_MIN_AGE} سنة أو أكتر.` : `I confirm I am ${ADULT_MIN_AGE} or older.`}
                                <span className="block text-xs text-muted-foreground mt-0.5">{isAr ? 'أصغر؟ ولي أمرك يفتح حساب "لعيلتي" ويسجّلك.' : 'Younger? A parent opens a family account for you.'}</span>
                              </span>
                            </label>
                          ) : (
                            <div className="pt-1">
                              <label htmlFor="signup-guardian-age" className="block text-sm font-semibold text-foreground mb-1.5">
                                {isAr ? 'سنك (ولي الأمر)' : 'Your age (parent or guardian)'}
                              </label>
                              <div className="relative">
                                <ShieldCheck className="auth-field-icon" aria-hidden="true" />
                                <input
                                  id="signup-guardian-age"
                                  type="number"
                                  inputMode="numeric"
                                  min={GUARDIAN_MIN_AGE}
                                  max={MAX_AGE}
                                  value={guardianAge}
                                  onChange={(e) => { setGuardianAge(e.target.value); setError(''); }}
                                  aria-invalid={parseAge(guardianAge) !== null && Number(guardianAge) < GUARDIAN_MIN_AGE}
                                  aria-describedby="signup-guardian-age-hint"
                                  className="auth-field"
                                  placeholder={isAr ? 'مثال: 38' : 'e.g. 38'}
                                />
                              </div>
                              {(() => {
                                const tooYoung = parseAge(guardianAge) !== null && Number(guardianAge) < GUARDIAN_MIN_AGE;
                                return (
                                  <p id="signup-guardian-age-hint" aria-live="polite" className={`mt-1.5 text-xs ${tooYoung ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                    {tooYoung
                                      ? (isAr ? `لازم ولي الأمر يكون ${GUARDIAN_MIN_AGE} سنة أو أكتر عشان يفتح حساب عائلة.` : `A guardian must be ${GUARDIAN_MIN_AGE} or over to open a family account.`)
                                      : (isAr ? `ولي الأمر ${GUARDIAN_MIN_AGE} سنة أو أكتر.` : `Guardians must be ${GUARDIAN_MIN_AGE} or over.`)}
                                  </p>
                                );
                              })()}
                            </div>
                          )}
                        </fieldset>
                      )}

                      {showTabs && (
                        <>
                          {googleButton}
                          <div className="auth-divider">{isAr ? 'أو بالإيميل' : 'or with email'}</div>
                        </>
                      )}

                      {isSignup && (
                        <div>
                          <label htmlFor="auth-name" className="block text-sm font-semibold text-foreground mb-1.5">
                            {accountType === 'family' ? (isAr ? 'اسم ولي الأمر' : 'Parent or guardian name') : (isAr ? 'اسمك' : 'Your name')}
                          </label>
                          <div className="relative">
                            <User className="auth-field-icon" aria-hidden="true" />
                            <input
                              id="auth-name"
                              type="text"
                              required
                              autoComplete="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="auth-field"
                              placeholder={isAr ? 'مريم أحمد' : 'Maryam Ahmed'}
                            />
                          </div>
                        </div>
                      )}

                      {view !== 'update-password' && (
                        <div>
                          <label htmlFor="auth-email" className="block text-sm font-semibold text-foreground mb-1.5">
                            {isAr ? 'الإيميل' : 'Email'}
                          </label>
                          <div className="relative">
                            <Mail className="auth-field-icon" aria-hidden="true" />
                            <input
                              id="auth-email"
                              type="email"
                              required
                              autoComplete="email"
                              inputMode="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="auth-field text-start"
                              placeholder="you@example.com"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      )}

                      {view !== 'forgot' && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="auth-password" className="block text-sm font-semibold text-foreground">
                              {view === 'update-password' ? (isAr ? 'كلمة السر الجديدة' : 'New password') : (isAr ? 'كلمة السر' : 'Password')}
                            </label>
                            {view === 'login' && (
                              <button
                                type="button"
                                onClick={() => setView('forgot')}
                                className="text-xs sm:text-sm font-semibold text-[var(--teal)] hover:underline cursor-pointer"
                              >
                                {isAr ? 'نسيت كلمة السر؟' : 'Forgot it?'}
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="auth-field-icon" aria-hidden="true" />
                            <input
                              id="auth-password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              aria-describedby={view === 'login' ? undefined : 'auth-password-hint'}
                              className="auth-field pe-14"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? (isAr ? 'إخفاء كلمة السر' : 'Hide password') : (isAr ? 'إظهار كلمة السر' : 'Show password')}
                              className="absolute end-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg focus-ring"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4 text-[var(--teal)]" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {view !== 'login' && (
                            <p id="auth-password-hint" className="mt-1.5 text-xs text-muted-foreground">{isAr ? '٦ حروف على الأقل.' : 'At least 6 characters.'}</p>
                          )}
                        </div>
                      )}

                      {error && (
                        <div role="alert" className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-[var(--r-2)]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{error}</span>
                        </div>
                      )}
                      {success && (
                        <div role="status" className="flex items-start gap-2 p-3 bg-success/10 border border-success/25 text-success text-sm rounded-[var(--r-2)]">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{success}</span>
                        </div>
                      )}

                      <Button type="submit" isLoading={isSubmitting} className="w-full !h-12 !rounded-full !text-base !font-bold">
                        {submitLabel[view]}
                      </Button>
                    </form>

                    {view === 'login' && (
                      <p className="mt-5 text-center text-sm text-muted-foreground">
                        {isAr ? 'أول مرة معانا؟ ' : 'New here? '}
                        <button type="button" onClick={() => { setView('signup'); setError(''); setSuccess(''); }} className="text-[var(--teal)] font-bold hover:underline cursor-pointer">
                          {isAr ? 'افتح حساب في دقيقة' : 'Open an account in a minute'}
                        </button>
                      </p>
                    )}

                    {(view === 'forgot' || view === 'update-password') && (
                      <p className="mt-5 text-center text-sm">
                        <button type="button" onClick={() => setView('login')} className="text-[var(--teal)] font-semibold hover:underline cursor-pointer">
                          {isAr ? 'رجوع لتسجيل الدخول' : 'Back to sign in'}
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          </FocusTrap>
        </div>
      )}
    </AnimatePresence>
  );
}
