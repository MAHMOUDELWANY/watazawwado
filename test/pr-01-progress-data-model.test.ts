import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import http from 'node:http';
import app from '../api/index.js';
import {
  MILESTONE_KINDS,
  FAMILY_SUMMARY_COLUMNS,
  sanitizeNoteForFamily,
  validateMilestoneInput,
  validateFamilyNoteFields,
} from '../server/routes/progress.js';

const TEACHER_ID = '9cd86044-eb13-4547-88e4-567c4f6a57d8';
const OTHER_TEACHER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const OWN_STUDENT_ID = '11111111-1111-4111-8111-111111111111';
const FOREIGN_STUDENT_ID = '22222222-2222-4222-8222-222222222222';
const GUARDIAN_CHILD_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_FAMILY_CHILD_ID = '55555555-5555-4555-8555-555555555555';
const MILESTONE_ID = '66666666-6666-4666-8666-666666666666';

describe('PR-01 — Progress data model: shared lesson summaries and milestones', () => {
  const rootDir = process.cwd();
  const migrationPath = join(
    rootDir,
    'supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql'
  );

  describe('1. Additive migration and RLS policy invariants', () => {
    it('defines additive columns on lesson_notes and creates learner_milestones with all required kinds', () => {
      assert.ok(existsSync(migrationPath), 'Migration file must exist');
      const sql = readFileSync(migrationPath, 'utf8');

      assert.match(sql, /ALTER TABLE public\.lesson_notes[\s\S]*ADD COLUMN IF NOT EXISTS family_summary TEXT/);
      assert.match(sql, /ADD COLUMN IF NOT EXISTS achievements JSONB/);
      assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.learner_milestones/);

      for (const kind of MILESTONE_KINDS) {
        assert.ok(sql.includes(`'${kind}'`), `Migration must allow milestone kind: ${kind}`);
      }
      assert.doesNotMatch(sql, /\bDROP TABLE\b|\bDROP COLUMN\b|\bTRUNCATE\b/i);
    });

    it('enforces RLS on learner_milestones and lesson_notes according to ownership rules', () => {
      const sql = readFileSync(migrationPath, 'utf8');

      assert.match(sql, /ALTER TABLE public\.learner_milestones ENABLE ROW LEVEL SECURITY;/);
      assert.match(sql, /REVOKE ALL ON TABLE public\.learner_milestones FROM anon;/);

      // Students and guardians get SELECT only on learner_milestones (via students.auth_user_id or guardians.parent_email)
      assert.match(
        sql,
        /CREATE POLICY "Students and guardians read own learner_milestones"[\s\S]*FOR SELECT TO authenticated[\s\S]*s\.auth_user_id = auth\.uid\(\)[\s\S]*lower\(trim\(g\.parent_email\)\) = lower\(trim\(auth\.jwt\(\) ->> 'email'\)\)/
      );

      // Assigned teachers get SELECT, INSERT, UPDATE on learner_milestones — never DELETE
      assert.match(sql, /CREATE POLICY "Assigned teachers read learner_milestones"[\s\S]*FOR SELECT TO authenticated/);
      assert.match(sql, /CREATE POLICY "Assigned teachers insert learner_milestones"[\s\S]*FOR INSERT TO authenticated/);
      assert.match(sql, /CREATE POLICY "Assigned teachers update learner_milestones"[\s\S]*FOR UPDATE TO authenticated/);
      assert.doesNotMatch(sql, /Assigned teachers delete learner_milestones/i);

      // Super admin is the only role with ALL (including DELETE) on learner_milestones
      assert.match(
        sql,
        /CREATE POLICY "Super admin manages learner_milestones"[\s\S]*FOR ALL TO authenticated[\s\S]*USING \(public\.is_super_admin\(\)\)/
      );

      // lesson_notes is scoped to assigned_teacher_id = auth.uid() for teachers and never grants student/guardian SELECT
      assert.match(
        sql,
        /CREATE POLICY "Assigned teachers manage lesson_notes" ON public\.lesson_notes[\s\S]*s\.assigned_teacher_id = auth\.uid\(\)/
      );
      assert.doesNotMatch(
        sql,
        /ON public\.lesson_notes[^;]*(auth_user_id = auth\.uid\(\)|parent_email)/
      );
    });
  });

  describe('2. Family summary privacy and input validation', () => {
    it('never selects or returns private_notes or observations in family summaries', () => {
      assert.ok(!FAMILY_SUMMARY_COLUMNS.includes('private_notes'));
      assert.ok(!FAMILY_SUMMARY_COLUMNS.includes('observations'));

      const sanitized = sanitizeNoteForFamily({
        id: 'n1',
        session_id: 's1',
        student_id: OWN_STUDENT_ID,
        private_notes: 'SECRET TEACHER NOTE',
        observations: 'INTERNAL OBSERVATION',
        family_summary: 'Reviewed Surah Al-Mulk verses 1–10 with clear Tajweed.',
        achievements: [{ type: 'ayah_range', surah: 'Al-Mulk', from: 1, to: 10 }],
        next_steps: 'Listen and repeat verses 1–10 three times.',
        created_at: '2026-10-19T10:00:00Z',
        updated_at: '2026-10-19T10:00:00Z',
      });

      assert.equal('private_notes' in sanitized, false);
      assert.equal('observations' in sanitized, false);
      assert.equal(sanitized.family_summary, 'Reviewed Surah Al-Mulk verses 1–10 with clear Tajweed.');
      assert.deepEqual(sanitized.achievements, [{ type: 'ayah_range', surah: 'Al-Mulk', from: 1, to: 10 }]);
    });

    it('validates milestone and family note payloads at the boundary', () => {
      const valid = validateMilestoneInput({
        subject: 'quran-memorization',
        kind: 'surah_memorized',
        title_ar: 'حفظ سورة الملك كاملة',
        title_en: 'Memorized Surah Al-Mulk',
      });
      assert.equal(valid.ok, true);

      const invalidCases = [
        { subject: 'INVALID SLUG!', kind: 'surah_memorized', title_ar: 'أ', title_en: 'A' },
        { subject: 'tajweed', kind: 'unknown_kind', title_ar: 'أ', title_en: 'A' },
        { subject: 'tajweed', kind: 'rule_mastered', title_ar: '', title_en: 'Mastered Noon Sakinah' },
        { subject: 'tajweed', kind: 'rule_mastered', title_ar: 'إتقان النون الساكنة', title_en: '   ' },
        {
          subject: 'tajweed',
          kind: 'rule_mastered',
          title_ar: 'إتقان النون الساكنة',
          title_en: 'Mastered Noon Sakinah',
          lesson_session_id: 'not-a-uuid',
        },
      ];
      for (const bad of invalidCases) {
        assert.equal(validateMilestoneInput(bad).ok, false);
      }

      assert.equal(validateFamilyNoteFields({ family_summary: 'x'.repeat(4001) }).ok, false);
      assert.equal(validateFamilyNoteFields({ achievements: 'not-json-array-or-obj' }).ok, false);
      assert.equal(
        validateFamilyNoteFields({
          family_summary: 'Great progress today.',
          achievements: [{ rule: 'Izhar' }],
        }).ok,
        true
      );
    });
  });

  describe('3. Cross-family and cross-teacher isolation (RLS & API enforcement)', () => {
    let server: http.Server;
    let baseUrl: string;
    let originalFetch: typeof globalThis.fetch;
    let originalEnv: NodeJS.ProcessEnv;

    before(async () => {
      originalEnv = { ...process.env };
      process.env.ALLOW_DEV_AUTH = 'true';
      process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key';

      originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: any, options: any) => {
        const urlStr = typeof url === 'string' ? url : url?.toString() || '';

        if (urlStr.includes('/rest/v1/')) {
          const parsedUrl = new URL(urlStr);
          const method = (options?.method || 'GET').toUpperCase();

          // Mock guardians lookup for guardian@example.com
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
                    current_level: 'beginner',
                  },
                },
              ]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }

          // Mock students lookup for teacher assignment check
          if (parsedUrl.pathname.endsWith('/students')) {
            const idParam = parsedUrl.searchParams.get('id') || '';
            if (idParam === `eq.${OWN_STUDENT_ID}`) {
              return new Response(
                JSON.stringify({ id: OWN_STUDENT_ID, assigned_teacher_id: TEACHER_ID }),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            if (idParam === `eq.${FOREIGN_STUDENT_ID}`) {
              return new Response(
                JSON.stringify({ id: FOREIGN_STUDENT_ID, assigned_teacher_id: OTHER_TEACHER_ID }),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            return new Response(JSON.stringify(null), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            });
          }

          // Mock lesson_notes
          if (parsedUrl.pathname.endsWith('/lesson_notes')) {
            const selectParam = parsedUrl.searchParams.get('select') || '';
            if (selectParam.includes('family_summary') && !selectParam.includes('private_notes')) {
              return new Response(
                JSON.stringify([
                  {
                    id: 'note-1',
                    session_id: null,
                    student_id: GUARDIAN_CHILD_ID,
                    family_summary: 'Completed Surah An-Naba verses 1–20.',
                    achievements: [{ surah: 'An-Naba', verses: '1-20' }],
                    next_steps: 'Review verses 1–20 daily.',
                    created_at: '2026-10-19T12:00:00Z',
                    updated_at: '2026-10-19T12:00:00Z',
                  },
                ]),
                { status: 200, headers: { 'content-type': 'application/json' } }
              );
            }
            return new Response(
              JSON.stringify([
                {
                  id: 'note-1',
                  student_id: OWN_STUDENT_ID,
                  private_notes: 'Teacher-only private observation',
                  family_summary: 'Family summary text',
                  achievements: [],
                  created_at: '2026-10-19T12:00:00Z',
                  updated_at: '2026-10-19T12:00:00Z',
                },
              ]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
          }

          // Mock learner_milestones
          if (parsedUrl.pathname.endsWith('/learner_milestones')) {
            if (method === 'POST') {
              const body = JSON.parse(options.body);
              return new Response(
                JSON.stringify({
                  id: MILESTONE_ID,
                  ...body,
                  reached_at: body.reached_at || '2026-10-19T12:00:00Z',
                  created_at: '2026-10-19T12:00:00Z',
                  updated_at: '2026-10-19T12:00:00Z',
                }),
                { status: 201, headers: { 'content-type': 'application/json' } }
              );
            }
            if (method === 'DELETE') {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
              });
            }
            const idParam = parsedUrl.searchParams.get('id') || '';
            if (idParam === `eq.${MILESTONE_ID}`) {
              return new Response(JSON.stringify({ id: MILESTONE_ID }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
              });
            }
            return new Response(
              JSON.stringify([
                {
                  id: MILESTONE_ID,
                  student_id: GUARDIAN_CHILD_ID,
                  subject: 'quran-memorization',
                  kind: 'surah_memorized',
                  title_ar: 'حفظ سورة النبأ',
                  title_en: 'Memorized Surah An-Naba',
                  reached_at: '2026-10-19T12:00:00Z',
                  created_by: TEACHER_ID,
                  lesson_session_id: null,
                  created_at: '2026-10-19T12:00:00Z',
                  updated_at: '2026-10-19T12:00:00Z',
                },
              ]),
              { status: 200, headers: { 'content-type': 'application/json' } }
            );
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

    it('proves a parent cannot read another family’s milestones (403) while reading their own child succeeds without private_notes', async () => {
      // 1. Parent attempts to read another family's child milestones -> 403 Forbidden
      const foreignRes = await fetch(
        `${baseUrl}/api/student/milestones?learnerId=${OTHER_FAMILY_CHILD_ID}`,
        {
          headers: { Authorization: 'Bearer dev-guardian-student-token' },
        }
      );
      assert.equal(foreignRes.status, 403);
      const foreignBody = await foreignRes.json();
      assert.match(foreignBody.error, /Forbidden/i);

      // 2. Parent reads their own linked child's milestones -> 200 OK, no private_notes
      const ownRes = await fetch(
        `${baseUrl}/api/student/milestones?learnerId=${GUARDIAN_CHILD_ID}`,
        {
          headers: { Authorization: 'Bearer dev-guardian-student-token' },
        }
      );
      assert.equal(ownRes.status, 200);
      const ownBody = await ownRes.json();
      assert.equal(ownBody.milestones.length, 1);
      assert.equal(ownBody.milestones[0].kind, 'surah_memorized');
      assert.equal(ownBody.summaries.length, 1);
      assert.equal(ownBody.summaries[0].family_summary, 'Completed Surah An-Naba verses 1–20.');
      assert.equal('private_notes' in ownBody.summaries[0], false);
      assert.equal('observations' in ownBody.summaries[0], false);
    });

    it('proves a teacher cannot read private notes or milestones of a student who is not theirs (403)', async () => {
      // 1. Teacher tries to read private notes of another teacher's student -> 403
      const notesForbidden = await fetch(
        `${baseUrl}/api/dashboard/students/${FOREIGN_STUDENT_ID}/notes`,
        {
          headers: { Authorization: 'Bearer dev-teacher-token' },
        }
      );
      assert.equal(notesForbidden.status, 403);

      // 2. Teacher tries to read milestones of another teacher's student -> 403
      const milestonesForbidden = await fetch(
        `${baseUrl}/api/dashboard/students/${FOREIGN_STUDENT_ID}/milestones`,
        {
          headers: { Authorization: 'Bearer dev-teacher-token' },
        }
      );
      assert.equal(milestonesForbidden.status, 403);

      // 3. Teacher tries to create a milestone for another teacher's student -> 403
      const createForbidden = await fetch(
        `${baseUrl}/api/dashboard/students/${FOREIGN_STUDENT_ID}/milestones`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer dev-teacher-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'tajweed',
            kind: 'rule_mastered',
            title_ar: 'إتقان الإظهار',
            title_en: 'Mastered Izhar',
          }),
        }
      );
      assert.equal(createForbidden.status, 403);

      // 4. Assigned teacher CAN read notes and create milestones for their own student
      const ownNotes = await fetch(
        `${baseUrl}/api/dashboard/students/${OWN_STUDENT_ID}/notes`,
        {
          headers: { Authorization: 'Bearer dev-teacher-token' },
        }
      );
      assert.equal(ownNotes.status, 200);

      const ownCreate = await fetch(
        `${baseUrl}/api/dashboard/students/${OWN_STUDENT_ID}/milestones`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer dev-teacher-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: 'tajweed',
            kind: 'rule_mastered',
            title_ar: 'إتقان الإظهار',
            title_en: 'Mastered Izhar',
          }),
        }
      );
      assert.equal(ownCreate.status, 201);
    });

    it('proves nobody can delete a milestone except super admin', async () => {
      const teacherDelete = await fetch(
        `${baseUrl}/api/dashboard/students/${OWN_STUDENT_ID}/milestones/${MILESTONE_ID}`,
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer dev-teacher-token' },
        }
      );
      assert.equal(teacherDelete.status, 403);

      const adminDelete = await fetch(
        `${baseUrl}/api/dashboard/students/${OWN_STUDENT_ID}/milestones/${MILESTONE_ID}`,
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer dev-super-admin-token' },
        }
      );
      assert.equal(adminDelete.status, 200);
    });
  });
});
