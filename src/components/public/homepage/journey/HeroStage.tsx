import React from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTime, useTransform, type MotionValue } from 'motion/react';
import { ZadRig } from '../../../zad/ZadRig';

/**
 * The hero's right side: Zad (3D where WebGL is there, SVG otherwise) standing on a gold khatam medallion, the four
 * kinds of provision (the academy's 3D medals) orbiting him on a tilted ring, and the whole stage leaning toward the mouse in layers (parallax
 * depth: back glow, medallion, orbit, Zad). Decorative; the heading says the same in words.
 */

// The four kinds of provision as the academy's own 3D medals (public/badges/shelf, the student portal's badge renders).
export const SUBJECT_MEDALS = [
  { id: 'surah', l: { en: 'Quran', ar: 'القرآن' } },
  { id: 'tajweed', l: { en: 'Tajweed', ar: 'التجويد' } },
  { id: 'zad-level', l: { en: 'Zad Path', ar: 'منهج زاد' } },
  { id: 'language-level', l: { en: 'Arabic · English', ar: 'العربية · الإنجليزية' } },
] as const;
const ORBIT = SUBJECT_MEDALS;

export function Medal({ id, className, eager }: { id: string; className?: string; eager?: boolean }) {
  return <img src={`/badges/shelf/${id}.webp`} alt="" aria-hidden="true" width={180} height={180} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className={`select-none object-contain drop-shadow-[0_18px_22px_rgba(28,20,17,0.45)] ${className ?? ''}`} />;
}

function Khatam({ className }: { className?: string }) {
  // Eight-point khatam: two squares turned 45° to each other, gold foil gradient, fine inner line.
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hero-foil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6D58E" /><stop offset=".45" stopColor="#E5A93C" /><stop offset=".55" stopColor="#FFF1C9" /><stop offset="1" stopColor="#B4552F" />
        </linearGradient>
      </defs>
      <g transform="translate(100 100)">
        <rect x="-62" y="-62" width="124" height="124" rx="10" fill="none" stroke="url(#hero-foil)" strokeWidth="3" />
        <rect x="-62" y="-62" width="124" height="124" rx="10" fill="none" stroke="url(#hero-foil)" strokeWidth="3" transform="rotate(45)" />
        <circle r="44" fill="none" stroke="url(#hero-foil)" strokeWidth="1.2" strokeDasharray="2 5" />
        <circle r="84" fill="none" stroke="url(#hero-foil)" strokeOpacity=".5" strokeWidth=".8" />
      </g>
    </svg>
  );
}

/**
 * Phones (owner, 2026-11-18/19): the brand line written around Zad, the first half over the top of the circle, the
 * second under it, in both languages. Each WORD is placed and turned on the circle on its own (measured after it
 * renders): a whole line on a curved path breaks the joins of Arabic letters in Chrome, a single word never does.
 * The two halves slide in from opposite sides.
 */
function ArcLine({ words, r, top, size, fill, rtl, className }: { words: string[]; r: number; top: boolean; size: number; fill: string; rtl: boolean; className: string }) {
  const refs = React.useRef<(SVGTextElement | null)[]>([]);
  const [w, setW] = React.useState<number[]>(() => words.map((x) => x.length * size * 0.52));
  React.useLayoutEffect(() => {
    const measure = () => setW(words.map((x, k) => refs.current[k]?.getComputedTextLength() || x.length * size * 0.52));
    measure();
    // Fonts arrive after the first paint: measure again once they are ready.
    void document.fonts?.ready.then(measure);
  }, [words.join(' '), size]);
  const gap = size * 0.32;
  const total = w.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  // Lay the words out from the reading start: left to right in English, right to left in Arabic.
  let run = 0;
  const centers = w.map((x) => { const c = run + x / 2; run += x + gap; return c; });
  return (
    <>
      {words.map((word, k) => {
        const along = (rtl ? total - centers[k] : centers[k]) - total / 2; // signed distance from the arc's middle, left negative
        const theta = along / r; // radians
        const a = top ? -Math.PI / 2 + theta : Math.PI / 2 - theta;
        const x = 200 + r * Math.cos(a);
        const y = 200 + r * Math.sin(a);
        const rot = (top ? a + Math.PI / 2 : a - Math.PI / 2) * (180 / Math.PI);
        return (
          <text
            key={k}
            ref={(el) => { refs.current[k] = el; }}
            x={x}
            y={y}
            fontSize={size}
            textAnchor="middle"
            direction={rtl ? 'rtl' : 'ltr'}
            dominantBaseline={top ? 'auto' : 'hanging'}
            transform={`rotate(${rot} ${x} ${y})`}
            className={className}
            style={{ fill }}
          >
            {word}
          </text>
        );
      })}
    </>
  );
}

function RingText({ isEn, reduce }: { isEn: boolean; reduce: boolean }) {
  const top = (isEn ? 'Provision that lasts,' : 'زادٌ يبقى،').split(' ');
  const bottom = (isEn ? 'for you and your family.' : 'لك ولأهل بيتك.').split(' ');
  const enter = (from: number, delay: number) => (reduce ? {} : {
    initial: { rotate: from, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 55, damping: 16, delay },
  });
  return (
    <svg viewBox="0 0 400 400" className="lg:hidden absolute inset-0 z-30 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="ring-ribbon" x1="0" x2="1">
          <stop offset="0" stopColor="#C51F24" /><stop offset=".5" stopColor="#E5A93C" /><stop offset="1" stopColor="#087D91" />
        </linearGradient>
      </defs>
      <motion.g style={{ transformBox: 'view-box', transformOrigin: '200px 200px' }} {...enter(isEn ? -110 : 110, 0.2)}>
        <ArcLine words={top} r={178} top size={isEn ? 30 : 36} fill="var(--foreground)" rtl={!isEn} className={`font-editorial ${isEn ? 'font-medium' : 'font-bold'}`} />
      </motion.g>
      <motion.g style={{ transformBox: 'view-box', transformOrigin: '200px 200px' }} {...enter(isEn ? 110 : -110, 0.45)}>
        <ArcLine words={bottom} r={178} top={false} size={isEn ? 27 : 33} fill="url(#ring-ribbon)" rtl={!isEn} className="font-editorial font-bold" />
      </motion.g>
    </svg>
  );
}

/** Zad's greeting, in the page's language, beside his head (not on the brand line, not on the medals). */
function Greeting({ isEn, reduce }: { isEn: boolean; reduce: boolean }) {
  const lines = isEn ? ['Hello!', 'Salam!'] : ['السلام عليكم', 'أهلًا بيك'];
  const [k, setK] = React.useState(0);
  React.useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setK((v) => (v + 1) % lines.length), 4200);
    return () => window.clearInterval(id);
  }, [reduce, lines.length]);
  return (
    <div className="absolute z-40 top-[22%] end-[6%] lg:end-[2%] pointer-events-none" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={`${isEn}-${k}`}
          className="rounded-2xl rounded-es-md bg-[#FAF7F2] dark:bg-[#2A1C16] px-3 py-1.5 text-sm sm:text-base font-bold text-[#C51F24] dark:text-[#F6D58E] shadow-[0_10px_24px_-10px_rgba(28,20,17,0.5)] ring-1 ring-[#E5A93C]/40 whitespace-nowrap"
          initial={reduce ? false : { opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        >
          {lines[k]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function HeroStage({ isEn, ringText = false }: { isEn: boolean; ringText?: boolean }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const layer = (depth: number) => ({ x: useTransform(sx, (v) => v * depth), y: useTransform(sy, (v) => v * depth) });
  const back = layer(-10);
  const mid = layer(10);
  const front = layer(22);
  const time = useTime();
  const [small, setSmall] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const on = () => setSmall(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return (
    <div
      className="relative mx-auto w-full max-w-[520px] aspect-square select-none"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      aria-hidden="true"
    >
      {/* Back: the warm glow and a slowly turning medallion. */}
      <motion.div className="absolute inset-0" style={back}>
        <div className="absolute inset-[8%] rounded-full blur-3xl opacity-80" style={{ background: 'radial-gradient(closest-side, rgba(229,169,60,0.45), rgba(197,31,36,0.18) 60%, transparent)' }} />
        <motion.div className="absolute inset-[6%]" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
          <Khatam className="w-full h-full opacity-70" />
        </motion.div>
      </motion.div>

      {/* Middle: a lit sphere behind Zad, and the atom: three orbits on different planes that slowly turn. */}
      <motion.div className="absolute inset-0" style={mid}>
        <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,241,201,0.55),rgba(229,169,60,0.22)_45%,rgba(180,85,47,0.12)_70%,transparent_72%)] shadow-[inset_-18px_-24px_50px_rgba(180,85,47,0.18)]" />
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full overflow-visible">
          {PLANES.map((p, k) => <OrbitRing key={k} plane={p} time={time} reduce={!!reduce} />)}
        </svg>
      </motion.div>
      {/* Front: Zad, standing on a soft pedestal of light (between the far and near halves of the orbits). */}
      <motion.div className="absolute inset-0 z-10 grid place-items-center" style={front}>
        <div className="relative">
          <div className="absolute left-1/2 bottom-[6%] w-[70%] h-[12%] -translate-x-1/2 rounded-[50%] bg-[#1C1411]/25 blur-xl" />
          <ZadRig pose="wave" size={small ? 170 : 230} noBubble />
        </div>
      </motion.div>
      {ORBIT.map((o, k) => <OrbitToken key={o.l.en} k={k} o={o} isEn={isEn} reduce={!!reduce} style={mid} time={time} />)}
      <Greeting isEn={isEn} reduce={!!reduce} />
      {ringText && <RingText isEn={isEn} reduce={!!reduce} />}
    </div>
  );
}

// The atom's orbit planes: each an ellipse (half-axes in % of the stage), turned in the screen plane by a starting
// angle that precesses slowly, so the orbits go from lying flat to standing on their side and back.
const PLANES = [
  { rx: 36, ry: 12, tilt: 0, spin: 1 / 50 },
  { rx: 36, ry: 12, tilt: 60, spin: -1 / 65 },
  { rx: 36, ry: 12, tilt: -60, spin: 1 / 80 },
];
const planeAngle = (p: (typeof PLANES)[number], ms: number, reduce: boolean) => ((p.tilt + (reduce ? 0 : (ms / 1000) * p.spin * 360)) * Math.PI) / 180;

function OrbitRing({ plane, time, reduce }: { plane: (typeof PLANES)[number]; time: MotionValue<number>; reduce: boolean }) {
  const rotate = useTransform(time, (ms) => (planeAngle(plane, ms, reduce) * 180) / Math.PI);
  return <motion.ellipse cx={200} cy={200} rx={plane.rx * 4} ry={plane.ry * 4} fill="none" stroke="#E5A93C" strokeOpacity={0.4} strokeWidth={1.2} style={{ rotate, transformBox: 'view-box', transformOrigin: '200px 200px' }} />;
}

function OrbitToken({ k, o, isEn, reduce, style, time }: { k: number; o: (typeof ORBIT)[number]; isEn: boolean; reduce: boolean; style: { x: MotionValue<number>; y: MotionValue<number> }; time: MotionValue<number> }) {
  const plane = PLANES[k % PLANES.length];
  const phase = (k / ORBIT.length) * Math.PI * 2 + (k >= PLANES.length ? Math.PI : 0);
  const pos = useTransform(time, (ms) => {
    const th = reduce ? phase : phase + (ms / 14000) * Math.PI * 2;
    const ph = planeAngle(plane, ms, reduce);
    const ex = Math.cos(th) * plane.rx;
    const ey = Math.sin(th) * plane.ry;
    const x = ex * Math.cos(ph) - ey * Math.sin(ph);
    const y = ex * Math.sin(ph) + ey * Math.cos(ph);
    return { x, y, depth: Math.sin(th) };
  });
  const left = useTransform(pos, (p) => `${50 + p.x}%`);
  const top = useTransform(pos, (p) => `${50 + p.y}%`);
  const scale = useTransform(pos, (p) => 0.75 + 0.3 * ((p.depth + 1) / 2));
  const zIndex = useTransform(pos, (p) => (p.depth > 0 ? 20 : 5));
  // In front of Zad's face, a medal fades so his face always shows.
  const opacity = useTransform(pos, (p) => {
    const base = 0.55 + 0.45 * ((p.depth + 1) / 2);
    const nearFace = p.depth > 0 && Math.hypot(p.x, p.y + 4) < 15;
    return nearFace ? 0.25 : base;
  });
  const spin = useTransform(pos, (p) => p.x * 0.8);
  return (
    <motion.div className="absolute" style={{ left, top, zIndex, x: style.x, y: style.y }}>
      <motion.div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ scale, opacity }}>
        <motion.span className="block" style={{ rotateY: spin }}><Medal id={o.id} eager className="w-[54px] h-[54px] sm:w-[80px] sm:h-[80px]" /></motion.span>
        <span className="-mt-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-foreground ring-1 ring-border whitespace-nowrap">{isEn ? o.l.en : o.l.ar}</span>
      </motion.div>
    </motion.div>
  );
}
