import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowDownToLine, ArrowUp, BookOpen, Crown, Ear, Feather, Footprints, HeartHandshake, MoveHorizontal, NotebookPen, Orbit, RefreshCw,
  RotateCcw, RotateCw, Sparkles, Star, Sunrise, Target, Waves, Wind, Zap,
} from 'lucide-react';
import { HoopoeModel, type HoopoeDance, type HoopoeLook } from '../mascots/Hoopoe3D';
import { QuadModel, type QuadDance, type QuadKind, type QuadLook } from '../mascots/Quad3D';
import Stage3D from '../mascots/Stage3D';
import { AchievementTile, DemoChip, StageTrack, UnlockTile, XpBar, XpCount, XpGain } from '../xp/Xp';

/**
 * The child's companion in DEMO mode (owner, 2026-11-15/16): the hoopoe, the camel calf or the fennec, where it will
 * live (the child's progress page), with made-up points kept on this device, so the owner can watch it hatch or wake,
 * grow and unlock every dance. Real points will come from the teacher after each lesson and be computed on the server
 * (docs/superpowers/specs/2026-11-13-kids-companion-design.md). The child picks one companion.
 */

type Kind = 'hoopoe' | QuadKind;
type AnyDance = Exclude<HoopoeDance, 'idle'> | Exclude<QuadDance, 'idle'>;
type L = { ar: string; en: string };
type Icon = React.ComponentType<{ className?: string }>;
type DanceDef = { id: AnyDance; label: L; xp: number; icon: Icon };
type StageDef = { key: string; label: L; xp: number; size: number; head: number; crest?: number; beak?: number };

// thresholds from the spec: 0, 12, 70, 220, 520; dances unlock at 12 (two), 30, 70, 120, 220, 300, 400, 520
const ANIMALS: Record<Kind, { name: L; dances: DanceDef[]; stages: StageDef[]; key: string; img: string }> = {
  hoopoe: {
    name: { ar: 'الهدهد', en: 'the hoopoe' },
    key: 'demo-hoopoe-xp',
    img: '/prototypes/companions/hoopoe-5.webp',
    dances: [
      { id: 'hop', label: { ar: 'نطّة', en: 'Hop' }, xp: 12, icon: Footprints },
      { id: 'crest', label: { ar: 'يفرد تاجه', en: 'Crest' }, xp: 12, icon: Crown },
      { id: 'bob', label: { ar: 'هزّة راس', en: 'Head bob' }, xp: 30, icon: Sparkles },
      { id: 'sway', label: { ar: 'موجة الجناحين', en: 'Wing wave' }, xp: 70, icon: Waves },
      { id: 'twirl', label: { ar: 'دوران', en: 'Twirl' }, xp: 120, icon: RotateCw },
      { id: 'slide', label: { ar: 'زحلقة', en: 'Slide' }, xp: 220, icon: MoveHorizontal },
      { id: 'flip', label: { ar: 'شقلبة', en: 'Backflip' }, xp: 300, icon: Feather },
      { id: 'loop', label: { ar: 'طيران دايري', en: 'Loop flight' }, xp: 400, icon: Orbit },
      { id: 'finale', label: { ar: 'رقصة النجوم', en: 'Star dance' }, xp: 520, icon: Star },
    ],
    stages: [
      { key: 'egg', label: { ar: 'بيضة', en: 'Egg' }, xp: 0, size: 0.62, crest: 0.6, head: 1.3, beak: 0.45 },
      { key: 'hatched', label: { ar: 'فقس', en: 'Hatched' }, xp: 12, size: 0.62, crest: 0.6, head: 1.3, beak: 0.45 },
      { key: 'small', label: { ar: 'صغيّر', en: 'Small' }, xp: 70, size: 0.76, crest: 0.75, head: 1.18, beak: 0.65 },
      { key: 'young', label: { ar: 'بيكبر', en: 'Growing' }, xp: 220, size: 0.89, crest: 0.9, head: 1.08, beak: 0.85 },
      { key: 'grown', label: { ar: 'كبر', en: 'Grown' }, xp: 520, size: 1, crest: 1, head: 1, beak: 1 },
    ],
  },
  camel: {
    name: { ar: 'الجمل', en: 'the camel' },
    key: 'demo-camel-xp',
    img: '/prototypes/companions/camel-5.webp',
    dances: [
      { id: 'trot', label: { ar: 'هرولة', en: 'Trot' }, xp: 12, icon: Footprints },
      { id: 'nod', label: { ar: 'هزّة راس', en: 'Head bob' }, xp: 12, icon: Sparkles },
      { id: 'wiggle', label: { ar: 'هزّ السنام', en: 'Hump wiggle' }, xp: 30, icon: Waves },
      { id: 'spin', label: { ar: 'دوران', en: 'Spin' }, xp: 70, icon: RotateCw },
      { id: 'bow', label: { ar: 'يبرك', en: 'Kneel' }, xp: 120, icon: ArrowDownToLine },
      { id: 'kick', label: { ar: 'رفسة', en: 'Buck' }, xp: 220, icon: Zap },
      { id: 'rear', label: { ar: 'يقف على رجليه', en: 'Rear up' }, xp: 300, icon: ArrowUp },
      { id: 'gallop', label: { ar: 'جري في دايرة', en: 'Gallop' }, xp: 400, icon: Orbit },
      { id: 'finale', label: { ar: 'رقصة النجوم', en: 'Star dance' }, xp: 520, icon: Star },
    ],
    stages: [
      { key: 'newborn', label: { ar: 'مولود', en: 'Newborn' }, xp: 0, size: 0.5, head: 1.25 },
      { key: 'awake', label: { ar: 'صحي', en: 'Awake' }, xp: 12, size: 0.5, head: 1.25 },
      { key: 'small', label: { ar: 'صغيّر', en: 'Small' }, xp: 70, size: 0.66, head: 1.16 },
      { key: 'young', label: { ar: 'بيكبر', en: 'Growing' }, xp: 220, size: 0.83, head: 1.07 },
      { key: 'grown', label: { ar: 'كبر', en: 'Grown' }, xp: 520, size: 1, head: 1 },
    ],
  },
  fennec: {
    name: { ar: 'الفنك', en: 'the fennec' },
    key: 'demo-fennec-xp',
    img: '/prototypes/companions/fennec-5.webp',
    dances: [
      { id: 'pounce', label: { ar: 'غطسة في الرمل', en: 'Sand dive' }, xp: 12, icon: ArrowDownToLine },
      { id: 'ears', label: { ar: 'ودان بتلعب', en: 'Ear flick' }, xp: 12, icon: Ear },
      { id: 'chase', label: { ar: 'يجري ورا ديله', en: 'Tail chase' }, xp: 30, icon: RotateCcw },
      { id: 'wiggle', label: { ar: 'هزّة', en: 'Wiggle' }, xp: 70, icon: Waves },
      { id: 'roll', label: { ar: 'تقلّب', en: 'Roll over' }, xp: 120, icon: RefreshCw },
      { id: 'zoomies', label: { ar: 'جري سريع', en: 'Zoomies' }, xp: 220, icon: Wind },
      { id: 'flip', label: { ar: 'شقلبة', en: 'Backflip' }, xp: 300, icon: Feather },
      { id: 'hops', label: { ar: 'نطّات', en: 'Hops' }, xp: 400, icon: Footprints },
      { id: 'finale', label: { ar: 'رقصة النجوم', en: 'Star dance' }, xp: 520, icon: Star },
    ],
    stages: [
      { key: 'newborn', label: { ar: 'مولود', en: 'Newborn' }, xp: 0, size: 0.52, head: 1.22 },
      { key: 'awake', label: { ar: 'صحي', en: 'Awake' }, xp: 12, size: 0.52, head: 1.22 },
      { key: 'small', label: { ar: 'صغيّر', en: 'Small' }, xp: 70, size: 0.68, head: 1.14 },
      { key: 'young', label: { ar: 'بيكبر', en: 'Growing' }, xp: 220, size: 0.84, head: 1.06 },
      { key: 'grown', label: { ar: 'كبر', en: 'Grown' }, xp: 520, size: 1, head: 1 },
    ],
  },
};
const KINDS: Kind[] = ['hoopoe', 'camel', 'fennec'];
const FIRST = 12; // hatch or wake
const GOLD_TIPS = 160, PENDANT = 350, AURA = 520;

const EARN: { label: L; xp: number; icon: Icon }[] = [
  { label: { ar: 'ركّز طول الحصة', en: 'Focused all lesson' }, xp: 1, icon: Target },
  { label: { ar: 'أدب وإنصات', en: 'Good manners' }, xp: 1, icon: HeartHandshake },
  { label: { ar: 'عمل الواجب', en: 'Did the homework' }, xp: 1, icon: NotebookPen },
  { label: { ar: 'سمّع المطلوب', en: 'Recited what was due' }, xp: 1, icon: BookOpen },
  { label: { ar: 'صلّى كل الصلوات', en: 'Prayed every prayer' }, xp: 10, icon: Sunrise },
  { label: { ar: 'تجربة سريعة', en: 'Quick test' }, xp: 50, icon: Zap },
];

const KIND_KEY = 'demo-companion-kind';
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const readKind = (): Kind => { const k = store.get(KIND_KEY); return k === 'camel' || k === 'fennec' ? k : 'hoopoe'; };
const readXp = (kind: Kind) => Math.max(0, Number(store.get(ANIMALS[kind].key)) || 0);

export default function CompanionDemo({ lang }: { lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const t = (l: L) => (ar ? l.ar : l.en);
  const still = Boolean(useReducedMotion());
  const [kind, setKind] = useState<Kind>(readKind);
  const A = ANIMALS[kind];
  const [xp, setXp] = useState(() => readXp(readKind()));
  const [dance, setDance] = useState<AnyDance | 'idle'>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [celebrateAt, setCelebrateAt] = useState(0);
  const [hatchAt, setHatchAt] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [gain, setGain] = useState({ n: 0, id: 0 });
  const clockRef = useRef<() => number>(() => 0);
  const timers = useRef<number[]>([]);
  useEffect(() => { store.set(A.key, String(xp)); }, [xp, A.key]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3600); return () => window.clearTimeout(id); }, [toast]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach((id) => window.clearTimeout(id)); timers.current = []; };

  const stageIndex = A.stages.reduce((k, s, i) => (xp >= s.xp ? i : k), 0);
  const stage = A.stages[stageIndex];
  const first = stageIndex === 0;
  const hoopoeLook: HoopoeLook = useMemo(() => ({
    size: stage.size, crest: stage.crest ?? 1, head: stage.head, beak: stage.beak ?? 1,
    goldTips: xp >= GOLD_TIPS, pendant: xp >= PENDANT, aura: xp >= AURA, egg: first, crack: first ? xp / FIRST : 1,
  }), [stage, xp, first]);
  const quadLook: QuadLook = useMemo(() => ({
    size: stage.size, head: stage.head, goldTips: xp >= GOLD_TIPS, pendant: xp >= PENDANT, aura: xp >= AURA,
    asleep: first, stir: first ? xp / FIRST : 1,
  }), [stage, xp, first]);
  const next = A.dances.find((d) => d.xp > xp);
  const prev = [0, ...A.dances.map((d) => d.xp)].filter((v) => v <= xp).pop() ?? 0;
  const progress = first ? xp / FIRST : next ? (xp - prev) / (next.xp - prev) : 1;
  const hoopoe = kind === 'hoopoe';
  const caption = first
    ? (hoopoe
      ? (ar ? `باقي ${FIRST - xp} نقطة والبيضة تفقس` : `${FIRST - xp} points until the egg hatches`)
      : (ar ? `باقي ${FIRST - xp} نقطة ويصحى` : `${FIRST - xp} points until it wakes up`))
    : next ? (ar ? `باقي ${next.xp - xp} نقطة على «${next.label.ar}»` : `${next.xp - xp} points to "${next.label.en}"`)
      : (ar ? 'فتحت كل الرقصات' : 'Every dance unlocked');

  // On a phone the buttons sit under the stage: bring the companion back into view so the child sees what the tap did.
  const stageBox = useRef<HTMLDivElement | null>(null);
  const showStage = () => {
    const el = stageBox.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest' });
  };
  const [panel, setPanel] = useState<'dances' | 'earn'>(() => (readXp(readKind()) >= FIRST ? 'dances' : 'earn'));
  const play = (id: AnyDance) => { setDance(id); setStartedAt(clockRef.current()); };

  const pick = (k: Kind) => {
    if (k === kind) return;
    clearTimers();
    store.set(KIND_KEY, k);
    const x = readXp(k);
    setKind(k); setXp(x); setDance('idle'); setHatchAt(0); setToast(null); setCelebrateAt(0);
    setPanel(x >= FIRST ? 'dances' : 'earn');
  };

  const earn = (n: number) => {
    showStage();
    const before = xp, after = xp + n;
    setXp(after);
    setGain((g) => ({ n, id: g.id + 1 }));
    const unlocked = A.dances.filter((d) => d.xp > before && d.xp <= after);
    const grew = A.stages.find((s) => s.xp > before && s.xp <= after && s.xp !== FIRST);
    const gold = [GOLD_TIPS, PENDANT, AURA].some((g) => g > before && g <= after);
    if (before < FIRST && after >= FIRST) {
      setDance('idle');
      setHatchAt(clockRef.current() || 0.001);
      setToast(hoopoe
        ? (ar ? 'الهدهد فقس! اتفتحت أول رقصتين' : 'Your hoopoe hatched! Two dances unlocked')
        : (ar ? `${A.name.ar} صحي وقام على رجليه! اتفتحت أول رقصتين` : `${A.name.en[0].toUpperCase()}${A.name.en.slice(1)} woke up and stood! Two dances unlocked`));
      later(hoopoe ? 2300 : 2700, () => play(A.dances[0].id));
      return;
    }
    if (!unlocked.length && !grew && !gold) return;
    setCelebrateAt(clockRef.current() || 1);
    const last = unlocked[unlocked.length - 1];
    setToast([
      last && (ar ? `رقصة جديدة: ${last.label.ar}` : `New dance: ${last.label.en}`),
      grew && (ar ? `${A.name.ar} ${grew.label.ar}!` : `Your companion is ${grew.label.en.toLowerCase()}!`),
      gold && !grew && (ar ? 'لبس حاجة دهب جديدة' : 'A new gold reward'),
    ].filter(Boolean).join(' · '));
    if (last) later(900, () => play(last.id));
  };

  const reset = () => { clearTimers(); setXp(0); setDance('idle'); setHatchAt(0); setToast(null); setPanel('earn'); };

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-4 sm:p-6 shadow-[0_18px_40px_-28px_rgba(80,30,10,0.45)]"
      aria-labelledby="companion-title"
      data-testid="companion-demo"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <h2 id="companion-title" className="font-display text-xl sm:text-2xl font-bold">{ar ? `رفيقك: ${A.name.ar}` : `Your companion: ${A.name.en}`}</h2>
            <DemoChip label={ar ? 'تجريبي' : 'Demo'} />
          </div>
          <p className="text-sm text-muted-foreground">{ar ? 'بيكبر بنقط حصصك، وكل ما يكبر بيتعلم رقصة جديدة.' : 'It grows with your lesson points and learns a new dance as it grows.'}</p>
        </div>
        <span className="relative">
          <XpCount xp={xp} size="hero" />
          <XpGain gain={gain.n} id={gain.id} />
        </span>
      </div>

      {/* the child picks one companion */}
      <div className="mt-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label={ar ? 'اختار رفيقك' : 'Choose your companion'}>
        {KINDS.map((k) => {
          const on = k === kind;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(k)}
              data-testid={`companion-pick-${k}`}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border py-1 ps-1 pe-4 text-sm font-semibold transition-colors focus-ring ${on ? 'border-[#EDB54C] bg-[#2A1610] text-[#FFE7A8]' : 'border-border bg-surface-subtle text-foreground hover:border-[#EDB54C]/60'}`}
            >
              <img src={ANIMALS[k].img} alt="" width={36} height={36} className="h-9 w-9 rounded-full bg-[#F4E2C4] object-contain" loading="lazy" decoding="async" />
              {ar ? ANIMALS[k].name.ar : ANIMALS[k].name.en.replace('the ', '').replace(/^./, (c) => c.toUpperCase())}
            </button>
          );
        })}
      </div>

      <div ref={stageBox} className="relative mt-4 h-[min(46svh,400px)] scroll-mt-24 overflow-hidden rounded-3xl bg-[radial-gradient(80%_65%_at_50%_45%,#8A4128_0%,#4A2418_45%,#24140E_80%,#1C120D_100%)]">
        <Stage3D still={still} onClock={(now) => { clockRef.current = now; }}>
          <Suspense fallback={null}>
            {hoopoe
              ? <HoopoeModel dance={dance as HoopoeDance} startedAt={startedAt} onDone={() => setDance('idle')} still={still} look={hoopoeLook} celebrateAt={celebrateAt} hatchAt={hatchAt} />
              : <QuadModel key={kind} kind={kind} dance={dance as QuadDance} startedAt={startedAt} onDone={() => setDance('idle')} still={still} look={quadLook} celebrateAt={celebrateAt} wakeAt={hatchAt} />}
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
          {first
            ? (hoopoe ? (ar ? 'اضغط على البيضة' : 'Tap the egg') : (ar ? 'نايم… اكسب نقط عشان يصحى' : 'Asleep… earn points to wake it'))
            : (ar ? 'اسحب عشان تلفّه، واضغط عليه' : 'Drag to turn it, tap to say hello')}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <StageTrack stages={A.stages.map((s) => ({ key: s.key, label: t(s.label), xp: s.xp }))} current={stageIndex} />
        <XpBar value={progress} caption={caption} />
      </div>

      {/* Dances and points in one row under the stage on phones (a grid on wider screens), so a tap and its result share the screen. */}
      <div className="mt-4 inline-flex rounded-full border border-border bg-surface-subtle p-1" role="tablist" aria-label={ar ? 'الرقصات والنقط' : 'Dances and points'}>
        {([['dances', ar ? 'الرقصات' : 'Dances'], ['earn', ar ? 'جرّب تكسب نقط' : 'Try earning points']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={panel === id} onClick={() => setPanel(id)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold focus-ring ${panel === id ? 'bg-foreground text-background' : 'text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>
      {panel === 'earn' && <p className="mt-2 text-xs text-muted-foreground">{ar ? 'في الحقيقة المعلم هو اللي بيديها بعد كل حصة.' : 'For real, your teacher gives these after each lesson.'}</p>}
      <div className="-mx-4 mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-3 lg:grid-cols-5" role="tabpanel">
        {panel === 'dances'
          ? A.dances.map((d) => (
            <div key={d.id} className="w-[92px] shrink-0 snap-start sm:w-auto">
              <UnlockTile icon={d.icon} label={t(d.label)} need={d.xp} locked={xp < d.xp} active={dance === d.id} onClick={() => { showStage(); play(d.id); }} />
            </div>
          ))
          : EARN.map((e) => (
            <div key={e.label.en} className="w-[210px] shrink-0 snap-start sm:w-auto">
              <AchievementTile icon={e.icon} label={t(e.label)} xp={e.xp} onClick={() => earn(e.xp)} />
            </div>
          ))}
      </div>

      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:text-foreground focus-ring">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />{hoopoe ? (ar ? 'ابدأ من البيضة تاني' : 'Start again from the egg') : (ar ? 'ابدأ من الأول تاني' : 'Start again from birth')}
      </button>
    </section>
  );
}
