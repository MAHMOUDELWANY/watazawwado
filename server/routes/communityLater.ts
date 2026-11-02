import express from 'express';
import { collectAttendedLessons, computeLessonsAttended, computeWeeklyRhythm, isUuid, normalizeSubjectSlug } from './progress.js';
import { notifyUser } from '../notifications/inbox.js';

/**
 * CM-04, the later part of the community (owner 2026-11-02: all three; design
 * docs/superpowers/specs/2026-10-20-milestone-celebration-design.md):
 * - Automatic suggestions: the system proposes rhythm milestones (100 and 200 lessons, a year of weekly lessons) for
 *   each learner and lessons-together milestones for each family. The super admin decides; nothing is put forward
 *   on its own. A learner's suggestion becomes a normal milestone, then the usual Hall of Honor consent flow.
 * - Family achievements: the account holder chooses whether "the X family completed 100 lessons together" shows on
 *   the Hall of Honor (signed-in families only) and under which family name; they can take it down any time.
 * Photos on entries live in honor.ts, next to the consent rules they extend.
 */
type Middleware = (req: any, res: any, next: any) => any;

export const LEARNER_KEYS = {
  lessons_100: { en: '100 lessons with us', ar: '١٠٠ حصة معانا' },
  lessons_200: { en: '200 lessons with us', ar: '٢٠٠ حصة معانا' },
  weekly_year: { en: 'A full year of weekly lessons', ar: 'سنة كاملة من الحصص كل أسبوع' },
} as const;
export type LearnerKey = keyof typeof LEARNER_KEYS;

export const FAMILY_KEYS = { family_lessons_100: 100, family_lessons_250: 250, family_lessons_500: 500 } as const;
export type FamilyKey = keyof typeof FAMILY_KEYS;

/** The rhythm milestones a learner has reached. */
export function learnerKeysReached(total: number, longestWeeks: number): LearnerKey[] {
  const keys: LearnerKey[] = [];
  if (total >= 100) keys.push('lessons_100');
  if (total >= 200) keys.push('lessons_200');
  if (longestWeeks >= 52) keys.push('weekly_year');
  return keys;
}

/** The lessons-together milestones a family has reached (two or more learners who attended). */
export function familyKeysReached(totals: number[]): FamilyKey[] {
  if (totals.filter((n) => n > 0).length < 2) return [];
  const sum = totals.reduce((a, b) => a + b, 0);
  return (Object.keys(FAMILY_KEYS) as FamilyKey[]).filter((k) => sum >= FAMILY_KEYS[k]);
}

export function familyTitle(lessons: number) {
  return { en: `Completed ${lessons} lessons together`, ar: `أتمّت ${lessons.toLocaleString('ar-EG')} حصة معًا` };
}

/** The family name shown by default: "The Ahmad family" / "أسرة أحمد", from the account holder's first name. */
export function defaultFamilyName(holderName: string | null | undefined, isAr: boolean): string {
  const first = String(holderName || '').trim().split(/\s+/)[0] || '';
  if (!first) return isAr ? 'أسرة من أسرنا' : 'One of our families';
  return (isAr ? `أسرة ${first}` : `The ${first} family`).slice(0, 40);
}

/** Lifetime attended lessons and the longest weekly run, counted like the progress page. */
async function lifetimeFor(client: any, students: any[]) {
  const out = new Map<string, { total: number; longest: number }>();
  const ids = students.map((s) => s.id);
  if (!ids.length) return out;
  // shortcut: reads up to 20k rows in one go; page it when the academy grows past that.
  const [{ data: bookings, error: bErr }, { data: sessions, error: sErr }] = await Promise.all([
    client.from('bookings').select('id, student_id, service_id, status, scheduled_start, created_at').in('student_id', ids).eq('status', 'completed').limit(20000),
    client.from('lesson_sessions').select('id, booking_id, student_id, lesson_date, attendance, completion_status, created_at').in('student_id', ids).limit(20000),
  ]);
  if (bErr || sErr) throw bErr || sErr;
  for (const s of students) {
    const dates = collectAttendedLessons(
      (bookings || []).filter((b: any) => b.student_id === s.id),
      (sessions || []).filter((x: any) => x.student_id === s.id),
      normalizeSubjectSlug(s.learning_interest) || 'quran-reading'
    ).map((l) => l.dateIso);
    const tz = s.timezone || 'UTC';
    out.set(s.id, { total: computeLessonsAttended(dates, tz).total, longest: computeWeeklyRhythm(dates, tz).longest });
  }
  return out;
}

/** Each learner's family account (guardian's account for a child, else the learner's own). */
function accountsOf(students: any[], guardians: any[]): Map<string, string> {
  const accountByEmail = new Map<string, string>();
  for (const s of students) if (s.auth_user_id && s.email) accountByEmail.set(String(s.email).toLowerCase(), s.auth_user_id);
  const out = new Map<string, string>();
  for (const s of students) {
    const g = guardians.find((r) => r.student_id === s.id);
    const viaParent = g ? accountByEmail.get(String(g.parent_email || '').toLowerCase()) : undefined;
    const account = viaParent || s.auth_user_id;
    if (account) out.set(s.id, account);
  }
  return out;
}

export function registerCommunityLaterRoutes(app: express.Express, deps: {
  getClient: () => any;
  rateLimit: Middleware;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
}) {
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };

  // Super admin: what the system suggests, and the family achievements already put forward.
  app.get('/api/dashboard/honor/suggestions', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const [{ data: students, error: sErr }, { data: guardians }, { data: autoMilestones }, { data: families }] = await Promise.all([
        client.from('students').select('id, name, email, auth_user_id, timezone, learning_interest, status').neq('status', 'archived').limit(5000),
        client.from('guardians').select('student_id, parent_email').limit(10000),
        client.from('learner_milestones').select('student_id, auto_key').not('auto_key', 'is', null),
        client.from('family_achievements').select('id, account_user_id, auto_key, lessons, title_en, title_ar, status, display_name, published_at, created_at').order('created_at', { ascending: false }),
      ]);
      if (sErr) throw sErr;
      const life = await lifetimeFor(client, students || []);
      const done = new Set((autoMilestones || []).map((m: any) => `${m.student_id}|${m.auto_key}`));
      const learners = (students || []).flatMap((s: any) => {
        const l = life.get(s.id) || { total: 0, longest: 0 };
        return learnerKeysReached(l.total, l.longest).filter((k) => !done.has(`${s.id}|${k}`))
          .map((key) => ({ studentId: s.id, name: s.name, key, lessons: l.total, weeks: l.longest, titleEn: LEARNER_KEYS[key].en, titleAr: LEARNER_KEYS[key].ar }));
      });

      const accountOf = accountsOf(students || [], guardians || []);
      const byAccount = new Map<string, any[]>();
      for (const s of students || []) {
        const a = accountOf.get(s.id);
        if (a) byAccount.set(a, [...(byAccount.get(a) || []), s]);
      }
      const holderName = (account: string) => (students || []).find((s: any) => s.auth_user_id === account)?.name || null;
      const taken = new Set((families || []).map((f: any) => `${f.account_user_id}|${f.auto_key}`));
      const familySuggestions = [...byAccount.entries()].flatMap(([account, members]) => {
        const totals = members.map((m) => life.get(m.id)?.total || 0);
        const sum = totals.reduce((a, b) => a + b, 0);
        return familyKeysReached(totals).filter((k) => !taken.has(`${account}|${k}`))
          .map((key) => ({ accountUserId: account, holderName: holderName(account), key, lessons: FAMILY_KEYS[key], totalLessons: sum, learners: members.map((m) => m.name) }));
      });
      return res.json({ learners, families: familySuggestions, familyEntries: (families || []).map((f: any) => ({ ...f, holder_name: holderName(f.account_user_id) })) });
    } catch (err: any) {
      console.error('[honor suggestions]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the suggestions.' });
    }
  });

  // Super admin: turn a learner suggestion into a milestone (then put it forward as usual).
  app.post('/api/dashboard/honor/suggestions/learner', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const studentId = String(req.body?.studentId || '');
    const key = req.body?.key as LearnerKey;
    if (!isUuid(studentId) || !(key in LEARNER_KEYS)) return res.status(400).json({ error: 'Unknown suggestion.' });
    const { data: s } = await client.from('students').select('id, learning_interest').eq('id', studentId).maybeSingle();
    if (!s) return res.status(404).json({ error: 'Learner not found.' });
    const { data, error } = await client.from('learner_milestones').insert({
      student_id: studentId, subject: normalizeSubjectSlug(s.learning_interest) || 'quran-reading', kind: 'custom', auto_key: key,
      title_en: LEARNER_KEYS[key].en, title_ar: LEARNER_KEYS[key].ar, reached_at: new Date().toISOString(),
      created_by: isUuid(req.teacherUser?.id) ? req.teacherUser.id : null,
    }).select('id').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'This milestone was already recorded.' });
      console.error('[honor suggestion learner]', error.message);
      return res.status(500).json({ error: 'Could not record it.' });
    }
    return res.status(201).json({ milestoneId: data.id });
  });

  // Super admin: put a family achievement forward; the account holder decides in the portal.
  app.post('/api/dashboard/honor/suggestions/family', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const account = String(req.body?.accountUserId || '');
    const key = req.body?.key as FamilyKey;
    if (!isUuid(account) || !(key in FAMILY_KEYS)) return res.status(400).json({ error: 'Unknown suggestion.' });
    const lessons = FAMILY_KEYS[key];
    const title = familyTitle(lessons);
    const { data, error } = await client.from('family_achievements').insert({
      account_user_id: account, auto_key: key, lessons, title_en: title.en, title_ar: title.ar,
      nominated_by: isUuid(req.teacherUser?.id) ? req.teacherUser.id : null,
    }).select('id').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'This family achievement was already put forward.' });
      console.error('[honor suggestion family]', error.message);
      return res.status(500).json({ error: 'Could not put it forward.' });
    }
    await notifyUser(client, { userId: account }, {
      kind: 'family_achievement',
      title: { en: 'MashaAllah, your family reached a milestone', ar: 'ما شاء الله، أسرتكم وصلت لإنجاز' },
      body: { en: `Your family completed ${lessons} lessons together. Would you like it on our Hall of Honor? You choose.`, ar: `أسرتكم أتمّت ${lessons} حصة معًا. تحبوا يظهر في لوحة الشرف؟ القرار ليكم.` },
      link: '/student/community',
    });
    return res.status(201).json({ id: data.id });
  });

  // Super admin: take a family achievement down.
  app.post('/api/dashboard/honor/family/:id/remove', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Not found.' });
    const { data } = await client.from('family_achievements').update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('id', req.params.id).neq('status', 'removed').select('id').maybeSingle();
    if (!data) return res.status(404).json({ error: 'Not found.' });
    return res.json({ status: 'removed' });
  });

  // Family (account holder): my family achievements.
  app.get('/api/student/community/family', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const account = req.studentUser?.auth_id;
    if (!isUuid(account) || req.childDevice) return res.json({ achievements: [] });
    const { data, error } = await client.from('family_achievements').select('id, lessons, title_en, title_ar, status, display_name, published_at')
      .eq('account_user_id', account).neq('status', 'removed').order('created_at', { ascending: false });
    if (error) { console.error('[family achievements]', error.message); return res.status(500).json({ error: 'Could not load.' }); }
    return res.json({ achievements: data || [], defaultName: { ar: defaultFamilyName(req.studentUser?.name, true), en: defaultFamilyName(req.studentUser?.name, false) } });
  });

  // Family: yes (with the family name) or no; or take it down later.
  app.post('/api/student/community/family/:id/decision', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const account = req.studentUser?.auth_id;
    if (!isUuid(account) || !isUuid(req.params.id) || req.childDevice) return res.status(403).json({ error: 'Only the account holder decides.' });
    const decision = req.body?.decision;
    const now = new Date().toISOString();
    let patch: Record<string, unknown>;
    let from: string[];
    if (decision === 'yes') {
      const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ').slice(0, 40) || defaultFamilyName(req.studentUser?.name, req.body?.lang === 'ar');
      patch = { status: 'published', display_name: name, decided_at: now, published_at: now, updated_at: now };
      from = ['awaiting_consent', 'declined', 'withdrawn'];
    } else if (decision === 'no') {
      patch = { status: 'declined', decided_at: now, updated_at: now };
      from = ['awaiting_consent'];
    } else if (decision === 'withdraw') {
      patch = { status: 'withdrawn', decided_at: now, updated_at: now };
      from = ['published'];
    } else return res.status(400).json({ error: 'Unknown choice.' });
    const { data } = await client.from('family_achievements').update(patch).eq('id', req.params.id).eq('account_user_id', account).in('status', from).select('status').maybeSingle();
    if (!data) return res.status(409).json({ error: 'This choice is not available now.' });
    return res.json({ status: data.status });
  });
}
