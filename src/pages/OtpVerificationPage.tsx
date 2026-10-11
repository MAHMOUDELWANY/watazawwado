import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../components/ui/BrandLogo';
import { OtpVerificationCard } from '../components/auth/OtpVerificationCard';
import { useTeacherAuth } from '../lib/auth';
import { useAppLanguage } from '../lib/language';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function OtpVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, user } = useTeacherAuth();
  const { lang, isAr, toggleLanguage } = useAppLanguage();

  // Extract email from URL query or location state or active user
  const queryParams = new URLSearchParams(location.search);
  const initialEmail =
    queryParams.get('email') ||
    (location.state as any)?.email ||
    user?.email ||
    '';

  const handleVerify = async (code: string, targetEmail: string) => {
    return await verifyOtp(targetEmail, code, 'signup');
  };

  const handleResend = async (targetEmail: string) => {
    return await resendOtp(targetEmail, 'signup');
  };

  const handleSuccess = () => {
    navigate('/student', { replace: true });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/student?auth=login');
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden select-none"
    >
      {/* ── AMBIENT 4-COLOR HERITAGE AURAS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Teal Aura */}
        <div
          className="absolute -top-32 -end-32 w-96 h-96 rounded-full opacity-35 dark:opacity-25"
          style={{
            background: 'radial-gradient(circle, #087D91 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Bottom Crimson Aura */}
        <div
          className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full opacity-30 dark:opacity-20"
          style={{
            background: 'radial-gradient(circle, #C51F24 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Center-Left Terracotta Subtle Wash */}
        <div
          className="absolute top-1/2 -start-48 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 dark:opacity-15"
          style={{
            background: 'radial-gradient(circle, #8B4935 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 group cursor-pointer">
          <BrandLogo variant="standard" />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-thmanyah-sans text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAr ? (
            <>
              <span>العودة للرئيسية</span>
              <ArrowLeft className="w-4 h-4" />
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </>
          )}
        </Link>
      </header>

      {/* ── MAIN VERIFICATION CARD ── */}
      <main className="relative z-10 w-full px-4 py-8 sm:py-12 flex items-center justify-center">
        <OtpVerificationCard
          initialEmail={initialEmail}
          onVerify={handleVerify}
          onResend={handleResend}
          onSuccess={handleSuccess}
          onBack={handleBack}
          lang={lang}
          onToggleLang={toggleLanguage}
          variant="page"
        />
      </main>

      {/* ── FOOTER TRUST BADGE ── */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs font-thmanyah-sans text-muted-foreground/70">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-surface-subtle/40 backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>
            {isAr
              ? 'تشفير آمن بنسبة 100٪ • منصة وتزودوا لتعليم القرآن واللغة العربية'
              : '100% Encrypted & Secure • Watazawwado Platform for Quran & Arabic Studies'}
          </span>
        </div>
      </footer>
    </div>
  );
}
