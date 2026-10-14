import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { StepDateTime } from '../../components/booking/StepDateTime';
import { TimeSlot, LessonDuration } from '../../booking/types';
import { getFreshAccessToken } from '../../lib/auth';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

interface LessonSelfServicePanelProps {
  booking: any;
  lang: 'en' | 'ar';
  timezone: string;
  onChanged: () => void;
}

/**
 * Self-service reschedule / cancel (RULES.md §2):
 * - any lesson can be moved up to 1 hour before it starts (a free trial only once);
 * - a free trial can be cancelled up to 1 hour before, any other lesson up to 3 hours before.
 *   A cancelled paid lesson becomes a lesson credit; a package lesson keeps its credit.
 * - inside the last hour nothing can be changed; real emergencies go to WhatsApp (super admin decides).
 * The server enforces every rule; this panel only hides options that would be refused.
 */
export function LessonSelfServicePanel({ booking, lang, timezone, onChanged }: LessonSelfServicePanelProps) {
  const isAr = lang === 'ar';
  const isTrial = booking.bookingType === 'trial';
  const cancelHours = isTrial ? 1 : 3;
  const hoursLeft = DateTime.fromISO(booking.scheduledStart).diffNow('hours').hours;
  const isActive = ['confirmed', 'rescheduled'].includes(booking.status);
  const canReschedule = isActive && hoursLeft >= 1 && !(isTrial && booking.rescheduleCount >= 1);
  const canCancel = isActive && hoursLeft >= cancelHours;
  const isPaidSingle = !isTrial && !booking.packageEntitlementId && booking.paymentPlan !== 'pay_later';

  const [picking, setPicking] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [tz, setTz] = useState(timezone);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!canReschedule && !canCancel) {
    if (!isActive || hoursLeft <= 0) return null;
    return (
      <p className="text-sm text-muted-foreground p-4 rounded-xl glass-surface border border-border-subtle">
        {isAr
          ? 'فاضل أقل من ساعة على الدرس، فمش ممكن نغيّره دلوقتي. لو عندك ظرف طارئ فعلاً، '
          : "There's less than an hour left, so this lesson can't be changed now. If it's a real emergency, "}
        <a
          href={buildWhatsAppUrl(`Emergency about my lesson ${booking.referenceCode || ''}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-primary"
        >
          {isAr ? 'كلّمنا على واتساب' : 'message us on WhatsApp'}
        </a>
        .
      </p>
    );
  }

  const call = async (path: string, body: object) => {
    setBusy(true);
    setMessage(null);
    try {
      const token = await getFreshAccessToken();
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (err: any) {
      setMessage({ kind: 'error', text: err?.message || (isAr ? 'حدث خطأ، حاول مرة أخرى.' : 'Something went wrong. Please try again.') });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleReschedule = async () => {
    if (!slot?.utcStartIso) return;
    const ok = await call(`/api/student/bookings/${booking.id}/reschedule`, { utcStartIso: slot.utcStartIso });
    if (ok) {
      setPicking(false);
      setMessage({ kind: 'ok', text: isAr ? 'تم تغيير موعد درسك، وسيصلك تأكيد بالموعد الجديد.' : "Done! Your lesson has moved, and you'll get a confirmation for the new time." });
      onChanged();
    }
  };

  const handleCancel = async () => {
    const ok = await call(`/api/student/bookings/${booking.id}/cancel`, {});
    if (ok) {
      setConfirmCancel(false);
      setMessage({
        kind: 'ok',
        text: isTrial
          ? (isAr ? 'تم إلغاء التجربة. يمكنك حجز تجربة جديدة بعد ٤٨ ساعة.' : 'Your trial is cancelled. You can book a new one after 48 hours.')
          : isPaidSingle
          ? (isAr ? 'تم إلغاء الدرس، ورجعلك كرصيد حصة تحجز بيه في أي وقت. لو تحب استرداد الفلوس بدل كده، هتلاقي الاختيار في صفحة الباقات.' : "Your lesson is cancelled and you got a lesson credit to book any time. If you'd rather have a refund, you'll find that option on the Packages page.")
          : (isAr ? 'تم إلغاء الدرس وأعيد الرصيد إلى باقتك.' : 'Your lesson is cancelled and the credit is back in your package.')
      });
      onChanged();
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl glass-surface border border-border-subtle">
      <div className="font-semibold text-foreground">{isAr ? 'غيّر موعدك بنفسك' : 'Change it yourself'}</div>
      {isTrial && (
        <p className="text-sm text-muted-foreground">
          {isAr
            ? 'يمكنك تغيير موعد الدرس التجريبي مرة واحدة، حتى ساعة قبل بدايته.'
            : 'You can move your free trial once, up to 1 hour before it starts.'}
        </p>
      )}

      {message && (
        <div role="status" className={`text-sm p-3 rounded-lg ${message.kind === 'ok' ? 'bg-success/10 text-foreground' : 'bg-warning/10 text-foreground'}`}>
          {message.text}
        </div>
      )}

      {picking ? (
        <div className="space-y-3">
          <StepDateTime
            mode={isTrial ? 'trial' : 'regular'}
            duration={booking.durationMinutes as LessonDuration}
            teacherId={booking.teacherId || undefined}
            selectedDate={date}
            selectedSlot={slot}
            timezone={tz}
            onSelectDate={setDate}
            onSelectSlot={setSlot}
            onSelectTimezone={setTz}
            onNext={handleReschedule}
            onBack={() => setPicking(false)}
            lang={lang}
          />
          {busy && <p className="text-sm text-muted-foreground">{isAr ? 'جارٍ نقل الدرس…' : 'Moving your lesson…'}</p>}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {canReschedule && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setPicking(true)}
              className="px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60"
            >
              {isAr ? 'اختر موعداً جديداً' : 'Pick a new time'}
            </button>
          )}
          {canCancel && !confirmCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmCancel(true)}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground cursor-pointer disabled:opacity-60"
            >
              {isAr ? 'إلغاء الدرس' : 'Cancel lesson'}
            </button>
          )}
          {confirmCancel && (
            <div className="w-full space-y-2">
              <p className="text-sm text-foreground">
                {isTrial
                  ? (isAr ? 'متأكد؟ بعد الإلغاء يمكنك حجز تجربة جديدة بعد ٤٨ ساعة.' : "Are you sure? After cancelling, you can book a new trial in 48 hours.")
                  : isPaidSingle
                  ? (isAr ? 'متأكد؟ هيرجعلك رصيد حصة تحجز بيه بعدين.' : "Are you sure? You'll get a lesson credit to book later.")
                  : (isAr ? 'متأكد؟ سيعود الرصيد إلى باقتك.' : 'Are you sure? The credit goes back to your package.')}
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={handleCancel} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold cursor-pointer disabled:opacity-60">
                  {isAr ? 'نعم، ألغِ الدرس' : 'Yes, cancel it'}
                </button>
                <button type="button" disabled={busy} onClick={() => setConfirmCancel(false)} className="px-4 py-2 rounded-xl border border-border text-sm cursor-pointer">
                  {isAr ? 'لا، أبقِه' : 'No, keep it'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
