import React, { useEffect, useState } from 'react';
import { InboxList } from '../../components/InboxList';
import { DateTime } from 'luxon';
import { Bell, CalendarPlus, CalendarX, CalendarClock, Sparkles, Loader2 } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

interface DashboardNotification {
  id: string;
  bookingId: string;
  kind: 'new_booking' | 'new_trial' | 'cancelled' | 'rescheduled';
  learnerName: string;
  serviceId: string;
  referenceCode: string;
  scheduledStart: string;
  at: string;
}

const SEEN_KEY = 'watazawwado_dashboard_notifications_seen_at';

function readSeenAt(): string {
  try {
    return localStorage.getItem(SEEN_KEY) || '';
  } catch {
    return '';
  }
}

/** Count of notifications newer than the last visit to the notifications page (for the nav badge). */
export function useUnreadDashboardNotifications(enabled: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const load = () => dashboardFetch('/api/dashboard/notifications')
      .then((res: any) => {
        const seenAt = readSeenAt();
        setCount((res.notifications || []).filter((n: DashboardNotification) => !seenAt || n.at > seenAt).length);
      })
      .catch(() => setCount(0));
    load();
    const timer = setInterval(load, 120000);
    const onSeen = () => setCount(0);
    window.addEventListener('watazawwado_notifications_seen', onSeen);
    return () => {
      clearInterval(timer);
      window.removeEventListener('watazawwado_notifications_seen', onSeen);
    };
  }, [enabled]);
  return count;
}

/**
 * Teacher / admin on-site notifications: lessons booked, moved or cancelled in the last 14 days.
 * Never shows payment information (RULES.md §1).
 */
export default function NotificationsPage() {
  const { t, isAr } = useT();
  const [items, setItems] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [seenAt] = useState(readSeenAt);

  useEffect(() => {
    dashboardFetch('/api/dashboard/notifications')
      .then((res: any) => setItems(res.notifications || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      // Badge will just reappear next time.
    }
    window.dispatchEvent(new Event('watazawwado_notifications_seen'));
  }, []);

  const meta = (kind: DashboardNotification['kind']) => {
    switch (kind) {
      case 'new_trial': return { icon: Sparkles, label: t('New free trial', 'حصة تجريبية جديدة'), tone: 'text-teal-600' };
      case 'cancelled': return { icon: CalendarX, label: t('Lesson cancelled', 'حصة اتلغت'), tone: 'text-destructive' };
      case 'rescheduled': return { icon: CalendarClock, label: t('Lesson moved', 'حصة اتغيّر ميعادها'), tone: 'text-amber-600' };
      default: return { icon: CalendarPlus, label: t('New lesson booked', 'حجز حصة جديدة'), tone: 'text-primary' };
    }
  };

  return (
    <div className="space-y-6">
      <InboxList lang={isAr ? 'ar' : 'en'} />
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          {t('Notifications', 'الإشعارات')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Your lessons that were booked, moved or cancelled in the last 14 days.', 'حصصك اللي اتحجزت أو اتغيّر ميعادها أو اتلغت في آخر 14 يوم.')}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('Loading…', 'جارٍ التحميل…')}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{t("Couldn't load notifications. Please refresh.", 'تعذر تحميل الإشعارات. حدّث الصفحة.')}</p>
      ) : items.length === 0 ? (
        <div className="glass-card p-6 rounded-2xl text-center text-sm text-muted-foreground">
          {t('Nothing new yet.', 'مفيش جديد لحد دلوقتي.')}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(item => {
            const { icon: Icon, label, tone } = meta(item.kind);
            const isNew = !seenAt || item.at > seenAt;
            const when = DateTime.fromISO(item.scheduledStart).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
            return (
              <li key={item.id} className="glass-card p-4 rounded-2xl border border-border flex items-start gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${tone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{label}</span>
                    {isNew && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{t('New', 'جديد')}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.learnerName} · {item.serviceId} · {when}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {item.referenceCode} · {DateTime.fromISO(item.at).setLocale(isAr ? 'ar' : 'en').toRelative()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
