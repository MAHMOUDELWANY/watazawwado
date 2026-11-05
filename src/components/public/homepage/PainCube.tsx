import React, { useRef } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { FamiliarIcon } from './FamiliarIcons';

/**
 * "Sound familiar?": the four pains on the faces of a cube that turns as the visitor scrolls (owner's pick, 2026-11-05).
 * Each card is mostly drawing, with one short line under it. With reduced motion the cards sit in a plain grid.
 */

const KINDS = ['teacher', 'plan', 'interest', 'time'] as const;
const LINES = {
  en: [
    'The teacher keeps changing, and every new one starts from zero.',
    'Lessons happen, but nobody can tell you the plan.',
    'Your child loved it for a month, then lost interest.',
    'The times never fit your week.',
  ],
  ar: [
    'المعلّم يتغيّر كل فترة، وكل معلّم جديد يبدأ من الصفر.',
    'الحصص مستمرة، لكن لا أحد يخبرك بالخطة.',
    'أحبّ طفلك الدروس شهرًا، ثم فقد حماسه.',
    'المواعيد لا تناسب أسبوعك أبدًا.',
  ],
};
const AR_DIGITS = '١٢٣٤';
// Half the card width plus a small gap: the cube's radius, in CSS so it follows the card size.
const RADIUS = 'calc(min(150px, 38vw) + 24px)';

function PainCard({ kind, line, n, isEn }: { kind: (typeof KINDS)[number]; line: string; n: number; isEn: boolean }) {
  return (
    <article className="w-[min(300px,76vw)] rounded-[28px] border border-border bg-surface p-3.5 pb-5 text-start shadow-[0_30px_60px_-36px_rgba(18,16,14,0.35)]">
      <div className="relative aspect-square rounded-[20px] bg-[radial-gradient(120%_90%_at_30%_20%,var(--surface),var(--surface-warm))]">
        <span className="absolute top-3 start-3.5 text-xs font-bold text-muted-foreground tabular-nums">
          {isEn ? `${n} / 4` : `${AR_DIGITS[n - 1]} / ٤`}
        </span>
        <FamiliarIcon kind={kind} large />
      </div>
      <p className="mt-3.5 mx-1.5 text-[1.05rem] font-semibold leading-relaxed text-foreground">{line}</p>
    </article>
  );
}

function Face({ i, turn, children }: { i: number; turn: MotionValue<number>; children: React.ReactNode }) {
  const opacity = useTransform(turn, (r) => 0.25 + 0.75 * Math.max(0, Math.cos(((r - i * 90) * Math.PI) / 180)));
  return (
    <motion.div
      className="absolute inset-x-0 top-0 [backface-visibility:hidden]"
      style={{ opacity, transform: `rotateY(${-i * 90}deg) translateZ(${RADIUS})` }}
    >
      {children}
    </motion.div>
  );
}

export function PainCube({ isEn }: { isEn: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const still = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const turn = useTransform(scrollYProgress, [0.08, 0.92], [0, 270], { clamp: true });
  const ring = useMotionTemplate`translateZ(calc(-1 * ${RADIUS})) rotateX(-8deg) rotateY(${turn}deg)`;
  const lines = isEn ? LINES.en : LINES.ar;
  const heading = (
    <h2 id="home-familiar" className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground text-center">
      {isEn ? 'Sound familiar?' : 'هل يبدو هذا مألوفًا؟'}
    </h2>
  );

  if (still) {
    return (
      <section className="public-container py-16 lg:py-24" aria-labelledby="home-familiar">
        {heading}
        <div className="mt-10 grid gap-6 justify-items-center sm:grid-cols-2 max-w-3xl mx-auto">
          {KINDS.map((k, i) => <PainCard key={k} kind={k} line={lines[i]} n={i + 1} isEn={isEn} />)}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[380vh]" aria-labelledby="home-familiar">
      <div className="sticky top-0 h-[100svh] flex flex-col items-center justify-center gap-8 overflow-hidden px-4 [perspective:1100px]">
        {heading}
        <div className="relative w-[min(300px,76vw)] h-[min(440px,58svh)] [transform-style:preserve-3d]">
          <motion.div className="relative w-full h-full [transform-style:preserve-3d] will-change-transform" style={{ transform: ring }}>
            {KINDS.map((k, i) => (
              <Face key={k} i={i} turn={turn}>
                <PainCard kind={k} line={lines[i]} n={i + 1} isEn={isEn} />
              </Face>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
