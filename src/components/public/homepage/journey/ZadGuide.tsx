import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ZadRigSvg, type ZadPose } from '../../../zad/ZadRig';
import { useCurrentStation, type Station } from './Journey';

/**
 * Zad walks the visitor through the homepage (owner, 2026-11-18): he leaves the hero, then flies to a new spot on the
 * screen at every station, turns to it in a matching pose and says one short line. Tapping him opens the learning
 * guide chat, so he replaces the floating chat button on this page (LearningGuide listens for `zad:open-guide`).
 */

type L = { en: string; ar: string };
export type GuideStop = { pose: ZadPose; say: L; side: 'start' | 'end'; y: number };

export function openLearningGuide() {
  window.dispatchEvent(new CustomEvent('zad:open-guide'));
}

export function ZadGuide({ stations, stops, isEn }: { stations: Station[]; stops: GuideStop[]; isEn: boolean }) {
  const ids = React.useMemo(() => stations.map((s) => s.id), [stations]);
  const { index } = useCurrentStation(ids);
  const reduce = useReducedMotion();
  const [talking, setTalking] = React.useState(false);
  const [vp, setVp] = React.useState({ w: 1280, h: 800 });

  React.useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // A new station: he says his line for a few seconds, then goes quiet (the line stays on hover).
  React.useEffect(() => {
    if (index < 0) return;
    setTalking(true);
    const id = window.setTimeout(() => setTalking(false), 5200);
    return () => window.clearTimeout(id);
  }, [index]);

  const shown = index >= 0;
  const stop = stops[Math.max(0, Math.min(index, stops.length - 1))];
  // Wide screens: the side gutters at the station's height; the journey rail's side only where its gutter is wide
  // enough. Smaller screens: the bottom right corner (back-to-top sits bottom left), small.
  const wide = vp.w >= 1280;
  const roomy = vp.w >= 1500;
  const railLeft = isEn; // the rail sits on the start side
  let left = (stop.side === 'start') === isEn;
  if (wide && !roomy && left === railLeft) left = !left;
  if (!wide) left = false;
  const size = wide ? 104 : 64;
  const gap = wide ? (left === railLeft ? 170 : Math.max(24, vp.w * 0.025)) : 10;
  const x = left ? gap : vp.w - gap - size;
  const y = wide ? (vp.h * stop.y) / 100 : vp.h - size - 16;
  const flip = left ? 1 : -1;

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key="zad-guide"
          className="fixed top-0 left-0 z-40 pointer-events-none"
          initial={{ opacity: 0, scale: 0.4, x, y: y + 60 }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 70, damping: 16, mass: 1.1 }}
        >
          <div className="relative">
            {/* The flight: a little hop and lean while he moves to the next spot. */}
            <motion.button
              key={index}
              type="button"
              onClick={openLearningGuide}
              onMouseEnter={() => setTalking(true)}
              className="pointer-events-auto relative block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60"
              aria-label={isEn ? 'Ask Zad, our learning guide' : 'اسأل زاد، مرشد التعلم'}
              initial={reduce ? false : { y: -26, rotate: -10 * flip }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              <span aria-hidden="true" className="absolute inset-[18%] rounded-full bg-[#E5A93C]/30 blur-xl" />
              <span className="relative block" style={{ transform: `scaleX(${flip})` }}><ZadRigSvg pose={stop.pose} size={size} /></span>
            </motion.button>

            <AnimatePresence>
              {talking && (
                <motion.div
                  key={`say-${index}`}
                  role="status"
                  className={`absolute bottom-[96%] ${left ? 'left-0' : 'right-0'} w-max max-w-[min(12rem,70vw)]`}
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26, delay: reduce ? 0 : 0.35 }}
                  style={{ originX: left ? 0 : 1, originY: 1 }}
                >
                  <p className={`rounded-2xl ${left ? 'rounded-bl-md' : 'rounded-br-md'} bg-[#1C1411] px-3.5 py-2 text-[13px] sm:text-sm font-bold leading-snug text-[#FAF7F2] shadow-[0_14px_30px_-12px_rgba(28,20,17,0.6)] ring-1 ring-[#F6D58E]/25`}>
                    {isEn ? stop.say.en : stop.say.ar}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
