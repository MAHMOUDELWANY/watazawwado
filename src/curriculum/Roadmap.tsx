import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { BookMarked, BookOpen, Coffee, Compass, Flag, Globe, Library, Lock, Map as MapIcon, PlayCircle, Sparkles, Trophy, type LucideIcon } from 'lucide-react';
import type { Lesson } from './types';

/**
 * The road map of one curriculum version (owner, 2026-10-27): instead of a stacked list, the lessons are stations on a
 * winding road, each part a stage with its own flag, and a finish line at the end. Every subject has its own colour,
 * emblem and finish line; every age its own road (Kids: a wide sand road with white dashes and big round stations;
 * Teens: a glowing road at night; Adults: a fine line with arched stations). On a phone the road runs straight down the
 * start edge (the winding road keeps one direction in Arabic too, so the stations stay on it). Ready lessons open; the rest wait as "coming soon".
 */

type Age = 'kids' | 'teens' | 'adults';
type Theme = { accent: string; soft: string; icon: LucideIcon; finishEn: string; finishAr: string };

const THEMES: Record<string, Theme> = {
  'zad-essentials': { accent: '#0A5866', soft: '#0FA3B8', icon: Compass, finishEn: 'Provisions for the whole journey', finishAr: 'زاد للطريق كله' },
  seerah: { accent: '#9A6A12', soft: '#E5A93C', icon: MapIcon, finishEn: 'The whole life of the Prophet ﷺ', finishAr: 'السيرة كاملة' },
  literacy: { accent: '#C51F24', soft: '#E5A93C', icon: BookOpen, finishEn: 'I can read anything', finishAr: 'أقرأ أي شيء' },
  quran: { accent: '#0A5866', soft: '#E5A93C', icon: BookMarked, finishEn: 'Reading the Quran well', finishAr: 'قراءة القرآن بإتقان' },
  egyptian: { accent: '#8B4935', soft: '#E5A93C', icon: Coffee, finishEn: 'Chatting in Cairo', finishAr: 'أتكلم مصري بثقة' },
  english: { accent: '#0A5866', soft: '#C51F24', icon: Globe, finishEn: 'Ready for the real world', finishAr: 'جاهز للعالم الحقيقي' },
  fusha: { accent: '#5E1214', soft: '#E5A93C', icon: Library, finishEn: 'The language of the great books', finishAr: 'لغة الكتب الكبيرة' },
};
const FALLBACK: Theme = { accent: '#0A5866', soft: '#E5A93C', icon: Sparkles, finishEn: 'The end of the road', finishAr: 'نهاية الطريق' };

/** Kids, Teens or Adults from the version and its audience ("6–11", "12–17", "12+", "18+"). */
export function ageOf(version: string, audience: string): Age {
  const from = parseInt(audience, 10);
  if (/kids/i.test(version) || from < 12) return 'kids';
  if (/teens/i.test(version) && !/adults/i.test(version)) return 'teens';
  return 'adults';
}

const LOOK: Record<Age, { node: number; road: string; roadW: number; dash?: string; card: string; dark: boolean; bg: string; locked: string }> = {
  kids: {
    node: 62, road: '#EFD3A0', roadW: 30, dash: '#FFFDF8', dark: false,
    card: 'rounded-[26px] bg-[#FFFDF8] shadow-[0_18px_40px_-26px_rgba(60,20,10,0.5)]',
    bg: 'bg-[radial-gradient(40rem_20rem_at_10%_0%,rgba(229,169,60,0.18),transparent_60%),linear-gradient(180deg,#FFF7E6_0%,#FBEFD9_100%)]',
    locked: 'bg-[#FFF7E6] text-[#B89A6A] ring-2 ring-[#EFD3A0]',
  },
  teens: {
    node: 54, road: 'rgba(15,163,184,0.35)', roadW: 10, dark: true,
    card: 'rounded-2xl bg-white/[0.07] ring-1 ring-white/10 backdrop-blur',
    bg: 'bg-[radial-gradient(50rem_30rem_at_85%_0%,rgba(15,163,184,0.2),transparent_60%),radial-gradient(40rem_24rem_at_0%_100%,rgba(197,31,36,0.16),transparent_60%),linear-gradient(180deg,#0B1E24_0%,#120C09_100%)]',
    locked: 'bg-[#16242A] text-white/45 ring-1 ring-white/15',
  },
  adults: {
    node: 50, road: 'rgba(31,22,18,0.22)', roadW: 3, dark: false,
    card: 'rounded-2xl glass-1 ring-1 ring-border/60',
    bg: 'bg-[linear-gradient(180deg,rgba(246,241,232,0.9),rgba(246,241,232,0.5))]',
    locked: 'bg-[#F6F1E8] text-muted-foreground ring-1 ring-border',
  },
};

/** Station x positions (percent of the width) along the winding road, repeating. */
const WAVE = [50, 74, 50, 26];
const ROW = 112; // px between stations on the winding road

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

type Props = {
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

export function Roadmap({ plan, parts, lessons, group, version, audience, ar, hrefFor, L }: Props) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const theme = THEMES[group] ?? FALLBACK;
  const age = ageOf(version, audience);
  const look = LOOK[age];
  const Icon = theme.icon;
  const ink = look.dark ? 'text-white' : 'text-foreground';
  const muted = look.dark ? 'text-white/60' : 'text-muted-foreground';
  const enter = (d = 0) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-30px' }, transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as const } });

  const Node = ({ n }: { n: number }) => {
    const ready = Boolean(lessons[n]);
    return (
      <span className={`relative z-10 flex shrink-0 items-center justify-center font-bold ${age === 'adults' ? 'arch-tile' : 'rounded-full'} ${ready ? 'text-white' : look.locked}`}
        style={{ width: look.node, height: look.node, fontSize: age === 'kids' ? 22 : 17, ...(ready ? { background: `radial-gradient(circle at 35% 30%, ${theme.soft}, ${theme.accent})`, boxShadow: age === 'teens' ? `0 0 24px ${theme.soft}99` : `0 12px 24px -12px ${theme.accent}` } : {}) }}>
        {n}
      </span>
    );
  };

  const Card = ({ n }: { n: number }) => {
    const lesson = lessons[n];
    return (
      <span className={`flex min-w-0 items-center gap-3 px-4 py-3 ${look.card}`}>
        <span className="min-w-0 flex-1">
          <span dir="ltr" className={`block text-start text-[15px] font-semibold leading-snug ${ink} line-clamp-2`}>{plan[n - 1]}</span>
          {lesson ? (
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${lesson.reviewed ? 'bg-teal/15 text-teal' : 'bg-[#E5A93C]/20 text-[#B07514]'}`}>{lesson.reviewed ? L('Ready', 'جاهز') : L('Draft', 'مسودة')}</span>
          ) : (
            <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${muted}`}><Lock className="h-3 w-3" aria-hidden="true" />{L('Coming soon', 'قريباً')}</span>
          )}
        </span>
        {lesson && <PlayCircle className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" style={{ color: look.dark ? theme.soft : theme.accent }} aria-hidden="true" />}
      </span>
    );
  };

  const Station = ({ n, children, className, style }: { n: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
    const label = `${L('Lesson', 'الدرس')} ${n}: ${plan[n - 1]}`;
    return lessons[n]
      ? <Link to={hrefFor(n)} aria-label={label} className={`group rounded-3xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className ?? ''}`} style={style}>{children}</Link>
      : <div aria-label={`${label} · ${L('Coming soon', 'قريباً')}`} className={className} style={style}>{children}</div>;
  };

  const RoadStroke = ({ d }: { d: string }) => (
    <>
      <path d={d} fill="none" stroke={look.road} strokeWidth={look.roadW} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {look.dash && <path d={d} fill="none" stroke={look.dash} strokeWidth={3} strokeDasharray="10 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
      {age === 'teens' && <path d={d} fill="none" stroke={theme.soft} strokeWidth={2} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />}
    </>
  );

  return (
    <div className={`relative overflow-hidden rounded-[var(--r-4,28px)] px-3 py-8 sm:px-8 ${look.bg}`}>
      {!wide && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-10" style={{ insetInlineStart: `calc(0.75rem + ${look.node / 2}px - ${look.roadW / 2}px)`, width: Math.max(4, look.roadW / 2), borderRadius: 99, background: look.road }} />
      )}
      <ol className="relative">
        {parts.map((part, pi) => {
          const last = (parts[pi + 1]?.from ?? plan.length + 1) - 1;
          const numbers = Array.from({ length: last - part.from + 1 }, (_, k) => part.from + k);
          const ready = numbers.filter((n) => lessons[n]).length;
          // The winding road for this stage: from the flag (top centre) through every station to the next flag.
          const h = (numbers.length + 1) * ROW;
          const pts = [{ x: 50, y: 0 }, ...numbers.map((_, k) => ({ x: WAVE[k % WAVE.length], y: (k + 1) * ROW - ROW / 2 + 20 })), { x: 50, y: h }];
          const d = pts.map((p, k) => (k === 0 ? `M ${p.x} ${p.y}` : `C ${pts[k - 1].x} ${pts[k - 1].y + ROW / 2}, ${p.x} ${p.y - ROW / 2}, ${p.x} ${p.y}`)).join(' ');
          return (
            <li key={part.from} aria-labelledby={`stage-${pi}`} className={pi ? 'mt-2' : ''}>
              <motion.div className={`relative z-10 flex ${wide ? 'justify-center' : 'justify-start'} pb-3`} {...enter()}>
                <div className="flex max-w-xl items-center gap-3 rounded-full px-4 py-2.5 text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)]" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${pi % 2 ? '#3B2219' : theme.soft})` }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20"><Flag className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">{L(`Stage ${pi + 1}`, `المرحلة ${pi + 1}`)} · {L(`Lessons ${part.from}–${last}`, `الدروس ${part.from}–${last}`)}</span>
                    <span id={`stage-${pi}`} className="block font-display text-base font-bold leading-tight sm:text-lg">{ar ? part.titleAr : part.title}</span>
                  </span>
                  <span className="ms-2 shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold" title={L('Lessons ready to teach', 'دروس جاهزة للشرح')}>{ready}/{numbers.length}</span>
                </div>
              </motion.div>

              {wide ? (
                <div dir="ltr" className="relative" style={{ height: h - ROW / 2 }}>
                  <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${h - ROW / 2}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <RoadStroke d={d} />
                  </svg>
                  <ol>
                    {numbers.map((n, k) => {
                      const x = WAVE[k % WAVE.length];
                      const cardRight = x <= 50; // the card sits on the side with more room
                      return (
                        <motion.li key={n} className="absolute" style={{ top: (k + 1) * ROW - ROW / 2 + 20 - look.node / 2, left: `${x}%` }} {...enter(0.03)}>
                          <Station n={n} className="flex items-center gap-4" style={{ transform: `translateX(${cardRight ? -look.node / 2 : `calc(-100% + ${look.node / 2}px)`})`, flexDirection: cardRight ? 'row' : 'row-reverse' }}>
                            <Node n={n} />
                            <span className="w-[min(330px,34vw)]"><Card n={n} /></span>
                          </Station>
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <ol className="space-y-3 pb-4">
                  {numbers.map((n) => (
                    <motion.li key={n} {...enter()}>
                      <Station n={n} className="grid grid-cols-[auto_1fr] items-center gap-3"><Node n={n} /><Card n={n} /></Station>
                    </motion.li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}

        <li className={`relative z-10 flex ${wide ? 'justify-center' : 'justify-start'} pt-2`} aria-label={L('Finish', 'خط النهاية')}>
          <div className="flex items-center gap-3 rounded-[24px] px-5 py-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]" style={{ background: `linear-gradient(135deg, ${theme.soft}, ${theme.accent})` }}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-white"><Trophy className="h-5 w-5" aria-hidden="true" /></span>
            <span className="text-white">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">{L('The finish line', 'خط النهاية')}</span>
              <span className="flex items-center gap-1.5 font-display text-lg font-bold"><Icon className="h-4 w-4" aria-hidden="true" />{ar ? theme.finishAr : theme.finishEn}</span>
            </span>
          </div>
        </li>
      </ol>
    </div>
  );
}
