import { DateTime } from 'luxon';

/**
 * TE-03: helpers for the weekly hours grid. Same data shape as before ({ weekday 0=Sunday, start_time, end_time } in
 * the teacher's zone); the grid is 30-minute cells, and the server keeps validating every interval.
 */
export interface Interval { weekday: number; start_time: string; end_time: string }

export const CELL_MINUTES = 30;
export const CELLS_PER_DAY = (24 * 60) / CELL_MINUTES;
// The server accepts at most 23:59 as an end time.
const DAY_END = '23:59';

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHhmm = (minutes: number) =>
  minutes >= 24 * 60 ? DAY_END : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** A cell is on when any interval of that day overlaps it. */
export function dayCells(intervals: Interval[], weekday: number): boolean[] {
  const cells = Array<boolean>(CELLS_PER_DAY).fill(false);
  for (const iv of intervals) {
    if (iv.weekday !== weekday) continue;
    const start = toMinutes(iv.start_time);
    const end = iv.end_time === DAY_END ? 24 * 60 : toMinutes(iv.end_time);
    for (let c = 0; c < CELLS_PER_DAY; c++) {
      const cs = c * CELL_MINUTES;
      if (cs < end && cs + CELL_MINUTES > start) cells[c] = true;
    }
  }
  return cells;
}

/** Joined runs of on-cells become intervals. */
export function cellsToIntervals(weekday: number, cells: boolean[]): Interval[] {
  const out: Interval[] = [];
  let runStart = -1;
  for (let c = 0; c <= cells.length; c++) {
    if (c < cells.length && cells[c]) {
      if (runStart < 0) runStart = c;
    } else if (runStart >= 0) {
      out.push({ weekday, start_time: toHhmm(runStart * CELL_MINUTES), end_time: toHhmm(c * CELL_MINUTES) });
      runStart = -1;
    }
  }
  return out;
}

/** Replace one day with the given cells, leaving the other days exactly as they were. */
export function setDay(intervals: Interval[], weekday: number, cells: boolean[]): Interval[] {
  return [...intervals.filter((iv) => iv.weekday !== weekday), ...cellsToIntervals(weekday, cells)];
}

/** Copy one day's intervals onto other days (their old hours are replaced). */
export function copyDay(intervals: Interval[], from: number, to: number[]): Interval[] {
  const source = intervals.filter((iv) => iv.weekday === from);
  const targets = new Set(to.filter((d) => d !== from));
  return [
    ...intervals.filter((iv) => !targets.has(iv.weekday)),
    ...[...targets].flatMap((d) => source.map((iv) => ({ ...iv, weekday: d })))
  ];
}

/**
 * How one interval looks to a student in another zone, on its next occurrence (so daylight saving is right for the
 * coming week). Returns the student's weekday (0=Sunday) and times.
 */
export function previewInZone(iv: Interval, teacherZone: string, studentZone: string, now: DateTime = DateTime.now()) {
  const base = now.setZone(teacherZone).startOf('day');
  const daysAhead = (iv.weekday - (base.weekday % 7) + 7) % 7;
  const day = base.plus({ days: daysAhead });
  const [sh, sm] = iv.start_time.split(':').map(Number);
  const [eh, em] = iv.end_time.split(':').map(Number);
  const start = day.set({ hour: sh, minute: sm }).setZone(studentZone);
  const end = day.set({ hour: eh, minute: em }).setZone(studentZone);
  return { weekday: start.weekday % 7, start, end };
}
