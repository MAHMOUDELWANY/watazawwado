import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowUpRight
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';
import { StudentPageBack } from '../components/StudentPageBack';

export interface StudentPackagesPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

export default function StudentPackagesPage({ lang = 'en' }: StudentPackagesPageProps) {
  const { session } = useTeacherAuth();
  const [data, setData] = useState<any>({
    entitlements: [],
    catalog: [],
    creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 },
    learners: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-child learner selection
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');

  // Credit history ledger
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // Purchasing & Claiming State
  const [purchasingCatalogId, setPurchasingCatalogId] = useState<string | null>(null);
  const [activeClaimEntitlement, setActiveClaimEntitlement] = useState<any | null>(null);

  const isAr = lang === 'ar';

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(isAr ? 'فشل تحميل بيانات الباقات' : 'Failed to load packages');
      }

      const json = await res.json();
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
      if (!token) return;

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

  const handleSelectPackage = async (catalogItem: any) => {
    try {
      setPurchasingCatalogId(catalogItem.id);
      setError(null);
      const token = session?.access_token;

      const payload: any = { packageCatalogId: catalogItem.id };
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

      // Open claim modal with the newly created entitlement
      setActiveClaimEntitlement({
        id: json.entitlement?.id,
        packageName: catalogItem.name,
        pricePaid: catalogItem.price_amount,
        currency: catalogItem.currency || 'USD'
      });
    } catch (err: any) {
      console.error('[handleSelectPackage Error]', err);
      setError(err.message || (isAr ? 'فشل إتمام اختيار الباقة' : 'Could not initialize package selection'));
    } finally {
      setPurchasingCatalogId(null);
    }
  };

  const getEntitlementStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="px-2.5 py-0.5 text-xs">
            {isAr ? 'مفعلة ونشطة' : 'Active'}
          </Badge>
        );
      case 'pending_payment':
        return (
          <Badge variant="warning" className="px-2.5 py-0.5 text-xs">
            {isAr ? 'في انتظار إثبات الدفع' : 'Pending Payment'}
          </Badge>
        );
      case 'exhausted':
        return (
          <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
            {isAr ? 'مكتملة الاستخدام' : 'Exhausted'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="px-2.5 py-0.5 text-xs">
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

  const fallbackCatalog = [
    {
      id: 'catalog-4-lessons',
      name: isAr ? 'باقة التأسيس (٤ دروس)' : '4-Lesson Foundation Package',
      lesson_count: 4,
      price_amount: 80,
      currency: 'USD',
      description: isAr
        ? '٤ دروس فردية خاصة ومباشرة مع الأستاذ محمود. مرونة كاملة في المواعيد.'
        : '4 focused 1-on-1 private lessons with Ustadh Mahmoud. Flexible scheduling.'
    },
    {
      id: 'catalog-8-lessons',
      name: isAr ? 'باقة الإتقان (٨ دروس)' : '8-Lesson Comprehensive Package',
      lesson_count: 8,
      price_amount: 150,
      currency: 'USD',
      description: isAr
        ? '٨ دروس تركز على تصحيح التلاوة، أحكام التجويد، والمتابعة الدورية المنتظمة.'
        : '8 private lessons covering recitation, Tajweed rules, and personalized retention.'
    },
    {
      id: 'catalog-12-lessons',
      name: isAr ? 'باقة التثبيت والمتابعة المكثفة (١٢ درساً)' : '12-Lesson Intensive Package',
      lesson_count: 12,
      price_amount: 215,
      currency: 'USD',
      description: isAr
        ? '١٢ جلسة تعليمية مخصصة للحفظ المتين والتقدم المنهجي المستمر.'
        : '12 private sessions for deep memorization and consistent mastery.'
    }
  ];

  const catalogItems = data.catalog && data.catalog.length > 0 ? data.catalog : fallbackCatalog;
  const entitlements = data.entitlements || [];
  const creditSummary = data.creditSummary || { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 };
  const learners = Array.isArray(data.learners) ? data.learners : [];
  const hasMultipleLearners = learners.length > 1;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* 1. Header & Back Navigation */}
      <div className="space-y-3">
        <StudentPageBack to="/student" label={isAr ? 'العودة للرئيسية' : 'Back to Dashboard'} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              {isAr ? 'باقات الدروس والرصيد' : 'Lesson Packages & Credits'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isAr
                ? 'إدارة باقاتك التعليمية، رصيد الدروس الفردية، وسجل النشاط الموثق مع الأستاذ محمود'
                : 'Manage your prepaid lesson bundles, active credits, and verified learning activity'}
            </p>
          </div>

          <Link
            to="/student/book"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حجز درس جديد' : 'Book a Lesson'}</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards (Credit Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Remaining Credits */}
        <Card className="border-border bg-surface">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">
                {isAr ? 'الرصيد المتاح حالياً' : 'Remaining Credits'}
              </span>
              <div className="text-3xl font-serif font-bold text-primary">
                {creditSummary.totalRemaining}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'دروس جاهزة للجدولة' : 'Lessons ready to schedule'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Used */}
        <Card className="border-border bg-surface">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">
                {isAr ? 'الدروس المكتملة' : 'Completed Lessons'}
              </span>
              <div className="text-3xl font-serif font-bold text-foreground">
                {creditSummary.totalUsed}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'دروس تم إتمامها واستهلاكها' : 'Consumed from active packages'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-subtle text-muted-foreground">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Purchased */}
        <Card className="border-border bg-surface">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">
                {isAr ? 'إجمالي الرصيد المكتسب' : 'Total Granted'}
              </span>
              <div className="text-3xl font-serif font-bold text-foreground">
                {creditSummary.totalPurchased}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'رصيد تراكمي منذ بدء التعلم' : 'Cumulative lessons granted'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-subtle text-muted-foreground">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Package Policy & Rules Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
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
          href="https://wa.me/201026042456?text=Assalamu%20Alaikum%20Ustadh%20Mahmoud%2C%20I%20have%20a%20question%20regarding%20lesson%20packages."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs font-medium transition-colors shrink-0 self-start md:self-auto min-h-[38px]"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isAr ? 'استفسار عبر واتساب' : 'Inquire on WhatsApp'}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </a>
      </div>

      {/* 4. Active Entitlements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-foreground">
            {isAr ? 'باقاتي الحالية' : 'My Packages'}
          </h2>
          <span className="text-xs text-muted-foreground">
            {entitlements.length} {isAr ? 'باقة مسجلة' : 'packages recorded'}
          </span>
        </div>

        {entitlements.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-2">
            <Package className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs sm:text-sm text-foreground font-medium">
              {isAr ? 'ليس لديك باقات نشطة حالياً' : 'No active packages yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'اختر من الباقات المتاحة أدناه لبدء التعلم برصيد مسبق الدفع وحفظ الجلسات بمرونة.'
                : 'Choose one of Ustadh Mahmoud’s lesson packages below to start learning with bundled credits.'}
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
                <Card key={ent.id} className="border-border bg-surface">
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-foreground">
                            {ent.packageName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span>
                            {ent.purchasedQuantity} {isAr ? 'دروس فردية' : 'private 1-on-1 lessons'}
                            {ent.pricePaid ? ` • $${ent.pricePaid} ${ent.currency}` : ''}
                          </span>
                          {ent.learnerName && (
                            <Badge variant="outline" className="text-[10px] font-normal border-primary/20 text-primary bg-primary/5">
                              {isAr ? `لـ ${ent.learnerName}` : `For ${ent.learnerName}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getEntitlementStatusBadge(ent.status)}
                    </div>

                    {/* Credits progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {isAr ? 'الرصيد المتبقي:' : 'Remaining Credits:'}
                        </span>
                        <span className="font-bold text-foreground">
                          {ent.remainingCredits} / {ent.purchasedQuantity}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
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
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إرسال إثبات الدفع لتفعيل الرصيد' : 'Submit Payment Claim'}</span>
                        </button>
                      ) : ent.remainingCredits > 0 ? (
                        <Link
                          to={`/student/book?entitlementId=${ent.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
                        >
                          <Plus className="w-3.5 h-3.5 text-primary" />
                          <span>{isAr ? 'حجز درس من هذا الرصيد' : 'Book a Session'}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {isAr ? 'تم استهلاك جميع رصيد هذه الباقة' : 'All credits in this package have been used'}
                        </span>
                      )}
                    </div>
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
          <h2 className="text-lg font-serif font-bold text-foreground">
            {isAr ? 'الباقات التعليمية المتاحة' : 'Available Lesson Packages'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr
              ? 'اختر الباقة المناسبة لخطة تعلمك الفردية مع الأستاذ محمود'
              : 'Choose the package that aligns with your individual learning goals'}
          </p>
        </div>

        {/* Multi-Child Learner Selector (Only shown if account has multiple learners) */}
        {hasMultipleLearners && (
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
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
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer min-h-[38px] ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-surface-subtle hover:bg-surface text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{l.name}</span>
                    {l.isPrimary && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                        {isAr ? 'الحساب الأساسي' : 'Primary'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {catalogItems.map((cat: any) => {
            const isPurchasing = purchasingCatalogId === cat.id;

            return (
              <Card
                key={cat.id}
                className="border-border hover:border-primary/40 transition-all flex flex-col justify-between bg-surface"
              >
                <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-1 rounded-md bg-primary/10">
                        {cat.lesson_count} {isAr ? 'دروس خاصة' : 'Private Lessons'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-serif font-bold text-foreground">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {cat.description ||
                          (isAr
                            ? 'جلسات فردية مباشرة لتصحيح التلاوة، التجويد، والحفظ المستمر.'
                            : 'Personalized private lessons for recitation, Tajweed, and retention.')}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-3xl font-serif font-bold text-foreground">
                        ${cat.price_amount}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {cat.currency || 'USD'}
                      </span>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        ${Math.round(cat.price_amount / cat.lesson_count)} / {isAr ? 'درس' : 'lesson'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <button
                      type="button"
                      disabled={isPurchasing}
                      onClick={() => handleSelectPackage(cat)}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
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
          })}
        </div>
      </div>

      {/* 6. Credit Activity / Ledger History Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>{isAr ? 'سجل حركة ونشاط الرصيد' : 'Credit Activity History'}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'سجل زمني موثق لعمليات تفعيل الباقات، استهلاك الدروس، وتعديلات الرصيد'
                : 'Authoritative audit trail of package activations and completed lessons'}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {ledger.length} {isAr ? 'حركة مسجلة' : 'activities'}
          </span>
        </div>

        {ledgerLoading ? (
          <div className="p-6 rounded-2xl bg-surface border border-border flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>{isAr ? 'جارٍ تحميل سجل النشاط...' : 'Loading credit activity...'}</span>
          </div>
        ) : ledgerError ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
            <span>{ledgerError}</span>
            <button
              type="button"
              onClick={fetchLedger}
              className="text-xs underline font-medium hover:opacity-80 cursor-pointer"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : ledger.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-1.5">
            <History className="w-7 h-7 text-muted-foreground mx-auto" />
            <p className="text-xs sm:text-sm text-foreground font-medium">
              {isAr ? 'لا يوجد نشاط رصيد مسجل بعد' : 'No credit activity yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? 'ستظهر هنا تفاصيل إضافة الرصيد واستهلاكه مع كل جلسة مكتملة.'
                : 'Credit grants upon package activation and deductions upon lesson completion will appear here.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
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
                          ? 'bg-primary/10 text-primary'
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
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {formatActivityLabel(item.activityType)}
                        </span>
                        {item.bookingReference && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-muted-foreground">
                            {item.bookingReference}
                          </span>
                        )}
                        {item.learnerName && (
                          <span className="text-[10px] text-muted-foreground">
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

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-xs sm:text-sm font-mono font-bold px-2 py-0.5 rounded-md ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isNegative
                          ? 'bg-surface-subtle text-foreground border border-border'
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
