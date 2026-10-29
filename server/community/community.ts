import { ageGroupFor, type AgeGroup } from '../../src/student/components/achievements/achievements.js';

/**
 * Community layer rules (plan: docs/superpowers/plans/2026-10-29-community-honor.md).
 * Pure functions only, so the consent and privacy rules are unit-tested without a database.
 * - Nothing about a learner is shown to anyone outside the family unless the person who runs the account agreed:
 *   the guardian for a child, the adult learner for themself. When the server cannot be sure, only the admin can
 *   record a consent the family gave elsewhere.
 * - The community is closed: only signed-in families and students see it. What they see of others is the chosen
 *   display name, the milestone titles, its kind and subject, and the month. Never a country, age, photo or teacher.
 */

export type ConsentKind = 'guardian' | 'learner';
export type HonorStatus = 'awaiting_consent' | 'published' | 'declined' | 'withdrawn' | 'removed';
export type HonorAction = 'family_yes' | 'family_no' | 'admin_record_yes' | 'admin_record_no' | 'family_withdraw' | 'admin_remove';

export const DISPLAY_NAME_MAX = 40;
export const CLASS_BOARD_MIN_MEMBERS = 3;

/**
 * Who may decide for this learner from the portal, or null when the portal must not offer the choice.
 * `isPrimary` is the account's own student record; a linked child comes through the guardians table, so the account
 * is that child's guardian. A primary record that is a child or under 18 counts as a guardian decision only when a
 * guardians row ties this account's email to it.
 */
export function consentKindFor(input: {
  isPrimary: boolean;
  learnerType: string | null | undefined;
  age: number | null | undefined;
  guardianLinked: boolean;
}): ConsentKind | null {
  if (!input.isPrimary) return 'guardian';
  const minor = input.learnerType === 'child' || (typeof input.age === 'number' && input.age > 0 && input.age < 18);
  if (minor) return input.guardianLinked ? 'guardian' : null;
  return 'learner';
}

/** The first word of the learner's name, which is the default name shown. */
export function firstNameOf(fullName: string | null | undefined): string {
  const first = String(fullName || '').trim().split(/\s+/)[0] || '';
  return first.slice(0, DISPLAY_NAME_MAX);
}

/**
 * The name the family chose to show: their first name, or a short name they typed. Contact details are refused so a
 * public page can never carry an email, a link or a phone number.
 */
export function chooseDisplayName(
  choice: unknown,
  customName: unknown,
  fullName: string | null | undefined
): { ok: boolean; name: string; error: string } {
  if (choice === 'first') {
    const name = firstNameOf(fullName);
    return name ? { ok: true, name, error: '' } : { ok: false, name: '', error: 'We could not find a first name. Please type the name to show.' };
  }
  if (choice !== 'custom') return { ok: false, name: '', error: 'Choose which name to show.' };
  const name = String(customName ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
  if (!name) return { ok: false, name: '', error: 'Type the name to show.' };
  if (name.length > DISPLAY_NAME_MAX) return { ok: false, name: '', error: `Keep the name to ${DISPLAY_NAME_MAX} characters.` };
  if (/@|https?:|www\.|\.com\b/i.test(name) || /\d[\d\s-]{5,}/.test(name)) {
    return { ok: false, name: '', error: 'Please use a name only, without contact details.' };
  }
  return { ok: true, name, error: '' };
}

const TRANSITIONS: Record<HonorAction, { from: HonorStatus[]; to: HonorStatus }> = {
  family_yes: { from: ['awaiting_consent', 'declined', 'withdrawn'], to: 'published' },
  family_no: { from: ['awaiting_consent'], to: 'declined' },
  admin_record_yes: { from: ['awaiting_consent'], to: 'published' },
  admin_record_no: { from: ['awaiting_consent'], to: 'declined' },
  family_withdraw: { from: ['published'], to: 'withdrawn' },
  admin_remove: { from: ['published', 'awaiting_consent'], to: 'removed' }
};

/**
 * The status after an action, or null when it is not allowed. The family can change their mind (yes after no, or
 * again after withdrawing); the admin can record only the first answer, and an entry the admin removed stays off.
 */
export function nextHonorStatus(current: HonorStatus, action: HonorAction): HonorStatus | null {
  const t = TRANSITIONS[action];
  return t && t.from.includes(current) ? t.to : null;
}

export interface HallEntry {
  id: string;
  name: string;
  titleEn: string;
  titleAr: string;
  kind: string;
  subject: { id: string; en: string; ar: string; color: string } | null;
  month: string;
}

/** Only what the Hall of Honor shows signed-in families; anything else on the rows never leaves the server. */
export function toHallEntry(
  entry: { id: string; display_name: string | null; published_at: string | null; status: string },
  milestone: { title_en: string; title_ar: string; kind: string } | null,
  subject: { id: string; en: string; ar: string; color: string } | null
): HallEntry | null {
  if (entry.status !== 'published' || !entry.display_name || !entry.published_at || !milestone) return null;
  return {
    id: entry.id,
    name: entry.display_name,
    titleEn: milestone.title_en,
    titleAr: milestone.title_ar,
    kind: milestone.kind,
    subject,
    month: entry.published_at.slice(0, 7)
  };
}

/**
 * A ready text the admin copies into our families' groups. Never posted automatically. It links to the Hall of Honor
 * inside the portal, which only signed-in families and students can open.
 */
export function honorPostText(e: { name: string; titleEn: string; titleAr: string }, siteUrl: string): { en: string; ar: string } {
  const base = siteUrl.replace(/\/+$/, '');
  return {
    ar: `لوحة الشرف في وتزودوا 🌙\n\n${e.name}: ${e.titleAr}\n\nما شاء الله، زاده الله علمًا. اللهم تقبّل منه ومن جميع طلابنا.\n\nلوحة الشرف كاملة من جوه حسابك: ${base}/student/community`,
    en: `Watazawwado Hall of Honor 🌙\n\n${e.name}: ${e.titleEn}\n\nMashaAllah. May Allah increase them in knowledge and accept from all our students.\n\nThe full Hall of Honor is in your account: ${base}/student/community`
  };
}

/**
 * Who sits on the same class board: the same teacher, the same age group, and for teens and adults the same gender.
 * A learner whose gender is not on record only meets others in the same position.
 */
export function boardGroupKey(teacherId: string, ageGroup: AgeGroup, gender: string | null | undefined): string {
  if (ageGroup === 'kids') return `${teacherId}:kids`;
  const g = gender === 'male' || gender === 'female' ? gender : 'unknown';
  return `${teacherId}:${ageGroup}:${g}`;
}

export function boardGroupFor(student: { assigned_teacher_id: string | null; age: number | null; learner_type: string | null; gender: string | null }): string | null {
  if (!student.assigned_teacher_id) return null;
  return boardGroupKey(student.assigned_teacher_id, ageGroupFor(student.age, student.learner_type), student.gender);
}

export interface BoardMember { studentId: string; displayName: string; lessonsThisMonth: number; rhythm: number }
export interface BoardRow { name: string; lessonsThisMonth: number; rhythm: number; isYou: boolean }

/**
 * The class board a learner sees, ordered by effort (lessons this month, then weeks in a row), with no rank numbers.
 * Null when the viewer has not joined (the board is reciprocal) or fewer than three learners are on it.
 */
export function buildClassBoard(members: BoardMember[], viewerId: string): BoardRow[] | null {
  if (!members.some((m) => m.studentId === viewerId)) return null;
  if (members.length < CLASS_BOARD_MIN_MEMBERS) return null;
  return [...members]
    .sort((a, b) => b.lessonsThisMonth - a.lessonsThisMonth || b.rhythm - a.rhythm || a.displayName.localeCompare(b.displayName))
    .map((m) => ({ name: m.displayName, lessonsThisMonth: m.lessonsThisMonth, rhythm: m.rhythm, isYou: m.studentId === viewerId }));
}
