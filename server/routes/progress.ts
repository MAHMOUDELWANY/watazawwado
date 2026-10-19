/**
 * Learner progress data model & read-model routes (PR-01, PR-02):
 * - Shared lesson summaries (`lesson_notes.family_summary`, `lesson_notes.achievements`)
 *   while keeping `lesson_notes.private_notes` strictly teacher-only.
 * - Learner milestones (`learner_milestones`):
 *   - Student / guardian of that student can read.
 *   - Assigned teacher and super admin can read, insert, and update.
 *   - Nobody can delete except super admin.
 * - Learner progress read model (`GET /api/student/progress?learnerId=`):
 *   - Per-subject current level, level list (from `src/components/onboarding/subjects.ts`),
 *     lessons attended (total, this month), weekly rhythm (current, longest),
 *     milestones, last 5 family summaries, placement result, and next booked lesson.
 *   - Server-side guardian child ownership check; never includes `private_notes`,
 *     prices, or teacher-only fields.
 */
import type express from 'express';
import { DateTime } from 'luxon';
import type { LearnerMilestoneKind } from '../../src/types/database.js';
import {
  SUBJECT_FAMILIES,
  findSubject,
  levelsFor,
  type SubjectLevel,
} from '../../src/components/onboarding/subjects.js';

type Mw = (req: any, res: any, next: any) => any;

export interface ProgressDeps {
  getClient: () => any;
  rateLimit: Mw;
  verifyStudentAuth: Mw;
  verifyTeacherAuth: Mw;
  requireSuperAdmin: Mw;
  getLearners: (
    client: any,
    req: any
  ) => Promise<Array<{ id: string; name: string; learnerType: string; isPrimary: boolean }>>;
}

export const MILESTONE_KINDS: readonly LearnerMilestoneKind[] = [
  'surah_memorized',
  'juz_completed',
  'level_completed',
  'rule_mastered',
  'book_completed',
  'custom',
] as const;

/**
 * Explicit column list for family-facing lesson summaries.
 * NEVER include `private_notes` or `observations` here.
 */
export const FAMILY_SUMMARY_COLUMNS =
  'id, session_id, student_id, family_summary, achievements, next_steps, created_at, updated_at';

export const MILESTONE_COLUMNS =
  'id, student_id, subject, kind, title_ar, title_en, reached_at, created_by, lesson_session_id, created_at, updated_at';

/**
 * Explicit column list for student progress bookings query.
 * NEVER include `fee_amount_usd`, `payment_plan`, `sync_metadata`, or `notes`.
 */
export const PROGRESS_BOOKING_COLUMNS =
  'id, student_id, service_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, teacher_id, zoom_meeting_link, created_at';

/**
 * Explicit column list for student progress lesson sessions query.
 * NEVER include `teacher_observations`.
 */
export const PROGRESS_SESSION_COLUMNS =
  'id, booking_id, student_id, lesson_date, attendance, completion_status, covered_material, next_action, created_at';

/**
 * Explicit column list for student progress placement test query.
 */
export const PROGRESS_PLACEMENT_COLUMNS =
  'id, learner_student_id, service_id, stated_level, status, score, max_score, suggested_level, admin_reply, admin_level, submitted_at, reviewed_at, created_at';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBJECT_SLUG_RE = /^[a-z0-9-]{1,60}$/;

const FALLBACK_LEVELS: SubjectLevel[] = [
  {
    id: 'beginner',
    en: 'Foundations',
    ar: 'التأسيس',
    descEn: 'Building the essential foundations step by step.',
    descAr: 'بناء الأساسيات خطوة بخطوة.',
  },
  {
    id: 'intermediate',
    en: 'Intermediate',
    ar: 'المتوسط',
    descEn: 'Steady practice and deepening understanding.',
    descAr: 'ممارسة منتظمة وتعميق الفهم.',
  },
  {
    id: 'advanced',
    en: 'Advanced',
    ar: 'المتقدم',
    descEn: 'Firm mastery and confident application.',
    descAr: 'إتقان راسخ وتطبيق متمكن.',
  },
];

const SUBJECT_ALIAS_MAP: Record<string, string> = {
  'quran reading': 'quran-reading',
  'quran reading (noorani qaidah & fluency)': 'quran-reading',
  'quran-reading': 'quran-reading',
  tajweed: 'tajweed',
  'tajweed rules & applied articulation': 'tajweed',
  'quran memorization': 'quran-memorization',
  'quran memorization & revision': 'quran-memorization',
  'memorization & revision': 'quran-memorization',
  hifz: 'quran-memorization',
  'quran-memorization': 'quran-memorization',
  'quran-revision': 'quran-memorization',
  'zad essentials': 'zad-essentials',
  'the zad path': 'zad-essentials',
  'zad-essentials': 'zad-essentials',
  seerah: 'seerah',
  'fusha arabic': 'modern-standard-arabic',
  'modern standard arabic': 'modern-standard-arabic',
  'modern-standard-arabic': 'modern-standard-arabic',
  'egyptian arabic': 'egyptian-arabic',
  'egyptian-arabic': 'egyptian-arabic',
  english: 'english',
};

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

export function safeTimezone(tz: unknown): string {
  if (typeof tz === 'string' && tz.trim()) {
    const candidate = tz.trim();
    if (DateTime.now().setZone(candidate).isValid) {
      return candidate;
    }
  }
  return 'UTC';
}

export function normalizeSubjectSlug(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const cleaned = raw.trim().toLowerCase();
  if (SUBJECT_ALIAS_MAP[cleaned]) {
    return SUBJECT_ALIAS_MAP[cleaned];
  }
  if (findSubject(cleaned)) {
    return cleaned;
  }
  const slugified = cleaned.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (SUBJECT_ALIAS_MAP[slugified]) {
    return SUBJECT_ALIAS_MAP[slugified];
  }
  if (findSubject(slugified)) {
    return slugified;
  }
  return null;
}

export function resolveSubjectMeta(subjectSlug: string) {
  const found = findSubject(subjectSlug) || findSubject('quran-reading')!;
  const rawLevels = levelsFor(found.subject.id);
  const levels = rawLevels.length > 0 ? rawLevels : FALLBACK_LEVELS;
  return {
    id: found.subject.id,
    glyph: found.subject.glyph,
    en: found.subject.en,
    ar: found.subject.ar,
    spineEn: found.subject.spineEn,
    spineAr: found.subject.spineAr,
    familyKey: found.family.key,
    familyColor: found.family.color,
    familyEn: found.family.en,
    familyAr: found.family.ar,
    levels,
  };
}

/**
 * Aligns a raw proficiency level (`beginner`, `elementary`, `intermediate`, `advanced`)
 * to the subject's actual `levels` list from `src/components/onboarding/subjects.ts`.
 */
export function alignLevelToSubject(
  rawLevel: unknown,
  levels: SubjectLevel[]
): { currentLevel: SubjectLevel['id']; currentLevelIndex: number } {
  const list = levels.length > 0 ? levels : FALLBACK_LEVELS;
  const normalized =
    typeof rawLevel === 'string' ? (rawLevel.trim().toLowerCase() as SubjectLevel['id']) : 'beginner';

  const exactIdx = list.findIndex((l) => l.id === normalized);
  if (exactIdx !== -1) {
    return { currentLevel: list[exactIdx].id, currentLevelIndex: exactIdx };
  }

  const order: SubjectLevel['id'][] = ['beginner', 'elementary', 'intermediate', 'advanced'];
  const targetRank = order.indexOf(normalized);
  if (targetRank === -1) {
    return { currentLevel: list[0].id, currentLevelIndex: 0 };
  }

  let bestIdx = 0;
  for (let i = 0; i < list.length; i++) {
    const rank = order.indexOf(list[i].id);
    if (rank <= targetRank) {
      bestIdx = i;
    }
  }
  return { currentLevel: list[bestIdx].id, currentLevelIndex: bestIdx };
}

/**
 * Computes the weekly learning rhythm (consecutive ISO weeks with >= 1 attended lesson).
 * - Our rhythm is weekly, never daily.
 * - If the most recent attended week is either the current week or the immediately preceding
 *   week, `current` is the length of that active weekly run.
 * - If a full week was missed (`diffWeeks >= 2`), `current` resets to 0 while `longest` stays visible.
 */
export function computeWeeklyRhythm(
  attendedDatesIso: string[],
  timezone = 'UTC',
  nowIso?: string
): { current: number; longest: number } {
  const tz = safeTimezone(timezone);
  const nowDt = nowIso
    ? DateTime.fromISO(nowIso, { zone: tz })
    : DateTime.now().setZone(tz);
  const validNow = nowDt.isValid ? nowDt : DateTime.now().setZone('UTC');
  const currentWeekStart = validNow.startOf('week');

  const weekMap = new Map<string, DateTime>();
  for (const raw of attendedDatesIso) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const dt = DateTime.fromISO(raw, { zone: tz });
    if (!dt.isValid) continue;
    const ws = dt.startOf('week');
    const key = ws.toISODate();
    if (key && ws <= currentWeekStart) {
      weekMap.set(key, ws);
    }
  }

  if (weekMap.size === 0) {
    return { current: 0, longest: 0 };
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.toMillis() - b.toMillis());

  let longest = 1;
  let run = 1;
  for (let i = 1; i < weeks.length; i++) {
    const diffWeeks = Math.round(weeks[i].diff(weeks[i - 1], 'weeks').weeks);
    if (diffWeeks === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else if (diffWeeks > 1) {
      run = 1;
    }
  }

  const lastAttendedWeek = weeks[weeks.length - 1];
  const weeksSinceLast = Math.round(currentWeekStart.diff(lastAttendedWeek, 'weeks').weeks);
  const current = weeksSinceLast <= 1 ? run : 0;

  return { current, longest };
}

export function computeLessonsAttended(
  attendedDatesIso: string[],
  timezone = 'UTC',
  nowIso?: string
): { total: number; thisMonth: number } {
  const tz = safeTimezone(timezone);
  const nowDt = nowIso
    ? DateTime.fromISO(nowIso, { zone: tz })
    : DateTime.now().setZone(tz);
  const validNow = nowDt.isValid ? nowDt : DateTime.now().setZone('UTC');

  let total = 0;
  let thisMonth = 0;
  for (const raw of attendedDatesIso) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const dt = DateTime.fromISO(raw, { zone: tz });
    if (!dt.isValid) continue;
    total += 1;
    if (dt.year === validNow.year && dt.month === validNow.month) {
      thisMonth += 1;
    }
  }

  return { total, thisMonth };
}

/**
 * Strips any private teacher fields from a lesson_notes row before it can ever
 * be sent to a student or parent.
 */
export function sanitizeNoteForFamily(row: any) {
  return {
    id: row?.id ?? null,
    session_id: row?.session_id ?? null,
    student_id: row?.student_id ?? null,
    family_summary: typeof row?.family_summary === 'string' ? row.family_summary : null,
    achievements: row?.achievements ?? null,
    next_steps: typeof row?.next_steps === 'string' ? row.next_steps : null,
    created_at: row?.created_at ?? null,
    updated_at: row?.updated_at ?? null,
  };
}

/**
 * Sanitizes a placement test row for family progress read model.
 * Never includes raw question/answer arrays or internal staff fields.
 */
export function sanitizePlacementForProgress(row: any) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    serviceId: normalizeSubjectSlug(row.service_id) || row.service_id || null,
    status: row.status ?? null,
    statedLevel: row.stated_level ?? null,
    suggestedLevel: row.suggested_level ?? null,
    adminLevel: row.admin_level ?? null,
    adminReply: typeof row.admin_reply === 'string' ? row.admin_reply : null,
    score: typeof row.score === 'number' ? row.score : null,
    maxScore: typeof row.max_score === 'number' ? row.max_score : null,
    submittedAt: row.submitted_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
  };
}

/**
 * Sanitizes an upcoming booking for the progress read model.
 * Never includes prices (`fee_amount_usd`, `price_paid`), payment fields, or private notes.
 */
export function sanitizeNextBookingForProgress(row: any, teacherName?: string | null) {
  if (!row) return null;
  const slug = normalizeSubjectSlug(row.service_id) || 'quran-reading';
  const meta = resolveSubjectMeta(slug);
  const zoomUrl =
    typeof row.zoom_meeting_link === 'string' && row.zoom_meeting_link.trim().length > 0
      ? row.zoom_meeting_link.trim()
      : null;

  return {
    id: row.id ?? null,
    serviceId: meta.id,
    serviceTitle: meta.en,
    serviceArabicTitle: meta.ar,
    bookingType: row.booking_type || 'single',
    scheduledStart: row.scheduled_start ?? null,
    scheduledEnd: row.scheduled_end ?? null,
    durationMinutes: typeof row.duration_minutes === 'number' ? row.duration_minutes : null,
    studentTimezone: row.student_timezone ?? null,
    status: row.status ?? null,
    teacherName: teacherName || null,
    zoomMeetingLink: zoomUrl,
  };
}

export interface BuildProgressModelInput {
  learnerProfile: {
    id: string;
    name: string;
    learnerType: string;
    currentLevel: string | null;
    learningInterest: string | null;
    timezone: string | null;
    assignedTeacherId?: string | null;
    assignedTeacherName?: string | null;
  };
  bookings: any[];
  lessonSessions: any[];
  lessonNotes: any[];
  milestones: any[];
  placementTests: any[];
  teacherNamesById?: Map<string, string>;
  nowIso?: string;
}

/**
 * Builds the complete per-subject and overall progress read model for a learner.
 * Pure and deterministic so it can be unit-tested directly as well as via HTTP.
 */
export function buildLearnerProgressReadModel(input: BuildProgressModelInput) {
  const {
    learnerProfile,
    bookings = [],
    lessonSessions = [],
    lessonNotes = [],
    milestones = [],
    placementTests = [],
    teacherNamesById = new Map<string, string>(),
    nowIso,
  } = input;

  const tz = safeTimezone(learnerProfile.timezone);
  const nowDt = nowIso ? DateTime.fromISO(nowIso) : DateTime.now();
  const nowMillis = (nowDt.isValid ? nowDt : DateTime.now()).toMillis();

  const primarySubjectSlug =
    normalizeSubjectSlug(learnerProfile.learningInterest) || 'quran-reading';

  // Map bookings by ID for fast session -> subject resolution
  const bookingById = new Map<string, any>();
  for (const b of bookings) {
    if (b?.id) bookingById.set(b.id, b);
  }

  // Map sessions by ID for note -> subject resolution
  const sessionById = new Map<string, any>();
  for (const s of lessonSessions) {
    if (s?.id) sessionById.set(s.id, s);
  }

  // Discover all active subjects for this learner in a stable order
  const subjectSet = new Set<string>();
  if (learnerProfile.learningInterest) {
    const norm = normalizeSubjectSlug(learnerProfile.learningInterest);
    if (norm) subjectSet.add(norm);
  }
  for (const b of bookings) {
    if (b?.status === 'cancelled') continue;
    const norm = normalizeSubjectSlug(b?.service_id);
    if (norm) subjectSet.add(norm);
  }
  for (const m of milestones) {
    const norm = normalizeSubjectSlug(m?.subject);
    if (norm) subjectSet.add(norm);
  }
  for (const p of placementTests) {
    const norm = normalizeSubjectSlug(p?.service_id);
    if (norm) subjectSet.add(norm);
  }
  if (subjectSet.size === 0) {
    subjectSet.add(primarySubjectSlug);
  }

  // Deduplicate attended lessons across `bookings` (status === 'completed') and `lesson_sessions`
  // (`attendance === 'attended'` or `completion_status === 'completed'`).
  const attendedLessons: Array<{ id: string; subject: string; dateIso: string }> = [];
  const handledBookingIds = new Set<string>();

  for (const s of lessonSessions) {
    if (!s) continue;
    const isCancelledOrMissed = s.attendance === 'missed' || s.attendance === 'cancelled';
    if (s.booking_id) {
      handledBookingIds.add(s.booking_id);
    }
    if (isCancelledOrMissed) continue;

    const isAttended = s.attendance === 'attended' || s.completion_status === 'completed';
    if (!isAttended) continue;

    const linkedBooking = s.booking_id ? bookingById.get(s.booking_id) : null;
    const subject =
      normalizeSubjectSlug(linkedBooking?.service_id) || primarySubjectSlug;
    const dateIso = linkedBooking?.scheduled_start || s.lesson_date || s.created_at;
    if (dateIso) {
      attendedLessons.push({ id: `session:${s.id}`, subject, dateIso });
    }
  }

  for (const b of bookings) {
    if (!b || b.status !== 'completed') continue;
    if (handledBookingIds.has(b.id)) continue;
    const subject = normalizeSubjectSlug(b.service_id) || primarySubjectSlug;
    const dateIso = b.scheduled_start || b.created_at;
    if (dateIso) {
      attendedLessons.push({ id: `booking:${b.id}`, subject, dateIso });
    }
  }

  // Ensure any subject with attended lessons is in subjectSet
  for (const att of attendedLessons) {
    subjectSet.add(att.subject);
  }

  // Filter upcoming booked lessons (status in pending, confirmed, rescheduled and scheduled_start >= now)
  const upcomingBookings = bookings
    .filter((b) => {
      if (!b || !['pending', 'confirmed', 'rescheduled'].includes(b.status)) return false;
      if (!b.scheduled_start) return false;
      const ms = new Date(b.scheduled_start).getTime();
      return Number.isFinite(ms) && ms >= nowMillis;
    })
    .sort(
      (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    );

  // Prepare sanitized family summaries with resolved subject
  const familyNotesWithSubject = lessonNotes
    .filter((n) => n && (n.family_summary !== null || n.achievements !== null))
    .map((n) => {
      let noteSubject = primarySubjectSlug;
      if (n.session_id && sessionById.has(n.session_id)) {
        const sess = sessionById.get(n.session_id);
        const linkedBooking = sess?.booking_id ? bookingById.get(sess.booking_id) : null;
        const resolved = normalizeSubjectSlug(linkedBooking?.service_id);
        if (resolved) noteSubject = resolved;
      }
      return {
        subject: noteSubject,
        summary: sanitizeNoteForFamily(n),
      };
    });

  const orderedSubjects = Array.from(subjectSet);

  const subjectsProgress = orderedSubjects.map((subjectSlug) => {
    const meta = resolveSubjectMeta(subjectSlug);
    const subjectAttendedDates = attendedLessons
      .filter((a) => a.subject === subjectSlug)
      .map((a) => a.dateIso);

    const lessonsAttended = computeLessonsAttended(subjectAttendedDates, tz, nowIso);
    const weeklyRhythm = computeWeeklyRhythm(subjectAttendedDates, tz, nowIso);

    const subjectMilestones = milestones
      .filter((m) => (normalizeSubjectSlug(m?.subject) || m?.subject) === subjectSlug)
      .map((m) => ({
        id: m.id,
        student_id: m.student_id,
        subject: subjectSlug,
        kind: m.kind,
        title_ar: m.title_ar,
        title_en: m.title_en,
        reached_at: m.reached_at,
        lesson_session_id: m.lesson_session_id ?? null,
        created_at: m.created_at,
        updated_at: m.updated_at,
      }))
      .sort((a, b) => new Date(b.reached_at).getTime() - new Date(a.reached_at).getTime());

    // Last 5 family summaries for this subject (if learner only has 1 subject, all family summaries apply)
    const subjectSummaries = familyNotesWithSubject
      .filter((item) => orderedSubjects.length === 1 || item.subject === subjectSlug)
      .slice(0, 5)
      .map((item) => item.summary);

    // Latest completed/submitted/reviewed placement test for this subject
    const subjectPlacements = placementTests
      .filter(
        (p) =>
          (normalizeSubjectSlug(p?.service_id) || p?.service_id) === subjectSlug &&
          (p?.status === 'reviewed' || p?.status === 'submitted')
      )
      .sort(
        (a, b) =>
          new Date(b.reviewed_at || b.submitted_at || b.created_at || 0).getTime() -
          new Date(a.reviewed_at || a.submitted_at || a.created_at || 0).getTime()
      );
    const placementResult = sanitizePlacementForProgress(subjectPlacements[0] || null);

    // Determine effective currentLevel for this subject:
    // 1. Reviewed admin_level on placement test for this subject
    // 2. Learner's current_level (for primary subject or fallback)
    // 3. Suggested level from placement test
    // 4. 'beginner'
    const rawSubjectLevel =
      placementResult?.adminLevel ||
      (subjectSlug === primarySubjectSlug ? learnerProfile.currentLevel : null) ||
      placementResult?.suggestedLevel ||
      learnerProfile.currentLevel ||
      'beginner';

    const { currentLevel, currentLevelIndex } = alignLevelToSubject(rawSubjectLevel, meta.levels);

    const nextBookingRow =
      upcomingBookings.find(
        (b) => (normalizeSubjectSlug(b.service_id) || primarySubjectSlug) === subjectSlug
      ) || null;
    const nextBookingTeacher =
      (nextBookingRow?.teacher_id && teacherNamesById.get(nextBookingRow.teacher_id)) ||
      learnerProfile.assignedTeacherName ||
      null;
    const nextBookedLesson = sanitizeNextBookingForProgress(nextBookingRow, nextBookingTeacher);

    return {
      subject: meta.id,
      subjectMeta: {
        id: meta.id,
        glyph: meta.glyph,
        en: meta.en,
        ar: meta.ar,
        spineEn: meta.spineEn,
        spineAr: meta.spineAr,
        familyKey: meta.familyKey,
        familyColor: meta.familyColor,
        familyEn: meta.familyEn,
        familyAr: meta.familyAr,
      },
      currentLevel,
      currentLevelIndex,
      levels: meta.levels,
      lessonsAttended,
      weeklyRhythm,
      milestones: subjectMilestones,
      familySummaries: subjectSummaries,
      placementResult,
      nextBookedLesson,
    };
  });

  const allAttendedDates = attendedLessons.map((a) => a.dateIso);
  const overallLessonsAttended = computeLessonsAttended(allAttendedDates, tz, nowIso);
  const overallWeeklyRhythm = computeWeeklyRhythm(allAttendedDates, tz, nowIso);
  const overallNextBookingRow = upcomingBookings[0] || null;
  const overallNextTeacher =
    (overallNextBookingRow?.teacher_id && teacherNamesById.get(overallNextBookingRow.teacher_id)) ||
    learnerProfile.assignedTeacherName ||
    null;

  return {
    learner: {
      id: learnerProfile.id,
      name: learnerProfile.name,
      learnerType: learnerProfile.learnerType || 'adult',
      currentLevel: learnerProfile.currentLevel || 'beginner',
      learningInterest: primarySubjectSlug,
      timezone: tz,
      assignedTeacherName: learnerProfile.assignedTeacherName || null,
    },
    overall: {
      lessonsAttended: overallLessonsAttended,
      weeklyRhythm: overallWeeklyRhythm,
      milestonesCount: milestones.length,
      nextBookedLesson: sanitizeNextBookingForProgress(overallNextBookingRow, overallNextTeacher),
    },
    subjects: subjectsProgress,
  };
}

/**
 * Validates optional `family_summary` and `achievements` fields on `lesson_notes`.
 */
export function validateFamilyNoteFields(body: any):
  | {
      ok: true;
      value: {
        family_summary?: string | null;
        achievements?: any | null;
        session_id?: string | null;
      };
    }
  | { ok: false; error: string } {
  const out: {
    family_summary?: string | null;
    achievements?: any | null;
    session_id?: string | null;
  } = {};

  const rawSummary = body?.family_summary !== undefined ? body.family_summary : body?.familySummary;
  if (rawSummary !== undefined) {
    if (rawSummary === null || rawSummary === '') {
      out.family_summary = null;
    } else if (typeof rawSummary !== 'string') {
      return { ok: false, error: 'family_summary must be a string or null.' };
    } else {
      const trimmed = rawSummary.trim();
      if (trimmed.length > 4000) {
        return { ok: false, error: 'family_summary cannot exceed 4000 characters.' };
      }
      out.family_summary = trimmed || null;
    }
  }

  if (body?.achievements !== undefined) {
    const ach = body.achievements;
    if (ach === null) {
      out.achievements = null;
    } else if (Array.isArray(ach)) {
      if (ach.length > 50) {
        return { ok: false, error: 'achievements cannot contain more than 50 items.' };
      }
      out.achievements = ach;
    } else if (typeof ach === 'object') {
      out.achievements = ach;
    } else {
      return { ok: false, error: 'achievements must be a JSON array, object, or null.' };
    }
  }

  const rawSessionId = body?.session_id !== undefined ? body.session_id : body?.sessionId;
  if (rawSessionId !== undefined) {
    if (rawSessionId === null || rawSessionId === '') {
      out.session_id = null;
    } else if (!isUuid(rawSessionId)) {
      return { ok: false, error: 'session_id must be a valid UUID.' };
    } else {
      out.session_id = rawSessionId.trim();
    }
  }

  return { ok: true, value: out };
}

export interface ValidatedMilestoneInput {
  subject?: string;
  kind?: LearnerMilestoneKind;
  title_ar?: string;
  title_en?: string;
  reached_at?: string;
  lesson_session_id?: string | null;
}

export function validateMilestoneInput(
  body: any,
  opts: { partial?: boolean } = {}
): { ok: true; value: ValidatedMilestoneInput } | { ok: false; error: string } {
  const partial = opts.partial === true;
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Milestone payload is required.' };
  }

  const out: ValidatedMilestoneInput = {};

  if (!partial || body.subject !== undefined) {
    const subject = typeof body.subject === 'string' ? body.subject.trim().toLowerCase() : '';
    if (!SUBJECT_SLUG_RE.test(subject)) {
      return { ok: false, error: 'A valid subject slug is required.' };
    }
    out.subject = subject;
  }

  if (!partial || body.kind !== undefined) {
    const kind = body.kind;
    if (!MILESTONE_KINDS.includes(kind)) {
      return {
        ok: false,
        error: `Invalid milestone kind. Allowed kinds: ${MILESTONE_KINDS.join(', ')}.`,
      };
    }
    out.kind = kind;
  }

  const rawTitleAr = body.title_ar !== undefined ? body.title_ar : body.titleAr;
  if (!partial || rawTitleAr !== undefined) {
    const titleAr = typeof rawTitleAr === 'string' ? rawTitleAr.trim() : '';
    if (titleAr.length < 1 || titleAr.length > 300) {
      return { ok: false, error: 'Arabic milestone title (title_ar) is required (1–300 chars).' };
    }
    out.title_ar = titleAr;
  }

  const rawTitleEn = body.title_en !== undefined ? body.title_en : body.titleEn;
  if (!partial || rawTitleEn !== undefined) {
    const titleEn = typeof rawTitleEn === 'string' ? rawTitleEn.trim() : '';
    if (titleEn.length < 1 || titleEn.length > 300) {
      return { ok: false, error: 'English milestone title (title_en) is required (1–300 chars).' };
    }
    out.title_en = titleEn;
  }

  const rawReachedAt = body.reached_at !== undefined ? body.reached_at : body.reachedAt;
  if (rawReachedAt !== undefined && rawReachedAt !== null && rawReachedAt !== '') {
    const parsedDate = new Date(String(rawReachedAt));
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, error: 'reached_at must be a valid ISO timestamp.' };
    }
    out.reached_at = parsedDate.toISOString();
  }

  const rawSessionId =
    body.lesson_session_id !== undefined ? body.lesson_session_id : body.lessonSessionId;
  if (rawSessionId !== undefined) {
    if (rawSessionId === null || rawSessionId === '') {
      out.lesson_session_id = null;
    } else if (!isUuid(rawSessionId)) {
      return { ok: false, error: 'lesson_session_id must be a valid UUID.' };
    } else {
      out.lesson_session_id = rawSessionId.trim();
    }
  }

  if (partial && Object.keys(out).length === 0) {
    return { ok: false, error: 'At least one valid field is required to update a milestone.' };
  }

  return { ok: true, value: out };
}

/**
 * Checks whether a teacher/admin may read or write progress data (notes or milestones)
 * for a given student.
 * - super_admin: may access any existing student.
 * - teacher: may ONLY access students where `assigned_teacher_id === teacher.id`.
 */
export async function canTeacherAccessStudent(
  client: any,
  teacherUser: any,
  studentId: string
): Promise<{ allowed: boolean; exists: boolean }> {
  if (!client || !teacherUser || !isUuid(studentId)) {
    return { allowed: false, exists: false };
  }
  const { data: student, error } = await client
    .from('students')
    .select('id, assigned_teacher_id')
    .eq('id', studentId)
    .maybeSingle();

  if (error || !student) {
    return { allowed: false, exists: false };
  }

  if (teacherUser.role === 'super_admin') {
    return { allowed: true, exists: true };
  }

  const allowed =
    teacherUser.role === 'teacher' &&
    Boolean(teacherUser.id) &&
    student.assigned_teacher_id === teacherUser.id;
  return { allowed, exists: true };
}

/**
 * Checks whether a signed-in student or guardian may read milestones/summaries/progress
 * for the requested learner ID.
 */
export function canFamilyReadLearner(
  authorizedLearners: Array<{ id: string }>,
  requestedLearnerId: string
): boolean {
  if (!requestedLearnerId || typeof requestedLearnerId !== 'string') return false;
  const trimmed = requestedLearnerId.trim();
  if (!trimmed) return false;
  return authorizedLearners.some((l) => l.id === trimmed);
}

export function registerProgressRoutes(app: express.Express, deps: ProgressDeps) {
  const { getClient, rateLimit, verifyStudentAuth, verifyTeacherAuth, requireSuperAdmin, getLearners } =
    deps;

  // Teacher / Admin: list milestones for an assigned student
  app.get('/api/dashboard/students/:id/milestones', verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) {
        return res.status(503).json({ error: 'Database integration is not properly configured.' });
      }
      const studentId = String(req.params.id || '').trim();
      if (!isUuid(studentId)) {
        return res.status(400).json({ error: 'Valid student ID is required.' });
      }

      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) {
        return res.status(404).json({ error: 'Student record not found.' });
      }
      if (!access.allowed) {
        return res.status(403).json({
          error: 'Forbidden: You do not have authorization to view milestones for this student.',
        });
      }

      const { data, error } = await client
        .from('learner_milestones')
        .select(MILESTONE_COLUMNS)
        .eq('student_id', studentId)
        .order('reached_at', { ascending: false });

      if (error) {
        console.error('[GET /api/dashboard/students/:id/milestones]', error.message);
        return res.status(500).json({ error: 'Could not load milestones.' });
      }

      return res.json({ milestones: data || [] });
    } catch (err) {
      console.error('[GET /api/dashboard/students/:id/milestones]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Teacher / Admin: create a milestone for an assigned student
  app.post(
    '/api/dashboard/students/:id/milestones',
    verifyTeacherAuth,
    rateLimit,
    async (req: any, res: any) => {
      try {
        const client = getClient();
        if (!client) {
          return res.status(503).json({ error: 'Database integration is not properly configured.' });
        }
        const studentId = String(req.params.id || '').trim();
        if (!isUuid(studentId)) {
          return res.status(400).json({ error: 'Valid student ID is required.' });
        }

        const parsed = validateMilestoneInput(req.body);
        if (parsed.ok === false) {
          return res.status(400).json({ error: parsed.error });
        }

        const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
        if (!access.exists) {
          return res.status(404).json({ error: 'Student record not found.' });
        }
        if (!access.allowed) {
          return res.status(403).json({
            error: 'Forbidden: You can only record milestones for your own assigned students.',
          });
        }

        const insertPayload: Record<string, any> = {
          student_id: studentId,
          subject: parsed.value.subject,
          kind: parsed.value.kind,
          title_ar: parsed.value.title_ar,
          title_en: parsed.value.title_en,
          created_by: req.teacherUser?.id || null,
          lesson_session_id: parsed.value.lesson_session_id ?? null,
        };
        if (parsed.value.reached_at) {
          insertPayload.reached_at = parsed.value.reached_at;
        }

        const { data: milestone, error } = await client
          .from('learner_milestones')
          .insert(insertPayload)
          .select(MILESTONE_COLUMNS)
          .single();

        if (error || !milestone) {
          console.error('[POST /api/dashboard/students/:id/milestones]', error?.message);
          return res.status(500).json({ error: 'Could not save milestone.' });
        }

        return res.status(201).json({ success: true, milestone });
      } catch (err) {
        console.error('[POST /api/dashboard/students/:id/milestones]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // Teacher / Admin: update a milestone for an assigned student
  app.patch(
    '/api/dashboard/students/:id/milestones/:milestoneId',
    verifyTeacherAuth,
    rateLimit,
    async (req: any, res: any) => {
      try {
        const client = getClient();
        if (!client) {
          return res.status(503).json({ error: 'Database integration is not properly configured.' });
        }
        const studentId = String(req.params.id || '').trim();
        const milestoneId = String(req.params.milestoneId || '').trim();
        if (!isUuid(studentId) || !isUuid(milestoneId)) {
          return res.status(400).json({ error: 'Valid student ID and milestone ID are required.' });
        }

        const parsed = validateMilestoneInput(req.body, { partial: true });
        if (parsed.ok === false) {
          return res.status(400).json({ error: parsed.error });
        }

        const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
        if (!access.exists) {
          return res.status(404).json({ error: 'Student record not found.' });
        }
        if (!access.allowed) {
          return res.status(403).json({
            error: 'Forbidden: You can only update milestones for your own assigned students.',
          });
        }

        const { data: existing, error: findErr } = await client
          .from('learner_milestones')
          .select('id')
          .eq('id', milestoneId)
          .eq('student_id', studentId)
          .maybeSingle();

        if (findErr || !existing) {
          return res.status(404).json({ error: 'Milestone not found for this student.' });
        }

        const updates: Record<string, any> = {
          ...parsed.value,
          updated_at: new Date().toISOString(),
        };

        const { data: updated, error: updateErr } = await client
          .from('learner_milestones')
          .update(updates)
          .eq('id', milestoneId)
          .eq('student_id', studentId)
          .select(MILESTONE_COLUMNS)
          .single();

        if (updateErr || !updated) {
          console.error('[PATCH /api/dashboard/students/:id/milestones/:milestoneId]', updateErr?.message);
          return res.status(500).json({ error: 'Could not update milestone.' });
        }

        return res.json({ success: true, milestone: updated });
      } catch (err) {
        console.error('[PATCH /api/dashboard/students/:id/milestones/:milestoneId]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // Super Admin ONLY: delete a milestone ("nobody can delete except super admin")
  app.delete(
    '/api/dashboard/students/:id/milestones/:milestoneId',
    verifyTeacherAuth,
    requireSuperAdmin,
    rateLimit,
    async (req: any, res: any) => {
      try {
        const client = getClient();
        if (!client) {
          return res.status(503).json({ error: 'Database integration is not properly configured.' });
        }
        const studentId = String(req.params.id || '').trim();
        const milestoneId = String(req.params.milestoneId || '').trim();
        if (!isUuid(studentId) || !isUuid(milestoneId)) {
          return res.status(400).json({ error: 'Valid student ID and milestone ID are required.' });
        }

        const { data: existing, error: findErr } = await client
          .from('learner_milestones')
          .select('id')
          .eq('id', milestoneId)
          .eq('student_id', studentId)
          .maybeSingle();

        if (findErr || !existing) {
          return res.status(404).json({ error: 'Milestone not found for this student.' });
        }

        const { error: deleteErr } = await client
          .from('learner_milestones')
          .delete()
          .eq('id', milestoneId)
          .eq('student_id', studentId);

        if (deleteErr) {
          console.error('[DELETE /api/dashboard/students/:id/milestones/:milestoneId]', deleteErr.message);
          return res.status(500).json({ error: 'Could not delete milestone.' });
        }

        return res.json({ success: true });
      } catch (err) {
        console.error('[DELETE /api/dashboard/students/:id/milestones/:milestoneId]', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // Student / Guardian: read milestones and family lesson summaries for own learner(s)
  app.get('/api/student/milestones', verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) {
        return res.status(503).json({ error: 'Database integration is not properly configured.' });
      }

      const learners = await getLearners(client, req);
      const requestedLearnerId =
        typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';

      if (requestedLearnerId) {
        if (!canFamilyReadLearner(learners, requestedLearnerId)) {
          return res.status(403).json({
            error: 'Forbidden: You cannot read milestones or summaries for another family.',
          });
        }
      }

      const targetIds = requestedLearnerId
        ? [requestedLearnerId]
        : learners.map((l) => l.id).filter(Boolean);

      if (targetIds.length === 0) {
        return res.json({ milestones: [], summaries: [] });
      }

      const [{ data: milestones, error: mErr }, { data: notes, error: nErr }] = await Promise.all([
        client
          .from('learner_milestones')
          .select(MILESTONE_COLUMNS)
          .in('student_id', targetIds)
          .order('reached_at', { ascending: false })
          .limit(200),
        client
          .from('lesson_notes')
          .select(FAMILY_SUMMARY_COLUMNS)
          .in('student_id', targetIds)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (mErr || nErr) {
        console.error('[GET /api/student/milestones]', mErr?.message || nErr?.message);
        return res.status(500).json({ error: 'Could not load learner milestones.' });
      }

      const summaries = ((notes || []) as any[])
        .filter((n) => n.family_summary !== null || n.achievements !== null)
        .map(sanitizeNoteForFamily);

      return res.json({
        milestones: milestones || [],
        summaries,
      });
    } catch (err) {
      console.error('[GET /api/student/milestones]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // PR-02: Student / Guardian Progress Read Model (`GET /api/student/progress?learnerId=`)
  app.get('/api/student/progress', verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = getClient();
      const learners = await getLearners(client, req);
      const requestedLearnerId =
        typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';

      if (requestedLearnerId) {
        if (!canFamilyReadLearner(learners, requestedLearnerId)) {
          return res.status(403).json({
            error: 'Forbidden: You cannot view progress for a learner outside your family.',
          });
        }
      }

      if (learners.length === 0) {
        return res.json({
          learner: null,
          learners: [],
          overall: {
            lessonsAttended: { total: 0, thisMonth: 0 },
            weeklyRhythm: { current: 0, longest: 0 },
            milestonesCount: 0,
            nextBookedLesson: null,
          },
          subjects: [],
        });
      }

      // If learnerId was not specified, pick the first child for a parent account, else primary learner
      const isParentAccount =
        req.studentUser?.studentProfile?.learner_type === 'child' &&
        learners.some((l) => !l.isPrimary);
      const defaultLearner = isParentAccount
        ? learners.find((l) => !l.isPrimary) || learners[0]
        : learners[0];
      const targetLearner = requestedLearnerId
        ? learners.find((l) => l.id === requestedLearnerId) || defaultLearner
        : defaultLearner;

      const profileFallback = req.studentUser?.studentProfile || {};
      const linkedChildFallback = Array.isArray(profileFallback.linkedChildren)
        ? profileFallback.linkedChildren.find((c: any) => c?.id === targetLearner.id)
        : null;

      if (!client || !isUuid(targetLearner.id)) {
        const readModel = buildLearnerProgressReadModel({
          learnerProfile: {
            id: targetLearner.id,
            name: linkedChildFallback?.name || targetLearner.name || 'Learner',
            learnerType: linkedChildFallback?.learnerType || targetLearner.learnerType || 'adult',
            currentLevel:
              linkedChildFallback?.currentLevel || profileFallback.current_level || 'beginner',
            learningInterest:
              linkedChildFallback?.learningInterest ||
              profileFallback.learning_interest ||
              'quran-reading',
            timezone: profileFallback.timezone || 'UTC',
            assignedTeacherName:
              linkedChildFallback?.assignedTeacherName ||
              profileFallback.assigned_teacher_name ||
              null,
          },
          bookings: [],
          lessonSessions: [],
          lessonNotes: [],
          milestones: [],
          placementTests: [],
        });

        return res.json({
          ...readModel,
          learners: learners.map((l) => ({
            id: l.id,
            name: l.name,
            learnerType: l.learnerType,
            isPrimary: l.isPrimary,
          })),
        });
      }

      // Query all progress sources in parallel for the authorized target learner
      const [
        studentRes,
        bookingsRes,
        sessionsRes,
        notesRes,
        milestonesRes,
        placementRes,
      ] = await Promise.all([
        client
          .from('students')
          .select(
            'id, name, learner_type, current_level, learning_interest, timezone, assigned_teacher_id'
          )
          .eq('id', targetLearner.id)
          .maybeSingle(),
        client
          .from('bookings')
          .select(PROGRESS_BOOKING_COLUMNS)
          .eq('student_id', targetLearner.id)
          .order('scheduled_start', { ascending: false })
          .limit(500),
        client
          .from('lesson_sessions')
          .select(PROGRESS_SESSION_COLUMNS)
          .eq('student_id', targetLearner.id)
          .order('lesson_date', { ascending: false })
          .limit(500),
        client
          .from('lesson_notes')
          .select(FAMILY_SUMMARY_COLUMNS)
          .eq('student_id', targetLearner.id)
          .order('created_at', { ascending: false })
          .limit(100),
        client
          .from('learner_milestones')
          .select(MILESTONE_COLUMNS)
          .eq('student_id', targetLearner.id)
          .order('reached_at', { ascending: false })
          .limit(200),
        client
          .from('placement_tests')
          .select(PROGRESS_PLACEMENT_COLUMNS)
          .eq('learner_student_id', targetLearner.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const studentRow = studentRes?.data || null;
      const bookingsRows = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
      const sessionRows = Array.isArray(sessionsRes?.data) ? sessionsRes.data : [];
      const noteRows = Array.isArray(notesRes?.data) ? notesRes.data : [];
      const milestoneRows = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
      const placementRows = Array.isArray(placementRes?.data) ? placementRes.data : [];

      // Resolve teacher display names for assigned teacher + any upcoming booking teachers (no emails/money)
      const teacherIds = Array.from(
        new Set(
          [
            studentRow?.assigned_teacher_id,
            ...bookingsRows.map((b: any) => b?.teacher_id),
          ].filter((id): id is string => isUuid(id))
        )
      );

      const teacherNamesById = new Map<string, string>();
      if (teacherIds.length > 0) {
        const { data: profilesData } = await client
          .from('profiles')
          .select('id, display_name')
          .in('id', teacherIds);
        if (Array.isArray(profilesData)) {
          for (const p of profilesData) {
            if (p?.id && p?.display_name) {
              teacherNamesById.set(p.id, p.display_name);
            }
          }
        }
      }

      const assignedTeacherId = studentRow?.assigned_teacher_id || null;
      const assignedTeacherName =
        (assignedTeacherId && teacherNamesById.get(assignedTeacherId)) ||
        linkedChildFallback?.assignedTeacherName ||
        profileFallback.assigned_teacher_name ||
        null;

      const readModel = buildLearnerProgressReadModel({
        learnerProfile: {
          id: targetLearner.id,
          name: studentRow?.name || linkedChildFallback?.name || targetLearner.name || 'Learner',
          learnerType:
            studentRow?.learner_type ||
            linkedChildFallback?.learnerType ||
            targetLearner.learnerType ||
            'adult',
          currentLevel:
            studentRow?.current_level ||
            linkedChildFallback?.currentLevel ||
            profileFallback.current_level ||
            'beginner',
          learningInterest:
            studentRow?.learning_interest ||
            linkedChildFallback?.learningInterest ||
            profileFallback.learning_interest ||
            'quran-reading',
          timezone: studentRow?.timezone || profileFallback.timezone || 'UTC',
          assignedTeacherId,
          assignedTeacherName,
        },
        bookings: bookingsRows,
        lessonSessions: sessionRows,
        lessonNotes: noteRows,
        milestones: milestoneRows,
        placementTests: placementRows,
        teacherNamesById,
      });

      return res.json({
        ...readModel,
        learners: learners.map((l) => ({
          id: l.id,
          name: l.name,
          learnerType: l.learnerType,
          isPrimary: l.isPrimary,
        })),
      });
    } catch (err) {
      console.error('[GET /api/student/progress]', err);
      return res.status(500).json({ error: 'Could not load learner progress.' });
    }
  });
}
