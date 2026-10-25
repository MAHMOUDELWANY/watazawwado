import React from 'react';
import { motion } from 'motion/react';
import { useCue } from '../sfx';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Orb, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Label } from './graphics';
import { Svg, Draw, Chip, Big, Ar, Meter, Icon, Badge, Person, Figure, Bubble, DEEP, SAND } from './kit';
import { QuoteCard, Notebook, Stamp, Stars, Thing } from './g-shared';

/* Adults Lesson 3: The Emptiness Fame Cannot Fill (brief: docs/curriculum/zad-essentials-adults/L03-the-emptiness-fame-
   cannot-fill.md). The recurring picture is a place in a person that things fall through, a buried signal (the fitrah)
   and a line that settles (13:28). Ikrimah is never drawn: the ship and a line of light. */

const PRIOR = ['knowing is not yet seeing.', 'the world did not make itself.'];
const CHASED = [{ n: 'coin', t: 'money' }, { n: 'house', t: 'a house' }, { n: 'car', t: 'a car' }, { n: 'phone', t: 'followers' }, { n: 'gift', t: 'the next thing' }];

/** The hollow: a person-shaped outline with a round space in the chest where things are tried and fall through. */
function Hollow({ x, y, scale = 1, fill = 0, glow = false, tone }: { x: number; y: number; scale?: number; fill?: number; glow?: boolean; tone: GraphicProps['tone'] }) {
  const s = scale;
  return (
    <div className="pointer-events-none absolute" style={{ left: x - 110 * s, top: y - 330 * s, width: 220 * s, height: 330 * s }}>
      <svg viewBox="0 0 220 330" width="100%" height="100%" className="overflow-visible">
        <circle cx={110} cy={52} r={40} fill="none" stroke={ink(tone)} strokeOpacity={0.45} strokeWidth={4} />
        <path d="M 30 330 C 30 200, 50 110, 110 106 C 170 110, 190 200, 190 330" fill="none" stroke={ink(tone)} strokeOpacity={0.45} strokeWidth={4} />
        <circle cx={110} cy={200} r={50} fill={glow ? GOLD : 'none'} fillOpacity={glow ? 0.85 : 0} stroke={glow ? GOLD : CRIMSON} strokeWidth={4} strokeDasharray={glow ? undefined : '6 8'} style={glow ? { filter: `drop-shadow(0 0 24px ${GOLD})` } : undefined} />
        {fill > 0 && <rect x={60} y={250 - 100 * fill} width={100} height={100 * fill} fill={TEAL} opacity={0.4} />}
      </svg>
    </div>
  );
}

/* ---------- Cover: everything people chase drops into the hollow and falls straight through; a light stays. ---------- */

export function A3CoverGraphic({ tone }: GraphicProps) {
  const reduce = useReduce();
  useCue('chime', 1, 5.6);
  return (
    <div className="pointer-events-none absolute inset-0">
      <Hollow x={1150} y={760} scale={1.5} tone={tone} />
      {CHASED.map((c, i) => (
        <motion.div key={c.t} className="absolute" style={{ left: 1150, top: 0 }} initial={{ y: 120, opacity: 0 }} animate={reduce ? { y: 460, opacity: 0.6 } : { y: [120, 460, 900], opacity: [0, 1, 0] }} transition={{ duration: 2.2, delay: 0.8 + i * 0.7, ease: 'easeIn' }}>
          <Badge x={0} y={0} name={c.n} size={60} color={DEEP} />
        </motion.div>
      ))}
      <motion.div className="absolute" style={{ left: 1150, top: 460 }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 5, duration: 1.4, ease }}><Orb size={60} glow={2.2} /></motion.div>
      <motion.p className="absolute m-0 font-serif italic" style={{ left: 110, width: 700, top: 712, fontSize: 30, color: GOLD }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5.6, duration: 0.8 }}>
        They had everything. Why wasn't it enough?
      </motion.p>
    </div>
  );
}

/* ---------- Recall: last week's line and habit; then the honest split between the head and the heart. ---------- */

export function A3RecallGraphic({ lines, tone }: GraphicProps) {
  useCue('pop', lines >= 3, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.18 : 1, scale: lines >= 3 ? 0.9 : 1 }} transition={{ duration: 0.8 }} style={{ transformOrigin: '1140px 430px' }}>
        <Notebook lines={lines} mode="read" lesson={3} prior={PRIOR} ticks={2} tone={tone} />
      </motion.div>
      {lines >= 3 && (
        <>
          <Badge x={980} y={420} name="head" size={120} color={DEEP} glow delay={0.2} />
          <Chip x={980} y={510} color={TEAL}>certain on paper</Chip>
          <Badge x={1330} y={420} name="heart" size={120} color={soft(tone)} delay={0.5} />
          <Chip x={1330} y={510} tone={tone}>closer?</Chip>
          <Svg><Draw d="M 1050 420 L 1260 420" color={GOLD} width={3} dash="5 10" delay={0.8} /></Svg>
        </>
      )}
    </div>
  );
}

/* ---------- The question you brought: the head says yes, the heart is far; we go to those who had everything. ---------- */

export function A3QuestionGraphic({ lines, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('brick', lines >= 3, 0.2);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.3 : 1 }}>
          <Badge x={900} y={300} name="head" size={100} color={DEEP} glow />
          <Chip x={900} y={372} color={TEAL}>✓ a Maker</Chip>
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.3 : 1 }}>
          <Person x={1240} y={560} scale={0.9} color={TEAL} />
          <Bubble x={1240} y={350} thought text="I believe it… and I don't feel Him." tone={tone} width={260} delay={0.4} />
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          {['coin', 'house', 'car', 'gift', 'phone', 'sun'].map((n, i) => (
            <motion.div key={n} className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 1000 + (i % 3) * 110, y: -60, opacity: 0 }} animate={{ x: 1000 + (i % 3) * 110, y: 700 - Math.floor(i / 3) * 90, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.8, delay: 0.2 + i * 0.15 }}>
              <Badge x={0} y={0} name={n} size={78} color={DEEP} />
            </motion.div>
          ))}
          <Label x={1110} y={760} text="people who had everything" tone={tone} strong />
        </>
      )}
      {lines >= 4 && <Meter x={1180} y={180} w={320} value={0.05} color={GOLD} label="full?" tone={tone} strong />}
    </div>
  );
}

/* ---------- Brady: three rings stack, the quote types in, and at the top of the climb a question is waiting. ---------- */

export function A3BradyGraphic({ lines, tone }: GraphicProps) {
  useCue('brick', lines >= 1, 0.2);
  useCue('pen', lines >= 2, 0.3);
  useCue('whoosh', lines >= 3, 0.2);
  useCue('pop', lines >= 4, 0.3);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 2 ? 0 : 1 }}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="absolute flex items-center justify-center rounded-full font-sans font-bold" style={{ left: 880 + i * 120, top: 300, width: 96, height: 96, border: `10px solid ${GOLD}`, background: '#FFF4D6', color: DEEP, fontSize: 22, boxShadow: `0 0 30px ${GOLD}88` }}
              initial={{ y: -200, opacity: 0, rotate: -40 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.9, delay: 0.2 + i * 0.3 }}>{i + 1}</motion.span>
          ))}
          <Chip x={1350} y={330} strong>age 27</Chip>
        </motion.div>
      )}
      {lines >= 2 && <QuoteCard x={790} y={180} w={700} quote="I think, God, it's got to be more than this. I mean this can't be what it's all cracked up to be." name="Tom Brady, after three Super Bowl wins" source="60 Minutes, CBS, 2005" on tone={tone} size={29} dim={lines >= 3} />}
      {lines >= 3 && (
        <>
          <Svg>
            <path d="M 790 800 L 1090 600 L 1180 660 L 1330 540 L 1520 800 Z" fill={SAND} opacity={0.8} />
            <Draw d="M 830 790 L 1090 608 L 1180 664 L 1330 548" color={TEAL} width={3} dash="4 8" />
          </Svg>
          <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 830, y: 790 }} animate={{ x: 1330, y: 548 }} transition={{ duration: reduce ? 0 : 2.2, ease }}>
            <Orb size={22} />
          </motion.div>
          <motion.span className="absolute font-serif" style={{ left: 1395, top: 450, fontSize: 70, color: CRIMSON }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.2, type: 'spring' }}>?</motion.span>
          <Label x={1330} y={562} text="the top" tone={tone} strong />
        </>
      )}
      {lines >= 4 && <Chip x={980} y={680} color={TEAL}>honest about a hunger</Chip>}
    </div>
  );
}

/* ---------- Carrey: one more film, one more hit; the quote; two different worlds point into the same hollow. ---------- */

export function A3CarreyGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.2);
  useCue('pen', lines >= 1, 0.8);
  useCue('thud', lines >= 3, 0.6);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && <QuoteCard x={790} y={170} w={700} quote="I think everybody should get rich and famous and everything they ever dreamed of so they can see that that's not the answer." name="Jim Carrey" source="The Ottawa Citizen, 16 December 2005" on tone={tone} size={27} dim={lines >= 2} />}
      {lines >= 2 && (
        <>
          <Thing x={880} y={560} name="sun" label="sport · the rings" color={GOLD} delay={0.2} />
          <Thing x={880} y={700} name="light" label="the screen · the hits" color={CRIMSON} delay={0.4} />
          <Hollow x={1300} y={800} scale={0.95} tone={tone} />
          <Svg>
            <Draw d="M 920 560 C 1050 560, 1150 600, 1240 610" color={GOLD} width={3} delay={0.6} />
            <Draw d="M 920 700 C 1050 700, 1150 640, 1240 630" color={CRIMSON} width={3} delay={0.8} />
          </Svg>
        </>
      )}
      {lines >= 3 && !interaction && <Label x={1120} y={440} text="the place it was meant to fill" tone={tone} strong color={CRIMSON} />}
      {lines >= 4 && <Chip x={1060} y={760} tone={tone}>quoted for their honesty</Chip>}
      {interaction && ['a grade', 'a job', 'a person', 'a number'].map((t, i) => <Chip key={t} x={1000 + i * 130} y={440} delay={0.2 + i * 0.2} color={TEAL}>{t}</Chip>)}
    </div>
  );
}

/* ---------- Every hunger points somewhere: each longing gets its answer; one arrow leaves the world. ---------- */

const PAIRS = [{ a: 'Thirst', n: 'bowl' }, { a: 'Hunger', n: 'bowl' }, { a: 'Loneliness', n: 'heart' }, { a: 'This longing', n: '' }];

export function A3HungerGraphic({ lines, items, interaction, tone }: GraphicProps) {
  useCue('pen', lines >= 1, 0.2);
  useCue('pop', items, 0.3);
  useCue('reveal', items >= 4, 0.8);
  const reduce = useReduce();
  const ANS = ['water', 'food', 'people'];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && <Person x={860} y={780} scale={1.1} color={TEAL} />}
      {lines >= 2 && <Label x={860} y={792} text="born with longings" tone={tone} strong />}
      {PAIRS.map((p, i) => {
        if (i >= items) return null;
        const y = 250 + i * 110;
        const last = i === 3;
        return (
          <React.Fragment key={i}>
            <Svg>
              <Draw d={`M 900 ${600} C 940 ${600}, 960 ${y + 18}, 1000 ${y + 18}`} color={soft(tone)} width={2} dur={0.6} />
              <Draw d={last ? `M 1170 ${y + 18} C 1300 ${y + 18}, 1380 ${y - 60}, 1480 ${y - 150}` : `M 1170 ${y + 18} L 1250 ${y + 18}`} color={last ? GOLD : TEAL} width={last ? 5 : 3} glow={last} dur={last ? 1.4 : 0.6} delay={0.3} />
            </Svg>
            <motion.span className="absolute rounded-full font-sans font-bold" style={{ left: 1000, top: y, padding: '6px 14px', fontSize: 18, background: last ? GOLD : '#FFFDF8', color: INK_TEXT, boxShadow: '0 10px 20px -12px rgba(0,0,0,0.4)' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>{p.a}</motion.span>
            {!last && (
              <motion.div className="absolute flex items-center gap-3" style={{ left: 1260, top: y }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}>
                <Icon name={i === 2 ? 'heart' : 'bowl'} size={36} color={[TEAL, DEEP, CRIMSON][i]} />
                <span className="font-serif" style={{ fontSize: 26, color: ink(tone) }}>{ANS[i]}</span>
              </motion.div>
            )}
            {last && <motion.span className="absolute font-serif" style={{ left: 1470, top: 190, fontSize: 64, color: GOLD }} initial={{ opacity: 0 }} animate={{ opacity: reduce ? 1 : [0, 1, 0.6, 1] }} transition={{ delay: 1.6, duration: 2 }}>?</motion.span>}
          </React.Fragment>
        );
      })}
      {items >= 4 && <Label x={1360} y={640} text="nothing in this world answers it" tone={tone} strong color={GOLD} />}
      {interaction && <Chip x={1360} y={700} strong>made to know Him</Chip>}
    </div>
  );
}

/* ---------- Fitrah: a light at the core leans toward the truth; layers wrap round it and it still shows through. ---------- */

export function A3FitrahGraphic({ lines, tone }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('thud', lines >= 4, 0.6);
  const reduce = useReduce();
  const C = { x: 1140, y: 610 };
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Person x={C.x} y={800} scale={1.9} color="#E9DCC8" />
          <motion.div className="absolute" style={{ left: C.x, top: C.y }} initial={{ scale: 0 }} animate={{ scale: reduce ? 1 : [0, 1.3, 1] }} transition={{ duration: 1.2 }}><Orb size={54} glow={1.8} /></motion.div>
          <Label x={C.x} y={C.y + 40} text="fitrah: the way you were made" tone={tone} strong />
        </>
      )}
      {lines >= 2 && (
        <>
          <motion.div className="absolute" style={{ left: 1330, top: 240 }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}><Orb size={30} glow={1.4} /></motion.div>
          <Svg><Draw d={`M ${C.x + 20} ${C.y - 20} C 1230 400, 1290 300, 1320 255`} color={GOLD} width={3} glow dur={1.4} delay={0.4} /></Svg>
          <Label x={1400} y={228} text="the truth" tone={tone} />
          <Chip x={1380} y={360} color={TEAL} delay={1.2}>love of the truth</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={880} y={300} tone={tone}>“more than this”</Chip>
          <Chip x={880} y={380} tone={tone} delay={0.3}>“not the answer”</Chip>
          <Svg><Draw d={`M 960 320 C 1040 360, 1080 430, ${C.x - 30} ${C.y - 10}`} color={CRIMSON} width={2} dash="5 8" delay={0.5} /></Svg>
          <Label x={880} y={430} text="the fitrah, asking" tone={tone} strong color={CRIMSON} />
        </>
      )}
      {lines >= 4 && (
        <>
          {[70, 100, 130].map((r, i) => (
            <motion.span key={r} className="absolute rounded-full" style={{ left: C.x - r, top: C.y - r, width: r * 2, height: r * 2, border: `${10 - i * 2}px solid rgba(91,70,54,${0.35 - i * 0.07})` }} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + i * 0.25, duration: 0.6, ease }} />
          ))}
          <Chip x={C.x} y={C.y + 150} strong>buried, never deleted</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- Born knowing: the start is the light; parents and cultures add layers; today a feed adds them too. ---------- */

export function A3BornGraphic({ lines, tone }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.3);
  useCue('brick', lines >= 4, 0.2);
  const LAYERS = ['parents', 'a culture', 'a feed that never stops'];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Svg><path d="M 1020 700 C 1060 760, 1240 760, 1280 700" fill="none" stroke={ink(tone)} strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" /></Svg>
          <motion.div className="absolute" style={{ left: 1150, top: 680 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}><Orb size={40} glow={1.8} /></motion.div>
          <Label x={1150} y={760} text="born on the fitrah" tone={tone} strong />
          {['a Jew', 'a Christian', 'a polytheist'].map((t, i) => <Chip key={t} x={920} y={220 + i * 52} delay={0.4 + i * 0.2} tone={tone}>parents make him {t}</Chip>)}
          <Chip x={1360} y={220} color={TEAL} delay={1.2}>Muslim: already the start</Chip>
        </>
      )}
      {lines >= 2 && <Svg><Draw d="M 1160 660 C 1180 500, 1300 330, 1360 262" color={TEAL} width={3} dash="4 8" /></Svg>}
      {lines >= 3 && <Chip x={920} y={420} color={DEEP}>+ Ar-Rum 30:30</Chip>}
      {lines >= 4 && LAYERS.map((t, i) => (
        <motion.div key={t} className="absolute rounded-[12px] text-center font-sans font-bold" style={{ left: 1150 - (140 + i * 30), top: 640 - i * 56, width: 280 + i * 60, padding: '10px 0', fontSize: 17, background: i === 2 ? '#2B1C14' : SAND, color: i === 2 ? '#fff' : INK_TEXT, opacity: 0.92 }}
          initial={{ y: -120, opacity: 0 }} animate={{ y: 0, opacity: 0.92 }} transition={{ type: 'spring', bounce: 0.3, delay: 0.2 + i * 0.3 }}>
          {i === 2 && <span className="me-2 inline-block align-middle"><Icon name="phone" size={18} color="#fff" /></span>}{t}
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- What covers it: a clear tone, then the next thing and the next, until it can't be heard. ---------- */

const NOISE = [{ n: 'bell', t: 'the next notification' }, { n: 'sun', t: 'the next goal' }, { n: 'phone', t: 'the next show' }, { n: 'gift', t: 'the next purchase' }, { n: 'mail' }, { n: 'chat' }, { n: 'bell' }];

function Wave({ y, amp = 26, opacity = 1, color = GOLD }: { y: number; amp?: number; opacity?: number; color?: string }) {
  const d = Array.from({ length: 13 }, (_, i) => `${i ? 'L' : 'M'} ${790 + i * 60} ${y + (i % 2 ? -amp : amp)}`).join(' ');
  return <motion.path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${color})` }} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity }} transition={{ pathLength: { duration: 1.4 }, opacity: { duration: 0.8 } }} />;
}

export function A3NoiseGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('chime', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.2);
  useCue('poof', lines >= 3, 0.3);
  const covered = lines >= 2;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Svg><Wave y={460} opacity={lines >= 3 ? 0.08 : covered ? 0.35 : 1} /></Svg>
          <Label x={lines >= 3 ? 980 : 1150} y={lines >= 2 ? 560 : 520} text={lines >= 3 ? 'still there, unheard' : 'the fitrah'} tone={tone} strong color={GOLD} />
        </>
      )}
      {covered && NOISE.map((c, i) => (
        <motion.div key={i} className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 830 + i * 100, y: 100, opacity: 0 }} animate={{ x: 830 + i * 100, y: lines >= 4 && i > 3 ? 900 : 430 + (i % 2) * 40, opacity: lines >= 4 && i > 3 ? 0 : 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.8, delay: 0.1 + i * 0.12 }}>
          <Badge x={0} y={0} name={c.n} size={70} color={DEEP} />
          {c.t && <span className="absolute left-1/2 top-[44px] -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ fontSize: 13, color: soft(tone) }}>{c.t}</span>}
        </motion.div>
      ))}
      {lines >= 3 && (
        <>
          <Person x={1450} y={780} scale={0.8} color={TEAL} />
          <Bubble x={1450} y={600} align="right" thought text="…what was I asking for?" tone={tone} width={220} delay={0.4} />
        </>
      )}
      {lines >= 4 && <Chip x={1100} y={230} color={TEAL}>ran out of next things → heard it</Chip>}
      {interaction && (
        <div className="absolute" style={{ left: 820, top: 640 }}>
          <Meter x={0} y={0} w={420} value={0.02} color={TEAL} label="10 minutes, no input" sub="this year?" tone={tone} strong />
        </div>
      )}
    </div>
  );
}

/* ---------- 29:65: a storm strips the deck of every other voice; a single line goes straight up. Then the shore. ---------- */

function Sea({ calm = false }: { calm?: boolean }) {
  const reduce = useReduce();
  return (
    <>
      {[0, 1, 2].map((k) => (
        <motion.path key={k} d={`M 760 ${640 + k * 40} C 860 ${600 + k * 40}, 960 ${680 + k * 40}, 1060 ${640 + k * 40} S 1260 ${600 + k * 40}, 1360 ${640 + k * 40} S 1500 ${680 + k * 40}, 1560 ${640 + k * 40}`}
          fill="none" stroke={k ? 'rgba(15,163,184,0.5)' : TEAL} strokeWidth={4} initial={false}
          animate={reduce ? { x: 0 } : { x: calm ? [0, -20, 0] : [0, -60, 0], y: calm ? 0 : [0, -18, 0] }} transition={{ duration: calm ? 6 : 1.6, repeat: Infinity, ease: 'easeInOut', delay: k * 0.2 }} />
      ))}
    </>
  );
}

function Ship({ x, y, rock = 0 }: { x: number; y: number; rock?: number }) {
  const reduce = useReduce();
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - 120, top: y - 140, width: 240, height: 160 }} animate={reduce ? { rotate: 0 } : { rotate: [-rock, rock, -rock] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 240 160" width="240" height="160" className="overflow-visible">
        <path d="M 10 110 L 230 110 L 200 150 L 40 150 Z" fill="#5B3A26" />
        <path d="M 120 110 L 120 10" stroke="#3A2618" strokeWidth={6} />
        <path d="M 124 16 L 200 100 L 124 100 Z" fill="#F3E3C4" />
      </svg>
    </motion.div>
  );
}

export function A3SeaGraphic({ lines, tone }: GraphicProps) {
  useCue('impact', lines >= 1, 0.4);
  useCue('whoosh', lines >= 2, 0.2);
  useCue('reveal', lines >= 3, 0.3);
  useCue('pop', lines >= 4, 0.3);
  const shore = lines >= 4;
  return (
    <div className="pointer-events-none absolute inset-0">
      <Svg><Sea calm={shore} /></Svg>
      {lines >= 1 && !shore && (
        <Svg><motion.path d="M 1300 160 L 1260 260 L 1300 260 L 1250 380" fill="none" stroke="#FFF4D6" strokeWidth={5} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 1, 0, 1] }} transition={{ duration: 0.8, delay: 0.3 }} /></Svg>
      )}
      {lines >= 1 && <Ship x={shore ? 900 : 1080} y={650} rock={shore ? 1 : 8} />}
      {lines >= 1 && ['coin', 'house', 'gift', 'phone'].map((n, i) => (
        <motion.div key={n} className="absolute" style={{ left: 0, top: 0 }} initial={false}
          animate={{ x: lines >= 2 && !shore ? 1500 + i * 30 : (shore ? 830 : 1000) + i * 55, y: lines >= 2 && !shore ? 300 + i * 60 : (shore ? 560 : 590), opacity: lines >= 2 && !shore ? 0 : 1, rotate: lines >= 2 && !shore ? 90 : 0 }} transition={{ duration: 1.2, delay: i * 0.1, ease }}>
          <Badge x={0} y={0} name={n} size={46} color={DEEP} />
        </motion.div>
      ))}
      {lines >= 2 && !shore && (
        <>
          <Svg><Draw d="M 1080 520 L 1080 160" color={GOLD} width={5} glow dur={1.2} delay={0.8} /></Svg>
          <Chip x={1080} y={150} color={GOLD} delay={1.6}>Allah alone</Chip>
        </>
      )}
      {lines >= 3 && !shore && <Label x={1340} y={430} text="nobody taught them this" tone={tone} strong color="#FBE9C8" />}
      {shore && (
        <>
          <Svg><path d="M 760 640 C 820 600, 900 600, 960 640 L 760 720 Z" fill="#C9A77E" /><path d="M 760 600 L 790 520 L 820 600 Z" fill="#6E8B4A" /></Svg>
          <Svg><Draw d="M 900 520 L 900 300" color={GOLD} width={3} opacity={0.25} /></Svg>
          <Label x={1200} y={380} text="the shore, and the noise comes back" tone={tone} strong />
        </>
      )}
    </div>
  );
}

/* ---------- Ikrimah: a point flees by sea, the storm, the vow; then sea and land become one conclusion. ---------- */

export function A3IkrimahGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('whoosh', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.4);
  useCue('impact', lines >= 3, 0.3);
  useCue('reveal', interaction, 0.4);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      <Svg><Sea calm={interaction} /></Svg>
      {lines >= 1 && (
        <>
          <Svg><path d="M 760 470 L 760 600 L 900 600 C 920 560, 880 520, 900 470 Z" fill="#C9A77E" /></Svg>
          <Label x={830} y={430} text="Makkah" tone={tone} strong />
          <Svg><Draw d="M 840 520 C 920 560, 980 600, 1060 620" color={GOLD} width={3} dash="4 10" /></Svg>
        </>
      )}
      {lines >= 2 && <Ship x={1120} y={650} rock={lines >= 3 ? 9 : 2} />}
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 840, y: 520 }} animate={{ x: lines >= 2 ? 1110 : 960, y: lines >= 2 ? 560 : 570 }} transition={{ duration: reduce ? 0 : 1.6, ease }}><Orb size={20} /></motion.div>
      )}
      {lines >= 3 && !interaction && (
        <>
          <Svg><motion.path d="M 1360 160 L 1320 260 L 1360 260 L 1310 380" fill="none" stroke="#FFF4D6" strokeWidth={5} initial={{ pathLength: 0 }} animate={{ pathLength: 1, opacity: [1, 0.2, 1] }} transition={{ duration: 0.8 }} /></Svg>
          <Bubble x={1250} y={470} text="Be sincere. Your gods can do nothing out here." tone={tone} width={270} delay={0.4} />
        </>
      )}
      {interaction && (
        <div className="absolute flex items-center gap-4" style={{ left: 800, top: 180 }}>
          {['at sea: only Allah saves', 'on land: only Allah saves'].map((t, i) => (
            <motion.div key={t} className="rounded-[16px] font-serif" style={{ padding: '14px 18px', fontSize: 22, background: i ? TEAL : GOLD, color: i ? '#fff' : '#3A1F08' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.5 }}>{t}</motion.div>
          )).flatMap((el, i) => (i ? [<span key="eq" className="font-serif" style={{ fontSize: 40, color: GOLD }}>=</span>, el] : [el]))}
        </div>
      )}
      {interaction && <Chip x={1150} y={300} strong>he came back, and became a Muslim</Chip>}
    </div>
  );
}

/* ---------- "I don't feel it": snacks spoil the appetite; noise spoils the heart's; a heartbeat you can't feel. ---------- */

export function A3FeelGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.3);
  useCue('chime', lines >= 3, 0.4);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.35 : 1 }}>
          <Meter x={800} y={200} w={420} value={lines >= 1 ? 0.08 : 1} color={GOLD} label="Hunger at dinner" sub="after snacking all day" tone={tone} />
          {['bowl', 'gift', 'coin'].map((n, i) => <Thing key={i} x={850 + i * 70} y={300} name={n} size={46} color={DEEP} delay={0.3 + i * 0.15} />)}
          <Badge x={1350} y={260} name="bowl" size={84} color={TEAL} />
          <Label x={1350} y={312} text="still needs the meal" tone={tone} strong />
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: lines >= 3 ? 0.35 : 1 }}>
          <Meter x={800} y={400} w={420} value={0.06} color={CRIMSON} label="Felt hunger for Allah" sub="after noise all day" tone={tone} strong />
          {['bell', 'phone', 'chat'].map((n, i) => <Thing key={i} x={850 + i * 70} y={500} name={n} size={46} color={DEEP} delay={0.3 + i * 0.15} />)}
          <motion.div className="absolute rounded-full" style={{ left: 1290, top: 400, width: 120, height: 120, border: `3px dashed ${CRIMSON}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
          <Label x={1350} y={530} text="the need is still there" tone={tone} strong color={CRIMSON} />
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          <Svg>
            <motion.path d="M 790 680 L 960 680 L 990 640 L 1020 720 L 1050 600 L 1080 690 L 1110 680 L 1290 680 L 1320 640 L 1350 720 L 1380 600 L 1410 690 L 1440 680 L 1520 680" fill="none" stroke={CRIMSON} strokeWidth={4} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 2.4, ease: 'linear' }} />
          </Svg>
          <Label x={1150} y={736} text="you can't feel it now, and it hasn't stopped" tone={tone} strong />
        </>
      )}
      {lines >= 4 && <Chip x={1100} y={346} strong>what am I filling the place with?</Chip>}
      {interaction && <Chip x={1150} y={772} color={TEAL}>notice the reach this week</Chip>}
    </div>
  );
}

/* ---------- 20:124: walls close in on a person surrounded by comforts; the word appears once in the Quran. ---------- */

export function A3DankGraphic({ lines, tone }: GraphicProps) {
  useCue('thud', lines >= 1, 0.6);
  useCue('pop', lines >= 2, 0.3);
  useCue('strike', lines >= 4, 0.4);
  const reduce = useReduce();
  const tight = lines >= 1 ? (lines >= 2 ? 0.55 : 0.75) : 1;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <motion.div className="absolute rounded-[20px]" style={{ left: 1150 - 340, top: 220, width: 680, height: 500, border: `6px solid ${DEEP}`, background: 'rgba(139,26,30,0.05)' }} initial={{ scaleX: 1 }} animate={{ scaleX: tight }} transition={{ duration: reduce ? 0 : 1.6, ease }} />
          <Person x={1150} y={700} scale={1} color={TEAL} />
          <motion.div className="absolute -translate-x-1/2 rounded-[14px] text-center" style={{ left: 1150, top: 150, padding: '6px 18px', background: '#FFFDF8', boxShadow: '0 16px 30px -18px rgba(0,0,0,0.5)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Ar size={34}>ضَنكًا</Ar> <span className="font-sans font-bold" style={{ fontSize: 14, color: CRIMSON }}>· once in the Quran</span>
          </motion.div>
        </>
      )}
      {lines >= 2 && (
        <>
          {['car', 'house', 'shirt', 'bowl'].map((n, i) => <Thing key={n} x={1010 + (i % 2) * 280} y={330 + Math.floor(i / 2) * 150} name={n} size={54} color={GOLD} delay={0.2 + i * 0.15} />)}
          <Svg><motion.path d="M 1100 450 L 1120 420 L 1140 470 L 1160 410 L 1180 460 L 1200 430" fill="none" stroke={CRIMSON} strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.8 }} /></Svg>
          {lines < 3 && <Label x={1150} y={740} text="comfortable outside, restless inside" tone={tone} strong />}
        </>
      )}
      {lines === 3 && (
        <>
          <Chip x={900} y={740} tone={tone}>“more than this”</Chip>
          <Chip x={1400} y={740} tone={tone} delay={0.3}>“not the answer”</Chip>
        </>
      )}
      {lines >= 4 && (
        <>
          <Chip x={880} y={760} tone={tone}>poverty ✕</Chip>
          <Chip x={1010} y={760} tone={tone} delay={0.2}>failure ✕</Chip>
          <Chip x={1290} y={760} strong delay={0.5}>turning away from His remembrance</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- Rich, inside: the scoreboard turns over; two people, two kinds of rich. ---------- */

export function A3GhinaGraphic({ lines, tone }: GraphicProps) {
  useCue('whoosh', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.3);
  useCue('sparkle', lines >= 3, 0.4);
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute rounded-[18px] text-center" style={{ left: 900, top: 170, width: 500, padding: '14px 0', background: INK_TEXT, color: '#FFF8EC', perspective: 800 }} initial={{ rotateX: 0 }} animate={{ rotateX: reduce ? 0 : [0, 90, 0] }} transition={{ duration: 1.2 }}>
          <span className="font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.18em', color: GOLD }}>richness is measured</span>
          <p className="m-0 font-serif" style={{ fontSize: 34 }}>inside, not in the account</p>
        </motion.div>
      )}
      {lines >= 2 && (
        <>
          <Person x={960} y={760} scale={1.1} color="#5B4636" />
          {[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="absolute rounded-full" style={{ left: 840, top: 740 - i * 16, width: 70, height: 14, background: GOLD, border: '2px solid #B8862B' }} initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, delay: 0.2 + i * 0.1 }} />)}
          <motion.span className="absolute rounded-full" style={{ left: 960 - 22, top: 760 - 132, width: 44, height: 44, border: `3px dashed ${CRIMSON}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
          <Label x={960} y={772} text="many possessions, a hungry soul" tone={tone} />
          <Person x={1360} y={760} scale={1.1} color={TEAL} delay={0.3} />
          <motion.span className="absolute rounded-full" style={{ left: 1260, top: 742, width: 50, height: 14, background: GOLD, border: '2px solid #B8862B' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
          <motion.span className="absolute rounded-full" style={{ left: 1360 - 22, top: 760 - 132, width: 44, height: 44, background: GOLD }} initial={{ opacity: 0 }} animate={{ opacity: 1, boxShadow: lines >= 3 ? `0 0 40px 14px ${GOLD}` : `0 0 10px ${GOLD}` }} transition={{ delay: 0.8 }} />
          <Label x={1360} y={772} text="little, and content" tone={tone} strong />
        </>
      )}
      {lines >= 3 && <Chip x={1360} y={470} strong>content with what it was made for</Chip>}
    </div>
  );
}

/* ---------- 13:28 (the wow): a restless line; the remembrance of Allah comes down; the line settles into a horizon. ---------- */

const N = 25;
const restless = (k: number) => Array.from({ length: N }, (_, i) => `${i ? 'L' : 'M'} ${790 + i * 30} ${500 + (k === 0 ? (i % 2 ? -1 : 1) * (40 + ((i * 37) % 50)) : k === 1 ? (i % 2 ? -1 : 1) * 14 : 0)}`).join(' ');

export function A3RestGraphic({ lines, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('riser', lines >= 2, 0.2);
  useCue('reveal', lines >= 3, 0.6);
  useCue('chime', lines >= 4, 0.4);
  const reduce = useReduce();
  const k = lines >= 3 ? 2 : lines >= 2 ? 1 : 0;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 3 && <motion.div className="absolute" style={{ left: 780, top: 500, width: 740, height: 300, background: 'linear-gradient(180deg, rgba(15,163,184,0.35), transparent)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.6 }} />}
      {lines >= 1 && (
        <Svg>
          <motion.path initial={false} animate={{ d: restless(k) }} transition={{ duration: reduce ? 0 : k === 2 ? 2.4 : 1.4, ease }} fill="none" stroke={k === 2 ? GOLD : CRIMSON} strokeWidth={5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${k === 2 ? 14 : 4}px ${k === 2 ? GOLD : CRIMSON})` }} />
        </Svg>
      )}
      {lines >= 1 && k === 0 && ['bell', 'phone', 'coin', 'chat'].map((n, i) => (
        <motion.div key={n} className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 840 + i * 190, y: 340 }} animate={{ x: 840 + i * 190, y: reduce ? 340 : [330, 350, 330] }} transition={{ duration: 0.4, repeat: Infinity }}>
          <Badge x={0} y={0} name={n} size={52} color={DEEP} />
        </motion.div>
      ))}
      {lines >= 1 && k === 0 && <Label x={1150} y={620} text="the hunger: restless" tone={tone} strong color={CRIMSON} />}
      {lines >= 2 && (
        <motion.div className="absolute -translate-x-1/2 text-center" style={{ left: 1150, top: 0 }} initial={{ y: 80, opacity: 0, filter: 'blur(10px)' }} animate={{ y: 200, opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1.6, ease }}>
          <span lang="ar" dir="rtl" className="block font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 64, backgroundImage: `linear-gradient(100deg, ${CRIMSON}, ${GOLD} 55%, ${TEAL})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>بِذِكْرِ ٱللَّهِ</span>
          <span className="block font-serif italic" style={{ fontSize: 24, color: ink(tone) }}>in the remembrance of Allah</span>
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          <motion.div className="absolute" style={{ left: 1150, top: 470 }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.8, duration: 1 }}><Orb size={44} glow={2} /></motion.div>
          <motion.div className="absolute" style={{ left: 1150, top: 560, transform: 'scaleY(-1)' }} initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 2.2 }}><Orb size={44} glow={0.6} /></motion.div>
          <Label x={1150} y={640} text="tatma'innu: settled, still" tone={tone} strong color={GOLD} />
        </>
      )}
      {lines >= 4 && Array.from({ length: 9 }, (_, i) => (
        <motion.span key={i} className="absolute flex items-center justify-center rounded-full" style={{ left: 820 + i * 80, top: 720, width: 40, height: 40, background: 'rgba(255,253,248,0.9)' }} initial={{ opacity: 0, y: reduce ? 0 : -10, rotate: reduce ? 0 : 20 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.8 }}>
          <Icon name="heart" size={22} color={i % 2 ? TEAL : CRIMSON} />
        </motion.span>
      ))}
      {lines >= 4 && <Label x={1150} y={776} text="the hearts: every heart" tone={tone} strong />}
    </div>
  );
}

/* ---------- Now: 1 a.m. The feed scrolls over a face-up phone; put it down, and the quiet room has a light in it. ---------- */

export function A3NightGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 2, 0.3);
  useCue('page', lines >= 3, 0.2);
  useCue('sparkle', lines >= 4, 0.5);
  const reduce = useReduce();
  const down = lines >= 4;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 820, top: 170 }} initial={{ opacity: 0 }} animate={{ opacity: lines >= 2 ? 0.4 : 1 }}>
          <span className="flex items-center gap-3 font-sans font-bold" style={{ fontSize: 18, color: GOLD }}><Icon name="light" size={28} color={GOLD} /> Then: the storm, and he listened</span>
        </motion.div>
      )}
      {lines >= 2 && (
        <>
          <Svg><rect x={860} y={640} width={560} height={40} rx={14} fill="#3A2A22" /><rect x={880} y={610} width={140} height={40} rx={16} fill="#E9DCC8" opacity={0.7} /></Svg>
          <Figure x={1080} y={660} scale={0.95} pose="chair" arms={down ? 'side' : 'phone'} look={down ? -18 : 14} color={TEAL} />
          {!down && (
            <div className="absolute overflow-hidden rounded-[16px]" style={{ left: 1260, top: 230, width: 200, height: 330, background: '#0E1418', boxShadow: `0 0 50px 6px rgba(120,190,255,0.25)` }}>
              <motion.div initial={{ y: 0 }} animate={{ y: reduce ? 0 : -600 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
                {Array.from({ length: 14 }, (_, i) => <div key={i} className="mx-3 mt-3 rounded-[10px]" style={{ height: 70, background: ['#28465A', '#3B2A4A', '#2D4A3A'][i % 3] }} />)}
              </motion.div>
            </div>
          )}
          {!down && <Label x={1360} y={572} text="one more, then another" tone={tone} />}
        </>
      )}
      {lines >= 3 && !down && <Meter x={820} y={240} w={360} value={0.12} color={GOLD} label="Enjoying it?" tone={tone} />}
      {down && (
        <>
          <motion.div className="absolute inset-0" style={{ background: 'rgba(8,10,14,0.35)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} />
          <motion.div className="absolute" style={{ left: 1300, top: 300 }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 1.4 }}><Orb size={40} glow={1.8} /></motion.div>
          <Label x={1300} y={340} text="the quiet: where the fitrah speaks" tone={tone} strong color={GOLD} />
        </>
      )}
      {interaction && <Chip x={1150} y={760} color={TEAL}>two minutes, phone down</Chip>}
    </div>
  );
}

/* ---------- Two witnesses: the horizons and the heart, two lines that meet in certainty. ---------- */

export function A3TwoGraphic({ lines, items, tone }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pop', lines >= 2, 0.3);
  useCue('reveal', items >= 2, 0.5);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <motion.div className="absolute rounded-full" style={{ left: 820, top: 200, width: 260, height: 260, background: 'radial-gradient(circle, #1B2C3A, #0E1A22)', overflow: 'hidden' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Stars count={24} box={{ x: 10, y: 10, w: 240, h: 240 }} />
          </motion.div>
          <Label x={950} y={476} text="the world outside · Lesson 2" tone={tone} strong />
        </>
      )}
      {lines >= 2 && (
        <>
          <Person x={1350} y={470} scale={1.1} color="#E9DCC8" />
          <motion.div className="absolute" style={{ left: 1350, top: 375 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}><Orb size={36} /></motion.div>
          <Label x={1350} y={482} text="the heart inside · Lesson 3" tone={tone} strong />
        </>
      )}
      {items >= 1 && <Chip x={950} y={530} color={TEAL}>on the horizons</Chip>}
      {items >= 2 && (
        <>
          <Chip x={1350} y={530} color={TEAL}>within themselves</Chip>
          <Svg>
            <Draw d="M 950 580 C 980 680, 1080 720, 1150 740" color={GOLD} width={4} glow />
            <Draw d="M 1350 580 C 1320 680, 1220 720, 1150 740" color={GOLD} width={4} glow />
          </Svg>
          <motion.div className="absolute" style={{ left: 1150, top: 750 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: 'spring' }}><Orb size={44} glow={2} /></motion.div>
          <Label x={1150} y={790} text="yaqeen" tone={tone} strong color={DEEP} />
        </>
      )}
    </div>
  );
}

/* ---------- Cases ---------- */

export function A3CaseGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('whoosh', lines >= 2, 0.2);
  useCue('chime', interaction, 0.3);
  const night = lines >= 2;
  return (
    <div className="pointer-events-none absolute inset-0">
      {night && <motion.div className="absolute rounded-[30px]" style={{ left: 790, top: 190, width: 730, height: 620, background: 'linear-gradient(180deg, #1B2430, #2A1E26)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />}
      {lines >= 1 && (
        <>
          <Person x={1150} y={760} scale={1.3} color={TEAL} hijab />
          <Thing x={900} y={300} name="sun" label="promotion" color={GOLD} delay={0.3} />
          <Thing x={1150} y={250} name="house" label="her own flat" color={GOLD} delay={0.5} />
          <Thing x={1400} y={300} name="heart" label="engaged" color={CRIMSON} delay={0.7} />
        </>
      )}
      {night && (
        <>
          <motion.span className="absolute rounded-full" style={{ left: 1150 - 26, top: 760 - 150, width: 52, height: 52, border: `3px dashed ${interaction ? GOLD : '#F3B98A'}`, background: interaction ? GOLD : 'transparent', boxShadow: interaction ? `0 0 40px 10px ${GOLD}` : 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
          <Bubble x={1150} y={460} thought text="I have no right to feel this." tone="dark" width={260} delay={0.6} />
          <Label x={900} y={210} text="Sunday night" tone="dark" strong color="#F3B98A" />
        </>
      )}
      {lines >= 3 && !interaction && <Chip x={1400} y={640} tone="dark">told no one</Chip>}
      {interaction && <Chip x={1150} y={770} color={GOLD}>thank Him for them · feed the heart</Chip>}
    </div>
  );
}

export function A3Case2Graphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('strike', lines >= 2, 0.4);
  useCue('chime', interaction, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Figure x={1020} y={760} scale={1.2} pose="kneel" arms="thigh" color={CRIMSON} />
          <Bubble x={1040} y={480} text="I pray and I feel nothing. Maybe it's all fake." tone={tone} width={300} delay={0.4} />
        </>
      )}
      {lines >= 2 && (
        <div className="absolute" style={{ left: 1250, top: 230 }}>
          <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.16em', color: soft(tone) }}>Isha this week</p>
          <div className="mt-2 flex gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <motion.span key={i} className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] font-sans font-bold" style={{ fontSize: 14, background: i < 2 ? TEAL : 'transparent', border: `2px solid ${i < 2 ? TEAL : i < 5 ? GOLD : CRIMSON}`, color: i < 2 ? '#fff' : i < 5 ? GOLD : CRIMSON }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>{i < 2 ? '✓' : i < 5 ? 'h' : '✕'}</motion.span>
            ))}
          </div>
          <p className="m-0 mt-1 font-sans font-semibold" style={{ fontSize: 13, color: soft(tone) }}>✓ masjid · h at home · ✕ missed</p>
        </div>
      )}
      {lines >= 3 && <Chip x={1420} y={330} strong>feeling = proof?</Chip>}
      {interaction && (
        <div className="absolute flex flex-col gap-3" style={{ left: 1210, top: 500 }}>
          {['keep the prayer', 'cut the noise around it', 'an hour and an hour'].map((t, i) => <motion.span key={t} className="rounded-full font-sans font-bold" style={{ padding: '8px 16px', fontSize: 16, background: [TEAL, GOLD, DEEP][i], color: '#fff', width: 'fit-content' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.25 }}>{t}</motion.span>)}
        </div>
      )}
    </div>
  );
}

export function A3Case3Graphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('chime', interaction, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Person x={1360} y={790} scale={1.1} color="#3E5C76" flip />
          <Bubble x={1360} y={560} align="right" text="Religion is a comfort blanket for people who can't face that life means nothing." tone={tone} width={290} delay={0.4} />
          <Person x={940} y={790} scale={1.1} color={TEAL} delay={0.2} />
          <Svg><motion.path d="M 1100 330 C 1130 310, 1160 350, 1190 330 S 1250 350, 1280 330 L 1280 400 C 1250 420, 1220 380, 1190 400 S 1130 380, 1100 400 Z" fill="#E9B9A0" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }} /></Svg>
        </>
      )}
      {lines >= 2 && <Chip x={1190} y={260} tone={tone}>“I'm sparing you”</Chip>}
      {lines >= 3 && <Bubble x={840} y={580} thought text="Calm, not defensive." tone={tone} width={180} delay={0.3} />}
      {interaction && (
        <div className="absolute flex items-center gap-3" style={{ left: 820, top: 180 }}>
          <span className="rounded-[14px] font-serif" style={{ padding: '12px 16px', fontSize: 21, background: '#FFFDF8', boxShadow: '0 16px 30px -18px rgba(0,0,0,0.5)', color: INK_TEXT }}>thirst</span>
          <span className="font-serif" style={{ fontSize: 30, color: GOLD }}>→</span>
          <span className="rounded-[14px] font-serif" style={{ padding: '12px 16px', fontSize: 21, background: TEAL, color: '#fff' }}>water is real</span>
        </div>
      )}
    </div>
  );
}

export function A3Case4Graphic({ lines, interaction, tone }: GraphicProps) {
  useCue('pop', lines >= 1, 0.3);
  useCue('thud', lines >= 2, 0.5);
  useCue('chime', interaction, 0.4);
  const reduce = useReduce();
  const ORBIT = [{ n: 'chat', t: 'podcast' }, { n: 'bell', t: 'music' }, { n: 'phone', t: 'videos' }];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && <Person x={1150} y={720} scale={1.3} color={CRIMSON} />}
      {lines >= 1 && !interaction && (
        <motion.div className="absolute" style={{ left: 1150, top: 520, width: 0, height: 0 }} animate={reduce ? { y: 0 } : { y: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
          {ORBIT.map((o, i) => {
            const a = -Math.PI / 2 + (i - 1) * 1.2;
            return <Thing key={o.t} x={Math.cos(a) * 230} y={Math.sin(a) * 150} name={o.n} label={o.t} color={DEEP} delay={0.2 + i * 0.2} />;
          })}
        </motion.div>
      )}
      {lines >= 2 && (
        <div className="absolute flex items-baseline gap-3" style={{ left: 820, top: 190 }}>
          <span className="font-serif" style={{ fontSize: 80, lineHeight: 1, color: CRIMSON }}>0</span>
          <span className="font-sans font-semibold" style={{ fontSize: 20, color: soft(tone) }}>silent minutes, for months</span>
        </div>
      )}
      {lines >= 3 && <Chip x={1400} y={210} tone={tone}>“not a spiritual person”</Chip>}
      {interaction && (
        <>
          <Svg><Wave y={360} amp={18} /></Svg>
          <Meter x={880} y={760} w={540} value={1} color={TEAL} label="10 quiet minutes" sub="the fitrah gets a word in" tone={tone} strong />
        </>
      )}
    </div>
  );
}

/* ---------- Ahd and next time ---------- */

export function A3NotebookGraphic({ lines, tone }: GraphicProps) {
  return <Notebook lines={lines} mode="write" lesson={3} prior={PRIOR} tone={tone} />;
}

export function A3NextGraphic({ lines, tone }: GraphicProps) {
  useCue('sparkle', lines >= 1, 0.3);
  useCue('pen', lines >= 2, 0.3);
  useCue('reveal', lines >= 3, 0.4);
  return (
    <div className="pointer-events-none absolute inset-0">
      <Stars count={40} />
      {lines >= 1 && (
        <>
          <Badge x={900} y={330} name="head" size={96} color={DEEP} glow />
          <Chip x={900} y={400} color={TEAL}>there is a Maker</Chip>
          <Badge x={1400} y={330} name="heart" size={96} color={CRIMSON} glow delay={0.3} />
          <Chip x={1400} y={400} color={TEAL} delay={0.3}>made for Him</Chip>
        </>
      )}
      {lines >= 2 && (
        <>
          <Svg>
            <Draw d="M 950 360 C 1040 420, 1100 450, 1150 470" color={GOLD} width={3} dash="4 10" />
            <Draw d="M 1350 360 C 1260 420, 1200 450, 1150 470" color={GOLD} width={3} dash="4 10" />
          </Svg>
          <Big x={1070} y={420} w={160} tone={tone} size={84}>?</Big>
          <Label x={1150} y={540} text="who is He?" tone={tone} strong />
        </>
      )}
      {lines >= 3 && (
        <motion.div className="absolute -translate-x-1/2 text-center" style={{ left: 1150, top: 610 }} initial={{ opacity: 0, filter: 'blur(12px)', scale: 1.2 }} animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }} transition={{ duration: 1.4, ease }}>
          <span lang="ar" dir="rtl" className="block font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 72, backgroundImage: `linear-gradient(100deg, ${CRIMSON}, ${GOLD} 55%, ${TEAL})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>لا إله إلا الله</span>
          <span className="block font-sans font-bold" style={{ fontSize: 17, color: GOLD }}>a sentence that costs something</span>
        </motion.div>
      )}
    </div>
  );
}
