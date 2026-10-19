import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Pen, Tag, Print, out, type Built } from '../Scenes';
import { Burst, Rise, SunRays, Glow, Ripples, Sprite } from '../Motion';
import { play, useCue } from '../sfx';

/* ---------- Lesson 3: Allah Is One (brief: docs/curriculum/zad-essentials-kids/L03-allah-is-one.md) ----------
   Paintings in public/curriculum/zad-kids/l03 (requested from the owner 2026-10-19). Until a painting arrives its page
   shows the paper and the code-drawn motion only. The two captains, the solar system, the shahada, the heart, the khatam
   star and the needs chain are drawn here in code. Moment positions over paintings are % of the painting's box and are
   first guesses from the prompts: check them when the paintings arrive. */

const WATER = 'linear-gradient(180deg, #3E9BB0 0%, #2C7F96 60%, #22687D 100%)';

/** The pedal boat from above, bow up: Yusuf's seat teal, Maryam's gold, one wheel between them. */
function BoatTop() {
  return (
    <svg viewBox="0 0 120 170" className="h-full w-full overflow-visible" aria-hidden="true">
      <path d="M60 6 C96 30 106 70 104 112 C102 146 86 164 60 164 C34 164 18 146 16 112 C14 70 24 30 60 6 Z" fill="#FFFDF7" stroke={P.crimson} strokeWidth="6" />
      <rect x="28" y="92" width="28" height="34" rx="8" fill={P.teal} />
      <rect x="64" y="92" width="28" height="34" rx="8" fill={P.gold} />
      <circle cx="60" cy="74" r="13" fill="none" stroke={P.ink} strokeWidth="5" />
      <path d="M60 61 V87 M47 74 H73" stroke={P.ink} strokeWidth="3" />
    </svg>
  );
}

/** p4 Two captains, seen from above. (1) Two arrows pull the boat two ways. (2) It spins on the spot, rings spreading.
 *  (3) One captain: the boat turns to the shore and glides there in a straight line. */
export function TwoCaptains({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  useCue('whoosh', n >= 1, 0.2);
  useCue('water', n >= 2, 0.1);
  useCue('chime', n >= 3, 1.6);
  const boat = n >= 3
    ? { rotate: 180, top: '70%', transition: { rotate: { duration: 0.8, ease: out }, top: { duration: 1.6, delay: 0.6, ease: 'easeInOut' as const } } }
    : n === 2 && !reduce
      ? { rotate: [0, 360], top: '38%', transition: { rotate: { duration: 1.4, repeat: Infinity, ease: 'linear' as const }, top: { duration: 0.3 } } }
      : { rotate: 0, top: '38%', transition: { duration: 0.4 } };
  return (
    <div className="absolute left-[700px] top-[120px] h-[640px] w-[800px] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-34px_rgba(139,73,53,0.6)]" role="img" aria-label={`${label}: ${n} of 3`}
      style={{ background: WATER }}>
      {/* The shore and the jetty along the bottom. */}
      <div className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: 'linear-gradient(180deg, #E9CF9A, #D7B377)' }} />
      <div className="absolute bottom-[12%] left-[46%] h-[10%] w-[8%] rounded-t-[6px]" style={{ background: 'repeating-linear-gradient(90deg, #8B5A36 0 10px, #6E4528 10px 12px)' }} />
      <Sprite name="characters/jiddo-explain.webp" enter="up" className="h-[30%]" style={{ left: '4%', bottom: '2%' }} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 800 640" aria-hidden="true">
        {n === 1 && <Pen d="M370 240 C300 200 240 220 190 280" color={P.teal} width={10} duration={0.6} glow />}
        {n === 1 && <Pen d="M430 240 C500 200 560 220 610 280" color={P.gold} width={10} duration={0.6} delay={0.3} glow />}
        {n === 2 && <Pen d="M400 150 A95 95 0 1 1 399 150" color="rgba(255,255,255,0.7)" width={4} dash="10 12" duration={1.2} />}
        {n >= 3 && <Pen d="M400 250 L400 400" color="rgba(255,255,255,0.85)" width={6} dash="14 12" duration={1.4} delay={0.7} />}
      </svg>
      {n === 2 && <Ripples x={50} y={38} w={34} />}
      <motion.div className="absolute left-1/2 h-[170px] w-[120px] -translate-x-1/2 -translate-y-1/2" initial={false} animate={boat}>
        <BoatTop />
      </motion.div>
      {n === 1 && <Tag style={{ left: '22%', top: '50%' }} color={P.teal} delay={0.5}>Yusuf: left!</Tag>}
      {n === 1 && <Tag style={{ left: '78%', top: '50%' }} color="#9A6A12" delay={0.8}>Maryam: right!</Tag>}
      {n === 2 && <Tag style={{ left: '50%', top: '12%' }} color={P.crimson} delay={0.4}>Round and round…</Tag>}
      {n >= 3 && <Tag style={{ left: '74%', top: '60%' }} color={P.teal} delay={2.2}>One captain: straight home</Tag>}
      {n >= 3 && <Burst x={50} y={74} kind="sparks" count={14} seed={31} delay={2.2} spread={16} />}
    </div>
  );
}

/** Stars scattered over the dark sky of the solar system (px of the 760 × 570 box). */
const SPACE_STARS = [[60, 50], [150, 120], [240, 40], [520, 60], [640, 110], [700, 40], [90, 300], [700, 330], [60, 500], [200, 520], [560, 520], [690, 480]];

/** p6 If there were two (Al-Anbiya 21:22), the wow. The earth and the moon go round the sun in perfect circles. Then a
 *  second "boss" sun appears: the orbits shake and knock, and it all goes wrong. The second fades, and the calm comes back.
 *  The ayah's word lafasadata is pinned on the chaos; the question writes "Only Allah" over the calm sky. */
type Phase = 'calm' | 'chaos' | 'settled';
export function OrbitsOrder({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('calm');
  const started = v.lines >= 1;
  useEffect(() => {
    if (!started) { setPhase('calm'); return; }
    if (reduce) { setPhase('settled'); return; }
    setPhase('chaos');
    play('thud', 0.3);
    const t = window.setTimeout(() => { setPhase('settled'); play('chime'); }, 3600);
    return () => window.clearTimeout(t);
  }, [started, reduce]);
  useCue('pop', v.evidence, 0.3);
  useCue('reveal', v.interaction, 0.3);
  const chaos = phase === 'chaos';
  const spin = (s: number) => (reduce ? { rotate: 0 } : { rotate: 360, transition: { duration: s, repeat: Infinity, ease: 'linear' as const } });
  const shake = chaos ? { x: [0, 34, -42, 26, -18, 30, 0], y: [0, -22, 30, -34, 18, -10, 0] } : { x: 0, y: 0 };
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(20,30,60,0.8)]" role="img" aria-label={label}
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #1D3557 0%, #0E1B33 70%, #0A1426 100%)' }}>
      {SPACE_STARS.map(([x, y], i) => (
        <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-[#FFF6D8]" style={{ left: x, top: y }}
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 2 + (i % 3), delay: i * 0.3, repeat: Infinity }} />
      ))}
      {/* The earth's orbit ring and the sun at the centre. */}
      <motion.div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed"
        style={{ borderColor: chaos ? 'rgba(197,31,36,0.7)' : 'rgba(255,246,216,0.35)' }} animate={shake} transition={{ duration: 3, ease: 'easeInOut' }} />
      <motion.div className="absolute left-1/2 top-1/2 h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, #FFE7A3 0%, #F2B640 55%, #E58E26 100%)', boxShadow: '0 0 60px 20px rgba(242,182,64,0.55)' }}
        animate={reduce ? undefined : { scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      {/* Earth on its orbit, the moon on the earth's. Each orbit is a turning arm with the planet at its end. */}
      <motion.div className="absolute left-1/2 top-1/2 h-0 w-0" animate={shake} transition={{ duration: 3, ease: 'easeInOut' }}>
        <motion.div className="absolute h-0 w-0" animate={chaos && !reduce ? { rotate: [0, 120, 60, 240, 180, 360] } : spin(14)} transition={chaos ? { duration: 3.4, ease: 'easeInOut' } : undefined}>
          <div className="absolute left-[210px] top-0 h-0 w-0">
            <span className="absolute h-[40px] w-[40px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, #7FD0E0, #087D91 60%, #2E6B3A 100%)', boxShadow: '0 0 16px 2px rgba(127,208,224,0.5)' }} />
            <motion.div className="absolute h-0 w-0" animate={spin(3.2)}>
              <span className="absolute left-[46px] h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E9E3D3]" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      {/* The second "boss": a red sun that pulls everything its own way, then fades. */}
      <motion.div className="absolute h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: '78%', top: '24%', background: 'radial-gradient(circle, #FF9A8A, #C51F24 70%)', boxShadow: '0 0 50px 14px rgba(197,31,36,0.55)' }}
        initial={false} animate={{ opacity: chaos ? 1 : 0, scale: chaos ? 1 : 0.4 }} transition={{ duration: 0.6 }} />
      {chaos && <Burst x={63} y={36} kind="sparks" count={20} seed={41} delay={1.4} spread={20} />}
      {chaos && <Tag style={{ left: '78%', top: '40%' }} color={P.crimson} delay={0.4}>A second boss?</Tag>}
      {phase === 'settled' && <Tag style={{ left: '50%', top: '91%' }} color={P.teal} delay={0.2}>One Lord: all calm</Tag>}
      {v.evidence && <Tag style={{ left: '18%', top: '30%' }} ar="لَفَسَدَتَا" color={P.crimson} delay={0.3}>they would fall apart</Tag>}
      {v.interaction && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
            <Pen d="M90 500 C220 40 540 40 670 500" color={P.goldSoft} width={6} dash="12 14" duration={1.6} glow />
          </svg>
          <Tag style={{ left: '50%', top: '9%' }} color={P.crimson} delay={1.2} size={28}>Only Allah</Tag>
        </>
      )}
    </div>
  );
}

/** p7 La ilaha illallah. The sentence is written right to left; a line splits it into its two halves; with the ayah the
 *  first half is crossed through ("no god") and the second lights up in gold ("except Allah"); the question sends motes
 *  of light up from the whole sentence. */
export function ShahadaWords({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  useCue('pen', v.lines >= 1, 0.2);
  useCue('pop', v.lines >= 2, 0.3);
  useCue('strike', v.evidence, 0.4);
  useCue('sparkle', v.evidence, 1.2);
  useCue('chime', v.interaction, 0.2);
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]" role="img" aria-label={label}
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #FFFDF7 0%, #F6EBD6 100%)' }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true">
        <rect x="24" y="24" width="712" height="522" rx="22" fill="none" stroke={P.goldSoft} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      </svg>
      {v.lines >= 1 && (
        <div lang="ar" dir="rtl" className="absolute inset-x-0 top-[24%] flex justify-center gap-[70px] font-serif text-[92px] font-bold leading-none">
          <motion.span className="relative" style={{ color: v.evidence ? P.inkSoft : P.ink }}
            initial={reduce ? false : { clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }} transition={{ duration: 1, ease: 'easeInOut' }}>
            لَا إِلَٰهَ
          </motion.span>
          <motion.span className="relative" style={{ color: v.evidence ? P.copper : P.ink, textShadow: v.evidence ? '0 0 28px rgba(229,169,60,0.75)' : undefined }}
            initial={reduce ? false : { clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }} transition={{ duration: 1, delay: reduce ? 0 : 0.9, ease: 'easeInOut' }}>
            إِلَّا ٱللَّهُ
          </motion.span>
        </div>
      )}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
        {v.lines >= 2 && <Pen d="M372 110 L372 290" color={P.gold} width={4} dash="6 10" duration={0.6} />}
        {/* Right half (first in Arabic): crossed through. */}
        {v.evidence && <Pen d="M440 210 L700 180" color={P.crimson} width={8} duration={0.5} delay={0.3} />}
      </svg>
      {v.lines >= 2 && <Tag style={{ left: '74%', top: '62%' }} color={P.inkSoft} delay={0.3}>1 · Lā ilāha</Tag>}
      {v.lines >= 2 && <Tag style={{ left: '26%', top: '62%' }} color={P.inkSoft} delay={0.5}>2 · illā Allāh</Tag>}
      {v.evidence && <Tag style={{ left: '74%', top: '78%' }} color={P.crimson} delay={0.6}>no one else is worshipped</Tag>}
      {v.evidence && <Tag style={{ left: '26%', top: '78%' }} color={P.teal} delay={1.1}>only Allah</Tag>}
      {v.evidence && <Burst x={26} y={36} kind="sparks" count={14} seed={52} delay={1.2} spread={14} />}
      {v.interaction && <Rise from={[{ x: 30, y: 46 }, { x: 50, y: 46 }, { x: 70, y: 46 }]} count={4} height={30} seed={7} />}
    </div>
  );
}

/** Where each worship comes from on the heart page (px of the 800 × 640 box) and where its label sits. */
const HEART_IN = [
  { x: 190, y: 160, lx: 150, ly: 70 },
  { x: 610, y: 160, lx: 650, ly: 70 },
  { x: 210, y: 420, lx: 160, ly: 560 },
  { x: 590, y: 420, lx: 640, ly: 560 },
];
const HEART = 'M400 560 C150 400 90 250 190 160 C280 80 370 130 400 200 C430 130 520 80 610 160 C710 250 650 400 400 560 Z';

/** p8 Only to Him: a heart is drawn; Allah's name glows at its centre; each worship sends a ray of light into that one
 *  centre; with all four the heart fills with gold. One heart, one centre. */
export function OneHeart({ labels, label }: { labels: (string | null)[]; label: string }) {
  const n = labels.filter(Boolean).length;
  useCue('pop', n, 0.3);
  useCue('reveal', n >= 4, 0.8);
  return (
    <div className="absolute left-[700px] top-[120px] h-[640px] w-[800px]" role="img" aria-label={`${label}: ${n} of 4`}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 800 640" aria-hidden="true">
        <defs>
          <radialGradient id="l03-heart" cx="50%" cy="55%" r="60%">
            <stop offset="0%" stopColor="#FFE7A3" />
            <stop offset="100%" stopColor="#E5A93C" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        <motion.path d={HEART} fill="url(#l03-heart)" initial={false} animate={{ opacity: n >= 4 ? 0.9 : 0.12 }} transition={{ duration: 1.2, delay: n >= 4 ? 0.6 : 0 }} />
        <Pen d={HEART} color={P.crimson} width={7} duration={1.4} />
        {HEART_IN.slice(0, n).map((p, i) => (
          <Pen key={i} d={`M${p.x} ${p.y} L400 330`} color={P.gold} width={6} duration={0.6} delay={0.2} glow />
        ))}
      </svg>
      <motion.span lang="ar" dir="rtl" className="absolute left-1/2 top-[51.5%] -translate-x-1/2 -translate-y-1/2 font-serif text-[64px] font-bold"
        style={{ color: P.copper, textShadow: '0 0 24px rgba(229,169,60,0.8)' }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: n >= 1 ? 1 : 0.25, scale: 1 }} transition={{ duration: 0.8, ease: out }}>
        الله
      </motion.span>
      {HEART_IN.slice(0, n).map((p, i) => <Tag key={i} style={{ left: `${(p.lx / 800) * 100}%`, top: `${(p.ly / 640) * 100}%` }} color={[P.teal, P.crimson, P.copper, '#9A6A12'][i]} delay={0.5} size={20}>{labels[i]}</Tag>)}
      {n >= 4 && <Burst x={50} y={52} kind="sparks" count={20} seed={61} delay={0.8} spread={22} />}
    </div>
  );
}

/** The khatam (eight-point) star split into four quarter pieces around its centre (px of the 800 × 640 box). */
const STAR_C = { x: 400, y: 330 };
const STAR_R = 230;
const STAR_IN = STAR_R * (Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8));
const starPoint = (k: number) => {
  const a = -Math.PI / 2 + (k * Math.PI) / 8;
  const r = k % 2 === 0 ? STAR_R : STAR_IN;
  return [STAR_C.x + r * Math.cos(a), STAR_C.y + r * Math.sin(a)];
};
const PIECES = [0, 1, 2, 3].map((q) => {
  const pts = [[STAR_C.x, STAR_C.y], ...[0, 1, 2, 3, 4].map((k) => starPoint(q * 4 + k))];
  const mid = -Math.PI / 2 + (q * Math.PI) / 2 + Math.PI / 4;
  return { d: `M${pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L')} Z`, dx: Math.cos(mid), dy: Math.sin(mid) };
});
const PIECE_COLORS = [P.teal, P.crimson, P.copper, P.gold];

/** p10 Four things about Allah: each ayah of al-Ikhlas is one piece of a khatam star. A piece flies in from its corner and
 *  locks into place with its label; with the fourth the star is whole, it glows, and أحد is written at its heart. */
export function StarPieces({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const n = labels.filter(Boolean).length;
  useCue('lock', n, 0.5);
  useCue('reveal', n >= 4, 0.9);
  return (
    <div className="absolute left-[700px] top-[120px] h-[640px] w-[800px]" role="img" aria-label={`${label}: ${n} of 4`}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 800 640" aria-hidden="true">
        {/* The empty outline waits for its pieces. */}
        <path d={PIECES.map((p) => p.d).join(' ')} fill="none" stroke="#D9C9A6" strokeWidth="3" strokeDasharray="8 10" />
        {PIECES.slice(0, n).map((p, i) => (
          <motion.path key={i} d={p.d} fill={PIECE_COLORS[i]} stroke="#FFFDF7" strokeWidth="5" strokeLinejoin="round"
            initial={reduce ? false : { x: p.dx * 320, y: p.dy * 320, rotate: 40, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.9 }} />
        ))}
        {n >= 4 && (
          <motion.circle cx={STAR_C.x} cy={STAR_C.y} r="86" fill="#FFFDF7" initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }} transition={{ delay: reduce ? 0 : 0.7, type: 'spring', bounce: 0.4 }} />
        )}
      </svg>
      {n >= 4 && (
        <>
          <motion.div className="pointer-events-none absolute left-1/2 top-[51.5%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,226,150,0.6), rgba(255,226,150,0) 65%)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} />
          <motion.span lang="ar" dir="rtl" className="absolute left-1/2 top-[51.5%] -translate-x-1/2 -translate-y-1/2 font-serif text-[76px] font-bold" style={{ color: P.crimson }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : 1, duration: 0.6, ease: out }}>
            أَحَدٌ
          </motion.span>
          <Burst x={50} y={52} kind="sparks" count={22} seed={71} delay={1} spread={26} />
        </>
      )}
      {PIECES.slice(0, n).map((p, i) => (
        <Tag key={i} style={{ left: `${50 + p.dx * 36}%`, top: `${51.5 + p.dy * 46}%` }} color={PIECE_COLORS[i] === P.gold ? '#9A6A12' : PIECE_COLORS[i]} delay={0.6} size={19}>
          {`${i + 1} · ${labels[i]}`}
        </Tag>
      ))}
    </div>
  );
}

/** Small code-drawn icons for the needs chain (each in a 60 × 60 box centred on 0, 0). */
const ICONS: Record<string, React.ReactNode> = {
  Apple: <><circle r="22" cy="4" fill={P.crimson} /><path d="M0 -18 C4 -26 12 -28 16 -26 C12 -20 6 -18 0 -18" fill="#5E9E4B" /></>,
  Tree: <><rect x="-5" y="4" width="10" height="24" fill="#8B5A36" /><circle r="22" cy="-6" fill="#5E9E4B" /></>,
  Rain: <>{[-14, 0, 14].map((x, i) => <path key={i} d={`M${x} ${-14 + i * 6} C${x + 6} ${-2 + i * 6} ${x + 6} ${6 + i * 6} ${x} ${6 + i * 6} C${x - 6} ${6 + i * 6} ${x - 6} ${-2 + i * 6} ${x} ${-14 + i * 6}`} fill="#3E9BB0" />)}</>,
  Clouds: <><ellipse rx="26" ry="14" cy="6" fill="#E8EEF2" /><circle r="14" cx="-8" cy="-4" fill="#E8EEF2" /><circle r="12" cx="10" cy="-6" fill="#E8EEF2" /></>,
  Sun: <><circle r="16" fill={P.gold} />{Array.from({ length: 8 }, (_, i) => <path key={i} d="M0 -22 V-29" stroke={P.gold} strokeWidth="4" strokeLinecap="round" transform={`rotate(${i * 45})`} />)}</>,
};
const CHAIN = [
  { k: 'Apple', x: 90, y: 470 }, { k: 'Tree', x: 230, y: 390 }, { k: 'Rain', x: 370, y: 470 }, { k: 'Clouds', x: 510, y: 390 }, { k: 'Sun', x: 660, y: 450 },
];
const SAMAD = { x: 380, y: 140 };

/** p11 Everyone needs Him (optional): a chain of things that each need the next (apple, tree, rain, clouds, sun). With the
 *  ayah every one of them sends a line up to Allah, as-Samad, whom everything needs; the question shows that He needs
 *  nothing: no line ever goes out of Him. */
export function NeedsChain({ v, label }: { v: Built; label: string }) {
  const shown = v.lines >= 2 ? CHAIN.length : v.lines >= 1 ? 3 : 0;
  useCue('pop', shown, 0.2);
  useCue('chime', v.evidence, 0.8);
  useCue('reveal', v.interaction, 0.3);
  return (
    <div className="absolute left-[720px] top-[150px] h-[570px] w-[760px] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(139,73,53,0.6)]" role="img" aria-label={label}
      style={{ background: 'linear-gradient(180deg, #FBF5EA 0%, #F1E3C6 100%)' }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 760 570" aria-hidden="true">
        {CHAIN.slice(1, shown).map((c, i) => (
          <Pen key={c.k} d={`M${CHAIN[i].x + 40} ${CHAIN[i].y + (c.y < CHAIN[i].y ? -20 : 20)} L${c.x - 40} ${c.y + (c.y < CHAIN[i].y ? 20 : -20)}`} color={P.copper} width={4} dash="6 8" duration={0.4} delay={0.3} />
        ))}
        {v.evidence && CHAIN.map((c, i) => <Pen key={c.k} d={`M${c.x} ${c.y - 44} L${SAMAD.x} ${SAMAD.y + 60}`} color={P.gold} width={4} duration={0.7} delay={0.2 + i * 0.12} glow />)}
        {CHAIN.slice(0, shown).map((c, i) => (
          <motion.g key={c.k} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: (i % 3) * 0.15 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={c.x} cy={c.y} r="42" fill="#FFFDF7" stroke="#E3D6B8" strokeWidth="3" />
            <g transform={`translate(${c.x} ${c.y})`}>{ICONS[c.k]}</g>
            <text x={c.x} y={c.y + 70} textAnchor="middle" fontSize="22" fontWeight="700" fill={P.ink} fontFamily="sans-serif">{c.k}</text>
          </motion.g>
        ))}
      </svg>
      {shown >= 2 && <Tag style={{ left: '21%', top: '62%' }} color={P.copper} delay={0.6} size={18}>needs</Tag>}
      {v.evidence && (
        <motion.div className="absolute flex h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ left: `${(SAMAD.x / 760) * 100}%`, top: `${(SAMAD.y / 570) * 100}%`, background: 'radial-gradient(circle, #FFF3CF, #E5A93C)', boxShadow: '0 0 40px 10px rgba(229,169,60,0.55)' }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}>
          <span lang="ar" dir="rtl" className="font-serif text-[46px] font-bold" style={{ color: P.crimson }}>الله</span>
        </motion.div>
      )}
      {v.evidence && <Tag style={{ left: '76%', top: '18%' }} ar="ٱلصَّمَدُ" color={P.copper} delay={1}>everyone needs Him</Tag>}
      {v.interaction && <Tag style={{ left: '24%', top: '14%' }} color={P.teal} delay={0.3}>He needs nothing</Tag>}
      {v.interaction && <Glow x={(SAMAD.x / 760) * 100} y={(SAMAD.y / 570) * 100} w={34} h={44} />}
    </div>
  );
}

/** p9 Say: He is Allah, One. The lantern breathes over Jiddo, Maryam and the open Quran; with the surah four ayah markers
 *  light up one after another, and the word أحد is pinned; the question sends light up from the page. recite.webp. */
export function ReciteLamp({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const [marks, setMarks] = useState(0);
  useEffect(() => {
    if (!v.evidence) { setMarks(0); return; }
    if (reduce) { setMarks(4); return; }
    const ids = [0, 1, 2, 3].map((i) => window.setTimeout(() => { setMarks(i + 1); play('pop'); }, 500 + i * 650));
    return () => ids.forEach((t) => window.clearTimeout(t));
  }, [v.evidence, reduce]);
  useCue('sparkle', v.interaction, 0.3);
  return (
    <Print name="l03/recite" label={label}>
      <Glow x={16} y={34} w={30} h={46} />
      {[0, 1, 2, 3].slice(0, marks).map((i) => (
        <motion.span key={i} className="pointer-events-none absolute flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ left: '88%', top: `${18 + i * 20}%` }} initial={reduce ? false : { scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.45 }}>
          <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <rect x="8" y="8" width="24" height="24" fill={P.teal} stroke="#FFFDF7" strokeWidth="2" />
            <rect x="8" y="8" width="24" height="24" fill={P.teal} stroke="#FFFDF7" strokeWidth="2" transform="rotate(45 20 20)" />
          </svg>
          <span className="relative font-sans text-[22px] font-bold text-white">{i + 1}</span>
        </motion.span>
      ))}
      {v.evidence && <Tag style={{ left: '62%', top: '12%' }} ar="أَحَدٌ" color={P.crimson} delay={0.4}>One</Tag>}
      {v.interaction && <Rise from={[{ x: 46, y: 62 }]} count={6} height={30} seed={9} />}
    </Print>
  );
}

/* ---------- moments on story, question and cliffhanger pages: motion over the painting ---------- */

/** p1 Cover: the rising sun throws slow rays over the city and motes of light drift up from the hill. cover.webp fills
 *  the slide; the sun is expected right of centre. */
export function CoverDawn() {
  return (
    <>
      <SunRays x={64} y={50} size={70} />
      <Glow x={64} y={50} w={26} h={36} />
      <Rise from={[{ x: 70, y: 86 }, { x: 84, y: 86 }]} count={4} height={26} seed={11} />
    </>
  );
}

/** p5 One order: the sun comes up with its rays, then its daily path is drawn over the window: every day, the same way. */
export function SunClimb({ v }: { v: Built }) {
  useCue('whoosh', v.lines >= 2, 0.2);
  useCue('pen', v.lines >= 3, 0.3);
  return (
    <>
      {v.lines >= 2 && <SunRays x={72} y={46} size={60} />}
      {v.lines >= 2 && <Glow x={72} y={46} w={22} h={28} />}
      {v.lines >= 3 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <Pen d="M44 62 C54 14 80 10 96 40" color={P.goldSoft} width={0.6} dash="1.5 2" duration={1.6} delay={0.3} glow />
        </svg>
      )}
      {v.lines >= 3 && <Tag style={{ left: '62%', top: '24%' }} color={P.copper} delay={1.4}>Every day, the same way</Tag>}
    </>
  );
}

/** Lamps hanging between the palm-trunk pillars of masjid-night.webp (% of the picture-book box). */
const LAMPS = [24, 44, 64, 84];
/** p12 Allah loves him: the lamps of the empty mosque light one after another as the story is told; with the Prophet's ﷺ
 *  words a warm light fills the prayer row and motes of light rise from it. */
export function LampsGlow({ v }: { v: Built }) {
  const lit = Math.min(LAMPS.length, v.lines + (v.lines > 0 ? 1 : 0));
  useCue('chime', v.evidence, 0.4);
  return (
    <>
      {LAMPS.slice(0, lit).map((x) => <Glow key={x} x={x} y={30} w={12} h={18} />)}
      {v.evidence && (
        <>
          <Glow x={56} y={72} w={60} h={30} />
          <Rise from={[{ x: 44, y: 80 }, { x: 56, y: 80 }, { x: 68, y: 80 }]} count={4} height={30} seed={13} />
        </>
      )}
    </>
  );
}

/** p13 Only Allah, every day: a soft light gathers round Yusuf's raised hands as he whispers his du'a, motes rise from
 *  them, and a spark lands on his pencil when he gets to work. dua.webp in the spotlight panel. */
export function DuaLight({ v }: { v: Built }) {
  useCue('chime', v.lines >= 2, 0.3);
  useCue('sparkle', v.lines >= 3, 0.3);
  return (
    <>
      {v.lines >= 2 && <Glow x={40} y={56} w={30} h={26} />}
      {v.lines >= 2 && <Rise from={[{ x: 40, y: 54 }]} count={5} height={34} seed={15} />}
      {v.lines >= 3 && <Burst x={52} y={72} kind="sparks" count={12} seed={16} delay={0.2} spread={10} />}
    </>
  );
}

/** p16 Next time: the ball rolls away from Yusuf across the grass, then a spark marks the coach who will show him. */
export function BallRoll({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('thud', v.lines >= 2, 0.1);
  useCue('pop', v.lines >= 3, 0.4);
  return (
    <>
      {v.lines >= 2 && (
        <motion.span className="pointer-events-none absolute block h-[54px] w-[54px] rounded-full"
          style={{ top: '80%', background: 'radial-gradient(circle at 35% 35%, #FFFFFF, #E9E3D3 60%, #9C9584 100%)', boxShadow: 'inset -6px -6px 0 rgba(0,0,0,0.12), 0 10px 14px -8px rgba(0,0,0,0.6)' }}
          initial={reduce ? { left: '46%' } : { left: '28%', rotate: 0 }} animate={reduce ? { left: '46%' } : { left: ['28%', '46%', '44%'], rotate: [0, 540, 500] }}
          transition={{ duration: 1.8, times: [0, 0.8, 1], ease: 'easeOut' }}>
          <span className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#2A2420]" />
        </motion.span>
      )}
      {v.lines >= 3 && <Glow x={52} y={46} w={20} h={40} />}
      {v.lines >= 3 && <Burst x={52} y={40} kind="sparks" count={12} seed={18} delay={0.3} spread={10} />}
    </>
  );
}

/** p15 My Zad: a compass drops into Jiddo's bag, wobbles and settles pointing one way. */
export function CompassDrop({ v }: { v: Built }) {
  useCue('pop', v.lines >= 2, 0.5);
  return v.lines >= 2 ? (
    <Sprite name="l03/compass.webp" enter="drop" delay={0.2} className="w-[30%]" style={{ left: '35%', top: '30%' }}
      animate={{ opacity: 1, y: 0, rotate: [-30, 14, -6, 0] }} transition={{ opacity: { duration: 0.3, delay: 0.2 }, y: { type: 'spring', bounce: 0.45, delay: 0.2 }, rotate: { duration: 1.6, delay: 0.5, ease: 'easeOut' } }} />
  ) : null;
}
