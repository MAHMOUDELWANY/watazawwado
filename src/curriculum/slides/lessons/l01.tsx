import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, type Built } from '../Scenes';
import { Burst, Rise, SunRays, Glow, Sprite } from '../Motion';
import { useCue } from '../sfx';

/* ---------- Lesson 1: The Visitor in White, moments over the story paintings ----------
   The paintings (public/curriculum/zad-kids/l01, 1400 × 1050) are drawn cover-fit, so positions here are % of the box
   each composition gives them: the cover fills the slide; story pages use the picture-book box (1000 × 800). */

/** Three openings of light in cover.webp, as % of the slide. */
const DOORWAYS = [25, 54.3, 76];

/** p1 Cover: the doorways glow, motes of light drift up out of them, and Yusuf and Maryam stand wondering. */
export function DoorsWonder() {
  return (
    <>
      {DOORWAYS.map((x) => <Glow key={x} x={x} y={46} w={9} h={42} />)}
      <Rise from={DOORWAYS.map((x) => ({ x, y: 66 }))} count={5} height={34} seed={3} />
      <Sprite name="characters/yusuf-think.webp" enter="up" delay={1.6} className="h-[34%]" style={{ right: '14%', bottom: '7%' }} />
      <Sprite name="characters/maryam-think.webp" enter="up" delay={1.9} className="h-[32%]" style={{ right: '1%', bottom: '7%' }} />
    </>
  );
}

/** p2 A strange question: chalk underlines the sum, a "?" pops up by Ms. Clarke, and whisper waves go from Yusuf to Maryam. */
export function ClassroomWhisper({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pen', v.lines >= 1, 0.3);
  useCue('pop', v.lines >= 2, 0.3);
  useCue('pop', v.lines >= 3, 0.2);
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {v.lines >= 1 && <Pen d="M62 17.5 C70 19 78 16.5 85 18" color="#F5F1E6" width={0.7} duration={0.8} delay={0.3} />}
        {v.lines >= 3 && [0, 1, 2].map((i) => (
          <Pen key={i} d={`M${51.5 + i * 2} ${46 - i * 0.6} Q${53 + i * 2} ${48.5 - i * 0.6} ${51.5 + i * 2} ${51 - i * 0.6}`} color={P.goldSoft} width={0.5} delay={0.2 + i * 0.18} duration={0.3} />
        ))}
      </svg>
      {v.lines >= 1 && <Burst x={85} y={17} kind="sparks" count={8} seed={12} delay={1} spread={8} />}
      {v.lines >= 2 && (
        <motion.span className="pointer-events-none absolute flex h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] font-serif text-[52px] font-bold shadow-[0_12px_24px_-12px_rgba(30,20,16,0.7)]"
          style={{ left: '80%', top: '34%', background: '#FFFDF7', borderColor: P.teal, color: P.crimson }}
          initial={reduce ? false : { scale: 0, rotate: -20 }} animate={reduce ? undefined : { scale: 1, rotate: 0, y: [0, -6, 0] }}
          transition={{ scale: { type: 'spring', bounce: 0.5, duration: 0.6, delay: 0.3 }, rotate: { duration: 0.5, delay: 0.3 }, y: { duration: 2.4, repeat: Infinity, delay: 1 } }}>?</motion.span>
      )}
    </>
  );
}

/** p3 Jiddo's story: steam curls from his tea, Mishmish purrs on his lap, and as the story begins a trail of light runs from
 *  Jiddo's hand to the night window. */
export function JiddoTea({ v }: { v: Built }) {
  useCue('pop', v.lines >= 2, 0.3);
  useCue('sparkle', v.lines >= 3, 0.4);
  return (
    <>
      {v.lines >= 1 && <Rise from={[{ x: 79.8, y: 40 }]} count={4} kind="steam" height={12} seed={4} />}
      {v.lines >= 2 && <Rise from={[{ x: 73.7, y: 48 }]} count={3} kind="heart" height={14} seed={5} />}
      {v.lines >= 3 && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <Pen d="M54.6 36 C44 22 30 30 15 19" color={P.goldSoft} width={0.6} dash="1.5 2.5" duration={1.4} delay={0.3} glow />
          </svg>
          <Glow x={15} y={20} w={22} h={30} />
          <Burst x={15} y={19} kind="sparks" count={12} seed={8} delay={1.6} spread={12} />
        </>
      )}
    </>
  );
}

/** p4 One day in Madinah: slow sun rays; then a soft light gathers round the man in white as he appears (seen from
 *  behind, as RULES.md §1.10 requires), and motes of light rise around him. */
export function MadinahLight({ v }: { v: Built }) {
  useCue('whoosh', v.lines >= 1, 0.2);
  useCue('chime', v.lines >= 2, 0.3);
  return (
    <>
      {v.lines >= 1 && <SunRays x={26} y={37} size={60} />}
      {v.lines >= 2 && (
        <>
          <Glow x={26.4} y={71} w={16} h={30} color="255,252,240" />
          <Burst x={26.4} y={66} kind="sparks" count={12} seed={14} delay={0.3} spread={10} />
        </>
      )}
      {v.lines >= 3 && <Rise from={[{ x: 24, y: 86 }, { x: 29, y: 86 }]} count={4} height={22} seed={6} />}
    </>
  );
}
