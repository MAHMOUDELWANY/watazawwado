/**
 * PA-05: a short first-visit tour for a family account (a guardian with linked children). Shown once per account on
 * this browser, skippable, and replayable from the help button. Targets are data-tour names already in the portal;
 * a step whose target is hidden (e.g. progress on a phone) shows as a centred card.
 */
export const FAMILY_TOUR_SEEN_PREFIX = 'wz.familyTour.v1.';

export const isFamilyAccount = (profile: any): boolean =>
  Array.isArray(profile?.linkedChildren) && profile.linkedChildren.length > 0;

/** Auto-open only for a family account that finished onboarding and has not seen the tour on this browser. */
export function shouldAutoOpenFamilyTour(profile: any, storage: Pick<Storage, 'getItem'> | null): boolean {
  if (!profile?.id || !profile.onboardingCompleted || !isFamilyAccount(profile)) return false;
  try {
    return !storage || storage.getItem(FAMILY_TOUR_SEEN_PREFIX + profile.id) !== '1';
  } catch {
    return false;
  }
}

export function markFamilyTourSeen(profile: any, storage: Pick<Storage, 'setItem'> | null): void {
  if (!profile?.id || !storage) return;
  try { storage.setItem(FAMILY_TOUR_SEEN_PREFIX + profile.id, '1'); } catch { /* private mode: it may show again */ }
}

export function familyTourSteps(isAr: boolean) {
  return [
    {
      targetId: ['child-switcher'],
      title: isAr ? 'أولادك في مكان واحد' : 'All your children in one place',
      description: isAr
        ? 'اختار اسم الطفل من هنا وكل الصفحات تعرض دروسه وتقدّمه هو، أو اختار "كل الأسرة" تشوفهم مع بعض.'
        : 'Pick a child here and every page shows their lessons and progress, or choose "Whole family" to see everyone.',
      position: 'bottom' as const,
    },
    {
      targetId: ['nav-book-link', 'nav-book-link-desktop', 'student-book'],
      title: isAr ? 'احجز درس' : 'Book a lesson',
      description: isAr
        ? 'اختار الطفل والمادة والوقت المناسب ليكم، والمواعيد بتظهر بتوقيتك.'
        : 'Choose the child, the subject and a time that suits you. Times show in your own time zone.',
      position: 'top' as const,
    },
    {
      targetId: ['student-progress'],
      title: isAr ? 'تابع التقدّم' : 'Follow their progress',
      description: isAr
        ? 'هنا تشوف وصلوا لفين في كل مادة، وملاحظات المعلم بعد كل درس، وتقرير شهري تقدر تطبعه.'
        : 'See where each child is in every subject, the teacher\'s notes after each lesson, and a monthly report you can print.',
      position: 'bottom' as const,
    },
    {
      targetId: ['student-messages'],
      title: isAr ? 'كلّم فريقنا' : 'Talk to our team',
      description: isAr
        ? 'أي سؤال عن الدروس أو المواعيد أو الدفع، ابعتلنا رسالة من هنا وهنرد عليك.'
        : 'Questions about lessons, times or payments? Send us a message here and we will get back to you.',
      position: 'top' as const,
    },
  ];
}
