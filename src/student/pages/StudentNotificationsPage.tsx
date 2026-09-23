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
  Video,
  ArrowRight,
  Check,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { Badge } from '../../components/ui/Badge';
import { StudentPageBack } from '../components/StudentPageBack';
import {
  buildStudentNotifications,
  countUnread,
  notificationReadStateKey,
  type StudentNotificationItem
} from '../notificationsPresentation';

export type { StudentNotificationItem };

export interface StudentNotificationsPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

export default function StudentNotificationsPage({ lang = 'en', session }: StudentNotificationsPageProps) {
  const auth = useTeacherAuth();
  const effectiveSession = session || auth.session;
  const user = auth.user;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined' && user?.id) {
      try {
        const saved = localStorage.getItem(notificationReadStateKey(user.id));
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
          notificationReadStateKey(user.id),
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
      setAuthError(false);
      const token = effectiveSession?.access_token;

      // Explicit auth/session state — never silently fall through to an empty
      // notification list when authentication is unavailable.
      if (!token) {
        setAuthError(true);
        setNotifications([]);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [bookingsRes, paymentsRes, packagesRes] = await Promise.all([
        fetch('/api/student/bookings', { headers }),
        fetch('/api/student/payments', { headers }),
        fetch('/api/student/packages', { headers })
      ]);

      // A 401 on the primary auth-guarded reads means the session is no longer
      // valid — surface an explicit session state, not an empty history.
      if (bookingsRes.status === 401 || paymentsRes.status === 401) {
        setAuthError(true);
        setNotifications([]);
        return;
      }

      // Bookings and payments are the authoritative inputs; a failure here is a
      // real error, never a fake empty state. Package credits are informational
      // only, so a package read failure degrades gracefully.
      if (!bookingsRes.ok || !paymentsRes.ok) {
        throw new Error(isAr ? 'فشل تحميل التنبيهات' : 'Failed to load notifications');
      }

      const bookingsData = await bookingsRes.json();
      const paymentsJson = await paymentsRes.json();
      const packagesData = packagesRes.ok ? await packagesRes.json() : null;

      const items = buildStudentNotifications(
        Array.isArray(bookingsData) ? bookingsData : [],
        Array.isArray(paymentsJson?.payments) ? paymentsJson.payments : [],
        packagesData,
        readIds
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

  const unreadCount = countUnread(notifications);

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
      case 'payment_partial':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
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
      ) : authError ? (
        <div className="p-6 bg-surface border border-warning/30 rounded-2xl text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-7 h-7 text-warning mx-auto" />
          <p className="text-sm font-semibold text-foreground">
            {isAr ? 'جلسة الدخول غير متاحة أو منتهية' : 'Your session is unavailable or has expired'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'يرجى تسجيل الدخول مرة أخرى لعرض تنبيهاتك. لم يتم حذف أي بيانات.'
              : 'Please sign in again to view your notifications. No data has been lost.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <Link
              to="/student"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold min-h-[44px] inline-flex items-center"
            >
              {isAr ? 'تسجيل الدخول مرة أخرى' : 'Sign In Again'}
            </Link>
            <button
              type="button"
              onClick={fetchNotificationData}
              className="px-4 py-2 bg-surface border border-border text-foreground rounded-xl text-xs font-medium min-h-[44px]"
            >
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-destructive/20 rounded-2xl text-center max-w-md mx-auto">
          <AlertCircle className="w-7 h-7 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchNotificationData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium min-h-[44px]"
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
