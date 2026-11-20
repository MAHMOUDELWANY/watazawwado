import { SURAHS } from '../../src/lib/surahs.js';

/**
 * Classroom 4.1-4.5, pure rules: who sees the Quran tab, what a mark is, when marks reach the learner, and how the
 * detector's agreement with the teachers is measured. The routes load rows and call these.
 */

export { QURAN_TAB_SUBJECTS, quranTabAllowed } from '../../src/lib/quran/subjects.js';

export const MARK_TYPES = ['wrong_word', 'missed', 'added', 'tajweed'] as const;
export type MarkType = typeof MARK_TYPES[number];
export const MAX_NOTE = 300;
export const MAX_WORD = 200;

/** "2:255" → [2, 255] when the surah exists and the ayah is inside it. */
export function parseVerseKey(v: unknown): [number, number] | null {
  const m = typeof v === 'string' ? /^(\d{1,3}):(\d{1,3})$/.exec(v) : null;
  if (!m) return null;
  const s = SURAHS.find((x) => x.n === Number(m[1]));
  const a = Number(m[2]);
  return s && a >= 1 && a <= s.ayat ? [s.n, a] : null;
}

export type MarkInput = { verse_key: string; word_position: number; type: MarkType; note: string | null };

export function parseMark(body: any): { ok: true; value: MarkInput } | { ok: false; error: string } {
  if (!parseVerseKey(body?.verseKey)) return { ok: false, error: 'Choose an ayah of the mushaf.' };
  const word = Number(body?.word);
  if (!Number.isInteger(word) || word < 1 || word > MAX_WORD) return { ok: false, error: 'Choose a word.' };
  if (!(MARK_TYPES as readonly string[]).includes(body?.type)) return { ok: false, error: 'Unknown mistake type.' };
  const raw = body?.note;
  if (raw != null && typeof raw !== 'string') return { ok: false, error: 'The note must be text.' };
  const note = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  if (note && note.length > MAX_NOTE) return { ok: false, error: `Keep the note under ${MAX_NOTE} characters.` };
  return { ok: true, value: { verse_key: body.verseKey, word_position: word, type: body.type, note } };
}

/** A lesson's marks reach the learner only once the teacher sent that lesson's report (like curriculum progress). */
export function releasedMarks<T extends { booking_id: string }>(marks: T[], reportSent: Set<string>): T[] {
  return marks.filter((m) => reportSent.has(m.booking_id));
}

/** Which of these bookings have a sent report: a lesson note with the family summary written (the report send). */
export async function reportSentBookings(client: any, bookingIds: string[]): Promise<Set<string>> {
  if (!bookingIds.length) return new Set();
  const { data: sessions, error } = await client.from('lesson_sessions').select('id, booking_id').in('booking_id', bookingIds);
  if (error) throw new Error(`lesson_sessions: ${error.message}`);
  const bookingOf = new Map<string, string>((sessions || []).map((s: any) => [s.id, s.booking_id]));
  if (!bookingOf.size) return new Set();
  const { data: notes, error: nErr } = await client.from('lesson_notes').select('session_id, family_summary').in('session_id', [...bookingOf.keys()]).not('family_summary', 'is', null);
  if (nErr) throw new Error(`lesson_notes: ${nErr.message}`);
  return new Set((notes || []).filter((n: any) => String(n.family_summary || '').trim()).map((n: any) => bookingOf.get(n.session_id)!));
}

// ---- 4.5 accuracy harness ----------------------------------------------------------------------------------------

/** Hints stay off until our teachers reviewed this many recordings with at least this agreement (spec §9). */
export const HINTS_MIN_RECORDINGS = 100;
export const HINTS_MIN_AGREEMENT = 0.9;
/** Detector flag kinds and the teacher mark types they stand for. Tajweed notes are not compared: the detector is word-level. */
export const WORD_MARK_TYPES: readonly string[] = ['wrong_word', 'missed', 'added'];
export const DETECTOR_KINDS = ['missing', 'changed', 'extra'] as const;
export type DetectorFlag = { key: string; kind: typeof DETECTOR_KINDS[number] };

export function parseFlags(raw: unknown, inside: (verseKey: string) => boolean): DetectorFlag[] | null {
  if (!Array.isArray(raw) || raw.length > 500) return null;
  const out: DetectorFlag[] = [];
  for (const f of raw) {
    const m = typeof f?.key === 'string' ? /^(\d{1,3}:\d{1,3}):(\d{1,3})$/.exec(f.key) : null;
    if (!m || !parseVerseKey(m[1]) || !inside(m[1]) || !(DETECTOR_KINDS as readonly string[]).includes(f.kind)) return null;
    out.push({ key: f.key, kind: f.kind });
  }
  return out;
}

/** Agreement on one recording: shared flagged words over all flagged words (1 when both found nothing). */
export function agreement(teacher: Iterable<string>, detector: Iterable<string>): number {
  const t = new Set(teacher), d = new Set(detector);
  const union = new Set([...t, ...d]);
  if (!union.size) return 1;
  let both = 0;
  for (const k of t) if (d.has(k)) both++;
  return both / union.size;
}

export type RunRow = { id: string; flags: DetectorFlag[]; teacher_marks: Array<{ key: string; type: string }> | null; reviewed_at: string | null; created_at: string; model: string };

export function accuracySummary(runs: RunRow[], hintsFlag: boolean) {
  const reviewed = runs.filter((r) => r.reviewed_at && Array.isArray(r.teacher_marks));
  const rows = reviewed.map((r) => ({
    id: r.id, model: r.model, reviewedAt: r.reviewed_at!,
    teacher: r.teacher_marks!.filter((m) => WORD_MARK_TYPES.includes(m.type)).length,
    detector: r.flags.length,
    agreement: agreement(r.teacher_marks!.filter((m) => WORD_MARK_TYPES.includes(m.type)).map((m) => m.key), r.flags.map((f) => f.key)),
  }));
  const mean = rows.length ? rows.reduce((s, r) => s + r.agreement, 0) / rows.length : 0;
  const ready = rows.length >= HINTS_MIN_RECORDINGS && mean >= HINTS_MIN_AGREEMENT;
  return { reviewed: rows.length, waiting: runs.length - rows.length, agreement: mean, ready, hintsOn: hintsFlag && ready, rows };
}

/** QURAN_TAJWEED_HINTS=on is the owner's switch; it does nothing until the bar above is met. Default off. */
export const hintsFlag = () => process.env.QURAN_TAJWEED_HINTS === 'on';
