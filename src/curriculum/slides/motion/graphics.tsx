import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CountUp, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Orb, FactCard, bezier, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';

/* ======================================================================================================================
 * The man no one knew: a detective board. The road leaves dust on every traveller; this man arrives clean (so he lives
 * close by); the town is a web where everyone knows everyone; he connects to no one (so he is not from here); the two
 * facts collide.
 * ==================================================================================================================== */

const FAR = [800, 760];
const MADINAH = [1330, 330];
const ROUTE = bezier(FAR, [880, 560], [1180, 640], [MADINAH[0] - 70, MADINAH[1] + 60], 48);
const routeD = `M ${FAR[0]} ${FAR[1]} C 880 560, 1180 640, ${MADINAH[0] - 70} ${MADINAH[1] + 60}`;

const TOWN_C = { x: 1110, y: 500 };
const PEOPLE = Array.from({ length: 13 }, (_, i) => {
  const a = (i / 13) * Math.PI * 2 + 0.3;
  const r = i % 3 === 0 ? 150 : 235;
  return { x: TOWN_C.x + Math.cos(a) * r * 1.25, y: TOWN_C.y + Math.sin(a) * r * 0.82 };
});
const TIES = PEOPLE.flatMap((p, i) => PEOPLE.slice(i + 1).map((q, j) => ({ p, q, k: i * 13 + j })).filter(({ p: a, q: b }) => Math.hypot(a.x - b.x, a.y - b.y) < 300));
const NEAREST = [...PEOPLE].sort((a, b) => Math.hypot(a.x - TOWN_C.x, a.y - TOWN_C.y) - Math.hypot(b.x - TOWN_C.x, b.y - TOWN_C.y)).slice(0, 5);

export function StrangerGraphic({ lines, interaction, tone }: GraphicProps) {
  const reduce = useReduce();
  const map = lines >= 1 && lines < 2;
  const town = lines >= 2;
  return (
    <motion.div className="pointer-events-none absolute inset-0" animate={{ opacity: interaction ? 0.3 : 1 }} transition={{ duration: 0.6 }}>
      {/* 1. The road: a traveller crosses the desert and arrives covered in its dust. */}
      <AnimatePresence>
        {map && (
          <motion.div key="map" className="absolute inset-0" style={{ transformOrigin: `${MADINAH[0]}px ${MADINAH[1]}px` }}
            initial={{ opacity: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 3.2, transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] } }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
              <motion.path d={routeD} fill="none" stroke={soft(tone)} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />
              <circle cx={MADINAH[0]} cy={MADINAH[1]} r={86} fill="rgba(197,31,36,0.06)" stroke={CRIMSON} strokeWidth={1.5} strokeDasharray="4 6" />
            </svg>
            <Label x={FAR[0]} y={FAR[1] + 34} text="A far town" tone={tone} />
            <Label x={MADINAH[0]} y={MADINAH[1] - 120} text="Madinah" tone={tone} strong />
            {/* dust left along the road, thickening as the miles add up */}
            {ROUTE.filter((_, i) => i % 2 === 0).map((p, i) => (
              <motion.span key={i} className="absolute rounded-full" style={{ left: p.x, top: p.y, width: 6 + i * 0.4, height: 6 + i * 0.4, background: '#B98A5A' }}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.7, 0.25], scale: [0, 1, 1.8], y: [0, -6, -14] }} transition={{ duration: 1.6, delay: reduce ? 0 : 0.5 + i * 0.07 }} />
            ))}
            <motion.div className="absolute" style={{ left: 0, top: 0 }}
              initial={{ x: FAR[0], y: FAR[1] }} animate={{ x: ROUTE.map((p) => p.x), y: ROUTE.map((p) => p.y) }} transition={{ duration: reduce ? 0 : 2, delay: 0.5, ease: 'easeInOut' }}>
              <Orb size={30} style={{ filter: 'sepia(0.6) saturate(0.6)' }} />
              {/* the dust cloud that arrives with him */}
              {Array.from({ length: 10 }, (_, i) => (
                <motion.span key={i} className="absolute rounded-full" style={{ width: 10, height: 10, marginLeft: -5, marginTop: -5, background: '#C49A6C' }}
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0.5], x: Math.cos(i * 0.63) * 30, y: Math.sin(i * 0.63) * 22 }} transition={{ duration: 1, delay: reduce ? 0 : 2.3 + i * 0.03 }} />
              ))}
            </motion.div>
            <motion.div className="absolute font-sans font-semibold" style={{ left: MADINAH[0] + 30, top: MADINAH[1] + 110, fontSize: 18, color: '#8B5A2B' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 2.8 }}>
              dust · tired eyes · worn sandals
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2–5. Inside Madinah (the camera went through the circle). */}
      <AnimatePresence>
        {town && (
          <motion.div key="town" className="absolute inset-0" style={{ transformOrigin: `${TOWN_C.x}px ${TOWN_C.y}px` }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
            <motion.div className="absolute inset-0" animate={{ opacity: lines >= 5 ? 0.18 : 1 }} transition={{ duration: 0.6 }}>
              {/* the town: everyone tied to everyone */}
              {lines >= 3 && (
                <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
                  {TIES.map(({ p, q }, i) => (
                    <motion.line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={GOLD} strokeWidth={1.4} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.55 }} transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 + i * 0.03 }} />
                  ))}
                  {/* 4. he reaches for them, and no line holds */}
                  {lines >= 4 && NEAREST.map((p, i) => (
                    <motion.line key={`x${i}`} x1={TOWN_C.x} y1={TOWN_C.y} x2={p.x} y2={p.y} stroke={CRIMSON} strokeWidth={2} strokeDasharray="6 8"
                      initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: [0, 0.75, 0.75], opacity: [1, 1, 0.12] }} transition={{ duration: 1.6, delay: reduce ? 0 : 0.3 + i * 0.15, times: [0, 0.5, 1] }} />
                  ))}
                </svg>
              )}
              {lines >= 3 && PEOPLE.map((p, i) => (
                <motion.span key={i} className="absolute rounded-full" style={{ left: p.x, top: p.y, width: 18, height: 18, marginLeft: -9, marginTop: -9, background: tone === 'light' ? INK_TEXT : '#F6F1E8' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.04, ease }} />
              ))}
              {lines === 3 && <Label x={TOWN_C.x} y={TOWN_C.y + 250} text="Everyone knew everyone" tone={tone} strong />}
              {lines >= 4 && <Label x={TOWN_C.x} y={TOWN_C.y + 250} text="…and no one knew him" tone={tone} strong color={CRIMSON} />}
              {/* him: clean, untouched by any road */}
              <div className="absolute" style={{ left: TOWN_C.x, top: TOWN_C.y }}>
                <motion.div animate={lines >= 4 ? { x: [0, -5, 5, -3, 0] } : {}} transition={{ duration: 0.5, delay: 1.4 }}>
                  <Orb size={44} glow={1.4} />
                </motion.div>
                <motion.span className="absolute rounded-full" style={{ left: -22, top: -22, width: 44, height: 44, border: `2px solid ${GOLD}` }} animate={reduce ? {} : { scale: [1, 2.6], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
              </div>
            </motion.div>

            {/* the two clues, then they collide */}
            <motion.div className="absolute" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: lines >= 5 ? 0 : 0 }} transition={{ duration: 0.7, delay: 0.9, ease }}>
              <motion.div animate={lines >= 5 ? { x: 115, y: 210, rotate: -3 } : { x: 0, y: 0, rotate: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.9 }}>
                <FactCard tag="Clue 1" fact="No sign of travel" means="he lives close by" tone={tone} style={{ left: 720, top: 150 }} />
              </motion.div>
            </motion.div>
            {lines >= 4 && (
              <motion.div className="absolute" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 1.6, ease }}>
                <motion.div animate={lines >= 5 ? { x: -130, y: 210, rotate: 3 } : { x: 0, y: 0, rotate: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.9 }}>
                  <FactCard tag="Clue 2" fact="No one knew him" means="he is not from here" tone={tone} style={{ left: 1180, top: 150 }} />
                </motion.div>
              </motion.div>
            )}
            {lines >= 5 && (
              <>
                <motion.div className="absolute flex items-center justify-center rounded-full font-sans font-bold" style={{ left: 1110 - 34, top: 410 - 34, width: 68, height: 68, background: CRIMSON, color: '#fff', fontSize: 36, boxShadow: '0 0 40px 10px rgba(197,31,36,0.45)' }}
                  initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 0.6, delay: 0.7 }}>≠</motion.div>
                <motion.p className="absolute m-0 text-center font-serif" style={{ left: 760, width: 700, top: 560, fontSize: 64, lineHeight: 1, color: ink(tone) }}
                  initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 1.1, ease }}>
                  So who <span style={{ color: CRIMSON }}>is he?</span>
                </motion.p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Label({ x, y, text, tone, strong, color }: { x: number; y: number; text: string; tone: GraphicProps['tone']; strong?: boolean; color?: string }) {
  return (
    <motion.span className="absolute -translate-x-1/2 whitespace-nowrap font-sans" style={{ left: x, top: y, fontSize: strong ? 24 : 18, fontWeight: strong ? 700 : 600, color: color ?? (strong ? ink(tone) : soft(tone)) }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4, ease }}>
      {text}
    </motion.span>
  );
}

/* ======================================================================================================================
 * Islam: the building. The orb lands on an empty plot; the two testimonies are the foundation everything stands on;
 * four columns rise from it; the roof settles and the word Islam lights. Then his reply: "you are right".
 * ==================================================================================================================== */

const SLAB = { x: 800, y: 590, w: 640, h: 56 };
const DEPTH = { x: 34, y: -22 };
const COLS = [880, 1030, 1180, 1330];
const COL = { w: 76, h: 290 };
const PILLAR_INFO = [
  { en: 'The two testimonies', ar: 'الشهادتان', gloss: 'The foundation. Everything else stands on it.' },
  { en: 'Salah', ar: 'الصلاة', gloss: 'Five times a day, every day: the pillar you return to most.' },
  { en: 'Zakah', ar: 'الزكاة', gloss: 'A share of savings held for a year, given to those in need.' },
  { en: 'Fasting Ramadan', ar: 'الصوم', gloss: 'One month a year, from dawn to sunset.' },
  { en: 'Hajj', ar: 'الحج', gloss: 'Once in a lifetime, for whoever is able to make the journey.' },
];

/** A block in a simple oblique projection: a front face and a lit top face. */
export function Block({ x, y, w, h, front, top, side }: { x: number; y: number; w: number; h: number; front: string; top: string; side: string }) {
  return (
    <>
      <polygon points={`${x},${y} ${x + DEPTH.x},${y + DEPTH.y} ${x + w + DEPTH.x},${y + DEPTH.y} ${x + w},${y}`} fill={top} />
      <polygon points={`${x + w},${y} ${x + w + DEPTH.x},${y + DEPTH.y} ${x + w + DEPTH.x},${y + h + DEPTH.y} ${x + w},${y + h}`} fill={side} />
      <rect x={x} y={y} width={w} height={h} fill={front} />
    </>
  );
}

export function IslamGraphic({ lines, items, interaction, tone }: GraphicProps) {
  const reduce = useReduce();
  const roof = items >= 5;
  const cur = Math.min(items, 5) - 1;
  const roofY = SLAB.y - COL.h;
  return (
    <>
    {/* his reply: he asks, hears the answer, and confirms it */}
    {interaction && <ConfirmChain tone={tone} />}
    <motion.div className="pointer-events-none absolute inset-0" style={{ transformOrigin: '1120px 700px' }}
      animate={interaction ? { scale: 0.7, x: 120, y: 120, opacity: 0.35 } : { scale: 1, y: 0, opacity: 1 }} transition={{ duration: 0.8, ease }}>
      {lines >= 1 && (
        <>
          {/* the empty plot, and the orb that lands on it */}
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
            <motion.polygon points={`${SLAB.x - 30},${SLAB.y + SLAB.h} ${SLAB.x - 30 + DEPTH.x * 2},${SLAB.y + SLAB.h + DEPTH.y * 2} ${SLAB.x + SLAB.w + 30 + DEPTH.x * 2},${SLAB.y + SLAB.h + DEPTH.y * 2} ${SLAB.x + SLAB.w + 30},${SLAB.y + SLAB.h}`}
              fill="none" stroke={soft(tone)} strokeWidth={1.5} strokeDasharray="5 7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
            {/* foundation */}
            {items >= 1 && (
              <motion.g initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ duration: 0.7, ease }} style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
                <Block x={SLAB.x} y={SLAB.y} w={SLAB.w} h={SLAB.h} front={CRIMSON} top="#E2564A" side="#8B1A1E" />
              </motion.g>
            )}
            {/* columns rise from it */}
            {COLS.map((cx, i) => items >= i + 2 && (
              <motion.g key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.9 }} style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
                <Block x={cx - COL.w / 2} y={SLAB.y - COL.h} w={COL.w} h={COL.h} front={i + 1 === cur ? GOLD : '#E9DCC8'} top="#FFF4DD" side={i + 1 === cur ? '#B47A1E' : '#C9B79D'} />
              </motion.g>
            ))}
            {/* the roof settles */}
            {roof && (
              <motion.g initial={{ y: -160, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay: 0.9 }}>
                <polygon points={`${SLAB.x - 20},${roofY} ${SLAB.x + SLAB.w / 2 + DEPTH.x / 2},${roofY - 120} ${SLAB.x + SLAB.w + 20 + DEPTH.x},${roofY + DEPTH.y}`} fill="url(#ribbonRoof)" />
                <defs>
                  <linearGradient id="ribbonRoof" x1="0" x2="1"><stop offset="0" stopColor={CRIMSON} /><stop offset="0.33" stopColor="#B4552F" /><stop offset="0.66" stopColor={GOLD} /><stop offset="1" stopColor="#087D91" /></linearGradient>
                </defs>
                <text x={SLAB.x + SLAB.w / 2 + 14} y={roofY - 34} textAnchor="middle" fill="#FFF8EC" style={{ font: '700 34px var(--font-serif)', letterSpacing: '0.2em' }}>ISLAM</text>
              </motion.g>
            )}
          </svg>
          <motion.div className="absolute" style={{ left: SLAB.x + SLAB.w / 2, top: SLAB.y + 10 }}
            initial={{ y: -560, opacity: 0 }} animate={items >= 1 ? { y: 0, opacity: 0, scale: 3 } : { y: [-560, 0, -40, 0], opacity: 1 }} transition={{ duration: reduce ? 0 : items >= 1 ? 0.4 : 1.2, times: items >= 1 ? undefined : [0, 0.6, 0.8, 1], ease: 'easeOut' }}>
            <Orb size={46} />
          </motion.div>
          {items === 0 && <Label x={SLAB.x + SLAB.w / 2} y={SLAB.y + 110} text="An empty plot. What holds a Muslim's life up?" tone={tone} />}
        </>
      )}

      {/* the column labels sit between the columns and the roof */}
      {COLS.map((cx, i) => items >= i + 2 && (
        <motion.div key={i} className="absolute -translate-x-1/2 text-center" style={{ left: cx + DEPTH.x / 2, top: SLAB.y - COL.h - 92 }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: roof ? 0 : i + 1 === cur ? 1 : 0.55, y: 0 }} transition={{ duration: 0.5, ease }}>
          <p className="m-0 whitespace-nowrap font-sans font-bold" style={{ fontSize: 20, color: ink(tone) }}>{PILLAR_INFO[i + 1].en}</p>
          <p lang="ar" dir="rtl" className="m-0 font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 20, color: '#8B1A1E' }}>{PILLAR_INFO[i + 1].ar}</p>
        </motion.div>
      ))}
      {items >= 1 && (
        <motion.div className="absolute -translate-x-1/2 text-center" style={{ left: SLAB.x + SLAB.w / 2, top: SLAB.y + SLAB.h + 18 }} initial={{ opacity: 0 }} animate={{ opacity: cur === 0 ? 1 : 0.6 }}>
          <span className="whitespace-nowrap font-sans font-bold" style={{ fontSize: 20, color: '#FFF' , background: CRIMSON, padding: '4px 14px', borderRadius: 999 }}>The two testimonies · الشهادتان</span>
        </motion.div>
      )}

      {/* the pillar being added, with what it is */}
      <AnimatePresence mode="wait">
        {items >= 1 && !interaction && (
          <motion.div key={cur} className="absolute" style={{ left: 1080, top: 712, width: 440 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease }}>
            <p className="m-0 font-sans" style={{ fontSize: 19, lineHeight: 1.35, color: ink(tone) }}><b>{PILLAR_INFO[cur].en}.</b> {PILLAR_INFO[cur].gloss}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {items >= 1 && (
        <div className="absolute flex items-baseline gap-2" style={{ left: 800, top: 708 }}>
          <CountUp to={items} size={64} color={CRIMSON} />
          <span className="font-sans font-semibold" style={{ fontSize: 18, color: soft(tone) }}>of 5 pillars</span>
        </div>
      )}

    </motion.div>
    </>
  );
}

function ConfirmChain({ tone }: { tone: GraphicProps['tone'] }) {
  const steps = ['He asks', 'He hears the answer', '“You are right.”'];
  return (
    <div className="absolute flex items-center gap-3" style={{ left: 760, top: 250, transform: 'scale(1.3)', transformOrigin: 'left top' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <motion.span className="font-sans font-bold" style={{ fontSize: 22, color: soft(tone) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.5 }}>→</motion.span>}
          <motion.span className="whitespace-nowrap rounded-full font-sans font-bold" style={{ fontSize: 18, padding: '8px 16px', background: i === 2 ? CRIMSON : '#FFFDF8', color: i === 2 ? '#fff' : INK_TEXT, boxShadow: i === 2 ? '0 0 30px 6px rgba(197,31,36,0.4)' : '0 10px 24px -14px rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0, y: 12, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3 + i * 0.5, duration: 0.5, ease }}>{s}</motion.span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ======================================================================================================================
 * Ihsan: two steps. Light pours on the higher step (as if you see Him); the floor beneath it holds (He sees you); the
 * worshipper moves between them; the word "see" is kept for the rest of the lesson.
 * ==================================================================================================================== */

const FLOOR = { x: 760, y: 620, w: 760, h: 70 };
const UPPER = { x: 1120, y: 400, w: 400, h: 220 };

export function IhsanGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const high = lines >= 2;
  const floor = lines >= 3;
  const orbAt = lines >= 3 ? { x: 900, y: FLOOR.y - 24 } : { x: UPPER.x + 200, y: UPPER.y - 24 };
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* light pouring onto the higher step */}
      <motion.div className="absolute" style={{ left: UPPER.x - 160, top: -40, width: UPPER.w + 320, height: UPPER.y + 60, background: 'linear-gradient(180deg, rgba(255,226,160,0) 0%, rgba(255,226,160,0.30) 60%, rgba(255,214,130,0.55) 100%)', clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)', filter: 'blur(6px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: high ? 1 : 0 }} transition={{ duration: 1.4 }} />
      {lines >= 1 && (
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
          <motion.rect x={FLOOR.x} y={FLOOR.y} width={FLOOR.w} height={FLOOR.h} rx={6} stroke={TEAL} strokeWidth={2} initial={{ pathLength: 0, fill: 'rgba(8,125,145,0)' }} animate={{ pathLength: 1, fill: floor ? 'rgba(8,125,145,0.85)' : 'rgba(8,125,145,0)' }} transition={{ duration: 1.2, ease }} />
          <motion.rect x={UPPER.x} y={UPPER.y} width={UPPER.w} height={UPPER.h} rx={6} stroke={GOLD} strokeWidth={2} initial={{ pathLength: 0, fill: 'rgba(229,169,60,0)' }} animate={{ pathLength: 1, fill: high ? 'rgba(229,169,60,0.92)' : 'rgba(229,169,60,0)' }} transition={{ duration: 1.2, delay: 0.3, ease }} />
        </svg>
      )}
      {lines === 1 && (
        <>
          <Label x={UPPER.x + UPPER.w / 2} y={UPPER.y + 90} text="Step 2" tone={tone} />
          <Label x={FLOOR.x + 180} y={FLOOR.y + 18} text="Step 1" tone={tone} />
        </>
      )}
      {high && (
        <motion.div className="absolute text-center" style={{ left: UPPER.x, top: UPPER.y + 60, width: UPPER.w }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6, ease }}>
          <p className="m-0 font-serif" style={{ fontSize: 40, lineHeight: 1, color: '#3A1F08' }}>As if you see Him</p>
          <p lang="ar" dir="rtl" className="m-0 mt-2 font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 30, color: '#6B1414' }}>كَأنَّك تَراه</p>
        </motion.div>
      )}
      {floor && (
        <motion.div className="absolute flex items-center gap-5" style={{ left: FLOOR.x + 40, top: FLOOR.y + 10 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease }}>
          <span className="font-serif" style={{ fontSize: 34, color: '#F6F1E8' }}>He sees you</span>
          <span lang="ar" dir="rtl" className="font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 26, color: '#CFEFF3' }}>فإنَّه يَراك</span>
        </motion.div>
      )}
      {floor && <Label x={FLOOR.x + FLOOR.w / 2} y={FLOOR.y + FLOOR.h + 18} text="the floor you never fall below" tone={tone} />}
      {/* the worshipper: up on the bright days, never below the floor on the hard ones */}
      {high && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 900, y: FLOOR.y - 24, opacity: 0 }}
          animate={{ x: orbAt.x, y: orbAt.y, opacity: 1 }} transition={{ duration: reduce ? 0 : 1.1, ease: [0.34, 1.3, 0.64, 1] }}>
          <Orb size={40} />
        </motion.div>
      )}
      {floor && (
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
          <motion.path d={`M 930 ${FLOOR.y - 50} C 980 490, 1060 400, ${UPPER.x + 120} ${UPPER.y - 40}`} fill="none" stroke={GOLD} strokeWidth={2.5} strokeDasharray="4 9" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 1.2, ease }} />
        </svg>
      )}
      {floor && <Label x={960} y={430} text="and you climb back" tone={tone} />}
      {/* 4. the word "see" is pocketed for later */}
      {lines >= 4 && (
        <motion.div className="absolute rounded-full font-serif" style={{ left: 0, top: 0, padding: '10px 26px', fontSize: 44, color: '#3A1F08', background: GOLD, boxShadow: '0 0 50px 12px rgba(229,169,60,0.55)' }}
          initial={{ x: 300, y: 260, scale: 0.4, opacity: 0 }} animate={{ x: 1290, y: 190, scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 1.3 }}>
          see
        </motion.div>
      )}
      {lines >= 4 && <Label x={1360} y={270} text="keep this word" tone={tone} strong />}
    </div>
  );
}
