import express from 'express';
import { waitUntil } from '@vercel/functions';
import { notifyUser, notifySuperAdmins, resolveLearnerAccount } from '../notifications/inbox.js';
import { ensureTeacherThreads } from './community.js';
import { canTeach, NOT_LICENSED } from './university.js';
import { accountLearnerIds } from './growth.js';

/**
 * Changing a learner's teacher (docs/policies/TEACHER-CHANGE.md, owner 2026-11-10). Families and teachers ask; only the
 * super admin decides. On approval, lessons starting more than 3 hours from now are cancelled by the academy and come
 * back as lesson credit; lessons inside 3 hours stay with the previous teacher. The reason never reaches the previous
 * teacher, and the family is never told that a teacher asked.
 *
 * Also: the teacher's public profile (studies, certificates, experience, languages) for the "About this teacher" popup.
 */

export const REASON_TYPES = [
  'times', 'teacher_gender', 'level_subject', 'siblings', 'teacher_reasons', 'language',
  'fit', 'quality', 'learner_attendance', 'respect', 'safety', 'other'
] as const;
export type ReasonType = typeof REASON_TYPES[number];
const FAMILY_REASONS: ReasonType[] = ['times', 'teacher_gender', 'level_subject', 'siblings', 'language', 'fit', 'quality', 'safety', 'other'];
const TEACHER_REASONS: ReasonType[] = ['times', 'teacher_reasons', 'level_subject', 'learner_attendance', 'respect', 'safety', 'other'];
/** No-fault reasons are never counted on anyone's private record. */
export const NO_FAULT: ReasonType[] = ['times', 'teacher_gender', 'level_subject', 'siblings', 'teacher_reasons', 'language'];
const OPEN = ['open', 'talk', 'waitlist'];
const UPCOMING = ['pending', 'confirmed', 'rescheduled'];
const KEEP_WINDOW_MS = 3 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CANCEL_REASON = 'Teacher change: the academy moved this learner to another teacher.';

export function parseChangeRequest(body: any, initiator: 'family' | 'teacher'):
  { reasonType: ReasonType; note: string; preferredTeacherId: string | null; handoverNote: string | null } | { error: string } {
  const allowed = initiator === 'family' ? FAMILY_REASONS : TEACHER_REASONS;
  const reasonType = body?.reasonType;
  if (!allowed.includes(reasonType)) return { error: 'Choose a reason.' };
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (note.length < 3 || note.length > 1000) return { error: 'Write a short note (3 to 1000 characters).' };
  const preferred = typeof body?.preferredTeacherId === 'string' && UUID_RE.test(body.preferredTeacherId) ? body.preferredTeacherId : null;
  const handover = typeof body?.handoverNote === 'string' && body.handoverNote.trim() ? body.handoverNote.trim().slice(0, 1000) : null;
  return { reasonType, note, preferredTeacherId: initiator === 'family' ? preferred : null, handoverNote: initiator === 'teacher' ? handover : null };
}

export type BookingPlan = 'keep_soon' | 'keep_trial' | 'cancel_credit' | 'cancel_release' | 'cancel_balance';

/**
 * What the move does to one booked lesson with the previous teacher.
 * - starts within 3 hours: stays and is held as normal;
 * - free trial: stays with the previous teacher (the admin can move it with "Move lesson");
 * - package, pay-later or unpaid hold: cancelled; nothing was charged, so the package lesson is simply free again;
 * - paid single lesson: cancelled into a 1-lesson credit; paid fully from the balance: cancelled and the balance returns.
 */
export function planBooking(b: { scheduled_start: string; booking_type?: string | null; package_entitlement_id?: string | null; payment_plan?: string | null; status: string; fee_amount_usd?: number | string | null }, hasConfirmedPayment: boolean, now = Date.now()): BookingPlan {
  if (Date.parse(b.scheduled_start) - now < KEEP_WINDOW_MS) return 'keep_soon';
  if (b.booking_type === 'trial') return 'keep_trial';
  if (b.package_entitlement_id || b.payment_plan === 'pay_later' || b.status === 'pending') return 'cancel_release';
  return hasConfirmedPayment ? 'cancel_credit' : 'cancel_balance';
}

export interface PublicProfile { studies: string | null; credentials: string[]; experienceYears: number | null; languages: string[] }

export function sanitizeProfile(raw: any): PublicProfile {
  const text = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const list = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v : [])
    .map((x) => text(x, max)).filter((x): x is string => Boolean(x)).slice(0, n);
  const years = Number(raw?.experienceYears);
  return {
    studies: text(raw?.studies, 400),
    credentials: list(raw?.credentials, 8, 160),
    experienceYears: Number.isInteger(years) && years >= 0 && years <= 60 ? years : null,
    languages: list(raw?.languages, 6, 30)
  };
}

export interface TeacherChangeDeps {
  getClient: () => any;
  rateLimit: express.RequestHandler;
  verifyStudentAuth: express.RequestHandler;
  verifyTeacherAuth: express.RequestHandler;
  requireSuperAdmin: express.RequestHandler;
  resolveTeacher: (idOrEmail: string, client: any) => Promise<any>;
  listPublicTeachers: (client: any) => Promise<Array<{ id: string; nameEn: string; nameAr: string; photo: string | null; gender: string; subjects: string[] }>>;
  subjectFor: (interest: string) => string | null;
  reverseCheckoutDiscount: (client: any, kind: 'booking', id: string) => Promise<unknown>;
  processIntegrationJobs: (n: number, a?: any, bookingId?: string) => Promise<unknown>;
}

async function teacherNames(deps: TeacherChangeDeps, client: any, ids: string[]) {
  const map = new Map<string, { nameEn: string; nameAr: string; photo: string | null }>();
  for (const t of await deps.listPublicTeachers(client)) map.set(t.id, { nameEn: t.nameEn, nameAr: t.nameAr, photo: t.photo });
  for (const id of ids.filter((x) => x && !map.has(x))) {
    const t = await deps.resolveTeacher(id, client).catch(() => null);
    if (t) {
      const en = String(t.display_name || '').replace(/\s*\(.*\)\s*$/, '').trim();
      map.set(id, { nameEn: en, nameAr: String(t.display_name_ar || '').trim() || en, photo: t.photo_url || null });
    }
  }
  return map;
}

export function registerTeacherChangeRoutes(app: express.Express, deps: TeacherChangeDeps) {
  const { rateLimit, verifyStudentAuth, verifyTeacherAuth, requireSuperAdmin } = deps;

  // ---------- Teacher public profile ----------
  app.get('/api/dashboard/me/profile', verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const { data } = await client.from('teacher_accounts').select('public_profile').ilike('email', String(req.teacherUser?.email || '')).maybeSingle();
    res.json({ profile: sanitizeProfile(data?.public_profile) });
  });
  app.put('/api/dashboard/me/profile', rateLimit, verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const profile = sanitizeProfile(req.body?.profile);
    const { error } = await client.from('teacher_accounts').update({ public_profile: profile }).ilike('email', String(req.teacherUser?.email || ''));
    if (error) return res.status(500).json({ error: 'Could not save your profile.' });
    res.json({ profile });
  });

  // ---------- Family / learner ----------
  // The account's learners, each with their current teacher and the latest request.
  app.get('/api/student/teacher-change', verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      const userId = req.studentUser?.auth_id;
      if (!client || !userId) return res.json({ learners: [], teachers: [] });
      const ids = await accountLearnerIds(client, userId);
      if (!ids.length) return res.json({ learners: [], teachers: [] });
      const [{ data: rows }, { data: requests }] = await Promise.all([
        client.from('students').select('id, name, auth_user_id, booking_preference, learning_interest, assigned_teacher_id').in('id', ids),
        client.from('teacher_change_requests').select('id, student_id, status, reason_type, admin_message, created_at, decided_at, to_teacher_id').in('student_id', ids).order('created_at', { ascending: false })
      ]);
      // A parent who only follows their children is not a learner.
      const learners = (rows || []).filter((s: any) => !(s.auth_user_id === userId && s.booking_preference === 'child'));
      const names = await teacherNames(deps, client, learners.map((s: any) => s.assigned_teacher_id).filter(Boolean));
      const all = await deps.listPublicTeachers(client);
      res.json({
        learners: learners.map((s: any) => {
          const latest = (requests || []).find((r: any) => r.student_id === s.id) || null;
          const subject = deps.subjectFor(s.learning_interest || '');
          return {
            id: s.id,
            name: s.name,
            self: s.auth_user_id === userId,
            teacher: s.assigned_teacher_id ? { id: s.assigned_teacher_id, ...(names.get(s.assigned_teacher_id) || { nameEn: '', nameAr: '', photo: null }) } : null,
            request: latest && (OPEN.includes(latest.status) || Date.now() - Date.parse(latest.decided_at || latest.created_at) < 30 * 864e5)
              ? { id: latest.id, status: latest.status, message: latest.status === 'declined' || latest.status === 'waitlist' ? latest.admin_message : null }
              : null,
            // Teachers this learner could ask for: licensed for the subject, not the current one.
            options: all.filter((t) => t.id !== s.assigned_teacher_id && (!subject || t.subjects.includes(subject)))
              .map((t) => ({ id: t.id, nameEn: t.nameEn, nameAr: t.nameAr, photo: t.photo, gender: t.gender }))
          };
        })
      });
    } catch (err) {
      console.error('[GET /api/student/teacher-change]', err);
      res.status(500).json({ error: 'Could not load your teachers.' });
    }
  });

  app.post('/api/student/teacher-change', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      const userId = req.studentUser?.auth_id;
      if (!client || !userId) return res.status(503).json({ error: 'Database service unavailable.' });
      const studentId = String(req.body?.studentId || '');
      if (!(await accountLearnerIds(client, userId)).includes(studentId)) return res.status(404).json({ error: 'Learner not found.' });
      const parsed = parseChangeRequest(req.body, 'family');
      if ('error' in parsed) return res.status(400).json({ error: parsed.error });
      const { data: st } = await client.from('students').select('name, assigned_teacher_id').eq('id', studentId).maybeSingle();
      const { data: created, error } = await client.from('teacher_change_requests').insert({
        student_id: studentId, account_user_id: userId, from_teacher_id: st?.assigned_teacher_id || null,
        preferred_teacher_id: parsed.preferredTeacherId, initiator: 'family', initiator_user_id: userId,
        reason_type: parsed.reasonType, note: parsed.note
      }).select('id, status').single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'There is already a request for this learner. We will get back to you soon.' });
        throw error;
      }
      const urgent = parsed.reasonType === 'safety';
      waitUntil(notifySuperAdmins(client, {
        kind: urgent ? 'teacher_change_urgent' : 'teacher_change_request',
        title: urgent
          ? { en: 'Urgent: a family raised a safety or respect concern', ar: 'عاجل: أسرة بلّغت عن أمر يخص الأمان أو الاحترام' }
          : { en: 'A family asked to change teacher', ar: 'أسرة طلبت تغيير المعلم' },
        body: { en: `${st?.name || 'A learner'}: review it in Teacher changes.`, ar: `${st?.name || 'طالب'}: راجع الطلب في «تغيير المعلم».` },
        link: '/dashboard/teacher-changes'
      }, { email: true }));
      res.status(201).json({ request: created });
    } catch (err) {
      console.error('[POST /api/student/teacher-change]', err);
      res.status(500).json({ error: 'Could not send your request. Please try again.' });
    }
  });

  app.post('/api/student/teacher-change/:id/withdraw', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    const userId = req.studentUser?.auth_id;
    if (!client || !userId) return res.status(503).json({ error: 'Database service unavailable.' });
    const ids = await accountLearnerIds(client, userId);
    const { data, error } = await client.from('teacher_change_requests')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', req.params.id).in('student_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).in('status', OPEN).select('id');
    if (error) return res.status(500).json({ error: 'Could not withdraw the request.' });
    if (!data?.length) return res.status(404).json({ error: 'Request not found.' });
    res.json({ success: true });
  });

  // ---------- Teacher: hand a learner over ----------
  app.post('/api/dashboard/teacher-change', rateLimit, verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const studentId = String(req.body?.studentId || '');
      const { data: st } = UUID_RE.test(studentId)
        ? await client.from('students').select('id, name, assigned_teacher_id').eq('id', studentId).maybeSingle()
        : { data: null };
      if (!st || st.assigned_teacher_id !== req.teacherUser?.id) return res.status(404).json({ error: 'This learner is not one of your students.' });
      const parsed = parseChangeRequest(req.body, 'teacher');
      if ('error' in parsed) return res.status(400).json({ error: parsed.error });
      const account = await resolveLearnerAccount(client, studentId);
      const { error } = await client.from('teacher_change_requests').insert({
        student_id: studentId, account_user_id: account.userId, from_teacher_id: st.assigned_teacher_id,
        initiator: 'teacher', initiator_user_id: req.teacherUser.id, reason_type: parsed.reasonType,
        note: parsed.note, handover_note: parsed.handoverNote
      });
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'A request for this learner is already with the academy.' });
        throw error;
      }
      waitUntil(notifySuperAdmins(client, {
        kind: parsed.reasonType === 'safety' ? 'teacher_change_urgent' : 'teacher_change_request',
        title: parsed.reasonType === 'safety'
          ? { en: 'Urgent: a teacher raised a safety or respect concern', ar: 'عاجل: معلم بلّغ عن أمر يخص الأمان أو الاحترام' }
          : { en: 'A teacher asked to hand over a learner', ar: 'معلم طلب تسليم طالب' },
        body: { en: `${st.name}: review it in Teacher changes.`, ar: `${st.name}: راجع الطلب في «تغيير المعلم».` },
        link: '/dashboard/teacher-changes'
      }, { email: true }));
      res.status(201).json({ success: true });
    } catch (err) {
      console.error('[POST /api/dashboard/teacher-change]', err);
      res.status(500).json({ error: 'Could not send the request. Please try again.' });
    }
  });

  // ---------- Super admin ----------
  app.get('/api/dashboard/admin/teacher-change', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const { data: rows } = await client.from('teacher_change_requests').select('*').order('created_at', { ascending: false }).limit(200);
      const list = rows || [];
      const studentIds = [...new Set(list.map((r: any) => r.student_id))];
      const { data: students } = studentIds.length ? await client.from('students').select('id, name, learning_interest').in('id', studentIds) : { data: [] };
      const sById = new Map((students || []).map((s: any) => [s.id, s]));
      const names = await teacherNames(deps, client, list.flatMap((r: any) => [r.from_teacher_id, r.to_teacher_id, r.preferred_teacher_id]).filter(Boolean));
      const name = (id: string | null) => (id ? names.get(id)?.nameEn || null : null);
      const since = Date.now() - 90 * 864e5;
      res.json({
        requests: list.map((r: any) => ({
          ...r,
          studentName: (sById.get(r.student_id) as any)?.name || null,
          subject: (sById.get(r.student_id) as any)?.learning_interest || null,
          fromName: name(r.from_teacher_id), toName: name(r.to_teacher_id), preferredName: name(r.preferred_teacher_id),
          // Private counters (admin only): two approved moves in 90 days means a call before a third.
          recentMoves: list.filter((x: any) => x.student_id === r.student_id && x.status === 'approved' && Date.parse(x.decided_at || x.created_at) > since).length,
          teacherQualityMoves: list.filter((x: any) => x.from_teacher_id && x.from_teacher_id === r.from_teacher_id && x.status === 'approved' && x.reason_type === 'quality').length
        })),
        teachers: (await deps.listPublicTeachers(client)).map((t) => ({ id: t.id, nameEn: t.nameEn, nameAr: t.nameAr, subjects: t.subjects }))
      });
    } catch (err) {
      console.error('[GET /api/dashboard/admin/teacher-change]', err);
      res.status(500).json({ error: 'Could not load the requests.' });
    }
  });

  app.post('/api/dashboard/admin/teacher-change/:id/decide', rateLimit, verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const action = req.body?.action;
      if (!['approve', 'talk', 'waitlist', 'decline'].includes(action)) return res.status(400).json({ error: 'Choose what to do.' });
      const { data: request } = await client.from('teacher_change_requests').select('*').eq('id', req.params.id).maybeSingle();
      if (!request) return res.status(404).json({ error: 'Request not found.' });
      if (!OPEN.includes(request.status)) return res.status(409).json({ error: 'This request is already decided.' });
      const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 500) : '';
      const now = new Date().toISOString();
      const { data: student } = await client.from('students').select('id, name, learning_interest, assigned_teacher_id').eq('id', request.student_id).maybeSingle();
      if (!student) return res.status(404).json({ error: 'Learner not found.' });
      const account = request.account_user_id ? { userId: request.account_user_id } : await resolveLearnerAccount(client, student.id);

      if (action !== 'approve') {
        if ((action === 'decline' || action === 'waitlist') && message.length < 3) return res.status(400).json({ error: 'Write a short message for the family.' });
        await client.from('teacher_change_requests').update({
          status: action === 'decline' ? 'declined' : action, admin_message: message || null,
          decided_by: req.teacherUser.id, decided_at: action === 'decline' ? now : null, updated_at: now
        }).eq('id', request.id);
        if (account.userId && action !== 'talk' && request.initiator === 'family') {
          waitUntil(notifyUser(client, { userId: account.userId }, {
            kind: 'teacher_change_update',
            title: action === 'decline'
              ? { en: `About ${student.name}'s teacher`, ar: `بخصوص معلم ${student.name}` }
              : { en: `We are finding the right teacher for ${student.name}`, ar: `بندوّر على المعلم المناسب لـ${student.name}` },
            body: { en: message, ar: message },
            link: '/student/account?tab=teacher'
          }));
        }
        return res.json({ success: true });
      }

      // Approve: pick a licensed, active teacher.
      const toId = String(req.body?.toTeacherId || '');
      const to = UUID_RE.test(toId) ? await deps.resolveTeacher(toId, client) : null;
      if (!to || !to.is_active || !['teacher', 'super_admin'].includes(to.role)) return res.status(400).json({ error: 'Choose an active teacher.' });
      if (to.id === student.assigned_teacher_id) return res.status(400).json({ error: 'This is already the learner\'s teacher.' });
      if (!(await canTeach(client, to.email, student.learning_interest))) {
        return res.status(409).json({ code: NOT_LICENSED.code, error: "This teacher does not hold this learner's subject yet. Grant it in Watazawwado University first." });
      }
      const fromId = student.assigned_teacher_id || request.from_teacher_id || null;

      // Booked lessons with any other teacher.
      const { data: bookings } = await client.from('bookings')
        .select('id, scheduled_start, booking_type, package_entitlement_id, payment_plan, status, fee_amount_usd, teacher_id')
        .eq('student_id', student.id).in('status', UPCOMING).gt('scheduled_start', now).neq('teacher_id', to.id);
      const outcome: Record<BookingPlan | 'failed', string[]> = { keep_soon: [], keep_trial: [], cancel_credit: [], cancel_release: [], cancel_balance: [], failed: [] };
      for (const b of bookings || []) {
        const { count: paid } = await client.from('payments').select('id', { count: 'exact', head: true }).eq('booking_id', b.id).eq('status', 'confirmed');
        const plan = planBooking(b, Boolean(paid));
        try {
          if (plan === 'cancel_credit') {
            if (!account.userId) throw new Error('No account to hold the credit.');
            const { data: result, error } = await client.rpc('student_cancel_paid_lesson_to_credit', { p_booking_id: b.id, p_purchaser_account_id: account.userId, p_reason: CANCEL_REASON });
            if (error) throw error;
            // The academy cancelled: this credit never counts toward the refund limit (RULES.md §5).
            if (result?.creditId) {
              const { data: ent } = await client.from('package_entitlements').select('metadata').eq('id', result.creditId).maybeSingle();
              await client.from('package_entitlements').update({ metadata: { ...(ent?.metadata || {}), platform_cancel: true, teacher_change_request_id: request.id } }).eq('id', result.creditId);
            }
          } else if (plan === 'cancel_release' || plan === 'cancel_balance') {
            const { data: done, error } = await client.from('bookings').update({ status: 'cancelled', cancellation_reason: CANCEL_REASON, updated_at: now })
              .eq('id', b.id).in('status', UPCOMING).select('id');
            if (error) throw error;
            if (!done?.length) throw new Error('changed meanwhile');
            if (plan === 'cancel_balance') await deps.reverseCheckoutDiscount(client, 'booking', b.id);
            await client.from('reminders').update({ status: 'cancelled', updated_at: now }).eq('booking_id', b.id).eq('status', 'pending');
            const { error: jobErr } = await client.from('integration_jobs').insert({ booking_id: b.id, job_type: 'booking_cancel', status: 'pending' });
            if (jobErr && jobErr.code !== '23505') console.warn('[teacher change] job enqueue failed:', jobErr.message);
          }
          outcome[plan].push(b.id);
          if (plan.startsWith('cancel')) waitUntil(deps.processIntegrationJobs(1, undefined, b.id).catch(() => {}));
        } catch (err: any) {
          console.warn('[teacher change] booking left as is', b.id, err?.message);
          outcome.failed.push(b.id);
        }
      }

      const { error: assignErr } = await client.from('students').update({ assigned_teacher_id: to.id, updated_at: now }).eq('id', student.id);
      if (assignErr) return res.status(500).json({ error: 'Could not change the teacher.', outcome });
      await client.from('teacher_change_requests').update({
        status: 'approved', to_teacher_id: to.id, from_teacher_id: fromId, decided_by: req.teacherUser.id, decided_at: now,
        admin_message: message || null, outcome, updated_at: now
      }).eq('id', request.id);

      const credits = outcome.cancel_credit.length + outcome.cancel_release.length + outcome.cancel_balance.length;
      waitUntil((async () => {
        try {
          if (account.userId) {
            await ensureTeacherThreads(client, account.userId, [to.id]);
            await client.from('chat_threads').update({ closed_at: null }).eq('kind', 'lesson').eq('owner_user_id', account.userId).eq('teacher_id', to.id);
            // The chat with the previous teacher becomes read-only unless a sibling still learns with them.
            if (fromId) {
              const ids = await accountLearnerIds(client, account.userId);
              const { count: stillWith } = await client.from('students').select('id', { count: 'exact', head: true }).in('id', ids).eq('assigned_teacher_id', fromId);
              if (!stillWith) await client.from('chat_threads').update({ closed_at: now }).eq('kind', 'lesson').eq('owner_user_id', account.userId).eq('teacher_id', fromId);
            }
          }
          const toName = String(to.display_name || '').replace(/\s*\(.*\)\s*$/, '').trim();
          if (account.userId) {
            await notifyUser(client, { userId: account.userId }, {
              kind: 'teacher_changed',
              title: { en: `${student.name}'s new teacher: ${toName}`, ar: `معلم ${student.name} الجديد: ${to.display_name_ar || toName}` },
              body: credits
                ? { en: `Booked lessons with the previous teacher came back to your balance (${credits}). Pick ${toName}'s free times when you are ready.`, ar: `الحصص اللي كانت محجوزة رجعت رصيد عندك (${credits}). اختار مواعيد ${to.display_name_ar || toName} الفاضية وقت ما تحب.` }
                : { en: `New bookings go to ${toName}. The chat with them is open.`, ar: `الحجوزات الجديدة هتكون مع ${to.display_name_ar || toName}، والمحادثة معاه مفتوحة.` },
              link: '/student/book'
            }, { email: true });
          }
          await notifyUser(client, { userId: to.id, staff: true }, {
            kind: 'student_assigned',
            title: { en: `${student.name} joins your students`, ar: `${student.name} انضم لطلابك` },
            body: request.handover_note
              ? { en: `Their file and notes are with you. A note from their previous teacher: ${request.handover_note}`, ar: `ملفه وملاحظاته عندك. ملاحظة من معلمه السابق: ${request.handover_note}` }
              : { en: 'Their file, level and notes from past lessons are with you. The chat is open.', ar: 'ملفه ومستواه وملاحظات الحصص اللي فاتت عندك، والمحادثة مفتوحة.' },
            link: '/dashboard/students'
          });
          // Never the reason; never "left".
          if (fromId && fromId !== to.id) {
            await notifyUser(client, { userId: fromId, staff: true }, {
              kind: 'student_moved',
              title: { en: `${student.name} is continuing with another teacher`, ar: `${student.name} هيكمل مع معلم تاني` },
              body: { en: 'Thank you for the lessons you gave them. Your notes stay in their file, so their progress continues.', ar: 'شكرًا على الحصص اللي إدّيتها له. ملاحظاتك فاضلة في ملفه، فتقدّمه هيكمل.' },
              link: '/dashboard/students'
            });
          }
        } catch (err) {
          console.warn('[teacher change] notices failed', err);
        }
      })());

      res.json({ success: true, outcome });
    } catch (err) {
      console.error('[POST /api/dashboard/admin/teacher-change/:id/decide]', err);
      res.status(500).json({ error: 'Could not save the decision.' });
    }
  });
}
