import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, useReduce, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Bubble, Chip, Badge, CLAY, DEEP } from './kit';
import { Hear } from '../Say';

/**
 * Egyptian Arabic · Adults · Lesson 1 · Ahlan! What's Your Name? The academy's paper stage with a Cairo accent: a
 * building drawn in code (balconies, the doorman's door, a skyline of minarets behind), and three faceless people: Adam
 * (teal, the learner from abroad), Amm Sayed the doorman (clay, in a galabeya) and Mona the neighbour (gold, hijab).
 * Every Arabic line on the stage plays on tap (Mahmoud Egyptian). The motion carries the lesson's one idea: the ending
 * follows the person you talk to (ـَك / ـِك).
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const GROUND = 800;
const ADAM = TEAL;
const SAYED = CLAY;
const MONA = GOLD;

function ArText({ children, size, color = INK_TEXT }: { children: React.ReactNode; size: number; color?: string }) {
  return <span lang="ar" style={{ ...AR, fontSize: size, lineHeight: 1.35, color, whiteSpace: 'nowrap' }}>{children}</span>;
}

/** An Egyptian line in a speech bubble pointing down to (x, y); plays on tap. */
function Say({ x, y, id, text, align = 'left', delay = 0, width = 260, accent = false, thought = false, size = 34 }: {
  x: number; y: number; id?: string; text: React.ReactNode; align?: 'left' | 'right'; delay?: number; width?: number; accent?: boolean; thought?: boolean; size?: number;
}) {
  const t = <ArText size={size} color={accent ? '#fff' : INK_TEXT}>{text}</ArText>;
  return <Bubble x={x} y={y} width={width} align={align} delay={delay} accent={accent} thought={thought} text={<div style={{ textAlign: 'center' }}>{id ? <Hear id={id}>{t}</Hear> : t}</div>} />;
}

/** A word tile (Arabic, big) centred at (x, y); `hot` frames it in crimson. */
function Tile({ x, y, children, size = 64, hot = false, color = INK_TEXT, delay = 0, from }: {
  x: number; y: number; children: React.ReactNode; size?: number; hot?: boolean; color?: string; delay?: number; from?: { x: number; y: number };
}) {
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div className="flex items-center justify-center rounded-[22px]" style={{ padding: '6px 26px', background: '#FFFDF8', boxShadow: hot ? `0 0 0 4px ${CRIMSON}, 0 0 34px 6px ${CRIMSON}44` : '0 18px 34px -24px rgba(60,30,10,0.6)' }}
        initial={from ? { x: from.x, y: from.y, opacity: 0.6 } : { opacity: 0, y: 18, scale: 0.9 }} animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 1, delay }}>
        <ArText size={size} color={color}>{children}</ArText>
      </motion.div>
    </div>
  );
}

/** Domes and minarets on the horizon, drawn as one line (the Cairo accent of this curriculum). */
function Skyline({ delay = 0, opacity = 0.35 }: { delay?: number; opacity?: number }) {
  const d = 'M 760 560 L 820 560 L 820 470 Q 826 452 832 470 L 832 560 L 880 560 Q 880 500 930 500 Q 980 500 980 560 L 1010 560 L 1010 420 L 1016 400 L 1022 420 L 1022 560 L 1100 560 Q 1104 520 1140 520 Q 1176 520 1180 560 L 1300 560 L 1300 450 Q 1306 430 1312 450 L 1312 560 L 1380 560 Q 1384 510 1420 510 Q 1456 510 1460 560 L 1520 560';
  return <Svg><g opacity={opacity}><Draw d={d} color={DEEP} width={2.5} delay={delay} dur={2.2} /></g></Svg>;
}

/** The building: four floors with balconies and a wooden door at street level. Left edge x, width w. */
function Building({ x = 780, w = 330, delay = 0, door = true }: { x?: number; w?: number; delay?: number; door?: boolean }) {
  const top = 230;
  const floors = [0, 1, 2, 3];
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x, top, width: w, height: GROUND - top }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay, ease }}>
      <svg viewBox={`0 0 ${w} ${GROUND - top}`} width="100%" height="100%">
        <rect x={0} y={0} width={w} height={GROUND - top} rx={6} fill="#EAD9BE" />
        <rect x={0} y={0} width={w} height={14} fill="#D6BE98" />
        {floors.map((f) => (
          <g key={f} transform={`translate(0 ${30 + f * 105})`}>
            {[0.18, 0.62].map((p) => (
              <g key={p}>
                <rect x={w * p} y={0} width={w * 0.2} height={62} rx={4} fill="#6B8F95" opacity={0.75} />
                <rect x={w * p - 8} y={60} width={w * 0.2 + 16} height={8} rx={2} fill="#B99B70" />
                {[0, 1, 2, 3].map((b) => <rect key={b} x={w * p - 4 + b * (w * 0.2 + 8) / 3} y={66} width={3} height={22} fill="#B99B70" />)}
              </g>
            ))}
          </g>
        ))}
        {door && (
          <g>
            <rect x={w / 2 - 46} y={GROUND - top - 132} width={92} height={132} rx={44} fill="#7A4A2A" />
            <rect x={w / 2 - 2} y={GROUND - top - 120} width={4} height={120} fill="#5C3620" />
            <circle cx={w / 2 + 16} cy={GROUND - top - 60} r={4} fill={GOLD} />
          </g>
        )}
      </svg>
    </motion.div>
  );
}

/** The ground line of the street. */
function Street() {
  return <Svg><line x1={760} y1={GROUND} x2={1520} y2={GROUND} stroke="rgba(31,22,18,0.18)" strokeWidth={3} /></Svg>;
}

/** Stairs from the upper right down to the street, for Mona's scenes. */
function Stairs() {
  const steps = Array.from({ length: 6 }, (_, i) => i);
  return (
    <motion.svg className="pointer-events-none absolute" style={{ left: 1180, top: 500, overflow: 'visible' }} width={340} height={300} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {steps.map((i) => <rect key={i} x={i * 56} y={300 - (6 - i) * 46} width={340 - i * 56} height={46} fill={i % 2 ? '#E2CDAA' : '#EAD9BE'} />)}
    </motion.svg>
  );
}

/* ---------- spark ---------- */

/** The street speaks: the skyline draws itself; the first words of the course come out of the windows. */
export function Ea1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Skyline opacity={0.45} />
      <Building x={980} w={360} delay={0.4} />
      <Street />
      <Say x={1060} y={330} id="ahlan" text="أهلاً وسهلاً" delay={1.4} width={230} />
      <Say x={1300} y={440} id="ismak-eh" text="اسمَك إيه؟" align="right" delay={2} width={230} accent />
    </>
  );
}

/** The book line meets the street: the phrasebook's question, the doorman's smile, then book and street side by side. */
export function Ea1BookGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Building x={1180} w={330} />
      <Street />
      {lines >= 1 && lines < 4 && (
        <motion.div className="absolute flex flex-col items-center rounded-[14px]" style={{ left: 800, top: 200, width: 300, padding: '22px 10px 18px', background: '#F3E7D2', boxShadow: '0 22px 40px -26px rgba(60,30,10,0.7), inset 0 0 0 2px #CDB48A' }}
          initial={{ rotate: -8, opacity: 0, y: 30 }} animate={{ rotate: -3, opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <span className="font-sans font-bold uppercase" style={{ fontSize: 14, letterSpacing: '0.18em', color: soft('light') }}>Phrasebook · page 1</span>
          <ArText size={50} color={DEEP}>مَا اسْمُكَ؟</ArText>
          <span className="font-serif italic" style={{ fontSize: 20, color: soft('light') }}>What is your name?</span>
        </motion.div>
      )}
      {lines >= 2 && <Person x={1130} y={GROUND} scale={1.05} color={ADAM} />}
      {lines >= 2 && <Person x={1345} y={GROUND} scale={1.1} color={SAYED} delay={0.1} />}
      {lines >= 2 && lines < 4 && <Say x={1130} y={560} id="maa-ismuka" text="مَا اسْمُكَ؟" delay={0.3} width={210} />}
      {lines >= 3 && lines < 4 && <Say x={1345} y={540} text="؟ ☺" align="right" thought delay={0.2} width={110} />}
      {lines >= 4 && (
        <>
          <motion.div className="absolute flex flex-col items-center rounded-[22px]" style={{ left: 790, top: 190, width: 300, padding: '18px 0', background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }}
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease }}>
            <span className="font-sans font-bold uppercase" style={{ fontSize: 15, letterSpacing: '0.16em', color: soft('light') }}>The book · فصحى</span>
            <ArText size={46} color={DEEP}>مَا اسْمُكَ؟</ArText>
          </motion.div>
          <motion.div className="absolute flex flex-col items-center rounded-[22px]" style={{ left: 1150, top: 190, width: 300, padding: '18px 0', background: '#FFFDF8', boxShadow: `0 0 0 4px ${CRIMSON}, 0 18px 34px -24px rgba(60,30,10,0.6)` }}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4, ease }}>
            <span className="font-sans font-bold uppercase" style={{ fontSize: 15, letterSpacing: '0.16em', color: CRIMSON }}>The street · مصري</span>
            <Hear id="ismak-eh"><ArText size={46}>اسمَك إيه؟</ArText></Hear>
          </motion.div>
          <Svg><Draw d="M 1100 250 L 1140 250" color={CRIMSON} width={4} delay={0.5} dur={0.5} /><Draw d="M 1128 240 L 1142 250 L 1128 260" color={CRIMSON} width={4} delay={0.9} dur={0.3} /></Svg>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** At the door: Sayed greets, Adam answers; each exchange replaces the last, so the eye follows the pairs. */
export function Ea1DoorGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const k = Math.min(lines, 3);
  return (
    <>
      <Building x={790} w={320} />
      <Street />
      <Person x={950} y={GROUND} scale={1.1} color={SAYED} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={reduce ? false : { x: 260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease }}>
        <Person x={1320} y={GROUND} scale={1.05} color={ADAM} />
      </motion.div>
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={950} y={540} id="d-salam" text="السلام عليكم!" delay={1} width={250} />
          <Say x={1320} y={470} id="d-wa-alaykum" text="وعليكم السلام." align="right" delay={2.2} width={250} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={950} y={540} id="d-ahlan-ismak" text="أهلاً وسهلاً! اسمَك إيه؟" width={330} />
          <Say x={1320} y={430} id="d-ismi-adam" text={<><span style={{ color: CRIMSON }}>اسمي</span> آدم. وحضرتك؟</>} align="right" delay={1.2} width={300} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={950} y={540} id="d-ana-sayed" text="أنا سيّد، البوّاب. تشرّفنا!" width={340} />
          <Say x={1320} y={430} id="d-sharaf" text="الشرف ليّا." align="right" delay={1.2} width={220} />
          <Chip x={1300} y={200} color={CRIMSON} delay={1.8}>اسمي = my name</Chip>
        </React.Fragment>
      )}
    </>
  );
}

/** Greetings as a volley: each greeting crosses to the right, and its reply comes back a little bigger and warmer. */
export function Ea1PairsGraphic({ lines, items }: GraphicProps) {
  const pairs = [
    { a: 'السلام عليكم', b: 'وعليكم السلام', ia: 'salam', ib: 'wa-alaykum' },
    { a: 'صباح الخير', b: 'صباح النور', ia: 'sabah-kheer', ib: 'sabah-noor' },
    { a: 'أهلاً وسهلاً', b: 'أهلاً بيك', ia: 'ahlan', ib: 'ahlan-bik' },
  ];
  const rows = Math.max(items, lines >= 1 ? 1 : 0);
  if (rows === 0) return null;
  return (
    <>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 1300, top: 180, fontSize: 15, letterSpacing: '0.16em', color: soft('light') }}>You say</span>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 860, top: 180, fontSize: 15, letterSpacing: '0.16em', color: CRIMSON }}>They answer</span>
      {pairs.slice(0, rows).map((p, i) => {
        const y = 270 + i * 170;
        const warm = i > 0 || lines >= 2;
        return (
          <React.Fragment key={p.ia}>
            <Tile x={1370} y={y} size={40}><Hear id={p.ia}>{p.a}</Hear></Tile>
            <Svg>
              <Draw d={`M 1250 ${y - 18} Q 1110 ${y - 70} 990 ${y - 18}`} color={GOLD} width={3} delay={0.4} dur={0.7} dash="2 10" />
              <Draw d={`M 990 ${y + 22} Q 1110 ${y + 70} 1250 ${y + 22}`} color={CRIMSON} width={3} delay={1.2} dur={0.7} />
            </Svg>
            <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ scale: warm ? 1 : 0.92 }}>
              <Tile x={890} y={y} size={warm ? 46 : 40} hot={warm} delay={0.9}><Hear id={p.ib}>{p.b}</Hear></Tile>
            </motion.div>
          </React.Fragment>
        );
      })}
      {lines >= 3 && items === 0 && (
        <motion.div className="absolute flex gap-3" style={{ left: 1060, top: 420 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="block rounded-full" style={{ width: 16, height: 16, background: GOLD }} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
          <span className="font-sans font-semibold" style={{ fontSize: 20, color: soft('light'), marginLeft: 8 }}>wait for it…</span>
        </motion.div>
      )}
    </>
  );
}

/** The wow: the question word travels from the front of the sentence to its end; then the answer drops into its slot. */
export function Ea1EhGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const egyptian = lines >= 2;
  return (
    <>
      {/* The phrasebook row: question word first (on the right, Arabic reads right to left). */}
      <motion.div className="absolute" style={{ left: 0, top: 0, transformOrigin: '1140px 230px' }} initial={false} animate={{ opacity: egyptian ? 0.4 : 1, scale: egyptian ? 0.7 : 1 }} transition={{ duration: 0.8, ease }}>
        <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 800, top: 200, fontSize: 15, letterSpacing: '0.16em', color: soft('light') }}>Book</span>
        <Tile x={1360} y={250} hot={!egyptian}>مَا</Tile>
        <Tile x={1120} y={250} delay={0.2}><Hear id="maa-ismuka">اسْمُكَ؟</Hear></Tile>
      </motion.div>
      {egyptian && (
        <>
          <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 800, top: 400, fontSize: 15, letterSpacing: '0.16em', color: CRIMSON }}>Cairo</span>
          <Tile x={1330} y={440} delay={0.1}><Hear id="ismak-eh">اسمَك</Hear></Tile>
          <Tile x={1060} y={440} hot from={{ x: 300, y: -190 }} delay={0.3}>إيه؟</Tile>
        </>
      )}
      {lines >= 3 && (
        <>
          <Svg>
            <Draw d="M 1060 486 L 1060 580" color={GOLD} width={3} dash="4 8" delay={0.2} dur={0.5} />
            <Draw d="M 1330 486 L 1330 580" color={GOLD} width={3} dash="4 8" delay={0.2} dur={0.5} />
          </Svg>
          <Tile x={1330} y={630} color={TEAL} from={{ x: 0, y: -190 }} delay={0.5}><Hear id="ismi-adam">اسمي</Hear></Tile>
          <Tile x={1060} y={630} color={CRIMSON} from={{ x: 0, y: -260 }} delay={0.9}>آدم</Tile>
        </>
      )}
      {lines >= 4 && (
        <>
          <Chip x={980} y={740} color={TEAL} delay={0.2}>فين؟ · where</Chip>
          <Chip x={1180} y={740} color={TEAL} delay={0.35}>كام؟ · how much</Chip>
          <Chip x={1380} y={740} delay={0.5}>same slot</Chip>
        </>
      )}
    </>
  );
}

/** Mona comes down the stairs; Adam asks with ـَك; Sayed whispers ـِك. The change of one vowel is the whole scene. */
export function Ea1MonaGraphic({ lines }: GraphicProps) {
  const down = lines >= 1;
  return (
    <>
      <Street />
      <Stairs />
      <Person x={830} y={GROUND} scale={1.05} color={SAYED} />
      <Person x={1010} y={GROUND} scale={1.05} color={ADAM} delay={0.1} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: down ? 0 : 160, y: down ? 0 : -200 }} transition={{ duration: 1.6, ease }}>
        <Person x={1260} y={GROUND} scale={1.05} color={MONA} hijab />
      </motion.div>
      {lines === 2 && <Say x={1010} y={560} id="ismak-eh" text={<>اسمَ<span style={{ color: CRIMSON }}>ك</span> إيه؟</>} delay={0.2} width={220} />}
      {lines >= 3 && (
        <>
          <Say x={830} y={420} id="m-whisper" text={<>اسمِ<span style={{ color: CRIMSON }}>ك</span>، اسمِ<span style={{ color: CRIMSON }}>ك</span>!</>} thought delay={0.2} width={230} size={28} />
          <Say x={1300} y={540} id="m-mona" text="اسمي منى. أهلاً بيك!" align="right" delay={1.2} width={290} accent />
        </>
      )}
      {lines >= 4 && (
        <motion.div className="absolute flex items-center gap-6 rounded-[26px]" style={{ left: 980, top: 180, padding: '10px 30px', background: '#FFFDF8', boxShadow: `0 0 0 4px ${GOLD}, 0 0 40px 8px ${GOLD}55` }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <ArText size={58}>ـَك</ArText>
          <span className="font-sans font-black" style={{ fontSize: 34, color: CRIMSON }}>→</span>
          <ArText size={58} color={CRIMSON}>ـِك</ArText>
          <span className="font-sans font-bold" style={{ fontSize: 20, color: soft('light') }}>to Mona</span>
        </motion.div>
      )}
    </>
  );
}

/** One word, three owners: the endings snap on to اسم and fly to the person each one points to. */
export function Ea1SuffixGraphic({ lines, items }: GraphicProps) {
  const people = [
    { x: 1360, color: ADAM, hijab: false, word: 'اسمي', id: 'ismi', who: 'me' },
    { x: 1110, color: SAYED, hijab: false, word: 'اسمَك', id: 'ismak', who: 'you, a man' },
    { x: 860, color: MONA, hijab: true, word: 'اسمِك', id: 'ismik', who: 'you, a woman' },
  ];
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute flex flex-col items-center rounded-[18px]" style={{ left: 1010, top: 170, width: 200, overflow: 'hidden', background: '#FFFDF8', boxShadow: `0 0 0 4px ${CRIMSON}, 0 18px 34px -24px rgba(60,30,10,0.6)` }}
          initial={{ rotate: -10, opacity: 0, y: -20 }} animate={{ rotate: 0, opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35 }}>
          <span className="w-full text-center font-sans font-bold uppercase text-white" style={{ fontSize: 13, letterSpacing: '0.18em', padding: '4px 0', background: CRIMSON }}>name tag</span>
          <Hear id="ism"><ArText size={64}>اسم</ArText></Hear>
        </motion.div>
      )}
      {lines >= 2 && items === 0 && people.map((p, i) => (
        <motion.div key={p.id} className="absolute" style={{ left: 1250 - i * 150, top: 320 }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.25, type: 'spring', bounce: 0.4 }}>
          <span className="block rounded-full text-center" style={{ width: 120, padding: '2px 0', background: '#FFFDF8', boxShadow: `0 0 0 3px ${p.color}` }}><ArText size={58} color={p.color === GOLD ? DEEP : p.color}>{['ـي', 'ـَك', 'ـِك'][i]}</ArText></span>
        </motion.div>
      ))}
      {lines >= 3 && items === 0 && (
        <motion.div className="absolute flex items-center gap-8" style={{ left: 860, top: 470 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          {[{ id: 'ismak', t: 'ismak' }, { id: 'ismik', t: 'ismik' }].map((w, i) => (
            <React.Fragment key={w.id}>
              {i === 1 && <span className="font-sans font-black" style={{ fontSize: 40, color: soft('light') }}>=</span>}
              <div className="flex flex-col items-center rounded-[20px]" style={{ padding: '6px 26px', background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }}>
                <ArText size={56}>اسمك</ArText>
                <Hear id={w.id}><span className="font-sans font-extrabold" style={{ fontSize: 24, color: i ? CRIMSON : TEAL }}>🔊 {w.t}</span></Hear>
              </div>
            </React.Fragment>
          ))}
          <span className="font-sans font-semibold" style={{ fontSize: 20, color: soft('light'), maxWidth: 140 }}>same on paper, different in the voice</span>
        </motion.div>
      )}
      {people.slice(0, items).map((p) => (
        <React.Fragment key={p.id}>
          <Person x={p.x} y={GROUND} scale={0.95} color={p.color} hijab={p.hijab} delay={0.1} />
          <motion.div className="absolute flex flex-col items-center" style={{ left: p.x - 100, top: 420, width: 200 }} initial={{ opacity: 0, x: 1110 - p.x, y: -170, scale: 0.6 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} transition={{ duration: 0.9, delay: 0.2, ease }}>
            <span className="rounded-[18px]" style={{ padding: '2px 22px', background: '#FFFDF8', boxShadow: `0 0 0 3px ${p.color}` }}><Hear id={p.id}><ArText size={50}>{p.word}</ArText></Hear></span>
            <span className="mt-2 font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>{p.who}</span>
          </motion.div>
        </React.Fragment>
      ))}
    </>
  );
}

/** حضرتك lifts a person up: Sayed rises on to a gold step when Adam calls him حضرتك; friends stay on the ground with إنت. */
export function Ea1HadraGraphic({ lines }: GraphicProps) {
  const lifted = lines >= 2;
  return (
    <>
      <Street />
      {lifted && (
        <motion.div className="absolute rounded-t-[10px]" style={{ left: 820, top: GROUND - 46, width: 170, height: 46, background: `linear-gradient(180deg, ${GOLD}, #C98A22)`, boxShadow: `0 0 40px 6px ${GOLD}66` }}
          initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, ease }} />
      )}
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ y: lifted ? -46 : 0 }} transition={{ duration: 0.7, ease }}>
        <Person x={905} y={GROUND} scale={1.1} color={SAYED} glow={lifted} />
      </motion.div>
      <Person x={1170} y={GROUND} scale={1.05} color={ADAM} flip />
      {lines >= 1 && <Say x={1170} y={540} id="hadritak" text="وحضرتَك؟" align="right" delay={0.2} width={200} />}
      {lines >= 3 && (
        <>
          <Chip x={905} y={250} color={CRIMSON} delay={0.1}>حضرتَك · to a man</Chip>
          <Chip x={905} y={300} color={DEEP} delay={0.3}>حضرتِك · to a woman</Chip>
        </>
      )}
      {lines >= 4 && (
        <>
          <Person x={1420} y={GROUND} scale={0.95} color="#6E8B5A" delay={0.1} />
          <Say x={1420} y={570} id="inta" text="إنت" align="right" delay={0.5} width={110} />
          <Chip x={1330} y={250} color={TEAL} delay={0.7}>friends your age: إنت / إنتي</Chip>
          <Chip x={1330} y={300} delay={0.9}>in doubt? حضرتك</Chip>
        </>
      )}
    </>
  );
}

/** Oranges roll down the stairs and come back: sorry and its reply, then thanks and its reply. */
export function Ea1SorryGraphic({ lines }: GraphicProps) {
  const spilled = lines >= 1 && lines < 3;
  const oranges = [0, 1, 2, 3];
  return (
    <>
      <Street />
      <Stairs />
      <Person x={1010} y={GROUND} scale={1.05} color={ADAM} />
      <Person x={1280} y={GROUND} scale={1.05} color={MONA} hijab flip />
      <motion.div className="absolute rounded-[10px]" style={{ left: 1205, top: 640, width: 60, height: 70, background: '#F2E6CF', boxShadow: 'inset 0 0 0 3px #CDB48A' }}
        initial={false} animate={{ rotate: spilled ? -50 : 0, x: spilled ? -10 : 0 }} transition={{ duration: 0.5 }} />
      {oranges.map((o) => (
        <motion.span key={o} className="absolute rounded-full" style={{ left: 1225, top: 640, width: 28, height: 28, background: '#F28C28', boxShadow: 'inset -4px -4px 0 rgba(0,0,0,0.12)' }}
          initial={false} animate={spilled ? { x: -140 - o * 70, y: 130 + (o % 2) * 10, rotate: 360 + o * 90, opacity: 1 } : { x: 0, y: 0, rotate: 0, opacity: 0 }}
          transition={{ duration: 1.1, delay: spilled ? o * 0.12 : 0, ease }} />
      ))}
      {lines === 2 && (
        <React.Fragment key="sorry">
          <Say x={1010} y={560} id="asif" text="آسف!" align="right" width={140} />
          <Say x={1280} y={560} id="wala-yhimmak" text="ولا يهمّك." delay={1} width={200} />
        </React.Fragment>
      )}
      {lines >= 3 && (
        <React.Fragment key="thanks">
          <Say x={1280} y={560} id="shukran" text="شكراً." width={150} />
          <Say x={1010} y={560} id="afw" text="العفو." align="right" delay={1} width={150} />
        </React.Fragment>
      )}
      {lines >= 4 && (
        <>
          <Chip x={1000} y={220} color={GOLD}>she says: <Hear id="asfa">آسفة</Hear></Chip>
          <Chip x={1300} y={220} color={CRIMSON} delay={0.3}>to her: <Hear id="wala-yhimmik">ولا يهمِّك</Hear></Chip>
        </>
      )}
    </>
  );
}

/** Adam walks off; the reply goes with him as a small light; Mona answers from the balcony with her ending. */
export function Ea1ByeGraphic({ lines, items }: GraphicProps) {
  const reduce = useReduce();
  const gone = lines >= 1;
  return (
    <>
      <Building x={790} w={320} />
      <Street />
      <Person x={950} y={GROUND} scale={1.05} color={SAYED} />
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: gone && !reduce ? 230 : 0 }} transition={{ duration: 2.2, ease }}>
        <Person x={1190} y={GROUND} scale={1.0} color={ADAM} />
        {lines >= 2 && (
          <motion.span className="absolute rounded-full" style={{ left: 1176, top: 560, width: 28, height: 28, background: GOLD, boxShadow: `0 0 30px 12px ${GOLD}88` }}
            initial={{ x: -230, y: 0, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ duration: 1.4, delay: 0.6, ease }} />
        )}
      </motion.div>
      {lines >= 1 && lines < 2 && <Say x={1420} y={560} id="maa-salama" text="مع السلامة." align="right" delay={1.4} width={220} />}
      {lines >= 2 && <Say x={950} y={540} id="allah-ysallimak" text={<>الله يسلّمَ<span style={{ color: CRIMSON }}>ك</span>.</>} width={250} />}
      {lines >= 3 && (
        <>
          <Person x={1010} y={420} scale={0.55} color={MONA} hijab delay={0.1} />
          <Say x={1010} y={290} id="allah-ysallimik" text={<>الله يسلّمِ<span style={{ color: GOLD }}>ك</span>.</>} delay={0.5} width={230} accent />
        </>
      )}
      {items >= 1 && <Chip x={1330} y={200} color={CRIMSON}>to a man: يسلّمَك</Chip>}
      {items >= 2 && <Chip x={1330} y={250} color={DEEP} delay={0.2}>to a woman: يسلّمِك</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

/** The role-play: you and your teacher at the door, and the four moves of the conversation ticking off. */
export function Ea1TalkGraphic({ lines, interaction }: GraphicProps) {
  const moves = ['Greet, and answer the pair', 'Give your name: اسمي...', 'Ask theirs: اسمَك / اسمِك إيه؟', 'Say goodbye: مع السلامة'];
  return (
    <>
      <Building x={1200} w={300} />
      <Street />
      <Person x={1260} y={GROUND} scale={1.0} color={SAYED} />
      <Person x={1460} y={GROUND} scale={1.0} color={MONA} hijab delay={0.15} />
      <Person x={1060} y={GROUND} scale={1.05} color={ADAM} />
      <Chip x={1060} y={540} color={ADAM}>you</Chip>
      {lines >= 1 && <Say x={1260} y={560} id="d-salam" text="السلام عليكم!" align="right" delay={0.3} width={230} />}
      {lines >= 2 && (
        <div className="absolute flex flex-col gap-3" style={{ left: 790, top: 190, width: 400 }}>
          {moves.map((m, i) => (
            <motion.div key={m} className="flex items-center gap-3 rounded-[16px]" style={{ padding: '10px 14px', background: '#FFFDF8', boxShadow: '0 14px 28px -22px rgba(60,30,10,0.6)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, duration: 0.5, ease }}>
              <motion.span className="flex shrink-0 items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 30, height: 30, fontSize: 16 }}
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

/** Your first أهلاً goes out along three lines: a call home to Egypt, a friend, a shop; one reply comes back. */
export function Ea1MissionGraphic({ lines }: GraphicProps) {
  const spots = [
    { x: 880, y: 260, icon: 'phone', label: 'family in Egypt' },
    { x: 1380, y: 260, icon: 'chat', label: 'a friend' },
    { x: 1400, y: 600, icon: 'house', label: 'a shop' },
  ];
  return (
    <>
      <Person x={1130} y={720} scale={1.05} color={ADAM} />
      {lines >= 1 && spots.map((s, i) => (
        <React.Fragment key={s.icon}>
          <Svg><Draw d={`M 1130 470 L ${s.x} ${s.y}`} color={GOLD} width={3} dash="3 10" delay={0.2 + i * 0.3} dur={0.8} /></Svg>
          <Badge x={s.x} y={s.y} name={s.icon} size={96} color={i === 0 ? CRIMSON : TEAL} delay={0.6 + i * 0.3} />
          <Chip x={s.x} y={s.y + 58} delay={0.8 + i * 0.3}>{s.label}</Chip>
          <motion.div className="absolute" style={{ left: 1100, top: 440 }} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: s.x - 1130, y: s.y - 470, opacity: [0, 1, 0] }} transition={{ duration: 1.6, delay: 1 + i * 0.3, ease }}>
            <ArText size={30} color={DEEP}>أهلاً</ArText>
          </motion.div>
        </React.Fragment>
      ))}
      {lines >= 3 && <Say x={1420} y={530} id="ismak-eh" text="اسمَك إيه؟" align="right" delay={0.3} width={210} accent />}
    </>
  );
}

/** Mona's next question, and the long road it opens: where you come from. */
export function Ea1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Street />
      <Stairs />
      <Person x={1000} y={GROUND} scale={1.05} color={ADAM} />
      <Person x={1300} y={GROUND} scale={1.05} color={MONA} hijab flip />
      {lines >= 2 && <Say x={1300} y={560} id="inta-minen" text="إنت منين؟" align="right" delay={0.2} width={210} accent />}
      {lines >= 3 && (
        <>
          <Badge x={880} y={260} name="globe" size={100} color={TEAL} delay={0.2} />
          <Svg><Draw d="M 940 250 Q 1120 140 1300 260" color={GOLD} width={3} dash="3 10" delay={0.5} dur={1.2} /></Svg>
          <Chip x={1300} y={280} color={CRIMSON} delay={1.4}>Cairo says gamiil, the book jamiil</Chip>
        </>
      )}
    </>
  );
}
