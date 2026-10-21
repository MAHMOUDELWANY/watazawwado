import React, { useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import {
  Calendar,
  Clock,
  AlertCircle,
  Search,
  DollarSign,
  CheckCircle2,
  XCircle,
  Plus,
  Globe,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { dashboardFetch } from '../lib/dashboardApi';
import { DashboardBookingListItem, BookingsOperationalSummary, BookingPaymentStatus } from '../types';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { BulkCancelBar, bulkCancelable } from '../components/BulkCancelBar';
import { EmptyState } from '../../components/EmptyState';
import { getActiveWorkingTimezone } from '../../lib/countryTimezones';
import { useT } from '../../lib/language';

/**
 * Lessons list. Teachers see their lessons only, with no payment information (RULES.md §1);
 * the super admin also gets payment columns, the payments tab and "Record payment".
 */
export default function BookingsPage() {
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const [activeTz, setActiveTz] = useState<string>(() => getActiveWorkingTimezone('Africa/Cairo'));

  useEffect(() => {
    const handleTz = (e: any) => setActiveTz(e?.detail?.timezone || getActiveWorkingTimezone('Africa/Cairo'));
    window.addEventListener('watazawwado_timezone_change', handleTz);
    return () => window.removeEventListener('watazawwado_timezone_change', handleTz);
  }, []);

  const [activeTab, setActiveTab] = useState<'bookings' | 'payments'>('bookings');

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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('all');
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  // AD-02: lessons picked for a bulk cancel (super admin only).
  const [picked, setPicked] = useState<string[]>([]);
  const [paymentModalData, setPaymentModalData] = useState<{
    bookingId?: string | null;
    studentId?: string | null;
    bookingReference?: string | null;
    contactName?: string | null;
    expectedAmount?: number | null;
  } | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (isSuperAdmin && paymentFilter !== 'all') params.set('payment_status', paymentFilter);
      if (dateFilter !== 'all') params.set('date_range', dateFilter);
      if (search.trim()) params.set('search', search.trim());
      const data = await dashboardFetch(`/api/dashboard/bookings?${params.toString()}`);
      setBookings(data.bookings || []);
      if (data.summary) setSummary(prev => ({ ...prev, ...data.summary }));
    } catch (err: any) {
      setError(err?.message || t("Lessons couldn't be loaded right now.", 'تعذر تحميل الحصص دلوقتي.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, dateFilter, search, isSuperAdmin]);

  const fetchPayments = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingPayments(true);
    setPaymentsError(null);
    try {
      const params = new URLSearchParams();
      if (paymentsStatusFilter !== 'all') params.set('status', paymentsStatusFilter);
      const data = await dashboardFetch(`/api/dashboard/payments?${params.toString()}`);
      setPaymentsList(data.payments || []);
    } catch (err: any) {
      setPaymentsError(err?.message || t("Payments couldn't be loaded. Please try again.", 'تعذر تحميل المدفوعات. حاول تاني.'));
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentsStatusFilter, isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    else fetchPayments();
  }, [activeTab, fetchBookings, fetchPayments]);

  const handleConfirmPaymentRow = async (paymentId: string) => {
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/confirm`, { method: 'POST' });
      fetchPayments();
      fetchBookings();
    } catch (err: any) {
      alert(err?.message || t("Couldn't confirm the payment.", 'تعذر تأكيد الدفع.'));
    }
  };

  const handleRejectPaymentRow = async (paymentId: string) => {
    const reason = window.prompt(t('Reason for rejecting (optional):', 'سبب الرفض (اختياري):'));
    if (reason === null) return;
    try {
      await dashboardFetch(`/api/dashboard/payments/${paymentId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      fetchPayments();
      fetchBookings();
    } catch (err: any) {
      alert(err?.message || t("Couldn't reject the payment.", 'تعذر رفض الدفع.'));
    }
  };

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
      case 'pending_review': return { text: t('To review', 'محتاجة مراجعة'), classes: 'bg-warning/15 text-warning border-warning/30' };
      case 'unpaid': return { text: t('Not paid', 'مش مدفوعة'), classes: 'bg-muted text-muted-foreground border-border' };
      case 'partially_paid': return { text: t('Partly paid', 'مدفوعة جزئياً'), classes: 'bg-warning/15 text-warning border-warning/30' };
      case 'payment_rejected': return { text: t('Payment rejected', 'الدفع اترفض'), classes: 'bg-destructive/15 text-destructive border-destructive/30' };
      case 'free_trial':
      default: return { text: t('Free trial', 'تجربة مجانية'), classes: 'bg-secondary/30 text-accent border-secondary/60' };
    }
  };

  const money = (n: number | null | undefined) => (n === null || n === undefined ? null : `$${Number(n).toFixed(2)}`);
  const selectClass = 'px-2.5 py-1.5 glass-surface border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer';

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            {isSuperAdmin ? t('Lessons & payments', 'الحصص والمدفوعات') : t('My lessons', 'حصصي')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin
              ? t('All lessons, payments and refunds in one place.', 'كل الحصص والمدفوعات والاسترداد في مكان واحد.')
              : t('Every lesson booked with you.', 'كل الحصص اللي اتحجزت معاك.')}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setPaymentModalData({})}
            className="px-4 py-2 text-sm font-semibold text-primary-foreground btn-primary-material rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            {t('Record payment', 'سجّل دفع')}
          </button>
        )}
      </header>

      <div className={`grid grid-cols-2 gap-3 ${isSuperAdmin ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-3'}`}>
        <div className="p-4 glass-card rounded-2xl border border-border shadow-2xs">
          <span className="text-sm text-muted-foreground font-medium block">{t('All lessons', 'كل الحصص')}</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{summary.total_bookings}</span>
        </div>
        <div className="p-4 glass-card rounded-2xl border border-border shadow-2xs">
          <span className="text-sm text-muted-foreground font-medium block">{t('Upcoming', 'الجاية')}</span>
          <span className="text-xl font-bold text-foreground mt-1 block">{summary.upcoming_count}</span>
        </div>
        {isSuperAdmin && (
          <>
            <div className="p-4 glass-card rounded-2xl border border-border shadow-2xs">
              <span className="text-sm text-warning font-medium block">{t('Upcoming, not paid', 'جاية ومش مدفوعة')}</span>
              <span className="text-xl font-bold text-warning mt-1 block">{summary.unpaid_upcoming_count}</span>
            </div>
            <div className="p-4 glass-card rounded-2xl border border-border shadow-2xs">
              <span className="text-sm text-warning font-medium block">{t('Payments to check', 'مدفوعات محتاجة مراجعة')}</span>
              <span className="text-xl font-bold text-warning mt-1 block">{summary.pending_payments_count}</span>
            </div>
          </>
        )}
        <div className="p-4 glass-card rounded-2xl border border-border shadow-2xs">
          <span className="text-sm text-success font-medium block">{t('Completed', 'تمت')}</span>
          <span className="text-xl font-bold text-success mt-1 block">{summary.completed_count}</span>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="flex items-center gap-2 border-b border-border pb-px" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'bookings'}
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer ${
              activeTab === 'bookings' ? 'glass-card text-foreground border-t border-x border-border shadow-2xs' : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle/50'
            }`}
          >
            {t('Lessons', 'الحصص')} ({summary.total_bookings})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'payments'}
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'payments' ? 'glass-card text-foreground border-t border-x border-border shadow-2xs' : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            {t('All payments', 'كل المدفوعات')}
            {summary.pending_payments_count > 0 && (
              <span className="px-1.5 rounded-full bg-warning text-warning-foreground text-[13px] font-bold">{summary.pending_payments_count}</span>
            )}
          </button>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="glass-card p-3.5 rounded-2xl border border-border shadow-2xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                aria-label={t('Search', 'بحث')}
                placeholder={t('Search by student, parent, email or reference…', 'دوّر باسم الطالب أو ولي الأمر أو الإيميل أو رقم الحجز…')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-8 pe-3 py-1.5 text-sm glass-surface border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <label className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{t('Status', 'الحالة')}:</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">{t('All', 'الكل')}</option>
                <option value="confirmed">{t('Confirmed', 'مؤكدة')}</option>
                {isSuperAdmin && <option value="pending">{t('Waiting for payment', 'في انتظار الدفع')}</option>}
                <option value="completed">{t('Completed', 'تمت')}</option>
                <option value="rescheduled">{t('Moved', 'اتغيّر ميعادها')}</option>
                <option value="cancelled">{t('Cancelled', 'ملغاة')}</option>
              </select>
            </label>

            {isSuperAdmin && (
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{t('Payment', 'الدفع')}:</span>
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={selectClass}>
                  <option value="all">{t('All', 'الكل')}</option>
                  <option value="unpaid">{t('Not paid', 'مش مدفوعة')}</option>
                  <option value="pending_review">{t('To review', 'محتاجة مراجعة')}</option>
                  <option value="paid">{t('Paid', 'مدفوعة')}</option>
                  <option value="free_trial">{t('Free trial', 'تجربة مجانية')}</option>
                  <option value="partially_paid">{t('Partly paid', 'مدفوعة جزئياً')}</option>
                </select>
              </label>
            )}

            <label className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{t('When', 'الوقت')}:</span>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={selectClass}>
                <option value="all">{t('All dates', 'كل التواريخ')}</option>
                <option value="upcoming">{t('Upcoming', 'الجاية')}</option>
                <option value="today">{t('Today', 'النهارده')}</option>
                <option value="past">{t('Past', 'اللي فاتت')}</option>
              </select>
            </label>

            <button
              onClick={fetchBookings}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer"
              title={t('Refresh', 'تحديث')}
              aria-label={t('Refresh', 'تحديث')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="glass-card rounded-2xl h-24 border border-border"></div>)}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <h3 className="text-sm font-medium text-destructive mb-1">{error}</h3>
              <button onClick={fetchBookings} className="mt-3 px-4 py-2 bg-destructive text-destructive-foreground text-sm font-semibold rounded-xl hover:bg-destructive/90 cursor-pointer">
                {t('Try again', 'حاول تاني')}
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={t('No lessons match these filters', 'مفيش حصص بالفلاتر دي')}
              description={t('Try clearing the search or filters.', 'جرّب تمسح البحث أو الفلاتر.')}
            />
          ) : (
            <div className="space-y-3">
              {isSuperAdmin && (
                <BulkCancelBar ids={picked} onClear={() => setPicked([])} onDone={() => { setPicked([]); fetchBookings(); }} />
              )}
              {bookings.map((b) => {
                const startUtc = DateTime.fromISO(b.scheduled_start);
                const startTeacher = startUtc.setZone(activeTz).setLocale(locale);
                let startStudent: DateTime | null = null;
                try {
                  if (b.student_timezone) startStudent = startUtc.setZone(b.student_timezone).setLocale(locale);
                } catch {
                  startStudent = null;
                }
                const paymentBadgeInfo = getPaymentBadge(b.payment_status);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className="glass-card hover:bg-surface-subtle/80 p-4 sm:p-5 rounded-2xl border border-border shadow-2xs cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSuperAdmin && bulkCancelable(b) && (
                          <input
                            type="checkbox"
                            className="w-5 h-5 cursor-pointer"
                            aria-label={t(`Select lesson ${b.reference_code}`, `اختار الحصة ${b.reference_code}`)}
                            checked={picked.includes(b.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, b.id] : p.filter((x) => x !== b.id)))}
                          />
                        )}
                        <span className="font-mono font-bold text-sm text-primary group-hover:underline">{b.reference_code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[13px] font-semibold border ${getBookingStatusBadge(b.status)}`}>{statusLabel(b.status)}</span>
                        {isSuperAdmin && (
                          <span className={`px-2 py-0.5 rounded-full text-[13px] font-semibold border ${paymentBadgeInfo.classes}`}>{paymentBadgeInfo.text}</span>
                        )}
                        {b.booking_type === 'trial' && (
                          <span className="px-2 py-0.5 rounded-full text-[13px] font-medium bg-secondary/30 text-accent border border-secondary/50">{t('Trial', 'تجربة')}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{b.contact_name}</h3>
                        {b.parent_name && <span className="text-sm text-muted-foreground">({t('Parent', 'ولي الأمر')}: {b.parent_name})</span>}
                        <span className="text-border">•</span>
                        <span className="text-sm font-medium text-muted-foreground">{b.service_name} ({b.duration_minutes} {t('min', 'دقيقة')})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {activeTz.includes('Cairo') ? t('Cairo', 'القاهرة') : activeTz}: {startTeacher.toFormat('EEE, LLL dd • hh:mm a')}
                        </span>
                        {startStudent && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            {t("Student's time", 'توقيت الطالب')}: {startStudent.toFormat('hh:mm a')} (<span dir="ltr">{b.student_timezone}</span>)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border justify-between md:justify-end">
                      {isSuperAdmin && (
                        <div className="text-end">
                          <span className="text-[11px] text-muted-foreground block">
                            {b.booking_type === 'trial' ? t('Free trial', 'تجربة مجانية') : t('Payment', 'الدفع')}
                          </span>
                          <div className="text-sm font-semibold">
                            {b.booking_type === 'trial' ? (
                              <span className="text-primary">{t('Free', 'مجانية')}</span>
                            ) : Number(b.confirmed_amount) > 0 ? (
                              <span className="text-success">{money(b.confirmed_amount)} / {money(b.expected_amount) || t('not set', 'مش محدد')}</span>
                            ) : b.payment_status === 'pending_review' ? (
                              <span className="text-warning">{t('Being reviewed', 'بتتراجع')}</span>
                            ) : (
                              <span className="text-muted-foreground">
                                {money(b.expected_amount) ? `${t('Due', 'المطلوب')}: ${money(b.expected_amount)}` : t('Price not set', 'السعر مش محدد')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isSuperAdmin && b.payment_status === 'pending_review' && (
                          <button
                            onClick={() => setSelectedBookingId(b.id)}
                            className="tap-44 relative px-3 py-1.5 text-sm font-medium text-warning bg-warning/15 hover:bg-warning/25 rounded-xl border border-warning/30 transition-colors cursor-pointer min-h-[36px]"
                          >
                            {t('Review payment', 'راجع الدفع')}
                          </button>
                        )}
                        {isSuperAdmin && b.payment_status === 'unpaid' && (
                          <button
                            onClick={() => setPaymentModalData({
                              bookingId: b.id,
                              studentId: b.student_id,
                              bookingReference: b.reference_code,
                              contactName: b.contact_name,
                              expectedAmount: b.expected_amount
                            })}
                            className="px-3 py-1.5 text-sm font-medium text-foreground glass-card hover:bg-surface-subtle border border-border rounded-xl transition-colors cursor-pointer min-h-[36px]"
                          >
                            {t('Record payment', 'سجّل دفع')}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBookingId(b.id)}
                          className="p-2 rounded-xl text-muted-foreground group-hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                          aria-label={t(`Open lesson ${b.reference_code}`, `افتح الحصة ${b.reference_code}`)}
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

      {isSuperAdmin && activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="glass-card p-3.5 rounded-2xl border border-border shadow-2xs flex items-center justify-between gap-3">
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">{t('Status', 'الحالة')}:</span>
              <select value={paymentsStatusFilter} onChange={(e) => setPaymentsStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">{t('All', 'الكل')}</option>
                <option value="pending">{t('To review', 'محتاجة مراجعة')}</option>
                <option value="confirmed">{t('Confirmed', 'مؤكدة')}</option>
                <option value="rejected">{t('Rejected', 'مرفوضة')}</option>
                <option value="refunded">{t('Refunded', 'اتسددت')}</option>
              </select>
            </label>
            <button
              onClick={fetchPayments}
              disabled={loadingPayments}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer disabled:opacity-50"
              aria-label={t('Refresh', 'تحديث')}
              title={t('Refresh', 'تحديث')}
            >
              <RefreshCw className={`w-4 h-4 ${loadingPayments ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {paymentsError ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-sm max-w-md mx-auto">{paymentsError}</p>
              <button onClick={fetchPayments} className="px-4 py-2 text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {t('Try again', 'حاول تاني')}
              </button>
            </div>
          ) : loadingPayments ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="glass-card rounded-2xl h-20 border border-border"></div>)}
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="glass-card border-none rounded-2xl p-8 text-center space-y-2">
              <DollarSign className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">{t('No payments yet', 'لسه مفيش مدفوعات')}</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentsList.map((p) => (
                <div key={p.id} className="glass-card p-4 rounded-2xl border border-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">${Number(p.amount).toFixed(2)} {p.currency}</span>
                      <span className="text-border">•</span>
                      <span className="capitalize font-medium text-foreground">{p.payment_method.replace(/_/g, ' ')}</span>
                      <span className="text-border">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-[13px] font-semibold border ${
                        p.status === 'confirmed' ? 'bg-success/15 text-success border-success/30'
                          : p.status === 'pending' ? 'bg-warning/15 text-warning border-warning/30'
                          : 'bg-destructive/15 text-destructive border-destructive/30'
                      }`}>
                        {({ confirmed: t('Confirmed', 'مؤكد'), pending: t('To review', 'محتاج مراجعة'), rejected: t('Rejected', 'مرفوض'), refunded: t('Refunded', 'اتسدد') } as Record<string, string>)[p.status] || p.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {p.contact_name && <span>{t('Student', 'الطالب')}: <strong className="text-foreground">{p.contact_name}</strong></span>}
                      {p.booking_reference && <span>{t('Lesson', 'الحصة')}: <span className="font-mono text-foreground font-semibold">{p.booking_reference}</span></span>}
                      {p.payment_reference && <span>{t('Ref', 'المرجع')}: <span className="font-mono text-foreground">{p.payment_reference}</span></span>}
                      <span>{t('Logged', 'اتسجل')}: {DateTime.fromISO(p.created_at).setLocale(locale).toFormat('LLL dd, yyyy • hh:mm a')}</span>
                    </div>
                    {p.notes && <p className="text-[11px] text-muted-foreground italic">{t('Note', 'ملاحظة')}: {p.notes}</p>}
                  </div>
                  {p.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleConfirmPaymentRow(p.id)}
                        className="px-3.5 py-2 text-sm font-semibold text-success-foreground bg-success hover:bg-success/90 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('Confirm', 'تأكيد')}
                      </button>
                      <button
                        onClick={() => handleRejectPaymentRow(p.id)}
                        className="px-3.5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/15 border border-destructive/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
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
      )}

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

      {isSuperAdmin && paymentModalData && (
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
