import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Building, ADAM, MONA, SAYED } from './g-ea1';
import { StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Adults · Advanced · Lesson 1 · In My Opinion. The residents' meeting in the building's entrance:
 * Amm Sayed (clay), Mona (gold), her father Hassan (brown), Adam (teal). New device: the politeness ladder, four rungs
 * from blunt (crimson, bottom) to gentle (teal, top); a marker climbs as the "no" gets softer.
 */

const HASSAN = '#5A4636';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const RUNGS: [string, string, string?][] = [['لأ خالص!', CRIMSON, 'la2-khales'], ['مش متأكد', '#C0603A', 'mish-metakked'], ['ممكن… بس', GOLD, 'momken-bass'], ['معاك حق، بس…', TEAL, 'maak-ha2-bass']];

/** The politeness ladder at x; `upTo` rungs shown, the marker on the top one shown. */
function Ladder({ x, upTo, delay = 0 }: { x: number; upTo: number; delay?: number }) {
  const n = Math.min(upTo, 4);
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: x - 160, top: 180, width: 8, height: 560, background: '#CDB898' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, delay, ease }} />
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: x + 152, top: 180, width: 8, height: 560, background: '#CDB898' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, delay, ease }} />
      {RUNGS.slice(0, n).map(([w, c, id], i) => {
        const y = 680 - i * 140;
        const body = <span className="inline-flex rounded-full" style={{ padding: '2px 22px 4px', background: c, boxShadow: SHADOW }}><ArText size={28} color="#fff">{w}</ArText></span>;
        return (
          <div key={w} className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
            <motion.div initial={{ opacity: 0, scaleX: 0.4 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.7, delay: delay + 0.2 + i * 0.25 }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.div>
          </div>
        );
      })}
      {n > 0 && <motion.span className="pointer-events-none absolute rounded-full" style={{ left: x + 180, width: 26, height: 26, background: RUNGS[n - 1][1], border: '4px solid #fff', boxShadow: SHADOW }} initial={{ top: 667 }} animate={{ top: 667 - (n - 1) * 140 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay: delay + 0.3 }} />}
    </>
  );
}

/** A lift door with a little up arrow. */
function Lift({ x, delay = 0 }: { x: number; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: x - 70, top: 520, width: 140, height: 280, background: '#C9CED2', boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      <span className="absolute" style={{ left: 69, top: 40, width: 2, height: 240, background: '#9AA3AA' }} />
      <span className="absolute font-sans font-black" style={{ left: 54, top: 6, fontSize: 22, color: INK_TEXT }}>▲</span>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Ea31CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Ladder x={1200} upTo={4} delay={0.2} />
      <Person x={1430} y={800} scale={0.8} color={ADAM} delay={0.3} />
    </>
  );
}

export function Ea31RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Chip x={1150} y={220} color={GOLD}>وبعدين · فجأة · في الآخر</Chip>
      {lines >= 2 && (
        <>
          <Person x={1000} y={800} scale={1} color={MONA} hijab delay={0.1} />
          <Person x={1300} y={800} scale={1} color={ADAM} delay={0.2} />
          <Say x={1000} y={570} id="eh-raayak" text="إيه رأيك؟" width={170} size={30} delay={0.4} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={330} color={CRIMSON} delay={0.2}>facts → opinions</Chip>}
    </>
  );
}

export function Ea31MeetingGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Building x={1150} w={360} />
      <Person x={880} y={800} scale={0.95} color={SAYED} />
      <Person x={1010} y={800} scale={0.95} color={HASSAN} delay={0.1} />
      <Person x={1350} y={800} scale={0.95} color={MONA} hijab delay={0.2} />
      <Person x={1460} y={800} scale={0.95} color={ADAM} delay={0.3} />
      {lines >= 2 && <Lift x={1180} delay={0.2} />}
      {lines >= 2 && <Chip x={1180} y={470} color={CRIMSON} delay={0.6}>a lift? expensive!</Chip>}
      {lines >= 3 && <Chip x={1330} y={260} color={GOLD} delay={0.2}>Teta: 4th floor</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Ea31StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={880} y={800} scale={0.95} color={SAYED} />
      <Person x={1060} y={800} scale={0.95} color={HASSAN} />
      <Person x={1270} y={800} scale={0.95} color={MONA} hijab />
      <Person x={1440} y={800} scale={0.95} color={ADAM} />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={880} y={580} id="story-1" text="يا جماعة، العمارة محتاجة أسانسير." width={340} size={22} delay={0.2} />
          <Say x={1060} y={420} id="story-2" text="أنا شايف إن ده غالي أوي." width={290} size={23} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1270} y={580} id="story-3" text="معاك حق يا بابا، بس تيتة مش قادرة تطلع السلم." align="right" width={430} size={21} accent delay={0.2} />
          <Say x={1060} y={420} id="story-4" text="أيوه… بس مين هيدفع؟" width={240} size={24} delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1440} y={580} id="story-5" text="في رأيي، كلنا ندفع شوية. ده أحسن للكل." align="right" width={400} size={21} accent delay={0.2} />
          <Say x={880} y={420} id="story-6" text="والله عنده حق!" width={200} size={26} delay={1.6} />
        </React.Fragment>
      )}
    </>
  );
}

export function Ea31ThinkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1330} y={230} word="أنا شايف إن…" id="shayef" size={34} />
      <StreetCard x={980} y={230} word="أنا شايفة إن…" id="shayfa" size={34} delay={0.2} />
      <Chip x={1330} y={300} color={TEAL} delay={0.4}>a man</Chip>
      <Chip x={980} y={300} color={CRIMSON} delay={0.5}>a woman</Chip>
      {lines >= 2 && <StreetCard x={1150} y={420} word="في رأيي…" id="fi-raayi" size={38} delay={0.2} />}
      {lines >= 2 && <Chip x={1150} y={495} color={GOLD} delay={0.5}>a meeting voice</Chip>}
      {lines >= 3 && <StreetCard x={1150} y={620} word="إيه رأيك؟" size={32} delay={0.2} />}
    </>
  );
}

export function Ea31AgreeGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="معاك حق." id="maak-ha2" size={40} />
      <Chip x={1150} y={305} delay={0.4}>to a woman: معاكي حق</Chip>
      {lines >= 2 && <StreetCard x={1150} y={420} word="والله عنده حق!" id="andu-ha2" size={36} delay={0.2} />}
      {lines >= 3 && <StreetCard x={1150} y={590} word="بالظبط!" id="bezzabt" size={44} delay={0.2} />}
    </>
  );
}

/** A point given, then بس: the two halves of polite disagreement slide together. */
export function Ea31ButGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={HASSAN} />
      <Person x={1320} y={800} scale={1} color={MONA} hijab />
      <Say x={1320} y={570} id="maak-ha2-bass" text="معاك حق يا بابا، بس…" align="right" width={280} size={24} accent delay={0.2} />
      {lines >= 2 && (
        <>
          <Chip x={1050} y={250} color={TEAL} delay={0.1}>1 · give a point</Chip>
          <Chip x={1290} y={250} color={GOLD} delay={0.4}>2 · بس + yours</Chip>
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={330} color={CRIMSON} delay={0.2}>home · work · elders</Chip>}
    </>
  );
}

export function Ea31UnsureGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Ladder x={1150} upTo={lines >= 3 ? 3 : 2} />
    </>
  );
}

/** The wow: the full ladder, blunt to gentle. */
export function Ea31LadderGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Ladder x={1120} upTo={4} />
      {lines >= 2 && <Chip x={1450} y={700} color={CRIMSON} delay={0.2}>blunt</Chip>}
      {lines >= 2 && <Chip x={1450} y={250} color={TEAL} delay={0.4}>gentle</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Ea31TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1000} y={800} scale={1} color={HASSAN} />
      <Person x={1350} y={800} scale={1} color={ADAM} />
      <Say x={1000} y={570} id="roof" text="أنا شايف إن السطح محتاج جنينة. إيه رأيك؟" width={420} size={21} delay={0.2} />
      {lines >= 2 && <Chip x={1350} y={420} color={TEAL} delay={0.2}>معاك حق، بس…</Chip>}
    </>
  );
}

export function Ea31MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1400} y={300} word="إيه رأيك؟" size={40} />
      {lines >= 2 && <Ladder x={1020} upTo={4} delay={0.1} />}
    </>
  );
}

export function Ea31NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Building x={1150} w={360} />
      <Person x={980} y={800} scale={1} color={HASSAN} lean={6} />
      {lines >= 2 && <Person x={1100} y={800} scale={1} color={SAYED} delay={0.1} />}
      {lines >= 2 && <Say x={1100} y={570} id="elli-fat-mat" text="اللي فات مات." width={190} size={28} accent delay={0.3} />}
      {lines >= 3 && <Chip x={1330} y={300} color={GOLD} delay={0.2}>the people's sayings</Chip>}
    </>
  );
}
