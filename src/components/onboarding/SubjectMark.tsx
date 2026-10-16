import React from 'react';
import { SUBJECT_EMBLEMS } from '../public/illustrations/SubjectEmblems';
import { MushafEmblem } from '../public/emblems/DoorEmblems';

/**
 * A subject's hand-drawn emblem (the same animated SVGs as the Subjects page) on a tile of its
 * family colour. Used on the onboarding book spines, the chosen-subject card and folded tickets.
 */
export function SubjectMark({ subjectId, color, size, rounded = 'rounded-2xl', className = '' }: {
  subjectId: string;
  color?: string;
  size: number;
  rounded?: string;
  className?: string;
}) {
  const Emblem = SUBJECT_EMBLEMS[subjectId] || MushafEmblem;
  return (
    <span
      className={`grid place-items-center shrink-0 overflow-hidden ${rounded} ${className}`}
      style={{ width: size, height: size, background: color ? `radial-gradient(circle at 50% 35%, ${color}, ${color}E0 70%, ${color}C0)` : undefined }}
      aria-hidden="true"
    >
      <Emblem className="w-full h-full" />
    </span>
  );
}
