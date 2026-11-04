import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person, CLAY } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';
import { StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Kids · Advanced · Lesson 1 · I Think… Teta and the ice-cream cart: Adam (teal), Ziad (gold), Mariam
 * (crimson), Teta (clay). New device: the cones; each opinion drops a scoop of its flavour on that child's cone, so
 * different opinions grow side by side.
 */

const ADAM = TEAL;
const ZIAD = GOLD;
const MARIAM = CRIMSON;
const TETA = CLAY;
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const CHOC = '#6B4226';
const STRAW = '#E88AA0';
const MANGO = '#F2B33D';

/** A cone with scoops dropping onto it; the bottom of the cone sits at y. */
function Cone({ x, y, scoops, delay = 0, label }: { x: number; y: number; scoops: string[]; delay?: number; label?: string }) {
  return (
    <>
      <motion.svg className="pointer-events-none absolute" style={{ left: x - 40, top: y - 110 }} width={80} height={110} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }}>
        <path d="M 4 6 L 76 6 L 40 108 Z" fill="#D9A15F" />
        <path d="M 16 22 L 64 22 M 22 40 L 58 40 M 28 58 L 52 58" stroke="#B5803F" strokeWidth={4} />
      </motion.svg>
      {scoops.map((c, i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: x - 44, top: y - 150 - i * 62, width: 88, height: 80, background: c, boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.12)' }}
          initial={{ y: -260, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay: delay + 0.3 + i * 0.45 }} />
      ))}
      {label && <Chip x={x} y={y + 8} delay={delay + 0.2}>{label}</Chip>}
    </>
  );
}

/** The cart: a striped canopy and three tubs. */
function Cart({ x, delay = 0 }: { x: number; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 160, top: 470 }} width={320} height={330} initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay, ease }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 40} y={0} width={40} height={50} fill={i % 2 ? '#FFFDF8' : CRIMSON} />)}
      <rect x={150} y={50} width={8} height={90} fill="#7E746C" />
      <rect x={20} y={140} width={280} height={130} rx={14} fill="#FFFDF8" stroke="#CDB898" strokeWidth={4} />
      {[CHOC, STRAW, MANGO].map((c, i) => <ellipse key={c} cx={80 + i * 80} cy={150} rx={30} ry={14} fill={c} />)}
      <circle cx={70} cy={290} r={30} fill="#7E746C" /><circle cx={250} cy={290} r={30} fill="#7E746C" />
    </motion.svg>
  );
}

/* ---------- spark ---------- */

export function Eka1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Cone x={950} y={720} scoops={[CHOC]} delay={0.2} />
      <Cone x={1150} y={720} scoops={[MANGO, MANGO]} delay={0.4} />
      <Cone x={1350} y={720} scoops={[STRAW]} delay={0.6} />
    </>
  );
}

export function Eka1CartGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cart x={1330} />
      <Person x={880} y={800} scale={1} color={TETA} hijab />
      {lines >= 2 && (
        <>
          <Chip x={1210} y={440} color={CHOC} delay={0.2}>chocolate</Chip>
          <Chip x={1330} y={400} color={STRAW} delay={0.4}>strawberry</Chip>
          <Chip x={1450} y={440} color={MANGO} delay={0.6}>mango</Chip>
          <Person x={1020} y={800} scale={0.7} color={ZIAD} delay={0.2} />
          <Person x={1100} y={800} scale={0.7} color={MARIAM} hijab delay={0.3} />
        </>
      )}
      {lines >= 3 && <Say x={1020} y={630} text="؟" width={70} size={30} delay={0.2} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Eka1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={900} y={800} scale={0.75} color={ZIAD} />
      <Person x={1080} y={800} scale={0.75} color={MARIAM} hijab />
      <Person x={1240} y={800} scale={0.75} color={ADAM} />
      <Person x={1420} y={800} scale={1} color={TETA} hijab />
      {k === 1 && <Say key="a" x={900} y={630} id="story-1" text="أنا شايف إن الشوكولاتة أحلى حاجة!" width={380} size={22} delay={0.2} />}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1080} y={630} id="story-2" text="لأ، أنا شايفة إن المانجا أحلى!" width={340} size={22} accent delay={0.2} />
          <Say x={1240} y={460} id="story-3" text="أنا كمان! المانجا!" width={230} size={24} delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && <Say key="c" x={1420} y={580} id="story-4" text="كل واحد ورأيه، يا حبايبي." align="right" width={320} size={23} accent delay={0.2} />}
    </>
  );
}

export function Eka1ShayefGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="أنا شايف إن…" size={40} />
      <Chip x={1150} y={310} color={TEAL} delay={0.5}>شايف = seeing</Chip>
      {lines >= 2 && (
        <>
          <Person x={950} y={800} scale={0.85} color={ZIAD} delay={0.1} />
          <Say x={950} y={610} id="shayef" text="أنا شايف إن الشوكولاتة أحلى!" width={340} size={22} delay={0.3} />
          <Cone x={1350} y={760} scoops={[CHOC]} delay={0.6} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={400} color={ZIAD} delay={0.2}>a boy: شايف</Chip>}
    </>
  );
}

export function Eka1ShayfaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <div className="absolute" style={{ left: 1330, top: 230, transform: 'translate(-50%, -50%)' }}>
        <motion.span className="inline-flex rounded-[14px]" style={{ padding: '4px 22px 6px', background: ZIAD, boxShadow: SHADOW }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay: 0 }}><ArText size={40} color="#fff">أنا شايف</ArText></motion.span>
      </div>
      <Chip x={1150} y={230} delay={0.4}>+ -a</Chip>
      <div className="absolute" style={{ left: 960, top: 230, transform: 'translate(-50%, -50%)' }}>
        <motion.span className="inline-flex rounded-[14px]" style={{ padding: '4px 22px 6px', background: MARIAM, boxShadow: SHADOW }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay: 0.7 }}><ArText size={40} color="#fff">أنا شايفة</ArText></motion.span>
      </div>
      <Chip x={1150} y={310} color={MARIAM} delay={1}>a girl adds -a</Chip>
      {lines >= 2 && (
        <>
          <Person x={950} y={800} scale={0.85} color={MARIAM} hijab delay={0.1} />
          <Say x={950} y={610} id="shayfa" text="أنا شايفة إن المانجا أحلى!" width={320} size={22} accent delay={0.3} />
          <Cone x={1350} y={760} scoops={[MANGO]} delay={0.6} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1050} y={400} color={ZIAD} delay={0.2}>boy: شايف</Chip>
          <Chip x={1250} y={400} color={MARIAM} delay={0.4}>girl: شايفة</Chip>
        </>
      )}
    </>
  );
}

export function Eka1TooGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={0.8} color={MARIAM} hijab />
      <Person x={1150} y={800} scale={0.8} color={ADAM} />
      <Cone x={900} y={560} scoops={[MANGO]} />
      <Say x={1150} y={620} id="kaman" text="أنا كمان!" width={160} size={28} accent delay={0.3} />
      {lines >= 2 && (
        <>
          <Person x={1420} y={800} scale={0.8} color={ZIAD} delay={0.1} />
          <Say x={1420} y={430} id="la-ana" text="لأ، أنا شايف إن الفراولة أحلى." align="right" width={350} size={21} delay={0.3} />
          <Cone x={1430} y={330} scoops={[STRAW]} delay={0.6} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={250} color={TEAL} delay={0.2}>no shouting · just your flavour</Chip>}
    </>
  );
}

/** The wow: three cones grow side by side; Teta's sentence sits under them. */
export function Eka1ConesGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cone x={950} y={680} scoops={[CHOC, CHOC]} label="Ziad" />
      <Cone x={1150} y={680} scoops={[MANGO, MANGO, MANGO]} delay={0.2} label="Mariam" />
      <Cone x={1350} y={680} scoops={[MANGO, STRAW]} delay={0.4} label="Adam" />
      {lines >= 2 && (
        <div className="absolute" style={{ left: 1150, top: 770, transform: 'translate(-50%, -50%)' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease }}>
            <Hear id="kol-wahed"><span className="inline-flex rounded-full" style={{ padding: '0 20px 2px', background: TETA, boxShadow: SHADOW }}><ArText size={28} color="#fff">كل واحد ورأيه</ArText></span></Hear>
          </motion.div>
        </div>
      )}
      {lines >= 3 && <Chip x={1150} y={190} color={TEAL} delay={0.2}>nobody is wrong about ice cream</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eka1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const colours = [CRIMSON, GOLD, TEAL, '#7A5BA6'];
  return (
    <>
      <Person x={1400} y={800} scale={1} color={TETA} hijab />
      <Say x={1400} y={570} id="ahla-lon" text="إيه أحلى لون؟" align="right" width={200} size={28} delay={0.2} />
      {colours.map((c, i) => (
        <motion.span key={c} className="pointer-events-none absolute rounded-full" style={{ left: 880 + i * 90, top: 260, width: 70, height: 70, background: c, boxShadow: SHADOW }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.6, delay: 0.5 + i * 0.15 }} />
      ))}
      {lines >= 2 && <Chip x={1040} y={400} color={ZIAD} delay={0.2}>أنا شايف / شايفة إن…</Chip>}
      {lines >= 2 && <Chip x={1040} y={460} color={TEAL} delay={0.5}>وإنت؟ · وإنتي؟</Chip>}
    </>
  );
}

export function Eka1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[50%]" style={{ left: 900, top: 560, width: 500, height: 120, background: '#E9E1D4' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <Person x={920} y={800} scale={0.9} color={TETA} hijab sitting />
      <Person x={1150} y={800} scale={0.75} color={ZIAD} sitting delay={0.1} />
      <Person x={1380} y={800} scale={0.9} color="#5A4636" sitting delay={0.2} />
      <StreetCard x={1150} y={300} word="إيه أحلى أكلة؟" size={36} delay={0.4} />
      {lines >= 2 && <Chip x={1150} y={390} color={ZIAD} delay={0.2}>أنا شايف إن…</Chip>}
    </>
  );
}

export function Eka1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={920} y={800} scale={0.8} color={ZIAD} />
      <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 950, top: 700, width: 22, height: 26, background: MANGO }} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4, ease: 'easeIn' }} />
      <Cone x={960} y={600} scoops={[MANGO]} delay={0.1} />
      {lines >= 2 && <Person x={1300} y={800} scale={1} color={TETA} hijab delay={0.1} />}
      {lines >= 2 && <Say x={1300} y={570} id="teta-joke" text="على مهلك يا زياد!" align="right" width={240} size={26} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={300} color={CRIMSON} delay={0.2}>next: Teta&apos;s sayings</Chip>}
    </>
  );
}
