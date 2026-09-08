import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, ShieldCheck, ArrowRight, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTeacherAuth, APPROVED_TEACHER_EMAILS } from '../lib/auth';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, isTeacherAuthenticated, signOut } = useTeacherAuth();
  const navigate = useNavigate();

  // If already authenticated as teacher, redirect immediately
  React.useEffect(() => {
    if (isTeacherAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isTeacherAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const { success, error: authError } = await signIn(cleanEmail, password);
      
      if (!success) {
        setError(authError || 'Authentication failed. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Check if this email is an approved teacher email
      if (!APPROVED_TEACHER_EMAILS.includes(cleanEmail)) {
        await signOut();
        setError('This portal is reserved for teaching staff. Please use the Student Portal to access your learner account.');
        setIsSubmitting(false);
        return;
      }

      // Success
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-[#1E1923] text-[#30332F] dark:text-[#F8F6F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Link */}
      <div className="max-w-md w-full mx-auto mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A827B] hover:text-[#30332F] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ustadh Mahmoud Homepage</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto bg-white dark:bg-[#251F2C] border border-[#E2DDD5] dark:border-[#3E3545] rounded-3xl p-8 sm:p-10 shadow-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6F907D]/15 text-[#6F907D] dark:text-[#8FAE9B] mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#30332F] dark:text-[#F8F6F0]">
            Teaching Staff Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#626A64] dark:text-[#D5D0CA]">
            Secure workspace access for Ustadh Mahmoud & authorized administrators.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
              Teacher Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-[#30332F] dark:text-[#F8F6F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#30332F] dark:text-[#F8F6F0] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8FAE9B] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DDD5] dark:border-[#3E3545] bg-[#FAF8F5] dark:bg-[#2D2635] text-[#30332F] dark:text-[#F8F6F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#6F907D] hover:bg-[#557161] text-white font-medium text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Teacher Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E2DDD5] dark:border-[#3E3545] text-center text-xs text-[#7A827B] dark:text-[#A69FA8]">
          <span>Are you an active student? </span>
          <Link
            to="/student"
            className="font-semibold text-[#6F907D] dark:text-[#8FAE9B] hover:underline"
          >
            Go to Student Portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
