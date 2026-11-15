import React from 'react';
import { getStoredLanguage } from '../../../lib/language';
import { BADGE_INFO, type EmblemId } from './achievements';

/**
 * A badge of the new set (owner, 2026-11-15): the 3D render from scripts/badges/build_shelf.py.
 * Earned: in colour. Not earned yet: a faint shadow of the same badge (docs/design/PROGRESS.md), never a dashed outline.
 * Numbered badges have a render with Arabic digits for the Arabic site.
 */
export function badgeSrc(id: EmblemId, isAr: boolean): string {
  return `/badges/shelf/${id}${isAr && BADGE_INFO[id]?.numbered ? '-ar' : ''}.webp`;
}

export function AchievementEmblem({ id, earned = true, className = 'w-16 h-16', isAr, alt = '' }: {
  id: EmblemId;
  earned?: boolean;
  className?: string;
  isAr?: boolean;
  alt?: string;
}) {
  const ar = isAr ?? getStoredLanguage() === 'ar';
  return (
    <img
      src={badgeSrc(id, ar)}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={180}
      height={180}
      loading="lazy"
      decoding="async"
      draggable={false}
      data-emblem={id}
      data-earned={earned ? 'true' : 'false'}
      className={`${className} object-contain select-none ${earned ? '' : 'badge-shadow'}`}
    />
  );
}

export const EMBLEM_IDS = Object.keys(BADGE_INFO) as EmblemId[];
