import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Users, X, Eye, EyeOff, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import FocusTrap from './FocusTrap';
import { useTeacherAuth } from '../lib/auth'; // it's now AuthProvider
import { LEAKED_PASSWORD_MESSAGE } from '../lib/pwnedPassword';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { OtpVerificationCard } from './auth/OtpVerificationCard';
import { markJustSignedIn } from './ui/WelcomeLoader';
import { AuthCard, AuthPortal, EntranceLogo, EntranceRoom, EntranceSwitches } from './auth/AuthFrame';
import { useAppLanguage } from '../lib/language';
import { isInvited, useLaunch, zaadPath } from '../lib/launch';
import { ADULT_MIN_AGE, GUARDIAN_MIN_AGE, MAX_AGE, parseAge, signupAgeProblem, SIGNUP_CHOICE_KEY } from '../lib/ageRules';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
  /** The page's own language switch (public pages move between / and /ar); defaults to the stored language. */
  onToggleLang?: () => void;
  initialView?: 'login' | 'signup' | 'verify' | 'forgot' | 'update-password';
}

type View = 'login' | 'signup' | 'verify' | 'forgot' | 'update-password';

export function StudentAuthModal({ isOpen, onClose, lang = 'en', initialView = 'login', onToggleLang }: StudentAuthModalProps) {
  const { toggleLanguage } = useAppLanguage();
  const launch = useLaunch();
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
  const { signIn, signUp, signInWithGoogle, verifyOtp, resendOtp, resetPassword, updatePassword, signOut, user, userRole: authRole, loading: authLoading } = useTeacherAuth();
  const navigate = useNavigate();

  /** Sign-up only: the age gate's message, or '' when the form may create the account. */
  const ageGateError = () => {
    const problem = signupAgeProblem({ accountType, confirmedAdult, guardianAge });
    if (problem === 'confirm_adult') {
      return isAr
        ? `أكّد أن عمرك ${ADULT_MIN_AGE} سنة أو أكثر. إن كنت أصغر، يفتح وليّ أمرك "حساب أسرة" ويسجّلك فيه.`
        : `Please confirm you are ${ADULT_MIN_AGE} or over. Under ${ADULT_MIN_AGE}? A parent opens a family account for you.`;
    }
    if (problem === 'guardian_age') {
      return isAr
        ? `يفتح حساب الأسرة وليّ أمر عمره ${GUARDIAN_MIN_AGE} سنة أو أكثر. اكتب عمرك بالأرقام.`
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
      setError(res.error || (isAr ? 'تعذّر الدخول بحساب Google. حاول مرة أخرى.' : 'We could not sign you in with Google. Please try again.'));
      setIsSubmitting(false);
    }
  };

  // Set once this window has its own reason to be open with a session (its own sign-in, a reset link, a code to
  // verify), so it does not close itself as "already signed in" (below).
  const startedHere = React.useRef(false);
  if (isSubmitting) startedHere.current = true;

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('type=recovery') || hash === '#reset-password') {
          startedHere.current = true;
          setView('update-password');
          return;
        } else if (window.location.search.includes('auth=verify') || hash.includes('verify')) {
          startedHere.current = true;
          setView('verify');
          return;
        }
      }
      setView(initialView);
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialView]);

  // The page behind stays still while the dialog is open, so a swipe on a phone scrolls the sheet and not the page.
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = prev; };
  }, [isOpen]);

  // Already signed in (a saved session), or signed in from another tab: the sign-in window has nothing to do, so it
  // closes and opens the account instead of covering it.
  useEffect(() => {
    if (!isOpen) { startedHere.current = false; return; }
    if (authLoading || !user || authRole !== 'student' || startedHere.current) return;
    if (view !== 'login' && view !== 'signup') return;
    onClose();
    navigate('/student', { replace: true });
  }, [isOpen, authLoading, user, authRole, view, onClose, navigate]);

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
              ? 'هذا حساب معلم. ادخل من صفحة دخول المعلمين (/staff/login).'
              : 'This is a teacher account. Please sign in from the teacher sign-in page (/staff/login).'
          );
          return;
        }
        if (success) {
          if (role === 'teacher') {
            await signOut();
            setError(
              isAr
                ? 'هذا حساب معلم. ادخل من صفحة دخول المعلمين.'
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
              ? (isAr ? 'البريد أو كلمة السر غير صحيحة. راجعهما وحاول مرة أخرى.' : authError)
              : (isAr ? 'تعذّر الدخول الآن. حاول مرة أخرى بعد قليل.' : 'We could not sign you in. Please try again shortly.')
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
          setSuccess(isAr ? 'أرسلنا رمز التأكيد إلى بريدك. تفقّد صندوق الوارد.' : 'We sent a confirmation code to your email. Check your inbox.');
          setView('verify');
        } else {
          setError(authError === LEAKED_PASSWORD_MESSAGE ? leakedPasswordText : authError ? (isAr ? 'تعذّر إنشاء الحساب. ربما استُخدم هذا البريد من قبل.' : authError) : (isAr ? 'تعذّر إنشاء الحساب. حاول مرة أخرى.' : 'We could not create the account. Please try again.'));
        }
      } else if (view === 'forgot') {
        const { success, error: authError } = await resetPassword(email);
        if (success) {
          setSuccess(isAr ? 'أرسلنا إلى بريدك رابطًا تختار به كلمة سر جديدة.' : 'We sent you a link to choose a new password.');
          setTimeout(() => setView('login'), 3000);
        } else {
          setError(isAr ? 'تعذّر إرسال الرابط. تأكد من البريد وحاول مرة أخرى.' : (authError || 'We could not send the link. Please try again.'));
        }
      } else if (view === 'update-password') {
        const { success, error: authError } = await updatePassword(password);
        if (success) {
          setSuccess(isAr ? 'حُفظت كلمة السر الجديدة. ننقلك إلى حسابك…' : 'Your new password is saved. Taking you to your account…');
          setTimeout(() => {
            onClose();
            navigate('/student');
          }, 1500);
        } else {
          setError(authError === LEAKED_PASSWORD_MESSAGE ? leakedPasswordText : isAr ? 'تعذّر حفظ كلمة السر. حاول مرة أخرى.' : (authError || 'We could not save the password. Please try again.'));
        }
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدثت مشكلة. حاول مرة أخرى.' : 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles: Record<Exclude<View, 'verify'>, [string, string]> = {
    login: [isAr ? 'أهلًا بعودتك' : 'Welcome back', isAr ? 'أكمل رحلتك من حيث توقفت.' : 'Pick up where you left off.'],
    signup: [isAr ? 'ابدأ رحلتك' : 'Start your journey', isAr ? 'دقيقة واحدة، ثم تحجز حصتك المجانية.' : 'One minute, then you can book your free trial.'],
    forgot: [isAr ? 'نسيت كلمة السر؟' : 'Forgot your password?', isAr ? 'اكتب بريدك ونرسل إليك رابطًا تختار به كلمة جديدة.' : 'Write your email and we will send you a link to choose a new one.'],
    'update-password': [isAr ? 'كلمة سر جديدة' : 'A new password', isAr ? 'اختر كلمة سر جديدة لحسابك.' : 'Choose a new password for your account.'],
  };
  const submitLabel: Record<Exclude<View, 'verify'>, string> = {
    login: isAr ? 'دخول' : 'Enter',
    signup: isAr ? 'أنشئ الحساب' : 'Create account',
    forgot: isAr ? 'أرسل الرابط' : 'Send the link',
    'update-password': isAr ? 'احفظ كلمة السر' : 'Save password',
  };
  const isSignup = view === 'signup';
  // Sign-up opens in waves: without an invitation, the new-account tab leads to the waitlist (the server checks too).
  const signupClosed = launch.signupMode === 'waitlist' && !isInvited();
  const showTabs = view === 'login' || isSignup;

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
      <span>{isAr ? 'المتابعة بحساب Google' : 'Continue with Google'}</span>
    </button>
  );

  // Portalled to the body: the student area renders this inside its own sign-in room, under that room's bar.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <FocusTrap onEscape={onClose}>
          {/* The whole screen is the sign-in page (AuthFrame "lamp room"): the stage with the name, the card beside it. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="entrance entrance-overlay text-foreground"
          >
            <EntranceRoom
              isAr={isAr}
              bar={
                <>
                  <span className="entrance-brand"><EntranceLogo isAr={isAr} /></span>
                  <div className="flex items-center gap-1.5">
                    <EntranceSwitches isAr={isAr} onToggleLang={onToggleLang ?? toggleLanguage} />
                    <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'} className="entrance-link is-round">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              }
            >
              <AuthCard wide={view === 'verify'} className={isSignup ? 'sm:max-w-[30rem]' : ''}>
            {view === 'verify' ? (
              <div>
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
                <>
                  <AuthPortal heading="h2" titleId="auth-modal-title" title={titles[view][0]} subtitle={titles[view][1]} />

                  <div className="pt-7 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {showTabs && (
                      <div className="auth-tabs mb-7" role="tablist" aria-label={isAr ? 'دخول أو حساب جديد' : 'Sign in or new account'}>
                        {(['login', 'signup'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            role="tab"
                            aria-selected={view === v}
                            onClick={() => { setView(v); setError(''); setSuccess(''); }}
                            className="relative min-h-11 text-[0.95rem] font-semibold transition-colors cursor-pointer focus-ring aria-selected:text-foreground text-muted-foreground hover:text-foreground"
                          >
                            {view === v && <motion.span layoutId="auth-tab" className="auth-tab-mark" transition={{ type: 'spring', stiffness: 460, damping: 36 }} />}
                            {v === 'login' ? (isAr ? 'دخول' : 'Sign in') : (isAr ? 'حساب جديد' : 'New account')}
                          </button>
                        ))}
                      </div>
                    )}

                    {isSignup && signupClosed ? (
                      <div className="space-y-4 text-center">
                        <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
                          {isAr ? 'نفتح الحسابات الجديدة على دفعات، لنعطي كل طالب معلّمه ووقته. جهّز زادك لتحجز مكانك في الدور، ونرسل لك الدعوة حين يأتي دورك.' : 'We open new accounts in waves, so every learner gets their teacher and their time. Pack your zaad to keep your place in line, and we will email your invitation when it is your turn.'}
                        </p>
                        <Button type="button" onClick={() => { onClose(); navigate(zaadPath(!isAr)); }} className="w-full !h-12 !rounded-full !text-base !font-bold">
                          {isAr ? 'جهّز زادك' : 'Pack your zaad'}
                        </Button>
                      </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="auth-form space-y-4" noValidate={false}>
                      {isSignup && (
                        <fieldset className="space-y-2.5">
                          <legend className="text-sm font-semibold text-foreground mb-2">{isAr ? 'لمن هذا الحساب؟' : 'Who is this account for?'}</legend>
                          <div role="radiogroup" aria-label={isAr ? 'نوع الحساب' : 'Account type'} className="grid grid-cols-2 gap-2.5">
                            {([
                              { id: 'self' as const, Icon: User, title: isAr ? 'لي أنا' : 'For myself', sub: isAr ? `${ADULT_MIN_AGE} سنة فأكثر` : `Aged ${ADULT_MIN_AGE}+` },
                              { id: 'family' as const, Icon: Users, title: isAr ? 'لأسرتي' : 'For my family', sub: isAr ? 'وليّ أمر يسجّل أطفاله' : 'A parent enrols children' }
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
                            <label className="flex items-start gap-3 min-h-11 py-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                data-ring-mark
                                checked={confirmedAdult}
                                onChange={(e) => { setConfirmedAdult(e.target.checked); setError(''); }}
                                className="mt-0.5 w-5 h-5 shrink-0 accent-[#087D91] cursor-pointer"
                              />
                              <span className="text-sm text-foreground leading-snug">
                                {isAr ? `أؤكد أن عمري ${ADULT_MIN_AGE} سنة أو أكثر.` : `I confirm I am ${ADULT_MIN_AGE} or older.`}
                                <span className="block text-xs text-muted-foreground mt-0.5">{isAr ? 'أصغر؟ يفتح وليّ أمرك حساب "لأسرتي" ويسجّلك.' : 'Younger? A parent opens a family account for you.'}</span>
                              </span>
                            </label>
                          ) : (
                            <div className="pt-1">
                              <label htmlFor="signup-guardian-age" className="block text-sm font-semibold text-foreground mb-1.5">
                                {isAr ? 'عمرك (وليّ الأمر)' : 'Your age (parent or guardian)'}
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
                                      ? (isAr ? `يجب أن يكون عمر وليّ الأمر ${GUARDIAN_MIN_AGE} سنة أو أكثر ليفتح حساب أسرة.` : `A guardian must be ${GUARDIAN_MIN_AGE} or over to open a family account.`)
                                      : (isAr ? `وليّ الأمر ${GUARDIAN_MIN_AGE} سنة أو أكثر.` : `Guardians must be ${GUARDIAN_MIN_AGE} or over.`)}
                                  </p>
                                );
                              })()}
                            </div>
                          )}
                        </fieldset>
                      )}


                      {isSignup && (
                        <div className="auth-half">
                          <label htmlFor="auth-name" className="block text-sm font-semibold text-foreground mb-1.5">
                            {accountType === 'family' ? (isAr ? 'اسم وليّ الأمر' : 'Parent or guardian name') : (isAr ? 'اسمك' : 'Your name')}
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

                      {/* NX-16, P4-025: a child with a code from a parent starts here, before any email field. */}
                      {view === 'login' && (
                        <button
                          type="button"
                          onClick={() => { onClose(); navigate('/kid'); }}
                          className="w-full min-h-12 px-4 rounded-2xl border-2 border-[var(--teal)] text-[var(--teal)] font-bold text-base cursor-pointer hover:bg-[var(--teal)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
                          data-testid="kid-code-entry"
                        >
                          {isAr ? 'معايا كود من بابا أو ماما' : 'I have a code from my parent'}
                        </button>
                      )}
                      {view !== 'update-password' && (
                        <div className={isSignup ? 'auth-half' : undefined}>
                          <label htmlFor="auth-email" className="block text-sm font-semibold text-foreground mb-1.5">
                            {isAr ? 'البريد الإلكتروني' : 'Email'}
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
                            <p id="auth-password-hint" className="mt-1.5 text-xs text-muted-foreground">{isAr ? '٦ أحرف على الأقل.' : 'At least 6 characters.'}</p>
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

                      {showTabs && (
                        <>
                          <div className="auth-divider">{isAr ? 'أو' : 'or'}</div>
                          {googleButton}
                        </>
                      )}
                    </form>
                    )}


                    {(view === 'forgot' || view === 'update-password') && (
                      <p className="mt-5 text-center text-sm">
                        <button type="button" onClick={() => setView('login')} className="text-[var(--teal)] font-semibold hover:underline cursor-pointer">
                          {isAr ? 'العودة إلى تسجيل الدخول' : 'Back to sign in'}
                        </button>
                      </p>
                    )}
                  </div>
                </>
            )}
              </AuthCard>
            </EntranceRoom>
          </motion.div>
          </FocusTrap>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
