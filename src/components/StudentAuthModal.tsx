import { BrandLogo } from './ui/BrandLogo';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, X } from 'lucide-react';
import { BrandLoader } from './ui/BrandLoader';
import { useTeacherAuth } from '../lib/auth'; // it's now AuthProvider
import { useNavigate } from 'react-router-dom';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export function StudentAuthModal({ isOpen, onClose, lang = 'en' }: StudentAuthModalProps) {
  const [view, setView] = useState<'login' | 'signup' | 'verify' | 'forgot' | 'update-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, verifyOtp, resendOtp, resetPassword, updatePassword, signOut } = useTeacherAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('type=recovery') || hash === '#reset-password') {
        setView('update-password');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
        const { success, error: authError } = await signUp(email, password, name);
        if (success) {
          setSuccess(isAr ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني! تفقد صندوق الوارد.' : 'Verification email sent! Please check your inbox.');
          setView('verify');
        } else {
          setError(authError ? (isAr ? 'تعذر إنشاء الحساب، قد يكون البريد مستخدماً بالفعل.' : authError) : (isAr ? 'تعذر إنشاء الحساب.' : 'Failed to create account.'));
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
          setError(isAr ? 'تعذر تحديث كلمة المرور.' : (authError || 'Failed to update password.'));
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-dialog rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl"
          >
            <button
              onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 end-4 p-2 text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

          <div className="p-7 sm:p-8">
            <div className="text-center mb-8">
              <BrandLogo variant="large" className="mx-auto mb-5" />
              <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                {view === 'login' 
                  ? (isAr ? 'تسجيل دخول الطالب' : 'Student Login')
                  : view === 'signup' 
                  ? (isAr ? 'إنشاء حساب جديد' : 'Create Account')
                  : view === 'verify' 
                  ? (isAr ? 'تأكيد البريد الإلكتروني' : 'Verify Email')
                  : view === 'forgot' 
                  ? (isAr ? 'استعادة كلمة المرور' : 'Reset Password')
                  : (isAr ? 'تعيين كلمة مرور جديدة' : 'Set New Password')}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {view === 'login' 
                  ? (isAr ? 'مرحباً بك مجدداً في مساحتك التعليمية الخاصة.' : 'Welcome back to your learning journey.') 
                  : view === 'signup' 
                  ? (isAr ? 'انضم لإدارة دروسك ومتابعة تقدمك وجداولك.' : 'Join to manage your lessons and progress.') 
                  : view === 'verify'
                  ? (isAr ? 'أدخل رمز التحقق المكون من 6 أرقام المرسل لبريدك.' : 'Enter the 6-digit code sent to your email.')
                  : view === 'forgot'
                  ? (isAr ? 'أدخل بريدك الإلكتروني لاستلام رابط تعيين كلمة المرور.' : 'Enter your email to receive a reset link.')
                  : (isAr ? 'أدخل كلمة المرور الجديدة في الحقل أدناه.' : 'Enter your new password below.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
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

              {view === 'verify' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {isAr ? 'رمز التحقق' : 'Verification Code'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-foreground text-sm transition-all tracking-widest text-center font-mono"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (isSubmitting) return;
                        try {
                          setIsSubmitting(true);
                          setError('');
                          setSuccess('');
                          const { success: resendSuccess, error: resendError } = await resendOtp(email, 'signup');
                          if (resendSuccess) {
                            setSuccess(isAr ? 'تم إرسال رمز تحقق جديد إلى بريدك.' : 'A new verification code has been sent to your email.');
                          } else {
                            setError(resendError || (isAr ? 'تعذر إعادة إرسال الرمز.' : 'Failed to resend code.'));
                          }
                        } catch (err: any) {
                          setError(err.message || (isAr ? 'حدث خطأ أثناء الإرسال.' : 'An unexpected error occurred.'));
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="text-xs text-teal-700 dark:text-teal-300 hover:underline disabled:opacity-50"
                    >
                      {isAr ? 'إعادة إرسال الرمز' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}

              {view !== 'update-password' && view !== 'verify' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
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

              {view !== 'forgot' && view !== 'verify' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    {view === 'update-password' 
                      ? (isAr ? 'كلمة المرور الجديدة' : 'New Password') 
                      : (isAr ? 'كلمة المرور' : 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-foreground text-sm transition-all"
                      placeholder="••••••••"
                    />
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

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
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
                  <BrandLoader size="inline" className="scale-75" />
                ) : view === 'login' ? (
                  isAr ? 'تسجيل الدخول' : 'Sign In'
                ) : view === 'signup' ? (
                  isAr ? 'إنشاء الحساب' : 'Create Account'
                ) : view === 'verify' ? (
                  isAr ? 'تأكيد الرمز' : 'Verify Email'
                ) : view === 'forgot' ? (
                  isAr ? 'إرسال رابط الاستعادة' : 'Send Reset Link'
                ) : (
                  isAr ? 'تحديث كلمة المرور' : 'Update Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {view === 'login' ? (
                <p>
                  {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account?"}{' '}
                  <button onClick={() => setView('signup')} className="text-teal-700 dark:text-teal-300 font-semibold hover:underline">
                    {isAr ? 'أنشئ حسابك الآن' : 'Sign up'}
                  </button>
                </p>
              ) : view === 'signup' || view === 'verify' ? (
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
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}


