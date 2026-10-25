import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Person, Bubble, Chip } from './kit';
import { WriteLetter, LETTERS } from './letters';
import { Hear } from '../Say';

/**
 * Literacy A · Kids · Lesson 1 · Dots Make the Difference. Look A, "letter friends" (Claude's pick, 2026-10-25, owner may
 * change): the letters are the cast, written stroke by stroke and then coming alive with eyes; Lina (teal) and Sam (gold)
 * are faceless children. No religious content anywhere (design §4.1).
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const BODY_EYES = [{ x: 132, y: 196 }, { x: 176, y: 196 }]; // on the boat's base, in the 300-box of letters.tsx

/** A letter friend: the letter (body, optionally its dots) with two eyes that blink in; feet at (x, y). */
function Friend({ ch, x, y, size = 300, color = CRIMSON, dots = true, eyes = true, delay = 0, instant = false }: {
  ch: string; x: number; y: number; size?: number; color?: string; dots?: boolean; eyes?: boolean; delay?: number; instant?: boolean;
}) {
  const s = size / 300;
  const at = ch === 'ا' ? [{ x: 136, y: 90 }, { x: 166, y: 90 }] : BODY_EYES;
  return (
    <>
      <WriteLetter ch={ch} x={x} y={y} size={size} color={color} dots={dots} delay={delay} instant={instant} />
      {eyes && (
        <g transform={`translate(${x - size / 2} ${y - 200 * s}) scale(${s})`}>
          {at.map((e, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
              transition={{ type: 'spring', bounce: 0.5, delay: delay + (instant ? 0 : 1.3) + i * 0.08 }}>
              <circle cx={e.x} cy={e.y} r={12} fill="#fff" />
              <circle cx={e.x + 3} cy={e.y + 2} r={6} fill={INK_TEXT} />
            </motion.g>
          ))}
        </g>
      )}
    </>
  );
}

/** Dots dropping onto a body already on the stage (the step that makes the letter). */
function DropDots({ ch, x, y, size = 300, color = CRIMSON, delay = 0 }: { ch: string; x: number; y: number; size?: number; color?: string; delay?: number }) {
  const s = size / 300;
  return (
    <g transform={`translate(${x - size / 2} ${y - 200 * s}) scale(${s})`}>
      {LETTERS[ch].dots.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={19} fill={color} initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.45, duration: 0.9, delay: delay + i * 0.25 }} />
      ))}
    </g>
  );
}

/** Sound rings from a point, and an invisible tap zone over the letter that plays its clip. */
function Sound({ x, y, color = GOLD }: { x: number; y: number; color?: string }) {
  const reduce = useReduce();
  return (
    <Svg>
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={x} cy={y} r={34} fill="none" stroke={color} strokeWidth={4} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          initial={{ scale: 0.5, opacity: 0.9 }} animate={reduce ? { scale: 1.5, opacity: 0.4 } : { scale: [0.5, 2.3], opacity: [0.9, 0] }}
          transition={{ duration: 1.6, delay: i * 0.35, repeat: reduce ? 0 : Infinity, repeatDelay: 0.4 }} />
      ))}
    </Svg>
  );
}

function Tap({ id, x, y, w, h }: { id: string; x: number; y: number; w: number; h: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <Hear id={id} style={{ width: w, height: h, display: 'block' }}><span style={{ display: 'block', width: w, height: h }} /></Hear>
    </div>
  );
}

/** A big sound label: the Latin sound in a bubble. */
function SoundTag({ x, y, text, sub }: { x: number; y: number; text: string; sub?: string }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center rounded-[24px]" style={{ left: x - 90, top: y, width: 180, padding: '10px 0 12px', background: '#FFFDF8', boxShadow: '0 20px 40px -24px rgba(60,30,10,0.55)' }}
      initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}>
      <span className="font-sans font-black" style={{ fontSize: 52, lineHeight: 1, color: CRIMSON }}>{text}</span>
      {sub && <span className="mt-1 font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>{sub}</span>}
    </motion.div>
  );
}

/** The note on the table with the three boats on it. */
function Note({ x, y, w = 520, dots = true, small = false }: { x: number; y: number; w?: number; dots?: boolean; small?: boolean }) {
  const h = w * 0.62;
  const size = small ? 120 : 150;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: x - w / 2, top: y - h / 2, width: w, height: h, background: '#FFFDF5', boxShadow: '0 30px 50px -28px rgba(60,30,10,0.55)', transform: 'rotate(-3deg)', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 38px, rgba(15,163,184,0.18) 38px 40px)' }}
        initial={{ opacity: 0, y: 30, rotate: -12 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ type: 'spring', bounce: 0.3, duration: 1 }} />
      <Svg>
        {['ث', 'ت', 'ب'].map((ch, i) => (
          <WriteLetter key={ch} ch={ch} x={x - w / 2 + w * (0.22 + i * 0.28)} y={y + h * 0.12} size={size} width={26} color={INK_TEXT} dots={dots} delay={0.4 + (2 - i) * 0.5} speed={1.6} />
        ))}
      </Svg>
    </>
  );
}

/* ---------- spark ---------- */

export function La1CoverGraphic(_: GraphicProps) {
  return (
    <Svg>
      <Friend ch="ث" x={900} y={560} size={230} color={GOLD} delay={1.2} />
      <Friend ch="ت" x={1140} y={500} size={250} color={TEAL} delay={0.7} />
      <Friend ch="ب" x={1370} y={560} size={270} delay={0.2} />
    </Svg>
  );
}

/** Lina finds the note; the boats wiggle; Sam squints with a question. */
export function La1NoteGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      <Person x={830} y={800} scale={1.15} color={TEAL} />
      {lines >= 1 && (
        <motion.div className="absolute inset-0" animate={lines >= 2 && !reduce ? { rotate: [0, -0.6, 0.6, 0] } : {}} transition={{ duration: 1.6, repeat: Infinity }} style={{ transformOrigin: '1150px 420px' }}>
          <Note x={1150} y={420} />
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          <Person x={1450} y={800} scale={1} color={GOLD} delay={0.1} />
          <Bubble x={1380} y={600} text={<span style={{ fontSize: 22 }}>Same letter, three times?</span>} width={250} align="right" delay={0.4} />
        </>
      )}
    </>
  );
}

/** The three bodies with no dots; then the dots arrive and pulse. */
export function La1GuessGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const xs = [1380, 1130, 880];
  const chars = ['ب', 'ت', 'ث'];
  return (
    <Svg>
      {chars.map((ch, i) => <Friend key={ch} ch={ch} x={xs[i]} y={470} size={230} dots={false} eyes={false} color={INK_TEXT} delay={i * 0.3} />)}
      {lines >= 2 && chars.map((ch, i) => <DropDots key={ch} ch={ch} x={xs[i]} y={470} size={230} color={interaction ? CRIMSON : GOLD} delay={0.2 + i * 0.4} />)}
    </Svg>
  );
}

/* ---------- zad ---------- */

/** Alif is written top to bottom, wakes up, and says "aa". */
export function La1AlifGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <Friend ch="ا" x={1130} y={660} size={480} eyes={lines >= 2} />}
        {lines >= 2 && <motion.path d="M 1260 260 L 1260 560" stroke={TEAL} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" markerEnd="" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease }} />}
        {lines >= 2 && <motion.path d="M 1244 540 L 1260 566 L 1276 540" fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />}
      </Svg>
      {lines >= 3 && <><Sound x={1180} y={330} /><SoundTag x={1400} y={300} text="aa" sub="as in father" /><Tap id="alif" x={1060} y={250} w={160} h={420} /></>}
    </>
  );
}

/** Baa: the boat is written right to left, the dot drops under it, it wakes and says "b". */
export function La1BaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <Friend ch="ب" x={1130} y={620} size={560} dots={false} eyes={lines >= 4} />}
        {lines >= 2 && (
          <>
            <motion.path d="M 1380 360 C 1300 330, 960 330, 880 360" fill="none" stroke={TEAL} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease }} />
            <motion.path d="M 900 344 L 876 362 L 904 376" fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} />
          </>
        )}
        {lines >= 3 && <DropDots ch="ب" x={1130} y={620} size={560} />}
      </Svg>
      {lines >= 2 && <Chip x={1130} y={290} color={TEAL} delay={0.4}>right to left</Chip>}
      {lines >= 4 && <><Sound x={1130} y={600} /><SoundTag x={1390} y={210} text="b" sub="as in ball" /><Tap id="baa" x={900} y={380} w={460} h={340} /></>}
    </>
  );
}

/** Taa: the same boat; two dots drop on top; "t". */
export function La1TaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <Friend ch="ت" x={1130} y={600} size={560} dots={false} color={TEAL} eyes={lines >= 3} />}
        {lines >= 2 && <DropDots ch="ت" x={1130} y={600} size={560} color={TEAL} />}
      </Svg>
      {lines >= 2 && <Chip x={1130} y={300} delay={0.8}>two dots on top</Chip>}
      {lines >= 3 && <><Sound x={1130} y={640} color={TEAL} /><SoundTag x={1390} y={210} text="t" sub="as in table" /><Tap id="taa" x={900} y={360} w={460} h={360} /></>}
    </>
  );
}

/** Thaa: three dots; "th", like three: three fingers count up beside it. */
export function La1ThaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        {lines >= 1 && <Friend ch="ث" x={1080} y={620} size={560} dots={false} color={GOLD} eyes={lines >= 3} />}
        {lines >= 2 && <DropDots ch="ث" x={1080} y={620} size={560} color={GOLD} />}
      </Svg>
      {lines >= 3 && (
        <>
          <SoundTag x={1390} y={210} text="th" sub="as in three" />
          <div className="pointer-events-none absolute flex gap-3" style={{ left: 1310, top: 370 }}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 52, height: 52, fontSize: 26, background: GOLD }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.4 + i * 0.3 }}>{i + 1}</motion.span>
            ))}
          </div>
          <Tap id="thaa" x={850} y={330} w={460} h={400} />
        </>
      )}
    </>
  );
}

/** One boat; its dots move and the letter changes, b → t → th, each with its sound tag. */
export function La1TrickGraphic({ lines, items }: GraphicProps) {
  const ch = items >= 3 ? 'ث' : items >= 2 ? 'ت' : 'ب';
  const color = items >= 3 ? GOLD : items >= 2 ? TEAL : CRIMSON;
  const sound = ['', 'b', 't', 'th'][items];
  return (
    <>
      <Svg>
        {lines >= 1 && <Friend ch="ب" x={1130} y={600} size={560} dots={false} color={color} eyes={lines >= 2} instant={lines > 1} />}
        {items >= 1 && <DropDots key={ch} ch={ch} x={1130} y={600} size={560} color={color} />}
      </Svg>
      {items >= 1 && <motion.div key={sound} className="absolute" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><SoundTag x={1390} y={210} text={sound} /></motion.div>}
      {lines >= 3 && items === 0 && <Chip x={1130} y={280}>same body, different dots</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function La1FindGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Note x={1110} y={400} small />}
      <Person x={1440} y={800} scale={1} color={GOLD} />
    </>
  );
}

/** b + aa + b slide together; baa holds hands with alif, alif lets go; the word becomes a door that opens. */
export function La1WordGraphic({ lines }: GraphicProps) {
  const joined = lines >= 2;
  return (
    <>
      {lines >= 1 && !joined && (
        <Svg>
          <Friend ch="ب" x={1400} y={470} size={200} delay={0} />
          <Friend ch="ا" x={1180} y={470} size={200} color={TEAL} delay={0.4} />
          <Friend ch="ب" x={960} y={470} size={200} delay={0.8} />
        </Svg>
      )}
      {joined && (
        <motion.div className="absolute text-center" style={{ left: 880, top: 180, width: 560 }} initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 0.8, ease }}>
          <Hear id="baab"><span lang="ar" style={{ ...AR, fontSize: 200, lineHeight: 1.1, color: CRIMSON }}>بَاب</span></Hear>
          <p className="m-0 font-sans font-extrabold" style={{ fontSize: 26, color: TEAL }}>baab · tap to listen</p>
        </motion.div>
      )}
      {lines >= 3 && (
        <Svg>
          <rect x={1080} y={480} width={160} height={230} rx={14} fill="#E8774A" />
          <motion.rect x={1080} y={480} width={160} height={230} rx={14} fill="#C2592F" style={{ transformBox: 'fill-box' as never, transformOrigin: '0% 50%' }}
            initial={{ scaleX: 1 }} animate={{ scaleX: 0.25 }} transition={{ duration: 1.2, delay: 0.4, ease }} />
          <circle cx={1220} cy={600} r={8} fill={GOLD} />
          <motion.rect x={1100} y={500} width={120} height={190} rx={8} fill="#FFF3D6" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1 }} />
        </Svg>
      )}
      {lines >= 3 && <Chip x={1160} y={730} strong delay={0.6}>door</Chip>}
    </>
  );
}

/* ---------- ahd ---------- */

export function La1MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return <Person x={1440} y={800} scale={1} color={GOLD} />;
  return (
    <>
      <Svg>
        <rect x={960} y={180} width={360} height={600} rx={16} fill="#E8774A" />
        <circle cx={1290} cy={480} r={10} fill={GOLD} />
      </Svg>
      <motion.div className="pointer-events-none absolute rounded-[8px]" style={{ left: 990, top: 240, width: 300, height: 220, background: '#FFFDF5', transform: 'rotate(2deg)', boxShadow: '0 20px 30px -20px rgba(60,30,10,0.5)' }}
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.35 }} />
      <Svg>
        {['ث', 'ت', 'ب'].map((ch, i) => <WriteLetter key={ch} ch={ch} x={1040 + i * 100} y={380} size={90} width={24} color={[GOLD, TEAL, CRIMSON][i]} delay={0.6 + (2 - i) * 0.6} speed={1.5} />)}
      </Svg>
      {lines >= 2 && <Chip x={1140} y={480} strong delay={0.3}>بَاب</Chip>}
      <Person x={1440} y={800} scale={1} color={GOLD} />
      <Person x={830} y={800} scale={1.15} color={TEAL} delay={0.2} />
    </>
  );
}

/** Three cup shapes: one dot inside, one dot on top, no dot. A question mark waits. */
export function La1NextGraphic({ lines }: GraphicProps) {
  const cups = [{ ch: 'ج', c: CRIMSON }, { ch: 'ح', c: TEAL }, { ch: 'خ', c: GOLD }];
  return (
    <>
      {lines >= 1 && (
        <div className="pointer-events-none absolute flex gap-10" style={{ left: 860, top: 300, direction: 'rtl' }}>
          {cups.map((k, i) => (
            <motion.span key={k.ch} lang="ar" style={{ ...AR, fontSize: 170, lineHeight: 1, color: lines >= 2 ? k.c : INK_TEXT, transition: 'color 0.6s' }}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35, delay: i * 0.25 }}>{k.ch}</motion.span>
          ))}
        </div>
      )}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute rounded-full font-sans font-black text-white" style={{ left: 1150, top: 600, width: 80, height: 80, lineHeight: '80px', textAlign: 'center', fontSize: 46, background: CRIMSON }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>?</motion.span>
      )}
    </>
  );
}
