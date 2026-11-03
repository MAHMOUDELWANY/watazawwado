import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Person, Icon, Svg, Draw } from './kit';
import { ArText, SayBubble } from './g-lang';
import { Hear } from '../Say';
import { PERSONS } from './g-fv1';

/**
 * Fusha · Level 2 · Lesson 2 (Kids: Every Day; 12+: The Timetable). Lesson 1 snapped the past's "who" onto the back of
 * the verb; here the present wears it at the front. One device for both versions: a whole-word tile in the person's
 * colour (same colours as Lesson 1) with a "front tag" glued to its right edge, the side Arabic starts on. Where a form
 * also has an ending (تَدْرُسِينَ، يَدْرُسُونَ) a second tag sits on the left. Whole words are coloured, never parts.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const KAREEM = '#6E8B5A';
const C = {
  i: PERSONS.i.color, youM: PERSONS.youM.color, youF: PERSONS.youF.color, he: PERSONS.he.color, she: PERSONS.she.color,
  we: PERSONS.we.color, youPl: PERSONS.youPl.color, they: PERSONS.they.color,
};

/** A whole Arabic word on a card, centred at (x, y); `id` plays it. */
function Word({ x, y, children, color = INK_TEXT, id, size = 56, delay = 0, dim = false, ring = true }: { x: number; y: number; children: string; color?: string; id?: string; size?: number; delay?: number; dim?: boolean; ring?: boolean }) {
  const body = <span className="inline-block whitespace-nowrap rounded-[22px]" style={{ padding: '0 24px', background: CARD, boxShadow: ring ? `0 0 0 4px ${color}, ${SHADOW}` : SHADOW }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div key={children} initial={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }} animate={{ opacity: dim ? 0.3 : 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay }}>
        {id ? <Hear id={id}>{body}</Hear> : body}
      </motion.div>
    </div>
  );
}

/** A tag on one side of a word: the letters that carry the person, and who they mean. `side` is where it slides from. */
function Tag({ x, y, letters, who, color, side = 'front', delay = 0 }: { x: number; y: number; letters: string; who?: string; color: string; side?: 'front' | 'back'; delay?: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div className="flex items-center gap-2 whitespace-nowrap rounded-full" style={{ padding: '2px 16px 2px 8px', background: color, boxShadow: SHADOW, flexDirection: side === 'front' ? 'row' : 'row-reverse' }}
        initial={{ opacity: 0, x: side === 'front' ? 50 : -50, scale: 0.7 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay }}>
        <span className="rounded-full" style={{ background: CARD, padding: '0 16px' }}><ArText size={42} color={color}>{letters}</ArText></span>
        {who && <span className="font-sans font-bold" style={{ fontSize: 24, color: '#fff' }}>{who}</span>}
      </motion.div>
    </div>
  );
}

/** A circular "every day" arrow round a point. */
function Loop({ x, y, r = 70, color = GOLD, delay = 0 }: { x: number; y: number; r?: number; color?: string; delay?: number }) {
  const d = `M ${x + r} ${y} A ${r} ${r} 0 1 1 ${x} ${y - r}`;
  return (
    <Svg>
      <Draw d={d} color={color} width={5} delay={delay} dur={1.1} />
      <motion.path d={`M ${x - 4} ${y - r - 12} L ${x + 14} ${y - r} L ${x - 4} ${y - r + 12} Z`} fill={color} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1 }} />
    </Svg>
  );
}

/** An icon on a card. */
function Pic({ x, y, icon, color, s = 90, label, delay = 0 }: { x: number; y: number; icon: string; color: string; s?: number; label?: string; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: x - s / 2, top: y - s / 2, width: s }}
      initial={{ opacity: 0, y: 18, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay }}>
      <span className="flex items-center justify-center rounded-[24px]" style={{ width: s, height: s, background: CARD, boxShadow: `0 0 0 3px ${color}66, ${SHADOW}` }}><Icon name={icon} size={s * 0.55} color={color} /></span>
      {label && <span className="mt-1 whitespace-nowrap font-sans font-bold" style={{ fontSize: 17, color: INK_TEXT }}>{label}</span>}
    </motion.div>
  );
}

/** Maryam's toy microphone. */
function Mic({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" viewBox="0 0 40 90" width={34} height={76} style={{ left: x - 17, top: y - 38, overflow: 'visible' }}
      initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: -15 }} transition={{ type: 'spring', bounce: 0.5, delay }}>
      <circle cx={20} cy={16} r={15} fill={CRIMSON} /><rect x={15} y={30} width={10} height={56} rx={5} fill={INK_TEXT} />
    </motion.svg>
  );
}

/* =================== Kids =================== */

export function Fv2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Cut src={`${CAST}/yusuf-brave`} x={940} y={820} h={290} />
      <Pic x={1120} y={700} icon="bag" color={GOLD} s={90} delay={0.3} />
      <Loop x={1330} y={330} r={80} delay={0.5} />
      <Pic x={1330} y={330} icon="sun" color={GOLD} s={80} delay={0.6} />
      <Word x={1250} y={560} color={C.he} size={52} delay={1}>يَذْهَبُ</Word>
      <Tag x={1430} y={480} letters="يَـ" who="he" color={C.he} delay={1.4} />
    </>
  );
}

/** Yesterday's word, with its "who" at the back (the left end); then a question mark waits at the front. */
export function Fv2RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-point`} x={900} y={820} h={260} />
      <Chip x={1180} y={210} color={soft('light')}>yesterday</Chip>
      <Word x={1180} y={330} id="dhahabtu-hadiqa" color={C.i} size={60}>ذَهَبْتُ</Word>
      {lines >= 2 && (
        <>
          <Tag x={1000} y={430} letters="ـْتُ" who="I" color={C.i} side="back" delay={0.2} />
          <Svg><Draw d="M 1040 400 Q 1060 370 1085 350" color={C.i} width={3} dash="3 9" delay={0.5} dur={0.5} /></Svg>
        </>
      )}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 1340, top: 300, width: 64, height: 64, background: CRIMSON, color: '#fff', fontSize: 34, boxShadow: SHADOW }}
          initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.6, delay: 0.3 }}>?</motion.span>
      )}
    </>
  );
}

/** The same school morning three days running. */
export function Fv2MondayGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const days = ['Monday', 'Tuesday', 'Wednesday'];
  return (
    <>
      {lines < 3 && <Cut src={`${CAST}/jiddo-stand`} x={880} y={820} h={290} />}
      {lines < 3 && <Cut src={`${CAST}/yusuf-brave`} x={1040} y={820} h={250} delay={0.15} />}
      {days.map((d, i) => (lines >= 2 || i === 0) && (
        <motion.div key={d} className="pointer-events-none absolute flex flex-col items-center rounded-[22px]" style={{ left: lines >= 2 ? 1050 + i * 120 : 1170, top: 200, width: 110, padding: '10px 0', background: CARD, boxShadow: `0 0 0 3px ${GOLD}66, ${SHADOW}` }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.3, duration: 0.6, ease }}>
          <span className="font-sans font-bold" style={{ fontSize: 16, color: INK_TEXT }}>{d}</span>
          <Icon name="bag" size={50} color={GOLD} />
        </motion.div>
      ))}
      {lines >= 2 && <Loop x={1230} y={460} r={60} delay={1} />}
      {lines >= 2 && <Chip x={1230} y={545} color={GOLD} delay={1.4}>every day</Chip>}
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/maryam-point`} x={950} y={820} h={260} />
          <Mic x={1010} y={640} delay={0.4} />
          <Cut src={`${CAST}/yusuf-surprised`} x={1400} y={820} h={250} delay={0.2} />
        </>
      )}
    </>
  );
}

/** Maryam interviews Yusuf; each answer brings its pictures. */
export function Fv2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={900} y={820} h={260} />
      <Mic x={960} y={640} />
      <Cut src={`${CAST}/${k === 2 ? 'yusuf-point' : 'yusuf-brave'}`} x={1400} y={820} h={260} />
      {k === 3 && <Cut src={`${CAST}/jiddo-explain`} x={1170} y={820} h={290} delay={0.2} />}
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={900} y={530} id="story-1" text="مَتَى تَذْهَبُ إِلَى ٱلْمَدْرَسَةِ يَا يُوسُفُ؟" width={420} size={26} delay={0.3} />
          <SayBubble x={1400} y={400} id="story-2" text="أَذْهَبُ فِي ٱلصَّبَاحِ." align="right" width={260} size={28} accent delay={1.8} />
          <Pic x={1250} y={240} icon="sun" color={GOLD} s={80} delay={2.2} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={900} y={530} id="story-3" text="وَمَاذَا تَفْعَلُ هُنَاكَ؟" width={290} size={28} delay={0.3} />
          <SayBubble x={1400} y={400} id="story-4" text="أَكْتُبُ، وَأَقْرَأُ، وَأَلْعَبُ!" align="right" width={330} size={28} accent delay={1.8} />
          <Pic x={1080} y={240} icon="pen" color={TEAL} s={74} delay={2.2} />
          <Pic x={1190} y={240} icon="book" color={CRIMSON} s={74} delay={2.4} />
          <Pic x={1300} y={240} icon="ball" color={GOLD} s={74} delay={2.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={900} y={530} id="story-5" text="وَجِدِّي يَذْهَبُ إِلَى ٱلْمَسْجِدِ." width={340} size={26} delay={0.3} />
          <Pic x={1430} y={250} icon="moon" color={TEAL} s={80} label="evening" delay={1.6} />
          <SayBubble x={1170} y={460} id="story-6" text="وَفِي ٱلْمَسَاءِ نَأْكُلُ مَعًا." width={300} size={26} accent delay={1.8} />
        </React.Fragment>
      )}
    </>
  );
}

/** Sun and moon go round: every day. Then أَذْهَبُ arrives with its front tag. */
export function Fv2IGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-brave`} x={900} y={820} h={270} />
      <Loop x={1300} y={290} r={90} />
      <Pic x={1210} y={290} icon="sun" color={GOLD} s={70} delay={0.4} />
      <Pic x={1390} y={290} icon="moon" color={TEAL} s={70} delay={0.7} />
      {lines >= 2 && (
        <>
          <Word x={1220} y={470} id="adhhabu" color={C.i} size={64}>أَذْهَبُ</Word>
          <Tag x={1420} y={400} letters="أَ" who="I" color={C.i} delay={0.6} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1220} y={535} color={GOLD} delay={0.8}>كُلَّ يَوْمٍ · every day</Chip>
          <SayBubble x={1020} y={660} id="adhhabu-kulla-yawm" text="أَذْهَبُ إِلَى ٱلْمَدْرَسَةِ كُلَّ يَوْمٍ." width={430} size={26} delay={0.3} />
        </>
      )}
    </>
  );
}

/** Jiddo: يَـ. Maryam: تَـ. Then the same تَـ pointed at a boy: you. */
export function Fv2HeSheGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-stand`} x={890} y={820} h={290} />
      <Word x={890} y={400} id="yadhhabu" color={C.he} size={46}>يَذْهَبُ</Word>
      <Tag x={890} y={300} letters="يَـ" who="he" color={C.he} delay={0.5} />
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/maryam-stand`} x={1150} y={820} h={260} delay={0.1} />
          <Word x={1150} y={430} id="tadhhabu-maryam" color={C.she} size={46} delay={0.3}>تَذْهَبُ</Word>
          <Tag x={1150} y={330} letters="تَـ" who="she" color={C.she} delay={0.8} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/yusuf-stand`} x={1410} y={820} h={250} delay={0.1} />
          <Svg><Draw d="M 1240 620 Q 1320 560 1380 600" color={C.youM} width={3} dash="3 10" delay={0.3} dur={0.7} /></Svg>
          <Word x={1410} y={440} id="tadhhabu-anta" color={C.youM} size={46} delay={0.6}>تَذْهَبُ</Word>
          <Tag x={1410} y={340} letters="تَـ" who="you" color={C.youM} delay={1} />
        </>
      )}
    </>
  );
}

/** The family in one circle: نَذْهَبُ, and yesterday's ذَهَبْنَا above it, its tag at the other end. */
export function Fv2WeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 800, top: 540, width: 470, height: 310, border: `4px solid ${C.we}`, background: `${C.we}14` }}
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease }} />
      <Cut src={`${CAST}/yusuf-brave`} x={890} y={820} h={230} />
      <Cut src={`${CAST}/jiddo-stand`} x={1035} y={820} h={270} delay={0.1} />
      <Cut src={`${CAST}/maryam-happy`} x={1180} y={820} h={230} delay={0.2} />
      <Word x={1035} y={440} id="nadhhabu" color={C.we} size={56} delay={0.5}>نَذْهَبُ</Word>
      <Tag x={1250} y={440} letters="نَـ" who="we" color={C.we} delay={0.9} />
      {lines >= 2 && (
        <>
          <Word x={1035} y={250} color={C.we} size={38} dim>ذَهَبْنَا</Word>
          <Tag x={860} y={250} letters="ـْنَا" color={C.we} side="back" delay={0.4} />
          <Chip x={1035} y={180} color={soft('light')} delay={0.2}>yesterday</Chip>
        </>
      )}
      {lines >= 3 && <Pic x={1410} y={520} icon="moon" color={C.we} s={100} label="masjid · Friday" delay={0.2} />}
      {lines >= 3 && <SayBubble x={1380} y={360} id="nadhhabu-masjid" text="نَذْهَبُ إِلَى ٱلْمَسْجِدِ مَعًا." align="right" width={320} size={24} delay={0.6} />}
    </>
  );
}

/** The wow: yesterday and every day side by side; the "who" travels from the back of one word to the front of the other. */
export function Fv2FrontGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {[{ x: 790, label: 'yesterday', c: '#8B7B6A' }, { x: 1160, label: 'every day', c: GOLD }].map((p, i) => (
        <motion.div key={p.label} className="pointer-events-none absolute flex flex-col items-center rounded-[28px]" style={{ left: p.x, top: 200, width: 350, height: 470, background: `${p.c}12`, boxShadow: `inset 0 0 0 3px ${p.c}55` }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3, duration: 0.6, ease }}>
          <span className="mt-4 font-sans font-black uppercase" style={{ fontSize: 20, letterSpacing: 2, color: p.c }}>{p.label}</span>
        </motion.div>
      ))}
      <Pic x={965} y={290} icon="clock" color="#8B7B6A" s={70} delay={0.5} />
      <Loop x={1335} y={300} r={36} delay={0.6} />
      {lines >= 2 && (
        <>
          <Chip x={965} y={360} color="#8B7B6A" delay={1.2}>who at the back</Chip>
          <Chip x={1335} y={360} color={GOLD} delay={1.4}>who at the front</Chip>
          <Word x={965} y={460} color={C.i} size={52}>ذَهَبْتُ</Word>
          <Tag x={860} y={550} letters="ـْتُ" who="I" color={C.i} side="back" delay={0.4} />
          <Word x={1335} y={460} color={C.i} size={52} delay={0.6}>أَذْهَبُ</Word>
          <Tag x={1440} y={550} letters="أَ" who="I" color={C.i} delay={1} />
        </>
      )}
      {lines >= 3 && (
        <Svg>
          <Draw d="M 860 585 C 920 760, 1380 760, 1440 585" color={CRIMSON} width={4} dash="4 10" delay={0.2} dur={1.4} glow />
        </Svg>
      )}
      {lines >= 3 && <Chip x={1150} y={760} color={CRIMSON} delay={1.2}>look at the start of the verb</Chip>}
    </>
  );
}

/** Three present verbs; the same front tags slide onto each and the word swaps to its new form. */
export function Fv2VerbsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { base: 'يَكْتُبُ', baseId: 'yaktubu', icon: 'pen', form: 'أَكْتُبُ', formId: 'aktubu', tag: 'أَ', who: 'I', c: C.i, y: 260, step: 2 },
    { base: 'يَلْعَبُ', baseId: 'yalabu', icon: 'ball', form: 'تَلْعَبُ', formId: 'talabu', tag: 'تَـ', who: 'she', c: C.she, y: 460, step: 3 },
    { base: 'يَشْرَبُ', baseId: 'yashrabu', icon: 'cup', form: 'نَشْرَبُ', formId: 'nashrabu', tag: 'نَـ', who: 'we', c: C.we, y: 660, step: 3 },
  ];
  return (
    <>
      {rows.map((r, i) => (
        <React.Fragment key={r.base}>
          <Pic x={1450} y={r.y} icon={r.icon} color={r.c} s={80} delay={0.1 + i * 0.15} />
          <Word x={1290} y={r.y} id={r.baseId} color={C.he} size={42} delay={0.2 + i * 0.15}>{r.base}</Word>
          {lines >= r.step && (
            <>
              <Svg><Draw d={`M 1200 ${r.y} L 1100 ${r.y}`} color={r.c} width={4} delay={i === 2 ? 0.6 : 0.2} dur={0.5} /></Svg>
              <Word x={980} y={r.y} id={r.formId} color={r.c} size={42} delay={i === 2 ? 0.9 : 0.5}>{r.form}</Word>
              <Tag x={980} y={r.y - 80} letters={r.tag} who={r.who} color={r.c} delay={i === 2 ? 1.1 : 0.7} />
            </>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export function Fv2TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={900} y={820} h={260} />
      <Mic x={960} y={640} />
      <Cut src={`${CAST}/yusuf-brave`} x={1400} y={820} h={260} delay={0.2} />
      {lines >= 1 && <SayBubble x={900} y={530} id="mata-tadhhabu" text="مَتَى تَذْهَبُ إِلَى ٱلْعَمَلِ؟" width={330} size={26} delay={0.3} />}
      {lines >= 2 && (
        <>
          <SayBubble x={1400} y={400} text="أَذْهَبُ... أَكْتُبُ... أَلْعَبُ..." align="right" width={330} size={26} accent delay={0.3} />
          <Tag x={1240} y={240} letters="أَ" who="I" color={C.i} delay={0.8} />
        </>
      )}
    </>
  );
}

/** Morning at the front door; night at the table. */
export function Fv2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-t-[70px]" style={{ left: 1260, top: 380, width: 170, height: 430, background: '#8B5A36' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
        <span className="absolute rounded-full" style={{ left: 22, top: 220, width: 14, height: 14, background: GOLD }} />
      </motion.div>
      <Cut src={`${CAST}/yusuf-brave`} x={1080} y={820} h={280} />
      <Pic x={880} y={300} icon="sun" color={GOLD} s={80} delay={0.3} />
      <SayBubble x={1080} y={520} text="أَذْهَبُ إِلَى ٱلْمَدْرَسَةِ." width={300} size={28} accent delay={0.5} />
      {lines >= 2 && (
        <>
          <Pic x={1440} y={250} icon="moon" color={TEAL} s={80} delay={0.2} />
          <Word x={1160} y={250} color={C.we} size={36} delay={0.5}>نَأْكُلُ مَعًا</Word>
        </>
      )}
    </>
  );
}

/** Jiddo's old photo album: two people in a frame, my father and my brother. */
export function Fv2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-sit`} x={900} y={820} h={260} />
      <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1120, top: 220, width: 370, height: 320, background: '#EFE3CC', boxShadow: `0 0 0 14px ${CARD}, ${SHADOW}`, filter: 'sepia(0.4)' }}
        initial={{ opacity: 0, rotate: -6, y: 30 }} animate={{ opacity: 1, rotate: -2, y: 0 }} transition={{ duration: 0.9, ease }} />
      {lines >= 2 && (
        <>
          <Person x={1240} y={520} scale={0.85} color="#8B5A36" delay={0.2} />
          <Person x={1390} y={520} scale={0.7} color={TEAL} delay={0.4} />
          <Chip x={1240} y={570} color="#8B5A36" delay={0.8}>أَبِي · my father</Chip>
          <Chip x={1400} y={620} color={TEAL} delay={1}>أَخِي · my brother</Chip>
          <SayBubble x={830} y={560} id="haadha-abi" text="هَذَا أَبِي، وَهَذَا أَخِي." width={280} size={26} delay={0.6} />
        </>
      )}
      {lines >= 3 && <Chip x={1300} y={180} color={CRIMSON} delay={0.3}>family words that change their ending</Chip>}
    </>
  );
}

/* =================== 12+ =================== */

const DAYS = ['السبت', 'الأحد', 'الإثنين'];

/** The new timetable pinned on the board: three days × morning/evening; `cells` fills in icons by key. */
function Timetable({ x = 820, y = 190, cells = {}, hot }: { x?: number; y?: number; cells?: Record<string, { icon: string; color: string }>; hot?: number }) {
  const W = 640;
  const colW = (W - 120) / 3;
  return (
    <motion.div className="pointer-events-none absolute rounded-[20px]" style={{ left: x, top: y, width: W, height: 290, background: CARD, boxShadow: SHADOW, border: '2px solid #E6D8C0' }}
      initial={{ opacity: 0, y: -20, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.8, ease }}>
      {DAYS.map((d, i) => (
        <div key={d} className="absolute flex items-center justify-center" style={{ right: i * colW, top: 0, width: colW, height: 60, background: hot === i ? `${GOLD}33` : undefined, borderRadius: 14 }}>
          <ArText size={26} color={INK_TEXT}>{d}</ArText>
        </div>
      ))}
      {['morning', 'evening'].map((r, j) => (
        <div key={r} className="absolute flex items-center font-sans font-bold" style={{ left: 14, top: 80 + j * 105, height: 90, fontSize: 17, color: soft('light') }}>{r}</div>
      ))}
      {Object.entries(cells).map(([k, v]) => {
        const [i, j] = k.split('-').map(Number);
        return (
          <motion.div key={k} className="absolute flex items-center justify-center rounded-[14px]" style={{ right: i * colW + 8, top: 72 + j * 105, width: colW - 16, height: 92, background: `${v.color}1f`, boxShadow: `inset 0 0 0 2px ${v.color}` }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.3 }}>
            <Icon name={v.icon} size={44} color={v.color} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function Class({ dim = false }: { dim?: boolean }) {
  return (
    <>
      <Person x={890} y={800} scale={1.02} color={KAREEM} dim={dim} />
      <Person x={1150} y={800} scale={1} color={GOLD} hijab delay={0.15} dim={dim} />
      <Person x={1400} y={800} scale={1} color={TEAL} delay={0.3} dim={dim} />
    </>
  );
}

export function Fw2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Timetable cells={{ '0-0': { icon: 'book', color: C.she }, '1-1': { icon: 'bag', color: C.she } }} />
      <Person x={1150} y={800} scale={1.05} color={GOLD} hijab />
      <Word x={1080} y={560} color={C.she} size={46} delay={0.9}>تَدْرُسُ</Word>
      <Tag x={1250} y={560} letters="تَـ" who="she" color={C.she} delay={1.3} />
    </>
  );
}

export function Fw2WeekGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Timetable />
      <Class />
      {lines >= 2 && <SayBubble x={890} y={560} text="؟" width={80} delay={0.2} />}
      {lines >= 2 && <Chip x={1150} y={500} color={KAREEM} delay={0.4}>a study group: when?</Chip>}
      {lines >= 3 && <Chip x={1150} y={548} color={CRIMSON} delay={0.3}>listen to how the verbs begin</Chip>}
    </>
  );
}

export function Fw2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  const cells: Record<string, { icon: string; color: string }> = {};
  if (k >= 1) { cells['0-0'] = { icon: 'book', color: GOLD }; cells['2-0'] = { icon: 'book', color: GOLD }; cells['0-1'] = { icon: 'bag', color: GOLD }; cells['2-1'] = { icon: 'bag', color: GOLD }; }
  if (k >= 2) { cells['1-0'] = { icon: 'ball', color: TEAL }; }
  if (k >= 3) { cells['1-1'] = { icon: 'book', color: KAREEM }; }
  return (
    <>
      <Timetable cells={cells} hot={k >= 3 ? 1 : undefined} />
      <Class />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={890} y={540} id="story-1" text="مَتَى تَدْرُسِينَ يَا سَارَةُ؟" width={290} size={24} delay={0.3} />
          <SayBubble x={1190} y={620} id="story-2" text="أَدْرُسُ فِي ٱلصَّبَاحِ، وَأَعْمَلُ فِي ٱلْمَسَاءِ." align="right" width={360} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={890} y={540} id="story-3" text="وَأَنْتَ يَا يُوسُفُ؟" width={220} size={24} delay={0.3} />
          <SayBubble x={1440} y={620} id="story-4" text="أَلْعَبُ كُرَةَ ٱلْقَدَمِ فِي ٱلصَّبَاحِ." align="right" width={330} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={890} y={540} id="story-5" text="إِذَنْ نَدْرُسُ مَعًا يَوْمَ ٱلْأَحَدِ." width={330} size={24} delay={0.3} />
          <SayBubble x={1460} y={630} id="story-6" text="وَبَعْدَ ٱلدَّرْسِ يَذْهَبُ ٱلطُّلَّابُ إِلَى ٱلْمَكْتَبَةِ." align="right" width={380} size={20} delay={2} />
        </React.Fragment>
      )}
    </>
  );
}

/** Four letters stand in a column; each one joins دْرُسُ to make a word; then they read down as أَنَيْتُ. */
export function Fw2LettersGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { l: 'أَ', w: 'أَدْرُسُ', id: 'adrusu', who: 'I', c: C.i },
    { l: 'نَـ', w: 'نَدْرُسُ', id: 'nadrusu', who: 'we', c: C.we },
    { l: 'يَـ', w: 'يَدْرُسُ', id: 'yadrusu', who: 'he', c: C.he },
    { l: 'تَـ', w: 'تَدْرُسُ', id: 'tadrusu', who: 'she · you', c: C.she },
  ];
  return (
    <>
      <Word x={1000} y={170} color={C.i} size={34} dim>دَرَسْتُ</Word>
      <Chip x={1000} y={215} color={soft('light')}>past: who at the back</Chip>
      {lines >= 2 && rows.map((r, i) => (
        <React.Fragment key={r.l}>
          <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-[18px]" style={{ left: 1390, top: 270 + i * 120, width: 90, height: 90, background: r.c, boxShadow: SHADOW }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i, type: 'spring', bounce: 0.4 }}>
            <ArText size={46} color="#fff">{r.l}</ArText>
          </motion.span>
          <Word x={1180} y={315 + i * 120} id={r.id} color={r.c} size={44} delay={0.4 + 0.15 * i}>{r.w}</Word>
          <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 880, top: 298 + i * 120, fontSize: 24, color: r.c }}>{r.who}</span>
        </React.Fragment>
      ))}
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 1435 260 L 1435 740" color={CRIMSON} width={4} delay={0.2} dur={0.9} /></Svg>
          <Word x={1435} y={775} id="anaytu" color={CRIMSON} size={40} delay={1}>أَنَيْتُ</Word>
        </>
      )}
    </>
  );
}

/** Five rows for one person each; the last one grows a tag at both ends. */
export function Fw2OneGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { p: 'أَنَا', w: 'أَدْرُسُ', c: C.i, step: 1 },
    { p: 'هُوَ', w: 'يَدْرُسُ', c: C.he, step: 1 },
    { p: 'هِيَ', w: 'تَدْرُسُ', c: C.she, step: 1 },
    { p: 'أَنْتَ', w: 'تَدْرُسُ', c: C.youM, step: 2 },
  ];
  return (
    <>
      {rows.map((r, i) => lines >= r.step && (
        <React.Fragment key={r.p}>
          <span className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: 1360, top: 190 + i * 100, width: 120, height: 76, background: r.c, boxShadow: SHADOW }}><ArText size={30} color="#fff">{r.p}</ArText></span>
          <Word x={1180} y={228 + i * 100} color={r.c} size={40} delay={0.1 * i}>{r.w}</Word>
        </React.Fragment>
      ))}
      {lines >= 2 && <Svg><Draw d="M 1060 330 C 1010 360, 1010 500, 1060 530" color={CRIMSON} width={3} dash="3 8" delay={0.4} dur={0.7} /></Svg>}
      {lines >= 2 && <Chip x={940} y={410} color={CRIMSON} delay={0.8}>same word: context decides</Chip>}
      {lines >= 3 && (
        <>
          <span className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: 1360, top: 600, width: 120, height: 76, background: C.youF, boxShadow: SHADOW }}><ArText size={30} color="#fff">أَنْتِ</ArText></span>
          <Word x={1150} y={638} id="tadrusina" color={C.youF} size={46} delay={0.2}>تَدْرُسِينَ</Word>
          <Tag x={1290} y={735} letters="تَـ" color={C.youF} delay={0.6} />
          <Tag x={1010} y={735} letters="ـِينَ" color={C.youF} side="back" delay={0.9} />
        </>
      )}
    </>
  );
}

/** We, you all, they: the front letter, and for two of them ـُونَ at the back. */
export function Fw2ManyGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={880} y={810} scale={0.7} color={C.they} />
      <Person x={950} y={810} scale={0.7} color={C.they} delay={0.1} />
      <Person x={1020} y={810} scale={0.7} color={C.they} hijab delay={0.2} />
      <span className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: 1360, top: 200, width: 120, height: 76, background: C.we, boxShadow: SHADOW }}><ArText size={30} color="#fff">نَحْنُ</ArText></span>
      <Word x={1180} y={238} color={C.we} size={44}>نَدْرُسُ</Word>
      <Tag x={1180} y={320} letters="نَـ" who="front only" color={C.we} delay={0.5} />
      {lines >= 2 && [
        { p: 'أَنْتُمْ', w: 'تَدْرُسُونَ', id: 'tadrusuna', c: C.youPl, y: 430, f: 'تَـ' },
        { p: 'هُمْ', w: 'يَدْرُسُونَ', id: 'yadrusuna', c: C.they, y: 580, f: 'يَـ' },
      ].map((r, i) => (
        <React.Fragment key={r.p}>
          <span className="pointer-events-none absolute flex items-center justify-center rounded-[14px]" style={{ left: 1360, top: r.y - 38, width: 120, height: 76, background: r.c, boxShadow: SHADOW }}><ArText size={30} color="#fff">{r.p}</ArText></span>
          <Word x={1160} y={r.y} id={r.id} color={r.c} size={44} delay={0.2 + i * 0.3}>{r.w}</Word>
          <Tag x={1300} y={r.y + 70} letters={r.f} color={r.c} delay={0.6 + i * 0.3} />
          <Tag x={960} y={r.y} letters="ـُونَ" color={r.c} side="back" delay={0.9 + i * 0.3} />
        </React.Fragment>
      ))}
      {lines >= 3 && <Chip x={960} y={480} color={C.they} delay={0.3}>ـُونَ = more than one</Chip>}
    </>
  );
}

/** Two tables, past and present, the same eight people, read across. */
export function Fw2BothGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    ['أَنَا', 'دَرَسْتُ', 'أَدْرُسُ', C.i, 0], ['أَنْتَ', 'دَرَسْتَ', 'تَدْرُسُ', C.youM, 0], ['أَنْتِ', 'دَرَسْتِ', 'تَدْرُسِينَ', C.youF, 1], ['هُوَ', 'دَرَسَ', 'يَدْرُسُ', C.he, 0],
    ['هِيَ', 'دَرَسَتْ', 'تَدْرُسُ', C.she, 0], ['نَحْنُ', 'دَرَسْنَا', 'نَدْرُسُ', C.we, 0], ['أَنْتُمْ', 'دَرَسْتُمْ', 'تَدْرُسُونَ', C.youPl, 1], ['هُمْ', 'دَرَسُوا', 'يَدْرُسُونَ', C.they, 1],
  ] as const;
  return (
    <>
      <span className="pointer-events-none absolute font-sans font-black uppercase" style={{ left: 1150, top: 160, fontSize: 16, letterSpacing: 2, color: '#8B7B6A' }}>past</span>
      <span className="pointer-events-none absolute font-sans font-black uppercase" style={{ left: 880, top: 160, fontSize: 16, letterSpacing: 2, color: GOLD }}>present</span>
      {rows.map(([p, past, pres, c, both], i) => (
        <motion.div key={p} className="pointer-events-none absolute flex items-center" style={{ left: 820, top: 190 + i * 70, width: 680, height: 60, flexDirection: 'row-reverse', gap: 14 }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i, duration: 0.4, ease }}>
          <span className="flex items-center justify-center rounded-[12px]" style={{ width: 110, height: 54, background: c }}><ArText size={24} color="#fff">{p}</ArText></span>
          <span className="flex items-center justify-center rounded-[12px]" style={{ width: 220, height: 54, background: CARD, boxShadow: SHADOW }}><ArText size={30} color={c}>{past}</ArText></span>
          {lines >= 2 && (
            <motion.span className="flex items-center justify-center rounded-[12px]" style={{ width: 240, height: 54, background: CARD, boxShadow: both && lines >= 2 ? `0 0 0 3px ${c}, ${SHADOW}` : SHADOW }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + 0.06 * i }}>
              <ArText size={30} color={c}>{pres}</ArText>
            </motion.span>
          )}
        </motion.div>
      ))}
      {lines >= 3 && (
        <>
          <Chip x={1000} y={760} color={GOLD} delay={0.2}>first letter = the time</Chip>
          <Chip x={1290} y={760} color={C.they} delay={0.5}>last letters = how many</Chip>
        </>
      )}
    </>
  );
}

/** Three verb pairs; the middle vowel of each present lights up with its sound. */
export function Fw2PairsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const pairs = [
    { past: 'ذَهَبَ', pres: 'يَذْهَبُ', v: 'a', id: 'dhahaba-yadhhabu', c: TEAL },
    { past: 'كَتَبَ', pres: 'يَكْتُبُ', v: 'u', id: 'kataba-yaktubu', c: CRIMSON },
    { past: 'جَلَسَ', pres: 'يَجْلِسُ', v: 'i', id: 'jalasa-yajlisu', c: GOLD },
  ];
  return (
    <>
      <Chip x={1150} y={180} color={soft('light')}>the middle vowel of the present</Chip>
      {lines >= 2 && pairs.map((p, i) => (
        <React.Fragment key={p.past}>
          <Word x={1360} y={300 + i * 150} color={INK_TEXT} size={42} delay={0.2 + i * 0.3} ring={false}>{p.past}</Word>
          <Svg><Draw d={`M 1270 ${300 + i * 150} L 1170 ${300 + i * 150}`} color={p.c} width={4} delay={0.4 + i * 0.3} dur={0.4} /></Svg>
          <Word x={1060} y={300 + i * 150} id={p.id} color={p.c} size={42} delay={0.6 + i * 0.3}>{p.pres}</Word>
          <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 870, top: 300 + i * 150 - 26, width: 52, height: 52, background: p.c, color: '#fff', fontSize: 26 }}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.3, type: 'spring', bounce: 0.5 }}>{p.v}</motion.span>
        </React.Fragment>
      ))}
      {lines >= 3 && <Chip x={1150} y={720} color={CRIMSON} delay={0.3}>learn every verb as a pair</Chip>}
    </>
  );
}

export function Fw2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Timetable />
      <Person x={900} y={800} scale={1.02} color={KAREEM} />
      <Person x={1400} y={800} scale={1} color={TEAL} delay={0.2} />
      {lines >= 1 && <SayBubble x={900} y={560} id="mata-tadrusu" text="مَتَى تَدْرُسُ؟" width={200} size={28} delay={0.3} />}
      {lines >= 2 && <SayBubble x={1400} y={560} text="نَدْرُسُ مَعًا يَوْمَ..." align="right" width={280} size={26} accent delay={0.3} />}
    </>
  );
}

export function Fw2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 900, top: 190, width: 540, height: 560, background: CARD, boxShadow: SHADOW, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 63px, #E6D8C0 63px 65px)' }}
        initial={{ opacity: 0, rotate: 3, y: 30 }} animate={{ opacity: 1, rotate: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      {['أَدْرُسُ فِي ٱلصَّبَاحِ.', 'أَعْمَلُ يَوْمَ ٱلسَّبْتِ.', 'أَكْتُبُ فِي ٱلْمَسَاءِ.'].map((t, i) => (
        <motion.span key={t} className="pointer-events-none absolute" style={{ right: 1600 - 1400, top: 250 + i * 65 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.3 }}>
          <ArText size={34} color={C.i}>{t}</ArText>
        </motion.span>
      ))}
      {lines >= 2 && (
        <motion.span className="pointer-events-none absolute" style={{ right: 1600 - 1400, top: 250 + 3 * 65 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <ArText size={34} color={C.they}>أَصْدِقَائِي يَلْعَبُونَ.</ArText>
        </motion.span>
      )}
    </>
  );
}

/** Sara's video call: her family on a phone screen. */
export function Fw2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1.02} color={GOLD} hijab />
      <motion.div className="pointer-events-none absolute overflow-hidden rounded-[36px]" style={{ left: 1170, top: 200, width: 300, height: 540, background: 'linear-gradient(180deg, #2E3D48, #4A5D6A)', boxShadow: `0 0 0 10px ${INK_TEXT}, ${SHADOW}` }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      <Person x={1260} y={600} scale={0.6} color={TEAL} delay={0.4} />
      {lines >= 2 && <Person x={1380} y={640} scale={0.85} color="#8B5A36" delay={0.2} />}
      {lines >= 2 && <SayBubble x={900} y={560} text="هَذَا أَخِي... وَهَذَا أَبِي." width={300} size={26} delay={0.5} />}
      {lines >= 2 && <Chip x={1320} y={680} color={GOLD} delay={1.2}>أَبُو سَارَةَ</Chip>}
      {lines >= 3 && <Chip x={1320} y={765} color={CRIMSON} delay={0.3}>five nouns, a special ending</Chip>}
    </>
  );
}
