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
          text: 'Paid',
          classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200'
        };
      case 'pending_review':
        return {
          text: 'Pending Review',
          classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200'
        };
      case 'unpaid':
        return {
          text: 'Unpaid',
          classes: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300'
        };
      case 'partially_paid':
        return {
          text: 'Partially Paid',
          classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200'
        };
      case 'payment_rejected':
        return {
          text: 'Payment Rejected',
          classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200'
        };
      case 'free_trial':
      default:
        return {
          text: 'Free Trial',
          classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
            Bookings & Payments
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Manage student teaching appointments, manual payments, and financial settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaymentModalData({})}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#6F907D] hover:bg-[#5E7D6B] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </header>

      {/* Operational Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-[#1E1923] rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Total Bookings</span>
          <span className="text-xl font-bold text-stone-800 dark:text-stone-100 mt-1 block">
            {summary.total_bookings}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1923] rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Upcoming Lessons</span>
          <span className="text-xl font-bold text-stone-800 dark:text-stone-100 mt-1 block">
            {summary.upcoming_count}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1923] rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">Unpaid Upcoming</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {summary.unpaid_upcoming_count}
            </span>
            {summary.unpaid_upcoming_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold">
                Action
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1923] rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">Payments to Verify</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {summary.pending_payments_count}
            </span>
            {summary.pending_payments_count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold">
                Pending
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1923] rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">Completed Lessons</span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
            {summary.completed_count}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D5D0CA]/40 dark:border-[#3E3545] pb-px">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors ${
            activeTab === 'bookings'
              ? 'bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] border-t border-x border-[#D5D0CA]/60 dark:border-[#3E3545]'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Bookings & Lessons ({summary.total_bookings})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-[#1E1923] text-[#362E3B] dark:text-[#F5E6D3] border-t border-x border-[#D5D0CA]/60 dark:border-[#3E3545]'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          All Payments Ledger
          {summary.pending_payments_count > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
              {summary.pending_payments_count}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#1E1923] p-3.5 rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by student, parent, email, or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] dark:bg-[#2A2431] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FAF8F5] dark:bg-[#2A2431] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
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
              <span className="text-[11px] text-stone-500">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FAF8F5] dark:bg-[#2A2431] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
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
              <span className="text-[11px] text-stone-500">Timing:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FAF8F5] dark:bg-[#2A2431] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
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
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Refresh bookings"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-[#1E1923] rounded-2xl h-24 border border-[#D5D0CA]/30 dark:border-[#3E3545]/30"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">{error}</h3>
              <button 
                onClick={fetchBookings}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white dark:bg-[#1E1923] border border-[#D5D0CA]/40 dark:border-[#3E3545] rounded-2xl p-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">No bookings match your current filters</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
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
                    className="bg-white dark:bg-[#1E1923] hover:bg-stone-50/80 dark:hover:bg-[#251F2C] p-4 sm:p-5 rounded-2xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Left: Learner & Lesson Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#6F907D] group-hover:underline">
                          {b.reference_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBookingStatusBadge(b.status)}`}>
                          {b.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${paymentBadgeInfo.classes}`}>
                          {paymentBadgeInfo.text}
                        </span>
                        {b.booking_type === 'trial' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                            Trial
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#362E3B] dark:text-[#F5E6D3]">
                          {b.contact_name}
                        </h3>
                        {b.parent_name && (
                          <span className="text-xs text-stone-500">
                            (Parent: {b.parent_name})
                          </span>
                        )}
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                          {b.service_name} ({b.duration_minutes} min)
                        </span>
                      </div>

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                        <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          Cairo: {startCairo.toFormat('EEE, LLL dd • hh:mm a')}
                        </span>
                        {startStudent && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-stone-400" />
                            Local: {startStudent.toFormat('hh:mm a')} ({b.student_timezone})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment Overview & Quick Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[11px] text-stone-500 block">
                          {b.booking_type === 'trial' ? 'Trial Session' : 'Payment Status'}
                        </span>
                        <div className="text-xs font-semibold">
                          {b.booking_type === 'trial' ? (
                            <span className="text-teal-600 dark:text-teal-400">$0.00 (Free)</span>
                          ) : b.confirmed_amount > 0 ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              ${b.confirmed_amount.toFixed(2)} / {b.expected_amount !== null ? `$${b.expected_amount.toFixed(2)}` : 'Not set'}
                            </span>
                          ) : b.payment_status === 'pending_review' ? (
                            <span className="text-amber-600 dark:text-amber-400">Payment in Review</span>
                          ) : (
                            <span className="text-stone-500">
                              {b.expected_amount !== null ? `Due: $${b.expected_amount.toFixed(2)}` : 'Fee not set'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {b.payment_status === 'pending_review' ? (
                          <button
                            onClick={() => setSelectedBookingId(b.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 rounded-xl transition-colors"
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
                            className="px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl transition-colors"
                          >
                            Record Payment
                          </button>
                        ) : null}

                        <button
                          onClick={() => setSelectedBookingId(b.id)}
                          className="p-1.5 rounded-xl text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Open Booking Details"
                        >
                          <ChevronRight className="w-5 h-5" />
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
          <div className="bg-white dark:bg-[#1E1923] p-3.5 rounded-2xl border border-[#D5D0CA]/40 dark:border-[#3E3545] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Status Filter:</span>
              <select
                value={paymentsStatusFilter}
                onChange={(e) => setPaymentsStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#FAF8F5] dark:bg-[#2A2431] border border-[#D5D0CA]/60 dark:border-[#3E3545] rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#8FAE9B]"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending Review</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={fetchPayments}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingPayments ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-[#1E1923] rounded-2xl h-20 border border-[#D5D0CA]/30 dark:border-[#3E3545]/30"></div>
              ))}
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="bg-white dark:bg-[#1E1923] border border-[#D5D0CA]/40 dark:border-[#3E3545] rounded-2xl p-8 text-center space-y-2">
              <DollarSign className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">No payment records found</h3>
              <p className="text-xs text-stone-500">Record payments manually or when learners report payment claims.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentsList.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#1E1923] p-4 rounded-2xl border border-[#D5D0CA]/50 dark:border-[#3E3545] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#362E3B] dark:text-[#F5E6D3]">
                        ${Number(p.amount).toFixed(2)} {p.currency}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="capitalize font-medium text-stone-700 dark:text-stone-300">
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
                      {p.contact_name && (
                        <span>Student: <strong className="text-stone-700 dark:text-stone-300">{p.contact_name}</strong></span>
                      )}
                      {p.booking_reference && (
                        <span>Booking: <span className="font-mono text-stone-700 dark:text-stone-300 font-semibold">{p.booking_reference}</span></span>
                      )}
                      {p.payment_reference && (
                        <span>Ref: <span className="font-mono text-stone-700 dark:text-stone-300">{p.payment_reference}</span></span>
                      )}
                      <span>Logged: {DateTime.fromISO(p.created_at).toFormat('LLL dd, yyyy • hh:mm a')}</span>
                    </div>

                    {p.notes && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 italic">
                        Note: {p.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions for pending payments */}
                  {p.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleConfirmPaymentRow(p.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Receipt
                      </button>
                      <button
                        onClick={() => handleRejectPaymentRow(p.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors flex items-center gap-1"
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
