import React from 'react';
import { motion } from 'motion/react';
import { useCue } from '../sfx';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type Tone } from './Stage';
import { Ar, DEEP, Icon } from './kit';

/**
 * Pieces shared by the Adults lesson stages from Lesson 2 on: the typed quote card for a public figure (style guide:
 * quote cards, never a portrait), Zad al-Yaqeen as a notebook that is read back or written in, and the arched doors
 * of a choice.
 */

/** Types `text` out once `on` turns true (instantly with reduced motion). */
export function useTyped(text: string, on: boolean, speed = 38) {
  const reduce = useReduce();
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!on) { setN(0); return; }
    if (reduce) { setN(text.length); return; }
    const t = window.setInterval(() => setN((k) => (k >= text.length ? k : k + 1)), speed);
    return () => window.clearInterval(t);
  }, [on, text, speed, reduce]);
  return text.slice(0, n);
}

/** A public figure's words as a typeset card: the quote typed in line by line, then the name and the source. */
export function QuoteCard({ x, y, w = 700, quote, name, source, on = true, tone = 'light', size = 30, marks = [], dim = false }: {
  x: number; y: number; w?: number; quote: string; name: string; source: string; on?: boolean; tone?: Tone; size?: number;
  /** Phrases underlined in crimson once the card is fully typed. */
  marks?: string[]; dim?: boolean;
}) {
  const typed = useTyped(quote, on);
  const done = typed.length === quote.length;
  const parts = done && marks.length ? quote.split(new RegExp(`(${marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)) : [typed];
  return (
    <motion.figure className="pointer-events-none absolute m-0 rounded-[26px]" style={{ left: x, top: y, width: w, padding: '28px 34px 24px', background: tone === 'light' ? '#FFFDF8' : 'rgba(255,253,248,0.97)', boxShadow: '0 40px 80px -40px rgba(60,20,10,0.55), 0 0 0 1px rgba(31,22,18,0.06)' }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: dim ? 0.55 : 1, y: 0 }} transition={{ duration: 0.7, ease }}>
      <span className="absolute left-0 top-6 bottom-6 w-[5px] rounded-full" style={{ background: `linear-gradient(180deg, ${CRIMSON}, ${GOLD}, ${TEAL})` }} />
      <span className="absolute font-serif" style={{ left: 22, top: -18, fontSize: 96, lineHeight: 1, color: GOLD }}>“</span>
      <blockquote className="m-0 font-serif" style={{ fontSize: size, lineHeight: 1.28, color: INK_TEXT, minHeight: size * 2.6 }}>
        {parts.map((p, i) => marks.includes(p) ? (
          <span key={i} className="relative" style={{ color: CRIMSON }}>
            {p}
            <motion.span className="absolute bottom-0 left-0 h-[3px] w-full origin-left rounded-full" style={{ background: CRIMSON }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.2 + i * 0.2, ease }} />
          </span>
        ) : <React.Fragment key={i}>{p}</React.Fragment>)}
        {!done && on && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span>}
      </blockquote>
      <motion.figcaption className="mt-4 font-sans" initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0 }} transition={{ duration: 0.6 }}>
        <span className="block font-bold" style={{ fontSize: 19, color: INK_TEXT }}>{name}</span>
        <span className="block font-semibold" style={{ fontSize: 15, color: soft('light') }}>{source}</span>
      </motion.figcaption>
    </motion.figure>
  );
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Zad al-Yaqeen. `read`: last week's page lies open with its line already written and the habit's days ticked, for the
 * Spark. `write`: a new page, the line types itself in, then this week's habit row. Previous lines stay on the left page.
 */
export function Notebook({ lines, mode, lesson, prior, ticks = 3, tone = 'light' }: {
  lines: number; mode: 'read' | 'write'; lesson: number; prior: string[]; ticks?: number; tone?: Tone;
}) {
  useCue('page', lines >= 1, 0.2);
  useCue('pen', mode === 'write' && lines >= 2, 0.3);
  useCue('chime', lines >= 3, 0.4);
  const FIRST = 'I am now certain that…';
  const line = useTyped(FIRST, mode === 'write' && lines >= 2, 70);
  if (lines < 1) return null;
  const read = mode === 'read';
  return (
    <div className="pointer-events-none absolute" style={{ left: 800, top: 170, width: 680, height: 520, perspective: 1600 }}>
      <div className="absolute inset-0 rounded-[18px]" style={{ background: '#FFFBF2', boxShadow: '0 40px 80px -40px rgba(40,10,5,0.6)' }}>
        <div className="absolute bottom-6 left-1/2 top-6 w-px" style={{ background: 'rgba(31,22,18,0.15)' }} />
        {/* left page: the title and every line written so far */}
        <div className="absolute left-8 top-8 w-[290px]">
          <Ar size={34}>زاد اليقين</Ar>
          <p className="m-0 font-serif" style={{ fontSize: 26, color: INK_TEXT }}>Zad al-Yaqeen</p>
          <div className="mt-5 space-y-3">
            {prior.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.25 }}>
                <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: CRIMSON }}>Lesson {i + 1}</p>
                <p className="m-0 font-serif italic" style={{ fontSize: 19, lineHeight: 1.25, color: DEEP }}>I am now certain that {p}</p>
              </motion.div>
            ))}
          </div>
        </div>
        {/* right page: last week's habit (read) or today's line (write) */}
        <div className="absolute right-8 top-8 w-[290px]">
          <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 12, letterSpacing: '0.16em', color: soft('light') }}>{read ? `Lesson ${lesson - 1} · this week` : `Lesson ${lesson} · today`}</p>
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="mt-[34px] border-b" style={{ borderColor: 'rgba(31,22,18,0.12)' }} />)}
          {!read && lines >= 2 && (
            <p className="absolute left-0 top-[34px] m-0 w-[290px] font-serif italic" style={{ fontSize: 24, color: DEEP }}>
              {line}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>|</motion.span>
            </p>
          )}
          {read && lines >= 2 && (
            <motion.p className="absolute left-0 top-[40px] m-0 w-[290px] font-sans font-semibold" style={{ fontSize: 18, lineHeight: 1.35, color: INK_TEXT }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              My habit: <span style={{ color: TEAL }}>how many days?</span>
            </motion.p>
          )}
        </div>
        {(read ? lines >= 2 : lines >= 3) && (
          <div className="absolute bottom-8 right-8 w-[290px]">
            <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 12, letterSpacing: '0.16em', color: CRIMSON }}>{read ? 'Last week' : 'One habit this week'}</p>
            <div className="mt-3 flex gap-2">
              {DAYS.map((d, i) => {
                const on = read && i < ticks;
                return (
                  <motion.div key={i} className="flex h-[36px] w-[36px] items-center justify-center rounded-[9px] font-sans font-bold" style={{ border: `2px solid ${on ? TEAL : 'rgba(31,22,18,0.2)'}`, background: on ? TEAL : 'transparent', color: on ? '#fff' : INK_TEXT, fontSize: 14 }}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2 + i * 0.12, type: 'spring', bounce: 0.4 }}>{on ? '✓' : d}</motion.div>
                );
              })}
            </div>
          </div>
        )}
        {/* back to the source: a gold loop that comes round to the first line again */}
        {read && lines >= 3 && (
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 680 520">
            <motion.path d="M 600 470 C 680 520, 700 300, 560 250 S 300 140, 200 150" fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }} />
            <motion.text x={380} y={390} fontFamily="var(--font-serif)" fontSize={22} fill={DEEP} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>back to the source</motion.text>
          </svg>
        )}
      </div>
    </div>
  );
}

/** An arched door: closed (crossed), open (a lit way through) or waiting (dashed). */
export function Door({ x, y, w = 150, h = 230, label, sub, state, color = GOLD, delay = 0, tone = 'light', small = false }: {
  x: number; y: number; w?: number; h?: number; label?: string; sub?: string; state: 'waiting' | 'open' | 'closed' | 'lit';
  color?: string; delay?: number; tone?: Tone; small?: boolean;
}) {
  const r = w / 2;
  const d = `M 0 ${h} L 0 ${r} A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h} Z`;
  const lit = state === 'lit' || state === 'open';
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - h, width: w, height: h }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: state === 'closed' ? 0.55 : 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} width={w + 8} height={h + 8} className="absolute -left-1 -top-1 overflow-visible">
        <defs>
          <radialGradient id={`door-${x}-${y}`} cx="50%" cy="75%" r="70%">
            <stop offset="0" stopColor="#FFE7B0" stopOpacity={lit ? 1 : 0} />
            <stop offset="1" stopColor={color} stopOpacity={lit ? 0.55 : 0} />
          </radialGradient>
        </defs>
        <path d={d} fill={state === 'waiting' ? 'none' : state === 'closed' ? (tone === 'light' ? '#E9DCC8' : 'rgba(246,241,232,0.18)') : `url(#door-${x}-${y})`} stroke={color} strokeWidth={small ? 3 : 4} strokeDasharray={state === 'waiting' ? '8 10' : undefined}
          style={lit ? { filter: `drop-shadow(0 0 ${small ? 10 : 22}px ${color})` } : undefined} />
        {state === 'closed' && (
          <motion.path d={`M ${w * 0.22} ${h * 0.42} L ${w * 0.78} ${h * 0.88} M ${w * 0.78} ${h * 0.42} L ${w * 0.22} ${h * 0.88}`} stroke={CRIMSON} strokeWidth={small ? 5 : 8} strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: delay + 0.3 }} />
        )}
      </svg>
      {label && (
        <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: h + 10, width: w + 90 }}>
          <p className="m-0 font-serif" style={{ fontSize: small ? 18 : 24, lineHeight: 1.05, color: tone === 'light' ? INK_TEXT : '#F6F1E8' }}>{label}</p>
          {sub && <p className="m-0 mt-1 font-sans font-semibold" style={{ fontSize: small ? 12 : 15, lineHeight: 1.25, color: soft(tone) }}>{sub}</p>}
        </div>
      )}
    </motion.div>
  );
}

/** A small stamp that lands with weight: a rule or a verdict. */
export function Stamp({ x, y, w = 560, children, color = CRIMSON, delay = 0.2, tone = 'light' }: { x: number; y: number; w?: number; children: React.ReactNode; color?: string; delay?: number; tone?: Tone }) {
  return (
    <motion.div className="pointer-events-none absolute rounded-[18px] text-center font-serif" style={{ left: x, top: y, width: w, padding: '16px 22px', fontSize: 30, lineHeight: 1.15, border: `3px solid ${color}`, color: tone === 'light' ? INK_TEXT : '#F6F1E8', background: tone === 'light' ? 'rgba(255,253,248,0.92)' : 'rgba(42,14,16,0.6)', boxShadow: `0 0 40px -8px ${color}88` }}
      initial={{ opacity: 0, scale: 1.5, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: -1.5 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.6, delay }}>
      {children}
    </motion.div>
  );
}

/** A field of stars in the night stages (deterministic positions). */
export function Stars({ count = 60, box = { x: 780, y: 150, w: 740, h: 420 }, delay = 0, twinkle = true }: { count?: number; box?: { x: number; y: number; w: number; h: number }; delay?: number; twinkle?: boolean }) {
  const reduce = useReduce();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const sx = box.x + ((i * 97) % box.w), sy = box.y + ((i * 53 + (i % 3) * 17) % box.h);
        return <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: sx, top: sy, width: i % 7 ? 3 : 5, height: i % 7 ? 3 : 5, background: '#FFF4D6', boxShadow: '0 0 8px #FFE7A8' }}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: reduce || !twinkle ? 0.9 : [0, 1, 0.6, 1], scale: 1 }} transition={{ duration: 2.4, delay: delay + (i % 20) * 0.06, repeat: reduce || !twinkle ? 0 : Infinity, repeatType: 'mirror' }} />;
      })}
    </>
  );
}

/** A round icon tile used for the things people chase or reach for. */
export function Thing({ x, y, name, label, color = INK_TEXT, bg = '#FFFDF8', size = 64, delay = 0 }: { x: number; y: number; name: string; label?: string; color?: string; bg?: string; size?: number; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: x - size / 2, top: y - size / 2, width: size }}
      initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.7, delay }}>
      <span className="flex items-center justify-center rounded-full" style={{ width: size, height: size, background: bg, boxShadow: '0 12px 26px -14px rgba(40,10,5,0.55)' }}><Icon name={name} size={size * 0.5} color={color} /></span>
      {label && <span className="mt-1 whitespace-nowrap font-sans font-bold" style={{ fontSize: 14, color: 'rgba(31,22,18,0.7)' }}>{label}</span>}
    </motion.div>
  );
}
