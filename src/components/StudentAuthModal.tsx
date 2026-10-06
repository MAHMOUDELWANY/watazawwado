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
  const { user, signIn, signUp, signInWithGoogle, verifyOtp, resendOtp, resetPassword, updatePassword, signOut } = useTeacherAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isOpen && view === 'verify') {
      onClose();
      navigate('/student');
    }
  }, [user, isOpen, view, navigate, onClose]);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setError(res.error || (lang === 'ar' ? 'فشل تسجيل الدخول بحساب Google.' : 'Failed to sign in with Google.'));
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('type=recovery') || hash === '#reset-password') {
        setView('update-password');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
              lang === 'ar'
                ? 'هذا الحساب مخصص للكادر التعليمي. يرجى تسجيل الدخول عبر بوابة المعلم.'
                : 'This is a Teaching Staff account. Teaching staff must sign in through the Staff Login page.'
            );
            return;
          }
          onClose();
          navigate('/student');
        } else {
          setError(authError || 'Failed to sign in.');
        }
      } else if (view === 'signup') {
        const { success, error: authError } = await signUp(email, password, name);
        if (success) {
          setSuccess('Verification email sent! Please check your inbox.');
          setView('verify');
        } else {
          setError(authError || 'Failed to create account.');
        }
      } else if (view === 'verify') {
        const { success, error: authError } = await verifyOtp(email, otp, 'signup');
        if (success) {
          setSuccess('Email verified successfully. Logging you in...');
          const { success: loginSuccess, error: loginError } = await signIn(email, password, 'student');
          if (loginSuccess) {
            setTimeout(() => {
              onClose();
              navigate('/student');
            }, 1000);
          } else {
            setError(loginError || 'Failed to log in after verification. Please log in manually.');
            setView('login');
          }
        } else {
          setError(authError || 'Invalid verification code.');
        }
      } else if (view === 'forgot') {
        const { success, error: authError } = await resetPassword(email);
        if (success) {
          setSuccess('Password reset link sent to your email.');
          setTimeout(() => setView('login'), 3000);
        } else {
          setError(authError || 'Failed to send reset link.');
        }
      } else if (view === 'update-password') {
        const { success, error: authError } = await updatePassword(password);
        if (success) {
          setSuccess('Password updated successfully! Redirecting...');
          setTimeout(() => {
            onClose();
            navigate('/student');
          }, 1500);
        } else {
          setError(authError || 'Failed to update password.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
              {view === 'login' ? 'Student Login' : view === 'signup' ? 'Create Account' : view === 'verify' ? 'Verify Email' : view === 'forgot' ? 'Reset Password' : 'Set New Password'}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {view === 'login' 
                ? 'Welcome back to your learning journey.' 
                : view === 'signup' 
                ? 'Join to manage your lessons and progress.' 
                : view === 'verify' ? (lang === 'ar' ? 'أدخل رمز التحقق (6 أرقام) أو اضغط على رابط التأكيد في إيميلك.' : 'Enter the 6-digit code or click the confirmation link in your email.')
                : view === 'forgot'
                ? 'Enter your email to receive a reset link.'
                : 'Enter your new password below.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all"
                    placeholder="John Doe"
                  />
                </div></div>
            )}

            {view === 'verify' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all tracking-widest text-center"
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
                          setSuccess('A new verification code has been sent to your email.');
                        } else {
                          setError(resendError || 'Failed to resend code.');
                        }
                      } catch (err: any) {
                        setError(err.message || 'An unexpected error occurred.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}

            {view !== 'update-password' && view !== 'verify' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div></div>
            )}

            {view !== 'forgot' && view !== 'verify' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  {view === 'update-password' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border glass-surface focus:glass-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {view === 'login' && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}</div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                {error}</div>
            )}
            
            {success && (
              <div className="p-3 bg-success/10 border border-success/20 text-success text-sm rounded-xl">
                {success}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 btn-primary-material text-primary-foreground rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <BrandLoader size="inline" className="scale-75" />
              ) : view === 'login' ? (
                'Sign In'
              ) : view === 'signup' ? (
                'Create Account'
              ) : view === 'verify' ? (
                'Verify Email'
              ) : view === 'forgot' ? (
                'Send Reset Link'
              ) : (
                'Update Password'
              )}
            </button>

            {(view === 'login' || view === 'signup') && (
              <>
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>
                  <span className="relative px-3 bg-surface-warm/80 dark:bg-surface/80 text-xs text-muted-foreground uppercase tracking-wider backdrop-blur-sm rounded-full">
                    {lang === 'ar' ? 'أو' : 'OR'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl border border-border/80 glass-surface hover:glass-card hover:border-primary/40 text-foreground text-sm font-medium transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50"
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
                    {lang === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google'}
                  </span>
                </button>
              </>
            )}

          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {view === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            ) : view === 'signup' || view === 'verify' ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Remember your password?{' '}
                <button onClick={() => setView('login')} className="text-primary font-medium hover:underline">
                  Sign in
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


