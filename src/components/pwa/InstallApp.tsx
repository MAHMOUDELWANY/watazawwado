import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Download, X, Share, PlusSquare, MoreVertical, Menu, Zap, Bell, MonitorSmartphone, Check, ArrowRight } from 'lucide-react';
import FocusTrap from '../FocusTrap';
import {
  usePwaInstall, promptInstall, dismissInstallSuggestion, canOfferInstall, openInstallSheet, closeInstallSheet, useInstallSheetOpen, type InstallPlatform,
} from '../../lib/pwaInstall';

type Lang = { isAr: boolean };

/** The app tile as it will look on the home screen. */
function AppTile({ size = 56 }: { size?: number }) {
  return (
    <span
      className="relative grid place-items-center shrink-0 rounded-[22%] bg-[#FAF7F2] ring-1 ring-[#E5A93C]/50 shadow-[0_10px_24px_-12px_rgba(5,54,63,0.55)]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src="/logo-256.png" alt="" className="w-[72%] h-auto" />
    </span>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-surface-subtle border border-border text-foreground text-[0.8em] font-semibold align-middle">
      {children}
    </span>
  );
}

/** Written steps for browsers without a one-tap install dialog. */
function steps(platform: InstallPlatform, isAr: boolean): React.ReactNode[] {
  const t = (en: React.ReactNode, ar: React.ReactNode) => (isAr ? ar : en);
  switch (platform) {
    case 'ios-safari':
      return [
        t(<>Tap <Key><Share className="w-3.5 h-3.5" /> Share</Key> in Safari’s toolbar.</>, <>اضغط زرار <Key><Share className="w-3.5 h-3.5" /> المشاركة</Key> في شريط Safari.</>),
        t(<>Scroll and choose <Key><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</Key>.</>, <>انزل واختار <Key><PlusSquare className="w-3.5 h-3.5" /> إضافة إلى الشاشة الرئيسية</Key>.</>),
        t(<>Tap <Key>Add</Key>. Watazawwado is now on your home screen.</>, <>اضغط <Key>إضافة</Key>، وهتلاقي وتزودوا على شاشتك.</>),
      ];
    case 'samsung':
      return [
        t(<>Open the menu <Key><Menu className="w-3.5 h-3.5" /></Key> at the bottom.</>, <>افتح القائمة <Key><Menu className="w-3.5 h-3.5" /></Key> تحت.</>),
        t(<>Choose <Key>Add page to</Key> then <Key>Home screen</Key>.</>, <>اختار <Key>إضافة صفحة إلى</Key> وبعدها <Key>الشاشة الرئيسية</Key>.</>),
        t(<>Confirm, and the app icon appears on your phone.</>, <>أكّد، وهتلاقي أيقونة التطبيق على موبايلك.</>),
      ];
    case 'mac-safari':
      return [
        t(<>In the menu bar, open <Key>File</Key>.</>, <>من شريط القوائم فوق افتح <Key>File / ملف</Key>.</>),
        t(<>Choose <Key>Add to Dock</Key>, then <Key>Add</Key>.</>, <>اختار <Key>Add to Dock</Key> وبعدها <Key>Add</Key>.</>),
      ];
    case 'desktop':
      return [
        t(<>In Chrome or Edge, click the install icon <Key><Download className="w-3.5 h-3.5" /></Key> at the end of the address bar.</>, <>في Chrome أو Edge، اضغط أيقونة التثبيت <Key><Download className="w-3.5 h-3.5" /></Key> في آخر شريط العنوان.</>),
        t(<>No icon? Open the menu <Key><MoreVertical className="w-3.5 h-3.5" /></Key> then <Key>Cast, save and share</Key> and <Key>Install page as app</Key>.</>, <>مش ظاهرة؟ افتح القائمة <Key><MoreVertical className="w-3.5 h-3.5" /></Key> ← <Key>إرسال وحفظ ومشاركة</Key> ← <Key>تثبيت الصفحة كتطبيق</Key>.</>),
      ];
    default:
      return [
        t(<>Open Chrome’s menu <Key><MoreVertical className="w-3.5 h-3.5" /></Key> at the top.</>, <>افتح قائمة Chrome <Key><MoreVertical className="w-3.5 h-3.5" /></Key> فوق في الركن.</>),
        t(<>Choose <Key>Install app</Key> or <Key>Add to Home screen</Key>.</>, <>اختار <Key>تثبيت التطبيق</Key> أو <Key>إضافة إلى الشاشة الرئيسية</Key>.</>),
        t(<>Confirm, and Watazawwado opens from its own icon.</>, <>أكّد، ووتزودوا هيفتح من أيقونته على طول.</>),
      ];
  }
}

/** The sheet that explains the app and installs it (one tap where the browser allows, written steps elsewhere). */
export function InstallAppSheet({ open, onClose, isAr }: Lang & { open: boolean; onClose: () => void }) {
  const s = usePwaInstall();
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) setDone(false); }, [open]);
  useEffect(() => { if (s.installed && open) setDone(true); }, [s.installed, open]);

  const install = async () => {
    const ok = await promptInstall();
    if (ok) setDone(true);
  };

  const benefits = isAr
    ? [
        { Icon: Zap, text: 'بيفتح بلمسة من شاشتك، في شاشته الخاصة من غير تبويبات المتصفح' },
        { Icon: Bell, text: 'حصصك ورابط Zoom وملاحظات المعلم قدامك على طول' },
        { Icon: MonitorSmartphone, text: 'خفيف جداً، ومش محتاج متجر تطبيقات' },
      ]
    : [
        { Icon: Zap, text: 'Opens in one tap, in its own window, away from your browser tabs' },
        { Icon: Bell, text: 'Your lessons, Zoom link and teacher’s notes always one tap away' },
        { Icon: MonitorSmartphone, text: 'Very light, and no app store needed' },
      ];

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="install-sheet-title" dir={isAr ? 'rtl' : 'ltr'}>
          <FocusTrap onEscape={onClose}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#05363F]/45 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain bg-surface text-foreground rounded-t-[28px] sm:rounded-[28px] border border-border/70 shadow-[var(--shadow-3)] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <span className="sm:hidden block mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
              <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'} className="absolute top-3 end-3 w-10 h-10 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer focus-ring">
                <X className="w-4 h-4" />
              </button>

              <div className="px-6 pt-6 sm:pt-8 text-center">
                <div className="mx-auto w-fit"><AppTile size={72} /></div>
                <h2 id="install-sheet-title" className="mt-4 font-editorial text-2xl font-bold leading-snug">
                  {done ? (isAr ? 'التطبيق على جهازك' : 'The app is on your device') : (isAr ? 'وتزودوا كتطبيق على جهازك' : 'Watazawwado as an app')}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {done
                    ? (isAr ? 'افتحه من أيقونته على الشاشة الرئيسية أو سطح المكتب من النهارده.' : 'From now on, open it from its icon on your home screen or desktop.')
                    : (isAr ? 'نفس حسابك ونفس حصصك، بس أسرع وأقرب.' : 'Same account, same lessons, just quicker to reach.')}
                </p>
              </div>

              {done ? (
                <div className="px-6 pt-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-success/12 text-success grid place-items-center"><Check className="w-7 h-7" /></div>
                  <button type="button" onClick={onClose} className="mt-6 w-full h-12 rounded-full bg-[var(--teal)] text-white font-bold cursor-pointer focus-ring">{isAr ? 'تمام' : 'Done'}</button>
                </div>
              ) : (
                <>
                  <ul className="mx-6 mt-6 rounded-2xl bg-surface-subtle/70 border border-border/60 divide-y divide-border/60">
                    {benefits.map(({ Icon, text }) => (
                      <li key={text} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <span className="grid place-items-center w-8 h-8 rounded-full bg-[var(--teal)]/12 text-[var(--teal)] shrink-0"><Icon className="w-4 h-4" aria-hidden="true" /></span>
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="px-6 pt-6">
                    {s.canPrompt ? (
                      <button type="button" onClick={install} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-white font-bold transition-colors cursor-pointer focus-ring">
                        <Download className="w-4.5 h-4.5" aria-hidden="true" />
                        {isAr ? 'ثبّت التطبيق' : 'Install the app'}
                      </button>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-muted-foreground mb-3">{isAr ? 'إزاي تثبّته' : 'How to install it'}</p>
                        <ol className="space-y-3">
                          {steps(s.platform, isAr).map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                              <span className="grid place-items-center w-6 h-6 rounded-full bg-crimson text-white text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </FocusTrap>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Entry points to the sheet.
 * - `row`: a line in a menu or drawer (always there while installing is possible).
 * - `card`: a calm card on the portal home and the teacher's Today page; can be closed for two weeks.
 */
export function InstallAppEntry({ isAr, variant = 'row', className = '', onOpen }: Lang & { variant?: 'row' | 'card'; className?: string; onOpen?: () => void }) {
  const s = usePwaInstall();
  if (!canOfferInstall(s)) return null;
  if (variant === 'card' && s.dismissed) return null;

  const openSheet = () => { onOpen?.(); openInstallSheet(); };

  if (variant === 'row') {
    return (
      <>
        <button
          type="button"
          onClick={openSheet}
          data-testid="install-app-row"
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--teal)]/30 bg-[var(--teal)]/8 hover:bg-[var(--teal)]/14 text-foreground text-sm font-semibold transition-colors cursor-pointer text-start ${className}`}
        >
          <AppTile size={30} />
          <span className="flex-1 min-w-0">
            <span className="block">{isAr ? 'نزّل التطبيق' : 'Get the app'}</span>
            <span className="block text-[11px] font-medium text-muted-foreground">{isAr ? 'يفتح بلمسة من شاشتك' : 'Opens in one tap'}</span>
          </span>
          <Download className="w-4 h-4 text-[var(--teal)] shrink-0" aria-hidden="true" />
        </button>
      </>
    );
  }

  return (
    <>
      <section
        data-testid="install-hint"
        aria-labelledby="install-card-title"
        className={`relative overflow-hidden rounded-[var(--r-3)] border border-[var(--teal)]/25 bg-[linear-gradient(120deg,rgba(8,125,145,0.10),rgba(229,169,60,0.10))] p-4 flex items-start gap-3.5 ${className}`}
      >
        <AppTile size={48} />
        <div className="min-w-0 flex-1">
          <h2 id="install-card-title" className="text-sm font-bold text-foreground pe-6">{isAr ? 'خلّي وتزودوا تطبيق على جهازك' : 'Keep Watazawwado as an app'}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{isAr ? 'يفتح بلمسة من غير ما تدوّر في المتصفح.' : 'One tap to open, no hunting through browser tabs.'}</p>
          <button type="button" onClick={openSheet} className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-white text-sm font-bold transition-colors cursor-pointer focus-ring">
            {isAr ? 'ثبّت التطبيق' : 'Install the app'}
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" aria-hidden="true" />
          </button>
        </div>
        <button type="button" onClick={dismissInstallSuggestion} aria-label={isAr ? 'مش دلوقتي' : 'Not now'} className="tap-44 absolute top-2.5 end-2.5 w-7 h-7 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface/70 cursor-pointer">
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </section>
    </>
  );
}

const VISITS_KEY = 'wz.install.visits';

/**
 * Public site: a small bar at the bottom, only after the visitor has spent a little time (second visit, or 25 s
 * on this one), never inside the app, and gone for two weeks once closed.
 */
export function InstallAppNudge({ isAr }: Lang) {
  const s = usePwaInstall();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let visits = 0;
    try {
      if (!sessionStorage.getItem(VISITS_KEY)) {
        visits = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
        localStorage.setItem(VISITS_KEY, String(visits));
        sessionStorage.setItem(VISITS_KEY, '1');
      } else {
        visits = Number(localStorage.getItem(VISITS_KEY) || 1);
      }
    } catch { /* storage blocked */ }
    if (visits >= 2) { const id = window.setTimeout(() => setReady(true), 6000); return () => window.clearTimeout(id); }
    const id = window.setTimeout(() => setReady(true), 25000);
    return () => window.clearTimeout(id);
  }, []);

  // Phones and tablets get the bar; desktop visitors use the menu entry or the address-bar icon.
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const show = ready && touch && canOfferInstall(s) && !s.dismissed;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            dir={isAr ? 'rtl' : 'ltr'}
            className="fixed z-[45] inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] mx-auto max-w-md"
            role="region"
            aria-label={isAr ? 'تثبيت التطبيق' : 'Install the app'}
          >
            <div className="flex items-center gap-3 p-2.5 ps-3 rounded-[22px] bg-surface/95 dark:bg-surface/95 backdrop-blur-xl border border-border/70 shadow-[var(--shadow-3)]">
              <AppTile size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{isAr ? 'وتزودوا على شاشتك' : 'Watazawwado on your phone'}</p>
                <p className="text-xs text-muted-foreground truncate">{isAr ? 'ثبّته كتطبيق، ببلاش ومن غير متجر' : 'Install it as an app, free, no store'}</p>
              </div>
              <button type="button" onClick={openInstallSheet} className="shrink-0 h-10 px-4 rounded-full bg-[var(--teal)] text-white text-sm font-bold cursor-pointer focus-ring">
                {isAr ? 'ثبّت' : 'Install'}
              </button>
              <button type="button" onClick={dismissInstallSuggestion} aria-label={isAr ? 'مش دلوقتي' : 'Not now'} className="tap-44 relative shrink-0 w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:bg-surface-subtle cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Mounted once at the app root; every "Get the app" entry opens this sheet. */
export function InstallAppSheetHost() {
  const open = useInstallSheetOpen();
  const [isAr, setIsAr] = useState(() => typeof document !== 'undefined' && document.documentElement.lang !== 'en');
  useEffect(() => { if (open) setIsAr(document.documentElement.lang !== 'en'); }, [open]);
  return <InstallAppSheet open={open} onClose={closeInstallSheet} isAr={isAr} />;
}
