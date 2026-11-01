import React, { useCallback, useEffect, useState } from 'react';

/**
 * First visit of the public site (owner, 2026-11-01; "signature intro" in docs/design/INSPIRATION.md): the name
 * وتزودوا writes itself in Ruqaa calligraphy with the ribbon colours, grows, and the page appears beneath it.
 *
 * The decision is made before the first paint by the inline script in index.html: it marks <html class="sig-intro">
 * (first visit only, public pages only, not in the installed app, not with reduced motion), and a CSS cover hides the
 * page until this component takes over. If JavaScript never arrives, the cover removes itself after 3 seconds.
 * About 1.9 seconds; any tap or key ends it at once.
 */
export function SignatureIntro({ isEn }: { isEn: boolean }) {
  const [phase, setPhase] = useState<'off' | 'waiting' | 'playing'>('off');
  const [fallback, setFallback] = useState(false);
  // The cover in index.html lifts only here, when the intro ends or is skipped, never before it starts.
  const finish = useCallback(() => {
    document.documentElement.classList.remove('sig-intro');
    setPhase('off');
  }, []);

  useEffect(() => {
    if (!document.documentElement.classList.contains('sig-intro')) return;
    // On a slow connection the CSS cover has already lifted (3 s) and the visitor is reading: no intro then.
    if (performance.now() > 2500) { document.documentElement.classList.remove('sig-intro'); return; }
    setPhase('waiting');
    let gone = false;
    // Wait (briefly) for the calligraphy font; if it is not here in time, draw with our own display face instead,
    // which is already on the page, so the word is never invisible.
    const spec = '700 120px "Aref Ruqaa"';
    const font = document.fonts?.load?.(spec, 'وتزودوا') ?? Promise.resolve();
    const wait = new Promise((r) => setTimeout(r, 1200));
    Promise.race([font, wait]).then(() => {
      if (gone) return;
      if (!document.fonts?.check?.(spec, 'وتزودوا')) setFallback(true);
      setPhase('playing');
    });
    return () => { gone = true; };
  }, []);

  useEffect(() => {
    if (phase === 'off') return;
    const skip = () => finish();
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
      onAnimationEnd={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <svg viewBox="0 0 520 240" className="sig-svg">
        <defs>
          <linearGradient id="sig-ribbon" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset="0%" stopColor="#087D91" />
            <stop offset="50%" stopColor="#E5A93C" />
            <stop offset="100%" stopColor="#C51F24" />
          </linearGradient>
        </defs>
        <text x="260" y="170" textAnchor="middle" direction="rtl" className="sig-word">وتزودوا</text>
      </svg>
      {isEn && <p className="sig-caption">Watazawwado Academy</p>}
    </div>
  );
}
