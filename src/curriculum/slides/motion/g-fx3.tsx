import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Person, Svg, Draw } from './kit';
import { ArText, SayBubble } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · Level 3 · Lesson 3 (Kids: Indeed and But; 12+: The Debate Club). إِنَّ and her sisters. One device for both:
 * the seesaw. A noun sentence sits on a plank, first word on the right seat, predicate on the left. When a sister (a
 * crimson weight) lands on the right end, that end goes down: the first word swaps whole to its ـَ form (gold) while
 * the predicate stays up in its ـُ (teal). Whole words only; the vowels are named on chips.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const KAREEM = '#6E8B5A';
const SIS = CRIMSON;
const NA = GOLD;
const PR = TEAL;

/** A whole Arabic word on a card. */
function Word({ x, y, children, color = INK_TEXT, id, size = 44, delay = 0, dim = false, ring = true }: { x: number; y: number; children: string; color?: string; id?: string; size?: number; delay?: number; dim?: boolean; ring?: boolean }) {
  const body = <span className="inline-block whitespace-nowrap rounded-[20px]" style={{ padding: '0 20px', background: CARD, boxShadow: ring ? `0 0 0 4px ${color}, ${SHADOW}` : SHADOW }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div key={children} initial={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }} animate={{ opacity: dim ? 0.3 : 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay }}>
        {id ? <Hear id={id}>{body}</Hear> : body}
      </motion.div>
    </div>
  );
}

/**
 * The seesaw at (x, y) with half-length `arm`. Right seat: `first` (or `firstA` once `sister` lands); left seat: `second`.
 * The plank tilts 8° when the sister lands; the words ride their seats up and down.
 */
function Seesaw({ x, y, arm = 260, first, firstA, second, sister, id, idA, size = 40, delay = 0 }: {
  x: number; y: number; arm?: number; first: string; firstA: string; second: string; sister?: string; id?: string; idA?: string; size?: number; delay?: number;
}) {
  const on = !!sister;
  const drop = Math.sin((8 * Math.PI) / 180) * arm;
  return (
    <>
      <motion.svg className="pointer-events-none absolute" viewBox="0 0 80 70" width={80} height={70} style={{ left: x - 40, top: y + 6 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
        <path d="M 40 4 L 74 66 L 6 66 Z" fill="#B4552F" />
      </motion.svg>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: x - arm - 30, top: y - 6, width: 2 * arm + 60, height: 14, background: '#8B5A36', transformOrigin: 'center' }}
        initial={{ opacity: 0, scaleX: 0.5 }} animate={{ opacity: 1, scaleX: 1, rotate: on ? 8 : 0 }} transition={{ duration: 0.8, delay: on ? delay + 0.4 : delay, ease }} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ y: on ? drop : 0 }} transition={{ duration: 0.8, delay: delay + 0.4, ease }}>
        <Word x={x + arm} y={y - 40} id={on ? idA : id} color={on ? NA : PR} size={size} delay={on ? delay + 0.9 : delay}>{on ? firstA : first}</Word>
        {on && (
          <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: x + arm + 70, top: y - 74 }}
            initial={{ opacity: 0, y: -80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }}>
            <span className="rounded-[14px]" style={{ padding: '0 14px', background: SIS, boxShadow: SHADOW }}><ArText size={size * 0.8} color="#fff">{sister!}</ArText></span>
          </motion.span>
        )}
      </motion.div>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ y: on ? -drop : 0 }} transition={{ duration: 0.8, delay: delay + 0.4, ease }}>
        <Word x={x - arm} y={y - 40} color={PR} size={size} delay={delay + 0.2}>{second}</Word>
      </motion.div>
    </>
  );
}

/* =================== Kids =================== */

export function Fx3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Seesaw x={1150} y={330} arm={220} first="مِشْمِشٌ" firstA="مِشْمِشًا" second="بَرِيءٌ" sister="إِنَّ" delay={0.5} />
      <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={250} />
      <Cut src={`${CAST}/mishmish-sit`} x={1150} y={830} h={120} ratio={1.5} delay={0.2} />
      <Cut src={`${CAST}/yusuf-point`} x={1400} y={830} h={250} delay={0.3} />
    </>
  );
}

export function Fx3RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1150} y={280} id="ukila-samak" color={CRIMSON} size={46}>أُكِلَ ٱلسَّمَكُ.</Word>
      <Chip x={1150} y={340} color={soft('light')} delay={0.3}>who? nobody said</Chip>
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/maryam-point`} x={950} y={830} h={250} delay={0.1} />
          <Cut src={`${CAST}/yusuf-point`} x={1350} y={830} h={250} delay={0.2} flip />
          <SayBubble x={950} y={570} text="!" width={70} size={30} delay={0.4} />
          <SayBubble x={1350} y={570} text="!" align="right" width={70} size={30} accent delay={0.6} />
        </>
      )}
    </>
  );
}

export function Fx3TrialGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-sit`} x={1150} y={560} h={270} />
      <motion.div className="pointer-events-none absolute rounded-[40px]" style={{ left: 1000, top: 760, width: 300, height: 50, background: '#C46A3F55' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Cut src={`${CAST}/mishmish-sit`} x={1150} y={810} h={100} ratio={1.5} delay={0.2} />
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={240} delay={0.1} />
          <Cut src={`${CAST}/yusuf-point`} x={1420} y={830} h={240} delay={0.2} />
          <Chip x={900} y={560} color={NA} delay={0.4}>for Mishmish</Chip>
          <Chip x={1420} y={560} color={SIS} delay={0.6}>against</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Word x={980} y={220} color={SIS} size={40} delay={0.2}>إِنَّ</Word>
          <Word x={1320} y={220} color={SIS} size={40} delay={0.4}>لَكِنَّ</Word>
        </>
      )}
    </>
  );
}

export function Fx3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Cut src={`${CAST}/jiddo-sit`} x={1150} y={560} h={250} />
      <Cut src={`${CAST}/mishmish-sit`} x={1150} y={810} h={100} ratio={1.5} />
      <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={240} />
      <Cut src={`${CAST}/yusuf-point`} x={1420} y={830} h={240} />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={1150} y={300} id="story-1" text="مَنْ أَكَلَ ٱلسَّمَكَ؟" width={240} size={24} delay={0.3} />
          <SayBubble x={900} y={580} id="story-2" text="إِنَّ مِشْمِشًا بَرِيءٌ يَا جِدِّي!" width={300} size={22} accent delay={1.6} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1420} y={580} id="story-3" text="لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ!" align="right" width={280} size={22} accent delay={0.3} />
          <SayBubble x={900} y={580} id="story-4" text="إِنَّهُ جَائِعٌ، مِسْكِينٌ!" width={250} size={22} delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1340} y={300} id="story-5" text="إِنَّ مِشْمِشًا ذَكِيٌّ، لَكِنَّهُ لِصٌّ صَغِيرٌ!" align="right" width={400} size={22} accent delay={0.3} />
        </React.Fragment>
      )}
    </>
  );
}

export function Fx3InnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Seesaw x={1150} y={360} arm={230} first="مِشْمِشٌ" firstA="مِشْمِشًا" second="بَرِيءٌ" sister={lines >= 2 ? 'إِنَّ' : undefined} id="mishmish-bari" idA="inna-mishmishan" />
      <Cut src={`${CAST}/mishmish-sit`} x={1150} y={830} h={120} ratio={1.5} delay={0.2} />
      {lines >= 2 && <Chip x={1150} y={190} color={SIS} delay={0.2}>إِنَّ = for sure!</Chip>}
      {lines >= 3 && (
        <>
          <Chip x={1400} y={520} color={NA} delay={0.3}>changed: ـًا</Chip>
          <Chip x={900} y={520} color={PR} delay={0.6}>stayed: ـٌ</Chip>
        </>
      )}
    </>
  );
}

export function Fx3SeesawGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Seesaw x={1150} y={400} arm={240} first="ٱلسَّمَكُ" firstA="ٱلسَّمَكَ" second="لَذِيذٌ" sister={lines >= 2 ? 'إِنَّ' : undefined} id="samak-ladhidh" idA="inna-samak" />
      {lines < 2 && <Chip x={1150} y={250} color={SIS} delay={0.3}>a weight on the first seat</Chip>}
      {lines >= 2 && <Chip x={1390} y={560} color={NA} delay={1.2}>u → a</Chip>}
      {lines >= 3 && <Chip x={910} y={240} color={PR} delay={0.3}>does not move</Chip>}
    </>
  );
}

export function Fx3LakinnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1150} y={220} id="lakinna" color={SIS} size={52}>لَكِنَّ</Word>
      <Chip x={1150} y={280} color={SIS} delay={0.3}>but</Chip>
      {lines >= 2 && <Seesaw x={1150} y={470} arm={230} first="ٱلسَّمَكُ" firstA="ٱلسَّمَكَ" second="فِي فَمِهِ" sister="لَكِنَّ" idA="lakinna-samak" size={38} />}
      {lines >= 3 && <Chip x={1150} y={640} color={NA} delay={0.3}>same weight, same first word</Chip>}
    </>
  );
}

export function Fx3HuGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/mishmish-sit`} x={1360} y={830} h={130} ratio={1.5} />
      <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={250} />
      <Word x={1150} y={250} color={NA} size={46}>إِنَّهُ</Word>
      <Svg><Draw d="M 1200 290 C 1260 400, 1330 560, 1350 700" color={NA} width={3} dash="3 8" delay={0.4} dur={0.8} /></Svg>
      {lines >= 2 && <SayBubble x={900} y={580} id="innahu-jaai" text="إِنَّهُ جَائِعٌ!" width={190} size={26} accent delay={0.3} />}
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/jiddo-explain`} x={1150} y={830} h={280} delay={0.1} />
          <SayBubble x={1150} y={480} id="lakinnahu-liss" text="لَكِنَّهُ لِصٌّ صَغِيرٌ!" width={240} size={24} delay={0.5} />
        </>
      )}
    </>
  );
}

export function Fx3VerdictGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-explain`} x={900} y={830} h={290} />
      <Cut src={`${CAST}/mishmish-sit`} x={1100} y={830} h={110} ratio={1.5} delay={0.2} />
      <Word x={1250} y={250} id="story-5" color={INK_TEXT} size={30} delay={0.3} ring={false}>إِنَّ مِشْمِشًا ذَكِيٌّ، لَكِنَّهُ لِصٌّ صَغِيرٌ!</Word>
      {lines >= 2 && (
        <>
          <Chip x={1390} y={330} color={NA} delay={0.2}>sure: something good</Chip>
          <Chip x={1080} y={330} color={SIS} delay={0.6}>but…</Chip>
        </>
      )}
      {lines >= 3 && <Chip x={1250} y={450} color={GOLD} delay={0.3}>true thing · but · other thing</Chip>}
    </>
  );
}

export function Fx3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={900} y={830} h={250} />
      <Cut src={`${CAST}/yusuf-think`} x={1420} y={830} h={250} delay={0.2} />
      {lines >= 2 && (
        <>
          <SayBubble x={900} y={580} id="inna-ghurfa" text="إِنَّ ٱلْغُرْفَةَ نَظِيفَةٌ!" width={240} size={24} delay={0.3} />
          <SayBubble x={1420} y={480} id="lakinna-ghurfa" text="لَكِنَّ ٱلْأَلْعَابَ عَلَى ٱلْأَرْضِ!" align="right" width={300} size={22} accent delay={1.4} />
        </>
      )}
    </>
  );
}

export function Fx3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-brave`} x={1350} y={830} h={260} />
      <Cut src={`${CAST}/maryam-happy`} x={950} y={830} h={240} delay={0.2} />
      {lines >= 2 && <SayBubble x={950} y={580} text="إِنَّ أَخِي ذَكِيٌّ، لَكِنَّهُ…" width={300} size={24} accent delay={0.3} />}
    </>
  );
}

export function Fx3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1080, top: 200, width: 400, height: 300, background: '#1F2D4A', boxShadow: `0 0 0 12px ${CARD}, ${SHADOW}` }} initial={{ opacity: 0, rotate: -3 }} animate={{ opacity: 1, rotate: -1 }} transition={{ duration: 0.8 }}>
        {[[80, 150, 40, GOLD], [200, 90, 26, '#C46A3F'], [300, 190, 34, TEAL], [150, 240, 18, CRIMSON]].map(([cx, cy, r, c], i) => (
          <span key={i} className="absolute rounded-full" style={{ left: (cx as number) - (r as number), top: (cy as number) - (r as number), width: (r as number) * 2, height: (r as number) * 2, background: c as string }} />
        ))}
      </motion.div>
      <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={260} />
      {lines >= 2 && <SayBubble x={900} y={560} id="taallamtu" text="تَعَلَّمْتُ كَثِيرًا، وَتَعَاوَنَّا!" width={300} size={24} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1280} y={560} color={TEAL} delay={0.3}>new shapes with تَـ</Chip>}
    </>
  );
}

/* =================== 12+ =================== */

function Club({ kareem = true }: { kareem?: boolean }) {
  return (
    <>
      <Person x={880} y={800} scale={1} color={GOLD} hijab />
      {kareem && <Person x={1150} y={800} scale={1.02} color={KAREEM} delay={0.1} />}
      <Person x={1420} y={800} scale={1} color={TEAL} delay={0.2} />
    </>
  );
}

export function Fy3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Seesaw x={1150} y={330} arm={230} first="ٱلْهَاتِفُ" firstA="ٱلْهَاتِفَ" second="مُفِيدٌ" sister="إِنَّ" delay={0.5} />
      <Club kareem={false} />
    </>
  );
}

export function Fy3MotionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[12px] font-sans font-black" style={{ left: 940, top: 190, width: 440, padding: '14px 20px', fontSize: 22, background: '#2F4A3E', color: '#F6F1E8', textAlign: 'center', boxShadow: `0 0 0 10px #8B5A36, ${SHADOW}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        Should phones be banned at school?
      </motion.div>
      <Club />
      {lines >= 2 && (
        <>
          <Chip x={880} y={560} color={NA} delay={0.2}>for phones</Chip>
          <Chip x={1420} y={560} color={SIS} delay={0.4}>against</Chip>
        </>
      )}
      {lines >= 3 && ['إِنَّ', 'لَكِنَّ', 'كَأَنَّ', 'لَيْتَ', 'لَعَلَّ'].map((w, i) => (
        <motion.span key={w} className="pointer-events-none absolute rounded-[12px]" style={{ left: 930 + i * 92, top: 330, padding: '0 10px', background: SIS }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}>
          <ArText size={28} color="#fff">{w}</ArText>
        </motion.span>
      ))}
    </>
  );
}

export function Fy3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Club />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={1150} y={430} id="story-1" text="ٱلْمَوْضُوعُ: هَلْ يُمْنَعُ ٱلْهَاتِفُ فِي ٱلْمَدْرَسَةِ؟" width={400} size={22} delay={0.3} />
          <SayBubble x={880} y={570} id="story-2" text="إِنَّ ٱلْهَاتِفَ مُفِيدٌ لِلدِّرَاسَةِ." width={290} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1420} y={570} id="story-3" text="لَكِنَّ ٱلطُّلَّابَ يَلْعَبُونَ بِهِ فِي ٱلدَّرْسِ." align="right" width={340} size={22} delay={0.3} />
          <SayBubble x={880} y={440} id="story-4" text="كَأَنَّكَ لَا تَلْعَبُ بِهِ أَنْتَ!" width={290} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1420} y={570} id="story-5" text="لَيْتَ ٱلْهَاتِفَ يَدْرُسُ عَنِّي!" align="right" width={280} size={22} delay={0.3} />
          <SayBubble x={1150} y={430} id="story-6" text="لَعَلَّ ٱلْحَلَّ فِي ٱلْوَسَطِ." width={260} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
    </>
  );
}

export function Fy3InnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Seesaw x={1150} y={380} arm={240} first="ٱلْهَاتِفُ" firstA="ٱلْهَاتِفَ" second="مُفِيدٌ" sister={lines >= 2 ? 'إِنَّ' : undefined} id="hatif-mufid" idA="inna-hatif" />
      {lines < 2 && <Chip x={1150} y={230} color={PR} delay={0.3}>both ـُ</Chip>}
      {lines >= 3 && (
        <>
          <Chip x={1390} y={550} color={NA} delay={0.2}>ٱسْمُهَا · ـَ</Chip>
          <Chip x={910} y={250} color={PR} delay={0.4}>خَبَرُهَا · ـُ</Chip>
        </>
      )}
    </>
  );
}

export function Fy3SeesawGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Seesaw x={1150} y={360} arm={250} first="ٱلطُّلَّابُ" firstA="ٱلطُّلَّابَ" second="مَشْغُولُونَ" sister={lines >= 2 ? 'إِنَّ' : undefined} idA="inna-tullab" size={38} />
      {lines >= 3 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 880, top: 600, width: 540, padding: '12px 18px', background: CARD, boxShadow: `inset 6px 0 0 ${GOLD}, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>Coming in Lesson 8: كَانَ, the mirror. It leaves the first seat and pushes the second.</span>
          </motion.div>
        </>
      )}
    </>
  );
}

export function Fy3LakinnaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Seesaw x={1150} y={300} arm={230} first="ٱلطُّلَّابُ" firstA="ٱلطُّلَّابَ" second="يَلْعَبُونَ" sister="لَكِنَّ" idA="lakinna-tullab" size={36} />
      {lines >= 2 && (
        <>
          <Word x={1150} y={560} id="anna-hatif" color={INK_TEXT} size={34} delay={0.2} ring={false}>أَعْتَقِدُ أَنَّ ٱلْهَاتِفَ مُفِيدٌ.</Word>
          <Chip x={1150} y={615} color={SIS} delay={0.5}>أَنَّ = that</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1380} y={700} color={SIS} delay={0.2}>إِنَّ: starts a sentence</Chip>
          <Chip x={950} y={700} color={SIS} delay={0.4}>أَنَّ: in the middle</Chip>
        </>
      )}
    </>
  );
}

export function Fy3MoodsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { s: 'كَأَنَّ', en: 'as if', t: 'كَأَنَّ ٱلْفَصْلَ مَلْعَبٌ.', id: 'kaanna-fasl' },
    { s: 'لَيْتَ', en: 'if only', t: 'لَيْتَ ٱلْهَاتِفَ يَدْرُسُ عَنِّي!', id: 'story-5' },
    { s: 'لَعَلَّ', en: 'perhaps', t: 'لَعَلَّ ٱلْحَلَّ فِي ٱلْوَسَطِ.', id: 'story-6' },
  ];
  return (
    <>
      {rows.slice(0, lines).map((r, i) => (
        <React.Fragment key={r.s}>
          <motion.span className="pointer-events-none absolute flex flex-col items-center rounded-[14px]" style={{ left: 1360, top: 200 + i * 170, width: 120, padding: '4px 0', background: SIS }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <ArText size={32} color="#fff">{r.s}</ArText>
            <span className="font-sans font-bold" style={{ fontSize: 15, color: '#fff' }}>{r.en}</span>
          </motion.span>
          <Word x={1080} y={245 + i * 170} id={r.id} color={INK_TEXT} size={32} delay={0.4} ring={false}>{r.t}</Word>
        </React.Fragment>
      ))}
    </>
  );
}

export function Fy3PronounsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const ps = [['إِنَّهُ', 'innahu', 'he, certainly'], ['إِنَّهَا', undefined, 'she, certainly'], ['لَكِنَّنِي', 'lakinnani', 'but I'], ['كَأَنَّكَ', undefined, 'as if you'], ['لَعَلَّهَا', 'laallaha', 'perhaps she']] as const;
  return (
    <>
      {ps.slice(0, lines >= 2 ? 5 : 2).map(([w, id, en], i) => (
        <React.Fragment key={w}>
          <Word x={1380 - (i % 2) * 300} y={250 + Math.floor(i / 2) * 150} id={id} color={NA} size={40} delay={0.15 * i}>{w}</Word>
          <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ left: 1380 - (i % 2) * 300, top: 295 + Math.floor(i / 2) * 150, fontSize: 18, color: soft('light') }}>{en}</span>
        </React.Fragment>
      ))}
      {lines >= 3 && <Chip x={950} y={600} color={GOLD} delay={0.3}>the pronoun sits in the noun's seat</Chip>}
    </>
  );
}

/** The wow: one sentence, six sisters stamped in turn, the same two endings every time. */
export function Fy3SixGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const sis = [['إِنَّ', 'certainly'], ['أَنَّ', 'that'], ['لَكِنَّ', 'but'], ['كَأَنَّ', 'as if'], ['لَيْتَ', 'if only'], ['لَعَلَّ', 'perhaps']];
  return (
    <>
      <Word x={1150} y={220} id="dars-sahl" color={PR} size={44} dim={lines >= 2}>ٱلدَّرْسُ سَهْلٌ</Word>
      {lines >= 2 && sis.map(([s, en], i) => (
        <motion.div key={s} className="pointer-events-none absolute flex items-center gap-4" style={{ right: 1600 - 1470, top: 290 + i * 72, flexDirection: 'row-reverse' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}>
          <span className="rounded-[10px]" style={{ padding: '0 10px', background: SIS }}><ArText size={28} color="#fff">{s}</ArText></span>
          <ArText size={30} color={NA}>ٱلدَّرْسَ</ArText>
          <ArText size={30} color={PR}>سَهْلٌ</ArText>
          <span className="font-sans font-bold" style={{ fontSize: 17, color: soft('light') }}>{en}</span>
        </motion.div>
      ))}
      {lines >= 3 && <Chip x={980} y={720} color={GOLD} delay={0.3}>six meanings · one grammar</Chip>}
    </>
  );
}

export function Fy3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1} color={TEAL} />
      <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.1} />
      {lines >= 2 && (
        <>
          {['إِنَّ…', 'لَكِنَّ…', 'لَيْتَ…', 'لَعَلَّ…'].map((w, i) => (
            <motion.span key={w} className="pointer-events-none absolute rounded-[12px]" style={{ left: 1040, top: 220 + i * 70, padding: '0 14px', background: i % 2 ? CARD : SIS, boxShadow: SHADOW }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}>
              <ArText size={30} color={i % 2 ? SIS : '#fff'}>{w}</ArText>
            </motion.span>
          ))}
          <SayBubble x={900} y={570} id="inna-wajib" text="إِنَّ ٱلْوَاجِبَ مُفِيدٌ." width={230} size={24} accent delay={0.8} />
        </>
      )}
    </>
  );
}

export function Fy3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 900, top: 190, width: 540, height: 520, background: CARD, boxShadow: SHADOW, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 79px, #E6D8C0 79px 81px)' }} initial={{ opacity: 0, rotate: 3, y: 30 }} animate={{ opacity: 1, rotate: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      {['إِنَّ', 'لَكِنَّ', 'أَنَّ', 'لَيْتَ', 'لَعَلَّ'].map((w, i) => (
        <motion.span key={w} className="pointer-events-none absolute" style={{ right: 1600 - 1400, top: 220 + i * 80 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.15 }}>
          <span className="rounded-[10px]" style={{ padding: '0 10px', background: SIS }}><ArText size={28} color="#fff">{w}</ArText></span>
          {lines >= 2 && <span className="ml-3" style={{ borderBottom: `3px solid ${NA}` }}><ArText size={28} color={NA}> … </ArText></span>}
        </motion.span>
      ))}
    </>
  );
}

export function Fy3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={880} y={800} scale={1} color={GOLD} hijab />
      <Person x={1060} y={800} scale={1} color={TEAL} delay={0.1} />
      <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.2} />
      {lines >= 2 && <Word x={1150} y={300} id="taallamna" color={INK_TEXT} size={30} delay={0.3} ring={false}>تَعَلَّمْنَا كَثِيرًا لِأَنَّنَا تَعَاوَنَّا.</Word>}
      {lines >= 3 && <Chip x={1150} y={370} color={TEAL} delay={0.3}>Forms V and VI: تَفَعَّلَ · تَفَاعَلَ</Chip>}
    </>
  );
}
