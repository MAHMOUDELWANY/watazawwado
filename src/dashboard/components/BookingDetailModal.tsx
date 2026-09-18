import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CalendarCheck2,
  ChevronRight,
  Plus,
  UserX
} from 'lucide-react';
import { DashboardBookingDetail, DashboardPayment, BookingPaymentStatus } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildContextualWhatsAppUrl } from '../lib/whatsapp';
import { RecordPaymentModal } from './RecordPaymentModal';

interface BookingDetailModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onBookingUpdated
}) => {
  const [booking, setBooking] = useState<DashboardBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Note editing state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // No-Show state
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [markingCompleted, setMarkingCompleted] = useState(false);

  // Record payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load single booking
  const loadBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardFetch(`/api/dashboard/bookings/${bookingId}`);
      if (data?.booking) {
        setBooking(data.booking);
        setNotes(data.booking.notes || '');
      } else {
        setError('Booking details could not be found.');
      }
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBooking();
      setIsRescheduling(false);
      setIsCancelling(false);
      setActionMessage(null);
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showPaymentModal) {
        onClose();
      }
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

  // Actions
  const handleSaveNotes = async () => {
    if (!booking) return;
    setSavingNotes(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes })
      });
      setActionMessage({ type: 'success', text: 'Internal notes saved.' });
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to save notes.' });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!booking) return;
    if (!window.confirm('Mark lesson as completed?\n\nThis records that the lesson took place.')) return;
    setMarkingCompleted(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      });
      setActionMessage({ type: 'success', text: 'Booking marked as completed.' });
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to update booking status.' });
    } finally {
      setMarkingCompleted(false);
    }
  };

  const handleConfirmNoShow = async () => {
    if (!booking) return;
    if (!window.confirm('Mark student as no-show?\n\nThis records that the scheduled lesson did not take place because the student did not attend.')) return;
    setMarkingNoShow(true);
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'no_show',
          notes: noShowReason.trim()
            ? (booking.notes ? `${booking.notes}\n[No-Show Note]: ${noShowReason.trim()}` : `[No-Show Note]: ${noShowReason.trim()}`)
            : undefined
        })
      });
      setActionMessage({ type: 'success', text: 'Booking marked as No-Show.' });
      setIsMarkingNoShow(false);
      setNoShowReason('');
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to mark booking as no-show.' });
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
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: cancellationReason.trim() || 'Cancelled by teacher'
        })
      });
      setActionMessage({ type: 'success', text: 'Booking cancelled safely.' });
      setIsCancelling(false);
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to cancel booking.' });
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!booking || !newStartDate || !newStartTime) return;
    setRescheduling(true);
    try {
      // Build ISO UTC timestamps
      const dtLocal = DateTime.fromISO(`${newStartDate}T${newStartTime}`, { zone: booking.student_timezone || 'Africa/Cairo' });
      if (!dtLocal.isValid) {
        setActionMessage({ type: 'error', text: 'Invalid date or time.' });
        setRescheduling(false);
        return;
      }
      const newStartUtc = dtLocal.toUTC().toISO();
      const newEndUtc = dtLocal.plus({ minutes: booking.duration_minutes || 30 }).toUTC().toISO();
      const cairoDisplay = dtLocal.setZone('Africa/Cairo').toFormat('yyyy-MM-dd HH:mm');

      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rescheduled',
          scheduled_start: newStartUtc,
          scheduled_end: newEndUtc,
          cairo_time_display: cairoDisplay
        })
      });

      setActionMessage({ type: 'success', text: 'Booking rescheduled successfully.' });
      setIsRescheduling(false);
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to reschedule booking.' });
    } finally {
      setRescheduling(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/confirm`, {
        method: 'POST'
      });
      setActionMessage({ type: 'success', text: 'Payment confirmed successfully.' });
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to confirm payment.' });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = window.prompt('Please enter the reason for rejection (optional):');
    if (reason === null) return; // User cancelled prompt

    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      setActionMessage({ type: 'success', text: 'Payment marked as rejected.' });
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to reject payment.' });
    }
  };

  // Helper formatting
  const startUtc = booking ? DateTime.fromISO(booking.scheduled_start) : null;
  const startCairo = startUtc ? startUtc.setZone('Africa/Cairo') : null;
  let startStudent: DateTime | null = null;
  try {
    if (booking?.student_timezone && startUtc) {
      startStudent = startUtc.setZone(booking.student_timezone);
    }
  } catch {
    startStudent = null;
  }

  const getBookingStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-success/15 text-success border-success/30';
      case 'completed':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'pending':
        return 'bg-warning/15 text-warning border-warning/30';
      case 'cancelled':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'no_show':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'rescheduled':
        return 'bg-secondary/25 text-secondary-foreground border-secondary/40';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPaymentBadge = (status: BookingPaymentStatus) => {
    switch (status) {
      case 'paid':
        return {
          text: 'Payment Confirmed',
          classes: 'bg-success/15 text-success border-success/30'
        };
      case 'pending_review':
        return {
          text: 'Payment Pending Review',
          classes: 'bg-warning/15 text-warning border-warning/30'
        };
      case 'unpaid':
        return {
          text: 'Payment Unpaid',
          classes: 'bg-muted text-muted-foreground border-border'
        };
      case 'partially_paid':
        return {
          text: 'Partially Paid',
          classes: 'bg-warning/15 text-warning border-warning/30'
        };
      case 'payment_rejected':
        return {
          text: 'Payment Rejected',
          classes: 'bg-destructive/15 text-destructive border-destructive/30'
        };
      case 'free_trial':
      default:
        return {
          text: 'Free Trial ($0)',
          classes: 'bg-primary/15 text-primary border-primary/30'
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
    >
      <div 
        className="bg-surface border border-border rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="booking-detail-title" className="text-lg font-serif font-semibold text-foreground">
                  Booking {booking?.reference_code}
                </h2>
                {booking && (
                  <button
                    onClick={() => copyToClipboard(booking.reference_code, 'ref')}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Copy reference code"
                    aria-label="Copy reference code"
                  >
                    {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Created on {booking ? DateTime.fromISO(booking.created_at).toFormat('LLL dd, yyyy') : '...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {booking && (
              <>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getBookingStatusBadge(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </span>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPaymentBadge(booking.payment_status).classes}`}>
                  {getPaymentBadge(booking.payment_status).text}
                </span>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors ms-2 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action alert if any */}
        {actionMessage && (
          <div className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
            actionMessage.type === 'success' 
              ? 'bg-success/15 text-success border-success/30' 
              : 'bg-destructive/15 text-destructive border-destructive/30'
          }`}>
            <span>{actionMessage.text}</span>
            <button 
              onClick={() => setActionMessage(null)} 
              className="opacity-70 hover:opacity-100 p-1 cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-surface-subtle rounded-xl border border-border"></div>
              <div className="h-32 bg-surface-subtle rounded-xl border border-border"></div>
              <div className="h-24 bg-surface-subtle rounded-xl border border-border"></div>
            </div>
          ) : error || !booking ? (
            <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium text-destructive">{error || 'Booking not found'}</p>
            </div>
          ) : (
            <>
              {/* Top Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Learner & Contact Card */}
                <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Learner & Contact
                    </span>
                    {booking.student_id ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">
                        Active Student
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        Guest Learner
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {booking.contact_name}
                    </h3>
                    {booking.parent_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Parent / Guardian: <span className="font-medium text-foreground">{booking.parent_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> Email:
                      </span>
                      <a 
                        href={`mailto:${booking.contact_email}`} 
                        className="font-mono text-[11px] hover:underline text-primary font-medium"
                      >
                        {booking.contact_email}
                      </a>
                    </div>

                    {booking.contact_whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp:
                        </span>
                        <a 
                          href={buildContextualWhatsAppUrl(
                            booking.contact_whatsapp,
                            `As-salamu alaykum ${booking.contact_name},\nThis is Ustadh Mahmoud regarding booking ${booking.reference_code}.`
                          )} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:underline text-success font-medium"
                        >
                          {booking.contact_whatsapp}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" /> Timezone:
                      </span>
                      <span className="font-medium text-foreground">
                        {booking.student_timezone || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lesson & Scheduling Card */}
                <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                      Lesson Details
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-subtle text-muted-foreground border border-border font-medium">
                      {booking.booking_type === 'trial' ? 'Free Trial' : 'Regular 1-on-1'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {booking.service_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duration: <span className="font-medium text-foreground">{booking.duration_minutes} Minutes</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-foreground">
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Cairo Time:
                      </span>
                      <span className="font-medium text-foreground text-end">
                        {startCairo ? startCairo.toFormat('EEE, LLL dd, yyyy • hh:mm a') : '...'}
                      </span>
                    </div>

                    {startStudent && (
                      <div className="flex items-start justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Student Time:
                        </span>
                        <span className="font-medium text-foreground text-end">
                          {startStudent.toFormat('EEE, LLL dd, yyyy • hh:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Integrations Bar: Zoom & Google Calendar */}
              <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-primary" />
                    Online Classroom & Calendar Sync
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    booking.google_calendar_event_id 
                      ? 'bg-success/15 text-success border border-success/30' 
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {booking.google_calendar_event_id ? 'Google Calendar Synced' : 'Calendar Local'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      Zoom Meeting Room:
                    </p>
                    {booking.zoom_meeting_link ? (
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-sm block">
                        {booking.zoom_meeting_link}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No meeting link assigned yet
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.zoom_host_url && (
                      <a
                        href={booking.zoom_host_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Launch as Host
                      </a>
                    )}
                    {booking.zoom_meeting_link && (
                      <button
                        onClick={() => copyToClipboard(booking.zoom_meeting_link || '', 'zoom')}
                        className="px-3.5 py-2 text-xs font-medium text-foreground bg-surface-subtle hover:bg-surface border border-border rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        {copiedField === 'zoom' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Link
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PAYMENT RECONCILIATION SECTION */}
              <div className="bg-surface p-5 rounded-xl border border-border shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Payment Tracking & Reconciliation
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manual ledger verification and financial settlement
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-surface-subtle rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">Expected Fee</span>
                    <span className="text-base font-semibold text-foreground">
                      {booking.booking_type === 'trial' 
                        ? 'Free Trial ($0.00)' 
                        : booking.expected_amount !== null 
                          ? `$${booking.expected_amount.toFixed(2)}${booking.currency ? ` ${booking.currency}` : ''}` 
                          : 'Not set'}
                    </span>
                  </div>

                  <div className="p-3 bg-surface-subtle rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">Confirmed Received</span>
                    <span className="text-base font-semibold text-success">
                      ${booking.confirmed_amount.toFixed(2)} {booking.currency}
                    </span>
                  </div>

                  <div className="p-3 bg-surface-subtle rounded-xl border border-border">
                    <span className="text-[11px] text-muted-foreground block">Reconciliation State</span>
                    <span className="text-xs font-semibold mt-1 block">
                      <span className={`px-2 py-0.5 rounded-md border ${getPaymentBadge(booking.payment_status).classes}`}>
                        {getPaymentBadge(booking.payment_status).text}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Payment Records List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground">
                    Payment History ({booking.payments?.length || 0} record{booking.payments?.length === 1 ? '' : 's'})
                  </h4>

                  {(!booking.payments || booking.payments.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      {booking.booking_type === 'trial' 
                        ? 'No payments needed for this trial lesson.' 
                        : 'No payment records submitted or logged for this booking yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {booking.payments.map((p) => (
                        <div 
                          key={p.id} 
                          className="p-3 bg-surface-subtle rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                ${Number(p.amount).toFixed(2)} {p.currency}
                              </span>
                              <span className="text-border">•</span>
                              <span className="capitalize text-muted-foreground font-medium">
                                {p.payment_method.replace(/_/g, ' ')}
                              </span>
                              <span className="text-border">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                p.status === 'confirmed' 
                                  ? 'bg-success/15 text-success border-success/30' 
                                  : p.status === 'pending'
                                  ? 'bg-warning/15 text-warning border-warning/30' 
                                  : 'bg-destructive/15 text-destructive border-destructive/30'
                              }`}>
                                {p.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {p.payment_reference && (
                                <span>Ref: <span className="font-mono text-foreground">{p.payment_reference}</span></span>
                              )}
                              <span>Logged: {DateTime.fromISO(p.created_at).toFormat('LLL dd, hh:mm a')}</span>
                              {p.confirmed_at && (
                                <span className="text-success font-medium">Confirmed: {DateTime.fromISO(p.confirmed_at).toFormat('LLL dd')}</span>
                              )}
                            </div>

                            {p.notes && (
                              <p className="text-[11px] text-muted-foreground italic">
                                Note: {p.notes}
                              </p>
                            )}
                          </div>

                          {/* Action buttons for pending payments */}
                          {p.status === 'pending' && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleConfirmPayment(p.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-success-foreground bg-success hover:bg-success/90 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirm
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 border border-destructive/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Internal Notes Card */}
              <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Internal Teacher Notes
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private lesson observation, payment agreements, or pedagogical notes..."
                  className="w-full p-2.5 text-xs bg-surface-subtle border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface-subtle rounded-xl border border-border transition-colors disabled:opacity-50 cursor-pointer min-h-[36px]"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

              {/* Reschedule Drawer/Box */}
              {isRescheduling && (
                <div className="p-4 bg-secondary/15 border border-secondary/30 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-secondary-foreground flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reschedule Lesson Time
                    </h4>
                    <button onClick={() => setIsRescheduling(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">New Date</label>
                      <input 
                        type="date" 
                        value={newStartDate} 
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">New Time ({booking.student_timezone || 'Local'})</label>
                      <input 
                        type="time" 
                        value={newStartTime} 
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={rescheduling || !newStartDate || !newStartTime}
                    className="w-full py-2 text-xs font-semibold text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {rescheduling ? 'Rescheduling & Syncing Calendar...' : 'Confirm Rescheduled Time'}
                  </button>
                </div>
              )}

              {/* Cancellation Box */}
              {isCancelling && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Booking
                    </h4>
                    <button onClick={() => setIsCancelling(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      Dismiss
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Reason for cancellation (e.g. Requested by student, emergency)"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40"
                  />
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="w-full py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {cancelling ? 'Cancelling & Syncing Calendar...' : 'Confirm Cancellation'}
                  </button>
                </div>
              )}

              {/* No-Show Box */}
              {isMarkingNoShow && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-warning flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5" />
                      Record Student No-Show
                    </h4>
                    <button onClick={() => setIsMarkingNoShow(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      Dismiss
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Optional note (e.g. Student did not attend, waited 15 mins)"
                    value={noShowReason}
                    onChange={(e) => setNoShowReason(e.target.value)}
                    className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-warning/40"
                  />
                  <button
                    onClick={handleConfirmNoShow}
                    disabled={markingNoShow}
                    className="w-full py-2 text-xs font-semibold text-warning-foreground bg-warning hover:bg-warning/90 rounded-xl transition-colors disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    {markingNoShow ? 'Recording No-Show...' : 'Confirm Student No-Show'}
                  </button>
                </div>
              )}

              {/* Master Booking Controls Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
                <div className="flex flex-wrap items-center gap-2">
                  {booking.status === 'completed' && (
                    <span className="px-3.5 py-2 text-xs font-semibold text-primary bg-primary/15 rounded-xl border border-primary/30 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Completed
                    </span>
                  )}

                  {booking.status === 'no_show' && (
                    <span className="px-3.5 py-2 text-xs font-semibold text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-1.5">
                      <UserX className="w-4 h-4" />
                      Marked No-Show
                    </span>
                  )}

                  {booking.status !== 'completed' && booking.status !== 'no_show' && booking.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={handleMarkCompleted}
                        disabled={markingCompleted || Boolean(startUtc && startUtc > DateTime.now().plus({ minutes: 15 }))}
                        title={startUtc && startUtc > DateTime.now().plus({ minutes: 15 }) ? 'Cannot mark completed before lesson start time' : 'Mark lesson completed'}
                        className="px-3.5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
                      >
                        <CalendarCheck2 className="w-4 h-4" />
                        {markingCompleted ? 'Saving...' : 'Mark Completed'}
                      </button>

                      {!isMarkingNoShow && (
                        <button
                          onClick={() => setIsMarkingNoShow(true)}
                          disabled={Boolean(startUtc && startUtc > DateTime.now().plus({ minutes: 15 }))}
                          title={startUtc && startUtc > DateTime.now().plus({ minutes: 15 }) ? 'Cannot record no-show before lesson start time' : 'Record student no-show'}
                          className="px-3.5 py-2 text-xs font-medium text-warning bg-warning/15 hover:bg-warning/25 rounded-xl border border-warning/30 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          No-Show
                        </button>
                      )}
                    </>
                  )}

                  {booking.status !== 'cancelled' && !isRescheduling && (
                    <button
                      onClick={() => setIsRescheduling(true)}
                      className="px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface-subtle rounded-xl border border-border transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reschedule
                    </button>
                  )}

                  {booking.status !== 'cancelled' && !isCancelling && (
                    <button
                      onClick={() => setIsCancelling(true)}
                      className="px-3.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/15 rounded-xl border border-destructive/30 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Booking
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer min-h-[40px]"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Record Payment Sub-Modal */}
      {booking && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={booking.id}
          studentId={booking.student_id}
          bookingReference={booking.reference_code}
          contactName={booking.contact_name}
          expectedAmount={booking.expected_amount}
          defaultCurrency={booking.currency || ''}
          onPaymentRecorded={() => {
            loadBooking();
            if (onBookingUpdated) onBookingUpdated();
          }}
        />
      )}
    </div>
  );
};
