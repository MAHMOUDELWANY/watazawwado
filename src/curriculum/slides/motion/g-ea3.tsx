import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Icon, DEEP } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Tile, Street, Stairs, useMirror, GROUND, ADAM, SAYED, MONA } from './g-ea1';
import { ELDER } from './g-ea2';

/**
 * Egyptian Arabic · Adults · Lesson 3 · What's This? Same building and cast. The motion carries the lesson's one idea:
 * "this" has two forms, and the end of the word chooses: ده in teal, دي in crimson, everywhere on every page.
 */

const DA = TEAL;
const DI = CRIMSON;
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/** The covered plate; `open` lifts the cover. `dishes` shows the food once it is open. */
function Plate({ x, y, open, dishes = 1 }: { x: number; y: number; open: boolean; dishes?: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }}>
      <span className="absolute block rounded-full" style={{ left: 0, top: 30, width: 160, height: 20, background: '#E9DCC3', boxShadow: SHADOW }} />
      {open && (
        <>
          <motion.span className="absolute block rounded-full" style={{ left: 22, top: 14, width: 60, height: 24, background: '#6E8B3D' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
          {dishes >= 2 && <motion.span className="absolute block rounded-[6px]" style={{ left: 90, top: 12, width: 50, height: 26, background: '#D9A54A' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} />}
        </>
      )}
      <motion.span className="absolute block" style={{ left: 18, top: -20, width: 124, height: 56, borderRadius: '64px 64px 8px 8px', background: 'linear-gradient(180deg, #D9C9A8, #B9A27A)' }}
        initial={false} animate={{ y: open ? -80 : 0, x: open ? 60 : 0, rotate: open ? 24 : 0, opacity: open ? 0 : 1 }} transition={{ duration: 0.9, ease }} />
    </div>
  );
}

/** A thing card: icon above, ده / دي + the word below, tinted by the form; tap plays the clip. */
export function Thing({ x, y, icon, word, fem, id, delay = 0, hot = false }: { x: number; y: number; icon: string; word: string; fem: boolean; id?: string; delay?: number; hot?: boolean }) {
  const c = fem ? DI : DA;
  const body = (
    <motion.div className="flex flex-col items-center rounded-[22px]" style={{ width: 168, padding: '14px 8px 8px', background: CARD, boxShadow: hot ? `0 0 0 4px ${c}, 0 0 30px 6px ${c}44` : SHADOW, pointerEvents: 'auto' }}
      initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay, ease }}>
      <Icon name={icon} size={54} color={c} />
      <ArText size={30}><span style={{ color: c }}>{fem ? 'دي' : 'ده'}</span> {word}</ArText>
    </motion.div>
  );
  return <div className="absolute" style={{ left: x - 84, top: y - 70 }}>{id ? <Hear id={id}>{body}</Hear> : body}</div>;
}

/* ---------- spark ---------- */

export function Ea3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Street />
      <Person x={1060} y={GROUND} scale={1.05} color={ADAM} />
      <Person x={1380} y={GROUND} scale={1.0} color={ELDER} hijab delay={0.2} />
      <Plate x={1150} y={560} open={false} />
      <Say x={1060} y={500} text="إيه ده؟" width={170} delay={1.2} accent />
    </>
  );
}

export function Ea3PlateGraphic({ lines }: GraphicProps) {
  const m = useMirror();
  const open = lines >= 2;
  return (
    <>
      <Street />
      <Person x={1180} y={GROUND} scale={1.05} color={ADAM} flip />
      {lines >= 1 && <Person x={1400} y={GROUND} scale={1.0} color={ELDER} hijab delay={0.2} />}
      {lines >= 1 && <Plate x={1250} y={560} open={open} />}
      {open && <Say x={1180} y={500} id="eh-da" text="إيه ده؟" width={170} delay={0.6} accent />}
      {lines >= 3 && (
        <>
          <Tile x={m(1290)} y={290} size={56}>إيه</Tile>
          <Tile x={m(1060)} y={290} size={56} color={DA}>ده</Tile>
          <Chip x={m(1290)} y={345} delay={0.3}>what</Chip>
          <Chip x={m(1060)} y={345} color={DA} delay={0.4}>this</Chip>
        </>
      )}
    </>
  );
}

/** The doorway, three exchanges, each replacing the last. */
export function Ea3ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Street />
      <Person x={1150} y={GROUND} scale={1.05} color={ADAM} />
      <Person x={1420} y={GROUND} scale={1.0} color={ELDER} hijab flip />
      <Plate x={1215} y={575} open dishes={2} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={1150} y={420} id="l-1" text="إيه ده يا طنط؟" width={250} delay={0.3} />
          <Say x={1420} y={540} id="l-2" text={<><span style={{ color: DA }}>ده</span> محشي.</>} align="right" width={190} delay={1.6} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1150} y={420} id="l-3" text={<>وإيه <span style={{ color: DI }}>دي</span>؟</>} width={180} />
          <Say x={1420} y={540} id="l-4" text={<><span style={{ color: DI }}>دي</span> بسبوسة. بالهنا والشفا!</>} align="right" width={360} delay={1.3} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <div className="pointer-events-none absolute" style={{ left: 1050, top: 600 }}><Icon name="fork" size={60} color={INK_TEXT} /></div>
          <Say x={1150} y={420} id="l-5" text="وإيه دي؟" width={180} thought />
          <Say x={1420} y={540} id="l-6" text="دي شوكة يا آدم!" align="right" width={260} delay={1.3} accent />
        </React.Fragment>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** Two forms of "this": the plate splits into a ده side and a دي side. */
export function Ea3DaDiGraphic({ lines }: GraphicProps) {
  const m = useMirror();
  return (
    <>
      {lines >= 1 && (
        <>
          <Tile x={m(1320)} y={260} size={80} color={DA}><Hear id="da">ده</Hear></Tile>
          <Tile x={m(1000)} y={260} size={80} color={DI} delay={0.3}><Hear id="di">دي</Hear></Tile>
          <Chip x={m(1320)} y={340} color={DA} delay={0.4}>this · masculine</Chip>
          <Chip x={m(1000)} y={340} color={DI} delay={0.5}>this · feminine</Chip>
        </>
      )}
      {lines >= 2 && (
        <>
          <Tile x={m(1320)} y={470} size={48} from={{ x: 0, y: -60 }}><Hear id="da-mahshi"><span style={{ color: DA }}>ده</span> محشي</Hear></Tile>
          <Tile x={m(1000)} y={470} size={48} from={{ x: 0, y: -60 }} delay={0.3}><Hear id="di-basbousa"><span style={{ color: DI }}>دي</span> بسبوسة</Hear></Tile>
        </>
      )}
      {lines >= 3 && (
        <>
          <Tile x={m(1320)} y={640} size={44} delay={0.2}><Hear id="eh-da">إيه <span style={{ color: DA }}>ده</span>؟</Hear></Tile>
          <Tile x={m(1000)} y={640} size={44} delay={0.4}><Hear id="eh-di">إيه <span style={{ color: DI }}>دي</span>؟</Hear></Tile>
          <Svg><Draw d={`M ${m(1320)} 600 L ${m(1320)} 510`} color={DA} width={3} dash="4 8" dur={0.5} delay={0.6} /><Draw d={`M ${m(1000)} 600 L ${m(1000)} 510`} color={DI} width={3} dash="4 8" dur={0.5} delay={0.7} /></Svg>
        </>
      )}
    </>
  );
}

/** The end of the word decides: words drop onto a ـة lens and light up crimson, the rest teal. */
export function Ea3TaGraphic({ lines }: GraphicProps) {
  const m = useMirror();
  return (
    <>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: m(1160) - 90, top: 160, width: 180, height: 180, background: CARD, boxShadow: `0 0 0 6px ${DI}, 0 0 40px 10px ${DI}33` }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}>
          <ArText size={90} color={DI}>ـة</ArText>
        </motion.div>
      )}
      {lines >= 2 && (
        <>
          <Thing x={m(1330)} y={480} icon="bag" word="شنطة" fem id="di-shanta" />
          <Thing x={m(1130)} y={480} icon="table" word="ترابيزة" fem id="di-tarabeza" delay={0.3} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Thing x={m(930)} y={480} icon="chair" word="كرسي" fem={false} id="da-kursi" />
          <Thing x={m(1130)} y={680} icon="door" word="باب" fem={false} id="da-bab" delay={0.3} />
        </>
      )}
      {lines >= 4 && <Chip x={m(1330)} y={680} color={GOLD} delay={0.2}>a few دي words have no ـة</Chip>}
    </>
  );
}

const FLAT = [
  { icon: 'door', word: 'الباب', fem: false, id: 'da-ilbab' },
  { icon: 'window', word: 'الشباك', fem: false, id: 'da-ishshibbak' },
  { icon: 'sofa', word: 'الكنبة', fem: true, id: 'di-ilkanaba' },
  { icon: 'fridge', word: 'التلاجة', fem: true, id: 'di-ittallaga' },
  { icon: 'tv', word: 'التليفزيون', fem: false, id: 'da-ittilifizyon' },
  { icon: 'bed', word: 'السرير', fem: false, id: 'da-issirir' },
  { icon: 'chair', word: 'الكرسي', fem: false },
  { icon: 'table', word: 'الترابيزة', fem: true },
  { icon: 'bowl', word: 'المطبخ', fem: false, id: 'da-ilmatbakh' },
];

/** Mona's tour: the flat's things appear room by room as cards, 3 × 3. */
export function Ea3FlatGraphic({ lines }: GraphicProps) {
  const m = useMirror();
  const shown = lines >= 3 ? 9 : lines >= 2 ? 4 : 0;
  return (
    <>
      {lines === 1 && (
        <>
          <Person x={1100} y={GROUND} scale={1.0} color={MONA} hijab />
          <Person x={1350} y={GROUND} scale={1.05} color={ADAM} delay={0.2} flip />
          <Say x={1100} y={500} text="تعالى!" width={150} delay={0.4} accent />
        </>
      )}
      {FLAT.slice(0, shown).map((t, i) => (
        <Thing key={t.word} x={m(1360 - (i % 3) * 200)} y={240 + Math.floor(i / 3) * 190} icon={t.icon} word={t.word} fem={t.fem} id={t.id} delay={i >= 4 && lines >= 3 ? (i - 4) * 0.15 : i * 0.15} hot={i === 8 && lines >= 3} />
      ))}
    </>
  );
}

/** On the stairs: ده عم سيد, دي منى; the pointer lights each one. */
export function Ea3PeopleGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Street />
      <Stairs />
      <Person x={1000} y={GROUND} scale={1.05} color={SAYED} glow={lines >= 2} />
      <Person x={1300} y={GROUND - 140} scale={1.0} color={MONA} hijab flip glow={lines >= 2} />
      <Person x={1150} y={GROUND} scale={1.02} color={ADAM} delay={0.1} />
      <Person x={830} y={GROUND} scale={1.02} color={DEEP} delay={0.2} />
      {lines >= 2 && (
        <>
          <Say x={1000} y={540} id="da-amm-sayed" text={<><span style={{ color: DA }}>ده</span> عم سيد.</>} width={210} />
          <Say x={1300} y={400} id="di-mona" text={<>و<span style={{ color: DI }}>دي</span> منى.</>} align="right" width={170} delay={1.2} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1000} y={240} color={DA} delay={0.2}>ده · a man</Chip>
          <Chip x={1300} y={240} color={DI} delay={0.4}>دي · a woman</Chip>
        </>
      )}
    </>
  );
}

/** Look, check the end, choose: three steps as a path. */
export function Ea3RecapGraphic({ lines }: GraphicProps) {
  const steps = [{ n: 'eye', t: 'look' }, { n: 'search', t: 'check the end' }, { n: 'check', t: 'choose' }];
  return (
    <>
      {lines >= 1 && steps.map((s, i) => (
        <motion.div key={s.t} className="pointer-events-none absolute flex flex-col items-center gap-2" style={{ left: 880 + i * 220, top: 230, width: 160 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3, duration: 0.6, ease }}>
          <span className="flex items-center justify-center rounded-full font-sans font-black" style={{ width: 80, height: 80, background: CARD, boxShadow: SHADOW, fontSize: 34, color: GOLD }}>{i + 1}</span>
          <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>{s.t}</span>
        </motion.div>
      ))}
      {lines >= 2 && (
        <>
          <Tile x={1320} y={520} size={64} color={DI}>دي</Tile>
          <Chip x={1320} y={580} color={DI} delay={0.2}>ends in ـة, or a woman</Chip>
          <Tile x={1000} y={520} size={64} color={DA} delay={0.3}>ده</Tile>
          <Chip x={1000} y={580} color={DA} delay={0.5}>otherwise</Chip>
        </>
      )}
    </>
  );
}

/* ---------- athar / ahd ---------- */

export function Ea3TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1000} y={GROUND} scale={1.05} color={ELDER} hijab />
      <Person x={1320} y={GROUND} scale={1.05} color={ADAM} delay={0.2} flip />
      <Chip x={1320} y={520} color={ADAM}>you</Chip>
      {lines >= 1 && (
        <>
          <Thing x={1160} y={300} icon="cup" word="كوباية" fem />
          <Say x={1000} y={540} id="eh-di" text="إيه دي؟" width={160} delay={0.4} />
        </>
      )}
    </>
  );
}

export function Ea3MissionGraphic({ lines }: GraphicProps) {
  const notes = [
    { x: 940, y: 260, r: -4, t: 'ده الباب', c: DA }, { x: 1250, y: 230, r: 3, t: 'دي الترابيزة', c: DI },
    { x: 1080, y: 470, r: 2, t: 'ده الشباك', c: DA }, { x: 1350, y: 480, r: -3, t: 'دي التلاجة', c: DI }, { x: 900, y: 600, r: 5, t: 'ده الكرسي', c: DA },
  ];
  return (
    <>
      {lines >= 1 && notes.map((n, i) => (
        <motion.div key={n.t} className="pointer-events-none absolute flex items-center justify-center" style={{ left: n.x, top: n.y, width: 210, height: 130, background: '#FCE9A6', boxShadow: '0 16px 26px -16px rgba(60,40,0,0.55)', borderTop: `10px solid ${n.c}` }}
          initial={{ opacity: 0, scale: 0.6, rotate: 0 }} animate={{ opacity: 1, scale: 1, rotate: n.r }} transition={{ delay: 0.2 + i * 0.25, type: 'spring', bounce: 0.45 }}>
          <ArText size={32}>{n.t}</ArText>
        </motion.div>
      ))}
    </>
  );
}

/** Adam searching: cushions fly, the question rises. */
export function Ea3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1160} y={GROUND} scale={1.05} color={ADAM} lean={lines >= 2 ? -8 : 0} />
      {lines >= 2 && [0, 1, 2].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute block rounded-[14px]" style={{ left: 1140, top: 700, width: 70, height: 40, background: [GOLD, CRIMSON, TEAL][i] }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }} animate={{ x: [-260, 220, -120][i], y: [-260, -200, -330][i], rotate: [200, -160, 90][i], opacity: 1 }} transition={{ duration: 1.1, delay: i * 0.2, ease }} />
      ))}
      {lines >= 2 && <Say x={1160} y={500} id="fen-ilmafatih" text="فين المفاتيح؟" width={240} delay={0.8} accent />}
      {lines >= 3 && <div className="pointer-events-none absolute" style={{ left: 1380, top: 760 }}><Icon name="key" size={44} color={GOLD} /></div>}
    </>
  );
}
