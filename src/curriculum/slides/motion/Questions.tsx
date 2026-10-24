import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Interaction } from '../../types';
import { play } from '../sfx';
import { KineticTitle, Khatam, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Backdrop, INK_TEXT, type Tone } from './Stage';

/**
 * Adults questions (owner, 2026-10-24). A question to think about is a slim strip under the graphic, never a card on top
 * of it: the seal, the question, and a quiet "reveal" that opens the answer in place. The review is a case file, not a
 * card-sorting game: one moment from an ordinary week at a time, answered on the rings of the three levels, with the
 * reason shown after every answer and a result per level at the end.
 */

const DEEP = '#8B1A1E';
const COPPER = '#8B4935';

export function AdultAsk({ prompt, reveal, tone, onAnswer }: { prompt: string; reveal?: string; tone: Tone; onAnswer?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div className="relative overflow-hidden rounded-[22px]" style={{ background: 'rgba(255,253,248,0.97)', boxShadow: tone === 'dark' ? '0 24px 60px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(229,169,60,0.35)' : '0 24px 50px -32px rgba(60,20,10,0.6), 0 0 0 1px rgba(31,22,18,0.07)' }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
      <span className="absolute inset-y-0 left-0 w-[5px]" style={{ background: `linear-gradient(180deg, ${CRIMSON}, ${GOLD}, ${TEAL})` }} />
      <div className="flex items-center gap-5" style={{ padding: '18px 22px 18px 28px' }}>
        <Khatam size={34} color={TEAL} glow={false} />
        <div className="min-w-0 flex-1">
          <span className="font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.18em', color: TEAL }}>Think first</span>
          <p className="m-0 font-sans font-semibold" style={{ fontSize: 21, lineHeight: 1.3, color: INK_TEXT }}>{prompt}</p>
        </div>
        {reveal && !open && (
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => { setOpen(true); play('chime'); onAnswer?.(); }}
            className="shrink-0 rounded-full font-sans font-bold" style={{ padding: '10px 20px', fontSize: 17, background: INK_TEXT, color: '#FFF8EC' }}>
            Reveal
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {open && reveal && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
            <div className="flex gap-3" style={{ padding: '0 22px 18px 28px' }}>
              <motion.span className="mt-2 block h-[2px] w-10 shrink-0 origin-left" style={{ background: GOLD }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease }} />
              <motion.p className="m-0 font-serif" style={{ fontSize: 20, lineHeight: 1.35, color: COPPER }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>{reveal}</motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- the review: a case file on the rings of the three levels ---------- */

const RING_COLORS = [CRIMSON, GOLD, TEAL];
const RADII = [255, 172, 88];
const C = { x: 1130, y: 470 };

type Sort = Extract<Interaction, { kind: 'sort' }>;
export type Score = Record<string, { correct: number; total: number }>;

function score(interaction: Sort, first: Record<number, string>): Score {
  const r: Score = {};
  for (const b of interaction.bins) r[b.id] = { correct: 0, total: 0 };
  interaction.cards.forEach((c, i) => { r[c.bin].total += 1; if (first[i] === c.bin) r[c.bin].correct += 1; });
  return r;
}

/** Where the i-th answered moment sits as a dot inside its ring. */
function dotAt(bin: number, k: number) {
  // Inside Ihsan the dots sit in a small arc under its label; in the outer rings they run round the band.
  const r = bin === 2 ? 52 : (RADII[bin] + RADII[bin + 1]) / 2;
  const a = bin === 2 ? Math.PI / 2 + (k - 1) * 0.75 : -Math.PI / 2 + 0.9 + k * 0.62;
  return { x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r };
}

export function LevelsReview({ title, interaction, onCorrect, onResult }: { title: string; interaction: Sort; onCorrect: () => void; onResult: (r: Score) => void }) {
  const reduce = useReducedMotion();
  const cards = interaction.cards;
  const bins = interaction.bins;
  const [i, setI] = useState(0);
  const [first, setFirst] = useState<Record<number, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const done = i >= cards.length;
  const card = cards[Math.min(i, cards.length - 1)];
  const right = picked === card.bin;
  const answered = picked !== null;

  const choose = (bin: string) => {
    if (done || answered) return;
    setPicked(bin);
    setFirst((f) => ({ ...f, [i]: bin }));
    play(bin === card.bin ? 'correct' : 'oops');
  };
  const next = () => {
    const n = i + 1;
    setPicked(null);
    setI(n);
    if (n >= cards.length) { onResult(score(interaction, first)); onCorrect(); }
    else play('pop');
  };
  const again = () => { setI(0); setFirst({}); setPicked(null); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= bins.length) choose(bins[n - 1].id);
      if (e.key === 'Enter' && answered) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const placed = Object.entries(first).filter(([k]) => Number(k) < i || (Number(k) === i && answered)).map(([k, b]) => ({ k: Number(k), b: cards[Number(k)].bin, wasRight: cards[Number(k)].bin === b }));
  const result = score(interaction, first);
  const total = Object.entries(first).filter(([k, b]) => cards[Number(k)].bin === b).length;
  const weakest = bins.map((b) => ({ b, r: result[b.id] })).sort((a, z) => a.r.correct / Math.max(1, a.r.total) - z.r.correct / Math.max(1, z.r.total))[0];

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#F6F1E8' }}>
      <Backdrop tone="light" />
      <div className="absolute origin-top-left" style={{ left: 110, top: 96, transform: 'scale(0.46)' }}><KineticTitle text={title} size={112} color={INK_TEXT} /></div>

      {/* progress */}
      <div className="absolute flex items-center gap-2" style={{ left: 110, top: 190 }}>
        {cards.map((c, k) => {
          const f = first[k];
          const col = f === undefined ? (k === i ? GOLD : 'rgba(31,22,18,0.15)') : f === c.bin ? TEAL : CRIMSON;
          return <motion.span key={k} className="block h-[10px] rounded-full" animate={{ width: k === i && !done ? 34 : 10, background: col }} transition={{ duration: 0.4, ease }} />;
        })}
        <span className="ms-3 font-sans font-bold" style={{ fontSize: 15, color: 'rgba(31,22,18,0.55)' }}>{done ? 'Review complete' : `Moment ${i + 1} of ${cards.length}`}</span>
      </div>

      {/* the case on the left */}
      <div className="absolute" style={{ left: 110, top: 250, width: 560 }}>
        {/* Each moment mounts fresh (keyed) with its own entrance; no exit to wait on, so nothing can hold the next one. */}
        {!done ? (
            <motion.div key={i} initial={{ opacity: 0, x: -30, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease }}>
              <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.18em', color: CRIMSON }}>{interaction.prompt.split('.')[0]}</p>
              <p className="m-0 mt-3 font-serif" style={{ fontSize: 40, lineHeight: 1.15, color: INK_TEXT }}>{card.label}</p>
              {!answered && (
                <p className="m-0 mt-6 font-sans font-semibold" style={{ fontSize: 18, color: 'rgba(31,22,18,0.55)' }}>Tap the ring this moment belongs to, or press 1, 2 or 3.</p>
              )}
              {answered && (
                <motion.div className="mt-6 rounded-[20px]" style={{ padding: '18px 22px', background: '#FFFDF8', borderLeft: `5px solid ${right ? TEAL : CRIMSON}`, boxShadow: '0 20px 40px -28px rgba(60,20,10,0.6)' }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                  <p className="m-0 font-sans font-bold" style={{ fontSize: 20, color: right ? TEAL : CRIMSON }}>
                    {right ? `Yes: ${bins.find((b) => b.id === card.bin)?.label}.` : `This one is ${bins.find((b) => b.id === card.bin)?.label}.`}
                  </p>
                  {card.why && <p className="m-0 mt-2 font-sans" style={{ fontSize: 19, lineHeight: 1.4, color: INK_TEXT }}>{card.why}</p>}
                  <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={next} className="mt-4 rounded-full font-sans font-bold" style={{ padding: '10px 22px', fontSize: 17, background: INK_TEXT, color: '#FFF8EC' }}>
                    {i + 1 < cards.length ? 'Next moment →' : 'See my result →'}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
              <p className="m-0 font-serif" style={{ fontSize: 46, lineHeight: 1.1, color: INK_TEXT }}>{total} of {cards.length} <span style={{ color: TEAL }}>on the first answer.</span></p>
              <div className="mt-6 space-y-4">
                {bins.map((b, bi) => {
                  const r = result[b.id];
                  return (
                    <div key={b.id}>
                      <div className="flex items-baseline justify-between font-sans"><span className="font-bold" style={{ fontSize: 20, color: INK_TEXT }}>{b.label} <span className="font-semibold" style={{ fontSize: 15, color: 'rgba(31,22,18,0.5)' }}>· {b.hint}</span></span><span className="font-bold" style={{ fontSize: 17, color: RING_COLORS[bi] }}>{r.correct} / {r.total}</span></div>
                      <div className="mt-1 h-[12px] overflow-hidden rounded-full" style={{ background: 'rgba(31,22,18,0.08)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: RING_COLORS[bi] }} initial={{ width: 0 }} animate={{ width: `${(r.correct / Math.max(1, r.total)) * 100}%` }} transition={{ duration: 1, delay: 0.3 + bi * 0.15, ease }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {weakest && weakest.r.correct < weakest.r.total && (
                <p className="m-0 mt-5 font-sans" style={{ fontSize: 19, lineHeight: 1.4, color: INK_TEXT }}>Worth a second look with your teacher: <b style={{ color: DEEP }}>{weakest.b.label}</b> ({weakest.b.hint}).</p>
              )}
              <button type="button" onClick={again} className="mt-5 rounded-full border-2 font-sans font-bold" style={{ padding: '9px 20px', fontSize: 16, borderColor: 'rgba(31,22,18,0.2)', color: INK_TEXT }}>Review again</button>
            </motion.div>
          )}
      </div>

      {/* the rings: the map of the three levels, each one a place to answer */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900">
        {bins.map((b, bi) => {
          const isRight = answered && b.id === card.bin;
          const isWrong = answered && b.id === picked && !right;
          return (
            <motion.circle key={b.id} cx={C.x} cy={C.y} r={RADII[bi]} fill={RING_COLORS[bi]} role="button" aria-label={`${b.label}: ${b.hint}`}
              style={{ cursor: answered || done ? 'default' : 'pointer', transformOrigin: `${C.x}px ${C.y}px` }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: isRight ? 1.03 : 1, opacity: 1, x: isWrong && !reduce ? [0, -10, 10, -5, 0] : 0 }}
              whileHover={!answered && !done ? { opacity: 1, scale: 1.015 } : undefined}
              transition={{ duration: 0.5, ease, delay: answered ? 0 : 0.15 * (2 - bi) }}
              onClick={(e) => { e.stopPropagation(); choose(b.id); }} />
          );
        })}
        {answered && !right && (
          <circle cx={C.x} cy={C.y} r={RADII[bins.findIndex((b) => b.id === picked)] - 4} fill="none" stroke="#FFFDF8" strokeWidth={3} strokeDasharray="8 8" style={{ pointerEvents: 'none' }} />
        )}
        {answered && (
          <motion.circle key={i} cx={C.x} cy={C.y} r={RADII[bins.findIndex((b) => b.id === card.bin)]} fill="none" stroke="#FFE7A8" strokeWidth={5} style={{ filter: 'drop-shadow(0 0 12px rgba(255,214,140,0.9))', pointerEvents: 'none' }}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease }} />
        )}
      </svg>
      {bins.map((b, bi) => (
        <span key={b.id} className="pointer-events-none absolute -translate-x-1/2 text-center font-sans font-bold text-white" style={{ left: C.x, top: C.y - RADII[bi] + (bi === 2 ? 30 : 18), fontSize: bi === 2 ? 20 : 19 }}>
          <span className="me-1 opacity-70">{bi + 1}</span>{b.label}
          <span className="block font-semibold opacity-80" style={{ fontSize: 13 }}>{b.hint}</span>
        </span>
      ))}
      {/* each answered moment stays as a dot in its true ring */}
      {placed.map((p) => {
        const bi = bins.findIndex((b) => b.id === p.b);
        const k = placed.filter((q) => q.b === p.b && q.k < p.k).length;
        const d = dotAt(bi, k);
        return (
          <motion.span key={p.k} className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-bold" style={{ left: d.x - 15, top: d.y - 15, width: 30, height: 30, fontSize: 14, background: '#FFFDF8', color: p.wasRight ? TEAL : CRIMSON, boxShadow: '0 6px 14px -6px rgba(0,0,0,0.6)' }}
            initial={{ x: 110 - d.x + 200, y: 300 - d.y, scale: 0.4, opacity: 0 }} animate={{ x: 0, y: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.9, delay: 0.2 }}>
            {p.k + 1}
          </motion.span>
        );
      })}
    </div>
  );
}

/** Before the review starts: the rings draw themselves under the title. */
export function ReviewIntro({ title, prompt }: { title: string; prompt: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#F6F1E8' }}>
      <Backdrop tone="light" />
      <div className="absolute" style={{ left: 110, top: 230, width: 620 }}>
        <KineticTitle text={title} size={84} color={INK_TEXT} />
        <motion.p className="m-0 mt-6 font-sans" style={{ fontSize: 26, lineHeight: 1.4, color: 'rgba(31,22,18,0.7)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{prompt}</motion.p>
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900">
        {RADII.map((r, bi) => (
          <motion.circle key={r} cx={C.x} cy={C.y} r={r} fill="none" stroke={RING_COLORS[bi]} strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.3 + bi * 0.25, ease }} />
        ))}
      </svg>
    </div>
  );
}
