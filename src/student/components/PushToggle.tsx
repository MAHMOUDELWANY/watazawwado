import React, { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Switch } from '../../components/ui/Switch';

/** VAPID public key (base64url) → the bytes pushManager.subscribe expects. */
export function keyToBytes(base64url: string): Uint8Array {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration()) || navigator.serviceWorker.register('/sw.js');
}

/**
 * NX-09: phone notifications for this device (opt-in): a lesson is coming up, homework waiting. Hidden where the browser
 * cannot do it or the server has no keys yet. On iPhone it works only from the installed app, so we say that instead.
 */
export function PushToggle({ isAr }: { isAr: boolean }) {
  const [key, setKey] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  useEffect(() => {
    if (!supported) return;
    fetch('/api/push/public-key').then((r) => r.json()).then((d) => setKey(d.key || null)).catch(() => {});
    navigator.serviceWorker.getRegistration().then((reg) => reg?.pushManager.getSubscription()).then((s) => setOn(Boolean(s))).catch(() => {});
  }, [supported]);

  const iosNeedsInstall = typeof window !== 'undefined' && isIos() && !isStandalone();
  if (!supported && !iosNeedsInstall) return null;
  if (supported && !key && !iosNeedsInstall) return null;

  const toggle = async (next: boolean) => {
    setBusy(true); setMsg('');
    try {
      const reg = await registration();
      if (next) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setMsg(isAr ? 'المتصفح رفض الإشعارات. تقدر تسمح بيها من إعدادات الموقع في المتصفح.' : 'Notifications are blocked. You can allow them in this browser\'s site settings.');
          return;
        }
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key!) });
        await authedJson('/api/student/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) });
        setOn(true);
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await authedJson('/api/student/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
          await sub.unsubscribe();
        }
        setOn(false);
      }
    } catch {
      setMsg(isAr ? 'معرفناش نغيّر الإعداد ده، جرّب تاني.' : 'Could not change this setting. Please try again.');
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
            ? 'عشان توصلك إشعارات على الآيفون: ضيف وتزودوا للشاشة الرئيسية (زرار المشاركة ثم "إضافة إلى الشاشة الرئيسية") وافتحه من هناك.'
            : 'For notifications on iPhone: add Watazawwado to your Home Screen (Share, then "Add to Home Screen") and open it from there.'}
        </p>
      ) : (
        <Switch checked={on} disabled={busy} onChange={toggle}
          hint={isAr ? 'تذكير قبل كل حصة، ومعاه الواجب لو فيه. على الجهاز ده بس.' : 'A reminder before each lesson, with your homework if there is some. This device only.'}>
          {isAr ? 'إشعارات على الموبايل' : 'Phone notifications'}
        </Switch>
      )}
      {msg && <p role="alert" className="text-xs text-destructive">{msg}</p>}
    </section>
  );
}
