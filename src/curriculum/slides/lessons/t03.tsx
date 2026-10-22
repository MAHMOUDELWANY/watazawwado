import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, out, type Built } from '../Scenes';
import { Burst, Rise, SunRays, Glow } from '../Motion';
import { useCue } from '../sfx';
import { StageBg, WhyList, Q1, Q2, Q3 } from './t01';

/* ---------- Teens Lesson 3: One, Not Many (brief: docs/curriculum/zad-essentials-teens/L03-one-not-many.md)
   Paintings in public/curriculum/zad-teens/l03 (prompts: docs/curriculum/style/teens.md, Step 5); `gaming` is reused from
   l02. The solar system (21:22) and the shahada (47:19) reuse the Kids Lesson 3 scenes; the recall, the two bosses, the
   team, the pulled compass, the star of al-Ikhlas, the loved heart and the centre of your life are drawn here. Positions
   over paintings not delivered yet are first guesses from the prompts. */

const Q4 = 'How do I know Muhammad ﷺ really spoke for God?';
const PANEL = 'absolute left-[680px] top-[172px] h-[630px] w-[840px] overflow-hidden rounded-[28px]';
const STUDY = 'absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]';
const DEEP = 'radial-gradient(circle at 50% 45%, #0B4C57 0%, #05363F 70%, #031F25 100%)';

/** Cover: one sun rising over the skyline, its rays turning slowly. */
export function OneSunRises(_: { v: Built }) {
  return (
    <>
      <SunRays x={50} y={22} size={80} />
      <Rise from={[{ x: 40, y: 70 }, { x: 60, y: 72 }]} count={4} height={18} seed={31} />
    </>
  );
}

/** p2 Recall: last lesson's three steps tick in, one by one. */
export function RecallTicks({ labels, label }: { labels: (string | null)[]; label: string }) {
  const n = labels.filter(Boolean).length;
  useCue('pop', n, 0.2);
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of 3`}>
      <StageBg tone="teal" />
      {labels.map((l, i) => (l ? (
        <motion.div key={l} className="absolute left-[8%] right-[8%] flex items-center gap-5 rounded-[20px] px-6 py-5" style={{ top: `${12 + i * 27}%`, background: '#FFFDF7' }}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: out }}>
          <motion.span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[26px] font-bold text-white" style={{ background: P.teal }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}>✓</motion.span>
          <span className="font-sans text-[28px] font-bold" style={{ color: P.ink }}>{l}</span>
        </motion.div>
      ) : null))}
    </div>
  );
}

/** p3 Ethan's game: three coloured "gods" pulse on the screen, one for the sea, one for the sky, one for the sun. */
export function TeamOnScreen({ v }: { v: Built }) {
  useCue('sparkle', v.lines >= 1, 0.2);
  return (
    <>
      <Glow x={36} y={24} w={16} h={22} color="62,155,200" />
      <Glow x={52} y={20} w={16} h={22} color="230,240,255" />
      <Glow x={68} y={24} w={16} h={22} color="229,169,60" />
      {v.lines >= 2 && <Tag style={{ left: '52%', top: '48%' }} color={P.crimson} delay={0.4}>Why not a team?</Tag>}
    </>
  );
}

/** p4 Two bosses: a shop door; A's arrow pulls it open, B's pushes it shut; on "Who wins?" the door shakes, stuck. */
export function TwoBosses({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  useCue('whoosh', n >= 1 && n < 3, 0.1);
  useCue('thud', n >= 3, 0.2);
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of 3`}>
      <StageBg tone="teal" />
      <motion.div className="absolute left-1/2 top-[18%] h-[56%] w-[24%] -translate-x-1/2 rounded-t-[60px] border-[6px]"
        style={{ borderColor: P.goldSoft, background: 'linear-gradient(180deg, #8B4935, #5E2F22)' }}
        animate={n >= 3 && !reduce ? { rotate: [0, -3, 3, -3, 3, 0] } : { rotate: 0 }} transition={{ duration: 0.6, repeat: n >= 3 && !reduce ? Infinity : 0, repeatDelay: 0.6 }} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 840 630" aria-hidden="true">
        {n >= 1 && <Pen d="M110 300 L300 300 M270 280 L300 300 L270 320" color={P.teal} width={10} glow duration={0.5} />}
        {n >= 2 && <Pen d="M730 300 L540 300 M570 280 L540 300 L570 320" color={P.crimson} width={10} glow duration={0.5} />}
      </svg>
      {n >= 1 && <Tag style={{ left: '15%', top: '38%' }} color={P.teal} delay={0.3}>A: open!</Tag>}
      {n >= 2 && <Tag style={{ left: '85%', top: '38%' }} color={P.crimson} delay={0.3}>B: shut!</Tag>}
      {n >= 3 && <Tag style={{ left: '50%', top: '86%' }} color="#9A6A12" size={26} delay={0.5}>Stuck. Neither is all-powerful.</Tag>}
    </div>
  );
}

/** p5 A team that always agrees: three equal circles; "who decides?" floats over them; then one turns gold and the others
 *  fade to grey followers. */
export function TeamOfThree({ labels, label }: { labels: (string | null)[]; label: string }) {
  const n = labels.filter(Boolean).length;
  useCue('pop', n, 0.2);
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of 3`}>
      <StageBg tone="teal" />
      {[0, 1, 2].map((i) => {
        const leader = i === 1 && n >= 2;
        const faded = i !== 1 && n >= 3;
        return (
          <motion.span key={i} className="absolute top-[38%] flex h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-sans text-[22px] font-bold"
            style={{ left: `${25 + i * 25}%` }} initial={false}
            animate={{ background: leader ? P.gold : faded ? '#3B4A4E' : P.tealSoft, scale: leader ? 1.15 : faded ? 0.85 : 1, color: P.ink, boxShadow: leader ? '0 0 50px rgba(229,169,60,0.8)' : '0 0 0 rgba(0,0,0,0)' }}
            transition={{ duration: 0.6, ease: out }}>
            {leader ? 'decides' : faded ? 'follows' : ''}
          </motion.span>
        );
      })}
      {labels.map((l, i) => (l ? <Tag key={l} style={{ left: '50%', top: `${68 + i * 9}%` }} color={[P.teal, '#9A6A12', P.crimson][i]} delay={0.4}>{l}</Tag> : null))}
    </div>
  );
}

/** p8 Modern gods: hearts and notifications rise from Noor's phone. */
export function LikesRise({ v }: { v: Built }) {
  useCue('pop', v.lines, 0.2);
  return (
    <>
      <Rise from={[{ x: 76, y: 24 }]} count={7} kind="heart" height={22} seed={12} />
      {v.lines >= 2 && <Tag style={{ left: '38%', top: '22%' }} color={P.crimson} delay={0.4}>obeyed like a god?</Tag>}
    </>
  );
}

/** p9 Desire as a god: a compass whose needle points to "Allah"; four pulls tug it around, and with the ayah it is yanked
 *  to "my desire". */
export function PulledCompass({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const pulled = v.evidence;
  useCue('whoosh', v.lines >= 1, 0.2);
  useCue('thud', pulled, 0.4);
  const pulls = [{ t: 'likes', x: 14, y: 22 }, { t: 'money', x: 86, y: 22 }, { t: 'fitting in', x: 14, y: 80 }, { t: 'my desire', x: 86, y: 80 }];
  return (
    <div className={STUDY} role="img" aria-label={label}>
      <StageBg tone="teal" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px]" style={{ borderColor: P.goldSoft, background: 'rgba(255,253,247,0.06)' }}>
        <span className="absolute left-1/2 top-2 -translate-x-1/2 font-sans text-[20px] font-bold" style={{ color: P.goldSoft }}>Allah</span>
        <motion.span className="absolute left-1/2 top-1/2 block h-[130px] w-[10px] -translate-x-1/2 origin-bottom rounded-full"
          style={{ marginTop: -130, background: `linear-gradient(180deg, ${P.crimson}, ${P.gold})` }}
          initial={false}
          animate={{ rotate: pulled ? 135 : v.lines >= 1 && !reduce ? [0, -50, 40, -30, 60, 0] : 0 }}
          transition={pulled ? { type: 'spring', stiffness: 260, damping: 14 } : { duration: 3, repeat: v.lines >= 1 && !reduce ? Infinity : 0, ease: 'easeInOut' }} />
        <span className="absolute left-1/2 top-1/2 block h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: P.goldSoft }} />
      </div>
      {v.lines >= 1 && pulls.map((p, i) => (
        <Tag key={p.t} style={{ left: `${p.x}%`, top: `${p.y}%` }} color={pulled && i === 3 ? P.crimson : P.inkSoft} delay={0.2 + i * 0.15}>{p.t}</Tag>
      ))}
      {pulled && <Tag style={{ left: '50%', top: '92%' }} ar="هَوَىٰهُ" color={P.crimson} delay={0.7}>his desire, obeyed like a god</Tag>}
    </div>
  );
}

/** Points of an eight-pointed khatam star (two squares) around (cx, cy). */
function khatam(cx: number, cy: number, r: number) {
  const sq = (rot: number) => Array.from({ length: 4 }, (_, i) => { const a = rot + (Math.PI / 2) * i; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ');
  return [sq(-Math.PI / 4), sq(0)];
}

/** p10 Al-Ikhlas: the khatam star of tawhid turns slowly; with the surah its four sides name what Allah says of Himself. */
export function IkhlasStar({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('chime', v.evidence, 0.3);
  const [a, b] = khatam(380, 285, 150);
  const names = [
    { t: 'One: Ahad', x: 50, y: 10 }, { t: 'Everyone needs Him', x: 80, y: 50 },
    { t: 'No child, no parent', x: 50, y: 91 }, { t: 'None like Him', x: 18, y: 50 },
  ];
  return (
    <div className={STUDY} role="img" aria-label={label}>
      <StageBg tone="teal" />
      <motion.svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true"
        animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '50% 50%' }}>
        <polygon points={a} fill="none" stroke={P.goldSoft} strokeWidth="6" />
        <polygon points={b} fill={v.evidence ? 'rgba(229,169,60,0.25)' : 'none'} stroke={P.goldSoft} strokeWidth="6" />
      </motion.svg>
      <span lang="ar" dir="rtl" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[64px] font-bold" style={{ color: P.goldSoft }}>أَحَد</span>
      {v.evidence && names.map((n, i) => <Tag key={n.t} style={{ left: `${n.x}%`, top: `${n.y}%` }} color={[P.teal, P.crimson, P.copper, '#9A6A12'][i]} delay={0.4 + i * 0.4}>{n.t}</Tag>)}
    </div>
  );
}

/** p11 Loved: a heart lights up with the Prophet's ﷺ answer. */
export function LovedHeart({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('reveal', v.evidence, 0.3);
  return (
    <div className={STUDY} role="img" aria-label={label}>
      <StageBg tone="teal" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true">
        <motion.path d="M380 420 C250 330 200 250 250 190 C300 130 360 160 380 210 C400 160 460 130 510 190 C560 250 510 330 380 420 Z"
          fill={v.evidence ? P.crimson : 'rgba(197,31,36,0.25)'} stroke={P.goldSoft} strokeWidth="5"
          animate={{ scale: v.evidence && !reduce ? [1, 1.06, 1] : 1 }} transition={{ duration: 1.4, repeat: v.evidence && !reduce ? Infinity : 0 }} style={{ transformOrigin: '380px 290px' }} />
      </svg>
      {v.evidence && <Burst x={50} y={50} kind="sparks" count={14} seed={23} spread={26} delay={0.3} />}
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '12%' }} color={P.teal} delay={0.4}>"I love to recite it"</Tag>}
      {v.evidence && <Tag style={{ left: '50%', top: '88%' }} ar="أنَّ اللهَ يُحِبُّه" color="#9A6A12" delay={0.6}>Allah loves him</Tag>}
    </div>
  );
}

/** p12 Your centre: three things orbit a wobbling empty middle; with "Allah at the centre" a gold sun fills it and the
 *  orbits settle into calm circles. */
export function CentreOfLife({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  const centred = n >= 4;
  useCue('pop', Math.min(n, 3), 0.2);
  useCue('reveal', centred, 0.2);
  const rings = [120, 190, 260];
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of 4`}>
      <StageBg tone="teal" />
      {rings.slice(0, Math.min(n, 3)).map((r, i) => (
        <motion.div key={r} className="absolute left-1/2 top-1/2" style={{ width: r * 2, height: r * 2 * 0.72, marginLeft: -r, marginTop: -r * 0.72 }}
          animate={{ rotate: reduce ? 0 : 360, x: centred || reduce ? 0 : [0, 14, -10, 0] }}
          transition={{ rotate: { duration: 12 + i * 6, repeat: Infinity, ease: 'linear' }, x: { duration: 2.4, repeat: Infinity } }}>
          <span className="absolute inset-0 rounded-full border-2 border-dashed" style={{ borderColor: 'rgba(191,227,230,0.4)' }} />
          <span className="absolute left-1/2 top-0 block h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: [P.tealSoft, P.copperSoft, '#9FD6E0'][i] }} />
        </motion.div>
      ))}
      {centred && (
        <motion.span className="absolute left-1/2 top-1/2 flex h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ background: P.gold, boxShadow: '0 0 70px rgba(229,169,60,0.9)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.35 }}>
          <span lang="ar" dir="rtl" className="font-serif text-[40px] font-bold" style={{ color: P.ink }}>الله</span>
        </motion.span>
      )}
      {labels.slice(0, 3).map((l, i) => (l ? <Tag key={l} style={{ left: ['18%', '82%', '22%'][i], top: ['16%', '22%', '86%'][i] }} color={P.inkSoft} delay={0.3}>{l}</Tag> : null))}
      {centred && <Tag style={{ left: '78%', top: '86%' }} color="#9A6A12" delay={0.6}>Allah at the centre</Tag>}
    </div>
  );
}

/** p14 My Ahd: the Why List with Lesson 3's question crossed off. */
export function ThirdCrossed({ v }: { v: Built }) {
  useCue('strike', v.lines >= 1, 1);
  if (v.lines < 1) return null;
  return <WhyList later={{ 0: 'Lesson 11' }} rows={[Q1, Q2, Q3]} crossed={[1, 2]} style={{ right: '3%', top: '50%', width: '52%' }} />;
}

/** p15 Cliffhanger: a new line on the Why List, in the library. */
export function LibraryQuestion({ v }: { v: Built }) {
  if (v.lines < 3) return <Glow x={84} y={42} w={24} h={30} />;
  return <WhyList later={{ 0: 'Lesson 11' }} rows={[Q1, Q2, Q3, Q4]} crossed={[1, 2]} typed={3} style={{ left: '3%', top: '46%', width: '40%' }} delay={0.2} />;
}
