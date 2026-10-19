import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  canTeacherWriteForLesson,
  registerProgressRoutes,
} from '../server/routes/progress.js';
import {
  PostLessonSummaryEditor,
  detectSubjectQuickMode,
  SURAH_QUICK_OPTIONS,
  TAJWEED_RULE_CHIPS,
  READING_STAGE_CHIPS,
} from '../src/dashboard/components/PostLessonSummaryEditor.js';

const TEACHER_A_ID = '11111111-1111-4111-8111-111111111111';
const TEACHER_B_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = '99999999-9999-4999-8999-999999999999';

const STUDENT_OWN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_OTHER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const BOOKING_OWN_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const BOOKING_OTHER_TEACHER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SESSION_OWN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const SESSION_FOREIGN_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

function createMockProgressDb() {
  const insertedNotes: any[] = [];
  const insertedMilestones: any[] = [];

  const students: Record<string, any> = {
    [STUDENT_OWN_ID]: { id: STUDENT_OWN_ID, assigned_teacher_id: TEACHER_A_ID },
    [STUDENT_OTHER_ID]: { id: STUDENT_OTHER_ID, assigned_teacher_id: TEACHER_B_ID },
  };

  const bookings: Record<string, any> = {
    [BOOKING_OWN_ID]: {
      id: BOOKING_OWN_ID,
      student_id: STUDENT_OWN_ID,
      teacher_id: TEACHER_A_ID,
    },
    [BOOKING_OTHER_TEACHER_ID]: {
      id: BOOKING_OTHER_TEACHER_ID,
      student_id: STUDENT_OWN_ID,
      teacher_id: TEACHER_B_ID,
    },
  };

  const sessions: Record<string, any> = {
    [SESSION_OWN_ID]: {
      id: SESSION_OWN_ID,
      student_id: STUDENT_OWN_ID,
      booking_id: BOOKING_OWN_ID,
    },
    [SESSION_FOREIGN_ID]: {
      id: SESSION_FOREIGN_ID,
      student_id: STUDENT_OTHER_ID,
      booking_id: BOOKING_OTHER_TEACHER_ID,
    },
  };

  const client = {
    insertedNotes,
    insertedMilestones,
    from(table: string) {
      const filters: Record<string, any> = {};
      let pendingInsert: any = null;

      const builder: any = {
        select() {
          return builder;
        },
        eq(col: string, val: any) {
          filters[col] = val;
          return builder;
        },
        in() {
          return builder;
        },
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        insert(row: any) {
          pendingInsert = row;
          return builder;
        },
        async maybeSingle() {
          if (table === 'students') {
            return { data: students[filters.id] || null, error: null };
          }
          if (table === 'bookings') {
            return { data: bookings[filters.id] || null, error: null };
          }
          if (table === 'lesson_sessions') {
            if (filters.id) {
              return { data: sessions[filters.id] || null, error: null };
            }
            if (filters.booking_id) {
              const found = Object.values(sessions).find(
                (s: any) =>
                  s.booking_id === filters.booking_id &&
                  (!filters.student_id || s.student_id === filters.student_id)
              );
              return { data: found || null, error: null };
            }
          }
          return { data: null, error: null };
        },
        async single() {
          if (table === 'lesson_notes' && pendingInsert) {
            const saved = {
              id: '12345678-1234-4234-8234-1234567890ab',
              ...pendingInsert,
              created_at: '2026-10-20T10:00:00.000Z',
              updated_at: '2026-10-20T10:00:00.000Z',
            };
            insertedNotes.push(saved);
            return { data: saved, error: null };
          }
          if (table === 'learner_milestones' && pendingInsert) {
            const saved = {
              id: '87654321-4321-4321-8321-ba0987654321',
              reached_at: pendingInsert.reached_at || '2026-10-20T10:00:00.000Z',
              ...pendingInsert,
              created_at: '2026-10-20T10:00:00.000Z',
              updated_at: '2026-10-20T10:00:00.000Z',
            };
            insertedMilestones.push(saved);
            return { data: saved, error: null };
          }
          return { data: null, error: { message: 'Not found' } };
        },
      };
      return builder;
    },
  };

  return client;
}

describe('PR-06: Teacher side — record the family summary and milestones after a lesson', () => {
  it('enforces server-side ownership: teacher can only write for their own students and lessons', async () => {
    const db = createMockProgressDb();
    const teacherA = { id: TEACHER_A_ID, role: 'teacher' };
    const superAdmin = { id: ADMIN_ID, role: 'super_admin' };

    // 1. Teacher A writing for own student + own booking -> allowed, resolves linked session
    const ownResult = await canTeacherWriteForLesson(db, teacherA, {
      studentId: STUDENT_OWN_ID,
      bookingId: BOOKING_OWN_ID,
    });
    assert.equal(ownResult.exists, true);
    assert.equal(ownResult.allowed, true);
    assert.equal(ownResult.resolvedSessionId, SESSION_OWN_ID);

    // 2. Teacher A trying to write for Teacher B's student -> forbidden
    const foreignStudentResult = await canTeacherWriteForLesson(db, teacherA, {
      studentId: STUDENT_OTHER_ID,
    });
    assert.equal(foreignStudentResult.exists, true);
    assert.equal(foreignStudentResult.allowed, false);

    // 3. Teacher A trying to write for a booking taught by Teacher B -> forbidden
    const foreignBookingResult = await canTeacherWriteForLesson(db, teacherA, {
      studentId: STUDENT_OWN_ID,
      bookingId: BOOKING_OTHER_TEACHER_ID,
    });
    assert.equal(foreignBookingResult.allowed, false);

    // 4. Teacher A trying to attach a foreign student's sessionId -> forbidden
    const foreignSessionResult = await canTeacherWriteForLesson(db, teacherA, {
      studentId: STUDENT_OWN_ID,
      sessionId: SESSION_FOREIGN_ID,
    });
    assert.equal(foreignSessionResult.allowed, false);

    // 5. Super admin can write for any student
    const adminResult = await canTeacherWriteForLesson(db, superAdmin, {
      studentId: STUDENT_OTHER_ID,
    });
    assert.equal(adminResult.allowed, true);
  });

  it('POST /api/dashboard/students/:id/post-lesson-summary saves family summary, achievements, private notes, and milestone for own student and rejects foreign student with 403', async () => {
    const db = createMockProgressDb();
    const app = express();
    app.use(express.json());

    registerProgressRoutes(app, {
      getClient: () => db,
      rateLimit: (_req, _res, next) => next(),
      verifyStudentAuth: (_req, res) => res.status(401).json({ error: 'Unauthorized' }),
      verifyTeacherAuth: (req, res, next) => {
        const token = req.headers.authorization;
        if (token === 'Bearer teacher-a') {
          req.teacherUser = { id: TEACHER_A_ID, role: 'teacher' };
          return next();
        }
        return res.status(401).json({ error: 'Unauthorized' });
      },
      requireSuperAdmin: (_req, res) => res.status(403).json({ error: 'Forbidden' }),
      getLearners: async () => [],
    });

    const server = app.listen(0);
    const addr = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${addr.port}`;

    try {
      // 1. Attempt to write for another teacher's student -> 403
      const forbiddenRes = await fetch(
        `${baseUrl}/api/dashboard/students/${STUDENT_OTHER_ID}/post-lesson-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer teacher-a',
          },
          body: JSON.stringify({
            family_summary: 'Attempt on another teacher student',
          }),
        }
      );
      assert.equal(forbiddenRes.status, 403);
      assert.equal(db.insertedNotes.length, 0);

      // 2. Attempt to write for a lesson taught by another teacher -> 403
      const forbiddenLessonRes = await fetch(
        `${baseUrl}/api/dashboard/students/${STUDENT_OWN_ID}/post-lesson-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer teacher-a',
          },
          body: JSON.stringify({
            booking_id: BOOKING_OTHER_TEACHER_ID,
            family_summary: 'Attempt on another teacher lesson',
          }),
        }
      );
      assert.equal(forbiddenLessonRes.status, 403);
      assert.equal(db.insertedNotes.length, 0);

      // 3. Valid post-lesson submission for own student & own lesson -> 201
      const okRes = await fetch(
        `${baseUrl}/api/dashboard/students/${STUDENT_OWN_ID}/post-lesson-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer teacher-a',
          },
          body: JSON.stringify({
            booking_id: BOOKING_OWN_ID,
            private_notes: 'Needs extra review on Noon Sakinah idgham.',
            family_summary: 'ما شاء الله، أتقن يوسف الآيات ١–١٥ من سورة الملك.',
            next_steps: 'الاستماع إلى سورة الملك مرتين.',
            achievements: [
              { ar: 'سورة الملك (الآيات 1–15)', en: 'Surah Al-Mulk (Ayahs 1–15)', kind: 'memorization' },
            ],
            milestone: {
              subject: 'quran-memorization',
              kind: 'surah_memorized',
              title_ar: 'إتمام حفظ سورة الملك',
              title_en: 'Memorized Surah Al-Mulk',
            },
          }),
        }
      );
      assert.equal(okRes.status, 201);
      const body = await okRes.json();
      assert.equal(body.success, true);
      assert.equal(body.note.session_id, SESSION_OWN_ID);
      assert.equal(body.note.content, 'Needs extra review on Noon Sakinah idgham.');
      assert.equal(body.note.family_summary, 'ما شاء الله، أتقن يوسف الآيات ١–١٥ من سورة الملك.');
      assert.equal(body.milestone.lesson_session_id, SESSION_OWN_ID);
      assert.equal(body.milestone.created_by, TEACHER_A_ID);
      assert.equal(body.milestone.title_ar, 'إتمام حفظ سورة الملك');
    } finally {
      server.close();
    }
  });

  it('renders PostLessonSummaryEditor with private notes label ("Only you and the admin"), family summary, subject quick-picks, and milestone toggle', () => {
    assert.equal(detectSubjectQuickMode('Quran Memorization').mode, 'memorization');
    assert.equal(detectSubjectQuickMode('Tajweed Rules').mode, 'tajweed');
    assert.equal(detectSubjectQuickMode('Quran Reading').mode, 'reading');
    assert.ok(SURAH_QUICK_OPTIONS.length >= 15);
    assert.ok(TAJWEED_RULE_CHIPS.length >= 6);
    assert.ok(READING_STAGE_CHIPS.length >= 6);

    const html = renderToStaticMarkup(
      React.createElement(PostLessonSummaryEditor, {
        studentId: STUDENT_OWN_ID,
        studentName: 'Yusuf',
        bookingId: BOOKING_OWN_ID,
        subjectHint: 'Quran Memorization',
      })
    );

    assert.ok(html.includes('data-testid="post-lesson-summary-form"'));
    assert.ok(html.includes('data-testid="private-notes-label"'));
    assert.ok(html.includes('data-testid="family-summary-input"'));
    assert.ok(html.includes('data-testid="quick-picker-memorization"'));
    assert.ok(html.includes('data-testid="toggle-mark-milestone"'));
    // Labelled "only you and the admin" / "لك وللمدير فقط"
    assert.ok(html.includes('لك وللمدير فقط') || html.includes('Only you and the admin'));
  });
});
