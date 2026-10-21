import React, { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const DISMISS_KEY = 'wz.installHint.dismissed';

/** What the install hint can offer on this device (pure, so it is testable). */
export function installMode(env: { standalone: boolean; narrow: boolean; ua: string; canPrompt: boolean; dismissed: boolean }): 'prompt' | 'ios' | null {
  if (env.standalone || env.dismissed || !env.narrow) return null;
  if (env.canPrompt) return 'prompt';
  // iOS Safari has no install prompt: explain Share → Add to Home Screen.
  if (/iPhone|iPad|iPod/i.test(env.ua) && !/CriOS|FxiOS|EdgiOS/i.test(env.ua)) return 'ios';
  return null;
}

/**
 * ST-07: on a phone, a small dismissible hint to add the portal to the home screen. No service worker: nothing is
 * cached, the site just opens like an app.
 */
export function InstallHint({ isAr }: { isAr: boolean }) {
  const [deferred, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return window.localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const mode = installMode({
    standalone: window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true,
    narrow: window.matchMedia?.('(max-width: 767px)').matches ?? false,
    ua: navigator.userAgent,
    canPrompt: Boolean(deferred),
    dismissed
  });
  if (!mode) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage blocked */ }
    setDismissed(true);
  };
  const install = async () => {
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    dismiss();
  };

  return (
    <section data-testid="install-hint" className="relative flex items-center gap-3 p-4 rounded-2xl glass-card border border-border" aria-labelledby="install-hint-title">
      <Smartphone className="w-6 h-6 text-[var(--teal)] shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 id="install-hint-title" className="text-sm font-semibold text-foreground">{isAr ? 'خلّي وتزودوا على شاشتك' : 'Keep Watazawwado on your home screen'}</h2>
        <p className="text-xs text-muted-foreground">
          {mode === 'ios'
            ? (isAr ? 'اضغط زرار المشاركة، وبعدين "إضافة إلى الشاشة الرئيسية".' : 'Tap the Share button, then "Add to Home Screen".')
            : (isAr ? 'افتح حصصك بلمسة واحدة، زي أي تطبيق.' : 'Open your lessons with one tap, like any app.')}
        </p>
      </div>
      {mode === 'prompt' && <Button size="sm" onClick={install}>{isAr ? 'ضيفه' : 'Add it'}</Button>}
      <button type="button" onClick={dismiss} aria-label={isAr ? 'مش دلوقتي' : 'Not now'} className="tap-44 relative w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer shrink-0">
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </section>
  );
}
