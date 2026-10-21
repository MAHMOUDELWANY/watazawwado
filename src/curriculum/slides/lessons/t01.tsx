import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, Print, out, type Built } from '../Scenes';
import { Burst, Rise, SunRays, Glow, Sandstorm } from '../Motion';
import { useCue } from '../sfx';

/* ---------- Teens Lesson 1: The Stranger with No Dust (brief: docs/curriculum/zad-essentials-teens/L01-the-stranger-with-no-dust.md)
   Paintings in public/curriculum/zad-teens/l01 (prompts: docs/curriculum/zad-essentials-teens/chatgpt-prompts.md). Until a
   painting arrives its page shows a warm wash with the code-drawn motion on top. The Why List phone, the five pillars, the
   six articles of Iman and the three doors are drawn here in code. Positions over paintings are % of the painting's box,
   first guesses from the prompts: check them when the paintings arrive. */

const T = (name: string) => `zad-teens/l01/${name}`;

/** The series device: Zayn's "Why List" note on a phone. `typed` is the row being written now (typewriter); rows before
 *  it are already there, `done` rows are crossed off. */
function WhyList({ rows, typed = -1, done = 0, style, delay = 0 }: { rows: string[]; typed?: number; done?: number; style: React.CSSProperties; delay?: number }) {
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
          <span className="mt-1 inline-block h-4 w-4 shrink-0 rounded-[5px] border-2" style={{ borderColor: i < done ? P.teal : P.inkSoft, background: i < done ? P.teal : 'transparent' }} />
          <motion.span
            initial={i === typed && !reduce ? { clipPath: 'inset(0 100% 0 0)' } : false}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: Math.max(0.8, r.length * 0.035), delay: delay + 0.6, ease: 'linear' }}
            style={{ textDecoration: i < done ? 'line-through' : undefined }}
          >
            {r}
          </motion.span>
        </div>
      ))}
    </motion.div>
  );
}

const Q1 = 'Am I Muslim only because my parents are?';
const Q2 = 'If the Big Bang explains everything, who needs God?';

/** Cover: three doors breathe with their colours and gold dust rises from under them. */
export function DoorsBreathe(_: { v: Built }) {
  return (
    <>
      <Glow x={24} y={55} w={18} h={40} color="8,125,145" />
      <Glow x={50} y={55} w={18} h={40} color="197,31,36" />
      <Glow x={76} y={55} w={18} h={40} color="229,169,60" />
      <Rise from={[{ x: 24, y: 86 }, { x: 50, y: 86 }, { x: 76, y: 86 }]} count={5} height={22} seed={11} />
    </>
  );
}

/** p2 The canteen: Zayn starts typing, the dots blink, then vanish; again; then nothing is sent. */
export function TypingDots({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pop', v.lines >= 3);
  if (v.lines < 3) return null;
  return (
    <motion.div className="absolute left-[34%] top-[36%] flex gap-2 rounded-[22px] px-5 py-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.7)]" style={{ background: '#FFFDF7' }} aria-hidden="true"
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
  return <WhyList rows={v.lines >= 3 ? [Q1] : []} typed={v.lines >= 3 ? 0 : -1} style={{ left: '30%', top: '30%' }} />;
}

/** p4 Madinah at dawn: the sun's rays turn slowly and dust motes rise in the light. */
export function DawnRays(_: { v: Built }) {
  return (
    <>
      <SunRays x={72} y={26} size={70} />
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

const PILLARS = ['Shahadah', 'Salah', 'Zakah', 'Fasting', 'Hajj'];

/** p7 Islam: a roof waits in the air; each answer raises one pillar under it; with all five the building stands and lights up. */
export function PillarsRise({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const up = Math.min(v.items, PILLARS.length);
  const done = up === PILLARS.length;
  useCue('thud', up, 0.25);
  useCue('chime', done, 0.9);
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${up} of 5 pillars`}
      style={{ background: 'linear-gradient(180deg, #05363F 0%, #0B4C57 70%, #2B5F63 100%)' }}>
      <motion.div className="absolute left-[8%] right-[8%] top-[14%] h-[13%]" style={{ background: P.goldSoft, clipPath: 'polygon(6% 100%, 50% 0, 94% 100%)' }}
        initial={false} animate={{ y: done ? 0 : reduce ? 0 : [0, -6, 0], filter: done ? 'brightness(1.15) drop-shadow(0 0 24px rgba(246,213,142,0.9))' : 'brightness(0.8)' }}
        transition={done ? { duration: 0.6 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute left-[10%] right-[10%] top-[27%] h-[3%] rounded" style={{ background: P.gold, opacity: done ? 1 : 0.5 }} />
      {PILLARS.map((p, i) => (
        <div key={p} className="absolute bottom-[14%] top-[30%]" style={{ left: `${14 + i * 15.5}%`, width: '9%' }}>
          <motion.div className="absolute inset-x-0 bottom-0 origin-bottom rounded-t-[6px]"
            style={{ height: '100%', background: `linear-gradient(90deg, #E9DCC2, #FFFDF7 45%, #D8C7A6)` }}
            initial={false} animate={{ scaleY: i < up ? 1 : 0.04, opacity: i < up ? 1 : 0.35 }}
            transition={{ duration: reduce ? 0.2 : 0.7, ease: out }} />
          {i < up && <Tag style={{ left: '50%', top: '112%' }} size={18} color={P.ink} delay={0.4}>{p}</Tag>}
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 h-[8%]" style={{ background: P.sandDeep }} />
      {done && <Burst x={50} y={22} kind="sparks" count={14} seed={4} spread={30} delay={0.3} />}
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
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${lit} of 6`}
      style={{ background: 'radial-gradient(circle at 50% 50%, #0B4C57 0%, #05363F 75%)' }}>
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
    </div>
  );
}

/** p10 Ihsan: Noor's room at night; the lamp breathes, and "He sees you" is written over the quiet when she is asked. */
export function NoOneWatching({ v, label }: { v: Built; label: string }) {
  useCue('reveal', v.lines >= 3, 0.2);
  return (
    <Print name={T('noor-room')} label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px]"><Glow x={72} y={40} w={22} h={28} /></div>
      {v.lines >= 2 && <Tag style={{ left: '28%', top: '20%' }} color={P.teal} delay={0.4}>Phone face down. Nobody here.</Tag>}
      {v.lines >= 3 && <Tag style={{ left: '50%', top: '86%' }} ar={v.evidence ? 'فإنَّه يَراك' : undefined} color="#9A6A12" delay={0.6}>He sees you</Tag>}
    </Print>
  );
}

/** p11 Who was he: the figure far away at the end of the path, a light breathing round him. */
export function FarLight(_: { v: Built }) {
  return (
    <>
      <Glow x={52} y={58} w={14} h={30} />
      <Rise from={[{ x: 52, y: 70 }]} count={7} height={30} seed={3} />
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
        <motion.div className="absolute left-1/2 top-[56%] h-[40%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
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
    <div className="absolute left-[680px] top-[132px] h-[630px] w-[840px] overflow-hidden rounded-[28px]" role="img" aria-label={`${label}: ${lit} of 3 doors open`}
      style={{ background: 'linear-gradient(180deg, #05363F, #0B2F36)' }}>
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
        {v.lines >= 2 && <Pen d="M380 110 A200 170 0 1 1 379 110" color={P.crimson} width={6} dash="8 14" duration={1.6} />}
        {v.interaction && <Pen d="M560 330 C620 340 680 300 730 240" color={P.teal} width={9} glow delay={0.6} duration={1} />}
      </svg>
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '50%' }} delay={1.2}>Round and round, eyes down</Tag>}
      {v.evidence && <Tag style={{ left: '30%', top: '12%' }} ar="يَعْقِلُونَ" color="#9A6A12" delay={0.4}>use the mind</Tag>}
      {v.interaction && <Tag style={{ left: '84%', top: '30%' }} color={P.teal} delay={1.5}>Look, then walk</Tag>}
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
        <Pen d="M36 90 C34 94 30 96 26 99 M36 90 C37 95 38 97 37 100 M36 90 C39 94 43 96 46 99" color={P.gold} width={5} glow duration={1.2} />
      </svg>
      <Tag style={{ left: '36%', top: '80%' }} color="#9A6A12" delay={1}>She knows why</Tag>
    </>
  );
}

/** p17 My Ahd: the Why List on Zayn's desk, with an empty row waiting for the learner's own question. */
export function ListOnDesk({ v }: { v: Built }) {
  if (v.lines < 3) return null;
  return <WhyList rows={[Q1, 'Your question: …']} typed={1} style={{ right: '6%', top: '10%', width: '60%' }} />;
}

/** p18 Cliffhanger: the Big Bang bursts on the classroom screen, and a new question lands on the Why List. */
export function BigBang({ v }: { v: Built }) {
  useCue('sparkle', v.lines >= 1, 0.3);
  return (
    <>
      {v.lines >= 1 && <Burst x={50} y={28} kind="sparks" count={22} seed={13} spread={34} delay={0.3} />}
      {v.lines >= 1 && <Glow x={50} y={28} w={26} h={30} />}
      {v.lines >= 3 && <WhyList rows={[Q1, Q2]} typed={1} style={{ left: '8%', top: '46%' }} delay={0.2} />}
    </>
  );
}
