import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, User, X } from 'lucide-react';
import { useTeacherAuth } from '../lib/auth'; // it's now AuthProvider
import { useNavigate } from 'react-router-dom';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export function StudentAuthModal({ isOpen, onClose, lang = 'en' }: StudentAuthModalProps) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot' | 'update-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword } = useTeacherAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (view === 'login') {
        const { success, error: authError } = await signIn(email, password);
        if (success) {
          onClose();
          navigate('/student');
        } else {
          setError(authError || 'Failed to sign in.');
        }
      } else if (view === 'signup') {
        const { success, error: authError } = await signUp(email, password, name);
        if (success) {
          setSuccess('Account created successfully. You can now log in.');
          setView('login');
          setPassword('');
        } else {
          setError(authError || 'Failed to create account.');
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 end-4 p-2 text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8">
          <div className="text-center mb-8">
            <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {view === 'login' ? 'Student Login' : view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Reset Password' : 'Set New Password'}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {view === 'login' 
                ? 'Welcome back to your learning journey.' 
                : view === 'signup' 
                ? 'Join to manage your lessons and progress.' 
                : view === 'forgot'
                ? 'Enter your email to receive a reset link.'
                : 'Enter your new password below.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-surface-subtle focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {view !== 'update-password' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-surface-subtle focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            {view !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {view === 'update-password' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-surface-subtle focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {view === 'login' && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
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
              className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : view === 'login' ? (
                'Sign In'
              ) : view === 'signup' ? (
                'Create Account'
              ) : view === 'forgot' ? (
                'Send Reset Link'
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {view === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            ) : view === 'signup' ? (
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
      </div>
    </div>
  );
}
