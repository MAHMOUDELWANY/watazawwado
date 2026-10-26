import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Badge, Meter } from './kit';
import { SayBubble, WordTile } from './g-lang';
import { Hear } from '../Say';

/**
 * English · General and Exams · Lesson 1. Adults paper stage. General: an airport café, Layla (crimson, hijab) and Sami
 * (teal); contractions shown as two tiles sliding into one. Exams: the test as four blocks, the band scale, and the
 * Answer + Reason + Example pattern built block by block, with a timing bar.
 */

const GROUND = 800;

/** A café table with two cups. */
function Table() {
  return (
    <Svg>
      <rect x={1040} y={640} width={240} height={14} rx={6} fill="#8B5A36" />
      <rect x={1150} y={654} width={20} height={146} fill="#6E4428" />
      <rect x={1080} y={612} width={30} height={28} rx={6} fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={2} />
      <rect x={1210} y={612} width={30} height={28} rx={6} fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={2} />
    </Svg>
  );
}

/** Two words slide together into one contraction; the apostrophe drops in where the letter left. */
function Contract({ y, a, b, out, id, color = TEAL, show }: { y: number; a: string; b: string; out: string; id?: string; color?: string; show: boolean }) {
  return (
    <>
      {!show && (
        <>
          <WordTile x={1000} y={y} latin size={60}>{a}</WordTile>
          <WordTile x={1260} y={y} latin size={60} delay={0.15}>{b}</WordTile>
        </>
      )}
      {show && <WordTile x={1130} y={y} latin size={72} color={color} hot id={id} from={{ x: 0, y: -10 }}>{out}</WordTile>}
    </>
  );
}

/* ================= General ================= */

export function Eg1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Table />
      <Person x={980} y={GROUND} scale={0.95} color={CRIMSON} hijab sitting />
      <Person x={1340} y={GROUND} scale={0.95} color={TEAL} sitting delay={0.2} />
      <SayBubble x={1340} y={560} latin text="Hello!" align="right" width={150} delay={0.8} />
    </>
  );
}

export function Eg1CafeGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="pointer-events-none absolute rounded-[12px] text-center font-sans font-black" style={{ left: 1100, top: 190, width: 300, padding: '8px 0', fontSize: 22, color: '#FFE58A', background: '#1F2A30' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          GATE 12 · BOARDING 14:40
        </motion.div>
      )}
      <Table />
      {lines >= 1 && <Person x={980} y={GROUND} scale={0.95} color={CRIMSON} hijab sitting />}
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 220, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.2, ease }}>
          <Person x={1380} y={GROUND} scale={1} color={TEAL} />
        </motion.div>
      )}
      {lines >= 3 && <Chip x={1180} y={300} color={GOLD} delay={0.2}>one language in common: English</Chip>}
    </>
  );
}

export function Eg1ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Table />
      <Person x={980} y={GROUND} scale={0.95} color={CRIMSON} hijab sitting />
      <Person x={1340} y={GROUND} scale={0.95} color={TEAL} sitting />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={1340} y={560} id="d-1" latin text="Hi! Is this seat free?" align="right" width={280} />
          <SayBubble x={980} y={440} id="d-2" latin text="Yes, please sit down." width={260} delay={1.2} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1340} y={560} id="d-3" latin text={<><span style={{ color: CRIMSON }}>I'm</span> Sami. What's your name?</>} align="right" width={330} />
          <SayBubble x={980} y={440} id="d-4" latin text={<><span style={{ color: CRIMSON }}>I'm</span> Layla. Nice to meet you.</>} width={320} delay={1.2} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1340} y={560} id="d-5" latin text="Nice to meet you too." align="right" width={270} />
          <SayBubble x={980} y={440} id="d-6" latin text="That's my flight! Bye, Sami!" width={320} delay={1.2} accent />
        </React.Fragment>
      )}
    </>
  );
}

export function Eg1ImGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Contract y={300} a="I" b="am" out="I'm" id="im" show={lines >= 2} />}
      {lines >= 2 && <Chip x={1130} y={390} color={GOLD} delay={0.4}>' = the missing a</Chip>}
      {lines >= 3 && (
        <>
          <Person x={1130} y={GROUND} scale={1} color={TEAL} />
          <SayBubble x={1130} y={560} id="im-sami" latin text="I'm Sami." width={180} delay={0.3} />
          <motion.div className="absolute rounded-[14px] font-sans font-bold" style={{ left: 840, top: 470, padding: '8px 14px', fontSize: 20, background: '#FFFDF8', boxShadow: `0 0 0 2px ${CRIMSON}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <span style={{ color: CRIMSON, textDecoration: 'line-through' }}>I Sami</span>
          </motion.div>
        </>
      )}
    </>
  );
}

export function Eg1YoureGraphic({ lines, items }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Contract y={280} a="you" b="are" out="you're" id="you-are" color={CRIMSON} show={lines >= 2} />}
      {lines >= 2 && (
        <>
          <Person x={1000} y={GROUND} scale={0.95} color={TEAL} />
          <Person x={1300} y={GROUND} scale={0.95} color={CRIMSON} hijab delay={0.1} />
          <SayBubble x={1000} y={560} id="youre-layla" latin text="You're Layla." width={200} />
        </>
      )}
      {items >= 1 && <Chip x={980} y={400} color={TEAL}>I → am</Chip>}
      {items >= 2 && <Chip x={1280} y={400} color={CRIMSON}>you → are</Chip>}
    </>
  );
}

/** The meeting as a chain of four links: question → answer → nice to meet you → you too. */
export function Eg1NameGraphic({ lines }: GraphicProps) {
  const links = [
    { t: "What's your name?", id: 'whats-your-name', c: TEAL },
    { t: "I'm Layla.", id: undefined, c: CRIMSON },
    { t: 'Nice to meet you.', id: undefined, c: CRIMSON },
    { t: 'You too.', id: undefined, c: TEAL },
  ];
  const n = lines >= 3 ? 4 : lines >= 2 ? 2 : lines >= 1 ? 1 : 0;
  return (
    <>
      {links.slice(0, n).map((l, i) => (
        <React.Fragment key={l.t}>
          <WordTile x={i % 2 ? 1330 : 990} y={230 + i * 130} latin size={42} color={l.c} id={l.id} delay={0.1}>{l.t}</WordTile>
          {i > 0 && <Svg><Draw d={`M ${i % 2 ? 1120 : 1200} ${230 + (i - 1) * 130 + 30} L ${i % 2 ? 1200 : 1120} ${230 + i * 130 - 30}`} color={GOLD} width={3} dash="4 8" dur={0.5} /></Svg>}
        </React.Fragment>
      ))}
      {lines >= 2 && <Chip x={1330} y={410} delay={0.3}>or: My name's Layla.</Chip>}
    </>
  );
}

export function Eg1ByeGraphic({ lines }: GraphicProps) {
  const rows = [{ t: 'Bye!', id: 'bye', icon: 'chat' }, { t: 'See you!', id: 'see-you', icon: 'clock' }, { t: 'Have a nice day!', id: 'nice-day', icon: 'sun' }];
  return (
    <>
      {rows.slice(0, lines).map((r, i) => (
        <React.Fragment key={r.id}>
          <Badge x={880} y={260 + i * 150} name={r.icon} size={80} color={[TEAL, GOLD, CRIMSON][i]} delay={0.1} />
          <WordTile x={1170} y={260 + i * 150} latin size={52} id={r.id} delay={0.2}>{r.t}</WordTile>
        </React.Fragment>
      ))}
    </>
  );
}

export function Eg1TalkGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Table />
      <Person x={980} y={GROUND} scale={0.95} color={CRIMSON} hijab sitting />
      <Person x={1340} y={GROUND} scale={0.95} color={TEAL} sitting />
      <Chip x={980} y={520} color={CRIMSON}>you</Chip>
      {lines >= 1 && <SayBubble x={1340} y={560} id="d-1" latin text="Hi! Is this seat free?" align="right" width={280} delay={0.3} />}
    </>
  );
}

export function Eg1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={1000} y={GROUND} scale={1} color={TEAL} />
      {lines >= 1 && (
        <motion.div className="absolute flex items-center gap-3 rounded-full" style={{ left: 1080, top: 380, padding: '12px 20px', background: '#DCF8C6', boxShadow: '0 16px 30px -20px rgba(0,0,0,0.5)' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <span className="block rounded-full" style={{ width: 34, height: 34, background: TEAL }} />
          <div className="flex items-end gap-1">{Array.from({ length: 18 }, (_, i) => <motion.span key={i} className="block w-[5px] rounded-full" style={{ background: '#3B6E50' }} initial={{ height: 6 }} animate={{ height: 6 + ((i * 7) % 26) }} transition={{ delay: 0.4 + i * 0.04 }} />)}</div>
          <span className="font-sans font-bold" style={{ fontSize: 16, color: '#3B6E50' }}>0:06</span>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1240} y={500} color={CRIMSON} delay={0.3}>Hello! I'm… Nice to meet you.</Chip>}
    </>
  );
}

export function Eg1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Svg><Draw d="M 820 400 Q 1150 200 1480 380" color={TEAL} width={3} dash="4 10" dur={1.4} /></Svg>
      <Badge x={1480} y={380} name="plane" size={84} color={TEAL} delay={1.2} />
      {lines >= 2 && <SayBubble x={1150} y={560} id="where-from" latin text="Where are you from?" width={260} accent delay={0.3} />}
      {lines >= 2 && <Person x={1150} y={GROUND} scale={0.95} color={TEAL} />}
      {lines >= 3 && <Chip x={1150} y={250} color={GOLD} delay={0.3}>he / she / it is</Chip>}
    </>
  );
}

/* ================= Exams ================= */

/** The A + R + E blocks; `n` of them visible. */
function AreBlocks({ n, y = 220 }: { n: number; y?: number }) {
  const blocks = [
    { k: 'A', t: 'Yes, I do,', c: TEAL },
    { k: 'R', t: "mainly because it's quiet and close to the sea.", c: GOLD },
    { k: 'E', t: 'For example, every Friday I walk along the beach with my family.', c: CRIMSON },
  ];
  return (
    <div className="absolute flex flex-col gap-3" style={{ left: 820, top: y, width: 680 }}>
      {blocks.slice(0, n).map((b) => (
        <motion.div key={b.k} className="flex items-center gap-4 rounded-[16px]" style={{ padding: '12px 18px', background: '#FFFDF8', boxShadow: `inset 6px 0 0 ${b.c}, 0 16px 30px -22px rgba(60,30,10,0.6)` }}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="flex shrink-0 items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 44, height: 44, fontSize: 22, background: b.c }}>{b.k}</span>
          <span className="font-sans font-semibold" style={{ fontSize: 22, color: INK_TEXT }}>{b.t}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function Ex1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <motion.div className="absolute flex items-baseline gap-3" style={{ left: 980, top: 300 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
        <span className="font-sans font-bold uppercase" style={{ fontSize: 22, letterSpacing: '0.2em', color: soft('light') }}>band</span>
        <span className="font-serif" style={{ fontSize: 180, lineHeight: 1, color: CRIMSON }}>5.5</span>
      </motion.div>
      <Svg><Draw d="M 900 620 L 1440 620" color={INK_TEXT} width={3} opacity={0.2} /><Draw d="M 900 620 L 1260 620" color={CRIMSON} width={6} delay={0.6} dur={1.2} /></Svg>
    </>
  );
}

export function Ex1ShortGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={GROUND} scale={0.95} color={INK_TEXT} sitting />
      {lines >= 1 && lines < 3 && <SayBubble x={900} y={440} id="q-hometown" latin text="Do you like your hometown?" width={300} />}
      {lines >= 2 && (
        <>
          <Person x={1170} y={GROUND} scale={0.95} color={TEAL} sitting />
          <SayBubble x={1170} y={650} id="a-short" latin text="Yes." width={110} delay={0.3} />
          <Meter x={1070} y={240} w={200} value={0.15} label="score" tone="light" delay={0.6} color={TEAL} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={1400} y={GROUND} scale={0.95} color={CRIMSON} hijab sitting />
          <SayBubble x={1400} y={560} id="a-long" latin text="Yes, I do, because… For example…" align="right" width={260} delay={0.3} accent />
          <Meter x={1300} y={240} w={200} value={0.75} label="score" tone="light" delay={0.6} color={CRIMSON} strong />
        </>
      )}
    </>
  );
}

export function Ex1BandsGraphic({ lines, items }: GraphicProps) {
  const skills = [{ t: 'Listening', c: TEAL, b: 6 }, { t: 'Reading', c: GOLD, b: 5.5 }, { t: 'Writing', c: CRIMSON, b: 5 }, { t: 'Speaking', c: '#6E8B5A', b: 5.5 }];
  const shown = Math.max(items, lines >= 1 ? 4 : 0);
  return (
    <>
      <div className="absolute flex items-end gap-6" style={{ left: 860, top: 200, height: 380 }}>
        {skills.slice(0, shown).map((s, i) => (
          <div key={s.t} className="flex flex-col items-center gap-2">
            <motion.span className="font-serif" style={{ fontSize: 34, color: s.c }} initial={{ opacity: 0 }} animate={{ opacity: lines >= 2 ? 1 : 0 }}>{s.b}</motion.span>
            <motion.div className="w-[110px] rounded-t-[14px]" style={{ background: s.c, transformOrigin: 'bottom' }} initial={{ height: 0 }} animate={{ height: lines >= 2 ? s.b * 34 : 60 }} transition={{ duration: 0.8, delay: i * 0.1, ease }} />
            <span className="font-sans font-bold" style={{ fontSize: 17, color: INK_TEXT }}>{s.t}</span>
          </div>
        ))}
      </div>
      {lines >= 2 && <Chip x={1160} y={640} strong delay={0.8}>overall: 5.5</Chip>}
      {lines >= 3 && <Chip x={1160} y={700} color={TEAL} delay={0.3}>Speaking: 11–14 min · 3 parts</Chip>}
    </>
  );
}

export function Ex1Part1Graphic({ lines }: GraphicProps) {
  return (
    <>
      <Person x={900} y={GROUND} scale={0.95} color={INK_TEXT} sitting />
      <Person x={1400} y={GROUND} scale={0.95} color={TEAL} sitting />
      {lines >= 1 && (
        <motion.div className="absolute flex items-center gap-3" style={{ left: 1040, top: 220 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="font-serif" style={{ fontSize: 64, color: CRIMSON }}>4–5</span>
          <span className="font-sans font-bold" style={{ fontSize: 22, color: INK_TEXT }}>minutes</span>
        </motion.div>
      )}
      {lines >= 2 && ['home', 'work or studies', 'free time'].map((t, i) => <Chip key={t} x={1000 + i * 160} y={330} color={[TEAL, GOLD, CRIMSON][i]} delay={0.2 + i * 0.15}>{t}</Chip>)}
      {lines >= 2 && <SayBubble x={900} y={560} id="q-work" latin text="Do you work or are you a student?" width={340} delay={0.5} />}
      {lines >= 3 && <Chip x={1150} y={395} strong delay={0.3}>easy questions · the score is in HOW</Chip>}
    </>
  );
}

export function Ex1AreGraphic({ lines, items }: GraphicProps) {
  const n = Math.max(lines, items);
  return (
    <>
      <AreBlocks n={Math.min(n, 3)} />
      {items >= 3 && (
        <motion.div className="absolute" style={{ left: 820, top: 560 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Hear id="a-long"><span className="rounded-full px-5 py-2 font-sans font-bold text-white" style={{ fontSize: 20, background: INK_TEXT }}>play the full answer</span></Hear>
        </motion.div>
      )}
    </>
  );
}

/** A timing bar: too short, the sweet spot (15–25 s), too long. */
export function Ex1LengthGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <div className="absolute flex overflow-hidden rounded-full" style={{ left: 840, top: 320, width: 640, height: 54 }}>
            <div style={{ width: '25%', background: 'rgba(31,22,18,0.15)' }} />
            <motion.div style={{ width: '35%', background: TEAL }} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
            <div style={{ width: '40%', background: 'rgba(197,31,36,0.25)' }} />
          </div>
          {[['0 s', 840], ['15 s', 1000], ['25 s', 1224], ['60 s', 1440]].map(([t, x]) => <span key={t as string} className="pointer-events-none absolute font-sans font-bold" style={{ left: x as number, top: 390, fontSize: 16, color: soft('light') }}>{t}</span>)}
          <Chip x={1112} y={260} color={TEAL} delay={0.6}>the sweet spot</Chip>
        </>
      )}
      {lines >= 2 && <Chip x={1350} y={260} color={CRIMSON} delay={0.2}>speech · memorised</Chip>}
      {lines >= 3 && (
        <div className="pointer-events-none absolute flex flex-col gap-3" style={{ left: 880, top: 470 }}>
          <span className="rounded-[14px] px-4 py-2 font-sans font-semibold" style={{ fontSize: 20, background: '#FFFDF8', boxShadow: `0 0 0 2px ${TEAL}` }}>“Yes, I do, because I really enjoy my job. Last week…”  ✓</span>
          <span className="rounded-[14px] px-4 py-2 font-sans font-semibold" style={{ fontSize: 20, background: '#FFFDF8', boxShadow: `0 0 0 2px ${CRIMSON}`, color: soft('light') }}>“Yes.”</span>
        </div>
      )}
    </>
  );
}

export function Ex1LinkGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 2 && ['because', 'since', 'as'].map((w, i) => <WordTile key={w} x={1000 + i * 170} y={280} latin size={40} color={GOLD} delay={i * 0.12}>{w}</WordTile>)}
      {lines >= 3 && ['for example', 'for instance', 'like when…'].map((w, i) => <WordTile key={w} x={960 + i * 210} y={440} latin size={34} color={CRIMSON} delay={i * 0.12}>{w}</WordTile>)}
      {lines >= 2 && <Chip x={840} y={270} color={GOLD}>R</Chip>}
      {lines >= 3 && <Chip x={840} y={430} color={CRIMSON}>E</Chip>}
      {lines >= 1 && <Svg><Draw d="M 820 600 L 1500 600" color={INK_TEXT} width={2} opacity={0.15} /></Svg>}
    </>
  );
}

export function Ex1TimedGraphic({ lines, interaction }: GraphicProps) {
  const qs = ['hometown', 'work or study', 'free time', 'weekends', 'food'];
  return (
    <>
      <Person x={1400} y={GROUND} scale={0.95} color={INK_TEXT} sitting />
      {lines >= 1 && (
        <div className="absolute flex flex-col gap-2" style={{ left: 840, top: 200, width: 420 }}>
          {qs.map((q, i) => (
            <motion.div key={q} className="flex items-center gap-3 rounded-[14px]" style={{ padding: '10px 14px', background: '#FFFDF8', boxShadow: '0 14px 26px -20px rgba(60,30,10,0.6)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <span className="font-sans font-black" style={{ fontSize: 18, color: soft('light') }}>{i + 1}</span>
              <span className="flex-1 font-sans font-semibold" style={{ fontSize: 19 }}>{q}</span>
              <motion.span className="rounded-full" style={{ height: 10, width: 90 }} initial={false} animate={{ background: interaction ? TEAL : 'rgba(31,22,18,0.12)' }} transition={{ delay: interaction ? 0.3 + i * 0.3 : 0 }} />
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 2 && <Chip x={1050} y={560} color={GOLD} delay={0.2}>A + R + E · 15–25 s</Chip>}
    </>
  );
}

export function Ex1MissionGraphic({ lines }: GraphicProps) {
  const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return (
    <>
      {lines >= 1 && (
        <div className="absolute flex gap-3" style={{ left: 820, top: 260 }}>
          {days.map((d, i) => (
            <motion.div key={d} className="flex flex-col items-center gap-2 rounded-[16px]" style={{ width: 86, padding: '12px 0', background: '#FFFDF8', boxShadow: '0 14px 28px -20px rgba(60,30,10,0.6)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <span className="font-sans font-bold" style={{ fontSize: 16, color: soft('light') }}>{d}</span>
              <span className="block rounded-full" style={{ width: 22, height: 22, background: CRIMSON }} />
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 2 && <AreBlocks n={3} y={420} />}
    </>
  );
}

export function Ex1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <div className="absolute flex gap-3" style={{ left: 860, top: 260 }}>
          {['M', 'A', 'R', 'W', 'A', 'N'].map((c, i) => (
            <motion.span key={i} className="flex items-center justify-center rounded-[14px] font-sans font-black" style={{ width: 90, height: 100, fontSize: 56, background: '#FFFDF8', boxShadow: `0 0 0 3px ${TEAL}` }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.35 }}>{c}</motion.span>
          ))}
        </div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute rounded-[14px]" style={{ left: 900, top: 430, width: 500, padding: '16px 20px', background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {['Name: ________', 'Phone: ________', 'Course starts: ________'].map((t) => <div key={t} className="font-sans font-semibold" style={{ fontSize: 22, lineHeight: 1.8 }}>{t}</div>)}
        </motion.div>
      )}
    </>
  );
}
