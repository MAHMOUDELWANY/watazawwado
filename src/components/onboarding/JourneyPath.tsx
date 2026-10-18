import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Footprints, Compass, TreePalm, Mountain } from 'lucide-react';
import { levelsFor } from './subjects';

/**
 * Current level as a journey: a winding road with four stops, from the start of the road to the
 * summit. The road lights up from the start to the chosen stop and a traveller dot walks there.
 * Mirrored for right-to-left so the road always starts where reading starts.
 * With a `subject`, the stops are that subject's own levels (subjects.ts); a subject with one level shows nothing.
 */

export const LEVELS = [
  { id: 'beginner', en: 'Beginner', ar: 'مبتدئ', stopEn: 'Start of the road', stopAr: 'أول الطريق', descEn: 'Starting from the letters, or with no background yet.', descAr: 'بادئ من الحروف، أو من غير خلفية قبل كده.', Icon: Footprints },
  { id: 'elementary', en: 'Elementary', ar: 'أساسي', stopEn: 'On the path', stopAr: 'على الدرب', descEn: 'Knows the letters and simple words; building fluency.', descAr: 'بيعرف الحروف والكلمات البسيطة، وبيبني الطلاقة.', Icon: Compass },
  { id: 'intermediate', en: 'Intermediate', ar: 'متوسط', stopEn: 'At the oasis', stopAr: 'عند الواحة', descEn: 'Reads or speaks with some hesitation; needs polishing.', descAr: 'بيقرأ أو بيتكلم مع شوية تردد، ومحتاج ضبط.', Icon: TreePalm },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم', stopEn: 'Near the summit', stopAr: 'قريب من القمة', descEn: 'Fluent; deepening rules, memorization or advanced study.', descAr: 'متمكن، وبيتعمق في الأحكام أو الحفظ أو الدراسة المتقدمة.', Icon: Mountain }
];

const W = 360;
const H = 150;
const ROAD = 'M 26 118 C 80 124, 92 64, 140 72 S 214 128, 254 96 S 312 34, 334 34';
const STOPS = [0, 0.36, 0.69, 1];
const ICONS = [Footprints, Compass, TreePalm, Mountain];
const stopsFor = (n: number) => (n === 4 ? STOPS : Array.from({ length: n }, (_, i) => (n === 1 ? 0 : i / (n - 1))));

export function JourneyPath({ value, onChange, isAr, name, subject }: { value: string; onChange: (id: string) => void; isAr: boolean; name: string; subject?: string }) {
  const reduce = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const own = subject ? levelsFor(subject) : [];
  const levels = own.length
    ? own.map((l, i) => ({ id: l.id, en: l.en, ar: l.ar, stopEn: l.en, stopAr: l.ar, descEn: l.descEn, descAr: l.descAr, Icon: ICONS[Math.round((i * 3) / Math.max(1, own.length - 1))] }))
    : LEVELS;
  const stops = stopsFor(levels.length);
  const at = Math.max(0, levels.findIndex((l) => l.id === value));

  // A level that this subject does not offer moves to its first level, so the saved level always fits the subject.
  React.useEffect(() => {
    if (!levels.some((l) => l.id === value)) onChange(levels[0].id);
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    setPoints(stops.map((f) => {
      const pt = p.getPointAtLength(len * f);
      return { x: pt.x, y: pt.y };
    }));
  }, [levels.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i: number) => {
    const next = levels[Math.min(levels.length - 1, Math.max(0, i))];
    onChange(next.id);
    document.getElementById(`${name}-${next.id}`)?.focus();
  };
  const left = (x: number) => `${((isAr ? W - x : x) / W) * 100}%`;
  const top = (y: number) => `${(y / H) * 100}%`;

  if (levels.length === 1) return null;

  return (
    <div>
      <div className="relative w-full mx-auto max-w-xl" style={{ aspectRatio: `${W} / ${H + 40}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-x-0 top-0 w-full" style={{ transform: isAr ? 'scaleX(-1)' : undefined }} aria-hidden="true">
          <path ref={pathRef} d={ROAD} fill="none" stroke="#D8C6AE" strokeOpacity={0.55} strokeWidth={10} strokeLinecap="round" />
          <path d={ROAD} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 7" />
          <motion.path
            d={ROAD}
            fill="none"
            stroke="#087D91"
            strokeWidth={6}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: Math.max(0.001, stops[at]) }}
            transition={reduce ? { duration: 0 } : { duration: 0.7, ease: 'easeInOut' }}
          />
        </svg>

        <div role="radiogroup" aria-label={isAr ? 'مستواك الحالي' : 'Your current level'}>
          {points.length === levels.length && levels.map((l, i) => {
            const selected = i === at;
            const reached = i <= at;
            const { Icon } = l;
            return (
              <button
                key={l.id}
                id={`${name}-${l.id}`}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(l.id)}
                onKeyDown={(e) => {
                  const fwd = isAr ? 'ArrowLeft' : 'ArrowRight';
                  const back = isAr ? 'ArrowRight' : 'ArrowLeft';
                  if (e.key === fwd || e.key === 'ArrowUp') { e.preventDefault(); pick(at + 1); }
                  if (e.key === back || e.key === 'ArrowDown') { e.preventDefault(); pick(at - 1); }
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 cursor-pointer focus-visible:outline-none"
                style={{ left: left(points[i].x), top: top(points[i].y) }}
              >
                <span
                  className={`grid place-items-center w-11 h-11 rounded-full border-2 transition-colors group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-primary ${
                    selected ? 'bg-[#C51F24] border-[#C51F24] text-white shadow-[0_0_0_6px_rgba(197,31,36,.18)]'
                      : reached ? 'bg-[#087D91] border-[#087D91] text-white'
                      : 'bg-surface border-[#D8C6AE] text-muted-foreground group-hover:border-[#087D91]'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className={`text-[11px] sm:text-xs leading-tight text-center whitespace-nowrap ${selected ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                  {isAr ? l.ar : l.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={levels[at].id}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-center"
        aria-live="polite"
      >
        <p className="font-display text-lg font-bold text-foreground">{isAr ? levels[at].stopAr : levels[at].stopEn}</p>
        <p className="text-sm text-muted-foreground">{isAr ? levels[at].descAr : levels[at].descEn}</p>
      </motion.div>
    </div>
  );
}
