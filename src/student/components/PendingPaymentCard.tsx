import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { authedJson } from '../../lib/authedJson';
import { getBookingPaymentSummary } from '../../lib/paymentStatus';
import { notify, confirmAction } from '../../components/ui/Feedback';
import { StudentPaymentClaimModal } from './StudentPaymentClaimModal';

/**
 * Owner B2 (2026-10-28): a lesson held for payment shows wherever the student looks (home, lessons, wallet,
 * booking), not only inside the booking flow: what it is, until when the time is held, Pay and Let it go.
 * Renders nothing when nothing waits. The hold length and the amount come from the server.
 */
export function PendingPaymentCard({ lang = 'en', handleStripeReturn = true }: { lang?: 'en' | 'ar'; handleStripeReturn?: boolean }) {
  const isAr = lang === 'ar';
  const [items, setItems] = useState<any[]>([]);
  const [paying, setPaying] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [bookings, pay] = await Promise.all([
        authedJson<any[]>('/api/student/bookings'),
        authedJson<any>('/api/student/payments'),
      ]);
      const payments = Array.isArray(pay?.payments) ? pay.payments : [];
      const now = Date.now();
      setItems((Array.isArray(bookings) ? bookings : []).filter((b) =>
        b.status === 'pending'
        && b.paymentPlan === 'pay_now'
        && !b.packageEntitlementId
        && (!b.holdExpiresAt || new Date(b.holdExpiresAt).getTime() > now)
        && getBookingPaymentSummary(b, payments).isUnpaid));
    } catch {
      setItems([]);
    }
  }, []);

  // Back from Stripe on a page without the booking flow: confirm the payment here (the webhook also does).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!handleStripeReturn || !sessionId || params.get('gateway') !== 'stripe' || params.get('target_type') !== 'booking') {
      load();
      return;
    }
    const clean = new URL(window.location.href);
    ['session_id', 'gateway', 'payment_status', 'target_id', 'target_type'].forEach((k) => clean.searchParams.delete(k));
    window.history.replaceState({}, document.title, clean.pathname + clean.search);
    fetch('/api/payments/stripe/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      .then((r) => r.json())
      .then((d) => { if (d?.success) notify(isAr ? 'تم الدفع واتأكدت الحصة.' : 'Paid. Your lesson is confirmed.', 'success'); })
      .catch(() => {})
      .finally(load);
  }, [handleStripeReturn, isAr, load]);

  const release = async (b: any) => {
    const ok = await confirmAction(
      isAr ? 'تسيب الميعاد ده؟ هيتفتح لغيرك ومش هتدفع حاجة.' : 'Let this time go? It opens for others again and you pay nothing.',
      { confirmLabel: isAr ? 'سيبه' : 'Let it go', danger: true }
    );
    if (!ok) return;
    setBusyId(b.id);
    try {
      await authedJson(`/api/student/bookings/${b.id}/release-hold`, { method: 'POST', body: '{}' });
      // An open booking flow holding this lesson drops it (otherwise its checkout says "not awaiting payment").
      window.dispatchEvent(new CustomEvent('watazawwado:hold-released', { detail: b.referenceCode }));
      notify(isAr ? 'اتساب الميعاد.' : 'The time was released.', 'success');
      await load();
    } catch (err: any) {
      notify(err?.message || (isAr ? 'معرفناش نلغيه، جرّب تاني.' : 'Could not release it, please try again.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!items.length) return null;

  return (
    <section aria-label={isAr ? 'مستني الدفع' : 'Waiting for payment'} className="rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:p-5 space-y-3" data-testid="pending-payment-card">
      <h2 className="font-display text-base sm:text-lg font-bold text-foreground">
        {isAr ? 'حصة مستنية الدفع' : items.length > 1 ? `${items.length} lessons waiting for payment` : 'A lesson is waiting for payment'}
      </h2>
      <ul className="space-y-3">
        {items.map((b) => {
          const tz = b.studentTimezone || undefined;
          const when = b.scheduledStart ? DateTime.fromISO(b.scheduledStart, tz ? { zone: tz } : {}).setLocale(isAr ? 'ar' : 'en').toFormat('ccc d LLL, HH:mm') : '';
          const held = b.holdExpiresAt ? DateTime.fromISO(b.holdExpiresAt).setLocale(isAr ? 'ar' : 'en').toFormat('HH:mm') : '';
          const title = isAr ? (b.serviceArabicTitle || b.serviceTitle) : b.serviceTitle;
          return (
            <li key={b.id} className="rounded-xl bg-surface border border-border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{title}{b.learnerName ? ` · ${b.learnerName}` : ''}</p>
                <p className="text-sm text-muted-foreground">
                  {when}
                  {held && (isAr ? ` · الميعاد محجوز لحد ${held}` : ` · held until ${held}`)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => release(b)}
                  disabled={busyId === b.id}
                  className="flex-1 sm:flex-none min-h-11 px-4 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-subtle cursor-pointer focus-ring disabled:opacity-60"
                >
                  {isAr ? 'سيبه' : 'Let it go'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaying(b)}
                  className="flex-1 sm:flex-none min-h-11 px-5 rounded-xl bg-[#0A2E35] text-white text-sm font-semibold cursor-pointer focus-ring"
                >
                  {isAr ? `ادفع $${b.feeAmountUsd}` : `Pay $${b.feeAmountUsd}`}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {paying && (
        <StudentPaymentClaimModal
          isOpen
          onClose={() => setPaying(null)}
          bookingReference={paying.referenceCode}
          itemTitle={paying.serviceTitle}
          amount={paying.feeAmountUsd}
          lang={lang}
          onClaimSuccess={() => { setPaying(null); load(); }}
        />
      )}
    </section>
  );
}
