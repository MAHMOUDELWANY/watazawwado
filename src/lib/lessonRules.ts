/**
 * The change, cancel and reminder rules a family reads before it ticks the terms (RULES.md §2, P4-006).
 * One place, so the review step, the confirmation and the Lessons page never disagree with the server.
 */

/** Rules for one booking: a free trial or any other lesson. */
export function lessonRulesText(isTrial: boolean, isAr: boolean): string {
  if (isTrial) {
    return isAr
      ? 'الحصة التجريبية: تقدر تغيّر موعدها مرة واحدة ليوم تاني، قبل بدايتها بساعة على الأقل، وتقدر تلغيها لحد ساعة قبلها. لو فاتتك أو ألغيتها، تقدر تحجز تجربة جديدة بعد ٤٨ ساعة.'
      : 'Free trial: you can move it once to another day, at least 1 hour before it starts, and cancel it up to 1 hour before. If it is missed or cancelled, you can book a new trial after 48 hours.';
  }
  return isAr
    ? 'تقدر تنقل الحصة ليوم تاني لحد ساعة قبل بدايتها، وتلغيها لحد ٣ ساعات قبلها. الحصة المدفوعة اللي تتلغي في الوقت ده بترجعلك رصيد حصة.'
    : 'You can move a lesson to another day up to 1 hour before it starts, and cancel it up to 3 hours before. A paid lesson cancelled in time comes back to you as a lesson credit.';
}

/** Both sets of rules, for pages that list trials and paid lessons together. */
export function allLessonRulesText(isAr: boolean): string {
  return `${lessonRulesText(false, isAr)} ${lessonRulesText(true, isAr)}`;
}

/** When reminders go out (RULES.md §2, "Lesson reminders"). */
export function reminderText(isAr: boolean): string {
  return isAr
    ? 'هنبعتلك إيميل لما الحجز يتأكد وقبل الحصة بـ ٣ ساعات، وتنبيه على الموقع قبلها بـ ١٢ ساعة وساعتين.'
    : 'We email you when the lesson is confirmed and 3 hours before it, and remind you on the site 12 hours and 2 hours before.';
}
