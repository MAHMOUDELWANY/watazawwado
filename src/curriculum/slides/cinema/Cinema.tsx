import React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { RIBBON } from '../Arch';

/**
 * Adults "cinema" kit (owner, 2026-10-24): full-screen motion design after the owner's references (one idea per screen,
 * huge kinetic type with motion blur, a hero object that travels and morphs, glowing lines that draw and connect, count
 * ups, zoom-through transitions), in the site's identity: Thmanyah type, the crimson → gold → teal ribbon, the crimson
 * khatam star as the hero object, bone and warm ink. Everything here is positioned on the 1600 × 900 slide canvas.
 */

export const ease = [0.22, 1, 0.36, 1] as const;
export const INK = '#120C09';
export const BONE = '#F6F1E8';
export const GOLD = '#E5A93C';
export const CRIMSON = '#C51F24';
export const TEAL = '#0FA3B8';

/** Words rise out of a blur one after another (the references' kinetic title), the last word in the ribbon. */
export function KineticTitle({ text, size = 120, delay = 0, color = BONE, ribbonLast = true, style }: {
  text: string; size?: number; delay?: number; color?: string; ribbonLast?: boolean; style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <h2 className="font-serif font-medium" style={{ fontSize: size, lineHeight: 0.98, letterSpacing: '-0.02em', color, margin: 0, ...style }}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-visible" style={{ marginRight: '0.22em' }}>
          <motion.span className="inline-block" style={i === words.length - 1 && ribbonLast ? RIBBON : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: size * 0.55, filter: 'blur(14px)', scaleY: 1.25 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scaleY: 1 }}
            transition={{ duration: reduce ? 0.2 : 0.9, delay: reduce ? 0 : delay + i * 0.09, ease }}>
            {w}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

/** The brand's eight-point khatam star, the hero object that travels through the lesson. */
export function Khatam({ size = 60, color = CRIMSON, glow = true, style }: { size?: number; color?: string; glow?: boolean; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${size * 0.25}px ${color}AA)` : undefined, ...style }} aria-hidden="true">
      <rect x="22" y="22" width="56" height="56" rx="4" fill={color} />
      <rect x="22" y="22" width="56" height="56" rx="4" fill={color} transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="13" fill="#FBE9C8" />
    </svg>
  );
}

/** A glowing line that draws itself (the references' light traces), in gold with a soft halo. */
export function GlowPath({ d, progress, color = GOLD, width = 3, viewBox = '0 0 1600 900' }: { d: string; progress: number; color?: string; width?: number; viewBox?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={viewBox} aria-hidden="true">
      <defs>
        <filter id="glowpath" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <motion.path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" filter="url(#glowpath)"
        initial={{ pathLength: 0 }} animate={{ pathLength: progress }} transition={{ duration: reduce ? 0 : 1.4, ease: [0.65, 0, 0.35, 1] }} />
    </svg>
  );
}

/** A node on a glowing line: it ignites with a ring pulse, and its label rises above it. */
export function Node({ x, y, on, current, ar, en }: { x: number; y: number; on: boolean; current: boolean; ar: string; en: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }}>
      <motion.span className="absolute rounded-full" style={{ left: -11, top: -11, width: 22, height: 22, background: on ? GOLD : 'rgba(246,241,232,0.25)', boxShadow: on ? `0 0 24px 6px ${GOLD}99` : 'none' }}
        initial={false} animate={{ scale: current ? 1.25 : 1 }} transition={{ duration: 0.5, ease }} />
      {current && !reduce && (
        <motion.span className="absolute rounded-full" style={{ left: -11, top: -11, width: 22, height: 22, border: `2px solid ${GOLD}` }}
          initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }} />
      )}
      <AnimatePresence>
        {on && (
          <motion.div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ bottom: 26 }}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: current ? 1 : 0.62, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease }}>
            <span lang="ar" dir="rtl" className="whitespace-nowrap font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: current ? 46 : 30, color: BONE, textShadow: '0 4px 24px rgba(0,0,0,0.6)', transition: 'font-size 0.5s' }}>{ar}</span>
            <span className="whitespace-nowrap font-sans font-semibold" style={{ fontSize: current ? 20 : 15, color: GOLD, transition: 'font-size 0.5s' }}>{en}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Counts up to its value (the references' 286 → 365). */
export function CountUp({ to, size = 120, color = BONE, suffix, decimals = 0 }: { to: number; size?: number; color?: string; suffix?: React.ReactNode; decimals?: number }) {
  const f = 10 ** decimals;
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(reduce ? to : 0);
  React.useEffect(() => {
    if (reduce) { setN(to); return; }
    const from = n;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 700);
      setN(Math.round((from + (to - from) * (1 - Math.pow(1 - k, 3))) * f) / f);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return <span className="font-serif font-medium tabular-nums" style={{ fontSize: size, lineHeight: 1, color }}>{n.toFixed(decimals)}{suffix}</span>;
}

/** The text of an ayah or hadith: first as the hero in the middle of the screen, then docked as a compact card while
 *  the lesson draws something from it. One element, so it glides between the two (layout animation). */
export function TextCard({ arabic, meaning, reference, docked, style }: { arabic: string; meaning: string; reference: string; docked: boolean; style?: React.CSSProperties }) {
  return (
    <motion.figure layout transition={{ duration: 0.9, ease }}
      className="absolute m-0 rounded-[28px]"
      // Arrives just after the title has stepped back, so the two never cross.
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.45, ease } }}
      style={{
        ...(docked ? { left: 110, bottom: 150, width: 560 } : { left: 260, top: 300, width: 1080 }),
        padding: docked ? '22px 28px' : '36px 52px', background: 'rgba(246,241,232,0.94)', boxShadow: '0 40px 90px -40px rgba(0,0,0,0.85)', ...style,
      }}>
      <motion.div layout="position" className="mb-3 h-[3px] w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD}, ${TEAL})` }} />
      <motion.blockquote layout="position" lang="ar" dir="rtl" className="m-0 font-bold"
        style={{ fontFamily: 'var(--font-display-ar)', color: '#8B1A1E', fontSize: docked ? 22 : arabic.length > 150 ? 32 : 40, lineHeight: 1.7, transition: 'font-size 0.9s cubic-bezier(0.22,1,0.36,1)' }}>
        {arabic}
      </motion.blockquote>
      {!docked && (
        <motion.figcaption initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 font-serif italic" style={{ fontSize: 23, color: '#4A3A31', lineHeight: 1.38 }}>
          “{meaning}”
        </motion.figcaption>
      )}
      <motion.span layout="position" className="mt-2 block font-sans font-bold" style={{ fontSize: docked ? 14 : 19, color: '#8B4935' }}>{reference}</motion.span>
    </motion.figure>
  );
}

/** One subtitle line at a time, its words rising in sequence; a new line replaces the last (no stacking). */
export function Subtitle({ text, style }: { text: string | null; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute" style={{ left: 110, right: 110, bottom: 150, ...style }}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.p key={text} className="m-0 font-sans font-semibold" style={{ fontSize: 40, lineHeight: 1.3, color: BONE, textShadow: '0 4px 30px rgba(0,0,0,0.7)', maxWidth: 1100 }}
            exit={{ opacity: 0, y: -16, filter: 'blur(8px)', transition: { duration: 0.35 } }}>
            {text.split(' ').map((w, i) => (
              <motion.span key={i} className="inline-block" style={{ marginRight: '0.26em' }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, delay: reduce ? 0 : 0.5 + i * 0.045, ease }}>{w}</motion.span>
            ))}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Cinematic grade over a full-screen still: warm ink from the left and the bottom, so type stays readable. */
export function Grade({ side = 'left' }: { side?: 'left' | 'bottom' | 'both' }) {
  const left = 'linear-gradient(90deg, rgba(18,12,9,0.88) 0%, rgba(18,12,9,0.55) 32%, rgba(18,12,9,0) 62%)';
  const bottom = 'linear-gradient(0deg, rgba(18,12,9,0.9) 0%, rgba(18,12,9,0.4) 26%, rgba(18,12,9,0) 50%)';
  return (
    <>
      {(side === 'left' || side === 'both') && <div className="pointer-events-none absolute inset-0" style={{ background: left }} />}
      {(side === 'bottom' || side === 'both') && <div className="pointer-events-none absolute inset-0" style={{ background: bottom }} />}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 60% 40%, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
    </>
  );
}
