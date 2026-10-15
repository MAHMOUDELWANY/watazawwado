/**
 * Inbox, chat, AI placement test and the teacher AI assistant (owner request 2026-10-16).
 *
 * - Inbox: on-site notifications for any signed-in account (user_notifications).
 * - Chat (text only): every account has a pinned 'support' thread with the super admin;
 *   a student account gets a 'lesson' thread with each teacher they have booked with.
 *   The super admin can read and write in every thread.
 * - Placement test: Gemini writes a short, different test per learner from the subject and level
 *   chosen at onboarding; the server keeps the answers, grades it, and the super admin replies.
 *   It is taken after booking (owner decision 2026-10-16); it never blocks a booking.
 * - Teacher assistant: first version of the AI helper in the teacher workspace.
 * All tables are server-only; every route checks who is asking.
 */
import type express from 'express';
import { GoogleGenAI } from '@google/genai';
import { parseModelJson } from '../intake/intakeService.js';
import { notifyUser, notifySuperAdmins } from '../notifications/inbox.js';

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

/** Student account: one lesson thread per teacher who has (or had) a lesson with one of its learners. */
async function ensureLessonThreads(client: any, ownerUserId: string, learnerIds: string[]) {
  if (!learnerIds.length) return;
  const { data: rows } = await client
    .from('bookings')
    .select('teacher_id')
    .in('student_id', learnerIds)
    .in('status', ['confirmed', 'rescheduled', 'completed'])
    .not('teacher_id', 'is', null);
  const teacherIds = [...new Set((rows || []).map((r: any) => r.teacher_id))];
  if (!teacherIds.length) return;
  const { data: have } = await client.from('chat_threads').select('teacher_id').eq('kind', 'lesson').eq('owner_user_id', ownerUserId);
  const known = new Set((have || []).map((t: any) => t.teacher_id));
  const missing = teacherIds.filter(id => !known.has(id));
  if (missing.length) {
    await client.from('chat_threads').insert(missing.map(id => ({ kind: 'lesson', owner_user_id: ownerUserId, owner_role: 'student', teacher_id: id })));
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

function isUnreadFor(thread: any, actor: Actor): boolean {
  const col = readColumn(thread, actor);
  if (!col || !thread.last_message_at) return false;
  const mySide = col === 'owner_last_read_at' ? thread.owner_role : 'staff';
  const lastSide = thread.last_sender_role === 'teacher' || thread.last_sender_role === 'admin' ? 'staff' : 'student';
  if ((mySide === 'staff' && lastSide === 'staff') || (mySide !== 'staff' && thread.last_sender_role === thread.owner_role)) return false;
  return !thread[col] || new Date(thread.last_message_at) > new Date(thread[col]);
}

async function describeThreads(client: any, threads: any[], actor: Actor) {
  const teacherIds = [...new Set(threads.map(t => t.teacher_id).filter(Boolean))];
  const ownerIds = [...new Set(threads.map(t => t.owner_user_id))];
  const [{ data: teachers }, { data: owners }, { data: staffOwners }] = await Promise.all([
    teacherIds.length ? client.from('profiles').select('id, display_name').in('id', teacherIds) : Promise.resolve({ data: [] }),
    ownerIds.length ? client.from('students').select('auth_user_id, name').in('auth_user_id', ownerIds) : Promise.resolve({ data: [] }),
    ownerIds.length ? client.from('profiles').select('id, display_name').in('id', ownerIds) : Promise.resolve({ data: [] })
  ]);
  const teacherName = new Map((teachers || []).map((t: any) => [t.id, t.display_name]));
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
    unread: isUnreadFor(t, actor)
  }));
}

export async function postChatMessage(client: any, thread: any, sender: { userId: string; role: 'student' | 'teacher' | 'admin' }, body: string) {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('chat_messages')
    .insert({ thread_id: thread.id, sender_user_id: sender.userId, sender_role: sender.role, body })
    .select('id, sender_role, sender_user_id, body, created_at')
    .single();
  if (error) throw error;
  const senderCol = thread.owner_user_id === sender.userId ? 'owner_last_read_at' : 'staff_last_read_at';
  await client.from('chat_threads').update({ last_message_at: now, last_sender_role: sender.role, [senderCol]: now }).eq('id', thread.id);
  return data;
}

/** Puts an admin message in the account's support thread (used by intake "request more info"). */
export async function sendAdminSupportMessage(client: any, ownerUserId: string, adminUserId: string, body: string) {
  const thread = await ensureSupportThread(client, ownerUserId, 'student');
  if (thread) await postChatMessage(client, thread, { userId: adminUserId, role: 'admin' }, body.slice(0, MAX_MESSAGE));
}

// ---------------------------------------------------------------- placement helpers

const SUBJECT_NAMES: Record<string, string> = {
  'quran-reading': 'Quran reading (Arabic letters, vowels, joining letters, reading words and short verses)',
  'tajweed': 'Tajweed rules',
  'quran-memorization': 'Quran memorization (Hifz) and reading accuracy',
  'quran-revision': 'Quran revision of memorized surahs',
  'islamic-studies': 'Islamic studies basics',
  'fiqh': 'Fiqh (Islamic jurisprudence, worship basics)',
  'aqeedah': 'Aqeedah (Islamic creed, Ahl al-Sunnah wal-Jama\'ah)',
  'seerah': 'Seerah (life of the Prophet ﷺ)',
  'arabic-conversation': 'Arabic conversation',
  'modern-standard-arabic': 'Modern Standard Arabic (grammar, vocabulary, reading)',
  'egyptian-arabic': 'Egyptian colloquial Arabic',
  'arabic-foundations': 'Arabic foundations (alphabet, reading, basic vocabulary)',
  'english': 'English language (grammar, vocabulary, reading)'
};
const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];

export function levelFromScore(score: number, max: number): string {
  const pct = max ? score / max : 0;
  return pct < 0.35 ? 'beginner' : pct < 0.6 ? 'elementary' : pct < 0.85 ? 'intermediate' : 'advanced';
}

/** The learner the test is for: self for an adult account, the chosen child for a parent account. */
async function resolveTestLearner(client: any, req: any, deps: CommunityDeps, requested?: string) {
  const learners = await deps.getLearners(client, req);
  const isParent = req.studentUser?.studentProfile?.learner_type === 'child' && learners.some(l => !l.isPrimary);
  const pool = isParent ? learners.filter(l => !l.isPrimary) : learners;
  const learner = requested ? pool.find(l => l.id === requested) : pool[0];
  if (!learner) return null;
  const { data: row } = await client.from('students').select('id, name, learning_interest, current_level, age').eq('id', learner.id).maybeSingle();
  return row ? { ...row, choices: pool } : null;
}

/** Strips the answers before a test goes to the browser. */
const publicQuestions = (questions: any[]) => questions.map((q: any) => ({ q: q.q, options: q.options }));

function publicTest(t: any) {
  return {
    id: t.id,
    learnerStudentId: t.learner_student_id,
    learnerName: t.learner_name,
    serviceId: t.service_id,
    statedLevel: t.stated_level,
    status: t.status,
    questions: t.status === 'in_progress' ? publicQuestions(t.questions || []) : undefined,
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

/**
 * Placement status of a learner: null once the admin reviewed a test, otherwise whether the test is
 * still to take or waiting for the admin.
 * Used only to prompt the student; booking is never blocked by it.
 */
export async function placementGate(client: any, learnerStudentId: string | null): Promise<string | null> {
  if (!learnerStudentId) return null;
  const { data, error } = await client
    .from('placement_tests')
    .select('status')
    .eq('learner_student_id', learnerStudentId)
    .order('created_at', { ascending: false })
    .limit(5);
  // shortcut: an unreadable table (migration not applied) asks nothing of the student.
  if (error) return null;
  if ((data || []).some((t: any) => t.status === 'reviewed')) return null;
  return (data || []).some((t: any) => t.status === 'submitted') ? 'PLACEMENT_PENDING_REVIEW' : 'PLACEMENT_REQUIRED';
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
    const message = await postChatMessage(client, thread, { userId: actor.userId, role: actor.role }, body);
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
      const learner = await resolveTestLearner(client, req, deps);
      const learners = learner?.choices || [];
      const { data, error } = await client
        .from('placement_tests')
        .select('*')
        .eq('auth_user_id', req.studentUser.auth_id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return res.json({ tests: [], learners: [], gates: {} });
      const gates: Record<string, string | null> = {};
      for (const l of learners) gates[l.id] = await placementGate(client, l.id);
      res.json({ tests: (data || []).map(publicTest), learners: learners.map((l: any) => ({ id: l.id, name: l.name })), gates });
    } catch (err) {
      console.error('[GET /api/placement/mine]', err);
      res.status(500).json({ error: 'Could not load your placement test.' });
    }
  });

  app.post('/api/placement/start', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const learner = await resolveTestLearner(client, req, deps, typeof req.body?.learnerStudentId === 'string' ? req.body.learnerStudentId : undefined);
      if (!learner) return res.status(400).json({ error: 'Finish your profile first, then take the placement test.' });

      // An unfinished test from the last day is reused, so reloading the page doesn't change the questions.
      const { data: open } = await client
        .from('placement_tests')
        .select('*')
        .eq('learner_student_id', learner.id)
        .eq('status', 'in_progress')
        .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      if (open?.[0]) return res.json({ test: publicTest(open[0]) });

      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'The placement test is not available right now.' });
      const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
      const serviceId = SUBJECT_NAMES[learner.learning_interest] ? learner.learning_interest : 'quran-reading';
      const level = LEVELS.includes(learner.current_level) ? learner.current_level : 'beginner';
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Write a short placement test for a new student of an online 1-on-1 academy.
Subject: ${SUBJECT_NAMES[serviceId]}.
The student says their level is: ${level}. Age: ${learner.age || 'unknown'}.
Make 8 multiple-choice questions that go from easy to harder (2 easy, 3 around the stated level, 3 above it), so the result shows the real level.
Each question has exactly 4 options and one correct answer. Vary the questions: this test must differ from other students' tests (variation seed ${Math.random().toString(36).slice(2, 8)}).
Write instructions and options in ${lang === 'ar' ? 'Arabic' : 'English'}; quote Arabic text where the subject needs it (Quran, Arabic). Keep wording suitable for the age. Islamic content follows Ahl al-Sunnah wal-Jama'ah, balanced and moderate.
Return ONLY JSON: {"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"skill":"short skill name"}]}`;
      const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt, config: { temperature: 1, responseMimeType: 'application/json' } });
      const parsed = parseModelJson(response.text || '');
      const questions = (Array.isArray(parsed?.questions) ? parsed.questions : [])
        .filter((q: any) => typeof q?.q === 'string' && Array.isArray(q.options) && q.options.length === 4 && q.options.every((o: any) => typeof o === 'string') && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)
        .slice(0, 10)
        .map((q: any) => ({ q: q.q.slice(0, 600), options: q.options.map((o: string) => o.slice(0, 300)), answer: q.answer, skill: String(q.skill || '').slice(0, 80) }));
      if (questions.length < 5) return res.status(502).json({ error: 'Could not prepare the test. Please try again.' });

      const { data: row, error } = await client
        .from('placement_tests')
        .insert({ auth_user_id: req.studentUser.auth_id, learner_student_id: learner.id, learner_name: learner.name, service_id: serviceId, stated_level: level, language: lang, questions })
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
      if (!test || test.auth_user_id !== req.studentUser.auth_id) return res.status(404).json({ error: 'Test not found.' });
      if (test.status !== 'in_progress') return res.status(400).json({ error: 'This test was already sent.' });
      const answers: any[] = Array.isArray(req.body?.answers) ? req.body.answers : [];
      const questions: any[] = test.questions || [];
      if (answers.length !== questions.length) return res.status(400).json({ error: 'Please answer every question.' });
      const clean = answers.map(a => (Number.isInteger(a) && a >= 0 && a < 4 ? a : -1));
      const score = questions.reduce((s, q, i) => s + (clean[i] === q.answer ? 1 : 0), 0);
      const missed = [...new Set(questions.filter((q, i) => clean[i] !== q.answer).map(q => q.skill).filter(Boolean))];
      const suggested = levelFromScore(score, questions.length);
      const summary = `${score}/${questions.length} correct. Stated level: ${test.stated_level || '-'}; result suggests: ${suggested}.${missed.length ? ` Needs work on: ${missed.join(', ')}.` : ''}`;
      const now = new Date().toISOString();
      const { error } = await client
        .from('placement_tests')
        .update({ answers: clean, score, max_score: questions.length, suggested_level: suggested, ai_summary: summary, status: 'submitted', submitted_at: now })
        .eq('id', test.id)
        .eq('status', 'in_progress');
      if (error) throw error;
      await notifySuperAdmins(client, {
        kind: 'placement_submitted',
        title: { en: `Placement test: ${test.learner_name || 'student'}`, ar: `اختبار تحديد مستوى: ${test.learner_name || 'طالب'}` },
        body: { en: summary, ar: `${score}/${questions.length} إجابة صحيحة. المستوى المقترح: ${suggested}.` },
        link: '/dashboard/placement'
      });
      res.json({ success: true, score, maxScore: questions.length, suggestedLevel: suggested });
    } catch (err) {
      console.error('[POST /api/placement/:id/submit]', err);
      res.status(500).json({ error: 'Could not send the test. Please try again.' });
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
      res.json({ tests: (data || []).map((t: any) => ({ ...publicTest(t), authUserId: t.auth_user_id, questions: t.questions, answers: t.answers, aiSummary: t.ai_summary })) });
    } catch (err) {
      console.error('[GET /api/dashboard/placement-tests]', err);
      res.status(500).json({ error: 'Could not load placement tests.' });
    }
  });

  app.post('/api/dashboard/placement-tests/:id/review', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      const reply = typeof req.body?.reply === 'string' ? req.body.reply.trim().slice(0, 2000) : '';
      const level = LEVELS.includes(req.body?.level) ? req.body.level : null;
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
        link: '/student/messages'
      }, { email: true });
      await sendAdminSupportMessage(client, test.auth_user_id, req.teacherUser.id, reply).catch(() => {});
      res.json({ success: true });
    } catch (err) {
      console.error('[POST /api/dashboard/placement-tests/:id/review]', err);
      res.status(500).json({ error: 'Could not save the review.' });
    }
  });

  // ---- Teacher AI assistant (first version; grows into the teacher workspace)
  app.post('/api/dashboard/ai-assistant', rateLimit, verifyTeacherAuth, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      const task = ['lesson_plan', 'report', 'homework', 'free'].includes(req.body?.task) ? req.body.task : 'free';
      const request = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 3000) : '';
      const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId : '';
      const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
      if (!request && task === 'free') return res.status(400).json({ error: 'Write what you need first.' });
      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'The assistant is not available right now.' });

      // Context only from this teacher's own student (the admin may pick any), and never payment data.
      let context = '';
      if (studentId && client) {
        const { data: st } = await client.from('students').select('id, name, age, current_level, learning_interest, learning_goal, learning_needs, assigned_teacher_id').eq('id', studentId).maybeSingle();
        if (st && (req.teacherUser.role === 'super_admin' || st.assigned_teacher_id === req.teacherUser.id)) {
          const { data: notes } = await client.from('lesson_notes').select('observations, next_steps, created_at').eq('student_id', st.id).order('created_at', { ascending: false }).limit(5);
          const { data: lessons } = await client.from('bookings').select('service_id, scheduled_start, status, duration_minutes').eq('student_id', st.id).order('scheduled_start', { ascending: false }).limit(8);
          context = `Student: ${st.name}; age ${st.age ?? 'unknown'}; level ${st.current_level}; subject ${st.learning_interest}; goal ${st.learning_goal || '-'}; needs ${st.learning_needs || '-'}.
Recent lessons: ${(lessons || []).map((l: any) => `${l.scheduled_start?.slice(0, 10)} ${l.service_id} ${l.duration_minutes}min ${l.status}`).join('; ') || 'none'}.
Teacher notes: ${(notes || []).map((n: any) => String([n.observations, n.next_steps].filter(Boolean).join(' — ')).slice(0, 300)).join(' | ') || 'none'}.`;
        }
      }
      const taskText: Record<string, string> = {
        lesson_plan: 'Prepare a clear lesson plan for the next lesson: goal, warm-up, main activities with timings, practice, quick check, homework.',
        report: 'Write a short, warm progress report for the parent/student: what went well, what to improve, next steps.',
        homework: 'Prepare homework with clear instructions, suitable for the student level and age, plus an answer key for the teacher.',
        free: 'Help the teacher with their request.'
      };
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `${taskText[task]}\n${context ? `\n${context}\n` : ''}\nTeacher's request: ${request || '(none)'}`,
        config: {
          systemInstruction: `You are Jalila (جليلة), the teaching assistant of a teacher at Watazawwado, an online 1-on-1 academy for Quran, Tajweed, Islamic studies (Ahl al-Sunnah wal-Jama'ah, balanced and moderate), Arabic and English. Be practical and concise, use headings and short lists. Answer in ${lang === 'ar' ? 'Arabic' : 'English'}. Never invent facts about the student beyond the context given.`,
          temperature: 0.6
        }
      });
      res.json({ reply: response.text || '' });
    } catch (err) {
      console.error('[POST /api/dashboard/ai-assistant]', err);
      res.status(500).json({ error: 'The assistant could not answer. Please try again.' });
    }
  });
}
