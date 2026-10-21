import React, { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, CalendarPlus, Link2, Video } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { buildIcs } from '../../lib/ics';
import { useActiveLearner } from '../activeLearner';
import { joinState } from '../components/LessonDayCard';
import { ErrorState } from '../../components/ErrorState';
import { BrandLoader } from '../../components/ui/BrandLoader';

interface Lesson {
  id: string;
  studentId: string;
  learnerName: string | null;
  serviceTitle: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  durationMinutes: number;
  status: string;
  zoomMeetingLink: string | null;
}

/** One colour per child, in the brand palette, stable by the family's learner order. */
export const LEARNER_COLORS = ['#087D91', '#C51F24', '#8B4935', '#B9782A', '#5B7A68', '#6D4C8B'];
export function colorFor(learnerIds: string[], id: string): string {
  const i = learnerIds.indexOf(id);
  return LEARNER_COLORS[(i < 0 ? 0 : i) % LEARNER_COLORS.length];
}

/** Lessons grouped by day (yyyy-MM-dd) in the viewer's time zone. */
export function groupByDay(lessons: Array<{ scheduledStart: string }>, zone: string): Map<string, any[]> {
  const out = new Map<string, any[]>();
  for (const l of [...lessons].sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))) {
    const key = DateTime.fromISO(l.scheduledStart).setZone(zone).toISODate()!;
    out.set(key, [...(out.get(key) || []), l]);
  }
  return out;
}

function downloadIcs(l: Lesson) {
  const end = l.scheduledEnd || DateTime.fromISO(l.scheduledStart).plus({ minutes: l.durationMinutes || 45 }).toISO()!;
  const ics = buildIcs([{
    uid: `${l.id}@watazawwado.academy`, startIso: l.scheduledStart, endIso: end,
    title: `${l.serviceTitle}${l.learnerName ? ` · ${l.learnerName.split(' ')[0]}` : ''} · Watazawwado`,
    description: 'Join from your Watazawwado lessons page.', url: `${window.location.origin}/student/lessons`
  }]);
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `watazawwado-lesson-${DateTime.fromISO(l.scheduledStart).toFormat('yyyy-MM-dd')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** PA-03: all the family's lessons in one week or month view, a colour per child, in the viewer's time zone. */
export default function StudentCalendarPage({ lang = 'ar' }: { lang?: 'en' | 'ar' }) {
  const isAr = lang === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { learners } = useActiveLearner();
  const learnerIds = useMemo(() => learners.map((l) => l.id), [learners]);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [anchor, setAnchor] = useState<DateTime>(() => DateTime.now().setZone(zone));
  const [now, setNow] = useState(() => new Date());

  const load = () => {
    setFailed(false);
    authedJson<Lesson[]>('/api/student/bookings')
      .then((rows) => setLessons((rows || []).filter((r) => ['confirmed', 'rescheduled', 'completed'].includes(r.status))))
      .catch(() => setFailed(true));
  };
  useEffect(load, []);
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(id); }, []);

  const loc = isAr ? 'ar' : 'en';
  const start = view === 'week' ? anchor.startOf('week') : anchor.startOf('month').startOf('week');
  const end = view === 'week' ? anchor.endOf('week') : anchor.endOf('month').endOf('week');
  const days: DateTime[] = [];
  for (let d = start; d <= end; d = d.plus({ days: 1 })) days.push(d);
  const byDay = groupByDay(lessons || [], zone);
  const today = DateTime.now().setZone(zone).toISODate();
  const title = view === 'week'
    ? `${start.setLocale(loc).toFormat('d LLL')} – ${end.setLocale(loc).toFormat('d LLL yyyy')}`
    : anchor.setLocale(loc).toFormat('LLLL yyyy');

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold text-foreground">{t('Family calendar', 'تقويم العيلة')}</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border p-1" role="group" aria-label={t('View', 'العرض')}>
            {(['week', 'month'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                className={`min-h-9 px-3 rounded-lg text-sm font-semibold cursor-pointer ${view === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                {v === 'week' ? t('Week', 'أسبوع') : t('Month', 'شهر')}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAnchor(anchor.minus(view === 'week' ? { weeks: 1 } : { months: 1 }))} aria-label={t('Previous', 'السابق')} className="w-11 h-11 grid place-items-center rounded-xl border border-border hover:bg-surface-subtle focus-ring cursor-pointer">
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setAnchor(DateTime.now().setZone(zone))} className="min-h-11 px-3 rounded-xl border border-border text-sm font-semibold hover:bg-surface-subtle focus-ring cursor-pointer">{t('Today', 'النهارده')}</button>
          <button type="button" onClick={() => setAnchor(anchor.plus(view === 'week' ? { weeks: 1 } : { months: 1 }))} aria-label={t('Next', 'التالي')} className="w-11 h-11 grid place-items-center rounded-xl border border-border hover:bg-surface-subtle focus-ring cursor-pointer">
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{t(`Times in your time zone (${zone})`, `المواعيد بتوقيتك (${zone})`)}</p>
      </div>

      {learners.length > 1 && (
        <ul className="flex flex-wrap gap-3" aria-label={t('Colours', 'الألوان')}>
          {learners.map((l) => (
            <li key={l.id} className="flex items-center gap-1.5 text-xs text-foreground">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorFor(learnerIds, l.id) }} aria-hidden="true" />{l.name}
            </li>
          ))}
        </ul>
      )}

      {failed ? <ErrorState isAr={isAr} onRetry={load} /> : !lessons ? (
        <div className="py-12 flex justify-center"><BrandLoader size="md" /></div>
      ) : view === 'week' ? (
        <ol className="grid gap-2 md:grid-cols-7">
          {days.map((d) => {
            const key = d.toISODate()!;
            const items: Lesson[] = byDay.get(key) || [];
            return (
              <li key={key} className={`rounded-2xl border p-2.5 min-h-[7rem] ${key === today ? 'border-[var(--teal)] bg-[var(--teal)]/5' : 'border-border'}`}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{d.setLocale(loc).toFormat('ccc d')}</p>
                <ul className="space-y-2">
                  {items.map((l) => {
                    const state = joinState(l.scheduledStart, l.scheduledEnd, now);
                    const time = DateTime.fromISO(l.scheduledStart).setZone(zone).setLocale(loc).toFormat('h:mm a');
                    return (
                      <li key={l.id} className="rounded-xl p-2 text-xs bg-surface border-s-4" style={{ borderInlineStartColor: colorFor(learnerIds, l.studentId) }}>
                        <p className="font-semibold text-foreground">{time}</p>
                        <p className="text-muted-foreground truncate">{l.serviceTitle}{l.learnerName ? ` · ${l.learnerName.split(' ')[0]}` : ''}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {l.status !== 'completed' && state === 'open' && l.zoomMeetingLink && (
                            <a href={l.zoomMeetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 min-h-9 px-2.5 rounded-lg btn-primary-material text-primary-foreground font-semibold">
                              <Video className="w-3.5 h-3.5" aria-hidden="true" />{t('Join', 'ادخل')}
                            </a>
                          )}
                          {l.status !== 'completed' && state !== 'ended' && (
                            <button type="button" onClick={() => downloadIcs(l)} className="tap-44 relative inline-flex items-center gap-1 min-h-9 px-2 rounded-lg border border-border text-foreground hover:bg-surface-subtle cursor-pointer" aria-label={t('Add to my calendar', 'ضيفها لتقويمي')}>
                              <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      ) : (
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground mb-1" aria-hidden="true">
            {days.slice(0, 7).map((d) => <span key={d.toISODate()}>{d.setLocale(loc).toFormat('ccc')}</span>)}
          </div>
          <ol className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = d.toISODate()!;
              const items: Lesson[] = byDay.get(key) || [];
              const inMonth = d.month === anchor.month;
              return (
                <li key={key}>
                  <button type="button" onClick={() => { setAnchor(d); setView('week'); }}
                    aria-label={`${d.setLocale(loc).toFormat('d LLLL')}: ${items.length} ${t('lessons', 'حصص')}`}
                    className={`w-full min-h-14 rounded-xl border p-1 text-start cursor-pointer focus-ring ${key === today ? 'border-[var(--teal)]' : 'border-border'} ${inMonth ? '' : 'opacity-40'}`}>
                    <span className="block text-xs font-semibold text-foreground">{d.day}</span>
                    <span className="flex flex-wrap gap-0.5 mt-1">
                      {items.slice(0, 4).map((l) => <span key={l.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: colorFor(learnerIds, l.studentId) }} />)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <CalendarFeed isAr={isAr} />
    </div>
  );
}

/** The family's secret subscription link: shown once, can be turned off or replaced. */
function CalendarFeed({ isAr }: { isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [active, setActive] = useState<boolean | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    authedJson<{ active: boolean }>('/api/student/calendar-feed').then((d) => setActive(d.active)).catch(() => setActive(false));
  }, []);

  const create = async () => {
    setBusy(true); setFailed(false); setCopied(false);
    try {
      const d = await authedJson<{ url: string }>('/api/student/calendar-feed', { method: 'POST' });
      setUrl(d.url); setActive(true);
    } catch { setFailed(true); } finally { setBusy(false); }
  };
  const turnOff = async () => {
    setBusy(true); setFailed(false);
    try {
      await authedJson('/api/student/calendar-feed', { method: 'DELETE' });
      setUrl(null); setActive(false);
    } catch { setFailed(true); } finally { setBusy(false); }
  };

  return (
    <section className="rounded-2xl border border-border p-4 space-y-3" aria-labelledby="calendar-feed-title">
      <h2 id="calendar-feed-title" className="flex items-center gap-2 text-sm font-semibold text-foreground"><Link2 className="w-4 h-4 text-[var(--teal)]" aria-hidden="true" />{t('Subscribe in your calendar app', 'اشترك من تطبيق التقويم بتاعك')}</h2>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('A private link that keeps Google, Apple or Outlook calendar up to date with all the family’s lessons. It shows times, subjects and first names, never lesson links. Keep it to yourself; you can turn it off anytime.',
           'لينك خاص بيخلّي تقويم Google أو Apple أو Outlook محدّث بكل حصص العيلة. بيظهر المواعيد والمادة والاسم الأول بس، من غير لينكات الحصص. خلّيه معاك بس، وتقدر تقفله في أي وقت.')}
      </p>
      {url && (
        <div className="flex flex-wrap items-center gap-2">
          <input readOnly value={url} aria-label={t('Your calendar link', 'لينك التقويم بتاعك')} className="flex-1 min-w-0 h-11 px-3 rounded-xl border border-border bg-surface text-xs" dir="ltr" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={() => { navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {}); }} className="min-h-11 px-3 rounded-xl border border-border text-sm font-semibold hover:bg-surface-subtle cursor-pointer">
            {copied ? t('Copied', 'اتنسخ') : t('Copy', 'انسخ')}
          </button>
        </div>
      )}
      {url && <p className="text-xs text-muted-foreground">{t('This link is shown only now. If you lose it, make a new one (the old one stops working).', 'اللينك ده بيظهر دلوقتي بس. لو ضاع منك اعمل واحد جديد (القديم هيبطل يشتغل).')}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={create} disabled={busy || active === null} className="min-h-11 px-4 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold cursor-pointer disabled:opacity-60">
          {active ? t('Make a new link', 'اعمل لينك جديد') : t('Get my calendar link', 'هات لينك التقويم')}
        </button>
        {active && (
          <button type="button" onClick={turnOff} disabled={busy} className="min-h-11 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-surface-subtle cursor-pointer disabled:opacity-60">
            {t('Turn the link off', 'اقفل اللينك')}
          </button>
        )}
      </div>
      {failed && <p role="alert" className="text-xs text-destructive">{t('That did not work. Please try again.', 'محصلش. جرّب تاني.')}</p>}
    </section>
  );
}
