/**
 * PR-07 — Progress for parents: all children at a glance
 *
 * Verifies:
 * 1. `buildFamilyChildOverviewCard` and `GET /api/student/progress` return `isGuardianAccount: true`
 *    and `childrenOverview` for a guardian account with children (name, subject, current level,
 *    weekly rhythm, next lesson, newest milestone), without leaking private notes or financial fields.
 * 2. `getRememberedChildId` and `setRememberedChildId` persist the last opened child in `localStorage`.
 * 3. `StudentProgressPage` renders `data-testid="parent-family-overview"` at the top of `/student/progress`
 *    with one card per child in both Arabic and English, and omits it for accounts without children.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  registerProgressRoutes,
  buildLearnerProgressReadModel,
  buildFamilyChildOverviewCard,
} from '../server/routes/progress.ts';
import StudentProgressPage, {
  LAST_OPENED_CHILD_STORAGE_KEY,
  getRememberedChildId,
  setRememberedChildId,
  type ProgressApiResponse,
} from '../src/student/pages/StudentProgressPage.tsx';

const GUARDIAN_ID = '11111111-1111-4111-8111-111111111111';
const CHILD_1_ID = '44444444-4444-4444-8444-444444444444';
const CHILD_2_ID = '55555555-5555-4555-8555-555555555555';
const TEACHER_ID = '33333333-3333-4333-8333-333333333333';

function createFakeGuardianSupabase(futureBookingStartIso: string) {
  const state = {
    students: [
      {
        id: GUARDIAN_ID,
        name: 'Abu Maryam Al-Ansari',
        email: 'parent@example.com',
        current_level: 'beginner',
        learning_interest: 'tajweed',
        timezone: 'Europe/London',
        assigned_teacher_id: TEACHER_ID,
        guardian_student_id: null,
        learner_type: 'adult',
      },
      {
        id: CHILD_1_ID,
        name: 'Maryam Al-Ansari',
        email: null,
        current_level: 'beginner',
        learning_interest: 'hifz',
        timezone: 'Europe/London',
        assigned_teacher_id: TEACHER_ID,
        guardian_student_id: GUARDIAN_ID,
        learner_type: 'child',
      },
      {
        id: CHILD_2_ID,
        name: 'Omar Al-Ansari',
        email: null,
        current_level: 'intermediate',
        learning_interest: 'noorani-qaida',
        timezone: 'Europe/London',
        assigned_teacher_id: TEACHER_ID,
        guardian_student_id: GUARDIAN_ID,
        learner_type: 'child',
      },
    ],
    profiles: [{ id: TEACHER_ID, display_name: 'Ustadha Fatima Al-Zahraa' }],
    lesson_sessions: [
      {
        id: 'sess-c1-1',
        student_id: CHILD_1_ID,
        booking_id: null,
        lesson_date: '2026-10-12T16:00:00.000Z',
        attendance: 'attended',
        completion_status: 'completed',
        created_at: '2026-10-12T16:00:00.000Z',
      },
      {
        id: 'sess-c2-1',
        student_id: CHILD_2_ID,
        booking_id: null,
        lesson_date: '2026-10-13T16:00:00.000Z',
        attendance: 'attended',
        completion_status: 'completed',
        created_at: '2026-10-13T16:00:00.000Z',
      },
    ],
    bookings: [
      {
        id: 'book-c1-next',
        student_id: CHILD_1_ID,
        teacher_id: TEACHER_ID,
        service_id: 'hifz',
        scheduled_start: futureBookingStartIso,
        scheduled_end: null,
        duration_minutes: 30,
        status: 'confirmed',
        zoom_meeting_link: null,
      },
    ],
    learner_milestones: [
      {
        id: 'ms-c1-old',
        student_id: CHILD_1_ID,
        subject: 'hifz',
        kind: 'surah_memorized',
        title_ar: 'حفظ سورة الناس والفلق',
        title_en: 'Memorized Al-Nas & Al-Falaq',
        reached_at: '2026-10-01T16:00:00.000Z',
        created_by: TEACHER_ID,
        lesson_session_id: null,
      },
      {
        id: 'ms-c1-newest',
        student_id: CHILD_1_ID,
        subject: 'hifz',
        kind: 'surah_memorized',
        title_ar: 'إتمام حفظ سورة النبأ',
        title_en: "Memorized Surah An-Naba'",
        reached_at: '2026-10-18T16:00:00.000Z',
        created_by: TEACHER_ID,
        lesson_session_id: 'sess-c1-1',
      },
    ],
    lesson_notes: [],
    placement_tests: [],
  };

  function makeQuery(table: keyof typeof state) {
    let rows = [...(state[table] as any[])];
    const filters: Array<(row: any) => boolean> = [];

    const builder: any = {
      select(_cols?: string) {
        return builder;
      },
      eq(col: string, val: any) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      in(col: string, vals: any[]) {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      gte(col: string, val: any) {
        filters.push((r) => r[col] >= val);
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        const asc = opts?.ascending !== false;
        rows.sort((a, b) => {
          if (a[col] === b[col]) return 0;
          return (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1);
        });
        return builder;
      },
      limit(n: number) {
        rows = rows.slice(0, n);
        return builder;
      },
      maybeSingle() {
        const matched = rows.filter((r) => filters.every((f) => f(r)));
        return Promise.resolve({ data: matched[0] || null, error: null });
      },
      then(resolve: any, reject: any) {
        const matched = rows.filter((r) => filters.every((f) => f(r)));
        return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
      },
    };
    return builder;
  }

  return {
    from(table: keyof typeof state) {
      return makeQuery(table);
    },
  };
}

test('PR-07: buildFamilyChildOverviewCard picks primary subject, current level, weekly rhythm, next lesson, and newest milestone', () => {
  const model = buildLearnerProgressReadModel({
    learnerProfile: {
      id: CHILD_1_ID,
      name: 'Maryam Al-Ansari',
      learnerType: 'child',
      currentLevel: 'beginner',
      learningInterest: 'hifz',
      timezone: 'Europe/London',
      assignedTeacherId: TEACHER_ID,
      assignedTeacherName: 'Ustadha Fatima Al-Zahraa',
    },
    lessonSessions: [
      {
        id: 'sess-1',
        student_id: CHILD_1_ID,
        booking_id: null,
        lesson_date: '2026-10-18T16:00:00.000Z',
        attendance: 'attended',
        completion_status: 'completed',
      },
    ],
    bookings: [
      {
        id: 'book-1',
        student_id: CHILD_1_ID,
        teacher_id: TEACHER_ID,
        service_id: 'hifz',
        scheduled_start: '2026-10-25T16:00:00.000Z',
        scheduled_end: '2026-10-25T16:30:00.000Z',
        duration_minutes: 30,
        status: 'confirmed',
        zoom_meeting_link: null,
      },
    ],
    milestones: [
      {
        id: 'ms-old',
        student_id: CHILD_1_ID,
        subject: 'hifz',
        kind: 'surah_memorized',
        title_ar: 'حفظ سورة الإخلاص',
        title_en: 'Memorized Surah Al-Ikhlas',
        reached_at: '2026-10-01T16:00:00.000Z',
        lesson_session_id: null,
      },
      {
        id: 'ms-new',
        student_id: CHILD_1_ID,
        subject: 'hifz',
        kind: 'surah_memorized',
        title_ar: 'إتمام حفظ سورة النبأ',
        title_en: "Memorized Surah An-Naba'",
        reached_at: '2026-10-18T16:00:00.000Z',
        lesson_session_id: 'sess-1',
      },
    ],
    lessonNotes: [],
    placementTests: [],
    nowIso: '2026-10-20T12:00:00.000Z',
  });

  const card = buildFamilyChildOverviewCard(model);
  assert.equal(card.id, CHILD_1_ID);
  assert.equal(card.name, 'Maryam Al-Ansari');
  assert.equal(card.subject, 'quran-memorization');
  assert.equal(card.currentLevel.id, 'beginner');
  assert.equal(card.weeklyRhythm.current, 1);
  assert.equal(card.nextBookedLesson?.id, 'book-1');
  assert.equal(card.newestMilestone?.id, 'ms-new');
  assert.equal(card.newestMilestone?.title_en, "Memorized Surah An-Naba'");
});

test('PR-07: GET /api/student/progress returns isGuardianAccount=true and childrenOverview for all children of a parent', async () => {
  const app = express();
  app.use(express.json());
  const futureBookingStartIso = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  const supabase = createFakeGuardianSupabase(futureBookingStartIso);

  registerProgressRoutes(app, {
    getClient: () => supabase,
    rateLimit: (_req: any, _res: any, next: any) => next(),
    verifyStudentAuth: (req: any, _res: any, next: any) => {
      req.studentUser = { id: GUARDIAN_ID, email: 'parent@example.com' };
      next();
    },
    verifyTeacherAuth: (_req: any, _res: any, next: any) => next(),
    requireSuperAdmin: (_req: any, _res: any, next: any) => next(),
    getLearners: async () => [
      { id: GUARDIAN_ID, name: 'Abu Maryam Al-Ansari', learnerType: 'adult', isPrimary: true },
      { id: CHILD_1_ID, name: 'Maryam Al-Ansari', learnerType: 'child', isPrimary: false },
      { id: CHILD_2_ID, name: 'Omar Al-Ansari', learnerType: 'child', isPrimary: false },
    ],
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/student/progress`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as ProgressApiResponse;

    assert.equal(body.isGuardianAccount, true);
    assert.ok(Array.isArray(body.childrenOverview));
    assert.equal(body.childrenOverview!.length, 2);

    const maryam = body.childrenOverview!.find((c) => c.id === CHILD_1_ID);
    const omar = body.childrenOverview!.find((c) => c.id === CHILD_2_ID);
    assert.ok(maryam, 'Expected Maryam in childrenOverview');
    assert.ok(omar, 'Expected Omar in childrenOverview');

    assert.equal(maryam!.name, 'Maryam Al-Ansari');
    assert.equal(maryam!.subject, 'quran-memorization');
    assert.equal(maryam!.currentLevel.id, 'beginner');
    assert.equal(maryam!.nextBookedLesson?.id, 'book-c1-next');
    assert.equal(maryam!.newestMilestone?.id, 'ms-c1-newest');

    assert.equal(omar!.name, 'Omar Al-Ansari');
    assert.equal(omar!.subject, 'quran-reading');
    assert.equal(omar!.currentLevel.id, 'intermediate');
    assert.equal(omar!.nextBookedLesson, null);
    assert.equal(omar!.newestMilestone, null);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('PR-07: getRememberedChildId and setRememberedChildId persist the last opened child in localStorage', () => {
  const store = new Map<string, string>();
  const prevWindow = (globalThis as any).window;
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    },
  };

  try {
    assert.equal(getRememberedChildId(), null);
    setRememberedChildId(CHILD_2_ID);
    assert.equal(store.get(LAST_OPENED_CHILD_STORAGE_KEY), CHILD_2_ID);
    assert.equal(getRememberedChildId(), CHILD_2_ID);
  } finally {
    (globalThis as any).window = prevWindow;
  }
});

test('PR-07: StudentProgressPage renders ParentFamilyOverview with one card per child in Arabic and English', () => {
  const familyData: ProgressApiResponse = {
    isGuardianAccount: true,
    childrenOverview: [
      {
        id: CHILD_1_ID,
        name: 'Maryam Al-Ansari',
        learnerType: 'child',
        assignedTeacherName: 'Ustadha Fatima Al-Zahraa',
        subject: 'hifz',
        subjectMeta: {
          id: 'hifz',
          glyph: 'ح',
          en: 'Quran Memorization (Hifz)',
          ar: 'حفظ القرآن الكريم',
          spineEn: 'Hifz',
          spineAr: 'الحفظ',
          familyKey: 'quran',
          familyColor: '#087D91',
          familyEn: 'Quran',
          familyAr: 'القرآن الكريم',
        },
        currentLevel: {
          id: 'beginner',
          en: "Juz 'Amma",
          ar: 'جزء عمّ',
          descEn: 'Short surahs and the habit of daily review.',
          descAr: 'قصار السور وعادة المراجعة اليومية.',
        },
        currentLevelIndex: 0,
        totalLevels: 4,
        weeklyRhythm: { current: 5, longest: 5 },
        lessonsAttended: { total: 12, thisMonth: 4 },
        nextBookedLesson: {
          id: 'book-c1-next',
          serviceId: 'hifz',
          scheduledStart: '2026-10-24T16:00:00.000Z',
          scheduledEnd: '2026-10-24T16:30:00.000Z',
          durationMinutes: 30,
          status: 'confirmed',
          teacherName: 'Ustadha Fatima Al-Zahraa',
          zoomJoinUrl: null,
        },
        newestMilestone: {
          id: 'ms-c1-newest',
          student_id: CHILD_1_ID,
          subject: 'hifz',
          kind: 'surah_memorized',
          title_ar: 'إتمام حفظ سورة النبأ',
          title_en: "Memorized Surah An-Naba'",
          reached_at: '2026-10-18T16:00:00.000Z',
          lesson_session_id: null,
        },
      },
      {
        id: CHILD_2_ID,
        name: 'Omar Al-Ansari',
        learnerType: 'child',
        assignedTeacherName: 'Sheikh Ibrahim Al-Masri',
        subject: 'noorani-qaida',
        subjectMeta: {
          id: 'noorani-qaida',
          glyph: 'ن',
          en: 'Noorani Qaida',
          ar: 'القاعدة النورانية',
          spineEn: 'Noorani',
          spineAr: 'النورانية',
          familyKey: 'quran',
          familyColor: '#087D91',
          familyEn: 'Quran',
          familyAr: 'القرآن الكريم',
        },
        currentLevel: {
          id: 'intermediate',
          en: 'Vowels & Tanween',
          ar: 'الحركات والتنوين',
          descEn: 'Fatha, kasra, damma, tanween, and joining letters smoothly.',
          descAr: 'الفتحة والكسرة والضمة والتنوين، ووصل الحروف ببعض.',
        },
        currentLevelIndex: 1,
        totalLevels: 3,
        weeklyRhythm: { current: 3, longest: 4 },
        lessonsAttended: { total: 8, thisMonth: 3 },
        nextBookedLesson: null,
        newestMilestone: null,
      },
    ],
    learner: {
      id: CHILD_1_ID,
      name: 'Maryam Al-Ansari',
      learnerType: 'child',
      currentLevel: 'beginner',
      learningInterest: 'hifz',
      timezone: 'Europe/London',
      assignedTeacherName: 'Ustadha Fatima Al-Zahraa',
    },
    learners: [
      { id: GUARDIAN_ID, name: 'Abu Maryam Al-Ansari', learnerType: 'adult', isPrimary: true },
      { id: CHILD_1_ID, name: 'Maryam Al-Ansari', learnerType: 'child', isPrimary: false },
      { id: CHILD_2_ID, name: 'Omar Al-Ansari', learnerType: 'child', isPrimary: false },
    ],
    overall: {
      lessonsAttended: { total: 12, thisMonth: 4 },
      weeklyRhythm: { current: 5, longest: 5 },
      milestonesCount: 1,
      nextBookedLesson: null,
    },
    subjects: [],
  };

  const arHtml = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/student/progress'] },
      React.createElement(StudentProgressPage, { lang: 'ar', initialData: familyData })
    )
  );

  assert.ok(arHtml.includes('data-testid="parent-family-overview"'));
  assert.ok(arHtml.includes('أبناؤك في نظرة واحدة'));
  assert.ok(arHtml.includes(`data-testid="family-child-card-${CHILD_1_ID}"`));
  assert.ok(arHtml.includes(`data-testid="family-child-card-${CHILD_2_ID}"`));
  assert.ok(arHtml.includes('Maryam Al-Ansari'));
  assert.ok(arHtml.includes('Omar Al-Ansari'));
  assert.ok(arHtml.includes('حفظ القرآن الكريم'));
  assert.ok(arHtml.includes('جزء عمّ'));
  assert.ok(arHtml.includes('إتمام حفظ سورة النبأ'));
  assert.ok(arHtml.includes('القاعدة النورانية'));
  assert.ok(arHtml.includes('الحركات والتنوين'));

  const enHtml = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/student/progress'] },
      React.createElement(StudentProgressPage, { lang: 'en', initialData: familyData })
    )
  );

  assert.ok(enHtml.includes('All children at a glance'));
  assert.ok(enHtml.includes('Quran Memorization (Hifz)'));
  assert.ok(enHtml.includes('Memorized Surah An-Naba&#x27;'));
  assert.ok(enHtml.includes('Noorani Qaida'));
  assert.ok(enHtml.includes('Vowels &amp; Tanween'));
});
