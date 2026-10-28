import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { hasBookingDraft } from '../../components/booking/BookingFlow';
import { DateTime } from 'luxon';
import {
  Package,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Plus,
  Loader2,
  Check,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Users,
  User,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';
import { StudentPageBack } from '../components/StudentPageBack';
import { PackageBalance } from '../components/PackageBalance';
import { useActiveLearner } from '../activeLearner';

export interface StudentPackagesPageProps {
  lang?: 'en' | 'ar';
  session?: any;
  /** Inside the wallet: no page title or back link of its own. */
  embedded?: boolean;
}

export default function StudentPackagesPage({ lang = 'en', embedded = false }: StudentPackagesPageProps) {
  const { session } = useTeacherAuth();
  const [data, setData] = useState<any>({
    entitlements: [],
    catalog: [],
    creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 },
    learners: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Explicit session/auth state. A missing or expired session must NEVER be
  // rendered as the truthful "no active packages" empty state.
  const [authError, setAuthError] = useState(false);

  // Multi-child learner selection
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');

  // Credit history ledger
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // Purchasing & Claiming State
  const [purchasingCatalogId, setPurchasingCatalogId] = useState<string | null>(null);
  const [activeClaimEntitlement, setActiveClaimEntitlement] = useState<any | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedEarlyStart, setAcceptedEarlyStart] = useState(false);
  const [packageMinutes, setPackageMinutes] = useState(60);
  // RN-03: the catalogue package being renewed (highlighted; the family still ticks the boxes and confirms).
  const [renewCatalogId, setRenewCatalogId] = useState<string | null>(null);
  const [renewMissing, setRenewMissing] = useState(false);
  const [searchParams] = useSearchParams();
  const [refundBusyId, setRefundBusyId] = useState<string | null>(null);

  const isAr = lang === 'ar';

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.access_token;
      // Explicit session state — a missing/expired session must not silently
      // look like an empty package balance.
      if (!token) {
        setAuthError(true);
        return;
      }

      const res = await fetch('/api/student/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // The server tells us truthfully when the catalog is unavailable.
        // NEVER fabricate packages here — surface the truthful message.
        const unavailableAr = json?.error_ar || 'الباقات غير متاحة حالياً. حاول مرة أخرى بعد قليل.';
        const unavailableEn = json?.error || 'Packages are temporarily unavailable. Please try again shortly.';
        setData({
          entitlements: [],
          catalog: [],
          catalogAvailable: false,
          creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 },
          learners: [],
        });
        setError(isAr ? unavailableAr : unavailableEn);
        return;
      }

      setData(json);

      // Default selected learner to primary or first learner
      if (Array.isArray(json.learners) && json.learners.length > 0 && !selectedLearnerId) {
        const primary = json.learners.find((l: any) => l.isPrimary) || json.learners[0];
        setSelectedLearnerId(primary.id);
      }
    } catch (err: any) {
      console.error('[StudentPackagesPage Fetch Error]', err);
      setError(err.message || (isAr ? 'تعذر تحميل بيانات الباقات' : 'Unable to load packages'));
    } finally {
      setLoading(false);
    }
  }, [session, isAr, selectedLearnerId]);

  const fetchLedger = useCallback(async () => {
    try {
      setLedgerLoading(true);
      setLedgerError(null);
      const token = session?.access_token;
      // Explicit session state — a missing/expired session must not silently
      // render as an empty credit-activity ledger.
      if (!token) {
        setLedgerError(
          isAr ? 'جلسة الدخول غير متاحة أو منتهية' : 'Your session is unavailable or has expired'
        );
        return;
      }

      const res = await fetch('/api/student/packages/ledger', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(isAr ? 'فشل تحميل سجل الرصيد' : 'Failed to load credit activity');
      }

      const json = await res.json();
      setLedger(Array.isArray(json.ledger) ? json.ledger : []);
    } catch (err: any) {
      console.error('[StudentPackagesPage Ledger Fetch Error]', err);
      setLedgerError(err.message || (isAr ? 'تعذر تحميل سجل الرصيد' : 'Unable to load credit activity'));
    } finally {
      setLedgerLoading(false);
    }
  }, [session, isAr]);

  useEffect(() => {
    fetchPackages();
    fetchLedger();
  }, [fetchPackages, fetchLedger]);

  // PA-01: the header's child switcher picks who a new package is for and narrows the list to them.
  const { activeId } = useActiveLearner();
  useEffect(() => {
    if (activeId && (data.learners || []).some((l: any) => l.id === activeId)) setSelectedLearnerId(activeId);
  }, [activeId, data.learners]);

  /** Pre-selects the same package (catalogue item, lesson length, learner); the server still prices it. */
  const renewScrollPending = useRef(false);
  const startRenew = useCallback((ent: any, catalog: any[], learners: any[]) => {
    // An empty catalogue means it failed to load, not that the package is gone.
    if (catalog.length === 0) return;
    const cat = catalog.find((c: any) => c.id === ent.packageCatalogId && c.is_active !== false);
    setRenewMissing(!cat);
    setRenewCatalogId(cat ? cat.id : null);
    if (!cat) return;
    setPackageMinutes(Number(cat.eligibility_rules?.duration_minutes ?? ent.durationMinutes ?? 60));
    // Only a learner the account still lists; otherwise keep the current choice.
    if (ent.learnerStudentId && learners.some((l: any) => l.id === ent.learnerStudentId)) setSelectedLearnerId(ent.learnerStudentId);
    renewScrollPending.current = true;
  }, []);

  // Scroll once the catalogue has re-rendered with the chosen length (an effect runs after the commit).
  useEffect(() => {
    if (!renewScrollPending.current || !renewCatalogId) return;
    renewScrollPending.current = false;
    document.getElementById(`package-${renewCatalogId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [renewCatalogId, packageMinutes]);

  // /student/packages?renew=<entitlementId> (the low-balance notice links here).
  const renewParam = searchParams.get('renew');
  const renewParamApplied = useRef(false);
  useEffect(() => {
    // Once: a refetch after buying must not jump back to the renew target.
    if (!renewParam || loading || renewParamApplied.current) return;
    const ent = (data.entitlements || []).find((e: any) => e.id === renewParam && !e.isCredit);
    if (!ent) return;
    renewParamApplied.current = true;
    startRenew(ent, Array.isArray(data.catalog) ? data.catalog : [], Array.isArray(data.learners) ? data.learners : []);
  }, [renewParam, loading, data, startRenew]);

  const handleSelectPackage = async (catalogItem: any) => {
    try {
      setPurchasingCatalogId(catalogItem.id);
      setError(null);
      const token = session?.access_token;

      const payload: any = { packageCatalogId: catalogItem.id, acceptedTerms, acceptedEarlyStart };
      if (selectedLearnerId) {
        payload.learnerStudentId = selectedLearnerId;
      }

      const res = await fetch('/api/student/packages/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || (isAr ? 'فشل اختيار الباقة' : 'Failed to select package'));
      }

      // Re-fetch entitlements and ledger
      await Promise.all([fetchPackages(), fetchLedger()]);
      setRenewCatalogId(null);

      // Open claim modal with the newly created entitlement
      setActiveClaimEntitlement({
        id: json.entitlement?.id,
        packageName: catalogItem.name,
        // The server may apply the family discount, so show what it actually charges.
        pricePaid: json.entitlement?.price_paid ?? catalogItem.price_amount,
        currency: catalogItem.currency || 'USD'
      });
    } catch (err: any) {
      console.error('[handleSelectPackage Error]', err);
      setError(err.message || (isAr ? 'فشل إتمام اختيار الباقة' : 'Could not initialize package selection'));
    } finally {
      setPurchasingCatalogId(null);
    }
  };

  // RULES.md §5: a lesson credit from a cancelled paid lesson can be refunded instead (max 3 per account).
  const handleRefundRequest = async (credit: any) => {
    try {
      setRefundBusyId(credit.id);
      setError(null);
      const res = await fetch(`/api/student/credits/${credit.id}/refund-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.whatsappUrl) throw new Error(json.error || (isAr ? 'تعذر بدء طلب الاسترداد.' : 'Could not start the refund request.'));
      window.open(json.whatsappUrl, '_blank', 'noopener,noreferrer');
      fetchPackages();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefundBusyId(null);
    }
  };

  const getEntitlementStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="px-2.5 py-0.5 text-sm">
            {isAr ? 'مفعلة ونشطة' : 'Active'}
          </Badge>
        );
      case 'pending_payment':
        return (
          <Badge variant="warning" className="px-2.5 py-0.5 text-sm">
            {isAr ? 'في انتظار إثبات الدفع' : 'Pending Payment'}
          </Badge>
        );
      case 'exhausted':
        return (
          <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">
            {isAr ? 'مكتملة الاستخدام' : 'Exhausted'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="px-2.5 py-0.5 text-sm">
            {isAr ? 'ملغاة' : 'Cancelled'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatActivityLabel = (activityType: string) => {
    switch (activityType) {
      case 'grant':
        return isAr ? 'تفعيل الباقة وإضافة الرصيد' : 'Package Activated';
      case 'completed_consumed':
        return isAr ? 'إتمام درس تعليمي' : 'Lesson Completed';
      case 'no_show_used':
        return isAr ? 'عدم حضور (احتساب رصيد)' : 'No-Show (Credit Used)';
      case 'no_show_returned':
        return isAr ? 'عدم حضور (استعادة رصيد)' : 'No-Show (Credit Returned)';
      default:
        return activityType.replace(/_/g, ' ');
    }
  };

  // SERVER CATALOG ONLY. The package catalog is the single source of truth for
  // package prices and currency. The UI must NEVER fabricate or show stale
  // hardcoded package prices; when the server catalog is unavailable the UI
  // renders a truthful unavailable state instead.
  const catalogItems = Array.isArray(data.catalog) ? data.catalog : [];
  const allEntitlements = data.entitlements || [];
  // Packages bought for the account itself (no learner) stay visible for every child.
  const entitlements = activeId
    ? allEntitlements.filter((e: any) => !e.learnerStudentId || e.learnerStudentId === activeId)
    : allEntitlements;

  // Group the SERVER-provided catalog by its real package_type (weekly / monthly).
  // No price is ever computed here — grouping is display-only.
  const groupedCatalog = catalogItems
    .filter((cat: any) => Number(cat?.eligibility_rules?.duration_minutes ?? 60) === packageMinutes)
    .reduce((acc: Record<string, any[]>, cat: any) => {
      const key = String(cat?.eligibility_rules?.hourly_rate ?? cat?.package_type ?? 'other');
      (acc[key] = acc[key] || []).push(cat);
      return acc;
    }, {});
  const catalogGroupOrder = ['9', '13'];
  const catalogGroupKeys = [
    ...catalogGroupOrder.filter((k) => groupedCatalog[k]?.length),
    ...Object.keys(groupedCatalog).filter((k) => !catalogGroupOrder.includes(k)),
  ];
  const packageTypeLabel = (type: string): string => {
    const map: Record<string, [string, string]> = {
      '9': ['Quran, Tajweed & the Zad Path ($9 / hour)', 'القرآن والتجويد ومسار الأثر (9$ للساعة)'],
      '13': ['Fusha, Egyptian Arabic & English (from $13 / hour)', 'الفصحى والعامية المصرية والإنجليزية (من 13$ للساعة)'],
      weekly: ['Weekly', 'أسبوعية'],
      monthly: ['Monthly', 'شهرية'],
    };
    const v = map[String(type || '').toLowerCase()];
    return v ? (isAr ? v[1] : v[0]) : (type || '');
  };
  const creditSummary = data.creditSummary || { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 };
  const learners = Array.isArray(data.learners) ? data.learners : [];
  const hasMultipleLearners = learners.length > 1;

  // Explicit session state: never present a missing/expired session as the
  // truthful "no active packages" empty state.
  if (authError) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        <StudentPageBack to="/student" label={isAr ? 'العودة للرئيسية' : 'Back to Dashboard'} />
        <div className="p-6 glass-card border border-warning/30 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-warning mx-auto" />
          <p className="text-sm font-medium text-foreground">
            {isAr ? 'جلسة الدخول غير متاحة أو منتهية' : 'Your session is unavailable or has expired'}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isAr
              ? 'يرجى تسجيل الدخول مرة أخرى لعرض باقاتك ورصيد دروسك. لم يتم حذف أي بيانات.'
              : 'Please sign in again to view your packages and lesson credits. No data has been lost.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <Link
              to="/student"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm sm:text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
            >
              <span>{isAr ? 'تسجيل الدخول مرة أخرى' : 'Sign In Again'}</span>
            </Link>
            <button
              type="button"
              onClick={fetchPackages}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 glass-card hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm sm:text-sm font-medium transition-colors cursor-pointer min-h-[44px]"
            >
              <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Came here from the booking flow: the booking is saved, offer the way back. */}
      {hasBookingDraft() && (
        <div className="p-4 rounded-2xl border border-teal-500/40 bg-teal-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm text-foreground">
            {isAr
              ? 'حجزك لسه محفوظ. لو اشتريت باقة، ارجع للحجز وهتلاقي الرصيد جاهز.'
              : 'Your booking is saved. If you buy a package, go back and your credit will be ready to use.'}
          </span>
          <Link to="/student/book" className="inline-flex items-center justify-center px-4 py-2 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold shrink-0">
            {isAr ? 'ارجع لحجزك' : 'Back to my booking'}
          </Link>
        </div>
      )}

      {/* 1. Header & Back Navigation */}
      {!embedded && (
      <div className="space-y-3">
        <StudentPageBack to="/student" label={isAr ? 'العودة للرئيسية' : 'Back to Dashboard'} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground ">
              {isAr ? 'باقات الدروس والرصيد' : 'Lesson Packages & Credits'}
            </h1>
            <p className="text-sm sm:text-sm text-muted-foreground mt-1">
              {isAr
                ? 'إدارة باقاتك التعليمية، رصيد الدروس الفردية، وسجل النشاط الموثق'
                : 'Manage your prepaid lesson bundles, active credits, and verified learning activity'}
            </p>
          </div>

          <Link
            to="/student/book"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حجز درس جديد' : 'Book a Lesson'}</span>
          </Link>
        </div>
      </div>
      )}

      <PackageBalance entitlements={entitlements} isAr={isAr} />

      {/* 2. Top Metric Cards (Credit Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Remaining Credits */}
        <Card className="border-border glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground block">
                {isAr ? 'الرصيد المتاح حالياً' : 'Remaining Credits'}
              </span>
              <div className="text-3xl font-display font-bold text-primary">
                {creditSummary.totalRemaining}
              </div>
              <span className="text-sm text-muted-foreground block">
                {isAr ? 'دروس جاهزة للجدولة' : 'Lessons ready to schedule'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/30 text-primary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Used */}
        <Card className="border-border glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground block">
                {isAr ? 'الدروس المكتملة' : 'Completed Lessons'}
              </span>
              <div className="text-3xl font-display font-bold text-foreground">
                {creditSummary.totalUsed}
              </div>
              <span className="text-sm text-muted-foreground block">
                {isAr ? 'دروس تم إتمامها واستهلاكها' : 'Consumed from active packages'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl glass-surface text-muted-foreground">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Purchased */}
        <Card className="border-border glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground block">
                {isAr ? 'إجمالي الرصيد المكتسب' : 'Total Granted'}
              </span>
              <div className="text-3xl font-display font-bold text-foreground">
                {creditSummary.totalPurchased}
              </div>
              <span className="text-sm text-muted-foreground block">
                {isAr ? 'رصيد تراكمي منذ بدء التعلم' : 'Cumulative lessons granted'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl glass-surface text-muted-foreground">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Package Policy & Rules Card */}
      <div className="p-4 sm:p-5 rounded-2xl glass-surface border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm leading-relaxed text-muted-foreground">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-foreground text-sm block">
              {isAr ? 'كيف يعمل نظام الباقات ورصيد الدروس؟' : 'How Packages & Lesson Credits Work'}
            </span>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                {isAr
                  ? 'الباقات عبارة عن باقات مسبقة الدفع لدروس فردية خاصة (ليست اشتراكاً شهرياً متكرراً يخصم تلقائياً).'
                  : 'Packages are flexible prepaid bundles of 1-on-1 private lessons (not recurring auto-billing subscriptions).'}
              </li>
              <li>
                {isAr
                  ? 'لا تنتهي صلاحية الرصيد بشكل مفاجئ، ويمكنك الجدولة بالأوقات التي تناسبك.'
                  : 'Credits do not expire abruptly; schedule lessons at your own comfortable pace.'}
              </li>
              <li>
                {isAr
                  ? 'يتم خصم الرصيد فقط بعد إتمام الدرس فعلياً مع الأستاذ، وليس بمجرد الحجز.'
                  : 'Credits are only consumed after a lesson is completed, not when reserved.'}
              </li>
            </ul>
          </div>
        </div>

        <a
          href="https://wa.me/48508157886?text=Assalamu%20Alaikum%20Watazawwado%20team%2C%20I%20have%20a%20question%20regarding%20lesson%20packages."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 btn-whatsapp-solid rounded-xl text-sm font-bold shadow-sm shrink-0 self-start md:self-auto min-h-[38px]"
        >
          <MessageCircle className="w-4 h-4 fill-current shrink-0" />
          <span>{isAr ? 'استفسار عبر واتساب' : 'Inquire on WhatsApp'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 4. Active Entitlements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-foreground">
            {isAr ? 'باقاتي الحالية' : 'My Packages'}
          </h2>
          <span className="text-sm text-muted-foreground">
            {entitlements.length} {isAr ? 'باقة مسجلة' : 'packages recorded'}
          </span>
        </div>

        {entitlements.length === 0 ? (
          <div className="p-6 rounded-2xl glass-card border-none text-center space-y-2">
            <Package className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm sm:text-sm text-foreground font-medium">
              {isAr ? 'ليس لديك باقات نشطة حالياً' : 'No active packages yet'}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'اختر من الباقات المتاحة أدناه لبدء التعلم برصيد مسبق الدفع وحفظ الجلسات بمرونة.'
                : 'Choose one of our lesson packages below to start learning with bundled credits.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entitlements.map((ent: any) => {
              const isPendingPayment = ent.status === 'pending_payment';
              const progressPct =
                ent.purchasedQuantity > 0
                  ? Math.round((ent.remainingCredits / ent.purchasedQuantity) * 100)
                  : 0;

              return (
                <Card key={ent.id} className="border-border glass-card">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-foreground">
                            {isAr && ent.packageNameAr ? ent.packageNameAr : ent.packageName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-0.5">
                          <span>
                            {ent.purchasedQuantity} {isAr ? 'دروس فردية' : 'private 1-on-1 lessons'}
                            {ent.pricePaid ? ` • $${ent.pricePaid} ${ent.currency}` : ''}
                          </span>
                          {ent.familySaving ? (
                            <span data-testid="family-saving" className="text-success font-medium">
                              {isAr ? `رعاية الأسرة: −$${ent.familySaving}` : `Family care: −$${ent.familySaving}`}
                            </span>
                          ) : null}
                          {ent.learnerName && (
                            <Badge variant="outline" className="text-[13px] font-normal border-secondary/50 text-primary bg-secondary/20">
                              {isAr ? `لـ ${ent.learnerName}` : `For ${ent.learnerName}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getEntitlementStatusBadge(ent.status)}
                    </div>

                    {/* Credits progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isAr ? 'الرصيد المتبقي:' : 'Remaining Credits:'}
                        </span>
                        <span className="font-bold text-foreground">
                          {ent.remainingCredits} / {ent.purchasedQuantity}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full glass-surface overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      {isPendingPayment ? (
                        <button
                          type="button"
                          onClick={() => setActiveClaimEntitlement(ent)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[40px]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إتمام الدفع الفوري لتفعيل الباقة' : 'Pay Now to Activate Package'}</span>
                        </button>
                      ) : ent.remainingCredits > 0 && ent.isCredit ? (
                        <div className="w-full flex flex-col sm:flex-row gap-2">
                          <Link
                            to={`/student/book?entitlementId=${ent.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 glass-card hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm font-semibold transition-colors min-h-[40px]"
                          >
                            <Plus className="w-3.5 h-3.5 text-accent" />
                            <span>{isAr ? 'احجز حصة بالرصيد ده' : 'Book a lesson with it'}</span>
                          </Link>
                          <button
                            type="button"
                            disabled={refundBusyId === ent.id}
                            onClick={() => handleRefundRequest(ent)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50 min-h-[40px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>
                              {ent.refundRequestedAt
                                ? (isAr ? 'تم طلب الاسترداد، افتح واتساب تاني' : 'Refund requested — open WhatsApp again')
                                : (isAr ? 'عايز استرداد بدل الرصيد' : 'I prefer a refund')}
                            </span>
                          </button>
                        </div>
                      ) : ent.remainingCredits > 0 ? (
                        <Link
                          to={`/student/book?entitlementId=${ent.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 glass-card hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm font-semibold transition-colors min-h-[40px]"
                        >
                          <Plus className="w-3.5 h-3.5 text-accent" />
                          <span>{isAr ? 'حجز درس من هذا الرصيد' : 'Book a Session'}</span>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {isAr ? 'تم استهلاك جميع رصيد هذه الباقة' : 'All credits in this package have been used'}
                        </span>
                      )}
                    </div>
                    {!ent.isCredit && (ent.status === 'active' || ent.status === 'exhausted') && (
                      <button
                        type="button"
                        onClick={() => startRenew(ent, catalogItems, learners)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle cursor-pointer min-h-[40px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-accent" />
                        <span>{isAr ? 'جدّد نفس الباقة' : 'Renew this package'}</span>
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Packages Catalog Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">
            {isAr ? 'الباقات التعليمية المتاحة' : 'Available Lesson Packages'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'اختر الباقة المناسبة لخطة تعلمك الفردية'
              : 'Choose the package that aligns with your individual learning goals'}
          </p>
        </div>

        {/* Multi-Child Learner Selector (Only shown if account has multiple learners) */}
        {hasMultipleLearners && (
          <div className="p-4 rounded-2xl glass-card border-none space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>{isAr ? 'شراء الباقة لحساب المتعلم:' : 'Assign Package To Learner:'}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {learners.map((l: any) => {
                const isSelected = selectedLearnerId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedLearnerId(l.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'glass-surface glass-hover hover:bg-surface text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{l.name}</span>
                    {l.isPrimary && (
                      <span className={`text-[13px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                        {isAr ? 'الحساب الأساسي' : 'Primary'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {renewCatalogId && (
          <div role="status" className="p-3.5 rounded-xl bg-secondary/30 border border-secondary/50 text-sm text-foreground">
            {isAr
              ? 'اخترنالك نفس الباقة تحت. وافق على الشروط واضغط اختيار الباقة عشان تكمل.'
              : 'Your package is selected below. Accept the terms and choose it to continue.'}
          </div>
        )}
        {renewMissing && (
          <div role="status" className="p-3.5 rounded-xl bg-warning/10 border border-warning/30 text-sm text-foreground">
            {isAr
              ? 'الباقة دي مبقتش متاحة. اختار باقة تانية من اللي تحت.'
              : 'That package is no longer offered. Please choose another one below.'}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl glass-card border-none space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{isAr ? 'مدة الحصة:' : 'Lesson length:'}</span>
            {[30, 45, 60].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setPackageMinutes(m); setRenewCatalogId(null); setRenewMissing(false); }}
                aria-pressed={packageMinutes === m}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium cursor-pointer ${packageMinutes === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                {isAr ? `${m} دقيقة` : `${m} min`}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'رعاية الأسرة: لو اشتريت باقة لابن أو بنت تانية في نفس الحساب، بتاخد خصم 5% زيادة تلقائياً.'
              : 'Family care: buying a package for a second (or third) child on the same account takes an extra 5% off, automatically.'}
          </p>
          <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-teal-600"
            />
            <span>
              {isAr ? 'قرأت ووافقت على ' : 'I have read and accept the '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-primary">
                {isAr ? 'الشروط وسياسة الإلغاء والاسترداد' : 'terms and the cancellation & refund policy'}
              </a>
              .
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedEarlyStart}
              onChange={e => setAcceptedEarlyStart(e.target.checked)}
              className="mt-1 w-4 h-4 accent-teal-600"
            />
            <span>
              {isAr
                ? 'أطلب أن تبدأ دروس الباقة قبل انتهاء مدة الانسحاب (14 يوماً). وأفهم أنني إذا انسحبت خلالها أسترد ثمن الدروس غير المستخدمة، وتُحتسب الدروس التي تمت بسعرها في الباقة.'
                : 'I ask for my package lessons to start before my 14-day withdrawal period ends. I understand that if I withdraw within it, I get back the price of unused lessons, and lessons already taken are charged at the package price per lesson.'}{' '}
              <a href="/terms#withdrawal" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-primary">
                {isAr ? 'التفاصيل' : 'Details'}
              </a>
            </span>
          </label>
        </div>

        {catalogItems.length === 0 ? (
          <div
            data-testid="packages-unavailable"
            className="p-6 rounded-2xl glass-card border-none text-center text-sm sm:text-sm text-muted-foreground"
          >
            <AlertCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p>
              {isAr
                ? 'الباقات غير متاحة حالياً. حاول مرة أخرى بعد قليل.'
                : 'Packages are temporarily unavailable. Please try again shortly.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {catalogGroupKeys.map((groupKey) => (
              <div key={groupKey} className="space-y-3" data-testid={`package-group-${groupKey}`}>
                <h3 className="text-sm font-semibold text-foreground">
                  {packageTypeLabel(groupKey)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {groupedCatalog[groupKey].map((cat: any) => (
                    <PackageCard
                      key={cat.id}
                      cat={cat}
                      isAr={isAr}
                      isPurchasing={purchasingCatalogId === cat.id}
                      canSelect={acceptedTerms && acceptedEarlyStart}
                      onSelect={handleSelectPackage}
                      isRenewTarget={renewCatalogId === cat.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Credit Activity / Ledger History Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              <span>{isAr ? 'سجل حركة ونشاط الرصيد' : 'Credit Activity History'}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'سجل زمني موثق لعمليات تفعيل الباقات، استهلاك الدروس، وتعديلات الرصيد'
                : 'Authoritative audit trail of package activations and completed lessons'}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {ledger.length} {isAr ? 'حركة مسجلة' : 'activities'}
          </span>
        </div>

        {ledgerLoading ? (
          <div className="p-6 rounded-2xl glass-card border-none flex items-center justify-center gap-2.5 text-muted-foreground text-sm">
            <BrandSpinner size={18} />
            <span>{isAr ? 'جارٍ تحميل سجل النشاط...' : 'Loading credit activity...'}</span>
          </div>
        ) : ledgerError ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
            <span>{ledgerError}</span>
            <button
              type="button"
              onClick={fetchLedger}
              className="text-sm underline font-medium hover:opacity-80 cursor-pointer"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : ledger.length === 0 ? (
          <div className="p-6 rounded-2xl glass-card border-none text-center space-y-1.5">
            <History className="w-7 h-7 text-muted-foreground mx-auto" />
            <p className="text-sm sm:text-sm text-foreground font-medium">
              {isAr ? 'لا يوجد نشاط رصيد مسجل بعد' : 'No credit activity yet'}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'ستظهر هنا تفاصيل إضافة الرصيد واستهلاكه مع كل جلسة مكتملة.'
                : 'Credit grants upon package activation and deductions upon lesson completion will appear here.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border glass-card divide-y divide-border overflow-hidden">
            {ledger.map((item: any) => {
              const isPositive = item.deltaCredits > 0;
              const isNegative = item.deltaCredits < 0;
              const dateObj = item.createdAt
                ? DateTime.fromISO(item.createdAt).setLocale(isAr ? 'ar' : 'en')
                : null;

              return (
                <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-surface-subtle/50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isNegative
                          ? 'bg-secondary/30 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-sm font-semibold text-foreground">
                          {formatActivityLabel(item.activityType)}
                        </span>
                        {item.bookingReference && (
                          <span className="text-[13px] font-mono px-1.5 py-0.5 rounded glass-surface border border-border text-muted-foreground">
                            {item.bookingReference}
                          </span>
                        )}
                        {item.learnerName && (
                          <span className="text-[13px] text-muted-foreground">
                            • {item.learnerName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{item.packageName || (isAr ? 'باقة تعليمية' : 'Lesson Package')}</span>
                        {dateObj && (
                          <>
                            <span>•</span>
                            <span>{dateObj.toLocaleString(DateTime.DATETIME_MED)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <span
                      className={`inline-block text-sm sm:text-sm font-mono font-bold px-2 py-0.5 rounded-md ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isNegative
                          ? 'glass-surface text-foreground border border-border'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPositive ? `+${item.deltaCredits}` : item.deltaCredits} {isAr ? 'رصيد' : 'credit'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Payment Claim Modal */}
      {activeClaimEntitlement && (
        <StudentPaymentClaimModal
          isOpen={Boolean(activeClaimEntitlement)}
          onClose={() => setActiveClaimEntitlement(null)}
          entitlementId={activeClaimEntitlement.id}
          itemTitle={activeClaimEntitlement.packageName}
          amount={activeClaimEntitlement.pricePaid}
          currency={activeClaimEntitlement.currency || 'USD'}
          lang={lang}
          sessionToken={session?.access_token}
          onClaimSuccess={() => {
            fetchPackages();
            fetchLedger();
          }}
        />
      )}
    </div>
  );
}

/**
 * PackageCard — renders ONE server-provided catalog row.
 *
 * Price authority: `cat.price_amount` / `cat.currency` come verbatim from the
 * server package_catalog. Nothing here computes or overrides an authoritative
 * price. The only client-side arithmetic is a DISPLAY-ONLY per-lesson equivalent
 * and a transparent saving vs. single lessons, neither of which is ever sent to
 * the server as a price.
 */
function PackageCard({
  cat,
  isAr,
  isPurchasing,
  canSelect,
  onSelect,
  isRenewTarget = false,
}: {
  cat: any;
  isAr: boolean;
  isPurchasing: boolean;
  canSelect: boolean;
  onSelect: (cat: any) => void;
  isRenewTarget?: boolean;
}) {
  const lessonCount = Number(cat?.lesson_count) || 0;
  const price = Number(cat?.price_amount);
  const currency = cat?.currency || 'USD';
  const perLesson = lessonCount > 0 ? price / lessonCount : 0;

  // Transparent, mathematically-real saving requires an authoritative
  // single-lesson reference price. We only show a saving when the server row
  // carries that reference (no invented reference price on the client).
  const singleRef = Number(cat?.single_lesson_price ?? cat?.eligibility_rules?.single_lesson_price_usd);
  const hasRef = Number.isFinite(singleRef) && singleRef > 0 && lessonCount > 0;
  const saving = hasRef ? Math.round((singleRef * lessonCount - price) * 100) / 100 : 0;

  return (
    <Card
      id={`package-${cat.id}`}
      className={`hover:border-primary/40 transition-all flex flex-col justify-between glass-card ${isRenewTarget ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
    >
      <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-1 rounded-md bg-secondary/30">
              {lessonCount} {isAr ? 'دروس خاصة' : 'Private Lessons'}
            </span>
            {isRenewTarget && (
              <Badge variant="success">{isAr ? 'نفس باقتك' : 'Your package'}</Badge>
            )}
          </div>

          <div>
            <h3 className="text-lg font-display font-bold text-foreground">
              {isAr && cat.eligibility_rules?.name_ar ? cat.eligibility_rules.name_ar : cat.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {isAr
                ? 'حصص فردية مباشرة، تحجز كل حصة في الوقت اللي يناسبك.'
                : 'Private 1-on-1 lessons; book each one when it suits you.'}
            </p>
          </div>

          <div className="pt-2">
            <span className="text-3xl font-display font-bold text-foreground">${price}</span>
            <span className="text-sm text-muted-foreground ms-1">{currency}</span>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              ${perLesson.toFixed(2)} / {isAr ? 'درس' : 'lesson'}
            </div>
            {hasRef && saving > 0 && (
              <div className="text-[11px] font-medium text-success mt-1">
                {isAr ? `توفير $${saving}` : `Save $${saving}`}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="button"
            disabled={isPurchasing || !canSelect}
            title={canSelect ? undefined : (isAr ? 'وافق على الشروط الأول' : 'Please accept the terms first')}
            onClick={() => onSelect(cat)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isPurchasing ? (
              <>
                <BrandSpinner size={16} />
                <span>{isAr ? 'جارٍ المعالجة...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'اختيار هذه الباقة' : 'Select Package'}</span>
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
