/**
 * NX-10 (owner 2026-11-01: "بالإيميل ببلاش"): once a week, one short email per account (the guardian for children)
 * about the week that just ended: lessons attended, the teacher's latest family summary, and homework still open.
 * Also an on-site notice. Never twice for the same week (notification_events key `weekly_digest:<week>:<account>`);
 * at most WEEKLY_BATCH per run (Brevo free plan: 300/day), the next run carries on. Accounts that switched progress
 * emails off get nothing. Sent on Sunday from 12:00 UTC, so the week is almost over; on by default on production
 * (the owner chose it), WEEKLY_DIGEST_EMAILS=off stops it.
 */
import { DateTime } from 'luxon';
import { sendEmail } from './emailService.js';
import { renderWeeklyDigestEmail } from './emailTemplates.js';
import { resolveEmailLanguage } from './dispatcher.js';
import { notifyUser, resolveLearnerAccount } from './inbox.js';
import { emailAllowed } from './preferences.js';
import { SURAHS } from '../../src/lib/surahs.js';

export const WEEKLY_BATCH = 100;
type L = { en: string; ar: string };

export const weeklyDigestEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.VERCEL_ENV === 'production' && env.WEEKLY_DIGEST_EMAILS !== 'off';
/** Sunday from 12:00 (UTC). */
export const isDigestDay = (now: DateTime) => now.toUTC().weekday === 7 && now.toUTC().hour >= 12;

/** The week being summarised: Monday 00:00 to the next Monday (UTC), and its key. */
export function digestWeek(now: DateTime): { start: DateTime; end: DateTime; key: string } {
  const start = now.toUTC().startOf('week');
  return { start, end: start.plus({ weeks: 1 }), key: start.toFormat("kkkk-'W'WW") };
}

export interface LearnerWeek { learnerId: string; learnerName: string | null; lessons: number; summary: string | null; homework: L[] }

const lessonsText = (n: number): L => ({
  en: `${n} lesson${n === 1 ? '' : 's'}`,
  ar: n === 1 ? 'درس واحد' : n === 2 ? 'درسين' : n <= 10 ? `${n} دروس` : `${n} درس`,
});

export function homeworkText(h: { kind: string; surah: number | null; ayah_from: number | null; ayah_to: number | null; body: string | null }): L {
  if (h.kind === 'recite' && h.surah) {
    const s = SURAHS.find((x) => x.n === h.surah);
    const n = (v: number | null) => Number(v).toLocaleString('ar-EG');
    return { en: `Surah ${s?.en}, ayat ${h.ayah_from}-${h.ayah_to}`, ar: `سورة ${s?.ar}، من آية ${n(h.ayah_from)} لـ ${n(h.ayah_to)}` };
  }
  return { en: h.body || '', ar: h.body || '' };
}

/** The email's paragraphs: per learner, the lessons, the teacher's words and the homework. */
export function digestParagraphs(learners: LearnerWeek[], viaParent: boolean): L[] {
  const out: L[] = [];
  for (const l of learners) {
    const who = viaParent || learners.length > 1 ? (l.learnerName || null) : null;
    const t = lessonsText(l.lessons);
    out.push(who
      ? { en: `${who} took ${t.en} this week.`, ar: `حصص ${who} هذا الأسبوع: ${t.ar}.` }
      : { en: `You took ${t.en} with us this week.`, ar: `حضرت معنا ${t.ar} هذا الأسبوع.` });
    if (l.summary) out.push({ en: `From the teacher: ${l.summary}`, ar: `من المعلم: ${l.summary}` });
    if (l.homework.length) {
      out.push({ en: `Homework for next time: ${l.homework.map((h) => h.en).join('; ')}.`, ar: `واجب الحصة القادمة: ${l.homework.map((h) => h.ar).join('، ')}.` });
    }
  }
  return out;
}

type Deps = { send?: typeof sendEmail; resolve?: typeof resolveLearnerAccount; emailLang?: typeof resolveEmailLanguage; allowed?: typeof emailAllowed; notify?: typeof notifyUser };

export async function collectWeek(client: any, now: DateTime, deps: Deps = {}) {
  const resolve = deps.resolve || resolveLearnerAccount;
  const { start, end, key } = digestWeek(now);
  const { data: rows, error } = await client.from('bookings').select('student_id')
    .eq('status', 'completed').not('student_id', 'is', null)
    .gte('scheduled_start', start.toISO()).lt('scheduled_start', end.toISO()).limit(5000);
  if (error) throw new Error('Could not read the week\'s lessons.');
  const counts = new Map<string, number>();
  for (const r of rows || []) counts.set(r.student_id, (counts.get(r.student_id) || 0) + 1);
  const ids = [...counts.keys()];
  if (!ids.length) return { key, recipients: [] as Array<{ key: string; userId: string | null; email: string; name: string | null; viaParent: boolean; learners: LearnerWeek[] }> };

  const [{ data: notes }, { data: hw }] = await Promise.all([
    client.from('lesson_notes').select('student_id, family_summary, created_at').in('student_id', ids)
      .not('family_summary', 'is', null).gte('created_at', start.toISO()).order('created_at', { ascending: false }),
    client.from('lesson_homework').select('student_id, kind, surah, ayah_from, ayah_to, body').in('student_id', ids).is('review', null).is('done_at', null),
  ]);
  const summaryOf = new Map<string, string>();
  for (const n of notes || []) if (!summaryOf.has(n.student_id) && String(n.family_summary).trim()) summaryOf.set(n.student_id, String(n.family_summary).trim().slice(0, 400));

  const byAccount = new Map<string, { key: string; userId: string | null; email: string; name: string | null; viaParent: boolean; learners: LearnerWeek[] }>();
  for (const [learnerId, lessons] of counts) {
    const acc = await resolve(client, learnerId);
    if (!acc.email) continue;
    const k = `weekly_digest:${key}:${acc.userId || acc.email.toLowerCase()}`;
    const entry = byAccount.get(k) || { key: k, userId: acc.userId, email: acc.email, name: acc.viaParent ? null : acc.name, viaParent: acc.viaParent, learners: [] };
    entry.viaParent = entry.viaParent || acc.viaParent;
    if (entry.viaParent) entry.name = null;
    entry.learners.push({
      learnerId, learnerName: acc.name, lessons, summary: summaryOf.get(learnerId) || null,
      homework: (hw || []).filter((h: any) => h.student_id === learnerId).slice(0, 3).map(homeworkText),
    });
    byAccount.set(k, entry);
  }
  return { key, recipients: [...byAccount.values()] };
}

export async function processWeeklyDigest(client: any, opts: { now?: DateTime; dryRun?: boolean; limit?: number } = {}, deps: Deps = {}) {
  const now = opts.now || DateTime.utc();
  const send = deps.send || sendEmail;
  const emailLang = deps.emailLang || resolveEmailLanguage;
  const allowed = deps.allowed || emailAllowed;
  const notify = deps.notify || notifyUser;
  const limit = opts.limit ?? WEEKLY_BATCH;
  const out = { week: digestWeek(now).key, recipients: 0, sent: 0, skipped: 0 };
  if (!client) return out;

  const doneKey = `weekly_digest_done:${out.week}`;
  if (!opts.dryRun) {
    const { data: finished } = await client.from('notification_events').select('idempotency_key').in('idempotency_key', [doneKey]);
    if (finished?.length) return out;
  }
  const { recipients } = await collectWeek(client, now, deps);
  const { data: past } = recipients.length
    ? await client.from('notification_events').select('idempotency_key, status').in('idempotency_key', recipients.map((r) => r.key))
    : { data: [] as any[] };
  const done = new Set((past || []).filter((e: any) => e.status !== 'failed').map((e: any) => e.idempotency_key));

  for (const r of recipients) {
    if (out.recipients >= limit) break;
    if (done.has(r.key) || !(await allowed(client, r.userId, 'progress_emails'))) { out.skipped++; continue; }
    out.recipients++;
    if (opts.dryRun) continue;
    const { data: claim } = await client.rpc('claim_notification_event', { p_key: r.key, p_type: 'weekly_digest' });
    if (!claim?.claimed || !claim.claim_token) { out.skipped++; continue; }
    const finalize = (ok: boolean, error?: string) =>
      client.rpc('finalize_notification_event', { p_key: r.key, p_token: claim.claim_token, p_status: ok ? 'sent' : 'failed', p_message_id: null, p_error: error || null });
    try {
      const paragraphs = digestParagraphs(r.learners, r.viaParent);
      const mail = renderWeeklyDigestEmail({ name: r.name, paragraphs, lang: await emailLang(r.email) });
      const result = await send({ to: r.email, toName: r.name || undefined, ...mail, from: 'support' });
      if (r.userId) {
        await notify(client, { userId: r.userId }, {
          kind: 'weekly_digest', title: { en: 'Your week with us', ar: 'أسبوعك معنا' },
          body: { en: paragraphs.map((p) => p.en).join(' '), ar: paragraphs.map((p) => p.ar).join(' ') }, link: '/student',
        });
      }
      if (result?.status === 'sent') { await finalize(true); out.sent++; } else await finalize(false, String(result?.status || 'send failed'));
    } catch {
      await finalize(false, 'send threw');
      console.warn('[Weekly digest] send failed for one account');
    }
  }
  if (!opts.dryRun && out.recipients === 0) {
    const { data: claim } = await client.rpc('claim_notification_event', { p_key: doneKey, p_type: 'weekly_digest_done' });
    if (claim?.claimed && claim.claim_token) {
      await client.rpc('finalize_notification_event', { p_key: doneKey, p_token: claim.claim_token, p_status: 'sent', p_message_id: null, p_error: null });
    }
  }
  return out;
}
