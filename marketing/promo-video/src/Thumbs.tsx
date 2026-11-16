import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD, SANS, SERIF, TEAL_DEEP } from './kit';
import { INK, Logo, WHITE } from './V2Ain';

/**
 * Shorts / Reels cover thumbnails, one fixed identity (2026-11-16): Meshy paper-cut hero art (no people, no text),
 * a series pill, a two-line serif title with one crimson italic word, the ribbon frame, the logo and the zaad bag.
 * One frame = one thumbnail: `npx remotion still src/index.ts Thumbs out.png --frame=<index>`.
 */
type T = { id: string; series: string; a: string; em: string; b?: string };
export const THUMBS: T[] = [
  { id: 'v2', series: 'Fix one letter', a: 'Your ع starts in your', em: 'throat' },
  { id: 'v4', series: 'Not a stranger', a: 'Meet the teacher', em: 'first' },
  { id: 'v5', series: 'Learn in a minute', a: '3 words your kids say at', em: 'every meal' },
  { id: 'v7', series: 'Learn in a minute', a: 'One letter turns a heart into a', em: 'dog' },
  { id: 'v9', series: 'Parent playbook', a: 'Ten years. Not one', em: 'uff.' },
  { id: 'v12', series: 'Learn in a minute', a: '3 Quran words you', em: 'already know' },
];

const Frame: React.FC = () => {
  const m = 14, r = 44;
  const d = `M 540 ${m} H ${1080 - m - r} A ${r} ${r} 0 0 1 ${1080 - m} ${m + r} V ${1920 - m - r} A ${r} ${r} 0 0 1 ${1080 - m - r} ${1920 - m}
    H ${m + r} A ${r} ${r} 0 0 1 ${m} ${1920 - m - r} V ${m + r} A ${r} ${r} 0 0 1 ${m + r} ${m} H 540`;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs><linearGradient id="thg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={CRIMSON} /><stop offset="0.4" stopColor={COPPER} /><stop offset="0.7" stopColor={GOLD} /><stop offset="1" stopColor={TEAL_DEEP} /></linearGradient></defs>
      <path d={d} fill="none" stroke="url(#thg)" strokeWidth={14} />
    </svg>
  );
};

export const Thumbs: React.FC = () => {
  const th = THUMBS[Math.min(useCurrentFrame(), THUMBS.length - 1)];
  return (
    <AbsoluteFill style={{ background: '#EFE6D6' }}>
      <Img src={staticFile(`thumbs/${th.id}.png`)} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 900, background: 'linear-gradient(180deg, rgba(239,230,214,0.96) 0%, rgba(239,230,214,0.85) 60%, rgba(239,230,214,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 80, top: 230, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 40, borderRadius: 14, padding: '10px 24px' }}>{th.series}</div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 330, fontFamily: SERIF, fontWeight: 700, fontSize: 118, lineHeight: 1.04, color: INK, letterSpacing: -1 }}>
        {th.a} <span style={{ fontStyle: 'italic', color: CRIMSON }}>{th.em}</span>
      </div>
      <div style={{ position: 'absolute', left: 80, top: 330 + 0, width: 0 }} />
      <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', left: 70, bottom: 120, width: 190, transform: 'rotate(-8deg)', filter: 'drop-shadow(0 10px 14px rgba(40,25,15,0.35))' }} />
      <Frame />
      <Logo />
    </AbsoluteFill>
  );
};
