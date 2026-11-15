import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BookOpen, Crown, Feather, Footprints, HeartHandshake, MoveHorizontal, NotebookPen, Orbit, RotateCcw, RotateCw, Sparkles, Star, Sunrise,
  Target, Waves, Zap,
} from 'lucide-react';
import { HoopoeModel, type HoopoeDance, type HoopoeLook } from '../mascots/Hoopoe3D';
import Stage3D from '../mascots/Stage3D';
import { AchievementTile, DemoChip, StageTrack, UnlockTile, XpBar, XpCount, XpGain } from '../xp/Xp';

/**
 * The child's companion, the hoopoe, in DEMO mode (owner, 2026-11-15): where it will live (the child's progress page),
 * with made-up points kept on this device, so the owner can watch it hatch, grow and unlock every dance. Real points
 * will come from the teacher after each lesson and be computed on the server (docs/superpowers/specs/2026-11-13-kids-companion-design.md).
 */

type Dance = Exclude<HoopoeDance, 'idle'>;
type L = { ar: string; en: string };

const DANCES: { id: Dance; label: L; xp: number; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'hop', label: { ar: 'نطّة', en: 'Hop' }, xp: 12, icon: Footprints },
  { id: 'crest', label: { ar: 'يفرد تاجه', en: 'Crest' }, xp: 12, icon: Crown },
  { id: 'bob', label: { ar: 'هزّة راس', en: 'Head bob' }, xp: 30, icon: Sparkles },
  { id: 'sway', label: { ar: 'موجة الجناحين', en: 'Wing wave' }, xp: 70, icon: Waves },
  { id: 'twirl', label: { ar: 'دوران', en: 'Twirl' }, xp: 120, icon: RotateCw },
  { id: 'slide', label: { ar: 'زحلقة', en: 'Slide' }, xp: 220, icon: MoveHorizontal },
  { id: 'flip', label: { ar: 'شقلبة', en: 'Backflip' }, xp: 300, icon: Feather },
  { id: 'loop', label: { ar: 'طيران دايري', en: 'Loop flight' }, xp: 400, icon: Orbit },
  { id: 'finale', label: { ar: 'رقصة النجوم', en: 'Star dance' }, xp: 520, icon: Star },
];

// the five stages of the spec, thresholds 0, 12, 70, 220, 520
const STAGES: { key: string; label: L; xp: number; size: number; crest: number; head: number; beak: number }[] = [
  { key: 'egg', label: { ar: 'بيضة', en: 'Egg' }, xp: 0, size: 0.62, crest: 0.6, head: 1.3, beak: 0.45 },
  { key: 'hatched', label: { ar: 'فقس', en: 'Hatched' }, xp: 12, size: 0.62, crest: 0.6, head: 1.3, beak: 0.45 },
  { key: 'small', label: { ar: 'صغيّر', en: 'Small' }, xp: 70, size: 0.76, crest: 0.75, head: 1.18, beak: 0.65 },
  { key: 'young', label: { ar: 'بيكبر', en: 'Growing' }, xp: 220, size: 0.89, crest: 0.9, head: 1.08, beak: 0.85 },
  { key: 'grown', label: { ar: 'كبر', en: 'Grown' }, xp: 520, size: 1, crest: 1, head: 1, beak: 1 },
];
const HATCH = STAGES[1].xp;
const GOLD_TIPS = 160, PENDANT = 350, AURA = 520;

const EARN: { label: L; xp: number; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: { ar: 'ركّز طول الحصة', en: 'Focused all lesson' }, xp: 1, icon: Target },
  { label: { ar: 'أدب وإنصات', en: 'Good manners' }, xp: 1, icon: HeartHandshake },
  { label: { ar: 'عمل الواجب', en: 'Did the homework' }, xp: 1, icon: NotebookPen },
  { label: { ar: 'سمّع المطلوب', en: 'Recited what was due' }, xp: 1, icon: BookOpen },
  { label: { ar: 'صلّى كل الصلوات', en: 'Prayed every prayer' }, xp: 10, icon: Sunrise },
  { label: { ar: 'تجربة سريعة', en: 'Quick test' }, xp: 50, icon: Zap },
];

const KEY = 'demo-hoopoe-xp';
const readXp = () => { try { return Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; } };

export default function CompanionDemo({ lang }: { lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const t = (l: L) => (ar ? l.ar : l.en);
  const still = Boolean(useReducedMotion());
  const [xp, setXp] = useState(readXp);
  const [dance, setDance] = useState<HoopoeDance>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [celebrateAt, setCelebrateAt] = useState(0);
  const [hatchAt, setHatchAt] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [gain, setGain] = useState({ n: 0, id: 0 });
  const clockRef = useRef<() => number>(() => 0);
  const timers = useRef<number[]>([]);
  useEffect(() => { try { localStorage.setItem(KEY, String(xp)); } catch { /* private mode */ } }, [xp]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3600); return () => window.clearTimeout(id); }, [toast]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  const stageIndex = STAGES.reduce((k, s, i) => (xp >= s.xp ? i : k), 0);
  const stage = STAGES[stageIndex];
  const egg = stageIndex === 0;
  const look: HoopoeLook = useMemo(() => ({
    size: stage.size, crest: stage.crest, head: stage.head, beak: stage.beak,
    goldTips: xp >= GOLD_TIPS, pendant: xp >= PENDANT, aura: xp >= AURA, egg, crack: egg ? xp / HATCH : 1,
  }), [stage, xp, egg]);
  const next = DANCES.find((d) => d.xp > xp);
  const prev = [0, ...DANCES.map((d) => d.xp)].filter((v) => v <= xp).pop() ?? 0;
  const progress = egg ? xp / HATCH : next ? (xp - prev) / (next.xp - prev) : 1;
  const caption = egg
    ? (ar ? `باقي ${HATCH - xp} نقطة والبيضة تفقس` : `${HATCH - xp} points until the egg hatches`)
    : next ? (ar ? `باقي ${next.xp - xp} نقطة على «${next.label.ar}»` : `${next.xp - xp} points to "${next.label.en}"`)
      : (ar ? 'فتحت كل الرقصات' : 'Every dance unlocked');

  const play = (id: HoopoeDance) => { setDance(id); setStartedAt(clockRef.current()); };

  const earn = (n: number) => {
    const before = xp, after = xp + n;
    setXp(after);
    setGain((g) => ({ n, id: g.id + 1 }));
    const unlocked = DANCES.filter((d) => d.xp > before && d.xp <= after);
    const grew = STAGES.find((s) => s.xp > before && s.xp <= after && s.key !== 'hatched');
    const hatched = before < HATCH && after >= HATCH;
    const gold = [GOLD_TIPS, PENDANT, AURA].some((g) => g > before && g <= after);
    if (hatched) {
      setDance('idle');
      setHatchAt(clockRef.current() || 0.001);
      setToast(ar ? 'الهدهد فقس! اتفتحت أول رقصتين' : 'Your hoopoe hatched! Two dances unlocked');
      later(2300, () => play('hop'));
      return;
    }
    if (!unlocked.length && !grew && !gold) return;
    setCelebrateAt(clockRef.current() || 1);
    const last = unlocked[unlocked.length - 1];
    setToast([
      last && (ar ? `رقصة جديدة: ${last.label.ar}` : `New dance: ${last.label.en}`),
      grew && (ar ? `الهدهد ${grew.label.ar}!` : `Your hoopoe is ${grew.label.en.toLowerCase()}!`),
      gold && !grew && (ar ? 'لبس حاجة دهب جديدة' : 'A new gold reward'),
    ].filter(Boolean).join(' · '));
    if (last) later(900, () => play(last.id));
  };

  const reset = () => { setXp(0); setDance('idle'); setHatchAt(0); setToast(null); };

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-4 sm:p-6 shadow-[0_18px_40px_-28px_rgba(80,30,10,0.45)]"
      aria-labelledby="companion-title"
      data-testid="companion-demo"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <h2 id="companion-title" className="font-display text-xl sm:text-2xl font-bold">{ar ? 'رفيقك: الهدهد' : 'Your companion: the hoopoe'}</h2>
            <DemoChip label={ar ? 'تجريبي' : 'Demo'} />
          </div>
          <p className="text-sm text-muted-foreground">{ar ? 'بيكبر بنقط حصصك، وكل ما يكبر بيتعلم رقصة جديدة.' : 'It grows with your lesson points and learns a new dance as it grows.'}</p>
        </div>
        <span className="relative">
          <XpCount xp={xp} size="hero" />
          <XpGain gain={gain.n} id={gain.id} />
        </span>
      </div>

      <div className="relative mt-4 h-[min(52svh,400px)] overflow-hidden rounded-3xl bg-[radial-gradient(80%_65%_at_50%_45%,#8A4128_0%,#4A2418_45%,#24140E_80%,#1C120D_100%)]">
        <Stage3D still={still} onClock={(now) => { clockRef.current = now; }}>
          <Suspense fallback={null}>
            <HoopoeModel dance={dance} startedAt={startedAt} onDone={() => setDance('idle')} still={still} look={look} celebrateAt={celebrateAt} hatchAt={hatchAt} />
          </Suspense>
        </Stage3D>
        <AnimatePresence>
          {toast && (
            <motion.p
              key={toast}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', duration: 0.45, bounce: 0.3 }}
              className="absolute inset-x-6 top-4 rounded-2xl border border-[#EDB54C]/50 bg-[#2A1610]/90 px-4 py-2.5 text-center text-sm font-semibold text-[#FFE7A8] backdrop-blur"
              role="status"
            >
              {toast}
            </motion.p>
          )}
        </AnimatePresence>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-[#C9B8A3]">
          {egg ? (ar ? 'اضغط على البيضة' : 'Tap the egg') : (ar ? 'اسحب عشان تلفّه، واضغط عليه' : 'Drag to turn it, tap to say hello')}
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <StageTrack stages={STAGES.map((s) => ({ key: s.key, label: t(s.label), xp: s.xp }))} current={stageIndex} />
        <XpBar value={progress} caption={caption} />
      </div>

      <h3 className="mt-6 text-sm font-semibold">{ar ? 'جرّب تكسب نقط' : 'Try earning points'}</h3>
      <p className="text-xs text-muted-foreground">{ar ? 'في الحقيقة المعلم هو اللي بيديها بعد كل حصة.' : 'For real, your teacher gives these after each lesson.'}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {EARN.map((e) => <AchievementTile key={e.label.en} icon={e.icon} label={t(e.label)} xp={e.xp} onClick={() => earn(e.xp)} />)}
      </div>

      <h3 className="mt-6 text-sm font-semibold">{ar ? 'الرقصات' : 'Dances'}</h3>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {DANCES.map((d) => (
          <UnlockTile key={d.id} icon={d.icon} label={t(d.label)} need={d.xp} locked={xp < d.xp} active={dance === d.id} onClick={() => play(d.id)} />
        ))}
      </div>

      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:text-foreground focus-ring">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />{ar ? 'ابدأ من البيضة تاني' : 'Start again from the egg'}
      </button>
    </section>
  );
}
