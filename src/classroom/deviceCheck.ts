import { filterIceServers } from './engine/quality';

/**
 * BUILD-LIST 1.5: the waiting room's checks that are not drawing: which browser this is (for the "how to allow the
 * camera" steps), what a getUserMedia error means for one device, and a short network test against our own API and
 * the Cloudflare TURN relay. Nothing here blocks entry.
 */
export type Browser = 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';
export type DeviceState = 'ok' | 'denied' | 'missing' | 'error';
export type NetVerdict = 'good' | 'fair' | 'poor' | 'unknown';
export type NetResult = { latencyMs: number | null; downKbps: number | null; relay: 'ok' | 'failed' | 'skipped'; network: NetVerdict };

export function detectBrowser(ua: string): { browser: Browser; mobile: boolean; ios: boolean } {
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua));
  const mobile = ios || /Android|Mobile/i.test(ua);
  // Order matters: Edge and Chrome on iOS say "Safari" too, and Edge says "Chrome".
  const browser: Browser = /Edg(e|A|iOS)?\//.test(ua) ? 'edge'
    : /Firefox\/|FxiOS\//.test(ua) ? 'firefox'
      : /Chrome\/|CriOS\//.test(ua) ? 'chrome'
        : /Safari\//.test(ua) ? 'safari' : 'other';
  return { browser, mobile, ios };
}

/** getUserMedia's error for one device: blocked by the person or the browser, not there, or busy/broken. */
export function deviceState(err: unknown): DeviceState {
  const name = (err as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'missing';
  return 'error';
}

type T = (en: string, ar: string) => string;

/** The steps to allow the camera and mic on this browser, in plain words. */
export function permissionSteps(b: { browser: Browser; mobile: boolean; ios: boolean }, t: T): string[] {
  const again = t('Come back here and press Try again.', 'ارجع هنا ودوس "جرّب تاني".');
  if (b.ios) {
    // Every browser on iPhone and iPad follows the phone's own settings.
    if (b.browser === 'safari' || b.browser === 'other') {
      return [
        t('Tap "aA" in the address bar, then Website Settings.', 'دوس على "aA" في شريط العنوان، وبعدين إعدادات الموقع.'),
        t('Set Camera and Microphone to Allow.', 'خلّي الكاميرا والمايك "سماح".'),
        t('Still blocked? Open the Settings app, then Safari, then Camera and Microphone, and choose Ask or Allow.', 'لسه ممنوع؟ افتح الإعدادات في الموبايل، وبعدين Safari، وبعدين الكاميرا والمايك، واختار "اسأل" أو "سماح".'),
        again,
      ];
    }
    const app = b.browser === 'chrome' ? 'Chrome' : b.browser === 'edge' ? 'Edge' : 'Firefox';
    return [
      t(`Open the Settings app on your phone and find ${app}.`, `افتح الإعدادات في الموبايل ودوّر على ${app}.`),
      t('Turn on Camera and Microphone.', 'شغّل الكاميرا والمايك.'),
      again,
    ];
  }
  if (b.mobile) {
    return [
      t('Tap the icon to the left of the address, then Permissions.', 'دوس على العلامة اللي على شمال العنوان، وبعدين الأذونات.'),
      t('Turn on Camera and Microphone.', 'شغّل الكاميرا والمايك.'),
      t('Still blocked? Open your phone Settings, then Apps, then your browser, then Permissions, and allow both.', 'لسه ممنوع؟ افتح إعدادات الموبايل، وبعدين التطبيقات، وبعدين المتصفح، وبعدين الأذونات، واسمح بالاتنين.'),
      again,
    ];
  }
  const pc = t('Still blocked? Your computer may block the browser: on Windows open Settings, Privacy, Camera (and Microphone); on a Mac open System Settings, Privacy & Security, Camera (and Microphone), and allow your browser.',
    'لسه ممنوع؟ ممكن الكمبيوتر نفسه مانع المتصفح: في ويندوز افتح الإعدادات، الخصوصية، الكاميرا (والمايك)؛ وفي الماك افتح إعدادات النظام، الخصوصية والأمان، الكاميرا (والمايك)، واسمح للمتصفح.');
  switch (b.browser) {
    case 'safari':
      return [
        t('In the menu bar click Safari, then Settings for This Website.', 'من القايمة فوق دوس Safari، وبعدين إعدادات الموقع ده.'),
        t('Set Camera and Microphone to Allow.', 'خلّي الكاميرا والمايك "سماح".'),
        pc, again,
      ];
    case 'firefox':
      return [
        t('Click the crossed-out camera or mic icon to the left of the address.', 'دوس على علامة الكاميرا أو المايك المشطوبة اللي على شمال العنوان.'),
        t('Clear "Blocked" next to Camera and Microphone (the small ×).', 'امسح كلمة "ممنوع" جنب الكاميرا والمايك (علامة × الصغيرة).'),
        t('Press Try again and choose Allow.', 'دوس "جرّب تاني" واختار "سماح".'),
        pc,
      ];
    case 'edge':
      return [
        t('Click the lock to the left of the address, then Permissions for this site.', 'دوس على القفل اللي على شمال العنوان، وبعدين أذونات الموقع ده.'),
        t('Set Camera and Microphone to Allow.', 'خلّي الكاميرا والمايك "سماح".'),
        pc, again,
      ];
    default:
      return [
        t('Click the icon to the left of the address (a lock or two sliders).', 'دوس على العلامة اللي على شمال العنوان (قفل أو خطين).'),
        t('Turn on Camera and Microphone, or open Site settings and set both to Allow.', 'شغّل الكاميرا والمايك، أو افتح إعدادات الموقع وخلّي الاتنين "سماح".'),
        pc, again,
      ];
  }
}

/** Good enough for 720p video both ways, enough for audio and small video, or audio may break up. */
export function classifyNetwork(latencyMs: number | null, downKbps: number | null): NetVerdict {
  if (latencyMs == null && downKbps == null) return 'unknown';
  if ((latencyMs != null && latencyMs > 400) || (downKbps != null && downKbps < 600)) return 'poor';
  if (latencyMs != null && latencyMs <= 150 && downKbps != null && downKbps >= 2500) return 'good';
  return 'fair';
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/** Does the Cloudflare TURN relay answer? A relay candidate within the time means yes. */
export async function checkRelay(iceServers: RTCIceServer[], ms: number): Promise<'ok' | 'failed' | 'skipped'> {
  const servers = filterIceServers(iceServers || []);
  if (typeof RTCPeerConnection === 'undefined' || !servers.length) return 'skipped';
  const pc = new RTCPeerConnection({ iceServers: servers, iceTransportPolicy: 'relay' });
  try {
    return await new Promise<'ok' | 'failed'>((resolve) => {
      const timer = setTimeout(() => resolve('failed'), ms);
      pc.onicecandidate = (e) => { if (e.candidate && / typ relay/.test(e.candidate.candidate)) { clearTimeout(timer); resolve('ok'); } };
      pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') { clearTimeout(timer); resolve('failed'); } };
      pc.createDataChannel('check');
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => { clearTimeout(timer); resolve('failed'); });
    });
  } finally {
    pc.close();
  }
}

/**
 * About 5 s at most: three tiny calls for latency and one 256 KB download for speed, against our own API, and the
 * TURN relay check at the same time. No third-party speed-test site.
 */
export async function runNetworkTest(bookingId: string, ticket: string, iceServers: RTCIceServer[]): Promise<NetResult> {
  const url = (kb: number) => `/api/classroom/${encodeURIComponent(bookingId)}/nettest?kb=${kb}&r=${Math.random().toString(36).slice(2)}`;
  const ctl = new AbortController();
  const stop = setTimeout(() => ctl.abort(), 4500);
  const timed = async (kb: number) => {
    const t0 = performance.now();
    const res = await fetch(url(kb), { headers: { 'x-room-ticket': ticket }, cache: 'no-store', signal: ctl.signal });
    const bytes = (await res.arrayBuffer()).byteLength;
    if (!res.ok) throw new Error(String(res.status));
    return { ms: performance.now() - t0, bytes };
  };
  const speed = (async () => {
    let latencyMs: number | null = null;
    let downKbps: number | null = null;
    try {
      const pings: number[] = [];
      for (let i = 0; i < 3; i++) pings.push((await timed(0)).ms);
      latencyMs = Math.round(median(pings));
      const d = await timed(256);
      // The download time includes one round trip; take it off so a far server does not look slow.
      downKbps = Math.round((d.bytes * 8) / Math.max(1, d.ms - latencyMs));
    } catch { /* offline, blocked or too slow: what we have so far stands */ }
    return { latencyMs, downKbps };
  })();
  const [s, relay] = await Promise.all([speed, checkRelay(iceServers, 4000).catch(() => 'failed' as const)]);
  clearTimeout(stop);
  return { ...s, relay, network: classifyNetwork(s.latencyMs, s.downKbps) };
}
