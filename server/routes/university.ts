import express from 'express';
import { notifySuperAdmins, notifyUser } from '../notifications/inbox.js';

/**
 * NX-15 "Watazawwado University" (owner decided 2026-11-02: licences and training together).
 * A teacher teaches only the subjects licensed to them (teacher_subjects.status = 'licensed'); the server checks it on
 * booking, on assigning a student and on moving a lesson. Another subject is earned through a track: the teacher
 * studies our curriculum and the teacher guide (ticked by the teacher), then passes a test and an observed lesson
 * (recorded by the super admin). Passing both grants the subject; the super admin may also grant or remove it directly.
 */
type Middleware = (req: any, res: any, next: any) => any;

export const UNIVERSITY_SUBJECTS = [
  'quran-reading', 'tajweed', 'quran-memorization', 'zad-essentials', 'seerah',
  'modern-standard-arabic', 'egyptian-arabic', 'english',
] as const;
export type UniversitySubject = typeof UNIVERSITY_SUBJECTS[number];

export const SUBJECT_NAMES: Record<UniversitySubject, { en: string; ar: string }> = {
  'quran-reading': { en: 'Quran reading', ar: 'قراءة القرآن' },
  tajweed: { en: 'Tajweed', ar: 'التجويد' },
  'quran-memorization': { en: 'Memorization & revision', ar: 'الحفظ والمراجعة' },
  'zad-essentials': { en: 'Zad Essentials', ar: 'أول الزاد' },
  seerah: { en: 'Seerah', ar: 'السيرة النبوية' },
  'modern-standard-arabic': { en: 'Fusha Arabic', ar: 'العربية الفصحى' },
  'egyptian-arabic': { en: 'Egyptian Arabic', ar: 'اللهجة المصرية' },
  english: { en: 'English', ar: 'الإنجليزية' },
};

// Retired services still name the subject that replaced them (RULES.md §2b).
const SERVICE_ALIASES: Record<string, UniversitySubject> = {
  'quran-revision': 'quran-memorization',
  'arabic-conversation': 'modern-standard-arabic',
  'arabic-foundations': 'modern-standard-arabic',
};

/** The licence a service or learning interest needs, or null when it is not one of the eight (nothing to check). */
export function subjectFor(serviceOrInterest: string | null | undefined): UniversitySubject | null {
  const id = String(serviceOrInterest || '').trim();
  if ((UNIVERSITY_SUBJECTS as readonly string[]).includes(id)) return id as UniversitySubject;
  return SERVICE_ALIASES[id] || null;
}

const STEP_COLUMNS = 'teacher_email, subject, status, curriculum_done_at, guide_done_at, test_score, test_passed_at, observed_passed_at, note, licensed_at, updated_at';

/** Email of a teacher given their auth user id or email. */
async function teacherEmail(client: any, teacherIdOrEmail: string): Promise<string | null> {
  const clean = String(teacherIdOrEmail || '').trim().toLowerCase();
  if (!clean) return null;
  if (clean.includes('@')) return clean;
  const { data } = await client.from('profiles').select('email').eq('id', clean).maybeSingle();
  if (data?.email) return String(data.email).toLowerCase();
  const { data: u } = await client.auth.admin.getUserById(clean).catch(() => ({ data: null }));
  return u?.user?.email ? String(u.user.email).toLowerCase() : null;
}

/**
 * May this teacher teach the subject of this service or learning interest? Services outside the eight subjects pass.
 * shortcut: a failed lookup lets the action through (logged) so an outage never blocks bookings; make it strict once
 * the table has been in production for a while.
 */
export async function canTeach(client: any, teacherIdOrEmail: string | null | undefined, serviceOrInterest: string | null | undefined): Promise<boolean> {
  const subject = subjectFor(serviceOrInterest);
  if (!subject || !teacherIdOrEmail || !client) return true;
  try {
    const email = await teacherEmail(client, teacherIdOrEmail);
    if (!email) return true;
    const { data, error } = await client.from('teacher_subjects').select('status').eq('teacher_email', email).eq('subject', subject).maybeSingle();
    if (error) { console.error('[university canTeach]', error.message); return true; }
    return data?.status === 'licensed';
  } catch (err: any) {
    console.error('[university canTeach]', err?.message || err);
    return true;
  }
}

export const NOT_LICENSED = {
  code: 'TEACHER_NOT_LICENSED',
  error: 'This teacher does not teach this subject. Please message us and we will match you with a teacher who does.',
  error_ar: 'المعلم ده مش بيدرّس المادة دي. ابعتلنا رسالة ونوصلك بمعلم بيدرّسها.',
};

/** Licensed when both admin steps are done. */
export const earnsLicence = (row: { test_passed_at?: string | null; observed_passed_at?: string | null }) =>
  Boolean(row.test_passed_at && row.observed_passed_at);

export function registerUniversityRoutes(app: express.Express, deps: { getClient: () => any; verifyTeacherAuth: Middleware; requireSuperAdmin: Middleware }) {
  const db = (res: any) => {
    const client = deps.getClient();
    if (!client) res.status(503).json({ error: 'Database service unavailable.' });
    return client;
  };
  const isSubject = (s: unknown): s is UniversitySubject => (UNIVERSITY_SUBJECTS as readonly unknown[]).includes(s);

  // Teacher: my subjects and tracks.
  app.get('/api/dashboard/university/me', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const email = String(req.teacherUser?.email || '').toLowerCase();
    const { data, error } = await client.from('teacher_subjects').select(STEP_COLUMNS).eq('teacher_email', email);
    if (error) { console.error('[university me]', error.message); return res.status(500).json({ error: 'Could not load your subjects.' }); }
    return res.json({ subjects: UNIVERSITY_SUBJECTS, rows: data || [] });
  });

  // Teacher: start the track for a subject (the super admin is told).
  app.post('/api/dashboard/university/me/:subject/start', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const subject = req.params.subject;
    if (!isSubject(subject)) return res.status(400).json({ error: 'Unknown subject.' });
    const email = String(req.teacherUser?.email || '').toLowerCase();
    const { data: existing } = await client.from('teacher_subjects').select('status').eq('teacher_email', email).eq('subject', subject).maybeSingle();
    if (existing) return res.status(409).json({ error: existing.status === 'licensed' ? 'You already teach this subject.' : 'You already started this track.' });
    const { data, error } = await client.from('teacher_subjects').insert({ teacher_email: email, subject, status: 'training' }).select(STEP_COLUMNS).single();
    if (error) { console.error('[university start]', error.message); return res.status(500).json({ error: 'Could not start the track.' }); }
    await notifySuperAdmins(client, {
      kind: 'university_started',
      title: { en: 'A teacher started a training track', ar: 'معلم بدأ مسار تدريب' },
      body: { en: `${req.teacherUser?.name || email} started training for ${SUBJECT_NAMES[subject].en}.`, ar: `${req.teacherUser?.name || email} بدأ التدريب على ${SUBJECT_NAMES[subject].ar}.` },
      link: '/dashboard/university',
    });
    return res.status(201).json({ row: data });
  });

  // Teacher: tick the curriculum or the teacher guide as studied (or untick).
  app.post('/api/dashboard/university/me/:subject/step', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const subject = req.params.subject;
    const step = req.body?.step;
    if (!isSubject(subject) || !['curriculum', 'guide'].includes(step)) return res.status(400).json({ error: 'Unknown step.' });
    const email = String(req.teacherUser?.email || '').toLowerCase();
    const column = step === 'curriculum' ? 'curriculum_done_at' : 'guide_done_at';
    const { data, error } = await client.from('teacher_subjects')
      .update({ [column]: req.body?.done === false ? null : new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('teacher_email', email).eq('subject', subject).eq('status', 'training').select(STEP_COLUMNS).maybeSingle();
    if (error) { console.error('[university step]', error.message); return res.status(500).json({ error: 'Could not save.' }); }
    if (!data) return res.status(404).json({ error: 'Start this track first.' });
    return res.json({ row: data });
  });

  // Super admin: every teacher and subject.
  app.get('/api/dashboard/admin/university', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    const [{ data: teachers, error: tErr }, { data: rows, error: rErr }] = await Promise.all([
      client.from('teacher_accounts').select('email, display_name, display_name_ar, role, is_active').order('created_at', { ascending: true }),
      client.from('teacher_subjects').select(STEP_COLUMNS),
    ]);
    if (tErr || rErr) { console.error('[university admin]', (tErr || rErr)?.message); return res.status(500).json({ error: 'Could not load the university.' }); }
    return res.json({ subjects: UNIVERSITY_SUBJECTS, teachers: teachers || [], rows: rows || [] });
  });

  // Super admin: grant, remove, start a track, or record the test / the observed lesson.
  app.post('/api/dashboard/admin/university/:email/:subject', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const email = String(req.params.email || '').toLowerCase().trim();
    const subject = req.params.subject;
    const action = req.body?.action;
    if (!isSubject(subject) || !['license', 'revoke', 'start', 'test', 'observed'].includes(action)) return res.status(400).json({ error: 'Unknown action.' });
    const { data: teacher } = await client.from('teacher_accounts').select('email, display_name').eq('email', email).maybeSingle();
    if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 1000) || null : undefined;
    const now = new Date().toISOString();
    const admin = String(req.teacherUser?.email || '').toLowerCase();

    if (action === 'revoke') {
      const { error } = await client.from('teacher_subjects').delete().eq('teacher_email', email).eq('subject', subject);
      if (error) { console.error('[university revoke]', error.message); return res.status(500).json({ error: 'Could not remove the subject.' }); }
      return res.json({ row: null });
    }

    const { data: current } = await client.from('teacher_subjects').select(STEP_COLUMNS).eq('teacher_email', email).eq('subject', subject).maybeSingle();
    const patch: Record<string, any> = { updated_at: now };
    if (note !== undefined) patch.note = note;
    if (action === 'license') Object.assign(patch, { status: 'licensed', licensed_at: now, licensed_by: admin });
    if (action === 'start' && current) return res.status(409).json({ error: current.status === 'licensed' ? 'This teacher already teaches this subject.' : 'The track is already open.' });
    if (action === 'test') {
      const score = Number(req.body?.score);
      if (!Number.isInteger(score) || score < 0 || score > 100) return res.status(400).json({ error: 'The score is a whole number from 0 to 100.' });
      Object.assign(patch, { test_score: score, test_passed_at: req.body?.passed === false ? null : now });
    }
    if (action === 'observed') patch.observed_passed_at = req.body?.passed === false ? null : now;
    if (!current && (action === 'test' || action === 'observed')) return res.status(404).json({ error: 'Open the track first.' });

    const merged = { ...(current || {}), ...patch };
    const newlyLicensed = action !== 'license' && current?.status !== 'licensed' && earnsLicence(merged);
    if (newlyLicensed) Object.assign(patch, { status: 'licensed', licensed_at: now, licensed_by: admin });

    const { data, error } = current
      ? await client.from('teacher_subjects').update(patch).eq('teacher_email', email).eq('subject', subject).select(STEP_COLUMNS).single()
      : await client.from('teacher_subjects').insert({ teacher_email: email, subject, status: action === 'license' ? 'licensed' : 'training', ...patch }).select(STEP_COLUMNS).single();
    if (error) { console.error('[university admin action]', error.message); return res.status(500).json({ error: 'Could not save.' }); }

    if (action === 'license' || newlyLicensed) {
      const { data: profile } = await client.from('profiles').select('id').eq('email', email).maybeSingle();
      if (profile?.id) {
        await notifyUser(client, { userId: profile.id, email, staff: true }, {
          kind: 'university_licensed',
          title: { en: 'A new subject is yours', ar: 'مادة جديدة بقت بتاعتك' },
          body: { en: `You can now teach ${SUBJECT_NAMES[subject].en}. Masha Allah.`, ar: `تقدر دلوقتي تدرّس ${SUBJECT_NAMES[subject].ar}. ما شاء الله.` },
          link: '/dashboard/university',
        });
      }
    }
    return res.json({ row: data });
  });
}
