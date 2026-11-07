/** Teacher cards offered to a family: shared by onboarding and adding a child later. */
export interface TeacherCard {
  id: string; gender: 'male' | 'female'; nameAr: string; nameEn: string; photo: string | null; bio?: string | null;
  /** Subjects the teacher is licensed for (empty on the neutral fallback cards = any subject). */
  subjects?: string[];
  /** Quick words chosen by 3+ different families (src/lib/teacherBadges.ts). */
  badges?: string[];
  /** False when the teacher has no free slot in the next two weeks. */
  available?: boolean;
}

/**
 * Subject first, then teacher (owner, 2026-11-06): only the teachers who teach the chosen subject, and among them
 * only those with free time (a fully booked teacher is hidden: fewer choices help a family decide). If that would
 * leave nobody, fall back step by step so the family always has someone to pick.
 */
export function teachersFor(all: TeacherCard[], subject: string): TeacherCard[] {
  const teaching = all.filter((t) => !t.subjects?.length || t.subjects.includes(subject));
  const pool = teaching.length ? teaching : all;
  const free = pool.filter((t) => t.available !== false);
  return free.length ? free : pool;
}
