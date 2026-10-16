/**
 * Curriculum teacher reports and the student's map (docs/curriculum/PLAN.md §4.1).
 * Pure helpers: validation against the lesson catalog, and coverage merging for the puzzle.
 */
import { SUBJECTS, findLesson } from '../../src/curriculum/catalog.js';

export interface ReportInput {
  studentId: string;
  subject: string;
  lessonNumber: number;
  fromPage: number;
  toPage: number;
  strengths: string[];
  toReinforce: string[];
  note: string | null;
  gameResult: Record<string, { correct: number; total: number }> | null;
}

export interface ReportRow {
  subject: string;
  lesson_number: number;
  from_page: number;
  to_page: number;
  strengths: string[];
  to_reinforce: string[];
  note: string | null;
  game_result: unknown;
  created_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates a teacher report against the real lesson. Evaluation items must be the lesson's own outcomes. */
export function validateReport(body: any): { ok: true; value: ReportInput } | { ok: false; error: string } {
  const studentId = String(body?.studentId || '');
  if (!UUID.test(studentId)) return { ok: false, error: 'Choose a student.' };
  const subject = String(body?.subject || '');
  const lessonNumber = Number(body?.lessonNumber);
  const lesson = findLesson(subject, lessonNumber);
  if (!lesson) return { ok: false, error: 'Unknown lesson.' };
  const fromPage = Number(body?.fromPage);
  const toPage = Number(body?.toPage);
  const pages = lesson.pages.length;
  if (!Number.isInteger(fromPage) || !Number.isInteger(toPage) || fromPage < 1 || toPage < fromPage || toPage > pages) {
    return { ok: false, error: `Pages must be between 1 and ${pages}, from ≤ to.` };
  }
  const pick = (v: any) => (Array.isArray(v) ? [...new Set(v.map(String))].filter((o) => lesson.outcomes.includes(o)) : []);
  const strengths = pick(body?.strengths);
  const toReinforce = pick(body?.toReinforce).filter((o) => !strengths.includes(o));
  const note = typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  return { ok: true, value: { studentId, subject, lessonNumber, fromPage, toPage, strengths, toReinforce, note, gameResult: cleanGameResult(body?.gameResult) } };
}

function cleanGameResult(raw: any): ReportInput['gameResult'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: NonNullable<ReportInput['gameResult']> = {};
  for (const [bin, v] of Object.entries(raw).slice(0, 10)) {
    const correct = Number((v as any)?.correct);
    const total = Number((v as any)?.total);
    if (!/^[a-z0-9-]{1,30}$/.test(bin) || !Number.isInteger(correct) || !Number.isInteger(total) || correct < 0 || total < 1 || total > 50 || correct > total) continue;
    out[bin] = { correct, total };
  }
  return Object.keys(out).length ? out : null;
}

export interface LessonProgress {
  number: number;
  title: string;
  totalPages: number;
  /** Covered page numbers (1-based), sorted. */
  coveredPages: number[];
  complete: boolean;
  /** Only reviewed lessons are opened to students (PLAN §3.4). */
  available: boolean;
  /** Latest teacher evaluation for this lesson. */
  strengths: string[];
  toReinforce: string[];
  lastNote: string | null;
  lastReportAt: string | null;
}

export interface SubjectProgress {
  id: string;
  title: string;
  titleAr: string;
  lessons: LessonProgress[];
  coveredLessons: number;
}

/** Builds the student's map: every planned lesson as a puzzle piece, filled by the pages the teacher reported. */
export function buildStudentMap(reports: ReportRow[]): SubjectProgress[] {
  const bySubject = new Map<string, ReportRow[]>();
  for (const r of reports) bySubject.set(r.subject, [...(bySubject.get(r.subject) || []), r]);

  return SUBJECTS.filter((s) => bySubject.has(s.id)).map((subject) => {
    const rows = bySubject.get(subject.id)!;
    const lessons = subject.plan.map((title, i): LessonProgress => {
      const number = i + 1;
      const lesson = subject.lessons[number];
      const mine = rows.filter((r) => r.lesson_number === number).sort((a, b) => a.created_at.localeCompare(b.created_at));
      const totalPages = lesson?.pages.length || 0;
      const covered = new Set<number>();
      for (const r of mine) for (let p = r.from_page; p <= Math.min(r.to_page, totalPages); p++) covered.add(p);
      const latest = mine[mine.length - 1];
      return {
        number,
        title,
        totalPages,
        coveredPages: [...covered].sort((a, b) => a - b),
        complete: totalPages > 0 && covered.size === totalPages,
        available: Boolean(lesson?.reviewed),
        strengths: latest?.strengths || [],
        toReinforce: latest?.to_reinforce || [],
        lastNote: latest?.note || null,
        lastReportAt: latest?.created_at || null,
      };
    });
    return { id: subject.id, title: subject.title, titleAr: subject.titleAr, lessons, coveredLessons: lessons.filter((l) => l.coveredPages.length > 0).length };
  });
}
