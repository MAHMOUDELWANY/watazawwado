import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ease, GOLD, CRIMSON, TEAL } from '../cinema/Cinema';
import { useReduce, type GraphicProps } from './Stage';
import { asset } from '../Art';

/**
 * Seerah · Teens & Adults · Episode 1, in the look of the owner's deck (docs/curriculum/seerah/RULES.md): a cinematic
 * still fills the stage (the owner's images, file names in docs/curriculum/seerah/IMAGE-PROMPTS.md), darkened on
 * the text side; the page's Arabic key term in gold; the deck's cards rise one per build step; a few pages add motion
 * that explains (numbers counting up, the elephant's compass). A still that has not arrived yet simply leaves the dark
 * stage. The Prophet ﷺ and the companions are never shown.
 */

export const BONE = '#F6F1E8';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };

/** The page's still, slowly pushing in; hidden until it loads (or if it is missing). */
function Still({ file, folder }: { file: string; folder: string }) {
  const [ok, setOk] = useState(false);
  const reduce = useReduce();
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: ok ? 1 : 0 }} transition={{ duration: 1.2 }}>
      <motion.img ref={(el) => { if (el?.complete && el.naturalWidth > 0) setOk(true); }} src={asset(`${folder}/${file}.webp`)} alt="" draggable={false} onLoad={() => setOk(true)} onError={() => setOk(false)}
        className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.04 }} animate={reduce ? { scale: 1.04 } : { scale: 1.12 }} transition={{ duration: 24, ease: 'linear' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(12,8,6,0.94) 0%, rgba(12,8,6,0.78) 34%, rgba(12,8,6,0.18) 62%, rgba(12,8,6,0.35) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(12,8,6,0.85) 0%, transparent 32%)' }} />
    </motion.div>
  );
}

/** The gold Arabic key term of the page. */
function Term({ text }: { text: string }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ right: 110, top: 210, textAlign: 'right' }}
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, delay: 0.5, ease }}>
      <span lang="ar" style={{ ...AR, fontSize: 64, color: GOLD, textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>{text}</span>
    </motion.div>
  );
}

/** One of the deck's cards: a label in caps (before the colon) and its fact. */
function Card({ label, i, n, tint }: { label: string; i: number; n: number; tint: string }) {
  const [tag, fact] = label.includes(':') ? [label.slice(0, label.indexOf(':')), label.slice(label.indexOf(':') + 1).trim()] : ['', label];
  const w = n > 2 ? 230 : 300;
  return (
    <motion.div className="pointer-events-none absolute" style={{ right: 110 + (n - 1 - i) * (w + 18), bottom: 140, width: w, padding: '16px 18px 18px', background: 'rgba(20,12,9,0.72)', border: `1px solid ${GOLD}55`, backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
      {tag && <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.18em', color: tint }}>{tag}</p>}
      <p className="m-0 mt-1 font-serif" style={{ fontSize: /\d{2}/.test(fact) ? 44 : 26, lineHeight: 1.1, color: BONE }}>{fact}</p>
    </motion.div>
  );
}

type Opts = { still: string; term: string; tint?: string; folder?: string; extra?: (p: GraphicProps) => React.ReactNode };

/** Builds a page graphic from its still, term and cards (the labels of the page, one per build step). */
export function make({ still, term, tint = GOLD, folder = 'seerah-teens/ep01', extra }: Opts) {
  return function SeerahPage(p: GraphicProps) {
    return (
      <>
        <Still file={still} folder={folder} />
        {term && <Term text={term} />}
        {p.labels.slice(0, p.items).map((l, i) => <Card key={l} label={l} i={i} n={p.labels.length} tint={tint} />)}
        {extra?.(p)}
      </>
    );
  };
}

/** The army's numbers count up as they are named. */
export function CountUp({ to, x, y, label }: { to: number; x: number; y: number; label: string }) {
  const [n, setN] = useState(0);
  React.useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1600); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <motion.div className="pointer-events-none absolute text-right" style={{ right: x, top: y }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="font-serif" style={{ fontSize: 120, lineHeight: 1, color: BONE }}>{n.toLocaleString('en')}</div>
      <div className="font-sans font-bold uppercase" style={{ fontSize: 15, letterSpacing: '0.2em', color: GOLD }}>{label}</div>
    </motion.div>
  );
}

/** The elephant's compass: north, south and east light up as "moves"; west, toward the Kaaba, stays shut. */
function Compass({ lines }: { lines: number }) {
  const c = { x: 1240, y: 520 };
  const dirs = [{ k: 'N', x: 0, y: -1 }, { k: 'S', x: 0, y: 1 }, { k: 'E', x: 1, y: 0 }];
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      <circle cx={c.x} cy={c.y} r={150} fill="rgba(12,8,6,0.55)" stroke={`${GOLD}66`} strokeWidth={2} />
      {lines >= 2 && dirs.map((d, i) => (
        <motion.g key={d.k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.4 }}>
          <motion.line x1={c.x} y1={c.y} x2={c.x + d.x * 130} y2={c.y + d.y * 130} stroke={TEAL} strokeWidth={6} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.4 }} />
          <text x={c.x + d.x * 170} y={c.y + d.y * 170 + 8} fill={BONE} fontSize={24} fontWeight={700} textAnchor="middle">{d.k}</text>
        </motion.g>
      ))}
      {lines >= 3 && (
        <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }} transition={{ type: 'spring', bounce: 0.4 }}>
          <line x1={c.x} y1={c.y} x2={c.x - 120} y2={c.y} stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" strokeDasharray="6 10" />
          <path d={`M ${c.x - 150} ${c.y - 20} l 40 40 M ${c.x - 110} ${c.y - 20} l -40 40`} stroke={CRIMSON} strokeWidth={8} strokeLinecap="round" />
          <text x={c.x - 190} y={c.y + 60} fill={GOLD} fontSize={20} fontWeight={700} textAnchor="middle">the Kaaba</text>
        </motion.g>
      )}
    </svg>
  );
}

/** A quote card for the line of the episode. */
export function Quote({ text, by, kicker = 'The words that shook a throne' }: { text: string; by: string; kicker?: string }) {
  return (
    <motion.figure className="pointer-events-none absolute m-0" style={{ right: 110, bottom: 140, width: 640, padding: '22px 26px', background: 'rgba(20,12,9,0.78)', borderLeft: `3px solid ${GOLD}` }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
      <p className="m-0 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.2em', color: GOLD }}>{kicker}</p>
      <blockquote className="m-0 mt-2 font-serif italic" style={{ fontSize: 30, lineHeight: 1.25, color: BONE }}>“{text}”</blockquote>
      <figcaption className="mt-2 font-sans font-bold uppercase" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'rgba(246,241,232,0.6)' }}>{by}</figcaption>
    </motion.figure>
  );
}

export const Se1CoverGraphic = make({ still: 'cover', term: 'عَامُ الفِيل' });
export const Se1EmpiresGraphic = make({ still: 'empires', term: 'عَالَمُ الإِمْبِرَاطُورِيَّات' });
export const Se1JahiliyyahGraphic = make({ still: 'jahiliyyah', term: 'الجَاهِلِيَّة', tint: CRIMSON });
export const Se1MakkahGraphic = make({ still: 'makkah', term: 'مَكَّةُ المُكَرَّمَة' });
export const Se1AbrahaGraphic = make({ still: 'abraha', term: 'أَبْرَهَةُ الحَبَشِيّ', tint: CRIMSON });
export const Se1QullaysGraphic = make({ still: 'qullays', term: 'القُلَّيْس' });
export const Se1ScalesGraphic = make({ still: 'scales', term: 'اخْتِبَارُ المَنْطِق' });
export const Se1MarchGraphic = make({
  still: 'march', term: 'جَيْشُ الفِيل', tint: CRIMSON,
  extra: ({ lines }) => (<>{lines >= 1 && <CountUp to={60000} x={110} y={300} label="soldiers" />}{lines >= 2 && <CountUp to={13} x={110} y={450} label="war elephants (9 or 13)" />}</>),
});
export const Se1CampGraphic = make({ still: 'camp', term: 'المُغَمِّس', extra: ({ lines }) => lines >= 2 && <CountUp to={200} x={110} y={330} label="camels seized" /> });
export const Se1WalkGraphic = make({ still: 'walk', term: 'عَبْدُ المُطَّلِب' });
export const Se1TentGraphic = make({ still: 'tent', term: 'أَنَا رَبُّ الإِبِل', extra: ({ lines }) => lines >= 3 && <Quote text="I am the owner of the camels. The House has a Lord who will protect it." by="Abdul-Muttalib to Abraha · reported by Ibn Ishaq" /> });
export const Se1TrustGraphic = make({ still: 'storm-tree', term: 'التَّوَكُّل' });
export const Se1KneelGraphic = make({ still: 'kneel', term: 'بُرُوكُ الفِيل', extra: ({ lines }) => lines >= 1 && <Compass lines={lines} /> });
export const Se1SpearGraphic = make({ still: 'spear', term: 'وَهْمُ القُوَّة' });
export const Se1BirdsGraphic = make({ still: 'birds', term: 'طَيْرًا أَبَابِيل' });
export const Se1FilGraphic = make({ still: 'stones', term: '' });
export const Se1AftermathGraphic = make({ still: 'aftermath', term: 'عِزَّةُ الحَقّ' });
export const Se1CradleGraphic = make({ still: 'cradle', term: 'المَوْلِدُ النَّبَوِيّ' });
export const Se1MissionGraphic = make({ still: 'return', term: 'زَادِي' });
export const Se1NextGraphic = make({ still: 'badiyah', term: 'بَادِيَةُ بَنِي سَعْد', tint: CRIMSON });
