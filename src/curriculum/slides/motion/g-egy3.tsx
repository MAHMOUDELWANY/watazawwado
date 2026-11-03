import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Icon, CLAY } from './kit';
import { ArText, SayBubble, WordTile } from './g-lang';
import { GROUND, Pitch } from './g-egy';
import { Thing } from './g-ea3';

/**
 * Egyptian Arabic · Kids and Teens · Lesson 3 (ده / دي). Same code-drawn cast. Kids: Teta's old box; Teens: Karim's
 * sports bag. ده is teal and دي crimson on every page, like the Adults lesson.
 */

const DA = TEAL;
const DI = CRIMSON;

/** An old wooden box; `open` lifts the lid and lets a glow out. */
function Box({ x, y, open, w = 260 }: { x: number; y: number; open: boolean; w?: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - 170, width: w, height: 170 }}>
      {open && <motion.span className="absolute rounded-full" style={{ left: w / 2 - 80, top: -30, width: 160, height: 70, background: `${GOLD}77`, filter: 'blur(18px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />}
      <div className="absolute inset-x-0 bottom-0 rounded-[10px]" style={{ height: 140, background: '#8B5A36', boxShadow: 'inset 0 -16px 0 #6E4428' }} />
      <span className="absolute rounded-sm" style={{ left: w / 2 - 12, top: 70, width: 24, height: 30, background: GOLD }} />
      <motion.div className="absolute inset-x-0 rounded-[10px]" style={{ top: 0, height: 36, background: '#A26B42', transformOrigin: 'left bottom' }}
        initial={false} animate={{ rotate: open ? -32 : 0, y: open ? -10 : 0 }} transition={{ duration: 0.8, ease }} />
    </div>
  );
}

/** A sports bag on the bench; `open` unzips it. */
function Bag({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x - 110, top: y - 110, width: 220, height: 110 }}>
      <div className="absolute inset-0 rounded-[36px]" style={{ background: '#22313A' }} />
      <motion.span className="absolute rounded-full" style={{ left: 30, top: 18, height: 6, background: GOLD }} initial={false} animate={{ width: open ? 40 : 160 }} transition={{ duration: 0.8, ease }} />
      {open && <span className="absolute rounded-full" style={{ left: 74, top: 10, width: 120, height: 20, background: '#0F171C' }} />}
    </div>
  );
}

/** A thing rising out of a container, then a label tile. */
function Pop({ x, y, icon, color, delay = 0 }: { x: number; y: number; icon: string; color: string; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: x - 46, width: 92, height: 92, background: '#FFFDF8', boxShadow: `0 0 0 4px ${color}, 0 0 30px 6px ${color}44` }}
      initial={{ top: y + 60, opacity: 0, scale: 0.6 }} animate={{ top: y, opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay, type: 'spring', bounce: 0.35 }}>
      <Icon name={icon} size={52} color={color} />
    </motion.div>
  );
}

/** Two big tiles, ده and دي, with their English chips. */
function DaDi({ y = 260, kidsLabels = false }: { y?: number; kidsLabels?: boolean }) {
  return (
    <>
      <WordTile x={1320} y={y} size={80} id="da" color={DA}>ده</WordTile>
      <WordTile x={1000} y={y} size={80} id="di" color={DI} delay={0.3}>دي</WordTile>
      <Chip x={1320} y={y + 70} color={DA} delay={0.4}>{kidsLabels ? 'a boy word' : 'this · masculine'}</Chip>
      <Chip x={1000} y={y + 70} color={DI} delay={0.5}>{kidsLabels ? 'a girl word' : 'this · feminine'}</Chip>
    </>
  );
}

/** The ـة tail, big, in a crimson ring. */
function TaRing({ x = 1160, y = 250 }: { x?: number; y?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: x - 80, top: y - 80, width: 160, height: 160, background: '#FFFDF8', boxShadow: `0 0 0 6px ${DI}, 0 0 40px 10px ${DI}33` }}
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}>
      <ArText size={80} color={DI}>ـة</ArText>
    </motion.div>
  );
}

const grid = (i: number, cols: number, x0: number, y0: number, dx: number, dy: number) => ({ x: x0 - (i % cols) * dx, y: y0 + Math.floor(i / cols) * dy });

/* ================= Kids ================= */

export function Ek3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Person x={960} y={GROUND} scale={1.02} color={CLAY} hijab />
      <Box x={1180} y={GROUND} open />
      <Person x={1420} y={GROUND} scale={0.88} color={TEAL} delay={0.2} flip />
      <SayBubble x={1420} y={560} text="إيه ده؟" align="right" width={170} delay={1} accent />
    </>
  );
}

export function Ek3BoxGraphic({ lines }: GraphicProps) {
  const open = lines >= 2;
  return (
    <>
      <Person x={960} y={GROUND} scale={1.02} color={CLAY} hijab />
      {lines >= 1 && <Box x={1180} y={GROUND} open={open} />}
      <Person x={1420} y={GROUND} scale={0.88} color={TEAL} delay={0.2} flip lean={open ? -6 : 0} />
      {open && <SayBubble x={1420} y={560} id="eh-da" text="إيه ده؟" align="right" width={170} delay={0.6} accent />}
      {lines >= 3 && (
        <>
          <WordTile x={1290} y={270} size={52}>إيه</WordTile>
          <WordTile x={1060} y={270} size={52} color={DA} delay={0.2}>ده</WordTile>
          <Chip x={1290} y={320} delay={0.3}>what</Chip>
          <Chip x={1060} y={320} color={DA} delay={0.4}>?</Chip>
        </>
      )}
    </>
  );
}

export function Ek3ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={860} y={GROUND} scale={1.02} color={CLAY} hijab />
      <Box x={1060} y={GROUND} open w={200} />
      <Person x={1240} y={GROUND} scale={0.82} color={CRIMSON} hijab delay={0.1} />
      <Person x={1360} y={GROUND} scale={0.85} color={GOLD} delay={0.15} />
      <Person x={1470} y={GROUND} scale={0.88} color={TEAL} delay={0.2} flip />
      {k === 1 && (
        <React.Fragment key="a">
          <Pop x={1060} y={500} icon="book" color={DA} />
          <SayBubble x={1470} y={560} id="l-1" text="إيه ده يا تيتة؟" align="right" width={250} delay={0.3} />
          <SayBubble x={860} y={420} id="l-2" text={<><span style={{ color: DA }}>ده</span> كتاب قديم.</>} width={230} delay={1.6} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Pop x={1060} y={500} icon="photo" color={DI} />
          <SayBubble x={1240} y={420} id="l-3" text={<>وإيه <span style={{ color: DI }}>دي</span>؟</>} width={170} />
          <SayBubble x={860} y={420} id="l-4" text={<><span style={{ color: DI }}>دي</span> صورة بابا وهو صغير!</>} width={340} delay={1.3} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Pop x={1060} y={500} icon="ball" color={DI} />
          <SayBubble x={1360} y={440} id="l-5" text={<>و<span style={{ color: DI }}>دي</span> كورة!</>} align="right" width={180} accent delay={0.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Ek3DaDiGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <DaDi kidsLabels />}
      {lines >= 2 && (
        <>
          <Thing x={1320} y={540} icon="book" word="كتاب" fem={false} id="da-kitab" />
          <Thing x={1000} y={540} icon="photo" word="صورة" fem id="di-sura" delay={0.3} />
        </>
      )}
    </>
  );
}

export function Ek3TaGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <TaRing />}
      {lines >= 2 && (
        <>
          <Thing x={1330} y={480} icon="photo" word="صورة" fem id="di-sura" />
          <Thing x={1130} y={480} icon="ball" word="كورة" fem id="di-kora" delay={0.3} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Thing x={1330} y={680} icon="book" word="كتاب" fem={false} id="da-kitab" />
          <Thing x={1130} y={680} icon="pen" word="قلم" fem={false} id="da-alam" delay={0.3} />
        </>
      )}
    </>
  );
}

const BOX = [
  { icon: 'book', word: 'كتاب', fem: false, id: 'da-kitab' },
  { icon: 'pen', word: 'قلم', fem: false, id: 'da-alam' },
  { icon: 'key', word: 'مفتاح', fem: false, id: 'da-muftah' },
  { icon: 'photo', word: 'صورة', fem: true, id: 'di-sura' },
  { icon: 'ball', word: 'كورة', fem: true, id: 'di-kora' },
  { icon: 'doll', word: 'عروسة', fem: true, id: 'di-arusa' },
];

export function Ek3ThingsGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Box x={1160} y={GROUND} open w={220} />}
      {lines >= 1 && BOX.map((t, i) => {
        const p = grid(i, 3, 1360, 250, 200, 190);
        return <Thing key={t.word} x={p.x} y={p.y} icon={t.icon} word={t.word} fem={t.fem} id={t.id} delay={0.3 + i * 0.2} />;
      })}
    </>
  );
}

export function Ek3TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={960} y={GROUND} scale={1.02} color={CLAY} hijab />
      <Bag x={1160} y={GROUND} open={lines >= 1} />
      <Person x={1380} y={GROUND} scale={0.88} color={TEAL} delay={0.2} flip />
      <Chip x={1380} y={520} color={TEAL}>you</Chip>
      {lines >= 2 && (
        <>
          <Pop x={1160} y={480} icon="cup" color={DI} delay={0.2} />
          <SayBubble x={1380} y={560} id="eh-di" text="إيه دي؟" align="right" width={160} delay={0.6} />
        </>
      )}
    </>
  );
}

export function Ek3MissionGraphic({ lines }: GraphicProps) {
  const things = [{ icon: 'shirt', c: DA }, { icon: 'bag', c: DI }, { icon: 'cup', c: DI }];
  return (
    <>
      <Person x={1000} y={GROUND} scale={0.88} color={TEAL} />
      {lines >= 1 && things.map((t, i) => <Pop key={t.icon} x={1180 + i * 130} y={560} icon={t.icon} color={t.c} delay={0.3 + i * 0.3} />)}
      {lines >= 2 && <Chip x={1440} y={680} color={DI} delay={0.4}>found a ـة!</Chip>}
    </>
  );
}

export function Ek3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1160} y={GROUND} scale={0.88} color={GOLD} lean={lines >= 2 ? -8 : 0} />
      {lines >= 2 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="pointer-events-none absolute block rounded-[12px]" style={{ left: 1140, top: 720, width: 60, height: 34, background: [GOLD, CRIMSON, TEAL][i] }}
              initial={{ opacity: 0 }} animate={{ x: [-240, 220, -100][i], y: [-240, -200, -320][i], rotate: [180, -150, 80][i], opacity: 1 }} transition={{ duration: 1.1, delay: i * 0.2, ease }} />
          ))}
          <SayBubble x={1160} y={560} id="fen-ilkora" text="فين الكورة؟" width={220} delay={0.8} accent />
        </>
      )}
      {lines >= 3 && <div className="pointer-events-none absolute" style={{ left: 1420, top: 740 }}><Icon name="ball" size={50} color={CRIMSON} /></div>}
    </>
  );
}

/* ================= Teens ================= */

export function Et3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={980} y={GROUND} scale={1.05} color={GOLD} />
      <Bag x={1160} y={GROUND} open />
      <Pop x={1160} y={560} icon="jar" color={DA} delay={0.5} />
      <Person x={1380} y={GROUND} scale={1} color={CRIMSON} hijab delay={0.2} />
      <SayBubble x={1380} y={540} text="إيه ده؟" align="right" width={160} delay={1.2} accent />
    </>
  );
}

export function Et3BagGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={980} y={GROUND} scale={1.05} color={GOLD} />
      {lines >= 1 && <Bag x={1160} y={GROUND} open />}
      {lines >= 1 && <Pop x={1160} y={560} icon="jar" color={DA} delay={0.6} />}
      <Person x={1340} y={GROUND} scale={1} color={CRIMSON} hijab delay={0.1} />
      <Person x={1470} y={GROUND} scale={1.05} color={TEAL} delay={0.2} />
      {lines === 2 && (
        <>
          <SayBubble x={1340} y={430} id="eh-da" text="إيه ده؟" align="right" width={160} accent />
          <SayBubble x={1470} y={540} text="إيه ده؟" align="right" width={160} delay={0.2} />
        </>
      )}
      {lines >= 3 && (
        <>
          <WordTile x={1290} y={250} size={50}>إيه</WordTile>
          <WordTile x={1060} y={250} size={50} color={DA} delay={0.2}>ده</WordTile>
          <Chip x={1290} y={300} delay={0.3}>what</Chip>
          <Chip x={1060} y={300} color={DA} delay={0.4}>?</Chip>
        </>
      )}
    </>
  );
}

export function Et3ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Pitch />
      <Person x={960} y={GROUND} scale={1.05} color={GOLD} />
      <Bag x={1150} y={GROUND} open />
      <Person x={1380} y={GROUND} scale={1} color={CRIMSON} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Pop x={1150} y={560} icon="jar" color={DA} />
          <SayBubble x={1380} y={540} id="l-1" text="إيه ده يا كريم؟" align="right" width={240} delay={0.3} />
          <SayBubble x={960} y={420} id="l-2" text={<><span style={{ color: DA }}>ده</span> طرشي! من عند تيتة.</>} width={320} delay={1.5} />
        </React.Fragment>
      )}
      {k >= 2 && (
        <React.Fragment key="b">
          <Pop x={1150} y={560} icon="socks" color={DI} />
          <SayBubble x={1380} y={540} id="l-3" text={<>وإيه <span style={{ color: DI }}>دي</span>؟</>} align="right" width={170} />
          {k === 3 && <SayBubble x={960} y={420} id="l-4" text={<><span style={{ color: DI }}>دي</span> شرابات. نضيفة، والله!</>} width={330} accent />}
        </React.Fragment>
      )}
    </>
  );
}

export function Et3DaDiGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <DaDi />}
      {lines >= 2 && (
        <>
          <WordTile x={1320} y={470} size={44} id="eh-da">إيه <span style={{ color: DA }}>ده</span>؟</WordTile>
          <WordTile x={1000} y={470} size={44} id="eh-di" delay={0.3}>إيه <span style={{ color: DI }}>دي</span>؟</WordTile>
        </>
      )}
      {lines >= 3 && <WordTile x={1160} y={640} size={50} id="eh-da-bilmasri" hot delay={0.2}>إيه ده بالمصري؟</WordTile>}
    </>
  );
}

export function Et3TaGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <TaRing x={1350} y={260} />
          <Thing x={1150} y={250} icon="bag" word="شنطة" fem id="di-shanta" delay={0.3} />
          <Thing x={950} y={250} icon="ball" word="كورة" fem delay={0.5} />
        </>
      )}
      {lines >= 2 && (
        <>
          <Chip x={1360} y={440} color={DI}>plural things</Chip>
          <Thing x={1150} y={460} icon="socks" word="شرابات" fem id="di-sharabat" delay={0.2} />
          <Thing x={950} y={460} icon="headphones" word="سماعات" fem id="di-sammaat" delay={0.4} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1360} y={650} color={DA}>the rest</Chip>
          <Thing x={1150} y={670} icon="phone" word="موبايل" fem={false} id="da-mobayl" delay={0.2} />
          <Thing x={950} y={670} icon="charger" word="شاحن" fem={false} id="da-shahin" delay={0.4} />
        </>
      )}
    </>
  );
}

const STUFF = [
  { icon: 'phone', word: 'موبايل', fem: false, id: 'da-mobayl' },
  { icon: 'charger', word: 'شاحن', fem: false, id: 'da-shahin' },
  { icon: 'jar', word: 'طرشي', fem: false, id: 'da-turshi' },
  { icon: 'key', word: 'مفتاح', fem: false, id: 'da-muftah' },
  { icon: 'bag', word: 'شنطة', fem: true, id: 'di-shanta' },
  { icon: 'ball', word: 'كورة', fem: true, id: 'di-kora' },
  { icon: 'headphones', word: 'سماعات', fem: true, id: 'di-sammaat' },
  { icon: 'glasses', word: 'نضارة', fem: true, id: 'di-naddara' },
];

export function Et3StuffGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Svg><Draw d="M 760 720 L 1520 720" color="#8B5A36" width={14} dur={0.6} /></Svg>}
      {lines >= 1 && STUFF.map((t, i) => {
        const p = grid(i, 4, 1420, 260, 190, 200);
        return <Thing key={t.word} x={p.x} y={p.y} icon={t.icon} word={t.word} fem={t.fem} id={t.id} delay={0.2 + i * 0.15} />;
      })}
    </>
  );
}

export function Et3TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={960} y={GROUND} scale={1.05} color={GOLD} />
      <Person x={1300} y={GROUND} scale={1.05} color={TEAL} delay={0.2} />
      <Chip x={1300} y={520} color={TEAL}>you</Chip>
      {lines >= 2 && (
        <>
          <Pop x={1130} y={560} icon="headphones" color={DI} delay={0.2} />
          <SayBubble x={960} y={540} id="eh-di" text="إيه دي؟" width={160} delay={0.6} />
        </>
      )}
    </>
  );
}

export function Et3MissionGraphic({ lines }: GraphicProps) {
  const tags = [
    { x: 1080, y: 300, t: 'ده موبايل', c: DA }, { x: 1210, y: 360, t: 'دي سماعات', c: DI },
    { x: 1060, y: 520, t: 'دي نضارة', c: DI }, { x: 1230, y: 580, t: 'ده شاحن', c: DA },
  ];
  return lines >= 1 ? (
    <motion.div className="absolute overflow-hidden rounded-[34px]" style={{ left: 980, top: 170, width: 460, height: 580, background: '#101418', padding: 12 }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ duration: 0.9, ease }}>
      <div className="relative h-full w-full rounded-[24px]" style={{ background: '#D9CDB8' }}>
        {tags.map((g, i) => (
          <motion.span key={g.t} className="absolute rounded-full" style={{ left: g.x - 990, top: g.y - 180, padding: '4px 14px', background: '#FFFDF8', boxShadow: `0 0 0 3px ${g.c}` }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.25, type: 'spring', bounce: 0.4 }}>
            <ArText size={26} color={g.c}>{g.t}</ArText>
          </motion.span>
        ))}
      </div>
    </motion.div>
  ) : null;
}

export function Et3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Pitch />
      <Person x={1160} y={GROUND} scale={1} color={CRIMSON} hijab lean={lines >= 1 ? -6 : 0} />
      {lines >= 1 && <Bag x={1380} y={GROUND} open />}
      {lines >= 2 && <SayBubble x={1160} y={540} id="fen-mobayli" text="فين موبايلي؟" width={220} accent delay={0.2} />}
      {lines >= 2 && <Chip x={1380} y={600} color={GOLD} delay={0.6}>?!</Chip>}
    </>
  );
}
