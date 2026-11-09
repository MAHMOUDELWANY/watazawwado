import webpush from 'web-push';
import { parse as legacyParse } from 'node:url';

/**
 * NX-09: web push (free, standard Web Push with VAPID keys VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). Opt-in per device.
 * Owner review 2026-11-09: each account type gets what it needs on the phone, laid out like the owner's Duolingo
 * reference: a short title with an emoji, one line, Zaadi in a pose that fits (or the sender's photo for a chat
 * message) on the side, and one button. Everything else stays in the on-site bell.
 */
export type ZaadiPushPose = 'point' | 'sad' | 'think' | 'love' | 'wave' | 'proud' | 'wow' | 'thanks' | 'dua' | 'excited' | 'idle';
const STYLE: Record<string, { emoji: string; pose: ZaadiPushPose }> = {
  // student / parent
  lesson_in_12h: { emoji: '⏰', pose: 'point' },
  lesson_in_2h: { emoji: '⏰', pose: 'point' },
  homework_set: { emoji: '📚', pose: 'think' },
  homework_new: { emoji: '📚', pose: 'think' },
  recitation_reply: { emoji: '🎧', pose: 'love' },
  placement_reviewed: { emoji: '🎯', pose: 'proud' },
  lesson_moved_by_teacher: { emoji: '🔄', pose: 'think' },
  lesson_teacher_changed: { emoji: '👤', pose: 'think' },
  refund_sent: { emoji: '💸', pose: 'thanks' },
  gift_redeemed: { emoji: '🎁', pose: 'love' },
  quiet_learner: { emoji: '👋', pose: 'wave' },
  sponsorship_granted: { emoji: '🤲', pose: 'love' },
  // teacher
  teacher_lesson_in_2h: { emoji: '⏰', pose: 'point' },
  lesson_booked: { emoji: '🎉', pose: 'excited' },
  lesson_cancelled: { emoji: '📅', pose: 'sad' },
  lesson_rescheduled: { emoji: '🔄', pose: 'think' },
  new_student: { emoji: '🙋', pose: 'wave' },
  student_assigned: { emoji: '🙋', pose: 'wave' },
  recitation_sent: { emoji: '🎙️', pose: 'excited' },
  lesson_moved_to_you: { emoji: '📥', pose: 'point' },
  lesson_moved_away: { emoji: '📤', pose: 'think' },
  payslip: { emoji: '💰', pose: 'thanks' },
  // super admin
  intake_submitted: { emoji: '📝', pose: 'wow' },
  placement_submitted: { emoji: '🧩', pose: 'think' },
  teacher_rescheduled: { emoji: '🔄', pose: 'think' },
  sponsorship_request: { emoji: '🤲', pose: 'dua' },
  sponsorship_donation: { emoji: '💝', pose: 'love' },
  review_submitted: { emoji: '⭐', pose: 'proud' },
  lesson_not_held: { emoji: '⚠️', pose: 'sad' },
  // lesson room (student and teacher)
  lesson_waiting: { emoji: '⏳', pose: 'point' },
  lesson_unstable: { emoji: '📶', pose: 'sad' },
  // any account
  chat_message: { emoji: '💬', pose: 'idle' },
};
export const PUSH_KINDS = new Set(Object.keys(STYLE));

/** Phone notifications carry Zaadi, the academy's companion (owner, 2026-11-06), in a pose that fits the news. */
export const ZAADI = { name: { en: 'Zaadi', ar: 'زادي' }, icon: '/zaadi-notification-192.png' };
export const zaadiImage = (pose: ZaadiPushPose) => `/push/zaadi-${pose}.png`;
/** Android's status-bar icon: white on transparent. */
export const PUSH_BADGE = '/push/badge-96.png';

type L = { en: string; ar: string };
export interface PushNotice { kind: string; title: L; body: L; link?: string | null; push?: { body: L }; image?: string | null; tag?: string }

/** The JSON the service worker turns into a notification. */
export function pushPayload(notice: PushNotice, lang: 'ar' | 'en') {
  const style = STYLE[notice.kind] || { emoji: '🔔', pose: 'idle' as const };
  const chat = notice.kind === 'chat_message';
  return {
    title: `${style.emoji} ${notice.title[lang]}`,
    body: (notice.push?.body || notice.body)[lang],
    url: notice.link || '/student',
    // One notification per conversation (or per kind): a new one replaces it instead of piling up.
    tag: notice.tag || notice.kind,
    icon: notice.image || zaadiImage(style.pose),
    badge: PUSH_BADGE,
    action: chat ? (lang === 'ar' ? 'رد' : 'Reply') : (lang === 'ar' ? 'افتح' : 'Open'),
  };
}

let configured: boolean | null = null;
export function pushConfigured(env: Record<string, string | undefined> = process.env): boolean {
  if (configured !== null && env === process.env) return configured;
  const ok = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
  if (ok) webpush.setVapidDetails('mailto:support@watazawwado.academy', env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
  if (env === process.env) configured = ok;
  return ok;
}

export interface PushSubscriptionInput { endpoint: string; keys: { p256dh: string; auth: string } }

/** The browsers' push services. The server posts to the endpoint, so anything else would let a client aim it anywhere. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/, /\.push\.apple\.com$/];

/**
 * True only when the endpoint is already canonical and both URL parsers (WHATWG, and the legacy one web-push uses to
 * send) see https on an allowed push host with a plain hostname, so validation and sending cannot disagree.
 */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try { url = new URL(endpoint); } catch { return false; }
  if (url.href !== endpoint || url.protocol !== 'https:' || url.port || url.username || url.password) return false;
  if (!/^[a-z0-9.-]+$/.test(url.hostname) || !PUSH_HOSTS.some((re) => re.test(url.hostname))) return false;
  const legacy = legacyParse(endpoint);
  return legacy.protocol === 'https:' && legacy.hostname === url.hostname && !legacy.port;
}

/** A browser subscription as the client sends it; only https on a known push service. */
export function parseSubscription(raw: any): PushSubscriptionInput | null {
  const endpoint = typeof raw?.endpoint === 'string' ? raw.endpoint : '';
  const p256dh = typeof raw?.keys?.p256dh === 'string' ? raw.keys.p256dh : '';
  const auth = typeof raw?.keys?.auth === 'string' ? raw.keys.auth : '';
  if (endpoint.length > 1000 || !isAllowedPushEndpoint(endpoint)) return null;
  if (!p256dh || p256dh.length > 200 || !auth || auth.length > 100) return null;
  return { endpoint, keys: { p256dh, auth } };
}

/** Best effort: never throws. Deletes subscriptions the push service says are gone. */
export async function sendPushToUser(
  client: any,
  userId: string,
  notice: PushNotice,
  lang: 'ar' | 'en' = 'ar',
  send: typeof webpush.sendNotification = webpush.sendNotification.bind(webpush),
): Promise<number> {
  if (!client || !userId || !PUSH_KINDS.has(notice.kind) || !pushConfigured()) return 0;
  try {
    const { data: subs } = await client.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId).limit(10);
    let sent = 0;
    const payload = JSON.stringify(pushPayload(notice, lang));
    for (const s of subs || []) {
      if (!isAllowedPushEndpoint(s.endpoint)) { await client.from('push_subscriptions').delete().eq('id', s.id); continue; }
      try {
        await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
        sent++;
        await client.from('push_subscriptions').update({ last_sent_at: new Date().toISOString() }).eq('id', s.id);
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) await client.from('push_subscriptions').delete().eq('id', s.id);
        else console.warn('[Push] send failed:', err?.statusCode || err?.message);
      }
    }
    return sent;
  } catch (err: any) {
    console.warn('[Push] failed:', err?.message || err);
    return 0;
  }
}
