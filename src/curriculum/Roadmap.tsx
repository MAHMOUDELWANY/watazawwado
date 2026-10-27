import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { BookMarked, BookOpen, Coffee, Compass, Globe, Library, Lock, Map as MapIcon, Play, Sparkles, type LucideIcon } from 'lucide-react';
import type { Lesson } from './types';
import { asset } from './slides/Art';

/**
 * The road map of one curriculum version (owner, 2026-10-27), in the academy's own language: the khatam lattice behind,
 * the ribbon gradient (crimson → amber → gold → teal) as the travelled road, every part a mihrab gate the road passes
 * through, every lesson a khatam station, and a gate at the finish. It follows the site's light and dark themes (surface
 * tokens, `.khatam-field`, `.brand-lights`). Each age moves differently: Kids stations pop in with a spring and Yusuf
 * waits at the latest lesson; Teens get a light that runs along the road and pulsing stations; Adults a calm road that
 * draws itself. Each stage gate can carry a landmark painting beside it (desktop). On a phone the road runs straight
 * down the start edge. Reduced motion shows everything at rest.
 */

type Age = 'kids' | 'teens' | 'adults';
type Theme = { accent: string; soft: string; icon: LucideIcon; finishEn: string; finishAr: string };

const THEMES: Record<string, Theme> = {
  'zad-essentials': { accent: '#0A5866', soft: '#0FA3B8', icon: Compass, finishEn: 'Provisions for the whole journey', finishAr: 'زاد للطريق كله' },
  seerah: { accent: '#8B4935', soft: '#E5A93C', icon: MapIcon, finishEn: 'The whole life of the Prophet ﷺ', finishAr: 'السيرة كاملة' },
  literacy: { accent: '#C51F24', soft: '#E5A93C', icon: BookOpen, finishEn: 'I can read anything', finishAr: 'أقرأ أي شيء' },
  quran: { accent: '#0A5866', soft: '#E5A93C', icon: BookMarked, finishEn: 'Reading the Quran well', finishAr: 'قراءة القرآن بإتقان' },
  egyptian: { accent: '#8B4935', soft: '#E5A93C', icon: Coffee, finishEn: 'Chatting in Cairo', finishAr: 'أتكلم مصري بثقة' },
  english: { accent: '#0A5866', soft: '#C51F24', icon: Globe, finishEn: 'Ready for the real world', finishAr: 'جاهز للعالم الحقيقي' },
  fusha: { accent: '#8B1A1E', soft: '#E5A93C', icon: Library, finishEn: 'The language of the great books', finishAr: 'لغة الكتب الكبيرة' },
};
const FALLBACK: Theme = { accent: '#0A5866', soft: '#E5A93C', icon: Sparkles, finishEn: 'The end of the road', finishAr: 'نهاية الطريق' };
const RIBBON = ['#C51F24', '#B4552F', '#E5A93C', '#0FA3B8'];
const EASE = [0.22, 1, 0.36, 1] as const;

/** Kids, Teens or Adults from the version and its audience ("6–11", "12–17", "12+", "18+"). */
export function ageOf(version: string, audience: string): Age {
  const from = parseInt(audience, 10);
  if (/kids/i.test(version) || from < 12) return 'kids';
  if (/teens/i.test(version) && !/adults/i.test(version)) return 'teens';
  return 'adults';
}

const LOOK: Record<Age, { node: number; track: number; ribbon: number; row: number; wave: number[] }> = {
  kids: { node: 74, track: 30, ribbon: 14, row: 150, wave: [50, 76, 50, 24] },
  teens: { node: 62, track: 14, ribbon: 6, row: 112, wave: [50, 72, 50, 28] },
  adults: { node: 54, track: 6, ribbon: 3, row: 104, wave: [50, 68, 50, 32] },
};

function useWide() {
  const q = '(min-width: 768px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

/** The eight-point khatam: two squares, one turned 45°, centred in a size × size box. */
function KhatamShape({ size, fill, stroke, dash }: { size: number; fill: string; stroke?: string; dash?: string }) {
  const c = size / 2, s = size * 0.62, o = c - s / 2;
  const common = { fill, stroke, strokeWidth: stroke ? 2 : 0, strokeDasharray: dash, strokeLinejoin: 'round' as const, rx: size * 0.06 };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
      <rect x={o} y={o} width={s} height={s} {...common} />
      <rect x={o} y={o} width={s} height={s} transform={`rotate(45 ${c} ${c})`} {...common} />
    </svg>
  );
}

/** The stage's landmark painting in an arched frame; hidden until it loads (or if it has not arrived yet). */
function Landmark({ track, pi, size, age, reduce }: { track: string; pi: number; size: number; age: Age; reduce: boolean | null }) {
  const [ok, setOk] = useState(false);
  return (
    <motion.span aria-hidden="true" className={`arch-tile relative block shrink-0 overflow-hidden bg-surface ring-2 ring-surface shadow-[0_18px_36px_-20px_rgba(40,20,10,0.6)] ${ok ? '' : 'hidden'}`}
      style={{ width: size, height: size * 1.15 }}
      initial={reduce ? false : { opacity: 0, scale: 0.8, rotate: -4 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }}
      transition={age === 'kids' ? { type: 'spring', bounce: 0.5, duration: 0.9, delay: 0.2 } : { duration: 0.7, ease: EASE, delay: 0.2 }}>
      <img src={`/curriculum/landmarks/${track}-s${pi + 1}.webp`} alt="" draggable={false} onLoad={() => setOk(true)} onError={() => setOk(false)}
        ref={(el) => { if (el?.complete && el.naturalWidth > 0) setOk(true); }} className="h-full w-full object-cover" />
    </motion.span>
  );
}


type Props = {
  /** The version's id: its stage landmarks live at /curriculum/landmarks/<track>-s<N>.webp (LANDMARK-PROMPTS.md). */
  track: string;
  plan: string[];
  parts: { title: string; titleAr: string; from: number }[];
  lessons: Record<number, Lesson>;
  group: string;
  version: string;
  audience: string;
  ar: boolean;
  hrefFor: (n: number) => string;
  L: (en: string, ar: string) => string;
};

export function Roadmap({ track, plan, parts, lessons, group, version, audience, ar, hrefFor, L }: Props) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const uid = useId().replace(/:/g, '');
  const theme = THEMES[group] ?? FALLBACK;
  const age = ageOf(version, audience);
  const look = LOOK[age];
  const Icon = theme.icon;
  const readyNumbers = Object.keys(lessons).map(Number).filter((n) => n <= plan.length);
  const latest = readyNumbers.length ? Math.max(...readyNumbers) : 0;
  const pct = Math.round((readyNumbers.length / Math.max(1, plan.length)) * 100);
  const enter = (d = 0, y = 16) => (reduce ? {} : {
    initial: { opacity: 0, y, scale: age === 'kids' ? 0.86 : 1, filter: age === 'teens' ? 'blur(6px)' : 'blur(0px)' },
    whileInView: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    viewport: { once: true, margin: '-40px' },
    transition: age === 'kids' ? { type: 'spring' as const, bounce: 0.45, duration: 0.8, delay: d } : { duration: 0.6, delay: d, ease: EASE },
  });

  /* ---------- pieces ---------- */

  const Station = ({ n }: { n: number }) => {
    const lesson = lessons[n];
    const size = look.node;
    return (
      <span className="relative z-10 grid shrink-0 place-items-center" style={{ width: size, height: size }}>
        {lesson && age === 'teens' && !reduce && (
          <motion.span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: theme.soft }}
            animate={{ opacity: [0.35, 0, 0.35], scale: [0.7, 1.35, 0.7] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: (n % 4) * 0.4 }} />
        )}
        {age === 'adults' ? (
          <span className={`arch-tile absolute inset-[6%] ${lesson ? '' : 'bg-surface ring-1 ring-border'}`}
            style={lesson ? { background: `linear-gradient(160deg, ${theme.soft}, ${theme.accent})`, boxShadow: `0 12px 24px -14px ${theme.accent}` } : undefined} />
        ) : lesson ? (
          <KhatamShape size={size} fill={`url(#st-${uid})`} />
        ) : (
          <KhatamShape size={size} fill="var(--surface)" stroke="var(--border)" dash={age === 'kids' ? '5 5' : undefined} />
        )}
        <span className={`relative font-display font-bold ${lesson ? 'text-white' : 'text-muted-foreground'}`} style={{ fontSize: age === 'kids' ? 24 : 18 }}>{n}</span>
      </span>
    );
  };

  const Card = ({ n }: { n: number }) => {
    const lesson = lessons[n];
    return (
      <span className={`relative flex min-w-0 items-center gap-3 overflow-hidden bg-surface ring-1 ring-border shadow-[0_18px_40px_-28px_rgba(40,20,10,0.55)] ${age === 'kids' ? 'rounded-[24px] px-4 py-3.5' : 'rounded-2xl px-4 py-3'}`}>
        {lesson && <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1" style={{ background: `linear-gradient(180deg, ${RIBBON.join(', ')})` }} />}
        <span className="min-w-0 flex-1">
          <span className={`block text-[10.5px] font-bold uppercase tracking-[0.16em] ${lesson ? '' : 'text-muted-foreground'}`} style={lesson ? { color: theme.soft } : undefined}>{L(`Lesson ${n}`, `الدرس ${n}`)}</span>
          <span dir="ltr" className={`mt-0.5 block text-start font-display font-bold leading-snug text-foreground line-clamp-2 ${age === 'kids' ? 'text-[17px]' : 'text-[15.5px]'}`}>{plan[n - 1]}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {lesson ? (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${lesson.reviewed ? 'bg-teal/15 text-teal' : 'bg-gold/20 text-[#9A6A12] dark:text-[#F6D58E]'}`}>{lesson.reviewed ? L('Ready', 'جاهز') : L('Draft', 'مسودة')}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Lock className="h-3 w-3" aria-hidden="true" />{L('Coming soon', 'قريباً')}</span>
            )}
            {n === latest && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: theme.accent }}>{L('Latest', 'آخر درس')}</span>}
          </span>
        </span>
        {lesson && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition-transform duration-200 group-hover:scale-110" style={{ background: theme.accent }}>
            <Play className="h-4 w-4 translate-x-[1px] fill-current" aria-hidden="true" />
          </span>
        )}
      </span>
    );
  };

  const Wrap = ({ n, children, className, style }: { n: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
    const label = `${L('Lesson', 'الدرس')} ${n}: ${plan[n - 1]}`;
    return lessons[n]
      ? <Link to={hrefFor(n)} aria-label={label} className={`group rounded-3xl outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary ${className ?? ''}`} style={style}>{children}</Link>
      : <div aria-label={`${label} · ${L('Coming soon', 'قريباً')}`} className={className} style={style}>{children}</div>;
  };

  /** The mihrab gate of a stage: arch top, khatam window pattern, title and a small progress bar. */
  const Gate = ({ pi, title, from, last, ready, total }: { pi: number; title: string; from: number; last: number; ready: number; total: number }) => (
    <div className="arch-top khatam-window relative w-full max-w-[340px] overflow-hidden px-6 pb-4 pt-9 text-center text-white shadow-[0_24px_50px_-28px_rgba(0,0,0,0.7)]"
      style={{ background: `radial-gradient(18rem 10rem at 50% 0%, ${theme.soft}55, transparent 70%), linear-gradient(170deg, ${theme.accent}, ${pi % 2 ? '#3B2219' : '#05363F'})` }}>
      <span className="relative block text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">{L(`Stage ${pi + 1}`, `المرحلة ${pi + 1}`)}</span>
      <span id={`stage-${uid}-${pi}`} className="relative mt-1 block font-display text-lg font-bold leading-tight sm:text-xl">{title}</span>
      <span className="relative mt-2 block text-xs font-semibold text-white/75">{L(`Lessons ${from}–${last}`, `الدروس ${from}–${last}`)} · {L(`${ready} of ${total} ready`, `${ready} من ${total} جاهز`)}</span>
      <span className="relative mx-auto mt-2 block h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
        <motion.span className="block h-full rounded-full" style={{ background: `linear-gradient(90deg, ${RIBBON.join(', ')})`, width: reduce ? `${(ready / total) * 100}%` : undefined }}
          initial={reduce ? false : { width: 0 }} whileInView={{ width: `${(ready / total) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 }} />
      </span>
    </div>
  );

  /* ---------- layout ---------- */

  return (
    <div className="khatam-field brand-lights relative overflow-hidden rounded-[var(--r-5,36px)] bg-surface-subtle/70 px-3 py-6 ring-1 ring-border sm:px-8 sm:py-8">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id={`st-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={theme.soft} /><stop offset="1" stopColor={theme.accent} /></linearGradient>
        </defs>
      </svg>

      {/* Overview: the whole road at a glance, and a jump to every stage. */}
      <div className="relative mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(150deg, ${theme.soft}, ${theme.accent})` }}><Icon className="h-6 w-6" aria-hidden="true" /></span>
        <div className="min-w-[220px] flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{L('The road', 'خريطة الطريق')}</p>
          <p className="font-display text-xl font-bold text-foreground">{L(`${parts.length} stages · ${plan.length} lessons · ${readyNumbers.length} ready`, `${parts.length} مراحل · ${plan.length} درس · ${readyNumbers.length} جاهز`)}</p>
          <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-border/60" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={L('Lessons ready', 'الدروس الجاهزة')}>
            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${RIBBON.join(', ')})` }}
              initial={reduce ? false : { width: 0 }} animate={{ width: `${Math.max(2, pct)}%` }} transition={{ duration: 1.2, ease: EASE }} />
          </div>
        </div>
        <nav aria-label={L('Stages', 'المراحل')} className="flex flex-wrap gap-1.5">
          {parts.map((p, i) => (
            <a key={p.from} href={`#stage-${uid}-${i}`} className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-foreground ring-1 ring-border transition-colors hover:bg-teal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {i + 1} · {ar ? p.titleAr : p.title}
            </a>
          ))}
        </nav>
      </div>

      <ol className="relative">
        {!wide && (
          <div aria-hidden="true" className="pointer-events-none absolute bottom-10 top-6 rounded-full bg-border" style={{ insetInlineStart: `${look.node / 2 - Math.max(4, look.track / 3) / 2}px`, width: Math.max(4, look.track / 3) }} />
        )}
        {parts.map((part, pi) => {
          const last = (parts[pi + 1]?.from ?? plan.length + 1) - 1;
          const numbers = Array.from({ length: last - part.from + 1 }, (_, k) => part.from + k);
          const ready = numbers.filter((n) => lessons[n]).length;
          const { row, wave } = look;
          const h = (numbers.length + 1) * row;
          const pts = [{ x: 50, y: 0 }, ...numbers.map((_, k) => ({ x: wave[k % wave.length], y: (k + 1) * row - row / 2 + 24 })), { x: 50, y: h }];
          const d = pts.map((p, k) => (k === 0 ? `M ${p.x} ${p.y}` : `C ${pts[k - 1].x} ${pts[k - 1].y + row / 2}, ${p.x} ${p.y - row / 2}, ${p.x} ${p.y}`)).join(' ');
          // How far along this stage's road the ready lessons reach (0..1), by station count.
          const lastReadyHere = numbers.reduce((m, n, k) => (lessons[n] ? k + 1 : m), 0);
          const travelled = latest > numbers[numbers.length - 1] ? 1 : lastReadyHere / (numbers.length + 1);
          return (
            <li key={part.from} aria-labelledby={`stage-${uid}-${pi}`} className="scroll-mt-24">
              <motion.div className={`relative z-10 flex ${wide ? 'justify-center' : 'justify-start'} pb-2`} {...enter()}>
                {wide && (
                  <span dir="ltr" className="absolute bottom-2" style={pi % 2 ? { left: 'calc(50% + 190px)' } : { right: 'calc(50% + 190px)' }}>
                    <Landmark track={track} age={age} reduce={reduce} pi={pi} size={age === 'kids' ? 132 : 116} />
                  </span>
                )}
                <Gate pi={pi} title={ar ? part.titleAr : part.title} from={part.from} last={last} ready={ready} total={numbers.length} />
              </motion.div>

              {wide ? (
                <div dir="ltr" className="relative" style={{ height: h - row / 2 }}>
                  <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${h - row / 2}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    {/* the ribbon runs crimson → teal over the travelled stretch only */}
                    <defs><linearGradient id={`rb-${uid}-${pi}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={Math.max(1, travelled * h)}>{RIBBON.map((c, i) => <stop key={c} offset={i / (RIBBON.length - 1)} stopColor={c} />)}</linearGradient></defs>
                    <path d={d} fill="none" stroke="var(--border)" strokeOpacity={0.75} strokeWidth={look.track} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    {age === 'kids' && <path d={d} fill="none" stroke="var(--surface)" strokeWidth={2.5} strokeDasharray="10 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                    {travelled > 0 && (
                      <motion.path d={d} fill="none" stroke={`url(#rb-${uid}-${pi})`} strokeWidth={look.ribbon} strokeLinecap="round" vectorEffect="non-scaling-stroke"
                        initial={reduce ? { pathLength: travelled } : { pathLength: 0 }} whileInView={{ pathLength: travelled }} viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: age === 'adults' ? 2.2 : 1.6, ease: EASE }} />
                    )}
                    {age === 'teens' && travelled > 0.08 && !reduce && (
                      <motion.path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke"
                        style={{ filter: `drop-shadow(0 0 6px ${theme.soft})` }}
                        initial={{ pathLength: 0.06, pathOffset: 0 }} animate={{ pathOffset: [0, travelled - 0.06] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.6 }} />
                    )}
                  </svg>
                  <ol>
                    {numbers.map((n, k) => {
                      const x = wave[k % wave.length];
                      const cardRight = x <= 50;
                      return (
                        <motion.li key={n} className="absolute" style={{ top: (k + 1) * row - row / 2 + 24 - look.node / 2, left: `${x}%` }} {...enter(0.04 * (k % 4))}>
                          <Wrap n={n} className="flex items-center gap-4" style={{ transform: `translateX(${cardRight ? `${-look.node / 2}px` : `calc(-100% + ${look.node / 2}px)`})`, flexDirection: cardRight ? 'row' : 'row-reverse' }}>
                            <Station n={n} />
                            <span className="w-[min(340px,34vw)]"><Card n={n} /></span>
                          </Wrap>
                          {age === 'kids' && n === latest && (
                            <motion.img src={asset('zad-kids/characters/yusuf-point.webp')} alt="" draggable={false}
                              className="pointer-events-none absolute h-[100px] w-auto drop-shadow-[0_12px_14px_rgba(60,30,10,0.25)]"
                              style={{ top: look.node - 100, left: cardRight ? -look.node / 2 - 82 : look.node / 2 + 14, transform: cardRight ? undefined : 'scaleX(-1)' }}
                              initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: reduce ? 0 : [0, -6, 0] }} viewport={{ once: true }}
                              transition={{ opacity: { duration: 0.5, delay: 0.8 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 } }} />
                          )}
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <ol className="space-y-3 pb-6 pt-2">
                  {numbers.map((n) => (
                    <motion.li key={n} {...enter()}>
                      <Wrap n={n} className="grid grid-cols-[auto_1fr] items-center gap-3"><Station n={n} /><Card n={n} /></Wrap>
                    </motion.li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}

        {/* The finish: the last gate, with the subject's promise. */}
        <motion.li className={`relative z-10 flex ${wide ? 'justify-center' : 'justify-start'} pt-2`} aria-label={L('Finish', 'خط النهاية')} {...enter()}>
          <div className="arch-top relative w-full max-w-[380px] p-[3px]" style={{ background: `linear-gradient(120deg, ${RIBBON.join(', ')})` }}>
            <div className="arch-top relative bg-surface px-6 pb-5 pt-10 text-center">
              <span className="relative mx-auto grid h-14 w-14 place-items-center">
                <KhatamShape size={56} fill={`url(#st-${uid})`} />
                <Icon className="relative h-6 w-6 text-white" aria-hidden="true" />
              </span>
              <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{L('The finish line', 'خط النهاية')}</span>
              <span className="text-ribbon block font-display text-xl font-bold leading-tight">{ar ? theme.finishAr : theme.finishEn}</span>
              <span className="mt-1 block text-xs font-semibold text-muted-foreground">{L(`after ${plan.length} lessons`, `بعد ${plan.length} درس`)}</span>
            </div>
          </div>
        </motion.li>
      </ol>
    </div>
  );
}
