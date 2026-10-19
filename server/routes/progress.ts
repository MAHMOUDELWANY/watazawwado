/**
 * Learner progress data model routes (PR-01):
 * - Shared lesson summaries (`lesson_notes.family_summary`, `lesson_notes.achievements`)
 *   while keeping `lesson_notes.private_notes` strictly teacher-only.
 * - Learner milestones (`learner_milestones`):
 *   - Student / guardian of that student can read.
 *   - Assigned teacher and super admin can read, insert, and update.
 *   - Nobody can delete except super admin.
 */
import type express from 'express';
import type { LearnerMilestoneKind } from '../../src/types/database.js';

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBJECT_SLUG_RE = /^[a-z0-9-]{1,60}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
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
 * Checks whether a signed-in student or guardian may read milestones/summaries
 * for the requested learner ID.
 */
export function canFamilyReadLearner(
  authorizedLearners: Array<{ id: string }>,
  requestedLearnerId: string
): boolean {
  if (!isUuid(requestedLearnerId)) return false;
  return authorizedLearners.some((l) => l.id === requestedLearnerId);
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
}
