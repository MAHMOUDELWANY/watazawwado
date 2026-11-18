import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import { Bag } from '../IntroFilm';

/**
 * The homepage is a journey (docs/design/HOMEPAGE-V4-JOURNEY.md): numbered stations, a gold thread, Zad's bag filling
 * one step per station, and a "Next" door at the end of each. Motion rules: expo-out, rise + scale + fade together,
 * staggered, exits faster, never linear. Reduced motion: static.
 */

export type L = { en: string; ar: string };
export type Station = { id: string; label: L };

export const EXPO = [0.16, 1, 0.3, 1] as const;
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const num = (n: number, isEn: boolean) => {
  const s = String(n).padStart(2, '0');
  return isEn ? s : s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
};

/** Rise + scale + fade into view, once. */
export function Reveal({ children, delay = 0, className, y = 28, as = 'div' }: { children: React.ReactNode; delay?: number; className?: string; y?: number; as?: 'div' | 'li' }) {
  const reduce = useReducedMotion();
  if (reduce) return as === 'li' ? <li className={className}>{children}</li> : <div className={className}>{children}</div>;
  const M = as === 'li' ? motion.li : motion.div;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: EXPO, delay }}
    >
      {children}
    </M>
  );
}

/** A line of a heading rising out of a mask. */
export function MaskLine({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={`block ${className}`}>{children}</span>;
  // The mask is what gets watched: the line itself sits outside it until revealed, so it could never "enter" the view.
  return (
    <motion.span className={`block overflow-hidden pb-[0.12em] ${className}`} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.5 }}>
      <motion.span
        className="block"
        variants={{ hidden: { y: '108%' }, shown: { y: 0 } }}
        transition={{ duration: 0.9, ease: EXPO, delay }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

/** Station heading: number, label, a big line with one ribbon word, one short line. */
export function StationHead({ n, total, label, title, ribbon, after = '', sub, isEn, id, dark }: {
  n: number; total: number; label: L; title: string; ribbon: string; after?: string; sub?: string; isEn: boolean; id: string; dark?: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <Reveal>
        <p className={`inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-[0.12em] ${dark ? 'text-[#F6D58E]' : 'text-[#B4552F] dark:text-[#E5A93C]'}`}>
          <span className="grid place-items-center min-w-9 h-9 px-2 rounded-full border border-current font-editorial text-base tabular-nums">{num(n, isEn)}</span>
          <span>{isEn ? label.en : label.ar}</span>
          <span aria-hidden="true" className="opacity-60">{isEn ? `/ ${num(total, true)}` : `/ ${num(total, false)}`}</span>
        </p>
      </Reveal>
      <h2 id={id} className={`mt-4 font-editorial font-bold text-[2.1rem] leading-[1.15] sm:text-5xl lg:text-6xl scroll-mt-32 ${dark ? 'text-[#FAF7F2]' : 'text-foreground'}`}>
        <MaskLine delay={0.05}>{title}<span className={dark ? 'text-[#F6D58E]' : 'text-ribbon'}>{ribbon}</span>{after}</MaskLine>
      </h2>
      {sub && <Reveal delay={0.15}><p className={`mt-5 text-base sm:text-lg leading-relaxed ${dark ? 'text-[#FAF7F2]/75' : 'text-muted-foreground'}`}>{sub}</p></Reveal>}
    </div>
  );
}

/** The door at the end of a station: what is next, one tap away. */
export function NextDoor({ to, label, isEn, dark }: { to: string; label: L; isEn: boolean; dark?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-14 flex justify-center">
      <a
        href={`#${to}`}
        className={`group inline-flex items-center gap-3 rounded-full border px-5 py-2.5 min-h-11 text-sm font-bold transition-colors ${dark ? 'border-[#F6D58E]/30 text-[#F6D58E] hover:bg-[#F6D58E]/10' : 'border-border text-foreground hover:border-[#E5A93C] hover:bg-[#E5A93C]/[0.06]'}`}
      >
        <span className="opacity-70">{isEn ? 'Next' : 'التالي'}</span>
        <span>{isEn ? label.en : label.ar}</span>
        <motion.span aria-hidden="true" animate={reduce ? undefined : { y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <ArrowDown className="w-4 h-4" />
        </motion.span>
      </a>
    </div>
  );
}

/** Which station is on screen, from the stations' positions (no observers to leak). */
export function useCurrentStation(ids: string[]) {
  const [state, setState] = React.useState<{ index: number; inside: boolean }>({ index: -1, inside: false });
  React.useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = window.innerHeight * 0.4;
      let index = -1;
      ids.forEach((id, k) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= mid) index = k; });
      const last = document.getElementById(ids[ids.length - 1]);
      const inside = index >= 0 && !!last && last.getBoundingClientRect().bottom > mid;
      setState((s) => (s.index === index && s.inside === inside ? s : { index, inside }));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [ids]);
  return state;
}

/**
 * Wide screens: a rail on the side with Zad's bag on top that glows fuller per station, the stations, and the thread.
 * Phones: a thin bar under the header with "02 / 06 · label" and what is next.
 */
export function JourneyNav({ stations, isEn }: { stations: Station[]; isEn: boolean }) {
  const ids = React.useMemo(() => stations.map((s) => s.id), [stations]);
  const { index, inside } = useCurrentStation(ids);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const thread = useSpring(useTransform(scrollYProgress, [0.08, 0.85], [0, 1]), { stiffness: 120, damping: 30 });
  const t = (l: L) => (isEn ? l.en : l.ar);
  const fill = (index + 1) / stations.length;
  const cur = stations[Math.max(0, index)];
  const next = stations[index + 1];

  return (
    <>
      {/* Wide screens: the rail. */}
      <motion.nav
        aria-label={isEn ? 'Journey through this page' : 'رحلة الصفحة'}
        className="hidden xl:flex fixed top-1/2 start-5 z-30 -translate-y-1/2 flex-col items-center gap-3"
        initial={false}
        animate={{ opacity: inside ? 1 : 0, x: inside ? 0 : isEn ? -16 : 16, pointerEvents: inside ? 'auto' : 'none' }}
        transition={{ duration: 0.4, ease: EXPO }}
      >
        <motion.div className="w-11" animate={reduce ? undefined : { filter: `drop-shadow(0 0 ${4 + fill * 14}px rgba(229,169,60,${0.25 + fill * 0.5}))` }} transition={{ duration: 0.6 }}>
          <Bag />
        </motion.div>
        <div className="relative flex flex-col items-center gap-4 py-2">
          <span aria-hidden="true" className="absolute top-2 bottom-2 w-px bg-border" />
          <motion.span aria-hidden="true" className="absolute top-2 bottom-2 w-px bg-[#E5A93C] origin-top" style={{ scaleY: reduce ? fill : thread }} />
          {stations.map((s, k) => {
            const on = k === index;
            const done = k < index;
            return (
              <a key={s.id} href={`#${s.id}`} className="group relative flex items-center" aria-current={on ? 'step' : undefined}>
                <span className={`relative z-10 grid place-items-center rounded-full font-editorial font-bold tabular-nums transition-all duration-300 ${on ? 'w-8 h-8 text-sm bg-[#C51F24] text-[#FAF7F2] shadow-[0_0_0_5px_rgba(197,31,36,0.18)]' : done ? 'w-6 h-6 text-[10px] bg-[#E5A93C] text-[#1C1411]' : 'w-6 h-6 text-[10px] bg-background border border-border text-muted-foreground'}`}>
                  {num(k + 1, isEn)}
                </span>
                <span className={`absolute start-10 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-opacity duration-200 bg-background/90 border border-border text-foreground ${on ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {t(s.label)}
                </span>
              </a>
            );
          })}
        </div>
      </motion.nav>

      {/* Phones and tablets: where you are, and what is next. */}
      <motion.div
        className="xl:hidden fixed inset-x-0 top-16 sm:top-20 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md"
        initial={false}
        animate={{ opacity: inside ? 1 : 0, y: inside ? 0 : -12, pointerEvents: inside ? 'auto' : 'none' }}
        transition={{ duration: 0.3, ease: EXPO }}
        aria-hidden={!inside}
      >
        <div className="public-container flex items-center justify-between gap-3 py-2 text-xs sm:text-sm">
          <span className="font-bold text-foreground truncate">
            <span className="text-[#C51F24] tabular-nums">{num(Math.max(1, index + 1), isEn)}</span>
            <span className="text-muted-foreground"> / {num(stations.length, isEn)} · </span>{t(cur.label)}
          </span>
          {next && (
            <a href={`#${next.id}`} className="shrink-0 inline-flex items-center gap-1 min-h-9 font-semibold text-muted-foreground">
              {isEn ? 'Next:' : 'التالي:'} <span className="text-foreground">{t(next.label)}</span>
            </a>
          )}
        </div>
        <div className="h-[3px] bg-border/60">
          <motion.div className="h-full bg-[linear-gradient(90deg,#C51F24,#E5A93C,#087D91)] rtl:bg-[linear-gradient(270deg,#C51F24,#E5A93C,#087D91)] origin-[0%] rtl:origin-[100%]" style={{ scaleX: reduce ? fill : thread }} />
        </div>
      </motion.div>
    </>
  );
}
