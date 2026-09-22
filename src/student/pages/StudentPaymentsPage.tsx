import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Plus,
  Loader2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  FileText
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';
import { buildPaymentWhatsAppUrl } from '../../lib/whatsapp';
import { StudentPageBack } from '../components/StudentPageBack';

export interface StudentPaymentsPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

export default function StudentPaymentsPage({ lang = 'en' }: StudentPaymentsPageProps) {
  const { session, user } = useTeacherAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Claim modal state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedBookingForClaim, setSelectedBookingForClaim] = useState<any | null>(null);

  const isAr = lang === 'ar';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.access_token;
      if (!token) return;

      const [paymentsRes, bookingsRes] = await Promise.all([
        fetch('/api/student/payments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/student/bookings', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (paymentsRes.ok) {
        const pJson = await paymentsRes.json();
        setPayments(pJson.payments || []);
      }

      if (bookingsRes.ok) {
        const bJson = await bookingsRes.json();
        const pending = (Array.isArray(bJson) ? bJson : []).filter(
          (b: any) => b.status === 'pending'
        );
        setPendingBookings(pending);
      }
    } catch (err: any) {
      console.error('[StudentPaymentsPage Fetch Error]', err);
      setError(err.message || (isAr ? 'فشل تحميل سجل المدفوعات' : 'Unable to load payment history'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session, isAr]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="success" className="px-2.5 py-0.5 text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isAr ? 'مؤكد ومفعل' : 'Verified & Activated'}</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" className="px-2.5 py-0.5 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{isAr ? 'قيد المراجعة' : 'Under Review'}</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="px-2.5 py-0.5 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{isAr ? 'مرفوض' : 'Rejected'}</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const verifiedCount = payments.filter(p => p.status === 'confirmed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-start">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <StudentPageBack
            to="/student"
            label="Return to Student Portal"
            labelAr="العودة لبوابة الطالب"
            className="mb-1.5"
          />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
            {isAr ? 'المدفوعات وسجل التحويلات' : 'Payments & Billing'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {isAr
              ? 'متابعة سجل إثباتات الدفع، الحوالات البنكية، وتأكيدات الأستاذ محمود.'
              : 'Track payment confirmations, bank transfers, and manual verification status with Ustadh Mahmoud.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedBookingForClaim(null);
            setIsClaimModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إرسال إثبات دفع جديد' : 'Submit Payment Claim'}</span>
        </button>
      </div>

      {/* 2. Verification Policy & WhatsApp Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-foreground text-sm block">
              {isAr ? 'كيف يتم التحقق وتأكيد الدفع؟' : 'How Payments Are Verified'}
            </span>
            <span>
              {isAr
                ? 'يتم التحقق من الحوالات يدوياً وبشكل مباشر من قِبل الأستاذ محمود. بمجرد إرسال الرقم المرجعي أو إيصال التحويل، يقوم الأستاذ بمطابقته وتفعيل الدرس أو باقة الرصيد فوراً.'
                : 'All payments are verified directly and personally by Ustadh Mahmoud. Once you submit your bank or transfer reference, he reviews it and activates your lesson or package credits immediately.'}
            </span>
          </div>
        </div>

        <a
          href="https://wa.me/201026042456?text=Assalamu%20Alaikum%20Ustadh%20Mahmoud%2C%20I%20have%20sent%20a%20payment%20transfer%20and%20would%20like%20to%20confirm%20it."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 self-start md:self-auto min-h-[38px] shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{isAr ? 'إرسال الإيصال عبر واتساب' : 'Send Receipt on WhatsApp'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 3. Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border bg-surface">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'المدفوعات المؤكدة والمفعلة' : 'Verified Payments'}
              </span>
              <div className="text-3xl font-serif font-bold text-success">
                {verifiedCount}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'تمت مطابقتها وتفعيل الخدمة' : 'Matched and activated'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'قيد المراجعة والتحقق' : 'Under Review'}
              </span>
              <div className="text-3xl font-serif font-bold text-warning">
                {pendingCount}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'في انتظار مراجعة الأستاذ محمود' : 'Awaiting teacher confirmation'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-warning/10 text-warning">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Actionable Notice for Pending Bookings (if any) */}
      {pendingBookings.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-warning/10 border border-warning/25 space-y-3">
          <div className="flex items-center gap-2 text-warning font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              {isAr
                ? `لديك ${pendingBookings.length} درس في انتظار تأكيد الدفع`
                : `You have ${pendingBookings.length} lesson(s) awaiting payment confirmation`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'يرجى إرسال الرقم المرجعي للتحويل لتأكيد حجز موعدك وضمان انضمامك للدرس.'
              : 'Please submit your transfer reference to confirm your scheduled lesson slot.'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {pendingBookings.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBookingForClaim(b);
                  setIsClaimModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface border border-warning/40 text-foreground hover:border-warning rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                <span>{b.serviceTitle} ({b.referenceCode})</span>
                <span className="text-primary font-bold">{isAr ? 'إرسال الإثبات' : 'Claim'} →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Payments History Table / Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-foreground">
          {isAr ? 'سجل العمليات السابقة' : 'Payment History'}
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr ? 'جارٍ تحميل سجل المدفوعات...' : 'Loading payments history...'}
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-surface border border-destructive/20 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 px-4 bg-surface border border-border rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-semibold text-foreground">
                {isAr ? 'لا توجد دفعات مسجلة بعد' : 'No payments recorded yet'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                {isAr
                  ? 'عند قيامك بتحويل رسوم درس أو باقة وإرسال الرقم المرجعي، ستظهر هنا تفاصيل العملية وحالة مراجعتها.'
                  : 'When you submit a payment reference for a lesson or package, the transaction and verification status will appear here.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedBookingForClaim(null);
                setIsClaimModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إرسال إثبات دفع' : 'Submit a Payment Claim'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => {
              const dateObj = DateTime.fromISO(p.createdAt || p.created_at);

              return (
                <Card key={p.id} className="border-border bg-surface hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm sm:text-base text-foreground">
                          {p.itemDescription || (isAr ? 'رسوم درس' : 'Lesson Payment')}
                        </span>
                        {getStatusBadge(p.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>
                            {dateObj.isValid
                              ? dateObj.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED)
                              : ''}
                          </span>
                        </div>
                        {p.paymentMethod && (
                          <span className="uppercase font-mono text-[11px] px-2 py-0.5 rounded bg-surface-subtle border border-border">
                            {p.paymentMethod.replace(/_/g, ' ')}
                          </span>
                        )}
                        {p.paymentReference && (
                          <div className="flex items-center gap-1">
                            <span>Ref:</span>
                            <span className="font-mono font-medium text-foreground select-all">
                              {p.paymentReference}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.id, p.paymentReference)}
                              className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                              title={isAr ? 'نسخ' : 'Copy'}
                            >
                              {copiedKey === p.id ? (
                                <Check className="w-3 h-3 text-success" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {p.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          "{p.notes}"
                        </p>
                      )}
                    </div>

                    <div className="text-start sm:text-end shrink-0">
                      <span className="text-lg sm:text-xl font-serif font-bold text-foreground">
                        {p.amount ? `$${p.amount}` : '—'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {p.currency || 'USD'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Payment Claim Modal */}
      {isClaimModalOpen && (
        <StudentPaymentClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => {
            setIsClaimModalOpen(false);
            setSelectedBookingForClaim(null);
          }}
          bookingReference={selectedBookingForClaim?.referenceCode}
          itemTitle={selectedBookingForClaim?.serviceTitle || (isAr ? 'دفعة درس' : 'Lesson Payment')}
          amount={selectedBookingForClaim?.feeAmountUsd}
          lang={lang}
          sessionToken={session?.access_token}
          onClaimSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
