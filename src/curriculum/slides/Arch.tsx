import React from 'react';

/** The site's mihrab arch (homepage teachers, doors): rounded top, gradient ring in teal, gold and copper. */
export const ARCH_RADIUS = '50% 50% 30px 30px / 32% 32% 30px 30px';
export const RIBBON: React.CSSProperties = {
  backgroundImage: 'linear-gradient(100deg, #C51F24 0%, #B4552F 35%, #E5A93C 55%, #087D91 100%)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
};

/**
 * The Adults picture frame (owner chose the light manuscript direction, 2026-10-23): every still sits in one arch on the
 * slide, right of the text (left on the notebook and next-time pages). It stays below the lesson badge and above the
 * chapter strip. Children fill it (position them with absolute / inset-0).
 */
export function Arch({ side = 'right', label, children }: { side?: 'left' | 'right'; label?: string; children?: React.ReactNode }) {
  const box = side === 'right' ? { left: 880, top: 160, width: 476, height: 640 } : { left: 140, top: 160, width: 476, height: 640 };
  return (
    <div role={label ? 'img' : undefined} aria-label={label} className="absolute" style={{ ...box, padding: 4, borderRadius: ARCH_RADIUS, background: 'linear-gradient(160deg, #087D91 0%, #E5A93C 55%, #8B4935 100%)', boxShadow: '0 44px 80px -40px rgba(8,125,145,0.5), 0 20px 40px -30px rgba(139,73,53,0.5)' }}>
      <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: ARCH_RADIUS, background: '#EFE8DC' }}>{children}</div>
    </div>
  );
}
