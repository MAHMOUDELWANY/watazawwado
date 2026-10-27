import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { useReduce, INK_TEXT, soft, type Tone } from './Stage';
import { Svg, Draw } from './kit';
import { WriteLetter, LETTERS } from './letters';
import { Hear } from '../Say';
import { G, GRID, ARAB, WORLD, Counter, ALPHABET, Rings } from './g-law';

/**
 * Literacy A · Lesson 1 · Welcome to Arabic: the explaining moments shared by the Teens (night city) and Adults (reading
 * map) versions. Same motion as the Kids pages the owner approved (globe, dots, marks, alif), drawn for either stage
 * tone and without the Kids cast. Each version adds its own frame around them (g-lwt.tsx, g-lwa.tsx).
 */

export const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
export const DEEP = '#8B1A1E';
const CARD = (tone: Tone): React.CSSProperties => tone === 'light'
  ? { background: '#FFFDF8', boxShadow: '0 26px 50px -28px rgba(60,30,10,0.45), 0 0 0 1px rgba(31,22,18,0.06)' }
  : { background: 'rgba(246,241,232,0.96)', boxShadow: '0 30px 60px -28px rgba(0,0,0,0.7)' };
/** Ink for letters drawn straight on the stage. */
const STROKE = (tone: Tone) => (tone === 'light' ? CRIMSON : '#FFE9C9');
const ACCENT = (tone: Tone) => (tone === 'light' ? TEAL : '#5FD3DD');

/** A short label in a rounded bubble. */
export function Tag({ x, y, children, color = CRIMSON, delay = 0, solid = false, tone }: { x: number; y: number; children: React.ReactNode; color?: string; delay?: number; solid?: boolean; tone: Tone }) {
  return (
    <motion.span className="pointer-events-none absolute whitespace-nowrap rounded-full font-sans font-black" style={{ left: x, top: y, fontSize: 22, padding: '6px 18px', background: solid ? color : tone === 'light' ? '#FFFDF8' : 'rgba(246,241,232,0.96)', color: solid ? '#fff' : color, boxShadow: '0 14px 28px -16px rgba(0,0,0,0.5)' }}
      initial={{ opacity: 0, scale: 0.6, y: 10, x: '-50%' }} animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay }}>
      {children}
    </motion.span>
  );
}

/* ---------- a language of millions ---------- */

export function WorldScene({ lines, tone, third }: { lines: number; tone: Tone; third: string }) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.2);
  useCue('sparkle', lines >= 3, 0.3);
  const dark = tone === 'dark';
  return (
    <>
      <Svg>
        <defs>
          <radialGradient id={`wGlobe${tone}`} cx="40%" cy="35%" r="75%">
            {dark
              ? <><stop offset="0%" stopColor="#1F4A55" /><stop offset="70%" stopColor="#123540" /><stop offset="100%" stopColor="#0B2730" /></>
              : <><stop offset="0%" stopColor="#E3F4F2" /><stop offset="70%" stopColor="#B9E1DE" /><stop offset="100%" stopColor="#8FC9C6" /></>}
          </radialGradient>
        </defs>
        <motion.g initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }} transition={{ duration: 1, ease }}>
          <circle cx={G.cx} cy={G.cy} r={G.r} fill={`url(#wGlobe${tone})`} />
          {GRID.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.6} fill={dark ? '#7FD6DE' : '#0E7C86'} opacity={0.1 + p.z * 0.3} />)}
          <circle cx={G.cx} cy={G.cy} r={G.r} fill="none" stroke={dark ? '#7FD6DE' : '#0E7C86'} strokeWidth={3} opacity={0.35} />
        </motion.g>
        {lines >= 1 && ARAB.map((p, i) => (
          <motion.circle key={`a${i}`} cx={p.x} cy={p.y} r={9} fill={GOLD} stroke="#FFF6D8" strokeWidth={3} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%', filter: `drop-shadow(0 0 8px ${GOLD})` }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 + i * 0.06 }} />
        ))}
        {lines >= 3 && WORLD.map((p, i) => (
          <motion.circle key={`w${i}`} cx={p.x} cy={p.y} r={7} fill={CRIMSON} stroke="#FFF6D8" strokeWidth={2.5} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 + i * 0.08 }} />
        ))}
      </Svg>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[26px]" style={{ ...CARD(tone), left: 880, top: 690, width: 460, padding: '10px 0 12px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <span className="font-sans font-black" style={{ fontSize: 50, lineHeight: 1.05, color: CRIMSON }}><Counter to={400000000} delay={0.3} /></span>
          <span className="font-sans font-bold" style={{ fontSize: 19, color: soft('light') }}>people use Arabic every day</span>
        </motion.div>
      )}
      {lines >= 2 && <Tag tone={tone} x={1250} y={226} color="#B07A1E">20+ countries</Tag>}
      {lines >= 3 && <Tag tone={tone} x={1400} y={560} color={TEAL} delay={0.8}>{third}</Tag>}
    </>
  );
}

/* ---------- 28 letters, no capitals ---------- */

export function AlphabetScene({ lines, interaction, tone }: { lines: number; interaction: boolean; tone: Tone }) {
  useCue('pop', lines >= 1, 0.2);
  useCue('reveal', lines >= 2, 0.2);
  useCue('correct', interaction, 0.4);
  return (
    <>
      {lines >= 1 && <div className="pointer-events-none absolute grid grid-cols-7 gap-[8px]" dir="rtl" style={{ left: 800, top: 168 }}>
        {ALPHABET.map((c, i) => (
          <motion.span key={i} className="flex items-center justify-center rounded-[14px]" style={{ ...AR, ...CARD(tone), width: 60, height: 60, fontSize: 36, color: i % 3 === 0 ? CRIMSON : i % 3 === 1 ? '#0E7C86' : '#B07A1E' }}
            initial={{ opacity: 0, scale: 0.3, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.1 + i * 0.045 }}>{c}</motion.span>
        ))}
      </div>}
      {lines >= 1 && (
        <>
          <Tag tone={tone} x={1350} y={200} color={CRIMSON} solid>Arabic: 28</Tag>
          <Tag tone={tone} x={1350} y={262} color={TEAL}>English: 26</Tag>
        </>
      )}
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute flex items-end justify-center gap-3 rounded-[26px]" style={{ ...CARD(tone), left: 820, top: 500, width: 230, height: 170, paddingBottom: 30 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <motion.span className="font-serif" style={{ fontSize: 96, lineHeight: 0.8, color: INK_TEXT }} initial={{ x: 20 }} animate={{ x: 0 }} transition={{ delay: 0.5, duration: 0.6, ease }}>A</motion.span>
          <motion.span className="font-serif" style={{ fontSize: 60, lineHeight: 0.8, color: INK_TEXT }} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6, ease }}>a</motion.span>
          <span className="absolute font-sans font-extrabold uppercase" style={{ top: 12, fontSize: 15, letterSpacing: '0.14em', color: TEAL }}>English · 2 sizes</span>
        </motion.div>
      )}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute flex items-end justify-center rounded-[26px]" style={{ ...CARD(tone), left: 1080, top: 500, width: 230, height: 170, paddingBottom: 22 }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span style={{ ...AR, fontSize: 96, lineHeight: 1, color: DEEP }}>ب</span>
          <span className="absolute font-sans font-extrabold uppercase" style={{ top: 12, fontSize: 15, letterSpacing: '0.14em', color: CRIMSON }}>Arabic · 1 size</span>
        </motion.div>
      )}
      {interaction && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 1350, top: 520, width: 150, height: 150, border: `6px solid ${CRIMSON}`, color: CRIMSON, background: tone === 'light' ? 'rgba(255,253,248,0.9)' : 'rgba(246,241,232,0.96)', fontSize: 22, lineHeight: 1.1, textAlign: 'center' }}
          initial={{ scale: 2.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -10 }} transition={{ type: 'spring', bounce: 0.35, delay: 0.3 }}>
          <span><span style={{ fontSize: 54 }}>0</span><br />capitals</span>
        </motion.div>
      )}
    </>
  );
}

/* ---------- letters join ---------- */

const PIECES = [{ ch: 'ك', x: 1290 }, { ch: 'ت', x: 1150 }, { ch: 'ب', x: 1010 }];

export function JoinScene({ lines, tone }: { lines: number; tone: Tone }) {
  const joined = lines >= 1;
  useCue('whoosh', lines >= 1, 0.2);
  useCue('pen', lines >= 2, 0.3);
  useCue('pop', lines >= 3, 0.4);
  return (
    <>
      {/* three letters on their own slide together and become one word */}
      {PIECES.map((p, i) => (
        <motion.span key={p.ch} className="pointer-events-none absolute flex items-center justify-center rounded-[22px]" style={{ ...AR, ...CARD(tone), left: p.x - 55, top: 440, width: 110, height: 130, fontSize: 76, color: DEEP }}
          initial={{ opacity: 0, y: -30 }} animate={joined ? { opacity: 0, x: 1150 - p.x, y: -200, scale: 0.6 } : { opacity: 1, y: 0 }}
          transition={joined ? { duration: 0.7, ease, delay: i * 0.05 } : { type: 'spring', bounce: 0.4, delay: 0.2 + i * 0.12 }}>{p.ch}</motion.span>
      ))}
      {joined && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center justify-center rounded-[28px]" style={{ ...CARD(tone), left: 930, top: 150, width: 440, height: 230 }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay: 0.55 }}>
          <span lang="ar" style={{ ...AR, fontSize: 100, lineHeight: 1.45, color: DEEP }}>كَتَبَ</span>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>kataba · he wrote</span>
        </motion.div>
      )}
      {/* the flowing line, drawn the Arabic way: right to left */}
      {lines >= 2 && <Svg><Draw d="M 1330 410 C 1240 440, 1060 380, 960 410" color={GOLD} width={7} dur={1.4} delay={0.2} /></Svg>}
      {lines >= 2 && <Tag tone={tone} x={1150} y={430} color="#B07A1E" delay={1.2}>one flowing line</Tag>}
      {/* most letters connect; alif never connects to the letter after it */}
      {lines >= 3 && [{ w: 'بَبَ', label: 'connects', color: TEAL, x: 900 }, { w: 'اب', label: 'lets go: a gap', color: CRIMSON, x: 1170 }].map((c, i) => (
        <motion.div key={c.w} className="pointer-events-none absolute flex flex-col items-center rounded-[24px]" style={{ ...CARD(tone), left: c.x, top: 540, width: 230, padding: '6px 0 14px' }}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.2 + i * 0.3 }}>
          <span lang="ar" style={{ ...AR, fontSize: 84, lineHeight: 1.25, color: DEEP, letterSpacing: i ? '0.18em' : undefined }}>{c.w}</span>
          <span className="font-sans font-black" style={{ fontSize: 20, color: c.color }}>{c.label}</span>
        </motion.div>
      ))}
    </>
  );
}

/* ---------- dots make letters (the wow) ---------- */

const BOAT = { x: 1030, y: 560, size: 380 };
const DOTS: Record<'none' | 'b' | 't' | 'th', { x: number; y: number }[]> = { none: [], b: LETTERS['ب'].dots, t: LETTERS['ت'].dots, th: LETTERS['ث'].dots };
const SOUND = { none: '', b: 'b', t: 't', th: 'th' } as const;

export function DotsScene({ lines, tone, rule }: { lines: number; tone: Tone; rule: string }) {
  const reduce = useReduce();
  const [late, setLate] = React.useState(false);
  React.useEffect(() => {
    if (lines !== 3) { setLate(false); return; }
    const t = window.setTimeout(() => setLate(true), 2200);
    return () => window.clearTimeout(t);
  }, [lines]);
  const state: keyof typeof DOTS = lines >= 4 || (lines === 3 && late) ? 'th' : lines === 3 ? 't' : lines === 2 ? 'b' : 'none';
  const s = BOAT.size / 300;
  useCue('pen', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.4);
  useCue('pop', lines >= 3, 0.3);
  useCue('sparkle', lines >= 4, 0.3);
  const at = DOTS[state];
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ب" x={BOAT.x} y={BOAT.y} size={BOAT.size} color={STROKE(tone)} dots={false} speed={0.9} />}
        <g transform={`translate(${BOAT.x - BOAT.size / 2} ${BOAT.y - 200 * s}) scale(${s})`}>
          {[0, 1, 2].map((i) => {
            const p = at[i];
            return (
              <motion.circle key={i} cx={0} cy={0} r={19} fill={GOLD} initial={{ x: 150, y: -120, scale: 0 }}
                animate={p ? { x: p.x, y: p.y, scale: 1 } : { x: 150, y: -120, scale: 0 }}
                transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.4, duration: 1, delay: i * 0.12 }} />
            );
          })}
        </g>
      </Svg>
      {state !== 'none' && (
        <motion.span key={state} className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: 1300, top: 230, width: 110, height: 110, background: TEAL, fontSize: 48, boxShadow: '0 18px 30px -16px rgba(14,124,134,0.7)' }}
          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.5 }}>{SOUND[state]}</motion.span>
      )}
      {lines >= 4 && (
        <>
          <div className="pointer-events-none absolute flex gap-4" dir="rtl" style={{ left: 840, top: 640 }}>
            {[['ب', 'b'], ['ت', 't'], ['ث', 'th']].map(([c, snd], i) => (
              <motion.div key={c} className="flex flex-col items-center rounded-[20px]" style={{ ...CARD(tone), width: 120, padding: '2px 0 8px' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.2 }}>
                <span style={{ ...AR, fontSize: 60, lineHeight: 1.3, color: DEEP }}>{c}</span>
                <span className="font-sans font-black" style={{ fontSize: 22, color: TEAL }}>{snd}</span>
              </motion.div>
            ))}
          </div>
          <Tag tone={tone} x={1340} y={690} color={CRIMSON} solid delay={0.9}>{rule}</Tag>
        </>
      )}
    </>
  );
}

/* ---------- short vowels are little marks ---------- */

export function MarksScene({ lines, tone, last }: { lines: number; tone: Tone; last?: React.ReactNode }) {
  const reduce = useReduce();
  const L = { x: 1010, y: 540, size: 380 };
  const s = L.size / 300;
  useCue('pop', lines >= 1, 0.7);
  useCue('chime', lines >= 2, 0.3);
  return (
    <>
      <Svg>
        <WriteLetter ch="ب" x={L.x} y={L.y} size={L.size} color={STROKE(tone)} instant />
        {lines >= 1 && (
          <g transform={`translate(${L.x - L.size / 2} ${L.y - 200 * s}) scale(${s})`}>
            <motion.line x1={122} y1={96} x2={182} y2={66} stroke={GOLD} strokeWidth={18} strokeLinecap="round"
              initial={reduce ? false : { y: -160, opacity: 0, rotate: -40 }} animate={{ y: 0, opacity: 1, rotate: 0 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
              transition={{ type: 'spring', bounce: 0.45, duration: 1.1, delay: 0.3 }} />
          </g>
        )}
      </Svg>
      {lines >= 2 && <Rings x={L.x} y={L.y - 120} color={GOLD} r={70} />}
      {lines >= 2 && (
        <div className="pointer-events-auto absolute" style={{ left: L.x - 150, top: L.y - 300, width: 300, height: 340 }}>
          <Hear id="ba"><span style={{ display: 'block', width: 300, height: 340 }} /></Hear>
        </div>
      )}
      {lines >= 2 && <Tag tone={tone} x={1300} y={260} color={CRIMSON} solid delay={0.4}>b → ba</Tag>}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-4" dir="rtl" style={{ left: 840, top: 660 }}>
          {[['بَ', 'ba', 'above'], ['بِ', 'bi', 'below'], ['بُ', 'bu', 'above']].map(([c, snd, where], i) => (
            <motion.div key={c} className="flex flex-col items-center rounded-[20px]" style={{ ...CARD(tone), width: 120, padding: '0 0 8px' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.2 }}>
              <span style={{ ...AR, fontSize: 60, lineHeight: 1.4, color: DEEP }}>{c}</span>
              <span className="font-sans font-black" style={{ fontSize: 20, color: TEAL }}>{snd} <span style={{ color: soft('light'), fontWeight: 700, fontSize: 15 }}>{where}</span></span>
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 4 && last}
    </>
  );
}

/* ---------- sounds English does not have ---------- */

const DEEP_SOUNDS = [{ c: 'ح', id: 'haa' }, { c: 'ع', id: 'ayn' }, { c: 'خ', id: 'khaa' }, { c: 'ق', id: 'qaaf' }];

export function SoundsScene({ lines, items, tone }: { lines: number; items: number; tone: Tone }) {
  const reduce = useReduce();
  const throat = { x: 985, y: 610 };
  useCue('pop', lines >= 1, 0.3);
  useCue('chime', items, 0.2);
  const dark = tone === 'dark';
  return (
    <>
      {lines >= 1 && (
        <div className="absolute flex gap-4" dir="rtl" style={{ left: 820, top: 168 }}>
          {DEEP_SOUNDS.map((d, i) => {
            const on = items === i + 1;
            return (
              <motion.div key={d.c} className="flex items-center justify-center rounded-[24px]" style={{ ...CARD(tone), width: 116, height: 128, outline: on ? `4px solid ${GOLD}` : undefined }}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, scale: on ? 1.12 : 1 }} transition={{ type: 'spring', bounce: 0.4, delay: items ? 0 : 0.2 + i * 0.15 }}>
                <Hear id={d.id}><span lang="ar" style={{ ...AR, fontSize: 80, color: DEEP }}>{d.c}</span></Hear>
              </motion.div>
            );
          })}
        </div>
      )}
      {lines >= 2 && (
        <Svg>
          <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease }}>
            <path d="M 860 800 C 870 720, 930 700, 955 690 L 955 600 C 905 590, 880 545, 880 485 C 880 410, 935 360, 1000 360 C 1070 360, 1120 410, 1120 480 C 1120 500, 1140 520, 1132 532 C 1124 544, 1112 540, 1110 556 C 1108 590, 1080 600, 1040 598 L 1032 690 C 1060 700, 1120 720, 1130 800 Z"
              fill={dark ? '#2A3D45' : '#EAD2B6'} stroke={dark ? '#5C7480' : '#C9A889'} strokeWidth={3} />
          </motion.g>
          <motion.circle cx={throat.x} cy={throat.y} r={30} fill={GOLD} style={{ filter: `drop-shadow(0 0 14px ${GOLD})`, transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
            initial={{ scale: 0, opacity: 0 }} animate={reduce ? { scale: 1, opacity: 0.9 } : { scale: [0.8, 1.15, 0.8], opacity: 0.9 }} transition={{ duration: 1.2, repeat: reduce ? 0 : Infinity, delay: 0.6 }} />
          {[0, 1, 2].map((i) => (
            <motion.path key={i} d={`M ${1150 + i * 26} ${505 - i * 16} q 18 ${28 + i * 16} 0 ${56 + i * 32}`} fill="none" stroke={ACCENT(tone)} strokeWidth={5} strokeLinecap="round"
              initial={{ opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0] }} transition={{ duration: 1.4, delay: 0.8 + i * 0.2, repeat: reduce ? 0 : Infinity }} />
          ))}
        </Svg>
      )}
      {lines >= 2 && <Tag tone={tone} x={985} y={750} color="#B07A1E" delay={0.8}>deep in the throat</Tag>}
      {lines >= 4 && <Tag tone={tone} x={830} y={560} color={CRIMSON} solid delay={0.3}>hand here!</Tag>}
    </>
  );
}

/* ---------- meet alif ---------- */

export function AlifScene({ lines, tone, example }: { lines: number; tone: Tone; example: string }) {
  const A = { x: 900, y: 650, size: 600 };
  useCue('pen', lines >= 2, 0.5);
  useCue('chime', lines >= 3, 0.3);
  useCue('pen', lines >= 4, 0.8);
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter key={lines >= 2 ? 'write' : 'show'} ch="ا" x={A.x} y={A.y} size={A.size} width={30} color={STROKE(tone)} instant={lines < 2} delay={0.6} speed={0.6} />}
        {lines >= 2 && lines < 4 && (
          <>
            <motion.circle cx={A.x + 12} cy={A.y - 320} r={16} fill={GOLD} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }} transition={{ type: 'spring', bounce: 0.5 }} />
            <Draw d={`M ${A.x + 90} ${A.y - 300} L ${A.x + 90} ${A.y - 40}`} color={ACCENT(tone)} width={6} dur={1.8} delay={0.6} />
            <motion.path d={`M ${A.x + 72} ${A.y - 62} L ${A.x + 90} ${A.y - 36} L ${A.x + 108} ${A.y - 62}`} fill="none" stroke={ACCENT(tone)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }} />
          </>
        )}
      </Svg>
      {lines >= 2 && lines < 4 && <Tag tone={tone} x={A.x + 170} y={A.y - 340} color={TEAL} delay={0.3}>start at the top</Tag>}
      {lines >= 3 && <Rings x={A.x + 12} y={A.y - 170} color={GOLD} r={60} />}
      {lines === 3 && <Tag tone={tone} x={1200} y={A.y - 220} color={CRIMSON} solid delay={0.3}>aa</Tag>}
      {lines === 3 && <Tag tone={tone} x={1200} y={A.y - 150} color={INK_TEXT} delay={0.6}>{example}</Tag>}
      {lines >= 1 && (
        <div className="pointer-events-auto absolute" style={{ left: A.x - 80, top: A.y - 340, width: 180, height: 360 }}>
          <Hear id="alif"><span style={{ display: 'block', width: 180, height: 360 }} /></Hear>
        </div>
      )}
      {lines >= 4 && (
        <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: 1060, top: 520, width: 280, height: 210, background: '#FFFDF5', transform: 'rotate(-3deg)', boxShadow: '0 22px 40px -24px rgba(0,0,0,0.6)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 36px, rgba(15,163,184,0.18) 36px 38px)' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <svg className="absolute inset-0 overflow-visible" viewBox="0 0 280 210">
            {[0, 1, 2].map((i) => <WriteLetter key={i} ch="ا" x={210 - i * 70} y={178} size={160} width={22} color={INK_TEXT} delay={0.7 + i * 0.9} />)}
          </svg>
        </motion.div>
      )}
    </>
  );
}

/* ---------- next time: three bodies wait for their dots ---------- */

export function NextBodies({ lines, tone, y = 560 }: { lines: number; tone: Tone; y?: number }) {
  const colors = tone === 'light' ? [GOLD, TEAL, CRIMSON] : [GOLD, '#5FD3DD', '#FF8A80'];
  return (
    <Svg>
      {lines >= 2 && ['ث', 'ت', 'ب'].map((c, i) => (
        <WriteLetter key={c} ch={c} x={900 + i * 210} y={y} size={190} color={colors[i]} dots={false} delay={0.2 + i * 0.3} />
      ))}
      {lines >= 3 && ['ث', 'ت', 'ب'].map((c, i) => (
        <WriteLetter key={`${c}d`} ch={c} x={900 + i * 210} y={y} size={190} color={colors[i]} instant />
      ))}
    </Svg>
  );
}
