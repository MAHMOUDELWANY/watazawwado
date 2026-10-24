import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CountUp, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Orb, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Label, Block } from './graphics';
import { Svg, Draw, Chip, Big, Ar, Meter, Icon, Badge, Person, DEEP } from './kit';

/* ---------- Iman: the camera goes down under the building of Islam to the six foundation stones. ---------- */

const STONES = [
  { ar: 'الله', icon: '' }, { ar: 'الملائكة', icon: 'light' }, { ar: 'الكتب', icon: 'book' },
  { ar: 'الرسل', icon: 'chain' }, { ar: 'اليوم الآخر', icon: 'sun' }, { ar: 'القدر', icon: 'pen' },
];

export function ImanGraphic({ lines, items, labels, tone }: GraphicProps) {
  const down = items > 0;
  const GROUND = 430;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={{ y: 0 }} animate={{ y: down ? -120 : 0 }} transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}>
          {/* the building of Islam, small, on the ground */}
          <Svg>
            <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
              <Block x={980} y={GROUND - 40} w={300} h={30} front={CRIMSON} top="#E2564A" side={DEEP} />
              {[1010, 1080, 1150, 1220].map((x) => <Block key={x} x={x} y={GROUND - 170} w={34} h={130} front="#E9DCC8" top="#FFF4DD" side="#C9B79D" />)}
              <polygon points={`970,${GROUND - 170} 1145,${GROUND - 240} 1320,${GROUND - 190}`} fill={GOLD} />
            </motion.g>
            {/* ground and earth */}
            <rect x={770} y={GROUND} width={780} height={440} rx={28} fill="url(#earth)" />
            <defs><linearGradient id="earth" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#D9C3A2" /><stop offset="1" stopColor="#8E6A47" /></linearGradient></defs>
            <line x1={770} x2={1550} y1={GROUND} y2={GROUND} stroke="#6E4E31" strokeWidth={3} />
          </Svg>
          <Label x={880} y={GROUND - 60} text="Islam: what you see" tone={tone} />
          {/* six stones under it, roots rising to the building */}
          {STONES.map((s, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 880 + col * 180, y = GROUND + 120 + row * 170;
            const on = i < items, cur = i === items - 1;
            return (
              <React.Fragment key={i}>
                {on && <Svg><Draw d={`M ${x + 70} ${y} C ${x + 70} ${y - 60}, ${1130} ${GROUND + 40}, ${1130} ${GROUND}`} color={GOLD} width={cur ? 3 : 2} glow={cur} dur={0.9} /></Svg>}
                <motion.div className="absolute flex flex-col items-center justify-center rounded-[18px] text-center" style={{ left: x, top: y, width: 140, height: 130, background: on ? (cur ? `linear-gradient(160deg, #FFE7B0, ${GOLD})` : '#F3E3C4') : 'rgba(246,241,232,0.25)', border: on ? 'none' : '2px dashed rgba(246,241,232,0.5)', boxShadow: cur ? `0 0 40px 10px ${GOLD}88` : '0 12px 24px -16px rgba(0,0,0,0.6)' }}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: down ? 1 : 0, y: 0, scale: cur ? 1.06 : 1 }} transition={{ duration: 0.6, delay: down ? 0.6 + (on ? 0 : i * 0.05) : 0, ease }}>
                  {on && (s.icon ? <Icon name={s.icon} size={34} color={DEEP} /> : <Ar size={34}>الله</Ar>)}
                  {on && <span className="mt-1 font-sans font-bold" style={{ fontSize: 16, color: INK_TEXT }}>{labels[i]?.split(',')[0]}</span>}
                  {on && s.icon && <Ar size={16}>{s.ar}</Ar>}
                </motion.div>
              </React.Fragment>
            );
          })}
        </motion.div>
      )}
      {down && <Label x={1160} y={774} text="Iman: what holds it up, unseen" tone={tone} strong color={DEEP} />}
      {items > 0 && (
        <div className="absolute flex items-baseline gap-2" style={{ left: 1420, top: 340 }}>
          <CountUp to={items} size={64} color={CRIMSON} /><span className="font-sans font-semibold" style={{ fontSize: 18, color: soft(tone) }}>of 6</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Three levels: rings of one deen, each inside the one before; "you are here?" ---------- */

const RINGS = [
  { r: 225, c: CRIMSON, t: 'Islam', s: 'what I do' },
  { r: 150, c: GOLD, t: 'Iman', s: 'what I hold true' },
  { r: 76, c: TEAL, t: 'Ihsan', s: 'as if I see Him' },
];

export function LevelsGraphic({ lines, items, interaction, tone }: GraphicProps) {
  const reduce = useReduce();
  const C = { x: 1000, y: 390 };
  return (
    <div className="pointer-events-none absolute inset-0">
      <Svg>
        {lines >= 1 && RINGS.map((g, i) => <Draw key={i} d={`M ${C.x - g.r} ${C.y} a ${g.r} ${g.r} 0 1 0 ${g.r * 2} 0 a ${g.r} ${g.r} 0 1 0 ${-g.r * 2} 0`} color={soft(tone)} width={1.5} dash="4 8" delay={i * 0.2} />)}
        {RINGS.map((g, i) => i < items && (
          <motion.circle key={`f${i}`} cx={C.x} cy={C.y} r={g.r} fill={g.c} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: i === items - 1 ? 0.95 : 0.8 }} style={{ transformOrigin: `${C.x}px ${C.y}px` }} transition={{ type: 'spring', bounce: 0.25, duration: 1 }} />
        ))}
      </Svg>
      {RINGS.map((g, i) => i < items && (
        <motion.div key={g.t} className="absolute" style={{ left: C.x + 250, top: C.y - 190 + i * 100 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3, ease }}>
          <span className="block h-[3px] w-14 rounded-full" style={{ background: g.c }} />
          <p className="m-0 mt-1 font-serif" style={{ fontSize: 34, lineHeight: 1, color: ink(tone) }}>{g.t}</p>
          <p className="m-0 font-sans font-semibold" style={{ fontSize: 17, color: soft(tone) }}>{g.s}</p>
        </motion.div>
      ))}
      {RINGS.map((g, i) => i < items && <motion.span key={`l${i}`} className="absolute -translate-x-1/2 font-sans font-bold" style={{ left: C.x, top: C.y - g.r + 14, fontSize: 16, color: '#fff' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{g.t}</motion.span>)}
      {/* where are you? a pin hovering over the map */}
      {interaction && (
        <motion.div className="absolute flex flex-col items-center" style={{ left: C.x - 140, top: C.y - 60 }} initial={{ y: -40, opacity: 0 }} animate={{ y: reduce ? 0 : [0, -12, 0], opacity: 1 }} transition={{ y: { duration: 2, repeat: Infinity }, opacity: { duration: 0.5 } }}>
          <span className="rounded-full font-sans font-bold" style={{ padding: '6px 14px', background: INK_TEXT, color: '#fff', fontSize: 16 }}>you?</span>
          <span style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `12px solid ${INK_TEXT}` }} />
        </motion.div>
      )}
    </div>
  );
}

/* ---------- The gap: you already know the list; more information does not lift you; three kinds of knowing. ---------- */

export function GapGraphic({ lines, items, tone }: GraphicProps) {
  const ticks = 11;
  const bars = [
    { v: 0.28, c: '#C9B79D', sub: 'you agree' },
    { v: 0.68, c: GOLD, sub: 'the pull to act grows' },
    { v: 1, c: TEAL, sub: 'not acting becomes rare' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {items === 0 && lines >= 1 && (
          <motion.div key="list" className="absolute" style={{ left: 780, top: 200 }} exit={{ opacity: 0, x: -40 }}>
            <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 14, letterSpacing: '0.16em', color: CRIMSON }}>What you already know</p>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              {['Shahadah', 'Salah', 'Zakah', 'Fasting', 'Hajj', 'Allah', 'Angels', 'Books', 'Messengers', 'Last Day', 'Qadar'].map((t, i) => (
                <motion.span key={t} className="flex items-center gap-2 font-sans font-semibold" style={{ fontSize: 18, color: ink(tone) }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.09 }}>
                  <Icon name="check" size={20} color={TEAL} width={3} /> {t}
                </motion.span>
              ))}
            </div>
            <div className="mt-4 flex items-baseline gap-2"><CountUp to={ticks} size={56} color={CRIMSON} /><span className="font-sans font-semibold" style={{ fontSize: 18, color: soft(tone) }}>of 11 · known</span></div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {items === 0 && lines >= 2 && (
          <motion.div key="books" className="absolute" style={{ left: 1170, top: 170, width: 320, height: 520 }} exit={{ opacity: 0 }}>
            {/* the level you want to reach, and a stack of books that never lifts you */}
            <div className="absolute left-0 right-0 top-[40px] border-t-[3px] border-dashed" style={{ borderColor: TEAL }} />
            <span className="absolute right-0 top-[4px] font-sans font-bold" style={{ fontSize: 16, color: TEAL }}>Ihsan</span>
            <div className="absolute bottom-0 left-[60px] flex flex-col-reverse items-center">
              {Array.from({ length: 7 }, (_, i) => (
                <motion.div key={i} className="mb-1 rounded-[6px]" style={{ width: 170 - (i % 3) * 14, height: 26, background: [CRIMSON, GOLD, '#B4552F', TEAL][i % 4] }} initial={{ y: -300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.7, delay: 0.2 + i * 0.18 }} />
              ))}
            </div>
            <motion.span className="absolute left-[60px] bottom-[210px] font-sans font-bold" style={{ fontSize: 16, color: soft(tone) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>more information</motion.span>
            <motion.div className="absolute left-[40px] bottom-[250px] flex items-center justify-center rounded-full font-sans font-bold" style={{ width: 210, height: 210, border: `4px solid ${CRIMSON}`, color: CRIMSON, fontSize: 22 }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2, type: 'spring', bounce: 0.4 }}>
              still short
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {items > 0 && bars.map((b, i) => i < items && (
        <Meter key={i} x={800} y={220 + i * 140} w={680} value={b.v} color={b.c} label={['Knowing', 'Certain knowledge', 'Seeing it'][i]} sub={b.sub} tone={tone} strong={i === items - 1} />
      ))}
      {items > 0 && <Label x={1140} y={650} text="what lifts you is the pull to act, not the length of the list" tone={tone} />}
    </div>
  );
}

/* ---------- From hearing to seeing: two sayings, one picture. ---------- */

export function HorizonGraphic({ lines, items, tone }: GraphicProps) {
  const merged = lines >= 3;
  const card = (side: 0 | 1) => {
    const t = side === 0 ? { k: 'The hadith of Jibril', en: 'as if you see Him', ar: 'كَأنَّك تَراه' } : { k: 'Hanzalah', en: 'as if we saw it with our own eyes', ar: 'كَأنَّا رَأيُ عَينٍ' };
    const x = merged ? 900 : side === 0 ? 760 : 1160;
    const y = merged ? 220 + side * 230 : 260;
    return (
      <motion.div key={side} className="absolute rounded-[26px]" style={{ width: 360, padding: '26px 28px', background: side === 0 ? 'rgba(229,169,60,0.95)' : 'rgba(15,163,184,0.92)', boxShadow: `0 0 60px 6px ${side === 0 ? GOLD : TEAL}44` }}
        initial={{ opacity: 0, y: 30, left: x, top: y }} animate={{ opacity: 1, y: 0, left: x, top: y }} transition={{ duration: 0.9, ease }}>
        <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.16em', color: '#3A1F08' }}>{t.k}</p>
        <p className="m-0 mt-2 font-serif" style={{ fontSize: 32, lineHeight: 1.1, color: '#1F1612' }}>{t.en}</p>
        {items > side && <motion.p lang="ar" dir="rtl" className="m-0 mt-3 font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 40, color: '#5A0F12' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease }}>{t.ar}</motion.p>}
      </motion.div>
    );
  };
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && card(0)}
      {lines >= 2 && card(1)}
      {merged && (
        <>
          <Svg><Draw d="M 1275 300 C 1345 360, 1345 480, 1275 540" color="#F6F1E8" width={3} glow /></Svg>
          <Big x={1360} y={370} w={200} tone={tone} size={38} align="left" delay={0.8}>one picture: <span style={{ color: GOLD }}>seeing</span></Big>
        </>
      )}
    </div>
  );
}

/* ---------- If only you knew: knowledge in the head, and the line that has to reach the heart. ---------- */

export function KnowGraphic({ lines, tone }: GraphicProps) {
  const H = { x: 1080, y: 290 };
  const R = { x: 1080, y: 560 };
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && [0, 1].map((i) => (
        <motion.div key={i} className="absolute rounded-[14px] font-serif" style={{ left: 800 + i * 40, top: 180 + i * 50, padding: '10px 18px', fontSize: 26, background: i ? CRIMSON : '#FFFDF8', color: i ? '#fff' : INK_TEXT, boxShadow: '0 16px 30px -18px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, scale: 1.6, rotate: -10 }} animate={{ opacity: lines >= 2 ? 0 : 1, scale: 1, rotate: i ? 3 : -4 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.7, delay: 0.3 + i * 0.7 }}>
          You will come to know.
        </motion.div>
      ))}
      {lines >= 2 && (
        <>
          <Person x={1080} y={760} scale={2.1} color="#5B4636" dim />
          <Badge x={H.x} y={H.y} name="head" glow size={90} color={DEEP} delay={0.2} />
          <Badge x={R.x} y={R.y} name="heart" size={90} color={lines >= 3 ? '#fff' : soft(tone)} bg={lines >= 3 ? CRIMSON : undefined} glow={lines >= 3} delay={0.4} />
          <Svg>
            <Draw d={`M ${H.x} ${H.y + 50} L ${H.x} ${lines >= 3 ? R.y - 50 : H.y + 140}`} color={GOLD} width={5} glow dur={lines >= 3 ? 1.2 : 0.8} delay={0.6} />
          </Svg>
          <Label x={H.x + 190} y={H.y - 14} text="they knew it" tone={tone} strong />
          {lines === 2 && <Label x={H.x + 220} y={H.y + 150} text="…but it stopped here" tone={tone} strong color={CRIMSON} />}
        </>
      )}
      {lines >= 3 && (
        <>
          <Label x={R.x + 230} y={R.y - 14} text="knowledge of certainty" tone={tone} strong color={CRIMSON} />
          <Svg><Draw d={`M ${R.x + 50} ${R.y + 20} C ${R.x + 160} ${R.y + 80}, ${R.x + 260} ${R.y + 80}, ${R.x + 330} ${R.y + 40}`} color={TEAL} width={4} delay={1.4} /></Svg>
          <Chip x={R.x + 360} y={R.y + 50} delay={2} color={TEAL}>what you do next</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- Then you will see it: the two steps again, and where seeing falls on a life. ---------- */

export function SeeGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Svg>
            <motion.rect x={780} y={430} width={700} height={64} rx={6} stroke={TEAL} strokeWidth={2} initial={{ pathLength: 0, fill: 'rgba(8,125,145,0)' }} animate={{ pathLength: 1, fill: 'rgba(8,125,145,0.85)' }} transition={{ duration: 1.1, ease }} />
            <motion.rect x={1130} y={250} width={350} height={180} rx={6} stroke={GOLD} strokeWidth={2} initial={{ pathLength: 0, fill: 'rgba(229,169,60,0)' }} animate={{ pathLength: 1, fill: 'rgba(229,169,60,0.92)' }} transition={{ duration: 1.1, delay: 0.4, ease }} />
          </Svg>
          <motion.div className="absolute" style={{ left: 810, top: 442 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <span className="font-serif" style={{ fontSize: 28, color: '#F6F1E8' }}>Knowing · </span><span className="font-sans font-bold" style={{ fontSize: 18, color: '#CFEFF3' }}>'ilm al-yaqeen</span>
          </motion.div>
          <motion.div className="absolute text-center" style={{ left: 1130, top: 300, width: 350 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
            <p className="m-0 font-serif" style={{ fontSize: 36, color: '#3A1F08' }}>Seeing</p>
            <p className="m-0 font-sans font-bold" style={{ fontSize: 18, color: '#5A2A08' }}>'ayn al-yaqeen</p>
          </motion.div>
        </>
      )}
      {lines >= 2 && (
        <>
          {/* a life, from birth to death */}
          <Svg><Draw d="M 790 640 L 1470 640" color="#F6F1E8" width={3} /></Svg>
          <Label x={790} y={660} text="birth" tone={tone} />
          <Label x={1470} y={660} text="death" tone={tone} strong />
          <motion.span className="absolute rounded-full" style={{ left: 1470 - 12, top: 640 - 12, width: 24, height: 24, background: '#8E8070' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
          <Label x={1470} y={590} text="everyone sees, here" tone={tone} />
          <motion.div className="absolute" style={{ left: 0, top: 640 }} initial={{ x: 1470, opacity: 0 }} animate={{ x: 1060, opacity: 1 }} transition={{ duration: reduce ? 0 : 2, delay: 1.6, ease }}>
            <Orb size={34} glow={1.6} />
          </motion.div>
          <motion.span className="absolute -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ left: 1060, top: 690, fontSize: 19, color: GOLD }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}>the believer works to see it before</motion.span>
        </>
      )}
    </div>
  );
}

/* ---------- What this course is for: the road through the three levels, station by station. ---------- */

const ROAD = 'M 780 700 C 900 700, 920 560, 1040 560 S 1200 420, 1300 420 S 1460 260, 1480 220';
const STOPS = [{ x: 860, y: 690 }, { x: 1040, y: 560 }, { x: 1250, y: 440 }, { x: 1470, y: 240 }];

export function InsideGraphic({ lines, items, labels, tone }: GraphicProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && <Svg><Draw d={ROAD} color={soft(tone)} width={3} dash="2 12" dur={1.6} /></Svg>}
      {lines >= 1 && (
        <>
          <Chip x={800} y={740} tone={tone}>You are here · Lesson 1</Chip>
        </>
      )}
      {lines >= 2 && (
        <motion.div className="absolute flex items-center gap-4 font-serif" style={{ left: 790, top: 150, fontSize: 40, color: ink(tone) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <span>what you know</span><span style={{ color: CRIMSON }}>→</span><span style={{ color: TEAL }}>what you see</span>
        </motion.div>
      )}
      {items > 0 && <Svg><Draw d={ROAD} color={GOLD} width={5} glow dur={1.2} /></Svg>}
      {STOPS.map((p, i) => i < items && (
        <React.Fragment key={i}>
          <motion.span className="absolute rounded-full" style={{ left: p.x - 14, top: p.y - 14, width: 28, height: 28, background: i === items - 1 ? CRIMSON : GOLD, boxShadow: `0 0 24px 6px ${GOLD}99` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} />
          <motion.div className="absolute" style={{ left: p.x + (i === 3 ? -330 : 26), top: p.y + (i === 3 ? 30 : -78), width: 300 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: i === items - 1 ? 1 : 0.6, y: 0 }} transition={{ duration: 0.5, ease }}>
            <p className="m-0 font-serif" style={{ fontSize: 26, lineHeight: 1.05, color: ink(tone) }}>{labels[i]?.split(':')[0]}</p>
            <p className="m-0 font-sans font-semibold" style={{ fontSize: 15, lineHeight: 1.3, color: soft(tone) }}>{labels[i]?.split(':').slice(1).join(':').trim()}</p>
          </motion.div>
        </React.Fragment>
      ))}
      {items > 0 && (
        <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: STOPS[Math.min(items, 4) - 1].x, y: STOPS[Math.min(items, 4) - 1].y }} transition={{ duration: 1, ease }}>
          <Orb size={30} />
        </motion.div>
      )}
    </div>
  );
}
