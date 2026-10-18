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
/** A painting by name: Lesson 1 names are bare ('lego'), later lessons give their folder ('l02/sky'). */
const src = (name: string) => `/curriculum/zad-kids/${name.includes('/') ? name : `l01/${name}`}.webp`;

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
  const newest = standing - 1;
  return (
    <div className="absolute left-[690px] top-[96px] h-[720px] w-[720px]" role="img" aria-label={`${label}: ${standing} of 5 pillars standing`}>
      <Plate className="inset-0">
        {/* The roof and the base as a pencil sketch, with nothing between them: the house waits for its pillars. */}
        <Layer name="pillars" filter="grayscale(1) brightness(1.06)" style={{ opacity: 0.38, clipPath: `inset(0 0 ${100 - SHAFT_TOP}% 0)` }} />
        <Layer name="pillars" filter="grayscale(1) brightness(1.06)" style={{ opacity: 0.38, clipPath: `inset(${SHAFT_BOTTOM}% 0 0 0)` }} />
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
              {[-1, -0.4, 0.4, 1].map((d, k) => (
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
            {/* The pillar just raised wears a dark tag until the next one comes, so the child's eye knows where to look. */}
            <motion.span
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 font-sans text-[23px] font-bold shadow-[0_8px_18px_-10px_rgba(30,20,16,0.7)]"
              style={{ left: `${(l + r) / 2}%`, top: '76.5%' }}
              initial={{ opacity: 0, transform: 'translateY(10px)', background: P.ink, color: '#FFF3D6' }}
              animate={{ opacity: 1, transform: 'translateY(0px)', background: i === newest && !done ? P.ink : '#FFFDF7', color: i === newest && !done ? '#FFF3D6' : P.ink }}
              transition={{ duration: reduce ? 0.2 : 0.45, delay: reduce ? 0 : i === newest ? 0.85 : 0, ease: out }}
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
        <span className="ms-2 font-sans text-[22px] font-bold tabular-nums" style={{ color: done ? P.teal : P.inkSoft }} aria-live="polite">
          {done ? 'Five pillars: the house stands' : standing ? `Pillar ${standing} of 5: ${labels[newest]}` : '0 of 5 pillars'}
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

/** The tree is always in view (what people see); a pencil ground line and two brackets name the halves from the start.
 *  Underground stays dark until each part of Iman lights its root: a line of light runs from the trunk to the tip and
 *  stays, so every belief is visibly joined to the tree. At six the soil lifts and the light rises into the tree. */
export function RootsGrow({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const lit = labels.filter(Boolean).length;
  const done = lit === ROOT_TIPS.length;
  const newest = lit - 1;
  return (
    <div className="absolute left-[690px] top-[64px] h-[720px] w-[720px]" role="img" aria-label={`${label}: ${lit} of 6 roots lit`}>
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
        {/* Each lit root: the painting shows through a soft-edged window around the tip. */}
        {ROOT_TIPS.map((t, i) =>
          labels[i] ? (
            <Layer
              key={i}
              name="roots"
              style={{ WebkitMaskImage: `radial-gradient(circle ${t.r * 7.2}px at ${t.x}% ${t.y}%, #000 35%, transparent 100%)`, maskImage: `radial-gradient(circle ${t.r * 7.2}px at ${t.x}% ${t.y}%, #000 35%, transparent 100%)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0.3 : 0.9, delay: reduce ? 0 : 0.5, ease: out }}
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

      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {/* The ground line: above it is what people see, below it what the heart holds. */}
        <motion.path
          d={`M3 ${SOIL_TOP} L97 ${SOIL_TOP}`} fill="none" stroke={P.copper} strokeOpacity={0.7} strokeWidth={2.5} strokeDasharray="9 9" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: out }}
        />
        {/* A root of light from the trunk to each belief; it stays, so the tree is visibly joined to all of them. */}
        {ROOT_TIPS.map((t, i) =>
          labels[i] ? (
            <motion.path
              key={i}
              d={`M${TRUNK.x} ${TRUNK.y} Q ${(TRUNK.x + t.x) / 2 + (t.x - TRUNK.x) * 0.15} ${t.y - 2} ${t.x} ${t.y}`}
              fill="none" stroke="#FFE7A3" strokeWidth={3.5} strokeLinecap="round" vectorEffect="non-scaling-stroke"
              style={{ filter: 'drop-shadow(0 0 5px rgba(255,210,120,0.85))' }}
              initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1, opacity: i === newest || done ? 1 : 0.6 }}
              transition={{ pathLength: { duration: reduce ? 0 : 0.7, ease: out }, opacity: { duration: 0.4 } }}
            />
          ) : null,
        )}
      </svg>

      {/* The belief just named wears gold until the next one comes. */}
      {ROOT_TIPS.map((t, i) =>
        labels[i] ? (
          <motion.span
            key={i}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-4 py-1.5 font-sans text-[23px] font-bold shadow-[0_10px_22px_-10px_rgba(0,0,0,0.8)]"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            initial={{ opacity: 0, scale: 0.9, background: P.gold, color: P.ink }}
            animate={{ opacity: 1, scale: 1, background: i === newest && !done ? P.gold : '#FFFDF7', color: i === newest && !done ? P.ink : P.copper }}
            transition={{ duration: reduce ? 0.2 : 0.4, delay: reduce ? 0 : i === newest ? 0.7 : 0, ease: out }}
          >
            {labels[i]}
          </motion.span>
        ) : null,
      )}

      {/* Two brackets beside the picture name its halves before anything is lit. */}
      {[
        { top: 20, bottom: 54, text: 'What people see', color: P.teal },
        { top: 57, bottom: 95, text: 'Hidden in the heart', color: P.copper },
      ].map((b) => (
        <div key={b.text} className="pointer-events-none absolute left-[calc(100%+14px)] flex items-center gap-3" style={{ top: `${b.top}%`, height: `${b.bottom - b.top}%` }} aria-hidden="true">
          <span className="h-full w-3 shrink-0 rounded-r-[10px] border-[3px] border-l-0" style={{ borderColor: b.color }} />
          <span className="w-[140px] font-sans text-[21px] font-bold leading-tight" style={{ color: b.color }}>{b.text}</span>
        </div>
      ))}

      <div className="absolute inset-x-0 -bottom-[40px] flex items-center justify-center gap-3" aria-hidden="true">
        <span className="font-sans text-[22px] font-bold tabular-nums" style={{ color: done ? P.teal : P.inkSoft }}>
          {done ? 'Six roots: Iman holds the tree up' : lit ? `Root ${lit} of 6: ${labels[newest]}` : 'Six hidden roots'}
        </span>
      </div>
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

/* ---------- shared pieces for the scenes below ----------
   These scenes work in the painting's own pixels: the box has the painting's aspect ratio, the SVG uses the painting's
   size as its viewBox, and labels are placed with `at`, so a coordinate read off the image file goes straight in. */

type Px = { w: number; h: number };
const at = (img: Px, x: number, y: number): React.CSSProperties => ({ left: `${(x / img.w) * 100}%`, top: `${(y / img.h) * 100}%` });
const DOOR_INK = [P.teal, P.crimson, '#9A6A12'];

/** A line the teacher's pen draws on the picture. */
function Pen({ d, color = P.gold, width = 6, delay = 0, duration = 0.8, dash, glow = false }: { d: string; color?: string; width?: number; delay?: number; duration?: number; dash?: string; glow?: boolean }) {
  const reduce = useReducedMotion();
  const id = `pen${React.useId().replace(/[^\w-]/g, '')}`;
  const draw = {
    initial: { pathLength: reduce ? 1 : 0, opacity: reduce ? 0 : 1 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: [0.65, 0, 0.35, 1] as const }, opacity: { duration: 0.3, delay: reduce ? 0 : delay } },
  };
  const style = glow ? { filter: 'drop-shadow(0 0 8px rgba(255,214,120,0.85))' } : undefined;
  // pathLength drives stroke-dasharray itself, so a dashed line is drawn by revealing it through a solid stroke mask.
  if (dash)
    return (
      <g style={style}>
        <mask id={id} maskUnits="userSpaceOnUse">
          <motion.path d={d} fill="none" stroke="#fff" strokeWidth={width + 8} strokeLinecap="round" strokeLinejoin="round" {...draw} />
        </mask>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} mask={`url(#${id})`} />
      </g>
    );
  return <motion.path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={style} {...draw} />;
}

/** A paper label pinned to the picture; `ar` adds the Arabic word above the English. */
function Tag({ style, children, ar, color = P.crimson, delay = 0, size = 22 }: { style: React.CSSProperties; children: React.ReactNode; ar?: string; color?: string; delay?: number; size?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center whitespace-nowrap rounded-[18px] px-4 py-1.5 text-center font-sans font-bold leading-tight shadow-[0_10px_24px_-12px_rgba(30,20,16,0.7)]"
      style={{ background: '#FFFDF7', color, fontSize: size, ...style }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.2 : 0.4, delay: reduce ? 0 : delay, ease: out }}
    >
      {ar && <span lang="ar" dir="rtl" className="font-serif text-[1.35em] font-bold leading-[1.3]">{ar}</span>}
      {children}
    </motion.span>
  );
}

/** Build progress handed to a scene: how many lines and items are out, and whether the evidence / question is. */
export type Built = { lines: number; items: number; evidence: boolean; interaction: boolean };

/** A framed print of a painting on the notebook page, 4:3, right of the text column. */
function Print({ name, children, label }: { name: string; children?: React.ReactNode; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px]" role="img" aria-label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]">
        <Layer name={name} filter="none" initial={reduce ? false : { scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: out }} />
      </div>
      {children}
    </div>
  );
}

/* ---------- p6 How he sat: a posture study, annotated like a teacher's sketch ---------- */

const SIT: Px = { w: 1400, h: 1050 };

/** Each line marks one part of the visitor's adab on the painting; the Arabic words join the marks with the evidence;
 *  the question dims the room and draws the "learning seat" (straight back, steady base) the child is about to copy. */
export function SittingStudy({ v, label }: { v: Built; label: string }) {
  return (
    <Print name="sitting" label={label}>
      <motion.div className="absolute inset-0 rounded-[28px]" style={{ background: 'rgba(30,20,16,0.4)' }} initial={false} animate={{ opacity: v.interaction ? 1 : 0 }} transition={{ duration: 0.6 }} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${SIT.w} ${SIT.h}`} preserveAspectRatio="none" aria-hidden="true">
        {v.lines >= 1 && (
          <>
            {/* Close: from where he sits, straight on toward the one he came to learn from. */}
            <Pen d="M640 700 C720 650 800 610 925 585" color={P.crimson} width={9} dash="4 20" duration={0.7} />
            <Pen d="M892 556 L930 584 L896 618" color={P.crimson} width={9} delay={0.6} duration={0.3} />
          </>
        )}
        {v.lines >= 2 && <Pen d="M792 705 C850 700 868 760 828 790 C790 818 738 790 742 748 C745 718 770 704 805 706" color={P.crimson} width={7} />}
        {v.interaction && (
          <>
            <Pen d="M527 205 L548 470 L560 700" color={P.gold} width={8} glow />
            <Pen d="M185 905 L960 920" color={P.gold} width={8} delay={0.5} glow />
            <Pen d="M560 700 L185 905 M560 700 L960 920" color={P.gold} width={4} dash="10 12" delay={0.9} />
          </>
        )}
      </svg>
      {v.lines >= 1 && <Tag style={at(SIT, 1110, 520)} ar={v.evidence ? 'رُكبَتَيه إلى رُكبَتَيه' : undefined} delay={0.7}>Close, knee to knee</Tag>}
      {v.lines >= 2 && <Tag style={at(SIT, 1120, 880)} ar={v.evidence ? 'كَفَّيه على فخِذَيه' : undefined} delay={0.6}>Hands still, on his thighs</Tag>}
      {v.interaction && <Tag style={at(SIT, 290, 150)} color={P.teal} delay={1.2}>A learning seat</Tag>}
    </Print>
  );
}

/* ---------- p8 the "aha": an earlier picture comes back as the answer is revealed ---------- */

/** A print of an earlier page's painting, pinned beside the answer when the teacher opens it, so the child sees the
 *  link (the visitor asking what he knew = Ms. Clarke asking the class) instead of only hearing it. */
export function Callback({ name, caption }: { name: string; caption: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute left-[1170px] top-[290px] h-[255px] w-[340px]" aria-hidden="true">
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[14px] border-[8px] border-[#FFFDF7] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.75)]"
        initial={reduce ? { opacity: 0, rotate: 3 } : { opacity: 0, y: 40, rotate: 9 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: reduce ? 0.3 : 0.7, ease: out }}
      >
        <img src={src(name)} alt="" draggable={false} className="h-full w-full select-none object-cover" />
      </motion.div>
      <Tag style={{ left: '50%', top: 'calc(100% + 34px)' }} color={P.teal} delay={0.6} size={24}>{caption}</Tag>
    </div>
  );
}

/* ---------- p10 Ihsan: her best work, even when the room goes quiet ---------- */

const DRAW: Px = { w: 1400, h: 1050 };

/** The card she is making is ringed, then the heart she is colouring is traced; at the question the room goes dark
 *  ("nobody is looking") and only her work keeps its light. */
export function IhsanLight({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  return (
    <Print name="drawing" label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px]">
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 30% 34% at 48% 62%, rgba(8,14,20,0) 0%, rgba(8,14,20,0.4) 55%, rgba(8,14,20,0.88) 100%)' }}
          initial={false} animate={{ opacity: v.interaction ? 1 : 0 }} transition={{ duration: reduce ? 0.3 : 1.6, ease: 'easeInOut' }}
        />
        {v.interaction && !reduce && (
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ ...at(DRAW, 700, 720), width: '40%', height: '36%', background: 'radial-gradient(circle, rgba(255,224,150,0.5), rgba(255,200,110,0) 65%)', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7, 1] }} transition={{ duration: 3, delay: 1, ease: 'easeInOut' }}
          />
        )}
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${DRAW.w} ${DRAW.h}`} preserveAspectRatio="none" aria-hidden="true">
        {v.lines >= 1 && <Pen d="M470 676 L930 668 L1080 805 L512 862 Z" color="#FFFDF7" width={6} dash="3 14" duration={1.1} />}
        {v.lines >= 2 && <Pen d="M578 712 C560 680 515 682 520 715 C525 745 560 760 580 772 C600 760 630 740 630 712 C630 685 590 682 578 712" color={P.crimson} width={7} duration={1} />}
      </svg>
      {v.lines >= 1 && <Tag style={at(DRAW, 1170, 600)} color={P.inkSoft} delay={1}>A card for Mum</Tag>}
      {v.lines >= 2 && <Tag style={at(DRAW, 330, 900)} delay={0.9}>Her very best</Tag>}
      {v.interaction && (
        <motion.span
          className="pointer-events-none absolute left-1/2 top-[8%] -translate-x-1/2 whitespace-nowrap font-sans text-[24px] font-bold uppercase tracking-[0.14em]"
          style={{ color: '#F3E6CC' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ duration: 0.8, delay: reduce ? 0 : 1 }}
        >
          Nobody is looking
        </motion.span>
      )}
    </Print>
  );
}

/* ---------- p11–p12 the reveal: a veil over the courtyard, opened a little at a time ---------- */

/** reveal.webp drawn full-bleed (cover) on the 1600 × 900 canvas: x of the column of light, and where it meets the sand. */
const COL_X = 994;
const COL_BASE = 844;
const VEIL = 'rgba(6,12,28,0.96)';
const panel = (side: 'l' | 'r'): React.CSSProperties => ({
  background: `linear-gradient(${side === 'l' ? 90 : 270}deg, ${VEIL} 0%, ${VEIL} calc(100% - 90px), rgba(6,12,28,0) 100%)`,
  // Each panel reaches 200px past its outer edge, so pushing it toward the slit never uncovers the sides.
  ...(side === 'l' ? { left: -200, width: COL_X + 200 } : { left: COL_X, right: -200 }),
});

/**
 * p11 ("Do you know who he was?") keeps the courtyard behind a dark veil; each step opens the slit a little, and the
 * Prophet's ﷺ question is drawn as a question mark of light. p12 ("It was Jibril!") parts the veil: the column of light
 * blooms, his name is written beside it, and the three things he came to teach rise out of it.
 */
export function Unveil({ revealed, step, v, name, teach }: {
  revealed: boolean; step: number; v: Built;
  name?: { arabic: string; translit: string; meaning: string };
  teach: { label: string; arabic?: string }[];
}) {
  const reduce = useReducedMotion();
  const open = revealed && v.lines >= 1;
  const gap = revealed ? 80 : 10 + step * 14;
  const inset = 60 - gap / 2;
  const slide = { duration: reduce ? 0.3 : open ? 1.6 : 0.9, ease: [0.65, 0, 0.35, 1] as const };
  return (
    <>
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.img
          src={src('reveal')} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover"
          initial={reduce ? false : { scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: revealed ? 6 : 12, ease: 'easeOut' }}
        />
        {/* Once the veil is gone, the text side keeps a soft shade so the words stay readable on the painting. */}
        <motion.div
          className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(6,12,28,0.88) 0%, rgba(6,12,28,0.72) 40%, rgba(6,12,28,0) 62%)' }}
          initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 1, delay: open && !reduce ? 0.8 : 0 }}
        />
        <motion.div className="absolute inset-y-0" style={panel('l')} initial={false} animate={{ x: open ? -(COL_X + 160) : inset }} transition={slide} />
        <motion.div className="absolute inset-y-0" style={panel('r')} initial={false} animate={{ x: open ? 1600 - COL_X + 160 : -inset }} transition={slide} />
        {/* Light leaking through the slit; it breathes while the child guesses. */}
        {!open && (
          <motion.span
            className="absolute top-0 h-full"
            style={{ left: COL_X - 70, width: 140, background: 'radial-gradient(ellipse 50% 60% at 50% 72%, rgba(255,214,120,0.55), rgba(255,214,120,0) 70%)', mixBlendMode: 'screen' }}
            initial={false}
            animate={v.interaction && !reduce ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.45 + step * 0.08 }}
            transition={v.interaction && !reduce ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 }}
          />
        )}
        {open && !reduce && (
          <>
            <motion.span
              className="absolute rounded-full"
              style={{ left: COL_X - 360, top: COL_BASE - 300, width: 720, height: 520, background: 'radial-gradient(ellipse, rgba(255,226,150,0.75), rgba(255,200,100,0) 65%)', mixBlendMode: 'screen' }}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 0.55], scale: 1 }} transition={{ duration: 2.4, delay: 0.9, ease: out }}
            />
            {/* One rise of light as the veil parts, then stillness, so it never competes with the words. */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute h-[6px] w-[6px] rounded-full"
                style={{ left: COL_X + ((i * 37) % 90) - 45, top: COL_BASE - 20, background: '#FFE7A3', boxShadow: '0 0 10px 3px rgba(255,214,120,0.8)' }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -260 - ((i * 53) % 380) }}
                transition={{ duration: 2.6 + (i % 4) * 0.4, delay: 1 + i * 0.18, ease: 'easeOut' }}
              />
            ))}
          </>
        )}
      </div>

      {/* The Prophet's ﷺ question, drawn as a question mark of light beside the slit. */}
      {!revealed && v.lines >= 2 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1600 900" aria-hidden="true">
          <g transform={`translate(${COL_X + 230} 360)`}>
            <Pen d="M-62 -60 C-62 -150 62 -150 62 -66 C62 -10 0 0 0 54 L0 78" color={P.goldSoft} width={14} duration={1.1} glow />
            <motion.circle cx={0} cy={132} r={12} fill={P.goldSoft} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.15, duration: 0.3 }} />
          </g>
        </svg>
      )}

      {open && name && (
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-[40px] px-10 pb-5 text-center" style={{ left: COL_X + 290, top: 170, textShadow: '0 2px 12px rgba(6,12,28,0.9)', background: 'radial-gradient(ellipse at 50% 50%, rgba(6,12,28,0.75), rgba(6,12,28,0) 72%)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.6, duration: 0.4 }}
        >
          <motion.span
            lang="ar" dir="rtl" className="block font-serif text-[96px] font-bold leading-[1.25]"
            style={{ color: '#FFF3D6', textShadow: '0 0 30px rgba(246,213,142,0.7)' }}
            initial={{ clipPath: reduce ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }}
            transition={{ duration: 1.4, delay: reduce ? 0 : 1.7, ease: 'easeInOut' }}
          >
            {name.arabic}
          </motion.span>
          <span className="block font-sans text-[30px] font-bold" style={{ color: P.goldSoft }}>{name.translit}</span>
          <span className="block font-sans text-[24px] font-semibold" style={{ color: '#F3E6CC' }}>{name.meaning}</span>
        </motion.div>
      )}

      {/* "He came to teach you your religion": its three parts rise out of the light. */}
      {revealed && v.lines >= 2 && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1600 900" aria-hidden="true">
            {teach.map((_, i) => (
              <Pen key={i} d={`M${COL_X + 10} ${660 + i * 30} Q ${COL_X + 120} ${560 + i * 80} 1230 ${510 + i * 100}`} color="#FFE7A3" width={3} delay={i * 0.35} duration={0.7} glow />
            ))}
          </svg>
          {teach.map((t, i) => (
            <Tag key={t.label} style={{ left: 1310, top: 510 + i * 100 }} ar={t.arabic} color={DOOR_INK[i]} delay={0.55 + i * 0.35} size={24}>
              {t.label}
            </Tag>
          ))}
        </>
      )}
    </>
  );
}

/* ---------- p13 Three doors: traced at dusk, then lit one by one ---------- */

const DOORS_IMG: Px = { w: 1400, h: 1050 };
/** The three doorways in cover.webp: frame edges, the arch's spring line and apex, the sill, and the foot of the steps. */
const DOORS = [
  { l: 118, r: 447, spring: 345, apex: { x: 284, y: 136 }, sill: 700, foot: 790, glow: '#5FD0DB' },
  { l: 512, r: 868, spring: 345, apex: { x: 690, y: 116 }, sill: 712, foot: 800, glow: '#FF8A6B' },
  { l: 953, r: 1275, spring: 345, apex: { x: 1113, y: 141 }, sill: 700, foot: 790, glow: '#FFD36E' },
];
type Door = (typeof DOORS)[number];
const archPath = (d: Door) =>
  `M${d.l} ${d.sill} L${d.l} ${d.spring} C${d.l} ${d.spring - 110} ${d.apex.x - 70} ${d.apex.y + 45} ${d.apex.x} ${d.apex.y} C${d.apex.x + 70} ${d.apex.y + 45} ${d.r} ${d.spring - 110} ${d.r} ${d.spring} L${d.r} ${d.sill}`;
const archClip = (d: Door) => {
  const pc = (x: number, y: number) => `${(x / DOORS_IMG.w) * 100}% ${(y / DOORS_IMG.h) * 100}%`;
  return `polygon(${[pc(d.l - 20, d.foot), pc(d.l, d.spring), pc(d.l + (d.apex.x - d.l) * 0.3, d.spring - 120), pc(d.apex.x, d.apex.y - 6), pc(d.r - (d.r - d.apex.x) * 0.3, d.spring - 120), pc(d.r, d.spring), pc(d.r + 20, d.foot)].join(', ')})`;
};

/** The painting starts at dusk. The first line traces the three arches, the second makes the doorways breathe with
 *  light; each item then lights its door, spills light down its steps and hangs its name (Arabic, English, meaning). */
export function DoorsLight({ items, v, label, arabic }: { items: string[]; v: Built; label: string; arabic: (word: string) => string | undefined }) {
  const reduce = useReducedMotion();
  const lit = Math.min(v.items, DOORS.length);
  return (
    <div className="absolute left-[680px] top-[132px] h-[630px] w-[840px]" role="img" aria-label={`${label}: ${lit} of 3 doors open`}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]">
        <Layer name="cover" filter="brightness(0.42) saturate(0.55) sepia(0.2)" />
        {DOORS.map((d, i) =>
          i < lit ? (
            <Layer
              key={i} name="cover" filter="brightness(1.05) saturate(1.1)" style={{ clipPath: archClip(d) }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0.3 : 1.1, ease: out }}
            />
          ) : null,
        )}
        {DOORS.map((d, i) => (
          <motion.span
            key={i} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
            style={{ ...at(DOORS_IMG, (d.l + d.r) / 2, (d.spring + d.sill) / 2), width: `${((d.r - d.l) / DOORS_IMG.w) * 100}%`, height: '42%', background: `radial-gradient(ellipse, ${d.glow}AA, ${d.glow}00 65%)`, mixBlendMode: 'screen' }}
            initial={false}
            animate={{ opacity: i < lit ? 0.9 : v.lines >= 2 ? (reduce ? 0.35 : [0.15, 0.45, 0.15]) : 0 }}
            transition={i >= lit && v.lines >= 2 && !reduce ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.8 }}
          />
        ))}
        {DOORS.map((d, i) =>
          i < lit ? (
            <motion.span
              key={i} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
              style={{ ...at(DOORS_IMG, (d.l + d.r) / 2, d.foot + 20), width: `${((d.r - d.l) / DOORS_IMG.w) * 130}%`, height: '22%', background: 'radial-gradient(ellipse, rgba(255,226,150,0.7), rgba(255,226,150,0) 65%)', mixBlendMode: 'screen' }}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduce ? 0.3 : 1.2, delay: reduce ? 0 : 0.5, ease: out }}
            />
          ) : null,
        )}
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${DOORS_IMG.w} ${DOORS_IMG.h}`} preserveAspectRatio="none" aria-hidden="true">
        {v.lines >= 1 && DOORS.map((d, i) => <Pen key={i} d={archPath(d)} color={P.goldSoft} width={6} delay={i * 0.35} duration={1.2} glow={i < lit} />)}
      </svg>
      {items.slice(0, lit).map((it, i) => {
        const [word, hint] = it.split(':').map((s) => s.trim());
        const d = DOORS[i];
        return (
          <Tag key={it} style={at(DOORS_IMG, (d.l + d.r) / 2, d.foot + 135)} ar={arabic(word)} color={DOOR_INK[i]} delay={0.7}>
            <span className="text-[24px]">{word}</span>
            {hint && <span className="text-[18px] font-semibold" style={{ color: P.inkSoft }}>{hint}</span>}
          </Tag>
        );
      })}
    </div>
  );
}

/* ---------- p15 My Zad: packing today's map into Jiddo's bag ---------- */

const BAG: Px = { w: 1254, h: 1254 };
/** In backpack.webp: the khatam star on the flap, and the three little doors on the map sticking out of the bag (the road runs through them). */
const BAG_STAR = { x: 722, y: 768, r: 46 };
const MAP_DOORS = [{ x: 458, y: 505 }, { x: 608, y: 440 }, { x: 757, y: 480 }];
const STAR_PATH = (() => {
  const { x, y, r } = BAG_STAR;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.62 : r;
    return `${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
})();

/** Line 1 traces the bag's star, line 2 pins the word "zad" to the bag, line 3 lights the map of the three doors and
 *  draws its road; the mission the child picks drops in as a note. */
export function PackZad({ v, word, doors, chosen, label }: {
  v: Built; label: string; chosen: string | null;
  word?: { arabic: string; translit: string; meaning: string };
  doors: { label: string; arabic?: string }[];
}) {
  const reduce = useReducedMotion();
  const mapLit = v.lines >= 3;
  return (
    <div
      className="absolute left-[-5px] top-[110px] h-[690px] w-[690px]" role="img" aria-label={label}
      style={{ maskImage: 'linear-gradient(270deg, transparent 0, #000 140px)', WebkitMaskImage: 'linear-gradient(270deg, transparent 0, #000 140px)' }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-r-[40px]">
        <Layer name="backpack" filter="none" initial={reduce ? false : { scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: out }} />
        {/* The map waits in shadow until today's lesson is "packed". */}
        <motion.div
          className="absolute" style={{ left: '26%', top: '24%', width: '48%', height: '28%', background: 'radial-gradient(ellipse, rgba(40,24,14,0.62), rgba(40,24,14,0) 70%)' }}
          initial={false} animate={{ opacity: mapLit ? 0 : 1 }} transition={{ duration: 0.8 }}
        />
        {mapLit && !reduce && (
          <motion.span
            className="absolute rounded-full" style={{ left: '22%', top: '18%', width: '56%', height: '40%', background: 'radial-gradient(ellipse, rgba(255,226,150,0.65), rgba(255,226,150,0) 65%)', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5] }} transition={{ duration: 2, ease: out }}
          />
        )}
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${BAG.w} ${BAG.h}`} preserveAspectRatio="none" aria-hidden="true">
        {v.lines >= 1 && <Pen d={STAR_PATH} color={P.goldSoft} width={5} duration={1.2} glow />}
        {mapLit && (
          <Pen
            d={`M405 590 C440 570 430 545 ${MAP_DOORS[0].x} 548 C520 552 560 520 ${MAP_DOORS[1].x} 518 C650 516 700 540 ${MAP_DOORS[2].x} 540 C800 540 830 565 860 560`}
            color={P.crimson} width={6} dash="10 12" duration={1.6} delay={0.4}
          />
        )}
      </svg>
      {v.lines >= 1 && <Tag style={at(BAG, 722, 900)} color={P.copper} delay={1} size={20}>Jiddo's travel bag</Tag>}
      {v.lines >= 2 && word && (
        <Tag style={at(BAG, 990, 1110)} ar={word.arabic} color={P.copper} delay={0.3} size={20}>
          <span>{word.translit}</span>
          <span className="text-[16px] font-semibold" style={{ color: P.inkSoft }}>{word.meaning}</span>
        </Tag>
      )}
      {/* One tag in the gap above the map, so the children's faces stay clear. */}
      {mapLit && (
        <Tag style={at(BAG, 640, 262)} color={P.ink} delay={1.2} size={19}>
          <span className="flex gap-2">
            {doors.map((d, i) => <span key={d.label} style={{ color: DOOR_INK[i] }}>{d.label}</span>)}
          </span>
        </Tag>
      )}
      {chosen && (
        <motion.div
          key={chosen}
          className="pointer-events-none absolute max-w-[300px] rounded-[10px] px-4 py-3 font-sans text-[19px] font-bold leading-snug shadow-[0_14px_30px_-14px_rgba(30,20,16,0.8)]"
          style={{ left: '4%', top: '79%', background: '#FFF6D8', color: P.ink, rotate: '-4deg', borderTop: `6px solid ${P.gold}` }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduce ? { duration: 0.2 } : { type: 'spring', duration: 0.6, bounce: 0.25 }}
        >
          <span className="block text-[15px] uppercase tracking-[0.12em]" style={{ color: P.copper }}>My mission</span>
          {chosen}
        </motion.div>
      )}
    </div>
  );
}

/* ---------- Lesson 2: Who Made It All? ---------- */

const L2: Px = { w: 1448, h: 1086 };
const WAYS = ['It popped out of nothing', 'The bricks built themselves', 'Someone built it'];

/** Small drawings for the three ways: an empty dotted spot, a heap of loose bricks, a hand placing a brick. */
function WayIcon({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 80 60" className="h-[60px] w-[80px]" aria-hidden="true">
      {i === 0 && <rect x="14" y="8" width="52" height="44" rx="8" fill="none" stroke={P.inkSoft} strokeWidth="3" strokeDasharray="5 6" />}
      {i === 1 && (
        <g stroke={P.ink} strokeWidth="2">
          <rect x="8" y="34" width="26" height="16" rx="3" fill={P.crimson} transform="rotate(-12 21 42)" />
          <rect x="38" y="36" width="26" height="16" rx="3" fill={P.teal} transform="rotate(9 51 44)" />
          <rect x="26" y="14" width="26" height="16" rx="3" fill={P.gold} transform="rotate(-4 39 22)" />
        </g>
      )}
      {i === 2 && (
        <g stroke={P.ink} strokeWidth="2">
          <rect x="10" y="38" width="60" height="14" rx="3" fill={P.teal} />
          <rect x="22" y="22" width="36" height="14" rx="3" fill={P.crimson} />
          <path d="M44 4 C52 4 60 10 58 18 L40 20 C36 14 38 6 44 4 Z" fill="#E8B48A" />
        </g>
      )}
    </svg>
  );
}

/** The castle on top, the three ways below as cards. A way is struck through with the teacher's red pen once the next one
 *  is shown; the last one is ringed in gold. `ar` pins the ayah's Arabic to a card (the 52:35 page). */
function WaysBoard({ shown, struck, ringed, ar = [], answer, label }: { shown: boolean[]; struck: boolean[]; ringed: boolean; ar?: (string | undefined)[]; answer?: { en: string; ar: string }; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute left-[720px] top-[140px] h-[640px] w-[760px]" role="img" aria-label={label}>
      <div className="absolute inset-x-0 top-0 h-[300px] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-34px_rgba(139,73,53,0.6)]">
        <motion.img src={src('lego')} alt="" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: '72% 55%' }} initial={reduce ? false : { scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: out }} />
      </div>
      {WAYS.map((w, i) =>
        shown[i] ? (
          <motion.div
            key={w}
            className="absolute top-[330px] flex h-[250px] w-[236px] flex-col items-center gap-3 rounded-[24px] border-[3px] px-4 pt-5 text-center"
            style={{ left: i * 262, background: '#FFFDF7', borderColor: i === 2 && ringed ? P.gold : '#E3D6B8', boxShadow: i === 2 && ringed ? '0 0 0 6px rgba(229,169,60,0.35), 0 20px 40px -24px rgba(139,73,53,0.7)' : undefined }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: out }}
          >
            <motion.div className="flex flex-col items-center gap-3" initial={false} animate={{ opacity: struck[i] ? 0.5 : 1 }} transition={{ duration: 0.4 }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full font-sans text-[18px] font-bold text-white" style={{ background: i === 2 ? P.teal : P.copper }}>{i + 1}</span>
              <WayIcon i={i} />
              <span className="font-sans text-[23px] font-bold leading-tight" style={{ color: P.ink }}>{i === 2 && answer ? answer.en : w}</span>
            </motion.div>
            {struck[i] && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 236 250" preserveAspectRatio="none" aria-hidden="true">
                <Pen d="M24 70 L212 200" color={P.crimson} width={8} duration={0.45} />
                <Pen d="M212 70 L24 200" color={P.crimson} width={8} delay={0.35} duration={0.45} />
              </svg>
            )}
            {ar[i] && <Tag style={{ left: '50%', top: -6 }} ar={ar[i]} delay={0.3} size={18}><span /></Tag>}
            {i === 2 && answer && <Tag style={{ left: '50%', top: -6 }} ar={answer.ar} color={P.teal} delay={0.3} size={18}><span /></Tag>}
          </motion.div>
        ) : null,
      )}
    </div>
  );
}

/** p4 Three ways: each way is shown, and moving on to the next one strikes the one before; the third is the answer. */
export function ThreeWaysBuild({ labels, label }: { labels: (string | null)[]; label: string }) {
  const shown = WAYS.map((_, i) => labels[i] != null);
  return <WaysBoard shown={shown} struck={shown.map((s, i) => s && i < 2 && shown[i + 1])} ringed={shown[2]} label={label} />;
}

/** p8 At-Tur 52:35: Maryam's three ways come back, and the ayah's own words land on the two impossible ones; the
 *  question turns the third card into the answer. */
export function ThreeWaysQuran({ v, label }: { v: Built; label: string }) {
  const on = v.lines >= 1;
  return (
    <WaysBoard
      shown={[on, on, on]} struck={[on, on, false]} ringed={on}
      ar={v.evidence ? ['مِنْ غَيْرِ شَىْءٍ', 'هُمُ ٱلْخَـٰلِقُونَ'] : []}
      answer={v.interaction ? { en: 'Allah made them', ar: 'الخالق' } : undefined}
      label={label}
    />
  );
}

/** Stars over the garden in sky.webp (px), lit one after another. */
const STARS = [[180, 90], [330, 210], [470, 70], [610, 260], [700, 140], [860, 60], [930, 300], [1090, 200], [1180, 80], [1310, 160], [1250, 330], [420, 330]];

/** p9 Who made the sky? The stars come out over the family; the ayah names the skies and the earth; the question draws
 *  one arc across the whole sky: only Allah. */
export function SkyStars({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  return (
    <Print name="l02/sky" label={label}>
      {v.lines >= 1 && !reduce && STARS.map(([x, y], i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ ...at(L2, x, y), background: '#FFF6D8', boxShadow: '0 0 14px 5px rgba(255,236,170,0.8)' }}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0.55, 1], scale: 1 }}
          transition={{ duration: 2.4, delay: 0.2 + i * 0.12, ease: 'easeInOut' }}
        />
      ))}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${L2.w} ${L2.h}`} preserveAspectRatio="none" aria-hidden="true">
        {v.interaction && <Pen d="M120 560 C420 40 1030 40 1330 560" color={P.goldSoft} width={6} dash="12 14" duration={1.6} glow />}
      </svg>
      {v.lines >= 2 && <Tag style={at(L2, 724, 420)} color={P.ink} delay={0.6}>Nobody has ever made a sky</Tag>}
      {v.evidence && <Tag style={at(L2, 1060, 250)} ar="ٱلسَّمَـٰوَٰتِ" color={P.teal} delay={0.4}>the skies</Tag>}
      {v.evidence && <Tag style={at(L2, 1180, 800)} ar="ٱلْأَرْضَ" color={P.copper} delay={0.9}>the earth</Tag>}
      {v.interaction && <Tag style={at(L2, 724, 110)} color={P.crimson} delay={1.4} size={26}>Only Allah</Tag>}
    </Print>
  );
}

/** p11 Made ready to know Him: the lock is our heart and mind, the key is Islam, and the key slides into the lock it was
 *  made for. Two copies of lock.webp: the lock half stays, the key half is clipped out and moved. */
export function KeyFits({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const inLock = v.lines >= 2;
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px]" role="img" aria-label={label}>
      <div className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]" style={{ background: '#FBF5EA' }}>
        {/* lock-base.webp is lock.webp with the key painted out; key.webp is the key cut out (both made with ffmpeg from
            the owner's painting). The key travels until its tip reaches the keyhole, then pushes in: the clip's left
            edge stays on the keyhole, so the shaft disappears inside. Numbers are % of the key box (708 × 380 px). */}
        <Layer name="l02/lock-base" filter="none" />
        <motion.img
          src={src('l02/key')} alt="" aria-hidden="true" draggable={false}
          className="absolute select-none" style={{ ...at(L2, 740, 400), width: `${(708 / L2.w) * 100}%`, height: `${(380 / L2.h) * 100}%` }}
          initial={false}
          animate={inLock
            ? { x: ['0%', '-66.4%', '-82.8%'], y: ['0%', '-11.4%', '-11.4%'], clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 20.6%)'] }
            : { x: '0%', y: '0%', clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={reduce ? { duration: 0 } : { duration: 1.5, times: [0, 0.7, 1], ease: 'easeInOut' }}
        />
        {inLock && !reduce && (
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ ...at(L2, 300, 550), width: '30%', height: '40%', background: 'radial-gradient(circle, rgba(255,226,150,0.75), rgba(255,226,150,0) 65%)', mixBlendMode: 'screen' }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 1.8, delay: 0.9, ease: out }}
          />
        )}
      </div>
      {v.lines >= 1 && <Tag style={at(L2, 330, 960)} delay={0.4}>Your heart and mind</Tag>}
      {inLock && <Tag style={at(L2, 720, 770)} color={P.teal} delay={1.4}>Islam</Tag>}
      {v.evidence && <Tag style={at(L2, 1080, 200)} ar="فِطْرَتَ ٱللَّهِ" color={P.copper} delay={0.3}>the fitrah of Allah</Tag>}
      {v.interaction && <Tag style={at(L2, 1080, 980)} color={P.crimson} delay={0.5}>One Maker made both</Tag>}
    </div>
  );
}

/** p12 Allah says: Look! The ayah's four words are pinned on the four things in one desert landscape. */
const LOOK_AT = [
  { x: 230, y: 420, ar: 'ٱلْإِبِلِ', en: 'the camels', color: P.copper },
  { x: 900, y: 150, ar: 'ٱلسَّمَآءِ', en: 'the sky', color: P.teal },
  { x: 1160, y: 520, ar: 'ٱلْجِبَالِ', en: 'the mountains', color: P.crimson },
  { x: 700, y: 900, ar: 'ٱلْأَرْضِ', en: 'the earth', color: '#9A6A12' },
];
export function LookFour({ v, label }: { v: Built; label: string }) {
  return (
    <Print name="l02/look" label={label}>
      {v.lines >= 2 && !v.evidence && <Tag style={at(L2, 724, 560)} color={P.crimson} size={34}>Look!</Tag>}
      {v.evidence && LOOK_AT.map((t, i) => <Tag key={t.en} style={at(L2, t.x, t.y)} ar={t.ar} color={t.color} delay={0.5 + i * 0.7}>{t.en}</Tag>)}
    </Print>
  );
}
