import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, ink, soft, INK_TEXT, type GraphicProps } from './Stage';
import { Label } from './graphics';
import { Figure, Svg, Draw, Chip, Big, Ar, Icon, Bubble } from './kit';

/**
 * Scenes told with people (owner, 2026-10-24: "put a person who looks up at something higher than him"). The people are
 * modern and faceless; the Prophet ﷺ, the companions and Jibril are never drawn, so a scene from the hadith is shown as
 * the same manners in a student and a teacher today.
 */

/* ---------- Knees to knees: a student comes close, puts the phone away, rests the hands, gives all attention. ---------- */

export function KneesGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const close = lines >= 2;
  const still = lines >= 3;
  const studentX = close ? 1236 : 1430;
  const FLOOR = 700;
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.span className="absolute font-sans font-bold uppercase" style={{ left: 800, top: 170, fontSize: 13, letterSpacing: '0.18em', color: CRIMSON }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        The same manners, in a student today
      </motion.span>
      <Svg><line x1={800} x2={1520} y1={FLOOR} y2={FLOOR} stroke={soft(tone)} strokeWidth={1.5} /></Svg>
      {/* a rug under both of them */}
      <div className="absolute rounded-[8px]" style={{ left: 880, top: FLOOR - 6, width: 600, height: 12, background: `linear-gradient(90deg, ${CRIMSON}55, ${GOLD}55, ${TEAL}55)` }} />
      <Figure x={1020} y={FLOOR} scale={1.25} pose="kneel" arms="thigh" color="#3E5C76" label="the teacher" />
      {/* the student: far, on the phone; then attention; then close; then still */}
      <motion.div className="absolute inset-0" initial={false} animate={{ x: studentX - 1430 }} transition={{ type: 'spring', bounce: 0.15, duration: reduce ? 0 : 1.6 }}>
        <Figure x={1430} y={FLOOR} scale={1.25} pose="kneel" flip arms={still ? 'thigh' : 'phone'} look={lines >= 1 ? -2 : 22} color={CRIMSON} label="the student" />
      </motion.div>
      {/* 1. attention: a line of sight from the student to the teacher */}
      {lines >= 1 && (
        <Svg><motion.line x1={studentX - 30} y1={FLOOR - 250} x2={1060} y2={FLOOR - 250} stroke={GOLD} strokeWidth={2.5} strokeDasharray="4 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1, x1: studentX - 40 }} transition={{ duration: 1, ease }} /></Svg>
      )}
      {lines === 1 && <Label x={1240} y={FLOOR - 300} text="all attention" tone={tone} strong color={GOLD} />}
      {/* 2. the distance closes until the knees touch */}
      {close && (
        <>
          <motion.span className="absolute rounded-full" style={{ left: 1128 - 26, top: FLOOR - 46, width: 52, height: 52, border: `3px solid ${GOLD}` }} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 2.4], opacity: [1, 0] }} transition={{ duration: 1.2, delay: 1.4, repeat: reduce ? 0 : 2 }} />
          <Chip x={1128} y={FLOOR + 40} strong delay={1.4}>knees to knees</Chip>
        </>
      )}
      {/* 3. the phone goes, the hands rest */}
      {still && (
        <>
          <motion.div className="absolute" style={{ left: studentX + 20, top: FLOOR - 170 }} initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }} animate={{ opacity: 0, x: 140, y: -60, rotate: 30 }} transition={{ duration: 1, ease }}>
            <Icon name="phone" size={36} color={INK_TEXT} />
          </motion.div>
          {lines === 3 && <Label x={1300} y={FLOOR - 330} text="hands resting · nothing in them" tone={tone} strong />}
        </>
      )}
      {/* 4. and in a moment, the student will ask the questions */}
      {lines >= 4 && <Bubble x={studentX + 10} y={FLOOR - 270} text="May I ask you something?" tone={tone} width={250} delay={0.4} />}
    </div>
  );
}

/* ---------- Ihsan: the higher step (you look up, the noise falls away) and the floor (head down, still seen). ---------- */

const NOISE = ['bell', 'mail', 'chat', 'clock', 'phone'];

export function IhsanPeopleGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const high = lines >= 2;
  const floor = lines >= 3;
  const A = { x: 1000, y: 470 }; // the higher step, upper panel
  const B = { x: 1000, y: 790 }; // the floor, lower panel
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines >= 1 && (
        <>
          {/* two panels, one above the other: the two steps */}
          {[{ y: 150, h: 330, t: 'The higher step', c: GOLD }, { y: 500, h: 300, t: 'The floor beneath it', c: TEAL }].map((p, i) => (
            <motion.div key={p.t} className="absolute rounded-[26px]" style={{ left: 780, top: p.y, width: 740, height: p.h, border: `2px solid ${p.c}88`, background: 'rgba(246,241,232,0.04)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: i * 0.2, ease }}>
              <span className="absolute font-sans font-bold uppercase" style={{ left: 24, top: 18, fontSize: 13, letterSpacing: '0.18em', color: p.c }}>{p.t}</span>
            </motion.div>
          ))}
        </>
      )}
      {/* the higher step: light from above, the person looks up, the noise of the day falls away */}
      {lines >= 1 && (
        <>
          <motion.div className="absolute" style={{ left: A.x - 130, top: 152, width: 260, height: 300, background: 'linear-gradient(180deg, rgba(255,226,160,0.75), rgba(255,226,160,0.05))', clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)', filter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: high ? 1 : 0.15 }} transition={{ duration: 1.4 }} />
          <Figure x={A.x} y={A.y} scale={1.15} pose="stand" arms={high ? 'open' : 'side'} look={high ? -28 : 6} color={CRIMSON} glow={high} />
          {NOISE.map((n, i) => (
            <motion.div key={n} className="absolute" style={{ left: A.x + 120 + (i % 3) * 70, top: 230 + Math.floor(i / 3) * 80 }}
              initial={{ opacity: 0 }} animate={high ? { opacity: 0, y: 40, scale: 0.6 } : { opacity: 0.85, y: reduce ? 0 : [0, -4, 0] }} transition={high ? { duration: 1, delay: 0.4 + i * 0.12 } : { duration: 1.6, repeat: Infinity, delay: i * 0.2 }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(246,241,232,0.92)' }}><Icon name={n} size={24} color={CRIMSON} /></span>
            </motion.div>
          ))}
        </>
      )}
      {high && (
        <motion.div className="absolute" style={{ left: 1270, top: 300, width: 230 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 0.7, ease }}>
          <p className="m-0 font-serif" style={{ fontSize: 34, lineHeight: 1.05, color: '#FBE9C8' }}>As if you see Him</p>
          <Ar size={30} color={GOLD}>كَأنَّك تَراه</Ar>
          <p className="m-0 mt-1 font-sans font-semibold" style={{ fontSize: 15, color: 'rgba(246,241,232,0.7)' }}>the heart present; nothing else in the room</p>
        </motion.div>
      )}
      {/* the floor: a busy day, head down at the desk, and still the light is on him; he notices, and looks up */}
      {lines >= 1 && (
        <>
          <div className="absolute rounded-[6px]" style={{ left: B.x + 40, top: B.y - 104, width: 170, height: 10, background: '#C9B79D' }} />
          <div className="absolute" style={{ left: B.x + 110, top: B.y - 94, width: 10, height: 92, background: '#C9B79D' }} />
          <Figure x={B.x} y={B.y - 4} scale={0.95} pose="chair" arms={floor ? 'thigh' : 'phone'} look={floor ? -14 : 24} color={TEAL} />
        </>
      )}
      {floor && (
        <>
          <motion.span className="absolute rounded-full" style={{ left: B.x - 110, top: B.y - 270, width: 220, height: 220, border: `2px solid ${GOLD}`, boxShadow: `0 0 40px 6px ${GOLD}44` }} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 0.9 }} transition={{ duration: 1.2, ease }} />
          <motion.div className="absolute" style={{ left: 1200, top: 600, width: 300 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.7, ease }}>
            <p className="m-0 font-serif" style={{ fontSize: 34, lineHeight: 1.05, color: '#CFEFF3' }}>He sees you</p>
            <Ar size={30} color={TEAL}>فإنَّه يَراك</Ar>
            <p className="m-0 mt-1 font-sans font-semibold" style={{ fontSize: 15, color: 'rgba(246,241,232,0.7)' }}>on a busy day, still seen; you never fall below this</p>
          </motion.div>
        </>
      )}
      {/* the word "see" in both, kept for the rest of the lesson */}
      {lines >= 4 && (
        <>
          <motion.span className="absolute rounded-full font-serif" style={{ left: 1110, top: 466, padding: '6px 18px', fontSize: 32, color: '#3A1F08', background: GOLD, boxShadow: `0 0 40px 10px ${GOLD}88` }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.6 }}>see</motion.span>
        </>
      )}
    </div>
  );
}

/* ---------- Next time: the stairs up to certainty, and under the first step one question; the sky answers back. ---------- */

const STEPS = ['the Day', 'messengers', 'books', 'angels'];

export function NextPeopleGraphic({ lines, tone }: GraphicProps) {
  const reduce = useReduce();
  const sky = lines >= 3;
  const P = { x: 860, y: 780 };
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* stars: few at first, then the whole sky */}
      {Array.from({ length: sky ? 70 : 0 }, (_, i) => {
        const sx = 780 + ((i * 97) % 740), sy = 150 + ((i * 53) % 420);
        return <motion.span key={i} className="absolute rounded-full" style={{ left: sx, top: sy, width: i % 7 ? 3 : 5, height: i % 7 ? 3 : 5, background: '#FFF4D6', boxShadow: '0 0 8px #FFE7A8' }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: reduce ? 0.9 : [0, 1, 0.6, 1], scale: 1 }} transition={{ duration: 2.4, delay: 0.4 + (i % 20) * 0.08, repeat: reduce ? 0 : Infinity, repeatType: 'mirror' }} />;
      })}
      {sky && (
        <>
          <Svg><Draw d="M 1130 230 L 1220 200 L 1300 250 L 1390 215 L 1450 280" color="#F6E3B8" width={1.5} delay={1.6} /></Svg>
          <motion.div className="absolute rounded-full" style={{ left: 1380, top: 150, width: 70, height: 70, boxShadow: 'inset -14px 6px 0 0 #FBE9C8' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} />
        </>
      )}
      {/* the stairs to certainty */}
      {lines >= 1 && (
        <motion.div className="absolute inset-0" initial={false} animate={{ opacity: sky ? 0.3 : 1 }} transition={{ duration: 0.8 }}>
          {STEPS.map((t, i) => {
            const x = 980 + (3 - i) * 120, y = 360 + i * 90;
            const on = lines >= 2;
            return (
              <motion.div key={t} className="absolute rounded-[8px] text-center font-sans font-bold" style={{ left: x, top: y, width: 140, padding: '8px 0', fontSize: 16, background: on ? '#FBE9C8' : 'rgba(246,241,232,0.18)', color: on ? '#3A1F08' : 'rgba(246,241,232,0.7)' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (3 - i) * 0.15 }}>
                {t}
              </motion.div>
            );
          })}
          <motion.div className="absolute flex items-center gap-2 rounded-full font-sans font-bold" style={{ left: 1420, top: 270, padding: '8px 16px', fontSize: 17, background: GOLD, color: '#3A1F08', boxShadow: `0 0 30px 8px ${GOLD}66` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>certainty</motion.div>
          {lines >= 2 && (
            <motion.div className="absolute flex items-center justify-center rounded-[8px] font-serif" style={{ left: 900, top: 660, width: 140, height: 46, fontSize: 30, border: `2px dashed ${GOLD}`, color: GOLD }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: 'spring' }}>?</motion.div>
          )}
          {lines >= 2 && <Label x={970} y={716} text="the first step" tone={tone} />}
        </motion.div>
      )}
      {/* the person: at the foot of the stairs, then looking up at the sky */}
      {lines >= 1 && <Figure x={P.x - 60} y={P.y} scale={1.1} pose="stand" arms={sky ? 'open' : 'side'} look={sky ? -40 : lines >= 2 ? -12 : 0} color={TEAL} glow={sky} />}
      {sky && <Bubble x={P.x + 30} y={P.y - 280} thought text="Who made all of this?" tone={tone} width={230} delay={2.4} />}
    </div>
  );
}
