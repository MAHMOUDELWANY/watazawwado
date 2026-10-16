import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthPage } from '../components/auth/AuthFrame';
import { OtpVerificationCard } from '../components/auth/OtpVerificationCard';
import { useTeacherAuth } from '../lib/auth';
import { useAppLanguage } from '../lib/language';

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
    <AuthPage isAr={isAr}>
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
    </AuthPage>
  );
}
