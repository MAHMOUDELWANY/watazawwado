import { findLesson } from '../../src/curriculum/catalog.js';

/**
 * Classroom BUILD-LIST 3.3: the report draft that fills itself from the lesson timeline. Pure: the routes load the
 * rows and the stored files. A slide page counts as taught after TAUGHT_SECONDS on it, or when the teacher drew on
 * it (a saved slide state with `inked`). The teacher edits everything before sending.
 */
export const TAUGHT_SECONDS = 20;
/** A gap longer than this between two slide events is not counted (the teacher was on the board, a file, away). */
const MAX_SEGMENT_MS = 15 * 60_000;
export const ROOM_FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg)$/;

type Row = { type: string; actor_role?: string; payload: any; occurred_at: string };
export type DraftPage = { page: number; seconds: number; inked: boolean; taught: boolean };
export type DraftLesson = { track: string; number: number; title: string | null; seconds: number; pages: DraftPage[] };
export type ReportDraft = {
  curriculum: { track: string; number: number; fromPage: number; toPage: number } | null;
  lessons: DraftLesson[];
  files: Array<{ fileId: string; kind: 'pdf' | 'image'; shared: boolean }>;
  reactions: Record<string, number>;
  talk: Record<string, number> | null;
  earlyEnd: { minutesEarly: number; reason: string } | null;
};

export function buildReportDraft(input: { rows: Row[]; stopMs: number; fileIds: string[]; sharedIds: string[] }): ReportDraft {
  const rows = [...input.rows].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));
  const slides = rows.filter((r) => r.type === 'slide' && r.payload?.state && typeof r.payload.state.track === 'string');
  const pages = new Map<string, { track: string; number: number; page: number; ms: number; inked: boolean }>();
  const keyOf = (s: any) => `${s.track}|${s.number}|${s.page}`;
  const touch = (s: any) => {
    const k = keyOf(s);
    if (!pages.has(k)) pages.set(k, { track: s.track, number: Number(s.number), page: Number(s.page), ms: 0, inked: false });
    return pages.get(k)!;
  };
  slides.forEach((r, i) => {
    const s = r.payload.state;
    const p = touch(s);
    if (s.inked === true) p.inked = true;
    if (s.opening) return;
    const from = Date.parse(r.occurred_at);
    const to = i + 1 < slides.length ? Date.parse(slides[i + 1].occurred_at) : input.stopMs;
    p.ms += Math.max(0, Math.min(to - from, MAX_SEGMENT_MS));
  });

  const byLesson = new Map<string, DraftLesson>();
  for (const p of pages.values()) {
    const k = `${p.track}|${p.number}`;
    if (!byLesson.has(k)) byLesson.set(k, { track: p.track, number: p.number, title: findLesson(p.track, p.number)?.title ?? null, seconds: 0, pages: [] });
    const l = byLesson.get(k)!;
    const seconds = Math.round(p.ms / 1000);
    // Pages are 0-based in the room and 1-based in reports.
    l.pages.push({ page: p.page + 1, seconds, inked: p.inked, taught: p.inked || seconds >= TAUGHT_SECONDS });
    l.seconds += seconds;
  }
  const lessons = [...byLesson.values()].map((l) => ({ ...l, pages: l.pages.sort((a, b) => a.page - b.page) })).sort((a, b) => b.seconds - a.seconds);

  // The suggestion: the lesson taught longest, from its first to its last taught page (inside the lesson's pages).
  let curriculum: ReportDraft['curriculum'] = null;
  for (const l of lessons) {
    const taught = l.pages.filter((p) => p.taught).map((p) => p.page);
    const total = findLesson(l.track, l.number)?.pages.length ?? 0;
    if (!taught.length || !total) continue;
    curriculum = { track: l.track, number: l.number, fromPage: Math.max(1, Math.min(...taught)), toPage: Math.min(total, Math.max(...taught)) };
    break;
  }

  const reactions: Record<string, number> = {};
  for (const r of rows) if (r.type === 'reaction' && typeof r.payload?.kind === 'string') reactions[r.payload.kind] = (reactions[r.payload.kind] || 0) + 1;

  // Talk time (2.8): one `talk` row per teacher join, so a rejoin adds up; numbers only.
  const talk: Record<string, number> = {};
  for (const r of rows) {
    if (r.type !== 'talk' || !r.payload || typeof r.payload !== 'object') continue;
    for (const [k, v] of Object.entries(r.payload)) if (typeof v === 'number' && Number.isFinite(v) && v >= 0) talk[k] = (talk[k] || 0) + v;
  }

  const end = [...rows].reverse().find((r) => r.type === 'end' && r.payload?.early === true);
  const files = input.fileIds.filter((f) => ROOM_FILE_ID.test(f)).map((fileId) => ({ fileId, kind: fileId.endsWith('.pdf') ? 'pdf' as const : 'image' as const, shared: input.sharedIds.includes(fileId) }));

  return {
    curriculum,
    lessons,
    files,
    reactions,
    talk: talk && Object.keys(talk).length ? talk : null,
    earlyEnd: end ? { minutesEarly: Number(end.payload.minutesEarly) || 0, reason: String(end.payload.reason || '') } : null,
  };
}
