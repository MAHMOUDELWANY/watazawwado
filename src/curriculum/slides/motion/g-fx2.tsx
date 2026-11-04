import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Person, Svg, Draw } from './kit';
import { ArText, SayBubble } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · Level 3 · Lesson 2 (Kids: Who Broke the Vase?; 12+: The Headline). The passive. One device for both: a
 * sentence on a shelf of tiles, read right to left: [verb] [doer] [thing]. To make it passive the doer tile sinks into
 * a dotted silhouette ("who?"), the thing slides into the doer's seat and takes its ـُ, and the verb tile swaps whole
 * from a·a (teal) to u·i (crimson). Whole words only; vowels are named on badges, never coloured inside a word.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const KAREEM = '#6E8B5A';
const ACT = TEAL;
const PAS = CRIMSON;
const DOER = GOLD;

/** A whole Arabic word on a card. */
function Word({ x, y, children, color = INK_TEXT, id, size = 46, delay = 0, dim = false, ring = true }: { x: number; y: number; children: string; color?: string; id?: string; size?: number; delay?: number; dim?: boolean; ring?: boolean }) {
  const body = <span className="inline-block whitespace-nowrap rounded-[20px]" style={{ padding: '0 20px', background: CARD, boxShadow: ring ? `0 0 0 4px ${color}, ${SHADOW}` : SHADOW }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div key={children} initial={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }} animate={{ opacity: dim ? 0.3 : 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay }}>
        {id ? <Hear id={id}>{body}</Hear> : body}
      </motion.div>
    </div>
  );
}

/** A small badge naming the vowels of a verb: a·a or u·i. */
function Vowels({ x, y, v, color, delay = 0 }: { x: number; y: number; v: string; color: string; delay?: number }) {
  return <Chip x={x} y={y} color={color} delay={delay}>{v}</Chip>;
}

/** The doer's empty seat: a dotted silhouette with a question mark. */
function Who({ x, y, delay = 0, label = 'who?' }: { x: number; y: number; delay?: number; label?: string }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: x - 50, top: y - 70 }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.6, ease }}>
      <svg viewBox="0 0 100 120" width={100} height={120}>
        <circle cx={50} cy={32} r={20} fill="none" stroke={soft('light')} strokeWidth={3} strokeDasharray="5 6" />
        <path d="M 16 118 L 20 74 Q 50 58 80 74 L 84 118" fill="none" stroke={soft('light')} strokeWidth={3} strokeDasharray="5 6" />
        <text x={50} y={42} textAnchor="middle" fontSize={26} fontWeight={900} fill={soft('light')}>?</text>
      </svg>
      <span className="font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>{label}</span>
    </motion.div>
  );
}

/**
 * The shelf: an active sentence that turns passive at `passive`. Slots right to left: verb at x0, doer at x0 - gap, thing
 * at x0 - 2 * gap. In the passive the doer sinks away and the thing moves one slot right, into the doer's seat.
 */
function Shelf({ y, passive, verb, pverb, doer, thing, pthing, x0 = 1400, gap = 230, size = 40, ids }: {
  y: number; passive: boolean; verb: string; pverb: string; doer: string; thing: string; pthing: string; x0?: number; gap?: number; size?: number; ids?: { active?: string; passive?: string };
}) {
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: x0 - 2 * gap - 120, top: y + 40, width: 2 * gap + 240, height: 10, background: '#D9C7A8' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease }} />
      <Word x={x0} y={y} color={passive ? PAS : ACT} size={size} id={passive ? ids?.passive : ids?.active} delay={passive ? 0.9 : 0}>{passive ? pverb : verb}</Word>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ y: passive ? 160 : 0, opacity: passive ? 0 : 1 }} transition={{ duration: 0.8, ease }}>
        <Word x={x0 - gap} y={y} color={DOER} size={size} delay={0.2}>{doer}</Word>
      </motion.div>
      {passive && <Who x={x0 - gap} y={y + 190} delay={0.6} />}
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: passive ? gap : 0 }} transition={{ duration: 0.8, delay: passive ? 0.4 : 0, ease }}>
        <Word x={x0 - 2 * gap} y={y} color={INK_TEXT} size={size} delay={passive ? 1.1 : 0.4} ring={false}>{passive ? pthing : thing}</Word>
      </motion.div>
    </>
  );
}

/** Jiddo's blue vase, whole or in pieces. */
function Vase({ x, y, broken = false, delay = 0 }: { x: number; y: number; broken?: boolean; delay?: number }) {
  if (!broken) {
    return (
      <motion.svg className="pointer-events-none absolute" viewBox="0 0 80 120" width={80} height={120} style={{ left: x - 40, top: y - 120 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
        <path d="M 28 4 L 52 4 L 50 20 Q 76 44 66 90 Q 60 116 40 116 Q 20 116 14 90 Q 4 44 30 20 Z" fill="#3E7CB1" />
        <path d="M 20 60 Q 40 70 60 60" fill="none" stroke="#F2D27A" strokeWidth={4} />
      </motion.svg>
    );
  }
  const shards = [[-60, -6, 30], [-20, 4, -20], [20, -4, 50], [56, 6, -40], [0, 10, 10]];
  return (
    <>
      {shards.map(([dx, dy, r], i) => (
        <motion.svg key={i} className="pointer-events-none absolute" viewBox="0 0 40 30" width={44} height={32} style={{ left: x + dx - 22, top: y + dy - 30 }}
          initial={{ opacity: 0, y: -70, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: r }} transition={{ delay: delay + i * 0.05, type: 'spring', bounce: 0.3 }}>
          <path d={i % 2 ? 'M 2 28 L 14 2 L 38 18 Z' : 'M 4 4 L 36 8 L 24 28 L 2 22 Z'} fill="#3E7CB1" />
        </motion.svg>
      ))}
    </>
  );
}

/** A window frame, closed or open. */
function Window({ x, y, open = false, delay = 0 }: { x: number; y: number; open?: boolean; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - 90, top: y - 110, width: 180, height: 220, background: 'linear-gradient(180deg, #CFE6EF, #EAF4F7)', boxShadow: `0 0 0 10px #EFE3CC, ${SHADOW}`, borderRadius: 6 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <motion.div className="absolute" style={{ left: 0, top: 0, width: 90, height: 220, background: '#EFE3CC88', borderRight: '4px solid #EFE3CC', transformOrigin: 'left center' }} initial={false} animate={{ rotateY: open ? -70 : 0 }} transition={{ duration: 0.8, delay: delay + 0.3 }} />
      <motion.div className="absolute" style={{ right: 0, top: 0, width: 90, height: 220, background: '#EFE3CC88', borderLeft: '4px solid #EFE3CC', transformOrigin: 'right center' }} initial={false} animate={{ rotateY: open ? 70 : 0 }} transition={{ duration: 0.8, delay: delay + 0.3 }} />
    </motion.div>
  );
}

/** A fish skeleton on a plate (the fish that was eaten). */
function Bones({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" viewBox="0 0 140 60" width={140} height={60} style={{ left: x - 70, top: y - 30 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <ellipse cx={70} cy={40} rx={68} ry={16} fill="#F3E7D2" stroke="#D9C7A8" strokeWidth={3} />
      <path d="M 30 32 L 100 32 M 45 22 L 45 42 M 60 22 L 60 42 M 75 22 L 75 42 M 90 22 L 90 42" stroke={INK_TEXT} strokeWidth={3} />
      <circle cx={28} cy={32} r={8} fill="none" stroke={INK_TEXT} strokeWidth={3} />
      <path d="M 100 32 L 116 20 L 116 44 Z" fill="none" stroke={INK_TEXT} strokeWidth={3} />
    </motion.svg>
  );
}

/* =================== Kids =================== */

export function Fx2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Window x={1360} y={330} open />
      <Vase x={1120} y={780} broken delay={0.3} />
      <Cut src={`${CAST}/maryam-think`} x={900} y={830} h={260} delay={0.2} />
      <Cut src={`${CAST}/mishmish-sit`} x={1400} y={830} h={110} ratio={1.5} delay={0.5} />
      <Word x={1130} y={560} color={PAS} size={46} delay={1}>كُسِرَتْ</Word>
    </>
  );
}

export function Fx2RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1330} y={300} color="#5A4636" size={46} ring={false}>عَلِمَ</Word>
      <Svg><Draw d="M 1250 300 L 1150 300" color={TEAL} width={4} delay={0.3} dur={0.4} /></Svg>
      <Word x={1040} y={300} id="allama" color={TEAL} size={50} delay={0.6}>عَلَّمَ</Word>
      <Chip x={1040} y={360} color={TEAL} delay={0.9}>a new shape</Chip>
      {lines >= 2 && (
        <>
          <Word x={1330} y={520} color={ACT} size={46} delay={0.2}>كَسَرَ</Word>
          <Svg><Draw d="M 1250 520 L 1150 520" color={PAS} width={4} delay={0.5} dur={0.4} /></Svg>
          <Word x={1040} y={520} color={PAS} size={50} delay={0.8}>كُسِرَ</Word>
          <Chip x={1040} y={580} color={PAS} delay={1.1}>only the vowels</Chip>
        </>
      )}
    </>
  );
}

export function Fx2CrashGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Vase x={1150} y={780} broken />
      <Cut src={`${CAST}/jiddo-advice`} x={900} y={830} h={300} delay={0.2} />
      {lines >= 2 && (
        <>
          <Window x={1380} y={320} open delay={0.1} />
          <Bones x={1150} y={560} delay={0.4} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/maryam-point`} x={1400} y={830} h={250} delay={0.1} />
          <Who x={1150} y={330} delay={0.4} />
        </>
      )}
    </>
  );
}

export function Fx2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Window x={1380} y={300} open={k >= 1} />
      <Vase x={1130} y={790} broken />
      <Cut src={`${CAST}/jiddo-advice`} x={880} y={830} h={290} />
      {k >= 1 && <Cut src={`${CAST}/maryam-point`} x={1250} y={830} h={240} />}
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={880} y={470} id="story-1" text="كُسِرَتِ ٱلْمَزْهَرِيَّةُ!" width={250} size={26} accent delay={0.3} />
          <SayBubble x={1250} y={600} id="story-2" text="وَٱنْظُرْ يَا جِدِّي، فُتِحَ ٱلشُّبَّاكُ!" align="right" width={330} size={22} delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Cut src={`${CAST}/yusuf-surprised`} x={1440} y={830} h={230} delay={0.1} />
          <Bones x={1100} y={460} delay={0.2} />
          <SayBubble x={1440} y={600} id="story-3" text="وَأُكِلَ ٱلسَّمَكُ!" align="right" width={200} size={26} delay={0.5} />
          <SayBubble x={1250} y={330} id="story-4" text="مَنْ كَسَرَ ٱلْمَزْهَرِيَّةَ؟" align="right" width={280} size={24} accent delay={2} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Cut src={`${CAST}/yusuf-point`} x={1440} y={830} h={230} />
          <Cut src={`${CAST}/mishmish-sit`} x={1080} y={830} h={100} ratio={1.5} delay={0.2} />
          <SayBubble x={1440} y={600} id="story-5" text="مِشْمِشٌ كَسَرَهَا!" align="right" width={220} size={26} delay={0.4} />
          <SayBubble x={880} y={540} id="story-6" text="مِسْكِينٌ مِشْمِشٌ!" width={210} size={26} accent delay={2} />
        </React.Fragment>
      )}
    </>
  );
}

/** Mishmish breaks the vase (named), then the same scene with nobody: it was broken. */
export function Fx2WasGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Vase x={1150} y={790} broken />
      {lines < 2 && <Cut src={`${CAST}/mishmish-leap`} x={1350} y={830} h={110} ratio={1.5} />}
      {lines >= 2 && <Who x={1350} y={770} delay={0.2} />}
      <Word x={lines >= 2 ? 1330 : 1150} y={300} id={lines >= 2 ? undefined : 'kasara'} color={ACT} size={52} dim={lines >= 2}>كَسَرَ</Word>
      <Vowels x={lines >= 2 ? 1330 : 1150} y={360} v="ka · sa · ra" color={ACT} delay={0.3} />
      {lines < 2 && <Word x={1150} y={460} id="kasara-mishmish" color={INK_TEXT} size={34} delay={0.6} ring={false}>كَسَرَ مِشْمِشٌ ٱلْمَزْهَرِيَّةَ.</Word>}
      {lines >= 2 && <Word x={1000} y={300} id="kusira" color={PAS} size={56} delay={0.4}>كُسِرَ</Word>}
      {lines >= 3 && <Vowels x={1000} y={365} v="ku · si · ra" color={PAS} delay={0.2} />}
    </>
  );
}

/** Three verbs flip one after another: a·a above, u·i below. */
export function Fx2SwitchGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { a: 'فَتَحَ', p: 'فُتِحَ', aid: 'fataha', pid: 'futiha', step: 2, x: 1380 },
    { a: 'أَكَلَ', p: 'أُكِلَ', aid: 'akala', pid: 'ukila', step: 2, x: 1150 },
    { a: 'كَتَبَ', p: 'كُتِبَ', aid: 'kataba', pid: 'kutiba', step: 3, x: 920 },
  ];
  return (
    <>
      <Vowels x={1450} y={210} v="a · a" color={ACT} />
      <Vowels x={1450} y={510} v="u · i" color={PAS} delay={0.2} />
      {rows.map((r) => lines >= r.step && (
        <React.Fragment key={r.a}>
          <Word x={r.x - 60} y={300} id={r.aid} color={ACT} size={46} delay={0.1}>{r.a}</Word>
          <Svg><Draw d={`M ${r.x - 60} 345 L ${r.x - 60} 420`} color={PAS} width={4} delay={0.4} dur={0.4} /></Svg>
          <Word x={r.x - 60} y={470} id={r.pid} color={PAS} size={46} delay={0.7}>{r.p}</Word>
        </React.Fragment>
      ))}
      {lines >= 3 && <Chip x={1150} y={600} color={GOLD} delay={1}>same letters, new story</Chip>}
    </>
  );
}

/** A "she" thing takes the ت; the window and the fish do not. */
export function Fx2SheGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Vase x={1380} y={430} />
      <Word x={1380} y={500} color={INK_TEXT} size={36} ring={false} delay={0.3}>مَزْهَرِيَّةٌ</Word>
      <Chip x={1380} y={545} color={CRIMSON} delay={0.6}>ends in ة: a "she"</Chip>
      {lines >= 2 && (
        <>
          <Word x={1060} y={320} id="kusirat" color={PAS} size={44} delay={0.2}>كُسِرَتِ ٱلْمَزْهَرِيَّةُ</Word>
          <Chip x={1060} y={380} color={PAS} delay={0.6}>ت of "she"</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Window x={900} y={640} delay={0.1} />
          <Word x={1060} y={480} id="futiha-shubbak" color={PAS} size={36} delay={0.3}>فُتِحَ ٱلشُّبَّاكُ</Word>
          <Word x={1250} y={680} id="ukila-samak" color={PAS} size={36} delay={0.6}>أُكِلَ ٱلسَّمَكُ</Word>
        </>
      )}
    </>
  );
}

/** The wow: Mishmish leaves the sentence; the vase takes his seat and his vowel. */
export function Fx2GoneGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Shelf y={330} passive={lines >= 2} verb="كَسَرَ" pverb="كُسِرَتِ" doer="مِشْمِشٌ" thing="ٱلْمَزْهَرِيَّةَ" pthing="ٱلْمَزْهَرِيَّةُ" ids={{ active: 'kasara-mishmish', passive: 'kusirat' }} />
      {lines < 2 && <Cut src={`${CAST}/mishmish-leap`} x={1170} y={830} h={120} ratio={1.5} delay={0.2} />}
      {lines >= 3 && (
        <>
          <Chip x={960} y={420} color={INK_TEXT} delay={0.2}>it took the doer's vowel: u</Chip>
          <Svg><Draw d="M 1000 395 C 1080 370, 1100 380, 1150 380" color={GOLD} width={3} dash="3 7" delay={0.4} dur={0.6} /></Svg>
        </>
      )}
    </>
  );
}

export function Fx2WhyGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Who x={1380} y={330} />
      <Chip x={1380} y={410} color={soft('light')}>we do not know</Chip>
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-t-[60px]" style={{ left: 1060, top: 220, width: 130, height: 230, background: '#8B5A36' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
          <Word x={1125} y={490} id="futiha-bab" color={PAS} size={30} delay={0.4}>فُتِحَ ٱلْبَابُ لِلضُّيُوفِ</Word>
          <Chip x={1125} y={540} color={soft('light')} delay={0.7}>it does not matter who</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/jiddo-explain`} x={900} y={830} h={280} delay={0.1} />
          <Cut src={`${CAST}/mishmish-sit`} x={1100} y={830} h={100} ratio={1.5} delay={0.3} />
          <Chip x={900} y={480} color={GOLD} delay={0.6}>being kind: no blame</Chip>
        </>
      )}
    </>
  );
}

export function Fx2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={950} y={830} h={260} />
      <Who x={1350} y={380} />
      {lines >= 2 && (
        <>
          <Word x={1250} y={560} color={PAS} size={34} delay={0.2}>فُتِحَ ٱلْكِتَابُ!</Word>
          <SayBubble x={950} y={570} id="man-faala" text="مَنْ فَعَلَ ذَلِكَ؟" width={220} size={26} accent delay={0.8} />
        </>
      )}
    </>
  );
}

export function Fx2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-think`} x={950} y={830} h={260} />
      <Window x={1350} y={330} open delay={0.2} />
      {lines >= 2 && (
        <>
          <Word x={1300} y={540} color={PAS} size={34} delay={0.2}>فُتِحَ ٱلشُّبَّاكُ</Word>
          <Word x={1300} y={640} color={PAS} size={34} delay={0.5}>غُسِلَتِ ٱلصُّحُونُ</Word>
        </>
      )}
    </>
  );
}

export function Fx2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/mishmish-sit`} x={1150} y={830} h={130} ratio={1.5} />
      <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={250} delay={0.1} />
      <SayBubble x={900} y={570} id="inna-mishmishan" text="إِنَّ مِشْمِشًا بَرِيءٌ!" width={240} size={26} delay={0.4} />
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/yusuf-point`} x={1420} y={830} h={250} delay={0.1} />
          <SayBubble x={1420} y={540} id="lakinna" text="لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ!" align="right" width={280} size={24} accent delay={0.5} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={240} color={CRIMSON} delay={0.3}>إِنَّ · لَكِنَّ</Chip>}
    </>
  );
}

/* =================== 12+ =================== */

/** A news card. */
function Headline({ x, y, text, id, w = 520, delay = 0, dim = false }: { x: number; y: number; text: string; id?: string; w?: number; delay?: number; dim?: boolean }) {
  const t = <span dir="rtl" className="block text-right"><ArText size={30} color={INK_TEXT}>{text}</ArText></span>;
  return (
    <motion.div className="absolute rounded-[16px]" style={{ left: x - w / 2, top: y - 45, width: w, padding: '10px 18px', background: CARD, boxShadow: `inset 6px 0 0 ${CRIMSON}, ${SHADOW}` }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: dim ? 0.4 : 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span className="block font-sans font-black uppercase" style={{ fontSize: 12, letterSpacing: 2, color: CRIMSON }}>city news</span>
      {id ? <Hear id={id}>{t}</Hear> : t}
    </motion.div>
  );
}

export function Fy2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Headline x={1180} y={260} text="فُتِحَ طَرِيقٌ جَدِيدٌ" w={460} />
      <Who x={1180} y={500} delay={0.6} />
      <Person x={900} y={800} scale={1} color={GOLD} hijab delay={0.2} />
      <Person x={1420} y={800} scale={1} color={TEAL} delay={0.3} />
    </>
  );
}

export function Fy2NewsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={890} y={800} scale={1} color={GOLD} hijab />
      <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.1} />
      {lines >= 2 && (
        <>
          <Headline x={1180} y={220} text="فُتِحَ طَرِيقٌ جَدِيدٌ" w={430} delay={0.1} />
          <Headline x={1180} y={340} text="تُبْنَى مَدْرَسَةٌ جَدِيدَةٌ" w={430} delay={0.3} />
          <Headline x={1180} y={460} text="فُتِحَتْ مَكْتَبَةٌ لِلْأَطْفَالِ" w={430} delay={0.5} />
        </>
      )}
      {lines >= 3 && <Person x={1150} y={800} scale={1} color={TEAL} delay={0.1} />}
      {lines >= 3 && <SayBubble x={1150} y={570} text="مَنْ؟" width={100} size={30} accent delay={0.4} />}
    </>
  );
}

export function Fy2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={1} color={GOLD} hijab />
      <Person x={1150} y={800} scale={1} color={TEAL} delay={0.1} />
      <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.2} />
      {k === 1 && (
        <React.Fragment key="a">
          <Headline x={1170} y={230} text="فُتِحَ طَرِيقٌ جَدِيدٌ فِي ٱلْمَدِينَةِ" id="story-1" w={520} delay={0.2} />
          <SayBubble x={1150} y={560} id="story-2" text="مَنْ فَتَحَهُ؟" width={170} size={26} delay={1.2} />
          <SayBubble x={1420} y={460} id="story-3" text="لَا يُذْكَرُ ٱلْفَاعِلُ. ٱلْمُهِمُّ ٱلطَّرِيقُ." align="right" width={330} size={22} accent delay={2.2} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Headline x={1170} y={230} text="وَتُبْنَى مَدْرَسَةٌ جَدِيدَةٌ بِجَانِبِهِ" id="story-4" w={520} delay={0.2} />
          <SayBubble x={1150} y={560} id="story-5" text="وَمَتَى يُفْتَحُ ٱلْمَطَارُ؟" width={260} size={24} delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Headline x={1170} y={230} text="وَتُبْنَى مَدْرَسَةٌ جَدِيدَةٌ بِجَانِبِهِ" w={520} dim />
          <SayBubble x={1420} y={560} id="story-6" text="هَذَا سُؤَالٌ صَعْبٌ!" align="right" width={230} size={26} accent delay={0.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Fy2PastGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1350} y={260} color={ACT} size={46}>فَعَلَ</Word>
      <Vowels x={1350} y={315} v="a · a" color={ACT} delay={0.2} />
      <Svg><Draw d="M 1260 260 L 1160 260" color={PAS} width={4} delay={0.4} dur={0.4} /></Svg>
      <Word x={1060} y={260} color={PAS} size={46} delay={0.6}>فُعِلَ</Word>
      <Vowels x={1060} y={315} v="u · i" color={PAS} delay={0.8} />
      {lines >= 2 && [['فَتَحَ', 'فُتِحَ', 'fataha', 'futiha'], ['ذَكَرَ', 'ذُكِرَ', 'dhakara', 'dhukira']].map(([a, p, aid, pid], i) => (
        <React.Fragment key={a}>
          <Word x={1350} y={420 + i * 100} id={aid} color={ACT} size={40} delay={0.1 + i * 0.2}>{a}</Word>
          <Word x={1060} y={420 + i * 100} id={pid} color={PAS} size={40} delay={0.3 + i * 0.2}>{p}</Word>
        </React.Fragment>
      ))}
      {lines >= 3 && <Word x={1200} y={660} id="futihat-maktaba" color={PAS} size={38} delay={0.2}>فُتِحَتِ ٱلْمَكْتَبَةُ</Word>}
      {lines >= 3 && <Chip x={1200} y={715} color={soft('light')} delay={0.5}>Level 2 endings stay</Chip>}
    </>
  );
}

export function Fy2PresentGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1350} y={260} color={ACT} size={46}>يَفْعَلُ</Word>
      <Vowels x={1350} y={315} v="ya · … · a/u/i" color={ACT} delay={0.2} />
      <Svg><Draw d="M 1260 260 L 1160 260" color={PAS} width={4} delay={0.4} dur={0.4} /></Svg>
      <Word x={1060} y={260} color={PAS} size={46} delay={0.6}>يُفْعَلُ</Word>
      <Vowels x={1060} y={315} v="yu · … · a" color={PAS} delay={0.8} />
      {lines >= 2 && (
        <>
          <Word x={1350} y={430} id="yaftahu" color={ACT} size={40} delay={0.1}>يَفْتَحُ</Word>
          <Word x={1060} y={430} id="yuftahu" color={PAS} size={40} delay={0.3}>يُفْتَحُ</Word>
          <Word x={1060} y={530} id="yudhkaru" color={PAS} size={40} delay={0.5}>يُذْكَرُ</Word>
        </>
      )}
      {lines >= 3 && <Headline x={1200} y={660} text="تُبْنَى مَدْرَسَةٌ" id="tubna" w={360} delay={0.2} />}
    </>
  );
}

/** The council leaves the sentence; the road takes its seat and its ـُ. */
export function Fy2StandGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Shelf y={330} passive={lines >= 2} verb="فَتَحَتِ" pverb="فُتِحَ" doer="ٱلْبَلَدِيَّةُ" thing="ٱلطَّرِيقَ" pthing="ٱلطَّرِيقُ" ids={{ active: 'fatahat-baladiyya', passive: 'futiha-tariq' }} />
      {lines >= 3 && <Chip x={1170} y={430} color={GOLD} delay={0.3}>نَائِبُ ٱلْفَاعِلِ · the stand-in</Chip>}
    </>
  );
}

export function Fy2FormsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [['عَلَّمَ', 'عُلِّمَ', undefined, 'ullima'], ['أَرْسَلَ', 'أُرْسِلَ', undefined, 'ursila'], ['يُرْسِلُ', 'يُرْسَلُ', 'yursilu', 'yursalu']] as const;
  return (
    <>
      <Vowels x={1340} y={190} v="active" color={ACT} />
      <Vowels x={1040} y={190} v="passive" color={PAS} delay={0.2} />
      {rows.map(([a, p, aid, pid], i) => (lines >= 2 || i === 0) && (lines >= 3 || i < 2) && (
        <React.Fragment key={a}>
          <Word x={1340} y={290 + i * 130} id={aid} color={ACT} size={42} delay={0.1}>{a}</Word>
          <Svg><Draw d={`M 1250 ${290 + i * 130} L 1140 ${290 + i * 130}`} color={PAS} width={3} delay={0.3} dur={0.4} /></Svg>
          <Word x={1040} y={290 + i * 130} id={pid} color={PAS} size={42} delay={0.5}>{p}</Word>
        </React.Fragment>
      ))}
    </>
  );
}

export function Fy2MissingGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1180} y={240} id="kutiba-kitab" color={PAS} size={32} delay={0.1}>كُتِبَ ٱلْكِتَابُ فِي ٱلْقَرْنِ ٱلْعَاشِرِ</Word>
      <Chip x={1180} y={290} color={soft('light')} delay={0.4}>unknown · obvious · not important</Chip>
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[14px] font-sans font-bold" style={{ left: 880, top: 380, width: 280, padding: '16px 18px', fontSize: 24, background: CARD, color: INK_TEXT, boxShadow: `inset 6px 0 0 ${PAS}, ${SHADOW}` }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>"Mistakes were made."</motion.div>
          <motion.div className="pointer-events-none absolute rounded-[14px] font-sans font-bold" style={{ left: 1200, top: 380, width: 280, padding: '16px 18px', fontSize: 24, background: CARD, color: INK_TEXT, boxShadow: `inset 6px 0 0 ${ACT}, ${SHADOW}` }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>"I made mistakes."</motion.div>
          <Who x={1020} y={600} delay={0.8} label="who made them?" />
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={1350} y={800} scale={1} color={TEAL} delay={0.1} />
          <SayBubble x={1350} y={570} id="man-faala" text="مَنْ فَعَلَ ذَلِكَ؟" align="right" width={230} size={26} accent delay={0.4} />
        </>
      )}
    </>
  );
}

export function Fy2ReadGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const hs = [['فُتِحَتْ مَكْتَبَةٌ جَدِيدَةٌ لِلْأَطْفَالِ', 'h-1'], ['يُغْلَقُ ٱلشَّارِعُ يَوْمَ ٱلْجُمُعَةِ', 'h-2'], ['عُلِّمَ أَلْفُ طِفْلٍ ٱلسِّبَاحَةَ هَذَا ٱلصَّيْفَ', 'h-3']];
  return (
    <>
      {hs.slice(0, lines).map(([t, id], i) => (
        <React.Fragment key={id}>
          <Headline x={1170} y={240 + i * 170} text={t} id={id} w={600} delay={0.2} />
          <Who x={1440} y={300 + i * 170 + 10} delay={0.7} label="" />
        </React.Fragment>
      ))}
    </>
  );
}

export function Fy2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Headline x={1170} y={240} text="فُتِحَ طَرِيقٌ جَدِيدٌ" id="futiha-tariq-2" w={420} />
      <Person x={900} y={800} scale={1} color={TEAL} />
      <Svg><Draw d="M 1170 300 L 1170 380" color={ACT} width={4} delay={0.4} dur={0.4} /></Svg>
      <Word x={1170} y={430} color={ACT} size={34} delay={0.7}>فَتَحَ … ٱلطَّرِيقَ</Word>
      {lines >= 2 && <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.1} />}
    </>
  );
}

export function Fy2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Headline x={1180} y={240} text="… فُتِحَ" w={420} />
      <Headline x={1180} y={360} text="… تُبْنَى" w={420} delay={0.2} />
      <Headline x={1180} y={480} text="… يُغْلَقُ" w={420} delay={0.4} />
      {lines >= 2 && <Who x={1180} y={680} delay={0.3} label="who did it?" />}
    </>
  );
}

export function Fy2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[12px] font-sans font-black" style={{ left: 980, top: 190, width: 400, padding: '14px 20px', fontSize: 22, background: INK_TEXT, color: CARD, textAlign: 'center' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>"Phones should be banned at school"</motion.div>
      {lines >= 2 && (
        <>
          <Person x={900} y={800} scale={1} color={GOLD} hijab />
          <Person x={1420} y={800} scale={1} color={TEAL} delay={0.1} />
          <SayBubble x={900} y={570} id="inna-hatif" text="إِنَّ ٱلْهَاتِفَ مُفِيدٌ." width={230} size={26} delay={0.3} />
          <SayBubble x={1420} y={460} text="لَكِنَّ ٱلطُّلَّابَ لَا يَدْرُسُونَ!" align="right" width={300} size={24} accent delay={1.6} />
        </>
      )}
      {lines >= 3 && <Chip x={1180} y={300} color={CRIMSON} delay={0.3}>إِنَّ and her sisters</Chip>}
    </>
  );
}
