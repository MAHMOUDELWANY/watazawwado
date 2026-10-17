import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from './Art';

/* ---------- scene builds: the painting itself takes part in the explanation ----------
   The paintings are flat images, so nothing in them can move on its own. Instead we stack copies of the same
   painting and reveal parts of it (clip-path) as the teacher steps through the page: a pillar rises in colour out of a
   pencil ghost, a root lights up underground. Each scene gets the motion that matches its idea (build vs grow), in the
   spirit of the reference player, where the letter is drawn and labelled while the teacher explains.
   Coordinates are % of the painting (square images, so they map 1:1 onto a square box). */

const out = [0.23, 1, 0.32, 1] as const;
const src = (name: string) => `/curriculum/zad-kids/l01/${name}.webp`;

/** The painting on the notebook: the white of the image melts into the paper (multiply), so it reads as printed on the page. */
function Plate({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute ${className}`} style={{ mixBlendMode: 'multiply', isolation: 'isolate' }}>
      {children}
    </div>
  );
}

/** The paintings' background is cream (253,252,245); lifting it to pure white makes multiply leave the paper untouched. */
const PAPER_WHITE = 'brightness(1.045)';

function Layer({ name, style, filter, ...rest }: { name: string; style?: React.CSSProperties; filter?: string } & React.ComponentProps<typeof motion.img>) {
  return <motion.img src={src(name)} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-contain" style={{ filter: filter ?? PAPER_WHITE, ...style }} {...rest} />;
}

/* ---------- Islam: five pillars hold up the house ---------- */

/** Pillar columns in pillars.webp (left/right edge, %), shaft from the capital top to the base. */
const COLUMNS = [[7.8, 24.5], [24.9, 41.4], [42.1, 58.5], [59.4, 75.8], [76.2, 92.6]];
const SHAFT_TOP = 53.2;
const SHAFT_BOTTOM = 90.8;

/** Each build step raises one pillar out of the sketch; when all five stand, the house above lights up. */
export function PillarsBuild({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const standing = labels.filter(Boolean).length;
  const done = standing === COLUMNS.length;
  return (
    <div className="absolute left-[690px] top-[96px] h-[720px] w-[720px]" role="img" aria-label={`${label}: ${standing} of 5 pillars standing`}>
      <Plate className="inset-0">
        {/* The whole house as a pencil sketch: it waits for its pillars. */}
        <Layer name="pillars" filter="grayscale(1) brightness(1.06)" style={{ opacity: 0.38 }} />
        {/* The house in colour, once everything stands. */}
        <Layer
          name="pillars"
          style={{ clipPath: `inset(0 0 ${100 - SHAFT_TOP}% 0)` }}
          initial={false}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: reduce ? 0.3 : 0.9, delay: done && !reduce ? 0.7 : 0, ease: out }}
        />
        {COLUMNS.map(([l, r], i) =>
          labels[i] ? (
            <Layer
              key={i}
              name="pillars"
              initial={reduce ? { opacity: 0 } : { clipPath: `inset(${SHAFT_BOTTOM}% ${100 - r}% ${100 - SHAFT_BOTTOM}% ${l}%)`, transform: 'translateY(36px)' }}
              animate={reduce ? { opacity: 1 } : { clipPath: `inset(${SHAFT_TOP}% ${100 - r}% ${100 - SHAFT_BOTTOM}% ${l}%)`, transform: 'translateY(0px)' }}
              style={reduce ? { clipPath: `inset(${SHAFT_TOP}% ${100 - r}% ${100 - SHAFT_BOTTOM}% ${l}%)` } : undefined}
              transition={{ duration: reduce ? 0.3 : 0.85, ease: out }}
            />
          ) : null,
        )}
        {/* Light on: the lantern and the two windows glow when the house is complete. */}
        {done && (
          <>
            {[{ x: 50, y: 25.5, s: 26 }, { x: 22.8, y: 39.5, s: 16 }, { x: 77.2, y: 39.5, s: 16 }].map((g, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{ left: `${g.x - g.s / 2}%`, top: `${g.y - g.s / 2}%`, width: `${g.s}%`, height: `${g.s}%`, background: 'radial-gradient(circle, rgba(255,214,120,0.85), rgba(255,190,90,0) 65%)', mixBlendMode: 'screen' }}
                initial={{ opacity: 0 }}
                animate={reduce ? { opacity: 0.8 } : { opacity: [0, 1, 0.7, 0.9] }}
                transition={{ duration: reduce ? 0.4 : 2.2, delay: reduce ? 0 : 1.1 + i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </>
        )}
      </Plate>

      {/* Empty sockets: a dashed outline and a question mark where a pillar is still missing. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {COLUMNS.map(([l, r], i) =>
          labels[i] ? null : (
            <motion.rect
              key={i}
              x={l + 1.2} y={SHAFT_TOP + 0.6} width={r - l - 2.4} height={SHAFT_BOTTOM - SHAFT_TOP - 1.2} rx={1.6}
              fill="rgba(255,253,247,0.35)" stroke={P.copper} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="7 7" vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
            />
          ),
        )}
      </svg>
      {COLUMNS.map(([l, r], i) =>
        labels[i] ? null : (
          <span key={i} aria-hidden="true" className="absolute -translate-x-1/2 -translate-y-1/2 font-serif text-[46px] font-bold" style={{ left: `${(l + r) / 2}%`, top: '71%', color: P.copper, opacity: 0.45 }}>
            ?
          </span>
        ),
      )}

      {/* Rising pillar: a gold light runs up the shaft, a little dust settles at its foot. */}
      {!reduce &&
        COLUMNS.map(([l, r], i) =>
          labels[i] ? (
            <React.Fragment key={i}>
              <span className="pointer-events-none absolute overflow-hidden" style={{ left: `${l}%`, width: `${r - l}%`, top: `${SHAFT_TOP}%`, height: `${SHAFT_BOTTOM - SHAFT_TOP}%`, mixBlendMode: 'screen' }}>
                <motion.span
                  className="absolute inset-x-0 h-1/2"
                  style={{ background: 'linear-gradient(0deg, rgba(255,226,150,0), rgba(255,226,150,0.75), rgba(255,226,150,0))' }}
                  initial={{ transform: 'translateY(220%)' }}
                  animate={{ transform: 'translateY(-120%)' }}
                  transition={{ duration: 1.1, delay: 0.45, ease: [0.77, 0, 0.175, 1] }}
                />
              </span>
              {[-1, -0.6, -0.25, 0.25, 0.6, 1].map((d, k) => (
                <motion.span
                  key={k}
                  className="pointer-events-none absolute h-[7px] w-[7px] rounded-full"
                  style={{ left: `${(l + r) / 2}%`, top: `${SHAFT_BOTTOM}%`, background: P.sandDeep }}
                  initial={{ opacity: 0.9, transform: 'translate(0px, 0px) scale(1)' }}
                  animate={{ opacity: 0, transform: `translate(${d * 70}px, ${-14 - Math.abs(d) * 16}px) scale(0.6)` }}
                  transition={{ duration: 0.9, delay: 0.5, ease: out }}
                />
              ))}
            </React.Fragment>
          ) : null,
        )}

      {/* Names: a number on the capital, the name on the shaft. */}
      {COLUMNS.map(([l, r], i) =>
        labels[i] ? (
          <React.Fragment key={i}>
            <motion.span
              className="pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white font-sans text-[18px] font-bold text-white"
              style={{ left: `${(l + r) / 2}%`, top: `${SHAFT_TOP + 4.5}%`, background: P.crimson, boxShadow: '0 6px 14px -6px rgba(30,20,16,0.6)' }}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={reduce ? { duration: 0.2 } : { type: 'spring', duration: 0.5, bounce: 0.3, delay: 0.75 }}
            >
              {i + 1}
            </motion.span>
            <motion.span
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 font-sans text-[20px] font-bold shadow-[0_8px_18px_-10px_rgba(30,20,16,0.7)]"
              style={{ left: `${(l + r) / 2}%`, top: '77%', background: '#FFFDF7', color: P.ink }}
              initial={{ opacity: 0, transform: 'translateY(10px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }}
              transition={{ duration: reduce ? 0.2 : 0.45, delay: reduce ? 0 : 0.85, ease: out }}
            >
              {labels[i]}
            </motion.span>
          </React.Fragment>
        ) : null,
      )}

      {/* Progress the child can count along with. */}
      <div className="absolute inset-x-0 -bottom-[6px] flex items-center justify-center gap-3" aria-hidden="true">
        {COLUMNS.map((_, i) => (
          <motion.span
            key={i}
            className="h-3 w-10 rounded-full"
            initial={false}
            animate={{ background: labels[i] ? P.gold : 'rgba(139,73,53,0.18)' }}
            transition={{ duration: 0.3 }}
          />
        ))}
        <span className="ms-2 font-sans text-[20px] font-bold tabular-nums" style={{ color: done ? P.teal : P.inkSoft }}>
          {done ? 'The house stands' : `${standing} of 5`}
        </span>
      </div>
    </div>
  );
}

/* ---------- Iman: roots you cannot see hold up the tree ---------- */

const TRUNK = { x: 50, y: 56 };
/** Where each root ends (the label sits on its tip), and how far the light spreads around it. */
const ROOT_TIPS = [
  { x: 50, y: 74, r: 13 },
  { x: 27, y: 66, r: 13 },
  { x: 73, y: 66, r: 13 },
  { x: 17, y: 80, r: 13 },
  { x: 83, y: 80, r: 13 },
  { x: 50, y: 89, r: 12 },
];
const SOIL_TOP = 55.5;
/** The soil is a half bowl under the grass line; shading only it keeps the white page around it clean. */
const SOIL: React.CSSProperties = {
  clipPath: 'ellipse(47.5% 41% at 50% 55%)',
  WebkitMaskImage: `linear-gradient(180deg, transparent ${SOIL_TOP}%, #000 ${SOIL_TOP + 1.5}%)`,
  maskImage: `linear-gradient(180deg, transparent ${SOIL_TOP}%, #000 ${SOIL_TOP + 1.5}%)`,
};

/** The tree is always in view (what people see). Underground stays dark until each part of Iman lights a root. */
export function RootsGrow({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const lit = labels.filter(Boolean).length;
  const done = lit === ROOT_TIPS.length;
  return (
    <div className="absolute left-[690px] top-[96px] h-[720px] w-[720px]" role="img" aria-label={`${label}: ${lit} of 6 roots lit`}>
      <Plate className="inset-0">
        <Layer name="roots" />
        {/* Underground in shadow: you cannot see what the heart believes. */}
        <Layer
          name="roots"
          filter="brightness(0.28) saturate(0.45)"
          style={SOIL}
          initial={false}
          animate={{ opacity: done ? 0.15 : 1 }}
          transition={{ duration: 1.2, delay: done && !reduce ? 1.2 : 0, ease: out }}
        />
        {ROOT_TIPS.map((t, i) =>
          labels[i] ? (
            <Layer
              key={i}
              name="roots"
              initial={reduce ? { opacity: 0, clipPath: `circle(${t.r}% at ${t.x}% ${t.y}%)` } : { clipPath: `circle(0% at ${t.x}% ${t.y}%)` }}
              animate={{ opacity: 1, clipPath: `circle(${t.r}% at ${t.x}% ${t.y}%)` }}
              transition={{ duration: reduce ? 0.3 : 1.1, delay: reduce ? 0 : 0.55, ease: out }}
            />
          ) : null,
        )}
        {/* When the roots are full of light, it flows up the trunk into the tree. */}
        {done && !reduce && (
          <motion.span
            className="absolute rounded-full"
            style={{ left: '38%', width: '24%', height: '24%', background: 'radial-gradient(circle, rgba(255,222,140,0.9), rgba(255,200,100,0) 65%)', mixBlendMode: 'screen' }}
            initial={{ top: '50%', opacity: 0 }}
            animate={{ top: ['50%', '36%', '18%'], opacity: [0, 1, 0] }}
            transition={{ duration: 2.2, delay: 1.3, ease: 'easeInOut' }}
          />
        )}
      </Plate>

      {/* The light travelling down from the trunk to each root tip. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {ROOT_TIPS.map((t, i) =>
          labels[i] && !reduce ? (
            <motion.path
              key={i}
              d={`M${TRUNK.x} ${TRUNK.y} Q ${(TRUNK.x + t.x) / 2 + (t.x - TRUNK.x) * 0.15} ${t.y - 2} ${t.x} ${t.y}`}
              fill="none" stroke="#FFE7A3" strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,210,120,0.9))' }}
              initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }}
              transition={{ pathLength: { duration: 0.6, ease: out }, opacity: { duration: 1.8, times: [0, 0.6, 1] } }}
            />
          ) : null,
        )}
      </svg>

      {ROOT_TIPS.map((t, i) =>
        labels[i] ? (
          <motion.span
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-4 py-1.5 font-sans text-[21px] font-bold shadow-[0_10px_22px_-10px_rgba(0,0,0,0.8)]"
            style={{ left: `${t.x}%`, top: `${t.y}%`, background: '#FFFDF7', color: P.copper }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0.2 : 0.4, delay: reduce ? 0 : 0.7, ease: out }}
          >
            {labels[i]}
          </motion.span>
        ) : null,
      )}

      <span className="absolute left-[7%] top-[59%] font-sans text-[18px] font-bold uppercase tracking-[0.12em]" style={{ color: '#F3E6CC', opacity: done ? 0 : 0.85 }} aria-hidden="true">
        Hidden in the heart
      </span>
      <span className="absolute left-[2%] top-[6%] font-sans text-[18px] font-bold uppercase tracking-[0.12em]" style={{ color: P.teal }} aria-hidden="true">
        What people see
      </span>
    </div>
  );
}

/* ---------- clues: a magnifying lens on the detail the child just found ---------- */

export type Lens = {
  /** the detail, % of the image */ x: number; y: number;
  /** where the lens (or, for `ring`, the label) sits, % of the box */ lx: number; ly: number;
  label: string;
  /** No magnifier: circle the spot in red pen where it is (for details that are a whole figure, not a small thing). */
  ring?: { w: number; h: number };
};

/**
 * A round lens that magnifies one spot of the painting, with a leader line to the spot and a red pen circle around it,
 * like a teacher marking the clue. `box` is the painting's frame; the image fills it like object-fit: cover.
 */
export function ClueLens({ name, img, box, lens }: { name: string; img: { w: number; h: number }; box: { w: number; h: number }; lens: Lens }) {
  const reduce = useReducedMotion();
  const D = 210;
  const zoom = 2.2;
  const s = Math.max(box.w / img.w, box.h / img.h);
  const W = img.w * s;
  const H = img.h * s;
  const px = (((box.w - W) / 2 + (lens.x / 100) * W) / box.w) * 100;
  const py = (((box.h - H) / 2 + (lens.y / 100) * H) / box.h) * 100;
  if (lens.ring) {
    const { w, h } = lens.ring;
    return (
      <>
        <svg className="pointer-events-none absolute overflow-visible" style={{ left: `${px}%`, top: `${py}%`, width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2 }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path
            d="M55 3 C84 4 98 26 97 52 C96 80 73 98 47 97 C20 96 3 75 4 48 C5 22 24 4 48 4 L62 9"
            fill="none" stroke={P.crimson} strokeWidth={5} strokeLinecap="round" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: out }}
          />
        </svg>
        <motion.span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-5 py-2 font-sans text-[24px] font-bold shadow-[0_10px_24px_-12px_rgba(30,20,16,0.6)]"
          style={{ left: `${lens.lx}%`, top: `${lens.ly}%`, background: '#FFFDF7', color: P.crimson }}
          initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ delay: reduce ? 0 : 0.6, duration: 0.35, ease: out }}
        >
          {lens.label}
        </motion.span>
      </>
    );
  }
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <motion.line
          x1={px} y1={py} x2={lens.lx} y2={lens.ly} stroke="#FFFDF7" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: out }}
        />
      </svg>
      <motion.span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white"
        style={{ left: `${px}%`, top: `${py}%`, background: P.crimson }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      />
      <motion.div
        className="pointer-events-none absolute"
        style={{ left: `${lens.lx}%`, top: `${lens.ly}%`, width: D, height: D, marginLeft: -D / 2, marginTop: -D / 2 }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.92)' }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'scale(1)' }}
        transition={{ duration: 0.45, delay: reduce ? 0 : 0.25, ease: out }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full border-[6px] border-[#FFFDF7] shadow-[0_18px_40px_-14px_rgba(20,12,8,0.75)]" style={{ background: P.sand }}>
          <img
            src={src(name)} alt="" aria-hidden="true" draggable={false}
            className="absolute max-w-none"
            style={{ width: W * zoom, height: H * zoom, left: D / 2 - (lens.x / 100) * W * zoom, top: D / 2 - (lens.y / 100) * H * zoom }}
          />
        </div>
        <svg className="absolute -left-5 -top-5 h-[250px] w-[250px] overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
          <motion.path
            d="M52 4 C80 3 97 24 96 50 C95 78 74 97 48 96 C22 95 4 76 4 50 C4 27 20 7 44 5 L58 8"
            fill="none" stroke={P.crimson} strokeWidth={2.4} strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: reduce ? 0 : 0.55, ease: out }}
          />
        </svg>
        <motion.span
          className="absolute left-1/2 top-full mt-6 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-sans text-[24px] font-bold shadow-[0_10px_24px_-12px_rgba(30,20,16,0.6)]"
          style={{ background: '#FFFDF7', color: P.crimson }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.9, duration: 0.35 }}
        >
          {lens.label}
        </motion.span>
      </motion.div>
    </>
  );
}
