import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCue } from '../sfx';
import { CountUp, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Orb, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Label } from './graphics';
import { Svg, Draw, Chip, Big, Ar, Meter, Icon, Badge, Person, Figure, Bubble, DEEP, SAND } from './kit';
import { QuoteCard, Notebook, Door, Stamp, Stars, Thing } from './g-shared';

/* Adults Lesson 2: A World That Should Not Exist. One graphic per page; each build step adds one change that means
   something (brief: docs/curriculum/zad-essentials-adults/L02-a-world-that-should-not-exist.md). Companions are never
   drawn: Jubayr is a point of light the recited words reach. */

const HAWKING = 'Because there is a law such as gravity, the universe can and will create itself from nothing.';
const DOOR_X = [900, 1130, 1360];
const DOOR_C = [CRIMSON, GOLD, TEAL];
const DOORS = [
  { t: 'From nothing', s: 'no cause at all' },
  { t: 'By itself', s: 'it made itself' },
  { t: 'By another', s: 'something outside it' },
];

/* ---------- Cover: a single point appears in the dark, and a whole sky opens out of it. ---------- */

export function A2CoverGraphic() {
  const reduce = useReduce();
  useCue('riser', 1, 0.6);
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute" style={{ left: 1150, top: 470 }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1, 1.4, 1], opacity: 1 }} transition={{ duration: 2, delay: 0.6, ease }}>
        <Orb size={34} glow={2} />
      </motion.div>
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2 + (i % 5) * 0.3, r = 120 + ((i * 53) % 260);
        return (
          <motion.span key={i} className="absolute rounded-full" style={{ left: 1150, top: 470, width: i % 6 ? 3 : 6, height: i % 6 ? 3 : 6, background: '#FFF4D6', boxShadow: '0 0 10px #FFE7A8' }}
            initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: Math.cos(a) * r * 1.3, y: Math.sin(a) * r * 0.8, opacity: [0, 1, 0.8] }} transition={{ duration: reduce ? 0 : 3.2, delay: 2.2 + (i % 12) * 0.04, ease }} />
        );
      })}
      <motion.p className="absolute m-0 font-serif italic" style={{ left: 110, width: 700, top: 712, fontSize: 30, color: GOLD }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4.4, duration: 0.8 }}>
        Why is there anything, rather than nothing?
      </motion.p>
    </div>
  );
}

/* ---------- Recall: last week's page of Zad al-Yaqeen, the habit's days, and the way back to the source. ---------- */

export function A2RecallGraphic({ lines, tone }: GraphicProps) {
  return (
    <>
      <Notebook lines={lines} mode="read" lesson={2} prior={['knowing is not yet seeing.']} ticks={3} tone={tone} />
      {lines >= 4 && <Big x={800} y={730} w={680} tone={tone} size={34}>where does certainty <span style={{ color: CRIMSON }}>start?</span></Big>}
    </>
  );
}

/* ---------- The first question: the beliefs we will study stand on one question nobody asks. ---------- */

const STACK = ['the Day', 'the books', 'the angels'];

export function A2QuestionGraphic({ lines, tone }: GraphicProps) {
  useCue('brick', lines >= 1, 0.3);
  useCue('whoosh', lines >= 2, 0.2);
  useCue('pop', lines >= 4, 0.3);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 2 ? 0 : 1, y: lines >= 2 ? -60 : 0 }} transition={{ duration: 0.9, ease }}>
          {STACK.map((t, i) => (
            <motion.div key={t} className="absolute rounded-[12px] text-center font-serif" style={{ left: 1000, top: 250 + i * 86, width: 300, padding: '18px 0', fontSize: 28, background: ['#F3E3C4', '#EBD6B3', '#E2C9A2'][i], color: INK_TEXT }}
              initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.8, delay: 0.2 + (2 - i) * 0.2 }}>{t}</motion.div>
          ))}
          <motion.div className="absolute flex items-center justify-center rounded-[12px] font-serif" style={{ left: 960, top: 520, width: 380, height: 84, fontSize: 30, border: `3px dashed ${CRIMSON}`, color: CRIMSON }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>is there a Maker?</motion.div>
          <Label x={1150} y={616} text="what everything else stands on" tone={tone} />
        </motion.div>
      )}
      {lines >= 2 && (
        <>
          <motion.div className="absolute" style={{ left: 1150, top: 470 }} initial={{ scale: 0 }} animate={{ scale: reduce ? 1 : [0, 1.3, 1] }} transition={{ duration: 1.2, delay: 0.6 }}><Orb size={28} /></motion.div>
          <Label x={1150} y={510} text="something" tone={tone} strong />
          <Svg><motion.circle cx={1150} cy={470} r={210} fill="none" stroke={soft(tone)} strokeWidth={2} strokeDasharray="4 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.8 }} /></Svg>
          <Label x={1150} y={232} text="…rather than nothing" tone={tone} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={880} y={790} scale={0.7} color={TEAL} delay={0.2} />
          <Bubble x={880} y={640} text="Why is there anything?" tone={tone} width={220} delay={0.5} />
          <Figure x={1420} y={790} scale={1} pose="stand" arms="phone" look={18} color="#5B4636" delay={0.4} />
          <Label x={1420} y={800} text="stopped asking" tone={tone} />
        </>
      )}
      {lines >= 4 && (
        <>
          <Chip x={1040} y={180} strong>1 · your reasoning</Chip>
          <Chip x={1290} y={180} color={TEAL} delay={0.3}>2 · the Quran</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- A famous answer: the sentence types itself in, travels the world, and sounds final. ---------- */

export function A2HawkingGraphic({ lines, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.3);
  useCue('whoosh', lines >= 2, 0.2);
  useCue('stamp', lines >= 4, 0.4);
  const heads = ['"God is not needed"', '"Physics, not God"', '"The universe made itself"'];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && <QuoteCard x={790} y={190} w={700} quote={HAWKING} name="Stephen Hawking, with Leonard Mlodinow" source="The Grand Design, 2010" on tone={tone} size={31} />}
      {lines >= 2 && (
        <>
          <Badge x={1140} y={600} name="globe" size={96} color={TEAL} glow />
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="absolute rounded-full" style={{ left: 1140 - 60, top: 600 - 60, width: 120, height: 120, border: `2px solid ${TEAL}` }} initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ duration: 2.2, delay: i * 0.6, repeat: Infinity }} />
          ))}
        </>
      )}
      {lines >= 3 && heads.map((h, i) => (
        <motion.div key={h} className="absolute rounded-[8px] font-serif font-bold" style={{ left: 800 + i * 230, top: 690 + (i % 2) * 34, padding: '10px 14px', fontSize: 20, background: '#FFFDF8', color: INK_TEXT, boxShadow: '0 16px 30px -18px rgba(0,0,0,0.5)', rotate: [-3, 2, -1][i] }}
          initial={{ opacity: 0, y: -60, rotate: -12 }} animate={{ opacity: 1, y: 0, rotate: [-3, 2, -1][i] }} transition={{ type: 'spring', bounce: 0.3, delay: 0.2 + i * 0.25 }}>{h}</motion.div>
      ))}
      {lines >= 4 && <Chip x={1300} y={520} strong>final?</Chip>}
    </div>
  );
}

/* ---------- Nothing starts itself: a phone pulls its causes out behind it; every profession runs on the rule. ---------- */

const CHAIN = [{ t: 'shipped', i: 'car' }, { t: 'built', i: 'pen' }, { t: 'designed', i: 'light' }];

export function A2CauseGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.4);
  useCue('pen', lines >= 2, 0.2);
  useCue('pop', lines >= 3, 0.3);
  useCue('stamp', lines >= 4, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Badge x={1420} y={300} name="phone" size={110} color={INK_TEXT} glow />
          {CHAIN.map((c, i) => {
            const x = 1240 - i * 170;
            return (
              <React.Fragment key={c.t}>
                <Svg><Draw d={`M ${x + 46} 300 L ${x + 124} 300`} color={GOLD} width={3} delay={0.5 + i * 0.35} dur={0.4} /></Svg>
                <Badge x={x} y={300} name={c.i} size={78} delay={0.6 + i * 0.35} />
                <Label x={x} y={350} text={c.t} tone={tone} />
              </React.Fragment>
            );
          })}
          <Label x={1420} y={366} text="it began" tone={tone} strong />
        </>
      )}
      {lines >= 2 && ['a crack in the wall', 'a fever', 'a rumour at work'].map((t, i) => (
        <motion.div key={t} className="absolute flex items-center gap-3 font-sans font-bold" style={{ left: 840, top: 400 + i * 40, fontSize: 19, color: ink(tone) }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.25 }}>
          <span>{t}</span><span style={{ color: CRIMSON }}>← what caused it?</span>
        </motion.div>
      ))}
      {lines >= 3 && (
        <div className="absolute flex gap-4" style={{ left: 840, top: 540 }}>
          {[{ t: 'every lab', n: 'light' }, { t: 'every court', n: 'scroll' }, { t: 'every doctor', n: 'heart' }].map((b, i) => (
            <motion.div key={b.t} className="flex items-center gap-2 rounded-full font-sans font-bold" style={{ padding: '8px 16px', fontSize: 17, background: '#FFFDF8', color: INK_TEXT, boxShadow: '0 10px 24px -14px rgba(0,0,0,0.45)' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.2 }}>
              <Icon name={b.n} size={20} color={TEAL} /> {b.t} <Icon name="check" size={18} color={TEAL} width={3} />
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 4 && <Stamp x={840} y={620} w={620} tone={tone}>Whatever <span style={{ color: CRIMSON }}>begins</span> to exist has a cause.</Stamp>}
      {interaction && (
        <motion.div className="absolute flex items-center justify-center rounded-[14px] font-sans font-bold" style={{ left: 1150, top: 730, width: 330, height: 60, border: `2px dashed ${soft(tone)}`, fontSize: 17, color: soft(tone) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          began, with no cause: ____
        </motion.div>
      )}
    </div>
  );
}

/* ---------- The universe began: galaxies drift apart; run it backwards and they meet in one beginning. ---------- */

const GAL = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2 + (i % 3) * 0.4, r: 120 + ((i * 71) % 170) }));

export function A2BeganGraphic({ lines, tone }: GraphicProps) {
  useCue('whoosh', lines >= 2, 0.3);
  useCue('riser', lines >= 3, 0.2);
  useCue('pop', lines >= 4, 0.4);
  const reduce = useReduce();
  const C = { x: 1130, y: 450 };
  const back = lines >= 3;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines === 1 && (
        <>
          <motion.div className="absolute rounded-full" style={{ left: C.x - 200, top: C.y - 200, width: 400, height: 400, border: `3px solid ${soft(tone)}` }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, rotate: reduce ? 0 : 360 }} transition={{ opacity: { duration: 0.6 }, scale: { duration: 0.6 }, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }} />
          <Big x={C.x - 300} y={C.y - 40} w={600} tone={tone} size={60}>∞</Big>
          <Label x={C.x} y={C.y + 230} text="always there?" tone={tone} strong />
        </>
      )}
      {lines >= 2 && (
        <>
          {GAL.map((g, i) => (
            <motion.span key={i} className="absolute rounded-full" style={{ left: C.x - 9, top: C.y - 9, width: 18, height: 18, background: `radial-gradient(circle, #FFF4D6, ${i % 2 ? GOLD : TEAL} 70%)`, boxShadow: `0 0 16px ${GOLD}` }}
              initial={false} animate={{ x: back ? 0 : Math.cos(g.a) * g.r * 1.4, y: back ? 0 : Math.sin(g.a) * g.r, opacity: back ? 0 : 1 }} transition={{ duration: reduce ? 0 : back ? 1.6 : 2.4, ease }} />
          ))}
          {!back && <motion.span className="absolute rounded-full" style={{ left: C.x - 330, top: C.y - 260, width: 660, height: 520, border: `2px solid ${CRIMSON}55`, boxShadow: `inset 0 0 80px ${CRIMSON}22` }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.4, ease }} />}
          {!back && <Label x={C.x + 200} y={C.y + 270} text="moving apart · the afterglow of a hot start" tone={tone} />}
        </>
      )}
      {back && (
        <>
          <motion.div className="absolute" style={{ left: C.x, top: C.y }} initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ duration: 1, delay: 1.4 }}><Orb size={40} glow={2} /></motion.div>
          <motion.div className="absolute flex items-baseline gap-3" style={{ left: 820, top: 640 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
            <CountUp to={13.8} decimals={1} size={84} color={CRIMSON} />
            <span className="font-sans font-semibold" style={{ fontSize: 22, color: soft(tone) }}>billion years ago · a beginning (NASA)</span>
          </motion.div>
        </>
      )}
      {lines >= 4 && (
        <>
          <Svg><Draw d={`M ${C.x - 240} ${C.y - 160} C ${C.x - 150} ${C.y - 160}, ${C.x - 60} ${C.y - 100}, ${C.x - 24} ${C.y - 24}`} color={CRIMSON} width={3} dash="6 8" /></Svg>
          <Chip x={C.x - 270} y={C.y - 200} strong>what caused it?</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- Only three ways: the beginning's path splits into three doors, and no fourth branch can be drawn. ---------- */

export function A2ThreeGraphic({ lines, items, interaction, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.2);
  useCue('pop', items, 0.2);
  const O = { x: 800, y: 250 };
  const XS = [960, 1190, 1420];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <motion.div className="absolute" style={{ left: O.x, top: O.y }} initial={{ scale: 0 }} animate={{ scale: 1 }}><Orb size={30} /></motion.div>
          <Label x={O.x} y={O.y + 26} text="it began" tone={tone} />
        </>
      )}
      {XS.map((x, i) => {
        const shown = interaction || i < items;
        if (!shown) return null;
        return (
          <React.Fragment key={i}>
            <Svg><Draw d={`M ${O.x + 16} ${O.y} C ${O.x + 120} ${O.y}, ${x} ${300}, ${x} ${400}`} color={i < items ? DOOR_C[i] : soft(tone)} width={i < items ? 4 : 2} dash={i < items ? undefined : '6 8'} dur={0.8} /></Svg>
            <Door x={x} y={640} state={i < items ? 'open' : 'waiting'} color={DOOR_C[i]} label={i < items ? DOORS[i].t : '?'} sub={i < items ? DOORS[i].s : undefined} tone={tone} delay={0.2} />
          </React.Fragment>
        );
      })}
      {items >= 3 && (
        <>
          <Svg><Draw d={`M ${O.x + 16} ${O.y} C ${O.x + 300} ${O.y - 60}, 1350 200, 1500 200`} color={soft(tone)} width={2} dash="3 10" dur={1.2} delay={0.6} /></Svg>
          <motion.div className="absolute" style={{ left: 1430, top: 214 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}><Chip x={40} y={0} tone={tone}>a fourth? <span style={{ color: CRIMSON }}>✕</span></Chip></motion.div>
        </>
      )}
    </div>
  );
}

/* ---------- Door one: everything people put inside "nothing" is lifted out and turns out to be something. ---------- */

const IN_NOTHING = ['space', 'a vacuum', 'an energy field', 'a law'];

export function A2NothingGraphic({ lines, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('whoosh', lines >= 2, 0.3);
  useCue('poof', lines >= 3, 0.2);
  useCue('strike', lines >= 4, 0.4);
  const BOX = { x: 800, y: 200, w: 400, h: 400 };
  const inside = lines === 1 ? [0] : lines === 2 ? [1, 2, 3] : [];
  const out = lines >= 2 ? (lines >= 3 ? [0, 1, 2, 3] : [0]) : [];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <motion.div className="absolute rounded-[24px]" style={{ left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, border: `3px dashed ${ink(tone)}55` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <span className="absolute font-sans font-bold uppercase" style={{ left: BOX.x + 20, top: BOX.y - 30, fontSize: 15, letterSpacing: '0.18em', color: CRIMSON }}>“nothing”</span>
        </>
      )}
      {inside.map((k, j) => (
        <motion.div key={`in${k}`} className="absolute rounded-[14px] text-center font-serif" style={{ left: BOX.x + 60, top: BOX.y + 70 + j * 90, width: BOX.w - 120, padding: '14px 0', fontSize: 26, background: k === 0 ? '#DCE9EC' : SAND, color: INK_TEXT }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + j * 0.25 }}>{IN_NOTHING[k]}</motion.div>
      ))}
      {out.map((k, j) => (
        <motion.div key={`out${k}`} className="absolute flex items-center gap-3 rounded-[14px] font-serif" style={{ left: 1230, top: 200 + j * 86, width: 300, padding: '12px 16px', fontSize: 23, background: '#FFFDF8', color: INK_TEXT, boxShadow: '0 16px 30px -20px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, x: -360, y: 80 - j * 40 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.9, delay: 0.3 + j * 0.2, ease }}>
          {IN_NOTHING[k]} <span className="ms-auto font-sans font-bold" style={{ fontSize: 14, color: TEAL }}>= something</span>
        </motion.div>
      ))}
      {lines >= 3 && (
        <motion.div className="absolute text-center font-sans font-bold" style={{ left: BOX.x, top: BOX.y + 150, width: BOX.w, fontSize: 20, lineHeight: 1.7, color: soft(tone) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          no power<br />no rules<br />no potential
        </motion.div>
      )}
      {lines >= 4 && (
        <>
          <Door x={1000} y={790} w={90} h={130} state="closed" color={CRIMSON} small tone={tone} delay={0.2} />
          <Label x={1260} y={730} text="door one: not an explanation" tone={tone} strong color={CRIMSON} />
        </>
      )}
    </div>
  );
}

/* ---------- Door two: a hand that has to draw itself into being; a square that cannot also be a circle. ---------- */

export function A2ItselfGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('thud', lines >= 3, 0.6);
  useCue('pop', lines >= 4, 0.3);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.3 : 1 }}>
          <Badge x={880} y={300} name="pen" size={86} color={DEEP} />
          <Label x={880} y={350} text="exists first" tone={tone} strong />
          <Svg><Draw d="M 940 300 C 1000 300, 1000 300, 1040 300" color={GOLD} width={3} /></Svg>
          <Person x={1110} y={380} scale={0.7} color={TEAL} delay={0.6} />
          <Label x={1110} y={392} text="then it makes" tone={tone} />
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.3 : 1 }}>
          <Person x={1380} y={420} scale={0.9} color={CRIMSON} dim delay={0.2} />
          <Svg><Draw d="M 1420 240 C 1520 180, 1530 400, 1430 410 C 1360 420, 1330 330, 1380 280" color={CRIMSON} width={3} dash="6 8" dur={1.6} delay={0.4} /></Svg>
          <Chip x={1380} y={450} strong>before it existed?</Chip>
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          <motion.div className="absolute" style={{ left: 1040, top: 420, width: 180, height: 180, background: GOLD }} initial={{ borderRadius: 0, rotate: 0 }} animate={reduce ? { borderRadius: 40 } : { borderRadius: [0, 90, 0, 90, 40], rotate: [0, 10, -10, 0] }} transition={{ duration: 3, ease: 'easeInOut' }} />
          <Svg><Draw d="M 1020 400 L 1240 620 M 1240 400 L 1020 620" color={CRIMSON} width={8} delay={1.8} dur={0.5} /></Svg>
          <Label x={1130} y={636} text="a square circle: a contradiction, not a mystery" tone={tone} strong />
        </>
      )}
      {lines >= 4 && DOOR_X.map((x, i) => (
        <Door key={i} x={x - 20 + i * 10} y={830} w={80} h={120} small state={i < 2 ? 'closed' : 'lit'} color={DOOR_C[i]} tone={tone} delay={0.2 + i * 0.2} />
      ))}
      {interaction && <Chip x={1400} y={560} color={TEAL}>by another: from outside it</Chip>}
    </div>
  );
}

/* ---------- At-Tur 52:35 (the wow): the learner's two closed doors slot under the ayah's own two questions. ---------- */

export function A2TurGraphic({ lines, tone }: GraphicProps) {
  useCue('whoosh', lines >= 1);
  useCue('reveal', lines >= 2, 0.4);
  useCue('pop', lines >= 3, 0.3);
  useCue('chime', lines >= 4, 0.3);
  const reduce = useReduce();
  const PH = ['مِنْ غَيْرِ شَيْءٍ', 'هُمُ ٱلْخَٰلِقُونَ'];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && DOOR_X.map((x, i) => (
        <motion.div key={i} className="absolute inset-0" initial={{ x: reduce ? 0 : -500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.2 + i * 0.25, ease }}>
          <Door x={x} y={560} state={i < 2 ? 'closed' : lines >= 2 ? 'lit' : 'waiting'} color={DOOR_C[i]} tone={tone} label={DOORS[i].t} />
          {i < 2 && (
            <motion.div className="absolute -translate-x-1/2 rounded-[14px] text-center" style={{ left: x, top: 220, padding: '10px 16px', background: '#FFFDF8', boxShadow: '0 16px 30px -18px rgba(0,0,0,0.5)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + i * 0.4 }}>
              <Ar size={30}>{PH[i]}</Ar>
            </motion.div>
          )}
          {i < 2 && <Svg><Draw d={`M ${x} 282 L ${x} 318`} color={DEEP} width={2} delay={1.2 + i * 0.4} dur={0.3} /></Svg>}
        </motion.div>
      ))}
      {lines >= 2 && (
        <>
          <motion.div className="absolute rounded-full" style={{ left: 1360 - 160, top: 330 - 60, width: 320, height: 320, background: `radial-gradient(circle, ${GOLD}66, transparent 70%)` }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4 }} />
          <motion.div className="absolute -translate-x-1/2 rounded-[14px] text-center font-sans font-bold" style={{ left: 1360, top: 220, padding: '12px 18px', fontSize: 18, border: `2px dashed ${TEAL}`, color: TEAL }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>left unnamed</motion.div>
          <Badge x={1360} y={680} name="head" size={70} color={TEAL} glow delay={0.8} />
          <Label x={1360} y={722} text="a mind already standing here" tone={tone} />
        </>
      )}
      {lines >= 3 && (
        <div className="absolute flex items-center gap-3" style={{ left: 800, top: 760 }}>
          {['one of three', 'two impossible', 'so: Allah created them'].map((t, i) => (
            <motion.span key={t} className="whitespace-nowrap rounded-full font-sans font-bold" style={{ padding: '8px 14px', fontSize: 16, background: i === 2 ? CRIMSON : '#FFFDF8', color: i === 2 ? '#fff' : INK_TEXT, boxShadow: '0 10px 20px -12px rgba(0,0,0,0.5)' }} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.35 }}>{t}{i < 2 ? '  →' : ''}</motion.span>
          ))}
        </div>
      )}
      {lines >= 4 && <Chip x={1150} y={170} color={TEAL}>Makkah, then · you, now</Chip>}
    </div>
  );
}

/* ---------- Then: Jubayr. A route to Madinah after Badr, the recitation travelling out, a heart that almost flies. ---------- */

export function A2JubayrGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('whoosh', lines >= 1, 0.2);
  useCue('chime', lines >= 2, 0.4);
  useCue('sparkle', interaction, 0.4);
  const reduce = useReduce();
  const LAMP = { x: 1330, y: 360 };
  const J = { x: 1060, y: 520 };
  return (
    <div className="pointer-events-none absolute inset-0">
      <Stars count={30} box={{ x: 780, y: 150, w: 740, h: 160 }} twinkle={false} />
      <Svg><Draw d="M 790 640 L 1520 640" color="rgba(246,241,232,0.35)" width={2} /></Svg>
      {lines >= 1 && (
        <>
          <Svg><Draw d={`M 800 700 C 880 680, 960 560, ${J.x} ${J.y}`} color={GOLD} width={3} dash="4 10" dur={1.6} /></Svg>
          <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 800, y: 700 }} animate={{ x: J.x, y: J.y }} transition={{ duration: reduce ? 0 : 2, ease }}><Orb size={22} /></motion.div>
          <Label x={840} y={720} text="after Badr, from Makkah" tone={tone} />
          <Badge x={LAMP.x} y={LAMP.y} name="light" size={86} color={GOLD} bg="rgba(42,14,16,0.85)" glow delay={0.6} />
          <Label x={LAMP.x} y={LAMP.y + 56} text="Madinah · Maghrib" tone={tone} strong />
        </>
      )}
      {lines >= 2 && [0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="absolute rounded-full" style={{ left: LAMP.x - 60, top: LAMP.y - 60, width: 120, height: 120, border: `2px solid ${GOLD}` }} initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: lines >= 3 ? 4.6 : 2.6, opacity: 0 }} transition={{ duration: 3, delay: i * 0.7, repeat: reduce ? 0 : Infinity }} />
      ))}
      {lines >= 2 && <Chip x={LAMP.x} y={LAMP.y - 110} color={DEEP}>Surah At-Tur</Chip>}
      {lines >= 3 && (
        <motion.div className="absolute -translate-x-1/2 rounded-[14px] text-center" style={{ left: J.x + 60, top: J.y - 260, padding: '10px 16px', background: 'rgba(255,253,248,0.95)' }} initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.6, ease }}>
          <Ar size={26}>أَمْ خُلِقُوا مِنْ غَيْرِ شَيْءٍ</Ar>
        </motion.div>
      )}
      {interaction && (
        <>
          <motion.div className="absolute" style={{ left: J.x - 45, top: J.y - 45 }} initial={{ y: 0, opacity: 0 }} animate={{ y: reduce ? -40 : [0, -90, -70], opacity: 1 }} transition={{ duration: 1.8, ease }}>
            <span className="flex h-[90px] w-[90px] items-center justify-center rounded-full" style={{ background: CRIMSON, boxShadow: `0 0 50px 14px ${CRIMSON}88` }}><Icon name="heart" size={48} color="#fff" /></span>
          </motion.div>
          <Label x={J.x - 60} y={J.y + 80} text="“my heart almost flew”" tone={tone} strong color={GOLD} />
        </>
      )}
    </div>
  );
}

/* ---------- 52:36: the proof bar is full; the certainty bar is not. The gap is the course. ---------- */

export function A2YaqeenGraphic({ lines, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('thud', lines >= 3, 0.5);
  useCue('chime', lines >= 4, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Meter x={800} y={230} w={680} value={1} color={TEAL} label="Proof in front of them" sub="the heavens, the earth, themselves" tone={tone} />
          <Meter x={800} y={340} w={680} value={0.18} color={CRIMSON} label="Certainty" sub="لا يوقنون" tone={tone} strong delay={0.3} />
        </>
      )}
      {lines >= 2 && (
        <>
          <Svg><Draw d="M 940 392 L 940 376 L 1470 376 L 1470 392" color={GOLD} width={3} /></Svg>
          <Label x={1205} y={396} text="the step from knowing to being sure" tone={tone} strong color={DEEP} />
        </>
      )}
      {lines >= 3 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 820 + i * 60, y: 470 }} animate={{ x: [820 + i * 60, 1120, 900 + i * 90], y: [470, 560, 520 + i * 30] }} transition={{ duration: 1.6, delay: i * 0.25, ease }}>
              <Badge x={0} y={0} name={['book', 'sun', 'light'][i]} size={52} color={TEAL} />
            </motion.div>
          ))}
          <Badge x={1180} y={560} name="heart" size={100} color={soft(tone)} />
          <Label x={1180} y={620} text="proofs that never landed" tone={tone} />
        </>
      )}
      {lines >= 4 && (
        <div className="absolute flex items-end gap-6" style={{ left: 800, top: 680 }}>
          {['Knowing', 'Certain knowledge', 'Seeing it'].map((t, i) => (
            <motion.div key={t} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.2 }}>
              <div className="rounded-t-[10px]" style={{ width: 190, height: 40 + i * 30, background: [SAND, GOLD, TEAL][i] }} />
              <p className="m-0 mt-1 font-sans font-bold" style={{ fontSize: 16, color: ink(tone) }}>{t}</p>
            </motion.div>
          ))}
          <Chip x={310} y={-56} strong>Lesson 1: the gap</Chip>
        </div>
      )}
    </div>
  );
}

/* ---------- Back to the sentence: each phrase lights up and is matched to the door it really chooses. ---------- */

export function A2BackGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.2);
  useCue('strike', lines >= 2, 0.4);
  useCue('strike', lines >= 3, 0.4);
  useCue('thud', lines >= 4, 0.4);
  const marks = [lines >= 2 ? 'a law such as gravity' : '', lines >= 3 ? 'create itself' : ''].filter(Boolean);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && <QuoteCard key={marks.join('|')} x={790} y={180} w={700} quote={HAWKING} name="Stephen Hawking, with Leonard Mlodinow" source="The Grand Design, 2010" on tone={tone} size={28} marks={marks} />}
      {lines >= 1 && DOOR_X.map((x, i) => <Door key={i} x={x} y={700} w={90} h={130} small state={i === 0 && lines >= 2 ? 'closed' : i === 1 && lines >= 3 ? 'closed' : i === 2 ? 'lit' : 'waiting'} color={DOOR_C[i]} label={DOORS[i].t} tone={tone} delay={0.4 + i * 0.15} />)}
      {lines >= 2 && <Chip x={900} y={480} color={TEAL}>a law is something, not nothing</Chip>}
      {lines >= 3 && <Chip x={1150} y={530} strong>this is door two</Chip>}
      {lines >= 4 && (
        <motion.div className="absolute flex items-center gap-4 rounded-[18px]" style={{ left: 1210, top: 420, padding: '14px 18px', background: '#FFFDF8', boxShadow: '0 20px 40px -24px rgba(0,0,0,0.5)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="font-serif" style={{ fontSize: 20, color: INK_TEXT }}>“if dropped,<br />it falls”</span>
          <span className="font-sans font-bold" style={{ fontSize: 15, color: TEAL }}>describes ✓<br /><span style={{ color: CRIMSON }}>makes ✕</span></span>
        </motion.div>
      )}
      {interaction && <Chip x={1150} y={770} strong>where did gravity come from?</Chip>}
    </div>
  );
}

/* ---------- How is not who: the lens explains the ink, the paper and the press; the author is a different question. ---------- */

export function A2HowGraphic({ lines, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('pen', lines >= 3, 0.6);
  useCue('sparkle', lines >= 4, 0.4);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <motion.div className="absolute rounded-[10px]" style={{ left: 840, top: 210, width: 560, height: 380, background: '#FFFBF2', boxShadow: '0 40px 80px -40px rgba(40,10,5,0.55)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="absolute bottom-6 left-1/2 top-6 w-px" style={{ background: 'rgba(31,22,18,0.15)' }} />
            {Array.from({ length: 9 }, (_, i) => <div key={i} className="absolute h-[6px] rounded-full" style={{ left: 28 + (i > 4 ? 290 : 0), top: 60 + (i % 5) * 52, width: 220 - (i % 3) * 30, background: 'rgba(31,22,18,0.25)' }} />)}
          </motion.div>
          <motion.div className="absolute rounded-full" style={{ left: 0, top: 0, width: 170, height: 170, border: `6px solid ${DEEP}`, background: 'rgba(255,255,255,0.35)' }} initial={{ x: 880, y: 250 }} animate={reduce ? { x: 960, y: 260 } : { x: [880, 1000, 960], y: [250, 320, 260] }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
          {['ink: chemistry', 'paper: physics', 'the press: engineering'].map((t, i) => <Chip key={t} x={930 + i * 200} y={650} delay={0.8 + i * 0.25} color={TEAL}>{t}</Chip>)}
          <Label x={1120} y={185} text="how" tone={tone} strong color={TEAL} />
        </>
      )}
      {lines >= 2 && (
        <motion.div className="absolute flex items-center justify-center whitespace-nowrap rounded-[12px] font-sans font-bold" style={{ left: 1110, top: 500, width: 270, height: 54, border: `2px dashed ${CRIMSON}`, color: CRIMSON, fontSize: 17, background: '#FFFBF2' }} initial={{ opacity: 0 }} animate={{ opacity: lines >= 3 ? 0.35 : 1 }}>who wrote it?</motion.div>
      )}
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 1140 540 C 1170 505, 1190 560, 1220 525 S 1290 520, 1350 532" color={DEEP} width={3} dur={1.4} delay={0.6} /></Svg>
          <Label x={1245} y={600} text="the author: a different question" tone={tone} strong color={DEEP} />
        </>
      )}
      {lines >= 4 && (
        <>
          <Chip x={1060} y={730} tone={tone}>“Do they not look…?”</Chip>
          <Badge x={1300} y={745} name="sun" size={56} color={GOLD} delay={0.3} />
          <Badge x={1380} y={745} name="globe" size={56} color={TEAL} delay={0.45} />
        </>
      )}
    </div>
  );
}

/* ---------- Who made God? A line of borrowers passes a request back for ever; only One who owns gives the pound. ---------- */

export function A2FirstGraphic({ lines, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.2);
  useCue('sparkle', lines >= 2, 0.4);
  useCue('pop', lines >= 3, 0.3);
  useCue('reveal', lines >= 4, 0.4);
  const reduce = useReduce();
  const XS = [1470, 1350, 1230, 1110, 990, 870];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.35 : 1 }}>
          <Stamp x={820} y={180} w={640} tone={tone}>Whatever <span style={{ color: CRIMSON }}>begins</span> has a cause</Stamp>
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.35 : 1 }}>
          <Svg><Draw d="M 820 380 L 1480 380" color={soft(tone)} width={2} /></Svg>
          {[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="absolute rounded-full" style={{ left: 900 + i * 120 - 7, top: 373, width: 14, height: 14, background: SAND, border: `2px solid ${soft(tone)}` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }} />)}
          <Label x={1140} y={394} text="things that began: each has a cause" tone={tone} />
          <motion.div className="absolute" style={{ left: 1150, top: 300 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}><Orb size={30} glow={1.6} /></motion.div>
          <Label x={1150} y={262} text="the First: nothing before Him" tone={tone} strong color={DEEP} />
        </motion.div>
      )}
      {lines >= 3 && XS.map((x, i) => (
        <React.Fragment key={i}>
          <Figure x={x} y={760} scale={0.62} pose="stand" arms={lines >= 4 ? 'open' : 'side'} flip color={['#5B4636', TEAL, CRIMSON, '#3E5C76', '#8B4935', '#5B4636'][i]} delay={0.1 + i * 0.12} />
          {lines === 3 && <Bubble x={x - 10} y={600} text="lend me one?" tone={tone} width={130} delay={0.6 + i * 0.25} />}
        </React.Fragment>
      ))}
      {lines === 3 && <motion.span className="absolute font-serif" style={{ left: 790, top: 660, fontSize: 40, color: soft(tone) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>…</motion.span>}
      {lines >= 4 && (
        <>
          <motion.div className="absolute" style={{ left: 790, top: 560 }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}><Orb size={56} glow={2} /></motion.div>
          <Label x={800} y={600} text="has it, unborrowed" tone={tone} strong color={DEEP} />
          {[0, 1, 2].map((k) => (
            <motion.span key={k} className="absolute flex h-[30px] w-[30px] items-center justify-center rounded-full font-sans font-bold" style={{ background: GOLD, color: '#3A1F08', fontSize: 14, boxShadow: `0 0 14px ${GOLD}` }}
              initial={{ left: 790, top: 545, opacity: 0 }} animate={{ left: reduce ? 1460 : [790, 1460], top: 545, opacity: [0, 1, 1] }} transition={{ duration: 2.4, delay: 0.6 + k * 0.5, ease }}>£</motion.span>
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- A world that can be read: the same law written under every galaxy, and a mind that reads it. ---------- */

export function A2OrderGraphic({ lines, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('sparkle', lines >= 3, 0.3);
  useCue('chime', lines >= 4, 0.4);
  const G = [{ x: 860, y: 640 }, { x: 1090, y: 600 }, { x: 1320, y: 650 }];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.p className="absolute m-0 font-serif italic" style={{ left: 820, top: 170, fontSize: 44, color: ink(tone) }} initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }} animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 1.6, ease }}>
          F = G · m₁m₂ / r²
        </motion.p>
      )}
      {lines >= 2 && <QuoteCard x={790} y={260} w={700} quote="The eternal mystery of the world is its comprehensibility." name="Albert Einstein" source="“Physics and Reality”, 1936" on tone={tone} size={28} dim={lines >= 3} />}
      {lines >= 3 && G.map((g, i) => (
        <motion.div key={i} className="absolute" style={{ left: g.x - 70, top: g.y - 70 }} initial={{ opacity: 0, scale: 0.5, rotate: -40 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.2, delay: 0.2 + i * 0.3, ease }}>
          <svg width={140} height={140} viewBox="-70 -70 140 140">
            {[0, 1, 2].map((k) => <path key={k} d={`M 0 0 C ${20 + k * 10} -${30 + k * 8}, ${50 + k * 6} -${10}, ${55 + k * 6} ${20}`} fill="none" stroke={[GOLD, TEAL, CRIMSON][k]} strokeWidth={3} transform={`rotate(${k * 120})`} />)}
            <circle r={8} fill="#FFF4D6" />
          </svg>
          <span className="absolute left-1/2 top-[140px] -translate-x-1/2 whitespace-nowrap rounded-full font-serif italic" style={{ padding: '4px 12px', fontSize: 15, background: '#FFFDF8', color: INK_TEXT }}>same law</span>
        </motion.div>
      ))}
      {lines >= 4 && (
        <>
          <Badge x={1460} y={470} name="head" size={84} color={DEEP} glow />
          <Svg>{G.map((g, i) => <Draw key={i} d={`M 1420 490 L ${g.x + 30} ${g.y - 30}`} color={GOLD} width={2} dash="4 8" delay={0.3 + i * 0.2} />)}</Svg>
          <Chip x={1150} y={780} strong>a will, not an accident</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- 41:53: the horizon outside, and a light inside a person for next week. ---------- */

export function A2SignsGraphic({ lines, tone }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.3);
  useCue('chime', lines >= 4, 0.4);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Stars count={50} box={{ x: 780, y: 150, w: 600, h: 420 }} />
          <Svg><Draw d="M 780 600 C 960 570, 1180 590, 1380 600" color={GOLD} width={3} /></Svg>
          <Label x={1000} y={620} text="out there · al-afaq" tone={tone} strong color={GOLD} />
          <Person x={1420} y={790} scale={1.1} color="#3E5C76" delay={0.4} />
          <Label x={1420} y={800} text="in here" tone={tone} strong />
        </>
      )}
      {lines >= 2 && (
        <>
          <Chip x={930} y={250} color={TEAL}>a beginning</Chip>
          <Chip x={1180} y={340} color={TEAL} delay={0.3}>laws that hold</Chip>
        </>
      )}
      {lines >= 3 && ['the heavens', 'the earth', 'our bodies'].map((t, i) => <Chip key={t} x={880 + i * 170} y={680} delay={0.2 + i * 0.2} tone={tone}>{t}</Chip>)}
      {lines >= 1 && (
        <motion.span className="absolute rounded-full" style={{ left: 1420 - 14, top: 790 - 100 - 14, width: 28, height: 28, background: GOLD }} initial={{ opacity: 0.3, scale: 0.6 }}
          animate={{ opacity: lines >= 4 ? 1 : 0.4, scale: lines >= 4 ? (reduce ? 1.2 : [1, 1.4, 1.2]) : 0.6, boxShadow: lines >= 4 ? `0 0 40px 14px ${GOLD}` : 'none' }} transition={{ duration: 1.4, repeat: lines >= 4 && !reduce ? Infinity : 0, repeatType: 'mirror' }} />
      )}
      {lines >= 4 && <Chip x={1420} y={520} strong>next week</Chip>}
    </div>
  );
}

/* ---------- Now: the drive home. City glow hides the sky; dim it and the stars were there all along. ---------- */

export function A2NowGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('whoosh', lines >= 2, 0.2);
  useCue('sparkle', lines >= 3, 0.4);
  const glow = lines >= 2 && lines < 3;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute" initial={{ opacity: 0 }} animate={{ opacity: lines >= 2 ? 0.45 : 1 }} style={{ left: 800, top: 170 }}>
          <Badge x={60} y={60} name="light" size={70} color={GOLD} bg="rgba(42,14,16,0.8)" glow />
          <span className="absolute whitespace-nowrap font-sans font-bold" style={{ left: 110, top: 46, fontSize: 18, color: GOLD }}>Then: one argument, and it stayed</span>
        </motion.div>
      )}
      {lines >= 3 && <Stars count={70} box={{ x: 780, y: 260, w: 740, h: 260 }} delay={0.6} />}
      {lines >= 2 && (
        <>
          <motion.div className="absolute" style={{ left: 780, top: 260, width: 740, height: 300, background: 'linear-gradient(180deg, transparent, rgba(229,120,60,0.55))' }} initial={{ opacity: 0 }} animate={{ opacity: glow ? 1 : 0.15 }} transition={{ duration: 1.4 }} />
          <Svg>
            <path d="M 780 560 L 780 470 L 840 470 L 840 430 L 900 430 L 900 500 L 960 500 L 960 400 L 1030 400 L 1030 480 L 1100 480 L 1100 440 L 1180 440 L 1180 510 L 1260 510 L 1260 420 L 1330 420 L 1330 490 L 1420 490 L 1420 450 L 1520 450 L 1520 560 Z" fill="#1A1416" />
          </Svg>
          {/* the windscreen: the dashboard and the frame of the car */}
          <Svg>
            <path d="M 760 820 L 820 560 L 1480 560 L 1540 820" fill="none" stroke="rgba(246,241,232,0.5)" strokeWidth={10} strokeLinejoin="round" />
            <rect x={760} y={760} width={780} height={60} rx={20} fill="#120C0A" />
          </Svg>
          <Label x={1150} y={700} text={glow ? 'brighter than the stars' : 'they were there all along'} tone={tone} strong color={glow ? '#F3B98A' : GOLD} />
        </>
      )}
      {lines >= 4 && <Chip x={1350} y={210} strong>will it stay?</Chip>}
      {interaction && <Chip x={1350} y={262} color={TEAL}>say it to someone, soon</Chip>}
    </div>
  );
}

/* ---------- Cases ---------- */

export function A2CaseGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('chime', interaction, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Person x={1350} y={790} scale={0.95} color={TEAL} flip />
          <Bubble x={1350} y={570} align="right" text="Our teacher said the Big Bang proves we don't need God." tone={tone} width={300} delay={0.4} />
          <Person x={950} y={790} scale={1.15} color={CRIMSON} delay={0.2} />
        </>
      )}
      {lines >= 2 && !interaction && <Bubble x={1350} y={380} align="right" thought text="What if it's true?" tone={tone} width={200} delay={0.3} />}
      {lines >= 3 && (
        <>
          <Badge x={880} y={250} name="clock" size={80} color={DEEP} />
          <Label x={880} y={296} text="3 minutes to dinner" tone={tone} strong />
        </>
      )}
      {interaction && (
        <div className="absolute" style={{ left: 1040, top: 250 }}>
          {DOOR_X.map((_, i) => <Door key={i} x={i * 110} y={230} w={80} h={120} small state={i < 2 ? 'closed' : 'lit'} color={DOOR_C[i]} tone={tone} delay={0.2 + i * 0.2} />)}
        </div>
      )}
    </div>
  );
}

export function A2Case2Graphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.3);
  useCue('chime', interaction, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Person x={1350} y={790} scale={1.1} color="#3E5C76" flip />
          <Bubble x={1350} y={540} align="right" text="If everything needs a cause, what caused God? Checkmate." tone={tone} width={320} delay={0.4} />
          <motion.span className="absolute font-serif" style={{ left: 1220, top: 230, fontSize: 90, color: INK_TEXT }} initial={{ opacity: 0, rotate: -20, y: -30 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ delay: 0.8, type: 'spring' }}>♚</motion.span>
          <Person x={930} y={790} scale={1.1} color={CRIMSON} delay={0.2} />
        </>
      )}
      {lines >= 2 && <Chip x={1060} y={260} tone={tone}>heard it on a podcast</Chip>}
      {lines >= 3 && [820, 1100, 1500].map((x, i) => <Person key={x} x={x} y={600} scale={0.55} color="#B9A58C" dim delay={0.2 + i * 0.15} />)}
      {interaction && (
        <>
          <Stamp x={800} y={150} w={420} tone={tone}>what <span style={{ color: CRIMSON }}>begins</span> has a cause</Stamp>
          <Chip x={1010} y={250} color={TEAL} delay={0.5}>Allah: the First, no beginning</Chip>
        </>
      )}
    </div>
  );
}

export function A2Case3Graphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('whoosh', lines >= 2, 0.3);
  useCue('chime', interaction, 0.3);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Svg>
            <rect x={1400} y={250} width={44} height={84} rx={22} fill={INK_TEXT} />
            <path d="M 1384 300 C 1384 360, 1460 360, 1460 300 M 1422 352 L 1422 392 M 1396 392 L 1448 392" fill="none" stroke={INK_TEXT} strokeWidth={6} strokeLinecap="round" />
            <motion.path d="M 900 200 L 860 300 L 900 300 L 860 400" fill="none" stroke={GOLD} strokeWidth={8} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
          </Svg>
          <Label x={880} y={420} text="thunder: explained" tone={tone} strong />
        </>
      )}
      {lines >= 2 && (
        <>
          <div className="absolute flex gap-1" style={{ left: 820, top: 500 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <motion.span key={i} className="block h-[40px] w-[50px] rounded-[6px]" style={{ background: i % 3 === 1 ? 'transparent' : SAND, border: i % 3 === 1 ? `2px dashed ${CRIMSON}` : 'none' }} initial={false} animate={{ opacity: i % 3 === 1 && !reduce ? [1, 0.2, 0] : 1 }} transition={{ duration: 2.4, delay: 0.4 + i * 0.1 }} />
            ))}
          </div>
          <Label x={1120} y={556} text="“the gaps will close, and God will be gone”" tone={tone} />
        </>
      )}
      {lines >= 3 && <Chip x={1180} y={430} tone={tone}>history on his side?</Chip>}
      {interaction && (
        <div className="absolute flex gap-3" style={{ left: 820, top: 640 }}>
          {['a beginning (found by science)', 'laws that hold (assumed by science)', 'anything to explain at all'].map((t, i) => (
            <motion.span key={t} className="rounded-[12px] font-sans font-bold" style={{ padding: '10px 14px', fontSize: 15, background: i === 2 ? CRIMSON : TEAL, color: '#fff' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.25 }}>{t}</motion.span>
          ))}
        </div>
      )}
    </div>
  );
}

export function A2Case4Graphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('whoosh', lines >= 2, 0.2);
  useCue('chime', interaction, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Figure x={980} y={780} scale={1.15} pose="chair" arms="side" look={lines >= 2 ? -10 : 0} color={TEAL} />
          <Badge x={980} y={300} name="head" size={86} color={TEAL} glow />
          {['nothing', 'itself', 'by another'].map((t, i) => <Chip key={t} x={860 + i * 120} y={370} delay={0.4 + i * 0.2} color={i === 2 ? TEAL : undefined} tone={tone}>{i < 2 ? '✕ ' : '✓ '}{t}</Chip>)}
        </>
      )}
      {lines >= 2 && (
        <>
          <motion.div className="absolute rounded-full" style={{ left: 1380, top: 190, width: 70, height: 70, boxShadow: 'inset -14px 6px 0 0 #F3D9A8' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <Badge x={1400} y={520} name="heart" size={80} color={soft(tone)} />
          <Svg><Draw d="M 1030 520 L 1350 520" color={soft(tone)} width={2} dash="4 10" /></Svg>
          <Label x={1190} y={540} text="far away, at night" tone={tone} />
        </>
      )}
      {lines >= 3 && <Bubble x={900} y={540} thought text="Is my iman broken?" tone={tone} width={200} delay={0.3} />}
      {interaction && (
        <div className="absolute" style={{ left: 1150, top: 640 }}>
          <Meter x={0} y={0} w={340} value={1} color={TEAL} label="Knowing" tone={tone} />
          <Meter x={0} y={70} w={340} value={0.35} color={GOLD} label="Certainty" sub="next week: the heart" tone={tone} strong delay={0.3} />
        </div>
      )}
    </div>
  );
}

/* ---------- Ahd and next time ---------- */

export function A2NotebookGraphic({ lines, tone }: GraphicProps) {
  return <Notebook lines={lines} mode="write" lesson={2} prior={['knowing is not yet seeing.']} tone={tone} />;
}

export function A2NextGraphic({ lines, tone }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('reveal', lines >= 3, 0.3);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      <Stars count={40} />
      {lines >= 1 && (
        <>
          <Badge x={940} y={420} name="head" size={110} color={DEEP} glow />
          <Chip x={940} y={500} color={TEAL}>✓ there is a Maker</Chip>
        </>
      )}
      {lines >= 2 && (
        <>
          <motion.div className="absolute" style={{ left: 1360 - 55, top: 560 - 55 }} initial={{ opacity: 0 }} animate={{ opacity: 1, scale: reduce ? 1 : [1, 1.06, 1] }} transition={{ scale: { duration: 1.6, repeat: Infinity }, opacity: { duration: 0.6 } }}>
            <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full" style={{ background: 'rgba(246,241,232,0.15)', border: '2px solid rgba(246,241,232,0.4)' }}><Icon name="heart" size={56} color="rgba(246,241,232,0.6)" /></span>
          </motion.div>
          <Svg><Draw d="M 1000 450 C 1100 470, 1180 520, 1260 548" color={GOLD} width={3} dash="4 10" dur={1.4} /></Svg>
          <Label x={1360} y={630} text="“I don't feel Him”" tone={tone} strong />
        </>
      )}
      {lines >= 3 && <Big x={1110} y={470} w={160} tone={tone} size={80}>?</Big>}
    </div>
  );
}
