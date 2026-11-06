/**
 * Quick words a family can tap after a good lesson (owner, 2026-11-06, in the spirit of Preply). A word becomes a
 * badge on the teacher's card only when BADGE_MIN_FAMILIES different family accounts chose it, counting only
 * finished calendar months (the server filters), so no single family's feedback can be read from the card. Teachers never type these themselves.
 */
export const FEEDBACK_TAGS = [
  { id: 'patient', en: 'Patient', ar: 'صبور' },
  { id: 'clear', en: 'Explains clearly', ar: 'شرحه واضح' },
  { id: 'kids', en: 'Great with kids', ar: 'ممتاز مع الأطفال' },
  { id: 'encouraging', en: 'Encouraging', ar: 'بيشجّع' },
  { id: 'prepared', en: 'Well prepared', ar: 'محضّر كويس' },
  { id: 'fun', en: 'Makes it fun', ar: 'الحصة ممتعة' }
] as const;

export type FeedbackTagId = (typeof FEEDBACK_TAGS)[number]['id'];
export const MAX_TAGS_PER_LESSON = 3;
export const BADGE_MIN_FAMILIES = 3;
export const MAX_BADGES_ON_CARD = 2;

const IDS = new Set<string>(FEEDBACK_TAGS.map((t) => t.id));
export const isFeedbackTag = (v: unknown): v is FeedbackTagId => typeof v === 'string' && IDS.has(v);
export const tagLabel = (id: string, isAr: boolean) => {
  const t = FEEDBACK_TAGS.find((x) => x.id === id);
  return t ? (isAr ? t.ar : t.en) : id;
};

/** Badges from (family account, tags) rows: tags chosen by at least BADGE_MIN_FAMILIES accounts, most chosen first. */
export function badgesFrom(rows: Array<{ submitted_by: string | null; tags: string[] | null }>): FeedbackTagId[] {
  const learnersByTag = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.submitted_by) continue;
    for (const tag of r.tags || []) {
      if (!isFeedbackTag(tag)) continue;
      if (!learnersByTag.has(tag)) learnersByTag.set(tag, new Set());
      learnersByTag.get(tag)!.add(r.submitted_by);
    }
  }
  return [...learnersByTag.entries()]
    .filter(([, s]) => s.size >= BADGE_MIN_FAMILIES)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, MAX_BADGES_ON_CARD)
    .map(([tag]) => tag as FeedbackTagId);
}
