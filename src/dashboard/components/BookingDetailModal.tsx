import React, { useState, useEffect } from 'react';
import FocusTrap from '../../components/FocusTrap';
import { DateTime } from 'luxon';
import {
  X,
  Video,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CalendarCheck2,
  Plus,
  BookOpen,
  UserX,
  Send
} from 'lucide-react';
import { DashboardBookingDetail, BookingPaymentStatus } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { RecordPaymentModal } from './RecordPaymentModal';
import { MoveTeacherControl } from './MoveTeacherControl';
import { useTeacherAuth } from '../../lib/auth';
import { useT } from '../../lib/language';
import { JalilaBrief } from './JalilaBrief';
import { PostLessonSummaryEditor } from './PostLessonSummaryEditor';

interface BookingDetailModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
  /** Opened from "Record summary": show the family summary editor right away. */
  openSummaryEditor?: boolean;
}

/**
 * The one lesson window of the dashboard (Today, Schedule, All lessons; audit 2026-10-28).
 * RULES.md: teachers see no payment information, move their own lessons with a reason or ask the student to
 * reschedule, never cancel; they talk to the family in the site chat. The super admin also sees payments and
 * contact details and can cancel, refund and approve pay-later requests.
 */
export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onBookingUpdated,
  openSummaryEditor = false
}) => {
  const { t, isAr } = useT();
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const locale = isAr ? 'ar' : 'en';

  const [booking, setBooking] = useState<DashboardBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Teacher: ask the student to pick a new time.
  const [isRequestingMove, setIsRequestingMove] = useState(false);
  const [moveNote, setMoveNote] = useState('');
  const [requestingMove, setRequestingMove] = useState(false);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [noShowCreditDecision, setNoShowCreditDecision] = useState<'returned' | 'used'>('returned');
  const [markingNoShow, setMarkingNoShow] = useState(false);

  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
  const [coveredMaterial, setCoveredMaterial] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [markingCompleted, setMarkingCompleted] = useState(false);
  const [lessonSession, setLessonSession] = useState<any>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardFetch(`/api/dashboard/bookings/${bookingId}`);
      if (data?.booking) {
        setBooking(data.booking);
        setNotes(data.booking.notes || '');
        setLessonSession(data?.context?.lesson_session || null);
      } else {
        setError(t('Lesson details could not be found.', 'مش لاقيين تفاصيل الحصة.'));
      }
    } catch (err: any) {
      setError(err?.data?.error || err?.message || t('Could not load the lesson.', 'تعذر تحميل الحصة.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBooking();
      setIsRescheduling(false);
      setIsRequestingMove(false);
      setIsCancelling(false);
      setIsMarkingNoShow(false);
      setIsMarkingCompleted(false);
      setActionMessage(null);
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showPaymentModal) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showPaymentModal, onClose]);

  if (!isOpen || !bookingId) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const refresh = () => {
    loadBooking();
    if (onBookingUpdated) onBookingUpdated();
  };

  const handleSaveNotes = async () => {
    if (!booking) return;
    setSavingNotes(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, { method: 'PATCH', body: JSON.stringify({ notes }) });
      setActionMessage({ type: 'success', text: t('Notes saved.', 'الملاحظات اتحفظت.') });
      if (onBookingUpdated) onBookingUpdated();
    } catch {
      setActionMessage({ type: 'error', text: t("Couldn't save the notes.", 'تعذر حفظ الملاحظات.') });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConfirmCompleted = async () => {
    if (!booking) return;
    setMarkingCompleted(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          covered_material: coveredMaterial.trim() || undefined,
          notes: completionNotes.trim()
            ? (booking.notes ? `${booking.notes}\n[Lesson Notes]: ${completionNotes.trim()}` : completionNotes.trim())
            : undefined
        })
      });
      setActionMessage({ type: 'success', text: t('Lesson recorded as completed.', 'الحصة اتسجلت إنها تمت.') });
      setIsMarkingCompleted(false);
      setCoveredMaterial('');
      setCompletionNotes('');
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't update the lesson.", 'تعذر تحديث الحصة.') });
    } finally {
      setMarkingCompleted(false);
    }
  };

  const handleConfirmNoShow = async () => {
    if (!booking) return;
    setMarkingNoShow(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'no_show',
          no_show_credit_decision: noShowCreditDecision,
          consume_package_credit: noShowCreditDecision === 'used',
          notes: noShowReason.trim()
            ? (booking.notes ? `${booking.notes}\n[No-Show Note]: ${noShowReason.trim()}` : `[No-Show Note]: ${noShowReason.trim()}`)
            : undefined
        })
      });
      setActionMessage({ type: 'success', text: t('Recorded as a no-show.', 'اتسجل إن الطالب ما حضرش.') });
      setIsMarkingNoShow(false);
      setNoShowReason('');
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't record the no-show.", 'تعذر تسجيل الغياب.') });
    } finally {
      setMarkingNoShow(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled', cancellation_reason: cancellationReason.trim() || 'Cancelled by admin' })
      });
      setActionMessage({ type: 'success', text: t('Lesson cancelled.', 'الحصة اتلغت.') });
      setIsCancelling(false);
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't cancel the lesson.", 'تعذر إلغاء الحصة.') });
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!booking || !newStartDate || !newStartTime) return;
    if (!isSuperAdmin && rescheduleReason.trim().length < 3) {
      setActionMessage({ type: 'error', text: t('Please write the reason. The student will see it.', 'اكتب السبب من فضلك، الطالب هيشوفه.') });
      return;
    }
    setRescheduling(true);
    try {
      const dtLocal = DateTime.fromISO(`${newStartDate}T${newStartTime}`, { zone: booking.student_timezone || 'Africa/Cairo' });
      if (!dtLocal.isValid) {
        setActionMessage({ type: 'error', text: t('Invalid date or time.', 'التاريخ أو الوقت مش صحيح.') });
        return;
      }
      const res: any = await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rescheduled',
          scheduled_start: dtLocal.toUTC().toISO(),
          reschedule_reason: rescheduleReason.trim()
        })
      });
      // Less than 3 hours before the lesson: the teacher also tells the admin on WhatsApp (RULES.md §1).
      if (res?.whatsappUrl) window.open(res.whatsappUrl, '_blank', 'noopener,noreferrer');
      setActionMessage({
        type: 'success',
        text: res?.whatsappUrl
          ? t('Lesson moved. The student got an email. Please send the WhatsApp message to the admin that just opened.', 'ميعاد الحصة اتغيّر ووصل للطالب إيميل. ابعت رسالة الواتساب اللي اتفتحت للإدارة من فضلك.')
          : t('Lesson moved. The student got an email and a notice on the site.', 'ميعاد الحصة اتغيّر، ووصل للطالب إيميل وإشعار على الموقع.')
      });
      setRescheduleReason('');
      setIsRescheduling(false);
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't move the lesson.", 'تعذر تغيير الميعاد.') });
    } finally {
      setRescheduling(false);
    }
  };

  const handleRequestMove = async () => {
    if (!booking) return;
    setRequestingMove(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}/reschedule-request`, {
        method: 'POST',
        body: JSON.stringify({ note: moveNote.trim() })
      });
      setActionMessage({ type: 'success', text: t('Sent. The student will see your request on the site and pick a new time.', 'اتبعت. الطالب هيشوف طلبك على الموقع ويختار ميعاد جديد.') });
      setIsRequestingMove(false);
      setMoveNote('');
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't send the request.", 'تعذر إرسال الطلب.') });
    } finally {
      setRequestingMove(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/confirm`, { method: 'POST' });
      setActionMessage({ type: 'success', text: t('Payment confirmed.', 'الدفع اتأكد.') });
      refresh();
    } catch {
      setActionMessage({ type: 'error', text: t("Couldn't confirm the payment.", 'تعذر تأكيد الدفع.') });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = window.prompt(t('Reason for rejecting (optional):', 'سبب الرفض (اختياري):'));
    if (reason === null) return;
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      setActionMessage({ type: 'success', text: t('Payment marked as rejected.', 'الدفع اترفض.') });
      refresh();
    } catch {
      setActionMessage({ type: 'error', text: t("Couldn't reject the payment.", 'تعذر رفض الدفع.') });
    }
  };

  // RULES.md §5: confirmed payments are refunded (never deleted); the lesson or credit is reversed.
  const handleRefundPayment = async (paymentId: string) => {
    const reason = window.prompt(t('Refund reason (saved with the payment):', 'سبب الاسترداد (بيتحفظ مع الدفع):'));
    if (reason === null) return;
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/refund`, { method: 'POST', body: JSON.stringify({ reason }) });
      setActionMessage({ type: 'success', text: t('Refund recorded and the lesson cancelled. Remember to send the money back.', 'الاسترداد اتسجل والحصة اتلغت. متنساش تبعت الفلوس.') });
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't record the refund.", 'تعذر تسجيل الاسترداد.') });
    }
  };

  const handlePayLaterDecision = async (decision: 'approve' | 'reject') => {
    if (!booking) return;
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}/pay-later/${decision}`, { method: 'POST' });
      setActionMessage({
        type: 'success',
        text: decision === 'approve'
          ? t('Approved. The lesson is confirmed.', 'اتوافق عليه والحصة اتأكدت.')
          : t('Declined. The time is free again.', 'اترفض والميعاد بقى متاح.')
      });
      refresh();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || t("Couldn't update the request.", 'تعذر تحديث الطلب.') });
    }
  };

  const startUtc = booking ? DateTime.fromISO(booking.scheduled_start) : null;
  const startCairo = startUtc ? startUtc.setZone('Africa/Cairo').setLocale(locale) : null;
  let startStudent: DateTime | null = null;
  try {
    if (booking?.student_timezone && startUtc) startStudent = startUtc.setZone(booking.student_timezone).setLocale(locale);
  } catch {
    startStudent = null;
  }
  const notStartedYet = Boolean(startUtc && startUtc > DateTime.now().plus({ minutes: 15 }));
  const isActive = booking && !['completed', 'no_show', 'cancelled'].includes(booking.status);
  const isUpcoming = Boolean(isActive && startUtc && startUtc > DateTime.now());
  const rescheduleRequestedAt = (booking as any)?.reschedule_requested_at as string | undefined;

  const statusLabel = (status: string) => ({
    confirmed: t('Confirmed', 'مؤكدة'),
    completed: t('Completed', 'تمت'),
    pending: t('Waiting for payment', 'في انتظار الدفع'),
    cancelled: t('Cancelled', 'ملغاة'),
    no_show: t('No-show', 'غياب'),
    rescheduled: t('Moved', 'اتغيّر ميعادها')
  } as Record<string, string>)[status.toLowerCase()] || status;

  const getBookingStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-success/15 text-success border-success/30';
      case 'completed': return 'bg-secondary/30 text-accent border-secondary/60';
      case 'pending': return 'bg-warning/15 text-warning border-warning/30';
      case 'cancelled': return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'no_show': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'rescheduled': return 'bg-secondary/25 text-secondary-foreground border-secondary/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPaymentBadge = (status: BookingPaymentStatus) => {
    switch (status) {
      case 'paid': return { text: t('Paid', 'مدفوعة'), classes: 'bg-success/15 text-success border-success/30' };
      case 'pending_review': return { text: t('Payment to review', 'دفع محتاج مراجعة'), classes: 'bg-warning/15 text-warning border-warning/30' };
      case 'unpaid': return { text: t('Not paid', 'مش مدفوعة'), classes: 'bg-muted text-muted-foreground border-border' };
      case 'partially_paid': return { text: t('Partly paid', 'مدفوعة جزئياً'), classes: 'bg-warning/15 text-warning border-warning/30' };
      case 'payment_rejected': return { text: t('Payment rejected', 'الدفع اترفض'), classes: 'bg-destructive/15 text-destructive border-destructive/30' };
      case 'free_trial':
      default: return { text: t('Free trial', 'تجربة مجانية'), classes: 'bg-secondary/30 text-accent border-secondary/60' };
    }
  };

  const closeOtherPanels = () => {
    setIsMarkingCompleted(false);
    setIsMarkingNoShow(false);
    setIsRescheduling(false);
    setIsRequestingMove(false);
    setIsCancelling(false);
  };

  const fieldClass = 'w-full p-2 text-sm glass-card border-none rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <FocusTrap>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
    >
      <div
        className="glass-card border-none rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between glass-surface/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="booking-detail-title" className="text-lg font-display font-semibold text-foreground">
                {t('Lesson', 'حصة')} {booking?.reference_code}
              </h2>
              {booking && (
                <button
                  onClick={() => copyToClipboard(booking.reference_code, 'ref')}
                  className="tap-44 relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title={t('Copy reference', 'انسخ رقم الحجز')}
                  aria-label={t('Copy reference', 'انسخ رقم الحجز')}
                >
                  {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Booked on', 'اتحجزت يوم')} {booking ? DateTime.fromISO(booking.created_at).setLocale(locale).toFormat('LLL dd, yyyy') : '...'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {booking && (
              <>
                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full border ${getBookingStatusBadge(booking.status)}`}>
                  {statusLabel(booking.status)}
                </span>
                {isSuperAdmin && (
                  <span className={`px-2.5 py-1 text-sm font-semibold rounded-full border ${getPaymentBadge(booking.payment_status).classes}`}>
                    {getPaymentBadge(booking.payment_status).text}
                  </span>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors ms-2 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label={t('Close', 'إغلاق')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className={`px-6 py-2 text-sm flex items-center justify-between border-b ${
            actionMessage.type === 'success'
              ? 'bg-success/15 text-success border-success/30'
              : 'bg-destructive/15 text-destructive border-destructive/30'
          }`}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="tap-44 relative opacity-70 hover:opacity-100 p-1 cursor-pointer" aria-label={t('Dismiss', 'إخفاء')}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 glass-surface rounded-xl border border-border"></div>
              <div className="h-32 glass-surface rounded-xl border border-border"></div>
              <div className="h-24 glass-surface rounded-xl border border-border"></div>
            </div>
          ) : error || !booking ? (
            <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium text-destructive">{error || t('Lesson not found', 'الحصة مش موجودة')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Learner & contact */}
                <div className="glass-card p-4 rounded-xl border border-border shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-accent" />
                      {t('Student & contact', 'الطالب والتواصل')}
                    </span>
                    {booking.student_id ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">{t('Student account', 'حساب طالب')}</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t('Guest', 'زائر')}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">{booking.contact_name}</h3>
                    {booking.parent_name && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t('Parent / guardian', 'ولي الأمر')}: <span className="font-medium text-foreground">{booking.parent_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm text-foreground">
                    {isSuperAdmin && (<>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {t('Email', 'الإيميل')}:</span>
                      <a href={`mailto:${booking.contact_email}`} className="font-mono text-[11px] hover:underline text-primary font-medium" dir="ltr">
                        {booking.contact_email}
                      </a>
                    </div>
                    {booking.contact_whatsapp && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><MessageSquare className="w-3.5 h-3.5" /> {t('WhatsApp', 'واتساب')}:</span>
                        <a
                          href={buildContextualWhatsAppUrl(booking.contact_whatsapp, `As-salamu alaykum ${booking.contact_name}, about lesson ${booking.reference_code}.`)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-success font-medium"
                          dir="ltr"
                        >
                          {booking.contact_whatsapp}
                        </a>
                      </div>
                    )}
                    </>)}
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><Globe className="w-3.5 h-3.5" /> {t('Time zone', 'المنطقة الزمنية')}:</span>
                      <span className="font-medium text-foreground" dir="ltr">{booking.student_timezone || t('Not set', 'مش محددة')}</span>
                    </div>
                  </div>
                </div>

                {/* Lesson */}
                <div className="glass-card p-4 rounded-xl border border-border shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                      {t('Lesson details', 'تفاصيل الحصة')}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full glass-surface text-muted-foreground border border-border font-medium">
                      {booking.booking_type === 'trial' ? t('Free trial', 'تجربة مجانية') : t('Regular lesson', 'حصة عادية')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{booking.service_name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('Length', 'المدة')}: <span className="font-medium text-foreground">{booking.duration_minutes} {t('min', 'دقيقة')}</span>
                    </p>
                  </div>
                  <div className="space-y-1.5 text-sm text-foreground">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t('Cairo time', 'بتوقيت القاهرة')}:</span>
                      <span className="font-medium text-foreground text-end">{startCairo ? startCairo.toFormat('EEE, LLL dd, yyyy • hh:mm a') : '...'}</span>
                    </div>
                    {startStudent && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {t("Student's time", 'بتوقيت الطالب')}:</span>
                        <span className="font-medium text-foreground text-end">{startStudent.toFormat('EEE, LLL dd, yyyy • hh:mm a')}</span>
                      </div>
                    )}
                  </div>
                  {rescheduleRequestedAt && isActive && (
                    <p className="text-xs p-2 rounded-lg bg-warning/10 text-foreground">
                      {t('You asked the student to move this lesson. Waiting for their new time.', 'طلبت من الطالب يغيّر ميعاد الحصة. مستنيين يختار ميعاد جديد.')}
                    </p>
                  )}
                </div>
              </div>

              {/* Zoom & calendar */}
              <div className="glass-card p-4 rounded-xl border border-border shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-sm font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-accent" />
                    {t('Online classroom & calendar', 'الفصل الأونلاين والتقويم')}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    booking.google_calendar_event_id ? 'bg-success/15 text-success border border-success/30' : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {booking.google_calendar_event_id ? t('In Google Calendar', 'في تقويم جوجل') : t('Not in Google Calendar', 'مش في تقويم جوجل')}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t('Zoom room', 'غرفة Zoom')}:</p>
                    {booking.zoom_meeting_link ? (
                      <span className="font-mono text-sm text-muted-foreground truncate max-w-sm block" dir="ltr">{booking.zoom_meeting_link}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">{t('No link yet', 'لسه مفيش رابط')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.zoom_host_url && (
                      <a href={booking.zoom_host_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]">
                        <Video className="w-3.5 h-3.5" />
                        {t('Start as host', 'ابدأ كمضيف')}
                      </a>
                    )}
                    {booking.zoom_meeting_link && (
                      <button
                        onClick={() => copyToClipboard(booking.zoom_meeting_link || '', 'zoom')}
                        className="px-3.5 py-2 text-sm font-medium text-foreground glass-surface glass-hover hover:bg-surface border-none rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        {copiedField === 'zoom' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        {t('Copy link', 'انسخ الرابط')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Payments: super admin only (RULES.md §1) */}
              {isSuperAdmin && (
                <div className="glass-card p-5 rounded-xl border border-border shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <span className="text-sm font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-accent" />
                        {t('Payments', 'المدفوعات')}
                      </span>
                      <p className="text-sm text-muted-foreground mt-0.5">{t('Only you (admin) can see this.', 'أنت بس (المدير) اللي شايف الجزء ده.')}</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="tap-44 relative px-3 py-1.5 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('Record payment', 'سجّل دفع')}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 glass-surface rounded-xl border border-border">
                      <span className="text-[11px] text-muted-foreground block">{t('Lesson price', 'سعر الحصة')}</span>
                      <span className="text-base font-semibold text-foreground">
                        {booking.booking_type === 'trial'
                          ? t('Free', 'مجانية')
                          : booking.expected_amount !== null && booking.expected_amount !== undefined
                            ? `$${Number(booking.expected_amount).toFixed(2)}${booking.currency ? ` ${booking.currency}` : ''}`
                            : t('Not set', 'مش محدد')}
                      </span>
                    </div>
                    <div className="p-3 glass-surface rounded-xl border border-border">
                      <span className="text-[11px] text-muted-foreground block">{t('Received', 'اتستلم')}</span>
                      <span className="text-base font-semibold text-success">${Number(booking.confirmed_amount || 0).toFixed(2)} {booking.currency}</span>
                    </div>
                    <div className="p-3 glass-surface rounded-xl border border-border">
                      <span className="text-[11px] text-muted-foreground block">{t('Status', 'الحالة')}</span>
                      <span className="text-sm font-semibold mt-1 block">
                        <span className={`px-2 py-0.5 rounded-md border ${getPaymentBadge(booking.payment_status).classes}`}>
                          {getPaymentBadge(booking.payment_status).text}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('Payment history', 'سجل الدفع')} ({booking.payments?.length || 0})
                    </h4>
                    {(!booking.payments || booking.payments.length === 0) ? (
                      <div className="p-4 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                        {booking.booking_type === 'trial' ? t('No payment needed for a free trial.', 'التجربة المجانية مش محتاجة دفع.') : t('No payments yet.', 'لسه مفيش مدفوعات.')}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {booking.payments.map((p) => (
                          <div key={p.id} className="p-3 glass-surface rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">${Number(p.amount).toFixed(2)} {p.currency}</span>
                                <span className="text-border">•</span>
                                <span className="capitalize text-muted-foreground font-medium">{p.payment_method.replace(/_/g, ' ')}</span>
                                <span className="text-border">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[13px] font-semibold border ${
                                  p.status === 'confirmed' ? 'bg-success/15 text-success border-success/30'
                                    : p.status === 'pending' ? 'bg-warning/15 text-warning border-warning/30'
                                    : 'bg-destructive/15 text-destructive border-destructive/30'
                                }`}>
                                  {({ confirmed: t('Confirmed', 'مؤكد'), pending: t('Pending', 'معلق'), rejected: t('Rejected', 'مرفوض'), refunded: t('Refunded', 'اتسدد') } as Record<string, string>)[p.status] || p.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                {p.payment_reference && <span>{t('Ref', 'المرجع')}: <span className="font-mono text-foreground">{p.payment_reference}</span></span>}
                                <span>{t('Logged', 'اتسجل')}: {DateTime.fromISO(p.created_at).setLocale(locale).toFormat('LLL dd, hh:mm a')}</span>
                                {p.confirmed_at && <span className="text-success font-medium">{t('Confirmed', 'اتأكد')}: {DateTime.fromISO(p.confirmed_at).setLocale(locale).toFormat('LLL dd')}</span>}
                              </div>
                              {p.notes && <p className="text-[11px] text-muted-foreground italic">{t('Note', 'ملاحظة')}: {p.notes}</p>}
                            </div>

                            {p.status === 'confirmed' && (
                              <button
                                onClick={() => handleRefundPayment(p.id)}
                                className="tap-44 relative shrink-0 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/15 border border-destructive/30 rounded-xl transition-colors cursor-pointer min-h-[36px]"
                              >
                                {t('Refund', 'استرداد')}
                              </button>
                            )}
                            {p.status === 'pending' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleConfirmPayment(p.id)}
                                  className="tap-44 relative px-3 py-1.5 text-sm font-semibold text-success-foreground bg-success hover:bg-success/90 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t('Confirm', 'تأكيد')}
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p.id)}
                                  className="tap-44 relative px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/15 border border-destructive/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  {t('Reject', 'رفض')}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isSuperAdmin && (booking as any).payment_plan === 'pay_later' && booking.status === 'pending' && (
                <div className="glass-card p-4 rounded-xl border border-warning/40 bg-warning/10 space-y-3">
                  <div className="text-sm text-foreground">
                    <strong className="block">{t('Pay-later request', 'طلب ادفع لاحقاً')}</strong>
                    {t(
                      'This regular student booked now and will pay later. Approve to confirm the lesson, or decline to free the time.',
                      'الطالب المنتظم ده حجز دلوقتي وهيدفع بعدين. وافق علشان الحصة تتأكد، أو ارفض علشان الميعاد يفضى.'
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePayLaterDecision('approve')} className="tap-44 relative px-3 py-1.5 text-sm font-semibold text-success-foreground bg-success hover:bg-success/90 rounded-xl cursor-pointer min-h-[36px]">
                      {t('Approve', 'موافقة')}
                    </button>
                    <button onClick={() => handlePayLaterDecision('reject')} className="tap-44 relative px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/15 border border-destructive/30 rounded-xl cursor-pointer min-h-[36px]">
                      {t('Decline', 'رفض')}
                    </button>
                  </div>
                </div>
              )}

              {/* Private notes */}
              <div className="glass-card p-4 rounded-xl border border-border shadow-2xs space-y-2">
                <span className="text-sm font-semibold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  {t('Private notes', 'ملاحظات خاصة')}
                </span>
                <textarea
                  aria-label={t('Private notes', 'ملاحظات خاصة')}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('Lesson observations or teaching notes (the student does not see these)…', 'ملاحظات عن الحصة أو التدريس (الطالب مش بيشوفها)…')}
                  className="w-full p-2.5 text-sm glass-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="tap-44 relative px-3.5 py-1.5 text-sm font-medium text-foreground hover:bg-surface-subtle rounded-xl border border-border transition-colors disabled:opacity-50 cursor-pointer min-h-[36px]"
                  >
                    {savingNotes ? t('Saving…', 'جارٍ الحفظ…') : t('Save notes', 'احفظ الملاحظات')}
                  </button>
                </div>
              </div>

              {lessonSession?.covered_material && (
                <div className="bg-secondary/20 p-4 rounded-xl border border-secondary/50 shadow-2xs space-y-1.5">
                  <span className="text-sm font-semibold tracking-wider text-primary flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {t('What was covered', 'اللي اتشرح في الحصة')}
                  </span>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{lessonSession.covered_material}</p>
                </div>
              )}

              {/* Teacher: ask the student to move the lesson */}
              {isRequestingMove && (
                <div className="p-4 bg-secondary/15 border border-secondary/30 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-secondary-foreground flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      {t('Ask the student to reschedule', 'اطلب من الطالب يغيّر الميعاد')}
                    </h4>
                    <button onClick={() => setIsRequestingMove(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      {t('Cancel', 'إلغاء')}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('The student gets a notification on the site and picks a new time that suits you both.', 'الطالب هيوصله إشعار على الموقع ويختار ميعاد جديد يناسبكم.')}
                  </p>
                  <input
                    aria-label={t('Short note for the student (optional)', 'ملاحظة قصيرة للطالب (اختياري)')}
                    type="text"
                    placeholder={t('Short note for the student (optional)', 'ملاحظة قصيرة للطالب (اختياري)')}
                    value={moveNote}
                    onChange={(e) => setMoveNote(e.target.value)}
                    maxLength={500}
                    className={fieldClass}
                  />
                  <button
                    onClick={handleRequestMove}
                    disabled={requestingMove}
                    className="w-full py-2 text-sm font-semibold text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {requestingMove ? t('Sending…', 'جارٍ الإرسال…') : t('Send request', 'ابعت الطلب')}
                  </button>
                </div>
              )}

              {/* AD-02b: move this upcoming lesson to another teacher, same time and price (super admin only) */}
              {isSuperAdmin && isUpcoming && (
                <MoveTeacherControl bookingId={booking.id} currentTeacherId={(booking as any).teacher_id || null} onMoved={refresh} />
              )}

              {/* Move the lesson: the admin, or the lesson's own teacher with a reason (RULES.md §1) */}
              {isRescheduling && (
                <div className="p-4 bg-secondary/15 border border-secondary/30 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-secondary-foreground flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('Move the lesson', 'غيّر ميعاد الحصة')}
                    </h4>
                    <button onClick={() => setIsRescheduling(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      {t('Cancel', 'إلغاء')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="bdm-new-date">{t('New date', 'التاريخ الجديد')}</label>
                      <input id="bdm-new-date" type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} className={fieldClass} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="bdm-new-time">{t('New time', 'الوقت الجديد')} ({booking.student_timezone || t('local', 'محلي')})</label>
                      <input id="bdm-new-time" type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className={fieldClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1" htmlFor="bdm-reason">
                      {isSuperAdmin ? t('Reason (optional)', 'السبب (اختياري)') : t('Reason (required, the student sees it)', 'السبب (إجباري، الطالب هيشوفه)')}
                    </label>
                    <input id="bdm-reason" type="text" value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} maxLength={500} className={fieldClass} />
                  </div>
                  {!isSuperAdmin && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('The new time must be tomorrow or later. If the lesson is less than 3 hours away, WhatsApp opens with a message to the admin after you confirm.', 'الميعاد الجديد لازم يكون من بكرة أو بعده. ولو فاضل على الحصة أقل من ٣ ساعات، هيفتحلك واتساب برسالة للإدارة بعد التأكيد.')}
                    </p>
                  )}
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={rescheduling || !newStartDate || !newStartTime || (!isSuperAdmin && rescheduleReason.trim().length < 3)}
                    className="w-full py-2 text-sm font-semibold text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {rescheduling ? t('Moving and updating the calendar…', 'جارٍ التغيير وتحديث التقويم…') : t('Confirm new time', 'أكّد الميعاد الجديد')}
                  </button>
                </div>
              )}

              {isCancelling && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      {t('Cancel the lesson', 'إلغاء الحصة')}
                    </h4>
                    <button onClick={() => setIsCancelling(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      {t('Back', 'رجوع')}
                    </button>
                  </div>
                  <input
                    aria-label={t('Reason for cancelling', 'سبب الإلغاء')}
                    type="text"
                    placeholder={t('Reason (e.g. requested by the student, emergency)', 'السبب (مثلاً بطلب الطالب، ظرف طارئ)')}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full p-2 text-sm glass-card border-none rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40"
                  />
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="w-full py-2 text-sm font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {cancelling ? t('Cancelling…', 'جارٍ الإلغاء…') : t('Confirm cancellation', 'أكّد الإلغاء')}
                  </button>
                </div>
              )}

              {isMarkingCompleted && (
                <div className="p-4 bg-secondary/30 border border-secondary/50 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                      {t('Record a completed lesson', 'سجّل إن الحصة تمت')}
                    </h4>
                    <button onClick={() => setIsMarkingCompleted(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      {t('Back', 'رجوع')}
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="bdm-covered">
                      {t('What was covered', 'اللي اتشرح')} <span className="text-muted-foreground font-normal">({t('surah / ayahs, page, topics', 'سورة / آيات، صفحة، موضوعات')})</span>
                    </label>
                    <input
                      id="bdm-covered"
                      type="text"
                      placeholder={t('e.g. Al-Baqarah 1–25, rules of Meem Sakinah', 'مثلاً: البقرة 1–25، أحكام الميم الساكنة')}
                      value={coveredMaterial}
                      onChange={(e) => setCoveredMaterial(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="bdm-observations">
                      {t('Notes', 'ملاحظات')} <span className="text-muted-foreground font-normal">({t('optional', 'اختياري')})</span>
                    </label>
                    <input
                      id="bdm-observations"
                      type="text"
                      placeholder={t('e.g. Good Tajweed, review ayah 15 next time', 'مثلاً: تجويد كويس، نراجع آية 15 المرة الجاية')}
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <button
                    onClick={handleConfirmCompleted}
                    disabled={markingCompleted}
                    className="w-full py-2 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {markingCompleted ? t('Saving…', 'جارٍ الحفظ…') : t('Confirm lesson completed', 'أكّد إن الحصة تمت')}
                  </button>
                </div>
              )}

              {isMarkingNoShow && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-warning flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5" />
                      {t('Record a no-show', 'سجّل غياب الطالب')}
                    </h4>
                    <button onClick={() => setIsMarkingNoShow(false)} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      {t('Back', 'رجوع')}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-semibold text-foreground">{t('Package credit', 'رصيد الباقة')}:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNoShowCreditDecision('returned')}
                        aria-pressed={noShowCreditDecision === 'returned'}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                          noShowCreditDecision === 'returned' ? 'glass-card border-primary ring-1 ring-primary text-foreground' : 'glass-card/60 border-border text-muted-foreground glass-hover hover:bg-surface'
                        }`}
                      >
                        <span className="font-semibold text-sm block text-foreground">{t('Keep the credit', 'خلّي الرصيد')}</span>
                        <span className="text-[13px] text-muted-foreground block mt-0.5">{t('The lesson stays in the package.', 'الحصة تفضل في الباقة.')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoShowCreditDecision('used')}
                        aria-pressed={noShowCreditDecision === 'used'}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                          noShowCreditDecision === 'used' ? 'glass-card border-warning ring-1 ring-warning text-foreground' : 'glass-card/60 border-border text-muted-foreground glass-hover hover:bg-surface'
                        }`}
                      >
                        <span className="font-semibold text-sm block text-foreground">{t('Use 1 credit', 'اخصم حصة')}</span>
                        <span className="text-[13px] text-muted-foreground block mt-0.5">{t('The missed lesson counts as taken.', 'الحصة اللي اتفوتت تتحسب.')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-foreground mb-1" htmlFor="bdm-noshow">
                      {t('Note', 'ملاحظة')} <span className="text-muted-foreground font-normal">({t('optional', 'اختياري')})</span>
                    </label>
                    <input
                      id="bdm-noshow"
                      type="text"
                      placeholder={t('e.g. Did not join, waited 15 minutes', 'مثلاً: ما دخلش، استنيت 15 دقيقة')}
                      value={noShowReason}
                      onChange={(e) => setNoShowReason(e.target.value)}
                      className="w-full p-2 text-sm glass-card border-none rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-warning/40"
                    />
                  </div>
                  <button
                    onClick={handleConfirmNoShow}
                    disabled={markingNoShow}
                    className="w-full py-2 text-sm font-semibold text-warning-foreground bg-warning hover:bg-warning/90 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {markingNoShow ? t('Saving…', 'جارٍ الحفظ…') : t('Confirm no-show', 'أكّد الغياب')}
                  </button>
                </div>
              )}

              {/* Before the lesson: Jalila's prep. After it (or from "Record summary"): the family summary. */}
              {isUpcoming && booking.student_id && <JalilaBrief studentId={booking.student_id} />}
              {(booking.status === 'completed' || isMarkingCompleted || openSummaryEditor) && booking.student_id && (
                <PostLessonSummaryEditor
                  studentId={String(booking.student_id)}
                  studentName={booking.contact_name}
                  bookingId={booking.id}
                  subjectHint={booking.service_id || booking.service_name}
                  compact={true}
                  onSaved={() => onBookingUpdated?.()}
                />
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
                <div className="flex flex-wrap items-center gap-2">
                  {booking.status === 'completed' && (
                    <span className="px-3.5 py-2 text-sm font-semibold text-primary bg-primary/15 rounded-xl border border-secondary/60 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {t('Completed', 'تمت')}
                    </span>
                  )}
                  {booking.status === 'no_show' && (
                    <span className="px-3.5 py-2 text-sm font-semibold text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-1.5">
                      <UserX className="w-4 h-4" />
                      {t('No-show', 'غياب')}
                    </span>
                  )}

                  {isActive && (
                    <>
                      {!isMarkingCompleted && (
                        <button
                          onClick={() => { closeOtherPanels(); setIsMarkingCompleted(true); }}
                          disabled={markingCompleted || notStartedYet}
                          title={notStartedYet ? t('Available once the lesson starts', 'متاح لما الحصة تبدأ') : undefined}
                          className="px-3.5 py-2 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
                        >
                          <CalendarCheck2 className="w-4 h-4" />
                          {t('Mark completed', 'الحصة تمت')}
                        </button>
                      )}
                      {!isMarkingNoShow && (
                        <button
                          onClick={() => { closeOtherPanels(); setIsMarkingNoShow(true); }}
                          disabled={notStartedYet}
                          title={notStartedYet ? t('Available once the lesson starts', 'متاح لما الحصة تبدأ') : undefined}
                          className="px-3.5 py-2 text-sm font-medium text-warning bg-warning/15 hover:bg-warning/25 rounded-xl border border-warning/30 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          {t('No-show', 'غياب')}
                        </button>
                      )}
                    </>
                  )}

                  {isUpcoming && !isRequestingMove && (
                    <button
                      onClick={() => { closeOtherPanels(); setIsRequestingMove(true); }}
                      className="px-3.5 py-2 text-sm font-medium text-foreground hover:bg-surface-subtle rounded-xl border border-border transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t('Ask to reschedule', 'اطلب تغيير الميعاد')}
                    </button>
                  )}

                  {(isSuperAdmin ? booking.status !== 'cancelled' : isUpcoming) && !isRescheduling && (
                    <button
                      onClick={() => { closeOtherPanels(); setIsRescheduling(true); }}
                      className="px-3.5 py-2 text-sm font-medium text-foreground hover:bg-surface-subtle rounded-xl border border-border transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('Move lesson', 'غيّر الميعاد')}
                    </button>
                  )}

                  {isSuperAdmin && booking.status !== 'cancelled' && !isCancelling && (
                    <button
                      onClick={() => { closeOtherPanels(); setIsCancelling(true); }}
                      className="px-3.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/15 rounded-xl border border-destructive/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {t('Cancel lesson', 'ألغِ الحصة')}
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer min-h-[40px]"
                >
                  {t('Close', 'إغلاق')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {booking && isSuperAdmin && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={booking.id}
          studentId={booking.student_id}
          bookingReference={booking.reference_code}
          contactName={booking.contact_name}
          expectedAmount={booking.expected_amount}
          defaultCurrency={booking.currency || ''}
          onPaymentRecorded={refresh}
        />
      )}
    </div>
    </FocusTrap>
  );
};
