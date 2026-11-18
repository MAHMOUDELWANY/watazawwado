import React from 'react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import type { LinkClass } from '../engine/types';

// No green anywhere: good = teal, weak = gold, poor = crimson.
const DOT: Record<LinkClass, string> = { good: 'bg-[#12A4BC]', weak: 'bg-[#F0B54A]', poor: 'bg-[#E82C32]' };

/** Good, weak or poor, next to a name. Colour plus a word, so it never relies on colour alone. */
export function NetworkBadge({ link, onDark = false }: { link: LinkClass; onDark?: boolean }) {
  const { t } = useT();
  const word = link === 'good' ? t('Good', 'كويس') : link === 'weak' ? t('Weak', 'ضعيف') : t('Poor', 'سيئ');
  return (
    <span className={cn('inline-flex items-center gap-1 text-[0.78rem]', onDark ? 'text-[#D8C6AE]' : 'text-muted-foreground')}
      title={t('Connection', 'الاتصال')}>
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', DOT[link])} />
      <span className={link === 'good' ? 'sr-only' : undefined}>{word}</span>
      {link === 'good' && <span className="sr-only">{t('connection', 'الاتصال')}</span>}
    </span>
  );
}

/** "Your connection is weak" (or, to the teacher, the learner's), from blameSide. Shown in the room's notice slot. */
export function weakLinkText(who: 'me' | 'them', teacher: boolean, t: (en: string, ar: string) => string) {
  return who === 'me'
    ? t('Your connection is weak. Video may pause so the sound stays clear.', 'الاتصال عندك ضعيف. الفيديو ممكن يقف علشان الصوت يفضل واضح.')
    : teacher
      ? t("The learner's connection is weak. Ask them to move closer to the router.", 'اتصال الطالب ضعيف. اطلب منه يقرّب من الراوتر.')
      : t("Your teacher's connection is weak for a moment.", 'اتصال المعلم ضعيف شوية.');
}
