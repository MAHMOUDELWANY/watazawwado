import React from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react';
import { ZadRig, type ZadPose } from '../../../zad/ZadRig';
import { useCurrentStation, type Station } from './Journey';

/**
 * Zad walks the visitor through the homepage (owner, 2026-11-18). He appears beside the film ("sound on, then play"),
 * flies to a new spot at every station with a pose and one short line, steps aside where a section has its own Zad,
 * and at the end lands in the closing section's slot (`dockId`) instead of a second, static Zad. The 3D Zad, with
 * the SVG one until it loads. Tapping him opens the learning guide chat (he replaces the floating chat button on this
 * page; LearningGuide listens for `zad:open-guide`), or plays the film in the intro.
 */

type L = { en: string; ar: string };
export type GuideStop = { pose: ZadPose; say: L; side: 'start' | 'end'; y: number; hide?: boolean };

export function openLearningGuide() {
  window.dispatchEvent(new CustomEvent('zad:open-guide'));
}

type Intro = { targetId: string; stop: GuideStop; onTap: () => void };

export function ZadGuide({ stations, stops, isEn, intro, dockId }: { stations: Station[]; stops: GuideStop[]; isEn: boolean; intro?: Intro; dockId?: string }) {
  const ids = React.useMemo(() => stations.map((s) => s.id), [stations]);
  const { index } = useCurrentStation(ids);
  const reduce = useReducedMotion();
  const [talking, setTalking] = React.useState(false);
  const [vp, setVp] = React.useState({ w: 1280, h: 800 });
  const [introOn, setIntroOn] = React.useState(false);
  const [dock, setDock] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // The intro: while the film is on screen.
  React.useEffect(() => {
    const mark = intro && document.getElementById(intro.targetId);
    // The target may be a zero-height marker: watch the block it sits in.
    const el = mark && mark.offsetHeight < 2 ? mark.parentElement : mark;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setIntroOn(e.intersectionRatio > 0.6), { threshold: [0, 0.35, 0.6, 0.8] });
    io.observe(el);
    return () => io.disconnect();
  }, [intro]);

  // The landing slot: followed every frame while it is on screen, so he sits in it as the page scrolls.
  React.useEffect(() => {
    if (!dockId) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = document.getElementById(dockId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.1;
      setDock(inView ? r : null);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // The page keeps settling after a scroll (accordions, images): re-measure a few times a second too.
    const tick = window.setInterval(onScroll, 300);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); window.clearInterval(tick); if (raf) cancelAnimationFrame(raf); };
  }, [dockId]);

  const stationStop = index >= 0 ? stops[Math.min(index, stops.length - 1)] : null;
  const mode: 'dock' | 'station' | 'intro' | 'off' = dock ? 'dock' : stationStop && !stationStop.hide ? 'station' : index < 0 && introOn && intro ? 'intro' : 'off';
  const stop = mode === 'intro' ? intro!.stop : stationStop ?? stops[0];
  const key = mode === 'station' ? `s${index}` : mode;

  // Each new place: he says his line for a few seconds, then goes quiet (the line comes back on hover).
  React.useEffect(() => {
    if (mode === 'off' || mode === 'dock') { setTalking(false); return; }
    setTalking(true);
    const id = window.setTimeout(() => setTalking(false), mode === 'intro' ? 7000 : 5200);
    return () => window.clearTimeout(id);
  }, [key, mode]);

  // Wide screens: the side gutters at the station's height; the journey rail's side only where its gutter is wide
  // enough. Smaller screens: the bottom corner on the end side (back-to-top sits on the start side), small.
  const wide = vp.w >= 1280;
  const roomy = vp.w >= 1500;
  const railLeft = isEn;
  let left = (stop.side === 'start') === isEn;
  if (wide && !roomy && left === railLeft) left = !left;
  if (!wide) left = !isEn;
  let size = wide ? 110 : 70;
  let x: number, y: number;
  if (mode === 'dock' && dock) {
    size = Math.min(dock.width, dock.height);
    x = dock.left + (dock.width - size) / 2;
    y = dock.top + (dock.height - size) / 2;
  } else {
    const gap = wide ? (left === railLeft ? 170 : Math.max(24, vp.w * 0.025)) : 10;
    x = left ? gap : vp.w - gap - size;
    y = wide ? (vp.h * stop.y) / 100 : vp.h - size - 16;
  }
  const flip = left || mode === 'dock' ? 1 : -1;
  const tap = mode === 'intro' ? intro!.onTap : openLearningGuide;
  // A little hop and lean at each new place. Not a remount: that would rebuild the 3D Zad every time.
  const hop = useAnimationControls();
  React.useEffect(() => {
    if (reduce || mode === 'off') return;
    void hop.start({ y: [-26, 0], rotate: [-10 * flip, 0], transition: { type: 'spring', stiffness: 260, damping: 14 } });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const spring = mode === 'dock' ? { type: 'spring' as const, stiffness: 320, damping: 34 } : { type: 'spring' as const, stiffness: 70, damping: 16, mass: 1.1 };

  return (
    <AnimatePresence>
      {mode !== 'off' && (
        <motion.div
          key="zad-guide"
          className="fixed top-0 left-0 z-40 pointer-events-none"
          initial={{ opacity: 0, scale: 0.4, x, y: y + 60 }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={reduce ? { duration: 0 } : spring}
        >
          <div className="relative">
            <motion.button
              type="button"
              onClick={tap}
              onMouseEnter={() => mode !== 'dock' && setTalking(true)}
              className="pointer-events-auto relative block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60"
              aria-label={mode === 'intro' ? (isEn ? 'Play our story with sound' : 'شغّل قصتنا بالصوت') : (isEn ? 'Ask Zad, our learning guide' : 'اسأل زاد، مرشد التعلم')}
              animate={hop}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              <span className="relative block" style={{ transform: `scaleX(${flip})` }}>
                <ZadRig pose={mode === 'dock' ? 'cheer' : stop.pose} size={size} glow={mode === 'dock'} />
              </span>
            </motion.button>

            <AnimatePresence>
              {talking && (
                <motion.div
                  key={`say-${key}`}
                  role="status"
                  className={`absolute bottom-[96%] ${left ? 'left-0' : 'right-0'} w-max max-w-[min(13rem,70vw)]`}
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
