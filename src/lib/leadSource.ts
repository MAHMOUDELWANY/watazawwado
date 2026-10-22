/**
 * First-touch lead source (docs/marketing/PLAN.md §8). The browser keeps the UTM tags and the referring site of the
 * first visit that carries any, then onboarding sends them once and the server saves them on the account.
 * No personal data: the referrer is reduced to its host and the landing page to its path.
 */

export const LEAD_SOURCE_KEY = 'wz_first_touch';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

export interface LeadSource {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
  at?: string;
}

export const HEARD_ABOUT = ['youtube', 'instagram', 'tiktok', 'facebook', 'telegram_whatsapp', 'search', 'friend_family', 'other'] as const;
export type HeardAbout = (typeof HEARD_ABOUT)[number];

export const HEARD_ABOUT_LABELS: Record<HeardAbout, [string, string]> = {
  youtube: ['YouTube', 'يوتيوب'],
  instagram: ['Instagram', 'إنستجرام'],
  tiktok: ['TikTok', 'تيك توك'],
  facebook: ['Facebook', 'فيسبوك'],
  telegram_whatsapp: ['Telegram / WhatsApp', 'تيليجرام / واتساب'],
  search: ['Google or another search', 'جوجل أو بحث'],
  friend_family: ['A friend or family', 'صاحب أو حد من العيلة'],
  other: ['Something else', 'حاجة تانية']
};

export function isHeardAbout(v: unknown): v is HeardAbout {
  return typeof v === 'string' && (HEARD_ABOUT as readonly string[]).includes(v);
}

const clean = (v: unknown, max = 100) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) || undefined : undefined;

/** Server side: keeps only the known keys as short plain strings; null when nothing is left. */
export function sanitizeLeadSource(input: unknown): LeadSource | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;
  const out: LeadSource = {};
  for (const k of UTM_KEYS) { const v = clean(src[k]); if (v) out[k] = v; }
  const ref = clean(src.referrer, 253);
  if (ref && /^[a-z0-9.-]+$/i.test(ref)) out.referrer = ref.toLowerCase();
  const path = clean(src.landing_path, 200);
  if (path && path.startsWith('/')) out.landing_path = path;
  const at = clean(src.at, 40);
  if (at && !Number.isNaN(Date.parse(at))) out.at = new Date(at).toISOString();
  return out.utm_source || out.utm_medium || out.utm_campaign || out.utm_content || out.referrer ? out : null;
}

/** What the first touch carries: UTM tags and an outside referrer host; null for a direct or internal visit. */
export function firstTouchFrom(search: string, pathname: string, referrer: string, ownHost: string): LeadSource | null {
  const params = new URLSearchParams(search);
  const raw: Record<string, string> = {};
  for (const k of UTM_KEYS) { const v = params.get(k); if (v) raw[k] = v; }
  try {
    const host = referrer ? new URL(referrer).hostname : '';
    if (host && host !== ownHost) raw.referrer = host;
  } catch { /* not a URL */ }
  raw.landing_path = pathname;
  raw.at = new Date().toISOString();
  return sanitizeLeadSource(raw);
}

/**
 * Called once per page load. A direct visit stores nothing, so a later tagged visit still counts as the first touch;
 * after that the stored value never changes.
 */
export function captureFirstTouch(): void {
  try {
    if (localStorage.getItem(LEAD_SOURCE_KEY)) return;
    const touch = firstTouchFrom(window.location.search, window.location.pathname, document.referrer, window.location.hostname);
    if (touch) localStorage.setItem(LEAD_SOURCE_KEY, JSON.stringify(touch));
  } catch { /* storage blocked: we simply don't know the source */ }
}

export function readFirstTouch(): LeadSource | null {
  try {
    return sanitizeLeadSource(JSON.parse(localStorage.getItem(LEAD_SOURCE_KEY) || 'null'));
  } catch {
    return null;
  }
}

/**
 * Invite links (RULES.md §4 referral): `?ref=CODE` on any page. Unlike the first touch, the latest invite wins
 * and it is kept for 30 days; onboarding sends it once and the server decides whether it counts.
 */
export const REFERRAL_KEY = 'wz_ref';
const REFERRAL_DAYS = 30;

export function normalizeReferralCode(v: unknown): string | null {
  const code = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return /^[A-Z0-9]{4,20}$/.test(code) ? code : null;
}

export function captureReferral(): void {
  try {
    const code = normalizeReferralCode(new URLSearchParams(window.location.search).get('ref'));
    if (code) localStorage.setItem(REFERRAL_KEY, JSON.stringify({ code, at: new Date().toISOString() }));
  } catch { /* storage blocked */ }
}

export function readReferral(): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(REFERRAL_KEY) || 'null');
    if (!stored?.code || !stored?.at) return null;
    if (Date.now() - Date.parse(stored.at) > REFERRAL_DAYS * 86_400_000) return null;
    return normalizeReferralCode(stored.code);
  } catch {
    return null;
  }
}

export function clearReferral(): void {
  try { localStorage.removeItem(REFERRAL_KEY); } catch { /* storage blocked */ }
}

/** One short label for admin screens: utm_source, else the referrer host, else the onboarding answer. */
export function sourceLabel(leadSource: LeadSource | null | undefined, heardAbout?: string | null, isAr = false): string | null {
  const tag = leadSource?.utm_source || leadSource?.referrer;
  if (tag) return tag;
  return isHeardAbout(heardAbout) ? HEARD_ABOUT_LABELS[heardAbout][isAr ? 1 : 0] : null;
}
