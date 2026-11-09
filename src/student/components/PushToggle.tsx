import React, { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

/** VAPID public key (base64url) → the bytes pushManager.subscribe expects. */
export function keyToBytes(base64url: string): Uint8Array {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export type PushRole = 'student' | 'teacher';

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** Set when the person said "not now" or switched notifications off, so the first-open card never nags again. */
const PROMPT_DISMISSED_KEY = 'wz.pushPrompt.dismissed';
const promptDismissed = () => { try { return localStorage.getItem(PROMPT_DISMISSED_KEY) === '1'; } catch { return false; } };
const dismissPrompt = () => { try { localStorage.setItem(PROMPT_DISMISSED_KEY, '1'); } catch { /* storage blocked */ } };

/** subscribe() needs an active worker, so a worker registered just now is awaited until it activates. */
async function registration(): Promise<ServiceWorkerRegistration> {
  if (!(await navigator.serviceWorker.getRegistration())) await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

async function publicKey(): Promise<string | null> {
  const d = await fetch('/api/push/public-key').then((r) => r.json()).catch(() => ({}));
  return d?.key || null;
}

/**
 * Asks the browser (must run from a tap), subscribes this device and saves it on the server.
 * Returns 'blocked' when the person or the browser refused.
 */
async function subscribeThisDevice(role: PushRole, key: string): Promise<'on' | 'blocked'> {
  const reg = await registration();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'blocked';
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
  await authedJson(`/api/${role}/push/subscribe`, { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) });
  return 'on';
}

const BLOCKED = { ar: 'المتصفح مانع الإشعارات. تقدر تسمح بيها من إعدادات الموقع في المتصفح.', en: 'Notifications are blocked. You can allow them in this browser\'s site settings.' };
const FAILED = { ar: 'تعذّر تغيير هذا الإعداد، حاول مرة أخرى.', en: 'Could not change this setting. Please try again.' };

/**
 * NX-09: phone notifications for this device (opt-in): a lesson is coming up, homework waiting. Hidden where the browser
 * cannot do it or the server has no keys yet. On iPhone it works only from the installed app, so we say that instead.
 */
export function PushToggle({ isAr, role = 'student' }: { isAr: boolean; role?: PushRole }) {
  const [key, setKey] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const supported = pushSupported();

  useEffect(() => {
    if (!supported) return;
    publicKey().then(setKey);
    navigator.serviceWorker.getRegistration().then((reg) => reg?.pushManager.getSubscription()).then((s) => setOn(Boolean(s))).catch(() => {});
  }, [supported]);

  const iosNeedsInstall = typeof window !== 'undefined' && isIos() && !isStandalone();
  if (!supported && !iosNeedsInstall) return null;
  if (supported && !key && !iosNeedsInstall) return null;

  const toggle = async (next: boolean) => {
    setBusy(true); setMsg('');
    try {
      if (next) {
        if ((await subscribeThisDevice(role, key!)) === 'blocked') { setMsg(isAr ? BLOCKED.ar : BLOCKED.en); return; }
        setOn(true);
      } else {
        const sub = await (await registration()).pushManager.getSubscription();
        if (sub) {
          await authedJson(`/api/${role}/push/unsubscribe`, { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
          await sub.unsubscribe();
        }
        dismissPrompt();
        setOn(false);
      }
    } catch {
      setMsg(isAr ? FAILED.ar : FAILED.en);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-4 rounded-2xl glass-card border border-border space-y-1" data-testid="push-toggle">
      {iosNeedsInstall ? (
        <p className="text-sm text-foreground flex items-start gap-2">
          <BellRing className="w-4 h-4 mt-0.5 text-accent shrink-0" aria-hidden="true" />
          {isAr
            ? 'لتصلك الإشعارات على الآيفون: أضف وتزودوا إلى الشاشة الرئيسية (زر المشاركة ثم "إضافة إلى الشاشة الرئيسية") وافتحه من هناك.'
            : 'For notifications on iPhone: add Watazawwado to your Home Screen (Share, then "Add to Home Screen") and open it from there.'}
        </p>
      ) : (
        <Switch checked={on} disabled={busy} onChange={toggle}
          hint={role === 'teacher'
            ? (isAr ? 'تذكير قبل كل حصة بساعتين، وخبر لما حصة تتحجز أو تتلغي أو يتغيّر ميعادها. على هذا الجهاز فقط.' : 'A reminder 2 hours before each lesson, and a note when a lesson is booked, cancelled or moved. This device only.')
            : (isAr ? 'تذكير قبل كل حصة، ومعه الواجب إن وُجد. على هذا الجهاز فقط.' : 'A reminder before each lesson, with your homework if there is some. This device only.')}>
          {isAr ? 'إشعارات على الموبايل' : 'Phone notifications'}
        </Switch>
      )}
      {msg && <p role="alert" className="text-xs text-destructive">{msg}</p>}
    </section>
  );
}

/**
 * First open after sign-in: a Zad popup asks once whether to send lesson reminders to this device. The browser's own
 * permission dialog opens only from the "Allow" tap (Chrome hides prompts that appear by themselves).
 * Shown only while this device has no subscription, the browser has not blocked notifications, and the person has not
 * said "not now". A device that is already subscribed is re-saved quietly, in case the server dropped it.
 */
/** `hold` keeps it closed while something else greets the person first (Zad's tour). */
export function PushPrompt({ isAr, role, hold = false }: { isAr: boolean; role: PushRole; hold?: boolean }) {
  const [key, setKey] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!pushSupported() || Notification.permission === 'denied') return;
    let alive = true;
    (async () => {
      const k = await publicKey();
      if (!alive || !k) return;
      const sub = await navigator.serviceWorker.getRegistration().then((reg) => reg?.pushManager.getSubscription()).catch(() => null);
      if (sub) {
        authedJson(`/api/${role}/push/subscribe`, { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) }).catch(() => {});
        return;
      }
      if (promptDismissed()) return;
      setKey(k);
      setShow(true);
    })();
    return () => { alive = false; };
  }, [role]);

  const close = () => { dismissPrompt(); setShow(false); };
  const allow = async () => {
    setBusy(true); setMsg('');
    try {
      if ((await subscribeThisDevice(role, key!)) === 'blocked') { setMsg(isAr ? BLOCKED.ar : BLOCKED.en); dismissPrompt(); return; }
      setShow(false);
    } catch {
      setMsg(isAr ? FAILED.ar : FAILED.en);
    } finally {
      setBusy(false);
    }
  };

  // A popup, not an inline card: the owner expects the question to greet him on first open (2026-11-09).
  return (
    <Modal isOpen={show && !hold} onClose={close} maxWidth="sm" layerClassName="z-[60]">
      <div data-testid="push-prompt" className="flex flex-col items-center text-center gap-3 pt-2">
        <img src="/zad-notification-192.png" alt="" width={72} height={72} className="w-18 h-18 rounded-full" />
        <h2 className="text-lg font-semibold text-foreground font-display">
          {isAr ? 'تحب نفكّرك قبل كل حصة؟' : 'Want a reminder before each lesson?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {role === 'teacher'
            ? (isAr ? 'هيوصلك إشعار على الجهاز ده قبل الحصة، ولما حصة تتحجز أو تتلغي أو يتغيّر ميعادها، حتى لو التطبيق مقفول.' : 'This device gets a notice before your lessons, and when one is booked, cancelled or moved, even with the app closed.')
            : (isAr ? 'هيوصلك إشعار على الجهاز ده قبل الحصة ومعاه الواجب، حتى لو التطبيق مقفول.' : 'This device gets a notice before each lesson, with any homework, even with the app closed.')}
        </p>
        <div className="flex flex-col w-full gap-2 pt-1">
          <Button onClick={allow} isLoading={busy} disabled={busy} className="w-full">{isAr ? 'سماح بالإشعارات' : 'Allow notifications'}</Button>
          <Button variant="ghost" onClick={close} disabled={busy} className="w-full">{isAr ? 'مش دلوقتي' : 'Not now'}</Button>
        </div>
        {msg && <p role="alert" className="text-xs text-destructive">{msg}</p>}
      </div>
    </Modal>
  );
}
