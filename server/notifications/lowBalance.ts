/**
 * RN-02: one calm on-site notice + email when a package reaches 2 lessons left, and again at 0.
 * Once per threshold per package: the first writer marks package_entitlements.metadata, later calls find it set.
 * Never throws: a failed notice must not fail recording the lesson.
 */
import { notifyUser, resolveLearnerAccount } from './inbox.js';

export const LOW_BALANCE_THRESHOLDS = [2, 0] as const;
export type LowBalanceThreshold = (typeof LOW_BALANCE_THRESHOLDS)[number];

export const lowBalanceKey = (t: LowBalanceThreshold) => `low_balance_${t}_notified_at`;

interface EntitlementRow {
  id: string;
  status: string;
  purchased_quantity: number | null;
  remaining_credits: number | null;
  learner_student_id: string | null;
  metadata: Record<string, any> | null;
}

/** The threshold this package just reached and has not been told about yet, or null. */
export function lowBalanceThreshold(ent: EntitlementRow | null | undefined): LowBalanceThreshold | null {
  if (!ent) return null;
  const meta = ent.metadata || {};
  // A cancelled-lesson credit is not a package; refunded / cancelled / refund-requested packages get nothing.
  if (meta.source === 'cancellation_credit' || meta.refund_requested_at) return null;
  if (ent.status !== 'active' && ent.status !== 'exhausted') return null;
  const left = Number(ent.remaining_credits);
  const size = Number(ent.purchased_quantity);
  const t = LOW_BALANCE_THRESHOLDS.find((x) => x === left);
  // size > t: a 2-lesson package starting at 2 has not "reached" anything.
  if (t === undefined || !(size > t)) return null;
  return meta[lowBalanceKey(t)] ? null : t;
}

const enLessons = (n: number) => `${n} ${n === 1 ? 'lesson' : 'lessons'}`;
const arSize = (n: number) => (n >= 3 && n <= 10 ? `${n} حصص` : `${n} حصة`);

export function lowBalanceNotice(t: LowBalanceThreshold, size: number, learnerName: string | null, entitlementId?: string) {
  // RN-03: the link opens the packages page with this same package selected for renewal.
  const link = entitlementId ? `/student/packages?renew=${encodeURIComponent(entitlementId)}` : '/student/packages';
  const forEn = learnerName ? ` for ${learnerName}` : '';
  const forAr = learnerName ? ` لـ ${learnerName}` : '';
  if (t === 2) {
    return {
      kind: 'package_low_balance',
      title: { en: `2 lessons left in your package${forEn}`, ar: `باقي حصتين في باقتك${forAr}` },
      body: {
        en: `Your ${enLessons(size)} package${forEn} has 2 lessons left. When you are ready, you can renew the same package from your packages page.`,
        ar: `باقة الـ ${arSize(size)}${forAr} فاضل فيها حصتين. لما تحب، تقدر تجدد نفس الباقة من صفحة الباقات.`
      },
      link
    };
  }
  return {
    kind: 'package_used_up',
    title: { en: `Your package${forEn} is complete`, ar: `خلصت حصص باقتك${forAr}` },
    body: {
      en: `All ${enLessons(size)} of your package${forEn} are done. You can renew the same package or book a single lesson whenever you like.`,
      ar: `خلصت الـ ${arSize(size)} اللي في باقتك${forAr}، زادك الله. تقدر تجدد نفس الباقة أو تحجز حصة واحدة في أي وقت يناسبك.`
    },
    link
  };
}

/**
 * The person who renews is the one who paid (purchaser_account_id), e.g. the parent of a teen with their own login.
 * learnerName is set when the learner is someone else, so the text says whose package it is.
 */
async function resolveRecipient(
  client: any,
  ent: { learner_student_id: string | null; purchaser_account_id?: string | null },
  resolve: typeof resolveLearnerAccount
): Promise<{ userId: string | null; email: string | null; name: string | null; learnerName: string | null }> {
  const { data: learner } = ent.learner_student_id
    ? await client.from('students').select('name, auth_user_id').eq('id', ent.learner_student_id).maybeSingle()
    : { data: null };
  if (ent.purchaser_account_id) {
    const [{ data: profile }, { data: own }] = await Promise.all([
      client.from('profiles').select('email').eq('id', ent.purchaser_account_id).maybeSingle(),
      client.from('students').select('name').eq('auth_user_id', ent.purchaser_account_id).limit(1)
    ]);
    const learnerIsPayer = learner?.auth_user_id === ent.purchaser_account_id;
    return {
      userId: ent.purchaser_account_id,
      email: profile?.email || null,
      name: own?.[0]?.name || null,
      learnerName: learner && !learnerIsPayer ? learner.name : null
    };
  }
  // Older packages without a purchaser: the account that owns the learner (the parent for a child).
  const account = await resolve(client, ent.learner_student_id);
  return {
    userId: account.userId,
    email: account.email,
    // For a child, account.name is the child's: the parent is not greeted by it; the child's name goes in the text.
    name: account.viaParent ? null : account.name,
    learnerName: account.viaParent ? account.name : null
  };
}

export async function notifyLowBalance(
  client: any,
  entitlementId: string | null | undefined,
  deps: { notify?: typeof notifyUser; resolve?: typeof resolveLearnerAccount } = {}
): Promise<LowBalanceThreshold | null> {
  if (!client || !entitlementId) return null;
  const notify = deps.notify || notifyUser;
  const resolve = deps.resolve || resolveLearnerAccount;
  try {
    const { data: ent, error } = await client
      .from('package_entitlements')
      .select('id, status, purchased_quantity, remaining_credits, learner_student_id, purchaser_account_id, metadata, updated_at')
      .eq('id', entitlementId)
      .maybeSingle();
    if (error) return null;
    const t = lowBalanceThreshold(ent);
    if (t === null) return null;

    // Claim: only the update that still finds the key unset wins, so a retry or a parallel call sends nothing.
    // updated_at must also be unchanged, so metadata another writer just changed is never overwritten with our copy.
    const key = lowBalanceKey(t);
    const { data: claimed, error: claimErr } = await client
      .from('package_entitlements')
      .update({ metadata: { ...(ent.metadata || {}), [key]: new Date().toISOString() } })
      .eq('id', ent.id)
      .eq('updated_at', ent.updated_at)
      .is(`metadata->>${key}`, null)
      .select('id');
    if (claimErr || !claimed?.length) return null;

    const to = await resolveRecipient(client, ent, resolve);
    if (!to.userId && !to.email) return null;
    await notify(
      client,
      { userId: to.userId, email: to.email, name: to.name },
      lowBalanceNotice(t, Number(ent.purchased_quantity), to.learnerName, ent.id),
      { email: true }
    );
    return t;
  } catch (err) {
    console.warn('[Low balance] notice failed:', err);
    return null;
  }
}
