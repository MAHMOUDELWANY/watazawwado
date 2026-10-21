/**
 * RN-06: a learner with paid lessons behind them and nothing booked for 21 days gets one friendly note from our team
 * (on the site, and by email unless the account switched follow-ups off), and the admin gets a CRM follow-up task.
 * At most once per account per 60 days (notification_events keys `quiet_learner:<account>:<date>`).
 *
 * Sends only when QUIET_LEARNER_EMAILS=on on production (owner switch after review), once a day (09:00 UTC hour).
 * The admin can preview the list with a dry run, which reads only.
 */
import { DateTime } from 'luxon';
import { sendEmail } from './emailService.js';
import { renderSimpleNotice } from './emailTemplates.js';
import { resolveEmailLanguage } from './dispatcher.js';
import { notifyUser, resolveLearnerAccount } from './inbox.js';
import { emailAllowed } from './preferences.js';
import { createCrmTask } from '../routes/crm.js';

export const QUIET_DAYS = 21;
export const REPEAT_DAYS = 60;
export const QUIET_BATCH = 50;
const ACTIVE = ['pending', 'confirmed', 'rescheduled', 'completed'];

export const quietEmailsEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.VERCEL_ENV === 'production' && env.QUIET_LEARNER_EMAILS === 'on';
export const isQuietRunHour = (now: DateTime) => now.toUTC().hour === 9;

export function quietNotice(learnerName: string | null, viaParent: boolean) {
  const who = viaParent && learnerName ? { en: learnerName, ar: learnerName } : null;
  return {
    kind: 'quiet_learner',
    title: { en: 'We miss you', ar: 'وحشتونا' },
    body: who
      ? {
          en: `It has been a few weeks since ${who.en}'s last lesson. Whenever you are ready, your teacher is happy to pick up where you left off. If anything got in the way, tell us and we will help.`,
          ar: `بقالنا كام أسبوع من آخر درس لـ${who.ar}. وقت ما تحبوا، المعلم مستني يكمّل معاكم من مكان ما وقفتوا. ولو في حاجة وقفتكم، قولولنا ونساعدكم.`
        }
      : {
          en: 'It has been a few weeks since your last lesson. Whenever you are ready, your teacher is happy to pick up where you left off. If anything got in the way, tell us and we will help.',
          ar: 'بقالنا كام أسبوع من آخر درس ليك. وقت ما تحب، معلمك مستني يكمّل معاك من مكان ما وقفت. ولو في حاجة وقفتك، قول لنا ونساعدك.'
        },
    link: '/student/book'
  };
}

export interface QuietAccount { accountKey: string; userId: string | null; email: string | null; name: string | null; viaParent: boolean; learnerId: string; learnerName: string | null; lastLesson: string }

type Deps = {
  send?: typeof sendEmail;
  notify?: typeof notifyUser;
  resolve?: typeof resolveLearnerAccount;
  emailLang?: typeof resolveEmailLanguage;
  allowed?: typeof emailAllowed;
  task?: typeof createCrmTask;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);

/** Learners with a paid lesson in the last 6 months, the last one 21+ days ago, and nothing booked since. */
export async function findQuietAccounts(client: any, now: DateTime, deps: Deps = {}): Promise<QuietAccount[]> {
  const resolve = deps.resolve || resolveLearnerAccount;
  const cutoff = now.minus({ days: QUIET_DAYS });
  const { data: paid, error } = await client
    .from('bookings')
    .select('student_id, scheduled_start')
    .eq('status', 'completed')
    .neq('booking_type', 'trial')
    .not('student_id', 'is', null)
    .gte('scheduled_start', now.minus({ months: 6 }).toISO())
    .order('scheduled_start', { ascending: false })
    .limit(5000);
  if (error) throw new Error('Could not read lessons.');
  const last = new Map<string, string>();
  for (const b of paid || []) if (!last.has(b.student_id)) last.set(b.student_id, b.scheduled_start);
  const quietIds = [...last].filter(([, at]) => DateTime.fromISO(at) < cutoff).map(([id]) => id);
  if (!quietIds.length) return [];

  const { data: recent } = await client
    .from('bookings')
    .select('student_id')
    .in('student_id', quietIds)
    .in('status', ACTIVE)
    .gte('scheduled_start', cutoff.toISO())
    .limit(5000);
  const busy = new Set((recent || []).map((r: any) => r.student_id));

  const out = new Map<string, QuietAccount>();
  for (const id of quietIds) {
    if (busy.has(id)) continue;
    const acc = await resolve(client, id);
    if (!acc.userId && !acc.email) continue;
    const accountKey = acc.userId || String(acc.email).toLowerCase();
    if (out.has(accountKey)) continue; // one note per family, even with two quiet children
    // A family with another child still taking lessons is not quiet (bookings carry the account's contact email).
    if (acc.email) {
      const { data: familyActive } = await client
        .from('bookings')
        .select('id')
        .ilike('contact_email', escapeLike(acc.email))
        .in('status', ACTIVE)
        .gte('scheduled_start', cutoff.toISO())
        .limit(1);
      if (familyActive?.length) continue;
    }
    out.set(accountKey, { accountKey, userId: acc.userId, email: acc.email, name: acc.viaParent ? null : acc.name, viaParent: acc.viaParent, learnerId: id, learnerName: acc.name, lastLesson: last.get(id)! });
  }
  return [...out.values()];
}

export async function processQuietLearners(
  client: any,
  opts: { now?: DateTime; dryRun?: boolean; limit?: number } = {},
  deps: Deps = {}
): Promise<{ candidates: QuietAccount[]; sent: number; skipped: number }> {
  const now = opts.now || DateTime.utc();
  const limit = opts.limit ?? QUIET_BATCH;
  const send = deps.send || sendEmail;
  const notify = deps.notify || notifyUser;
  const emailLang = deps.emailLang || resolveEmailLanguage;
  const allowed = deps.allowed || emailAllowed;
  const task = deps.task || createCrmTask;
  const out = { candidates: [] as QuietAccount[], sent: 0, skipped: 0 };
  if (!client) return out;

  for (const a of await findQuietAccounts(client, now, deps)) {
    if (out.candidates.length >= limit) break;
    const { data: recentNotes } = await client
      .from('notification_events')
      .select('idempotency_key, status, updated_at')
      .like('idempotency_key', `${escapeLike(`quiet_learner:${a.accountKey}:`)}%`)
      .gte('updated_at', now.minus({ days: REPEAT_DAYS }).toISO());
    if ((recentNotes || []).some((e: any) => e.status !== 'failed')) { out.skipped++; continue; }
    out.candidates.push(a);
    if (opts.dryRun) continue;

    const key = `quiet_learner:${a.accountKey}:${now.toISODate()}`;
    const { data: claim } = await client.rpc('claim_notification_event', { p_key: key, p_type: 'quiet_learner' });
    if (!claim?.claimed || !claim.claim_token) { out.skipped++; continue; }
    const finalize = (ok: boolean, error?: string) =>
      client.rpc('finalize_notification_event', { p_key: key, p_token: claim.claim_token, p_status: ok ? 'sent' : 'failed', p_message_id: null, p_error: error || null });
    try {
      const notice = quietNotice(a.learnerName, a.viaParent);
      if (a.userId) await notify(client, { userId: a.userId }, notice);
      if (a.email && (await allowed(client, a.userId, 'follow_ups'))) {
        const mail = renderSimpleNotice({ name: a.name, title: notice.title, body: notice.body, buttonPath: notice.link, lang: await emailLang(a.email) });
        await send({ to: a.email, toName: a.name || undefined, ...mail, from: 'support' });
      }
      // CRM-04: a follow-up task for the admin on the account's own student record.
      let accountStudentId = a.learnerId;
      if (a.userId) {
        const { data: own } = await client.from('students').select('id').eq('auth_user_id', a.userId).maybeSingle();
        if (own?.id) accountStudentId = own.id;
      }
      await task(client, {
        accountStudentId,
        title: `Quiet for ${QUIET_DAYS}+ days: check in with ${a.learnerName || 'the family'}`,
        dueAt: now.plus({ days: 2 }).toJSDate(),
        source: 'quiet_learner',
        dedupeKey: key
      });
      await finalize(true);
      out.sent++;
    } catch {
      await finalize(false, 'send failed');
    }
  }
  return out;
}
