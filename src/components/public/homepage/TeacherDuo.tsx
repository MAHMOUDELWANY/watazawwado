import React from 'react';
import { Link } from '../LangLink';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Homepage hero visual: the two teachers in arch (mihrab-shaped) frames, side by side.
 * One entrance on load, then a slow float with a breathing glow; both stop for reduced motion.
 */

type Teacher = {
  src: string;
  objectPosition: string;
  glow: string;
  ring: string;
  name: { en: string; ar: string };
};

const TEACHERS: Teacher[] = [
  {
    src: '/ustadh-mahmoud.jpg',
    objectPosition: '50% 35%',
    glow: 'rgba(8,125,145,0.55)',
    ring: 'linear-gradient(160deg,#087D91 0%,#E5A93C 55%,#8B4935 100%)',
    name: { en: 'Ustadh Mahmoud', ar: 'الأستاذ محمود' },
  },
  {
    src: '/ustadha-afnan.jpg',
    objectPosition: '72% 30%',
    glow: 'rgba(229,169,60,0.55)',
    ring: 'linear-gradient(160deg,#E5A93C 0%,#C51F24 60%,#8B4935 100%)',
    name: { en: 'Ustadha Afnan', ar: 'الأستاذة أفنان' },
  },
];

// Arch: a true semicircle on top (50% of the width = 40% of a 4:5 height), soft corners below.
// rounded-t-full would make the browser shrink every corner, flattening the bottom ones to square.
const ARCH: React.CSSProperties = { borderRadius: '50% 50% 2rem 2rem / 40% 40% 2rem 2rem' };

export function TeacherDuo({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[520px] pt-2 pb-4 lg:pb-10">
      {/* Shared soft light behind both frames */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-10 bottom-16 rounded-[48%] opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(8,125,145,0.28), rgba(229,169,60,0.18), transparent)' }}
      />

      {/* The logo's ribbon (crimson → copper → gold → teal) draws once behind both teachers, linking them. */}
      <svg aria-hidden="true" viewBox="0 0 520 460" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="duo-ribbon" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C51F24" />
            <stop offset="38%" stopColor="#B4552F" />
            <stop offset="62%" stopColor="#E5A93C" />
            <stop offset="100%" stopColor="#087D91" />
          </linearGradient>
        </defs>
        {[{ w: 14, o: 0.18 }, { w: 3, o: 0.9 }].map(({ w, o }) => (
          <motion.path
            key={w}
            d="M-20 260 C 70 330, 170 200, 260 215 S 430 70, 545 130"
            fill="none"
            stroke="url(#duo-ribbon)"
            strokeWidth={w}
            strokeLinecap="round"
            strokeOpacity={o}
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}
      </svg>

      <div className="relative grid grid-cols-2 gap-4 sm:gap-6 items-start">
        {TEACHERS.map((t, i) => (
          <motion.div
            key={t.src}
            className={i === 1 ? 'mt-10 sm:mt-14' : ''}
            // PU-04: no fade. The photos are the page's largest paint (LCP); at opacity 0 the prerendered
            // ones stayed invisible until the JavaScript ran (~5 s on a mid-range phone). They slide in only.
            initial={reduce ? false : { y: 36 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6 + i * 1.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 + i * 0.8 }}
            >
              <Link
                to="/about"
                style={ARCH}
                className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-primary focus-visible:ring-offset-background"
                aria-label={isEn ? `About ${t.name.en}` : `عن ${t.name.ar}`}
              >
                {/* Breathing glow */}
                <motion.span
                  aria-hidden="true"
                  className="absolute -inset-3 blur-2xl"
                  style={{ ...ARCH, background: t.glow }}
                  animate={reduce ? { opacity: 0.45 } : { opacity: [0.3, 0.6, 0.3], scale: [0.97, 1.02, 0.97] }}
                  transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Gradient ring, then the photo */}
                <span className="relative block p-[3px] shadow-2xl" style={{ ...ARCH, background: t.ring }}>
                  <span className="block overflow-hidden bg-surface" style={ARCH}>
                    <img
                      src={t.src}
                      alt={isEn ? t.name.en : t.name.ar}
                      width={320}
                      height={400}
                      decoding="async"
                      className="block w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      style={{ objectPosition: t.objectPosition }}
                    />
                  </span>
                </span>
              </Link>
            </motion.div>

            <div className="mt-4 text-center">
              <p className="font-editorial text-lg sm:text-xl font-bold text-foreground">{isEn ? t.name.en : t.name.ar}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
