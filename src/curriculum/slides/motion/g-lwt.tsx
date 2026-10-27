import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useCue } from '../sfx';
import { useReduce, type GraphicProps } from './Stage';
import { Svg, Cut } from './kit';
import { Hear } from '../Say';

/**
 * Literacy A · Teens · Lesson 1 · Welcome to Arabic. Decode the City (docs/curriculum/literacy/PLAN.md): a night city
 * whose every sign is a code; each lesson lights one block, 26 in six districts, laid out right to left like Arabic.
 * Karim and Lina, our neutral teens cast, on the night stage. Prototype pages (cover, the city, right to left) for the
 * owner's review before the rest is built.
 */

const CAST = 'literacy-a-teens/characters';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const NIGHT = '#0E1A20';
const GLASS: React.CSSProperties = { background: 'rgba(246,241,232,0.96)', boxShadow: '0 30px 60px -28px rgba(0,0,0,0.7)' };
const MESSAGE = 'سَلَامٌ يَا كَرِيمُ';

/* ---------- the city: 26 blocks in six districts, block 1 on the right ---------- */

const DISTRICTS = [
  { name: 'Start', n: 1, color: CRIMSON },
  { name: 'The Letters', n: 6, color: TEAL },
  { name: 'Joining', n: 3, color: '#E0603F' },
  { name: 'Vowels', n: 8, color: GOLD },
  { name: 'No Marks', n: 3, color: '#6C8BE0' },
  { name: 'Real World', n: 5, color: '#B06CD0' },
];
// Buildings from x 1540 leftwards; heights rise towards the skyline at the end of the course.
const BLOCKS = (() => {
  const out: { x: number; w: number; h: number; d: number; k: number }[] = [];
  let x = 1548, k = 0;
  DISTRICTS.forEach((dist, d) => {
    for (let i = 0; i < dist.n; i++) {
      const w = 26;
      const h = 70 + k * 9.5 + ((k * 37) % 5) * 9;
      out.push({ x: x - w, w, h, d, k });
      x -= w + 3;
      k++;
    }
    x -= 9;
  });
  return out;
})();
const GROUND = 720;

function Windows({ x, w, h, lit, color, delay = 0 }: { x: number; w: number; h: number; lit: boolean; color: string; delay?: number }) {
  const rows = Math.floor((h - 16) / 18);
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <motion.rect key={r} x={x + 7} y={GROUND - h + 10 + r * 18} width={w - 14} height={8} rx={2}
          initial={false} animate={{ fill: lit ? '#FFE7A8' : 'rgba(246,241,232,0.08)', opacity: 1 }}
          style={lit ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
          transition={{ duration: 0.4, delay: lit ? delay + r * 0.06 : 0 }} />
      ))}
    </>
  );
}

// A few stars over the city.
const STARS = [[820, 200], [905, 150], [990, 230], [1080, 170], [1170, 215], [1250, 140], [1330, 240], [1420, 190], [1500, 250], [870, 300], [1120, 290], [1290, 320]];

function City({ step, scale = 1 }: { step: number; scale?: number }) {
  const reduce = useReduce();
  const preview = step === 3;
  return (
    <Svg>
      {STARS.map(([x, y], i) => (
        <motion.circle key={`s${i}`} cx={x} cy={y} r={i % 3 ? 2 : 3} fill="#FFF3D6"
          initial={{ opacity: 0 }} animate={reduce ? { opacity: 0.7 } : { opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 2.4 + (i % 4) * 0.6, repeat: reduce ? 0 : Infinity, delay: i * 0.2 }} />
      ))}
      <g transform={`translate(${1548 * (1 - scale)} ${GROUND * (1 - scale)}) scale(${scale})`}>
      <motion.rect x={760} y={GROUND} width={840} height={4} rx={2} fill="rgba(246,241,232,0.3)" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ transformOrigin: '100% 50%' }} transition={{ duration: 0.8, ease }} />
      {BLOCKS.map((b) => {
        const dist = DISTRICTS[b.d];
        const lit = preview || (step >= 4 && b.k === 0);
        return (
          <motion.g key={b.k} initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 100%' }}
            transition={{ duration: 0.6, ease, delay: 0.1 + b.k * 0.04 }}>
            <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} rx={3} fill="#1C2B33" stroke={lit ? dist.color : 'rgba(246,241,232,0.18)'} strokeWidth={2} />
            <Windows x={b.x} w={b.w} h={b.h} lit={lit} color={dist.color} delay={preview ? b.k * 0.05 : 0.6} />
          </motion.g>
        );
      })}
      {/* the districts: a coloured base line and a name under each */}
      {step >= 2 && DISTRICTS.map((dist, d) => {
        const own = BLOCKS.filter((b) => b.d === d);
        const x0 = Math.min(...own.map((b) => b.x)), x1 = Math.max(...own.map((b) => b.x + b.w));
        return (
          <motion.g key={dist.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 + d * 0.18 }}>
            <rect x={x0} y={GROUND + 10} width={x1 - x0} height={6} rx={3} fill={dist.color} />
            <text x={(x0 + x1) / 2} y={GROUND + (d % 2 ? 64 : 42)} textAnchor="middle" fontSize={d === 0 ? 17 : 19} fontWeight={800} fill={dist.color} className="font-sans">{dist.name}</text>
          </motion.g>
        );
      })}
      </g>
    </Svg>
  );
}

export function LwtCityGraphic({ lines }: GraphicProps) {
  useCue('whoosh', lines >= 1, 0.2);
  useCue('pop', lines >= 2, 0.3);
  useCue('sparkle', lines >= 3, 0.4);
  useCue('chime', lines >= 4, 0.6);
  const first = BLOCKS[0];
  return (
    <>
      <City step={Math.min(lines, 4)} />
      {lines >= 2 && (
        <motion.span className="pointer-events-none absolute font-sans font-bold" style={{ left: 800, top: 180, fontSize: 22, color: 'rgba(246,241,232,0.7)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          26 blocks · 26 lessons
        </motion.span>
      )}
      {lines === 3 && (
        <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 800, top: 214, fontSize: 30, color: GOLD }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
          The whole skyline: you read anything
        </motion.span>
      )}
      {lines >= 4 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: first.x + first.w / 2 - 170, top: GROUND - first.h - 74, width: 180, alignItems: 'flex-end' }}
          initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.45, delay: 0.8 }}>
          <span className="whitespace-nowrap rounded-full font-sans font-black text-white" style={{ fontSize: 19, padding: '6px 16px', background: CRIMSON, boxShadow: `0 0 24px ${CRIMSON}` }}>Block 1: today</span>
          <span style={{ width: 0, height: 0, marginRight: 1, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `11px solid ${CRIMSON}` }} />
        </motion.div>
      )}
    </>
  );
}

/* ---------- 0 · cover: the night city, Karim's phone buzzes with a message he can't read ---------- */

function ChatBubble({ x, y, delay = 0, children, mine = false }: { x: number; y: number; delay?: number; children: React.ReactNode; mine?: boolean }) {
  return (
    <motion.div className="pointer-events-auto absolute rounded-[22px]" style={{ ...GLASS, left: x, top: y, padding: '10px 22px', borderBottomRightRadius: mine ? 22 : 6, borderBottomLeftRadius: mine ? 6 : 22 }}
      initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay }}>
      {children}
    </motion.div>
  );
}

export function LwtCoverGraphic(_: GraphicProps) {
  useCue('whoosh', 1, 0.3);
  useCue('pop', 1, 2.2);
  return (
    <>
      <City step={1} scale={0.8} />
      <ChatBubble x={900} y={230} delay={2}>
        <Hear id="salam-ya-karim"><span lang="ar" style={{ ...AR, fontSize: 54, color: NIGHT }}>{MESSAGE}</span></Hear>
      </ChatBubble>
      <motion.span className="pointer-events-none absolute rounded-full font-sans font-black text-white" style={{ left: 1210, top: 206, fontSize: 24, padding: '2px 12px', background: CRIMSON }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, delay: 2.6 }}>???</motion.span>
      <Cut src={`${CAST}/lina-decode`} x={1270} y={840} h={430} delay={1} />
      <Cut src={`${CAST}/karim-phone`} x={1460} y={840} h={460} delay={1.2} />
    </>
  );
}

/* ---------- 4 · right to left: two lines, then the phone mirrors ---------- */

function Line({ y, dir, color, label, children, delay = 0 }: { y: number; dir: 'ltr' | 'rtl'; color: string; label: string; children: React.ReactNode; delay?: number }) {
  const ltr = dir === 'ltr';
  return (
    <motion.div className="pointer-events-none absolute rounded-[24px]" style={{ ...GLASS, left: 790, top: y, width: 460, height: 130 }}
      initial={{ opacity: 0, x: ltr ? -40 : 40 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.8, delay }}>
      <span className="absolute font-sans font-extrabold uppercase" style={{ top: 10, [ltr ? 'left' : 'right']: 20, fontSize: 14, letterSpacing: '0.16em', color }}>{label}</span>
      <div className="pointer-events-auto absolute inset-x-0 flex justify-center" style={{ top: 22 }}>{children}</div>
      <motion.div className="absolute rounded-full" style={{ bottom: 16, left: 60, width: 340, height: 6, background: color, transformOrigin: ltr ? 'left' : 'right' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, delay: delay + 0.6, ease: [0.45, 0, 0.55, 1] }} />
      <motion.div className="absolute rounded-full" style={{ bottom: 9, width: 20, height: 20, background: color, boxShadow: `0 0 0 6px ${color}44` }}
        initial={{ left: ltr ? 50 : 390 }} animate={{ left: ltr ? 390 : 50 }} transition={{ duration: 1.5, delay: delay + 0.6, ease: [0.45, 0, 0.55, 1] }} />
    </motion.div>
  );
}

/** A phone whose chat layout flips when the language becomes Arabic. */
function MirrorPhone({ flipped }: { flipped: boolean }) {
  const side = (mine: boolean) => (flipped ? !mine : mine);
  const rows: { mine: boolean; w: number }[] = [{ mine: false, w: 150 }, { mine: true, w: 120 }, { mine: false, w: 170 }, { mine: true, w: 100 }];
  return (
    <motion.div className="pointer-events-none absolute overflow-hidden rounded-[34px]" style={{ left: 1290, top: 190, width: 250, height: 470, background: '#101418', padding: 10, boxShadow: '0 40px 70px -30px rgba(0,0,0,0.8)' }}
      initial={{ opacity: 0, y: 40, rotate: 8 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 0.9, ease }}>
      <div className="relative h-full w-full overflow-hidden rounded-[26px]" style={{ background: '#E9EEF0' }}>
        {/* top bar: the back arrow and the name swap sides */}
        <div className="absolute inset-x-0 top-0 flex items-center px-4" style={{ height: 54, background: TEAL, flexDirection: flipped ? 'row-reverse' : 'row' }}>
          <motion.span layout className="font-sans font-black text-white" style={{ fontSize: 24 }}>{flipped ? '→' : '←'}</motion.span>
          <motion.span layout className="mx-3 font-sans font-bold text-white" style={{ fontSize: 17 }}>{flipped ? <span style={{ ...AR, fontSize: 20 }}>لِينَا</span> : 'Lina'}</motion.span>
        </div>
        {rows.map((r, i) => (
          <motion.div key={i} layout className="absolute rounded-[14px]" style={{ top: 76 + i * 62, height: 40, width: r.w, background: r.mine ? '#C9F0D8' : '#FFFFFF', [side(r.mine) ? 'right' : 'left']: 14 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.9, delay: i * 0.08 }} />
        ))}
        {/* the scroll bar moves to the other edge */}
        <motion.div layout className="absolute rounded-full" style={{ top: 90, height: 120, width: 5, background: 'rgba(16,20,24,0.3)', [flipped ? 'left' : 'right']: 4 }} transition={{ duration: 0.8 }} />
      </div>
    </motion.div>
  );
}

export function LwtRtlGraphic({ lines }: GraphicProps) {
  useCue('pen', lines >= 1, 0.7);
  useCue('pen', lines >= 2, 0.7);
  useCue('whoosh', lines >= 3, 0.5);
  useCue('page', lines >= 4, 0.4);
  return (
    <>
      {lines >= 1 && (
        <Line y={190} dir="ltr" color={TEAL} label="English">
          <span className="font-sans font-bold" style={{ fontSize: 44, lineHeight: 1.3, color: NIGHT }}>hi, Karim</span>
        </Line>
      )}
      {lines >= 2 && (
        <Line y={350} dir="rtl" color={CRIMSON} label="Arabic">
          <Hear id="salam-ya-karim"><span lang="ar" style={{ ...AR, fontSize: 52, lineHeight: 1.2, color: '#8B1A1E' }}>{MESSAGE}</span></Hear>
        </Line>
      )}
      {lines >= 3 && <MirrorPhone key="phone" flipped={lines >= 3} />}
      {lines >= 3 && (
        <motion.span className="pointer-events-none absolute whitespace-nowrap rounded-full font-sans font-black" style={{ left: 1300, top: 680, fontSize: 19, padding: '6px 16px', background: GOLD, color: NIGHT }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>the whole screen mirrors</motion.span>
      )}
      {lines >= 4 && (
        <div className="pointer-events-none absolute flex gap-10" style={{ left: 830, top: 540 }}>
          {[{ hinge: 'left', color: TEAL, label: 'English' }, { hinge: 'right', color: CRIMSON, label: 'عربي' }].map((b, i) => (
            <motion.div key={b.label} className="relative" style={{ width: 110, height: 130 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.3 }}>
              <div className="absolute inset-0 rounded-[6px]" style={{ background: '#F6F1E8', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 16px, rgba(31,22,18,0.14) 16px 18px)' }} />
              <motion.div className="absolute inset-0 rounded-[6px]" style={{ background: b.color, transformOrigin: b.hinge }} initial={{ scaleX: 1 }} animate={{ scaleX: -1 }} transition={{ duration: 1.1, delay: 0.8 + i * 0.3, ease }} />
              <motion.span className="absolute inset-0 flex items-center justify-center font-sans font-black text-white" style={{ fontSize: 18 }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.8 + i * 0.3 }}>{b.label}</motion.span>
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ top: 138, fontSize: 16, color: 'rgba(246,241,232,0.7)' }}>opens on the {b.hinge}</span>
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 1 && lines < 3 && <Cut src={`${CAST}/lina-point`} x={1420} y={840} h={460} flip delay={0.4} />}
      {lines >= 4 && <Cut src={`${CAST}/karim-gotit`} x={1190} y={840} h={300} delay={0.6} />}
    </>
  );
}
