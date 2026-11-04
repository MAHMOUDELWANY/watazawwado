import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Stairs, ADAM, MONA, SAYED } from './g-ea1';

/**
 * Egyptian Arabic · Adults · Advanced · Lesson 2 · As They Say… New device: the saying card. Its face is the saying's
 * literal picture (a torn calendar page, a short blanket, one hand, a key) drawn in code; it flips over to show what the
 * saying really means. The cast continues from Lesson 1 on the stairs.
 */

const HASSAN = '#5A4636';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
type Pic = 'past' | 'blanket' | 'hand' | 'key';

function Picture({ pic }: { pic: Pic }) {
  return (
    <svg viewBox="0 0 160 120" width={160} height={120}>
      {pic === 'past' && <g><rect x={40} y={14} width={80} height={92} rx={8} fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={3} /><rect x={40} y={14} width={80} height={22} rx={6} fill={CRIMSON} /><path d="M52 52 L108 96 M108 52 L52 96" stroke={INK_TEXT} strokeWidth={5} opacity={0.5} /></g>}
      {pic === 'blanket' && <g><rect x={20} y={40} width={96} height={50} rx={12} fill={GOLD} /><rect x={116} y={70} width={30} height={12} rx={6} fill="#E8C9A0" /><rect x={116} y={56} width={30} height={12} rx={6} fill="#E8C9A0" /><circle cx={18} cy={50} r={14} fill="#E8C9A0" /></g>}
      {pic === 'hand' && <g><rect x={60} y={50} width={40} height={56} rx={14} fill="#E8C9A0" />{[0, 1, 2, 3].map((i) => <rect key={i} x={60 + i * 10} y={18} width={9} height={40} rx={4} fill="#E8C9A0" />)}<rect x={46} y={56} width={18} height={9} rx={4} fill="#E8C9A0" transform="rotate(-30 50 60)" /><path d="M118 40 q10 20 0 40" stroke={INK_TEXT} strokeWidth={3} fill="none" opacity={0.3} /></g>}
      {pic === 'key' && <g><circle cx={50} cy={60} r={24} fill="none" stroke={GOLD} strokeWidth={10} /><rect x={72} y={55} width={70} height={10} fill={GOLD} /><rect x={120} y={64} width={8} height={18} fill={GOLD} /><rect x={134} y={64} width={8} height={12} fill={GOLD} /></g>}
    </svg>
  );
}

/** A saying card at (x, y): picture side, flipping to the meaning when `flip`. */
function SayingCard({ x, y, pic, saying, meaning, id, flip = false, delay = 0, w = 260 }: { x: number; y: number; pic: Pic; saying: string; meaning: string; id?: string; flip?: boolean; delay?: number; w?: number }) {
  const face: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 18, boxShadow: SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 };
  const cap = <ArText size={22}>{saying}</ArText>;
  return (
    <div className="absolute" style={{ left: x - w / 2, top: y - 110, width: w, height: 220, perspective: 900 }}>
      <motion.div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }} initial={{ opacity: 0, y: 20, rotateY: 0 }} animate={{ opacity: 1, y: 0, rotateY: flip ? 180 : 0 }} transition={{ opacity: { duration: 0.5, delay }, y: { duration: 0.5, delay }, rotateY: { duration: 0.8, delay: delay + 0.5, ease } }}>
        <div style={{ ...face, background: '#FFFDF8' }}>
          <Picture pic={pic} />
          {id ? <Hear id={id}>{cap}</Hear> : cap}
        </div>
        <div style={{ ...face, background: TEAL, transform: 'rotateY(180deg)' }}>
          <span className="text-center font-sans font-black" style={{ fontSize: 22, color: '#fff', lineHeight: 1.25 }}>{meaning}</span>
          <ArText size={18} color="#E7FAFC">{saying}</ArText>
        </div>
      </motion.div>
    </div>
  );
}

const CARDS: { pic: Pic; saying: string; meaning: string }[] = [
  { pic: 'past', saying: 'اللي فات مات', meaning: 'Look forward' },
  { pic: 'blanket', saying: 'على قد لحافك مد رجليك', meaning: 'Spend what you have' },
  { pic: 'hand', saying: 'إيد لوحدها ما تسقفش', meaning: 'Do it together' },
  { pic: 'key', saying: 'الصبر مفتاح الفرج', meaning: 'Wait, it will ease' },
];

/* ---------- spark ---------- */

export function Ea32CoverGraphic(_: GraphicProps) {
  return (
    <>
      {CARDS.map((c, i) => <SayingCard key={c.pic} x={1010 + (i % 2) * 300} y={270 + Math.floor(i / 2) * 250} pic={c.pic} saying={c.saying} meaning={c.meaning} w={270} delay={0.2 + i * 0.15} flip={i === 3} />)}
    </>
  );
}

export function Ea32RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={HASSAN} />
      <Person x={1320} y={800} scale={1} color={SAYED} />
      <Say x={1000} y={570} id="maak-ha2-bass" text="معاك حق، بس…" width={200} size={26} delay={0.2} />
      {lines >= 2 && <Chip x={1160} y={300} color={GOLD} delay={0.2}>the last word: a saying</Chip>}
      {lines >= 3 && <Say x={1320} y={420} id="elli-fat-mat" text="اللي فات مات." align="right" width={190} size={28} accent delay={0.2} />}
    </>
  );
}

export function Ea32StreetGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const spots = ['the grocer', 'a taxi', 'family lunch'];
  return (
    <>
      {spots.slice(0, lines >= 2 ? 3 : 1).map((s, i) => (
        <React.Fragment key={s}>
          <Person x={950 + i * 220} y={740} scale={0.75} color={[SAYED, TEAL, MONA][i]} hijab={i === 2} delay={i * 0.15} />
          <Say x={950 + i * 220} y={580} text="زي ما بيقولوا…" width={190} size={22} delay={0.3 + i * 0.2} />
          <Chip x={950 + i * 220} y={755} delay={0.5 + i * 0.2}>{s}</Chip>
        </React.Fragment>
      ))}
      {lines >= 3 && <Chip x={1170} y={300} color={CRIMSON} delay={0.2}>the lift: still a problem</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Ea32StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Stairs />
      <Person x={880} y={800} scale={0.95} color={HASSAN} />
      <Person x={1040} y={800} scale={0.95} color={SAYED} />
      <Person x={1180} y={800} scale={0.95} color={ADAM} />
      <Person x={1330} y={570} scale={0.95} color={MONA} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={880} y={580} id="story-1" text="دفعنا كتير في الدهان السنة اللي فاتت…" width={380} size={21} delay={0.2} />
          <Say x={1040} y={420} id="story-2" text="اللي فات مات يا أستاذ حسن." width={300} size={23} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1330} y={340} id="story-3" text="على قد لحافك مد رجليك. نجيب أسانسير صغير." align="right" width={430} size={21} accent delay={0.2} />
          <Say x={1180} y={580} id="story-4" text="وكلنا نساعد. إيد لوحدها ما تسقفش." align="right" width={370} size={21} delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1330} y={340} id="story-5" text="الأسانسير هيتأخر شهرين!" align="right" width={280} size={23} delay={0.2} />
          <Say x={1040} y={580} id="story-6" text="معلش… الصبر مفتاح الفرج." width={290} size={23} accent delay={1.4} />
        </React.Fragment>
      )}
    </>
  );
}

function One({ i, lines, id, children }: { i: number; lines: number; id: string; children?: React.ReactNode }) {
  if (lines < 1) return null;
  const c = CARDS[i];
  return (
    <>
      <SayingCard x={1150} y={330} pic={c.pic} saying={c.saying} meaning={c.meaning} id={id} flip={lines >= 2} w={340} />
      {children}
    </>
  );
}

export function Ea32FatGraphic({ lines }: GraphicProps) {
  return (
    <One i={0} lines={lines} id="elli-fat-mat-2">
      {lines >= 3 && <Chip x={1150} y={520} color={CRIMSON} delay={0.2}>things and plans · never a person who has died</Chip>}
    </One>
  );
}

export function Ea32LehafGraphic({ lines }: GraphicProps) {
  return (
    <One i={1} lines={lines} id="lehaf">
      {lines >= 3 && (
        <>
          <Chip x={1020} y={520} color={TEAL} delay={0.2}>kind: advice</Chip>
          <Chip x={1290} y={520} color={CRIMSON} delay={0.4}>sharp: a telling-off</Chip>
        </>
      )}
    </One>
  );
}

export function Ea32EedGraphic({ lines }: GraphicProps) {
  return (
    <One i={2} lines={lines} id="eed">
      {lines >= 3 && (
        <>
          <Person x={1000} y={800} scale={0.8} color={ADAM} />
          <Person x={1150} y={800} scale={0.8} color={MONA} hijab />
          <Person x={1300} y={800} scale={0.8} color={SAYED} />
        </>
      )}
    </One>
  );
}

export function Ea32SabrGraphic({ lines }: GraphicProps) {
  return (
    <One i={3} lines={lines} id="sabr">
      {lines >= 3 && <Chip x={1150} y={520} color={GOLD} delay={0.2}>معلش… + الصبر مفتاح الفرج</Chip>}
    </One>
  );
}

/** The wow: all four cards, picture side first, then flipped to their meanings. */
export function Ea32FlipGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {CARDS.map((c, i) => <SayingCard key={c.pic} x={1010 + (i % 2) * 300} y={270 + Math.floor(i / 2) * 250} pic={c.pic} saying={c.saying} meaning={c.meaning} w={270} delay={i * 0.12} flip={lines >= 2} />)}
      {lines >= 3 && <Chip x={1160} y={665} color={GOLD} delay={0.3}>picture → meaning</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ea32TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Stairs />
      <Person x={980} y={800} scale={1} color={ADAM} />
      <Person x={1330} y={570} scale={0.95} color="#8A5A3C" hijab />
      <Say x={1330} y={340} id="problem" text="الأسانسير لسه ما جاش… وأنا تعبت من السلم!" align="right" width={420} size={21} delay={0.2} />
      {lines >= 2 && <Say x={980} y={570} text="معلش…" width={130} size={28} accent delay={0.3} />}
    </>
  );
}

export function Ea32MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[18px]" style={{ left: 1000, top: 200, width: 300, height: 380, background: '#FFFDF8', boxShadow: SHADOW, border: `3px dashed ${GOLD}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} />
      <Chip x={1150} y={240} color={GOLD} delay={0.3}>their saying</Chip>
      {lines >= 2 && (
        <>
          <Chip x={1150} y={360} color={CRIMSON} delay={0.2}>the picture</Chip>
          <Chip x={1150} y={460} color={TEAL} delay={0.4}>the meaning</Chip>
        </>
      )}
    </>
  );
}

export function Ea32NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1.05} color={ADAM} />
      <motion.div className="pointer-events-none absolute flex items-center gap-[3px] rounded-full" style={{ left: 980, top: 260, width: 420, height: 64, padding: '0 22px', background: '#2A1E18', boxShadow: SHADOW }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        {Array.from({ length: 60 }, (_, i) => <motion.span key={i} className="rounded-full" style={{ width: 3, background: GOLD }} initial={{ height: 4 }} animate={{ height: 6 + ((i * 41) % 34) }} transition={{ delay: 0.3 + i * 0.01, duration: 0.2 }} />)}
      </motion.div>
      {lines >= 2 && <Chip x={1190} y={360} color={CRIMSON} delay={0.2}>×2 … 3 words?</Chip>}
      {lines >= 3 && (
        <div className="absolute" style={{ left: 1190, top: 470, transform: 'translate(-50%, -50%)' }}>
          <Hear id="fast"><span className="inline-flex rounded-full" style={{ padding: '4px 20px', background: '#FFFDF8', boxShadow: SHADOW }}><ArText size={24}>بقولك إيه… الأسانسير جه!</ArText></span></Hear>
        </div>
      )}
    </>
  );
}
