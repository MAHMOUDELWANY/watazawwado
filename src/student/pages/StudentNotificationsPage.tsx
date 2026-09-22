import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Calendar,
  CreditCard,
  Video,
  ArrowRight,
  Check,
  Loader2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { Badge } from '../../components/ui/Badge';
import { StudentPageBack } from '../components/StudentPageBack';

export interface StudentNotificationItem {
  id: string;
  type: 'lesson_reminder' | 'payment_action' | 'payment_verified' | 'payment_review' | 'package_active' | 'lesson_cancelled' | 'booking_confirmed';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  actionLabelAr?: string;
  zoomUrl?: string;
}

export interface StudentNotificationsPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

export function buildStudentNotifications(
  bookings: any[],
  payments: any[],
  packagesData: any,
  readIds: Set<string>,
  isAr: boolean
): StudentNotificationItem[] {
  const items: StudentNotificationItem[] = [];

  // 1. Bookings Notifications
  bookings.forEach((b: any) => {
    const startStr = b.scheduledStart || b.scheduled_start || b.lesson_date;
    const refCode = b.referenceCode || b.reference_code || '';
    const title = b.serviceTitle || b.services?.title || (isAr ? 'جلسة تعليمية' : 'Private Lesson');

    if (startStr) {
      const dt = DateTime.fromISO(startStr);
      if (dt.isValid) {
        const diffHours = dt.diffNow().as('hours');

        // Upcoming within 72 hours
        if (diffHours > -1 && diffHours < 72 && (b.status === 'confirmed' || b.status === 'rescheduled')) {
          const rawZoom = (b.zoomMeetingLink || b.zoom_join_url || '').trim();
          const hasZoom = Boolean(rawZoom && (rawZoom.startsWith('http://') || rawZoom.startsWith('https://')));

          items.push({
            id: `upcoming_${b.id || refCode}`,
            type: 'lesson_reminder',
            title: `Upcoming Lesson: ${title}`,
            titleAr: `موعد درس قادم: ${title}`,
            description: `Scheduled for ${dt.setLocale('en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} with Ustadh Mahmoud.`,
            descriptionAr: `مجدول في ${dt.setLocale('ar').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} مع الأستاذ محمود.`,
            timestamp: dt.toISO() || new Date().toISOString(),
            read: readIds.has(`upcoming_${b.id || refCode}`),
            actionUrl: hasZoom ? rawZoom : '/student/lessons',
            actionLabel: hasZoom ? 'Join Zoom Classroom' : 'View Lesson',
            actionLabelAr: hasZoom ? 'دخول فصل زووم' : 'تفاصيل الدرس',
            zoomUrl: hasZoom ? rawZoom : undefined
          });
        }
      }
    }

    // Pending payment needed
    if (b.status === 'pending') {
      items.push({
        id: `pending_payment_${b.id || refCode}`,
        type: 'payment_action',
        title: `Payment Claim Needed: ${title}`,
        titleAr: `مطلوب تأكيد الدفع: ${title}`,
        description: `Booking ref ${refCode || 'N/A'} is awaiting payment confirmation to guarantee your schedule slot.`,
        descriptionAr: `الحجز ذو المرجع ${refCode || 'N/A'} بانتظار إرسال إثبات الدفع لتثبيت الموعد.`,
        timestamp: b.createdAt || b.created_at || new Date().toISOString(),
        read: readIds.has(`pending_payment_${b.id || refCode}`),
        actionUrl: '/student/payments',
        actionLabel: 'Submit Payment Proof',
        actionLabelAr: 'إرسال إثبات الدفع'
      });
    }

    // Cancelled
    if (b.status === 'cancelled') {
      items.push({
        id: `cancelled_${b.id || refCode}`,
        type: 'lesson_cancelled',
        title: `Lesson Cancelled: ${title}`,
        titleAr: `تم إلغاء الدرس: ${title}`,
        description: `The session originally set for ${startStr ? DateTime.fromISO(startStr).toFormat('LLL dd') : 'a scheduled date'} was cancelled.`,
        descriptionAr: `تم إلغاء الجلسة التي كانت مجدولة مع الأستاذ محمود.`,
        timestamp: b.updatedAt || b.updated_at || new Date().toISOString(),
        read: readIds.has(`cancelled_${b.id || refCode}`),
        actionUrl: '/student/lessons',
        actionLabel: 'Check Schedule',
        actionLabelAr: 'مراجعة الجدول'
      });
    }
  });

  // 2. Payments Notifications
  payments.forEach((p: any) => {
    const ref = p.reference_code || p.referenceCode || p.id?.slice(0, 8);
    const amount = p.amount ? `$${p.amount}` : '';

    if (p.status === 'confirmed') {
      items.push({
        id: `payment_confirmed_${p.id || ref}`,
        type: 'payment_verified',
        title: `Payment Verified & Confirmed ${amount}`,
        titleAr: `تم تأكيد وقبول الدفع بنجاح ${amount}`,
        description: `Ustadh Mahmoud has verified your payment reference ${ref}. Your session/credits are fully active.`,
        descriptionAr: `قام الأستاذ محمود بالتحقق من الحوالة ذات المرجع ${ref}. تم تفعيل الحصص بنجاح.`,
        timestamp: p.confirmed_at || p.updated_at || new Date().toISOString(),
        read: readIds.has(`payment_confirmed_${p.id || ref}`),
        actionUrl: '/student/payments',
        actionLabel: 'View Receipt',
        actionLabelAr: 'عرض الإيصال'
      });
    } else if (p.status === 'pending') {
      items.push({
        id: `payment_pending_${p.id || ref}`,
        type: 'payment_review',
        title: `Payment Under Review (${ref})`,
        titleAr: `إثبات الدفع قيد المراجعة (${ref})`,
        description: `Your payment claim of ${amount} via ${p.payment_method || 'transfer'} is being reviewed.`,
        descriptionAr: `إثبات الدفع للحوالة ${amount} عبر ${p.payment_method || 'التحويل'} قيد المراجعة والاعتماد.`,
        timestamp: p.created_at || new Date().toISOString(),
        read: readIds.has(`payment_pending_${p.id || ref}`),
        actionUrl: '/student/payments',
        actionLabel: 'Track Status',
        actionLabelAr: 'متابعة الحالة'
      });
    }
  });

  // 3. Package Status Notifications
  if (packagesData?.creditSummary?.totalRemaining > 0) {
    items.push({
      id: `package_credits_available`,
      type: 'package_active',
      title: `${packagesData.creditSummary.totalRemaining} Lesson Credits Ready`,
      titleAr: `لديك ${packagesData.creditSummary.totalRemaining} حصص جاهزة للحجز`,
      description: `You have active prepaid package credits available. Select your preferred time with Ustadh Mahmoud.`,
      descriptionAr: `رصيد باقتك متاح ومفعل. يمكنك حجز موعد جديد مباشرة باستخدام رصيدك.`,
      timestamp: new Date().toISOString(),
      read: readIds.has('package_credits_available'),
      actionUrl: '/student/book',
      actionLabel: 'Book with Package',
      actionLabelAr: 'حجز باستخدام الرصيد'
    });
  }

  // Sort descending by timestamp
  return items.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
}

export default function StudentNotificationsPage({ lang = 'en', session }: StudentNotificationsPageProps) {
  const auth = useTeacherAuth();
  const effectiveSession = session || auth.session;
  const user = auth.user;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const saved = localStorage.getItem(`watazawwado_notifications_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return new Set<string>(parsed.map(String));
          }
        }
      } catch {
        // Safe fallback
      }
    }
    return new Set<string>();
  });

  const isAr = lang === 'ar';

  const persistReadIds = (nextSet: Set<string>) => {
    setReadIds(nextSet);
    if (user?.id) {
      try {
        localStorage.setItem(
          `watazawwado_notifications_${user.id}`,
          JSON.stringify(Array.from(nextSet))
        );
      } catch {
        // Safe fallback
      }
    }
  };

  const fetchNotificationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = effectiveSession?.access_token;
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const [bookingsRes, paymentsRes, packagesRes] = await Promise.all([
        fetch('/api/student/bookings', { headers }),
        fetch('/api/student/payments', { headers }),
        fetch('/api/student/packages', { headers })
      ]);

      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];
      const paymentsJson = paymentsRes.ok ? await paymentsRes.json() : {};
      const packagesData = packagesRes.ok ? await packagesRes.json() : null;

      const items = buildStudentNotifications(
        Array.isArray(bookingsData) ? bookingsData : [],
        Array.isArray(paymentsJson.payments) ? paymentsJson.payments : [],
        packagesData,
        readIds,
        isAr
      );

      setNotifications(items);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || (isAr ? 'فشل تحميل التنبيهات' : 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, [effectiveSession, isAr]);

  const markAsRead = (id: string) => {
    const next = new Set<string>(readIds);
    next.add(id);
    persistReadIds(next);
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const markAllAsRead = () => {
    const next = new Set<string>(readIds);
    notifications.forEach(n => next.add(n.id));
    persistReadIds(next);
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
  };

  const filteredItems = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: StudentNotificationItem['type']) => {
    switch (type) {
      case 'lesson_reminder':
        return <Calendar className="w-5 h-5 text-primary" />;
      case 'payment_action':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'payment_verified':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'payment_review':
        return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'package_active':
        return <Package className="w-5 h-5 text-primary" />;
      case 'lesson_cancelled':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-start">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <StudentPageBack
            to="/student"
            label="Return to Student Portal"
            labelAr="العودة لبوابة الطالب"
            className="mb-1.5"
          />
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              {isAr ? 'التنبيهات والإشعارات' : 'Notifications'}
            </h1>
            {unreadCount > 0 && (
              <Badge variant="warning" className="px-2.5 py-0.5 text-xs font-semibold">
                {unreadCount} {isAr ? 'جديد' : 'new'}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {isAr
              ? 'متابعة تحديثات المواعيد، تأكيدات الحوالات المالية، وتنبيهات الباقات.'
              : 'Direct lesson reminders, payment verification updates, and package entitlements.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer self-start sm:self-center"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          {isAr ? 'الكل' : 'All'} ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          {isAr ? 'غير المقروء' : 'Unread'} ({unreadCount})
        </button>
      </div>

      {/* 3. Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] gap-3">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">
            {isAr ? 'جارٍ تحميل التنبيهات...' : 'Loading notifications...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-destructive/20 rounded-2xl text-center max-w-md mx-auto">
          <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchNotificationData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium"
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 bg-surface border border-border rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-foreground">
            {isAr ? 'لا توجد تنبيهات حالياً' : 'All caught up!'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {filter === 'unread'
              ? (isAr ? 'لا توجد تنبيهات غير مقروءة في الوقت الحالي.' : 'You have no unread notifications right now.')
              : (isAr ? 'ستظهر هنا إشعارات الدروس القادمة، تأكيدات الحوالات، وتحديثات الباقات.' : 'Upcoming lesson reminders, payment receipts, and schedule updates will appear here.')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-2xl bg-surface overflow-hidden">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                item.read ? 'opacity-85 hover:bg-surface-subtle/50' : 'bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-surface border border-border shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm sm:text-base text-foreground">
                      {isAr ? item.titleAr : item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {isAr ? item.descriptionAr : item.description}
                  </p>
                  <span className="text-[11px] text-muted-foreground block pt-0.5">
                    {DateTime.fromISO(item.timestamp).setLocale(isAr ? 'ar' : 'en').toRelative()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:self-center shrink-0">
                {item.actionUrl && (
                  item.actionUrl.startsWith('http') ? (
                    <a
                      href={item.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isAr ? (item.actionLabelAr || 'دخول') : (item.actionLabel || 'Open')}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  ) : (
                    <Link
                      to={item.actionUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-surface-subtle border border-border text-foreground hover:text-primary rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <span>{isAr ? (item.actionLabelAr || 'عرض') : (item.actionLabel || 'View')}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </Link>
                  )
                )}

                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
                    title={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                    aria-label={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
