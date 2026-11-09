/**
 * First-visit tours, one per account type, presented by Zad (owner, 2026-11-09). Each opens once per account on this
 * browser after sign-in, can be skipped, and replays from the compass / "Quick tour" button. A step whose target is
 * hidden (a desktop-only control on a phone) shows as a centred card, so the same steps work on every screen.
 * Copy follows docs/design/ACCOUNT-VOICE.md: learners as "you", families about their children, teachers as colleagues
 * in Egyptian Arabic, the admin facts first.
 */
import type { ZadPose } from '../components/zad/ZadRig';

export type TourKind = 'learner' | 'family' | 'teacher' | 'admin';

export interface TourStep {
  /** data-tour / id targets, first visible one wins; empty = a centred card. */
  targetId: string[];
  title: string;
  description: string;
  position?: 'top' | 'bottom';
  pose?: ZadPose;
}

/** v2: everyone sees the Zad tour once, including accounts that saw the older tours. */
export const TOUR_SEEN_PREFIX = 'wz.tour.v2.';
export const tourSeenKey = (kind: TourKind, accountId: string) => `${TOUR_SEEN_PREFIX}${kind}.${accountId}`;

export const isFamilyAccount = (profile: any): boolean =>
  Array.isArray(profile?.linkedChildren) && profile.linkedChildren.length > 0;

/** True when this account has not seen its tour on this browser. Blocked storage never auto-opens. */
export function shouldAutoOpenTour(key: string | null, storage: Pick<Storage, 'getItem'> | null): boolean {
  if (!key || !storage) return false;
  try {
    return storage.getItem(key) !== '1';
  } catch {
    return false;
  }
}

export function markTourSeen(key: string | null, storage: Pick<Storage, 'setItem'> | null): void {
  if (!key || !storage) return;
  try { storage.setItem(key, '1'); } catch { /* private mode: it may show again */ }
}

const T = (isAr: boolean) => (en: string, ar: string) => (isAr ? ar : en);

export function learnerTourSteps(isAr: boolean): TourStep[] {
  const t = T(isAr);
  return [
    {
      targetId: [],
      title: t("Assalamu alaikum, I'm Zad", 'السلام عليكم، أنا زاد'),
      description: t(
        "Let me show you around your account. It takes under a minute, and you can skip it and come back any time.",
        'هلفّ معاك لفّة سريعة في حسابك، أقل من دقيقة. تقدر تتخطاها وترجعلها وقت ما تحب.',
      ),
      pose: 'wave',
    },
    {
      targetId: ['onboarding-next-lesson', 'onboarding-welcome'],
      title: t('Your next lesson', 'درسك الجاي'),
      description: t(
        'Your next lesson shows here. On the day, the button to join the lesson room appears on this card.',
        'هنا هيظهر درسك الجاي، ويوم الدرس هتلاقي زرار دخول الحصة على الكارت ده.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['nav-book-link', 'nav-book-link-desktop', 'student-book'],
      title: t('Book a lesson', 'احجز درس'),
      description: t(
        'Pick the subject, your teacher and a time that suits you. Times show in your own time zone.',
        'اختار المادة والمعلم والوقت اللي يناسبك، والمواعيد بتظهر بتوقيتك.',
      ),
      position: 'top',
    },
    {
      targetId: ['nav-lessons-link', 'nav-lessons-link-desktop', 'student-lessons'],
      title: t('Your lessons', 'دروسك'),
      description: t(
        "Upcoming and past lessons, your teacher's notes after each one, and where to change a time.",
        'دروسك الجاية واللي فاتت، وملاحظات المعلم بعد كل درس، ومنها تغيّر الميعاد لو احتجت.',
      ),
      position: 'top',
    },
    {
      targetId: ['student-homework', 'student-curriculum', 'nav-more-btn'],
      title: t('Homework and your curriculum', 'الواجبات ومنهجك'),
      description: t(
        "After each lesson, a few short questions on what you learned wait under Homework, and the lessons you've taken stay open to review. On a phone they are under More.",
        'بعد كل درس هتلاقي في «الواجبات» كام سؤال قصير على اللي اتعلمته، ودروس منهجك مفتوحة تراجعها. على الموبايل هتلاقيهم في «المزيد».',
      ),
      position: 'bottom',
      pose: 'think',
    },
    {
      targetId: ['student-messages'],
      title: t('Talk to our team', 'كلّم فريقنا'),
      description: t(
        'Questions about lessons, times or payment? Message us here and we will reply.',
        'أي سؤال عن الدروس أو المواعيد أو الدفع، ابعتلنا من هنا وهنرد عليك.',
      ),
      position: 'top',
    },
    {
      targetId: ['student-header-tour-btn', 'nav-more-btn'],
      title: t("You're all set", 'كده جاهز'),
      description: t(
        'To see this tour again, tap the compass, or "Quick tour" in the menu.',
        'ولو حبيت تشوف الجولة تاني، اضغط البوصلة أو «جولة سريعة» في القائمة.',
      ),
      position: 'bottom',
      pose: 'cheer',
    },
  ];
}

export function familyTourSteps(isAr: boolean): TourStep[] {
  const t = T(isAr);
  return [
    {
      targetId: [],
      title: t("Assalamu alaikum, I'm Zad", 'السلام عليكم، أنا زاد'),
      description: t(
        "Let me show you around your family space. It takes under a minute, and you can skip it and come back any time.",
        'هلفّ معاك لفّة سريعة في مساحة أسرتك، أقل من دقيقة. تقدر تتخطاها وترجعلها وقت ما تحب.',
      ),
      pose: 'wave',
    },
    {
      targetId: ['onboarding-welcome'],
      title: t('Your family space', 'مساحة أسرتك'),
      description: t(
        "Everything about your children's lessons with their teachers: upcoming lessons, bookings and follow-up.",
        'هنا كل ما يخص دروس أولادك مع معلميهم: الحصص الجاية والحجوزات والمتابعة.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['child-switcher'],
      title: t('All your children in one place', 'أولادك في مكان واحد'),
      description: t(
        'Pick a child here and every page shows their lessons and progress, or choose "Whole family" to see everyone.',
        'اختار اسم الطفل من هنا فتعرض كل الصفحات دروسه وتقدّمه هو، أو اختار «كل الأسرة» تشوفهم مع بعض.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['nav-book-link', 'nav-book-link-desktop', 'student-book'],
      title: t('Book a lesson', 'احجز درس'),
      description: t(
        'Choose the child, the subject and a time that suits you. Times show in your own time zone.',
        'اختار الطفل والمادة والوقت المناسب ليكم، والمواعيد بتظهر بتوقيتك.',
      ),
      position: 'top',
    },
    {
      targetId: ['student-progress', 'nav-more-btn'],
      title: t('Follow their progress', 'تابع تقدّمهم'),
      description: t(
        "See where each child is in every subject, the teacher's notes after each lesson, and a monthly report you can print.",
        'هنا تشوف وصلوا لفين في كل مادة، وملاحظات المعلم بعد كل درس، وتقرير شهري تقدر تطبعه.',
      ),
      position: 'bottom',
      pose: 'proud',
    },
    {
      targetId: ['student-messages'],
      title: t('Talk to our team', 'كلّم فريقنا'),
      description: t(
        'Questions about lessons, times or payments? Send us a message here and we will get back to you.',
        'أي سؤال عن الدروس أو المواعيد أو الدفع، ابعتلنا رسالة من هنا وهنرد عليك.',
      ),
      position: 'top',
    },
    {
      targetId: ['student-header-tour-btn', 'nav-more-btn'],
      title: t("You're all set", 'كده جاهزين'),
      description: t(
        'To see this tour again, tap the compass, or "Quick tour" in the menu.',
        'ولو حبيت تشوف الجولة تاني، اضغط البوصلة أو «جولة سريعة» في القائمة.',
      ),
      position: 'bottom',
      pose: 'cheer',
    },
  ];
}

/** Dashboard nav targets: every copy of a page link (header tab, rail, drawer, phone tab) carries `dash-<slug>`. */
export const dashTourId = (path: string) => `dash-${path.split('/').filter(Boolean)[1] || 'home'}`;

export function teacherTourSteps(isAr: boolean): TourStep[] {
  const t = T(isAr);
  return [
    {
      targetId: [],
      title: t('Welcome to your teaching space', 'أهلاً بيك في مساحة المعلم'),
      description: t(
        "I'm Zad. Here are the places you'll use most, in under a minute. Skip any time and come back later.",
        'أنا زاد. هوريك أهم الأماكن اللي هتستخدمها، في أقل من دقيقة. تقدر تتخطى وترجع للجولة وقت ما تحب.',
      ),
      pose: 'wave',
    },
    {
      targetId: ['dash-home'],
      title: t('Today', 'اليوم'),
      description: t(
        "Today's lessons in order, the link to each lesson room, and a quick prep with Jalila before each one.",
        'حصص النهارده بالترتيب، ورابط كل حصة، وتحضير سريع مع جليلة قبل كل درس.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['dash-upcoming'],
      title: t('Schedule', 'الجدول'),
      description: t('Everything coming up, so you can see your week at a glance.', 'كل اللي جاي، عشان تشوف أسبوعك من أوله.'),
      position: 'bottom',
    },
    {
      targetId: ['dash-students'],
      title: t('Your students', 'طلابك'),
      description: t(
        "Each student's file: goals, level and your notes from past lessons.",
        'ملف كل طالب: أهدافه ومستواه وملاحظاتك من الحصص اللي فاتت.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['dash-homework'],
      title: t('Homework', 'الواجبات'),
      description: t(
        'The homework you sent and how each student did. Send a new one from here too.',
        'الواجبات اللي بعتها ونتيجة كل طالب، ومن هنا كمان تبعت واجب جديد.',
      ),
      position: 'bottom',
      pose: 'think',
    },
    {
      targetId: ['dash-messages'],
      title: t('Messages', 'الرسائل'),
      description: t(
        'Messages from families, students and the academy team, in one place.',
        'رسايل الأهالي والطلاب وفريق الأكاديمية في مكان واحد.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['dash-availability', 'teacher-more-btn'],
      title: t('My hours', 'مواعيدي'),
      description: t(
        'Set the hours you are free to teach. Families can only book inside them. On a phone it is under More.',
        'حدد الساعات اللي متاح تدرّس فيها، والأهالي بيحجزوا جواها بس. على الموبايل هتلاقيها في «المزيد».',
      ),
      position: 'bottom',
    },
    {
      targetId: ['teacher-header-tour-btn', 'teacher-more-btn'],
      title: t("You're set", 'كده تمام'),
      description: t(
        'The other pages are in the side menu. To replay this tour, tap the compass, or "Tour guide" under More.',
        'باقي الصفحات في القائمة الجانبية. ولو حبيت تشوف الجولة تاني، اضغط البوصلة أو «دليل الاستخدام» في «المزيد».',
      ),
      position: 'bottom',
      pose: 'thanks',
    },
  ];
}

export function adminTourSteps(isAr: boolean): TourStep[] {
  const t = T(isAr);
  return [
    {
      targetId: [],
      title: t('Welcome to the academy dashboard', 'أهلاً بيك في لوحة الأكاديمية'),
      description: t(
        "I'm Zad. These are the places you'll run the academy from, in under a minute.",
        'أنا زاد. دي الأماكن اللي هتدير منها الأكاديمية، في أقل من دقيقة.',
      ),
      pose: 'wave',
    },
    {
      targetId: ['dash-home'],
      title: t('Overview', 'الرئيسية'),
      description: t(
        "The academy at a glance: today's lessons, new bookings and what needs a decision from you.",
        'الأكاديمية في نظرة: حصص النهارده، والحجوزات الجديدة، واللي مستني منك قرار.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['dash-bookings'],
      title: t('Bookings', 'الحجوزات'),
      description: t('Every booking with its payment status.', 'كل الحجوزات، وحالة الدفع لكل حجز.'),
      position: 'bottom',
    },
    {
      targetId: ['dash-students'],
      title: t('Students', 'الطلاب'),
      description: t('All students and families, and who learns with which teacher.', 'كل الطلاب والأسر، ومين بيدرس مع أنهي معلم.'),
      position: 'bottom',
    },
    {
      targetId: ['dash-messages'],
      title: t('Messages', 'الرسائل'),
      description: t('Every conversation with families and teachers.', 'كل المحادثات مع الأهالي والمعلمين.'),
      position: 'bottom',
    },
    {
      targetId: ['admin-search'],
      title: t('Search everything', 'دوّر على أي حاجة'),
      description: t('Press Ctrl K to find any account, child, booking reference or payment.', 'اضغط Ctrl K ودوّر على أي حساب أو طفل أو رقم حجز أو دفعة.'),
      position: 'bottom',
      pose: 'think',
    },
    {
      targetId: ['teacher-rail', 'teacher-more-btn'],
      title: t('Every section', 'كل الأقسام'),
      description: t(
        'The rest is grouped: people, money, the academy and the system.',
        'باقي الأقسام متقسمة: الناس، الفلوس، الأكاديمية، والنظام.',
      ),
      position: 'bottom',
    },
    {
      targetId: ['teacher-header-tour-btn', 'teacher-more-btn'],
      title: t("You're set", 'كده تمام'),
      description: t(
        'To replay this tour, tap the compass, or "Tour guide" under More.',
        'ولو حبيت تشوف الجولة تاني، اضغط البوصلة أو «دليل الاستخدام» في «المزيد».',
      ),
      position: 'bottom',
      pose: 'cheer',
    },
  ];
}
