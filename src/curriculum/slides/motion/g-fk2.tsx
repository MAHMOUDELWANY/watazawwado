import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, useReduce, type GraphicProps } from './Stage';
import { Cut, Chip, Svg, Draw } from './kit';
import { Hear } from '../Say';
import { ThingCard, ArText, Say } from './g-fk1';

/**
 * Fusha · Kids · Lesson 2 · Is This a Cat? Kids paper stage with the Zad Kids cast (Yusuf, Maryam, Jiddo, Mishmish the
 * cat, painted cut-outs). The running object is a mystery box: a hand goes in, a question comes out. The motion carries
 * the lesson's one idea: أَ flies to the front of a sentence and turns telling into asking; نَعَمْ and لَا answer it.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

type Animal = 'cat' | 'dog' | 'rabbit' | 'horse' | 'bear' | 'rooster';

/** Flat toy animals in a 100 × 100 box; `shadow` paints them as a silhouette. */
function AnimalArt({ a, shadow = false }: { a: Animal; shadow?: boolean }) {
  const c = (col: string) => (shadow ? '#3A2A22' : col);
  switch (a) {
    case 'cat': return <g fill={c('#E89A3C')}><ellipse cx={52} cy={66} rx={30} ry={20} /><circle cx={32} cy={42} r={16} /><path d="M 20 34 L 22 18 L 32 28 Z M 44 28 L 44 18 L 36 26 Z" /><path d="M 80 64 C 96 60, 94 40, 86 36" fill="none" stroke={c('#E89A3C')} strokeWidth={6} strokeLinecap="round" /></g>;
    case 'dog': return <g fill={c('#B4552F')}><ellipse cx={56} cy={64} rx={30} ry={18} /><circle cx={28} cy={44} r={16} /><ellipse cx={20} cy={50} rx={6} ry={12} fill={c('#7A3418')} /><rect x={34} y={74} width={8} height={18} rx={3} /><rect x={68} y={74} width={8} height={18} rx={3} /><path d="M 84 58 L 96 44" stroke={c('#B4552F')} strokeWidth={6} strokeLinecap="round" /></g>;
    case 'rabbit': return <g fill={c('#CFC6BA')}><ellipse cx={54} cy={68} rx={26} ry={20} /><circle cx={40} cy={44} r={14} /><ellipse cx={34} cy={18} rx={5} ry={16} /><ellipse cx={46} cy={18} rx={5} ry={16} /><circle cx={80} cy={70} r={7} fill={c('#FFFDF8')} /></g>;
    case 'horse': return <g fill={c('#8B4935')}><ellipse cx={56} cy={56} rx={28} ry={14} /><path d="M 30 50 L 20 18 L 34 14 L 40 46 Z" /><ellipse cx={18} cy={20} rx={10} ry={7} /><rect x={36} y={64} width={7} height={28} rx={3} /><rect x={70} y={64} width={7} height={28} rx={3} /><path d="M 84 52 C 96 56, 96 74, 92 80" fill="none" stroke={c('#4A2418')} strokeWidth={6} strokeLinecap="round" /></g>;
    case 'bear': return <g fill={c('#9A6A3E')}><ellipse cx={50} cy={66} rx={26} ry={24} /><circle cx={50} cy={34} r={18} /><circle cx={36} cy={20} r={7} /><circle cx={64} cy={20} r={7} /><ellipse cx={50} cy={40} rx={7} ry={5} fill={c('#E9CFA6')} /></g>;
    case 'rooster': return <g fill={c('#F2F0EA')}><ellipse cx={50} cy={60} rx={22} ry={20} /><circle cx={34} cy={34} r={12} /><path d="M 28 22 Q 34 10 40 22" fill={c(CRIMSON)} /><path d="M 22 36 L 12 40 L 22 42 Z" fill={c(GOLD)} /><path d="M 70 52 Q 92 30 84 64 Z" fill={c(TEAL)} /><rect x={44} y={78} width={4} height={14} fill={c(GOLD)} /><rect x={54} y={78} width={4} height={14} fill={c(GOLD)} /></g>;
  }
}

/** An animal card centred at (x, y), with its word under it; plays on tap. */
function AnimalCard({ a, x, y, s = 150, label, clip, delay = 0, shadow = false }: { a: Animal; x: number; y: number; s?: number; label?: string; clip?: string; delay?: number; shadow?: boolean }) {
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x - s / 2, top: y - s / 2, width: s }}
      initial={{ opacity: 0, y: 24, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay }}>
      <svg viewBox="0 0 100 100" width={s} height={s} style={{ overflow: 'visible', filter: shadow ? 'blur(1.5px)' : 'drop-shadow(0 14px 14px rgba(60,30,10,0.18))' }}><AnimalArt a={a} shadow={shadow} /></svg>
      {label && (clip ? <Hear id={clip}><ArText size={s * 0.26}>{label}</ArText></Hear> : <ArText size={s * 0.26}>{label}</ArText>)}
    </motion.div>
  );
}

/** The mystery box: a crate with a round hole and a question mark; it shakes while a hand is inside. */
function MysteryBox({ x, y, w = 260, shake = false, open = false, delay = 0 }: { x: number; y: number; w?: number; shake?: boolean; open?: boolean; delay?: number }) {
  const reduce = useReduce();
  const h = w * 0.75;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - h, width: w, height: h }}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, rotate: shake && !reduce ? [0, -3, 3, -2, 0] : 0 }}
      transition={shake && !reduce ? { rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 0.8 }, default: { duration: 0.7, delay, ease } } : { duration: 0.7, delay, ease }}>
      <div className="absolute inset-0 rounded-[18px]" style={{ background: 'linear-gradient(180deg, #E8774A, #C2552B)', boxShadow: '0 30px 40px -24px rgba(60,30,10,0.6)' }} />
      <motion.div className="absolute rounded-t-[18px]" style={{ left: -10, right: -10, top: -18, height: 34, background: '#F08A5A', transformOrigin: '10% 100%' }} initial={false} animate={{ rotate: open ? -28 : 0, y: open ? -20 : 0 }} transition={{ duration: 0.7, ease }} />
      <span className="absolute rounded-full" style={{ left: '50%', top: -12, width: 70, height: 22, marginLeft: -35, background: '#5A2410' }} />
      <span className="absolute inset-0 flex items-center justify-center font-sans font-black" style={{ fontSize: w * 0.4, color: '#FFE0C2' }}>?</span>
    </motion.div>
  );
}

/* ---------- spark ---------- */

/** Mishmish leaps over the mystery box; the question mark turns into the lesson's question. */
export function Fk2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <MysteryBox x={1180} y={760} w={280} delay={0.2} />
      <Cut src={`${CAST}/mishmish-leap`} x={1260} y={560} h={200} ratio={1.5} delay={1} />
      <motion.div className="absolute" style={{ left: 980, top: 200 }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay: 1.6 }}>
        <span className="inline-block rounded-[26px]" style={{ padding: '6px 30px', background: CARD, boxShadow: `0 0 0 4px ${CRIMSON}, ${SHADOW}` }}><Hear id="a-haadha-qitt"><ArText size={64}>أَهَذَا قِطٌّ؟</ArText></Hear></span>
      </motion.div>
    </>
  );
}

/** Last lesson's three things come back, one by one, and Maryam points at each. */
export function Fk2RecallGraphic({ lines, items }: GraphicProps) {
  const things = [{ t: 'book' as const, w: 'كِتَابٌ', id: 'haadha-kitab' }, { t: 'key' as const, w: 'مِفْتَاحٌ', id: 'haadha-miftah' }, { t: 'chair' as const, w: 'كُرْسِيٌّ', id: 'haadha-kursi' }];
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={1440} y={830} h={300} />
      {lines >= 1 && <Say x={1440} y={520} id="maa-haadha" text="مَا هَذَا؟" align="right" width={200} delay={0.4} />}
      {things.slice(0, items).map((t, i) => <ThingCard key={t.t} t={t.t} x={1180 - i * 220} y={330} s={150} label={t.w} clip={t.id} delay={0.1} />)}
      {lines >= 2 && items === 0 && <Chip x={1050} y={330} color={TEAL}>هَذَا + the word</Chip>}
    </>
  );
}

/** The box arrives; Yusuf's hand goes in and the box shakes; question marks rise out of it. */
export function Fk2BoxGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <MysteryBox x={1130} y={780} w={300} shake={lines >= 2} />}
      {lines >= 1 && <Cut src={`${CAST}/maryam-happy`} x={1430} y={830} h={300} delay={0.3} />}
      {lines >= 2 && <Cut src={`${CAST}/yusuf-surprised`} x={860} y={830} h={300} />}
      {lines >= 3 && ['؟', '?', '؟'].map((q, i) => (
        <motion.span key={i} className="absolute font-sans font-black" style={{ left: 1060 + i * 60, top: 420, fontSize: 60, color: [CRIMSON, GOLD, TEAL][i] }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: [0, 1, 0.8], y: -80 - i * 30 }} transition={{ duration: 1.6, delay: i * 0.3, ease }}>{q}</motion.span>
      ))}
    </>
  );
}

/* ---------- zad ---------- */

/** The guessing game in three rounds: a wrong guess, a right one (the rabbit comes out), and Mishmish jumps out. */
export function Fk2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <MysteryBox x={1130} y={790} w={260} shake={k === 1} open={k >= 2} />
      <Cut src={`${CAST}/${k >= 3 ? 'yusuf-surprised' : 'yusuf-think'}`} x={860} y={830} h={290} />
      <Cut src={`${CAST}/${k >= 3 ? 'maryam-amazed' : 'maryam-happy'}`} x={1430} y={830} h={290} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={860} y={520} id="story-1" text="أَهَذَا كَلْبٌ؟" width={230} delay={0.3} />
          <Say x={1430} y={520} id="story-2" text="لَا." align="right" width={120} delay={1.5} accent />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={860} y={470} id="story-3" text="أَهَذَا أَرْنَبٌ؟" width={240} delay={0.2} />
          <AnimalCard a="rabbit" x={1130} y={560} s={140} delay={1} />
          <Say x={1430} y={470} id="story-4" text="نَعَمْ، هَذَا أَرْنَبٌ!" align="right" width={300} delay={1.6} accent />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={860} y={470} id="story-5" text="أَهَذَا دُبٌّ؟" width={220} delay={0.2} />
          <Cut src={`${CAST}/mishmish-leap`} x={1090} y={630} h={150} ratio={1.5} delay={1} bounce={0.5} />
          <Say x={1430} y={470} id="story-6" text="لَا، لَا! هَذَا قِطٌّ!" align="right" width={290} delay={1.8} accent />
        </React.Fragment>
      )}
    </>
  );
}

/** The telling sentence sits still; أَ flies to its front, the full stop turns into a question mark, the voice rises. */
export function Fk2HamzaGraphic({ lines }: GraphicProps) {
  const asking = lines >= 2;
  return (
    <>
      <AnimalCard a="cat" x={1150} y={260} s={150} />
      <div className="absolute flex items-center gap-4" dir="rtl" style={{ left: 820, top: 440, width: 640, justifyContent: 'center' }}>
        {asking && (
          <motion.span className="inline-block rounded-[20px]" style={{ padding: '4px 22px', background: CARD, boxShadow: `0 0 0 4px ${CRIMSON}, 0 0 30px 6px ${CRIMSON}44` }}
            initial={{ x: -260, y: -160, rotate: -20, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 1.1 }}>
            <ArText size={74} color={CRIMSON}>أَ</ArText>
          </motion.span>
        )}
        <span className="inline-block rounded-[20px]" style={{ padding: '4px 22px', background: CARD, boxShadow: SHADOW }}>
          <Hear id={asking ? 'a-haadha-qitt' : 'haadha-qitt'}><ArText size={74}>هَذَا قِطٌّ</ArText></Hear>
        </span>
        <motion.span key={asking ? 'q' : 'dot'} className="font-sans font-black" style={{ fontSize: 74, color: asking ? CRIMSON : INK_TEXT }} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: asking ? 0.6 : 0 }}>
          {asking ? '؟' : '.'}
        </motion.span>
      </div>
      <Chip x={1140} y={600} color={asking ? CRIMSON : TEAL}>{asking ? 'asking: Is this a cat?' : 'telling: This is a cat.'}</Chip>
      {lines >= 3 && (
        <Svg>
          <Draw d="M 880 720 C 1050 720, 1250 720, 1360 650" color={GOLD} width={6} dur={1} />
          <Draw d="M 1340 640 L 1366 648 L 1356 674" color={GOLD} width={6} delay={0.9} dur={0.3} />
        </Svg>
      )}
      {lines >= 3 && <Chip x={1120} y={750} color={GOLD} delay={0.6}>your voice goes up</Chip>}
    </>
  );
}

/** Two big answers light up in turn: نَعَمْ with the right animal, لَا with the right word after it. */
export function Fk2YesGraphic({ lines }: GraphicProps) {
  return (
    <>
      <div className="absolute flex gap-10" dir="rtl" style={{ left: 880, top: 180 }}>
        {[{ w: 'نَعَمْ', id: 'naam', c: TEAL, mark: '✓' }, { w: 'لَا', id: 'la', c: CRIMSON, mark: '✕' }].map((b, i) => (
          <motion.div key={b.id} className="flex flex-col items-center justify-center rounded-full" style={{ width: 200, height: 200, background: b.c, boxShadow: `0 20px 40px -20px ${b.c}` }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: (lines === 2 && i === 0) || (lines >= 3 && i === 1) ? 1.08 : 1 }} transition={{ type: 'spring', bounce: 0.45, delay: lines >= 2 ? 0 : 0.2 + i * 0.25 }}>
            <span className="font-sans font-black text-white" style={{ fontSize: 46, lineHeight: 1 }}>{b.mark}</span>
            <Hear id={b.id}><ArText size={56} color="#fff">{b.w}</ArText></Hear>
          </motion.div>
        ))}
      </div>
      {lines === 2 && (
        <React.Fragment key="yes">
          <AnimalCard a="cat" x={1000} y={560} s={140} />
          <div className="absolute" style={{ left: 1110, top: 520 }}><span className="inline-block rounded-[18px]" style={{ padding: '4px 20px', background: CARD, boxShadow: `0 0 0 3px ${TEAL}` }}><Hear id="naam-qitt"><ArText size={44}>نَعَمْ، هَذَا قِطٌّ.</ArText></Hear></span></div>
        </React.Fragment>
      )}
      {lines >= 3 && (
        <React.Fragment key="no">
          <AnimalCard a="dog" x={1000} y={560} s={140} />
          <div className="absolute" style={{ left: 1110, top: 520 }}><span className="inline-block rounded-[18px]" style={{ padding: '4px 20px', background: CARD, boxShadow: `0 0 0 3px ${CRIMSON}` }}><Hear id="la-kalb"><ArText size={44}>لَا، هَذَا كَلْبٌ.</ArText></Hear></span></div>
        </React.Fragment>
      )}
    </>
  );
}

/** Six animals march on to the stage, one per tap, each with its word. */
export function Fk2AnimalsGraphic({ lines, items }: GraphicProps) {
  const all: { a: Animal; w: string; id: string }[] = [
    { a: 'cat', w: 'قِطٌّ', id: 'qitt' }, { a: 'dog', w: 'كَلْبٌ', id: 'kalb' }, { a: 'rabbit', w: 'أَرْنَبٌ', id: 'arnab' },
    { a: 'horse', w: 'حِصَانٌ', id: 'hisan' }, { a: 'bear', w: 'دُبٌّ', id: 'dubb' }, { a: 'rooster', w: 'دِيكٌ', id: 'dik' },
  ];
  return (
    <>
      {lines >= 1 && items === 0 && <MysteryBox x={1150} y={700} w={260} open />}
      {all.slice(0, items).map((x, i) => <AnimalCard key={x.a} a={x.a} x={1380 - (i % 3) * 240} y={300 + Math.floor(i / 3) * 270} s={150} label={x.w} clip={x.id} delay={0.05} />)}
    </>
  );
}

/* ---------- athar ---------- */

/** A curtain with a shadow behind it (a horse); Maryam's guess; the answer is the learner's. */
export function Fk2ShadowGraphic({ lines, interaction }: GraphicProps) {
  return (
    <>
      <motion.div className="absolute rounded-[20px]" style={{ left: 1040, top: 170, width: 340, height: 360, background: 'linear-gradient(180deg, #FFF3D6, #F6E2B8)', boxShadow: `inset 0 0 0 6px ${GOLD}, ${SHADOW}` }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} />
      <div className="absolute" style={{ left: 1110, top: 250 }}>
        <svg viewBox="0 0 100 100" width={200} height={200} style={{ overflow: 'visible', filter: interaction ? undefined : 'blur(2px)' }}>
          <AnimalArt a="horse" shadow={!interaction} />
        </svg>
      </div>
      <Cut src={`${CAST}/maryam-think`} x={1430} y={830} h={290} />
      {lines >= 1 && <Say x={1430} y={520} id="a-haadha-kalb" text="أَهَذَا كَلْبٌ؟" align="right" width={230} delay={0.4} />}
    </>
  );
}

/** Two players and the box; the moves of the game tick off when the round is played. */
export function Fk2TalkGraphic({ lines, interaction }: GraphicProps) {
  const moves = ['Hand in the box', 'Ask: أَهَذَا...؟', 'Answer: نَعَمْ / لَا', 'Swap!'];
  return (
    <>
      <MysteryBox x={1180} y={790} w={250} shake={!interaction} />
      <Cut src={`${CAST}/yusuf-point`} x={1430} y={830} h={280} />
      {lines >= 1 && <Say x={1430} y={540} id="a-haadha-dubb" text="أَهَذَا دُبٌّ؟" align="right" width={220} delay={0.3} />}
      {lines >= 2 && (
        <div className="absolute flex flex-col gap-3" style={{ left: 800, top: 200, width: 330 }}>
          {moves.map((m, i) => (
            <motion.div key={m} className="flex items-center gap-3 rounded-[16px]" style={{ padding: '8px 14px', background: CARD, boxShadow: '0 14px 28px -22px rgba(60,30,10,0.6)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, duration: 0.5, ease }}>
              <motion.span className="flex shrink-0 items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 28, height: 28, fontSize: 15 }}
                initial={false} animate={{ background: interaction ? TEAL : 'rgba(31,22,18,0.18)' }} transition={{ delay: interaction ? 0.3 + i * 0.35 : 0 }}>✓</motion.span>
              <span className="font-sans font-semibold" style={{ fontSize: 19, color: INK_TEXT }}>{m}</span>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

/** At home: Jiddo's hand in Yusuf's homemade box, Jiddo's guess, Yusuf's laugh. */
export function Fk2MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Cut src={`${CAST}/jiddo-sit`} x={940} y={830} h={300} ratio={1.093} />
      <MysteryBox x={1170} y={800} w={210} shake={lines >= 1} />
      <Cut src={`${CAST}/yusuf-brave`} x={1420} y={830} h={290} delay={0.2} />
      {lines >= 2 && (
        <>
          <Say x={940} y={500} id="a-haadha-qalam" text="أَهَذَا قَلَمٌ؟" width={230} delay={0.2} />
          <Say x={1420} y={520} id="la" text="لَا!" align="right" width={120} delay={1.4} accent />
        </>
      )}
    </>
  );
}

/** The park: a bird close by and one far away on the hill; Jiddo points at the far one. */
export function Fk2NextGraphic({ lines }: GraphicProps) {
  const bird = (x: number, y: number, s: number, delay: number) => (
    <motion.svg className="absolute" style={{ left: x, top: y, overflow: 'visible' }} width={s} height={s} viewBox="0 0 100 100" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.8, ease }}>
      <ellipse cx={50} cy={56} rx={26} ry={18} fill={TEAL} /><circle cx={30} cy={40} r={12} fill={TEAL} /><path d="M 18 40 L 8 44 L 18 46 Z" fill={GOLD} /><path d="M 50 50 Q 70 20 84 44 Z" fill="#0B7A8A" />
    </motion.svg>
  );
  return (
    <>
      <Svg><Draw d="M 760 640 C 960 560, 1200 520, 1520 600" color="#9BB86A" width={4} dur={1.2} /></Svg>
      <Cut src={`${CAST}/jiddo-advice`} x={880} y={830} h={310} />
      {lines >= 1 && bird(1010, 560, 110, 0.3)}
      {lines >= 1 && bird(1400, 470, 50, 0.6)}
      {lines >= 2 && (
        <>
          <Chip x={1065} y={690} color={TEAL} delay={0.2}>near: هَذَا</Chip>
          <Chip x={1425} y={540} color={CRIMSON} delay={0.5}>far: ?</Chip>
          <Svg><Draw d="M 960 470 Q 1180 380 1380 480" color={GOLD} width={3} dash="3 10" delay={0.4} dur={1} /></Svg>
        </>
      )}
      {lines >= 3 && <Chip x={1425} y={590} color={CRIMSON} delay={0.3}><Hear id="dhalika">ذَلِكَ</Hear></Chip>}
      {lines >= 3 && <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 1180, top: 760, fontSize: 18, color: soft('light') }}>next time</span>}
    </>
  );
}
