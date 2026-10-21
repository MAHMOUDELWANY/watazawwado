/**
 * PR-09: on the first days of each month, one short email per account (the guardian for children) about last month's
 * lessons, with a link to the PR-08 report. Never twice for the same month (notification_events key
 * `monthly_progress:<yyyy-MM>:<account>`); at most MONTHLY_BATCH per run so the Brevo free plan (300/day) keeps room for
 * booking emails, and the next cron run carries on. Accounts that switched progress emails off get nothing.
 *
 * It only sends when MONTHLY_PROGRESS_EMAILS=on on production (owner switch after review). Until then the admin can
 * preview the recipients with a dry run, which reads only.
 */
import { DateTime } from 'luxon';
import { sendEmail } from './emailService.js';
import { renderMonthlyProgressEmail } from './emailTemplates.js';
import { resolveEmailLanguage } from './dispatcher.js';
import { resolveLearnerAccount } from './inbox.js';
import { emailAllowed } from './preferences.js';

export const MONTHLY_BATCH = 150;
/** Sent on the 1st to the 5th (UTC), so a long list can finish over several days. */
export const SEND_DAYS = 5;

export const monthlyEmailsEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.VERCEL_ENV === 'production' && env.MONTHLY_PROGRESS_EMAILS === 'on';

export function reportMonthFor(now: DateTime): string {
  return now.toUTC().startOf('month').minus({ months: 1 }).toFormat('yyyy-MM');
}

export const isSendWindow = (now: DateTime) => now.toUTC().day <= SEND_DAYS;

export interface LearnerMonth { learnerId: string; learnerName: string | null; lessons: number }
export interface MonthlyRecipient {
  key: string;
  userId: string | null;
  email: string;
  name: string | null;
  viaParent: boolean;
  learners: LearnerMonth[];
}

export function monthLabel(month: string): { en: string; ar: string } {
  const d = DateTime.fromISO(`${month}-01`);
  return { en: d.setLocale('en').toFormat('LLLL yyyy'), ar: d.setLocale('ar').toFormat('LLLL yyyy') };
}

/** One line per learner, in both languages. */
export function summaryLines(r: Pick<MonthlyRecipient, 'learners' | 'viaParent'>): Array<{ en: string; ar: string }> {
  return r.learners.map((l) => {
    const n = l.lessons;
    const en = `${n} lesson${n === 1 ? '' : 's'}`;
    const ar = n === 1 ? 'درس واحد' : n === 2 ? 'درسين' : n <= 10 ? `${n} دروس` : `${n} درس`;
    if (r.viaParent || r.learners.length > 1) {
      return { en: `${l.learnerName || 'Your child'} took ${en} last month.`, ar: `${l.learnerName || 'طفلك'} حضر ${ar} الشهر اللي فات.` };
    }
    return { en: `You took ${en} with us last month. Well done.`, ar: `حضرت معانا ${ar} الشهر اللي فات. ما شاء الله.` };
  });
}

type Deps = {
  send?: typeof sendEmail;
  resolve?: typeof resolveLearnerAccount;
  emailLang?: typeof resolveEmailLanguage;
  allowed?: typeof emailAllowed;
};

/** Accounts with at least one attended lesson in the month, grouped (a family gets one email for all children). */
export async function collectRecipients(client: any, month: string, deps: Deps = {}): Promise<MonthlyRecipient[]> {
  const resolve = deps.resolve || resolveLearnerAccount;
  const start = DateTime.fromISO(`${month}-01`, { zone: 'utc' });
  const { data: rows, error } = await client
    .from('bookings')
    .select('student_id')
    .eq('status', 'completed')
    .not('student_id', 'is', null)
    .gte('scheduled_start', start.toISO())
    .lt('scheduled_start', start.plus({ months: 1 }).toISO())
    .limit(5000);
  if (error) throw new Error('Could not read the month\'s lessons.');
  const counts = new Map<string, number>();
  for (const r of rows || []) counts.set(r.student_id, (counts.get(r.student_id) || 0) + 1);

  const byAccount = new Map<string, MonthlyRecipient>();
  for (const [learnerId, lessons] of counts) {
    const acc = await resolve(client, learnerId);
    if (!acc.email) continue;
    const accountId = acc.userId || acc.email.toLowerCase();
    const key = `monthly_progress:${month}:${accountId}`;
    const entry = byAccount.get(key) || { key, userId: acc.userId, email: acc.email, name: acc.viaParent ? null : acc.name, viaParent: acc.viaParent, learners: [] };
    entry.viaParent = entry.viaParent || acc.viaParent;
    if (entry.viaParent) entry.name = null;
    entry.learners.push({ learnerId, learnerName: acc.name, lessons });
    byAccount.set(key, entry);
  }
  return [...byAccount.values()];
}

/**
 * dryRun: returns who would get the email (minus opted-out and already-sent accounts) and writes nothing.
 * Otherwise claims each account for the month, sends, and finalises; a failed send is retried by a later run.
 */
export async function processMonthlyProgressEmails(
  client: any,
  opts: { now?: DateTime; dryRun?: boolean; month?: string; limit?: number } = {},
  deps: Deps = {}
): Promise<{ month: string; recipients: MonthlyRecipient[]; sent: number; skipped: number }> {
  const now = opts.now || DateTime.utc();
  const month = opts.month || reportMonthFor(now);
  const limit = opts.limit ?? MONTHLY_BATCH;
  const send = deps.send || sendEmail;
  const emailLang = deps.emailLang || resolveEmailLanguage;
  const allowed = deps.allowed || emailAllowed;
  const out = { month, recipients: [] as MonthlyRecipient[], sent: 0, skipped: 0 };
  if (!client) return out;

  const all = await collectRecipients(client, month, deps);
  const { data: past } = all.length
    ? await client.from('notification_events').select('idempotency_key, status').in('idempotency_key', all.map((r) => r.key))
    : { data: [] as any[] };
  const done = new Set((past || []).filter((e: any) => e.status !== 'failed').map((e: any) => e.idempotency_key));

  for (const r of all) {
    if (out.recipients.length >= limit) break;
    if (done.has(r.key) || !(await allowed(client, r.userId, 'progress_emails'))) { out.skipped++; continue; }
    out.recipients.push(r);
    if (opts.dryRun) continue;

    const { data: claim } = await client.rpc('claim_notification_event', { p_key: r.key, p_type: 'monthly_progress' });
    if (!claim?.claimed || !claim.claim_token) { out.skipped++; continue; }
    const finalize = (ok: boolean, error?: string) =>
      client.rpc('finalize_notification_event', { p_key: r.key, p_token: claim.claim_token, p_status: ok ? 'sent' : 'failed', p_message_id: null, p_error: error || null });
    try {
      const mail = renderMonthlyProgressEmail({
        name: r.name,
        monthLabel: monthLabel(month),
        lines: summaryLines(r),
        reportPath: `/student/progress/report?month=${month}`,
        lang: await emailLang(r.email)
      });
      const result = await send({ to: r.email, toName: r.name || undefined, ...mail, from: 'support' });
      if (result?.status === 'sent') { await finalize(true); out.sent++; }
      else await finalize(false, String(result?.status || 'send failed'));
    } catch (err) {
      await finalize(false, 'send threw');
      console.warn('[Monthly progress] send failed for one account');
    }
  }
  return out;
}
