import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, Layer, out, type Built } from '../Scenes';
import { Rise, SunRays, Glow, Sandstorm, ShootingStar } from '../Motion';
import { useCue } from '../sfx';

/* ---------- Adults Lesson 1: The Man No One Knew (brief: docs/curriculum/zad-essentials-adults/L01-the-man-no-one-knew.md)
   Look: docs/curriculum/style/adults.md (calm documentary stills, Then warm gold / Now cool blue, slow confident motion,
   no bounce). Paintings go in public/curriculum/zad-adults/l01; until one arrives its page shows a warm wash with the
   motion on top. Panels without a painting (the chain of narrators, the levels, the notebook) are drawn here.
   Positions over paintings are % of the painting's box, first guesses from the prompts: check them when the stills arrive. */

const A = (name: string) => `zad-adults/l01/${name}`;
/** Slow and settled: Adults motion eases out over longer durations than Kids and Teens. */
const slow = { duration: 1.2, ease: out };
const INK = '#0E1A22';
const BONE = '#EFE8DC';

/** The backdrop of every code-drawn Adults panel: deep ink, one soft light from above, film grain and a vignette. */
function Stage({ tone = 'ink' }: { tone?: 'ink' | 'dawn' | 'night' }) {
  const reduce = useReducedMotion();
  const base = {
    ink: `radial-gradient(120% 90% at 50% 0%, #1D3440 0%, ${INK} 60%, #070D11 100%)`,
    dawn: 'radial-gradient(120% 90% at 50% 100%, #8B4935 0%, #3A2A26 45%, #0E1A22 100%)',
    night: 'radial-gradient(120% 90% at 50% 20%, #14263A 0%, #08111C 65%, #04080D 100%)',
  }[tone];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ background: base }}>
      <motion.div className="absolute left-1/2 top-[-35%] h-[90%] w-[70%] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(246,213,142,0.18), transparent)' }}
        animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay">
        <filter id="a1grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#a1grain)" />
      </svg>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 100% at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />
    </div>
  );
}

/** A 4:3 panel right of the text column (the size of a Print), holding a still or a code scene. */
function Panel({ children, label, still, tone }: { children?: React.ReactNode; label: string; still?: string; tone?: 'ink' | 'dawn' | 'night' }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(5,20,30,0.85)]" role="img" aria-label={label}>
      <Stage tone={tone} />
      {still && (
        <Layer name={A(still)} filter="none" style={{ objectFit: 'cover' }}
          initial={reduce ? false : { scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 14, ease: 'easeOut' }} />
      )}
      {children}
    </div>
  );
}

/** Large Arabic set in light on a dark panel. */
function Word({ ar, style, size = 64, delay = 0 }: { ar: string; style: React.CSSProperties; size?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span lang="ar" dir="rtl" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif font-bold"
      style={{ color: P.goldSoft, fontSize: size, textShadow: '0 0 24px rgba(246,213,142,0.45)', ...style }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: reduce ? 0.2 : 1.4, delay: reduce ? 0 : delay, ease: out }}>{ar}</motion.span>
  );
}

/* ---------- Spark ---------- */

/** Cover: one shaft of dawn light falls across the empty courtyard; dust turns in it. */
export function ShaftOfLight(_: { v: Built }) {
  return (
    <>
      <SunRays x={78} y={8} size={80} />
      <Rise from={[{ x: 62, y: 80 }, { x: 74, y: 86 }]} count={5} height={30} seed={21} />
    </>
  );
}

/** p2 The misted mirror: a hand's stripe wipes the mist clear, and the morning question is written on the glass. */
export function MirrorWipe({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('whoosh', v.lines >= 1, 0.2);
  return (
    <>
      <motion.div className="absolute inset-0" aria-hidden="true"
        style={{ background: 'linear-gradient(180deg, rgba(225,232,236,0.62), rgba(200,212,220,0.55))', backdropFilter: 'blur(6px)' }}
        initial={false}
        animate={{ clipPath: v.lines >= 1 ? 'polygon(0 0, 100% 0, 100% 30%, 0 30%, 0 52%, 100% 52%, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 30%, 0 30%, 0 30%, 100% 30%, 100% 100%, 0 100%)' }}
        transition={{ duration: reduce ? 0 : 1.6, ease: out }} />
      {v.lines >= 3 && <Tag style={{ left: '52%', top: '74%' }} color={P.deep} delay={0.4}>If today were my last day…</Tag>}
    </>
  );
}

/** p3 The bedside: a warm light gathers on the two hands; the lesson's key words are pinned beside them. */
export function HandsWarm({ v }: { v: Built }) {
  useCue('chime', v.lines >= 3, 0.3);
  return (
    <>
      <Glow x={50} y={62} w={34} h={34} />
      {v.lines >= 3 && <Tag style={{ left: '28%', top: '36%' }} color={P.inkSoft} delay={0.3}>They knew</Tag>}
      {v.lines >= 3 && <Tag style={{ left: '68%', top: '36%' }} color="#9A6A12" delay={1.1}>At the end, they saw</Tag>}
      {v.lines >= 3 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <Pen d="M36 36 C44 29 52 29 60 36" color={P.goldSoft} width={4} delay={0.7} duration={0.6} />
        </svg>
      )}
    </>
  );
}

/** p4 The street: a slow beam passes with the car; then the gap between knowing and being moved is named. */
export function FuneralPasses({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && (
        <motion.div className="absolute top-[40%] h-[30%] w-[30%] rounded-full" aria-hidden="true"
          style={{ background: 'radial-gradient(closest-side, rgba(255,236,190,0.35), transparent)', mixBlendMode: 'screen' }}
          initial={{ left: '-30%' }} animate={{ left: '100%' }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
      )}
      {v.lines >= 2 && <Tag style={{ left: '42%', top: '30%' }} color={P.deep} delay={0.3}>Everyone here is sure</Tag>}
      {v.interaction && <Tag style={{ left: '50%', top: '84%' }} color={P.crimson} delay={0.4}>Sure, and not moved</Tag>}
    </>
  );
}

/* ---------- Zad ---------- */

/** p5 Al-Hijr 15:99: the sun sinks to the horizon, the one appointment no one doubts; the word is named as it sets. */
export function SunsetCertainty({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('chime', v.evidence, 1.4);
  return (
    <Panel label={label} tone="dawn">
      <motion.div className="absolute left-1/2 h-[120px] w-[120px] -translate-x-1/2 rounded-full" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, #FFF2C8 0%, #F0B04A 55%, rgba(240,176,74,0) 72%)', boxShadow: '0 0 90px 30px rgba(240,176,74,0.35)' }}
        initial={false} animate={{ top: v.evidence ? '64%' : '30%' }} transition={{ duration: reduce ? 0 : 3, ease: out }} />
      <div className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: 'linear-gradient(180deg, #2A1C17, #120C0A)' }} aria-hidden="true" />
      <div className="absolute inset-x-0 top-[70%] h-[2px] bg-[#F6D58E]/50" aria-hidden="true" />
      {v.evidence && <Word ar="ٱلْيَقِينُ" style={{ left: '50%', top: '86%' }} size={60} delay={1.6} />}
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '14%' }} color={P.copper} delay={0.3}>The one thing no one doubts</Tag>}
    </Panel>
  );
}


/** p6 Where the gap is: three steps rise from heard to seen; a pen marks the gap between the first and the second. */
export function GapSteps({ labels, label }: { labels: (string | null)[]; label: string }) {
  const lit = labels.filter(Boolean).length;
  useCue('thud', lit, 0.3);
  const x = (i: number) => 18 + i * 32;
  const h = (i: number) => 22 + i * 18;
  return (
    <div className="absolute left-[700px] top-[160px] h-[600px] w-[800px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${lit} of 3`}>
      <Stage />
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute bottom-[14%] w-[24%] rounded-t-[14px]"
          style={{ left: `${x(i) - 12}%`, height: `${h(i)}%`, background: `linear-gradient(180deg, ${['#3C5560', '#8B4935', '#E5A93C'][i]}, ${['#1E2C33', '#4A2418', '#9A6A12'][i]})` }}
          initial={false} animate={{ opacity: i < lit ? 1 : 0.12, clipPath: i < lit ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }} transition={slow} />
      ))}
      {labels.map((l, i) => {
        if (!l) return null;
        const [word, hint] = l.split(':').map((s) => s.trim());
        return (
          <Tag key={l} style={{ left: `${x(i)}%`, top: `${86 - h(i) - 8}%` }} size={20} color={P.ink} delay={0.6}>
            <span>{word}</span>
            {hint && <span className="max-w-[230px] whitespace-normal text-[14px] font-semibold" style={{ color: P.inkSoft }}>{hint}</span>}
          </Tag>
        );
      })}
      {lit >= 2 && <Tag style={{ left: '34%', top: '76%' }} size={18} color={P.crimson} delay={1.2}>the gap</Tag>}
      {lit >= 3 && <Rise from={[{ x: x(2), y: 30 }]} count={6} height={20} seed={4} />}
    </div>
  );
}

/** p7 Madinah: the morning light turns slowly in the courtyard. */
export function MadinahMorning(_: { v: Built }) {
  return (
    <>
      <SunRays x={86} y={10} size={70} />
      <Rise from={[{ x: 40, y: 82 }, { x: 64, y: 86 }]} count={5} height={24} seed={8} />
    </>
  );
}

const CHAIN = [
  { en: 'The Prophet', ar: 'النبي ﷺ' },
  { en: 'Umar ibn al-Khattab', ar: 'عمر بن الخطاب' },
  { en: 'Abdullah ibn Umar', ar: 'عبد الله بن عمر' },
  { en: 'Yahya ibn Ya\'mar', ar: 'يحيى بن يعمر' },
  { en: 'Sahih Muslim, to us', ar: 'صحيح مسلم' },
];

/** p8 Why Ibn Umar told it: the chain of narrators lights link by link, from the Messenger ﷺ down to the page in front of
 *  the learner. Names only, as text; no one is drawn. */
export function NarratorChain({ v }: { v: Built }) {
  const lit = v.lines >= 3 ? CHAIN.length : v.lines >= 2 ? 3 : v.lines >= 1 ? 2 : 1;
  useCue('chime', lit, 0.3);
  const y = (i: number) => 14 + i * 18;
  return (
    <div className="absolute inset-0" role="img" aria-label="The chain of narrators">
      <Stage tone="dawn" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {CHAIN.slice(1, lit).map((_, i) => <Pen key={i} d={`M52 ${y(i) + 4} L52 ${y(i + 1) - 4}`} color={P.goldSoft} width={3} duration={0.6} glow />)}
      </svg>
      {CHAIN.slice(0, lit).map((c, i) => (
        <Tag key={c.en} style={{ left: '52%', top: `${y(i)}%` }} size={20} color={i === 2 ? P.crimson : P.ink} ar={c.ar} delay={0.3}>{c.en}</Tag>
      ))}
      {v.lines >= 3 && v.evidence && <Tag style={{ left: '84%', top: `${y(2)}%` }} size={17} color={P.teal} delay={0.6}>Back to the source</Tag>}
    </div>
  );
}

/** p9 The stranger: sand blows across the frame and leaves a calm space round the small white figure. */
export function SandAround({ v }: { v: Built }) {
  useCue('sand', v.lines >= 1, 0.2);
  const hole = 'radial-gradient(ellipse 12% 20% at 50% 62%, transparent 55%, #000 100%)';
  return (
    <>
      <div className="absolute inset-0" style={{ maskImage: hole, WebkitMaskImage: hole }}>
        <Sandstorm count={40} seed={14} strength={1.1} />
      </div>
      <Glow x={50} y={62} w={14} h={30} />
    </>
  );
}

/** p10 Knees to knees: a pen arc closes the space between the two cushions. */
export function CushionsClose({ v }: { v: Built }) {
  useCue('pen', v.lines >= 1, 0.2);
  return (
    <>
      <Glow x={50} y={40} w={30} h={30} />
      {v.lines >= 1 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <Pen d="M34 70 C42 58 58 58 66 70" color={P.goldSoft} width={4} dash="2 4" duration={0.9} />
        </svg>
      )}
      {v.lines >= 1 && <Tag style={{ left: '50%', top: '52%' }} size={18} color={P.deep} delay={0.8} ar={v.evidence ? 'رُكبَتَيه إلى رُكبَتَيه' : undefined}>Knees to knees</Tag>}
      {v.lines >= 3 && <Tag style={{ left: '50%', top: '88%' }} size={18} color="#9A6A12" delay={0.4}>Full attention, then the questions</Tag>}
    </>
  );
}

const PILLARS = [
  { en: 'Shahadah', ar: 'الشهادة' }, { en: 'Salah', ar: 'الصلاة' }, { en: 'Zakah', ar: 'الزكاة' },
  { en: 'Fasting', ar: 'الصوم' }, { en: 'Hajj', ar: 'الحج' },
];

/** p11 Islam: five stone columns rise out of the dark one by one under a lintel that settles when the fifth stands. */
export function ColumnsRise({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const up = Math.min(v.items, PILLARS.length);
  const done = up === PILLARS.length;
  useCue('thud', up, 0.5);
  const left = (i: number) => 12 + i * 16;
  return (
    <Panel label={`${label}: ${up} of 5`}>
      <motion.div className="absolute left-[8%] right-[8%] top-[14%] h-[7%] rounded-[6px]" aria-hidden="true"
        style={{ background: done ? `linear-gradient(180deg, ${BONE}, #BFB3A0)` : 'transparent', border: `2px ${done ? 'solid' : 'dashed'} rgba(239,232,220,0.5)` }}
        initial={false} animate={{ y: done ? 10 : 0, opacity: done ? 1 : 0.5 }} transition={{ duration: reduce ? 0 : 0.9, ease: out, delay: done ? 0.6 : 0 }} />
      {PILLARS.map((p, i) => (
        <div key={p.en} className="absolute bottom-[14%] top-[24%]" style={{ left: `${left(i)}%`, width: '11%' }}>
          <motion.div className="absolute inset-0 rounded-t-[6px]"
            style={{ background: `linear-gradient(90deg, #9C9183, ${BONE} 40%, #D6CCBC 60%, #8E8476)` }}
            initial={false} animate={{ clipPath: i < up ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }} transition={{ duration: reduce ? 0 : 1, ease: out }} />
          {i < up && <Word ar={p.ar} style={{ left: '50%', top: '50%', color: INK, textShadow: 'none' }} size={24} delay={0.6} />}
          <span className="absolute -bottom-[16%] left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-[17px] font-bold" style={{ color: i < up ? BONE : 'rgba(239,232,220,0.25)' }}>{i < up ? p.en : '·'}</span>
        </div>
      ))}
      <div className="absolute inset-x-[6%] bottom-[13%] h-[2px] bg-[#EFE8DC]/50" aria-hidden="true" />
      {v.evidence && <Tag style={{ left: '50%', top: '7%' }} color="#9A6A12" delay={0.4}>"You are right." He already knew.</Tag>}
    </Panel>
  );
}

const SIX = ['Allah', 'Angels', 'Books', 'Messengers', 'Last Day', 'Qadar'];

/** p12 Iman: six points of light on a ring, each joined to the centre as it is named. */
export function SixLights({ v, label }: { v: Built; label: string }) {
  const lit = Math.min(v.items, SIX.length);
  useCue('chime', lit, 0.2);
  const pt = (i: number) => { const a = (Math.PI * 2 * i) / SIX.length - Math.PI / 2; return { x: 380 + 220 * Math.cos(a), y: 285 + 200 * Math.sin(a) }; };
  return (
    <Panel label={`${label}: ${lit} of 6`}>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
        <circle cx="380" cy="285" r="210" fill="none" stroke="rgba(239,232,220,0.18)" strokeWidth="2" strokeDasharray="4 10" />
        {SIX.slice(0, lit).map((_, i) => <Pen key={i} d={`M380 285 L${pt(i).x} ${pt(i).y}`} color={P.goldSoft} width={2.5} duration={0.7} />)}
        <circle cx="380" cy="285" r="34" fill={P.goldSoft} opacity={0.15 + (lit / SIX.length) * 0.75} style={{ filter: 'drop-shadow(0 0 18px rgba(246,213,142,0.8))' }} />
      </svg>
      {SIX.slice(0, lit).map((w, i) => (
        <Tag key={w} style={{ left: `${(pt(i).x / 760) * 100}%`, top: `${(pt(i).y / 570) * 100}%` }} size={19} color={P.deep} delay={0.4}>{w}</Tag>
      ))}
    </Panel>
  );
}

/** p13 Ihsan: two steps of light. The higher, as if you see Him; the floor beneath it, He sees you. */
export function IhsanSteps({ v, label }: { v: Built; label: string }) {
  useCue('reveal', v.evidence, 0.6);
  return (
    <Panel label={label} tone="night">
      <motion.div className="absolute left-[18%] right-[18%] top-[26%] h-[16%] rounded-[16px] border-2 border-dashed" aria-hidden="true"
        style={{ borderColor: 'rgba(246,213,142,0.7)', background: 'rgba(246,213,142,0.08)' }}
        initial={{ opacity: 0 }} animate={{ opacity: v.lines >= 1 ? 1 : 0 }} transition={slow} />
      <motion.div className="absolute left-[10%] right-[10%] top-[60%] h-[16%] rounded-[16px]" aria-hidden="true"
        style={{ background: 'linear-gradient(180deg, #E5A93C, #9A6A12)', boxShadow: '0 0 60px -10px rgba(229,169,60,0.7)' }}
        initial={{ opacity: 0 }} animate={{ opacity: v.lines >= 1 ? 1 : 0 }} transition={{ ...slow, delay: 0.4 }} />
      {v.evidence && <Word ar="كَأنَّك تَراه" style={{ left: '50%', top: '34%' }} size={46} delay={0.3} />}
      {v.evidence && <Word ar="فإنَّه يَراك" style={{ left: '50%', top: '68%', color: INK, textShadow: 'none' }} size={46} delay={1.1} />}
      {v.evidence && <Tag style={{ left: '50%', top: '88%' }} size={18} color={P.deep} delay={1.8}>If not the first, never less than the second</Tag>}
    </Panel>
  );
}

/** p14 The Hour: sand runs through an hourglass drawn in code; its time is with Allah alone. */
export function HourglassRuns({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  return (
    <Panel label={label} tone="dawn">
      <svg className="absolute left-1/2 top-[10%] h-[70%] -translate-x-1/2 overflow-visible" viewBox="0 0 200 300" aria-hidden="true">
        <rect x="30" y="6" width="140" height="12" rx="4" fill="#6B4A2E" />
        <rect x="30" y="282" width="140" height="12" rx="4" fill="#6B4A2E" />
        <path d="M45 18 C45 110 92 130 96 150 C92 170 45 190 45 282 L155 282 C155 190 108 170 104 150 C108 130 155 110 155 18 Z" fill="rgba(239,232,220,0.08)" stroke={BONE} strokeOpacity="0.5" strokeWidth="2" />
        <motion.path d="M60 40 L140 40 C130 95 104 125 100 140 C96 125 70 95 60 40 Z" fill="#E8C98A" initial={false}
          animate={reduce ? undefined : { scaleY: [1, 0.3] }} style={{ transformOrigin: '100px 140px' }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
        {!reduce && <motion.line x1="100" y1="150" x2="100" y2="270" stroke="#E8C98A" strokeWidth="2" strokeDasharray="3 6"
          animate={{ strokeDashoffset: [0, -18] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />}
        <motion.path d="M55 280 C70 240 130 240 145 280 Z" fill="#E8C98A" initial={false}
          animate={reduce ? undefined : { scaleY: [0.4, 1] }} style={{ transformOrigin: '100px 280px' }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
      </svg>
      {v.evidence && <Tag style={{ left: '50%', top: '88%' }} color={P.copper} delay={0.6}>Its time is with Allah alone</Tag>}
      {v.interaction && <Tag style={{ left: '50%', top: '8%' }} color={P.deep} delay={0.3}>Certain. Hidden. So: ready.</Tag>}
    </Panel>
  );
}

/** p15 The reveal: a far white light on the dark horizon opens wide as the Prophet ﷺ names him. */
export function FarLightOpens({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('reveal', v.evidence, 0.3);
  return (
    <Panel label={label} tone="night">
      <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: 'linear-gradient(180deg, #1A1612, #0B0907)' }} aria-hidden="true" />
      <motion.div className="absolute left-1/2 top-[66%] h-[30%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(255,250,235,0.95), rgba(255,240,200,0) 70%)', mixBlendMode: 'screen' }}
        initial={false} animate={{ scale: v.evidence ? (reduce ? 3 : [1, 3.2]) : 1, opacity: v.evidence ? 1 : 0.6 }} transition={{ duration: 2, ease: out }} />
      {v.evidence && <Word ar="جِبريل" style={{ left: '50%', top: '30%' }} size={72} delay={1} />}
      {v.evidence && <Tag style={{ left: '50%', top: '88%' }} color={P.deep} ar="يُعَلِّمُكُم دينَكُم" delay={1.8}>to teach you your deen</Tag>}
    </Panel>
  );
}

const LEVELS = [
  { r: 250, color: '#3C5560', name: 'Islam' },
  { r: 170, color: '#8B4935', name: 'Iman' },
  { r: 90, color: '#E5A93C', name: 'Ihsan' },
];

/** p16 Three levels of one deen: three rings, each inside the one before, light from the outside in. */
export function RingsInward({ labels, label }: { labels: (string | null)[]; label: string }) {
  const lit = labels.filter(Boolean).length;
  useCue('chime', lit, 0.2);
  return (
    <div className="absolute left-[700px] top-[160px] h-[600px] w-[800px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${lit} of 3`}>
      <Stage />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <motion.circle key={l.name} cx="400" cy="300" r={l.r} fill={l.color} initial={false}
            animate={{ opacity: i < lit ? 0.85 : 0.08 }} transition={{ ...slow, delay: 0.2 }} stroke={BONE} strokeOpacity={0.35} strokeWidth={2} />
        ))}
      </svg>
      {LEVELS.map((l, i) => (i < lit ? (
        <Tag key={l.name} style={{ left: '50%', top: `${50 - ((l.r - 40) / 600) * 100}%` }} size={20} color={P.ink} delay={0.6}>{labels[i]?.split(':')[0]}</Tag>
      ) : null))}
      {lit === 3 && <Rise from={[{ x: 50, y: 52 }]} count={6} height={16} seed={9} />}
    </div>
  );
}

/** p17 At-Takathur 102:1–2: the graveyard's shadows lengthen as the ayah is read; "visited" is circled. */
export function ShadowsLengthen({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('pen', v.evidence, 0.8);
  return (
    <Panel label={label} still="graves">
      <motion.div className="absolute inset-0" aria-hidden="true"
        style={{ background: 'linear-gradient(100deg, rgba(14,26,34,0) 30%, rgba(14,26,34,0.55) 100%)' }}
        initial={false} animate={{ opacity: v.evidence ? 1 : 0.2 }} transition={{ duration: reduce ? 0 : 4, ease: 'easeInOut' }} />
      {v.evidence && <Tag style={{ left: '74%', top: '20%' }} ar="زُرْتُمُ" color="#9A6A12" delay={1}>visited: guests, not residents</Tag>}
      {v.lines >= 2 && <Tag style={{ left: '30%', top: '86%' }} size={18} color={P.deep} delay={0.3}>Busy, all the way here</Tag>}
    </Panel>
  );
}

const COUNTS = [
  { label: 'Followers', from: 1240, to: 12480 },
  { label: 'Balance', from: 3200, to: 28900 },
  { label: 'Likes', from: 88, to: 9410 },
];

function Counter({ from, to, run }: { from: number; to: number; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(from);
  React.useEffect(() => {
    if (!run || reduce) { setN(run ? to : from); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 2400); setN(Math.round(from + (to - from) * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, from, to, reduce]);
  return <>{n.toLocaleString('en-GB')}</>;
}

/** p18 "My wealth, my wealth": three counters climb; at the question three things fade and only what was given stays. */
export function CountersFade({ v }: { v: Built }) {
  useCue('strike', v.interaction, 0.6);
  const kept = ['Ate: used up', 'Wore: worn out', 'Gave: sent ahead'];
  return (
    <div className="absolute inset-0">
      <Stage />
      <div className="absolute left-[16%] right-[10%] top-[16%] space-y-5">
        {COUNTS.map((c, i) => (
          <motion.div key={c.label} className="flex items-baseline justify-between border-b border-[#EFE8DC]/20 pb-2 font-sans" initial={false}
            animate={{ opacity: v.interaction ? 0.18 : 1 }} transition={{ duration: 1, delay: i * 0.2 }}>
            <span className="text-[22px] font-semibold" style={{ color: 'rgba(239,232,220,0.7)' }}>{c.label}</span>
            <span className="text-[44px] font-bold tabular-nums" style={{ color: BONE }}><Counter from={c.from} to={c.to} run={v.lines >= 1} /></span>
          </motion.div>
        ))}
      </div>
      {v.interaction && kept.map((k, i) => (
        <Tag key={k} style={{ left: '62%', top: `${62 + i * 11}%` }} size={19} color={i < 2 ? P.inkSoft : '#9A6A12'} delay={0.8 + i * 0.4}>{k}</Tag>
      ))}
    </div>
  );
}

/** p19 'Ilm al-yaqeen: rings of sound travel from a word to a heart and, at last, reach it. */
export function SoundToHeart({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('chime', v.evidence, 1.6);
  return (
    <Panel label={label}>
      <span className="absolute left-[18%] top-[48%] -translate-x-1/2 -translate-y-1/2 font-serif text-[26px] italic" style={{ color: BONE }}>a true report</span>
      {!reduce && [0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute left-[18%] top-[48%] h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2" aria-hidden="true"
          style={{ borderColor: 'rgba(246,213,142,0.6)' }}
          animate={{ left: ['18%', '72%'], opacity: [0.9, 0], scale: [0.6, 1.6] }} transition={{ duration: 3, delay: i, repeat: Infinity, ease: 'easeOut' }} />
      ))}
      <svg className="absolute left-[72%] top-[48%] h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
        <motion.path d="M50 86 C20 64 8 46 18 30 C28 16 44 20 50 34 C56 20 72 16 82 30 C92 46 80 64 50 86 Z"
          fill={v.evidence ? P.crimson : 'none'} stroke={BONE} strokeWidth="2.5" initial={false}
          animate={{ filter: v.evidence ? 'drop-shadow(0 0 16px rgba(197,31,36,0.8))' : 'none' }} transition={{ duration: 1.2, delay: 1.4 }} />
      </svg>
      {v.evidence && <Word ar="عِلْمَ ٱلْيَقِينِ" style={{ left: '50%', top: '84%' }} size={44} delay={1.8} />}
      {v.lines >= 2 && <Tag style={{ left: '72%', top: '20%' }} size={18} color={P.deep} delay={0.4}>…until it reaches the heart</Tag>}
    </Panel>
  );
}

/** p20 'Ayn al-yaqeen: an eye opens slowly onto warm light. */
export function EyeOpens({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('reveal', v.evidence, 0.8);
  const open = v.evidence;
  return (
    <Panel label={label} tone="night">
      <svg className="absolute left-1/2 top-[44%] h-[60%] w-[80%] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="0 0 400 200" aria-hidden="true">
        <defs><clipPath id="a1eye"><path d="M20 100 C110 10 290 10 380 100 C290 190 110 190 20 100 Z" /></clipPath></defs>
        <g clipPath="url(#a1eye)">
          <rect width="400" height="200" fill="#0B1420" />
          <motion.circle cx="200" cy="100" r="70" fill="url(#a1iris)" initial={false} animate={{ opacity: open ? 1 : 0.15 }} transition={{ duration: 1.6 }} />
          <motion.rect x="0" width="400" fill={INK} initial={false} animate={{ y: open ? -110 : 0, height: 100 }} transition={{ duration: reduce ? 0 : 2.2, ease: out }} />
          <motion.rect x="0" width="400" fill={INK} initial={false} animate={{ y: open ? 210 : 100, height: 100 }} transition={{ duration: reduce ? 0 : 2.2, ease: out }} />
        </g>
        <radialGradient id="a1iris"><stop offset="0" stopColor="#FFF6D8" /><stop offset="0.45" stopColor="#E5A93C" /><stop offset="1" stopColor="#8B4935" /></radialGradient>
        <path d="M20 100 C110 10 290 10 380 100 C290 190 110 190 20 100 Z" fill="none" stroke={BONE} strokeOpacity="0.5" strokeWidth="2" />
      </svg>
      {open && <Word ar="عَيْنَ ٱلْيَقِينِ" style={{ left: '50%', top: '86%' }} size={44} delay={2} />}
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '10%' }} size={18} color={P.deep} delay={0.4}>Everyone reaches it. The question is when.</Tag>}
    </Panel>
  );
}

const INSIDE = ['Told', 'Seen', 'Inside'];

/** p21 Haqq al-yaqeen: three arches one behind another; each level lights the next arch deeper in. */
export function ArchesDeeper({ v, label }: { v: Built; label: string }) {
  const lit = Math.min(v.items, 3);
  useCue('chime', lit, 0.3);
  const arch = (s: number) => { const w = 300 * s, h = 420 * s, x = 380 - w / 2, y = 520 - h; return `M${x} 520 L${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L${x + w} 520`; };
  return (
    <Panel label={`${label}: ${lit} of 3`} tone="dawn">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true">
        {[1.4, 1, 0.62].map((s, i) => (
          <g key={s}>
            <motion.path d={`${arch(s)} Z`} fill={['#3C5560', '#8B4935', '#F6D58E'][i]} initial={false} animate={{ opacity: i < lit ? 0.75 : 0.06 }} transition={slow} />
            <Pen d={arch(s)} color={BONE} width={2.5} delay={i * 0.25} duration={1} />
          </g>
        ))}
      </svg>
      {INSIDE.slice(0, lit).map((w, i) => (
        <Tag key={w} style={{ left: '50%', top: `${[16, 34, 60][i]}%` }} size={19} color={P.ink} delay={0.5}>{w}</Tag>
      ))}
      {lit === 3 && <Rise from={[{ x: 50, y: 82 }]} count={6} height={22} seed={12} />}
      {v.evidence && <Word ar="حَقُّ ٱلْيَقِينِ" style={{ left: '50%', top: '82%', color: INK, textShadow: 'none' }} size={40} delay={0.6} />}
    </Panel>
  );
}

/** p22 The wow: "From hearing to seeing". A misted glass fills the panel over the dawn horizon. Hearing: the words
 *  arrive as ripples on the glass. Seeing (first phrase): a wipe clears the mist. Inside (second phrase): the camera
 *  pushes through the glass into the light. Transform, opacity and clip-path only. */
export function MistToSight({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const stage = labels.filter(Boolean).length; // 0 hearing, 1 seeing, 2 inside
  useCue('whoosh', stage >= 1, 0.2);
  useCue('reveal', stage >= 2, 0.6);
  return (
    <div className="absolute left-[680px] top-[150px] h-[620px] w-[840px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(5,20,30,0.85)]" role="img" aria-label={`${label}: ${['hearing', 'seeing', 'inside'][stage]}`}>
      <motion.div className="absolute inset-0" initial={false} animate={{ scale: stage >= 2 && !reduce ? 1.5 : 1 }} transition={{ duration: 3.2, ease: [0.65, 0, 0.35, 1] }}>
        <Stage tone="dawn" />
        <Layer name={A('horizon')} filter="none" style={{ objectFit: 'cover' }} />
        <SunRays x={50} y={70} size={90} />
        {/* The mist, wiped away from left to right when the learner moves from hearing to seeing. */}
        <motion.div className="absolute inset-0" aria-hidden="true"
          style={{ background: 'linear-gradient(180deg, rgba(232,236,238,0.86), rgba(214,222,226,0.8))', backdropFilter: 'blur(14px)' }}
          initial={false} animate={{ clipPath: stage >= 1 ? 'inset(0 0 0 100%)' : 'inset(0 0 0 0%)' }} transition={{ duration: reduce ? 0 : 1.8, ease: out }} />
        {stage === 0 && !reduce && [0, 1, 2].map((i) => (
          <motion.span key={i} className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2" aria-hidden="true"
            style={{ borderColor: 'rgba(14,26,34,0.35)' }}
            animate={{ scale: [0.4, 3], opacity: [0.8, 0] }} transition={{ duration: 3, delay: i, repeat: Infinity, ease: 'easeOut' }} />
        ))}
      </motion.div>
      {stage === 0 && <Tag style={{ left: '50%', top: '50%' }} color={P.deep}>You heard it</Tag>}
      {labels[0] && <Word ar={labels[0]} style={{ left: '30%', top: '20%' }} size={52} delay={1.4} />}
      {labels[1] && <Word ar={labels[1]} style={{ left: '70%', top: '20%' }} size={52} delay={0.8} />}
      {stage >= 1 && <Tag style={{ left: '50%', top: '90%' }} color={P.deep} delay={stage >= 2 ? 2.6 : 1.6}>{stage >= 2 ? 'This is where the course wants to take you' : 'You see it'}</Tag>}
    </div>
  );
}

/* ---------- Athar ---------- */

/** p23 Hanzalah: the lane from the masjid to a lit doorway; the two states are pinned at each end, and the reply lands. */
export function LaneTwoStates({ v, label }: { v: Built; label: string }) {
  useCue('chime', v.evidence, 0.6);
  return (
    <Panel label={label} still="lane">
      <Glow x={70} y={56} w={16} h={26} />
      {v.lines >= 1 && <Tag style={{ left: '22%', top: '16%' }} size={18} color="#9A6A12" ar="كَأنَّا رَأيُ عَينٍ" delay={0.3}>At the gathering</Tag>}
      {v.lines >= 1 && <Tag style={{ left: '74%', top: '30%' }} size={18} color={P.inkSoft} delay={1}>At home: we forgot</Tag>}
      {v.evidence && <Tag style={{ left: '50%', top: '86%' }} color={P.deep} ar="ساعةً وساعةً" delay={0.6}>an hour and an hour</Tag>}
    </Panel>
  );
}

/** p24 Friday, then Monday: the room stays calm, then notification marks pile up on the laptop until the source is named. */
export function MondayPile({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pop', v.lines >= 2, 0.2);
  return (
    <>
      {v.lines >= 1 && <Tag style={{ left: '24%', top: '18%' }} size={18} color="#9A6A12" delay={0.3}>Friday: moved</Tag>}
      {v.lines >= 2 && Array.from({ length: 7 }, (_, i) => (
        <motion.span key={i} className="absolute h-[22px] w-[22px] rounded-full" aria-hidden="true"
          style={{ left: `${54 + (i % 4) * 5}%`, top: `${40 - Math.floor(i / 4) * 7}%`, background: P.crimson, boxShadow: '0 0 12px rgba(197,31,36,0.6)' }}
          initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.18, ease: out }} />
      ))}
      {v.lines >= 3 && <Tag style={{ left: '50%', top: '82%' }} color={P.deep} delay={0.4}>Go back to the source</Tag>}
    </>
  );
}

/** p25–28 The cases: a quiet desk light over a case card; the learner reasons, then the answer is pinned. */
export function CaseLight({ v }: { v: Built }) {
  return (
    <div className="absolute inset-0">
      <Stage />
      <Glow x={50} y={40} w={50} h={50} />
      <span className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 font-serif text-[220px] leading-none" aria-hidden="true" style={{ color: 'rgba(246,213,142,0.16)' }}>?</span>
      {v.interaction && <Rise from={[{ x: 50, y: 70 }]} count={5} height={20} seed={17} />}
    </div>
  );
}

/* ---------- Ahd ---------- */

/** p30 Zad al-Yaqeen: the dark notebook opens on bone pages; the first line writes itself in ink. */
export function NotebookOpens({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pen', v.lines >= 2, 0.8);
  return (
    <div className="absolute inset-0">
      <Stage />
      <motion.div className="absolute left-[12%] right-[12%] top-[16%] bottom-[14%] rounded-[14px] p-[3%] shadow-[0_40px_70px_-30px_rgba(0,0,0,0.9)]"
        style={{ background: 'linear-gradient(135deg, #3A2418, #1E120C)' }} aria-hidden="true"
        initial={reduce ? false : { rotateY: -35, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1.4, ease: out }}>
        <div className="relative h-full rounded-[8px] px-[6%] pt-[10%]" style={{ background: `repeating-linear-gradient(180deg, ${BONE} 0 44px, #D8CDBB 44px 46px)` }}>
          <span lang="ar" dir="rtl" className="absolute right-[6%] top-[3%] font-serif text-[30px] font-bold" style={{ color: P.copper }}>زاد اليقين</span>
          {v.lines >= 2 && (
            <motion.span className="block font-serif text-[30px] italic leading-[46px]" style={{ color: INK }}
              initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 2.2, delay: 0.8, ease: 'linear' }}>
              I am now certain that…
            </motion.span>
          )}
          {v.lines >= 3 && <span className="mt-[46px] block font-sans text-[20px] font-semibold" style={{ color: P.inkSoft }}>This week: ______________</span>}
        </div>
      </motion.div>
    </div>
  );
}

/** p31 Next time: stars come out over the desert and one crosses the sky as the first question is asked. */
export function FirstQuestionSky({ v }: { v: Built }) {
  return (
    <>
      <Rise from={[{ x: 20, y: 40 }, { x: 55, y: 30 }, { x: 80, y: 45 }]} count={3} height={8} seed={31} />
      {v.lines >= 3 && <ShootingStar x1={10} y1={10} x2={70} y2={30} delay={0.4} />}
      {v.lines >= 3 && <Tag style={{ left: '40%', top: '72%' }} color={P.deep} delay={1.4}>Is there a Maker at all?</Tag>}
    </>
  );
}
