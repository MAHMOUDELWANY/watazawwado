import React, { useCallback, useEffect, useId, useLayoutEffect, useState } from 'react';
import { SIGNATURE_BOX as B, SIGNATURE_LETTERS } from './signaturePaths';

/**
 * The signature intro, every time the site or the installed app is opened (once per browser session; owner,
 * 2026-11-02, "signature intro" in docs/design/INSPIRATION.md):
 *
 * 1. "Watazawwado" is written letter by letter in our crimson: each letter is revealed by a broad pen that follows
 *    its own outline (an SVG mask), so the ink grows the way a hand would write it.
 * 2. A gold swash runs under the name and ends in the khatam, stamped like a seal; "ACADEMY" settles under it.
 * 3. As in the reference: the signature grows from the middle of the screen and fades, while the paper opens from
 *    the centre outwards onto the page; the hero photos then unveil on a diagonal.
 *
 * Decided before the first paint by the inline script in index.html (`html.sig-intro`), so the page never flashes
 * first; a CSS cover hides it until this component is on screen, and lifts by itself after 3 s if scripts never
 * arrive. About 2.9 s; any tap or key ends it at once.
 */
const WRITE_FROM = 0.12;
const WRITE_TO = 1.45;
// Letters take time in proportion to how much there is to draw (the capital W is the longest); each overlaps the
// next a little, as a hand starts the next letter before lifting from the last.
const weights = SIGNATURE_LETTERS.map((d) => d.length);
const total = weights.reduce((a, b) => a + b, 0);
const OVERLAP = 0.35;
const TIMING = (() => {
  let at = WRITE_FROM;
  const unit = (WRITE_TO - WRITE_FROM) / (total * (1 - OVERLAP) + weights[weights.length - 1] * OVERLAP);
  return weights.map((w) => {
    const dur = w * unit;
    const t = { delay: at, dur };
    at += dur * (1 - OVERLAP);
    return t;
  });
})();

// The swash under the name, ending where the khatam is stamped.
const SWASH = 'M 22 34 C 96 47, 214 47, 338 24';
const SEAL = { x: 348, y: 21, r: 8.5 };

export function SignatureIntro() {
  const [playing, setPlaying] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // The cover lifts only here, when the intro ends or is skipped, never before it starts.
  const finish = useCallback(() => {
    document.documentElement.classList.remove('sig-intro', 'sig-playing');
    setPlaying(false);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('sig-intro')) return;
    // On a slow connection the CSS cover has already lifted (3 s) and the visitor is reading: no intro then.
    if (performance.now() > 2500) { root.classList.remove('sig-intro'); return; }
    setPlaying(true);
  }, []);

  // The cover gives way only once the overlay is in the DOM, so no frame of the page shows in between.
  useLayoutEffect(() => {
    if (playing) document.documentElement.classList.add('sig-playing');
  }, [playing]);

  // The hero photos unveil as the paper opens; with the language welcome next, they wait for the visitor's choice.
  useEffect(() => {
    if (!playing) return;
    const root = document.documentElement;
    if (root.classList.contains('lang-welcome')) return;
    const start = window.setTimeout(() => {
      root.classList.add('sig-revealing');
      // Not cleared with the intro: the class must go, or the photos keep the animation's end state (no hover zoom).
      window.setTimeout(() => root.classList.remove('sig-revealing'), 1900);
    }, 2150);
    return () => window.clearTimeout(start);
  }, [playing]);

  useEffect(() => {
    if (!playing) return;
    const skip = () => { document.documentElement.classList.remove('sig-revealing'); finish(); };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [playing, finish]);

  if (!playing) return null;
  const pad = 8;
  return (
    <div className="sig-intro-overlay" aria-hidden="true" data-testid="signature-intro" dir="ltr">
      <div className="sig-paper" onAnimationEnd={(e) => { if (e.target === e.currentTarget) finish(); }} />
      <div className="sig-lockup">
        <svg className="sig-svg" viewBox={`${B.x} ${B.y} ${B.w} ${B.h}`} role="presentation">
          <defs>
            {SIGNATURE_LETTERS.map((d, i) => (
              <mask key={i} id={`${uid}-m${i}`} maskUnits="userSpaceOnUse" x={B.x - pad} y={B.y - pad} width={B.w + pad * 2} height={B.h + pad * 2}>
                <path
                  d={d}
                  className="sig-pen"
                  pathLength={1}
                  style={{ animationDelay: `${TIMING[i].delay}s`, animationDuration: `${TIMING[i].dur}s` }}
                />
              </mask>
            ))}
          </defs>
          <g className="sig-ink">
            {SIGNATURE_LETTERS.map((d, i) => <path key={i} d={d} mask={`url(#${uid}-m${i})`} />)}
          </g>
          <path className="sig-swash" d={SWASH} pathLength={1} />
          <g className="sig-seal" style={{ transformOrigin: `${SEAL.x}px ${SEAL.y}px` }}>
            <circle className="sig-seal-ring" cx={SEAL.x} cy={SEAL.y} r={SEAL.r * 1.25} />
            {[0, 45].map((deg) => (
              <rect
                key={deg}
                x={SEAL.x - SEAL.r / 1.6}
                y={SEAL.y - SEAL.r / 1.6}
                width={(SEAL.r / 1.6) * 2}
                height={(SEAL.r / 1.6) * 2}
                transform={`rotate(${deg} ${SEAL.x} ${SEAL.y})`}
              />
            ))}
          </g>
        </svg>
        <span className="sig-caption">Academy</span>
      </div>
    </div>
  );
}
