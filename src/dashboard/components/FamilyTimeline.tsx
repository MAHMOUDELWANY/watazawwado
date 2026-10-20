import React, { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { History, Loader2 } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Badge } from '../../components/ui/Badge';

type TimelineType = 'account' | 'intake' | 'placement' | 'trial' | 'lesson' | 'payment' | 'package' | 'chat' | 'note' | 'message';
interface TimelineEvent {
  at: string;
  type: TimelineType;
  title: { en: string; ar: string };
  detail?: string | null;
  learnerName?: string | null;
  ref?: string | null;
}

const TYPE_LABELS: Record<TimelineType, [string, string]> = {
  account: ['Account', 'الحساب'],
  intake: ['AI guide', 'المرشد'],
  placement: ['Placement', 'المستوى'],
  trial: ['Trial', 'التجربة'],
  lesson: ['Lessons', 'الحصص'],
  payment: ['Payments', 'المدفوعات'],
  package: ['Packages', 'الباقات'],
  chat: ['Chat', 'المحادثات'],
  note: ['Notes', 'الملاحظات'],
  message: ['Messages', 'الرسائل']
};

/** CRM-01: everything that happened with this account and its children, newest first, filterable by type. Admin only. */
export function FamilyTimeline({ studentId }: { studentId: string }) {
  const { t, isAr } = useT();
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<TimelineType | 'all'>('all');

  useEffect(() => {
    let alive = true;
    setEvents(null);
    setFailed(false);
    dashboardFetch(`/api/dashboard/admin/students/${studentId}/timeline`)
      .then((d: any) => { if (alive) setEvents(d.events || []); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [studentId]);

  const present = useMemo(() => [...new Set((events || []).map((e) => e.type))], [events]);
  const shown = (events || []).filter((e) => filter === 'all' || e.type === filter);
  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED);

  return (
    <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <History className="w-4 h-4 text-accent" />
        <span>{t('Family timeline', 'السجل الكامل للأسرة')}</span>
      </h2>

      {failed ? (
        <p className="text-sm text-muted-foreground">{t("Couldn't load the timeline. Please refresh.", 'تعذر تحميل السجل. حدّث الصفحة.')}</p>
      ) : !events ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('Loading…', 'جارٍ التحميل…')}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Nothing recorded yet.', 'مفيش حاجة متسجلة لسه.')}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Filter by type', 'فلترة حسب النوع')}>
            {(['all', ...TIMELINE_ORDER.filter((k) => present.includes(k))] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer ${filter === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                {k === 'all' ? t('All', 'الكل') : isAr ? TYPE_LABELS[k][1] : TYPE_LABELS[k][0]}
              </button>
            ))}
          </div>

          <ol className="relative border-s border-border-subtle ms-2 space-y-4">
            {shown.map((e, i) => (
              <li key={`${e.at}-${i}`} className="ms-4">
                <span className="absolute -start-1.5 mt-1.5 w-3 h-3 rounded-full bg-accent/70 border border-background" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{isAr ? e.title.ar : e.title.en}</span>
                  {e.learnerName && <Badge variant="outline">{e.learnerName}</Badge>}
                  {e.ref && <bdi className="text-xs font-mono text-muted-foreground">{e.ref}</bdi>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fmt(e.at)}
                  {e.detail ? <> · <bdi>{e.detail}</bdi></> : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

const TIMELINE_ORDER: TimelineType[] = ['account', 'intake', 'placement', 'trial', 'lesson', 'payment', 'package', 'chat', 'note', 'message'];
