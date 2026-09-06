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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#2A2431] rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-[#362E3B] dark:text-[#F5E6D3]">
              {view === 'login' ? 'Student Login' : view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Reset Password' : 'Set New Password'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm">
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
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#8FAE9B] outline-none text-stone-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {view !== 'update-password' && (
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#8FAE9B] outline-none text-stone-900 dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            {view !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {view === 'update-password' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-[#8FAE9B] outline-none text-stone-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                {view === 'login' && (
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-[#8FAE9B] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
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

          <div className="mt-6 text-center text-sm text-stone-500">
            {view === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="text-[#8FAE9B] font-medium hover:underline">
                  Sign up
                </button>
              </p>
            ) : view === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="text-[#8FAE9B] font-medium hover:underline">
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Remember your password?{' '}
                <button onClick={() => setView('login')} className="text-[#8FAE9B] font-medium hover:underline">
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
