import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip } from './kit';
import { ArText, SayBubble, WordTile, ObjectCard } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · 12+ · Lesson 1 · First Day at the Institute. Teens stage; faceless people: Yusuf (teal, the new student),
 * Ustadha Huda (crimson, hijab), Sara (gold, hijab). Objects are kit icons. The motion carries the two ideas: the word
 * before a noun follows its gender (the ة lights up), and English "is" and "a" fall away from the Arabic sentence.
 */

const YUSUF = TEAL;
const HUDA = CRIMSON;
const SARA = GOLD;

/** The institute's front: an arch with the sign عَرَبِيٌّ فَقَطْ. */
function Gate({ dim = false }: { dim?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: 980, top: 230, width: 360, height: 570 }} initial={{ opacity: 0 }} animate={{ opacity: dim ? 0.35 : 1 }} transition={{ duration: 0.8 }}>
      <svg viewBox="0 0 360 570" width="100%" height="100%">
        <path d="M 20 570 L 20 180 Q 20 20 180 20 Q 340 20 340 180 L 340 570 Z" fill="#EAD9BE" />
        <path d="M 90 570 L 90 230 Q 90 120 180 120 Q 270 120 270 230 L 270 570 Z" fill="#7A4A2A" />
      </svg>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Ft1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <ObjectCard x={1000} y={330} icon="book" label="كِتَابٌ" color={TEAL} delay={0.3} />
      <ObjectCard x={1180} y={260} icon="key" label="مِفْتَاحٌ" color={GOLD} delay={0.5} />
      <ObjectCard x={1360} y={330} icon="bag" label="حَقِيبَةٌ" color={CRIMSON} delay={0.7} />
      <Person x={1180} y={800} scale={1.2} color={YUSUF} delay={0.2} />
    </>
  );
}

/** Yusuf arrives at the gate; the sign appears; a ring of question marks becomes understanding later. */
export function Ft1ArriveGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Gate />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease }}>
        <Person x={1420} y={800} scale={1.05} color={YUSUF} />
      </motion.div>
      {lines >= 2 && (
        <motion.div className="absolute rounded-[14px] text-center" style={{ left: 1010, top: 180, width: 300, padding: '8px 0', background: '#1F3B3F', boxShadow: 'inset 0 0 0 4px #C9A45C' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <ArText size={40} color="#F6E3B8">العَرَبِيَّةُ فَقَطْ</ArText>
          <div className="font-sans font-bold" style={{ fontSize: 15, color: '#F6E3B8' }}>Arabic only</div>
        </motion.div>
      )}
      {lines >= 3 && <SayBubble x={1420} y={560} text="؟ ؟ ؟" align="right" thought width={150} delay={0.3} />}
    </>
  );
}

/* ---------- zad ---------- */

/** The tour: Huda points at the office, the room, the key, and at Sara; each line pairs with what she points at. */
export function Ft1ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={1.05} color={HUDA} hijab />
      <Person x={1060} y={800} scale={1} color={YUSUF} delay={0.1} />
      {k === 1 && (
        <React.Fragment key="a">
          <ObjectCard x={1330} y={330} icon="desk" color={TEAL} />
          <ObjectCard x={1330} y={560} icon="house" color={CRIMSON} delay={1.6} />
          <SayBubble x={880} y={560} id="d-1" text="هَذَا مَكْتَبٌ." width={240} delay={0.3} />
          <SayBubble x={880} y={420} id="d-2" text="وَهَذِهِ غُرْفَةٌ." width={240} delay={1.6} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <ObjectCard x={1330} y={380} icon="key" color={GOLD} />
          <SayBubble x={1060} y={560} id="d-3" text="مَا هَذَا؟" width={200} />
          <SayBubble x={880} y={420} id="d-4" text="هَذَا مِفْتَاحٌ." width={240} delay={1.2} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Person x={1380} y={800} scale={1} color={SARA} hijab />
          <SayBubble x={1060} y={560} id="d-5" text="وَمَنْ هَذِهِ؟" width={210} />
          <SayBubble x={880} y={420} id="d-6" text="هَذِهِ سَارَةُ. هِيَ طَالِبَةٌ." width={330} delay={1.2} />
        </React.Fragment>
      )}
    </>
  );
}

/** Two columns: هَذَا on one side, هَذِهِ on the other; each word lands under its own, and every ة glows. */
export function Ft1HaadhihiGraphic({ lines, items }: GraphicProps) {
  const rows = [
    { side: 'm', word: <>هَذَا مَكْتَبٌ</>, id: 'haadha-maktab' },
    { side: 'f', word: <>هَذِهِ غُرْفَ<span style={{ color: CRIMSON }}>ةٌ</span></>, id: 'haadhihi-ghurfa' },
    { side: 'f', word: <>هَذِهِ طَالِبَ<span style={{ color: CRIMSON }}>ةٌ</span></>, id: 'haadhihi-taaliba' },
  ];
  if (lines === 0) return null;
  return (
    <>
      <WordTile x={1340} y={240} size={64} color={TEAL}>هَذَا</WordTile>
      <WordTile x={980} y={240} size={64} color={CRIMSON} delay={0.2}>هَذِهِ</WordTile>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 1290, top: 290, fontSize: 15, letterSpacing: '0.16em', color: TEAL }}>masculine</span>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 935, top: 290, fontSize: 15, letterSpacing: '0.16em', color: CRIMSON }}>feminine</span>
      <Svg><Draw d="M 1160 200 L 1160 760" color={INK_TEXT} width={2} opacity={0.2} /></Svg>
      {lines >= 3 && items === 0 && (
        <motion.div className="absolute flex items-center justify-center rounded-full" style={{ left: 920, top: 420, width: 120, height: 120, background: '#FFFDF8', boxShadow: `0 0 0 5px ${CRIMSON}, 0 0 40px 10px ${CRIMSON}44` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <ArText size={80} color={CRIMSON}>ة</ArText>
        </motion.div>
      )}
      {rows.slice(0, items).map((r, i) => (
        <WordTile key={i} x={r.side === 'm' ? 1340 : 980} y={400 + (r.side === 'm' ? 0 : (i - 1) * 140)} size={48} id={r.id} from={{ x: r.side === 'm' ? 0 : 360, y: -140 }} delay={0.1}>{r.word}</WordTile>
      ))}
    </>
  );
}

/** A thing and a person; the question word changes; then each one flips to its feminine partner. */
export function Ft1MaaManGraphic({ lines }: GraphicProps) {
  return (
    <>
      <ObjectCard x={960} y={480} icon="key" color={GOLD} size={150} />
      <Person x={1350} y={760} scale={1.05} color={YUSUF} />
      {lines >= 1 && <SayBubble x={960} y={380} id="d-3" text="مَا هَذَا؟" width={200} />}
      {lines >= 2 && <SayBubble x={1350} y={510} id="man-haadha" text="مَنْ هَذَا؟" align="right" width={210} delay={0.2} />}
      {lines >= 2 && (
        <>
          <Chip x={960} y={620} color={GOLD}>thing → مَا</Chip>
          <Chip x={1350} y={780} color={TEAL}>person → مَنْ</Chip>
        </>
      )}
      {lines >= 3 && (
        <motion.div className="absolute flex items-center gap-4 rounded-[20px]" style={{ left: 880, top: 200, padding: '8px 20px', background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Hear id="haadha-mudarris"><ArText size={40}>هَذَا مُدَرِّسٌ</ArText></Hear>
          <span className="font-sans font-black" style={{ fontSize: 30, color: CRIMSON }}>→</span>
          <Hear id="haadhihi-mudarrisa"><ArText size={40}>هَذِهِ مُدَرِّسَ<span style={{ color: CRIMSON }}>ةٌ</span></ArText></Hear>
        </motion.div>
      )}
    </>
  );
}

/** The wow: "This is a key" in four English tiles; "is" and "a" fall away; هَذَا مِفْتَاحٌ remains, the "a" hiding in -un. */
export function Ft1NoIsGraphic({ lines }: GraphicProps) {
  const en = ['This', 'is', 'a', 'key'];
  const gone = lines >= 2;
  return (
    <>
      {lines >= 1 && en.map((w, i) => {
        const falls = w === 'is' || w === 'a';
        return (
          <motion.div key={w} className="absolute flex items-center justify-center rounded-[18px] font-sans font-black" style={{ left: 840 + i * 165, top: 220, width: 150, height: 90, fontSize: 40, color: falls ? CRIMSON : INK_TEXT, background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }}
            initial={{ opacity: 0, y: -20 }} animate={gone && falls ? { opacity: 0, y: 260, rotate: i % 2 ? 25 : -25 } : { opacity: gone ? 0.5 : 1, y: 0 }} transition={{ duration: gone && falls ? 1.1 : 0.5, delay: gone ? 0.3 + i * 0.1 : i * 0.12, ease }}>
            {w}
          </motion.div>
        );
      })}
      {gone && (
        <>
          <WordTile x={1340} y={480} size={64} id="d-4" delay={1.2}>هَذَا</WordTile>
          <WordTile x={1040} y={480} size={64} delay={1.4}>مِفْتَا<span style={{ color: lines >= 3 ? CRIMSON : INK_TEXT }}>حٌ</span></WordTile>
          <Svg>
            <Draw d="M 1005 310 L 1340 430" color={TEAL} width={3} dash="4 8" delay={1.6} dur={0.6} />
            <Draw d="M 1335 310 L 1060 430" color={TEAL} width={3} dash="4 8" delay={1.8} dur={0.6} />
          </Svg>
          <Chip x={1190} y={570} color={TEAL} delay={2}>2 words · a full sentence</Chip>
        </>
      )}
      {lines >= 3 && (
        <motion.div className="absolute flex items-center gap-3" style={{ left: 900, top: 640 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <span className="rounded-full px-4 py-1 font-sans font-black text-white" style={{ fontSize: 22, background: CRIMSON }}>a</span>
          <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>hides in the ending</span>
          <ArText size={44} color={CRIMSON}>ـٌ</ArText>
          <span className="font-sans font-bold" style={{ fontSize: 20, color: soft('light') }}>-un</span>
        </motion.div>
      )}
    </>
  );
}

/** The twelve words in two columns, masculine and feminine; every ة glows. */
export function Ft1WordsGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const m = [['كِتَابٌ', 'kitab'], ['قَلَمٌ', 'qalam'], ['بَابٌ', 'bab'], ['مَكْتَبٌ', 'maktab'], ['مِفْتَاحٌ', 'miftah'], ['طَالِبٌ', 'talib']];
  const f = [['حَقِيبَ', 'haqiba'], ['سَيَّارَ', 'sayyara'], ['نَافِذَ', 'nafidha'], ['غُرْفَ', 'ghurfa'], ['طَالِبَ', 'taaliba'], ['مُدَرِّسَ', 'mudarrisa']];
  return (
    <>
      {m.map(([w, id], i) => <WordTile key={id} x={1340} y={210 + i * 95} size={40} id={id} delay={i * 0.08}>{w}</WordTile>)}
      {f.map(([w, id], i) => <WordTile key={id} x={1000} y={210 + i * 95} size={40} id={id} delay={0.4 + i * 0.08}>{w}<span style={{ color: lines >= 2 ? CRIMSON : INK_TEXT }}>ةٌ</span></WordTile>)}
      {lines >= 3 && <Chip x={1170} y={790} color={TEAL} delay={0.2}>they come back in your reviews</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ft1TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={790} scale={1.05} color={HUDA} hijab />
      <Person x={1380} y={790} scale={1.05} color={YUSUF} delay={0.1} />
      {lines >= 1 && ['book', 'key', 'pen', 'bag', 'phone'].map((ic, i) => <ObjectCard key={ic} x={930 + i * 110} y={250} icon={ic} size={90} color={[TEAL, GOLD, CRIMSON, TEAL, GOLD][i]} delay={i * 0.12} />)}
      {lines >= 2 && (
        <>
          <SayBubble x={900} y={540} id="d-3" text="مَا هَذَا؟" width={200} />
          <SayBubble x={1380} y={540} id="d-4" text="هَذَا مِفْتَاحٌ." align="right" width={240} delay={1} />
        </>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

export function Ft1MissionGraphic({ lines }: GraphicProps) {
  const notes = [{ x: 960, y: 300, t: 'هَذَا بَابٌ', c: '#FFE58A' }, { x: 1230, y: 250, t: 'هَذِهِ نَافِذَةٌ', c: '#A8E6E0' }, { x: 1090, y: 520, t: 'هَذَا مَكْتَبٌ', c: '#FFC4B8' }];
  return (
    <>
      <Person x={1420} y={800} scale={1.05} color={YUSUF} />
      {lines >= 1 && notes.map((n, i) => (
        <motion.div key={n.t} className="absolute flex items-center justify-center" style={{ left: n.x - 110, top: n.y - 70, width: 220, height: 140, background: n.c, boxShadow: '0 16px 26px -18px rgba(60,30,10,0.6)', transform: `rotate(${(i - 1) * 4}deg)` }}
          initial={{ opacity: 0, scale: 0.6, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: (i - 1) * 4 }} transition={{ type: 'spring', bounce: 0.4, delay: i * 0.3 }}>
          <ArText size={36}>{n.t}</ArText>
        </motion.div>
      ))}
    </>
  );
}

export function Ft1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={800} scale={1.05} color={YUSUF} />
      <Person x={1380} y={800} scale={1.05} color={SARA} hijab delay={0.1} />
      {lines >= 1 && <ObjectCard x={1250} y={520} icon="phone" color={SARA} size={100} />}
      {lines >= 2 && <SayBubble x={1380} y={420} id="a-haadha" text={<><span style={{ color: '#fff' }}>أَ</span>هَذَا هَاتِفُكَ؟</>} align="right" width={280} accent />}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: 1080, top: 200, width: 100, height: 100, background: CRIMSON }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <ArText size={64} color="#fff">أَ</ArText>
        </motion.span>
      )}
    </>
  );
}
