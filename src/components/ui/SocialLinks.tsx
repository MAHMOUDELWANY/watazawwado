import React from 'react';
import { SOCIAL_LINKS } from '../../data/social';

/**
 * The academy's social accounts as solid medallions in the brand's three colours (teal, crimson,
 * copper), white marks, brighter shades in dark mode, lifting with a glow of their own colour on
 * hover/focus. One consistent icon set (Simple Icons), no off-brand platform colours.
 */
const TONES = [
  'bg-[#087D91] dark:bg-[#12A4BC] hover:shadow-[0_10px_22px_-8px_rgba(8,125,145,.9)] focus-visible:ring-[#087D91]',
  'bg-[#C51F24] dark:bg-[#E82C32] hover:shadow-[0_10px_22px_-8px_rgba(197,31,36,.9)] focus-visible:ring-[#C51F24]',
  'bg-[#8B4935] dark:bg-[#DA7960] hover:shadow-[0_10px_22px_-8px_rgba(139,73,53,.9)] focus-visible:ring-[#8B4935]'
];

export function SocialLinks({ isAr, size = 'md', className = '' }: { isAr: boolean; size?: 'sm' | 'md'; className?: string }) {
  const box = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`} aria-label={isAr ? 'حساباتنا على السوشيال ميديا' : 'Follow us'}>
      {SOCIAL_LINKS.map((s, i) => (
        <li key={s.id}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={isAr ? s.ar : s.en}
            aria-label={isAr ? `وتزودوا على ${s.ar}` : `Watazawwado on ${s.en}`}
            className={`grid place-items-center ${box} rounded-full text-white ring-1 ring-black/5 dark:ring-white/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0 ${TONES[i % TONES.length]}`}
          >
            <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden="true">
              <path d={s.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
