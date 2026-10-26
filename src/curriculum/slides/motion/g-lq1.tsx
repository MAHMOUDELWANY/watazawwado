import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Chip } from './kit';
import { WriteLetter, LETTERS } from './letters';
import { AR } from './g-lang';
import { Hear } from '../Say';

/**
 * Literacy A · Teens · Lesson 1 · Crack the Code. Teens stage, a code-breaking motif: a phone with a message, a lock whose
 * dials are letters, letters that "unlock" with a click of dots. No faces, no religious content (design §4.1).
 */

function Dots({ ch, x, y, size, color = CRIMSON, delay = 0 }: { ch: string; x: number; y: number; size: number; color?: string; delay?: number }) {
  const s = size / 300;
  return (
    <g transform={`translate(${x - size / 2} ${y - 200 * s}) scale(${s})`}>
      {LETTERS[ch].dots.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={19} fill={color} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          transition={{ type: 'spring', bounce: 0.55, duration: 0.6, delay: delay + i * 0.15 }} />
      ))}
    </g>
  );
}

function Tap({ id, x, y, w, h }: { id: string; x: number; y: number; w: number; h: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <Hear id={id} style={{ width: w, height: h, display: 'block' }}><span style={{ display: 'block', width: w, height: h }} /></Hear>
    </div>
  );
}

/** A phone outline; children render on its screen. */
function Phone({ x, y, children, rotate = -4 }: { x: number; y: number; children?: React.ReactNode; rotate?: number }) {
  return (
    <motion.div className="absolute overflow-hidden rounded-[34px]" style={{ left: x, top: y, width: 320, height: 560, background: '#101418', boxShadow: '0 40px 70px -30px rgba(0,0,0,0.6)', padding: 12 }}
      initial={{ opacity: 0, y: 60, rotate: 10 }} animate={{ opacity: 1, y: 0, rotate }} transition={{ duration: 0.9, ease }}>
      <div className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ background: '#ECE5DD' }}>{children}</div>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Lq1CoverGraphic(_: GraphicProps) {
  return (
    <Svg>
      {['ب', 'ت', 'ث'].map((ch, i) => (
        <React.Fragment key={ch}>
          <WriteLetter ch={ch} x={1400 - i * 210} y={560} size={200} color={INK_TEXT} width={24} dots={false} delay={i * 0.4} speed={1.6} />
          <Dots ch={ch} x={1400 - i * 210} y={560} size={200} color={[CRIMSON, TEAL, GOLD][i]} delay={1.4 + i * 0.4} />
        </React.Fragment>
      ))}
    </Svg>
  );
}

/** The message arrives; it reads as one line; then the count shrinks: 28 letters, under 20 shapes. */
export function Lq1MessageGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Phone x={1120} y={170}>
          <motion.div className="absolute rounded-[16px]" style={{ right: 14, top: 90, maxWidth: 250, padding: '10px 14px', background: '#FFFFFF', boxShadow: '0 4px 10px -6px rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.8 }}>
            <span lang="ar" style={{ ...AR, fontSize: 30, color: INK_TEXT, fontWeight: 600 }}>ثابت على الموعد بكرة؟</span>
          </motion.div>
          {lines >= 2 && <motion.span className="absolute rounded-full font-sans font-black text-white" style={{ left: 30, top: 200, padding: '4px 14px', fontSize: 30, background: CRIMSON }} initial={{ scale: 0 }} animate={{ scale: 1 }}>???</motion.span>}
        </Phone>
      )}
      {lines >= 3 && (
        <motion.div className="absolute flex items-end gap-6" style={{ left: 800, top: 600, transform: 'scale(0.8)', transformOrigin: 'left top' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col items-center">
            <span className="font-serif" style={{ fontSize: 110, lineHeight: 1, color: soft('light'), textDecoration: 'line-through', textDecorationColor: CRIMSON, textDecorationThickness: 6 }}>28</span>
            <span className="font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>letters</span>
          </div>
          <motion.div className="flex flex-col items-center" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}>
            <span className="font-serif" style={{ fontSize: 110, lineHeight: 1, color: CRIMSON }}>&lt;20</span>
            <span className="font-sans font-bold" style={{ fontSize: 18, color: INK_TEXT }}>shapes</span>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

export function Lq1GuessGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const xs = [1380, 1130, 880];
  return (
    <Svg>
      {['ب', 'ت', 'ث'].map((ch, i) => <WriteLetter key={ch} ch={ch} x={xs[i]} y={520} size={230} dots={false} color={INK_TEXT} width={24} delay={i * 0.25} speed={1.5} />)}
      {lines >= 2 && ['ب', 'ت', 'ث'].map((ch, i) => <Dots key={ch} ch={ch} x={xs[i]} y={520} size={230} color={interaction ? CRIMSON : GOLD} delay={0.2 + i * 0.3} />)}
    </Svg>
  );
}

/* ---------- zad ---------- */

export function Lq1AlifGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ا" x={1130} y={700} size={480} color={INK_TEXT} width={26} />}
        {lines >= 1 && <Draw d="M 1270 260 L 1270 600" color={TEAL} width={4} dash="4 12" dur={1} />}
      </Svg>
      {lines >= 2 && (
        <>
          <motion.span className="pointer-events-none absolute rounded-[18px] font-sans font-black" style={{ left: 1330, top: 260, padding: '6px 22px', fontSize: 54, color: CRIMSON, background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>aa</motion.span>
          <Tap id="alif" x={1060} y={260} w={160} h={460} />
        </>
      )}
      {lines >= 3 && <Chip x={1130} y={740} color={CRIMSON} delay={0.2}>the tallest: your landmark</Chip>}
    </>
  );
}

/** One bowl; dots click on: b, then t, then th; each sound card stacks up on the right. */
export function Lq1ThreeGraphic({ lines }: GraphicProps) {
  const step = Math.min(lines, 4);
  const ch = step >= 4 ? 'ث' : step >= 3 ? 'ت' : 'ب';
  const color = step >= 4 ? GOLD : step >= 3 ? TEAL : CRIMSON;
  const cards = [{ s: 'b', id: 'baa', c: CRIMSON, l: 'ب' }, { s: 't', id: 'taa', c: TEAL, l: 'ت' }, { s: 'th', id: 'thaa', c: GOLD, l: 'ث' }];
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ب" x={1000} y={600} size={460} color={INK_TEXT} width={26} dots={false} instant={lines > 1} />}
        {lines >= 2 && <Dots key={ch} ch={ch} x={1000} y={600} size={460} color={color} />}
      </Svg>
      {lines === 1 && <Chip x={1000} y={300} color={TEAL}>right ← left</Chip>}
      {cards.slice(0, Math.max(0, step - 1)).map((c, i) => (
        <motion.div key={c.s} className="absolute flex items-center gap-3 rounded-[18px]" style={{ left: 1300, top: 220 + i * 130, padding: '8px 18px', background: '#FFFDF8', boxShadow: `0 0 0 3px ${c.c}` }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }}>
          <Hear id={c.id}><span lang="ar" style={{ ...AR, fontSize: 56, color: c.c }}>{c.l}</span></Hear>
          <span className="font-sans font-black" style={{ fontSize: 40, color: INK_TEXT }}>{c.s}</span>
        </motion.div>
      ))}
    </>
  );
}

/** Letters flash in a grid, like a game board. */
export function Lq1SpeedGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  if (lines === 0) return null;
  const grid = ['ت', 'ب', 'ث', 'ت', 'ا', 'ت', 'ب', 'ث', 'ا'];
  return (
    <div className="absolute grid" style={{ left: 880, top: 200, width: 540, gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, direction: 'rtl' }}>
      {grid.map((c, i) => (
        <motion.span key={i} className="flex items-center justify-center rounded-[20px]" style={{ height: 150, background: '#1F2A30', boxShadow: '0 16px 30px -20px rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0, scale: 0.8 }} animate={reduce ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0.35], scale: [0.8, 1, 1, 1] }} transition={{ duration: 2.4, delay: i * 0.25, repeat: reduce ? 0 : Infinity, repeatDelay: 1.2 }}>
          <span lang="ar" style={{ ...AR, fontSize: 80, color: '#F6E3B8' }}>{c}</span>
        </motion.span>
      ))}
    </div>
  );
}

/** The rule as a combination lock: each family is a dial that unlocks; the counter climbs to 18 letters. */
export function Lq1RuleGraphic({ lines, items }: GraphicProps) {
  const fams = [['ب', 'ت', 'ث'], ['ج', 'ح', 'خ'], ['د', 'ذ', 'ر', 'ز'], ['س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ']];
  const count = [3, 6, 10, 18][items - 1] ?? 0;
  if (lines === 0) return null;
  return (
    <>
      {fams.slice(0, Math.max(items, 1)).map((f, i) => (
        <motion.div key={i} className="absolute flex items-center gap-4 rounded-[18px]" style={{ left: 820, top: 200 + i * 125, width: 680, padding: '4px 22px', direction: 'rtl', background: items > i ? '#1F2A30' : '#FFFDF8', boxShadow: '0 16px 30px -22px rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }}>
          <span className="block rounded-full" style={{ width: 22, height: 22, background: items > i ? GOLD : 'transparent', border: `3px solid ${items > i ? GOLD : soft('light')}` }} />
          {f.map((c, j) => <span key={c} lang="ar" style={{ ...AR, fontSize: f.length > 4 ? 52 : 64, lineHeight: 1.4, color: items > i ? (j % 2 ? '#FF8A7A' : '#F6E3B8') : INK_TEXT }}>{c}</span>)}
        </motion.div>
      ))}
      {items >= 1 && (
        <motion.div key={count} className="pointer-events-none absolute flex items-baseline gap-2" style={{ left: 830, top: 720 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-serif" style={{ fontSize: 60, color: CRIMSON }}>{count}</span>
          <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>letters unlocked</span>
        </motion.div>
      )}
    </>
  );
}

/* ---------- athar ---------- */

export function Lq1WordGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute text-center" style={{ left: 880, top: lines >= 3 ? 160 : 220, width: 560 }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: lines >= 3 ? 0.7 : 1 }} transition={{ duration: 0.8, ease }}>
          <Hear id="baab"><span lang="ar" style={{ ...AR, fontSize: 190, lineHeight: 1.2, color: INK_TEXT }}>بَا<span style={{ color: CRIMSON }}>ب</span></span></Hear>
        </motion.div>
      )}
      {lines === 2 && <Chip x={1120} y={560} color={GOLD} delay={0.3}>alif lets go: the gap</Chip>}
      {lines >= 3 && (
        <motion.div className="absolute text-center" style={{ left: 840, top: 420, width: 640 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <Hear id="thaabit"><span lang="ar" style={{ ...AR, fontSize: 160, lineHeight: 1.2, color: CRIMSON }}>ثَابِت</span></Hear>
          <p className="m-0 mt-10 font-sans font-black" style={{ fontSize: 26, color: TEAL }}>BOSS WORD · thaabit · steady</p>
        </motion.div>
      )}
    </>
  );
}

export function Lq1WriteGraphic({ lines }: GraphicProps) {
  return (
    <>
      <motion.div className="absolute rounded-[10px]" style={{ left: 860, top: 200, width: 600, height: 460, background: '#FFFDF5', boxShadow: '0 30px 50px -28px rgba(60,30,10,0.55)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 58px, rgba(15,163,184,0.18) 58px 60px)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />
      {lines >= 1 && (
        <Svg>
          {['ب', 'ت', 'ث'].map((ch, i) => <WriteLetter key={ch} ch={ch} x={1340 - i * 190} y={380} size={150} color={INK_TEXT} width={24} delay={0.3 + i * 0.9} speed={1.6} />)}
        </Svg>
      )}
      {lines >= 2 && <motion.span lang="ar" className="pointer-events-none absolute" style={{ ...AR, left: 1000, top: 450, fontSize: 110, color: CRIMSON }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>بَاب</motion.span>}
    </>
  );
}

/* ---------- ahd ---------- */

export function Lq1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Phone x={1060} y={170} rotate={3}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1F3B3F' }}>
            <span lang="ar" style={{ ...AR, fontSize: 52, color: '#F6E3B8' }}><span style={{ color: '#FF8A7A' }}>ب</span>ي<span style={{ color: '#FF8A7A' }}>ت</span> الش<span style={{ color: '#FF8A7A' }}>ا</span>ي</span>
          </div>
          {lines >= 2 && <motion.div className="absolute inset-0" style={{ background: '#fff' }} initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.5, delay: 0.3 }} />}
        </Phone>
      )}
      {lines >= 2 && <Chip x={1220} y={760} color={CRIMSON} delay={0.6}>screenshot · show it next lesson</Chip>}
    </>
  );
}

export function Lq1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <div className="pointer-events-none absolute flex gap-12" style={{ left: 880, top: 260, direction: 'rtl' }}>
          {['ج', 'ح', 'خ'].map((k, i) => (
            <motion.span key={k} lang="ar" style={{ ...AR, fontSize: 170, lineHeight: 1, color: lines >= 2 && i === 1 ? CRIMSON : INK_TEXT }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.3, delay: i * 0.2 }}>{k}</motion.span>
          ))}
        </div>
      )}
      {lines >= 2 && <Svg>{[0, 1, 2].map((i) => <Draw key={i} d={`M ${1080 + i * 30} 560 C ${1100 + i * 30} 600, ${1060 + i * 30} 640, ${1090 + i * 30} 690`} color={TEAL} width={4} delay={0.3 + i * 0.2} dur={0.9} opacity={0.7} />)}</Svg>}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-10" style={{ left: 960, top: 720, direction: 'rtl' }}>
          {['د', 'ذ'].map((ch) => <span key={ch} lang="ar" style={{ ...AR, fontSize: 80, color: INK_TEXT }}>{ch}</span>)}
        </div>
      )}
    </>
  );
}
