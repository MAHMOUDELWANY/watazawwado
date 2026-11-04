import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person, CLAY } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';
import { StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Kids · Advanced · Lesson 3 · Ziad's Joke. Ziad (gold) tells a joke at Teta's door: Mariam (crimson),
 * Adam (teal), Teta (clay), Tante Soad (violet). New devices: the bed with a little runner going round it, the three joke
 * pieces that click together, and the two-picture card (catch the bus / catch sleep) that slides from one to the other.
 */

const ZIAD = GOLD;
const MARIAM = CRIMSON;
const ADAM = TEAL;
const TETA = CLAY;
const SOAD = '#7A5BA6';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

/** A bed seen from the side, with a little runner going round it (the joke, drawn). */
function Bed({ x, y, run = true, scale = 1 }: { x: number; y: number; run?: boolean; scale?: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x - 150 * scale, top: y - 120 * scale, width: 300 * scale, height: 160 * scale }}>
      <svg viewBox="0 0 300 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <rect x={20} y={70} width={260} height={50} rx={10} fill="#B9785A" />
        <rect x={30} y={52} width={240} height={26} rx={10} fill="#FFFDF8" />
        <rect x={36} y={40} width={70} height={26} rx={12} fill="#E9E1D4" />
        <rect x={14} y={30} width={16} height={110} rx={6} fill="#8E5A40" /><rect x={270} y={50} width={16} height={90} rx={6} fill="#8E5A40" />
        {run && (
          <motion.circle r={12} fill={ZIAD} animate={{ cx: [150, 290, 150, 10, 150], cy: [150, 100, 20, 100, 150] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
        )}
      </svg>
    </div>
  );
}

/** A joke piece: a rounded tab that slides in from the side. */
function Piece({ x, y, text, color, from, delay = 0, id }: { x: number; y: number; text: string; color: string; from: number; delay?: number; id?: string }) {
  const body = <span className="inline-flex rounded-[14px]" style={{ padding: '2px 20px 4px', background: color, boxShadow: SHADOW }}><ArText size={30} color="#fff">{text}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div initial={{ x: from, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.9, delay }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.div>
    </div>
  );
}

function Bus({ x, y }: { x: number; y: number }) {
  return (
    <svg className="pointer-events-none absolute" style={{ left: x - 110, top: y - 60 }} width={220} height={120}>
      <rect x={10} y={10} width={200} height={80} rx={14} fill={TEAL} />
      {[30, 75, 120, 165].map((wx) => <rect key={wx} x={wx} y={24} width={32} height={26} rx={4} fill="#E7F1EF" />)}
      <circle cx={55} cy={96} r={16} fill="#3A2A20" /><circle cx={165} cy={96} r={16} fill="#3A2A20" />
    </svg>
  );
}

/* ---------- spark ---------- */

export function Eka3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Bed x={1170} y={500} />
      <Person x={1420} y={800} scale={0.8} color={ZIAD} delay={0.2} />
      <Say x={1420} y={620} text="هههه!" align="right" width={130} size={30} accent delay={0.8} />
    </>
  );
}

export function Eka3AskGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-t-[60px]" style={{ left: 1350, top: 470, width: 140, height: 330, background: SOAD, boxShadow: SHADOW }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <Person x={1250} y={800} scale={1} color={SOAD} hijab />
      {lines >= 2 && <Say x={1250} y={570} id="nokta" text="قول لي نكتة يا زياد!" align="right" width={260} size={25} delay={0.2} />}
      {lines >= 2 && <Chip x={1000} y={330} color={GOLD} delay={0.8}>نكتة = a joke</Chip>}
      {lines >= 3 && <Person x={950} y={800} scale={0.8} color={ZIAD} delay={0.1} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Eka3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={0.8} color={ZIAD} />
      <Person x={1030} y={800} scale={0.75} color={MARIAM} hijab />
      <Person x={1170} y={800} scale={0.75} color={ADAM} />
      <Person x={1420} y={800} scale={1} color={TETA} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={880} y={620} id="story-1" text="عارفين ليه واحد بيجري حوالين السرير؟" width={430} size={21} delay={0.2} />
          <Say x={1030} y={450} id="story-2" text="ليه؟" width={90} size={28} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={880} y={620} id="story-3" text="عشان يلحق النوم!" width={240} size={26} accent delay={0.2} />
          <Bed x={1150} y={330} scale={0.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1170} y={630} id="story-4" text="هههه! حلوة أوي!" width={210} size={24} delay={0.2} />
          <Say x={1420} y={440} id="story-5" text="بايخة… بس ضحكتني!" align="right" width={250} size={24} accent delay={1.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eka3WhyGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="عارفين ليه…؟" id="arfeen-leh" size={40} />
      <Person x={900} y={800} scale={0.8} color={ZIAD} />
      {lines >= 2 && (
        <>
          <Chip x={1060} y={330} color={ZIAD} delay={0.2}>عارف ليه؟ (a boy)</Chip>
          <Chip x={1260} y={330} color={MARIAM} delay={0.4}>عارفة ليه؟ (a girl)</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={1200} y={800} scale={0.75} color={MARIAM} hijab delay={0.1} />
          <Person x={1380} y={800} scale={0.75} color={ADAM} delay={0.2} />
          <Say x={1200} y={630} id="leh" text="ليه؟" width={90} size={30} accent delay={0.4} />
          <Say x={1380} y={480} text="ليه؟" align="right" width={90} size={30} accent delay={0.7} />
        </>
      )}
    </>
  );
}

export function Eka3BecauseGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Piece x={1150} y={250} text="عشان…" color={TEAL} from={200} />
      {lines >= 2 && <Piece x={1150} y={360} text="عشان يلحق النوم!" color={ZIAD} from={-200} id="ashan" delay={0.2} />}
      {lines >= 3 && (
        <>
          <Piece x={1380} y={520} text="عارفين ليه…؟" color={CRIMSON} from={160} delay={0.1} />
          <Piece x={1160} y={520} text="ليه؟" color={TEAL} from={0} delay={0.5} />
          <Piece x={960} y={520} text="عشان…" color={ZIAD} from={-160} delay={0.9} />
          <Chip x={1160} y={600} color={GOLD} delay={1.4}>three pieces, one joke</Chip>
        </>
      )}
    </>
  );
}

export function Eka3ReactGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={0.8} color={ADAM} />
      <Person x={1350} y={800} scale={1} color={TETA} hijab />
      {lines >= 2 && <Say x={1000} y={620} id="helwa" text="حلوة أوي!" width={160} size={28} delay={0.2} />}
      {lines >= 2 && <Say x={1350} y={570} id="bayekha" text="بايخة!" align="right" width={130} size={30} accent delay={0.8} />}
      {lines >= 2 && <Chip x={1000} y={420} color={TEAL} delay={1.2}>good one!</Chip>}
      {lines >= 2 && <Chip x={1330} y={380} color={CRIMSON} delay={1.4}>so silly!</Chip>}
      {lines >= 3 && <Chip x={1170} y={260} color={GOLD} delay={0.2}>…said with a laugh</Chip>}
    </>
  );
}

/** The wow: one word, two pictures; the bus card slides away and the bed card slides in. */
export function Eka3TwoGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const sleep = lines >= 2;
  return (
    <>
      <div className="absolute" style={{ left: 1150, top: 200, transform: 'translate(-50%, -50%)' }}>
        <span className="inline-flex rounded-[14px]" style={{ padding: '2px 22px 4px', background: GOLD, boxShadow: SHADOW }}><ArText size={42} color="#fff">يلحق</ArText></span>
      </div>
      <motion.div className="pointer-events-none absolute overflow-hidden rounded-[24px]" style={{ left: 870, top: 270, width: 560, height: 330, background: '#FFFDF8', boxShadow: SHADOW }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <motion.div className="absolute inset-0" animate={{ x: sleep ? -560 : 0 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
          <Bus x={300} y={150} />
          <motion.div className="absolute" style={{ left: 80, top: 130 }} animate={{ x: [0, 40, 0] }} transition={{ duration: 0.8, repeat: Infinity }}><Person x={0} y={150} scale={0.6} color={ADAM} /></motion.div>
        </motion.div>
        <motion.div className="absolute inset-0" initial={{ x: 560 }} animate={{ x: sleep ? 0 : 560 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
          <Bed x={280} y={210} run={lines >= 3} />
          <span className="absolute font-sans font-black" style={{ left: 380, top: 40, fontSize: 40, color: '#9FB8B3' }}>z z z</span>
        </motion.div>
      </motion.div>
      <div className="absolute" style={{ left: 1150, top: 650, transform: 'translate(-50%, -50%)' }}>
        <Hear id={sleep ? 'yel7a2-nom' : 'yel7a2-bus'}><span className="inline-flex rounded-full" style={{ padding: '0 18px 2px', background: sleep ? ZIAD : TEAL, boxShadow: SHADOW }}><ArText size={28} color="#fff">{sleep ? 'يلحق النوم' : 'يلحق الأتوبيس'}</ArText></span></Hear>
      </div>
      {lines >= 3 && <Chip x={1150} y={730} color={CRIMSON} delay={0.6}>run to catch sleep = the joke!</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Eka3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={950} y={800} scale={0.8} color={ZIAD} />
      <Person x={1380} y={800} scale={1} color={TETA} hijab />
      <Say x={1380} y={570} id="leh-t" text="ليه؟" align="right" width={100} size={32} delay={0.4} />
      {lines >= 2 && <Piece x={1100} y={260} text="عارفين ليه…؟ · ليه؟ · عشان…" color={ZIAD} from={0} delay={0.2} />}
    </>
  );
}

export function Eka3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1150} y={800} scale={0.8} color={ZIAD} />
      <Say x={1150} y={620} text="عارفين ليه…؟" width={190} size={28} delay={0.2} />
      {lines >= 2 && (
        <>
          <Person x={900} y={800} scale={1} color="#5A4636" delay={0.1} />
          <Person x={1400} y={800} scale={1} color={MARIAM} hijab delay={0.2} />
          <Chip x={900} y={530} color={TEAL} delay={0.6}>حلوة!</Chip>
          <Chip x={1400} y={530} color={CRIMSON} delay={0.9}>بايخة!</Chip>
        </>
      )}
    </>
  );
}

export function Eka3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1} color={SOAD} hijab lean={-6} />
      <Person x={1080} y={800} scale={0.75} color={ZIAD} delay={0.1} />
      {lines >= 2 && (
        <>
          <Person x={1380} y={800} scale={1} color={TETA} hijab delay={0.1} />
          <Say x={1380} y={570} id="hafla" text="يلا نعمل حفلة!" align="right" width={220} size={28} accent delay={0.3} />
          {[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: 960 + i * 110, top: 200, width: 16, height: 16, background: [CRIMSON, GOLD, TEAL, SOAD, GOLD][i] }} initial={{ y: -60, opacity: 0 }} animate={{ y: [0, 120], opacity: [1, 0] }} transition={{ duration: 1.6, delay: 0.5 + i * 0.15, repeat: 1 }} />)}
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={300} color={CRIMSON} delay={0.2}>next: the party at Teta&apos;s</Chip>}
    </>
  );
}
