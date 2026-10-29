import express from 'express';
import {
  boardGroupFor, buildClassBoard, chooseDisplayName, consentKindFor, firstNameOf, honorPostText, nextHonorStatus,
  toHallEntry, type BoardMember, type HonorAction, type HonorStatus
} from '../community/community.js';
import { collectAttendedLessons, computeLessonsAttended, computeWeeklyRhythm, isUuid, normalizeSubjectSlug, resolveSubjectMeta } from './progress.js';
import { ageGroupFor } from '../../src/student/components/achievements/achievements.js';
import { notifyUser, notifySuperAdmins, resolveLearnerAccount } from '../notifications/inbox.js';

/**
 * Community layer routes (plan: docs/superpowers/plans/2026-10-29-community-honor.md).
 * - Signed-in families and students only (a closed community, owner 2026-10-29): GET /api/student/community/hall,
 *   published entries with the name the family chose. Nothing about it is public; the public /community page only
 *   describes the community.
 * - Family: /api/student/community, decide on a Hall of Honor entry, withdraw it, join or leave the class board.
 * - Super admin: /api/dashboard/honor, put a milestone forward, record a consent given elsewhere, take an entry down.
 * - Teacher: GET /api/dashboard/class-board, their learners' effort and who joined the board.
 * The rules themselves live in server/community/community.ts.
 */

type Middleware = (req: any, res: any, next: any) => any;
type Learner = { id: string; name: string; learnerType: string; isPrimary: boolean };

const SITE_URL = 'https://watazawwado.academy';
const STUDENT_COLUMNS = 'id, name, age, learner_type, gender, assigned_teacher_id, timezone, learning_interest, status';
const MILESTONE_COLUMNS = 'id, student_id, subject, kind, title_en, title_ar, reached_at';

function subjectOf(slug: string | null | undefined) {
  const norm = normalizeSubjectSlug(slug);
  if (!norm) return null;
  const meta = resolveSubjectMeta(norm);
  return { id: meta.id, en: meta.en, ar: meta.ar, color: meta.familyColor };
}

/** Lessons this month and the current weekly rhythm for each learner, counted like the progress page. */
async function effortFor(client: any, students: any[]): Promise<Map<string, { lessonsThisMonth: number; rhythm: number }>> {
  const out = new Map<string, { lessonsThisMonth: number; rhythm: number }>();
  const ids = students.map((s) => s.id);
  if (ids.length === 0) return out;
  const [{ data: bookings }, { data: sessions }] = await Promise.all([
    client.from('bookings').select('id, student_id, service_id, status, scheduled_start, created_at').in('student_id', ids).eq('status', 'completed').limit(5000),
    client.from('lesson_sessions').select('id, booking_id, student_id, lesson_date, attendance, completion_status, created_at').in('student_id', ids).limit(5000)
  ]);
  for (const s of students) {
    const tz = s.timezone || 'UTC';
    const lessons = collectAttendedLessons(
      (bookings || []).filter((b: any) => b.student_id === s.id),
      (sessions || []).filter((x: any) => x.student_id === s.id),
      normalizeSubjectSlug(s.learning_interest) || 'quran-reading'
    );
    const dates = lessons.map((l) => l.dateIso);
    out.set(s.id, { lessonsThisMonth: computeLessonsAttended(dates, tz).thisMonth, rhythm: computeWeeklyRhythm(dates, tz).current });
  }
  return out;
}

export function registerHonorRoutes(app: express.Express, deps: {
  getClient: () => any;
  rateLimit: Middleware;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  getLearners: (client: any, req: any) => Promise<Learner[]>;
}) {
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };

  /** The learner this account may act for, with who decides; null after sending 403/404. */
  async function familyLearner(client: any, req: any, res: any, learnerId: string) {
    const learners = await deps.getLearners(client, req);
    const learner = learners.find((l) => l.id === learnerId);
    if (!learner || !isUuid(learnerId)) {
      res.status(403).json({ error: 'You can only manage learners in your own family.' });
      return null;
    }
    const { data: student } = await client.from('students').select(STUDENT_COLUMNS).eq('id', learnerId).maybeSingle();
    if (!student) {
      res.status(404).json({ error: 'Learner not found.' });
      return null;
    }
    let guardianLinked = false;
    const email = String(req.studentUser?.email || '').trim().toLowerCase();
    if (learner.isPrimary && email) {
      const { data: g } = await client.from('guardians').select('parent_email').eq('student_id', learnerId);
      guardianLinked = (g || []).some((row: any) => String(row.parent_email || '').trim().toLowerCase() === email);
    }
    const consentKind = consentKindFor({ isPrimary: learner.isPrimary, learnerType: student.learner_type, age: student.age, guardianLinked });
    return { learner, student, consentKind };
  }

  // Signed-in accounts only: the Hall of Honor.
  app.get('/api/student/community/hall', deps.verifyStudentAuth, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data: entries, error } = await client.from('honor_entries')
        .select('id, milestone_id, display_name, published_at, status')
        .eq('status', 'published').order('published_at', { ascending: false }).limit(120);
      if (error) throw error;
      const ids = (entries || []).map((e: any) => e.milestone_id);
      const { data: milestones } = ids.length
        ? await client.from('learner_milestones').select('id, subject, kind, title_en, title_ar').in('id', ids)
        : { data: [] };
      const byId = new Map((milestones || []).map((m: any) => [m.id, m]));
      const list = (entries || [])
        .map((e: any) => {
          const m: any = byId.get(e.milestone_id) || null;
          return toHallEntry(e, m, m ? subjectOf(m.subject) : null);
        })
        .filter(Boolean);
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({ entries: list });
    } catch (err) {
      console.error('[GET /api/student/community/hall]', err);
      res.status(500).json({ error: 'Could not load the Hall of Honor.' });
    }
  });

  // Family: what is waiting for them, and the class board.
  app.get('/api/student/community', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const learnerId = typeof req.query.learnerId === 'string' && req.query.learnerId.trim()
      ? req.query.learnerId.trim()
      : req.studentUser?.student_id || '';
    try {
      const ctx = await familyLearner(client, req, res, learnerId); if (!ctx) return;
      const { student, consentKind } = ctx;
      const [{ data: entries }, { data: member }] = await Promise.all([
        client.from('honor_entries').select('id, milestone_id, status, display_name, published_at')
          .eq('student_id', student.id).neq('status', 'removed').order('nominated_at', { ascending: false }),
        client.from('class_board_members').select('display_name, joined_at').eq('student_id', student.id).maybeSingle()
      ]);
      const mIds = (entries || []).map((e: any) => e.milestone_id);
      const { data: milestones } = mIds.length
        ? await client.from('learner_milestones').select(MILESTONE_COLUMNS).in('id', mIds)
        : { data: [] };
      const mById = new Map((milestones || []).map((m: any) => [m.id, m]));
      const honor = (entries || []).map((e: any) => {
        const m: any = mById.get(e.milestone_id);
        return {
          id: e.id, status: e.status, displayName: e.display_name, publishedAt: e.published_at,
          milestone: m ? { titleEn: m.title_en, titleAr: m.title_ar, kind: m.kind, reachedAt: m.reached_at } : null
        };
      });

      let board: ReturnType<typeof buildClassBoard> = null;
      let waitingForMore = false;
      const group = boardGroupFor(student);
      if (member && group) {
        const { data: classmates } = await client.from('students').select(STUDENT_COLUMNS)
          .eq('assigned_teacher_id', student.assigned_teacher_id).eq('status', 'active');
        const sameGroup = (classmates || []).filter((s: any) => boardGroupFor(s) === group);
        const { data: joined } = sameGroup.length
          ? await client.from('class_board_members').select('student_id, display_name').in('student_id', sameGroup.map((s: any) => s.id))
          : { data: [] };
        const joinedById = new Map((joined || []).map((j: any) => [j.student_id, j.display_name]));
        const onBoard = sameGroup.filter((s: any) => joinedById.has(s.id));
        if (!onBoard.some((s: any) => s.id === student.id)) onBoard.push(student);
        const effort = await effortFor(client, onBoard);
        const members: BoardMember[] = onBoard.map((s: any) => ({
          studentId: s.id,
          displayName: (joinedById.get(s.id) as string) || member.display_name,
          lessonsThisMonth: effort.get(s.id)?.lessonsThisMonth || 0,
          rhythm: effort.get(s.id)?.rhythm || 0
        }));
        board = buildClassBoard(members, student.id);
        waitingForMore = board === null;
      }

      res.json({
        learner: { id: student.id, firstName: firstNameOf(student.name) },
        canDecide: consentKind !== null,
        decidesAs: consentKind,
        honor,
        classBoard: { available: Boolean(group), joined: Boolean(member), displayName: member?.display_name || null, rows: board, waitingForMore }
      });
    } catch (err) {
      console.error('[GET /api/student/community]', err);
      res.status(500).json({ error: 'Could not load this page.' });
    }
  });

  async function loadEntry(client: any, id: string) {
    if (!isUuid(id)) return null;
    const { data } = await client.from('honor_entries').select('id, milestone_id, student_id, status, display_name').eq('id', id).maybeSingle();
    return data || null;
  }

  /** Moves an entry only if nobody changed it in the meantime. */
  async function moveEntry(client: any, entry: any, action: HonorAction, patch: Record<string, unknown>) {
    const next = nextHonorStatus(entry.status as HonorStatus, action);
    if (!next) return { ok: false as const, next: null };
    const now = new Date().toISOString();
    const row: Record<string, unknown> = { ...patch, status: next, updated_at: now };
    if (next === 'published') row.published_at = now;
    const { data, error } = await client.from('honor_entries').update(row).eq('id', entry.id).eq('status', entry.status).select('id');
    if (error) throw error;
    return { ok: Boolean(data && data.length), next };
  }

  // Family: yes (with the name to show) or no.
  app.post('/api/student/community/honor/:id/decision', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      const ctx = await familyLearner(client, req, res, entry.student_id); if (!ctx) return;
      if (!ctx.consentKind) return res.status(403).json({ error: 'Our team will ask the parent or guardian about this one.' });
      const yes = req.body?.decision === 'yes';
      if (!yes && req.body?.decision !== 'no') return res.status(400).json({ error: 'Choose yes or no.' });
      let patch: Record<string, unknown> = { decided_by: req.studentUser?.auth_id || null, decided_at: new Date().toISOString(), consent_kind: ctx.consentKind, consent_note: null };
      if (yes) {
        const name = chooseDisplayName(req.body?.nameChoice, req.body?.customName, ctx.student.name);
        if (!name.ok) return res.status(400).json({ error: name.error });
        patch = { ...patch, display_name: name.name };
      }
      const moved = await moveEntry(client, entry, yes ? 'family_yes' : 'family_no', patch);
      if (!moved.ok) return res.status(409).json({ error: 'This was already answered. Refresh the page to see it.' });
      await notifySuperAdmins(client, {
        kind: 'honor_decision',
        title: yes
          ? { en: 'A family said yes to the Hall of Honor', ar: 'أسرة وافقت على لوحة الشرف' }
          : { en: 'A family chose to keep an achievement private', ar: 'أسرة فضّلت إن الإنجاز يفضل خاص' },
        body: yes
          ? { en: 'It is on the Hall of Honor now. You can copy the post text from the Hall of Honor page.', ar: 'ظهر على لوحة الشرف. تقدر تنسخ نص المنشور من صفحة لوحة الشرف.' }
          : { en: 'Nothing will be shown.', ar: 'مش هيظهر حاجة.' },
        link: '/dashboard/honor'
      });
      res.json({ status: moved.next });
    } catch (err) {
      console.error('[POST /api/student/community/honor/:id/decision]', err);
      res.status(500).json({ error: 'Could not save your choice.' });
    }
  });

  // Family: take it off the Hall of Honor. Anyone who manages the learner may, even where only the admin could say yes.
  app.post('/api/student/community/honor/:id/withdraw', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      const ctx = await familyLearner(client, req, res, entry.student_id); if (!ctx) return;
      const moved = await moveEntry(client, entry, 'family_withdraw', { decided_by: req.studentUser?.auth_id || null, decided_at: new Date().toISOString() });
      if (!moved.ok) return res.status(409).json({ error: 'This is not on the Hall of Honor.' });
      res.json({ status: moved.next });
    } catch (err) {
      console.error('[POST /api/student/community/honor/:id/withdraw]', err);
      res.status(500).json({ error: 'Could not take it down. Please try again.' });
    }
  });

  // Family: join or leave the class board.
  app.post('/api/student/community/class-board', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const learnerId = typeof req.body?.learnerId === 'string' ? req.body.learnerId.trim() : '';
    try {
      const ctx = await familyLearner(client, req, res, learnerId); if (!ctx) return;
      if (req.body?.join !== true) {
        const { error } = await client.from('class_board_members').delete().eq('student_id', learnerId);
        if (error) throw error;
        return res.json({ joined: false });
      }
      if (!ctx.consentKind) return res.status(403).json({ error: 'A parent or guardian needs to choose this from their account.' });
      if (!boardGroupFor(ctx.student)) return res.status(409).json({ error: 'The class board opens once a teacher is assigned.' });
      const name = chooseDisplayName(req.body?.nameChoice, req.body?.customName, ctx.student.name);
      if (!name.ok) return res.status(400).json({ error: name.error });
      const { error } = await client.from('class_board_members').upsert({
        student_id: learnerId, display_name: name.name, consent_kind: ctx.consentKind,
        consented_by: req.studentUser?.auth_id || null, joined_at: new Date().toISOString()
      }, { onConflict: 'student_id' });
      if (error) throw error;
      res.json({ joined: true, displayName: name.name });
    } catch (err) {
      console.error('[POST /api/student/community/class-board]', err);
      res.status(500).json({ error: 'Could not save your choice.' });
    }
  });

  // Admin: entries and recent milestones that could be put forward.
  app.get('/api/dashboard/honor', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const since = new Date(Date.now() - 180 * 86_400_000).toISOString();
      const [{ data: entries, error: eErr }, { data: recent, error: mErr }] = await Promise.all([
        client.from('honor_entries').select('id, milestone_id, student_id, status, display_name, consent_kind, consent_note, decided_at, published_at, nominated_at')
          .order('nominated_at', { ascending: false }).limit(300),
        client.from('learner_milestones').select(MILESTONE_COLUMNS).gte('reached_at', since).order('reached_at', { ascending: false }).limit(300)
      ]);
      if (eErr || mErr) throw eErr || mErr;
      const nominated = new Set((entries || []).map((e: any) => e.milestone_id));
      const mIds = [...new Set([...(entries || []).map((e: any) => e.milestone_id)])].filter((id) => !(recent || []).some((m: any) => m.id === id));
      const { data: older } = mIds.length ? await client.from('learner_milestones').select(MILESTONE_COLUMNS).in('id', mIds) : { data: [] };
      const allMilestones = [...(recent || []), ...(older || [])];
      const mById = new Map(allMilestones.map((m: any) => [m.id, m]));
      const studentIds = [...new Set(allMilestones.map((m: any) => m.student_id))];
      const { data: students } = studentIds.length ? await client.from('students').select('id, name, learner_type, age').in('id', studentIds) : { data: [] };
      const sById = new Map((students || []).map((s: any) => [s.id, s]));
      const view = (m: any) => m && ({
        id: m.id, kind: m.kind, titleEn: m.title_en, titleAr: m.title_ar, reachedAt: m.reached_at, subject: subjectOf(m.subject),
        learnerName: (sById.get(m.student_id) as any)?.name || null,
        ageGroup: ageGroupFor((sById.get(m.student_id) as any)?.age, (sById.get(m.student_id) as any)?.learner_type)
      });
      res.json({
        entries: (entries || []).map((e: any) => {
          const m: any = mById.get(e.milestone_id);
          const pub = e.status === 'published' && m && e.display_name
            ? honorPostText({ name: e.display_name, titleEn: m.title_en, titleAr: m.title_ar }, SITE_URL)
            : null;
          return {
            id: e.id, status: e.status, displayName: e.display_name, consentKind: e.consent_kind, consentNote: e.consent_note,
            decidedAt: e.decided_at, publishedAt: e.published_at, nominatedAt: e.nominated_at, milestone: view(m), postText: pub
          };
        }),
        candidates: (recent || []).filter((m: any) => !nominated.has(m.id)).map(view)
      });
    } catch (err) {
      console.error('[GET /api/dashboard/honor]', err);
      res.status(500).json({ error: 'Could not load the Hall of Honor.' });
    }
  });

  // Admin: put a milestone forward. The family is asked; nothing is shown yet.
  app.post('/api/dashboard/honor/nominate', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const milestoneId = req.body?.milestoneId;
    if (!isUuid(milestoneId)) return res.status(400).json({ error: 'Choose a milestone.' });
    try {
      const { data: m } = await client.from('learner_milestones').select(MILESTONE_COLUMNS).eq('id', milestoneId).maybeSingle();
      if (!m) return res.status(404).json({ error: 'Milestone not found.' });
      const { data: row, error } = await client.from('honor_entries')
        .insert({ milestone_id: m.id, student_id: m.student_id, nominated_by: req.teacherUser?.id || null })
        .select('id').single();
      if (error) {
        if ((error as any).code === '23505') return res.status(409).json({ error: 'This milestone was already put forward.' });
        throw error;
      }
      const account = await resolveLearnerAccount(client, m.student_id);
      const first = firstNameOf(account.name);
      await notifyUser(client, account, {
        kind: 'honor_invite',
        title: { en: `May we celebrate ${first || 'this achievement'} on our Hall of Honor?`, ar: `تحبّوا نحتفل بإنجاز ${first || 'جديد'} في لوحة الشرف؟` },
        body: {
          en: `"${m.title_en}". MashaAllah. Only families and students of the academy see the Hall of Honor, inside their accounts. Nothing is shown unless you say yes, you choose the name, and you can take it down any time.`,
          ar: `«${m.title_ar}». ما شاء الله. لوحة الشرف بيشوفها أسر وطلاب الأكاديمية بس من جوه حساباتهم. مش هيظهر أي حاجة غير لو وافقتوا، وأنتم تختاروا الاسم، وتقدروا تشيلوه في أي وقت.`
        },
        link: `/student/community?learnerId=${encodeURIComponent(m.student_id)}`
      }, { email: true });
      res.status(201).json({ id: row.id, status: 'awaiting_consent' });
    } catch (err) {
      console.error('[POST /api/dashboard/honor/nominate]', err);
      res.status(500).json({ error: 'Could not put it forward.' });
    }
  });

  // Admin: the family answered on WhatsApp or by email. A note of how and when is required.
  app.post('/api/dashboard/honor/:id/record-consent', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      const yes = req.body?.decision === 'yes';
      if (!yes && req.body?.decision !== 'no') return res.status(400).json({ error: 'Choose yes or no.' });
      const note = String(req.body?.note || '').trim().slice(0, 500);
      if (note.length < 3) return res.status(400).json({ error: 'Write how and when the family answered.' });
      let patch: Record<string, unknown> = { consent_kind: 'admin_recorded', consent_note: note, decided_by: req.teacherUser?.id || null, decided_at: new Date().toISOString() };
      if (yes) {
        const { data: st } = await client.from('students').select('name').eq('id', entry.student_id).maybeSingle();
        const typed = String(req.body?.displayName || '').trim();
        const name = chooseDisplayName(typed ? 'custom' : 'first', typed, st?.name);
        if (!name.ok) return res.status(400).json({ error: name.error });
        patch = { ...patch, display_name: name.name };
      }
      const moved = await moveEntry(client, entry, yes ? 'admin_record_yes' : 'admin_record_no', patch);
      if (!moved.ok) return res.status(409).json({ error: 'The family already answered this one.' });
      res.json({ status: moved.next });
    } catch (err) {
      console.error('[POST /api/dashboard/honor/:id/record-consent]', err);
      res.status(500).json({ error: 'Could not save.' });
    }
  });

  // Admin: take an entry down (or withdraw the request). It stays off.
  app.post('/api/dashboard/honor/:id/remove', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      const moved = await moveEntry(client, entry, 'admin_remove', {});
      if (!moved.ok) return res.status(409).json({ error: 'This entry is not shown or waiting.' });
      res.json({ status: moved.next });
    } catch (err) {
      console.error('[POST /api/dashboard/honor/:id/remove]', err);
      res.status(500).json({ error: 'Could not take it down.' });
    }
  });

  // Teacher: their learners' effort and who joined the class board. The super admin may look at any teacher's.
  app.get('/api/dashboard/class-board', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const isAdmin = req.teacherUser?.role === 'super_admin';
    const teacherId = isAdmin && isUuid(req.query.teacherId) ? req.query.teacherId : req.teacherUser?.id;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const { data: students, error } = await client.from('students').select(STUDENT_COLUMNS).eq('assigned_teacher_id', teacherId).eq('status', 'active');
      if (error) throw error;
      const list = students || [];
      const { data: joined } = list.length
        ? await client.from('class_board_members').select('student_id, display_name').in('student_id', list.map((s: any) => s.id))
        : { data: [] };
      const joinedById = new Map((joined || []).map((j: any) => [j.student_id, j.display_name]));
      const effort = await effortFor(client, list);
      const groups = new Map<string, any>();
      for (const s of list) {
        const key = boardGroupFor(s)!;
        const ageGroup = ageGroupFor(s.age, s.learner_type);
        if (!groups.has(key)) groups.set(key, { key, ageGroup, gender: ageGroup === 'kids' ? null : (s.gender === 'male' || s.gender === 'female' ? s.gender : null), learners: [] });
        groups.get(key).learners.push({
          id: s.id, name: s.name, boardName: joinedById.get(s.id) || null,
          lessonsThisMonth: effort.get(s.id)?.lessonsThisMonth || 0, rhythm: effort.get(s.id)?.rhythm || 0
        });
      }
      const out = [...groups.values()].map((g) => {
        g.learners.sort((a: any, b: any) => b.lessonsThisMonth - a.lessonsThisMonth || b.rhythm - a.rhythm || String(a.name).localeCompare(String(b.name)));
        const onBoard = g.learners.filter((l: any) => l.boardName).length;
        return { ...g, onBoard, boardVisible: onBoard >= 3 };
      });
      res.json({ groups: out });
    } catch (err) {
      console.error('[GET /api/dashboard/class-board]', err);
      res.status(500).json({ error: 'Could not load the class board.' });
    }
  });
}
