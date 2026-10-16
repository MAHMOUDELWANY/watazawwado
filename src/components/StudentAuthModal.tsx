import { BrandLogo } from './ui/BrandLogo';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Users, X, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { BrandLoader, BrandSpinner } from './ui/BrandLoader';
import { useTeacherAuth } from '../lib/auth'; // it's now AuthProvider
import { LEAKED_PASSWORD_MESSAGE } from '../lib/pwnedPassword';
import { useNavigate } from 'react-router-dom';
import { OtpVerificationCard } from './auth/OtpVerificationCard';
import { markJustSignedIn } from './ui/WelcomeLoader';
import { SubjectMark } from './onboarding/SubjectMark';
import { ADULT_MIN_AGE, GUARDIAN_MIN_AGE, MAX_AGE, parseAge, signupAgeProblem, SIGNUP_CHOICE_KEY } from '../lib/ageRules';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
  initialView?: 'login' | 'signup' | 'verify' | 'forgot' | 'update-password';
}

export function StudentAuthModal({ isOpen, onClose, lang = 'en', initialView = 'login' }: StudentAuthModalProps) {
  const [view, setView] = useState<'login' | 'signup' | 'verify' | 'forgot' | 'update-password'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Sign-up age gate (owner decision 2026-10-16): checked before the account (and its email) is created.
  const [accountType, setAccountType] = useState<'self' | 'family'>('self');
  const [confirmedAdult, setConfirmedAdult] = useState(false);
  const [guardianAge, setGuardianAge] = useState('');
  const { user, signIn, signUp, signInWithGoogle, verifyOtp, resendOtp, resetPassword, updatePassword, signOut } = useTeacherAuth();
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
      setError(res.error || (isAr ? 'فشل تسجيل الدخول بحساب Google.' : 'Failed to sign in with Google.'));
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
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
        if (success) {
          if (role === 'teacher') {
            await signOut();
            setError(
              isAr
                ? 'هذا الحساب مخصص للكادر التعليمي. يرجى تسجيل الدخول عبر بوابة المعلم.'
                : 'This is a Teaching Staff account. Teaching staff must sign in through the Staff Login page.'
            );
            return;
          }
          markJustSignedIn();
          onClose();
          navigate('/student');
        } else {
          setError(
            authError 
              ? (isAr ? 'بيانات الدخول غير صحيحة، يرجى التحقق من البريد وكلمة المرور.' : authError)
              : (isAr ? 'تعذر تسجيل الدخول، يرجى المحاولة لاحقاً.' : 'Failed to sign in.')
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
          setSuccess(isAr ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني! تفقد صندوق الوارد.' : 'Verification email sent! Please check your inbox.');
          setView('verify');
        } else {
          setError(authError === LEAKED_PASSWORD_MESSAGE ? leakedPasswordText : authError ? (isAr ? 'تعذر إنشاء الحساب، قد يكون البريد مستخدماً بالفعل.' : authError) : (isAr ? 'تعذر إنشاء الحساب.' : 'Failed to create account.'));
        }
      } else if (view === 'verify') {
        const { success, error: authError } = await verifyOtp(email, otp, 'signup');
        if (success) {
          setSuccess(isAr ? 'تم التحقق من بريدك بنجاح! جاري تسجيل دخولك...' : 'Email verified successfully. Logging you in...');
          const { success: loginSuccess, error: loginError } = await signIn(email, password, 'student');
          if (loginSuccess) {
            setTimeout(() => {
              onClose();
              navigate('/student');
            }, 1000);
          } else {
            setError(loginError || (isAr ? 'يرجى تسجيل الدخول يدوياً.' : 'Failed to log in after verification. Please log in manually.'));
            setView('login');
          }
        } else {
          setError(isAr ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' : (authError || 'Invalid verification code.'));
        }
      } else if (view === 'forgot') {
        const { success, error: authError } = await resetPassword(email);
        if (success) {
          setSuccess(isAr ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' : 'Password reset link sent to your email.');
          setTimeout(() => setView('login'), 3000);
        } else {
          setError(isAr ? 'تعذر إرسال رابط الاستعادة، تأكد من صحة البريد.' : (authError || 'Failed to send reset link.'));
        }
      } else if (view === 'update-password') {
        const { success, error: authError } = await updatePassword(password);
        if (success) {
          setSuccess(isAr ? 'تم تحديث كلمة المرور بنجاح! جاري التحويل...' : 'Password updated successfully! Redirecting...');
          setTimeout(() => {
            onClose();
            navigate('/student');
          }, 1500);
        } else {
          setError(authError === LEAKED_PASSWORD_MESSAGE ? leakedPasswordText : isAr ? 'تعذر تحديث كلمة المرور.' : (authError || 'Failed to update password.'));
        }
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Phones: a bottom sheet that scrolls; tablets: a centred card; desktop sign-up: two panes. */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`glass-dialog rounded-t-[28px] sm:rounded-3xl w-full max-h-[94dvh] overflow-y-auto overscroll-contain relative shadow-2xl ${
              view === 'verify' ? 'sm:max-w-lg' : view === 'signup' ? 'sm:max-w-md lg:max-w-4xl' : 'sm:max-w-md'
            }`}
          >
            <span className="sm:hidden mx-auto mt-2.5 block h-1.5 w-11 rounded-full bg-border" aria-hidden="true" />
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 end-4 p-2 text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-full transition-colors cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {view === 'verify' ? (
              <div className="p-6 sm:p-8">
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
              <div className={view === 'signup' ? 'lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]' : ''}>
              {view === 'signup' && (
                <aside
                  className="hidden lg:flex flex-col justify-center gap-10 p-9 text-white bg-[linear-gradient(160deg,#0A8EA3_0%,#087D91_45%,#06505E_100%)] relative overflow-hidden"
                  aria-hidden="true"
                >
                  <span className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-[#E5A93C]/15 blur-2xl" />
                  <span className="absolute -bottom-28 -start-20 w-72 h-72 rounded-full bg-[#C51F24]/20 blur-2xl" />
                  <div className="relative">
                    <p className="font-display text-3xl leading-[1.8]" dir="rtl" lang="ar">﴿وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ﴾</p>
                    <span className="mt-2 block h-[3px] w-16 rounded-full bg-[#E5A93C]" />
                  </div>
                  <div className="relative flex items-end gap-3">
                    {['quran-reading', 'seerah', 'arabic-foundations'].map((id, i) => (
                      <span key={id} className={i === 1 ? '-translate-y-4' : ''}>
                        <SubjectMark subjectId={id} size={i === 1 ? 92 : 76} className="bg-white/10 ring-1 ring-white/20 shadow-[0_18px_30px_-16px_rgba(0,0,0,.6)]" />
                      </span>
                    ))}
                  </div>
                  <ul className="relative space-y-3 text-sm text-white/90">
                    {(isAr
                      ? ['حصص فردية مع معلم بيعرفك باسمك', 'حصة تجريبية مجانية قبل أي دفع', 'حساب عائلة لكل أولادك في مكان واحد']
                      : ['One-to-one lessons with a teacher who knows you', 'A free trial before any payment', 'One family account for all your children']
                    ).map((line) => (
                      <li key={line} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid place-items-center w-5 h-5 shrink-0 rounded-full bg-white/15"><Check className="w-3 h-3" /></span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
              <div className="p-6 sm:p-8">
            <div className={`text-center ${view === 'signup' ? 'mb-6' : 'mb-8'}`}>
              <BrandLogo variant={view === 'signup' ? 'standard' : 'large'} className="mx-auto mb-4" />
              <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                {view === 'login' 
                  ? (isAr ? 'تسجيل دخول الطالب' : 'Student Login')
                  : view === 'signup' 
                  ? (isAr ? 'إنشاء حساب جديد' : 'Create Account')
                  : view === 'forgot' 
                  ? (isAr ? 'استعادة كلمة المرور' : 'Reset Password')
                  : (isAr ? 'تعيين كلمة مرور جديدة' : 'Set New Password')}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {view === 'login' 
                  ? (isAr ? 'مرحباً بك مجدداً في مساحتك التعليمية الخاصة.' : 'Welcome back to your learning journey.') 
                  : view === 'signup' 
                  ? (isAr ? 'انضم لإدارة دروسك ومتابعة تقدمك وجداولك.' : 'Join to manage your lessons and progress.') 
                  : view === 'forgot'
                  ? (isAr ? 'أدخل بريدك الإلكتروني لاستلام رابط تعيين كلمة المرور.' : 'Enter your email to receive a reset link.')
                  : (isAr ? 'أدخل كلمة المرور الجديدة في الحقل أدناه.' : 'Enter your new password below.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <div role="radiogroup" aria-label={isAr ? 'نوع الحساب' : 'Account type'} className="grid grid-cols-2 gap-2.5">
                  {([
                    { id: 'self' as const, Icon: User, title: isAr ? 'حساب شخصي' : 'For myself', sub: isAr ? `${ADULT_MIN_AGE} سنة وأكبر` : `Aged ${ADULT_MIN_AGE}+` },
                    { id: 'family' as const, Icon: Users, title: isAr ? 'حساب عائلة' : 'Family account', sub: isAr ? 'ولي أمر يسجّل أولاده' : 'A parent enrols children' }
                  ]).map(({ id, Icon, title, sub }) => {
                    const selected = accountType === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => { setAccountType(id); setError(''); }}
                        className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-3.5 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
                          selected ? 'border-[#087D91] bg-[#087D91]/8 text-foreground' : 'border-border/70 glass-surface text-muted-foreground hover:border-[#087D91]/40'
                        }`}
                      >
                        <span className={`grid place-items-center w-9 h-9 rounded-full ${selected ? 'bg-[#087D91] text-white' : 'bg-surface-subtle text-[#087D91] dark:text-teal-300'}`}>
                          <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-bold text-foreground">{title}</span>
                        <span className="text-[11px] leading-tight">{sub}</span>
                        {selected && <Check className="absolute top-2 end-2 w-3.5 h-3.5 text-[#087D91]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {view === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {accountType === 'family' ? (isAr ? 'اسم ولي الأمر' : 'Parent / guardian name') : (isAr ? 'الاسم الكامل' : 'Full Name')}
                  </label>
                  <div className="relative">
                    <User className="absolute z-10 pointer-events-none start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-foreground text-sm transition-all"
                      placeholder={isAr ? 'محمد أحمد' : 'John Doe'}
                    />
                  </div>
                </div>
              )}

              {view !== 'update-password' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute z-10 pointer-events-none start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-foreground text-sm transition-all text-start"
                      placeholder="you@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {view !== 'forgot' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {view === 'update-password' 
                      ? (isAr ? 'كلمة المرور الجديدة' : 'New Password') 
                      : (isAr ? 'كلمة المرور' : 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute z-10 pointer-events-none start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full ps-10 pe-11 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-foreground text-sm transition-all"
                      placeholder={showPassword ? (isAr ? 'اكتب كلمة المرور' : 'Enter password') : '••••••••'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-subtle"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <Eye className="w-4 h-4 opacity-70" />
                      )}
                    </button>
                  </div>
                  {view === 'login' && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-xs sm:text-sm text-teal-700 dark:text-teal-300 hover:underline"
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {view === 'signup' && (accountType === 'self' ? (
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 glass-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmedAdult}
                    onChange={(e) => { setConfirmedAdult(e.target.checked); setError(''); }}
                    className="mt-0.5 w-4.5 h-4.5 shrink-0 accent-[#087D91] cursor-pointer"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    {isAr ? `أؤكد إن سني ${ADULT_MIN_AGE} سنة أو أكتر.` : `I confirm I am ${ADULT_MIN_AGE} or older.`}
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {isAr ? 'أقل من كده؟ ولي أمرك يفتح "حساب عائلة" ويسجّلك.' : 'Younger? A parent opens a family account for you.'}
                    </span>
                  </span>
                </label>
              ) : (
                <div>
                  <label htmlFor="signup-guardian-age" className="block text-sm font-semibold text-foreground mb-1.5">
                    {isAr ? 'سنك (ولي الأمر)' : 'Your age (parent / guardian)'}
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute z-10 pointer-events-none start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
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
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-foreground text-sm transition-all"
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
              ))}

              {error && (
                <div role="alert" className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-success/10 border border-success/20 text-success text-sm rounded-xl">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 btn-primary-material text-primary-foreground rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <BrandSpinner size={18} />
                ) : view === 'login' ? (
                  isAr ? 'تسجيل الدخول' : 'Sign In'
                ) : view === 'signup' ? (
                  isAr ? 'إنشاء الحساب' : 'Create Account'
                ) : view === 'forgot' ? (
                  isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'
                ) : (
                  isAr ? 'تحديث كلمة المرور' : 'Update Password'
                )}
              </button>

            {(view === 'login' || view === 'signup') && (
              <>
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>
                  <span className="relative px-3 bg-surface-warm/80 dark:bg-surface/80 text-xs text-muted-foreground uppercase tracking-wider backdrop-blur-sm rounded-full">
                    {isAr ? 'أو' : 'OR'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl border border-border/80 glass-surface hover:glass-card hover:border-teal-500/40 text-foreground text-sm font-medium transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isAr ? 'المتابعة باستخدام Google' : 'Continue with Google'}
                  </span>
                </button>
              </>
            )}

          </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {view === 'login' ? (
                <p>
                  {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account?"}{' '}
                  <button onClick={() => setView('signup')} className="text-teal-700 dark:text-teal-300 font-semibold hover:underline">
                    {isAr ? 'أنشئ حسابك الآن' : 'Sign up'}
                  </button>
                </p>
              ) : view === 'signup' ? (
                <p>
                  {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                  <button onClick={() => setView('login')} className="text-teal-700 dark:text-teal-300 font-semibold hover:underline">
                    {isAr ? 'تسجيل الدخول' : 'Sign in'}
                  </button>
                </p>
              ) : (
                <p>
                  {isAr ? 'تذكرت كلمة المرور؟' : 'Remember your password?'}{' '}
                  <button onClick={() => setView('login')} className="text-teal-700 dark:text-teal-300 font-semibold hover:underline">
                    {isAr ? 'العودة للدخول' : 'Sign in'}
                  </button>
                </p>
              )}
            </div>
          </div>
          </div>
            )}
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}


