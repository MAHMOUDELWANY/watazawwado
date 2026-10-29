import { arLessonCount } from '../progress/LessonTimeline';

/** Arabic week count with the right plural: أسبوع واحد، أسبوعين، ٣ أسابيع، ١١ أسبوع. */
export function arWeekCount(n: number): string {
  if (n === 1) return 'أسبوع واحد';
  if (n === 2) return 'أسبوعين';
  return `${n.toLocaleString('ar-EG')} ${n >= 3 && n <= 10 ? 'أسابيع' : 'أسبوع'}`;
}

/** One learner's effort on the class board: lessons this month and weeks in a row. */
export function effortLine(lessons: number, weeks: number, isAr: boolean): string {
  if (isAr) return `${arLessonCount(lessons)} الشهر ده · ${arWeekCount(weeks)} ورا بعض`;
  return `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'} this month · ${weeks} ${weeks === 1 ? 'week' : 'weeks'} in a row`;
}
