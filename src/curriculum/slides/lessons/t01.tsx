import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, Print, out, type Built } from '../Scenes';
import { Burst, Rise, SunRays, Glow, Sandstorm, Sprite } from '../Motion';
import { useCue } from '../sfx';

/* ---------- Teens Lesson 1: The Stranger with No Dust (brief: docs/curriculum/zad-essentials-teens/L01-the-stranger-with-no-dust.md)
   Paintings in public/curriculum/zad-teens/l01 (prompts: docs/curriculum/style/teens.md, Step 3). Until a
   painting arrives its page shows a warm wash with the code-drawn motion on top. The Why List phone, the five pillars, the
   six articles of Iman and the three doors are drawn here in code. Positions over paintings are % of the painting's box,
   first guesses from the prompts: check them when the paintings arrive. */

const T = (name: string) => `zad-teens/l01/${name}`;
export const C = (name: string) => `zad-teens/characters/${name}.webp`;

/** The series device: Zayn's "Why List" note on a phone. `typed` is the row being written now (typewriter); `crossed`
 *  rows are answered and struck through. Used by every Teens lesson. */
export function WhyList({ rows, typed = -1, crossed = [], later = {}, style, delay = 0 }: { rows: string[]; typed?: number; crossed?: number[]; later?: Record<number, string>; style: React.CSSProperties; delay?: number }) {
  const reduce = useReducedMotion();
  useCue('pen', typed >= 0, delay + 0.4);
  return (
    <motion.div
      className="pointer-events-none absolute w-[46%] rounded-[26px] border-[5px] border-[#1E1410] p-4 font-sans shadow-[0_30px_60px_-24px_rgba(0,0,0,0.8)]"
      style={{ background: '#FFFDF7', ...style }} aria-hidden="true"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: reduce ? 0.2 : 0.7, delay: reduce ? 0 : delay, ease: out }}
    >
      <div className="mb-2 flex items-center gap-2 text-[20px] font-bold" style={{ color: P.crimson }}>
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: P.crimson }} />Why List
      </div>
      {rows.map((r, i) => (
        <div key={r} className="relative flex items-start gap-2 border-t py-2 text-[17px] font-semibold leading-snug" style={{ borderColor: P.sand, color: P.ink }}>
          <span className="mt-1 inline-block h-4 w-4 shrink-0 rounded-[5px] border-2" style={{ borderColor: crossed.includes(i) ? P.teal : P.inkSoft, background: crossed.includes(i) ? P.teal : 'transparent' }} />
          <motion.span
            initial={i === typed && !reduce ? { clipPath: 'inset(0 100% 0 0)' } : false}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: Math.max(0.8, r.length * 0.035), delay: delay + 0.6, ease: 'linear' }}
            style={{ textDecoration: crossed.includes(i) ? 'line-through' : undefined }}
          >
            {/* ﷺ is not in the sans font: draw it with the Arabic serif so it never shows as a box. */}
            {later[i] && <span className="me-1.5 inline-block rounded-full bg-[#F6D58E] px-1.5 align-middle text-[11px] font-bold text-[#8B4935]">{later[i]}</span>}
            {r.split('ﷺ').flatMap((part, j) => (j ? [<span key={j} lang="ar" className="mx-0.5 font-serif text-[1.5em] leading-none">ﷺ</span>, part] : [part]))}
          </motion.span>
        </div>
      ))}
    </motion.div>
  );
}

/** The backdrop of every code-drawn Teens panel: deep teal with a slowly turning khatam lattice, a soft top light, a
 *  vignette and drifting motes, so a diagram reads as a lit stage, not a flat box. Transform and opacity only. */
export function StageBg({ tone = 'teal' }: { tone?: 'teal' | 'night' | 'warm' }) {
  const reduce = useReducedMotion();
  const base = {
    teal: 'radial-gradient(120% 90% at 50% 0%, #11707F 0%, #0A4A55 45%, #05303A 100%)',
    night: 'radial-gradient(120% 90% at 50% 20%, #1A2D4D 0%, #0B1426 60%, #050913 100%)',
    warm: 'radial-gradient(120% 90% at 50% 0%, #8B4935 0%, #4A2418 55%, #2A130C 100%)',
  }[tone];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ background: base }}>
      <motion.svg className="absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-[0.10]" viewBox="0 0 200 200"
        animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}>
        <defs>
          <pattern id={`kh-${tone}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 2 L12.3 7.7 L18 10 L12.3 12.3 L10 18 L7.7 12.3 L2 10 L7.7 7.7 Z" fill="none" stroke="#F6D58E" strokeWidth="0.6" />
            <rect x="6.5" y="6.5" width="7" height="7" fill="none" stroke="#F6D58E" strokeWidth="0.4" transform="rotate(45 10 10)" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#kh-${tone})`} />
      </motion.svg>
      <motion.div className="absolute left-1/2 top-[-30%] h-[90%] w-[70%] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(246,213,142,0.28), transparent)' }}
        animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 100% at 50% 40%, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
      <Rise from={[{ x: 15, y: 95 }, { x: 50, y: 98 }, { x: 85, y: 95 }]} count={3} height={60} seed={77} />
    </div>
  );
}

export const Q1 = 'Am I Muslim only because my parents are?';
export const Q2 = 'If the Big Bang explains everything, who needs God?';
export const Q3 = 'Why one God? Why not a team?';

/** Cover: three doors breathe with their colours and gold dust rises from under them. */
export function DoorsBreathe(_: { v: Built }) {
  return (
    <>
      <Glow x={24} y={55} w={18} h={40} color="8,125,145" />
      <Glow x={50} y={55} w={18} h={40} color="197,31,36" />
      <Glow x={76} y={55} w={18} h={40} color="229,169,60" />
      <Rise from={[{ x: 22, y: 78 }, { x: 50, y: 78 }, { x: 77, y: 78 }]} count={5} height={22} seed={11} />
    </>
  );
}

/** p2 The canteen: Zayn starts typing, the dots blink, then vanish; again; then nothing is sent. */
export function TypingDots({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pop', v.lines >= 3);
  if (v.lines < 3) return null;
  return (
    <motion.div className="absolute left-[16%] top-[40%] flex gap-2 rounded-[22px] px-5 py-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.7)]" style={{ background: '#FFFDF7' }} aria-hidden="true"
      initial={{ opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 1, 0, 0, 1, 1, 0] }}
      transition={reduce ? { duration: 0.3 } : { duration: 5, times: [0, 0.08, 0.35, 0.42, 0.55, 0.62, 0.9, 1], repeat: Infinity, repeatDelay: 1 }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="block h-4 w-4 rounded-full" style={{ background: P.inkSoft }}
          animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </motion.div>
  );
}

/** p3 The bus: the Why List opens and its first question writes itself. */
export function WhyListOpens({ v }: { v: Built }) {
  if (v.lines < 2) return null;
  return <WhyList rows={v.lines >= 3 ? [Q1] : []} typed={v.lines >= 3 ? 0 : -1} style={{ left: '16%', top: '58%' }} />;
}

/** p4 Madinah at dawn: the sun's rays turn slowly and dust motes rise in the light. */
export function DawnRays(_: { v: Built }) {
  return (
    <>
      <SunRays x={88} y={33} size={70} />
      <Rise from={[{ x: 40, y: 80 }, { x: 62, y: 84 }]} count={6} height={26} seed={5} />
    </>
  );
}

/** p5 The wow: sand blows across the desert, but a calm space stays clear around the stranger, and none of it lands on him. */
export function SandPassesBy({ v }: { v: Built }) {
  useCue('sand', 1, 0.3);
  const hole = 'radial-gradient(ellipse 13% 22% at 50% 64%, transparent 55%, #000 100%)';
  return (
    <>
      <div className="absolute inset-0" style={{ maskImage: hole, WebkitMaskImage: hole }}>
        <Sandstorm count={46} seed={9} strength={1.3} />
      </div>
      <Glow x={50} y={64} w={16} h={34} />
      {v.lines >= 1 && <Tag style={{ left: '50%', top: '30%' }} color={P.teal} delay={0.6}>Not a grain on him</Tag>}
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '90%' }} delay={0.4}>Nobody knew him</Tag>}
    </>
  );
}

/** p6 Knee to knee: two cushions set close; the pen joins them and names the posture. */
export function CushionsStudy({ v, label }: { v: Built; label: string }) {
  useCue('pen', v.lines);
  return (
    <Print name={T('cushions')} label={label}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
        {v.lines >= 1 && <Pen d="M250 400 C320 330 440 330 510 400" color={P.crimson} width={8} dash="4 18" duration={0.8} />}
        {v.lines >= 2 && <Pen d="M380 470 L380 520" color={P.gold} width={8} glow />}
      </svg>
      {v.lines >= 1 && <Tag style={{ left: '50%', top: '42%' }} ar={v.evidence ? 'رُكبَتَيه إلى رُكبَتَيه' : undefined} delay={0.7}>Knee to knee</Tag>}
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '94%' }} color={P.teal} delay={0.5}>Full attention</Tag>}
    </Print>
  );
}

const PILLARS = [
  { en: 'Shahadah', ar: 'الشهادة', a: '#16A0B5', b: '#086A7A' },
  { en: 'Salah', ar: 'الصلاة', a: '#E2474B', b: '#9E1A1E' },
  { en: 'Zakah', ar: 'الزكاة', a: '#F0BD5A', b: '#B97F18' },
  { en: 'Fasting', ar: 'الصوم', a: '#C77B5B', b: '#7A3B26' },
  { en: 'Hajj', ar: 'الحج', a: '#5BB59A', b: '#22705A' },
];

/** p7 Islam: five pillars, the building of the deen. Dashed sockets wait on a marble floor under a roof that only floats.
 *  Each answer raises one pillar out of the floor in its own colour, with its name in Arabic and English and a puff of
 *  dust where it lands. When the fifth stands, the roof drops onto them with a thud, its khatam lights and rays open. */
export function PillarsRise({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const up = Math.min(v.items, PILLARS.length);
  const done = up === PILLARS.length;
  useCue('thud', up, 0.45);
  useCue('reveal', done, 0.9);
  const colLeft = (i: number) => 13 + i * 15.6;
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(5,54,63,0.8)]" role="img" aria-label={`${label}: ${up} of 5 pillars`}>
      <StageBg tone="teal" />
      {done && !reduce && (
        <motion.div className="absolute left-1/2 top-[18%] h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'repeating-conic-gradient(from 0deg, rgba(246,213,142,0.22) 0deg 5deg, transparent 5deg 20deg)', maskImage: 'radial-gradient(circle, #000 5%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle, #000 5%, transparent 55%)' }}
          initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 30 }} transition={{ opacity: { duration: 1, delay: 0.9 }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }} />
      )}
      {/* The roof: a ghost that hovers until all five stand, then drops and lights. */}
      <motion.div className="absolute left-[7%] right-[7%] top-[8%] h-[22%]" initial={false}
        animate={{ transform: done ? 'translateY(14px)' : reduce ? 'translateY(0px)' : ['translateY(0px)', 'translateY(-8px)', 'translateY(0px)'], opacity: done ? 1 : 0.55 }}
        transition={done ? { type: 'spring', stiffness: 420, damping: 18, delay: 0.5 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        <svg viewBox="0 0 660 125" className="h-full w-full overflow-visible" aria-hidden="true">
          <defs><linearGradient id="roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FCE3A8" /><stop offset="1" stopColor="#C98A2E" /></linearGradient></defs>
          <path d="M20 112 L330 12 L640 112 Z" fill={done ? 'url(#roof)' : 'rgba(246,213,142,0.12)'} stroke="#F6D58E" strokeWidth="4" strokeDasharray={done ? undefined : '10 10'} strokeLinejoin="round" />
          <rect x="10" y="108" width="640" height="16" rx="5" fill={done ? '#E5A93C' : 'rgba(246,213,142,0.15)'} stroke="#F6D58E" strokeWidth="3" strokeDasharray={done ? undefined : '10 10'} />
          <g transform="translate(330 72)">
            <path d="M0 -26 L7.4 -17.8 L18.4 -18.4 L17.8 -7.4 L26 0 L17.8 7.4 L18.4 18.4 L7.4 17.8 L0 26 L-7.4 17.8 L-18.4 18.4 L-17.8 7.4 L-26 0 L-17.8 -7.4 L-18.4 -18.4 L-7.4 -17.8 Z"
              fill={done ? '#FFF6D8' : 'none'} stroke={done ? '#8B4935' : '#F6D58E'} strokeWidth="3" style={{ filter: done ? 'drop-shadow(0 0 12px rgba(255,236,170,0.95))' : undefined }} />
          </g>
        </svg>
      </motion.div>
      {/* Sockets and pillars. */}
      {PILLARS.map((p, i) => (
        <div key={p.en} className="absolute bottom-[16%] top-[33%]" style={{ left: `${colLeft(i)}%`, width: '11.5%' }}>
          {i >= up && <div className="absolute inset-0 rounded-t-[10px] border-2 border-dashed border-[#F6D58E]/40 bg-white/[0.03]" />}
          <motion.div className="absolute inset-0 overflow-hidden rounded-t-[10px]" initial={false}
            style={{ background: `linear-gradient(90deg, ${p.b} 0%, ${p.a} 38%, ${p.a} 55%, ${p.b} 100%)`, boxShadow: i < up ? '0 0 30px -6px rgba(0,0,0,0.6)' : undefined }}
            animate={{ clipPath: i < up ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }} transition={{ duration: reduce ? 0.2 : 0.75, ease: out }}>
            <span className="absolute inset-x-0 top-0 h-[7%] bg-white/25" />
            <span className="absolute inset-y-0 left-[22%] w-[6%] bg-white/15" />
            <span className="absolute inset-y-0 left-[62%] w-[6%] bg-black/10" />
            <span lang="ar" dir="rtl" className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-[26px] font-bold text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.45)]">{p.ar}</span>
          </motion.div>
          {i < up && !reduce && <Burst x={50} y={100} kind="dust" count={10} seed={i + 3} spread={60} delay={0.55} />}
        </div>
      ))}
      {/* The marble floor, with each pillar's English name under it. */}
      <div className="absolute inset-x-0 bottom-0 h-[16%] border-t-4 border-[#F6D58E]/70" style={{ background: 'linear-gradient(180deg, #F3E6CC, #D9C29B)' }}>
        {PILLARS.map((p, i) => (
          <motion.span key={p.en} className="absolute top-[22%] -translate-x-1/2 whitespace-nowrap font-sans text-[18px] font-bold" style={{ left: `${colLeft(i) + 5.75}%`, color: i < up ? P.ink : 'rgba(30,20,16,0.25)' }}
            initial={false} animate={{ opacity: i < up ? 1 : 0.4 }}>{i < up ? p.en : '?'}</motion.span>
        ))}
      </div>
      {done && <Tag style={{ left: '50%', top: '4%' }} color="#9A6A12" delay={1.4}>Islam stands on five</Tag>}
      {done && <Burst x={50} y={22} kind="sparks" count={18} seed={4} spread={34} delay={0.9} />}
    </div>
  );
}

/** p8 "You're right": he asks, then confirms; the answer to the riddle is written over the calm courtyard. */
export function AsksAndConfirms({ v }: { v: Built }) {
  useCue('reveal', v.interaction, 0.3);
  return (
    <>
      {v.lines >= 1 && <Tag style={{ left: '38%', top: '30%' }} color={P.teal} delay={0.3}>He asks…</Tag>}
      {v.lines >= 1 && <Tag style={{ left: '62%', top: '46%' }} delay={1}>…then says: you're right</Tag>}
      {v.interaction && <Tag style={{ left: '50%', top: '72%' }} color="#9A6A12" size={28} delay={1.2}>He already knew</Tag>}
      {v.interaction && <Burst x={50} y={72} kind="sparks" count={10} seed={8} spread={20} delay={1.2} />}
    </>
  );
}

const IMAN = ['Allah', 'Angels', 'Books', 'Messengers', 'Last Day', 'Qadar'];

/** p9 Iman: a heart at the centre; each article lights a point on a ring around it and joins it to the heart. */
export function SixAroundHeart({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const lit = Math.min(v.items, IMAN.length);
  useCue('chime', lit, 0.2);
  const pt = (i: number) => { const a = (Math.PI * 2 * i) / IMAN.length - Math.PI / 2; return { x: 380 + 210 * Math.cos(a), y: 285 + 195 * Math.sin(a) }; };
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${lit} of 6`}>
      <StageBg tone="teal" />
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
        <circle cx="380" cy="285" r="205" fill="none" stroke="rgba(246,213,142,0.25)" strokeWidth="3" strokeDasharray="6 12" />
        {IMAN.slice(0, lit).map((_, i) => <Pen key={i} d={`M380 285 L${pt(i).x} ${pt(i).y}`} color={P.goldSoft} width={4} duration={0.5} />)}
        <motion.path d="M380 330 C330 290 300 260 320 230 C340 200 370 210 380 235 C390 210 420 200 440 230 C460 260 430 290 380 330 Z"
          fill={P.crimson} initial={false} animate={{ scale: reduce ? 1 : [1, 1.06, 1], filter: lit === IMAN.length ? 'drop-shadow(0 0 20px rgba(229,169,60,0.9))' : 'none' }}
          style={{ transformOrigin: '380px 270px' }} transition={{ duration: 1.6, repeat: reduce ? 0 : Infinity }} />
      </svg>
      {IMAN.slice(0, lit).map((w, i) => (
        <Tag key={w} style={{ left: `${(pt(i).x / 760) * 100}%`, top: `${(pt(i).y / 570) * 100}%` }} size={20} color={P.teal} delay={0.3}>{w}</Tag>
      ))}
      <Sprite name={C('noor-think')} enter="up" className="h-[44%]" style={{ left: '1%', bottom: '0%' }} delay={0.3} />
    </div>
  );
}

/** p10 Ihsan: Noor's room at night; the lamp breathes, and "He sees you" is written over the quiet when she is asked. */
export function NoOneWatching({ v, label }: { v: Built; label: string }) {
  useCue('reveal', v.lines >= 3, 0.2);
  return (
    <Print name={T('noor-room')} label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px]"><Glow x={92} y={30} w={18} h={26} /></div>
      {v.lines >= 2 && <Tag style={{ left: '78%', top: '60%' }} color={P.teal} delay={0.4}>Phone face down. Nobody here.</Tag>}
      {v.lines >= 3 && <Tag style={{ left: '50%', top: '86%' }} ar={v.evidence ? 'فإنَّه يَراك' : undefined} color="#9A6A12" delay={0.6}>He sees you</Tag>}
    </Print>
  );
}

/** p11 Who was he: the figure far away at the end of the path, a light breathing round him. */
export function FarLight(_: { v: Built }) {
  return (
    <>
      <Glow x={50} y={72} w={12} h={24} />
      <Rise from={[{ x: 50, y: 80 }]} count={7} height={30} seed={3} />
    </>
  );
}

/** p12 It was Jibril: the light at the end of the path opens wide as the answer is given. */
export function LightOpens({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('reveal', v.lines >= 1, 0.2);
  return (
    <Print name={T('walk-away')} label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px]">
        <motion.div className="absolute left-1/2 top-[72%] h-[40%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
          style={{ background: 'radial-gradient(circle, rgba(255,246,216,0.95), rgba(255,236,180,0) 70%)', mixBlendMode: 'screen' }}
          initial={false} animate={{ scale: v.lines >= 1 ? (reduce ? 2.4 : [1, 2.6]) : 1, opacity: v.lines >= 1 ? 1 : 0.6 }} transition={{ duration: 1.6, ease: out }} />
      </div>
      {v.lines >= 1 && <Tag style={{ left: '50%', top: '18%' }} ar="جِبريل" color="#9A6A12" delay={1}>Jibril</Tag>}
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '88%' }} ar={v.evidence ? 'يُعَلِّمُكُم دينَكُم' : undefined} color={P.teal} delay={0.5}>to teach you your deen</Tag>}
    </Print>
  );
}

const DOORS = [{ x: 22, color: P.teal }, { x: 50, color: P.crimson }, { x: 78, color: P.gold }];
const arch = (cx: number) => { const x = (cx / 100) * 840; return `M${x - 95} 520 L${x - 95} 260 Q${x - 95} 130 ${x} 110 Q${x + 95} 130 ${x + 95} 260 L${x + 95} 520`; };

/** p13 Three doors, drawn in code: each item lights its doorway and hangs its name under it. */
export function ThreeDoorsBuild({ labels, label }: { labels: (string | null)[]; label: string }) {
  const lit = labels.filter(Boolean).length;
  useCue('chime', lit, 0.2);
  return (
    <div className="absolute left-[680px] top-[172px] h-[630px] w-[840px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${lit} of 3 doors open`}
>
      <StageBg tone="teal" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 840 630" aria-hidden="true">
        {DOORS.map((d, i) => (
          <motion.path key={i} d={`${arch(d.x)} Z`} fill={d.color} initial={false} animate={{ opacity: i < lit ? 0.9 : 0.12 }} transition={{ duration: 0.9, ease: out }} />
        ))}
        {DOORS.map((d, i) => <Pen key={`o${i}`} d={arch(d.x)} color={P.goldSoft} width={6} delay={i * 0.3} duration={1.1} glow={i < lit} />)}
      </svg>
      {DOORS.map((d, i) => (i < lit ? <Rise key={i} from={[{ x: d.x, y: 80 }]} count={4} height={30} seed={i + 2} /> : null))}
      {labels.map((l, i) => {
        if (!l) return null;
        const [word, hint] = l.split(':').map((s) => s.trim());
        return (
          <Tag key={l} style={{ left: `${DOORS[i].x}%`, top: '90%' }} color={P.ink} delay={0.5}>
            <span className="text-[24px]">{word}</span>
            {hint && <span className="text-[17px] font-semibold" style={{ color: P.inkSoft }}>{hint}</span>}
          </Tag>
        );
      })}
    </div>
  );
}

/** p14 Al-Baqarah 2:170: the footprints go round in a closed circle; the question draws one path stepping out of it. */
export function FootprintsCircle({ v, label }: { v: Built; label: string }) {
  useCue('pen', v.lines);
  useCue('whoosh', v.interaction, 0.6);
  return (
    <Print name={T('footprints')} label={label}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
        {v.lines >= 2 && <Pen d="M380 26 A305 245 0 1 1 379 26" color={P.crimson} width={6} dash="8 14" duration={1.8} />}
        {v.interaction && <Pen d="M686 300 C715 280 735 250 752 215" color={P.teal} width={9} glow delay={0.6} duration={1} />}
      </svg>
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '50%' }} delay={1.2}>Round and round, eyes down</Tag>}
      {v.evidence && <Tag style={{ left: '30%', top: '12%' }} ar="يَعْقِلُونَ" color="#9A6A12" delay={0.4}>use the mind</Tag>}
      {v.interaction && <Tag style={{ left: '86%', top: '22%' }} color={P.teal} delay={1.5}>Look, then walk</Tag>}
    </Print>
  );
}

/** p15 Two friends, one test: when the learner answers, roots grow under the one who knows why. */
export function RootsUnder({ v }: { v: Built }) {
  useCue('pen', v.interaction, 0.3);
  if (!v.interaction) return null;
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <Pen d="M14 93 C12 96 8 98 4 100 M14 93 C15 97 16 99 15 101 M14 93 C17 96 21 98 24 100" color={P.gold} width={5} glow duration={1.2} />
      </svg>
      <Tag style={{ left: '22%', top: '84%' }} color="#9A6A12" delay={1}>She knows why</Tag>
    </>
  );
}

/** p17 My Ahd: the Why List on Zayn's desk, with an empty row waiting for the learner's own question. */
export function ListOnDesk({ v }: { v: Built }) {
  if (v.lines < 3) return null;
  return <WhyList later={{ 0: 'Lesson 11' }} rows={[Q1, 'Your question: …']} typed={1} style={{ right: '3%', top: '50%', width: '50%' }} />;
}

/** p18 Cliffhanger: the Big Bang bursts on the classroom screen, and a new question lands on the Why List. */
export function BigBang({ v }: { v: Built }) {
  useCue('sparkle', v.lines >= 1, 0.3);
  return (
    <>
      {v.lines >= 1 && <Burst x={64} y={23} kind="sparks" count={22} seed={13} spread={30} delay={0.3} />}
      {v.lines >= 1 && <Glow x={64} y={23} w={24} h={28} />}
      {v.lines >= 3 && <WhyList later={{ 0: 'Lesson 11' }} rows={[Q1, Q2]} typed={1} style={{ left: '30%', top: '56%', width: '42%' }} delay={0.2} />}
    </>
  );
}
