import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, CLAY } from './kit';
import { ArText, SayBubble, WordTile } from './g-lang';
import { GROUND, Pitch, Ball } from './g-egy';

/**
 * Egyptian Arabic · Kids and Teens · Lesson 2 (Where are you from?). Same code-drawn cast as Lesson 1. The motion
 * carries two ideas: من + فين glue into منين, and the nationality ending turns with the person (ـي / ـية).
 */

/** من and فين slide together into منين. */
function Glue({ lines, y = 300 }: { lines: number; y?: number }) {
  const joined = lines >= 2;
  return (
    <>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: joined ? 110 : 0, opacity: joined ? 0.35 : 1 }} transition={{ duration: 0.8, ease }}>
        <WordTile x={1000} y={y} size={52} id="fen">فين</WordTile>
      </motion.div>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: joined ? -110 : 0, opacity: joined ? 0.35 : 1 }} transition={{ duration: 0.8, ease }}>
        <WordTile x={1320} y={y} size={52} id="min">من</WordTile>
      </motion.div>
      <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 1300, top: y + 50, fontSize: 18, color: TEAL }}>from</span>
      <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 975, top: y + 50, fontSize: 18, color: GOLD }}>where</span>
      {joined && (
        <>
          <Svg><Draw d={`M 1160 ${y + 60} L 1160 ${y + 140}`} color={CRIMSON} width={4} dur={0.5} /></Svg>
          <WordTile x={1160} y={y + 200} size={64} id="minen" hot delay={0.5}>منين؟</WordTile>
        </>
      )}
    </>
  );
}

/** A nationality pair: the country, then the guy and girl forms; `on` lights one. */
function NatRow({ y, country, boy, girl, delay = 0, rebel = false }: { y: number; country: string; boy: string; girl: string; delay?: number; rebel?: boolean }) {
  return (
    <motion.div dir="rtl" className="pointer-events-none absolute flex items-center gap-5" style={{ right: 1600 - 1480, top: y }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span className="rounded-[18px] px-5" style={{ background: '#F1E6D2' }}><ArText size={40}>{country}</ArText></span>
      <span className="font-sans font-black" style={{ fontSize: 30, color: INK_TEXT, opacity: 0.4 }}>←</span>
      <span className="rounded-[18px] px-5" style={{ background: '#FFFDF8', boxShadow: `0 0 0 3px ${TEAL}` }}><ArText size={40} color={TEAL}>{boy}</ArText></span>
      <span className="rounded-[18px] px-5" style={{ background: '#FFFDF8', boxShadow: `0 0 0 3px ${CRIMSON}` }}><ArText size={40} color={CRIMSON}>{girl}</ArText></span>
      {rebel && <span className="rounded-full px-3 py-1 font-sans font-bold" style={{ fontSize: 16, background: GOLD, color: '#fff' }}>rebel!</span>}
    </motion.div>
  );
}

/** A phone with chat bubbles, the mission pages. */
function Phone({ mine, reply }: { mine: React.ReactNode; reply?: React.ReactNode }) {
  return (
    <motion.div className="absolute overflow-hidden rounded-[34px]" style={{ left: 1000, top: 180, width: 360, height: 560, background: '#101418', padding: 12 }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 0.9, ease }}>
      <div className="relative h-full w-full rounded-[24px]" style={{ background: '#ECE5DD' }}>
        <motion.div className="absolute rounded-[16px]" style={{ right: 14, top: 80, padding: '8px 14px', background: '#DCF8C6', maxWidth: 310 }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}>
          {mine}
        </motion.div>
        {reply && (
          <motion.div className="absolute rounded-[16px]" style={{ left: 14, top: 200, padding: '8px 14px', background: '#FFFFFF' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring', bounce: 0.4 }}>
            {reply}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/** A shirt label on a person's chest. */
function ShirtTag({ x, children, delay = 0 }: { x: number; children: React.ReactNode; delay?: number }) {
  return (
    <motion.span className="pointer-events-none absolute -translate-x-1/2 rounded-md font-sans font-black" style={{ left: x, top: GROUND - 150, padding: '2px 8px', fontSize: 15, letterSpacing: '0.08em', background: '#fff', color: CRIMSON }}
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay }}>
      {children}
    </motion.span>
  );
}

/* ================= Kids ================= */

export function Ek2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Person x={1050} y={GROUND} scale={0.85} color={CRIMSON} hijab />
      <Person x={1330} y={GROUND} scale={0.9} color={TEAL} delay={0.3} />
      <SayBubble x={1050} y={560} text="إنت منين؟" width={200} delay={0.8} accent />
      <SayBubble x={1330} y={570} text="؟" align="right" thought width={90} delay={1.4} />
    </>
  );
}

/** Breakfast at Teta's: Mariam asks, Adam wonders. */
export function Ek2QuestionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg>
        <rect x={980} y={690} width={440} height={22} rx={8} fill="#8B5A36" />
        <rect x={1010} y={712} width={16} height={88} fill="#6E4428" />
        <rect x={1374} y={712} width={16} height={88} fill="#6E4428" />
        <circle cx={1120} cy={678} r={14} fill={GOLD} />
        <circle cx={1270} cy={678} r={14} fill={CLAY} />
      </Svg>
      <Person x={950} y={GROUND} scale={0.82} color={CRIMSON} hijab />
      <Person x={1450} y={GROUND} scale={0.88} color={TEAL} delay={0.2} flip />
      {lines >= 2 && <SayBubble x={950} y={560} id="inta-minen" text="إنت منين؟" width={200} accent />}
      {lines >= 3 && <SayBubble x={1450} y={560} text="؟ ؟" align="right" thought width={110} delay={0.2} />}
    </>
  );
}

export function Ek2ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={GROUND} scale={0.82} color={CRIMSON} hijab />
      <Person x={1060} y={GROUND} scale={0.85} color={GOLD} delay={0.1} />
      <Person x={1220} y={GROUND} scale={1.05} color={CLAY} hijab delay={0.2} dim={k >= 1} />
      <Person x={1400} y={GROUND} scale={0.9} color={TEAL} delay={0.3} />
      {k === 1 && <SayBubble key="a" x={880} y={560} id="d-1" text="إنت منين يا آدم؟" width={280} />}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1400} y={560} id="d-2" text="أنا من إنجلترا. وإنتي؟" align="right" width={330} />
          <SayBubble x={880} y={420} id="d-3" text="أنا من مصر!" width={220} delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && <SayBubble key="c" x={1060} y={540} id="d-4" text="وأنا كمان من مصر!" width={300} accent />}
    </>
  );
}

export function Ek2MinenGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Glue lines={lines} y={260} />}
      {lines >= 3 && <WordTile x={1160} y={660} size={48} id="ana-min" color={TEAL} delay={0.3}>أنا من...</WordTile>}
    </>
  );
}

const COUNTRIES = [
  { ar: 'مصر', en: 'Egypt', id: 'masr', c: CRIMSON },
  { ar: 'إنجلترا', en: 'England', id: 'ingiltira', c: TEAL },
  { ar: 'أمريكا', en: 'America', id: 'amrika', c: GOLD },
  { ar: 'كندا', en: 'Canada', id: 'kanada', c: CLAY },
];

/** A dotted globe with four pins, each a tappable country. */
export function Ek2MapGraphic({ lines }: GraphicProps) {
  const pins = [[1290, 330], [1020, 300], [1000, 560], [1310, 580]];
  return (
    <>
      {lines >= 1 && <Svg>
        <circle cx={1160} cy={450} r={250} fill="#E6F0EC" stroke={TEAL} strokeWidth={3} opacity={0.8} />
        <Draw d="M 910 450 L 1410 450 M 1160 200 L 1160 700 M 960 330 Q 1160 380 1360 330 M 960 570 Q 1160 520 1360 570" color={TEAL} width={2} opacity={0.35} dur={1} />
      </Svg>}
      {lines >= 1 && COUNTRIES.map((k, i) => (
        <React.Fragment key={k.id}>
          <WordTile x={pins[i][0]} y={pins[i][1]} size={44} id={k.id} color={k.c} from={{ x: 0, y: -80 }} delay={0.2 + i * 0.25}>{k.ar}</WordTile>
          <Chip x={pins[i][0]} y={pins[i][1] + 40} delay={0.4 + i * 0.25}>{k.en}</Chip>
        </React.Fragment>
      ))}
    </>
  );
}

/** Ziad gets مصري, Mariam gets مصرية; Adam gets إنجليزي. */
export function Ek2MasriGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={940} y={GROUND} scale={0.85} color={GOLD} />
      <Person x={1180} y={GROUND} scale={0.82} color={CRIMSON} hijab delay={0.1} />
      {lines >= 1 && (
        <>
          <WordTile x={940} y={480} size={48} id="ziad-masri" color={TEAL}>مصري</WordTile>
          <WordTile x={1180} y={480} size={48} id="mariam-masriyya" color={CRIMSON} delay={0.3}>مصرية</WordTile>
        </>
      )}
      {lines >= 2 && (
        <>
          <Chip x={940} y={250} color={TEAL} delay={0.2}>boy · ـي</Chip>
          <Chip x={1180} y={250} color={CRIMSON} delay={0.4}>girl · ـية</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={1460} y={GROUND} scale={0.88} color={TEAL} delay={0.1} />
          <SayBubble x={1460} y={590} id="adam-ingilizi" text="إنجليزي!" align="right" width={180} accent delay={0.4} />
        </>
      )}
    </>
  );
}

export function Ek2TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={920} y={GROUND} scale={0.82} color={CRIMSON} hijab />
      <Person x={1100} y={GROUND} scale={0.85} color={GOLD} delay={0.1} />
      <Person x={1360} y={GROUND} scale={0.9} color={TEAL} delay={0.2} />
      <Chip x={1360} y={520} color={TEAL}>you</Chip>
      {lines >= 1 && <SayBubble x={920} y={560} id="inta-minen" text="إنت منين؟" width={200} delay={0.3} />}
    </>
  );
}

export function Ek2MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1000} y={GROUND} scale={0.85} color={TEAL} />
      <Person x={1330} y={GROUND} scale={1.08} color={CLAY} hijab delay={0.2} />
      {lines >= 1 && <SayBubble x={1000} y={560} text="إنتي منين؟" width={200} />}
      {lines >= 2 && <SayBubble x={1330} y={500} text="أنا من مصر!" align="right" width={220} delay={0.3} accent />}
    </>
  );
}

/** Teta's big old box; the lid lifts on the last line. */
export function Ek2NextGraphic({ lines }: GraphicProps) {
  const open = lines >= 2;
  return (
    <>
      <Person x={960} y={GROUND} scale={1.02} color={CLAY} hijab />
      <Person x={1420} y={GROUND} scale={0.88} color={TEAL} delay={0.1} />
      {lines >= 1 && (
        <div className="pointer-events-none absolute" style={{ left: 1080, top: 620, width: 240, height: 180 }}>
          <div className="absolute inset-x-0 bottom-0 rounded-[10px]" style={{ height: 150, background: '#8B5A36', boxShadow: 'inset 0 -16px 0 #6E4428' }} />
          <span className="absolute rounded-sm" style={{ left: 108, top: 70, width: 24, height: 30, background: GOLD }} />
          <motion.div className="absolute inset-x-0 rounded-[10px]" style={{ top: 0, height: 36, background: '#A26B42', transformOrigin: 'left bottom' }}
            initial={false} animate={{ rotate: open ? -28 : 0, y: open ? -10 : 0 }} transition={{ duration: 0.8, ease }} />
          {open && <motion.span className="absolute rounded-full" style={{ left: 60, top: -20, width: 120, height: 60, background: `${GOLD}66`, filter: 'blur(14px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />}
        </div>
      )}
      {lines >= 2 && <SayBubble x={1420} y={560} id="eh-da" text="إيه ده؟" align="right" width={170} accent delay={0.3} />}
    </>
  );
}

/* ================= Teens ================= */

export function Et2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={1050} y={GROUND} scale={1.05} color={TEAL} />
      <ShirtTag x={1050} delay={0.6}>CANADA</ShirtTag>
      <Person x={1300} y={GROUND} scale={1} color={CRIMSON} hijab delay={0.2} />
      <SayBubble x={1300} y={540} text="إنت منين؟" align="right" width={200} delay={1.1} accent />
    </>
  );
}

export function Et2ShirtGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={1000} y={GROUND} scale={1.05} color={TEAL} />
      {lines >= 1 && <ShirtTag x={1000} delay={0.3}>CANADA</ShirtTag>}
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 240, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, ease }}>
          <Person x={1300} y={GROUND} scale={1} color={CRIMSON} hijab />
        </motion.div>
      )}
      {lines >= 2 && <SayBubble x={1300} y={540} id="nour-minen" text="إنت منين؟" align="right" width={200} delay={1} />}
      {lines >= 3 && (
        <>
          <Chip x={900} y={260} color={TEAL} delay={0.2}>born: Canada</Chip>
          <Chip x={1120} y={260} color={CRIMSON} delay={0.5}>family: Egypt</Chip>
          <Svg><Draw d="M 980 280 Q 1010 230 1040 280" color={GOLD} width={4} dash="4 8" dur={0.6} /></Svg>
        </>
      )}
    </>
  );
}

export function Et2ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Pitch />
      <Person x={900} y={GROUND} scale={1} color={CRIMSON} hijab />
      <Person x={1130} y={GROUND} scale={1.05} color={TEAL} delay={0.1} />
      <Person x={1380} y={GROUND} scale={1.05} color={GOLD} delay={0.2} />
      {k === 1 && <SayBubble key="a" x={900} y={540} id="d-1" text="إنت منين يا عمر؟" width={270} />}
      {k === 2 && <SayBubble key="b" x={1130} y={520} id="d-2" text="أنا من كندا، بس أصلاً من مصر." width={420} />}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={900} y={540} id="d-3" text="بجد؟ يعني إنت مصري!" width={300} />
          <SayBubble x={1380} y={420} id="d-4" text="مصري جديد! نسخة كندي!" align="right" width={330} delay={1.4} accent />
          <Ball x={1300} y={775} from={200} delay={1.6} />
        </React.Fragment>
      )}
    </>
  );
}

export function Et2MinenGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Glue lines={lines} y={240} />}
      {lines >= 3 && (
        <>
          <WordTile x={1330} y={640} size={42} id="inta-minen" color={TEAL} delay={0.2}>إنت منين؟</WordTile>
          <WordTile x={1000} y={640} size={42} id="inti-minen" color={CRIMSON} delay={0.4}>إنتي منين؟</WordTile>
        </>
      )}
    </>
  );
}

/** Two places, one sentence: كندا and مصر linked by بس أصلاً. */
export function Et2AslGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <WordTile x={1300} y={230} size={46} id="bass" color={GOLD}>بس</WordTile>
          <Chip x={1300} y={275} delay={0.2}>but</Chip>
          <WordTile x={1020} y={230} size={46} id="aslan" color={CRIMSON} delay={0.3}>أصلاً</WordTile>
          <Chip x={1020} y={275} delay={0.5}>originally</Chip>
        </>
      )}
      {lines >= 2 && (
        <>
          <WordTile x={1330} y={450} size={40} color={TEAL} from={{ x: 80, y: 0 }}>أنا من كندا،</WordTile>
          <Svg><Draw d="M 1240 480 Q 1160 560 1080 480" color={GOLD} width={4} dash="4 10" dur={0.8} /></Svg>
          <WordTile x={990} y={450} size={40} color={CRIMSON} from={{ x: -80, y: 0 }} delay={0.6}>بس أصلاً من مصر.</WordTile>
          <Chip x={1330} y={500} color={TEAL} delay={0.8}>where I live</Chip>
          <Chip x={990} y={500} color={CRIMSON} delay={1}>where we are from</Chip>
        </>
      )}
      {lines >= 3 && <SayBubble x={1160} y={720} text="أهلاً! يعني مصري!" width={290} accent delay={0.3} />}
    </>
  );
}

/** The nationality table, then the Cairo g. */
export function Et2NatGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <NatRow y={190} country="مصر" boy="مصري" girl="مصرية" />
          <NatRow y={300} country="كندا" boy="كندي" girl="كندية" delay={0.3} />
        </>
      )}
      {lines >= 2 && <NatRow y={410} country="أمريكا" boy="أمريكاني" girl="أمريكانية" rebel />}
      {lines >= 3 && (
        <>
          <WordTile x={1260} y={640} size={56} id="gidid" hot>جديد</WordTile>
          <Chip x={1010} y={610} color={GOLD} delay={0.4}>ج = g in Cairo</Chip>
          <Chip x={1010} y={660} delay={0.6}>gidiid</Chip>
        </>
      )}
    </>
  );
}

export function Et2TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={900} y={GROUND} scale={1.05} color={GOLD} />
      <Person x={1080} y={GROUND} scale={1} color={CRIMSON} hijab delay={0.1} />
      <Person x={1300} y={GROUND} scale={1.05} color={TEAL} delay={0.2} />
      <Chip x={1300} y={520} color={TEAL}>you</Chip>
      {lines >= 1 && <SayBubble x={900} y={540} id="inta-minen" text="إنت منين؟" width={200} delay={0.3} />}
    </>
  );
}

export function Et2MissionGraphic({ lines }: GraphicProps) {
  return lines >= 1
    ? <Phone mine={<ArText size={21}>أنا من كندا، بس أصلاً من مصر</ArText>} reply={lines >= 2 ? <ArText size={26}>بجد؟ جامد!</ArText> : undefined} />
    : null;
}

/** Karim's bag, and something weird coming out of it. */
export function Et2NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={GROUND} scale={1.05} color={GOLD} />
      <Person x={1380} y={GROUND} scale={1} color={CRIMSON} hijab delay={0.1} />
      <Person x={1220} y={GROUND} scale={1.05} color={TEAL} delay={0.2} />
      {lines >= 1 && (
        <div className="pointer-events-none absolute" style={{ left: 1030, top: 700, width: 150, height: 100 }}>
          <div className="absolute inset-0 rounded-[24px]" style={{ background: '#22313A' }} />
          <span className="absolute rounded-full" style={{ left: 20, top: 20, width: 110, height: 6, background: GOLD }} />
          <motion.span className="absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 45, width: 60, height: 60, background: '#FFFDF8', color: CRIMSON, fontSize: 34, boxShadow: `0 0 30px 6px ${GOLD}88` }}
            initial={{ top: 20, opacity: 0 }} animate={{ top: -70, opacity: 1 }} transition={{ duration: 0.9, delay: 0.4, type: 'spring', bounce: 0.4 }}>?</motion.span>
        </div>
      )}
      {lines >= 2 && (
        <>
          <SayBubble x={1380} y={540} id="eh-da" text="إيه ده؟" align="right" width={160} accent delay={0.2} />
          <SayBubble x={1220} y={420} text="إيه ده؟" width={160} delay={0.35} />
        </>
      )}
    </>
  );
}
