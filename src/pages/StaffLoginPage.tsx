import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthPage, AuthCard, AuthPortal } from '../components/auth/AuthFrame';
import { useNavigate, Link } from 'react-router-dom';
import { useTeacherAuth } from '../lib/auth';
import { useT } from '../lib/language';
import { markJustSignedIn } from '../components/ui/WelcomeLoader';

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
      const cleanEmail = email.toLowerCase().trim();
      const { success, role, error: authError } = await signIn(cleanEmail, password, 'teacher');
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
      markJustSignedIn();
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
    <AuthPage isAr={isAr} onToggleLang={toggleLanguage}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full flex justify-center">
        <AuthCard>
          <AuthPortal
            title={t('Teachers’ door', 'باب المعلمين')}
            subtitle={t('For the teachers and admins of Watazawwado.', 'للمعلمين والإدارة في وتزودوا.')}
          />

          <div className="px-6 sm:px-8 pt-6 pb-7">
            {error && (
              <div role="alert" className="mb-5 p-3 rounded-[var(--r-2)] bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div role="status" className="mb-5 p-3 rounded-[var(--r-2)] bg-success/10 border border-success/25 text-sm text-foreground">{notice}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="staff-email">{t('Email', 'الإيميل')}</label>
                <div className="relative">
                  <Mail className="auth-field-icon" aria-hidden="true" />
                  <input
                    id="staff-email"
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@example.com"
                    autoComplete="username"
                    className="auth-field text-start"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-foreground" htmlFor="staff-password">{t('Password', 'كلمة السر')}</label>
                  <button type="button" onClick={handleForgotPassword} className="inline-flex items-center min-h-11 text-xs sm:text-sm font-semibold text-[var(--teal)] hover:underline cursor-pointer">
                    {t('Forgot your password?', 'نسيت كلمة السر؟')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="auth-field-icon" aria-hidden="true" />
                  <input
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="auth-field pe-14 text-start"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('Hide password', 'إخفاء كلمة السر') : t('Show password', 'إظهار كلمة السر')}
                    className="absolute end-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg focus-ring"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-[var(--teal)]" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" isLoading={isSubmitting} className="w-full !rounded-full mt-2 gap-2">
                <span>{isSubmitting ? t('Signing in…', 'بندخّلك…') : t('Sign in', 'ادخل')}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />}
              </Button>
            </form>

            <p className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
              <span>{t('Are you a student? ', 'إنت طالب؟ ')}</span>
              <Link to="/student" className="inline-flex items-center min-h-11 font-semibold text-[var(--teal)] hover:underline">{t('Go to the student area', 'روح لصفحة الطالب')}</Link>
            </p>
          </div>
        </AuthCard>
      </motion.div>
    </AuthPage>
  );
}
