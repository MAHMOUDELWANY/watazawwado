import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../api/index.js';
import {
  computeWeeklyRhythm,
  computeLessonsAttended,
  buildLearnerProgressReadModel,
  PROGRESS_BOOKING_COLUMNS,
  PROGRESS_SESSION_COLUMNS,
  FAMILY_SUMMARY_COLUMNS,
} from '../server/routes/progress.js';
import { levelsFor } from '../src/components/onboarding/subjects.js';

const OWN_STUDENT_ID = '11111111-2222-3333-4444-555555555555';
const ZERO_LESSONS_STUDENT_ID = '22222222-2222-3333-4444-555555555555';
const GUARDIAN_CHILD_ID = '44444444-4444-4444-8444-444444444444';
const FOREIGN_CHILD_ID = '55555555-5555-4555-8555-555555555555';
const TEACHER_ID = '9cd86044-eb13-4547-88e4-567c4f6a57d8';

const FORBIDDEN_FIELDS = [
  'private_notes',
  'observations',
  'teacher_observations',
  'teacher_notes',
  'fee_amount_usd',
  'price_paid',
  'price_amount',
  'approved_price_usd',
  'recommended_price_usd',
  'payment_plan',
];

function collectAllKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectAllKeys(item, keys);
    return keys;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    keys.add(k);
    collectAllKeys(v, keys);
  }
  return keys;
}

describe('PR-02 — Progress API (read model): GET /api/student/progress', () => {
  describe('1. Pure rhythm, attendance, and read-model unit invariants', () => {
    it('computes weekly rhythm (current and longest) across consecutive and non-consecutive weeks', () => {
      // 3 consecutive weeks ending in the current week -> current = 3, longest = 3
      const activeRhythm = computeWeeklyRhythm(
        [
          '2026-10-05T10:00:00Z', // Week 41
          '2026-10-12T10:00:00Z', // Week 42
          '2026-10-19T10:00:00Z', // Week 43 (current)
          '2026-10-20T15:00:00Z', // Same week 43 (multiple lessons in one week count as 1 week)
        ],
        'UTC',
        '2026-10-21T12:00:00Z'
      );
      assert.deepEqual(activeRhythm, { current: 3, longest: 3 });

      // Missed week resets current rhythm to 0 while preserving longest rhythm
      const missedWeekRhythm = computeWeeklyRhythm(
        [
          '2026-09-07T10:00:00Z', // Week 37
          '2026-09-14T10:00:00Z', // Week 38
          '2026-09-21T10:00:00Z', // Week 39
          '2026-09-28T10:00:00Z', // Week 40 (4-week streak)
          // Week 41 & 42 missed
        ],
        'UTC',
        '2026-10-21T12:00:00Z' // Week 43
      );
      assert.deepEqual(missedWeekRhythm, { current: 0, longest: 4 });
    });

    it('never selects private_notes, observations, or prices in progress SQL column lists', () => {
      for (const colList of [
        PROGRESS_BOOKING_COLUMNS,
        PROGRESS_SESSION_COLUMNS,
        FAMILY_SUMMARY_COLUMNS,
      ]) {
        for (const forbidden of FORBIDDEN_FIELDS) {
          assert.ok(
            !colList.includes(forbidden),
            `Column list "${colList}" must not include forbidden field "${forbidden}"`
          );
        }
      }
    });

    it('caps familySummaries at the last 5 and strips all private/price fields', () => {
      const notes = Array.from({ length: 7 }, (_, i) => ({
        id: `note-${i + 1}`,
        session_id: null,
        student_id: OWN_STUDENT_ID,
        private_notes: 'SECRET_TEACHER_NOTE',
        observations: 'SECRET_OBSERVATION',
        family_summary: `Summary #${i + 1}`,
        achievements: [{ badge: i + 1 }],
        next_steps: `Practice #${i + 1}`,
        created_at: `2026-10-${String(19 - i).padStart(2, '0')}T10:00:00Z`,
        updated_at: `2026-10-${String(19 - i).padStart(2, '0')}T10:00:00Z`,
      }));

      const model = buildLearnerProgressReadModel({
        learnerProfile: {
          id: OWN_STUDENT_ID,
          name: 'Ahmad',
          learnerType: 'adult',
          currentLevel: 'intermediate',
          learningInterest: 'tajweed',
          timezone: 'UTC',
        },
        bookings: [],
        lessonSessions: [],
        lessonNotes: notes,
        milestones: [],
        placementTests: [],
        nowIso: '2026-10-19T12:00:00Z',
      });

      assert.equal(model.subjects.length, 1);
      const tajweed = model.subjects[0];
      assert.equal(tajweed.subject, 'tajweed');
      assert.equal(tajweed.familySummaries.length, 5);
      assert.equal(tajweed.familySummaries[0].family_summary, 'Summary #1');
      assert.equal(tajweed.familySummaries[4].family_summary, 'Summary #5');

      const keys = collectAllKeys(model);
      for (const forbidden of FORBIDDEN_FIELDS) {
        assert.equal(keys.has(forbidden), false, `Model must not leak ${forbidden}`);
      }
    });
  });

  describe('2. HTTP endpoint scenarios: own learner, guardian child, foreign child (403), zero lessons', () => {
    let server: http.Server;
    let baseUrl: string;
    let originalFetch: typeof globalThis.fetch;
    let originalEnv: NodeJS.ProcessEnv;

    before(async () => {
      originalEnv = { ...process.env };
      process.env.ALLOW_DEV_AUTH = 'true';
      process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';

      originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        const urlStr = typeof url === 'string' ? url : url?.toString() || '';

        if (urlStr.includes('/rest/v1/')) {
          const parsedUrl = new URL(urlStr);

          // 1. Guardians lookup for guardian@example.com
          if (parsedUrl.pathname.endsWith('/guardians')) {
            return new Response(
              JSON.stringify([
                {
                  student_id: GUARDIAN_CHILD_ID,
                  parent_name: 'Parent Guardian',
                  parent_email: 'guardian@example.com',
                  students: {
                    id: GUARDIAN_CHILD_ID,
                    name: 'Aisha Al-Harithi',
                    learner_type: 'child',
                    current_level: 'intermediate',
                  },
                },
              ]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }

          // 2. Students table
          if (parsedUrl.pathname.endsWith('/students')) {
            const idParam = parsedUrl.searchParams.get('id') || '';
            if (idParam === `eq.${OWN_STUDENT_ID}`) {
              return new Response(
                JSON.stringify({
                  id: OWN_STUDENT_ID,
                  name: 'Test Student',
                  learner_type: 'adult',
                  current_level: 'intermediate',
                  learning_interest: 'tajweed',
                  timezone: 'UTC',
                  assigned_teacher_id: TEACHER_ID,
                }),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            if (idParam === `eq.${GUARDIAN_CHILD_ID}`) {
              return new Response(
                JSON.stringify({
                  id: GUARDIAN_CHILD_ID,
                  name: 'Aisha Al-Harithi',
                  learner_type: 'child',
                  current_level: 'beginner',
                  learning_interest: 'quran-memorization',
                  timezone: 'America/Toronto',
                  assigned_teacher_id: TEACHER_ID,
                }),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            if (idParam === `eq.${ZERO_LESSONS_STUDENT_ID}`) {
              return new Response(
                JSON.stringify({
                  id: ZERO_LESSONS_STUDENT_ID,
                  name: 'Student B',
                  learner_type: 'adult',
                  current_level: 'beginner',
                  learning_interest: 'quran-reading',
                  timezone: 'UTC',
                  assigned_teacher_id: null,
                }),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }

          // 3. Profiles table (teacher display name)
          if (parsedUrl.pathname.endsWith('/profiles')) {
            return new Response(
              JSON.stringify([{ id: TEACHER_ID, display_name: 'Ustadha Afnan' }]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }

          // 4. Bookings table
          if (parsedUrl.pathname.endsWith('/bookings')) {
            const studentIdParam = parsedUrl.searchParams.get('student_id') || '';
            if (studentIdParam === `eq.${ZERO_LESSONS_STUDENT_ID}`) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
              });
            }
            if (studentIdParam === `eq.${GUARDIAN_CHILD_ID}`) {
              const now = new Date();
              const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
              const thisWeek = new Date(now.getTime() - 1 * 86400000).toISOString();
              const nextWeek = new Date(now.getTime() + 3 * 86400000).toISOString();
              return new Response(
                JSON.stringify([
                  {
                    id: 'b-child-1',
                    student_id: GUARDIAN_CHILD_ID,
                    service_id: 'quran-memorization',
                    booking_type: 'package',
                    duration_minutes: 45,
                    scheduled_start: lastWeek,
                    scheduled_end: lastWeek,
                    student_timezone: 'America/Toronto',
                    status: 'completed',
                    teacher_id: TEACHER_ID,
                    zoom_meeting_link: null,
                    created_at: lastWeek,
                  },
                  {
                    id: 'b-child-2',
                    student_id: GUARDIAN_CHILD_ID,
                    service_id: 'quran-memorization',
                    booking_type: 'package',
                    duration_minutes: 45,
                    scheduled_start: thisWeek,
                    scheduled_end: thisWeek,
                    student_timezone: 'America/Toronto',
                    status: 'completed',
                    teacher_id: TEACHER_ID,
                    zoom_meeting_link: null,
                    created_at: thisWeek,
                  },
                  {
                    id: 'b-child-next',
                    student_id: GUARDIAN_CHILD_ID,
                    service_id: 'quran-memorization',
                    booking_type: 'package',
                    duration_minutes: 45,
                    scheduled_start: nextWeek,
                    scheduled_end: nextWeek,
                    student_timezone: 'America/Toronto',
                    status: 'confirmed',
                    teacher_id: TEACHER_ID,
                    zoom_meeting_link: 'https://zoom.us/j/123456789',
                    created_at: thisWeek,
                  },
                ]),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            if (studentIdParam === `eq.${OWN_STUDENT_ID}`) {
              const now = new Date();
              const thisWeek = new Date(now.getTime() - 86400000).toISOString();
              const tomorrow = new Date(now.getTime() + 86400000).toISOString();
              return new Response(
                JSON.stringify([
                  {
                    id: 'b-own-1',
                    student_id: OWN_STUDENT_ID,
                    service_id: 'tajweed',
                    booking_type: 'single',
                    duration_minutes: 60,
                    scheduled_start: thisWeek,
                    scheduled_end: thisWeek,
                    student_timezone: 'UTC',
                    status: 'completed',
                    teacher_id: TEACHER_ID,
                    zoom_meeting_link: null,
                    created_at: thisWeek,
                  },
                  {
                    id: 'b-own-next',
                    student_id: OWN_STUDENT_ID,
                    service_id: 'tajweed',
                    booking_type: 'single',
                    duration_minutes: 60,
                    scheduled_start: tomorrow,
                    scheduled_end: tomorrow,
                    student_timezone: 'UTC',
                    status: 'confirmed',
                    teacher_id: TEACHER_ID,
                    zoom_meeting_link: 'https://zoom.us/j/987654321',
                    created_at: thisWeek,
                  },
                ]),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }

          // 5. Lesson sessions table
          if (parsedUrl.pathname.endsWith('/lesson_sessions')) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }

          // 6. Lesson notes table
          if (parsedUrl.pathname.endsWith('/lesson_notes')) {
            const studentIdParam = parsedUrl.searchParams.get('student_id') || '';
            if (studentIdParam === `eq.${ZERO_LESSONS_STUDENT_ID}`) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
              });
            }
            return new Response(
              JSON.stringify([
                {
                  id: 'note-progress-1',
                  session_id: null,
                  student_id:
                    studentIdParam === `eq.${GUARDIAN_CHILD_ID}`
                      ? GUARDIAN_CHILD_ID
                      : OWN_STUDENT_ID,
                  family_summary: 'Practiced Noon Sakinah rules with steady focus.',
                  achievements: [{ rule: 'Idgham' }],
                  next_steps: 'Recite Surah Al-Infitar verses 1–10.',
                  created_at: '2026-10-18T12:00:00Z',
                  updated_at: '2026-10-18T12:00:00Z',
                },
              ]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }

          // 7. Learner milestones table
          if (parsedUrl.pathname.endsWith('/learner_milestones')) {
            const studentIdParam = parsedUrl.searchParams.get('student_id') || '';
            if (studentIdParam === `eq.${ZERO_LESSONS_STUDENT_ID}`) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
              });
            }
            const isChild = studentIdParam === `eq.${GUARDIAN_CHILD_ID}`;
            return new Response(
              JSON.stringify([
                {
                  id: 'm-1',
                  student_id: isChild ? GUARDIAN_CHILD_ID : OWN_STUDENT_ID,
                  subject: isChild ? 'quran-memorization' : 'tajweed',
                  kind: isChild ? 'surah_memorized' : 'rule_mastered',
                  title_ar: isChild ? 'حفظ سورة الملك' : 'إتقان أحكام النون الساكنة',
                  title_en: isChild ? 'Memorized Surah Al-Mulk' : 'Mastered Noon Sakinah Rules',
                  reached_at: '2026-10-18T15:00:00Z',
                  created_by: TEACHER_ID,
                  lesson_session_id: null,
                  created_at: '2026-10-18T15:00:00Z',
                  updated_at: '2026-10-18T15:00:00Z',
                },
              ]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }

          // 8. Placement tests table
          if (parsedUrl.pathname.endsWith('/placement_tests')) {
            const learnerParam = parsedUrl.searchParams.get('learner_student_id') || '';
            if (learnerParam === `eq.${OWN_STUDENT_ID}`) {
              return new Response(
                JSON.stringify([
                  {
                    id: 'pt-own-1',
                    learner_student_id: OWN_STUDENT_ID,
                    service_id: 'tajweed',
                    stated_level: 'beginner',
                    status: 'reviewed',
                    score: 7,
                    max_score: 8,
                    suggested_level: 'intermediate',
                    admin_level: 'intermediate',
                    admin_reply: 'Ready for Level 2 articulation points.',
                    submitted_at: '2026-10-10T10:00:00Z',
                    reviewed_at: '2026-10-11T10:00:00Z',
                    created_at: '2026-10-10T09:50:00Z',
                  },
                ]),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }
        }

        return originalFetch(url, options);
      };

      await new Promise<void>((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
          const addr = server.address() as any;
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    after(async () => {
      globalThis.fetch = originalFetch;
      process.env = originalEnv;
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    });

    it('(a) Own learner: returns per-subject progress, levels from subjects.ts, rhythm, summaries, placement result, and next lesson with zero private/price fields', async () => {
      const res = await fetch(`${baseUrl}/api/student/progress`, {
        headers: { Authorization: 'Bearer dev-student-token' },
      });
      assert.equal(res.status, 200);
      const body = await res.json();

      assert.equal(body.learner.id, OWN_STUDENT_ID);
      assert.equal(body.subjects.length, 1);

      const tajweed = body.subjects[0];
      assert.equal(tajweed.subject, 'tajweed');
      assert.equal(tajweed.currentLevel, 'intermediate');
      assert.deepEqual(tajweed.levels, levelsFor('tajweed'));
      assert.equal(tajweed.lessonsAttended.total, 1);
      assert.equal(tajweed.weeklyRhythm.current, 1);
      assert.equal(tajweed.weeklyRhythm.longest, 1);
      assert.equal(tajweed.milestones.length, 1);
      assert.equal(tajweed.milestones[0].kind, 'rule_mastered');
      assert.equal(tajweed.familySummaries.length, 1);
      assert.equal(
        tajweed.familySummaries[0].family_summary,
        'Practiced Noon Sakinah rules with steady focus.'
      );
      assert.ok(tajweed.placementResult);
      assert.equal(tajweed.placementResult.adminLevel, 'intermediate');
      assert.ok(tajweed.nextBookedLesson);
      assert.equal(tajweed.nextBookedLesson.id, 'b-own-next');
      assert.equal(tajweed.nextBookedLesson.teacherName, 'Ustadha Afnan');

      const allKeys = collectAllKeys(body);
      for (const forbidden of FORBIDDEN_FIELDS) {
        assert.equal(
          allKeys.has(forbidden),
          false,
          `Response must never contain forbidden field: ${forbidden}`
        );
      }
    });

    it("(b) Guardian's child: allows parent to read linked child's progress via ?learnerId=", async () => {
      const res = await fetch(
        `${baseUrl}/api/student/progress?learnerId=${GUARDIAN_CHILD_ID}`,
        {
          headers: { Authorization: 'Bearer dev-guardian-student-token' },
        }
      );
      assert.equal(res.status, 200);
      const body = await res.json();

      assert.equal(body.learner.id, GUARDIAN_CHILD_ID);
      assert.equal(body.learner.name, 'Aisha Al-Harithi');
      assert.equal(body.subjects.length, 1);

      const hifz = body.subjects[0];
      assert.equal(hifz.subject, 'quran-memorization');
      assert.deepEqual(hifz.levels, levelsFor('quran-memorization'));
      assert.equal(hifz.lessonsAttended.total, 2);
      assert.ok(hifz.weeklyRhythm.current >= 1);
      assert.equal(hifz.milestones.length, 1);
      assert.equal(hifz.milestones[0].title_ar, 'حفظ سورة الملك');
      assert.ok(hifz.nextBookedLesson);
      assert.equal(hifz.nextBookedLesson.id, 'b-child-next');

      const allKeys = collectAllKeys(body);
      for (const forbidden of FORBIDDEN_FIELDS) {
        assert.equal(allKeys.has(forbidden), false);
      }
    });

    it('(c) Foreign child: rejects guardian attempting to read another family’s child with 403', async () => {
      const res = await fetch(
        `${baseUrl}/api/student/progress?learnerId=${FOREIGN_CHILD_ID}`,
        {
          headers: { Authorization: 'Bearer dev-guardian-student-token' },
        }
      );
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.match(body.error, /Forbidden/i);
    });

    it('(d) Learner with zero lessons: returns empty but valid structure with subject levels intact', async () => {
      const res = await fetch(`${baseUrl}/api/student/progress`, {
        headers: { Authorization: 'Bearer dev-student-b-token' },
      });
      assert.equal(res.status, 200);
      const body = await res.json();

      assert.equal(body.learner.id, ZERO_LESSONS_STUDENT_ID);
      assert.deepEqual(body.overall.lessonsAttended, { total: 0, thisMonth: 0 });
      assert.deepEqual(body.overall.weeklyRhythm, { current: 0, longest: 0 });
      assert.equal(body.overall.milestonesCount, 0);
      assert.equal(body.overall.nextBookedLesson, null);

      assert.equal(body.subjects.length, 1);
      const reading = body.subjects[0];
      assert.equal(reading.subject, 'quran-reading');
      assert.equal(reading.currentLevel, 'beginner');
      assert.deepEqual(reading.levels, levelsFor('quran-reading'));
      assert.deepEqual(reading.lessonsAttended, { total: 0, thisMonth: 0 });
      assert.deepEqual(reading.weeklyRhythm, { current: 0, longest: 0 });
      assert.deepEqual(reading.milestones, []);
      assert.deepEqual(reading.familySummaries, []);
      assert.equal(reading.placementResult, null);
      assert.equal(reading.nextBookedLesson, null);
    });
  });
});
