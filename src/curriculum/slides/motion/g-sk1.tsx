import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip } from './kit';
import { Hear, QURAN_FONT, useQuranFont } from '../Say';

/**
 * Seerah · Kids · Episode 1 · The Elephant Who Sat Down. Kids paper stage; a valley drawn in code: mountains, the Kaaba,
 * Abraha's church, an elephant built from simple shapes, swallows with stones. Abraha's army is far away and faceless.
 * The Prophet ﷺ is never drawn: on the birth page he is a soft light over an empty cradle.
 */

const SAND = '#F0D9A8';
const HILL = '#C9A06A';
const GREY = '#9AA1A8';

/** The Kaaba: a black cube with a gold band, feet centred at (x, y). */
function Kaaba({ x, y, s = 1, glow = false, delay = 0 }: { x: number; y: number; s?: number; glow?: boolean; delay?: number }) {
  const w = 120 * s;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - w * 1.05, width: w, height: w * 1.05 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      <svg viewBox="0 0 120 126" width="100%" height="100%" style={{ overflow: 'visible', filter: glow ? `drop-shadow(0 0 22px ${GOLD})` : undefined }}>
        <path d="M 10 30 L 60 14 L 110 30 L 110 120 L 60 126 L 10 120 Z" fill="#1B1B1D" />
        <path d="M 10 30 L 60 46 L 110 30" fill="none" stroke="#2C2C30" strokeWidth={2} />
        <path d="M 60 46 L 60 126" stroke="#2C2C30" strokeWidth={2} />
        <path d="M 10 50 L 60 64 L 110 50 L 110 58 L 60 72 L 10 58 Z" fill={GOLD} />
      </svg>
    </motion.div>
  );
}

/** A kid-style elephant facing left; `sit` lowers it on to its back legs. Feet at (x, y). */
function Elephant({ x, y, s = 1, sit = false, color = GREY, delay = 0 }: { x: number; y: number; s?: number; sit?: boolean; color?: string; delay?: number }) {
  const W = 260 * s, H = 200 * s;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - W / 2, top: y - H, width: W, height: H }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      <motion.svg viewBox="0 0 260 200" width="100%" height="100%" style={{ overflow: 'visible', transformOrigin: '190px 200px' }} initial={false} animate={{ rotate: sit ? 14 : 0, y: sit ? 18 : 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.9 }}>
        <rect x={70} y={130} width={30} height={70} rx={10} fill={color} />
        <rect x={180} y={130} width={30} height={70} rx={10} fill={color} />
        <ellipse cx={150} cy={110} rx={100} ry={62} fill={color} />
        <circle cx={62} cy={88} r={46} fill={color} />
        <path d="M 30 100 C 10 130, 18 170, 36 180" fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" />
        <ellipse cx={88} cy={84} rx={26} ry={34} fill="#B9C0C6" />
        <circle cx={48} cy={78} r={5} fill={INK_TEXT} />
        <path d="M 30 112 L 14 120" stroke="#FFFDF8" strokeWidth={6} strokeLinecap="round" />
        <rect x={110} y={44} width={70} height={22} rx={6} fill={CRIMSON} />
      </motion.svg>
    </motion.div>
  );
}

/** A swallow carrying three stones. */
function Bird({ x, y, delay = 0, fly = 0 }: { x: number; y: number; delay?: number; fly?: number }) {
  const reduce = useReduce();
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x, top: y, overflow: 'visible' }} width={70} height={50} viewBox="0 0 70 50"
      initial={{ x: fly, opacity: 0 }} animate={reduce ? { x: 0, opacity: 1 } : { x: 0, opacity: 1, y: [0, -6, 0] }} transition={{ x: { duration: 1.6, delay, ease }, opacity: { duration: 0.4, delay }, y: { duration: 0.6, repeat: Infinity, delay } }}>
      <path d="M 5 20 Q 22 4 35 18 Q 48 4 65 20 Q 48 14 35 26 Q 22 14 5 20 Z" fill="#2B3A4A" />
      <circle cx={30} cy={23} r={4} fill="#8B6A4A" />
      <circle cx={30} cy={36} r={4} fill="#8B6A4A" />
      <circle cx={40} cy={36} r={4} fill="#8B6A4A" />
    </motion.svg>
  );
}

function Valley({ hills = true }: { hills?: boolean }) {
  return (
    <Svg>
      {hills && <path d="M 760 800 L 860 560 L 960 680 L 1060 520 L 1180 700 L 1300 540 L 1420 660 L 1520 580 L 1520 800 Z" fill={HILL} opacity={0.55} />}
      <rect x={760} y={760} width={760} height={40} fill={SAND} />
    </Svg>
  );
}

/* ---------- spark ---------- */

export function Sk1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Valley />
      <Kaaba x={1380} y={770} s={0.9} glow delay={0.3} />
      <Elephant x={1020} y={780} s={1} delay={0.6} sit />
      <Bird x={1100} y={260} delay={1} fly={-200} />
      <Bird x={1200} y={220} delay={1.2} fly={-200} />
      <Bird x={1300} y={280} delay={1.4} fly={-200} />
    </>
  );
}

export function Sk1MakkahGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Valley />
      {lines >= 1 && <Svg>{[880, 960, 1440].map((x, i) => <motion.rect key={x} x={x} y={700} width={60} height={60} rx={4} fill="#E8D2A6" stroke={HILL} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }} />)}</Svg>}
      {lines >= 2 && <Kaaba x={1180} y={770} s={1.1} glow delay={0.2} />}
      {lines >= 3 && [0, 1, 2].map((i) => (
        <motion.div key={i} className="pointer-events-none absolute" style={{ left: 0, top: 0 }} initial={{ x: 400 + i * 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 2, delay: i * 0.4, ease }}>
          <Person x={1300 + i * 70} y={770} scale={0.45} color={[TEAL, GOLD, CRIMSON][i]} />
        </motion.div>
      ))}
    </>
  );
}

/** Abraha's shiny church in Yemen stays empty while the little Kaaba draws the travellers; a jealous red cloud grows. */
export function Sk1AbrahaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg><rect x={760} y={760} width={760} height={40} fill={SAND} /></Svg>
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute" style={{ left: 820, top: 330, width: 260, height: 430 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <svg viewBox="0 0 260 430" width="100%" height="100%">
            <rect x={20} y={140} width={220} height={290} fill="#E6E8EC" />
            <path d="M 20 140 L 130 20 L 240 140 Z" fill={GOLD} />
            <rect x={105} y={330} width={50} height={100} rx={25} fill="#8D97A3" />
            {[60, 170].map((x) => <rect key={x} x={x} y={200} width={30} height={60} rx={15} fill="#8D97A3" />)}
          </svg>
          <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ top: 440, fontSize: 16, color: soft('light') }}>Yemen · empty</span>
        </motion.div>
      )}
      <Kaaba x={1360} y={770} s={0.85} delay={0.2} />
      {lines >= 3 && [0, 1, 2].map((i) => <Person key={i} x={1240 + i * 60} y={770} scale={0.42} color={[TEAL, GOLD, CRIMSON][i]} delay={0.2 + i * 0.2} />)}
      {lines >= 3 && <Chip x={880} y={300} color={CRIMSON} delay={0.4}>jealous!</Chip>}
      {lines >= 4 && <Chip x={1100} y={220} strong delay={0.2}>"I will knock the Kaaba down!"</Chip>}
    </>
  );
}

/** A balance: the army with elephants on one pan, the little town on the other; it tips hard toward the army. */
export function Sk1ScalesGraphic({ lines, interaction }: GraphicProps) {
  const tilt = interaction ? 0 : lines >= 2 ? -14 : 0;
  if (lines === 0) return null;
  return (
    <>
      <Svg><Draw d="M 1130 760 L 1130 330" color={INK_TEXT} width={8} /><Draw d="M 1060 760 L 1200 760" color={INK_TEXT} width={10} /></Svg>
      <motion.div className="pointer-events-none absolute" style={{ left: 880, top: 300, width: 500, height: 40, transformOrigin: '250px 30px' }} initial={false} animate={{ rotate: tilt }} transition={{ type: 'spring', bounce: 0.3, duration: 1.2 }}>
        <div className="absolute rounded-full" style={{ left: 0, top: 26, width: 500, height: 8, background: INK_TEXT }} />
        {lines >= 1 && <div className="absolute" style={{ left: -40, top: 34 }}><Elephant x={70} y={180} s={0.6} /></div>}
        {lines >= 2 && <div className="absolute" style={{ left: 380, top: 34 }}><Kaaba x={60} y={150} s={0.8} /></div>}
      </motion.div>
      {interaction && <Chip x={1130} y={250} color={GOLD}>wait and see…</Chip>}
    </>
  );
}

/** The army marches in from the right: the counter rises to 60,000; elephants file past. */
export function Sk1MarchGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      <Svg><rect x={760} y={760} width={760} height={40} fill={SAND} /></Svg>
      {lines >= 1 && (
        <div className="pointer-events-none absolute" style={{ left: 780, top: 640, width: 720, height: 120, overflow: 'hidden' }}>
          <motion.div className="flex gap-2" initial={{ x: reduce ? 0 : 600 }} animate={{ x: 0 }} transition={{ duration: 3, ease: 'linear' }}>
            {Array.from({ length: 40 }, (_, i) => <span key={i} className="block shrink-0 rounded-t-full" style={{ width: 16, height: 46 + (i % 3) * 6, marginTop: 70 - (i % 3) * 6, background: '#7C5A44', opacity: 0.8 }} />)}
          </motion.div>
        </div>
      )}
      {lines >= 2 && [0, 1, 2].map((i) => <Elephant key={i} x={900 + i * 210} y={660} s={0.55 + (i === 0 ? 0.25 : 0)} delay={0.2 + i * 0.3} />)}
      {lines >= 3 && <Chip x={900} y={330} strong delay={0.4}>the biggest at the front</Chip>}
      {items >= 1 && (
        <motion.div className="pointer-events-none absolute" style={{ left: 1180, top: 220 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-serif" style={{ fontSize: 76, color: CRIMSON }}>60,000</span>
          <div className="font-sans font-bold" style={{ fontSize: 18, color: INK_TEXT }}>soldiers</div>
        </motion.div>
      )}
      {items >= 2 && <Chip x={1290} y={360} color={GREY}>9 or 13 elephants</Chip>}
    </>
  );
}

/** The people climb into the hills (small figures rise up the slopes); the Kaaba is left alone with a soft light. */
export function Sk1HillsGraphic({ lines }: GraphicProps) {
  const up = lines >= 2;
  return (
    <>
      <Valley />
      <Kaaba x={1140} y={770} s={0.95} glow={lines >= 3} />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div key={i} className="pointer-events-none absolute" style={{ left: 0, top: 0 }} initial={false}
          animate={{ x: up ? [-260, -200, 120, 180, 280][i] : 0, y: up ? [-200, -230, -210, -250, -180][i] : 0 }} transition={{ duration: 1.8, delay: i * 0.12, ease }}>
          <Person x={1060 + i * 40} y={770} scale={0.38} color={[TEAL, GOLD, CRIMSON, TEAL, GOLD][i]} />
        </motion.div>
      ))}
      {lines >= 3 && <Chip x={1140} y={560} color={GOLD} delay={0.3}>who will protect it?</Chip>}
    </>
  );
}

/** The wow: the elephant walks, turns away and stands, turns to the Kaaba and sits. */
export function Sk1KneelGraphic({ lines }: GraphicProps) {
  const sit = lines === 2 || lines >= 3;
  const turned = lines >= 3;
  return (
    <>
      <Valley hills={false} />
      <Kaaba x={860} y={770} s={0.8} />
      <motion.div className="pointer-events-none absolute" style={{ left: 0, top: 0 }} initial={{ x: 200 }} animate={{ x: lines >= 1 ? 0 : 200 }} transition={{ duration: 1.6, ease }}>
        {!turned && <Elephant x={1250} y={780} s={1.1} sit={sit} />}
        {turned && <Elephant x={1250} y={780} s={1.1} sit />}
      </motion.div>
      {lines >= 2 && !turned && <Chip x={1250} y={480} strong>it sat down!</Chip>}
      {turned && (
        <>
          <Svg>
            <Draw d="M 1250 560 L 1440 480" color={TEAL} width={6} delay={0.2} dur={0.6} />
            <Draw d="M 1420 470 L 1444 478 L 1430 500" color={TEAL} width={6} delay={0.7} dur={0.3} />
            <Draw d="M 1170 600 L 960 640" color={CRIMSON} width={6} delay={1} dur={0.6} />
            <Draw d="M 980 624 L 956 641 L 982 656" color={CRIMSON} width={6} delay={1.5} dur={0.3} />
          </Svg>
          <Chip x={1440} y={420} color={TEAL} delay={0.6}>another way: it walks</Chip>
          <Chip x={980} y={560} color={CRIMSON} delay={1.4}>to the Kaaba: it sits</Chip>
        </>
      )}
    </>
  );
}

/** Flocks of birds cross the sky; stones fall like rain on the far-off army. */
export function Sk1BirdsGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      <Valley hills={false} />
      {lines >= 1 && Array.from({ length: 9 }, (_, i) => <Bird key={i} x={860 + (i % 5) * 130} y={190 + Math.floor(i / 5) * 90 + (i % 2) * 20} delay={i * 0.12} fly={-500} />)}
      {lines >= 2 && <Chip x={1140} y={430} color={GOLD} delay={0.3}>3 stones each</Chip>}
      {lines >= 3 && (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: 880 + i * 44, top: 300, width: 10, height: 10, background: '#8B6A4A' }}
              initial={{ y: 0, opacity: 0 }} animate={reduce ? { y: 400, opacity: 1 } : { y: [0, 420], opacity: [0, 1, 1] }} transition={{ duration: 1.2, delay: (i % 5) * 0.2, repeat: reduce ? 0 : Infinity, repeatDelay: 0.6 }} />
          ))}
          <Elephant x={1300} y={780} s={0.5} sit color="#B9C0C6" />
        </>
      )}
    </>
  );
}

/** Surat al-Fil: five ayat, each with its picture; tap to hear the reciter. */
export function Sk1FilGraphic({ lines }: GraphicProps) {
  useQuranFont();
  const ayat = [
    { id: 'fil-1', t: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَـٰبِ ٱلْفِيلِ' },
    { id: 'fil-2', t: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍ' },
    { id: 'fil-3', t: 'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ' },
    { id: 'fil-4', t: 'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ' },
    { id: 'fil-5', t: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍۭ' },
  ];
  if (lines === 0) return null;
  const tags = ['the elephant', 'the plan fails', 'the birds', 'the stones', 'like straw'];
  return (
    <div className="absolute flex flex-col gap-2" style={{ left: 820, top: 180, width: 680 }}>
      {ayat.map((a, i) => (
        <motion.div key={a.id} className="flex items-center justify-between rounded-[16px]" style={{ padding: '0 16px', height: 84, background: '#0E5A4B', boxShadow: `inset 0 0 0 3px ${GOLD}88` }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12, duration: 0.5, ease }}>
          <span className="rounded-full px-3 py-1 font-sans font-bold" style={{ fontSize: 15, background: lines >= 2 ? GOLD : 'transparent', color: lines >= 2 ? INK_TEXT : 'transparent', transition: 'all 0.5s' }}>{tags[i]}</span>
          <Hear id={a.id}><span lang="ar" dir="rtl" style={{ fontFamily: QURAN_FONT, fontSize: 34, lineHeight: 1.9, color: '#F6E3B8', whiteSpace: 'nowrap' }}>{a.t}</span></Hear>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- athar ---------- */

/** An empty cradle under a soft light; the Kaaba nearby; the year stamp. The Prophet ﷺ is never drawn. */
export function Sk1BabyGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      <Valley />
      {lines >= 1 && (
        <>
          <Svg>
            <path d="M 1040 700 Q 1120 760 1200 700" fill="none" stroke="#8B5A36" strokeWidth={10} strokeLinecap="round" />
            <path d="M 1050 700 L 1190 700" stroke="#8B5A36" strokeWidth={8} strokeLinecap="round" />
          </Svg>
          <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1080, top: 600, width: 80, height: 80, background: '#FFF4D6', boxShadow: `0 0 60px 30px ${GOLD}AA` }}
            initial={{ scale: 0, opacity: 0 }} animate={reduce ? { scale: 1, opacity: 1 } : { scale: [1, 1.1, 1], opacity: 1 }} transition={reduce ? { duration: 0.6 } : { duration: 2.4, repeat: Infinity }} />
          <Chip x={1120} y={540} color={GOLD} delay={0.4}>a Monday · Makkah</Chip>
        </>
      )}
      {lines >= 2 && <Kaaba x={1400} y={770} s={0.8} glow delay={0.2} />}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute rounded-[18px] text-center" style={{ left: 880, top: 220, width: 480, padding: '12px 0', border: `3px solid ${CRIMSON}`, background: '#FFFDF8' }} initial={{ opacity: 0, scale: 1.3, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <span className="font-sans font-black" style={{ fontSize: 34, color: CRIMSON }}>The Year of the Elephant</span>
          <div lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 30, color: '#8B1A1E' }}>عام الفيل · مُحَمَّد ﷺ</div>
        </motion.div>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

export function Sk1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={790} scale={0.9} color={TEAL} />
      <Person x={1250} y={790} scale={1.1} color={CRIMSON} hijab delay={0.1} />
      <Person x={1420} y={790} scale={1.15} color={GOLD} delay={0.2} />
      {lines >= 1 && <Chip x={1180} y={430} strong delay={0.3}>the elephant who sat down</Chip>}
      {lines >= 2 && <Chip x={960} y={500} color={GOLD} delay={0.3}>Surat al-Fil</Chip>}
    </>
  );
}

/** A slow donkey crosses the desert toward Makkah, with a question mark. */
export function Sk1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Valley />
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute" style={{ left: 0, top: 0 }} initial={{ x: 300 }} animate={{ x: 0 }} transition={{ duration: 6, ease: 'linear' }}>
          <svg className="absolute" style={{ left: 1180, top: 660, overflow: 'visible' }} width={140} height={110} viewBox="0 0 140 110">
            <ellipse cx={75} cy={55} rx={50} ry={26} fill="#9C8A7A" />
            <rect x={40} y={70} width={10} height={36} fill="#9C8A7A" /><rect x={95} y={70} width={10} height={36} fill="#9C8A7A" />
            <path d="M 30 50 L 8 30 L 4 46 Z" fill="#9C8A7A" /><circle cx={16} cy={46} r={14} fill="#9C8A7A" />
          </svg>
          <Person x={1255} y={680} scale={0.55} color={TEAL} hijab />
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1250} y={480} color={GOLD} delay={0.3}>the slowest donkey of all…</Chip>}
      {lines >= 3 && <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: 900, top: 300, width: 100, height: 100, fontSize: 60, background: CRIMSON }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>?</motion.span>}
    </>
  );
}
