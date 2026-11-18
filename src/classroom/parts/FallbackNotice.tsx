import React from 'react';
import { ExternalLink, Video } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';

/**
 * Classroom Task 12: "Continue on Zoom", shown only after the room failed on our side and the server sent this side's
 * Zoom link. `screen` sits on the failure screen and the room gate; `banner` sits in the room's notices.
 */
export function FallbackNotice({ url, teacher, variant }: { url: string; teacher: boolean; variant: 'screen' | 'banner' }) {
  const { t } = useT();
  const text = teacher
    ? t('The room is having trouble on our side. Continue this lesson on Zoom; we have been told.', 'الغرفة فيها مشكلة من عندنا. كمّل الحصة على زووم، وإحنا عرفنا.')
    : t('The room is having trouble on our side. Continue the lesson on Zoom; your teacher is getting the same button.', 'الغرفة فيها مشكلة من عندنا. كمّل الحصة على زووم، والمعلم ظاهر له نفس الزرار.');
  const link = (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="btn-primary-material inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 font-display text-base font-medium focus-ring">
      <Video className="h-4 w-4" aria-hidden="true" />
      {t('Continue on Zoom', 'كمّل على زووم')}
      <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
    </a>
  );
  return (
    <div role="alert" className={cn(variant === 'banner'
      ? 'glass-3 flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-[var(--r-3)] px-4 py-3 text-center sm:flex-nowrap sm:text-start'
      : 'grid w-full justify-items-center gap-3 rounded-[var(--r-3)] border border-gold/40 bg-gold/10 p-4 text-center')}>
      <p className="text-sm text-foreground">{text}</p>
      {link}
    </div>
  );
}
