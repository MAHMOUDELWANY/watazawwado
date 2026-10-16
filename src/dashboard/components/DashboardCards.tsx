import React from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Bell, MessageCircle, ChevronRight, CalendarDays } from 'lucide-react';
import { useT } from '../../lib/language';

/** Dashboard widget surface (docs/design-system.md: glass-2, radius r-3). */
export const DASH_CARD = 'glass-2 rounded-[var(--r-3)]';

/** Month at a glance with today marked; links to the full schedule. Display only. */
export function CompactCalendar({ timezone }: { timezone?: string }) {
  const { t, isAr } = useT();
  const today = DateTime.now().setZone(timezone || 'local').setLocale(isAr ? 'ar' : 'en');
  // Weeks start on Saturday in Arabic, Sunday in English.
  const weekStart = isAr ? 6 : 7;
  const first = today.startOf('month');
  const lead = (first.weekday - weekStart + 7) % 7;
  const days = Array.from({ length: first.daysInMonth || 30 }, (_, i) => i + 1);
  const headers = Array.from({ length: 7 }, (_, i) => first.minus({ days: lead }).plus({ days: i }).toFormat('ccccc'));

  return (
    <div className={`${DASH_CARD} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal" aria-hidden="true" />
          {today.toFormat('LLLL yyyy')}
        </h2>
        <Link to="/dashboard/upcoming" className="text-xs font-semibold text-teal hover:underline">
          {t('Schedule', 'الجدول')}
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {headers.map((h, i) => (
          <span key={`h${i}`} className="text-[11px] font-medium text-muted-foreground pb-1" aria-hidden="true">{h}</span>
        ))}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
        {days.map((d) => {
          const isToday = d === today.day;
          const isPast = d < today.day;
          return (
            <span
              key={d}
              aria-current={isToday ? 'date' : undefined}
              className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center tabular-nums ${
                isToday
                  ? 'bg-teal text-white shadow-sm shadow-teal/30'
                  : isPast
                  ? 'text-muted-foreground/60'
                  : 'bg-surface-subtle/70 text-foreground'
              }`}
            >
              {today.set({ day: d }).toFormat('d')}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Messages and notifications in one card. */
export function InboxCard({ unread }: { unread?: number }) {
  const { t } = useT();
  const rows = [
    { to: '/dashboard/messages', icon: MessageCircle, title: t('Messages', 'الرسائل'), text: t('Students and the team', 'الطلاب والفريق'), tone: 'bg-teal/10 text-teal' },
    { to: '/dashboard/notifications', icon: Bell, title: t('Notifications', 'الإشعارات'), text: t('Lessons booked, moved or cancelled', 'حصص اتحجزت أو اتنقلت أو اتلغت'), tone: 'bg-[#E5A93C]/15 text-[#8B4935] dark:text-[#E5A93C]', count: unread },
  ];
  return (
    <div className={`${DASH_CARD} p-2`}>
      <h2 className="px-3 pt-3 pb-1 font-display font-semibold text-foreground">{t('Inbox', 'الوارد')}</h2>
      <ul>
        {rows.map((r) => (
          <li key={r.to}>
            <Link to={r.to} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-subtle transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.tone}`}><r.icon className="w-4.5 h-4.5" aria-hidden="true" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-foreground">{r.title}</span>
                <span className="block text-xs text-muted-foreground truncate">{r.text}</span>
              </span>
              {r.count ? <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-crimson text-white text-[11px] font-bold flex items-center justify-center">{r.count}</span> : null}
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
