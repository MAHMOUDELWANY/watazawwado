import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { Copy } from 'lucide-react';
import { CELLS_PER_DAY, CELL_MINUTES, copyDay, dayCells, previewInZone, setDay, type Interval } from '../lib/weeklyHours';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

type Days = Array<{ en: string; ar: string }>;

const STUDENT_ZONES = [
  { id: 'Europe/London', en: 'London', ar: 'لندن' },
  { id: 'America/New_York', en: 'New York', ar: 'نيويورك' },
  { id: 'America/Chicago', en: 'Chicago', ar: 'شيكاغو' },
  { id: 'America/Los_Angeles', en: 'Los Angeles', ar: 'لوس أنجلوس' },
  { id: 'America/Toronto', en: 'Toronto', ar: 'تورونتو' },
  { id: 'Europe/Berlin', en: 'Berlin', ar: 'برلين' },
  { id: 'Australia/Sydney', en: 'Sydney', ar: 'سيدني' }
];

const cellLabel = (c: number) => {
  const m = c * CELL_MINUTES;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/**
 * TE-03: paint weekly hours on a grid (mouse or pen: press and drag; touch: tap a cell, swipe scrolls), copy a day to
 * other days, and see how the hours look to a student abroad. Writes the same intervals as the list editor below it.
 */
export function WeekHoursGrid({ intervals, setIntervals, days, isAr, timezone }: {
  intervals: Interval[];
  setIntervals: React.Dispatch<React.SetStateAction<Interval[]>>;
  days: Days;
  isAr: boolean;
  timezone: string;
}) {
  const grid = useMemo(() => days.map((_, d) => dayCells(intervals, d)), [intervals, days]);
  const paint = useRef<boolean | null>(null);
  const lastPointer = useRef<string>('');
  const [copyFrom, setCopyFrom] = useState(1);
  const [copyTo, setCopyTo] = useState<number[]>([]);
  const [zone, setZone] = useState(STUDENT_ZONES[0].id);

  useEffect(() => {
    const stop = () => { paint.current = null; };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => { window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
  }, []);

  const apply = (d: number, c: number, value: boolean) =>
    setIntervals((prev) => {
      const cells = dayCells(prev, d);
      if (cells[c] === value) return prev;
      cells[c] = value;
      return setDay(prev, d, cells);
    });

  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const d = el?.dataset?.day, c = el?.dataset?.cell;
    return d != null && c != null ? { d: Number(d), c: Number(c) } : null;
  };

  const onPointerDown = (e: React.PointerEvent, d: number, c: number) => {
    lastPointer.current = e.pointerType;
    if (e.pointerType === 'touch') return; // a tap toggles via onClick; a swipe scrolls the page
    e.preventDefault();
    paint.current = !grid[d][c];
    apply(d, c, paint.current);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (paint.current == null || e.pointerType === 'touch') return;
    const hit = cellAt(e.clientX, e.clientY);
    if (hit) apply(hit.d, hit.c, paint.current);
  };
  const onClick = (e: React.MouseEvent, d: number, c: number) => {
    // Mouse presses were handled on pointer down; keyboard (detail 0) and touch taps toggle here.
    if (e.detail !== 0 && lastPointer.current !== 'touch') return;
    apply(d, c, !grid[d][c]);
  };

  const dayName = (d: number) => (isAr ? days[d].ar : days[d].en);
  const preview = intervals
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
    .map((iv) => ({ iv, p: previewInZone(iv, timezone, zone) }))
    .filter(({ p }) => p.start.isValid);
  const zoneName = STUDENT_ZONES.find((z) => z.id === zone)!;
  const fmt = (t: DateTime) => t.setLocale(isAr ? 'ar' : 'en').toFormat('h:mm a');

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 rounded-xl border border-border space-y-3">
        <p className="text-sm text-muted-foreground">
          {isAr
            ? 'اضغط واسحب بالماوس عشان تلوّن الساعات اللي بتدرّس فيها (كل خانة نص ساعة). على الموبايل: المس الخانة.'
            : 'Press and drag with the mouse to paint the hours you teach (each cell is half an hour). On a phone, tap a cell.'}
        </p>
        <div className="overflow-x-auto">
          <div
            className="grid gap-px min-w-[520px] select-none"
            style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }}
            onPointerMove={onPointerMove}
            role="group"
            aria-label={isAr ? 'جدول الساعات الأسبوعي' : 'Weekly hours grid'}
          >
            <div />
            {days.map((_, d) => (
              <div key={d} className="text-xs font-semibold text-center text-foreground pb-1 truncate">{dayName(d)}</div>
            ))}
            {Array.from({ length: CELLS_PER_DAY }, (_, c) => (
              <React.Fragment key={c}>
                <div className="text-[10px] leading-none text-muted-foreground text-end pe-1 -mt-1" aria-hidden="true">
                  {c % 2 === 0 ? cellLabel(c) : ''}
                </div>
                {days.map((_, d) => (
                  <button
                    key={d}
                    type="button"
                    data-day={d}
                    data-cell={c}
                    aria-pressed={grid[d][c]}
                    aria-label={`${dayName(d)} ${cellLabel(c)}–${cellLabel(c + 1) === '24:00' ? '00:00' : cellLabel(c + 1)}`}
                    onPointerDown={(e) => onPointerDown(e, d, c)}
                    onClick={(e) => onClick(e, d, c)}
                    className={`h-3.5 ${c % 2 === 0 ? 'rounded-t-sm' : 'rounded-b-sm'} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${grid[d][c] ? 'bg-primary' : 'bg-surface-subtle hover:bg-primary/25'}`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl border border-border flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted-foreground flex flex-col gap-1">
          {isAr ? 'انسخ مواعيد يوم' : 'Copy the hours of'}
          <Select value={String(copyFrom)} onChange={(e) => setCopyFrom(Number(e.target.value))} className="h-10">
            {days.map((_, d) => <option key={d} value={d}>{dayName(d)}</option>)}
          </Select>
        </label>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="text-sm text-muted-foreground mb-1">{isAr ? 'على أيام' : 'onto'}</legend>
          {days.map((_, d) => d !== copyFrom && (
            <label key={d} className="inline-flex items-center gap-1 text-sm min-h-11 px-2 rounded-lg border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={copyTo.includes(d)}
                onChange={(e) => setCopyTo((prev) => (e.target.checked ? [...prev, d] : prev.filter((x) => x !== d)))}
              />
              {dayName(d)}
            </label>
          ))}
        </fieldset>
        <Button
          size="sm"
          variant="outline"
          disabled={copyTo.filter((d) => d !== copyFrom).length === 0}
          onClick={() => { setIntervals((prev) => copyDay(prev, copyFrom, copyTo)); setCopyTo([]); }}
        >
          <Copy className="w-4 h-4 me-1" aria-hidden="true" />
          {isAr ? 'انسخ (بيستبدل مواعيد الأيام دي)' : 'Copy (replaces those days)'}
        </Button>
      </div>

      <div className="glass-card p-4 rounded-xl border border-border space-y-2" aria-live="polite">
        <label className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-2">
          {isAr ? 'طالب في' : 'A student in'}
          <Select value={zone} onChange={(e) => setZone(e.target.value)} className="h-10 w-auto">
            {STUDENT_ZONES.map((z) => <option key={z.id} value={z.id}>{isAr ? z.ar : z.en}</option>)}
          </Select>
          {isAr ? 'بيشوف مواعيدك كده (الأسبوع الجاي):' : 'sees your hours like this (coming week):'}
        </label>
        {preview.length === 0 ? (
          <p className="text-sm text-muted-foreground">{isAr ? 'لسه مفيش ساعات.' : 'No hours yet.'}</p>
        ) : (
          <ul className="text-sm space-y-1">
            {preview.map(({ iv, p }, i) => (
              <li key={i} className="flex flex-wrap gap-x-2">
                <span className="text-muted-foreground">{dayName(iv.weekday)} {iv.start_time}–{iv.end_time}</span>
                <span aria-hidden="true">→</span>
                <span className="text-foreground font-medium">
                  {isAr ? zoneName.ar : zoneName.en}: {dayName(p.weekday)} {fmt(p.start)}–{fmt(p.end)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
