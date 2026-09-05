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
  Plus
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
    try {
      await dashboardFetch(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      });
      setActionMessage({ type: 'success', text: 'Booking marked as completed.' });
      loadBooking();
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to update booking status.' });
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
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50';
      default:
        return 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-200';
    }
  };

  const getPaymentBadge = (status: BookingPaymentStatus) => {
    switch (status) {
      case 'paid':
        return {
          text: 'Payment Confirmed',
          classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300'
        };
      case 'pending_review':
        return {
          text: 'Payment Pending Review',
          classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300'
        };
      case 'unpaid':
        return {
          text: 'Payment Unpaid',
          classes: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300'
        };
      case 'partially_paid':
        return {
          text: 'Partially Paid',
          classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300'
        };
      case 'payment_rejected':
        return {
          text: 'Payment Rejected',
          classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300'
        };
      case 'free_trial':
      default:
        return {
          text: 'Free Trial ($0)',
          classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-300'
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
        className="bg-[#FAF8F5] dark:bg-[#231E28] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D5D0CA]/40 dark:border-[#3E3545] flex items-center justify-between bg-white/60 dark:bg-[#2A2431]/60">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="booking-detail-title" className="text-lg font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                  Booking {booking?.reference_code}
                </h2>
                {booking && (
                  <button
                    onClick={() => copyToClipboard(booking.reference_code, 'ref')}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    title="Copy reference code"
                  >
                    {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-[#362E3B]/70 dark:text-[#F5E6D3]/70">
                Created on {booking ? DateTime.fromISO(booking.created_at).toFormat('LLL dd, yyyy') : '...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {booking && (
              <>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getBookingStatusBadge(booking.status)}`}>
                  {booking.status.toUpperCase()}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getPaymentBadge(booking.payment_status).classes}`}>
                  {getPaymentBadge(booking.payment_status).text}
                </span>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action alert if any */}
        {actionMessage && (
          <div className={`px-6 py-2 text-xs flex items-center justify-between ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-stone-200 dark:bg-stone-800 rounded-xl"></div>
              <div className="h-32 bg-stone-200 dark:bg-stone-800 rounded-xl"></div>
              <div className="h-24 bg-stone-200 dark:bg-stone-800 rounded-xl"></div>
            </div>
          ) : error || !booking ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-800 dark:text-red-400">{error || 'Booking not found'}</p>
            </div>
          ) : (
            <>
              {/* Top Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Learner & Contact Card */}
                <div className="bg-white dark:bg-[#1E1923] p-4 rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8FAE9B]" />
                      Learner & Contact
                    </span>
                    {booking.student_id ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium">
                        Active Student
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 font-medium">
                        Guest Learner
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-[#362E3B] dark:text-[#F5E6D3]">
                      {booking.contact_name}
                    </h3>
                    {booking.parent_name && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        Parent / Guardian: <span className="font-medium text-stone-700 dark:text-stone-300">{booking.parent_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Mail className="w-3.5 h-3.5" /> Email:
                      </span>
                      <a 
                        href={`mailto:${booking.contact_email}`} 
                        className="font-mono text-[11px] hover:underline text-[#6F907D] font-medium"
                      >
                        {booking.contact_email}
                      </a>
                    </div>

                    {booking.contact_whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-stone-500">
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp:
                        </span>
                        <a 
                          href={buildContextualWhatsAppUrl(
                            booking.contact_whatsapp,
                            `As-salamu alaykum ${booking.contact_name},\nThis is Ustadh Mahmoud regarding booking ${booking.reference_code}.`
                          )} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:underline text-emerald-600 font-medium"
                        >
                          {booking.contact_whatsapp}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Globe className="w-3.5 h-3.5" /> Timezone:
                      </span>
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {booking.student_timezone || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lesson & Scheduling Card */}
                <div className="bg-white dark:bg-[#1E1923] p-4 rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#8FAE9B]" />
                      Lesson Details
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 font-medium">
                      {booking.booking_type === 'trial' ? 'Free Trial' : 'Regular 1-on-1'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-[#362E3B] dark:text-[#F5E6D3]">
                      {booking.service_name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Duration: <span className="font-medium text-stone-700 dark:text-stone-300">{booking.duration_minutes} Minutes</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    <div className="flex items-start justify-between">
                      <span className="text-stone-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Cairo Time:
                      </span>
                      <span className="font-medium text-stone-800 dark:text-stone-200 text-right">
                        {startCairo ? startCairo.toFormat('EEE, LLL dd, yyyy • hh:mm a') : '...'}
                      </span>
                    </div>

                    {startStudent && (
                      <div className="flex items-start justify-between">
                        <span className="text-stone-500 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Student Time:
                        </span>
                        <span className="font-medium text-stone-700 dark:text-stone-300 text-right">
                          {startStudent.toFormat('EEE, LLL dd, yyyy • hh:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Integrations Bar: Zoom & Google Calendar */}
              <div className="bg-white dark:bg-[#1E1923] p-4 rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#8FAE9B]" />
                    Online Classroom & Calendar Sync
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    booking.google_calendar_event_id 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                  }`}>
                    {booking.google_calendar_event_id ? 'Google Calendar Synced' : 'Calendar Local'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
                      Zoom Meeting Room:
                    </p>
                    {booking.zoom_meeting_link ? (
                      <span className="font-mono text-xs text-stone-600 dark:text-stone-400 truncate max-w-sm block">
                        {booking.zoom_meeting_link}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400 italic">
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
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#6F907D] hover:bg-[#5E7D6B] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Launch as Host
                      </a>
                    )}
                    {booking.zoom_meeting_link && (
                      <button
                        onClick={() => copyToClipboard(booking.zoom_meeting_link || '', 'zoom')}
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copiedField === 'zoom' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Link
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PAYMENT RECONCILIATION SECTION */}
              <div className="bg-white dark:bg-[#1E1923] p-5 rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#8FAE9B]" />
                      Payment Tracking & Reconciliation
                    </span>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Manual ledger verification and financial settlement
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#6F907D] hover:bg-[#5E7D6B] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#FAF8F5] dark:bg-[#2A2431] rounded-xl border border-[#D5D0CA]/40 dark:border-[#3E3545]">
                    <span className="text-[11px] text-stone-500 block">Expected Fee</span>
                    <span className="text-base font-semibold text-stone-800 dark:text-stone-200">
                      {booking.booking_type === 'trial' 
                        ? 'Free Trial ($0.00)' 
                        : booking.expected_amount !== null 
                          ? `$${booking.expected_amount.toFixed(2)}${booking.currency ? ` ${booking.currency}` : ''}` 
                          : 'Not set'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] dark:bg-[#2A2431] rounded-xl border border-[#D5D0CA]/40 dark:border-[#3E3545]">
                    <span className="text-[11px] text-stone-500 block">Confirmed Received</span>
                    <span className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
                      ${booking.confirmed_amount.toFixed(2)} {booking.currency}
                    </span>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] dark:bg-[#2A2431] rounded-xl border border-[#D5D0CA]/40 dark:border-[#3E3545]">
                    <span className="text-[11px] text-stone-500 block">Reconciliation State</span>
                    <span className="text-xs font-semibold mt-1 block">
                      <span className={`px-2 py-0.5 rounded-md ${getPaymentBadge(booking.payment_status).classes}`}>
                        {getPaymentBadge(booking.payment_status).text}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Payment Records List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Payment History ({booking.payments?.length || 0} record{booking.payments?.length === 1 ? '' : 's'})
                  </h4>

                  {(!booking.payments || booking.payments.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
                      {booking.booking_type === 'trial' 
                        ? 'No payments needed for this trial lesson.' 
                        : 'No payment records submitted or logged for this booking yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {booking.payments.map((p) => (
                        <div 
                          key={p.id} 
                          className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900 dark:text-stone-100">
                                ${Number(p.amount).toFixed(2)} {p.currency}
                              </span>
                              <span className="text-stone-400">•</span>
                              <span className="capitalize text-stone-600 dark:text-stone-300 font-medium">
                                {p.payment_method.replace(/_/g, ' ')}
                              </span>
                              <span className="text-stone-400">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.status === 'confirmed' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
                                  : p.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              }`}>
                                {p.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              {p.payment_reference && (
                                <span>Ref: <span className="font-mono text-stone-700 dark:text-stone-300">{p.payment_reference}</span></span>
                              )}
                              <span>Logged: {DateTime.fromISO(p.created_at).toFormat('LLL dd, hh:mm a')}</span>
                              {p.confirmed_at && (
                                <span className="text-emerald-600">Confirmed: {DateTime.fromISO(p.confirmed_at).toFormat('LLL dd')}</span>
                              )}
                            </div>

                            {p.notes && (
                              <p className="text-[11px] text-stone-600 dark:text-stone-400 italic">
                                Note: {p.notes}
                              </p>
                            )}
                          </div>

                          {/* Action buttons for pending payments */}
                          {p.status === 'pending' && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleConfirmPayment(p.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirm
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1"
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
              <div className="bg-white dark:bg-[#1E1923] p-4 rounded-xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#8FAE9B]" />
                  Internal Teacher Notes
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private lesson observation, payment agreements, or pedagogical notes..."
                  className="w-full p-2.5 text-xs bg-[#FAF8F5] dark:bg-[#141017] border border-[#D5D0CA]/70 dark:border-[#3E3545] rounded-xl text-[#362E3B] dark:text-[#F5E6D3] focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-[#D5D0CA] dark:border-[#3E3545] transition-colors disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

              {/* Reschedule Drawer/Box */}
              {isRescheduling && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reschedule Lesson Time
                    </h4>
                    <button onClick={() => setIsRescheduling(false)} className="text-xs text-stone-400 hover:text-stone-600">
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-600 dark:text-stone-400 mb-1">New Date</label>
                      <input 
                        type="date" 
                        value={newStartDate} 
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full p-2 text-xs bg-white dark:bg-[#1E1923] border border-purple-200 dark:border-purple-800 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-600 dark:text-stone-400 mb-1">New Time ({booking.student_timezone || 'Local'})</label>
                      <input 
                        type="time" 
                        value={newStartTime} 
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full p-2 text-xs bg-white dark:bg-[#1E1923] border border-purple-200 dark:border-purple-800 rounded-lg"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={rescheduling || !newStartDate || !newStartTime}
                    className="w-full py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {rescheduling ? 'Rescheduling & Syncing Calendar...' : 'Confirm Rescheduled Time'}
                  </button>
                </div>
              )}

              {/* Cancellation Box */}
              {isCancelling && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Booking
                    </h4>
                    <button onClick={() => setIsCancelling(false)} className="text-xs text-stone-400 hover:text-stone-600">
                      Dismiss
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Reason for cancellation (e.g. Requested by student, emergency)"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full p-2 text-xs bg-white dark:bg-[#1E1923] border border-red-200 dark:border-red-800 rounded-lg"
                  />
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="w-full py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling & Syncing Calendar...' : 'Confirm Cancellation'}
                  </button>
                </div>
              )}

              {/* Master Booking Controls Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#D5D0CA]/40 dark:border-[#3E3545]">
                <div className="flex items-center gap-2">
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <button
                      onClick={handleMarkCompleted}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CalendarCheck2 className="w-4 h-4" />
                      Mark Completed
                    </button>
                  )}

                  {booking.status !== 'cancelled' && !isRescheduling && (
                    <button
                      onClick={() => setIsRescheduling(true)}
                      className="px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-[#D5D0CA] dark:border-[#3E3545] transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reschedule
                    </button>
                  )}

                  {booking.status !== 'cancelled' && !isCancelling && (
                    <button
                      onClick={() => setIsCancelling(true)}
                      className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Booking
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
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
