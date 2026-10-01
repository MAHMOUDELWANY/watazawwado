import { useState, useEffect } from 'react';

// The 4 authentic architectural heritage colors
export const HERITAGE_PALETTE = {
  teal: [8, 125, 145] as [number, number, number],       // #087D91
  crimson: [197, 31, 36] as [number, number, number],    // #C51F24
  terracotta: [139, 73, 53] as [number, number, number], // #8B4935
  sand: [229, 169, 60] as [number, number, number],      // #E5A93C
};

function interpolateRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  factor: number
): [number, number, number] {
  const t = Math.max(0, Math.min(1, factor));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getPaletteColorAtProgress(progress: number): {
  rgb: [number, number, number];
  hex: string;
} {
  const p = Math.max(0, Math.min(1, progress));
  let rgb: [number, number, number];

  if (p <= 0.33) {
    rgb = interpolateRgb(HERITAGE_PALETTE.teal, HERITAGE_PALETTE.crimson, p / 0.33);
  } else if (p <= 0.66) {
    rgb = interpolateRgb(HERITAGE_PALETTE.crimson, HERITAGE_PALETTE.terracotta, (p - 0.33) / 0.33);
  } else {
    rgb = interpolateRgb(HERITAGE_PALETTE.terracotta, HERITAGE_PALETTE.sand, (p - 0.66) / 0.34);
  }

  return { rgb, hex: rgbToHex(rgb) };
}

/**
 * Hook to track scroll progress and apply smooth 4-color palette transitions
 * to the browser scrollbar and top scroll progress indicator.
 */
export function useScrollPaletteTransition() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState<{ rgb: [number, number, number]; hex: string }>(() =>
    getPaletteColorAtProgress(0)
  );

  useEffect(() => {
    let ticking = false;

    const updateScrollColor = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollHeight)) : 0;
      
      const color = getPaletteColorAtProgress(progress);
      setScrollProgress(progress);
      setCurrentColor(color);

      // Dynamically update CSS custom properties on document root
      const root = document.documentElement;
      root.style.setProperty('--scrollbar-current-rgb', `${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]}`);
      root.style.setProperty('--scrollbar-current-hex', color.hex);
      root.style.setProperty('--scrollbar-scroll-ratio', progress.toFixed(3));

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollColor);
        ticking = true;
      }
    };

    // Run once initially to set starting color
    updateScrollColor();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { scrollProgress, currentColor };
}
