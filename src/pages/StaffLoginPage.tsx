import { BrandLogo } from '../components/ui/BrandLogo';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { BrandLoader } from '../components/ui/BrandLoader';
import { useNavigate, Link } from 'react-router-dom';
import { useTeacherAuth } from '../lib/auth';

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
      const { success, role, error: authError } = await signIn(cleanEmail, password, 'teacher');
      
      if (!success) {
        setError(authError || 'Authentication failed. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      // Check if this account has teacher or super_admin role authorized by the server
      if (role !== 'teacher' && role !== 'super_admin') {
        await signOut();
        setError('This area is reserved for teaching staff. Please use the Learning Home to access your student account.');
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Link */}
      <div className="max-w-md w-full mx-auto mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ustadh Mahmoud Homepage</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto glass-dialog rounded-3xl p-8 sm:p-10"
      >
        <div className="text-center mb-8">
<BrandLogo variant="large" className="mx-auto mb-5" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/30 text-accent mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Teaching Staff Login
          </h1>
          <p className="mt-2 text-sm sm:text-sm text-muted-foreground">
            Secure workspace access for Ustadh Mahmoud & authorized administrators.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Teacher Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-accent absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-accent absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <BrandLoader size="inline" className="scale-75" />
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

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <span>Are you an active student? </span>
          <Link
            to="/student"
            className="font-semibold text-primary hover:underline"
          >
            Go to Learning Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

