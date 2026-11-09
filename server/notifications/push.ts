import webpush from 'web-push';
import { parse as legacyParse } from 'node:url';

/**
 * NX-09: web push (free, standard Web Push with VAPID keys VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). Opt-in per device;
 * only the kinds below are pushed, so a phone buzzes for things worth it (lesson soon, homework waiting), nothing else.
 */
export const PUSH_KINDS = new Set(['lesson_in_12h', 'lesson_in_2h', 'gift_redeemed', 'recitation_reply', 'quiet_learner', 'lesson_booked', 'lesson_cancelled', 'lesson_rescheduled', 'teacher_lesson_in_2h', 'lesson_waiting', 'lesson_unstable', 'homework_new']);

/** Phone notifications speak as Zad, the academy's companion (owner, 2026-11-06), with Zad's picture. */
export const ZAD = { name: { en: 'Zad', ar: 'زاد' }, icon: '/zad-notification-192.png' };

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
  notice: { kind: string; title: { en: string; ar: string }; body: { en: string; ar: string }; link?: string | null; push?: { body: { en: string; ar: string } } },
  lang: 'ar' | 'en' = 'ar',
  send: typeof webpush.sendNotification = webpush.sendNotification.bind(webpush),
): Promise<number> {
  if (!client || !userId || !PUSH_KINDS.has(notice.kind) || !pushConfigured()) return 0;
  try {
    const { data: subs } = await client.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId).limit(10);
    let sent = 0;
    const payload = notice.push
      ? JSON.stringify({ title: ZAD.name[lang], body: notice.push.body[lang], url: notice.link || '/student', tag: notice.kind, icon: ZAD.icon })
      : JSON.stringify({ title: notice.title[lang], body: notice.body[lang], url: notice.link || '/student', tag: notice.kind, icon: ZAD.icon });
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
