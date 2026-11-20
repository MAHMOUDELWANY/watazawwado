import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../lib/language';
import { createTalkClock, talkShare } from '../talkTime';

const TICK_MS = 250;
const SHOW_EVERY_MS = 2000;

/**
 * Classroom 2.8: counts each side's speaking time while `active`, from the speaking flags the room already has
 * (own mic, off while muted; the learner's remote audio). `read` gives the totals at any time.
 */
export function useTalkTime(active: boolean, teacherSpeaking: boolean, learnerSpeaking: boolean) {
  const [clock] = useState(createTalkClock);
  const speaking = useRef({ teacher: teacherSpeaking, learner: learnerSpeaking });
  speaking.current = { teacher: teacherSpeaking, learner: learnerSpeaking };
  const [totals, setTotals] = useState(clock.totals);
  useEffect(() => {
    if (!active) return;
    const tick = window.setInterval(() => clock.tick(performance.now(), speaking.current.teacher, speaking.current.learner), TICK_MS);
    const show = window.setInterval(() => setTotals(clock.totals()), SHOW_EVERY_MS);
    return () => { window.clearInterval(tick); window.clearInterval(show); clock.pause(); };
  }, [active, clock]);
  const read = useCallback(() => clock.totals(), [clock]);
  return { totals, read };
}

/** Teacher only: a small live ratio of who has been talking. */
export function TalkRatio({ teacherMs, learnerMs }: { teacherMs: number; learnerMs: number }) {
  const { t } = useT();
  const share = talkShare(teacherMs, learnerMs);
  if (!share) return null;
  const label = t(`Talk time: you ${share.teacher}%, learner ${share.learner}%`, `وقت الكلام: إنت ${share.teacher}%، الطالب ${share.learner}%`);
  return (
    <span className="hidden shrink-0 items-center gap-1.5 px-1 text-xs tabular-nums text-muted-foreground sm:inline-flex" title={label} aria-label={label}>
      <span>{t('You', 'إنت')} {share.teacher}%</span>
      <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <span className="absolute inset-y-0 start-0 rounded-full bg-teal" style={{ width: `${share.teacher}%` }} />
      </span>
      <span>{share.learner}%</span>
    </span>
  );
}
