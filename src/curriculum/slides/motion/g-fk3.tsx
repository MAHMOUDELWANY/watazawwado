import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Cut, Chip, Svg, Draw } from './kit';
import { Hear } from '../Say';
import { ThingCard, ArText, Say } from './g-fk1';
import { AnimalCard } from './g-fk2';

/**
 * Fusha · Kids · Lesson 3 · This One, That One. The Zad Kids cast in a park. The motion carries the lesson's one idea:
 * near things are big and touchable (هَذَا, teal, a hand), far things sit small on the hill (ذَلِكَ, crimson, a dotted
 * pointing line). Masculine nouns only.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';
const NEAR = TEAL;
const FAR = CRIMSON;

type ParkThing = 'bird' | 'mosque' | 'mountain' | 'moon' | 'boy';

function ParkArt({ t }: { t: ParkThing }) {
  switch (t) {
    case 'bird': return <g><ellipse cx={50} cy={56} rx={26} ry={18} fill={TEAL} /><circle cx={30} cy={40} r={12} fill={TEAL} /><path d="M 18 40 L 8 44 L 18 46 Z" fill={GOLD} /><path d="M 50 50 Q 70 20 84 44 Z" fill="#0B7A8A" /></g>;
    case 'mosque': return <g><rect x={22} y={50} width={56} height={40} fill="#EFE3CC" /><path d="M 30 50 Q 50 14 70 50 Z" fill={GOLD} /><rect x={80} y={24} width={8} height={66} fill="#EFE3CC" /><path d="M 78 24 L 84 12 L 90 24 Z" fill={GOLD} /><path d="M 44 90 V 72 Q 50 64 56 72 V 90 Z" fill="#8B5A36" /></g>;
    case 'mountain': return <g><path d="M 6 88 L 40 24 L 58 52 L 70 38 L 96 88 Z" fill="#8FA36A" /><path d="M 40 24 L 32 40 L 42 36 L 48 42 Z" fill="#fff" /></g>;
    case 'boy': return <g><circle cx={50} cy={24} r={13} fill="#E9C29A" /><path d="M 37 20 Q 50 4 63 20 Z" fill="#3A2418" /><path d="M 32 88 L 36 44 Q 50 36 64 44 L 68 88 Z" fill={TEAL} /></g>;
    case 'moon': return <g><circle cx={50} cy={50} r={32} fill="#F2D27A" /><circle cx={64} cy={42} r={28} fill="#22313A" opacity={0.92} /></g>;
  }
}

function ParkCard({ t, x, y, s = 140, label, clip, delay = 0, color }: { t: ParkThing; x: number; y: number; s?: number; label?: string; clip?: string; delay?: number; color?: string }) {
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x - s / 2, top: y - s / 2, width: s }}
      initial={{ opacity: 0, y: 24, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay }}>
      <svg viewBox="0 0 100 100" width={s} height={s} style={{ overflow: 'visible', filter: 'drop-shadow(0 14px 14px rgba(60,30,10,0.18))' }}><ParkArt t={t} /></svg>
      {label && (clip ? <Hear id={clip}><ArText size={Math.max(s * 0.24, 28)} color={color}>{label}</ArText></Hear> : <ArText size={Math.max(s * 0.24, 28)} color={color}>{label}</ArText>)}
    </motion.div>
  );
}

/** The park: grass and a far hill line. */
function Park({ hill = true }: { hill?: boolean }) {
  return (
    <Svg>
      <rect x={760} y={780} width={760} height={30} fill="#9BB86A" opacity={0.35} />
      {hill && <Draw d="M 760 560 C 960 480, 1200 450, 1520 520" color="#9BB86A" width={4} dur={1.2} />}
    </Svg>
  );
}

/** A big word tile; tap plays. */
function Word({ x, y, id, children, size = 72, color, delay = 0 }: { x: number; y: number; id?: string; children: React.ReactNode; size?: number; color: string; delay?: number }) {
  const body = <span className="inline-block rounded-[24px]" style={{ padding: '4px 28px', background: CARD, boxShadow: `0 0 0 4px ${color}, ${SHADOW}` }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <motion.div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay }}>
      {id ? <Hear id={id}>{body}</Hear> : body}
    </motion.div>
  );
}

/** A dotted pointing line from a hand to a far thing. */
function Point({ d, delay = 0 }: { d: string; delay?: number }) {
  return <Svg><Draw d={d} color={FAR} width={3} dash="3 10" delay={delay} dur={0.9} /></Svg>;
}

/* ---------- spark ---------- */

export function Fk3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Park />
      <Cut src={`${CAST}/jiddo-advice`} x={880} y={830} h={300} />
      <ParkCard t="bird" x={1070} y={700} s={100} delay={0.4} />
      <AnimalCard a="horse" x={1400} y={480} s={70} delay={0.7} />
      <Point d="M 960 520 Q 1180 400 1370 470" delay={1} />
      <Word x={1080} y={600} color={NEAR} size={44} delay={1.3}>هَذَا</Word>
      <Word x={1400} y={380} color={FAR} size={44} delay={1.6}>ذَلِكَ</Word>
    </>
  );
}

/** The mystery box is back for two quick questions. */
export function Fk3RecallGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={1440} y={830} h={300} />
      {lines >= 1 && (
        <>
          <AnimalCard a="cat" x={1150} y={320} s={150} delay={0.2} />
          <Say x={1440} y={520} id="a-haadha-qitt" text="أَهَذَا قِطٌّ؟" align="right" width={220} delay={0.4} />
        </>
      )}
      {lines >= 2 && (
        <>
          <AnimalCard a="rabbit" x={930} y={320} s={150} delay={0.2} />
          <Chip x={1150} y={430} color={TEAL} delay={0.4}>نَعَمْ، هَذَا...</Chip>
          <Chip x={930} y={430} color={CRIMSON} delay={0.6}>لَا، هَذَا...</Chip>
        </>
      )}
    </>
  );
}

export function Fk3ParkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Park hill={lines >= 1} />
      {lines >= 1 && (
        <>
          <Cut src={`${CAST}/jiddo-stand`} x={860} y={830} h={310} />
          <Cut src={`${CAST}/yusuf-stand`} x={1010} y={830} h={250} delay={0.2} />
          <Cut src={`${CAST}/maryam-stand`} x={1130} y={830} h={250} delay={0.3} />
        </>
      )}
      {lines >= 2 && <ParkCard t="bird" x={1260} y={740} s={90} delay={0.2} />}
      {lines >= 3 && (
        <>
          <AnimalCard a="horse" x={1430} y={480} s={60} shadow delay={0.2} />
          <motion.span className="absolute font-sans font-black" style={{ left: 1420, top: 380, fontSize: 50, color: FAR }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>?</motion.span>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

export function Fk3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Park />
      <Cut src={`${CAST}/jiddo-explain`} x={1100} y={830} h={300} />
      <Cut src={`${CAST}/${k >= 3 ? 'yusuf-surprised' : 'yusuf-point'}`} x={860} y={830} h={260} />
      <Cut src={`${CAST}/${k >= 2 ? 'maryam-point' : 'maryam-happy'}`} x={1290} y={830} h={260} />
      <ParkCard t="bird" x={980} y={740} s={80} />
      <AnimalCard a="horse" x={1440} y={470} s={60} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={860} y={520} id="story-1" text="مَا هَذَا يَا جِدِّي؟" width={270} delay={0.3} />
          <Say x={1100} y={370} id="story-2" text="هَذَا طَائِرٌ." width={200} delay={1.6} accent />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Point d="M 1300 560 Q 1380 470 1420 490" />
          <Say x={1290} y={530} id="story-3" text="وَمَا ذَلِكَ؟" align="right" width={200} delay={0.3} />
          <Say x={1100} y={370} id="story-4" text="ذَلِكَ حِصَانٌ." width={210} delay={1.6} accent />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Cut src={`${CAST}/mishmish-walk`} x={1010} y={830} h={110} ratio={1.5} delay={0.3} />
          <Say x={860} y={520} id="story-5" text="وَهَذَا مِشْمِشٌ!" width={240} delay={0.8} accent />
        </React.Fragment>
      )}
    </>
  );
}

/** A hand holds the near bird; a dotted line points to the far horse. */
export function Fk3NearGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Park />
      {lines >= 1 && (
        <>
          <ParkCard t="bird" x={980} y={620} s={170} />
          <Word x={980} y={420} id={lines >= 3 ? 'haadha-tair' : 'haadha'} color={NEAR} size={lines >= 3 ? 44 : 72}>{lines >= 3 ? 'هَذَا طَائِرٌ.' : 'هَذَا'}</Word>
          <Chip x={980} y={720} color={NEAR} delay={0.3}>near · touch it</Chip>
        </>
      )}
      {lines >= 2 && (
        <>
          <AnimalCard a="horse" x={1400} y={470} s={70} delay={0.2} />
          <Point d="M 1060 600 Q 1240 380 1380 460" delay={0.3} />
          <Word x={1330} y={300} id={lines >= 3 ? 'dhalika-hisan' : 'dhalika'} color={FAR} size={lines >= 3 ? 44 : 72} delay={0.6}>{lines >= 3 ? 'ذَلِكَ حِصَانٌ.' : 'ذَلِكَ'}</Word>
          <Chip x={1400} y={540} color={FAR} delay={0.8}>far · point at it</Chip>
        </>
      )}
    </>
  );
}

/** The three question words swing from هَذَا to ذَلِكَ. */
export function Fk3QuestionsGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Park />
      <AnimalCard a="horse" x={1400} y={470} s={70} />
      <Cut src={`${CAST}/maryam-point`} x={900} y={830} h={280} />
      {lines >= 1 && <Point d="M 960 560 Q 1180 400 1370 460" />}
      {lines === 2 && (
        <>
          <Word x={1250} y={240} id="maa-dhalika" color={FAR} size={44}>مَا ذَلِكَ؟</Word>
          <Word x={980} y={240} id="man-dhalika" color={FAR} size={44} delay={0.3}>مَنْ ذَلِكَ؟</Word>
        </>
      )}
      {lines >= 3 && (
        <>
          <Say x={900} y={530} id="a-dhalika-hisan" text="أَذَلِكَ حِصَانٌ؟" width={240} />
          <Say x={1300} y={380} id="naam-dhalika-hisan" text="نَعَمْ، ذَلِكَ حِصَانٌ." align="right" width={300} delay={1.3} accent />
        </>
      )}
    </>
  );
}

/** Near things in front, big; far things on the hill, small; tap each. */
export function Fk3WordsGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Park />
      {lines >= 1 && (
        <>
          <ParkCard t="bird" x={1400} y={690} s={110} label="هَذَا طَائِرٌ" clip="haadha-tair" color={NEAR} />
          <ParkCard t="boy" x={1180} y={690} s={110} label="هَذَا وَلَدٌ" clip="haadha-walad" color={NEAR} delay={0.15} />
          <ThingCard t="house" x={960} y={690} s={110} label="هَذَا بَيْتٌ" clip="haadha-bayt" color={NEAR} delay={0.3} />
          <ParkCard t="mosque" x={1400} y={420} s={90} label="ذَلِكَ مَسْجِدٌ" clip="dhalika-masjid" color={FAR} delay={0.5} />
          <ParkCard t="mountain" x={1170} y={400} s={90} label="ذَلِكَ جَبَلٌ" clip="dhalika-jabal" color={FAR} delay={0.65} />
          <ParkCard t="moon" x={950} y={250} s={90} label="ذَلِكَ قَمَرٌ" clip="dhalika-qamar" color={FAR} delay={0.8} />
        </>
      )}
    </>
  );
}

export function Fk3TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Cut src={`${CAST}/yusuf-point`} x={900} y={830} h={280} />
      <Cut src={`${CAST}/maryam-think`} x={1420} y={830} h={280} delay={0.2} />
      {lines >= 1 && <Say x={900} y={520} id="maa-haadha" text="مَا هَذَا؟" width={180} delay={0.3} />}
      {lines >= 2 && <Say x={1420} y={520} id="maa-dhalika" text="مَا ذَلِكَ؟" align="right" width={180} delay={0.6} />}
    </>
  );
}

/** A window at night: the moon, a house, a mosque, all far. */
export function Fk3MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute overflow-hidden rounded-[20px]" style={{ left: 960, top: 170, width: 460, height: 380, background: 'linear-gradient(180deg, #22313A, #3B4F5C)', boxShadow: `0 0 0 14px #EFE3CC, ${SHADOW}` }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <span className="absolute" style={{ left: 228, top: 0, width: 4, height: 380, background: '#EFE3CC' }} />
          <span className="absolute" style={{ left: 0, top: 188, width: 460, height: 4, background: '#EFE3CC' }} />
        </motion.div>
      )}
      {lines >= 1 && <ParkCard t="moon" x={1320} y={250} s={80} delay={0.5} />}
      {lines >= 2 && (
        <>
          <ParkCard t="mosque" x={1060} y={470} s={80} delay={0.2} />
          <ThingCard t="house" x={1300} y={480} s={70} delay={0.4} />
          <Word x={1190} y={640} color={FAR} size={36} delay={0.7}>ذَلِكَ قَمَرٌ</Word>
        </>
      )}
      <Cut src={`${CAST}/yusuf-point`} x={860} y={830} h={260} />
    </>
  );
}

/** Maryam at her door: بَابٌ, then ٱلْبَابُ. */
export function Fk3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute rounded-t-[80px]" style={{ left: 1100, top: 360, width: 180, height: 440, background: '#8B5A36' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <span className="absolute rounded-full" style={{ right: 20, top: 230, width: 14, height: 14, background: GOLD }} />
        </motion.div>
      )}
      <Cut src={`${CAST}/maryam-happy`} x={1400} y={830} h={280} delay={0.2} />
      <Cut src={`${CAST}/yusuf-think`} x={900} y={830} h={270} />
      {lines >= 2 && (
        <>
          <Say x={900} y={520} text="بَابٌ" width={130} />
          <Say x={1400} y={520} id="al-bab" text="ٱلْبَابُ!" align="right" width={160} delay={1.2} accent />
        </>
      )}
      {lines >= 3 && <Chip x={1190} y={300} color={GOLD} delay={0.3}>ٱلْـ · the</Chip>}
    </>
  );
}
