import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Icon } from './kit';
import { ArText, SayBubble, WordTile } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · 12+ · Lesson 3 · Near and Far. Same cast as Lesson 2 (Yusuf teal, Sara gold, Ustadh Kareem olive), now on the
 * dorm roof at sunrise with the campus below. The motion carries the lesson's one idea: two questions (near or far?
 * masculine or feminine?) pick one of four words; near words are solid tiles, far words have a dotted pointing line.
 */

const YUSUF = TEAL;
const SARA = GOLD;
const KAREEM = '#6E8B5A';
const GROUND = 800;
const CARD = '#FFFDF8';
const M = TEAL;
const F = CRIMSON;

/** The roof parapet and a sunrise sky band, with the campus line far below. */
function Roof() {
  return (
    <>
      <motion.div className="pointer-events-none absolute" style={{ left: 760, top: 160, width: 760, height: 420, background: 'linear-gradient(180deg, #FCE3C2 0%, #FFF3E0 70%, rgba(255,243,224,0) 100%)', borderRadius: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <Svg>
        <path d="M 760 560 C 960 520, 1200 500, 1520 540" fill="none" stroke="#9BB86A" strokeWidth={4} opacity={0.7} />
        <rect x={760} y={740} width={760} height={18} fill="#D9C7A8" />
        <rect x={760} y={758} width={760} height={50} fill="#E9DCC3" />
      </Svg>
    </>
  );
}

/** A small far building on the campus line, with its icon. */
function Place({ x, y, icon, color, w = 90, h = 70, dome = false, delay = 0 }: { x: number; y: number; icon: string; color: string; w?: number; h?: number; dome?: boolean; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center justify-center" style={{ left: x - w / 2, top: y - h, width: w, height: h, background: '#EFE3CC', borderRadius: dome ? `${w / 2}px ${w / 2}px 4px 4px` : 6, boxShadow: `0 0 0 3px ${color}55` }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <Icon name={icon} size={Math.min(w, h) * 0.6} color={color} />
    </motion.div>
  );
}

/** A dotted pointing line. */
function Point({ d, color = F, delay = 0 }: { d: string; color?: string; delay?: number }) {
  return <Svg><Draw d={d} color={color} width={3} dash="3 10" delay={delay} dur={0.9} /></Svg>;
}

/** A word tile in a gender colour; `far` gives it a dashed ring. */
function Dem({ x, y, id, children, color, far = false, size = 56, delay = 0 }: { x: number; y: number; id?: string; children: React.ReactNode; color: string; far?: boolean; size?: number; delay?: number }) {
  const body = <span className="inline-block rounded-[22px]" style={{ padding: '2px 26px', background: CARD, outline: `3px ${far ? 'dashed' : 'solid'} ${color}`, outlineOffset: far ? 4 : 0, boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <motion.div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay }}>
      {id ? <Hear id={id}>{body}</Hear> : body}
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Ft3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Roof />
      <Place x={1400} y={540} icon="moon" color={M} dome delay={0.4} />
      <Place x={1180} y={520} icon="book" color={F} delay={0.6} />
      <Person x={960} y={GROUND} scale={1.05} color={SARA} hijab />
      <Point d="M 1000 600 Q 1200 420 1380 470" delay={1} />
      <Dem x={1400} y={380} color={M} far delay={1.4}>ذَلِكَ</Dem>
      <Dem x={1170} y={340} color={F} far delay={1.7}>تِلْكَ</Dem>
    </>
  );
}

export function Ft3RoofGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Roof />
      {lines >= 1 && (
        <>
          <Person x={1000} y={GROUND} scale={1.05} color={SARA} hijab />
          <Person x={1180} y={GROUND} scale={1.05} color={YUSUF} delay={0.2} />
          <div className="pointer-events-none absolute" style={{ left: 1040, top: 640 }}><Icon name="cup" size={46} color={GOLD} /></div>
        </>
      )}
      {lines >= 2 && (
        <>
          <Place x={1440} y={545} icon="moon" color={M} dome delay={0.1} />
          <Place x={1300} y={530} icon="book" color={F} delay={0.3} />
          <Place x={880} y={545} icon="ball" color={M} w={110} h={40} delay={0.5} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1100} y={250} color={TEAL} delay={0.2}>هَذَا · هَذِهِ = here</Chip>
          <Chip x={1380} y={380} color={CRIMSON} delay={0.5}>there = ?</Chip>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

export function Ft3ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Roof />
      <Place x={1440} y={545} icon="moon" color={M} dome />
      <Place x={1300} y={530} icon="book" color={F} />
      <Person x={960} y={GROUND} scale={1.05} color={YUSUF} />
      <Person x={1140} y={GROUND} scale={1.05} color={SARA} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Point d="M 1000 600 Q 1250 430 1430 470" color={M} />
          <SayBubble x={960} y={540} id="d-1" text="مَا ذَلِكَ؟" width={170} delay={0.3} />
          <SayBubble x={1140} y={420} id="d-2" text="ذَلِكَ مَسْجِدٌ." width={220} delay={1.4} accent />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Point d="M 1000 600 Q 1180 440 1290 470" color={F} />
          <SayBubble x={960} y={540} id="d-3" text="وَمَا تِلْكَ؟" width={190} />
          <SayBubble x={1140} y={420} id="d-4" text="تِلْكَ مَكْتَبَةٌ." width={230} delay={1.2} accent />
          <motion.div className="pointer-events-none absolute" style={{ left: 1040, top: 600 }} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 2.4, duration: 0.6 }}><Icon name="cup" size={50} color={GOLD} /></motion.div>
          <SayBubble x={1140} y={290} id="d-5" text={<><span style={{ color: F }}>هَذِهِ</span> قَهْوَةٌ. تَفَضَّلْ!</>} width={300} delay={2.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 120 }} animate={{ x: 0 }} transition={{ duration: 3, ease: 'linear' }}>
            <Person x={1380} y={575} scale={0.32} color={KAREEM} />
          </motion.div>
          <SayBubble x={960} y={540} id="d-6" text="مَنْ ذَلِكَ؟" width={180} />
          <SayBubble x={1140} y={420} id="d-7" text="ذَلِكَ أُسْتَاذٌ. ذَلِكَ كَرِيمٌ!" width={330} delay={1.3} accent />
        </React.Fragment>
      )}
    </>
  );
}

/** Same sentence, two distances: the mosque on the roof's edge (near), and far across campus. */
export function Ft3FarGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Roof />
      <Person x={900} y={GROUND} scale={1.05} color={YUSUF} />
      {lines >= 1 && (
        <>
          <div className="pointer-events-none absolute" style={{ left: 1000, top: 610 }}><Icon name="book" size={60} color={M} /></div>
          <Dem x={1040} y={300} id="haadha" color={M}>هَذَا</Dem>
          <Place x={1420} y={545} icon="moon" color={M} dome delay={0.3} />
          <Point d="M 940 600 Q 1200 420 1400 470" color={M} delay={0.4} />
          <Dem x={1380} y={300} id="dhalika" color={M} far delay={0.6}>ذَلِكَ</Dem>
        </>
      )}
      {lines >= 2 && (
        <>
          <Dem x={1380} y={400} id="dhalika-masjid" color={M} far size={34} delay={0.2}>ذَلِكَ مَسْجِدٌ.</Dem>
          <Dem x={1040} y={400} id="haadha-masjid" color={M} size={34} delay={0.4}>هَذَا مَسْجِدٌ.</Dem>
        </>
      )}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-3" style={{ left: 1210, top: 180, transform: 'translateX(-50%)' }}>
          {[['maa-dhalika', 'مَا ذَلِكَ؟'], ['a-dhalika-masjid', 'أَذَلِكَ مَسْجِدٌ؟']].map(([id, t], i) => (
            <motion.span key={id} className="rounded-full px-4" style={{ background: CARD, boxShadow: `0 0 0 2px ${M}`, pointerEvents: 'auto' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.2 }}>
              <Hear id={id}><ArText size={28}>{t}</ArText></Hear>
            </motion.span>
          ))}
        </div>
      )}
    </>
  );
}

export function Ft3TilkaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Roof />
      <Person x={900} y={GROUND} scale={1.05} color={SARA} hijab />
      {lines >= 1 && (
        <>
          <div className="pointer-events-none absolute" style={{ left: 990, top: 620 }}><Icon name="cup" size={56} color={F} /></div>
          <Dem x={1040} y={300} id="haadhihi-qahwa" color={F} size={40}>هَذِهِ قَهْوَةٌ.</Dem>
        </>
      )}
      {lines >= 2 && (
        <>
          <Place x={1400} y={530} icon="book" color={F} delay={0.2} />
          <Point d="M 940 600 Q 1200 420 1390 460" color={F} delay={0.3} />
          <Dem x={1380} y={300} id="tilka-maktaba" color={F} far size={40} delay={0.6}>تِلْكَ مَكْتَبَةٌ.</Dem>
        </>
      )}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: 1150, top: 380, width: 120, height: 120, background: CARD, boxShadow: `0 0 0 5px ${F}, 0 0 30px 8px ${F}33` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <ArText size={64} color={F}>ـةٌ</ArText>
        </motion.div>
      )}
    </>
  );
}

/** The 2 × 2: columns near / far, rows masculine / feminine. */
export function Ft3GridGraphic({ lines }: GraphicProps) {
  const cells = [
    { t: 'هَذَا', id: 'haadha', c: M, far: false, x: 1340, y: 380 },
    { t: 'ذَلِكَ', id: 'dhalika', c: M, far: true, x: 1040, y: 380 },
    { t: 'هَذِهِ', id: 'haadhihi', c: F, far: false, x: 1340, y: 560 },
    { t: 'تِلْكَ', id: 'tilka', c: F, far: true, x: 1040, y: 560 },
  ];
  return (
    <>
      {lines >= 1 && (
        <>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 1300, top: 250, fontSize: 16, letterSpacing: '0.16em', color: soft('light') }}>near</span>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 1010, top: 250, fontSize: 16, letterSpacing: '0.16em', color: soft('light') }}>far</span>
          <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 1470, top: 365, fontSize: 18, color: M }}>m</span>
          <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 1470, top: 545, fontSize: 18, color: F }}>f</span>
          <Svg><Draw d="M 1190 280 L 1190 660 M 880 470 L 1460 470" color={INK_TEXT} width={2} opacity={0.2} dur={0.6} /></Svg>
        </>
      )}
      {lines >= 2 && cells.map((c, i) => (
        <Dem key={c.id} x={c.x} y={c.y} id={c.id} color={c.c} far={c.far} size={64} delay={i * 0.2}>{c.t}</Dem>
      ))}
      {lines >= 3 && <Chip x={1190} y={700} color={GOLD} delay={0.3}>near or far? · m or f? · done</Chip>}
    </>
  );
}

const CAMPUS = [
  { t: 'ذَلِكَ مَسْجِدٌ', id: 'dhalika-masjid', icon: 'moon', c: M, dome: true },
  { t: 'ذَلِكَ مَطْعَمٌ', id: 'dhalika-mataam', icon: 'bowl', c: M },
  { t: 'ذَلِكَ مَلْعَبٌ', id: 'dhalika-malaab', icon: 'ball', c: M },
  { t: 'تِلْكَ مَكْتَبَةٌ', id: 'tilka-maktaba', icon: 'book', c: F },
  { t: 'تِلْكَ حَدِيقَةٌ', id: 'tilka-hadiqa', icon: 'sun', c: F },
  { t: 'تِلْكَ سَيَّارَةٌ', id: 'tilka-sayyara', icon: 'car', c: F },
];

export function Ft3WordsGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && CAMPUS.map((p, i) => {
        const x = 1360 - (i % 3) * 210;
        const y = 260 + Math.floor(i / 3) * 250;
        return (
          <motion.div key={p.id} className="absolute flex flex-col items-center gap-2" style={{ left: x - 95, top: y, width: 190 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease }}>
            <span className="flex items-center justify-center" style={{ width: 110, height: 90, background: '#EFE3CC', borderRadius: p.dome ? '55px 55px 6px 6px' : 8, boxShadow: `0 0 0 3px ${p.c}66` }}><Icon name={p.icon} size={54} color={p.c} /></span>
            <Hear id={p.id}><span className="inline-block rounded-full px-4" style={{ background: CARD, outline: `2px dashed ${p.c}` }}><ArText size={28} color={p.c}>{p.t}</ArText></span></Hear>
          </motion.div>
        );
      })}
    </>
  );
}

export function Ft3TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Roof />
      <Person x={960} y={GROUND} scale={1.05} color={SARA} hijab />
      <Person x={1250} y={GROUND} scale={1.05} color={YUSUF} delay={0.2} />
      <Chip x={1250} y={520} color={YUSUF}>you · the guide</Chip>
      {lines >= 1 && <SayBubble x={960} y={540} id="maa-tilka" text="مَا تِلْكَ؟" width={170} delay={0.3} />}
    </>
  );
}

/** A window photo with four sentence stickers. */
export function Ft3MissionGraphic({ lines }: GraphicProps) {
  const tags = [
    { t: 'هَذِهِ نَافِذَةٌ', c: F, x: 30, y: 300 }, { t: 'هَذَا كِتَابٌ', c: M, x: 220, y: 330 },
    { t: 'ذَلِكَ بَيْتٌ', c: M, x: 40, y: 90 }, { t: 'تِلْكَ سَيَّارَةٌ', c: F, x: 210, y: 150 },
  ];
  return lines >= 1 ? (
    <motion.div className="pointer-events-none absolute overflow-hidden rounded-[18px]" style={{ left: 940, top: 180, width: 480, height: 420, background: 'linear-gradient(180deg, #CFE3EA, #EFE3CC)', boxShadow: '0 0 0 12px #FFFDF8, 0 30px 50px -30px rgba(60,30,10,0.6)' }}
      initial={{ opacity: 0, y: 40, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: 0.9, ease }}>
      {tags.map((g, i) => (
        <motion.span key={g.t} className="absolute rounded-full px-3" style={{ left: g.x, top: g.y, background: CARD, outline: `2px ${g.c === M && i < 2 ? 'solid' : i < 2 ? 'solid' : 'dashed'} ${g.c}` }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.25, type: 'spring', bounce: 0.4 }}>
          <ArText size={26} color={g.c}>{g.t}</ArText>
        </motion.span>
      ))}
    </motion.div>
  ) : null;
}

/** The classroom board: بَابٌ, then ٱلْبَابُ. */
export function Ft3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[14px]" style={{ left: 900, top: 200, width: 520, height: 300, background: '#2F4A3E', boxShadow: '0 0 0 10px #8B5A36' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      <Person x={1460} y={GROUND} scale={1.05} color={KAREEM} />
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex gap-12" style={{ left: 1160, top: 300, transform: 'translateX(-50%)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <ArText size={60} color="#F6F1E8">بَابٌ</ArText>
          <span style={{ pointerEvents: 'auto' }}><Hear id="al-bab"><ArText size={60} color={GOLD}>ٱلْبَابُ</ArText></Hear></span>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1160} y={440} color={GOLD} delay={0.3}>a door · the door</Chip>}
      {lines >= 3 && <WordTile x={1160} y={620} size={48} hot delay={0.2}>ٱلْـ</WordTile>}
    </>
  );
}
