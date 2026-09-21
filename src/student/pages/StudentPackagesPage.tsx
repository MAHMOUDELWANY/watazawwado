import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';

export interface StudentPackagesPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

export default function StudentPackagesPage({ lang = 'en' }: StudentPackagesPageProps) {
  const { session, user } = useTeacherAuth();
  const [data, setData] = useState<any>({
    entitlements: [],
    catalog: [],
    creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Purchasing & Claiming State
  const [purchasingCatalogId, setPurchasingCatalogId] = useState<string | null>(null);
  const [activeClaimEntitlement, setActiveClaimEntitlement] = useState<any | null>(null);

  const isAr = lang === 'ar';

  const fetchPackages = async () => {
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
    } catch (err: any) {
      console.error('[StudentPackagesPage Fetch Error]', err);
      setError(err.message || (isAr ? 'تعذر تحميل بيانات الباقات' : 'Unable to load packages'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [session, isAr]);

  const handleSelectPackage = async (catalogItem: any) => {
    try {
      setPurchasingCatalogId(catalogItem.id);
      setError(null);
      const token = session?.access_token;

      const res = await fetch('/api/student/packages/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ packageCatalogId: catalogItem.id })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || (isAr ? 'فشل اختيار الباقة' : 'Failed to select package'));
      }

      // Re-fetch entitlements
      await fetchPackages();

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

  const fallbackCatalog = [
    {
      id: 'catalog-4-lessons',
      name: isAr ? 'باقة التأسيس (٤ دروس)' : '4-Lesson Foundation Package',
      lesson_count: 4,
      price_amount: 80,
      currency: 'USD',
      description: isAr
        ? 'أربع جلسات فردية مركزة مع الأستاذ محمود لتصحيح التلاوة وأساسيات التجويد.'
        : 'Four focused 1-on-1 private lessons covering recitation foundations and core Tajweed rules.'
    },
    {
      id: 'catalog-8-lessons',
      name: isAr ? 'باقة الإتقان الشاملة (٨ دروس)' : '8-Lesson Comprehensive Package',
      lesson_count: 8,
      price_amount: 150,
      currency: 'USD',
      description: isAr
        ? 'ثماني جلسات مخصصة للحفظ المستمر، المراجعة، والتطبيق العملي لقواعد التجويد.'
        : 'Eight comprehensive private sessions for consistent Hifz, retention, and hands-on Tajweed mastery.'
    },
    {
      id: 'catalog-12-lessons',
      name: isAr ? 'باقة التميز المكثفة (١٢ درساً)' : '12-Lesson Intensive Package',
      lesson_count: 12,
      price_amount: 215,
      currency: 'USD',
      description: isAr
        ? 'اثنتا عشرة جلسة مكثفة لتثبيت الحفظ، دراسة أحكام التلاوة، وتعميق الدراسات الإسلامية.'
        : 'Twelve intensive sessions for deep memorization, retention, and personalized Islamic Studies.'
    }
  ];

  const catalogItems = data.catalog && data.catalog.length > 0 ? data.catalog : fallbackCatalog;
  const entitlements = data.entitlements || [];
  const creditSummary = data.creditSummary || { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-start">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
            {isAr ? 'الباقات ورصيد الدروس' : 'Packages & Lesson Credits'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {isAr
              ? 'إدارة باقاتك التعليمية المفعلة، رصيد الدروس المتبقي، وحجز باقات جديدة بمرونة كاملة.'
              : 'Manage your active prepaid lesson credits, view credit balance, and subscribe to flexible lesson bundles.'}
          </p>
        </div>

        <Link
          to="/student/book"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'حجز درس برصيدك' : 'Book with Credits'}</span>
        </Link>
      </div>

      {/* 2. Credit Balance Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Remaining Credits */}
        <Card className="border-primary/20 bg-surface">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'الرصيد المتاح حالياً' : 'Available Credits'}
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-primary">
                {creditSummary.totalRemaining}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'درس فردي متاح للحجز الفوري' : '1-on-1 private lessons ready to book'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
              <Package className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Lessons */}
        <Card className="border-border bg-surface">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'الدروس المنجزة' : 'Completed Lessons'}
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                {creditSummary.totalUsed}
              </div>
              <span className="text-xs text-muted-foreground block">
                {isAr ? 'جلسة تعليمية تمت مع الأستاذ' : 'Sessions completed with Mahmoud'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Total Credits */}
        <Card className="border-border bg-surface">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'إجمالي الدروس المقتناة' : 'Total Credits Granted'}
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
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
                        <h3 className="font-serif font-bold text-base text-foreground">
                          {ent.packageName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ent.purchasedQuantity} {isAr ? 'دروس فردية' : 'private 1-on-1 lessons'}
                          {ent.pricePaid ? ` • $${ent.pricePaid} ${ent.currency}` : ''}
                        </p>
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
                          to="/student/book"
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
                className="border-border hover:border-primary/40 transition-all flex flex-col justify-between"
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

      {/* 6. Payment Claim Modal */}
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
          }}
        />
      )}
    </div>
  );
}
