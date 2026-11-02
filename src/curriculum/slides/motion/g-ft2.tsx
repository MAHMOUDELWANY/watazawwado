import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, PAPER, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Badge, Icon } from './kit';
import { ArText, SayBubble, WordTile, ObjectCard } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · 12+ · Lesson 2 · Is This Your Room? Teens stage; faceless people: Yusuf (teal), Sara (gold, hijab), Ustadh
 * Kareem (olive). A power cut on Yusuf's first night in the dorm: the torch beam is the page's hero, it lands on a thing
 * and the answer comes with the light. The motion carries the one idea: Arabic asks by adding أَ in front, nothing moves.
 */

const YUSUF = TEAL;
const SARA = GOLD;
const KAREEM = '#6E8B5A';
const GROUND = 800;
const CARD = '#FFFDF8';

/** A torch beam from (fx, fy) that lights a circle at (tx, ty); the thing under it shows inside the light. */
function Beam({ fx, fy, tx, ty, r = 120, children, delay = 0 }: { fx: number; fy: number; tx: number; ty: number; r?: number; children?: React.ReactNode; delay?: number }) {
  const a = Math.atan2(ty - fy, tx - fx) + Math.PI / 2;
  const p1 = [tx + Math.cos(a) * r, ty + Math.sin(a) * r];
  const p2 = [tx - Math.cos(a) * r, ty - Math.sin(a) * r];
  return (
    <motion.div key={`${tx}-${ty}`} className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay, ease }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900">
        <defs>
          <radialGradient id="ft2glow"><stop offset="0%" stopColor="#FFF2C8" stopOpacity="0.95" /><stop offset="100%" stopColor="#FFF2C8" stopOpacity="0" /></radialGradient>
        </defs>
        <polygon points={`${fx},${fy} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill="#FFF2C8" opacity={0.18} />
        <circle cx={tx} cy={ty} r={r * 1.15} fill="url(#ft2glow)" />
      </svg>
      <div className="absolute" style={{ left: tx, top: ty, transform: 'translate(-50%, -50%)' }}>{children}</div>
    </motion.div>
  );
}

/** A thing as the torch finds it: the icon and, once named, its word. */
function Found({ icon, word, id }: { icon: string; word?: string; id?: string }) {
  return (
    <div className="flex flex-col items-center">
      <Icon name={icon} size={120} color="#3A2A22" width={1.6} />
      {word && <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>{id ? <Hear id={id}><ArText size={40}>{word}</ArText></Hear> : <ArText size={40}>{word}</ArText>}</motion.span>}
    </div>
  );
}

/* ---------- spark ---------- */

/** A dark dorm room; a torch beam finds the bed, and the lesson's question hangs over it. */
export function Ft2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Person x={1450} y={GROUND} scale={1.05} color={KAREEM} />
      <Beam fx={1420} fy={620} tx={1080} ty={420} r={140} delay={0.8}><Found icon="bed" /></Beam>
      <motion.div className="absolute" style={{ left: 940, top: 220 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}>
        <span className="inline-block rounded-[20px]" style={{ padding: '2px 22px', background: CARD }}><ArText size={46}>أَهَذَا سَرِيرٌ؟</ArText></span>
      </motion.div>
    </>
  );
}

/** Sara holds up a phone; Yusuf checks an empty pocket; his first sure word. */
export function Ft2PhoneGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1000} y={GROUND} scale={1.05} color={YUSUF} />
      <Person x={1350} y={GROUND} scale={1.0} color={SARA} hijab flip />
      <motion.div className="absolute" style={{ left: 1230, top: 560 }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
        <Icon name="phone" size={64} color={CRIMSON} width={2} />
      </motion.div>
      {lines >= 1 && lines < 3 && <SayBubble x={1350} y={520} id="a-haadha-haatifuka" text="أَهَذَا هَاتِفُكَ؟" align="right" width={260} delay={0.3} />}
      {lines === 2 && <SayBubble x={1000} y={540} text="…" thought width={110} delay={0.2} latin />}
      {lines >= 2 && <Chip x={1000} y={680} color={soft('light')} delay={0.4}>empty pocket</Chip>}
      {lines >= 3 && (
        <>
          <SayBubble x={1000} y={520} id="naam" text="نَعَمْ!" width={150} accent />
          <SayBubble x={1000} y={400} id="shukran" text="شُكْرًا." width={170} delay={1.2} />
        </>
      )}
    </>
  );
}

/** Lights out: each guess is followed by the beam landing on the real thing; the third guess brings the light back. */
export function Ft2DarkGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      {k >= 3 && <motion.div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(70% 70% at 70% 40%, ${PAPER}, ${PAPER}00)` }} initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ duration: 1.2, delay: 1.6 }} />}
      <Person x={880} y={GROUND} scale={1.0} color={YUSUF} />
      <Person x={1460} y={GROUND} scale={1.05} color={KAREEM} />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={880} y={540} id="d-1" text="أَهَذَا سَرِيرٌ؟" width={230} delay={0.2} />
          <Beam fx={1430} fy={620} tx={1130} ty={420} r={120} delay={1}><Found icon="desk" /></Beam>
          <SayBubble x={1460} y={540} id="d-2" text="لَا، هَذَا مَكْتَبٌ." align="right" width={260} delay={1.8} accent />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={880} y={540} id="d-3" text="أَهَذِهِ نَافِذَةٌ؟" width={240} delay={0.2} />
          <Beam fx={1430} fy={620} tx={1150} ty={320} r={120} delay={1}><Found icon="window" /></Beam>
          <SayBubble x={1460} y={540} id="d-4" text="نَعَمْ، هَذِهِ نَافِذَةٌ." align="right" width={280} delay={1.8} accent />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={880} y={540} id="d-5" text="أَهَذَا بَابٌ؟" width={210} delay={0.2} />
          <Beam fx={1430} fy={620} tx={1160} ty={430} r={120} delay={0.8}><Found icon="door" /></Beam>
          <SayBubble x={1460} y={540} id="d-6" text="نَعَمْ! وَهَذَا نُورٌ!" align="right" width={270} delay={1.6} accent />
        </React.Fragment>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** English shuffles two words to ask; Arabic leaves its words alone and adds one letter in front. */
export function Ft2HamzaGraphic({ lines }: GraphicProps) {
  const swapped = lines >= 1;
  const word = (t: string, x: number, hot = false) => (
    <motion.span key={t} className="absolute inline-block rounded-[14px] font-sans font-extrabold" style={{ top: 0, padding: '4px 14px', fontSize: 34, background: CARD, color: hot ? CRIMSON : INK_TEXT, boxShadow: '0 12px 24px -18px rgba(60,30,10,0.6)' }}
      initial={false} animate={{ left: x }} transition={{ duration: 0.9, ease }}>{t}</motion.span>
  );
  return (
    <>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 820, top: 190, fontSize: 15, letterSpacing: '0.16em', color: soft('light') }}>English</span>
      <div className="absolute" style={{ left: 820, top: 230, width: 680, height: 60 }}>
        {word(swapped ? 'Is' : 'This', 0, swapped)}
        {word(swapped ? 'this' : 'is', swapped ? 70 : 110, swapped)}
        {word('a', 200)}
        {word(swapped ? 'bed?' : 'bed.', 260)}
      </div>
      {swapped && <Chip x={1330} y={245} color={soft('light')} delay={0.4}>two words swap</Chip>}
      {lines >= 2 && (
        <>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 820, top: 380, fontSize: 15, letterSpacing: '0.16em', color: CRIMSON }}>Arabic</span>
          <div className="absolute flex items-center gap-4" dir="rtl" style={{ left: 820, top: 420, width: 680, justifyContent: 'center' }}>
            <motion.span className="inline-block rounded-[20px]" style={{ padding: '2px 18px', background: CARD, boxShadow: `0 0 0 4px ${CRIMSON}, 0 0 30px 6px ${CRIMSON}44` }}
              initial={{ x: -280, y: -140, rotate: -20, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 1.1, delay: 0.3 }}>
              <ArText size={64} color={CRIMSON}>أَ</ArText>
            </motion.span>
            <span className="inline-block rounded-[20px]" style={{ padding: '2px 18px', background: CARD, boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }}><Hear id="a-haadha-sarir"><ArText size={64}>هَذَا سَرِيرٌ</ArText></Hear></span>
            <motion.span className="font-sans font-black" style={{ fontSize: 64, color: CRIMSON }} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.9 }}>؟</motion.span>
          </div>
        </>
      )}
      {lines >= 3 && <Chip x={1160} y={560} color={TEAL} delay={0.2}>same words, same order, one letter more</Chip>}
      {lines >= 4 && (
        <>
          <Svg>
            <Draw d="M 880 700 C 1040 700, 1260 700, 1380 630" color={GOLD} width={6} dur={1} />
            <Draw d="M 1360 622 L 1386 630 L 1374 656" color={GOLD} width={6} delay={0.9} dur={0.3} />
          </Svg>
          <Chip x={1130} y={730} color={GOLD} delay={0.6}>voice rises · written joined: أَهَذَا</Chip>
        </>
      )}
    </>
  );
}

/** The question splits into two roads: yes and repeat, or no and correct; the no road leads on to مَا هَذَا؟ */
export function Ft2AnswersGraphic({ lines }: GraphicProps) {
  return (
    <>
      <WordTile x={1160} y={220} size={46}><Hear id="a-haadha-sarir">أَهَذَا سَرِيرٌ؟</Hear></WordTile>
      <Svg>
        {lines >= 1 && <Draw d="M 1220 270 Q 1340 330 1360 400" color={TEAL} width={4} dur={0.7} />}
        {lines >= 2 && <Draw d="M 1100 270 Q 980 330 960 400" color={CRIMSON} width={4} dur={0.7} />}
        {lines >= 3 && <Draw d="M 960 500 L 960 600" color={GOLD} width={4} dash="4 9" dur={0.6} />}
      </Svg>
      {lines >= 1 && (
        <motion.div className="absolute flex flex-col items-center gap-2" style={{ left: 1240, top: 400, width: 260 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <span className="rounded-full font-sans font-black text-white" style={{ padding: '4px 18px', fontSize: 20, background: TEAL }}>✓ yes</span>
          <span className="inline-block rounded-[16px]" style={{ padding: '2px 14px', background: CARD, boxShadow: `0 0 0 3px ${TEAL}` }}><Hear id="naam-hiya"><ArText size={30}>نَعَمْ، هَذِهِ نَافِذَةٌ.</ArText></Hear></span>
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute flex flex-col items-center gap-2" style={{ left: 830, top: 400, width: 260 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <span className="rounded-full font-sans font-black text-white" style={{ padding: '4px 18px', fontSize: 20, background: CRIMSON }}>✕ no</span>
          <span className="inline-block rounded-[16px]" style={{ padding: '2px 14px', background: CARD, boxShadow: `0 0 0 3px ${CRIMSON}` }}><Hear id="la-maktab"><ArText size={30}>لَا، هَذَا مَكْتَبٌ.</ArText></Hear></span>
        </motion.div>
      )}
      {lines >= 3 && <WordTile x={960} y={650} size={42} hot delay={0.4}><Hear id="maa-haadha">مَا هَذَا؟</Hear></WordTile>}
      {lines >= 3 && <Chip x={1240} y={640} color={GOLD} delay={0.7}>don't know the word? ask</Chip>}
    </>
  );
}

/** Yusuf's room in daylight: six things; the masculine ones ring teal, the feminine ones gold, as the ة shows. */
export function Ft2WordsGraphic({ lines, items }: GraphicProps) {
  const things = [
    { icon: 'bed', w: 'سَرِيرٌ', id: 'sarir', f: false }, { icon: 'lamp', w: 'مِصْبَاحٌ', id: 'misbah', f: false }, { icon: 'chair', w: 'كُرْسِيٌّ', id: 'kursi', f: false },
    { icon: 'wardrobe', w: 'خِزَانَةٌ', id: 'khizana', f: true }, { icon: 'pillow', w: 'وِسَادَةٌ', id: 'wisada', f: true }, { icon: 'mirror', w: 'مِرْآةٌ', id: 'mirah', f: true },
  ];
  const sorted = lines >= 2;
  return (
    <>
      {sorted && (
        <>
          <Chip x={815} y={300} color={TEAL}>هَذَا</Chip>
          <Chip x={815} y={550} color="#B07A1E">هَذِهِ</Chip>
        </>
      )}
      {things.slice(0, items).map((t, i) => (
        <ObjectCard key={t.icon} x={1380 - (i % 3) * 220} y={330 + Math.floor(i / 3) * 250} icon={t.icon} label={t.w} id={t.id} size={130} color={sorted ? (t.f ? '#B07A1E' : TEAL) : INK_TEXT} delay={0.05} />
      ))}
      {lines >= 1 && items === 0 && <Badge x={1150} y={430} name="house" size={120} color={TEAL} />}
    </>
  );
}

/* ---------- athar ---------- */

/** The beam finds something tall with two doors; Yusuf guesses; the learner answers for Kareem. */
export function Ft2TorchGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={880} y={GROUND} scale={1.0} color={YUSUF} />
      <Person x={1460} y={GROUND} scale={1.05} color={KAREEM} />
      <Beam fx={1430} fy={620} tx={1160} ty={380} r={140} delay={0.3}><Found icon="wardrobe" /></Beam>
      {lines >= 1 && <SayBubble x={880} y={540} id="a-haadha-sarir" text="أَهَذَا سَرِيرٌ؟" width={230} delay={0.5} />}
    </>
  );
}

/** The chain that teaches new words: guess, no, ask, learn, say it back; the loop closes on a new word. */
export function Ft2ChainGraphic({ lines }: GraphicProps) {
  const steps = [
    { id: 'c-1', t: 'أَهَذَا قَلَمٌ؟', who: YUSUF }, { id: 'c-2', t: 'لَا.', who: KAREEM }, { id: 'c-3', t: 'مَا هَذَا؟', who: YUSUF },
    { id: 'c-4', t: 'هَذَا مِفْتَاحٌ.', who: KAREEM }, { id: 'c-5', t: 'مِفْتَاحٌ! شُكْرًا.', who: YUSUF },
  ];
  const n = lines >= 2 ? 5 : lines >= 1 ? 2 : 0;
  return (
    <>
      {steps.slice(0, n).map((s, i) => (
        <motion.div key={s.id} className="absolute flex items-center gap-3" style={{ left: 840 + (i % 2) * 300, top: 190 + i * 110 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (i % (lines >= 2 ? 5 : 2)) * 0.35, duration: 0.6, ease }}>
          <span className="block rounded-full" style={{ width: 18, height: 18, background: s.who }} />
          <span className="inline-block rounded-[16px]" style={{ padding: '2px 16px', background: CARD, boxShadow: `0 0 0 3px ${s.who}55, 0 14px 28px -20px rgba(60,30,10,0.6)` }}><Hear id={s.id}><ArText size={34}>{s.t}</ArText></Hear></span>
        </motion.div>
      ))}
      {lines >= 2 && <Chip x={1440} y={560} color={YUSUF} delay={0.2}>Yusuf</Chip>}
      {lines >= 2 && <Chip x={1440} y={610} color={KAREEM} delay={0.3}>Ustadh Kareem</Chip>}
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 1260 680 C 1380 640, 1380 300, 1260 260" color={GOLD} width={4} dash="4 9" dur={1.2} /></Svg>
          <Chip x={1420} y={700} color={GOLD} delay={0.8}>+1 word, no English</Chip>
        </>
      )}
    </>
  );
}

/** A laptop frame: the teacher's hand holds something just out of sight; the moves tick off when you play. */
export function Ft2TalkGraphic({ lines, interaction }: GraphicProps) {
  const moves = ['Guess with أَ', 'Answer: نَعَمْ / لَا', 'No? Ask مَا هَذَا؟', 'Swap after five'];
  return (
    <>
      <motion.div className="absolute rounded-[18px]" style={{ left: 1190, top: 260, width: 320, height: 230, background: '#2A3D45', boxShadow: `0 0 0 10px #1F1612, 0 30px 40px -24px rgba(0,0,0,0.6)` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} />
      <div className="absolute" style={{ left: 1320, top: 270 }}><Person x={30} y={220} scale={0.8} color={CRIMSON} /></div>
      <motion.span className="absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: 1440, top: 420, width: 54, height: 54, fontSize: 30, background: GOLD }} animate={{ x: [0, 18, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>?</motion.span>
      <span className="absolute block rounded-b-[12px]" style={{ left: 1150, top: 500, width: 400, height: 18, background: '#1F1612' }} />
      {lines >= 1 && (
        <div className="absolute flex flex-col gap-3" style={{ left: 800, top: 230, width: 320 }}>
          {moves.map((m, i) => (
            <motion.div key={m} className="flex items-center gap-3 rounded-[16px]" style={{ padding: '8px 14px', background: CARD, boxShadow: '0 14px 28px -22px rgba(60,30,10,0.6)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, duration: 0.5, ease }}>
              <motion.span className="flex shrink-0 items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 28, height: 28, fontSize: 15 }}
                initial={false} animate={{ background: interaction ? TEAL : 'rgba(31,22,18,0.18)' }} transition={{ delay: interaction ? 0.3 + i * 0.35 : 0 }}>✓</motion.span>
              <span className="font-sans font-semibold" style={{ fontSize: 18, color: INK_TEXT }}>{m}</span>
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 2 && <SayBubble x={1250} y={640} id="maa-haadha" text="مَا هَذَا؟" width={180} delay={0.3} accent />}
    </>
  );
}

/* ---------- ahd ---------- */

/** Home: three rooms to hunt in; a new word comes back as a sticky note. */
export function Ft2MissionGraphic({ lines }: GraphicProps) {
  const spots = [{ x: 900, y: 300, icon: 'cup', l: 'kitchen' }, { x: 1150, y: 260, icon: 'desk', l: 'desk' }, { x: 1400, y: 300, icon: 'window', l: 'outside' }];
  return (
    <>
      {spots.map((s, i) => (
        <React.Fragment key={s.icon}>
          <Badge x={s.x} y={s.y} name={s.icon} size={100} color={i === 1 ? CRIMSON : TEAL} delay={0.2 + i * 0.2} />
          <Chip x={s.x} y={s.y + 62} delay={0.4 + i * 0.2}>{s.l}</Chip>
        </React.Fragment>
      ))}
      {lines >= 2 && (
        <motion.div className="absolute flex flex-col items-center justify-center" style={{ left: 1060, top: 480, width: 190, height: 170, background: '#FFE58A', boxShadow: '0 20px 30px -20px rgba(60,30,10,0.6)' }}
          initial={{ opacity: 0, rotate: -12, y: -60 }} animate={{ opacity: 1, rotate: -4, y: 0 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <span className="font-sans font-bold" style={{ fontSize: 15, color: soft('light') }}>new word</span>
          <ArText size={34}>مَا هَذَا؟</ArText>
        </motion.div>
      )}
    </>
  );
}

/** From the roof: a building right beside you and one far across the campus; Sara points at the far one. */
export function Ft2NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <motion.div className="absolute rounded-t-[8px]" style={{ left: 820, top: 330, width: 220, height: 470, background: '#E2CDAA' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} />
      <motion.div className="absolute rounded-t-[6px]" style={{ left: 1380, top: 560, width: 80, height: 120, background: '#C9B48E' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
      <Svg><line x1={760} y1={680} x2={1520} y2={680} stroke="rgba(31,22,18,0.15)" strokeWidth={3} /></Svg>
      <Person x={1150} y={GROUND} scale={1.0} color={YUSUF} />
      <Person x={1280} y={GROUND} scale={1.0} color={SARA} hijab />
      {lines >= 2 && (
        <>
          <Svg><Draw d="M 1300 600 Q 1360 520 1410 560" color={GOLD} width={3} dash="3 9" dur={0.8} /></Svg>
          <Chip x={930} y={280} color={TEAL} delay={0.2}>near: هَذَا</Chip>
          <Chip x={1420} y={500} color={CRIMSON} delay={0.5}>far: ?</Chip>
        </>
      )}
      {lines >= 3 && <WordTile x={1420} y={440} size={40} hot delay={0.3}><Hear id="dhalika">ذَلِكَ</Hear></WordTile>}
    </>
  );
}
