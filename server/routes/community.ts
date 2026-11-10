/**
 * Inbox, chat, AI placement test and the teacher AI assistant (owner request 2026-10-16).
 *
 * - Inbox: on-site notifications for any signed-in account (user_notifications).
 * - Chat (text only): every account has a pinned 'support' thread with the super admin;
 *   a student account gets a 'lesson' thread with its assigned teacher (opened at sign-up) and
 *   with each teacher they have booked with.
 *   The super admin can read and write in every thread.
 * - Placement test: built from fixed bilingual question banks (server/placement) for the subject and
 *   level chosen at onboarding, shuffled per learner; the server keeps the answers, grades it, and
 *   the super admin replies.
 *   It is taken after booking (owner decision 2026-10-16); it never blocks a booking.
 * - Teacher assistant: first version of the AI helper in the teacher workspace.
 * All tables are server-only; every route checks who is asking.
 */
import type express from 'express';
import { GoogleGenAI } from '@google/genai';
import { parseModelJson } from '../intake/intakeService.js';
import { notifyUser, notifySuperAdmins } from '../notifications/inbox.js';
import { sendPushToUser } from '../notifications/push.js';
import { resolveEmailLanguage } from '../notifications/dispatcher.js';
import { canTeacherAccessStudent } from './progress.js';
import { BANKS, LEVELS, LADDERS, buildPlacementTest, rungQuestions, ladderClimb, suggestLevel, skillSummary, normalizeQuestions, type Level, type TestQuestion } from '../placement/index.js';

type Mw = (req: any, res: any, next: any) => any;

export interface CommunityDeps {
  getClient: () => any;
  rateLimit: Mw;
  verifyStudentAuth: Mw;
  verifyTeacherAuth: Mw;
  requireSuperAdmin: Mw;
  /** Learners this student account may act for (self and/or children). */
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string; learnerType: string; isPrimary: boolean }>>;
}

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const MAX_MESSAGE = 2000;

type Actor = { userId: string; email: string; role: 'student' | 'teacher' | 'admin'; name: string };

/** Who is calling: a teacher/admin (teacher_accounts) or a student account. */
async function resolveActor(client: any, req: any): Promise<Actor | null> {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await client.auth.getUser(token);
  const user = data?.user;
  if (error || !user?.id) return null;
  const email = String(user.email || '').toLowerCase();
  const { data: staff } = await client.from('teacher_accounts').select('role, is_active, display_name').eq('email', email).maybeSingle();
  if (staff?.is_active) {
    return { userId: user.id, email, role: staff.role === 'super_admin' ? 'admin' : 'teacher', name: staff.display_name || email };
  }
  const { data: st } = await client.from('students').select('name').eq('auth_user_id', user.id).maybeSingle();
  return { userId: user.id, email, role: 'student', name: st?.name || user.user_metadata?.full_name || email };
}

/** Wraps a handler: resolves the caller or answers 401. */
function withActor(deps: CommunityDeps, handler: (req: any, res: any, client: any, actor: Actor) => Promise<any>) {
  return async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const actor = await resolveActor(client, req);
      if (!actor) return res.status(401).json({ error: 'Please sign in.' });
      return await handler(req, res, client, actor);
    } catch (err) {
      console.error(`[${req.method} ${req.path}]`, err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}

// ---------------------------------------------------------------- chat helpers

async function ensureSupportThread(client: any, ownerUserId: string, ownerRole: 'student' | 'teacher') {
  const { data: existing } = await client.from('chat_threads').select('*').eq('kind', 'support').eq('owner_user_id', ownerUserId).maybeSingle();
  if (existing) return existing;
  const { data, error } = await client.from('chat_threads').insert({ kind: 'support', owner_user_id: ownerUserId, owner_role: ownerRole }).select('*').single();
  if (error) {
    // Created by a parallel request (unique index): read it again.
    const { data: again } = await client.from('chat_threads').select('*').eq('kind', 'support').eq('owner_user_id', ownerUserId).maybeSingle();
    return again;
  }
  return data;
}

/**
 * Student account: one lesson thread per teacher of its learners — the teacher each learner is
 * assigned to (opened at sign-up, owner decision 2026-10-16) and any teacher who has (or had) a lesson with them.
 */
async function ensureLessonThreads(client: any, ownerUserId: string, learnerIds: string[]) {
  if (!learnerIds.length) return;
  const [{ data: rows }, { data: assigned }] = await Promise.all([
    client
      .from('bookings')
      .select('teacher_id')
      .in('student_id', learnerIds)
      .in('status', ['confirmed', 'rescheduled', 'completed'])
      .not('teacher_id', 'is', null),
    client.from('students').select('assigned_teacher_id').in('id', learnerIds).not('assigned_teacher_id', 'is', null)
  ]);
  const teacherIds = [...new Set([...(rows || []).map((r: any) => r.teacher_id), ...(assigned || []).map((r: any) => r.assigned_teacher_id)])];
  await ensureTeacherThreads(client, ownerUserId, teacherIds as string[]);
}

/** Opens the lesson conversation between a student account and each of these teachers (idempotent). */
export async function ensureTeacherThreads(client: any, ownerUserId: string, teacherIds: string[]) {
  const ids = [...new Set(teacherIds.filter(Boolean))];
  if (!ownerUserId || !ids.length) return;
  const { data: have } = await client.from('chat_threads').select('teacher_id').eq('kind', 'lesson').eq('owner_user_id', ownerUserId);
  const known = new Set((have || []).map((t: any) => t.teacher_id));
  const missing = ids.filter(id => !known.has(id));
  if (missing.length) {
    const { error } = await client.from('chat_threads').insert(missing.map(id => ({ kind: 'lesson', owner_user_id: ownerUserId, owner_role: 'student', teacher_id: id })));
    if (error) console.warn('[Chat] lesson thread insert failed:', error.message);
  }
}

function canAccessThread(thread: any, actor: Actor): boolean {
  if (!thread) return false;
  if (actor.role === 'admin') return true;
  if (thread.owner_user_id === actor.userId) return true;
  return actor.role === 'teacher' && thread.kind === 'lesson' && thread.teacher_id === actor.userId;
}

/** Which read marker this caller moves: the owner's, or the staff side (teacher for lessons, admin for support). */
function readColumn(thread: any, actor: Actor): 'owner_last_read_at' | 'staff_last_read_at' | null {
  if (thread.owner_user_id === actor.userId) return 'owner_last_read_at';
  if (thread.kind === 'lesson' && actor.role === 'teacher') return 'staff_last_read_at';
  if (thread.kind === 'support' && actor.role === 'admin') return 'staff_last_read_at';
  return null;
}

export function isUnreadFor(thread: any, actor: Pick<Actor, 'userId' | 'role'>): boolean {
  const col = readColumn(thread, actor as Actor);
  if (!col || !thread.last_message_at) return false;
  // Which side this reader is on: the owner (student or teacher), the lesson's teacher, or the admin team.
  // 2026-11-10: a teacher writing to the admin used to count as "staff to staff" and never showed as unread.
  const mySide = col === 'owner_last_read_at' ? thread.owner_role : thread.kind === 'lesson' ? 'teacher' : 'admin';
  if (thread.last_sender_role === mySide) return false;
  return !thread[col] || new Date(thread.last_message_at) > new Date(thread[col]);
}

/** The inbox section a conversation sits in (owner review 2026-11-09: sections instead of one "Support" pile). */
export function threadGroup(t: { kind: string; owner_role: string; owner_user_id: string }, actor: { role: string }, withTeacher: Set<string>): 'teachers' | 'families' | 'support' | 'lessons' | 'team' {
  if (actor.role === 'admin') {
    if (t.kind === 'lesson') return 'lessons';
    if (t.owner_role === 'teacher') return 'teachers';
    return withTeacher.has(t.owner_user_id) ? 'families' : 'support';
  }
  if (t.kind === 'support') return 'team';
  return actor.role === 'teacher' ? 'families' : 'teachers';
}

async function describeThreads(client: any, threads: any[], actor: Actor) {
  const teacherIds = [...new Set(threads.map(t => t.teacher_id).filter(Boolean))];
  const ownerIds = [...new Set(threads.map(t => t.owner_user_id))];
  // The last message of each conversation, for the list preview (matched by thread and its last_message_at).
  const lastTimes = [...new Set(threads.map(t => t.last_message_at).filter(Boolean))];
  const unreadThreads = threads.filter((t) => isUnreadFor(t, actor));
  const [{ data: teachers }, { data: owners }, { data: staffOwners }, { data: lastMessages }, { data: unreadRows }] = await Promise.all([
    teacherIds.length ? client.from('profiles').select('id, display_name, email').in('id', teacherIds) : Promise.resolve({ data: [] }),
    ownerIds.length ? client.from('students').select('id, auth_user_id, name').in('auth_user_id', ownerIds) : Promise.resolve({ data: [] }),
    ownerIds.length ? client.from('profiles').select('id, display_name, email').in('id', ownerIds) : Promise.resolve({ data: [] }),
    lastTimes.length
      ? client.from('chat_messages').select('thread_id, body, sender_user_id, created_at').in('thread_id', threads.map(t => t.id)).in('created_at', lastTimes)
      : Promise.resolve({ data: [] }),
    // WhatsApp-style counts: the other side's messages since this caller last opened each unread conversation.
    unreadThreads.length
      ? client.from('chat_messages').select('thread_id, sender_user_id, created_at').in('thread_id', unreadThreads.map(t => t.id)).neq('sender_user_id', actor.userId)
          .gt('created_at', unreadThreads.map(t => t[readColumn(t, actor) || ''] || '1970-01-01').sort()[0]).order('created_at', { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] })
  ]);
  // Teachers' own photos (teacher_accounts.photo_url, uploaded in Settings) for every staff face in the list.
  const staffEmails = [...new Set([...(teachers || []), ...(staffOwners || [])].map((p: any) => String(p.email || '').toLowerCase()).filter(Boolean))];
  const { data: staffAccounts } = staffEmails.length
    ? await client.from('teacher_accounts').select('email, photo_url').in('email', staffEmails)
    : { data: [] };
  const photoByEmail = new Map<string, string>((staffAccounts || []).filter((a: any) => /^(\/|https:\/\/)/.test(String(a.photo_url || ''))).map((a: any) => [String(a.email).toLowerCase(), a.photo_url as string] as [string, string]));
  const photoById = new Map<string, string>();
  for (const p of [...(teachers || []), ...(staffOwners || [])]) {
    const photo = photoByEmail.get(String(p.email || '').toLowerCase());
    if (photo) photoById.set(String(p.id), photo);
  }
  const unreadCount = new Map<string, number>();
  for (const t of unreadThreads) {
    const since = t[readColumn(t, actor) || ''] || '1970-01-01';
    unreadCount.set(t.id, (unreadRows || []).filter((m: any) => m.thread_id === t.id && m.created_at > since).length || 1);
  }
  // Admin: has this family a teacher yet? Accounts with no lesson conversation are still at the support stage.
  const withTeacher = new Set(threads.filter(t => t.kind === 'lesson').map(t => t.owner_user_id));
  const lastByThread = new Map<string, any>();
  for (const m of lastMessages || []) {
    const cur = lastByThread.get(m.thread_id);
    if (!cur || cur.created_at < m.created_at) lastByThread.set(m.thread_id, m);
  }
  const teacherName = new Map((teachers || []).map((t: any) => [t.id, t.display_name]));
  // AD-03: the admin can jump from a conversation to the family timeline.
  const ownerStudentId = new Map((owners || []).map((s: any) => [s.auth_user_id, s.id]));
  const ownerName = new Map<string, string>([
    ...(staffOwners || []).map((p: any) => [p.id, p.display_name] as [string, string]),
    ...(owners || []).map((s: any) => [s.auth_user_id, s.name] as [string, string])
  ]);
  return threads.map(t => ({
    id: t.id,
    kind: t.kind,
    ownerRole: t.owner_role,
    ownerName: ownerName.get(t.owner_user_id) || null,
    teacherName: t.teacher_id ? teacherName.get(t.teacher_id) || null : null,
    isMine: t.owner_user_id === actor.userId,
    lastMessageAt: t.last_message_at,
    lastMessage: lastByThread.has(t.id)
      ? { text: String(lastByThread.get(t.id).body || '').replace(/\s+/g, ' ').slice(0, 90), mine: lastByThread.get(t.id).sender_user_id === actor.userId }
      : null,
    // When the other side last opened this conversation: the sender's own messages up to then show as seen.
    otherReadAt: t.owner_user_id === actor.userId ? t.staff_last_read_at || null : t.owner_last_read_at || null,
    unread: isUnreadFor(t, actor),
    unreadCount: unreadCount.get(t.id) || 0,
    group: threadGroup(t, actor, withTeacher),
    // The face for this conversation: the teacher's photo, or a teacher-owner's own photo in the admin's list.
    photo: (t.kind === 'lesson' && actor.role !== 'teacher' ? photoById.get(t.teacher_id) : null)
      || (actor.role === 'admin' && t.owner_role === 'teacher' ? photoById.get(t.owner_user_id) : null)
      || null,
    ...(actor.role === 'admin' ? { ownerStudentId: ownerStudentId.get(t.owner_user_id) || null } : {})
  }));
}

export async function postChatMessage(client: any, thread: any, sender: { userId: string; role: 'student' | 'teacher' | 'admin'; name?: string }, body: string) {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('chat_messages')
    .insert({ thread_id: thread.id, sender_user_id: sender.userId, sender_role: sender.role, body })
    .select('id, sender_role, sender_user_id, body, created_at')
    .single();
  if (error) throw error;
  const senderCol = thread.owner_user_id === sender.userId ? 'owner_last_read_at' : 'staff_last_read_at';
  await client.from('chat_threads').update({ last_message_at: now, last_sender_role: sender.role, [senderCol]: now }).eq('id', thread.id);
  await pushChatMessage(client, thread, sender, body);
  return data;
}

/**
 * Owner review 2026-11-09: a new chat message buzzes the other side's phone (sender's name, the first line, their
 * photo), one notification per conversation that updates instead of piling up. Never throws.
 */
async function pushChatMessage(client: any, thread: any, sender: { userId: string; role: 'student' | 'teacher' | 'admin'; name?: string }, body: string) {
  try {
    const recipients: Array<{ userId: string; staff: boolean }> = [];
    if (thread.owner_user_id !== sender.userId) recipients.push({ userId: thread.owner_user_id, staff: thread.owner_role === 'teacher' });
    if (thread.kind === 'lesson' && thread.teacher_id && thread.teacher_id !== sender.userId) recipients.push({ userId: thread.teacher_id, staff: true });
    if (thread.kind === 'support' && thread.owner_user_id === sender.userId) {
      const { data: admins } = await client.from('teacher_accounts').select('email').eq('role', 'super_admin').eq('is_active', true);
      const emails = (admins || []).map((a: any) => String(a.email || '').toLowerCase()).filter(Boolean);
      const { data: ps } = emails.length ? await client.from('profiles').select('id').in('email', emails) : { data: [] };
      for (const p of ps || []) if (p.id !== sender.userId) recipients.push({ userId: p.id, staff: true });
    }
    if (!recipients.length) return;
    const { data: me } = await client.from('profiles').select('email, display_name').eq('id', sender.userId).maybeSingle();
    const { data: acct } = sender.role === 'student' || !me?.email ? { data: null } : await client.from('teacher_accounts').select('photo_url, display_name').eq('email', String(me.email).toLowerCase()).maybeSingle();
    const team = sender.role === 'admin';
    const who = team ? null : (acct?.display_name || sender.name || me?.display_name || '').replace(/\s*\(.*\)\s*$/, '').trim();
    const title = team ? { en: 'Watazawwado team', ar: 'فريق وتزودوا' } : { en: who || 'New message', ar: who || 'رسالة جديدة' };
    const text = body.replace(/\s+/g, ' ').trim();
    const line = text.length > 110 ? `${text.slice(0, 107)}…` : text;
    const photo = /^(\/|https:\/\/)/.test(String(acct?.photo_url || '')) ? acct.photo_url : team ? '/android-chrome-192x192.png' : null;
    for (const r of recipients) {
      const { data: rp } = await client.from('profiles').select('email').eq('id', r.userId).maybeSingle();
      await sendPushToUser(client, r.userId, {
        kind: 'chat_message', title, body: { en: line, ar: line }, image: photo, tag: `chat-${thread.id}`,
        link: `${r.staff ? '/dashboard' : '/student'}/messages?thread=${thread.id}`,
      }, rp?.email ? await resolveEmailLanguage(rp.email) : 'ar');
    }
  } catch (err: any) {
    console.warn('[Chat push] failed:', err?.message || err);
  }
}

/** Puts an admin message in the account's support thread (used by intake "request more info"). */
export async function sendAdminSupportMessage(client: any, ownerUserId: string, adminUserId: string, body: string) {
  const thread = await ensureSupportThread(client, ownerUserId, 'student');
  if (thread) await postChatMessage(client, thread, { userId: adminUserId, role: 'admin' }, body.slice(0, MAX_MESSAGE));
}

// ---------------------------------------------------------------- placement helpers

/** The learners of this account: self for an adult account, the children for a parent account. */
async function accountLearners(client: any, req: any, deps: CommunityDeps) {
  const learners = await deps.getLearners(client, req);
  const isParent = req.studentUser?.studentProfile?.learner_type === 'child' && learners.some(l => !l.isPrimary);
  const pool = isParent ? learners.filter(l => !l.isPrimary) : learners;
  if (!pool.length) return [];
  const { data } = await client.from('students').select('id, name, learning_interest, current_level').in('id', pool.map(l => l.id));
  return (data || []) as Array<{ id: string; name: string; learning_interest: string | null; current_level: string | null }>;
}

export type PlacementStatus = 'not_yet' | 'take_now' | 'in_progress' | 'submitted' | 'reviewed';

/**
 * TEMPORARY (owner request 2026-10-17): open the test before booking so the owner can try every
 * subject and level before launch. While true: no booking needed, the learner may pick any subject
 * and level, and may retake. Set back to false when the owner asks (RULES.md: test after the trial).
 */
export const PLACEMENT_BEFORE_BOOKING = true;

/**
 * Owner decision 2026-10-16: the test is for the subject and level chosen at onboarding, shown
 * after the learner's first booking (the free trial; for a parent's other children, whatever lesson
 * they book first, since the trial is one per account), taken once per subject by each learner.
 * It never blocks booking.
 * shortcut: an unreadable table (migration missing) reports 'not_yet' so nothing is asked.
 */
export async function placementStatus(client: any, learner: { id: string; learning_interest: string | null }): Promise<{ status: PlacementStatus; serviceId: string; testId?: string }> {
  const serviceId = learner.learning_interest && BANKS[learner.learning_interest] ? learner.learning_interest : 'quran-reading';
  const { data: tests, error } = await client
    .from('placement_tests')
    .select('id, status')
    .eq('learner_student_id', learner.id)
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) return { status: 'not_yet', serviceId };
  const done = (tests || []).find((t: any) => t.status === 'reviewed') || (tests || []).find((t: any) => t.status === 'submitted');
  if (done) return { status: done.status, serviceId, testId: done.id };
  const open = (tests || []).find((t: any) => t.status === 'in_progress');
  const { count } = await client
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', learner.id)
    .in('status', ['pending', 'confirmed', 'rescheduled', 'completed']);
  if (!(count || 0) && !PLACEMENT_BEFORE_BOOKING) return { status: 'not_yet', serviceId };
  return open ? { status: 'in_progress', serviceId, testId: open.id } : { status: 'take_now', serviceId };
}

/**
 * Ladder tests: the lesson to start from inside the suggested level (the first one whose question was missed). Null for
 * other subjects, when the first three lessons are all known, or when the team chose another level.
 */
export function startLesson(t: any): number | null {
  if (!LADDERS[t.service_id] || t.status === 'in_progress' || (t.admin_level && t.admin_level !== t.suggested_level)) return null;
  const r = ladderClimb(t.service_id, normalizeQuestions(t.questions, t.stated_level), t.answers || []);
  return 'next' in r ? null : r.lesson;
}

/** Questions for the browser: both languages (the page follows the site language), never the right answers. */
function publicTest(t: any) {
  return {
    id: t.id,
    learnerStudentId: t.learner_student_id,
    learnerName: t.learner_name,
    serviceId: t.service_id,
    statedLevel: t.stated_level,
    status: t.status,
    questions: t.status === 'in_progress' ? normalizeQuestions(t.questions, t.stated_level).map((x) => ({ q: x.q, options: x.options })) : undefined,
    // Ladder tests: the learner's own choices on the rungs already sent (locked), so the page resumes after them.
    answered: t.status === 'in_progress' && Array.isArray(t.answers) ? t.answers : undefined,
    ladder: !!LADDERS[t.service_id],
    startLesson: startLesson(t),
    score: t.score,
    maxScore: t.max_score,
    suggestedLevel: t.suggested_level,
    adminReply: t.admin_reply,
    adminLevel: t.admin_level,
    submittedAt: t.submitted_at,
    reviewedAt: t.reviewed_at,
    createdAt: t.created_at
  };
}

// ---------------------------------------------------------------- routes

export function registerCommunityRoutes(app: express.Express, deps: CommunityDeps) {
  const { rateLimit, verifyStudentAuth, verifyTeacherAuth, requireSuperAdmin } = deps;

  // ---- Inbox (any signed-in account)
  app.get('/api/me/notifications', withActor(deps, async (_req, res, client, actor) => {
    const { data, error } = await client
      .from('user_notifications')
      .select('id, kind, title_en, title_ar, body_en, body_ar, link, read_at, created_at')
      .eq('recipient_user_id', actor.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return res.json({ notifications: [], unreadCount: 0 });
    const { data: threads } = await client
      .from('chat_threads')
      .select('*')
      .or(actor.role === 'admin' ? 'kind.eq.support,owner_user_id.eq.' + actor.userId : `owner_user_id.eq.${actor.userId}${actor.role === 'teacher' ? `,teacher_id.eq.${actor.userId}` : ''}`)
      .limit(500);
    const unreadChats = (threads || []).filter((t: any) => canAccessThread(t, actor) && isUnreadFor(t, actor)).length;
    res.json({
      notifications: data || [],
      unreadCount: (data || []).filter((n: any) => !n.read_at).length,
      unreadChats
    });
  }));

  app.post('/api/me/notifications/read', withActor(deps, async (req, res, client, actor) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x: any) => typeof x === 'string').slice(0, 100) : null;
    let q = client.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('recipient_user_id', actor.userId).is('read_at', null);
    if (ids) q = q.in('id', ids);
    const { error } = await q;
    if (error) throw error;
    res.json({ success: true });
  }));

  // ---- Chat
  app.get('/api/chat/threads', withActor(deps, async (req, res, client, actor) => {
    if (actor.role === 'admin') {
      const { data } = await client.from('chat_threads').select('*').order('last_message_at', { ascending: false, nullsFirst: false }).limit(300);
      return res.json({ threads: await describeThreads(client, data || [], actor), role: actor.role });
    }
    await ensureSupportThread(client, actor.userId, actor.role === 'teacher' ? 'teacher' : 'student');
    if (actor.role === 'student') {
      const { data: st } = await client.from('students').select('id, learner_type, name').eq('auth_user_id', actor.userId).maybeSingle();
      const learners = st ? await deps.getLearners(client, { studentUser: { student_id: st.id, email: actor.email, name: st.name, studentProfile: st } }) : [];
      await ensureLessonThreads(client, actor.userId, learners.map(l => l.id));
    }
    const filter = actor.role === 'teacher' ? `owner_user_id.eq.${actor.userId},teacher_id.eq.${actor.userId}` : `owner_user_id.eq.${actor.userId}`;
    const { data } = await client.from('chat_threads').select('*').or(filter).limit(300);
    const threads = (data || []).filter((t: any) => canAccessThread(t, actor));
    // Support thread first (pinned), then the most recent.
    threads.sort((a: any, b: any) => (a.kind === 'support' ? -1 : b.kind === 'support' ? 1 : String(b.last_message_at || '').localeCompare(String(a.last_message_at || ''))));
    res.json({ threads: await describeThreads(client, threads, actor), role: actor.role });
  }));

  app.get('/api/chat/threads/:id/messages', withActor(deps, async (req, res, client, actor) => {
    const { data: thread } = await client.from('chat_threads').select('*').eq('id', req.params.id).maybeSingle();
    if (!canAccessThread(thread, actor)) return res.status(404).json({ error: 'Conversation not found.' });
    let q = client.from('chat_messages').select('id, sender_role, sender_user_id, body, created_at').eq('thread_id', thread.id).order('created_at', { ascending: true }).limit(300);
    const after = typeof req.query.after === 'string' && !Number.isNaN(Date.parse(req.query.after)) ? req.query.after : null;
    if (after) q = q.gt('created_at', after);
    const { data, error } = await q;
    if (error) throw error;
    const col = readColumn(thread, actor);
    if (col) await client.from('chat_threads').update({ [col]: new Date().toISOString() }).eq('id', thread.id);
    res.json({ messages: (data || []).map((m: any) => ({ ...m, mine: m.sender_user_id === actor.userId, sender_user_id: undefined })) });
  }));

  app.post('/api/chat/threads/:id/messages', rateLimit, withActor(deps, async (req, res, client, actor) => {
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body) return res.status(400).json({ error: 'Write a message first.' });
    if (body.length > MAX_MESSAGE) return res.status(400).json({ error: `Messages can be up to ${MAX_MESSAGE} characters.` });
    const { data: thread } = await client.from('chat_threads').select('*').eq('id', req.params.id).maybeSingle();
    if (!canAccessThread(thread, actor)) return res.status(404).json({ error: 'Conversation not found.' });
    const message = await postChatMessage(client, thread, { userId: actor.userId, role: actor.role, name: actor.name }, body);
    res.status(201).json({ message: { ...message, mine: true, sender_user_id: undefined } });
  }));

  // Super admin opens (or creates) the support conversation of a given account, e.g. from a
  // placement test or an AI-guide request, to continue with the student in the chat.
  app.post('/api/chat/threads/open-for', withActor(deps, async (req, res, client, actor) => {
    if (actor.role !== 'admin') return res.status(403).json({ error: 'Only the admin can open this conversation.' });
    const userId = typeof req.body?.userId === 'string' ? req.body.userId : '';
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return res.status(400).json({ error: 'Unknown account.' });
    const { data: target } = await client.auth.admin.getUserById(userId);
    const email = String(target?.user?.email || '').toLowerCase();
    if (!email) return res.status(404).json({ error: 'Unknown account.' });
    const { data: staff } = await client.from('teacher_accounts').select('email').eq('email', email).maybeSingle();
    const thread = await ensureSupportThread(client, userId, staff ? 'teacher' : 'student');
    if (!thread) return res.status(500).json({ error: 'Could not open the conversation.' });
    res.json({ threadId: thread.id });
  }));

  // ---- Placement test (student side)
  app.get('/api/placement/mine', verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const learners = await accountLearners(client, req, deps);
      const out = [];
      for (const l of learners) out.push({ id: l.id, name: l.name, level: l.current_level, ...(await placementStatus(client, l)) });
      res.json({ learners: out, testMode: PLACEMENT_BEFORE_BOOKING, ladders: Object.keys(LADDERS) });
    } catch (err) {
      console.error('[GET /api/placement/mine]', err);
      res.status(500).json({ error: 'Could not load your placement test.' });
    }
  });

  app.post('/api/placement/start', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const learners = await accountLearners(client, req, deps);
      const requested = typeof req.body?.learnerStudentId === 'string' ? req.body.learnerStudentId : '';
      const learner = learners.find(l => l.id === requested) || learners[0];
      if (!learner) return res.status(400).json({ error: 'Finish your profile first.' });

      const state = await placementStatus(client, learner);
      // Test mode: any subject and level, always a fresh test.
      const tryService = PLACEMENT_BEFORE_BOOKING && typeof req.body?.serviceId === 'string' && BANKS[req.body.serviceId] ? req.body.serviceId : null;
      const tryLevel = PLACEMENT_BEFORE_BOOKING && LEVELS.includes(req.body?.level) ? (req.body.level as Level) : null;
      if (PLACEMENT_BEFORE_BOOKING) {
        state.status = 'take_now';
        if (tryService) state.serviceId = tryService;
      }
      if (state.status === 'not_yet') {
        return res.status(409).json({ error: 'The placement test opens after you book your free trial.', code: 'BOOK_TRIAL_FIRST' });
      }
      // Owner review 2026-11-07: the student may take it again (a new test; the teacher sees the latest).
      if ((state.status === 'submitted' || state.status === 'reviewed') && req.body?.retake !== true) {
        return res.status(409).json({ error: 'You already took the placement test for this subject.', code: 'ALREADY_TAKEN', testId: state.testId });
      }
      if (state.status === 'in_progress' && state.testId) {
        const { data: open } = await client.from('placement_tests').select('*').eq('id', state.testId).maybeSingle();
        if (open) return res.json({ test: publicTest(open) });
      }

      const level = tryLevel || (LEVELS.includes(learner.current_level as Level) ? learner.current_level! : 'beginner');
      const questions = buildPlacementTest(state.serviceId, level);
      const { data: row, error } = await client
        .from('placement_tests')
        .insert({
          auth_user_id: req.studentUser.auth_id,
          learner_student_id: learner.id,
          learner_name: learner.name,
          service_id: state.serviceId,
          stated_level: level,
          language: req.body?.lang === 'ar' ? 'ar' : 'en',
          questions
        })
        .select('*')
        .single();
      if (error) throw error;
      res.status(201).json({ test: publicTest(row) });
    } catch (err) {
      console.error('[POST /api/placement/start]', err);
      res.status(500).json({ error: 'Could not prepare the test. Please try again.' });
    }
  });

  app.post('/api/placement/:id/submit', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const { data: test } = await client.from('placement_tests').select('*').eq('id', req.params.id).maybeSingle();
      if (!test || test.auth_user_id !== req.studentUser.auth_id || (req.childDevice && test.learner_student_id !== req.childDevice.learnerId)) return res.status(404).json({ error: 'Test not found.' });
      if (test.status !== 'in_progress') return res.status(409).json({ error: 'This test was already sent.', testId: test.id });
      const questions: TestQuestion[] = normalizeQuestions(test.questions, test.stated_level);
      const answers: any[] = Array.isArray(req.body?.answers) ? req.body.answers : [];
      if (answers.length !== questions.length) return res.status(400).json({ error: 'Please answer every question.' });
      const sent = Array.isArray(test.answers) ? test.answers : [];
      // Rungs already sent are locked: their stored answers win over anything the page sends again.
      const clean = answers.map((a, i) => (i < sent.length ? sent[i] : Number.isInteger(a) && a >= 0 && a < (questions[i]?.options?.en?.length || 4) ? a : -1));
      let suggested: Level;
      let start: number | null = null;
      if (LADDERS[test.service_id]) {
        const r = ladderClimb(test.service_id, questions, clean);
        if ('next' in r) {
          const more = [...questions, ...rungQuestions(test.service_id, r.next)];
          const { data: row, error } = await client
            .from('placement_tests')
            .update({ questions: more, answers: clean })
            .eq('id', test.id)
            .eq('status', 'in_progress')
            .select('*')
            .single();
          if (error) throw error;
          return res.json({ next: true, test: publicTest(row) });
        }
        suggested = r.level;
        start = r.lesson;
      } else suggested = suggestLevel(questions, clean);
      const score = questions.reduce((s, q, i) => s + (clean[i] === q.answer ? 1 : 0), 0);
      const skills = skillSummary(questions, clean);
      const where = LADDERS[test.service_id] ? `result suggests: ${suggested}, ${start ? `from Lesson ${start}` : 'Lessons 1–3 known'}` : `chosen level: ${test.stated_level || '-'}; result suggests: ${suggested}`;
      const summary = `${score}/${questions.length} correct. ${where[0].toUpperCase()}${where.slice(1)}.${skills.toImprove.length ? ` To improve: ${skills.toImprove.map(s => s.en).join(', ')}.` : ''}`;
      const { error } = await client
        .from('placement_tests')
        .update({ answers: clean, score, max_score: questions.length, suggested_level: suggested, ai_summary: summary, status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', test.id)
        .eq('status', 'in_progress');
      if (error) throw error;
      // The learner's teacher sees the result and sets the level (owner review 2026-11-07).
      if (test.learner_student_id) {
        const { data: st } = await client.from('students').select('assigned_teacher_id').eq('id', test.learner_student_id).maybeSingle();
        if (st?.assigned_teacher_id) {
          await notifyUser(client, { userId: st.assigned_teacher_id }, {
            kind: 'placement_submitted',
            title: { en: `${test.learner_name || 'Your student'} took the placement test`, ar: `${test.learner_name || 'طالبك'} عمل اختبار تحديد المستوى` },
            body: { en: `${summary} Open the student to set the level.`, ar: `${score}/${questions.length} إجابة صحيحة. المستوى المقترح: ${suggested}. افتح صفحة الطالب عشان تحدد مستواه.` },
            link: `/dashboard/students/${test.learner_student_id}`
          });
        }
      }
      // On-site only (owner decision 2026-10-16).
      await notifySuperAdmins(client, {
        kind: 'placement_submitted',
        title: { en: `Placement test: ${test.learner_name || 'student'}`, ar: `اختبار تحديد مستوى: ${test.learner_name || 'طالب'}` },
        body: { en: summary, ar: `${score}/${questions.length} إجابة صحيحة. المستوى المقترح: ${suggested}${start ? `، من الدرس ${start}` : ''}.` },
        link: '/dashboard/placement'
      });
      res.json({ success: true, testId: test.id });
    } catch (err) {
      console.error('[POST /api/placement/:id/submit]', err);
      res.status(500).json({ error: 'Could not send the test. Please try again.' });
    }
  });

  // The result report (shown in the site's design, printable). Owner of the test only.
  app.get('/api/placement/:id/report', verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const { data: t } = await client.from('placement_tests').select('*').eq('id', req.params.id).maybeSingle();
      // NX-16: a child device sees only its own child's report.
      if (!t || t.auth_user_id !== req.studentUser.auth_id || t.status === 'in_progress' || (req.childDevice && t.learner_student_id !== req.childDevice.learnerId)) return res.status(404).json({ error: 'Report not found.' });
      const skills = skillSummary(normalizeQuestions(t.questions, t.stated_level), t.answers || []);
      res.json({
        report: {
          id: t.id,
          learnerName: t.learner_name,
          serviceId: t.service_id,
          statedLevel: t.stated_level,
          suggestedLevel: t.admin_level || t.suggested_level,
          score: t.score,
          maxScore: t.max_score,
          status: t.status,
          adminReply: t.admin_reply,
          submittedAt: t.submitted_at,
          reviewedAt: t.reviewed_at,
          ladder: !!LADDERS[t.service_id],
          startLesson: startLesson(t),
          teacherChecks: LADDERS[t.service_id]?.teacherChecks || null,
          ...skills
        }
      });
    } catch (err) {
      console.error('[GET /api/placement/:id/report]', err);
      res.status(500).json({ error: 'Could not load the report.' });
    }
  });

  // ---- Placement test (super admin side)
  app.get('/api/dashboard/placement-tests', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      const status = ['submitted', 'reviewed', 'in_progress'].includes(req.query.status) ? req.query.status : 'submitted';
      const { data, error } = await client.from('placement_tests').select('*').eq('status', status).order('submitted_at', { ascending: false, nullsFirst: false }).limit(100);
      if (error) return res.json({ tests: [] });
      // The admin sees the questions, the right answers and what the student chose.
      res.json({ tests: (data || []).map((t: any) => ({ ...publicTest(t), authUserId: t.auth_user_id, questions: normalizeQuestions(t.questions, t.stated_level), answers: t.answers, aiSummary: t.ai_summary })) });
    } catch (err) {
      console.error('[GET /api/dashboard/placement-tests]', err);
      res.status(500).json({ error: 'Could not load placement tests.' });
    }
  });

  // Teacher: the student's placement results and level (owner review 2026-11-07, item 34).
  app.get('/api/dashboard/students/:id/placement', verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const studentId = String(req.params.id || '');
      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
      if (!access.allowed) return res.status(403).json({ error: 'This is not your student.' });
      const [{ data: st }, { data: tests }] = await Promise.all([
        client.from('students').select('current_level, level_set_at, level_set_by').eq('id', studentId).maybeSingle(),
        client.from('placement_tests').select('*').eq('learner_student_id', studentId).neq('status', 'in_progress').order('submitted_at', { ascending: false }).limit(5),
      ]);
      let setByName: string | null = null;
      if (st?.level_set_by) {
        const { data: who } = await client.from('profiles').select('display_name').eq('id', st.level_set_by).maybeSingle();
        setByName = who?.display_name || null;
      }
      res.json({
        currentLevel: st?.current_level || null,
        levelSetAt: st?.level_set_at || null,
        levelSetByMe: Boolean(st?.level_set_by && st.level_set_by === req.teacherUser?.id),
        levelSetByName: setByName,
        tests: (tests || []).map((t: any) => ({
          id: t.id, serviceId: t.service_id, status: t.status, statedLevel: t.stated_level,
          suggestedLevel: t.suggested_level, chosenLevel: t.admin_level, score: t.score, maxScore: t.max_score,
          submittedAt: t.submitted_at, startLesson: startLesson(t), summary: t.ai_summary
        }))
      });
    } catch (err) {
      console.error('[GET student placement]', err);
      res.status(500).json({ error: 'Could not load the placement results.' });
    }
  });

  // Teacher: set the student's level (from a placement result or their own judgement); the family is told.
  app.post('/api/dashboard/students/:id/level', rateLimit, verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const studentId = String(req.params.id || '');
      const level = LEVELS.includes(req.body?.level) ? (req.body.level as Level) : null;
      if (!level) return res.status(400).json({ error: 'Choose a level.' });
      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
      if (!access.allowed) return res.status(403).json({ error: 'This is not your student.' });
      const now = new Date().toISOString();
      const { error } = await client.from('students').update({ current_level: level, level_set_at: now, level_set_by: req.teacherUser?.id || null, updated_at: now }).eq('id', studentId);
      if (error) throw error;
      const testId = typeof req.body?.testId === 'string' ? req.body.testId : '';
      let test: any = null;
      if (testId) {
        const { data } = await client.from('placement_tests').select('id, status, auth_user_id, learner_student_id').eq('id', testId).maybeSingle();
        if (data && data.learner_student_id === studentId) {
          test = data;
          await client.from('placement_tests').update({ status: 'reviewed', admin_level: level, reviewed_by: req.teacherUser?.id || null, reviewed_at: now }).eq('id', data.id);
        }
      }
      const { data: acct } = await client.from('students').select('auth_user_id, name').eq('id', studentId).maybeSingle();
      const familyUser = test?.auth_user_id || acct?.auth_user_id || null;
      const LV: Record<Level, [string, string]> = { beginner: ['Beginner', 'مبتدئ'], elementary: ['Elementary', 'أساسي'], intermediate: ['Intermediate', 'متوسط'], advanced: ['Advanced', 'متقدم'] };
      if (familyUser) {
        await notifyUser(client, { userId: familyUser }, {
          kind: 'placement_reviewed',
          title: { en: 'Your level was set', ar: 'مستواك اتحدد' },
          body: { en: `Your teacher set the level of ${acct?.name || 'your learner'} to ${LV[level][0]}. The learning path follows it now.`, ar: `المعلم حدد مستوى ${acct?.name || ''} على: ${LV[level][1]}. المسار التعليمي ماشي عليه دلوقتي.` },
          link: test ? `/student/placement/report/${test.id}` : '/student/progress'
        });
      }
      res.json({ success: true, level, levelSetAt: now });
    } catch (err) {
      console.error('[POST student level]', err);
      res.status(500).json({ error: 'Could not save the level.' });
    }
  });

  app.post('/api/dashboard/placement-tests/:id/review', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      const reply = typeof req.body?.reply === 'string' ? req.body.reply.trim().slice(0, 2000) : '';
      const level = LEVELS.includes(req.body?.level) ? (req.body.level as Level) : null;
      if (!reply) return res.status(400).json({ error: 'Write a reply to the student.' });
      const { data: test } = await client.from('placement_tests').select('*').eq('id', req.params.id).maybeSingle();
      if (!test) return res.status(404).json({ error: 'Test not found.' });
      if (test.status !== 'submitted') return res.status(400).json({ error: 'This test is not waiting for a review.' });
      const { error } = await client
        .from('placement_tests')
        .update({ status: 'reviewed', admin_reply: reply, admin_level: level, reviewed_by: req.teacherUser.id, reviewed_at: new Date().toISOString() })
        .eq('id', test.id);
      if (error) throw error;
      if (level && test.learner_student_id) {
        await client.from('students').update({ current_level: level, updated_at: new Date().toISOString() }).eq('id', test.learner_student_id);
      }
      const { data: authUser } = await client.auth.admin.getUserById(test.auth_user_id);
      await notifyUser(client, { userId: test.auth_user_id, email: authUser?.user?.email, name: test.learner_name }, {
        kind: 'placement_reviewed',
        title: { en: 'Your placement test result is ready', ar: 'نتيجة اختبار تحديد المستوى جاهزة' },
        body: { en: reply, ar: reply },
        link: `/student/placement/report/${test.id}`
      }, { email: true });
      await sendAdminSupportMessage(client, test.auth_user_id, req.teacherUser.id, reply).catch(() => {});
      res.json({ success: true });
    } catch (err) {
      console.error('[POST /api/dashboard/placement-tests/:id/review]', err);
      res.status(500).json({ error: 'Could not save the review.' });
    }
  });
}
