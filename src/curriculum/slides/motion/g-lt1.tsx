import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, DEEP } from './kit';
import { WriteLetter, LETTERS } from './letters';
import { Hear } from '../Say';

/**
 * Literacy A · Adults · Lesson 1 · Fewer Shapes Than You Think. The Adults paper stage: letters in ink, written stroke by
 * stroke, with crimson for the part that matters on each step (the dots). No characters with faces, no cartoon eyes:
 * one faceless adult on the street pages. No religious content (design §4.1).
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };

/** Dots dropping on to a body already on the stage. */
function DropDots({ ch, x, y, size = 300, color = CRIMSON, delay = 0 }: { ch: string; x: number; y: number; size?: number; color?: string; delay?: number }) {
  const s = size / 300;
  return (
    <g transform={`translate(${x - size / 2} ${y - 200 * s}) scale(${s})`}>
      {LETTERS[ch].dots.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={19} fill={color} initial={{ y: -160, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.9, delay: delay + i * 0.22 }} />
      ))}
    </g>
  );
}

/** Sound rings from a point. */
function Rings({ x, y, color = GOLD }: { x: number; y: number; color?: string }) {
  const reduce = useReduce();
  return (
    <Svg>
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={x} cy={y} r={34} fill="none" stroke={color} strokeWidth={3} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          initial={{ scale: 0.5, opacity: 0.9 }} animate={reduce ? { scale: 1.5, opacity: 0.4 } : { scale: [0.5, 2.3], opacity: [0.9, 0] }}
          transition={{ duration: 1.6, delay: i * 0.35, repeat: reduce ? 0 : Infinity, repeatDelay: 0.4 }} />
      ))}
    </Svg>
  );
}

/** An invisible tap zone that plays a clip. */
function Tap({ id, x, y, w, h }: { id: string; x: number; y: number; w: number; h: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <Hear id={id} style={{ width: w, height: h, display: 'block' }}><span style={{ display: 'block', width: w, height: h }} /></Hear>
    </div>
  );
}

/** The sound card: the Latin sound, and the English word that carries it. */
function SoundCard({ x, y, text, sub }: { x: number; y: number; text: string; sub?: string }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[22px]" style={{ left: x - 100, top: y, width: 200, padding: '12px 0 14px', background: '#FFFDF8', boxShadow: '0 20px 40px -24px rgba(60,30,10,0.55)' }}
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease }}>
      <span className="font-serif" style={{ fontSize: 60, lineHeight: 1, color: CRIMSON }}>{text}</span>
      {sub && <span className="mt-1 font-sans font-semibold" style={{ fontSize: 18, color: soft('light') }}>{sub}</span>}
    </motion.div>
  );
}

/** A right-to-left arrow above a letter: the direction of the pen. */
function PenDirection({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <Svg>
      <Draw d={`M ${x1} ${y} C ${x1 - 80} ${y - 26}, ${x2 + 80} ${y - 26}, ${x2} ${y}`} color={TEAL} width={4} dash="4 12" dur={1.1} />
      <Draw d={`M ${x2 + 22} ${y - 16} L ${x2} ${y} L ${x2 + 26} ${y + 12}`} color={TEAL} width={4} delay={1} dur={0.3} />
    </Svg>
  );
}

/* ---------- spark ---------- */

/** Three bowls written in ink; their dots land in crimson. */
export function Lt1CoverGraphic(_: GraphicProps) {
  return (
    <Svg>
      {['ب', 'ت', 'ث'].map((ch, i) => (
        <React.Fragment key={ch}>
          <WriteLetter ch={ch} x={1400 - i * 200} y={600 + (i % 2) * 40} size={190} color={INK_TEXT} width={22} dots={false} delay={0.2 + i * 0.5} speed={1.4} />
          <DropDots ch={ch} x={1400 - i * 200} y={600 + (i % 2) * 40} size={190} delay={1.6 + i * 0.4} />
        </React.Fragment>
      ))}
    </Svg>
  );
}

/** A shop sign that reads as one line; then the count that shrinks it: 28 letters, fewer than 20 shapes; then one body
 *  takes three sets of dots. */
export function Lt1SignGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      {lines >= 1 && <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: 840, top: 170, width: 620, height: 150, background: '#1F3B3F', boxShadow: '0 26px 50px -26px rgba(20,20,20,0.7), inset 0 0 0 6px #C9A45C' }}
        initial={{ opacity: 0, y: -30 }} animate={{ opacity: lines >= 2 ? 0.55 : 1, y: 0, scale: lines >= 2 ? 0.86 : 1 }} transition={{ duration: 0.8, ease }}>
        <span lang="ar" style={{ ...AR, fontSize: 84, color: '#F6E3B8', letterSpacing: 0 }}>مخبز الحيّ الجديد</span>
      </motion.div>}
      {lines < 2 && <Person x={1150} y={800} scale={1.1} color={TEAL} />}
      {lines >= 2 && (
        <div className="absolute flex items-end gap-10" style={{ left: 870, top: 380 }}>
          <motion.div className="flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <span className="font-serif" style={{ fontSize: 130, lineHeight: 1, color: soft('light'), textDecoration: 'line-through', textDecorationColor: CRIMSON, textDecorationThickness: 6 }}>28</span>
            <span className="font-sans font-bold" style={{ fontSize: 20, color: soft('light') }}>letters</span>
          </motion.div>
          <motion.span className="font-sans font-black" style={{ fontSize: 50, color: CRIMSON, paddingBottom: 60 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>→</motion.span>
          <motion.div className="flex flex-col items-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: 'spring', bounce: 0.35 }}>
            <span className="font-serif" style={{ fontSize: 130, lineHeight: 1, color: CRIMSON }}>&lt;20</span>
            <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>shapes</span>
          </motion.div>
        </div>
      )}
      {lines >= 3 && (
        <Svg>
          {['ب', 'ت', 'ث'].map((ch, i) => (
            <React.Fragment key={ch}>
              <WriteLetter ch={ch} x={1390 - i * 120} y={760} size={110} color={INK_TEXT} width={24} dots={false} instant={reduce} delay={i * 0.15} speed={2} />
              <DropDots ch={ch} x={1390 - i * 120} y={760} size={110} delay={0.8 + i * 0.3} />
            </React.Fragment>
          ))}
        </Svg>
      )}
    </>
  );
}

/** Three bodies with no dots; then the dots arrive. */
export function Lt1GuessGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const xs = [1380, 1130, 880];
  const chars = ['ب', 'ت', 'ث'];
  return (
    <Svg>
      {chars.map((ch, i) => <WriteLetter key={ch} ch={ch} x={xs[i]} y={520} size={230} dots={false} color={INK_TEXT} width={22} delay={i * 0.3} />)}
      {lines >= 2 && chars.map((ch, i) => <DropDots key={ch} ch={ch} x={xs[i]} y={520} size={230} color={interaction ? CRIMSON : GOLD} delay={0.2 + i * 0.4} />)}
    </Svg>
  );
}

/* ---------- zad ---------- */

/** Alif is written top to bottom; its sound; then it stands as the landmark above a line of short letters. */
export function Lt1AlifGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && lines < 3 && <WriteLetter ch="ا" x={1130} y={700} size={480} color={INK_TEXT} width={26} />}
        {lines >= 1 && lines < 3 && <Draw d="M 1270 260 L 1270 600" color={TEAL} width={4} dash="4 12" dur={1} />}
        {lines >= 1 && lines < 3 && <Draw d="M 1256 578 L 1270 602 L 1284 578" color={TEAL} width={4} delay={0.9} dur={0.3} />}
      </Svg>
      {lines === 2 && <><Rings x={1130} y={460} /><SoundCard x={1400} y={300} text="aa" sub="as in father" /><Tap id="alif" x={1060} y={260} w={160} h={460} /></>}
      {lines >= 3 && (
        <>
          <motion.div className="absolute" style={{ left: 820, top: 330, width: 680 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <p lang="ar" className="m-0 text-center" style={{ ...AR, fontSize: 110, lineHeight: 1.5, color: INK_TEXT }}>
              بـ<span style={{ color: CRIMSON }}>ا</span>ب ثـ<span style={{ color: CRIMSON }}>ا</span>بت
            </p>
          </motion.div>
          <Svg><Draw d="M 830 560 L 1490 560" color={GOLD} width={2} dash="6 8" /></Svg>
          <Chip x={1160} y={620} color={CRIMSON} delay={0.6}>alif: the tallest letter on the line</Chip>
          <Tap id="alif" x={1300} y={340} w={60} h={160} />
        </>
      )}
    </>
  );
}

/** Baa: the bowl is written right to left; the dot drops under it; "b". */
export function Lt1BaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ب" x={1130} y={620} size={560} color={INK_TEXT} width={24} dots={false} />}
        {lines >= 2 && <DropDots ch="ب" x={1130} y={620} size={560} />}
      </Svg>
      {lines >= 1 && <PenDirection x1={1390} x2={870} y={360} />}
      {lines >= 1 && <Chip x={1130} y={280} color={TEAL} delay={0.4}>right to left</Chip>}
      {lines >= 3 && <><Rings x={1130} y={600} /><SoundCard x={1400} y={190} text="b" sub="as in book" /><Tap id="baa" x={900} y={380} w={460} h={360} /></>}
      {lines >= 4 && (
        <>
          <Svg><motion.circle cx={1390} cy={360} r={16} fill={TEAL} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ duration: 0.7 }} /></Svg>
          <Chip x={1390} y={400} color={TEAL} delay={0.3}>start here</Chip>
        </>
      )}
    </>
  );
}

/** Taa: the same bowl; two dots land on top, right one first; "t". */
export function Lt1TaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ت" x={1130} y={620} size={560} color={INK_TEXT} width={24} dots={false} instant={lines > 1} />}
        {lines >= 1 && <DropDots ch="ت" x={1130} y={620} size={560} color={CRIMSON} delay={0.8} />}
      </Svg>
      {lines >= 2 && <><Rings x={1130} y={600} color={TEAL} /><SoundCard x={1400} y={190} text="t" sub="as in tea" /><Tap id="taa" x={900} y={360} w={460} h={380} /></>}
      {lines >= 3 && (
        <Svg>
          <motion.text x={1210} y={440} fontSize={34} fontWeight={800} fill={TEAL} fontFamily="sans-serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>1</motion.text>
          <motion.text x={1030} y={440} fontSize={34} fontWeight={800} fill={TEAL} fontFamily="sans-serif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>2</motion.text>
        </Svg>
      )}
    </>
  );
}

/** Thaa: three dots; "th" as in think; three counters. */
export function Lt1ThaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <WriteLetter ch="ث" x={1080} y={640} size={560} color={INK_TEXT} width={24} dots={false} instant={lines > 1} />}
        {lines >= 1 && <DropDots ch="ث" x={1080} y={640} size={560} color={CRIMSON} delay={0.8} />}
      </Svg>
      {lines >= 2 && <><SoundCard x={1400} y={190} text="th" sub="as in think" /><Tap id="thaa" x={850} y={330} w={460} h={420} /></>}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-3" style={{ left: 1320, top: 360 }}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 52, height: 52, fontSize: 26, background: CRIMSON }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 + i * 0.3 }}>{i + 1}</motion.span>
          ))}
          <motion.span className="self-center font-sans font-bold" style={{ fontSize: 22, color: INK_TEXT }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>three</motion.span>
        </div>
      )}
    </>
  );
}

/** The wow: one bowl cycles b → t → th, then the families of the alphabet fill the board, each body with its dot sets. */
export function Lt1SystemGraphic({ lines, items }: GraphicProps) {
  const families = [
    ['ب', 'ت', 'ث'],
    ['ج', 'ح', 'خ'],
    ['د', 'ذ', 'ر', 'ز'],
    ['س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ'],
  ];
  const count = [3, 6, 10, 18];
  if (items === 0) {
    return (
      <>
        <Svg>
          {lines === 1 && <WriteLetter ch="ب" x={1130} y={600} size={520} color={INK_TEXT} width={24} />}
          {lines === 2 && ['ب', 'ت', 'ث'].map((ch, i) => (
            <React.Fragment key={ch}>
              <WriteLetter ch={ch} x={1380 - i * 250} y={560} size={230} color={INK_TEXT} width={22} dots={false} instant />
              <DropDots ch={ch} x={1380 - i * 250} y={560} size={230} delay={0.3 + i * 0.4} />
            </React.Fragment>
          ))}
          {lines >= 3 && <WriteLetter ch="ب" x={1130} y={560} size={520} color={INK_TEXT} width={24} dots={false} instant />}
        </Svg>
        {lines === 1 && <SoundCard x={1400} y={190} text="b" />}
        {lines === 2 && ['b', 't', 'th'].map((t, i) => <Chip key={t} x={1380 - i * 250} y={640} color={CRIMSON} delay={0.6 + i * 0.4}>{t}</Chip>)}
        {lines >= 3 && (
          <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 860, top: 660, width: 540, padding: '12px 18px', background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <span className="font-sans font-semibold" style={{ fontSize: 19, color: INK_TEXT }}>Without the dots, b, t and th are one shape. Context had to tell them apart.</span>
          </motion.div>
        )}
      </>
    );
  }
  return (
    <>
      {families.slice(0, items).map((f, i) => (
        <motion.div key={i} className="absolute flex items-center gap-4 rounded-[20px]" style={{ left: 800, top: 200 + i * 132, width: 700, padding: '6px 24px', direction: 'rtl', background: '#FFFDF8', boxShadow: i === items - 1 ? `0 0 0 3px ${CRIMSON}, 0 18px 34px -24px rgba(60,30,10,0.6)` : '0 18px 34px -24px rgba(60,30,10,0.6)' }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          {f.map((ch, j) => (
            <motion.span key={ch} lang="ar" style={{ ...AR, fontSize: f.length > 4 ? 64 : 80, lineHeight: 1.3, color: j % 2 ? CRIMSON : INK_TEXT }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + j * 0.1 }}>{ch}</motion.span>
          ))}
        </motion.div>
      ))}
      <motion.div key={items} className="pointer-events-none absolute flex items-baseline gap-2" style={{ left: 820, top: 740 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="font-serif" style={{ fontSize: 56, color: CRIMSON }}>{count[items - 1]}</span>
        <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>letters so far, from {[1, 2, 4, 8][items - 1]} {items === 1 ? 'body' : 'bodies'}</span>
      </motion.div>
    </>
  );
}

/* ---------- athar ---------- */

/** A jar label with the six letters of the question on it. */
export function Lt1FindGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute" style={{ left: 960, top: 200, width: 360, height: 520 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
        <div className="absolute rounded-[16px]" style={{ left: 60, top: 0, width: 240, height: 50, background: '#8B4935' }} />
        <div className="absolute rounded-[40px]" style={{ left: 0, top: 44, width: 360, height: 476, background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(220,200,170,0.5))', boxShadow: 'inset 0 0 0 3px rgba(150,120,80,0.35)' }} />
        <div className="absolute flex flex-col items-center justify-center rounded-[10px]" style={{ left: 30, top: 170, width: 300, height: 200, background: '#FFFDF5', boxShadow: '0 12px 24px -16px rgba(60,30,10,0.6)' }}>
          <span lang="ar" style={{ ...AR, fontSize: 50, color: INK_TEXT, whiteSpace: 'nowrap' }}>ت ب ث ت ا ب</span>
          <span className="font-sans font-semibold" style={{ fontSize: 16, color: soft('light') }}>label</span>
        </div>
      </motion.div>
    </>
  );
}

/** b + aa + b slide together into بَاب (the gap after alif glows); then ثَابِت with today's four letters lit. */
export function Lt1WordGraphic({ lines }: GraphicProps) {
  const joined = lines >= 2;
  return (
    <>
      {lines === 1 && (
        <Svg>
          <WriteLetter ch="ب" x={1400} y={480} size={200} color={INK_TEXT} width={22} />
          <WriteLetter ch="ا" x={1180} y={480} size={200} color={CRIMSON} width={22} delay={0.4} />
          <WriteLetter ch="ب" x={960} y={480} size={200} color={INK_TEXT} width={22} delay={0.8} />
        </Svg>
      )}
      {joined && (
        <motion.div className="absolute text-center" style={{ left: 880, top: lines >= 4 ? 150 : 200, width: 560 }} initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: lines >= 4 ? 0.7 : 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease }}>
          <Hear id="baab"><span lang="ar" style={{ ...AR, fontSize: 200, lineHeight: 1.1, color: INK_TEXT }}>بَا<span style={{ color: CRIMSON }}>بٌ</span></span></Hear>
          {lines < 4 && <p className="m-0 mt-6 font-sans font-bold" style={{ fontSize: 24, color: TEAL }}>baabun · tap to listen</p>}
        </motion.div>
      )}
      {lines >= 2 && lines < 4 && <Chip x={1110} y={560} color={GOLD} delay={0.6}>alif lets go: the gap</Chip>}
      {lines >= 3 && lines < 4 && <Chip x={1160} y={630} strong delay={0.3}>a door</Chip>}
      {lines >= 4 && (
        <motion.div className="absolute text-center" style={{ left: 840, top: 400, width: 640 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <Hear id="thaabit"><span lang="ar" style={{ ...AR, fontSize: 170, lineHeight: 1.15, color: DEEP }}>ثَابِتٌ</span></Hear>
          <p className="m-0 mt-12 font-sans font-bold" style={{ fontSize: 24, color: TEAL }}>thaabitun · steady</p>
        </motion.div>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

/** A phone frames a street sign; the letters you know light up inside it. */
export function Lt1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1400} y={800} scale={1.05} color={TEAL} />
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[12px]" style={{ left: 820, top: 220, width: 520, height: 120, background: '#1F3B3F', boxShadow: 'inset 0 0 0 5px #C9A45C' }}
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <span lang="ar" style={{ ...AR, fontSize: 64, color: '#F6E3B8' }}>
            {lines >= 3 ? <><span style={{ color: '#FF8A7A' }}>ب</span>يت ال<span style={{ color: '#FF8A7A' }}>ث</span>ق<span style={{ color: '#FF8A7A' }}>ا</span>فة</> : 'بيت الثقافة'}
          </span>
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute rounded-[28px]" style={{ left: 930, top: 160, width: 300, height: 540, border: `10px solid ${INK_TEXT}`, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0, y: 60, rotate: 6 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: 0.9, ease }}>
          <div className="absolute rounded-full" style={{ left: '50%', bottom: 18, width: 54, height: 54, marginLeft: -27, border: `4px solid ${INK_TEXT}`, background: '#FFFDF8' }} />
        </motion.div>
      )}
      {lines >= 3 && <Chip x={1080} y={740} color={CRIMSON} delay={0.4}>ب · ا · ث: you can already find these</Chip>}
    </>
  );
}

/** Three cups: a dot inside, none, a dot on top; and the breath of the new sound. */
export function Lt1NextGraphic({ lines }: GraphicProps) {
  const cups = [{ ch: 'ج', c: INK_TEXT }, { ch: 'ح', c: CRIMSON }, { ch: 'خ', c: INK_TEXT }];
  return (
    <>
      {lines >= 1 && (
        <div className="pointer-events-none absolute flex gap-12" style={{ left: 880, top: 260, direction: 'rtl' }}>
          {cups.map((k, i) => (
            <motion.span key={k.ch} lang="ar" style={{ ...AR, fontSize: 170, lineHeight: 1, color: lines >= 2 ? k.c : INK_TEXT, transition: 'color 0.6s' }}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.3, delay: i * 0.25 }}>{k.ch}</motion.span>
          ))}
        </div>
      )}
      {lines >= 2 && (
        <Svg>
          {[0, 1, 2].map((i) => <Draw key={i} d={`M ${1060 + i * 30} 560 C ${1080 + i * 30} 600, ${1040 + i * 30} 640, ${1070 + i * 30} 690`} color={TEAL} width={4} delay={0.3 + i * 0.2} dur={0.9} opacity={0.7} />)}
        </Svg>
      )}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-10" style={{ left: 940, top: 720, direction: 'rtl' }}>
          {['د', 'ذ'].map((ch, i) => (
            <motion.span key={ch} lang="ar" style={{ ...AR, fontSize: 90, lineHeight: 1, color: INK_TEXT }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.2 }}>{ch}</motion.span>
          ))}
        </div>
      )}
    </>
  );
}
