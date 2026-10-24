import React from 'react';
import { useCue } from '../sfx';
import { motion, AnimatePresence } from 'motion/react';
import { CountUp, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { Orb, useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Label } from './graphics';
import { Svg, Draw, Chip, Big, Ar, Meter, CLAY, SAND } from './kit';

/* ---------- Cover: a mihrab arch draws itself; the five questions he will ask appear around it; the riddle. ---------- */

const ARCH = { x0: 1010, x1: 1390, top: 330, base: 770 };
const archD = `M ${ARCH.x0} ${ARCH.base} L ${ARCH.x0} ${ARCH.top} A 190 190 0 0 1 ${ARCH.x1} ${ARCH.top} L ${ARCH.x1} ${ARCH.base}`;
const QS = [
  { t: 'Islam?', x: 945, y: 250 }, { t: 'Iman?', x: 1480, y: 300 }, { t: 'Ihsan?', x: 945, y: 520 },
  { t: 'The Hour?', x: 1490, y: 540 }, { t: 'Its signs?', x: 1200, y: 96 },
];

export function CoverGraphic({ tone }: GraphicProps) {
  const reduce = useReduce();
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* light in the doorway */}
      <motion.div className="absolute" style={{ left: ARCH.x0, top: ARCH.top - 190, width: ARCH.x1 - ARCH.x0, height: ARCH.base - ARCH.top + 190, borderRadius: '190px 190px 0 0', background: 'radial-gradient(70% 60% at 50% 70%, rgba(255,214,140,0.55), rgba(229,169,60,0.12) 60%, transparent 80%)' }}
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.8, 1] }} transition={{ duration: 3, delay: 0.8, repeat: reduce ? 0 : Infinity, repeatType: 'mirror' }} />
      <Svg>
        <Draw d={archD} color={GOLD} width={4} dur={2} glow />
        <Draw d={`M ${ARCH.x0 - 60} ${ARCH.base} L ${ARCH.x1 + 60} ${ARCH.base}`} color={GOLD} width={2} delay={1.4} opacity={0.6} />
      </Svg>
      {/* the stranger: a point of light walking in through the arch */}
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ x: 1200, y: ARCH.base + 60, opacity: 0, scale: 0.4 }} animate={{ x: 1200, y: ARCH.base - 40, opacity: 1, scale: 1 }} transition={{ duration: reduce ? 0 : 2.2, delay: 1.6, ease }}>
        <Orb size={40} glow={1.6} />
      </motion.div>
      {QS.map((q, i) => (
        <motion.span key={q.t} className="absolute -translate-x-1/2 whitespace-nowrap rounded-full font-serif" style={{ left: q.x, top: q.y, padding: '8px 18px', fontSize: 24, color: '#3A1F08', background: i === 4 ? GOLD : 'rgba(246,241,232,0.92)' }}
          initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: reduce ? 0 : [0, -6, 0] }}
          transition={{ opacity: { delay: 3 + i * 0.35 }, scale: { delay: 3 + i * 0.35, type: 'spring', bounce: 0.4 }, y: { delay: 4.5 + i * 0.2, duration: 3, repeat: Infinity } }}>
          {q.t}
        </motion.span>
      ))}
      <motion.p className="absolute m-0 font-serif italic" style={{ left: 110, width: 640, top: 712, fontSize: 30, color: GOLD }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 5.2, duration: 0.8 }}>
        He knew every answer. So why did he ask?
      </motion.p>
    </div>
  );
}

/* ---------- One morning in Madinah: Umar's memory of two colours, and what a desert road does to them. ---------- */

function Swatch({ x, y, fill, label, dusty = false, delay = 0, big = false }: { x: number; y: number; fill: string; label: string; dusty?: boolean; delay?: number; big?: boolean }) {
  const w = big ? 190 : 150;
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: w }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <div className="relative overflow-hidden rounded-[16px]" style={{ height: w, background: fill, boxShadow: '0 20px 40px -22px rgba(40,10,5,0.55), inset 0 0 0 1px rgba(31,22,18,0.08)' }}>
        <motion.div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${fill}, ${fill})` }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay, ease }} />
        {dusty && (
          <>
            <div className="absolute inset-0" style={{ background: 'rgba(185,138,90,0.45)' }} />
            {Array.from({ length: 26 }, (_, i) => (
              <motion.span key={i} className="absolute rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 4 + (i % 4) * 2, height: 4 + (i % 4) * 2, background: '#9C6B3E' }}
                initial={{ opacity: 0, y: -30 }} animate={{ opacity: 0.8, y: 0 }} transition={{ delay: delay + 0.3 + i * 0.03 }} />
            ))}
          </>
        )}
      </div>
      <p className="m-0 mt-3 font-sans font-semibold" style={{ fontSize: 17, color: INK_TEXT }}>{label}</p>
    </motion.div>
  );
}

export function MadinahGraphic({ lines, tone }: GraphicProps) {
  useCue('whoosh', lines >= 1);
  useCue('pen', lines >= 2, 0.3);
  useCue('sparkle', lines >= 3, 0.3);
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* where we are */}
      <motion.div className="absolute flex items-center gap-3 rounded-full font-sans font-bold" style={{ left: 760, top: 150, padding: '10px 18px', background: '#FFFDF8', fontSize: 17, color: INK_TEXT, boxShadow: '0 12px 30px -18px rgba(40,10,5,0.5)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="block h-3 w-3 rounded-full" style={{ background: CRIMSON, boxShadow: `0 0 10px ${CRIMSON}` }} /> Madinah · in the masjid · sitting with the Prophet ﷺ
      </motion.div>
      {lines >= 1 && (
        <>
          {/* Umar's memory: a card with two colours */}
          <motion.div className="absolute rounded-[26px]" style={{ left: 760, top: 240, width: 460, height: 400, background: '#FFFDF8', boxShadow: '0 40px 80px -40px rgba(40,10,5,0.6)' }} initial={{ opacity: 0, rotate: -6, y: 30 }} animate={{ opacity: 1, rotate: -2, y: 0 }} transition={{ duration: 0.8, ease }}>
            <p className="m-0 font-sans font-bold uppercase" style={{ position: 'absolute', left: 30, top: 24, fontSize: 13, letterSpacing: '0.16em', color: CRIMSON }}>What Umar remembered</p>
          </motion.div>
          <Swatch x={800} y={300} fill="#FFFFFF" label="very white clothes" delay={0.5} big />
          <Swatch x={1010} y={300} fill="#141414" label="very black hair" delay={0.8} big />
        </>
      )}
      {lines >= 2 && (
        <>
          <Svg><Draw d="M 1240 400 C 1270 380, 1290 380, 1310 400" color={CLAY} width={3} /><path d="M 1302 392 L 1312 401 L 1300 408" stroke={CLAY} strokeWidth={3} fill="none" /></Svg>
          <motion.p className="absolute m-0 font-sans font-bold uppercase" style={{ left: 1330, top: 262, fontSize: 13, letterSpacing: '0.16em', color: CLAY }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>after a desert road</motion.p>
          <Swatch x={1330} y={290} fill="#FFFFFF" label="dust-worn white" dusty delay={0.5} />
          <Swatch x={1330} y={500} fill="#141414" label="dust in the hair" dusty delay={0.9} />
        </>
      )}
      {lines >= 3 && (
        <>
          <motion.div className="absolute flex items-center justify-center rounded-full font-serif" style={{ left: 1150, top: 560, width: 120, height: 120, background: CRIMSON, color: '#fff', fontSize: 80, boxShadow: `0 0 50px 12px ${CRIMSON}66` }}
            initial={{ scale: 3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay: 0.3 }}>?</motion.div>
          <Label x={1000} y={700} text="his were untouched" tone={tone} strong color={CRIMSON} />
        </>
      )}
    </div>
  );
}

/* ---------- Knees to knees: the distance closes, the stillness settles, then the student turns examiner. ---------- */

export function CushionsGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const close = lines >= 1;
  const touch = lines >= 2;
  const gap = touch ? 0 : close ? 120 : 420;
  const cx = 1130;
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* two places on the floor, sliding together */}
      <Svg>
        <line x1={760} x2={1500} y1={640} y2={640} stroke={soft(tone)} strokeWidth={1.5} strokeDasharray="4 8" />
      </Svg>
      <motion.div className="absolute rounded-[40px]" style={{ top: 560, width: 220, height: 80, background: `linear-gradient(180deg, ${GOLD}, #B47A1E)`, boxShadow: '0 30px 40px -24px rgba(40,10,5,0.6)' }} initial={false} animate={{ left: cx - 220 - gap / 2 }} transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}>
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ fontSize: 17, color: soft(tone) }}>the teacher</span>
      </motion.div>
      <motion.div className="absolute rounded-[40px]" style={{ top: 560, width: 220, height: 80, background: `linear-gradient(180deg, ${CRIMSON}, #8B1A1E)`, boxShadow: '0 30px 40px -24px rgba(40,10,5,0.6)' }} initial={false} animate={{ left: cx + gap / 2 }} transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}>
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ fontSize: 17, color: soft(tone) }}>the newcomer</span>
      </motion.div>
      {/* the distance */}
      <motion.div className="absolute -translate-x-1/2 text-center font-sans font-bold" style={{ left: cx, top: 670 }} initial={false} animate={{ opacity: 1 }}>
        <span style={{ fontSize: 40, color: touch ? CRIMSON : ink(tone) }}>{touch ? '0 cm' : close ? 'closer…' : 'a room apart'}</span>
        <p className="m-0 font-sans" style={{ fontSize: 17, color: soft(tone) }}>{touch ? 'knees to knees' : 'distance to the lesson'}</p>
      </motion.div>
      {touch && (
        <motion.span className="absolute rounded-full" style={{ left: cx - 30, top: 570, width: 60, height: 60, border: `3px solid ${GOLD}` }} initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 2.8, opacity: 0 }} transition={{ duration: 1, delay: 0.6, repeat: reduce ? 0 : 2 }} />
      )}
      {/* stillness: a restless line goes quiet */}
      {lines >= 3 && (
        <motion.div className="absolute" style={{ left: 800, top: 230, width: 640 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 14, letterSpacing: '0.16em', color: CRIMSON }}>Restless → still</p>
          <svg width="640" height="120" viewBox="0 0 640 120">
            <motion.path fill="none" stroke={TEAL} strokeWidth={4} strokeLinecap="round"
              initial={{ d: 'M0 60 Q 20 10 40 60 T 80 60 T 120 60 T 160 60 T 200 60 T 240 60 T 280 60 T 320 60 T 360 60 T 400 60 T 440 60 T 480 60 T 520 60 T 560 60 T 600 60 T 640 60' }}
              animate={{ d: 'M0 60 Q 20 58 40 60 T 80 60 T 120 60 T 160 60 T 200 60 T 240 60 T 280 60 T 320 60 T 360 60 T 400 60 T 440 60 T 480 60 T 520 60 T 560 60 T 600 60 T 640 60' }}
              transition={{ duration: 2.4, delay: 0.4, ease }} />
          </svg>
          <p className="m-0 font-sans font-semibold" style={{ fontSize: 18, color: soft(tone) }}>hands resting on his thighs · nothing in them</p>
        </motion.div>
      )}
      {/* the role card flips: student … or examiner? */}
      {lines >= 4 && (
        <div className="absolute" style={{ left: cx + 60, top: 400, perspective: 800 }}>
          <motion.div className="relative" style={{ width: 260, height: 90, transformStyle: 'preserve-3d' }} initial={{ rotateX: 0 }} animate={{ rotateX: 180 }} transition={{ duration: 0.9, delay: 0.8, ease }}>
            <div className="absolute inset-0 flex items-center justify-center rounded-[18px] font-sans font-bold uppercase" style={{ background: '#FFFDF8', fontSize: 22, letterSpacing: '0.12em', color: INK_TEXT, backfaceVisibility: 'hidden', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)' }}>Student</div>
            <div className="absolute inset-0 flex items-center justify-center rounded-[18px] font-sans font-bold uppercase" style={{ background: CRIMSON, fontSize: 22, letterSpacing: '0.12em', color: '#fff', backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', boxShadow: `0 0 40px 8px ${CRIMSON}55` }}>Examiner?</div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ---------- The Hour: a clock with no numbers; "when" gives way to "how ready". ---------- */

const CLK = { x: 1080, y: 420, r: 190 };

export function HourGraphic({ lines, interaction, tone }: GraphicProps) {
  useCue('whoosh', lines >= 1);
  useCue('chime', lines >= 2, 0.4);
  useCue('strike', lines >= 3, 0.5);
  useCue('pen', lines >= 4, 0.3);
  const reduce = useReduce();
  const ready = lines >= 3;
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ x: ready ? -120 : 0, scale: ready ? 0.72 : 1, opacity: interaction ? 0.25 : 1 }} style={{ transformOrigin: `${CLK.x}px ${CLK.y}px` }} transition={{ duration: 0.9, ease }}>
          <Svg>
            <circle cx={CLK.x} cy={CLK.y} r={CLK.r} fill="rgba(246,241,232,0.04)" stroke={GOLD} strokeWidth={3} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <line key={i} x1={CLK.x + Math.sin(a) * (CLK.r - 18)} y1={CLK.y - Math.cos(a) * (CLK.r - 18)} x2={CLK.x + Math.sin(a) * (CLK.r - 6)} y2={CLK.y - Math.cos(a) * (CLK.r - 6)} stroke={GOLD} strokeWidth={i % 3 === 0 ? 4 : 2} opacity={0.7} />;
            })}
          </Svg>
          {/* hands spin, searching, and stop on nothing */}
          <motion.div className="absolute" style={{ left: CLK.x - 3, top: CLK.y - 150, width: 6, height: 150, background: '#F6F1E8', borderRadius: 3, transformOrigin: '50% 100%' }} initial={{ rotate: 0 }} animate={{ rotate: reduce ? 0 : [0, 1440, 1800] }} transition={{ duration: 3, ease: [0.2, 0.8, 0.3, 1] }} />
          <motion.div className="absolute" style={{ left: CLK.x - 4, top: CLK.y - 100, width: 8, height: 100, background: GOLD, borderRadius: 4, transformOrigin: '50% 100%' }} initial={{ rotate: 0 }} animate={{ rotate: reduce ? 0 : [0, 480, 720] }} transition={{ duration: 3, ease: [0.2, 0.8, 0.3, 1] }} />
          <span className="absolute rounded-full" style={{ left: CLK.x - 10, top: CLK.y - 10, width: 20, height: 20, background: CRIMSON }} />
          <motion.span className="absolute -translate-x-1/2 font-serif" style={{ left: CLK.x, top: CLK.y - CLK.r - 92, fontSize: 64, color: GOLD }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.8, type: 'spring', bounce: 0.4 }}>?</motion.span>
          <Label x={CLK.x} y={CLK.y + CLK.r + 24} text="Known to Allah alone" tone={tone} strong />
        </motion.div>
      )}
      {/* the one asked = the one asking */}
      {lines === 2 && (
        <div className="absolute flex items-end gap-10" style={{ left: 1320, top: 300 }}>
          {['the one asked', 'the one asking'].map((t, i) => (
            <div key={t} className="flex flex-col items-center gap-2">
              <motion.div className="w-[70px] rounded-t-[10px]" style={{ background: i ? TEAL : CRIMSON }} initial={{ height: 0 }} animate={{ height: 90 }} transition={{ duration: 0.8, delay: 0.4 + i * 0.3, ease }} />
              <span className="whitespace-nowrap font-sans font-bold" style={{ fontSize: 15, color: soft(tone) }}>{t}</span>
            </div>
          ))}
          <motion.span className="absolute font-serif" style={{ left: 62, top: 10, fontSize: 48, color: '#F6F1E8' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>=</motion.span>
        </div>
      )}
      {/* "When?" is crossed out; "What have you prepared?" takes its place */}
      {ready && (
        <div className="absolute" style={{ left: 1150, top: 230, width: 380 }}>
          <motion.p className="relative m-0 w-fit font-serif" style={{ fontSize: 56, color: soft(tone) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            When?
            <motion.span className="absolute left-0 top-1/2 h-[4px] w-full origin-left" style={{ background: CRIMSON }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
          </motion.p>
          <motion.p className="m-0 mt-4 font-serif" style={{ fontSize: 46, lineHeight: 1.05, color: GOLD }} initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 1.1, duration: 0.8, ease }}>
            What have you prepared for it?
          </motion.p>
        </div>
      )}
      {lines >= 4 && <Meter x={1150} y={520} w={360} value={0.62} label="How ready?" sub="your preparation" tone={tone} strong delay={0.3} />}
      {/* four answers, all confirmed */}
      {interaction && (
        <div className="absolute flex gap-3" style={{ left: 780, top: 150 }}>
          {['Islam', 'Iman', 'Ihsan', 'The Hour'].map((t, i) => <Chip key={t} x={70 + i * 150} y={0} delay={0.2 + i * 0.25} tone={tone}>✓ {t}</Chip>)}
        </div>
      )}
    </div>
  );
}

/* ---------- The reveal: the clues lock together into a name; the questions ripple out across fourteen centuries. ---------- */

const PIECES = [
  { t: 'No sign of travel', from: { x: -260, y: -140 } },
  { t: 'No one knew him', from: { x: 260, y: -160 } },
  { t: 'Every answer confirmed', from: { x: 0, y: 220 } },
];

export function RevealGraphic({ lines, tone }: GraphicProps) {
  useCue('reveal', lines >= 1, 0.2);
  useCue('whoosh', lines >= 2, 0.3);
  useCue('sparkle', lines >= 3, 0.4);
  const reduce = useReduce();
  const C = { x: 1120, y: 420 };
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ y: lines >= 2 ? -110 : 0, scale: lines >= 2 ? 0.8 : 1 }} style={{ transformOrigin: `${C.x}px ${C.y}px` }} transition={{ duration: 0.9, ease }}>
          {PIECES.map((p, i) => (
            <motion.div key={p.t} className="absolute -translate-x-1/2 whitespace-nowrap rounded-[16px] font-sans font-bold" style={{ left: C.x, top: C.y - 150 + i * 62, padding: '12px 20px', fontSize: 20, background: '#FFFDF8', color: INK_TEXT, boxShadow: '0 14px 30px -18px rgba(40,10,5,0.6)' }}
              initial={{ x: p.from.x, y: p.from.y, opacity: 0, rotate: i % 2 ? 8 : -8 }} animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay: reduce ? 0 : 0.2 + i * 0.25 }}>
              ✓ {p.t}
            </motion.div>
          ))}
          <motion.div className="absolute -translate-x-1/2 text-center" style={{ left: C.x, top: C.y + 50 }} initial={{ opacity: 0, scale: 0.7, filter: 'blur(12px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ delay: 1.4, duration: 0.9, ease }}>
            <p className="m-0 font-serif" style={{ fontSize: 92, lineHeight: 1, color: CRIMSON }}>Jibril</p>
            <Ar size={40}>جبريل عليه السلام</Ar>
            <p className="m-0 mt-1 font-sans font-semibold" style={{ fontSize: 18, color: soft(tone) }}>the angel who brought the revelation</p>
          </motion.div>
        </motion.div>
      )}
      {/* the answers travel outward: the companions, then every generation, then you */}
      {lines >= 2 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="absolute rounded-full" style={{ left: C.x - 60, top: 600 - 60, width: 120, height: 120, border: `2px solid ${i === 2 ? CRIMSON : GOLD}` }}
              initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 2.2 + i * 1.2], opacity: [0.9, 0.15] }} transition={{ duration: 2.2, delay: 0.4 + i * 0.5, repeat: reduce ? 0 : Infinity, repeatDelay: 1 }} />
          ))}
          <Chip x={C.x} y={584} strong delay={0.3}>He asked so that we would hear</Chip>
        </>
      )}
      {lines >= 3 && (
        <div className="absolute" style={{ left: 780, top: 720, width: 700 }}>
          <Svg><Draw d="M 790 742 L 1480 742" color={GOLD} width={3} dur={1.4} /></Svg>
          <span className="absolute font-sans font-bold" style={{ left: 0, top: 36, fontSize: 17, color: soft(tone) }}>that day, in Madinah</span>
          <span className="absolute font-sans font-bold" style={{ right: 0, top: 36, fontSize: 17, color: CRIMSON }}>you, today</span>
          <div className="absolute -translate-x-1/2 flex items-baseline gap-2" style={{ left: 350, top: -50 }}>
            <CountUp to={14} size={48} color={ink(tone)} /><span className="font-sans font-semibold" style={{ fontSize: 18, color: soft(tone) }}>centuries</span>
          </div>
        </div>
      )}
    </div>
  );
}
