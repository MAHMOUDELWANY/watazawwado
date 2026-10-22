import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, Print, out, type Built } from '../Scenes';
import { Burst, Rise, Glow, ShootingStar } from '../Motion';
import { useCue } from '../sfx';
import { WhyList, Q1, Q2, Q3 } from './t01';

/* ---------- Teens Lesson 2: Did It All Just Happen? (brief: docs/curriculum/zad-essentials-teens/L02-did-it-all-just-happen.md)
   Paintings in public/curriculum/zad-teens/l02 (prompts: docs/curriculum/style/teens.md, Step 4); `science` is reused from
   l01. The cause chain, the expanding universe (the wow), the three options, the ayah's three slots, the certainty line and
   the "who made God?" chain are drawn here in code. Positions over paintings not delivered yet are first guesses from the
   prompts: check them when the paintings arrive. */

const T = (name: string) => `zad-teens/l02/${name}`;
const PANEL = 'absolute left-[680px] top-[132px] h-[630px] w-[840px] overflow-hidden rounded-[28px]';
const DEEP = 'radial-gradient(circle at 50% 45%, #0B4C57 0%, #05363F 70%, #031F25 100%)';

/** Cover: the night sky over the rooftop twinkles, and one shooting star crosses it. */
export function NightSky(_: { v: Built }) {
  return (
    <>
      <Rise from={[{ x: 30, y: 40 }, { x: 70, y: 30 }]} count={4} height={10} seed={21} />
      <ShootingStar x1={20} y1={10} x2={62} y2={28} delay={1.5} />
    </>
  );
}

/** p3 Science class again: the Big Bang flares on the screen; Zayn stays quiet while the class laughs. */
export function ScreenFlare({ v }: { v: Built }) {
  useCue('sparkle', v.lines >= 1, 0.3);
  return (
    <>
      {v.lines >= 1 && <Glow x={63} y={23} w={24} h={26} />}
      {v.lines >= 2 && <Burst x={63} y={23} kind="sparks" count={16} seed={5} spread={24} delay={0.2} />}
      {v.lines >= 3 && <Tag style={{ left: '20%', top: '46%' }} color={P.teal} delay={0.5}>Zayn doesn't laugh</Tag>}
    </>
  );
}

/** p4 What begins has a cause: each item draws a thing, an arrow back to what caused it; the universe's cause is a "?". */
export function CauseChain({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  useCue('pop', n, 0.15);
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of ${labels.length}`} style={{ background: DEEP }}>
      {labels.map((l, i) => {
        if (!l) return null;
        const [thing, cause] = l.split(':').map((x) => x.trim());
        const last = cause === '?';
        return (
          <motion.div key={l} className="absolute left-[6%] right-[6%] flex items-center gap-4 font-sans" style={{ top: `${8 + i * 22}%` }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: out }}>
            <span className="w-[38%] rounded-[16px] px-4 py-3 text-center text-[26px] font-bold" style={{ background: last ? P.goldSoft : '#FFFDF7', color: P.ink }}>{thing}</span>
            <svg width="110" height="30" viewBox="0 0 110 30" aria-hidden="true"><Pen d="M5 15 L95 15 M82 4 L98 15 L82 26" color={P.goldSoft} width={5} duration={0.4} /></svg>
            {last ? (
              <motion.span className="flex h-[72px] w-[72px] items-center justify-center rounded-full font-serif text-[52px] font-bold"
                style={{ background: P.gold, color: P.ink, boxShadow: '0 0 40px rgba(229,169,60,0.8)' }}
                animate={reduce ? undefined : { scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>?</motion.span>
            ) : (
              <span className="flex-1 rounded-[16px] border-2 px-4 py-3 text-[22px] font-semibold" style={{ borderColor: P.tealSoft, color: '#E8F4F5' }}>{cause}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/** Galaxy specks thrown out from the centre (angle in degrees, distance in % of the panel, size px). */
const SPECKS = Array.from({ length: 46 }, (_, i) => ({ a: (i * 137.5) % 360, d: 12 + ((i * 29) % 40), s: 3 + (i % 4) * 2 }));

/** p5 The wow: a single point of light ("It began") bursts outward into the expanding universe ("So it has a cause"),
 *  then a ring marks its edge and a "?" waits outside it: the cause is outside time, space and matter. */
export function UniverseBegins({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  useCue('chime', n >= 1, 0.1);
  useCue('whoosh', n >= 2, 0.1);
  useCue('reveal', n >= 3, 0.4);
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of 3`} style={{ background: 'radial-gradient(circle at 50% 50%, #12233A 0%, #070D18 75%)' }}>
      {n >= 1 && (
        <motion.span className="absolute left-1/2 top-1/2 block h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: '#FFF6D8', boxShadow: '0 0 40px 18px rgba(255,236,170,0.9)' }}
          initial={{ scale: 0 }} animate={{ scale: n >= 2 ? (reduce ? 1.5 : [1, 3, 1.4]) : [0, 1.3, 1] }} transition={{ duration: n >= 2 ? 1.2 : 0.8, ease: out }} />
      )}
      {n >= 2 && SPECKS.map((p, i) => {
        const x = 50 + p.d * Math.cos((p.a * Math.PI) / 180);
        const y = 50 + p.d * 0.75 * Math.sin((p.a * Math.PI) / 180);
        return (
          <motion.span key={i} className="absolute block -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width: p.s, height: p.s, background: i % 5 === 0 ? P.goldSoft : i % 3 === 0 ? '#9FD6E0' : '#FFFFFF', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }}
            initial={reduce ? { left: `${x}%`, top: `${y}%`, opacity: 1 } : { left: '50%', top: '50%', opacity: 0 }}
            animate={{ left: `${x}%`, top: `${y}%`, opacity: 1 }} transition={{ duration: 1.8, delay: 0.2 + (i % 7) * 0.04, ease: out }} />
        );
      })}
      {n >= 3 && (
        <>
          <motion.span className="absolute left-1/2 top-1/2 block h-[86%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed"
            style={{ borderColor: 'rgba(246,213,142,0.6)' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} />
          <motion.span className="absolute right-[16%] top-[7%] flex h-[78px] w-[78px] items-center justify-center rounded-full font-serif text-[56px] font-bold"
            style={{ background: P.gold, color: P.ink, boxShadow: '0 0 40px rgba(229,169,60,0.85)' }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}>?</motion.span>
        </>
      )}
      {labels.map((l, i) => (l ? (
        <Tag key={l} style={{ left: ['22%', '50%', '78%'][i], top: '93%' }} color={i === 2 ? '#9A6A12' : P.teal} delay={0.6}>{l}</Tag>
      ) : null))}
      {n >= 3 && <Tag style={{ left: '72%', top: '25%' }} size={18} color={P.ink} delay={1}>outside time, space, matter</Tag>}
    </div>
  );
}

/** p6 Three options as three cards: an empty circle (nothing), an arrow looping into itself, a hand of light from outside. */
export function ThreeOptions({ labels, label }: { labels: (string | null)[]; label: string }) {
  const n = labels.filter(Boolean).length;
  useCue('pop', n, 0.1);
  const icons = [
    <circle key="0" cx="60" cy="60" r="38" fill="none" stroke={P.tealSoft} strokeWidth="5" strokeDasharray="6 10" />,
    <path key="1" d="M60 22 A38 38 0 1 1 26 44 M26 44 L22 26 M26 44 L44 42" fill="none" stroke={P.tealSoft} strokeWidth="5" strokeLinecap="round" />,
    <g key="2"><rect x="30" y="34" width="60" height="52" rx="8" fill="none" stroke={P.tealSoft} strokeWidth="5" /><path d="M100 10 L72 40" stroke={P.goldSoft} strokeWidth="6" strokeLinecap="round" /><circle cx="100" cy="10" r="7" fill={P.goldSoft} /></g>,
  ];
  return (
    <div className={PANEL} role="img" aria-label={`${label}: ${n} of 3`} style={{ background: DEEP }}>
      {labels.map((l, i) => (l ? (
        <motion.div key={l} className="absolute top-[16%] flex h-[66%] w-[28%] flex-col items-center justify-center gap-6 rounded-[24px] border-2 px-4 text-center"
          style={{ left: `${4 + i * 32.5}%`, borderColor: 'rgba(191,227,230,0.5)', background: 'rgba(255,255,255,0.04)' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: out }}>
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">{icons[i]}</svg>
          <span className="font-sans text-[26px] font-bold leading-tight" style={{ color: '#FFFDF7' }}>{l}</span>
        </motion.div>
      ) : null))}
    </div>
  );
}

/** p7 At-Tur 52:35: the ayah's two questions fill two slots and are struck out; the third, unsaid, lights up: the Creator. */
export function AyahThreeSlots({ v, label }: { v: Built; label: string }) {
  useCue('strike', v.lines >= 2, 0.4);
  useCue('reveal', v.lines >= 2, 1.2);
  const slots = [
    { en: 'Made from nothing?', ar: 'مِنْ غَيْرِ شَىْءٍ' },
    { en: 'Made themselves?', ar: 'هُمُ ٱلْخَـٰلِقُونَ' },
  ];
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]" role="img" aria-label={label} style={{ background: DEEP }}>
      {slots.map((s, i) => (
        <motion.div key={s.en} className="absolute left-[6%] right-[6%] flex items-center justify-between rounded-[20px] px-6 py-4"
          style={{ top: `${8 + i * 26}%`, background: '#FFFDF7' }} initial={{ opacity: 0, x: -24 }} animate={{ opacity: v.lines >= 1 ? (v.lines >= 2 ? 0.55 : 1) : 0, x: v.lines >= 1 ? 0 : -24 }}
          transition={{ duration: 0.5, delay: i * 0.25, ease: out }}>
          <span className="font-sans text-[26px] font-bold" style={{ color: P.ink }}>{s.en}</span>
          {v.evidence && <span lang="ar" dir="rtl" className="font-serif text-[30px] font-bold" style={{ color: P.crimson }}>{s.ar}</span>}
          {v.lines >= 2 && (
            <motion.span className="absolute left-[3%] right-[3%] top-1/2 block h-[5px] origin-left rounded-full" style={{ background: P.crimson }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.25 }} />
          )}
        </motion.div>
      ))}
      {v.lines >= 2 && (
        <motion.div className="absolute bottom-[8%] left-[6%] right-[6%] flex items-center justify-between rounded-[20px] px-6 py-5"
          style={{ background: P.gold, boxShadow: '0 0 50px rgba(229,169,60,0.7)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.1, ease: out }}>
          <span className="font-sans text-[30px] font-bold" style={{ color: P.ink }}>Made by the Creator</span>
          <span lang="ar" dir="rtl" className="font-serif text-[36px] font-bold" style={{ color: P.ink }}>الخالق</span>
        </motion.div>
      )}
      {v.lines >= 2 && <Burst x={50} y={82} kind="sparks" count={12} seed={17} spread={30} delay={1.3} />}
    </div>
  );
}

/** p8 Proof or certainty: a shaky line (doubt) settles into a steady one as the ayah's word yaqeen arrives. */
export function SteadyLine({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const calm = v.evidence;
  useCue('chime', calm, 0.3);
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]" role="img" aria-label={label} style={{ background: DEEP }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true">
        <motion.path fill="none" stroke={calm ? P.goldSoft : P.tealSoft} strokeWidth="7" strokeLinecap="round"
          initial={false}
          animate={{ d: calm || reduce ? 'M60 285 C200 285 300 285 380 285 C460 285 560 285 700 285' : ['M60 285 C200 180 300 390 380 285 C460 180 560 390 700 285', 'M60 285 C200 390 300 180 380 285 C460 390 560 180 700 285'] }}
          transition={calm || reduce ? { duration: 1.2, ease: out } : { duration: 1.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
      </svg>
      {v.lines >= 1 && !calm && <Tag style={{ left: '50%', top: '18%' }} color={P.teal} delay={0.3}>Doubt: up and down</Tag>}
      {calm && <Tag style={{ left: '50%', top: '22%' }} ar="يَقِين" color="#9A6A12" delay={0.8}>Yaqeen: settled</Tag>}
    </div>
  );
}

/** p9 The kitchen: steam rises from the cake; "how" is pinned to the cake, "who" to the baker. */
export function CakeHowWho({ v }: { v: Built }) {
  useCue('pop', v.lines);
  return (
    <>
      <Rise from={[{ x: 50, y: 60 }]} count={6} kind="steam" height={16} seed={4} />
      {v.lines >= 1 && <Tag style={{ left: '50%', top: '46%' }} color={P.teal} delay={0.5}>How: heat, gas, rising</Tag>}
      {v.lines >= 2 && <Tag style={{ left: '22%', top: '14%' }} color="#9A6A12" delay={0.4}>Who: Noor baked it</Tag>}
    </>
  );
}

/** p10 Fitrah: the newborn's hand around a finger; a soft light breathes over it as the ayah arrives. */
export function BuiltIn({ v, label }: { v: Built; label: string }) {
  useCue('chime', v.evidence, 0.3);
  return (
    <Print name={T('newborn')} label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px]"><Glow x={44} y={44} w={28} h={34} /></div>
      {v.lines >= 2 && <Tag style={{ left: '50%', top: '14%' }} color={P.teal} delay={0.4}>Ready to know Him</Tag>}
      {v.evidence && <Tag style={{ left: '50%', top: '88%' }} ar="فِطْرَة" color="#9A6A12" delay={0.6}>fitrah</Tag>}
    </Print>
  );
}

/** p11 Who made God?: a chain of causes runs back and back, fading out (it would never start); then one gold circle with
 *  nothing before it anchors the whole chain: al-Awwal. */
export function TheFirst({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const anchored = v.lines >= 2;
  useCue('whoosh', v.lines >= 1, 0.2);
  useCue('reveal', anchored, 0.6);
  const boxes = ['universe', 'cause?', 'cause?', 'cause?', 'cause?'];
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px]" role="img" aria-label={label} style={{ background: DEEP }}>
      {v.lines >= 1 && boxes.map((b, i) => (
        <motion.span key={i} className="absolute top-[30%] flex h-[64px] -translate-y-1/2 items-center justify-center rounded-[14px] px-3 font-sans text-[20px] font-bold"
          style={{ right: `${4 + i * 19}%`, width: '15%', background: i === 0 ? '#FFFDF7' : 'rgba(255,253,247,0.12)', color: i === 0 ? P.ink : '#E8F4F5' }}
          initial={{ opacity: 0 }} animate={{ opacity: anchored && i > 0 ? 0 : 1 - i * 0.18 }} transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.2 }}>
          {b}
        </motion.span>
      ))}
      {v.lines >= 1 && !anchored && <Tag style={{ left: '24%', top: '52%' }} color={P.crimson} delay={1.2}>Carriages forever, no engine: nothing moves</Tag>}
      {anchored && (
        <>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true"><Pen d="M250 300 C330 250 470 220 600 172" color={P.goldSoft} width={6} glow duration={0.8} delay={0.6} /></svg>
          <motion.span className="absolute left-[8%] top-[46%] flex h-[150px] w-[150px] items-center justify-center rounded-full text-center font-sans text-[22px] font-bold"
            style={{ background: P.gold, color: P.ink, boxShadow: '0 0 60px rgba(229,169,60,0.85)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay: 0.3 }}>
            <span lang="ar" dir="rtl" className="font-serif text-[40px]">ٱلْأَوَّل</span>
          </motion.span>
          <Tag style={{ left: '50%', top: '88%' }} color="#9A6A12" delay={1.2}>The First: nothing before Him</Tag>
        </>
      )}
    </div>
  );
}

/** p12 Look up: the sky, the hills and the ground of the pitch get their words from the ayah, one by one. */
export function LookUp({ v, label }: { v: Built; label: string }) {
  useCue('pen', v.evidence, 0.3);
  return (
    <Print name={T('pitch')} label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px]"><Rise from={[{ x: 30, y: 30 }, { x: 70, y: 22 }]} count={3} height={10} seed={9} /></div>
      {v.evidence && <Tag style={{ left: '50%', top: '12%' }} ar="رُفِعَتْ" color={P.teal} delay={0.4}>the sky, raised</Tag>}
      {v.evidence && <Tag style={{ left: '80%', top: '30%' }} ar="نُصِبَتْ" color={P.copper} delay={0.9}>the hills, set firm</Tag>}
      {v.evidence && <Tag style={{ left: '40%', top: '86%' }} ar="سُطِحَتْ" color="#9A6A12" delay={1.4}>the earth, spread out</Tag>}
    </Print>
  );
}

/** p14 My Ahd: the Why List, with Lesson 2's question crossed off. */
export function ListCrossed({ v }: { v: Built }) {
  useCue('strike', v.lines >= 3, 1.2);
  if (v.lines < 3) return null;
  return <WhyList rows={[Q1, Q2]} crossed={[1]} style={{ right: '3%', top: '52%', width: '52%' }} />;
}

/** p15 Cliffhanger: the game screen glows and Ethan's question lands as a new line on the Why List. */
export function GameGlow({ v }: { v: Built }) {
  return (
    <>
      {/* The three "gods" on the game screen are soft lights only (sea, sky, sun): no figures (owner, 2026-10-22). */}
      <Glow x={36} y={24} w={16} h={22} color="62,155,200" />
      <Glow x={52} y={20} w={16} h={22} color="230,240,255" />
      <Glow x={68} y={24} w={16} h={22} color="229,169,60" />
      {v.lines >= 2 && <Tag style={{ left: '52%', top: '46%' }} color={P.crimson} delay={0.3}>"A whole team of gods"</Tag>}
      {v.lines >= 3 && <WhyList rows={[Q1, Q2, Q3]} crossed={[1]} typed={2} style={{ left: '28%', top: '50%', width: '44%' }} delay={0.2} />}
    </>
  );
}
