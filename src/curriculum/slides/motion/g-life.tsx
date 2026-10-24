import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CountUp, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Orb, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Label } from './graphics';
import { Svg, Draw, Chip, Big, Ar, Icon, Badge, Bubble, Person, CLAY, DEEP } from './kit';

/* ---------- Hanzalah: certainty across a day; two men, one worry, walking to the source. ---------- */

const DAY = 'M 780 300 C 860 300, 900 300, 960 330 S 1100 560, 1200 590 S 1380 610, 1470 600';

export function LaneGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Svg>
            <line x1={780} x2={1480} y1={680} y2={680} stroke={soft(tone)} strokeWidth={1.5} />
            <Draw d={DAY} color={GOLD} width={4} glow dur={2} />
          </Svg>
          <span className="absolute font-sans font-bold uppercase" style={{ left: 780, top: 220, fontSize: 13, letterSpacing: '0.16em', color: GOLD }}>certainty</span>
          {[{ x: 830, n: 'door', t: 'the gathering' }, { x: 1150, n: 'house', t: 'home, family' }, { x: 1420, n: 'coin', t: 'work' }].map((s, i) => (
            <React.Fragment key={s.t}>
              <Badge x={s.x} y={730} name={s.n} size={56} delay={0.5 + i * 0.5} />
              <Label x={s.x} y={768} text={s.t} tone={tone} />
            </React.Fragment>
          ))}
        </>
      )}
      {lines === 2 && <Bubble x={1200} y={570} text={<>"Hanzalah has become a hypocrite."</>} accent tone={tone} width={300} />}
      {lines >= 3 && (
        <>
          <Svg><Draw d={DAY} color="#F6F1E8" width={2} dash="6 8" dur={1.6} delay={0.2} /></Svg>
          <Label x={1300} y={520} text={'Abu Bakr: "we find the same"'} tone={tone} strong />
          {/* two lights walking together, back to the source */}
          {[0, 1].map((i) => (
            <motion.div key={i} className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 1200 + i * 30, y: 590 }} animate={{ x: 830 + i * 30, y: 300 }} transition={{ duration: reduce ? 0 : 3, delay: 1 + i * 0.15, ease: 'easeInOut' }}>
              <Orb size={24} />
            </motion.div>
          ))}
          <motion.span className="absolute font-sans font-bold" style={{ left: 760, top: 250, fontSize: 18, color: GOLD }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6 }}>back to the Prophet ﷺ</motion.span>
        </>
      )}
    </div>
  );
}

/* ---------- Friday, then Monday: a promise on a sticky note disappears under the week. ---------- */

const NOTES = [
  { n: 'mail', t: '14 unread emails' }, { n: 'clock', t: 'Meeting moved to 10:30' }, { n: 'chat', t: 'Can you look at this?' },
  { n: 'bell', t: 'Deadline today' }, { n: 'phone', t: '3 missed calls' }, { n: 'chat', t: 'Quick question…' },
  { n: 'mail', t: 'Re: Re: Re: invoice' }, { n: 'bell', t: 'Reminder: report' },
];

export function MondayGraphic({ lines, interaction, tone }: GraphicProps) {
  const mon = lines >= 2;
  const shown = lines >= 3 ? NOTES.length : mon ? 4 : 0;
  const back = lines >= 4;
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* the week strip */}
      <div className="absolute flex gap-3" style={{ left: 780, top: 160 }}>
        {['Fri', 'Sat', 'Sun', 'Mon'].map((d, i) => {
          const on = (i === 0 && !mon) || (i === 3 && mon && !back) || (back && i === 0);
          return (
            <motion.div key={d} className="flex h-[70px] w-[120px] flex-col items-center justify-center rounded-[16px] font-sans font-bold" style={{ background: on ? CRIMSON : '#FFFDF8', color: on ? '#fff' : INK_TEXT, boxShadow: '0 12px 24px -16px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, scale: on ? 1.06 : 1 }} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <span style={{ fontSize: 20 }}>{d}</span>
              {i === 3 && mon && <span style={{ fontSize: 13, opacity: 0.8 }}>10:00</span>}
            </motion.div>
          );
        })}
      </div>
      {/* the person at a desk */}
      <Person x={880} y={760} scale={1.2} sitting color="#3E5C76" />
      <div className="absolute rounded-[8px]" style={{ left: 930, top: 650, width: 200, height: 110, background: '#2A2A2A', boxShadow: '0 18px 30px -18px rgba(0,0,0,0.7)' }} />
      <div className="absolute" style={{ left: 900, top: 760, width: 260, height: 10, borderRadius: 5, background: '#C9B79D' }} />
      {/* the promise */}
      {lines >= 1 && (
        <motion.div className="absolute rounded-[6px]" style={{ left: 1180, top: 290, width: 280, padding: '18px 20px', background: '#FFE7A8', boxShadow: back ? `0 0 50px 12px ${GOLD}aa` : '0 20px 40px -20px rgba(0,0,0,0.5)', zIndex: back ? 30 : 1 }}
          initial={{ opacity: 0, rotate: -12, scale: 0.7 }} animate={{ opacity: 1, rotate: -3, scale: back ? 1.08 : 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8 }}>
          <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 12, letterSpacing: '0.16em', color: DEEP }}>After Friday's khutbah</p>
          <p className="m-0 mt-2 font-serif italic" style={{ fontSize: 24, lineHeight: 1.2, color: INK_TEXT }}>"This week I will pray Fajr on time, every day."</p>
        </motion.div>
      )}
      {/* small things, one after another, burying it */}
      <AnimatePresence>
        {!back && NOTES.slice(0, shown).map((n, i) => (
          <motion.div key={i} className="absolute flex items-center gap-3 rounded-[14px] font-sans font-semibold" style={{ left: 1150 + (i % 3) * 14, top: 270 + i * 34, width: 330, padding: '12px 16px', background: '#FFFDF8', fontSize: 17, color: INK_TEXT, boxShadow: '0 14px 28px -16px rgba(0,0,0,0.55)', zIndex: 10 + i }}
            initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 260, transition: { duration: 0.5, delay: i * 0.04 } }} transition={{ type: 'spring', bounce: 0.25, duration: 0.6, delay: (i % 4) * 0.35 }}>
            <Icon name={n.n} size={22} color={CRIMSON} /> {n.t}
          </motion.div>
        ))}
      </AnimatePresence>
      {lines >= 3 && !back && (
        <div className="absolute flex items-baseline gap-2" style={{ left: 1180, top: 600 }}><CountUp to={NOTES.length} size={48} color={CRIMSON} /><span className="font-sans font-semibold" style={{ fontSize: 17, color: soft(tone) }}>small things · nothing dramatic</span></div>
      )}
      {back && (
        <>
          <Svg><Draw d="M 1480 620 C 1560 500, 1540 330, 1470 300" color={GOLD} width={4} glow /></Svg>
          <Chip x={1330} y={640} strong delay={0.6}>↺ back to the source</Chip>
        </>
      )}
    </div>
  );
}

/* ---------- Busy until the grave: the race for "more", the list that never closes, the stop on the road. ---------- */

const RACE = ['money', 'followers', 'titles', 'a bigger house', 'the car', 'likes', 'salary', 'grades'];

export function GravesGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (lines < 1 || reduce) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 700);
    return () => window.clearInterval(t);
  }, [lines, reduce]);
  const bars = [0, 1, 2, 3].map((i) => ({ label: RACE[(tick + i * 2) % RACE.length], h: 120 + ((tick * (i + 2) * 37) % 180) }));
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ y: lines >= 3 ? -60 : 0, scale: lines >= 3 ? 0.85 : 1 }} style={{ transformOrigin: '1120px 300px' }} transition={{ duration: 0.8, ease }}>
          <div className="absolute flex items-end gap-6" style={{ left: 820, top: 160, height: 330 }}>
            {bars.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <motion.div className="w-[110px] rounded-t-[12px]" style={{ background: [CRIMSON, GOLD, CLAY, TEAL][i] }} animate={{ height: b.h }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                <AnimatePresence mode="wait"><motion.span key={b.label} className="whitespace-nowrap font-sans font-bold" style={{ fontSize: 16, color: ink(tone) }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{b.label}</motion.span></AnimatePresence>
              </div>
            ))}
          </div>
          <Label x={1080} y={530} text="competing for more: anything at all" tone={tone} strong />
        </motion.div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute flex items-baseline gap-3" style={{ left: 1360, top: 200 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="font-serif" style={{ fontSize: 90, lineHeight: 1, color: CRIMSON }}>∞</span>
          <span className="w-[120px] font-sans font-semibold" style={{ fontSize: 16, color: soft(tone) }}>the list never closes</span>
        </motion.div>
      )}
      {lines >= 3 && (
        <>
          {/* the road of a life; the grave is a stop on it, and the road goes on */}
          <Svg>
            <Draw d="M 790 700 L 1260 700" color={ink(tone)} width={4} dur={1} />
            <Draw d="M 1300 700 L 1490 700" color={GOLD} width={4} dash="3 12" delay={1.4} dur={1} />
          </Svg>
          <motion.div className="absolute flex flex-col items-center" style={{ left: 1250, top: 596 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <span className="mb-1 whitespace-nowrap font-sans font-bold" style={{ fontSize: 17, color: ink(tone) }}>the grave: a visit</span>
            <div className="h-[78px] w-[56px] rounded-t-[28px]" style={{ background: '#8E8070' }} />
          </motion.div>
          <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 790, y: 700 }} animate={{ x: reduce ? 1490 : [790, 1250, 1250, 1490], y: 700 }} transition={{ duration: 4, times: [0, 0.4, 0.6, 1], ease: 'easeInOut' }}>
            <Orb size={26} />
          </motion.div>
          <motion.span className="absolute font-sans font-bold" style={{ left: 1390, top: 650, fontSize: 17, color: GOLD }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>the road goes on</motion.span>
        </>
      )}
    </div>
  );
}

/* ---------- "My wealth, my wealth": everything you own sorts into three places; only one goes ahead with you. ---------- */

const OWN = [
  { n: 'bowl', bin: 0 }, { n: 'coin', bin: 2 }, { n: 'shirt', bin: 1 }, { n: 'car', bin: 1 },
  { n: 'gift', bin: 2 }, { n: 'bowl', bin: 0 }, { n: 'phone', bin: 1 }, { n: 'coin', bin: 0 },
];
const BINS = [
  { x: 860, t: 'ate and used up' }, { x: 1080, t: 'wore and wore out' }, { x: 1300, t: 'gave, and sent ahead' },
];

export function CountGraphic({ lines, interaction, tone }: GraphicProps) {
  const sorted = lines >= 2;
  const ahead = lines >= 3;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && !sorted && (
        <>
          {OWN.map((o, i) => (
            <motion.div key={i} className="absolute" initial={{ opacity: 0, y: -200 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay: i * 0.12 }} style={{ left: 980 + (i % 4) * 90, top: 420 + Math.floor(i / 4) * 90 }}>
              <Badge x={0} y={0} name={o.n} size={80} />
            </motion.div>
          ))}
          {['my wealth', 'my wealth', 'mine', 'mine'].map((t, i) => (
            <motion.span key={i} className="absolute font-serif italic" style={{ left: 820 + i * 160, top: 260 + (i % 2) * 50, fontSize: 30 - i * 3, color: CRIMSON }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5] }} transition={{ delay: 1 + i * 0.3, duration: 1.4 }}>"{t}"</motion.span>
          ))}
        </>
      )}
      {sorted && (
        <>
          {BINS.map((b, i) => (
            <motion.div key={b.t} className="absolute flex flex-col items-center" style={{ left: b.x - 90, top: 470, width: 180 }} initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: ahead && i < 2 ? 0.3 : 1, y: 0, x: ahead && i === 2 ? 150 : 0, scale: ahead && i === 2 ? 1.1 : 1 }} transition={{ duration: 0.8, delay: ahead ? 0.3 : i * 0.15, ease }}>
              <div className="relative h-[150px] w-[180px] rounded-b-[30px] rounded-t-[8px]" style={{ background: i === 2 ? `linear-gradient(180deg, ${GOLD}, #B47A1E)` : '#D9CBB4', boxShadow: i === 2 && ahead ? `0 0 50px 12px ${GOLD}99` : '0 20px 30px -20px rgba(0,0,0,0.5)' }}>
                {OWN.map((o, k) => o.bin === i && (
                  <motion.div key={k} className="absolute" style={{ left: 30 + (k % 3) * 50, top: 30 + (k % 2) * 46 }} initial={{ y: -260, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.7, delay: 0.4 + k * 0.12 }}>
                    <Icon name={o.n} size={34} color={i === 2 ? '#fff' : INK_TEXT} />
                  </motion.div>
                ))}
              </div>
              <span className="mt-3 text-center font-sans font-bold" style={{ fontSize: 17, color: ink(tone) }}>{b.t}</span>
            </motion.div>
          ))}
        </>
      )}
      {ahead && (
        <>
          <Svg><Draw d="M 1540 540 L 1580 540" color={GOLD} width={4} delay={1} /></Svg>
          <Big x={790} y={230} w={700} tone={tone} size={46} align="left" delay={0.8}>Only one of them <span style={{ color: CRIMSON }}>travels with you.</span></Big>
        </>
      )}
      {interaction && <Label x={1160} y={180} text="what will still be yours?" tone={tone} strong color={CRIMSON} />}
    </div>
  );
}

/* ---------- Case 1, Omar at lunch: he knows it in his head; the table, every day. ---------- */

export function CaseOmarGraphic({ lines, interaction, tone }: GraphicProps) {
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Person x={920} y={720} scale={1.25} sitting color={CRIMSON} glow delay={0.2} />
          <Label x={920} y={740} text="Omar" tone={tone} strong />
          {lines === 1 && <Bubble x={930} y={520} thought text={<>Backbiting is haram. <span style={{ color: CRIMSON }}>Al-Hujurat 49:12.</span></>} tone={tone} width={300} delay={0.5} />}
        </>
      )}
      {lines >= 2 && (
        <>
          <div className="absolute rounded-[14px]" style={{ left: 860, top: 690, width: 620, height: 26, background: '#C9B79D' }} />
        </>
      )}
      {lines >= 2 && (
        <>
          <Person x={1110} y={720} scale={1.15} sitting color="#3E5C76" delay={0.2} />
          <Person x={1270} y={720} scale={1.15} sitting color="#6B7B3A" delay={0.35} />
          <Person x={1420} y={720} scale={1.15} sitting color="#7A4A6B" delay={0.5} />
          {!interaction && (
            <>
              <Bubble x={1120} y={560} text="Did you hear what he did?" tone={tone} delay={0.8} width={220} />
              <Bubble x={1440} y={470} text="Honestly, she always…" tone={tone} delay={1.4} width={210} align="right" />
              <Bubble x={920} y={420} text="…yeah, and also…" accent tone={tone} delay={2.2} width={190} />
            </>
          )}
        </>
      )}
      {lines >= 3 && (
        <>
          <div className="absolute flex gap-2" style={{ left: 860, top: 180 }}>
            {['Mon', 'Tue', 'Wed', 'Thu'].map((d, i) => (
              <motion.span key={d} className="rounded-full font-sans font-bold" style={{ padding: '6px 14px', background: '#FFFDF8', fontSize: 16, color: INK_TEXT }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.3 }}>{d}</motion.span>
            ))}
          </div>
          <motion.span className="absolute font-serif" style={{ left: 1260, top: 150, fontSize: 64, color: CRIMSON }} animate={{ rotate: reduce ? 0 : 360 }} transition={{ duration: 3, repeat: reduce ? 0 : Infinity, ease: 'linear' }}>↻</motion.span>
          <Label x={1080} y={240} text="same table, same talk" tone={tone} strong />
        </>
      )}
      {interaction && (
        <>
          <Badge x={1180} y={360} name="head" size={70} glow />
          <Badge x={1180} y={520} name="heart" size={70} />
          <Svg><Draw d="M 1180 400 L 1180 450" color={GOLD} width={5} /><path d="M 1166 456 L 1194 470 M 1194 456 L 1166 470" stroke={CRIMSON} strokeWidth={4} /></Svg>
        </>
      )}
    </div>
  );
}

/* ---------- Case 2, Layla after Umrah: the feeling rises and fades; the prayers go on underneath. ---------- */

const FEEL = 'M 800 600 C 860 600, 900 260, 960 250 S 1080 380, 1180 470 S 1380 560, 1480 570';

export function CaseLaylaGraphic({ lines, tone }: GraphicProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Person x={820} y={770} scale={1.2} hijab color={TEAL} delay={0.2} />
          <Svg><Draw d={FEEL.split(' S ')[0]} color={GOLD} width={5} glow dur={1.2} delay={0.4} /></Svg>
          <Chip x={960} y={200} strong delay={1}>Umrah</Chip>
          <span className="absolute font-sans font-bold uppercase" style={{ left: 1300, top: 200, fontSize: 13, letterSpacing: '0.16em', color: soft(tone) }}>how close she feels</span>
        </>
      )}
      {lines >= 2 && (
        <>
          <Svg><Draw d={FEEL} color={GOLD} width={5} dur={2} /></Svg>
          <Label x={1300} y={600} text="3 weeks later" tone={tone} />
          <Bubble x={1060} y={600} thought text="Was I faking it?" tone={tone} delay={1.6} width={200} />
        </>
      )}
      {lines >= 3 && (
        <>
          {/* the prayers keep going underneath the feeling */}
          <div className="absolute flex gap-[10px]" style={{ left: 900, top: 680 }}>
            {Array.from({ length: 21 }, (_, i) => (
              <motion.span key={i} className="block h-[18px] w-[18px] rounded-full" style={{ background: TEAL }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} />
            ))}
          </div>
          <Label x={1170} y={710} text="she still prays, every day" tone={tone} strong color={TEAL} />
        </>
      )}
    </div>
  );
}

/* ---------- Case 3, the colleague's question: what you do, why you believe, who it is for. ---------- */

export function CaseColleagueGraphic({ lines, interaction, tone }: GraphicProps) {
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          <Badge x={1440} y={640} name="door" size={90} />
          <Label x={1440} y={700} text="prayer room" tone={tone} />
          <motion.div className="absolute" initial={{ x: 0 }} animate={{ x: reduce ? 300 : [0, 300] }} transition={{ duration: 2.4, ease: 'easeInOut' }} style={{ left: 0, top: 0 }}>
            <Person x={1060} y={760} scale={1.1} color={CRIMSON} />
          </motion.div>
          <Chip x={1440} y={420} delay={1}>again, at 1:15</Chip>
        </>
      )}
      {lines >= 2 && (
        <>
          <Person x={860} y={760} scale={1.15} color="#3E5C76" flip delay={0.2} />
          <Bubble x={860} y={540} text={<>Honest question: do you actually believe it, or is it just habit?</>} tone={tone} width={320} delay={0.6} />
        </>
      )}
      {lines >= 3 && !interaction && (
        <motion.div className="absolute flex gap-2" style={{ left: 800, top: 230 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {['curious', 'not mocking', 'really asking'].map((t, i) => <Chip key={t} x={70 + i * 150} y={0} delay={0.2 + i * 0.25} color={i === 1 ? TEAL : undefined} tone={tone}>{t}</Chip>)}
        </motion.div>
      )}
      {interaction && (
        <div className="absolute flex gap-4" style={{ left: 790, top: 170 }}>
          {[{ t: 'What I do', s: 'Islam', c: CRIMSON }, { t: 'Why I believe it', s: 'Iman', c: GOLD }, { t: 'Who I do it for', s: 'Ihsan', c: TEAL }].map((b, i) => (
            <motion.div key={b.t} className="w-[220px] rounded-[18px]" style={{ padding: '16px 18px', background: '#FFFDF8', borderTop: `5px solid ${b.c}`, boxShadow: '0 20px 40px -24px rgba(0,0,0,0.5)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.25, duration: 0.6, ease }}>
              <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 12, letterSpacing: '0.16em', color: b.c }}>{b.s}</p>
              <p className="m-0 mt-1 font-serif" style={{ fontSize: 24, lineHeight: 1.1, color: INK_TEXT }}>{b.t}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Case 4, "past the rituals": a post that sounds deep, and the line of worship that runs to the end. ---------- */

export function CaseOnlineGraphic({ lines, interaction, tone }: GraphicProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && !interaction && (
        <motion.div className="absolute rounded-[22px]" style={{ left: 820, top: 270, width: 560, padding: '22px 26px', background: '#FFFDF8', boxShadow: '0 30px 60px -30px rgba(0,0,0,0.55)' }} initial={{ opacity: 0, y: 40, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease }}>
          <div className="flex items-center gap-3">
            <span className="block h-11 w-11 rounded-full" style={{ background: `linear-gradient(135deg, ${TEAL}, ${GOLD})` }} />
            <div><p className="m-0 font-sans font-bold" style={{ fontSize: 17, color: INK_TEXT }}>awakened.soul</p><p className="m-0 font-sans" style={{ fontSize: 14, color: soft('light') }}>2h</p></div>
          </div>
          <p className="m-0 mt-4 font-serif" style={{ fontSize: 28, lineHeight: 1.2, color: INK_TEXT }}>Once you truly know God, you don't need the rituals any more. ✨</p>
          <div className="mt-4 flex items-center gap-6 font-sans font-bold" style={{ fontSize: 16, color: soft('light') }}>
            <span className="flex items-baseline gap-1">♥ <CountUp to={2400} size={18} color={CRIMSON} /></span><span>💬 318</span><span>↗ 1.1k</span>
          </div>
        </motion.div>
      )}
      {lines >= 2 && !interaction && (
        <motion.div className="absolute flex items-center justify-center rounded-full font-serif" style={{ left: 1300, top: 230, width: 120, height: 120, background: CRIMSON, color: '#fff', fontSize: 30, boxShadow: `0 0 40px 10px ${CRIMSON}55` }} initial={{ scale: 2.4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 8 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay: 0.3 }}>
          true?
        </motion.div>
      )}
      {interaction && (
        <>
          {/* the line of worship runs all the way to the end of a life */}
          <Svg>
            <Draw d="M 800 300 L 1470 300" color={GOLD} width={6} glow dur={2} />
          </Svg>
          <Label x={800} y={318} text="today" tone={tone} />
          <motion.div className="absolute flex flex-col items-center" style={{ left: 1430, top: 240 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
            <span className="h-[120px] w-[4px] rounded-full" style={{ background: CRIMSON }} />
          </motion.div>
          <Label x={1450} y={370} text="the certainty: death" tone={tone} strong color={CRIMSON} />
          <Big x={790} y={180} w={700} tone={tone} size={34} align="left" delay={0.4}>worship <span style={{ color: CRIMSON }}>until</span> the certainty comes</Big>
          <Label x={1120} y={420} text="the prophets knew Allah best, and worshipped most, to the end" tone={tone} />
        </>
      )}
    </div>
  );
}

/* ---------- Zad al-Yaqeen: the notebook opens, the first line is written, a week of one habit. ---------- */

const FIRST = 'I am now certain that…';

export function NotebookGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (lines < 2) { setN(0); return; }
    if (reduce) { setN(FIRST.length); return; }
    const t = window.setInterval(() => setN((k) => (k >= FIRST.length ? k : k + 1)), 70);
    return () => window.clearInterval(t);
  }, [lines, reduce]);
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <div className="absolute" style={{ left: 800, top: 170, width: 680, height: 520, perspective: 1600 }}>
          {/* pages */}
          <div className="absolute inset-0 rounded-[18px]" style={{ background: '#FFFBF2', boxShadow: '0 40px 80px -40px rgba(40,10,5,0.6)' }}>
            <div className="absolute bottom-6 left-1/2 top-6 w-px" style={{ background: 'rgba(31,22,18,0.15)' }} />
            <div className="absolute left-8 top-8 w-[290px]">
              <Ar size={40}>زاد اليقين</Ar>
              <p className="m-0 font-serif" style={{ fontSize: 30, color: INK_TEXT }}>Zad al-Yaqeen</p>
              <p className="m-0 mt-1 font-sans font-semibold" style={{ fontSize: 15, color: soft('light') }}>provision of certainty · Lesson 1</p>
            </div>
            <div className="absolute right-8 top-10 w-[290px]">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="mb-[30px] border-b" style={{ borderColor: 'rgba(31,22,18,0.12)' }} />)}
            </div>
            {lines >= 2 && (
              <p className="absolute right-8 top-[26px] m-0 w-[290px] font-serif italic" style={{ fontSize: 24, color: DEEP }}>
                {FIRST.slice(0, n)}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>|</motion.span>
              </p>
            )}
            {lines >= 3 && (
              <div className="absolute bottom-8 left-8 right-8">
                <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.16em', color: CRIMSON }}>One habit this week</p>
                <div className="mt-3 flex gap-3">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <motion.div key={i} className="flex h-[54px] w-[54px] items-center justify-center rounded-[12px] font-sans font-bold" style={{ border: `2px solid ${i < 1 ? TEAL : 'rgba(31,22,18,0.2)'}`, background: i < 1 ? TEAL : 'transparent', color: i < 1 ? '#fff' : INK_TEXT, fontSize: 17 }}
                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>{i < 1 ? '✓' : d}</motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* the cover swings open */}
          <motion.div className="absolute rounded-[18px]" style={{ left: 340, top: 0, width: 340, height: 520, transformOrigin: 'left center', background: `linear-gradient(160deg, ${CRIMSON}, ${DEEP})`, backfaceVisibility: 'hidden' }}
            initial={{ rotateY: 0 }} animate={{ rotateY: -180 }} transition={{ duration: 1.4, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}>
            <div className="flex h-full flex-col items-center justify-center">
              <Ar size={44} color="#FBE9C8">زاد اليقين</Ar>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ---------- Next time: from the six things back to the very first question; a world that should not exist. ---------- */

export function NextGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const C = { x: 1180, y: 450 };
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && lines < 3 && (
        <>
          <Svg><Draw d={`M 800 650 C 950 650, 1050 450, 1400 300`} color={GOLD} width={4} glow dur={1.6} /></Svg>
          <motion.div className="absolute" style={{ left: 1400 - 20, top: 300 - 20 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4, type: 'spring', bounce: 0.4 }}>
            <Orb size={40} glow={1.6} style={{ marginLeft: 20, marginTop: 20 }} />
          </motion.div>
          <Label x={1400} y={340} text="certainty" tone={tone} strong />
          <Label x={800} y={670} text="where does it start?" tone={tone} />
        </>
      )}
      {lines === 2 && (
        <div className="absolute flex gap-3" style={{ left: 820, top: 230 }}>
          {['Angels', 'Books', 'Messengers', 'The Day'].map((t, i) => (
            <motion.span key={t} className="rounded-[12px] font-sans font-bold" style={{ padding: '8px 14px', background: 'rgba(246,241,232,0.15)', color: '#F6F1E8', fontSize: 17 }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 0.7, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}>{t}</motion.span>
          ))}
          <motion.span className="rounded-[12px] font-serif" style={{ padding: '6px 16px', background: CRIMSON, color: '#fff', fontSize: 22 }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, type: 'spring' }}>before all of it: ?</motion.span>
        </div>
      )}
      {lines >= 3 && (
        <>
          {/* a world gathers out of scattered points */}
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * Math.PI * 2 * 3, r = 160 * Math.sqrt((i % 20) / 20 + 0.05);
            const sx = C.x + Math.cos(i * 2.3) * 520, sy = C.y + Math.sin(i * 1.7) * 360;
            return (
              <motion.span key={i} className="absolute rounded-full" style={{ left: 0, top: 0, width: 5, height: 5, background: i % 5 ? '#F6E3B8' : GOLD }}
                initial={{ x: sx, y: sy, opacity: 0 }} animate={{ x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r, opacity: [0, 1, 0.9] }} transition={{ duration: reduce ? 0 : 2.4, delay: (i % 12) * 0.05, ease }} />
            );
          })}
          <motion.div className="absolute rounded-full" style={{ left: C.x - 170, top: C.y - 170, width: 340, height: 340, background: `radial-gradient(circle at 35% 30%, ${TEAL}, #0B3A45 70%)`, boxShadow: `0 0 80px 20px ${TEAL}55` }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.9 }} transition={{ delay: 2.2, duration: 1.2, ease }} />
          <motion.div className="absolute rounded-full" style={{ left: C.x - 250, top: C.y - 70, width: 500, height: 140, border: `2px solid ${GOLD}`, transform: 'rotate(-14deg)' }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 0.8, scale: 1 }} transition={{ delay: 2.8, duration: 1 }} />
          <Big x={790} y={700} w={780} tone={tone} size={44} delay={3.2}>Is there a <span style={{ color: GOLD }}>Maker</span> at all?</Big>
        </>
      )}
    </div>
  );
}
