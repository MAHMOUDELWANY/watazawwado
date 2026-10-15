import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useTeacherAuth } from '../lib/auth';
import { useT } from '../lib/language';
import { clearAuthLinkType } from '../lib/supabase';

/**
 * A new teacher opens the invitation email and lands here already signed in by the link.
 * They choose a password so they can sign in again later from /staff/login on any device.
 */
export default function StaffSetPasswordPage() {
  const { t, isAr } = useT();
  const navigate = useNavigate();
  const { user, loading, updatePassword } = useTeacherAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t('Use at least 8 characters.', 'استخدم 8 حروف أو أرقام على الأقل.'));
      return;
    }
    if (password !== confirm) {
      setError(t('The two passwords are different.', 'كلمتين السر مش زي بعض.'));
      return;
    }
    setBusy(true);
    const { success, error: err } = await updatePassword(password);
    setBusy(false);
    if (!success) {
      setError(err || t('Could not save the password. Please try again.', 'تعذر حفظ كلمة السر. حاول تاني.'));
      return;
    }
    clearAuthLinkType();
    navigate('/staff/agreement', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full glass-dialog rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo variant="large" className="mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold">{t('Choose your password', 'اختار كلمة السر بتاعتك')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('You will use it with your email to sign in from any device.', 'هتستخدمها مع إيميلك عشان تدخل من أي جهاز.')}
          </p>
        </div>

        {!loading && !user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('This invitation link has expired or was already used. Ask the admin for a new one, or use "Forgot your password?" on the sign-in page.', 'رابط الدعوة انتهى أو اتستخدم قبل كده. اطلب دعوة جديدة من الإدارة، أو استخدم "نسيت كلمة السر؟" في صفحة الدخول.')}
            </p>
            <Link to="/staff/login" className="inline-flex px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold">
              {t('Go to sign in', 'روح لصفحة الدخول')}
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {user?.email && (
              <p className="text-sm text-center" dir="ltr">{user.email}</p>
            )}
            <div>
              <Label htmlFor="new-password" className="block text-sm font-semibold mb-1.5">{t('New password', 'كلمة السر الجديدة')}</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-accent absolute start-3.5 top-3.5 pointer-events-none" />
                <Input
                  id="new-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-10 pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute end-3 top-3 text-muted-foreground cursor-pointer"
                  aria-label={show ? t('Hide password', 'إخفاء كلمة السر') : t('Show password', 'إظهار كلمة السر')}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password" className="block text-sm font-semibold mb-1.5">{t('Type it again', 'اكتبها تاني')}</Label>
              <Input
                id="confirm-password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" isLoading={busy || loading} className="w-full">
              {t('Save and continue', 'احفظ وكمّل')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
