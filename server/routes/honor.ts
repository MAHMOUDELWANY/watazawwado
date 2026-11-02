import crypto from 'node:crypto';
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

// CM-04 photos: a private bucket, images only; links last an hour (the hall is behind sign-in).
const PHOTO_BUCKET = 'honor-photos';
const PHOTO_LINK_SECONDS = 3600;
const PHOTO_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const newPhotoPath = (entryId: string, contentType: unknown) => {
  const ext = PHOTO_EXT[String(contentType || '').split(';')[0].trim().toLowerCase()];
  return ext && isUuid(entryId) ? `${entryId}/${crypto.randomUUID()}.${ext}` : null;
};
export const photoPathBelongsTo = (path: string, entryId: string) => /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(path) && path.startsWith(`${entryId}/`);

/** Deletes an entry's photo file and clears its photo fields (the family took it down, or the entry left the hall). */
export async function dropHonorPhoto(client: any, entryId: string) {
  const { data } = await client.from('honor_entries').select('photo_path').eq('id', entryId).maybeSingle();
  if (data?.photo_path) await client.storage.from(PHOTO_BUCKET).remove([data.photo_path]);
  await client.from('honor_entries').update({ photo_path: null, photo_status: null, photo_consent_at: null, photo_consent_by: null }).eq('id', entryId);
}

function subjectOf(slug: string | null | undefined) {
  const norm = normalizeSubjectSlug(slug);
  if (!norm) return null;
  const meta = resolveSubjectMeta(norm);
  return { id: meta.id, en: meta.en, ar: meta.ar, color: meta.familyColor };
}

/** Lessons this month and the current weekly rhythm for each learner, counted like the progress page. */
export async function effortFor(client: any, students: any[]): Promise<Map<string, { lessonsThisMonth: number; rhythm: number }>> {
  const out = new Map<string, { lessonsThisMonth: number; rhythm: number }>();
  const ids = students.map((s) => s.id);
  if (ids.length === 0) return out;
  // A failed query throws (the route answers 500) rather than showing zero effort for everyone.
  const [{ data: bookings, error: bErr }, { data: sessions, error: sErr }] = await Promise.all([
    client.from('bookings').select('id, student_id, service_id, status, scheduled_start, created_at').in('student_id', ids).eq('status', 'completed').limit(5000),
    client.from('lesson_sessions').select('id, booking_id, student_id, lesson_date, attendance, completion_status, created_at').in('student_id', ids).limit(5000)
  ]);
  if (bErr || sErr) throw bErr || sErr;
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
        .select('id, milestone_id, display_name, published_at, status, photo_path, photo_status')
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
        .filter(Boolean) as any[];
      // CM-04: approved photos get a short private link; everything else keeps the emblem.
      const withPhoto = (entries || []).filter((e: any) => e.photo_status === 'approved' && e.photo_path);
      if (withPhoto.length) {
        const { data: links } = await client.storage.from(PHOTO_BUCKET).createSignedUrls(withPhoto.map((e: any) => e.photo_path), PHOTO_LINK_SECONDS);
        const urlByPath = new Map((links || []).map((l: any) => [l.path, l.signedUrl]));
        for (const item of list) {
          const e: any = withPhoto.find((x: any) => x.id === item.id);
          if (e) item.photoUrl = urlByPath.get(e.photo_path) || null;
        }
      }
      // CM-04: family achievements the account holder chose to show.
      const { data: families } = await client.from('family_achievements').select('id, display_name, title_en, title_ar, published_at')
        .eq('status', 'published').order('published_at', { ascending: false }).limit(60);
      for (const fa of families || []) {
        list.push({ id: fa.id, name: fa.display_name, titleEn: fa.title_en, titleAr: fa.title_ar, kind: 'family', subject: null, month: String(fa.published_at).slice(0, 7), photoUrl: null });
      }
      list.sort((a: any, b: any) => String(b.month).localeCompare(String(a.month)));
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
        client.from('honor_entries').select('id, milestone_id, status, display_name, published_at, photo_status')
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
          id: e.id, status: e.status, displayName: e.display_name, publishedAt: e.published_at, photoStatus: e.photo_status || null,
          milestone: m ? { titleEn: m.title_en, titleAr: m.title_ar, kind: m.kind, reachedAt: m.reached_at } : null
        };
      });

      let board: ReturnType<typeof buildClassBoard> = null;
      let waitingForMore = false;
      const group = boardGroupFor(student);
      if (member && group) {
        const { data: classmates, error: cErr } = await client.from('students').select(STUDENT_COLUMNS)
          .eq('assigned_teacher_id', student.assigned_teacher_id).eq('status', 'active');
        if (cErr) throw cErr;
        const sameGroup = (classmates || []).filter((s: any) => boardGroupFor(s) === group);
        const { data: joined, error: jErr } = sameGroup.length
          ? await client.from('class_board_members').select('student_id, display_name').in('student_id', sameGroup.map((s: any) => s.id))
          : { data: [], error: null };
        if (jErr) throw jErr;
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
    const ok = Boolean(data && data.length);
    // A photo never outlives its place on the hall.
    if (ok && (next === 'withdrawn' || next === 'removed')) await dropHonorPhoto(client, entry.id);
    return { ok, next };
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

  // CM-04 photos. Family: a one-time upload link for a published entry's photo.
  app.post('/api/student/community/honor/:id/photo-url', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry || entry.status !== 'published') return res.status(404).json({ error: 'A photo can be added once the achievement is on the Hall of Honor.' });
      const ctx = await familyLearner(client, req, res, entry.student_id); if (!ctx) return;
      if (!ctx.consentKind || req.childDevice) return res.status(403).json({ error: 'Only the person who decides for this learner can add a photo.' });
      const path = newPhotoPath(entry.id, req.body?.contentType);
      if (!path) return res.status(400).json({ error: 'Use a JPG, PNG or WebP photo.' });
      const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message || 'no upload url');
      res.json({ path, token: data.token });
    } catch (err) {
      console.error('[POST honor photo-url]', err);
      res.status(500).json({ error: 'Could not start the upload.' });
    }
  });

  // Family: the upload finished; record it with the second consent. It shows only after our review.
  app.post('/api/student/community/honor/:id/photo', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry || entry.status !== 'published') return res.status(404).json({ error: 'Not found.' });
      const ctx = await familyLearner(client, req, res, entry.student_id); if (!ctx) return;
      if (!ctx.consentKind || req.childDevice) return res.status(403).json({ error: 'Only the person who decides for this learner can add a photo.' });
      if (req.body?.consent !== true) return res.status(400).json({ error: 'Please confirm you agree to show this photo.' });
      const path = String(req.body?.path || '');
      if (!photoPathBelongsTo(path, entry.id)) return res.status(403).json({ error: 'This photo is not for this achievement.' });
      const [folder, file] = path.split('/');
      const { data: found } = await client.storage.from(PHOTO_BUCKET).list(folder, { search: file, limit: 1 });
      if (!found?.some((x: any) => x.name === file)) return res.status(400).json({ error: 'The photo did not arrive. Please try again.' });
      const { data: old } = await client.from('honor_entries').select('photo_path').eq('id', entry.id).maybeSingle();
      if (old?.photo_path && old.photo_path !== path) await client.storage.from(PHOTO_BUCKET).remove([old.photo_path]);
      await client.from('honor_entries').update({
        photo_path: path, photo_status: 'pending', photo_consent_at: new Date().toISOString(),
        photo_consent_by: isUuid(req.studentUser?.auth_id) ? req.studentUser.auth_id : null, updated_at: new Date().toISOString()
      }).eq('id', entry.id);
      await notifySuperAdmins(client, {
        kind: 'honor_photo',
        title: { en: 'A Hall of Honor photo to review', ar: 'صورة للوحة الشرف مستنية مراجعة' },
        body: { en: 'A family added a photo to their achievement. It shows after you approve it.', ar: 'أسرة ضافت صورة لإنجازها، وهتظهر بعد ما توافق عليها.' },
        link: '/dashboard/honor'
      });
      res.json({ photoStatus: 'pending' });
    } catch (err) {
      console.error('[POST honor photo]', err);
      res.status(500).json({ error: 'Could not save the photo.' });
    }
  });

  // Family: take the photo off (the emblem shows again).
  app.post('/api/student/community/honor/:id/photo/remove', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      const ctx = await familyLearner(client, req, res, entry.student_id); if (!ctx) return;
      if (req.childDevice) return res.status(403).json({ error: 'Only the family account can do this.' });
      await dropHonorPhoto(client, entry.id);
      res.json({ photoStatus: null });
    } catch (err) {
      console.error('[POST honor photo remove]', err);
      res.status(500).json({ error: 'Could not remove the photo.' });
    }
  });

  // Super admin: photos waiting for review.
  app.get('/api/dashboard/honor/photos', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data: rows, error } = await client.from('honor_entries').select('id, display_name, photo_path, photo_consent_at')
        .eq('status', 'published').eq('photo_status', 'pending').not('photo_path', 'is', null).limit(50);
      if (error) throw error;
      const { data: links } = rows?.length ? await client.storage.from(PHOTO_BUCKET).createSignedUrls(rows.map((r: any) => r.photo_path), 600) : { data: [] };
      const urlByPath = new Map((links || []).map((l: any) => [l.path, l.signedUrl]));
      res.json({ photos: (rows || []).map((r: any) => ({ id: r.id, displayName: r.display_name, consentAt: r.photo_consent_at, path: r.photo_path, url: urlByPath.get(r.photo_path) || null })) });
    } catch (err) {
      console.error('[GET honor photos]', err);
      res.status(500).json({ error: 'Could not load the photos.' });
    }
  });

  // Super admin: approve a photo, or reject it (the file is deleted and the family is told kindly).
  app.post('/api/dashboard/honor/:id/photo', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const entry = await loadEntry(client, req.params.id);
      if (!entry) return res.status(404).json({ error: 'Not found.' });
      const approve = req.body?.decision === 'approve';
      // Only the photo the admin actually looked at: if the family swapped it meanwhile, nothing changes.
      const reviewedPath = String(req.body?.path || '');
      if (approve) {
        const { data } = await client.from('honor_entries').update({ photo_status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', entry.id).eq('photo_status', 'pending').eq('photo_path', reviewedPath).select('id').maybeSingle();
        if (!data) return res.status(409).json({ error: 'This photo changed or is not waiting for review. Reload the page.' });
      } else {
        const { data: cur } = await client.from('honor_entries').select('photo_path').eq('id', entry.id).maybeSingle();
        if (!reviewedPath || cur?.photo_path !== reviewedPath) return res.status(409).json({ error: 'This photo changed. Reload the page.' });
        await dropHonorPhoto(client, entry.id);
      }
      const account = await resolveLearnerAccount(client, entry.student_id);
      if (account.userId) {
        await notifyUser(client, { userId: account.userId }, approve
          ? { kind: 'honor_photo_ok', title: { en: 'Your photo is on the Hall of Honor', ar: 'صورتكم ظهرت في لوحة الشرف' }, body: { en: 'You can take it off any time from Our community.', ar: 'تقدروا تشيلوها في أي وقت من صفحة مجتمعنا.' }, link: '/student/community' }
          : { kind: 'honor_photo_no', title: { en: 'About your Hall of Honor photo', ar: 'بخصوص صورة لوحة الشرف' }, body: { en: 'We could not use this photo, so the emblem stays. You can try another one.', ar: 'معرفناش نستخدم الصورة دي، فالشعار هيفضل. تقدروا تجربوا صورة تانية.' }, link: '/student/community' });
      }
      res.json({ photoStatus: approve ? 'approved' : null });
    } catch (err) {
      console.error('[POST honor photo review]', err);
      res.status(500).json({ error: 'Could not save.' });
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
      const { data: joined, error: jErr } = list.length
        ? await client.from('class_board_members').select('student_id, display_name').in('student_id', list.map((s: any) => s.id))
        : { data: [], error: null };
      if (jErr) throw jErr;
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
