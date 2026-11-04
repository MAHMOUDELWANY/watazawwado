import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { Pitch } from './g-egy';
import { Chat } from './g-eti1';

/**
 * Egyptian Arabic · Teens · Advanced · Lesson 1 · Who Should Be Captain? The club's last summer: Omar (teal), Karim
 * (gold), Nour (crimson, hijab), the coach (brown). New devices: the captain board, where every agreement adds a tally
 * to a name, and the agree-o-meter, a gauge whose needle shows how strongly each phrase agrees or disagrees.
 */

const OMAR = TEAL;
const KARIM = GOLD;
const NOUR = CRIMSON;
const COACH = '#5A4636';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

/** The captain board: three names with tally marks; `votes` per name, `names` hides the rows until the vote opens. */
function Board({ x, y, votes = [0, 0, 0], names = true, delay = 0 }: { x: number; y: number; votes?: number[]; names?: boolean; delay?: number }) {
  const rows: [string, string][] = [['عمر', OMAR], ['كريم', KARIM], ['نور', NOUR]];
  return (
    <motion.div className="pointer-events-none absolute rounded-[18px]" style={{ left: x - 190, top: y, width: 380, padding: '10px 22px 14px', background: '#FFFDF8', border: `6px solid ${COACH}`, boxShadow: SHADOW }} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <div className="text-center"><ArText size={28}>الكابتن؟</ArText></div>
      {names && rows.map(([n, c], i) => (
        <motion.div key={n} className="flex items-center justify-between" style={{ height: 46, direction: 'rtl' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: delay + 0.3 + i * 0.15, ease }}>
          <span className="flex items-center gap-3"><span className="rounded-full" style={{ width: 16, height: 16, background: c }} /><ArText size={26}>{n}</ArText></span>
          <span className="flex gap-[6px]" style={{ direction: 'ltr' }}>
            {Array.from({ length: votes[i] }, (_, v) => (
              <motion.span key={v} className="rounded-full" style={{ width: 6, height: 30, background: c }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.5, delay: delay + 0.6 + v * 0.2 }} />
            ))}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/** The captain's armband: a gold band with a C. */
function Armband({ x, y, scale = 1, delay = 0, float = false }: { x: number; y: number; scale?: number; delay?: number; float?: boolean }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 65 * scale, top: y - 25 * scale, overflow: 'visible' }} width={130 * scale} height={50 * scale} viewBox="0 0 130 50"
      initial={{ opacity: 0, scale: 0.5, rotate: -12 }} animate={float ? { opacity: 1, scale: 1, rotate: [-4, 4, -4], y: [0, -8, 0] } : { opacity: 1, scale: 1, rotate: -6 }}
      transition={float ? { opacity: { duration: 0.5, delay }, scale: { type: 'spring', bounce: 0.5, duration: 0.9, delay }, rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } } : { type: 'spring', bounce: 0.5, duration: 0.9, delay }}>
      <rect x={2} y={4} width={126} height={42} rx={12} fill={GOLD} stroke="#fff" strokeWidth={4} />
      <text x={65} y={36} textAnchor="middle" fontFamily="sans-serif" fontWeight={900} fontSize={30} fill="#fff">C</text>
    </motion.svg>
  );
}

/** An eye that opens: شايف is "seeing". */
function Eye({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <svg className="pointer-events-none absolute" style={{ left: x - 70, top: y - 35, overflow: 'visible' }} width={140} height={70}>
      <motion.path d="M 6 35 Q 70 -15 134 35 Q 70 85 6 35 Z" fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay, ease }} />
      <motion.circle cx={70} cy={35} r={18} fill={TEAL} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay: delay + 0.6 }} />
      <motion.circle cx={70} cy={35} r={7} fill={INK_TEXT} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: delay + 0.9 }} />
    </svg>
  );
}

/* ---------- the agree-o-meter ---------- */

const CX = 1140;
const CY = 640;
const R = 260;
const STOPS: [string, string, string?][] = [['أنا معاك', TEAL, 'ana-maak'], ['معاك حق', '#5E9A88', 'maak-haa'], ['مش متأكد', GOLD, 'mish-metakked'], ['معاك حق، بس…', '#C0603A'], ['لأ طبعاً!', CRIMSON, 'la-tabaan']];
const angle = (i: number) => 162 - 36 * i;
const rot = (i: number) => angle(i) - 90;

/** The gauge: the arc, the phrases around it (`labels` shown), and the needle at stop `at` (or sweeping all of them). */
function Meter({ labels, at, sweep = false, glow }: { labels: number; at: number; sweep?: boolean; glow?: number }) {
  const pt = (deg: number, r: number) => [R + 20 + r * Math.cos((deg * Math.PI) / 180), R + 20 - r * Math.sin((deg * Math.PI) / 180)];
  return (
    <>
      <svg className="pointer-events-none absolute" style={{ left: CX - R - 20, top: CY - R - 20 }} width={2 * R + 40} height={R + 40}>
        {STOPS.map(([, c], i) => {
          const [x1, y1] = pt(180 - 36 * i, R);
          const [x2, y2] = pt(180 - 36 * (i + 1), R);
          return <motion.path key={i} d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`} fill="none" stroke={c} strokeWidth={34} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 + i * 0.15, ease: 'linear' }} />;
        })}
      </svg>
      {STOPS.slice(0, labels).map(([w, c, id], i) => {
        const lr = i === 1 || i === 3 ? 360 : 335;
        const x = CX + lr * Math.cos((angle(i) * Math.PI) / 180);
        const y = CY - lr * Math.sin((angle(i) * Math.PI) / 180);
        const on = glow === i;
        const body = <span className="inline-flex rounded-full" style={{ padding: '0 16px 2px', background: c, boxShadow: on ? `0 0 0 4px #fff, 0 0 30px 6px ${c}88` : SHADOW }}><ArText size={24} color="#fff">{w}</ArText></span>;
        return (
          <div key={w} className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: on ? 1.12 : 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.7, delay: sweep ? 0.3 + i * 0.5 : 0.1 }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.div>
          </div>
        );
      })}
      <motion.div className="pointer-events-none absolute rounded-full" style={{ left: CX - 5, top: CY - 220, width: 10, height: 220, background: INK_TEXT, transformOrigin: '50% 100%' }}
        initial={{ rotate: 0 }} animate={{ rotate: sweep ? STOPS.map((_, i) => rot(i)) : rot(at) }}
        transition={sweep ? { duration: 2.4, delay: 0.3, times: [0, 0.25, 0.5, 0.75, 1], ease: 'easeInOut' } : { type: 'spring', bounce: 0.35, duration: 1.1, delay: 0.2 }} />
      <span className="pointer-events-none absolute rounded-full" style={{ left: CX - 22, top: CY - 22, width: 44, height: 44, background: INK_TEXT, border: '6px solid #FFFDF8' }} />
    </>
  );
}

/* ---------- spark ---------- */

export function Eta1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Pitch />
      <Board x={1130} y={170} delay={0.2} />
      <Armband x={1420} y={250} delay={0.8} float />
      <Person x={920} y={800} scale={0.95} color={OMAR} delay={0.3} />
      <Person x={1100} y={800} scale={0.95} color={KARIM} delay={0.4} />
      <Person x={1280} y={800} scale={0.95} color={NOUR} hijab delay={0.5} />
    </>
  );
}

export function Eta1RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={220} word="جبت جون. وبعدين… فجأة!" size={30} />
      <Chip x={1150} y={290} color={GOLD} delay={0.4}>a story: what happened</Chip>
      {lines >= 2 && (
        <>
          <Person x={1000} y={800} scale={1} color={NOUR} hijab delay={0.1} />
          <Person x={1300} y={800} scale={1} color={OMAR} delay={0.2} />
          <Say x={1000} y={570} id="eh-raayak" text="إيه رأيك؟" width={170} size={30} delay={0.4} />
          <Chip x={1300} y={500} color={CRIMSON} delay={0.8}>an opinion: what you think</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={900} y={390} delay={0.1}>best player?</Chip>
          <Chip x={1120} y={390} delay={0.3}>best song?</Chip>
          <Chip x={1370} y={390} delay={0.5}>who pays for the pizza?</Chip>
        </>
      )}
    </>
  );
}

export function Eta1ClubGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Pitch />
      <Person x={1080} y={800} scale={0.95} color={OMAR} />
      <Person x={1250} y={800} scale={0.95} color={KARIM} delay={0.1} />
      <Person x={1420} y={800} scale={0.95} color={NOUR} hijab delay={0.2} />
      {lines >= 2 && <Person x={880} y={800} scale={1} color={COACH} delay={0.1} />}
      {lines >= 2 && <Board x={1130} y={170} names={lines >= 3} delay={0.3} />}
      {lines >= 3 && <Armband x={1420} y={260} delay={0.9} float />}
    </>
  );
}

/* ---------- zad ---------- */

export function Eta1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Pitch />
      <Person x={880} y={800} scale={0.95} color={COACH} />
      <Person x={1060} y={800} scale={0.95} color={OMAR} />
      <Person x={1270} y={800} scale={0.95} color={KARIM} />
      <Person x={1440} y={800} scale={0.95} color={NOUR} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={880} y={580} id="story-1" text="مين يبقى الكابتن؟ إيه رأيكم؟" width={320} size={23} delay={0.2} />
          <Say x={1060} y={420} id="story-2" text="أنا شايف إن نور لازم تبقى الكابتن." width={390} size={22} accent delay={1.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1270} y={580} id="story-3" text="لأ طبعاً! أنا أسرع واحد في الفريق!" align="right" width={390} size={22} accent delay={0.2} />
          <Say x={1060} y={400} id="story-4" text="معاك حق إنك سريع، بس نور بتسمع الكل." width={430} size={21} delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1440} y={580} id="story-5" text="بصراحة… مش متأكدة." align="right" width={240} size={24} delay={0.2} />
          <Say x={1270} y={420} id="story-6" text="ماشي… عندك حق. نور!" align="right" width={260} size={24} accent delay={1.4} />
          <Armband x={1460} y={712} scale={0.5} delay={2.4} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eta1ThinkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Eye x={1150} y={190} />
      <Chip x={1290} y={170} color={TEAL} delay={1}>شايف = seeing</Chip>
      <StreetCard x={1130} y={320} word="أنا شايف إن نور لازم تبقى الكابتن." id="shayef" size={26} delay={0.4} />
      <Person x={1440} y={800} scale={0.95} color={OMAR} />
      {lines >= 2 && (
        <>
          <Person x={860} y={800} scale={0.95} color={NOUR} hijab delay={0.1} />
          <StreetCard x={1130} y={450} word="أنا شايفة إن كريم سريع." id="shayfa" size={26} delay={0.3} />
          <Chip x={1130} y={510} color={CRIMSON} delay={0.8}>شايفة: -a = a girl</Chip>
        </>
      )}
      {lines >= 3 && <StreetCard x={1150} y={660} word="في رأيي…" id="fi-raayi" size={30} delay={0.2} />}
    </>
  );
}

export function Eta1AgreeGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  if (k < 1) return null;
  return (
    <>
      <Board x={1150} y={160} votes={[0, 0, k + 1]} />
      <Person x={880} y={800} scale={0.95} color={OMAR} />
      <Person x={1150} y={800} scale={0.95} color={KARIM} />
      <Person x={1420} y={800} scale={0.95} color={NOUR} hijab />
      {k === 1 && <Say key="a" x={1150} y={570} id="maak-haa" text="معاك حق." align="right" width={160} size={28} delay={0.2} />}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={880} y={570} id="maaki-haa" text="معاكي حق." width={170} size={28} delay={0.2} />
          <Chip x={1290} y={470} color={CRIMSON} delay={0.6}>to a girl: -i</Chip>
        </React.Fragment>
      )}
      {k === 3 && <Say key="c" x={1150} y={570} id="ana-maak" text="أنا معاك!" align="right" width={170} size={28} accent delay={0.2} />}
    </>
  );
}

export function Eta1ButGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={880} y={800} scale={0.95} color={OMAR} lean={lines === 1 ? -6 : 0} />
      <Person x={1420} y={800} scale={0.95} color={KARIM} />
      <Say x={1420} y={570} id="la-tabaan" text="لأ طبعاً!" align="right" width={160} size={30} accent delay={0.2} />
      <Chip x={1340} y={400} color={CRIMSON} delay={0.6}>strong</Chip>
      {lines >= 2 && (
        <>
          <StreetCard x={1080} y={220} word="معاك حق إنك سريع،" id="maak-haa-bass" size={28} delay={0.2} />
          <Chip x={1080} y={290} color={GOLD} delay={0.8}>بس = but</Chip>
          <StreetCard x={1080} y={370} word="نور بتسمع الكل." size={28} delay={1.3} />
        </>
      )}
      {lines >= 3 && <Chip x={1100} y={480} color={TEAL} delay={0.2}>same no, less fight</Chip>}
    </>
  );
}

export function Eta1UnsureGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={1380} y={800} scale={1} color={NOUR} hijab />
      <Say x={1380} y={570} text="مش متأكدة…" align="right" width={190} size={28} thought delay={0.2} />
      {lines >= 2 && (
        <>
          <Person x={900} y={800} scale={1} color={OMAR} delay={0.1} />
          <Say x={900} y={570} id="mish-metakked" text="مش متأكد." width={170} size={28} delay={0.3} />
          <StreetCard x={1140} y={250} word="بصراحة… مش متأكدة." id="bsaraha" size={30} delay={0.8} />
          <Chip x={1140} y={320} color={GOLD} delay={1.3}>بصراحة = honestly</Chip>
        </>
      )}
      {lines >= 3 && <Chip x={1140} y={420} color={TEAL} delay={0.2}>not sure &gt; a fake yes</Chip>}
    </>
  );
}

/** The wow: five phrases on one gauge; the needle visits each, then rests on the soft no. */
export function Eta1MeterGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {lines === 1 && <Meter key="m1" labels={0} at={2} />}
      {lines === 2 && <Meter key="m2" labels={5} at={4} sweep />}
      {lines >= 3 && <Meter key="m3" labels={5} at={3} glow={3} />}
      <Chip x={900} y={690} color={TEAL} delay={0.6}>full yes</Chip>
      <Chip x={1380} y={690} color={CRIMSON} delay={0.8}>full no</Chip>
      {lines >= 3 && <Chip x={1140} y={740} color={GOLD} delay={0.6}>you choose the volume</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

function Pizza({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 55, top: y - 55 }} width={110} height={110} initial={{ opacity: 0, rotate: -20, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay }}>
      <path d="M 55 104 L 8 14 Q 55 -4 102 14 Z" fill="#F2C46B" stroke="#C98A3A" strokeWidth={6} strokeLinejoin="round" />
      <circle cx={42} cy={36} r={9} fill={CRIMSON} /><circle cx={68} cy={42} r={8} fill={CRIMSON} /><circle cx={55} cy={66} r={7} fill={CRIMSON} />
    </motion.svg>
  );
}

function Koshari({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: x - 65, top: y - 50 }} width={130} height={100} initial={{ opacity: 0, y: 14, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay }}>
      <path d="M 14 40 Q 65 20 116 40 Z" fill="#B5652E" />
      <circle cx={40} cy={34} r={5} fill="#E8D7A8" /><circle cx={62} cy={28} r={5} fill="#E8D7A8" /><circle cx={86} cy={34} r={5} fill="#E8D7A8" />
      <path d="M 6 42 H 124 Q 118 92 65 94 Q 12 92 6 42 Z" fill={TEAL} />
    </motion.svg>
  );
}

export function Eta1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Koshari x={1300} y={240} delay={0.2} />
      <Chip x={1150} y={225} delay={0.5}>vs</Chip>
      <Pizza x={1000} y={240} delay={0.3} />
      <Person x={1330} y={800} scale={1} color={OMAR} />
      <Say x={1330} y={570} id="koshari" text="الكشري أحلى من البيتزا!" align="right" width={300} size={26} delay={0.4} />
      {lines >= 2 && (
        <>
          <Chip x={950} y={420} color={TEAL} delay={0.2}>agree</Chip>
          <Chip x={1100} y={420} color={GOLD} delay={0.35}>not sure</Chip>
          <Chip x={1265} y={420} color={CRIMSON} delay={0.5}>disagree</Chip>
        </>
      )}
    </>
  );
}

export function Eta1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const msgs = [
    { t: 'أنا شايف إن…', who: 'me', c: TEAL },
    { t: 'لأ، أنا شايفة إن…', who: 'a friend', c: CRIMSON },
    { t: 'معاكي حق، بس…', who: 'me', c: TEAL },
  ];
  return <Chat msgs={msgs} n={lines >= 2 ? 3 : 1} />;
}

export function Eta1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const msgs = [
    { t: 'اللي فات مات!', who: 'Karim', c: KARIM },
    { t: 'يعني إيه؟', who: 'Omar', c: OMAR },
  ];
  return (
    <>
      <Person x={860} y={800} scale={1} color={NOUR} hijab glow />
      <Armband x={882} y={712} scale={0.55} delay={0.4} />
      {lines >= 2 && <Chat msgs={msgs} n={lines >= 3 ? 2 : 1} id="elli-fat" />}
      {lines >= 3 && <Chip x={1440} y={720} color={CRIMSON} delay={0.3}>next: sayings</Chip>}
    </>
  );
}
