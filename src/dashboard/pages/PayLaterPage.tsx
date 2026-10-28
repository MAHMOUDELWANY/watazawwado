import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Wallet, RotateCcw, Check, X, Loader2, MessageCircle } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { confirmAction } from '../../components/ui/Feedback';

/**
 * Super admin: "pay later" bookings waiting for approval and refund requests for lesson credits
 * (RULES.md §5). Teachers never see this page.
 */
export default function PayLaterPage() {
  const { t, isAr } = useT();
  const [payLater, setPayLater] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pl, rr]: any[] = await Promise.all([
        dashboardFetch('/api/dashboard/pay-later'),
        dashboardFetch('/api/dashboard/refund-requests')
      ]);
      setPayLater(pl.bookings || []);
      setRefunds(rr.requests || []);
    } catch {
      setMessage({ kind: 'error', text: t("Couldn't load the requests. Please refresh.", 'تعذر تحميل الطلبات. حدّث الصفحة.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, path: string, body: object, okText: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await dashboardFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setMessage({ kind: 'ok', text: okText });
      await load();
    } catch (err: any) {
      setMessage({ kind: 'error', text: err?.message || t('Something went wrong. Please try again.', 'حصلت مشكلة، حاول تاني.') });
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('Loading…', 'جارٍ التحميل…')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t('Pay later & refunds', 'ادفع لاحقاً والاسترداد')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Requests that need your decision.', 'طلبات محتاجة قرارك.')}
        </p>
      </div>

      {message && (
        <div role="status" className={`p-3 rounded-xl text-sm text-foreground ${message.kind === 'ok' ? 'bg-success/10' : 'bg-warning/10'}`}>
          {message.text}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          {t('Book now, pay later', 'احجز دلوقتي وادفع بعدين')} ({payLater.length})
        </h2>
        {payLater.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No requests right now.', 'مفيش طلبات دلوقتي.')}</p>
        ) : payLater.map(b => (
          <div key={b.id} className="glass-card p-4 rounded-2xl border border-border space-y-3">
            <div>
              <div className="font-semibold text-foreground">{b.contact_name} · {b.service_id} · {b.duration_minutes} {t('min', 'دقيقة')}</div>
              <div className="text-sm text-muted-foreground">{fmt(b.scheduled_start)} · {b.reference_code} · ${Number(b.fee_amount_usd || 0).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{b.contact_email}{b.contact_whatsapp ? ` · ${b.contact_whatsapp}` : ''}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === b.id}
                onClick={() => act(b.id, `/api/dashboard/bookings/${b.id}/pay-later/approve`, {}, t('Approved. The lesson is confirmed.', 'اتوافق عليه والحصة اتأكدت.'))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                {t('Approve', 'موافقة')}
              </button>
              <button
                type="button"
                disabled={busyId === b.id}
                onClick={() => act(b.id, `/api/dashboard/bookings/${b.id}/pay-later/reject`, {}, t('Declined. The time is free again.', 'اترفض والميعاد بقى متاح.'))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground cursor-pointer disabled:opacity-60"
              >
                <X className="w-4 h-4" />
                {t('Decline', 'رفض')}
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-accent" />
          {t('Refund requests', 'طلبات الاسترداد')} ({refunds.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Send the money within 14 days of the request, then press "Mark as refunded". That also cancels the lesson credit.',
            'ابعت الفلوس خلال 14 يوم من الطلب، وبعدها اضغط "اتسدد". ده كمان بيلغي رصيد الحصة.'
          )}
        </p>
        {refunds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No requests right now.', 'مفيش طلبات دلوقتي.')}</p>
        ) : refunds.map(r => {
          const deadline = DateTime.fromISO(r.requestedAt).plus({ days: 14 });
          return (
            <div key={r.creditId} className="glass-card p-4 rounded-2xl border border-border space-y-3">
              <div>
                <div className="font-semibold text-foreground">{r.learnerName || t('Student', 'طالب')} · {Number(r.amount).toFixed(2)} {r.currency}</div>
                <div className="text-sm text-muted-foreground">
                  {t('Requested', 'اتطلب')}: {fmt(r.requestedAt)} · {t('Pay by', 'آخر ميعاد للسداد')}: {deadline.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED)}
                </div>
                <div className="text-xs text-muted-foreground">{r.email}{r.whatsapp ? ` · ${r.whatsapp}` : ''}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.paymentId && (
                  <button
                    type="button"
                    disabled={busyId === r.creditId}
                    onClick={async () => {
                      if (await confirmAction(t('Did you already send the money to the student?', 'هل بعت الفلوس للطالب فعلاً؟'))) {
                        act(r.creditId, `/api/dashboard/payments/${r.paymentId}/refund`, { reason: 'Student asked for a refund instead of a lesson credit' }, t('Recorded as refunded.', 'اتسجل إنه اتسدد.'));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    {t('Mark as refunded', 'اتسدد')}
                  </button>
                )}
                {r.whatsapp && (
                  <a
                    href={buildWhatsAppUrl('', r.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t('WhatsApp', 'واتساب')}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
