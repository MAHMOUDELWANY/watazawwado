import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Person, Bubble, Chip } from './kit';
import { Hear } from '../Say';

/**
 * Fusha · Kids · Lesson 1 · What Is This? Look A (the literacy cast): Lina (teal) and Sam (gold), faceless children; the
 * objects are drawn in code. Every Arabic line on the stage plays on tap (Mahmoud Fusha). Input first: the story page is
 * understood from the pictures before any rule.
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };

type Thing = 'pen' | 'book' | 'door' | 'house' | 'chair' | 'cat' | 'key' | 'bed' | 'boy' | 'student';

/** Simple flat drawings of the lesson's things, in a 100 × 100 box. */
function ThingArt({ t }: { t: Thing }) {
  switch (t) {
    case 'pen': return <g><rect x={46} y={12} width={10} height={64} rx={4} fill={TEAL} transform="rotate(30 50 50)" /><path d="M 46 76 L 51 90 L 56 76 Z" fill={INK_TEXT} transform="rotate(30 50 50)" /></g>;
    case 'book': return <g><rect x={18} y={22} width={64} height={56} rx={6} fill={CRIMSON} /><rect x={24} y={28} width={52} height={44} rx={3} fill="#FFF3D6" /><rect x={48} y={22} width={4} height={56} fill="#8B1A1E" /></g>;
    case 'door': return <g><rect x={28} y={10} width={44} height={80} rx={6} fill="#E8774A" /><circle cx={62} cy={52} r={4} fill={GOLD} /></g>;
    case 'house': return <g><rect x={22} y={44} width={56} height={44} rx={4} fill="#FFD9A8" /><path d="M 14 48 L 50 16 L 86 48 Z" fill={CRIMSON} /><rect x={42} y={62} width={16} height={26} rx={8} fill={TEAL} /></g>;
    case 'chair': return <g fill="#B4552F"><rect x={30} y={14} width={8} height={72} rx={3} /><rect x={30} y={48} width={42} height={8} rx={3} /><rect x={64} y={48} width={8} height={38} rx={3} /><rect x={30} y={14} width={32} height={8} rx={3} /></g>;
    case 'cat': return <g fill="#E89A3C"><ellipse cx={52} cy={66} rx={30} ry={20} /><circle cx={32} cy={42} r={16} /><path d="M 20 34 L 22 18 L 32 28 Z M 44 28 L 44 18 L 36 26 Z" /><path d="M 80 64 C 96 60, 94 40, 86 36" fill="none" stroke="#E89A3C" strokeWidth={6} strokeLinecap="round" /></g>;
    case 'key': return <g fill={GOLD}><circle cx={30} cy={50} r={16} /><circle cx={30} cy={50} r={7} fill="#FFF7E6" /><rect x={44} y={46} width={44} height={8} rx={3} /><rect x={74} y={54} width={6} height={12} /><rect x={84} y={54} width={6} height={10} /></g>;
    case 'bed': return <g><rect x={12} y={48} width={76} height={22} rx={6} fill={TEAL} /><rect x={12} y={34} width={8} height={50} rx={3} fill="#8B4935" /><rect x={80} y={44} width={8} height={40} rx={3} fill="#8B4935" /><rect x={22} y={40} width={22} height={12} rx={6} fill="#FFF3D6" /></g>;
    default: return null;
  }
}

/** A thing on the stage, centred at (x, y), `s` pixels wide, with an optional Arabic label that plays on tap. */
function ThingCard({ t, x, y, s = 140, label, clip, delay = 0, color = INK_TEXT }: { t: Thing; x: number; y: number; s?: number; label?: string; clip?: string; delay?: number; color?: string }) {
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x - s / 2, top: y - s / 2, width: s }}
      initial={{ opacity: 0, y: 24, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay }}>
      <svg viewBox="0 0 100 100" width={s} height={s} style={{ overflow: 'visible', filter: 'drop-shadow(0 14px 14px rgba(60,30,10,0.18))' }}><ThingArt t={t} /></svg>
      {label && (clip ? <Hear id={clip}><ArText size={s * 0.26} color={color}>{label}</ArText></Hear> : <ArText size={s * 0.26} color={color}>{label}</ArText>)}
    </motion.div>
  );
}

function ArText({ children, size, color = INK_TEXT }: { children: React.ReactNode; size: number; color?: string }) {
  return <span lang="ar" style={{ ...AR, fontSize: size, lineHeight: 1.3, color, whiteSpace: 'nowrap' }}>{children}</span>;
}

/** An Arabic speech bubble that plays its line on tap. */
function Say({ x, y, id, text, align = 'left', delay = 0, width = 240, accent = false }: { x: number; y: number; id?: string; text: string; align?: 'left' | 'right'; delay?: number; width?: number; accent?: boolean }) {
  const t = <ArText size={36} color={accent ? '#fff' : INK_TEXT}>{text}</ArText>;
  return <Bubble x={x} y={y} width={width} align={align} delay={delay} accent={accent} text={<div style={{ textAlign: 'center' }}>{id ? <Hear id={id}>{t}</Hear> : t}</div>} />;
}

/* ---------- spark ---------- */

export function Fk1CoverGraphic(_: GraphicProps) {
  const ring: { t: Thing; a: number; l: string }[] = [
    { t: 'pen', a: 0, l: 'قَلَمٌ' }, { t: 'book', a: 72, l: 'كِتَابٌ' }, { t: 'door', a: 144, l: 'بَابٌ' }, { t: 'cat', a: 216, l: 'قِطٌّ' }, { t: 'house', a: 288, l: 'بَيْتٌ' },
  ];
  return (
    <>
      <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: 1040, top: 360, width: 180, height: 180, background: CRIMSON, boxShadow: `0 0 60px 10px ${CRIMSON}44` }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay: 0.2 }}>
        <ArText size={86} color="#fff">؟</ArText>
      </motion.div>
      {ring.map((r, i) => {
        const rad = (r.a - 90) * Math.PI / 180;
        return <ThingCard key={r.t} t={r.t} x={1130 + Math.cos(rad) * 280} y={450 + Math.sin(rad) * 250} s={110} label={r.l} delay={0.5 + i * 0.15} />;
      })}
    </>
  );
}

/** Lina hides something behind her back; Sam must guess; the rule: Arabic only. */
export function Fk1GameGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={800} scale={1.3} color={TEAL} />
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[16px]" style={{ left: 1010, top: 560, width: 90, height: 90, background: '#FFFDF8', boxShadow: '0 12px 24px -14px rgba(60,30,10,0.6)' }}
          initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, ease }}>
          <span className="font-sans font-black" style={{ fontSize: 50, color: GOLD }}>?</span>
        </motion.div>
      )}
      {lines >= 2 && <Person x={1380} y={800} scale={1.15} color={GOLD} delay={0.1} />}
      {lines >= 3 && <Chip x={1170} y={250} strong delay={0.2}>Arabic only · عَرَبِيٌّ فَقَطْ</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** The scene in Arabic, panel by panel: a pen, a book, and the joke (Sam is not a cat!). Every line plays on tap. */
export function Fk1StoryGraphic({ lines }: GraphicProps) {
  const shown: Thing | null = lines >= 3 ? null : lines >= 2 ? 'book' : lines >= 1 ? 'pen' : null;
  return (
    <>
      <Person x={900} y={800} scale={1.2} color={TEAL} />
      <Person x={1420} y={800} scale={1.1} color={GOLD} delay={0.1} />
      {shown && <ThingCard key={shown} t={shown} x={1030} y={500} s={190} />}
      {lines >= 1 && lines < 2 && (<><Say x={1300} y={420} id="story-1" text="مَا هَذَا؟" align="right" /><Say x={900} y={330} id="story-2" text="هَذَا قَلَمٌ." delay={0.9} /></>)}
      {lines >= 2 && lines < 3 && (<><Say x={1300} y={420} id="story-3" text="وَمَا هَذَا؟" align="right" /><Say x={900} y={330} id="story-4" text="هَذَا كِتَابٌ." delay={0.9} /></>)}
      {lines >= 3 && (
        <>
          <Say x={900} y={420} id="story-5" text="وَمَنْ هَذَا؟" />
          <motion.svg className="pointer-events-none absolute" style={{ left: 1000, top: 520, overflow: 'visible' }} width={320} height={80} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <path d="M 0 40 L 300 40" stroke={TEAL} strokeWidth={6} strokeDasharray="4 12" strokeLinecap="round" />
            <path d="M 284 26 L 304 40 L 284 54" fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
          </motion.svg>
          <Say x={1420} y={420} id="story-6" text="هَذَا قِطٌّ! لَا، لَا... هَذَا سَامٌ!" align="right" width={440} delay={1} accent />
        </>
      )}
    </>
  );
}

/** A hand points at each thing; هَذَا + its name appears and plays. */
export function Fk1HaadhaGraphic({ lines, items }: GraphicProps) {
  const rows: { t: Thing; ar: string; clip: string }[] = [
    { t: 'pen', ar: 'هَذَا قَلَمٌ.', clip: 'haadha-qalam' },
    { t: 'book', ar: 'هَذَا كِتَابٌ.', clip: 'haadha-kitab' },
    { t: 'door', ar: 'هَذَا بَابٌ.', clip: 'haadha-bab' },
  ];
  return (
    <>
      {lines >= 1 && items === 0 && (
        <motion.div className="absolute text-center" style={{ left: 900, top: 330, width: 460 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Hear id="haadha"><ArText size={150} color={CRIMSON}>هَذَا</ArText></Hear>
          <p className="m-0 font-sans font-extrabold" style={{ fontSize: 30, color: TEAL }}>this is</p>
        </motion.div>
      )}
      {rows.slice(0, items).map((r, i) => (
        <motion.div key={r.t} className="absolute flex items-center gap-6" style={{ left: 820, top: 200 + i * 190, direction: 'rtl', width: 640 }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <svg viewBox="0 0 100 100" width={130} height={130} style={{ overflow: 'visible' }}><ThingArt t={r.t} /></svg>
          <Hear id={r.clip}><ArText size={68}>{r.ar}</ArText></Hear>
        </motion.div>
      ))}
    </>
  );
}

/** The question card مَا هَذَا؟ flips; the answers arrive as things with هَذَا. */
export function Fk1MaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute flex flex-col items-center rounded-[30px]" style={{ left: 900, top: 190, width: 460, padding: '18px 0 22px', background: '#FFFDF8', boxShadow: `0 26px 50px -28px rgba(60,30,10,0.6), 0 0 0 5px ${CRIMSON}` }}
          initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.8, ease }}>
          <Hear id="maa-haadha"><ArText size={96} color={CRIMSON}>مَا هَذَا؟</ArText></Hear>
          <span className="font-sans font-extrabold" style={{ fontSize: 26, color: soft('light') }}>what is this?</span>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1130} y={430} color={TEAL}>مَا = what</Chip>}
      {lines >= 3 && (
        <>
          <ThingCard t="house" x={1000} y={620} s={150} label="هَذَا بَيْتٌ." clip="haadha-bayt" />
          <ThingCard t="chair" x={1290} y={620} s={150} label="هَذَا كُرْسِيٌّ." clip="haadha-kursi" delay={0.3} />
        </>
      )}
    </>
  );
}

/** A thing and a person side by side: مَا crosses out over the person; مَنْ takes its place. */
export function Fk1ManGraphic({ lines }: GraphicProps) {
  return (
    <>
      <ThingCard t="chair" x={940} y={470} s={170} />
      <Person x={1340} y={640} scale={1.25} color={GOLD} />
      {lines === 1 && (
        <motion.div className="absolute" style={{ left: 1250, top: 250 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ArText size={70} color={soft('light')}>مَا؟</ArText>
          <motion.span className="absolute rounded-full" style={{ left: -10, top: 52, height: 8, background: CRIMSON }} initial={{ width: 0 }} animate={{ width: 140 }} transition={{ delay: 0.6, duration: 0.5 }} />
        </motion.div>
      )}
      {lines >= 2 && <Say x={1340} y={360} id="man-haadha" text="مَنْ هَذَا؟" align="right" delay={0.3} />}
      {lines >= 3 && (
        <>
          <Chip x={940} y={600} color={TEAL}>things → مَا</Chip>
          <Chip x={1340} y={680} color={GOLD}>people → مَنْ</Chip>
          <Say x={940} y={340} id="maa-haadha" text="مَا هَذَا؟" delay={0.4} />
        </>
      )}
    </>
  );
}

/** All ten words as tiles; each one plays. */
export function Fk1WordsGraphic({ lines }: GraphicProps) {
  const words: { t: Thing; ar: string; clip: string }[] = [
    { t: 'pen', ar: 'قَلَمٌ', clip: 'qalam' }, { t: 'book', ar: 'كِتَابٌ', clip: 'kitab' }, { t: 'door', ar: 'بَابٌ', clip: 'bab' },
    { t: 'house', ar: 'بَيْتٌ', clip: 'bayt' }, { t: 'chair', ar: 'كُرْسِيٌّ', clip: 'kursi' }, { t: 'cat', ar: 'قِطٌّ', clip: 'qitt' },
    { t: 'key', ar: 'مِفْتَاحٌ', clip: 'miftah' }, { t: 'bed', ar: 'سَرِيرٌ', clip: 'sarir' },
  ];
  if (lines === 0) return null;
  return (
    <>
      <div className="absolute grid" style={{ left: 800, top: 170, width: 700, gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, direction: 'rtl' }}>
        {words.map((w, i) => (
          <motion.div key={w.clip} className="flex flex-col items-center rounded-[22px]" style={{ padding: '8px 0 6px', background: '#FFFDF8', boxShadow: '0 16px 30px -22px rgba(60,30,10,0.6)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease }}>
            <svg viewBox="0 0 100 100" width={86} height={86}><ThingArt t={w.t} /></svg>
            <Hear id={w.clip}><ArText size={34}>{w.ar}</ArText></Hear>
          </motion.div>
        ))}
      </div>
      <div className="absolute flex gap-4" style={{ left: 940, top: 640, direction: 'rtl' }}>
        {[{ ar: 'وَلَدٌ', clip: 'walad', c: TEAL }, { ar: 'طَالِبٌ', clip: 'talib', c: GOLD }].map((p, i) => (
          <motion.div key={p.clip} className="flex items-center gap-3 rounded-[22px]" style={{ padding: '8px 20px', background: '#FFFDF8', boxShadow: `0 0 0 3px ${p.c}` }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.15 }}>
            <Hear id={p.clip}><ArText size={34}>{p.ar}</ArText></Hear>
          </motion.div>
        ))}
      </div>
      {lines >= 3 && <Chip x={1150} y={760} color={TEAL} delay={0.2}>they come back in your reviews</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Fk1SpotGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={800} scale={1.1} color={TEAL} />
      <Person x={1350} y={800} scale={1.45} color={CRIMSON} delay={0.15} />
      {lines >= 1 && <Chip x={1350} y={420} delay={0.3}>Sam's teacher</Chip>}
      {lines >= 1 && <Say x={980} y={470} text="؟" delay={0.6} width={90} />}
    </>
  );
}

/** Two children facing each other; the game's lines appear as they take turns. */
export function Fk1TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={800} scale={1.2} color={TEAL} />
      <Person x={1400} y={800} scale={1.1} color={GOLD} delay={0.1} />
      {lines >= 1 && <ThingCard t="key" x={1000} y={560} s={90} />}
      {lines >= 2 && <><Say x={1400} y={430} id="maa-haadha" text="مَا هَذَا؟" align="right" /><Say x={900} y={360} id="haadha-miftah" text="هَذَا مِفْتَاحٌ." delay={0.9} /></>}
    </>
  );
}

/* ---------- ahd ---------- */

export function Fk1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <ThingCard t="bed" x={1150} y={330} s={220} />
      <Person x={920} y={800} scale={1.15} color={GOLD} />
      <Person x={1380} y={800} scale={0.85} color={TEAL} delay={0.15} />
      {lines >= 2 && <><Say x={920} y={540} id="maa-haadha" text="مَا هَذَا؟" delay={0.2} /><Say x={1380} y={600} id="haadha-sarir" text="هَذَا سَرِيرٌ!" align="right" delay={1} accent /></>}
    </>
  );
}

/** A toy cat held up; Sam's new question starts with أَ. */
export function Fk1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={920} y={800} scale={1.15} color={TEAL} />
      {lines >= 1 && <ThingCard t="cat" x={1010} y={480} s={150} />}
      <Person x={1400} y={800} scale={1.1} color={GOLD} delay={0.1} />
      {lines >= 2 && <Say x={1400} y={430} id="a-haadha-qitt" text="أَهَذَا قِطٌّ؟" align="right" delay={0.2} />}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute rounded-full font-sans font-black text-white" style={{ left: 1170, top: 230, width: 80, height: 80, lineHeight: '80px', textAlign: 'center', fontSize: 46, background: CRIMSON }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>أَ</motion.span>
      )}
    </>
  );
}
