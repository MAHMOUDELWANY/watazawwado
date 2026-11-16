import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { RIBBON } from './kit';
import { Logo } from './V2Ain';
import { Background, Bg, Emote, isDark, ZadStill, CRIMSON, GOLD_SOFT, INK, SANS, SERIF, WHITE } from './reel';

/**
 * Carousel engine in the Shorts style (owner, 2026-11-16: carousels in the same style as the v2 reels).
 * One frame = one 1080×1350 slide. Every slide: a bold colour field (or Meshy art), slammed serif lines, the 3D Zad,
 * a segmented progress ribbon, a swipe tag; the last slide is our ending (PACKED ✓, zaad bag, next pack).
 * Building blocks from reel.tsx (Big, Loop, Num, ArCard, Quote, Chips, Bubble) work here with f = SETTLED.
 */
export const SETTLED = 60; // a frame where every spring in reel.tsx has come to rest
export type Card = {
  bg: Bg;
  el: (dark: boolean) => React.ReactNode;
  zad?: { emote: Emote; k?: number; x: number; y: number; size: number; flip?: boolean; rot?: number };
  swipe?: string;
};

const Progress: React.FC<{ i: number; n: number }> = ({ i, n }) => (
  <div style={{ position: 'absolute', left: 60, right: 220, top: 96, display: 'flex', gap: 10 }}>
    {Array.from({ length: n }, (_, k) => (
      <div key={k} style={{ flex: 1, height: 12, borderRadius: 6, background: k <= i ? RIBBON : 'rgba(255,255,255,0.35)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
    ))}
  </div>
);

const Swipe: React.FC<{ text: string; dark: boolean }> = ({ text, dark }) => (
  <div style={{ position: 'absolute', right: 60, bottom: 60, padding: '14px 30px', borderRadius: 999, background: dark ? WHITE : INK, color: dark ? INK : WHITE,
    fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 2, boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>{text} ›</div>
);

/** Our ending, laid out for 1350 px. */
export const DeckOutro: React.FC<{ line?: React.ReactNode; ask: string; next: string }> = ({ line, ask, next }) => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 165, textAlign: 'center', transform: 'rotate(-6deg)' }}>
      <span style={{ display: 'inline-block', padding: '14px 46px', border: `9px solid ${GOLD_SOFT}`, borderRadius: 24, fontFamily: SERIF, fontWeight: 700, fontSize: 112, color: GOLD_SOFT, letterSpacing: 4 }}>PACKED ✓</span>
    </div>
    <div style={{ position: 'absolute', left: 70, right: 70, top: 420, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 62, lineHeight: 1.12, color: WHITE }}>
      {line ?? <>That’s your <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>zaad</span> for today.</>}
    </div>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', left: 90, top: 690, width: 300, transform: 'rotate(-6deg)', filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.45))' }} />
    <ZadStill emote="check" k={104} x={710} y={790} size={720} />
    <div style={{ position: 'absolute', left: 70, right: 70, top: 1010, borderRadius: 32, background: WHITE, padding: '24px 36px', boxShadow: '0 20px 34px rgba(0,0,0,0.35)' }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: CRIMSON }}>NEXT PACK ›</div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: INK, marginTop: 6 }}>{next}</div>
    </div>
    <div style={{ position: 'absolute', left: 70, right: 70, top: 1240, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 38, color: GOLD_SOFT }}>{ask}</div>
  </>
);

export const Deck: React.FC<{ cards: Card[]; outro: { line?: React.ReactNode; ask: string; next: string } }> = ({ cards, outro }) => {
  const f = useCurrentFrame();
  const all: Card[] = [...cards, { bg: 'ink', el: () => <DeckOutro {...outro} /> }];
  const i = Math.min(f, all.length - 1);
  const c = all[i];
  const dark = isDark(c.bg);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Background bg={c.bg} local={150} />
      {c.el(dark)}
      {c.zad && <ZadStill k={c.zad.k ?? 200} {...c.zad} size={c.zad.size * 1.6} />}
      <Progress i={i} n={all.length} />
      <Logo />
      {i < all.length - 1 && <Swipe text={c.swipe ?? (i === 0 ? 'SWIPE' : 'NEXT')} dark={dark} />}
    </AbsoluteFill>
  );
};
