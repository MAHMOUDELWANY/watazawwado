import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Person, Icon, Svg, Draw } from './kit';
import { ArText, SayBubble } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · Level 3 · Lesson 1 (Kids: One Root, Many Verbs; 12+: The Root Workshop). One device for both: the forge.
 * Three root letters (separate tiles, so no word is cut apart) drop into a pattern mould; the mould stamps out the
 * whole verb below it. Each pattern has its colour and its mark: Form I ink, Form II teal (shadda), Form III gold (long ā),
 * Form IV crimson (hamza in front). The motion is the grammar: same letters, different mould, different meaning.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const KAREEM = '#6E8B5A';
const F1 = '#5A4636';
const F2 = TEAL;
const F3 = GOLD;
const F4 = CRIMSON;

/** A whole Arabic word on a card. */
function Word({ x, y, children, color = INK_TEXT, id, size = 50, delay = 0, dim = false, ring = true }: { x: number; y: number; children: string; color?: string; id?: string; size?: number; delay?: number; dim?: boolean; ring?: boolean }) {
  const body = <span className="inline-block whitespace-nowrap rounded-[22px]" style={{ padding: '0 22px', background: CARD, boxShadow: ring ? `0 0 0 4px ${color}, ${SHADOW}` : SHADOW }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div key={children} initial={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }} animate={{ opacity: dim ? 0.3 : 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay }}>
        {id ? <Hear id={id}>{body}</Hear> : body}
      </motion.div>
    </div>
  );
}

/** Three root letters as separate tiles, right to left, centred at (x, y). `drop` sends them down into a mould. */
function Root({ x, y, letters, color = F1, drop = 0, delay = 0, size = 64 }: { x: number; y: number; letters: [string, string, string]; color?: string; drop?: number; delay?: number; size?: number }) {
  return (
    <>
      {letters.map((l, i) => (
        <motion.span key={l + i} className="pointer-events-none absolute flex items-center justify-center rounded-[16px]" style={{ left: x + (1 - i) * (size + 14) - size / 2, top: y - size / 2, width: size, height: size, background: color, boxShadow: SHADOW }}
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: drop ? [1, 1, 0] : 1, y: drop ? [0, drop, drop] : 0, scale: drop ? [1, 0.7, 0.5] : 1 }} transition={{ duration: drop ? 1 : 0.5, delay: delay + i * 0.12, ease }}>
          <ArText size={size * 0.62} color="#fff">{l}</ArText>
        </motion.span>
      ))}
    </>
  );
}

/** A pattern mould: the model word inside a cutter outline, with its mark as a badge. */
function Mould({ x, y, pattern, mark, color, delay = 0, w = 250, id }: { x: number; y: number; pattern: string; mark?: string; color: string; delay?: number; w?: number; id?: string }) {
  const inner = <ArText size={46} color={color}>{pattern}</ArText>;
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x - w / 2, top: y - 50, width: w }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay }}>
      <span className="flex items-center justify-center" style={{ width: w, height: 100, borderRadius: 50, border: `5px dashed ${color}`, background: `${color}12` }}>{id ? <Hear id={id}>{inner}</Hear> : inner}</span>
      {mark && <span className="-mt-3 whitespace-nowrap rounded-full font-sans font-bold" style={{ padding: '3px 14px', fontSize: 18, background: color, color: '#fff' }}>{mark}</span>}
    </motion.div>
  );
}

/** Root on top, mould in the middle, the stamped verb below; `step` reveals 1 = root, 2 = mould, 3 = verb. */
function Forge({ x, y = 230, root, pattern, mark, word, id, color, step = 3, meaning }: { x: number; y?: number; root: [string, string, string]; pattern: string; mark?: string; word: string; id?: string; color: string; step?: number; meaning?: string }) {
  return (
    <>
      {step >= 1 && <Root x={x} y={y} letters={root} color={step >= 3 ? `${color}` : F1} size={52} drop={0} />}
      {step >= 2 && <Mould x={x} y={y + 130} pattern={pattern} mark={mark} color={color} delay={0.2} w={220} />}
      {step >= 2 && <Svg><Draw d={`M ${x} ${y + 34} L ${x} ${y + 76}`} color={color} width={3} dash="3 6" delay={0.4} dur={0.4} /></Svg>}
      {step >= 3 && <Svg><Draw d={`M ${x} ${y + 196} L ${x} ${y + 236}`} color={color} width={4} delay={0.4} dur={0.4} /></Svg>}
      {step >= 3 && <Word x={x} y={y + 290} id={id} color={color} size={50} delay={0.7}>{word}</Word>}
      {step >= 3 && meaning && <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ left: x, top: y + 335, fontSize: 20, color }}>{meaning}</span>}
    </>
  );
}

/** Yusuf's bike, drawn simply; `fixed` puts the chain back on. */
function Bike({ x, y, s = 1, fixed = false, delay = 0 }: { x: number; y: number; s?: number; fixed?: boolean; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" viewBox="0 0 220 140" width={220 * s} height={140 * s} style={{ left: x - 110 * s, top: y - 140 * s, overflow: 'visible' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay, ease }}>
      <circle cx={45} cy={100} r={36} fill="none" stroke={INK_TEXT} strokeWidth={6} />
      <circle cx={175} cy={100} r={36} fill="none" stroke={INK_TEXT} strokeWidth={6} />
      <path d="M 45 100 L 95 100 L 140 50 L 75 50 Z M 140 50 L 175 100 M 75 50 L 68 30 M 58 30 L 82 30 M 140 50 L 136 28 L 152 24" fill="none" stroke={TEAL} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={95} cy={100} r={12} fill="none" stroke={GOLD} strokeWidth={5} />
      {fixed
        ? <motion.path d="M 45 88 L 95 88 M 45 112 L 95 112" stroke={GOLD} strokeWidth={4} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: delay + 0.4 }} />
        : <path d="M 45 112 Q 70 135 95 112" fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="4 6" />}
    </motion.svg>
  );
}

/* =================== Kids =================== */

export function Fx1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Root x={1150} y={210} letters={['ع', 'ل', 'م']} size={56} delay={0.3} />
      <Word x={980} y={360} color={F1} size={42} delay={0.8}>عَلِمَ</Word>
      <Word x={1320} y={360} color={F2} size={42} delay={1.1}>عَلَّمَ</Word>
      <Cut src={`${CAST}/jiddo-explain`} x={1000} y={830} h={300} delay={0.2} />
      <Cut src={`${CAST}/yusuf-listen`} x={1250} y={830} h={240} delay={0.4} />
      <Bike x={1420} y={830} s={0.7} delay={0.6} />
    </>
  );
}

export function Fx1RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1150} y={250} id="kataba-yaktubu" color={INK_TEXT} size={52}>كَتَبَ يَكْتُبُ</Word>
      {lines >= 2 && (
        <>
          <Root x={1150} y={420} letters={['ك', 'ت', 'ب']} delay={0.2} />
          <Word x={1150} y={590} color={F1} size={44} delay={0.8} ring={false}>كِتَابٌ</Word>
          <Chip x={1150} y={650} color={F1} delay={1.1}>same three letters: writing</Chip>
        </>
      )}
    </>
  );
}

export function Fx1BikeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Bike x={1300} y={800} s={1.2} fixed={lines >= 3} />
      <Cut src={`${CAST}/${lines >= 3 ? 'yusuf-brave' : 'yusuf-sad'}`} x={990} y={830} h={260} />
      {lines >= 2 && <Cut src={`${CAST}/jiddo-advice`} x={1460} y={680} h={260} delay={0.1} />}
      {lines >= 2 && lines < 3 && <Chip x={1150} y={300} color={GOLD} delay={0.4}>not fixing for him: showing him how</Chip>}
      {lines >= 3 && <Cut src={`${CAST}/maryam-think`} x={850} y={830} h={230} delay={0.2} />}
      {lines >= 3 && <SayBubble x={850} y={600} text="؟" width={80} delay={0.6} />}
    </>
  );
}

export function Fx1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Bike x={1290} y={820} s={0.8} fixed={k >= 2} />
      <Cut src={`${CAST}/${k === 1 ? 'yusuf-sad' : 'yusuf-brave'}`} x={900} y={830} h={250} />
      <Cut src={`${CAST}/jiddo-explain`} x={1430} y={830} h={290} />
      {k >= 2 && <Cut src={`${CAST}/maryam-happy`} x={1110} y={830} h={220} delay={0.1} />}
      {k === 3 && <Cut src={`${CAST}/mishmish-leap`} x={1250} y={830} h={90} ratio={1.5} delay={0.3} />}
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={900} y={570} id="story-1" text="يَا جِدِّي، ٱلدَّرَّاجَةُ لَا تَمْشِي!" width={320} size={24} delay={0.3} />
          <SayBubble x={1430} y={530} id="story-2" text="تَعَالَ، أُعَلِّمُكَ." align="right" width={220} size={26} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1110} y={600} id="story-3" text="مَنْ عَلَّمَكَ يَا يُوسُفُ؟" width={260} size={24} delay={0.3} />
          <SayBubble x={900} y={470} id="story-4" text="جِدِّي عَلَّمَنِي!" width={200} size={26} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1110} y={600} id="story-5" text="وَأَنَا سَاعَدْتُ جِدِّي!" width={250} size={24} delay={0.3} />
          <SayBubble x={1110} y={480} id="story-6" text="وَأَنَا لَاعَبْتُ مِشْمِشًا!" width={260} size={24} accent delay={1.8} />
        </React.Fragment>
      )}
    </>
  );
}

/** A seed with three letters: the root; a sprout grows into عَلِمَ. */
export function Fx1RootGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Root x={1150} y={600} letters={['ع', 'ل', 'م']} color={F1} />
      <Chip x={1150} y={660} color={F1} delay={0.4}>جَذْرٌ · root</Chip>
      {lines >= 2 && (
        <>
          <Svg><Draw d="M 1150 560 C 1140 500, 1160 440, 1150 380" color="#6E8B5A" width={6} delay={0.2} dur={0.9} /></Svg>
          <Word x={1150} y={330} id="alima" color={F1} size={56} delay={0.9}>عَلِمَ</Word>
          <Chip x={1150} y={250} color={soft('light')} delay={1.1}>he knew</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Mould x={900} y={420} pattern="?" color={F2} delay={0.2} w={160} />
          <Mould x={1400} y={420} pattern="?" color={F3} delay={0.4} w={160} />
          <Chip x={1150} y={740} color={GOLD} delay={0.7}>the shape decides what grows</Chip>
        </>
      )}
    </>
  );
}

/** The shadda mould: عَلِمَ in, عَلَّمَ out; Jiddo's knowledge passes to Yusuf. */
export function Fx1TwoGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Forge x={1000} root={['ع', 'ل', 'م']} pattern="فَعَّلَ" mark="shadda" word="عَلَّمَ" id="allama" color={F2} step={lines >= 2 ? 3 : 2} meaning="taught = made someone know" />
      {lines >= 3 && <Forge x={1350} root={['ف', 'ه', 'م']} pattern="فَعَّلَ" mark="shadda" word="فَهَّمَ" id="fahhama" color={F2} step={3} meaning="made someone understand" />}
      {lines >= 2 && lines < 3 && (
        <>
          <Cut src={`${CAST}/jiddo-advice`} x={1300} y={830} h={280} delay={0.3} />
          <Cut src={`${CAST}/yusuf-listen`} x={1460} y={830} h={220} delay={0.5} />
        </>
      )}
    </>
  );
}

/** The long ā mould: لَعِبَ in, لَاعَبَ out; two hands meet. */
export function Fx1ThreeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Forge x={1000} root={['ل', 'ع', 'ب']} pattern="فَاعَلَ" mark="long ā" word="لَاعَبَ" id="laaba" color={F3} step={lines >= 2 ? 3 : 2} meaning="played with someone" />
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/maryam-happy`} x={1300} y={830} h={230} />
          <Cut src={`${CAST}/mishmish-leap`} x={1450} y={830} h={110} ratio={1.5} delay={0.2} />
          <SayBubble x={1300} y={590} id="laabtu-mishmish" text="لَاعَبْتُ مِشْمِشًا." width={220} size={24} accent delay={0.6} />
          <Word x={1360} y={300} id="saada" color={F3} size={44} delay={0.9}>سَاعَدَ</Word>
          <Chip x={1360} y={360} color={F3} delay={1.1}>helped someone</Chip>
        </>
      )}
    </>
  );
}

/** The wow: one root, three biscuit cutters, three verbs. */
export function Fx1MouldGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const cutters = [
    { p: 'فَعَلَ', id: 'faala', c: F1, x: 1400, w: 'دَرَسَ', wid: 'darasa', m: 'studied' },
    { p: 'فَعَّلَ', id: 'faala-2', c: F2, x: 1150, w: 'دَرَّسَ', wid: 'darrasa', m: 'taught a subject' },
    { p: 'فَاعَلَ', id: 'faala-3', c: F3, x: 900, w: '', wid: '', m: '' },
  ];
  return (
    <>
      {lines >= 3 && <Root x={1150} y={210} letters={['د', 'ر', 'س']} />}
      {cutters.map((c, i) => (lines >= 2 || i === 0) && (
        <React.Fragment key={c.p}>
          <Mould x={c.x} y={400} pattern={c.p} id={c.id} color={c.c} w={210} delay={0.2 + i * 0.2} />
          {lines >= 3 && c.w && <Word x={c.x} y={590} id={c.wid} color={c.c} size={46} delay={0.9 + i * 0.3}>{c.w}</Word>}
          {lines >= 3 && c.m && <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ left: c.x, top: 640, fontSize: 20, color: c.c }}>{c.m}</span>}
        </React.Fragment>
      ))}
      {lines >= 3 && <Chip x={900} y={580} color={soft('light')} delay={1.4}>not every cutter makes a real word</Chip>}
      {lines >= 1 && lines < 3 && <Chip x={1150} y={250} color={GOLD} delay={0.4}>root = dough · pattern = cutter</Chip>}
    </>
  );
}

/** يُـ arrives at the front of the pattern verbs. */
export function Fx1PresentGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1330} y={260} color={F1} size={42} dim>يَذْهَبُ</Word>
      <Chip x={1330} y={310} color={soft('light')}>plain: ya</Chip>
      <Word x={980} y={260} id="yuallimu" color={F2} size={48} delay={0.4}>يُعَلِّمُ</Word>
      <Chip x={980} y={315} color={F2} delay={0.7}>pattern: yu</Chip>
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/jiddo-explain`} x={980} y={830} h={280} delay={0.1} />
          <Cut src={`${CAST}/maryam-happy`} x={1330} y={830} h={230} delay={0.2} />
          <Word x={1330} y={450} id="tusaidu" color={F3} size={42} delay={0.5}>تُسَاعِدُ</Word>
        </>
      )}
      {lines >= 3 && <Word x={1150} y={400} id="uallimu" color={F2} size={42} delay={0.3}>أُعَلِّمُ</Word>}
    </>
  );
}

export function Fx1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Bike x={1400} y={500} s={0.8} fixed />
      <Cut src={`${CAST}/yusuf-brave`} x={950} y={830} h={260} />
      {lines >= 2 && (
        <>
          <SayBubble x={1300} y={640} id="man-allamaka" text="مَنْ عَلَّمَكَ؟" align="right" width={200} size={28} delay={0.2} />
          <SayBubble x={950} y={560} id="allamani-abi" text="عَلَّمَنِي أَبِي." width={210} size={28} accent delay={1.4} />
        </>
      )}
    </>
  );
}

export function Fx1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-point`} x={950} y={830} h={260} />
      <Cut src={`${CAST}/maryam-think`} x={1350} y={830} h={230} delay={0.2} />
      <Word x={1150} y={330} color={F2} size={46} delay={0.5}>عَلَّمْتُ</Word>
      {lines >= 2 && <SayBubble x={950} y={560} text="عَلَّمْتُ أُخْتِي كَلِمَةً." width={280} size={26} accent delay={0.3} />}
    </>
  );
}

export function Fx1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {[[-50, -30], [40, -10], [-20, 30], [60, 40], [0, 0]].map(([dx, dy], i) => (
        <motion.span key={i} className="pointer-events-none absolute" style={{ left: 1200 + dx, top: 720 + dy, width: 40, height: 26, background: '#5FA8C8', borderRadius: 6 }}
          initial={{ opacity: 0, y: -120, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: i * 40 - 60 }} transition={{ delay: 0.2 + i * 0.05, type: 'spring', bounce: 0.3 }} />
      ))}
      <Cut src={`${CAST}/mishmish-sit`} x={1420} y={830} h={110} ratio={1.5} delay={0.4} />
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/jiddo-advice`} x={950} y={830} h={300} delay={0.1} />
          <SayBubble x={950} y={520} id="kusirat" text="كُسِرَتِ ٱلْمَزْهَرِيَّةُ!" width={260} size={26} accent delay={0.5} />
        </>
      )}
      {lines >= 3 && <Chip x={1200} y={300} color={CRIMSON} delay={0.3}>who did it? the verb does not say</Chip>}
    </>
  );
}

/* =================== 12+ =================== */

export function Fy1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Root x={1150} y={200} letters={['ر', 'س', 'ل']} size={56} delay={0.3} />
      <Mould x={1150} y={360} pattern="أَفْعَلَ" mark="Form IV" color={F4} delay={0.7} />
      <Word x={1150} y={530} color={F4} size={50} delay={1.2}>أَرْسَلَ</Word>
      <Person x={890} y={800} scale={1} color={GOLD} hijab delay={0.2} />
      <Person x={1410} y={800} scale={1.02} color={KAREEM} delay={0.3} />
    </>
  );
}

export function Fy1BoardGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const words = ['عِلْمٌ', 'عَالِمٌ', 'مُعَلِّمٌ', 'تَعْلِيمٌ'];
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 830, top: 170, width: 660, height: 380, background: '#2F4A3E', boxShadow: `0 0 0 12px #8B5A36, ${SHADOW}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <Root x={1160} y={260} letters={['ع', 'ل', 'م']} color="#ffffff33" size={60} />
      <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.2} />
      {lines >= 2 && words.map((w, i) => (
        <motion.span key={w} className="pointer-events-none absolute" style={{ left: 880 + (i % 2) * 300, top: 350 + Math.floor(i / 2) * 80 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.3 }}>
          <ArText size={44} color="#F6F1E8">{w}</ArText>
        </motion.span>
      ))}
      {lines >= 3 && <SayBubble x={1420} y={590} text="؟" width={80} delay={0.3} />}
      {lines >= 3 && <Chip x={1150} y={600} color={GOLD} delay={0.5}>one root, how many words?</Chip>}
    </>
  );
}

export function Fy1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={1.02} color={KAREEM} />
      <Person x={1150} y={800} scale={1} color={TEAL} delay={0.1} />
      <Person x={1420} y={800} scale={1} color={GOLD} hijab delay={0.2} />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={880} y={560} id="story-1" text="مَنْ عَلَّمَكَ ٱلْعَرَبِيَّةَ يَا يُوسُفُ؟" width={330} size={22} delay={0.3} />
          <SayBubble x={1150} y={420} id="story-2" text="عَلَّمَنِي أَبِي أَوَّلًا، ثُمَّ دَرَسْتُ هُنَا." width={330} size={22} accent delay={2} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1420} y={560} id="story-3" text="وَأَنَا أُكَاتِبُ صَدِيقَةً فِي ٱلْأُرْدُنِّ." align="right" width={330} size={22} delay={0.3} />
          <SayBubble x={880} y={420} id="story-4" text="مُمْتَازٌ! وَمَنْ يُسَاعِدُكِ؟" width={280} size={22} accent delay={2} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1420} y={560} id="story-5" text="هِيَ تُسَاعِدُنِي، وَأَنَا أُرْسِلُ لَهَا رَسَائِلَ بِٱلْإِنْجِلِيزِيَّةِ." align="right" width={420} size={21} delay={0.3} />
          <SayBubble x={880} y={420} id="story-6" text="هَذَا هُوَ ٱلتَّعَاوُنُ!" width={240} size={24} accent delay={2.4} />
        </React.Fragment>
      )}
    </>
  );
}

/** The scale: عَلِمَ weighed letter by letter against فَعِلَ. */
export function Fy1PatternGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Root x={1150} y={250} letters={['ع', 'ل', 'م']} />
      <Chip x={1150} y={310} color={F1} delay={0.3}>جَذْرٌ · the meaning</Chip>
      {lines >= 2 && <Mould x={1150} y={460} pattern="فَعَلَ" id="faala" color={F1} mark="وَزْنٌ · the shape" delay={0.2} />}
      {lines >= 3 && (
        <>
          <Root x={1150} y={640} letters={['ف', 'ع', 'ل']} color={GOLD} delay={0.2} />
          {[0, 1, 2].map((i) => <Svg key={i}><Draw d={`M ${1150 + (1 - i) * 66} 285 L ${1150 + (1 - i) * 66} 605`} color={GOLD} width={2} dash="2 8" delay={0.6 + i * 0.15} dur={0.6} /></Svg>)}
          <Chip x={1150} y={720} color={GOLD} delay={1.2}>weighed letter by letter</Chip>
        </>
      )}
    </>
  );
}

export function Fy1TwoGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Forge x={1350} root={['ع', 'ل', 'م']} pattern="فَعَّلَ" mark="Form II · shadda" word="عَلَّمَ" id="allama" color={F2} step={lines >= 2 ? 3 : 2} meaning="taught" />
      {lines >= 2 && <Forge x={1050} root={['ف', 'ه', 'م']} pattern="فَعَّلَ" word="فَهَّمَ" id="fahhama" color={F2} step={3} meaning="explained" />}
      {lines >= 3 && (
        <>
          <Word x={860} y={300} id="kassara" color={F2} size={40} delay={0.2}>كَسَّرَ</Word>
          <Chip x={860} y={350} color={F2} delay={0.4}>smashed</Chip>
          <Word x={860} y={470} id="yuallimu" color={F2} size={40} delay={0.6}>يُعَلِّمُ</Word>
          <Chip x={860} y={520} color={soft('light')} delay={0.8}>present</Chip>
        </>
      )}
    </>
  );
}

export function Fy1ThreeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Forge x={1350} root={['ك', 'ت', 'ب']} pattern="فَاعَلَ" mark="Form III · long ā" word="كَاتَبَ" id="kaataba" color={F3} step={lines >= 2 ? 3 : 2} meaning="corresponded with" />
      {lines >= 2 && (
        <>
          <Person x={900} y={760} scale={0.75} color={GOLD} hijab delay={0.2} />
          <Person x={1100} y={760} scale={0.75} color={TEAL} hijab delay={0.3} />
          <Svg><Draw d="M 940 560 Q 1000 500 1060 560" color={F3} width={3} dash="3 7" delay={0.5} dur={0.6} /><Draw d="M 1060 590 Q 1000 650 940 590" color={F3} width={3} dash="3 7" delay={0.9} dur={0.6} /></Svg>
        </>
      )}
      {lines >= 3 && (
        <>
          <Word x={1000} y={260} id="saada" color={F3} size={36} delay={0.2}>سَاعَدَ</Word>
          <Word x={1000} y={350} id="shaaraka" color={F3} size={36} delay={0.4}>شَارَكَ</Word>
          <Word x={1000} y={440} id="yukaatibu" color={F3} size={36} delay={0.6}>يُكَاتِبُ</Word>
        </>
      )}
    </>
  );
}

export function Fy1FourGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Forge x={1350} root={['خ', 'ر', 'ج']} pattern="أَفْعَلَ" mark="Form IV · hamza" word="أَخْرَجَ" id="akhraja" color={F4} step={lines >= 2 ? 3 : 2} meaning="took something out" />
      {lines >= 2 && (
        <>
          <Word x={1000} y={260} id="kharaja" color={F1} size={38} delay={0.2} ring={false}>خَرَجَ</Word>
          <Chip x={1000} y={310} color={F1} delay={0.4}>went out</Chip>
          <Word x={1000} y={420} id="adkhala" color={F4} size={38} delay={0.6}>أَدْخَلَ</Word>
          <Chip x={1000} y={470} color={F4} delay={0.8}>brought in</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Word x={1000} y={600} id="arsala" color={F4} size={38} delay={0.2}>أَرْسَلَ</Word>
          <Word x={1000} y={700} id="yursilu" color={F4} size={38} delay={0.5}>يُرْسِلُ</Word>
          <Chip x={860} y={745} color={soft('light')} delay={0.8}>hamza goes, yu comes</Chip>
        </>
      )}
    </>
  );
}

/** Plain ya and pattern yu side by side; then a ladder of ten patterns, four of them lit. */
export function Fy1LadderGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rungs = ['فَعَلَ', 'فَعَّلَ', 'فَاعَلَ', 'أَفْعَلَ', 'تَفَعَّلَ', 'تَفَاعَلَ', 'اِنْفَعَلَ', 'اِفْتَعَلَ', 'اِفْعَلَّ', 'اِسْتَفْعَلَ'];
  const lit = [F1, F2, F3, F4];
  return (
    <>
      <Word x={1370} y={230} color={F1} size={38} delay={0.1} ring={false}>يَكْتُبُ</Word>
      <Word x={1370} y={310} id="yukaatibu-2" color={F3} size={38} delay={0.3}>يُكَاتِبُ</Word>
      <Chip x={1370} y={355} color={soft('light')} delay={0.5}>ya: plain · yu: pattern</Chip>
      {lines >= 2 && (
        <>
          <Word x={1370} y={450} id="yakhruju" color={F1} size={38} delay={0.1} ring={false}>يَخْرُجُ</Word>
          <Word x={1370} y={530} id="yukhriju" color={F4} size={38} delay={0.3}>يُخْرِجُ</Word>
        </>
      )}
      {lines >= 3 && rungs.map((r, i) => (
        <motion.div key={r} className="pointer-events-none absolute flex items-center justify-center rounded-[12px]" style={{ left: 860, top: 180 + i * 58, width: 220, height: 50, background: i < 4 ? CARD : `${CARD}88`, boxShadow: i < 4 ? `0 0 0 3px ${lit[i]}, ${SHADOW}` : 'inset 0 0 0 2px #E0D2BA' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: i < 4 ? 1 : 0.5, x: 0 }} transition={{ delay: 0.1 * i }}>
          <ArText size={28} color={i < 4 ? lit[i] : soft('light')}>{r}</ArText>
        </motion.div>
      ))}
      {lines >= 3 && <Chip x={970} y={780} color={GOLD} delay={1.2}>4 of 10 so far</Chip>}
    </>
  );
}

export function Fy1DictionaryGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const fam = ['رَسُولٌ', 'رِسَالَةٌ', 'مُرْسِلٌ', 'أَرْسَلَ'];
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[14px]" style={{ left: 980, top: 170, width: 460, height: 560, background: CARD, boxShadow: SHADOW, borderLeft: `14px solid ${F4}` }} initial={{ opacity: 0, rotateY: -30 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ duration: 0.8, ease }} />
      <span className="pointer-events-none absolute font-sans font-black uppercase" style={{ left: 1020, top: 190, fontSize: 15, letterSpacing: 2, color: soft('light') }}>dictionary · by root</span>
      {lines >= 2 && (
        <>
          <Word x={860} y={300} color={F4} size={42} delay={0.1}>أَرْسَلَ</Word>
          <Svg><Draw d="M 930 330 C 990 380, 1040 390, 1100 390" color={F4} width={3} dash="3 7" delay={0.6} dur={0.7} /></Svg>
          <Root x={1210} y={300} letters={['ر', 'س', 'ل']} color={F4} size={54} delay={0.4} />
        </>
      )}
      {lines >= 3 && fam.map((w, i) => (
        <Word key={w} x={1210} y={420 + i * 75} id={w === 'رِسَالَةٌ' ? 'risala' : undefined} color={INK_TEXT} size={34} delay={0.2 + i * 0.2} ring={false}>{w}</Word>
      ))}
    </>
  );
}

export function Fy1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Forge x={1150} y={190} root={['د', 'ر', 'س']} pattern="فَعَّلَ" word="دَرَّسَ" id="darrasa" color={F2} step={3} />
      <Word x={900} y={480} id="darasa" color={F1} size={40} delay={0.5}>دَرَسَ</Word>
      {lines >= 2 && <Person x={1420} y={800} scale={1} color={TEAL} delay={0.1} />}
      {lines >= 2 && <SayBubble x={1420} y={570} text="عَلَّمَنِي…" align="right" width={180} size={26} accent delay={0.4} />}
    </>
  );
}

export function Fy1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [['يُرْسِلُ', 'ر س ل', 'IV', F4], ['يُسَاعِدُ', 'س ع د', 'III', F3], ['يُعَلِّمُ', 'ع ل م', 'II', F2]] as const;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 900, top: 190, width: 560, height: 480, background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, rotate: 3, y: 30 }} animate={{ opacity: 1, rotate: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      {rows.slice(0, lines >= 2 ? 3 : 2).map(([w, r, f, c], i) => (
        <motion.div key={w} className="pointer-events-none absolute flex items-center gap-6" style={{ left: 940, top: 240 + i * 110, flexDirection: 'row-reverse', width: 480 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.3 }}>
          <ArText size={40} color={c}>{w}</ArText>
          <ArText size={30} color={INK_TEXT}>{r}</ArText>
          <span className="rounded-full font-sans font-bold" style={{ padding: '2px 12px', fontSize: 18, background: c, color: '#fff' }}>Form {f}</span>
        </motion.div>
      ))}
      {lines >= 2 && <Chip x={1180} y={600} color={CRIMSON} delay={1.2}>+ one I could not solve</Chip>}
    </>
  );
}

export function Fy1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1.02} color={GOLD} hijab />
      <motion.div className="pointer-events-none absolute flex flex-col justify-center rounded-[30px]" style={{ left: 1090, top: 200, width: 380, height: 300, background: CARD, boxShadow: `0 0 0 10px ${INK_TEXT}, ${SHADOW}`, padding: 24 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
        <span className="font-sans font-black uppercase" style={{ fontSize: 14, letterSpacing: 2, color: CRIMSON }}>news</span>
        <Hear id="futiha"><span dir="rtl" className="mt-2 block text-right"><ArText size={34} color={INK_TEXT}>فُتِحَ طَرِيقٌ جَدِيدٌ</ArText></span></Hear>
      </motion.div>
      {lines >= 2 && <SayBubble x={900} y={560} text="مَنْ فَتَحَهُ؟" width={180} size={28} delay={0.3} />}
      {lines >= 3 && <Chip x={1280} y={560} color={CRIMSON} delay={0.3}>the passive: no doer named</Chip>}
    </>
  );
}
