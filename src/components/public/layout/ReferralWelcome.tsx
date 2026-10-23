import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Gift, X, ArrowRight } from 'lucide-react';
import { readReferral } from '../../../lib/leadSource';

const DISMISS_KEY = 'wz_ref_banner_closed';

/**
 * A friend's invite link (?ref=CODE): a small gift card in the lower corner, so the page stays visible (owner,
 * 2026-10-23). Start goes straight to creating the account; the code is already stored by leadSource and the credit is
 * added on the server when the new account finishes onboarding (server/routes/growth.ts).
 */
export function ReferralWelcome({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [info, setInfo] = useState<{ firstName: string | null; friendCredit: number } | null>(null);

  useEffect(() => {
    const code = readReferral();
    if (!code) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === code) return;
    } catch { /* storage blocked */ }
    let cancelled = false;
    // A short pause so the page is seen first and the card arrives as a welcome, not a wall.
    const t = window.setTimeout(() => {
      fetch(`/api/public/referral/${encodeURIComponent(code)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d?.valid && Number(d.friendCredit) > 0) setInfo({ firstName: d.firstName, friendCredit: Number(d.friendCredit) });
        })
        .catch(() => {});
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  const close = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, readReferral() || '');
    } catch { /* storage blocked */ }
    setInfo(null);
  };

  const amount = info ? `$${info.friendCredit.toFixed(2).replace(/\.00$/, '')}` : '';
  const who = info?.firstName || (isAr ? 'صاحبك' : 'Your friend');

  return (
    <AnimatePresence>
      {info && (
        <motion.aside
          dir={isAr ? 'rtl' : 'ltr'}
          role="dialog"
          aria-label={isAr ? 'دعوة من صاحبك' : 'An invite from your friend'}
          className="fixed bottom-4 start-4 end-4 z-40 sm:end-auto sm:w-[360px]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-[22px] glass-dialog border border-secondary/30 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]">
            <span className="pointer-events-none absolute -top-10 -end-10 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" aria-hidden="true" />
            <button type="button" onClick={close} aria-label={isAr ? 'إغلاق' : 'Close'} className="absolute top-2.5 end-2.5 rounded-lg p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3 pe-6">
              <motion.span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
                animate={reduce ? undefined : { rotate: [0, -10, 10, -6, 0] }} transition={{ duration: 1.2, delay: 0.6 }} aria-hidden="true">
                <Gift className="w-5 h-5" />
              </motion.span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-display text-base font-bold leading-snug text-foreground">
                  {isAr ? `${who} دعاك لوتزودوا` : `${who} invited you`}
                </p>
                <p className="text-sm leading-snug text-muted-foreground">
                  {isAr ? <>أول حصة تجريبية مجانًا، و<b className="text-foreground">{amount}</b> رصيد لأول حجز.</> : <>Your first trial lesson is free, plus <b className="text-foreground">{amount}</b> credit for your first booking.</>}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student?auth=signup')}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_12px_26px_-14px_rgba(197,31,36,0.8)] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isAr ? 'ابدأ وأنشئ حسابك' : 'Start: create my account'} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
