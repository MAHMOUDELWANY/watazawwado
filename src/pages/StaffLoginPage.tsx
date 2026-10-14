import { BrandLogo } from '../components/ui/BrandLogo';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft, Eye, EyeOff, Globe } from 'lucide-react';
import { BrandSpinner } from '../components/ui/BrandLoader';
import { useNavigate, Link } from 'react-router-dom';
import { useTeacherAuth } from '../lib/auth';
import { useT } from '../lib/language';

export default function StaffLoginPage() {
  const { t, isAr, toggleLanguage } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, isTeacherAuthenticated, signOut, resetPassword } = useTeacherAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isTeacherAuthenticated) navigate('/dashboard', { replace: true });
  }, [isTeacherAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      const { success, role, error: authError } = await signIn(email.toLowerCase().trim(), password, 'teacher');
      if (!success) {
        setError(authError || t('Wrong email or password.', 'الإيميل أو كلمة السر غلط.'));
        setIsSubmitting(false);
        return;
      }
      if (role !== 'teacher' && role !== 'super_admin') {
        await signOut();
        setError(t('This page is for teachers. Students sign in from the student area.', 'الصفحة دي للمعلمين. الطلاب بيدخلوا من صفحة الطالب.'));
        setIsSubmitting(false);
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || t('Something went wrong. Please try again.', 'حصلت مشكلة، حاول تاني.'));
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError(t('Write your email first, then press "Forgot your password?".', 'اكتب إيميلك الأول، وبعدين اضغط "نسيت كلمة السر؟".'));
      return;
    }
    const { success, error: resetError } = await resetPassword(email);
    if (success) setNotice(t('If this email belongs to a teacher, a link to set a new password is on its way.', 'لو الإيميل ده لمعلم، هيوصله رابط يحدد بيه كلمة سر جديدة.'));
    else setError(resetError || t("Couldn't send the link. Please try again.", 'تعذر إرسال الرابط. حاول تاني.'));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full mx-auto mb-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('Back to the website', 'رجوع للموقع')}</span>
        </Link>
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-surface-subtle cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          {isAr ? 'EN' : 'عربي'}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto glass-dialog rounded-3xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <BrandLogo variant="large" className="mx-auto mb-5" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/30 text-accent mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t('Teacher sign in', 'دخول المعلمين')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('For teachers and admins of Watazawwado.', 'للمعلمين والمديرين في وتزودوا.')}</p>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="mb-6 p-4 rounded-xl bg-success/10 border border-success/30 text-sm text-foreground">{notice}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="staff-email">{t('Email', 'الإيميل')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-accent absolute start-3.5 top-3.5 pointer-events-none" />
              <input
                id="staff-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
                autoComplete="username"
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-foreground" htmlFor="staff-password">{t('Password', 'كلمة السر')}</label>
              <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                {t('Forgot your password?', 'نسيت كلمة السر؟')}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-accent absolute start-3.5 top-3.5 pointer-events-none" />
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full ps-10 pe-11 py-3 rounded-xl border border-border bg-surface-subtle text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('Hide password', 'إخفاء كلمة السر') : t('Show password', 'إظهار كلمة السر')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-warm"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 opacity-70" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl btn-primary-material text-primary-foreground font-medium text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <BrandSpinner size={18} />
                <span>{t('Signing in…', 'جارٍ الدخول…')}</span>
              </>
            ) : (
              <>
                <span>{t('Sign in', 'ادخل')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <span>{t('Are you a student? ', 'إنت طالب؟ ')}</span>
          <Link to="/student" className="font-semibold text-primary hover:underline">{t('Go to the student area', 'روح لصفحة الطالب')}</Link>
        </div>
      </motion.div>
    </div>
  );
}
