import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authedJson } from '../../lib/authedJson';
import StudentPackagesPage from './StudentPackagesPage';
import StudentPaymentsPage from './StudentPaymentsPage';
import { PendingPaymentCard } from '../components/PendingPaymentCard';

/**
 * My wallet (owner decision D3, 2026-10-28): one place for everything money. At the top what the learner can use
 * (package lessons, lesson credits from cancelled lessons, account balance from invites and codes), then two tabs:
 * packages & credits, and payments (including anything waiting to be paid). Replaces the separate Packages and
 * Payments pages; their old addresses open the matching tab.
 */

type Tab = 'packages' | 'payments';

interface WalletSummary { packageLessons: number; lessonCredits: number; balanceUsd: number }

export async function loadWalletSummary(): Promise<WalletSummary> {
  const [pkg, ref] = await Promise.all([
    authedJson<any>('/api/student/packages').catch(() => null),
    authedJson<any>('/api/student/referral').catch(() => null),
  ]);
  let packageLessons = 0;
  let lessonCredits = 0;
  for (const e of pkg?.entitlements || []) {
    if (e.status !== 'active') continue;
    if (e.isCredit) lessonCredits += e.remainingCredits || 0;
    else packageLessons += e.remainingCredits || 0;
  }
  return { packageLessons, lessonCredits, balanceUsd: Number(ref?.balance || 0) };
}

export function WalletTiles({ summary, isAr, compact = false }: { summary: WalletSummary | null; isAr: boolean; compact?: boolean }) {
  const n = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));
  const tiles = [
    { value: summary ? n(summary.packageLessons) : '…', label: isAr ? 'حصص في باقاتك' : 'Lessons in your packages' },
    { value: summary ? n(summary.lessonCredits) : '…', label: isAr ? 'حصص راجعة من الإلغاء' : 'Lesson credits (cancelled lessons)' },
    { value: summary ? `$${summary.balanceUsd.toFixed(summary.balanceUsd % 1 ? 2 : 0)}` : '…', label: isAr ? 'رصيد حسابك (دعوات وأكواد)' : 'Account balance (invites, codes)' },
  ];
  return (
    <div className={`grid grid-cols-3 gap-2 ${compact ? '' : 'sm:gap-3'}`} data-testid="wallet-tiles">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl bg-surface border border-border p-3 sm:p-4 grid gap-1 content-start">
          <span className={`font-display ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} text-foreground tabular-nums`}>{t.value}</span>
          <span className="text-xs sm:text-sm text-muted-foreground leading-snug">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function StudentWalletPage({ lang = 'en', session }: { lang?: 'en' | 'ar'; session?: any }) {
  const isAr = lang === 'ar';
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'payments' ? 'payments' : 'packages';
  const [summary, setSummary] = useState<WalletSummary | null>(null);

  useEffect(() => { loadWalletSummary().then(setSummary).catch(() => setSummary({ packageLessons: 0, lessonCredits: 0, balanceUsd: 0 })); }, []);

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    p.set('tab', next);
    setParams(p, { replace: true });
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'packages', label: isAr ? 'الباقات والرصيد' : 'Packages & credits' },
    { id: 'payments', label: isAr ? 'المدفوعات' : 'Payments' },
  ];

  return (
    <div className="space-y-5 pb-12" data-testid="student-wallet">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'محفظتي' : 'My wallet'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? 'رصيدك، باقاتك، وأي دفع مستني منك، في مكان واحد.' : 'Your balance, your packages and anything waiting to be paid, in one place.'}
          </p>
        </div>
        <Link to="/student/book" className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl bg-[#0A2E35] text-white text-sm font-semibold focus-ring w-full sm:w-auto">
          {isAr ? 'احجز حصة' : 'Book a lesson'}
        </Link>
      </div>

      <PendingPaymentCard lang={lang} />
      <WalletTiles summary={summary} isAr={isAr} />
      {summary && summary.balanceUsd > 0 && (
        <p className="text-sm text-muted-foreground">
          {isAr ? 'رصيد حسابك بيتخصم لوحده من أي دفع جاي، وبيظهر قبل ما تدفع.' : 'Your account balance comes off your next payment automatically; you see it before you pay.'}
        </p>
      )}

      <div role="tablist" aria-label={isAr ? 'المحفظة' : 'Wallet'} className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 px-4 -mb-px border-b-2 text-sm font-semibold cursor-pointer focus-ring ${tab === t.id ? 'border-[#0A2E35] text-foreground dark:border-teal' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'packages' ? <StudentPackagesPage lang={lang} session={session} embedded /> : <StudentPaymentsPage lang={lang} session={session} embedded />}
      </div>
    </div>
  );
}
