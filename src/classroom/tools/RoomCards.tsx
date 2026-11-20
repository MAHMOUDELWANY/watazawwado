import React, { useEffect, useRef, useState } from 'react';
import { Lightbulb, Type, X } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import { STAGES, type CheckLevel, type Stage } from '../../lib/roomTools';
import { BarButton } from '../parts/Toolbar';
import type { Comfort } from './comfort';

export const STAGE_LABELS: Record<Stage, { en: string; ar: string }> = {
  review: { en: 'Review', ar: 'مراجعة' },
  lesson: { en: 'Lesson', ar: 'الدرس' },
  practice: { en: 'Practice', ar: 'تدريب' },
  close: { en: 'Close', ar: 'الختام' },
};

/**
 * The lesson's stages (review → lesson → practice → close). The teacher moves it; the learner sees where they are. A
 * small dot marks the stage the curriculum slide on screen belongs to.
 */
export function StageBar({ stage, suggested, onPick }: { stage: Stage | undefined; suggested?: Stage | null; onPick?: (s: Stage) => void }) {
  const { t, isAr } = useT();
  const at = stage ? STAGES.indexOf(stage) : -1;
  return (
    <ol aria-label={t('Lesson stages', 'مراحل الحصة')} className="glass-1 flex items-center gap-0.5 rounded-[var(--r-pill)] p-1 text-[0.8rem]">
      {STAGES.map((s, i) => {
        const label = isAr ? STAGE_LABELS[s].ar : STAGE_LABELS[s].en;
        const cls = cn('relative flex min-h-9 items-center gap-1.5 rounded-[var(--r-pill)] px-3 font-medium',
          i === at ? 'bg-[#3A332D] text-foreground' : i < at ? 'text-[#5CC9DB]' : 'text-muted-foreground');
        const dot = suggested === s && s !== stage && <span aria-hidden="true" className="absolute end-1 top-1 h-1.5 w-1.5 rounded-full bg-[#F0B54A]" />;
        return (
          <li key={s} aria-current={i === at ? 'step' : undefined}>
            {onPick ? (
              <button type="button" onClick={() => onPick(s)} className={cn(cls, 'room-press hover:text-foreground focus-ring')}
                title={suggested === s && s !== stage ? t('The slide on screen is in this stage', 'الشريحة اللي قدامك في المرحلة دي') : undefined}>
                {label}{dot}
              </button>
            ) : <span className={cls}>{label}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** The learner's gentle correction card: what was said, then the right way. It leaves by itself. */
export function CorrectionToast({ items, onDone, kid }: { items: Array<{ id: string; said: string; correct: string; note?: string }>; onDone: (id: string) => void; kid?: boolean }) {
  const { t } = useT();
  useEffect(() => {
    const timers = items.map((c) => window.setTimeout(() => onDone(c.id), 9000));
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [items, onDone]);
  if (!items.length) return null;
  return (
    <div className="grid gap-2" aria-live="polite">
      {items.map((c) => (
        <div key={c.id} className="glass-2 pointer-events-auto flex w-[min(26rem,100%)] items-start gap-3 rounded-[var(--r-3)] p-3 text-foreground">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#F0B54A]" aria-hidden="true" />
          <div className="grid flex-1 gap-0.5">
            <p className="text-[0.78rem] text-muted-foreground">{kid ? t('A little tip', 'نصيحة صغيرة') : t('Say it this way', 'قولها كده')}</p>
            <p className="text-[1.05rem]">
              <bdi className="text-muted-foreground line-through decoration-white/40">{c.said}</bdi>
              <span aria-hidden="true" className="mx-1.5 text-muted-foreground">→</span>
              <bdi className="font-semibold text-[#5CC9DB]">{c.correct}</bdi>
            </p>
            {c.note && <p className="text-[0.85rem] text-muted-foreground"><bdi>{c.note}</bdi></p>}
          </div>
          <button type="button" onClick={() => onDone(c.id)} aria-label={t('Close', 'اقفل')} className="room-press grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 focus-ring"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  );
}

const LEVELS: Array<{ level: CheckLevel; en: string; ar: string; kidEn: string; kidAr: string; cls: string }> = [
  { level: 'green', en: 'I understand', ar: 'فاهم', kidEn: 'Got it!', kidAr: 'فهمت!', cls: 'bg-teal text-white' },
  { level: 'amber', en: 'Partly', ar: 'نص نص', kidEn: 'A little', kidAr: 'شوية', cls: 'bg-[#F0B54A] text-[#1C1714]' },
  { level: 'red', en: 'Not yet', ar: 'لسه', kidEn: 'Not yet', kidAr: 'لسه', cls: 'bg-crimson text-white' },
];

/** The learner's understanding check: three taps, one answer. */
export function CheckCard({ part, onAnswer, kid }: { part: string; onAnswer: (l: CheckLevel) => void; kid?: boolean }) {
  const { t, isAr } = useT();
  return (
    <section aria-label={t('Did you understand?', 'فهمت؟')} className="glass-2 pointer-events-auto grid w-[min(26rem,100%)] gap-3 rounded-[var(--r-3)] p-4 text-center text-foreground">
      <h2 className="text-base font-semibold">{kid ? t('Did you get it?', 'فهمت؟') : t('How well do you understand this part?', 'فاهم الجزء ده قد إيه؟')}</h2>
      {part && <p className="text-[0.85rem] text-muted-foreground"><bdi>{part}</bdi></p>}
      <div className="grid grid-cols-3 gap-2" role="group">
        {LEVELS.map((l) => (
          <button key={l.level} type="button" onClick={() => onAnswer(l.level)}
            className={cn('room-press min-h-12 rounded-[var(--r-2)] px-2 text-sm font-semibold focus-ring', l.cls)}>
            {kid ? (isAr ? l.kidAr : l.kidEn) : (isAr ? l.ar : l.en)}
          </button>
        ))}
      </div>
    </section>
  );
}

export const CHECK_TEXT: Record<CheckLevel, { en: string; ar: string; cls: string }> = {
  green: { en: 'understands', ar: 'فاهم', cls: 'text-teal' },
  amber: { en: 'partly', ar: 'نص نص', cls: 'text-[#F0B54A]' },
  red: { en: 'not yet', ar: 'لسه', cls: 'text-crimson' },
};

/** Learner comfort: larger text and a warm or dark page, only on this screen. */
export function ComfortButton({ comfort, onChange, kid }: { comfort: Comfort; onChange: (c: Comfort) => void; kid?: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('pointerdown', away); window.removeEventListener('keydown', esc); };
  }, [open]);
  const opt = (on: boolean) => cn('room-press min-h-10 flex-1 rounded-[var(--r-pill)] px-3 text-sm font-medium focus-ring', on ? 'bg-[#3A332D] text-foreground ring-1 ring-[#F0B54A]/60' : 'text-muted-foreground hover:text-foreground');
  return (
    <div ref={box} className="relative">
      <BarButton kid={kid} tone={open ? 'on' : 'idle'} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((v) => !v)}
        label={t('Text size and colours', 'حجم الكلام والألوان')} word={kid ? t('Bigger', 'أكبر') : undefined}>
        <Type className="h-5 w-5" aria-hidden="true" />
      </BarButton>
      {open && (
        <div role="dialog" aria-label={t('Text size and colours', 'حجم الكلام والألوان')}
          className="room-sheet glass-3 absolute bottom-full start-1/2 z-30 mb-3 grid w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 gap-3 rounded-[var(--r-4)] p-3 rtl:translate-x-1/2">
          <div className="grid gap-1.5">
            <p className="text-[0.78rem] font-semibold text-muted-foreground">{t('Text size', 'حجم الكلام')}</p>
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((s) => (
                <button key={s} type="button" aria-pressed={comfort.size === s} onClick={() => onChange({ ...comfort, size: s })} className={opt(comfort.size === s)}>
                  <span style={{ fontSize: `${0.85 + s * 0.2}rem` }}>{t('A', 'أ')}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <p className="text-[0.78rem] font-semibold text-muted-foreground">{t('Page', 'الصفحة')}</p>
            <div className="flex gap-1">
              {([['default', t('Normal', 'عادي')], ['warm', t('Warm', 'دافي')], ['dark', t('Dark', 'غامق')]] as const).map(([tone, label]) => (
                <button key={tone} type="button" aria-pressed={comfort.tone === tone} onClick={() => onChange({ ...comfort, tone })} className={opt(comfort.tone === tone)}>{label}</button>
              ))}
            </div>
          </div>
          <p className="text-[0.75rem] text-muted-foreground">{t('Only on your screen. Your teacher sees the lesson as usual.', 'عندك إنت بس. المعلم شايف الدرس عادي.')}</p>
        </div>
      )}
    </div>
  );
}

/** Teacher only, at the start: a few warm-up openers from the last report, open corrections and the learner's level. */
export function WarmupCard({ prompts, onClose }: { prompts: Array<{ en: string; ar: string }>; onClose: () => void }) {
  const { t, isAr } = useT();
  if (!prompts.length) return null;
  return (
    <section aria-label={t('Warm-up ideas', 'أفكار للبداية')} className="glass-2 pointer-events-auto grid w-[min(24rem,100%)] gap-2 rounded-[var(--r-3)] p-3 text-foreground">
      <header className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-[#F0B54A]" aria-hidden="true" />
        <h2 className="flex-1 text-sm font-semibold">{t('Warm-up ideas (only you see this)', 'أفكار للبداية (إنت بس اللي شايفها)')}</h2>
        <button type="button" onClick={onClose} aria-label={t('Close', 'اقفل')} className="room-press grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 focus-ring"><X className="h-4 w-4" aria-hidden="true" /></button>
      </header>
      <ul className="grid list-disc gap-1 ps-5 text-[0.88rem] leading-relaxed">
        {prompts.map((p, i) => <li key={i}><bdi>{isAr ? p.ar : p.en}</bdi></li>)}
      </ul>
    </section>
  );
}
