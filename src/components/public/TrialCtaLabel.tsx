import { useLaunch } from '../../lib/launch';

/** The main call to action: the free trial while sign-up is open, the waitlist while it opens in waves. */
export function TrialCtaLabel({ isEn }: { isEn: boolean }) {
  const { signupMode } = useLaunch();
  if (signupMode === 'waitlist') return <>{isEn ? 'Pack your zaad' : 'جهّز زادك'}</>;
  return <>{isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}</>;
}
