import React from 'react';
import { SOCIAL_LINKS } from '../../data/social';

/**
 * The academy's social accounts as round medallions in the site palette: sand ring and teal mark,
 * filling teal (white mark) on hover/focus. One consistent icon set (Simple Icons), no off-brand
 * platform colours.
 */
export function SocialLinks({ isAr, size = 'md', className = '' }: { isAr: boolean; size?: 'sm' | 'md'; className?: string }) {
  const box = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`} aria-label={isAr ? 'حساباتنا على السوشيال ميديا' : 'Follow us'}>
      {SOCIAL_LINKS.map((s) => (
        <li key={s.id}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={isAr ? s.ar : s.en}
            aria-label={isAr ? `وتزودوا على ${s.ar}` : `Watazawwado on ${s.en}`}
            className={`group grid place-items-center ${box} rounded-full border border-[#D8C6AE] bg-[#D8C6AE]/10 text-[#087D91] dark:text-[#D8C6AE] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#087D91] hover:border-[#087D91] hover:text-white hover:shadow-[0_8px_18px_-8px_rgba(8,125,145,.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#087D91] motion-reduce:hover:translate-y-0`}
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
