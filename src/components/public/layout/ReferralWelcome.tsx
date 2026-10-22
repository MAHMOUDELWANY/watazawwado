import React, { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { readReferral } from '../../../lib/leadSource';

const DISMISS_KEY = 'wz_ref_banner_closed';

/**
 * A friend's invite link (?ref=CODE): one quiet line under the menu saying who invited them and what they get.
 * The credit itself is added on the server when the new account finishes onboarding (server/routes/growth.ts).
 */
export function ReferralWelcome({ lang, onStart }: { lang: 'ar' | 'en'; onStart: () => void }) {
  const isAr = lang === 'ar';
  const [info, setInfo] = useState<{ firstName: string | null; friendCredit: number } | null>(null);

  useEffect(() => {
    const code = readReferral();
    if (!code) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === code) return;
    } catch { /* storage blocked */ }
    let cancelled = false;
    fetch(`/api/public/referral/${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.valid && Number(d.friendCredit) > 0) setInfo({ firstName: d.firstName, friendCredit: Number(d.friendCredit) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  const close = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, readReferral() || '');
    } catch { /* storage blocked */ }
    setInfo(null);
  };

  const amount = `$${info.friendCredit.toFixed(2).replace(/\.00$/, '')}`;
  const who = info.firstName || (isAr ? 'صاحبك' : 'Your friend');

  return (
    // Floats just under the fixed menu bar (80px), above the page but below the menu.
    <div className="fixed inset-x-0 top-[5.75rem] z-30 flex justify-center px-4 pointer-events-none" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="pointer-events-auto w-full max-w-3xl flex items-center gap-3 rounded-2xl glass-dialog border border-secondary/30 px-4 py-2.5 text-sm shadow-lg animate-fade-in">
        <Gift className="w-4 h-4 text-secondary shrink-0" />
        <p className="flex-1 min-w-0 leading-snug">
          {isAr
            ? <>{who} دعاك لوتزودوا. أول حصة تجريبية مجانًا، وهتلاقي <b>{amount}</b> رصيد في حسابك لأول حجز.</>
            : <>{who} invited you to Watazawwado. Your first trial lesson is free, and <b>{amount}</b> credit waits in your account for your first booking.</>}
        </p>
        <button type="button" onClick={onStart} className="shrink-0 font-semibold text-primary hover:underline underline-offset-4">
          {isAr ? 'ابدأ' : 'Start'}
        </button>
        <button type="button" onClick={close} aria-label={isAr ? 'إغلاق' : 'Close'} className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
