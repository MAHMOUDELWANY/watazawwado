import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { bezier, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Cut, Icon, Ar, CLAY } from './kit';
import { asset } from '../Art';

/**
 * Kids motion stages (2026-10-24): the Adults system in a brighter, playful voice. Our own cast (Maryam, Yusuf, Jiddo,
 * Mishmish) watch and react on the stage; things bounce a little more; labels are big and short. The visitor of
 * Lesson 1 (Jibril) is never drawn as a person: he is a glowing white light with a question mark.
 */

const KIDS = 'zad-kids/characters';
const SKY = '#0FA3B8';

/** A big rounded clue card for children: a coloured tag, the fact, and what it tells us. */
function ClueCard({ n, fact, means, color = CRIMSON, style }: { n: number; fact: string; means: string; color?: string; style?: React.CSSProperties }) {
  return (
    <div className="absolute rounded-[26px]" style={{ width: 320, padding: '16px 22px 18px', background: '#FFFDF8', boxShadow: `0 26px 50px -26px rgba(80,30,10,0.5), 0 0 0 3px ${color}22`, ...style }}>
      <span className="inline-block rounded-full font-sans font-extrabold text-white" style={{ fontSize: 15, padding: '3px 12px', background: color, letterSpacing: '0.06em' }}>CLUE {n}</span>
      <p className="m-0 mt-2 font-sans font-extrabold" style={{ fontSize: 28, lineHeight: 1.1, color: INK_TEXT }}>{fact}</p>
      <p className="m-0 mt-1 font-sans font-bold" style={{ fontSize: 20, color }}>→ {means}</p>
    </div>
  );
}

/** The visitor: a white light with a question mark (never a drawn person). */
function Visitor({ size = 64, shake = false }: { size?: number; shake?: boolean }) {
  const reduce = useReduce();
  return (
    <motion.div className="absolute" animate={shake ? { x: [0, -6, 6, -4, 0] } : {}} transition={{ duration: 0.5, delay: 1.2 }}>
      <span className="absolute flex items-center justify-center rounded-full font-serif font-bold"
        style={{ left: -size / 2, top: -size / 2, width: size, height: size, background: 'radial-gradient(circle at 40% 35%, #FFFFFF, #FFF6DC 60%, #F5DFA8)', color: GOLD, fontSize: size * 0.55, boxShadow: `0 0 ${size}px ${size / 3}px rgba(255,236,180,0.85)` }}>?</span>
      <motion.span className="absolute rounded-full" style={{ left: -size / 2, top: -size / 2, width: size, height: size, border: `3px solid ${GOLD}` }}
        animate={reduce ? {} : { scale: [1, 2.2], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
      {/* sparkles: clean, not a speck of dust */}
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="absolute" style={{ left: Math.cos(i * 1.6) * size * 0.9 - 6, top: Math.sin(i * 1.6) * size * 0.9 - 6, width: 12, height: 12, background: GOLD, clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)' }}
          animate={reduce ? {} : { scale: [0.4, 1.2, 0.4], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35 }} />
      ))}
    </motion.div>
  );
}

/** A small flat-roofed Madinah house with a door and a window, in a warm colour. */
function House({ x, y, w = 74, h = 60, color }: { x: number; y: number; w?: number; h?: number; color: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={8} fill={color} />
      <rect x={x - w / 2 - 4} y={y - h - 8} width={w + 8} height={12} rx={5} fill={color} style={{ filter: 'brightness(0.85)' }} />
      <rect x={x - 9} y={y - 26} width={18} height={26} rx={9} fill="#5A3020" opacity={0.75} />
      <rect x={x + w / 2 - 24} y={y - h + 14} width={12} height={12} rx={3} fill="#FFF3D6" />
    </g>
  );
}

/* ======================================================================================================================
 * Kids L1 · Something does not add up. A camel crosses the desert and arrives covered in dust; the visitor arrives
 * spotless (clue 1: he lives nearby); we go into little Madinah, where every house is tied to every other house; his
 * lines to them do not hold (clue 2: nobody knew him); the two clues bump: both cannot be true. Maryam watches it all.
 * ==================================================================================================================== */

const K_FAR = [800, 760];
const K_TOWN = [1300, 420];
const K_ROUTE = bezier(K_FAR, [900, 600], [1150, 640], [K_TOWN[0] - 60, K_TOWN[1] + 60], 40);
const K_ROUTE_D = `M ${K_FAR[0]} ${K_FAR[1]} C 900 600, 1150 640, ${K_TOWN[0] - 60} ${K_TOWN[1] + 60}`;
const K_HOUSES = [
  { x: 900, y: 470, c: '#E9A15A' }, { x: 1040, y: 420, c: '#D9764E' }, { x: 1190, y: 440, c: '#E5B45E' }, { x: 1330, y: 480, c: '#C9694A' },
  { x: 880, y: 620, c: '#E5B45E' }, { x: 1360, y: 640, c: '#E9A15A' }, { x: 960, y: 760, c: '#D9764E' }, { x: 1120, y: 780, c: '#C9694A' }, { x: 1280, y: 770, c: '#E5B45E' },
];
const K_CENTRE = { x: 1120, y: 590 };

export function KidsStrangerGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const desert = lines >= 1 && lines < 3;
  const town = lines >= 3;
  useCue('sand', lines >= 1);
  useCue('sparkle', lines >= 2, 0.6);
  useCue('whoosh', lines >= 3);
  useCue('strike', lines >= 4, 1.2);
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {desert && (
          <motion.div key="desert" className="absolute inset-0" style={{ transformOrigin: `${K_TOWN[0]}px ${K_TOWN[1]}px` }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 2.6, transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] } }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
              {/* the sun and the dunes */}
              <motion.circle cx={850} cy={250} r={50} fill={GOLD} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
              <motion.path d="M 740 820 C 900 700, 1050 720, 1180 780 C 1300 700, 1450 690, 1560 760 L 1560 830 L 740 830 Z" fill="#EBC889" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease }} />
              <motion.path d="M 740 830 C 860 760, 1000 780, 1100 820 L 740 830 Z" fill="#E0B270" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.1, ease }} />
              <motion.path d={K_ROUTE_D} fill="none" stroke={CLAY} strokeWidth={4} strokeDasharray="3 14" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />
              {/* little Madinah far away */}
              <g transform={`translate(${K_TOWN[0] + 40} ${K_TOWN[1] + 20}) scale(0.7)`}>
                <House x={-60} y={0} color="#D9764E" /><House x={30} y={-10} color="#E5B45E" /><House x={110} y={4} color="#C9694A" />
              </g>
            </svg>
            <Tag x={K_TOWN[0] + 60} y={K_TOWN[1] - 90} text="Madinah" strong />
            <Tag x={900} y={790} text="days of sand and wind" />
            {/* the camel walks the road, leaving a trail of dust and gathering it */}
            {K_ROUTE.filter((_, i) => i % 3 === 0).map((p, i) => (
              <motion.span key={i} className="absolute rounded-full" style={{ left: p.x, top: p.y, width: 10, height: 10, background: '#C9A06A' }}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.8, 0.3], scale: [0, 1.4, 2.4], y: [0, -10, -22] }} transition={{ duration: 1.6, delay: reduce ? 0 : 0.6 + i * 0.12 }} />
            ))}
            <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: K_FAR[0], y: K_FAR[1] }}
              animate={{ x: K_ROUTE.map((p) => p.x), y: K_ROUTE.map((p) => p.y), scale: K_ROUTE.map((_, i) => 1 - (i / K_ROUTE.length) * 0.45) }}
              transition={{ duration: reduce ? 0 : 2.4, delay: 0.5, ease: 'easeInOut' }}>
              <Cut src="zad-kids/l02/desert-camel" x={0} y={10} h={150} ratio={1.33} bounce={0} />
              {lines >= 2 && Array.from({ length: 12 }, (_, i) => (
                <motion.span key={i} className="absolute rounded-full" style={{ width: 16, height: 16, marginLeft: -8, marginTop: -8, background: '#C49A6C' }}
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0.55], x: Math.cos(i * 0.52) * 80, y: Math.sin(i * 0.52) * 46 - 60 }} transition={{ duration: 0.9, delay: i * 0.03 }} />
              ))}
            </motion.div>
            {lines >= 2 && (
              <>
                <Tag x={K_TOWN[0] - 200} y={K_TOWN[1] + 40} text="Every traveller: dusty!" color={CLAY} strong />
                {/* the visitor: spotless */}
                <motion.div className="absolute" style={{ left: 1290, top: 600 }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.9, delay: 0.6 }}>
                  <Visitor />
                </motion.div>
                <motion.div className="absolute" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.9, delay: 1.2 }}>
                  <ClueCard n={1} fact="No dust on him!" means="he lives nearby" color={TEAL} style={{ left: 950, top: 190 }} />
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* inside Madinah: every house tied to every house */}
      <AnimatePresence>
        {town && (
          <motion.div key="town" className="absolute inset-0" style={{ transformOrigin: `${K_CENTRE.x}px ${K_CENTRE.y}px` }}
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
              {K_HOUSES.flatMap((a, i) => K_HOUSES.slice(i + 1).filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < 330).map((b, j) => (
                <motion.path key={`${i}-${j}`} d={`M ${a.x} ${a.y - 30} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 70} ${b.x} ${b.y - 30}`} fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }} transition={{ duration: 0.6, delay: reduce ? 0 : 0.5 + (i * 3 + j) * 0.04 }} />
              )))}
              {K_HOUSES.map((h, i) => (
                <motion.g key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.7, delay: reduce ? 0 : i * 0.06 }}>
                  <House x={h.x} y={h.y} color={h.c} />
                </motion.g>
              ))}
              {/* his lines reach out, and none of them holds */}
              {lines >= 4 && K_HOUSES.slice(0, 6).map((h, i) => (
                <motion.line key={`x${i}`} x1={K_CENTRE.x} y1={K_CENTRE.y} x2={h.x} y2={h.y - 30} stroke={CRIMSON} strokeWidth={4} strokeDasharray="8 10" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: [0, 0.7, 0.7], opacity: [1, 1, 0.1] }} transition={{ duration: 1.5, delay: reduce ? 0 : 0.2 + i * 0.12, times: [0, 0.5, 1] }} />
              ))}
            </svg>
            {lines === 3 && <Tag x={K_CENTRE.x} y={240} text="Everyone knew everyone" strong />}
            {lines >= 4 && (
              <>
                <div className="absolute" style={{ left: K_CENTRE.x, top: K_CENTRE.y }}><Visitor shake /></div>
                {/* the two clues side by side, and the sign between them: both cannot be true */}
                <motion.div className="absolute" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.9, delay: 0.4 }}>
                  <ClueCard n={1} fact="No dust on him!" means="he lives nearby" color={TEAL} style={{ left: 770, top: 190 }} />
                </motion.div>
                <motion.div className="absolute" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.9, delay: 1 }}>
                  <ClueCard n={2} fact="Nobody knew him!" means="he is not from here" style={{ left: 1150, top: 190 }} />
                </motion.div>
                <motion.div className="absolute flex items-center justify-center rounded-full font-sans font-extrabold" style={{ left: 1120 - 44, top: 216, width: 88, height: 88, background: CRIMSON, color: '#fff', fontSize: 50, boxShadow: '0 0 40px 12px rgba(197,31,36,0.4)' }}
                  initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} transition={{ duration: 0.6, delay: 1.8 }}>≠</motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Maryam the detective watches */}
      {lines >= 1 && <Cut src={`${KIDS}/maryam-think`} x={1470} y={822} h={260} delay={0.8} />}
    </div>
  );
}

function Tag({ x, y, text, strong, color }: { x: number; y: number; text: string; strong?: boolean; color?: string }) {
  return (
    <motion.span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full font-sans" style={{ left: x, top: y, fontSize: strong ? 24 : 19, fontWeight: 800, padding: strong ? '6px 18px' : '2px 10px', color: color && strong ? '#fff' : color ?? INK_TEXT, background: strong ? color ?? '#FFFDF8' : 'transparent', boxShadow: strong ? '0 12px 26px -16px rgba(60,20,10,0.6)' : undefined }}
      initial={{ opacity: 0, y: 10, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.7, delay: 0.4 }}>
      {text}
    </motion.span>
  );
}

/* ======================================================================================================================
 * Kids L1 · Question one: Islam. "Tell me about Islam" floats in; a roof with nothing under it crashes down (a house
 * needs pillars); five numbered spaces wait; then the Shahadah is laid as the floor and four pillars bounce up, each
 * with its picture; the roof lands on them and says ISLAM. Maryam claps.
 * ==================================================================================================================== */

const SLAB = { x: 820, y: 672, w: 600, h: 58 };
const PCOLS = [892, 1036, 1180, 1324];
const PH = 330;
const PILLARS = [
  { en: 'Shahadah', ar: 'الشهادتان', color: CRIMSON, icon: 'finger' },
  { en: 'Salah', ar: 'الصلاة', color: TEAL, icon: 'mat' },
  { en: 'Zakah', ar: 'الزكاة', color: GOLD, icon: 'coin' },
  { en: 'Fasting', ar: 'الصوم', color: CLAY, icon: 'moon' },
  { en: 'Hajj', ar: 'الحج', color: '#2E6F7E', icon: 'kaaba' },
];

/** Little pictures for the pillars (drawn, 48 × 48, centred on 0,0). */
function PillarIcon({ kind, color = '#fff' }: { kind: string; color?: string }) {
  switch (kind) {
    case 'finger': return <path d="M -4 18 L -4 -14 a 5 5 0 0 1 10 0 L 6 2 L 14 4 a 5 5 0 0 1 4 6 L 16 18 Z" fill={color} />;
    case 'mat': return <g><rect x={-14} y={-18} width={28} height={38} rx={3} fill={color} /><path d="M -8 -8 Q 0 -18 8 -8 L 8 12 L -8 12 Z" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={2.5} /></g>;
    case 'coin': return <g><circle r={15} fill={color} /><circle r={9} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={2.5} /></g>;
    case 'moon': return <g><circle r={15} fill={color} /><circle cx={7} cy={-5} r={13} fill="#fff" /></g>;
    default: return <g><rect x={-15} y={-12} width={30} height={28} rx={2} fill="#1F1612" stroke={color} strokeWidth={2} /><rect x={-15} y={-6} width={30} height={5} fill={GOLD} /></g>;
  }
}

export function KidsIslamGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  const roofY = SLAB.y - PH;
  const done = items >= 5;
  useCue('thud', lines >= 2, 0.9);
  useCue('brick', items);
  useCue('sparkle', done, 1);
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* 1. the question */}
      {lines >= 1 && (
        <motion.div className="absolute rounded-[26px] font-serif" style={{ left: 840, top: 196, padding: '14px 26px', fontSize: 36, background: '#FFFDF8', color: INK_TEXT, boxShadow: '0 22px 46px -26px rgba(80,30,10,0.55)' }}
          initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: items >= 1 ? 0 : 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8 }}>
          “Tell me about <span style={{ color: CRIMSON }}>Islam</span>.”
        </motion.div>
      )}
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
        {/* the plot */}
        {lines >= 1 && <motion.line x1={SLAB.x - 30} y1={SLAB.y + SLAB.h} x2={SLAB.x + SLAB.w + 30} y2={SLAB.y + SLAB.h} stroke={soft('light')} strokeWidth={3} strokeDasharray="6 9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />}
        {/* 3. five spaces waiting */}
        {lines >= 3 && !done && PCOLS.map((cx, i) => items < i + 2 && (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.2 + i * 0.15 }}>
            <rect x={cx - 40} y={roofY} width={80} height={PH} rx={14} fill="rgba(229,169,60,0.08)" stroke={GOLD} strokeWidth={3} strokeDasharray="8 8" />
            <text x={cx} y={roofY + PH / 2 + 14} textAnchor="middle" fill={GOLD} style={{ font: '800 38px var(--font-sans, sans-serif)' }}>{i + 2}</text>
          </motion.g>
        ))}
        {lines >= 3 && items < 1 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.1 }}>
            <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h} rx={12} fill="rgba(197,31,36,0.06)" stroke={CRIMSON} strokeWidth={3} strokeDasharray="8 8" />
            <text x={SLAB.x + SLAB.w / 2} y={SLAB.y + 38} textAnchor="middle" fill={CRIMSON} style={{ font: '800 30px var(--font-sans, sans-serif)' }}>1</text>
          </motion.g>
        )}
        {/* the floor: the Shahadah */}
        {items >= 1 && (
          <motion.g initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.8 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h} rx={12} fill={CRIMSON} />
            <text x={SLAB.x + SLAB.w / 2} y={SLAB.y + 37} textAnchor="middle" fill="#fff" style={{ font: '800 26px var(--font-sans, sans-serif)' }}>Shahadah · الشهادتان</text>
          </motion.g>
        )}
        {/* four pillars bounce up from it */}
        {PCOLS.map((cx, i) => items >= i + 2 && (
          <motion.g key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.9 }} style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
            <rect x={cx - 40} y={roofY} width={80} height={PH} rx={14} fill={PILLARS[i + 1].color} />
            <rect x={cx - 40} y={roofY} width={16} height={PH} rx={8} fill="rgba(255,255,255,0.22)" />
            <circle cx={cx} cy={roofY + PH / 2} r={34} fill="rgba(255,255,255,0.92)" />
            <g transform={`translate(${cx} ${roofY + PH / 2}) scale(1.25)`}><PillarIcon kind={PILLARS[i + 1].icon} color={PILLARS[i + 1].color} /></g>
          </motion.g>
        ))}
        {/* 2. a roof with nothing to hold it crashes down; at the end it lands on the five pillars */}
        {lines >= 2 && items < 1 && (
          <motion.g initial={{ y: -300, rotate: 0, opacity: 0 }} animate={{ y: [-300, 0, 0, 0], rotate: [0, 0, 12, 12], opacity: [1, 1, 1, 0] }} transition={{ duration: 2.2, delay: 0.3, times: [0, 0.3, 0.7, 1], ease: 'easeIn' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'right bottom' }}>
            <polygon points={`${SLAB.x - 10},${SLAB.y} ${SLAB.x + SLAB.w / 2},${SLAB.y - 110} ${SLAB.x + SLAB.w + 10},${SLAB.y}`} fill={CLAY} />
          </motion.g>
        )}
        {done && (
          <motion.g initial={{ y: -220, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 1, delay: 0.8 }}>
            <polygon points={`${SLAB.x - 10},${roofY} ${SLAB.x + SLAB.w / 2},${roofY - 120} ${SLAB.x + SLAB.w + 10},${roofY}`} fill="url(#kidsRoof)" />
            <defs><linearGradient id="kidsRoof" x1="0" x2="1"><stop offset="0" stopColor={CRIMSON} /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor={SKY} /></linearGradient></defs>
            <text x={SLAB.x + SLAB.w / 2} y={roofY - 30} textAnchor="middle" fill="#fff" style={{ font: '800 40px var(--font-sans, sans-serif)', letterSpacing: '0.18em' }}>ISLAM</text>
          </motion.g>
        )}
      </svg>
      {lines >= 2 && items < 1 && lines < 3 && <Tag x={SLAB.x + SLAB.w / 2} y={SLAB.y + 76} text="No pillars? Crash!" color={CLAY} strong />}
      {lines >= 3 && items < 1 && <Tag x={SLAB.x + SLAB.w / 2} y={SLAB.y + 76} text="Five things a Muslim does" strong />}
      {/* the pillar names, under the floor */}
      {PCOLS.map((cx, i) => items >= i + 2 && (
        <motion.div key={i} className="absolute -translate-x-1/2 text-center" style={{ left: cx, top: SLAB.y + SLAB.h + 12 }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease }}>
          <p className="m-0 whitespace-nowrap font-sans font-extrabold" style={{ fontSize: 22, color: ink('light') }}>{PILLARS[i + 1].en}</p>
          <Ar size={20}>{PILLARS[i + 1].ar}</Ar>
        </motion.div>
      ))}
      {/* confetti stars when the house stands */}
      {done && !reduce && Array.from({ length: 14 }, (_, i) => (
        <motion.span key={i} className="absolute" style={{ left: 1120, top: roofY - 60, width: 16, height: 16, background: [CRIMSON, GOLD, TEAL][i % 3], clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)' }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: Math.cos(i * 0.45) * 320, y: Math.sin(i * 0.45) * 160 - 60, rotate: 180 }} transition={{ duration: 1.4, delay: 1.3 }} />
      ))}
      {lines >= 1 && <Cut src={`${KIDS}/${done ? 'maryam-happy' : 'maryam-think'}`} x={1490} y={822} h={250} delay={0.5} />}
    </div>
  );
}

/* ======================================================================================================================
 * Kids L2 · Clues of a maker. A LEGO castle; Maryam wonders who built it; the magnifier sweeps it; three clue spaces
 * open; then each clue happens on the castle: bricks lift and click back (they fit), the gate drops open (it works),
 * Mishmish trots in (it is made for playing). Maryam points: someone made this.
 * ==================================================================================================================== */

const BRICK = [CRIMSON, GOLD, SKY, '#2E7D4F'];
const CX = 1080; // castle centre
const BASE = 700;

function Brick({ x, y, w = 60, h = 34, color, glow }: { x: number; y: number; w?: number; h?: number; color: string; glow?: boolean }) {
  return (
    <g style={glow ? { filter: `drop-shadow(0 0 10px ${GOLD})` } : undefined}>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={color} />
      {Array.from({ length: Math.round(w / 30) }, (_, i) => <rect key={i} x={x + 8 + i * 30} y={y - 7} width={14} height={8} rx={2} fill={color} style={{ filter: 'brightness(1.12)' }} />)}
      <rect x={x} y={y} width={w} height={6} rx={3} fill="rgba(255,255,255,0.25)" />
    </g>
  );
}

/** The castle: two towers, a wall with a gate, a flag. Rows of bricks are laid from the ground up. */
function Castle({ built, lift, gateOpen }: { built: boolean; lift: boolean; gateOpen: boolean }) {
  const reduce = useReduce();
  const rows: { x: number; y: number; w: number; c: string; k: string }[] = [];
  // the wall between the towers (a gap left for the gate)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const x = CX - 180 + c * 60;
    if (r < 3 && (c === 2 || c === 3)) continue;
    rows.push({ x, y: BASE - 34 * (r + 1), w: 60, c: BRICK[(r + c) % 4], k: `w${r}${c}` });
  }
  // towers
  for (const tx of [CX - 270, CX + 180]) for (let r = 0; r < 8; r++) for (let c = 0; c < 2; c++) {
    rows.push({ x: tx + c * 45, y: BASE - 34 * (r + 1), w: 45, c: BRICK[(r + c + (tx > CX ? 1 : 0)) % 4], k: `t${tx}${r}${c}` });
  }
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 1600 900">
      <rect x={CX - 300} y={BASE} width={600} height={10} rx={5} fill="rgba(31,22,18,0.12)" />
      {rows.map((b, i) => {
        const lifted = lift && b.k.startsWith('t') && b.y < BASE - 34 * 6 && b.x < CX;
        return (
          <motion.g key={b.k} initial={{ y: -120, opacity: 0 }} animate={built ? { y: lifted ? [0, -60, 0] : 0, opacity: 1 } : { y: -120, opacity: 0 }}
            transition={lifted ? { duration: 1.4, times: [0, 0.45, 1], ease: 'easeInOut' } : { type: 'spring', bounce: 0.35, duration: 0.6, delay: reduce ? 0 : (BASE - b.y) / 34 * 0.08 + (i % 5) * 0.015 }}>
            <Brick x={b.x} y={b.y} w={b.w} color={b.c} glow={lifted} />
          </motion.g>
        );
      })}
      {/* the gate: a drawbridge that drops open */}
      {built && (
        <>
          <rect x={CX - 60} y={BASE - 102} width={120} height={102} rx={60} fill="#3A2418" />
          {/* light inside once the gate is open */}
          <motion.rect x={CX - 52} y={BASE - 94} width={104} height={94} rx={52} fill="#FFE3A3" initial={false} animate={{ opacity: gateOpen ? 1 : 0 }} transition={{ duration: 0.6, delay: 0.5 }} />
          {/* the drawbridge folds down flat in front of the gate */}
          <motion.rect x={CX - 56} y={BASE} width={112} height={16} rx={4} fill="#8A5A33" initial={false} animate={{ opacity: gateOpen ? 1 : 0 }} transition={{ duration: 0.2, delay: 0.7 }} />
          <motion.g initial={false} animate={{ scaleY: gateOpen ? 0.02 : 1 }} transition={{ type: 'spring', bounce: 0.2, duration: 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
            <rect x={CX - 56} y={BASE - 98} width={112} height={98} rx={10} fill="#8A5A33" />
            {[0, 1, 2].map((k) => <rect key={k} x={CX - 56} y={BASE - 80 + k * 28} width={112} height={4} fill="rgba(0,0,0,0.25)" />)}
          </motion.g>
        </>
      )}
      {/* flags on the towers */}
      {built && [CX - 225, CX + 225].map((fx, i) => (
        <motion.g key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: reduce ? 0 : 1.4, duration: 0.5 }} style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}>
          <rect x={fx - 2} y={BASE - 34 * 8 - 70} width={4} height={70} fill="#5A3020" />
          <motion.path d={`M ${fx + 2} ${BASE - 34 * 8 - 70} l 46 14 l -46 14 Z`} fill={i ? TEAL : CRIMSON} animate={reduce ? {} : { skewY: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
        </motion.g>
      ))}
    </svg>
  );
}

const CLUES = ['Pieces fit', 'It works', 'Made for something'];

export function KidsCastleGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  useCue('brick', lines >= 1, 0.4);
  useCue('whoosh', lines >= 2);
  useCue('pop', lines >= 3);
  useCue('brick', items >= 1, 0.6);
  useCue('thud', items >= 2, 0.7);
  useCue('sparkle', items >= 3, 1.6);
  return (
    <div className="pointer-events-none absolute inset-0">
      <Castle built={lines >= 1} lift={items === 1} gateOpen={items >= 2} />
      {lines === 1 && <Tag x={CX} y={BASE + 24} text="Who built it? Nobody saw." strong />}
      {/* 2. the detective's lens sweeps the castle */}
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 0, top: 0, width: 260 }} initial={{ x: 760, y: 560, rotate: -10, opacity: 0 }}
          animate={lines >= 3 ? { x: 740, y: 630, rotate: -30, opacity: 0.9, scale: 0.55 } : { x: [760, 1180, 900], y: [560, 360, 420], rotate: [-10, 8, -4], opacity: 1 }}
          transition={{ duration: reduce ? 0 : 2.4, ease: 'easeInOut' }}>
          <img src={asset('l02/magnifier.webp')} alt="" className="w-full" style={{ filter: 'drop-shadow(0 18px 18px rgba(60,30,10,0.25))' }} />
        </motion.div>
      )}
      {/* 3. three clue spaces, filled as each clue shows on the castle */}
      {lines >= 3 && CLUES.map((c, i) => {
        const found = items >= i + 1;
        return (
          <motion.div key={c} className="absolute flex items-center gap-2 rounded-full font-sans font-extrabold" style={{ left: 790 + i * 232, top: 196, padding: '10px 18px', fontSize: 21,
            background: found ? [CRIMSON, TEAL, GOLD][i] : 'rgba(255,253,248,0.9)', color: found ? '#fff' : soft('light'), border: found ? 'none' : `3px dashed ${GOLD}` }}
            initial={{ opacity: 0, y: -16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: found ? [1, 1.15, 1] : 1 }} transition={{ duration: 0.6, delay: reduce ? 0 : found ? 0.7 : i * 0.15 }}>
            {found ? <Icon name="check" size={22} color="#fff" width={3} /> : <span>{i + 1}</span>}
            {found ? c : '?'}
          </motion.div>
        );
      })}
      {items === 1 && <Tag x={CX - 240} y={300} text="click! they fit" color={GOLD} strong />}
      {items === 2 && <Tag x={CX} y={BASE + 24} text="the gate opens" color={TEAL} strong />}
      {/* 3rd clue: Mishmish trots in to play */}
      {items >= 3 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 1420, y: 700, opacity: 0 }} animate={{ x: CX + 30, y: 700, opacity: 1 }} transition={{ duration: reduce ? 0 : 1.6, ease: 'easeOut' }}>
          <Cut src={`${KIDS}/mishmish-walk`} x={0} y={14} h={110} ratio={1.5} flip bounce={0} />
        </motion.div>
      )}
      {items >= 3 && <Tag x={CX} y={BASE + 24} text="made for playing in" color={GOLD} strong />}
      {lines >= 1 && <Cut src={`${KIDS}/${items >= 1 ? 'maryam-point' : 'maryam-think'}`} x={1470} y={822} h={260} delay={0.9} />}
    </div>
  );
}

