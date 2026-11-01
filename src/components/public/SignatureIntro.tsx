import React, { useCallback, useEffect, useState } from 'react';

/**
 * First visit of the public site ("signature intro" in docs/design/INSPIRATION.md; owner, 2026-11-02: in English,
 * written like a hand signature, one brand ink colour, no multi-colour gradient).
 *
 * 1. "Watazawwado" is written by hand: a slanted pen edge moves left to right over a signature script.
 * 2. "ACADEMY" settles in under it.
 * 3. The signature grows past the screen while the cream curtain lifts, and the hero photos unveil beneath.
 *
 * The decision is made before the first paint by the inline script in index.html: it marks <html class="sig-intro">
 * (first visit only, public pages only, not in the installed app, not with reduced motion), and a CSS cover hides the
 * page until this component takes over; if scripts never arrive, the cover lifts by itself after 3 seconds.
 * About 2.6 seconds once it starts; any tap or key ends it at once.
 */
const SCRIPT_FONT = '"Mrs Saint Delafield"';
const WORD = 'Watazawwado';

export function SignatureIntro() {
  const [phase, setPhase] = useState<'off' | 'waiting' | 'playing'>('off');
  const [fallback, setFallback] = useState(false);

  // The cover lifts only here, when the intro ends or is skipped, never before it starts.
  const finish = useCallback(() => {
    document.documentElement.classList.remove('sig-intro');
    setPhase('off');
  }, []);

  // The hero photos start to unveil as the curtain starts to lift (1.95 s into the intro), so they are never seen
  // whole and then hidden again.
  useEffect(() => {
    if (phase !== 'playing') return;
    const root = document.documentElement;
    const start = window.setTimeout(() => {
      root.classList.add('sig-revealing');
      // Not cleared with the intro: the class must go, or the photos keep the animation's end state (no hover zoom).
      window.setTimeout(() => root.classList.remove('sig-revealing'), 1700);
    }, 1900);
    return () => window.clearTimeout(start);
  }, [phase]);

  useEffect(() => {
    if (!document.documentElement.classList.contains('sig-intro')) return;
    // On a slow connection the CSS cover has already lifted (3 s) and the visitor is reading: no intro then.
    if (performance.now() > 2500) { document.documentElement.classList.remove('sig-intro'); return; }
    setPhase('waiting');
    let gone = false;
    // Wait (briefly) for the signature font; if it is late, write with our own serif instead, never an empty screen.
    const spec = `400 120px ${SCRIPT_FONT}`;
    const font = document.fonts?.load?.(spec, WORD) ?? Promise.resolve();
    const wait = new Promise((r) => setTimeout(r, 1200));
    Promise.race([font, wait]).then(() => {
      if (gone) return;
      if (!document.fonts?.check?.(spec, WORD)) setFallback(true);
      setPhase('playing');
    });
    return () => { gone = true; };
  }, []);

  useEffect(() => {
    if (phase === 'off') return;
    const skip = () => { document.documentElement.classList.remove('sig-revealing'); finish(); };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [phase, finish]);

  if (phase === 'off') return null;
  return (
    <div
      className={`sig-intro-overlay ${phase === 'playing' ? 'is-playing' : ''} ${fallback ? 'is-fallback' : ''}`}
      aria-hidden="true"
      data-testid="signature-intro"
      dir="ltr"
      onAnimationEnd={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <div className="sig-lockup">
        <span className="sig-word">{WORD}</span>
        <span className="sig-caption">Academy</span>
      </div>
    </div>
  );
}
