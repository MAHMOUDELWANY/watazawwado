/**
 * RN-05: 24 hours after an attended free trial, one warm email + on-site notice: the teacher's family summary (if
 * any), the placement result (if taken) and how to continue. Once per learner (notification_events key
 * `trial_followup:<student id>`; a failed email is retried on the next cron run, a sent one never again).
 * Run by the reminder cron. Never throws.
 */
import { sendEmail } from './emailService.js';
import { renderSimpleNotice } from './emailTemplates.js';
import { resolveEmailLanguage } from './dispatcher.js';
import { notifyUser, resolveLearnerAccount } from './inbox.js';

const HOUR = 3_600_000;
/** Sent from 24 h after the trial ends. */
export const FOLLOW_UP_AFTER_MS = 24 * HOUR;
/** The attendance must have been recorded in the last 72 h (a teacher may record it days late)... */
export const RECORDED_WITHIN_MS = 72 * HOUR;
/** ...but a trial older than 14 days is no longer something to follow up. */
export const TRIAL_MAX_AGE_MS = 14 * 24 * HOUR;
/** A failing email is tried at most this many times, an hour apart; after that only the on-site notice goes out. */
export const MAX_EMAIL_ATTEMPTS = 3;
const RETRY_GAP_MS = HOUR;

const LEVEL_NAMES: Record<string, { en: string; ar: string }> = {
  beginner: { en: 'beginner', ar: 'مبتدئ' },
  elementary: { en: 'elementary', ar: 'أساسي' },
  intermediate: { en: 'intermediate', ar: 'متوسط' },
  advanced: { en: 'advanced', ar: 'متقدم' }
};

export interface TrialFollowUpFacts {
  learnerName: string | null;
  familySummary: string | null;
  level: string | null;
}

export function trialFollowUpNotice(f: TrialFollowUpFacts) {
  const who = { en: f.learnerName || 'you', ar: f.learnerName || 'حضرتك' };
  const en: string[] = [`Thank you for the free trial lesson. We hope ${who.en} enjoyed it.`];
  const ar: string[] = [`شكراً على الحصة التجريبية، ونتمنى تكون عجبت ${who.ar}.`];
  if (f.familySummary) {
    en.push(`From the teacher: “${f.familySummary}”`);
    ar.push(`من المعلم: «${f.familySummary}»`);
  }
  const level = f.level ? LEVEL_NAMES[f.level] : null;
  if (level) {
    en.push(`The placement test suggests starting at the ${level.en} level.`);
    ar.push(`اختبار تحديد المستوى بيقترح البداية من المستوى ال${level.ar}.`);
  }
  en.push('To continue, you can book a single lesson or choose a package, whichever suits you. We are here if you have any question.');
  ar.push('عشان تكمل، تقدر تحجز حصة واحدة أو تختار باقة، اللي يناسبك. وإحنا موجودين لو عندك أي سؤال.');
  return {
    kind: 'trial_follow_up',
    title: { en: 'Thank you for the trial lesson', ar: 'شكراً على الحصة التجريبية' },
    body: { en: en.join(' '), ar: ar.join(' ') },
    link: '/student/book'
  };
}

type Deps = {
  send?: typeof sendEmail;
  notify?: typeof notifyUser;
  resolve?: typeof resolveLearnerAccount;
  emailLang?: typeof resolveEmailLanguage;
};

async function factsFor(client: any, trial: any): Promise<TrialFollowUpFacts> {
  const [{ data: sessions }, { data: tests }, { data: student }] = await Promise.all([
    client.from('lesson_sessions').select('id').eq('booking_id', trial.id),
    client
      .from('placement_tests')
      .select('suggested_level, admin_level, status')
      .eq('learner_student_id', trial.student_id)
      .in('status', ['submitted', 'reviewed'])
      .order('created_at', { ascending: false })
      .limit(1),
    client.from('students').select('name').eq('id', trial.student_id).maybeSingle()
  ]);
  let familySummary: string | null = null;
  const sessionIds = (sessions || []).map((s: any) => s.id);
  if (sessionIds.length) {
    const { data: notes } = await client
      .from('lesson_notes')
      .select('family_summary')
      .in('session_id', sessionIds)
      .not('family_summary', 'is', null)
      .limit(1);
    const text = String(notes?.[0]?.family_summary || '').trim();
    familySummary = text ? text.slice(0, 600) : null;
  }
  const test = tests?.[0];
  return {
    learnerName: student?.name || null,
    familySummary,
    level: test ? test.admin_level || test.suggested_level || null : null
  };
}

/** A learner who already booked a paid lesson or bought a package after the trial needs no nudge. */
async function alreadyContinued(client: any, trial: any): Promise<boolean> {
  const [{ data: booked }, { data: bought }] = await Promise.all([
    client
      .from('bookings')
      .select('id')
      .eq('student_id', trial.student_id)
      .neq('booking_type', 'trial')
      .neq('status', 'cancelled')
      .gte('created_at', trial.scheduled_start)
      .limit(1),
    client
      .from('package_entitlements')
      .select('id')
      .eq('learner_student_id', trial.student_id)
      .in('status', ['active', 'exhausted', 'pending_payment'])
      .gte('created_at', trial.scheduled_start)
      .limit(1)
  ]);
  return Boolean(booked?.length || bought?.length);
}

const attemptsOf = (error: string | null | undefined) => Number(/attempt (\d+)/.exec(error || '')?.[1] || 0);

export async function processTrialFollowUps(client: any, now = Date.now(), deps: Deps = {}): Promise<number> {
  if (!client) return 0;
  const send = deps.send || sendEmail;
  const notify = deps.notify || notifyUser;
  const resolve = deps.resolve || resolveLearnerAccount;
  const emailLang = deps.emailLang || resolveEmailLanguage;
  let sent = 0;
  try {
    const { data: trials, error } = await client
      .from('bookings')
      .select('id, student_id, scheduled_start, scheduled_end')
      .eq('booking_type', 'trial')
      .eq('status', 'completed')
      .not('student_id', 'is', null)
      .lte('scheduled_end', new Date(now - FOLLOW_UP_AFTER_MS).toISOString())
      .gte('scheduled_end', new Date(now - TRIAL_MAX_AGE_MS).toISOString())
      .gte('updated_at', new Date(now - RECORDED_WITHIN_MS).toISOString())
      .order('scheduled_end', { ascending: true })
      .limit(200);
    if (error || !trials?.length) return 0;

    // One read of the past attempts, so finished learners don't take a slot and failing emails wait an hour.
    const keyOf = (studentId: string) => `trial_followup:${studentId}`;
    const { data: past } = await client
      .from('notification_events')
      .select('idempotency_key, status, error_details, updated_at')
      .in('idempotency_key', [...new Set(trials.map((t: any) => keyOf(t.student_id)))]);
    const pastByKey = new Map<string, any>((past || []).map((e: any) => [e.idempotency_key, e]));

    const seen = new Set<string>();
    for (const trial of trials) {
      if (seen.has(trial.student_id)) continue;
      seen.add(trial.student_id);
      const key = keyOf(trial.student_id);
      const prev = pastByKey.get(key);
      if (prev && prev.status !== 'failed') continue;
      const attempts = attemptsOf(prev?.error_details);
      if (attempts >= MAX_EMAIL_ATTEMPTS) continue;
      if (prev && now - Date.parse(prev.updated_at) < RETRY_GAP_MS) continue;
      try {
        if (await alreadyContinued(client, trial)) continue;

        const { data: claim } = await client.rpc('claim_notification_event', { p_key: key, p_type: 'trial_follow_up' });
        if (!claim?.claimed || !claim.claim_token) continue;

        const finalize = (ok: boolean, error?: string) =>
          client.rpc('finalize_notification_event', {
            p_key: key,
            p_token: claim.claim_token,
            p_status: ok ? 'sent' : 'failed',
            p_message_id: null,
            p_error: error || null
          });

        const account = await resolve(client, trial.student_id);
        if (!account.userId && !account.email) {
          await finalize(false, `attempt ${MAX_EMAIL_ATTEMPTS}: no recipient`);
          continue;
        }
        const facts = await factsFor(client, trial);
        // For a child the account is the parent's: the child's name goes in the text, the parent is not greeted by it.
        const notice = trialFollowUpNotice({ ...facts, learnerName: account.viaParent ? facts.learnerName : null });

        if (account.email) {
          const lang = await emailLang(account.email);
          const mail = renderSimpleNotice({ name: account.viaParent ? null : account.name, title: notice.title, body: notice.body, buttonPath: notice.link, lang });
          const result = await send({ to: account.email, toName: account.viaParent ? undefined : account.name || undefined, ...mail, from: 'support' });
          if (result?.status !== 'sent') {
            const attempt = attempts + 1;
            const reason = String(result?.status || 'send failed');
            if (attempt < MAX_EMAIL_ATTEMPTS) {
              // Retried in an hour; nothing on-site yet, so the retry cannot duplicate it.
              await finalize(false, `attempt ${attempt}: ${reason}`);
              continue;
            }
            // Last try: the email will not go out, but the family still gets the on-site notice.
            if (account.userId) await notify(client, { userId: account.userId }, notice);
            await finalize(false, `attempt ${attempt} (final, on-site only): ${reason}`);
            continue;
          }
        }
        if (account.userId) await notify(client, { userId: account.userId }, notice);
        await finalize(true);
        sent++;
      } catch (err) {
        console.warn('[Trial follow-up] learner failed:', trial.student_id, err);
      }
    }
  } catch (err) {
    console.warn('[Trial follow-up] run failed:', err);
  }
  return sent;
}
