import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTheme } from '../../ThemeProvider';
import type { CarpetScene } from './carpetScene';

/**
 * "Here, your teacher stays." right after "Sound familiar?": the teacher arrives on a flying carpet, lifts the child
 * up beside them, and they fly into the infinity together (owner's idea 1, 2026-11-05). The 3D scene (three.js) is
 * loaded only when the visitor gets close; the words are plain text, so they read without it.
 */

const LINE_AR = 'هنا، يبقى معلّمك معك.';
const LINE_EN = 'Here, your teacher stays.';
// Short captions for each moment of the story, by scroll progress.
const BEATS: [number, number, { en: string; ar: string }][] = [
  [0, 0.12, { en: 'A child, on their own…', ar: 'طفل واقف وحده…' }],
  [0.14, 0.32, { en: 'Someone is coming…', ar: 'أحدٌ قادم من بعيد…' }],
  [0.36, 0.48, { en: 'Unsure… then a hand reaches out', ar: 'يتردد… ثم يمد يده' }],
  [0.5, 0.62, { en: 'Lifted up, side by side', ar: 'يرفعه إلى جانبه' }],
  [0.72, 0.9, { en: 'And on they go, together', ar: 'ويكملان الطريق معًا' }],
];

// The script faces load for these few letters only: Aref Ruqaa for the Arabic line, Caveat for the English one.
function useScriptFonts() {
  useEffect(() => {
    if (document.getElementById('stays-fonts')) return;
    const link = document.createElement('link');
    link.id = 'stays-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Caveat:wght@600&display=swap&text='
      + encodeURIComponent(Array.from(new Set(LINE_AR + LINE_EN)).join(''));
    document.head.appendChild(link);
  }, []);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export function TeacherStays({ isEn }: { isEn: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vowRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CarpetScene | null>(null);
  const { theme } = useTheme();
  const still = Boolean(useReducedMotion());
  const [beat, setBeat] = useState(-1);
  const [ready, setReady] = useState(false);
  useScriptFonts();

  useEffect(() => {
    const section = sectionRef.current, stage = stageRef.current, canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;
    let cancelled = false;
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      import('./carpetScene').then(({ mountCarpetScene }) => {
        if (cancelled) return;
        sceneRef.current = mountCarpetScene({
          section, stage, canvas, still,
          dark: document.documentElement.classList.contains('dark'),
          onFrame: (p) => {
            const v = vowRef.current;
            if (v) {
              v.style.setProperty('--w', String(ease(seg(p, 0.9, 0.97))));
              v.style.setProperty('--w2', String(ease(seg(p, 0.93, 0.99))));
              v.style.setProperty('--o', String(seg(p, 0.96, 1)));
            }
            setBeat(BEATS.findIndex(([a, b]) => p >= a && p < b));
          },
        });
        setReady(Boolean(sceneRef.current));
      }).catch(() => setReady(false));
    }, { rootMargin: '150% 0px' });
    near.observe(section);
    return () => { cancelled = true; near.disconnect(); sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [still]);

  useEffect(() => { sceneRef.current?.setTheme(theme === 'dark'); }, [theme]);

  // Without the scene (no WebGL, or still loading) the words show in full.
  const full = !ready;
  const primary = isEn ? LINE_EN : LINE_AR, secondary = isEn ? LINE_AR : LINE_EN;
  const primaryFont = isEn ? "'Caveat', var(--font-serif), cursive" : "'Aref Ruqaa', var(--font-serif), serif";
  const secondaryFont = isEn ? "'Aref Ruqaa', var(--font-serif), serif" : "'Caveat', var(--font-serif), cursive";
  // Each line is written in its own reading direction.
  const reveal = (v: string, rtl: boolean) => (full ? undefined : rtl
    ? `inset(-20% 0 -20% calc((1 - var(${v},0)) * 100%))`
    : `inset(-20% calc((1 - var(${v},0)) * 100%) -20% 0)`);

  return (
    <section ref={sectionRef} className={still ? 'relative h-[100svh]' : 'relative h-[600vh]'} aria-labelledby="home-stays">
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#F0DCC6,var(--background)_72%)] dark:bg-[linear-gradient(180deg,#0A1219,#1E150E_72%)]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full" />
        <p
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top,0px))] sm:top-24 text-center text-sm sm:text-base font-semibold text-muted-foreground transition-opacity duration-500"
          style={{ opacity: beat >= 0 && !full ? 1 : 0 }}
        >
          {beat >= 0 ? (isEn ? BEATS[beat][2].en : BEATS[beat][2].ar) : ' '}
        </p>
        <div ref={vowRef} className="absolute inset-x-0 bottom-0 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] text-center pointer-events-none">
          <h2
            id="home-stays"
            lang={isEn ? 'en' : 'ar'}
            dir={isEn ? 'ltr' : 'rtl'}
            className="text-ribbon text-[2.4rem] sm:text-6xl leading-[1.45] font-bold"
            style={{ clipPath: reveal('--w', !isEn) }}
          >
            {/* The font sits on a span: the site's RTL heading rule pins h2 to Thmanyah with !important. */}
            <span style={{ fontFamily: primaryFont }}>{primary}</span>
          </h2>
          <p
            lang={isEn ? 'ar' : 'en'}
            dir={isEn ? 'rtl' : 'ltr'}
            className="text-2xl sm:text-3xl text-foreground"
            style={{ fontFamily: secondaryFont, clipPath: reveal('--w2', isEn) }}
          >
            {secondary}
          </p>
          <p className="mt-1.5 mx-auto max-w-[34ch] text-sm sm:text-base text-muted-foreground" style={{ opacity: full ? 1 : 'var(--o,0)' }}>
            {isEn ? 'One teacher who knows you, and picks up where you left off.' : 'معلّم واحد يعرفك، ويكمل معك من حيث وقفت.'}
          </p>
        </div>
      </div>
    </section>
  );
}
