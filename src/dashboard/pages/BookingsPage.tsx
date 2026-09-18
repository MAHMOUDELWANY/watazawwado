import React, { useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Video, 
  AlertCircle, 
  Filter, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  RotateCcw, 
  Globe, 
  FileText, 
  User, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { dashboardFetch } from '../lib/dashboardApi';
import { 
  DashboardBookingListItem, 
  BookingsOperationalSummary, 
  BookingPaymentStatus, 
  DashboardPayment, 
  PaymentMethodType 
} from '../types';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';

export default function BookingsPage() {
  const { session } = useTeacherAuth();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'bookings' | 'payments'>('bookings');

  // Bookings list state
  const [bookings, setBookings] = useState<DashboardBookingListItem[]>([]);
  const [summary, setSummary] = useState<BookingsOperationalSummary>({
    total_bookings: 0,
    upcoming_count: 0,
    unpaid_upcoming_count: 0,
    pending_payments_count: 0,
    recently_confirmed_count: 0,
    completed_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for bookings
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Payments tab state
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('all');
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Modals state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{
    bookingId?: string | null;
    studentId?: string | null;
    bookingReference?: string | null;
    contactName?: string | null;
    expectedAmount?: number | null;
  } | null>(null);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (paymentFilter !== 'all') params.set('payment_status', paymentFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (dateFilter !== 'all') params.set('date_range', dateFilter);
      if (search.trim()) params.set('search', search.trim());

      const data = await dashboardFetch(`/api/dashboard/bookings?${params.toString()}`);
      setBookings(data.bookings || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      setError(err?.message || "Bookings ledger couldn't be loaded right now.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, typeFilter, dateFilter, search]);

  // Fetch payments for secondary tab
  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const params = new URLSearchParams();
      if (paymentsStatusFilter !== 'all') params.set('status', paymentsStatusFilter);
      const data = await dashboardFetch(`/api/dashboard/payments?${params.toString()}`);
      setPaymentsList(data.payments || []);
    } catch (err) {
      console.warn('[Fetch Payments Error]', err);
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentsStatusFilter]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else {
      fetchPayments();
    }
  }, [activeTab, fetchBookings, fetchPayments]);

  // Payment quick confirm/reject from payments tab
  const handleConfirmPaymentRow = async (paymentId: string) => {
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/confirm`, { method: 'POST' });
      fetchPayments();
      fetchBookings();
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm payment.');
    }
  };

  const handleRejectPaymentRow = async (paymentId: string) => {
    const reason = window.prompt('Please enter the reason for rejection (optional):');
    if (reason === null) return;
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      fetchPayments();
      fetchBookings();
    } catch (err: any) {
      alert(err?.message || 'Failed to reject payment.');
    }
  };

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
          text: 'Paid',
          classes: 'bg-success/15 text-success border-success/30'
        };
      case 'pending_review':
        return {
          text: 'Pending Review',
          classes: 'bg-warning/15 text-warning border-warning/30'
        };
      case 'unpaid':
        return {
          text: 'Unpaid',
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
          text: 'Free Trial',
          classes: 'bg-primary/15 text-primary border-primary/30'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Bookings & Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student teaching appointments, manual payments, and financial settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaymentModalData({})}
            className="px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </header>

      {/* Operational Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium block">Total Bookings</span>
          <span className="text-xl font-bold text-foreground mt-1 block">
            {summary.total_bookings}
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium block">Upcoming Lessons</span>
          <span className="text-xl font-bold text-foreground mt-1 block">
            {summary.upcoming_count}
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs">
          <span className="text-xs text-warning font-medium block">Unpaid Upcoming</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-warning">
              {summary.unpaid_upcoming_count}
            </span>
            {summary.unpaid_upcoming_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-semibold">
                Action
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs">
          <span className="text-xs text-warning font-medium block">Payments to Verify</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-warning">
              {summary.pending_payments_count}
            </span>
            {summary.pending_payments_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-semibold">
                Pending
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-xs text-success font-medium block">Completed Lessons</span>
          <span className="text-xl font-bold text-success mt-1 block">
            {summary.completed_count}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-surface text-foreground border-t border-x border-border shadow-2xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle/50'
          }`}
        >
          Bookings & Lessons ({summary.total_bookings})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-surface text-foreground border-t border-x border-border shadow-2xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle/50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          All Payments Ledger
          {summary.pending_payments_count > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-warning text-warning-foreground text-[10px] font-bold">
              {summary.pending_payments_count}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-2xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by student, parent, email, or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-8 pe-3 py-1.5 text-xs bg-surface-subtle border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-subtle border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-subtle border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending_review">Pending Review</option>
                <option value="paid">Paid</option>
                <option value="free_trial">Free Trial</option>
                <option value="partially_paid">Partially Paid</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Timing:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-subtle border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="today">Today</option>
                <option value="past">Past</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchBookings}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer"
              title="Refresh bookings"
              aria-label="Refresh bookings"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-surface rounded-2xl h-24 border border-border"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <h3 className="text-sm font-medium text-destructive mb-1">{error}</h3>
              <button 
                onClick={fetchBookings}
                className="mt-3 px-4 py-2 bg-destructive text-destructive-foreground text-xs font-semibold rounded-xl hover:bg-destructive/90 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No bookings match your current filters</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try resetting or clearing your search criteria to see all scheduled lessons.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const startUtc = DateTime.fromISO(b.scheduled_start);
                const startCairo = startUtc.setZone('Africa/Cairo');
                let startStudent: DateTime | null = null;
                try {
                  if (b.student_timezone) {
                    startStudent = startUtc.setZone(b.student_timezone);
                  }
                } catch {
                  startStudent = null;
                }

                const paymentBadgeInfo = getPaymentBadge(b.payment_status);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className="bg-surface hover:bg-surface-subtle/80 p-4 sm:p-5 rounded-2xl border border-border shadow-2xs cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Left: Learner & Lesson Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary group-hover:underline">
                          {b.reference_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBookingStatusBadge(b.status)}`}>
                          {b.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${paymentBadgeInfo.classes}`}>
                          {paymentBadgeInfo.text}
                        </span>
                        {b.booking_type === 'trial' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20">
                            Trial
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {b.contact_name}
                        </h3>
                        {b.parent_name && (
                          <span className="text-xs text-muted-foreground">
                            (Parent: {b.parent_name})
                          </span>
                        )}
                        <span className="text-border">•</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {b.service_name} ({b.duration_minutes} min)
                        </span>
                      </div>

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          Cairo: {startCairo.toFormat('EEE, LLL dd • hh:mm a')}
                        </span>
                        {startStudent && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            Local: {startStudent.toFormat('hh:mm a')} ({b.student_timezone})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment Overview & Quick Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border justify-between md:justify-end">
                      <div className="text-end">
                        <span className="text-[11px] text-muted-foreground block">
                          {b.booking_type === 'trial' ? 'Trial Session' : 'Payment Status'}
                        </span>
                        <div className="text-xs font-semibold">
                          {b.booking_type === 'trial' ? (
                            <span className="text-primary">$0.00 (Free)</span>
                          ) : b.confirmed_amount > 0 ? (
                            <span className="text-success">
                              ${b.confirmed_amount.toFixed(2)} / {b.expected_amount !== null ? `$${b.expected_amount.toFixed(2)}` : 'Not set'}
                            </span>
                          ) : b.payment_status === 'pending_review' ? (
                            <span className="text-warning">Payment in Review</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {b.expected_amount !== null ? `Due: $${b.expected_amount.toFixed(2)}` : 'Fee not set'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {b.payment_status === 'pending_review' ? (
                          <button
                            onClick={() => setSelectedBookingId(b.id)}
                            className="px-3 py-1.5 text-xs font-medium text-warning bg-warning/15 hover:bg-warning/25 rounded-xl border border-warning/30 transition-colors cursor-pointer min-h-[36px]"
                          >
                            Review Payment
                          </button>
                        ) : b.payment_status === 'unpaid' ? (
                          <button
                            onClick={() => setPaymentModalData({
                              bookingId: b.id,
                              studentId: b.student_id,
                              bookingReference: b.reference_code,
                              contactName: b.contact_name,
                              expectedAmount: b.expected_amount
                            })}
                            className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface hover:bg-surface-subtle border border-border rounded-xl transition-colors cursor-pointer min-h-[36px]"
                          >
                            Record Payment
                          </button>
                        ) : null}

                        <button
                          onClick={() => setSelectedBookingId(b.id)}
                          className="p-2 rounded-xl text-muted-foreground group-hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Open Booking Details"
                          aria-label={`Open details for booking ${b.reference_code}`}
                        >
                          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL PAYMENTS LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-surface p-3.5 rounded-2xl border border-border shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Status Filter:</span>
              <select
                value={paymentsStatusFilter}
                onChange={(e) => setPaymentsStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-subtle border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending Review</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={fetchPayments}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer"
              aria-label="Refresh payments ledger"
              title="Refresh payments ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingPayments ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface rounded-2xl h-20 border border-border"></div>
              ))}
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-2">
              <DollarSign className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No payment records found</h3>
              <p className="text-xs text-muted-foreground">Record payments manually or when learners report payment claims.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentsList.map((p) => (
                <div
                  key={p.id}
                  className="bg-surface p-4 rounded-2xl border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        ${Number(p.amount).toFixed(2)} {p.currency}
                      </span>
                      <span className="text-border">•</span>
                      <span className="capitalize font-medium text-foreground">
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
                      {p.contact_name && (
                        <span>Student: <strong className="text-foreground">{p.contact_name}</strong></span>
                      )}
                      {p.booking_reference && (
                        <span>Booking: <span className="font-mono text-foreground font-semibold">{p.booking_reference}</span></span>
                      )}
                      {p.payment_reference && (
                        <span>Ref: <span className="font-mono text-foreground">{p.payment_reference}</span></span>
                      )}
                      <span>Logged: {DateTime.fromISO(p.created_at).toFormat('LLL dd, yyyy • hh:mm a')}</span>
                    </div>

                    {p.notes && (
                      <p className="text-[11px] text-muted-foreground italic">
                        Note: {p.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions for pending payments */}
                  {p.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleConfirmPaymentRow(p.id)}
                        className="px-3.5 py-2 text-xs font-semibold text-success-foreground bg-success hover:bg-success/90 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Receipt
                      </button>
                      <button
                        onClick={() => handleRejectPaymentRow(p.id)}
                        className="px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/15 border border-destructive/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
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
      )}

      {/* Booking Detail Modal */}
      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          isOpen={Boolean(selectedBookingId)}
          onClose={() => setSelectedBookingId(null)}
          onBookingUpdated={() => {
            fetchBookings();
            if (activeTab === 'payments') fetchPayments();
          }}
        />
      )}

      {/* Record Manual Payment Modal */}
      {paymentModalData && (
        <RecordPaymentModal
          isOpen={Boolean(paymentModalData)}
          onClose={() => setPaymentModalData(null)}
          bookingId={paymentModalData.bookingId}
          studentId={paymentModalData.studentId}
          bookingReference={paymentModalData.bookingReference}
          contactName={paymentModalData.contactName}
          expectedAmount={paymentModalData.expectedAmount}
          onPaymentRecorded={() => {
            fetchBookings();
            if (activeTab === 'payments') fetchPayments();
          }}
        />
      )}
    </div>
  );
}
