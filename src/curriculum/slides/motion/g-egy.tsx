import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Badge, CLAY } from './kit';
import { ArText, SayBubble, WordTile } from './g-lang';
import { Hear } from '../Say';

/**
 * Egyptian Arabic · Kids and Teens · Lesson 1. Faceless people drawn in code. Kids: Teta's flat in Cairo, Adam (teal),
 * Ziad (gold), Mariam (crimson, hijab), Teta (clay, hijab). Teens: a summer football club, Omar (teal), Karim (gold),
 * Nour (crimson, hijab). The motion carries the one idea of both lessons: the ending turns with the person you face.
 */

const GROUND = 800;

/** Teta's door: a wooden door in a wall, opening when `open`. */
function TetaDoor({ open }: { open: boolean }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: 1040, top: 330, width: 220, height: 470 }}>
      <div className="absolute inset-0 rounded-t-[110px]" style={{ background: '#EAD9BE' }} />
      <div className="absolute rounded-t-[80px]" style={{ left: 30, top: 40, width: 160, height: 430, background: '#3A2418' }} />
      <motion.div className="absolute rounded-t-[80px]" style={{ left: 30, top: 40, width: 160, height: 430, background: '#8B5A36', transformOrigin: 'left center' }}
        initial={false} animate={{ scaleX: open ? 0.15 : 1 }} transition={{ duration: 1, ease }}>
        <span className="absolute rounded-full" style={{ right: 18, top: 230, width: 12, height: 12, background: GOLD }} />
      </motion.div>
    </div>
  );
}

/** A football pitch line and goal, the Teens club. */
function Pitch() {
  return (
    <Svg>
      <rect x={760} y={760} width={760} height={40} fill="#5AA153" opacity={0.35} />
      <Draw d="M 1380 760 L 1380 600 L 1500 600 L 1500 760" color="#FFFFFF" width={6} dur={0.8} />
      <Draw d="M 1380 600 L 1500 600" color={INK_TEXT} width={2} opacity={0.3} />
    </Svg>
  );
}

function Ball({ x, y, delay = 0, from }: { x: number; y: number; delay?: number; from?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 22, top: y - 22, overflow: 'visible' }} width={44} height={44}
      initial={{ x: from ?? 0, rotate: 0 }} animate={{ x: 0, rotate: 360 }} transition={{ duration: 1.2, delay, ease }}>
      <circle cx={22} cy={22} r={20} fill="#fff" stroke={INK_TEXT} strokeWidth={3} />
      <path d="M 22 10 l 9 7 l -3 10 h -12 l -3 -10 z" fill={INK_TEXT} />
    </motion.svg>
  );
}

/** The ending card: ـَك for a guy, ـِك for a girl; the active one glows. */
function Ending({ x, y, girl }: { x: number; y: number; girl: boolean }) {
  return (
    <div className="pointer-events-none absolute flex gap-4" style={{ left: x, top: y }}>
      {[{ t: 'ـَك', on: !girl, c: TEAL, l: 'guy' }, { t: 'ـِك', on: girl, c: CRIMSON, l: 'girl' }].map((e) => (
        <motion.div key={e.t} className="flex flex-col items-center rounded-[18px]" style={{ padding: '2px 20px', background: '#FFFDF8' }}
          initial={false} animate={{ boxShadow: e.on ? `0 0 0 4px ${e.c}, 0 0 30px 6px ${e.c}55` : '0 0 0 2px rgba(31,22,18,0.12)', opacity: e.on ? 1 : 0.5 }} transition={{ duration: 0.5 }}>
          <ArText size={50} color={e.c}>{e.t}</ArText>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: e.c }}>{e.l}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ================= Kids ================= */

export function Ek1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <TetaDoor open />
      <Person x={1150} y={GROUND} scale={1.1} color={CLAY} hijab />
      <Person x={1350} y={GROUND} scale={0.9} color={TEAL} delay={0.3} />
      <SayBubble x={1150} y={510} id="ahlan" text="أهلاً!" width={150} delay={0.8} accent />
    </>
  );
}

export function Ek1DoorGraphic({ lines }: GraphicProps) {
  const open = lines >= 3;
  return (
    <>
      <TetaDoor open={open} />
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.2, ease }}>
          <Person x={1380} y={GROUND} scale={0.9} color={TEAL} />
        </motion.div>
      )}
      {lines >= 2 && !open && (
        <>
          <Chip x={1150} y={260} color={GOLD}>knock, knock!</Chip>
          <SayBubble x={1380} y={560} text="؟" align="right" thought width={90} />
        </>
      )}
      {open && (
        <>
          <Person x={1150} y={GROUND} scale={1.05} color={CLAY} hijab />
          <Person x={930} y={GROUND} scale={0.85} color={GOLD} delay={0.4} />
          <Person x={820} y={GROUND} scale={0.82} color={CRIMSON} hijab delay={0.6} />
          <SayBubble x={1150} y={500} id="teta" text="تيتة" width={140} delay={0.5} />
        </>
      )}
    </>
  );
}

export function Ek1ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={GROUND} scale={0.82} color={CRIMSON} hijab />
      <Person x={1020} y={GROUND} scale={0.85} color={GOLD} delay={0.1} />
      <Person x={1220} y={GROUND} scale={1.05} color={CLAY} hijab delay={0.2} />
      <Person x={1400} y={GROUND} scale={0.9} color={TEAL} delay={0.3} />
      {k === 1 && <SayBubble key="a" x={1220} y={510} id="d-teta" text="أهلاً يا حبيبي! نوّرت!" align="right" width={300} delay={0.3} />}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1020} y={470} id="d-ziad" text={<>السلام عليكم! أنا زياد. إنت <span style={{ color: TEAL }}>اسمَك</span> إيه؟</>} width={420} />
          <SayBubble x={1400} y={570} id="d-adam" text={<>وعليكم السلام! <span style={{ color: CRIMSON }}>اسمي</span> آدم.</>} align="right" width={300} delay={1.4} />
        </React.Fragment>
      )}
      {k === 3 && <SayBubble key="c" x={880} y={600} id="d-mariam" text="وأنا مريم!" width={200} accent />}
    </>
  );
}

export function Ek1HelloGraphic({ lines }: GraphicProps) {
  const pairs = [
    { a: 'السلام عليكم', b: 'وعليكم السلام', ia: 'salam', ib: 'wa-alaykum' },
    { a: 'أهلاً', b: 'أهلاً بيك', ia: 'ahlan', ib: 'ahlan-bik' },
    { a: 'أهلاً', b: 'أهلاً بيكي', ia: 'ahlan', ib: 'ahlan-biki' },
  ];
  return (
    <>
      {pairs.slice(0, Math.max(0, lines)).map((p, i) => {
        const y = 260 + i * 170;
        return (
          <React.Fragment key={i}>
            <WordTile x={1360} y={y} size={40} id={p.ia}>{p.a}</WordTile>
            <Svg><Draw d={`M 1240 ${y} L 1060 ${y}`} color={GOLD} width={4} delay={0.4} dur={0.5} /><Draw d={`M 1078 ${y - 12} L 1058 ${y} L 1078 ${y + 12}`} color={GOLD} width={4} delay={0.8} dur={0.2} /></Svg>
            <WordTile x={940} y={y} size={40} id={p.ib} hot={i === Math.max(0, lines) - 1} delay={0.6}>{p.b}</WordTile>
            {i >= 1 && <Badge x={800} y={y} name="heart" size={56} color={i === 1 ? TEAL : CRIMSON} delay={0.8} />}
          </React.Fragment>
        );
      })}
      {lines >= 3 && (
        <>
          <Chip x={800} y={490} color={TEAL} delay={0.9}>boy</Chip>
          <Chip x={800} y={660} color={CRIMSON} delay={1}>girl</Chip>
        </>
      )}
    </>
  );
}

/** A name tag: اسمي fills, then the child's own name slot glows. */
export function Ek1IsmiGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1150} y={GROUND} scale={1.1} color={TEAL} />
      {lines >= 1 && (
        <motion.div className="absolute flex flex-col items-center overflow-hidden rounded-[20px]" style={{ left: 980, top: 230, width: 340, background: '#FFFDF8', boxShadow: `0 0 0 4px ${CRIMSON}, 0 18px 34px -24px rgba(60,30,10,0.6)` }}
          initial={{ rotate: -8, y: -30, opacity: 0 }} animate={{ rotate: -2, y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <span className="w-full text-center font-sans font-bold uppercase text-white" style={{ fontSize: 14, letterSpacing: '0.18em', padding: '4px 0', background: CRIMSON }}>hello!</span>
          <Hear id="ismi-adam"><ArText size={58}>اسمي آدم</ArText></Hear>
        </motion.div>
      )}
      {lines >= 2 && <SayBubble x={1320} y={500} id="ana-ziad" text="أنا زياد." align="right" width={180} delay={0.3} />}
      {lines >= 3 && (
        <motion.div className="absolute rounded-[16px] text-center" style={{ left: 840, top: 440, width: 220, padding: '8px 0', border: `3px dashed ${GOLD}`, background: '#FFFDF8' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <ArText size={40}>اسمي ...</ArText>
          <div className="font-sans font-bold" style={{ fontSize: 16, color: GOLD }}>your name!</div>
        </motion.div>
      )}
    </>
  );
}

/** Adam turns from Ziad to Mariam; the ending card flips with him. */
export function Ek1AkIkGraphic({ lines }: GraphicProps) {
  const girl = lines >= 2;
  return (
    <>
      <Person x={880} y={GROUND} scale={0.88} color={GOLD} dim={girl} />
      <Person x={1420} y={GROUND} scale={0.86} color={CRIMSON} hijab dim={!girl && lines >= 1} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: girl ? 60 : -60 }} transition={{ duration: 0.8, ease }}>
        <Person x={1150} y={GROUND} scale={0.95} color={TEAL} flip={!girl} />
      </motion.div>
      {lines === 1 && <SayBubble key="b" x={1090} y={560} id="ismak-eh" text={<>اسمَ<span style={{ color: TEAL }}>ك</span> إيه؟</>} width={210} />}
      {lines >= 2 && <SayBubble key="g" x={1210} y={560} id="ismik-eh" text={<>اسمِ<span style={{ color: CRIMSON }}>ك</span> إيه؟</>} align="right" width={210} />}
      {lines >= 1 && <Ending x={1020} y={200} girl={girl} />}
    </>
  );
}

export function Ek1ByeGraphic({ lines }: GraphicProps) {
  return (
    <>
      <TetaDoor open />
      <Person x={880} y={GROUND} scale={0.85} color={GOLD} />
      <Person x={1000} y={GROUND} scale={0.82} color={CRIMSON} hijab delay={0.1} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: lines >= 3 ? 120 : 0 }} transition={{ duration: 1.4, ease }}>
        <Person x={1340} y={GROUND} scale={0.9} color={TEAL} />
      </motion.div>
      {lines >= 1 && <SayBubble x={880} y={590} id="maa-salama" text="مع السلامة!" width={220} />}
      {lines >= 2 && <SayBubble x={1000} y={460} id="bye" text="باي!" width={130} delay={0.3} accent />}
    </>
  );
}

export function Ek1TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={GROUND} scale={0.88} color={GOLD} />
      <Person x={1080} y={GROUND} scale={0.86} color={CRIMSON} hijab delay={0.1} />
      <Person x={1380} y={GROUND} scale={0.95} color={TEAL} delay={0.2} />
      <Chip x={1380} y={540} color={TEAL}>you</Chip>
      {lines >= 1 && <SayBubble x={900} y={590} id="d-ziad" text="السلام عليكم! أنا زياد. إنت اسمَك إيه؟" width={420} delay={0.3} />}
      {lines >= 2 && <Ending x={1240} y={220} girl={false} />}
    </>
  );
}

export function Ek1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={GROUND} scale={0.9} color={TEAL} />
      <Person x={1300} y={GROUND} scale={1.15} color={CLAY} hijab delay={0.1} />
      {lines >= 1 && (
        <>
          <SayBubble x={960} y={560} id="ahlan" text="أهلاً!" width={140} />
          <SayBubble x={1300} y={510} id="ahlan-bik" text="أهلاً بيك!" align="right" width={200} delay={1} accent />
        </>
      )}
      {lines >= 2 && <Chip x={1130} y={260} color={GOLD} delay={0.3}>then: اسمَك إيه؟</Chip>}
    </>
  );
}

export function Ek1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={GROUND} scale={0.9} color={TEAL} />
      <Person x={1300} y={GROUND} scale={0.86} color={CRIMSON} hijab delay={0.1} />
      {lines >= 2 && <SayBubble x={1300} y={570} id="inta-minen" text="إنت منين؟" align="right" width={210} accent />}
      {lines >= 3 && <Badge x={1130} y={300} name="globe" size={110} color={TEAL} delay={0.3} />}
    </>
  );
}

/* ================= Teens ================= */

export function Et1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={1000} y={GROUND} scale={1.05} color={TEAL} />
      <Person x={1250} y={GROUND} scale={1.05} color={GOLD} delay={0.2} />
      <Ball x={1120} y={775} from={300} delay={0.4} />
      <SayBubble x={1250} y={540} id="ezzayak" text="إزيَّك؟" align="right" width={170} delay={1.2} accent />
    </>
  );
}

export function Et1ClubGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={920} y={GROUND} scale={1.05} color={TEAL} />
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 240, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.2, ease }}>
          <Person x={1230} y={GROUND} scale={1.05} color={GOLD} />
          <Ball x={1170} y={775} />
        </motion.div>
      )}
      {lines >= 2 && <SayBubble x={1230} y={540} id="ezzayak" text="إزيَّك؟" align="right" width={170} delay={1.3} />}
      {lines >= 3 && <SayBubble x={920} y={540} text="؟ ؟" thought width={110} delay={0.2} />}
    </>
  );
}

export function Et1ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Pitch />
      <Person x={900} y={GROUND} scale={1.05} color={TEAL} />
      <Person x={1150} y={GROUND} scale={1.05} color={GOLD} delay={0.1} />
      {k >= 2 && <Person x={1380} y={GROUND} scale={1} color={CRIMSON} hijab />}
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={1150} y={540} id="d-karim" text="إزيَّك؟ عامل إيه؟" align="right" width={270} />
          <SayBubble x={900} y={420} id="d-omar" text="الحمد لله، تمام. وإنت؟" width={300} delay={1.3} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1150} y={540} id="d-karim2" text="كويس، الحمد لله. أنا كريم." width={330} />
          <SayBubble x={1380} y={420} id="d-nour" text="هاي! أنا نور." align="right" width={220} delay={1.3} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1150} y={540} id="d-karim3" text={<>إزيِّك يا نور؟ <span style={{ color: CRIMSON }}>عاملة</span> إيه؟</>} align="right" width={330} />
          <Chip x={1150} y={250} color={CRIMSON} delay={0.8}>عامل → عاملة</Chip>
        </React.Fragment>
      )}
    </>
  );
}

/** A question card, then the three answers as tiles that stack, then the boomerang وإنت؟ */
export function Et1HowGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <WordTile x={1330} y={250} size={50} id="ezzayak" hot>إزيَّك؟</WordTile>
          <WordTile x={1030} y={250} size={50} id="amil-eh" hot delay={0.2}>عامل إيه؟</WordTile>
        </>
      )}
      {lines >= 2 && [['الحمد لله', 'hamdulillah'], ['تمام', 'tamam'], ['كويس', 'kwayyis']].map(([t, id], i) => (
        <WordTile key={id} x={1330 - i * 230} y={430} size={44} id={id} from={{ x: 0, y: -120 }} delay={0.2 + i * 0.2}>{t}</WordTile>
      ))}
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 900 520 Q 1150 700 1400 520" color={GOLD} width={4} dash="4 10" dur={1} /></Svg>
          <WordTile x={1150} y={650} size={50} id="w-inta" color={CRIMSON} delay={0.8}>وإنت؟</WordTile>
          <Chip x={1150} y={740} color={GOLD} delay={1.1}>throw it back</Chip>
        </>
      )}
    </>
  );
}

/** Omar faces Karim, then Nour; the ending flips with him. */
export function Et1EndingGraphic({ lines }: GraphicProps) {
  const girl = lines >= 2;
  return (
    <>
      <Person x={880} y={GROUND} scale={1} color={GOLD} dim={girl} />
      <Person x={1420} y={GROUND} scale={0.98} color={CRIMSON} hijab dim={!girl && lines >= 1} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: girl ? 60 : -60 }} transition={{ duration: 0.8, ease }}>
        <Person x={1150} y={GROUND} scale={1.02} color={TEAL} />
      </motion.div>
      {lines === 1 && <SayBubble key="g" x={1090} y={540} id="amil-eh" text={<><span style={{ color: TEAL }}>عامل</span> إيه؟</>} width={200} />}
      {lines >= 2 && <SayBubble key="f" x={1210} y={540} id="amla-eh" text={<><span style={{ color: CRIMSON }}>عاملة</span> إيه؟</>} align="right" width={210} />}
      {lines >= 1 && <Ending x={1020} y={200} girl={girl} />}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex gap-6" style={{ left: 880, top: 360 }}>
          <Hear id="ezzayak"><span className="rounded-full px-4 py-2 font-sans font-bold" style={{ fontSize: 20, background: '#FFFDF8', boxShadow: `0 0 0 2px ${TEAL}`, pointerEvents: 'auto' }}>izzayyak</span></Hear>
          <Hear id="izzayyik"><span className="rounded-full px-4 py-2 font-sans font-bold" style={{ fontSize: 20, background: '#FFFDF8', boxShadow: `0 0 0 2px ${CRIMSON}`, pointerEvents: 'auto' }}>izzayyik</span></Hear>
        </div>
      )}
    </>
  );
}

/** A dial from casual to formal: هاي → أهلاً → السلام عليكم; then the exit. */
export function Et1HiGraphic({ lines }: GraphicProps) {
  const pos = lines >= 2 ? 2 : lines >= 1 ? 0 : -1;
  const xs = [1380, 1150, 920];
  return (
    <>
      {lines >= 1 && (
        <>
          <Svg><Draw d="M 1400 360 L 900 360" color={INK_TEXT} width={4} opacity={0.25} /></Svg>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 1340, top: 390, fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>friends</span>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 860, top: 390, fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>anyone</span>
          {[['هاي!', 'hi'], ['أهلاً', 'ahlan'], ['السلام عليكم', 'salam']].map(([t, id], i) => <WordTile key={id} x={xs[i]} y={290} size={38} id={id === 'ahlan' ? undefined : id} delay={i * 0.15}>{t}</WordTile>)}
          <motion.span className="pointer-events-none absolute rounded-full" style={{ top: 348, width: 24, height: 24, background: CRIMSON, boxShadow: `0 0 20px 6px ${CRIMSON}66` }} initial={false} animate={{ left: xs[Math.max(pos, 0)] - 12 }} transition={{ duration: 0.8, ease }} />
        </>
      )}
      {lines >= 3 && (
        <>
          <WordTile x={1250} y={560} size={44} id="yalla-bye" delay={0.2}>يلا، باي!</WordTile>
          <WordTile x={1000} y={560} size={44} delay={0.4}>مع السلامة</WordTile>
          <Chip x={1125} y={640} color={GOLD} delay={0.6}>on the way out</Chip>
        </>
      )}
    </>
  );
}

export function Et1NamesGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1150} y={GROUND} scale={1.02} color={TEAL} />
      {lines >= 1 && <SayBubble x={1150} y={540} id="ana-omar" text="أنا عمر." width={170} />}
      {lines >= 2 && (
        <>
          <Person x={880} y={GROUND} scale={1} color={GOLD} delay={0.1} />
          <Person x={1420} y={GROUND} scale={0.98} color={CRIMSON} hijab delay={0.2} />
          <WordTile x={900} y={300} size={38} id="inta-ismak" color={TEAL} delay={0.4}>إنت اسمَك إيه؟</WordTile>
          <WordTile x={1360} y={300} size={38} id="inti-ismik" color={CRIMSON} delay={0.6}>إنتي اسمِك إيه؟</WordTile>
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={220} strong delay={0.3}>ak · ik · everywhere</Chip>}
    </>
  );
}

export function Et1TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={900} y={GROUND} scale={1.05} color={GOLD} />
      <Person x={1080} y={GROUND} scale={1} color={CRIMSON} hijab delay={0.1} />
      <Person x={1300} y={GROUND} scale={1.05} color={TEAL} delay={0.2} />
      <Chip x={1300} y={520} color={TEAL}>you</Chip>
      {lines >= 1 && <SayBubble x={900} y={540} id="d-karim" text="إزيَّك؟ عامل إيه؟" width={270} delay={0.3} />}
    </>
  );
}

export function Et1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute overflow-hidden rounded-[34px]" style={{ left: 1000, top: 180, width: 320, height: 560, background: '#101418', padding: 12 }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 0.9, ease }}>
          <div className="relative h-full w-full rounded-[24px]" style={{ background: '#ECE5DD' }}>
            <motion.div className="absolute rounded-[16px]" style={{ right: 14, top: 80, padding: '8px 14px', background: '#DCF8C6' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', bounce: 0.4 }}>
              <ArText size={28}>إزيَّك؟ عامل إيه؟</ArText>
            </motion.div>
            {lines >= 2 && (
              <motion.div className="absolute rounded-[16px]" style={{ left: 14, top: 170, padding: '8px 14px', background: '#FFFFFF' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring', bounce: 0.4 }}>
                <ArText size={28}>الحمد لله، تمام!</ArText>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}

export function Et1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={GROUND} scale={1.02} color={TEAL} />
      <Person x={1300} y={GROUND} scale={0.98} color={CRIMSON} hijab delay={0.1} />
      {lines >= 2 && <SayBubble x={1300} y={540} id="inta-minen" text="إنت منين؟" align="right" width={210} accent />}
      {lines >= 3 && <Chip x={1130} y={260} color={GOLD} delay={0.3}>Cairo says gamiil · the book says jamiil</Chip>}
    </>
  );
}
