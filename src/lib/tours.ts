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
  /** Phone targets when they differ (under 768px); a missing target shows a centred card, never another control. */
  phone?: string[];
  /** Phone only: open the "More" sheet for this step. */
  open?: 'more';
  /** The page this step explains; the tour opens it first, so the user reads and sees it (owner review 2026-11-10). */
  route?: string;
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

/**
 * The tour opens by itself only on the area's own home page. A first visit that lands on a lesson room, the booking
 * page or the return from checkout must not be covered by the tour and sent to the home page (P2-007).
 */
export function isTourHome(pathname: string): boolean {
  return /^\/(student|dashboard(\/(today|overview))?)\/?$/.test(pathname);
}

export function markTourSeen(key: string | null, storage: Pick<Storage, 'setItem'> | null): void {
  if (!key || !storage) return;
  try { storage.setItem(key, '1'); } catch { /* private mode: it may show again */ }
}

const T = (isAr: boolean) => (en: string, ar: string) => (isAr ? ar : en);

/**
 * Owner review 2026-11-10: the tour teaches what each control does and shows it. Each step opens the page or the
 * "More" sheet it explains, phone and desktop each point at their own control, and Zad reacts to every message.
 */
export function learnerTourSteps(isAr: boolean): TourStep[] {
  const t = T(isAr);
  return [
    {
      targetId: [],
      title: t("Assalamu alaikum, I'm Zad", 'السلام عليكم، أنا زاد'),
      description: t(
        "I'll show you how to use your account, one button at a time. Two minutes, and you can skip any time.",
        'هوريك تستخدم حسابك إزاي، زرار زرار. دقيقتين، وتقدر تتخطى في أي وقت.',
      ),
      pose: 'wave',
      route: '/student',
    },
    {
      targetId: ['onboarding-next-lesson', 'onboarding-welcome'],
      title: t('Your next lesson', 'درسك الجاي'),
      description: t(
        'Your next lesson shows on this card. On the day, a "Join lesson" button appears here: tap it at the time and you are in the room with your teacher.',
        'درسك الجاي بيظهر في الكارت ده. يوم الحصة هيظهر هنا زرار «ادخل الحصة»: اضغطه في الميعاد وتلاقي نفسك مع معلمك.',
      ),
      position: 'bottom',
      pose: 'point',
      route: '/student',
    },
    {
      targetId: ['nav-book-link-desktop'],
      phone: ['nav-book-link'],
      title: t('Book a lesson', 'احجز درس'),
      description: t(
        "Tap here to book: choose the subject, then one of your teacher's free times (shown in your own time zone), then pay or use your package.",
        'اضغط هنا عشان تحجز: اختار المادة، بعدين ميعاد من مواعيد معلمك الفاضية (بتوقيتك)، وبعدين ادفع أو استخدم باقتك.',
      ),
      position: 'top',
      pose: 'excited',
    },
    {
      targetId: ['nav-lessons-link-desktop'],
      phone: ['nav-lessons-link'],
      title: t('Your lessons', 'دروسك'),
      description: t(
        "This is your lessons page. Tap a lesson to see its details and your teacher's notes. To move it, choose another day up to 1 hour before; to cancel, up to 3 hours before.",
        'دي صفحة دروسك. اضغط على أي حصة تشوف تفاصيلها وملاحظات معلمك. ولو عايز تغيّر ميعادها، اختار يوم تاني قبلها بساعة على الأقل، والإلغاء قبلها بـ ٣ ساعات.',
      ),
      position: 'top',
      pose: 'think',
      route: '/student/lessons',
    },
    {
      targetId: ['student-messages'],
      title: t('Messages', 'الرسائل'),
      description: t(
        'Write to your teacher or to our team here. A number on it means a new reply is waiting.',
        'من هنا تكلّم معلمك أو فريقنا. لو ظهر عليه رقم، يبقى في رد جديد مستنيك.',
      ),
      position: 'top',
      pose: 'love',
    },
    {
      targetId: ['student-homework'],
      open: 'more',
      title: t('Homework', 'الواجبات'),
      description: t(
        'After each lesson your teacher leaves a few short questions here. Answer them and tap Done; your teacher sees it before the next lesson.',
        'بعد كل حصة معلمك بيسيبلك كام سؤال قصير هنا. جاوبهم واضغط «تم»، ومعلمك بيشوف ده قبل الحصة الجاية.',
      ),
      position: 'bottom',
      pose: 'think',
    },
    {
      targetId: ['student-curriculum'],
      open: 'more',
      title: t('Your curriculum', 'منهجك'),
      description: t(
        'Every lesson you take opens here, so you can go back over it any time.',
        'كل درس بتاخده بيتفتح هنا، فتقدر ترجعله وتراجعه وقت ما تحب.',
      ),
      position: 'bottom',
      pose: 'proud',
    },
    {
      targetId: ['student-wallet', 'student-more-btn'],
      open: 'more',
      title: t('Your wallet', 'محفظتك'),
      description: t(
        'Your packages, lesson credits and receipts. A lesson you cancel in time comes back here as a credit.',
        'باقاتك والحصص اللي ليك ووصولات الدفع. ولو لغيت حصة في ميعادها، بترجع هنا رصيد.',
      ),
      position: 'bottom',
      pose: 'wow',
    },
    {
      targetId: ['nav-account-link-desktop'],
      phone: ['student-account'],
      open: 'more',
      title: t('Your account', 'حسابك'),
      description: t(
        'Your name, WhatsApp and time zone, your teacher (you can ask to change them from here), and signing out.',
        'اسمك ورقم الواتساب والتوقيت، ومعلمك (ومن هنا تقدر تطلب تغييره)، وتسجيل الخروج.',
      ),
      position: 'bottom',
      pose: 'point',
    },
    {
      targetId: ['student-notifications'],
      title: t('Notifications', 'التنبيهات'),
      description: t(
        'Reminders before each lesson and news from our team land on this bell.',
        'تنبيهات قبل كل حصة وأخبار فريقنا بتوصل على الجرس ده.',
      ),
      position: 'bottom',
      pose: 'wow',
    },
    {
      targetId: ['header-lang-btn'],
      title: t('Arabic or English', 'عربي أو إنجليزي'),
      description: t(
        'Switch the whole account between Arabic and English any time.',
        'من هنا تغيّر لغة الحساب كله بين العربي والإنجليزي في أي وقت.',
      ),
      position: 'bottom',
      pose: 'love',
    },
    {
      targetId: ['student-header-tour-btn'],
      phone: ['student-tour-btn-mobile'],
      open: 'more',
      title: t("You're all set", 'كده جاهز'),
      description: t(
        'To watch this tour again, tap here any time.',
        'ولو حبيت تشوف الجولة تاني، اضغط هنا في أي وقت.',
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
        "I'll show you how to follow your children's learning here, one button at a time. Two minutes, and you can skip any time.",
        'هوريك تتابع تعلّم أولادك من هنا إزاي، زرار زرار. دقيقتين، وتقدر تتخطى في أي وقت.',
      ),
      pose: 'wave',
      route: '/student',
    },
    {
      targetId: ['family-children'],
      title: t('Your children', 'أولادك'),
      description: t(
        'One card per child: their teacher, lessons done and their next lesson. If nothing is booked, "Pick a time" books for that child.',
        'كارت لكل طفل: معلمه، والحصص اللي خلّصها، وحصته الجاية. ولو مفيش حاجة محجوزة، «اختار ميعاد» بتحجزله على طول.',
      ),
      position: 'bottom',
      pose: 'love',
      route: '/student',
    },
    {
      targetId: ['nav-book-link-desktop'],
      phone: ['nav-book-link'],
      title: t('Book a lesson', 'احجز درس'),
      description: t(
        "Tap here, choose which child the lesson is for, then a time from their teacher's free hours (in your time zone).",
        'اضغط هنا، اختار الحصة لأنهي طفل، وبعدين ميعاد من مواعيد معلمه الفاضية (بتوقيتك).',
      ),
      position: 'top',
      pose: 'excited',
    },
    {
      targetId: ['learner-chips'],
      title: t("Each child's lessons", 'دروس كل طفل'),
      description: t(
        'This is the lessons page. Tap a child\'s name to see only their lessons, or "Whole family" for everyone. Tap a lesson to move or cancel it.',
        'دي صفحة الدروس. اضغط على اسم الطفل تشوف دروسه هو بس، أو «كل الأسرة» تشوفهم كلهم. واضغط على أي حصة عشان تغيّر ميعادها أو تلغيها.',
      ),
      position: 'bottom',
      pose: 'think',
      route: '/student/lessons',
    },
    {
      targetId: ['student-progress', 'student-more-btn'],
      open: 'more',
      title: t('Follow their progress', 'تابع تقدّمهم'),
      description: t(
        "Where each child is in every subject, the teacher's notes after each lesson, and a monthly report you can print.",
        'هنا وصل كل طفل لفين في كل مادة، وملاحظات المعلم بعد كل حصة، وتقرير شهري تقدر تطبعه.',
      ),
      position: 'bottom',
      pose: 'proud',
    },
    {
      targetId: ['student-homework'],
      open: 'more',
      title: t('Homework', 'الواجبات'),
      description: t(
        'The short questions each teacher leaves after a lesson. Sit with your child, answer together and tap Done.',
        'الأسئلة القصيرة اللي المعلم بيسيبها بعد كل حصة. اقعد مع ابنك، جاوبوا مع بعض واضغطوا «تم».',
      ),
      position: 'bottom',
      pose: 'think',
    },
    {
      targetId: ['student-messages'],
      title: t('Messages', 'الرسائل'),
      description: t(
        "Talk to each child's teacher or to our team here. A number on it means a new reply.",
        'من هنا تكلّم معلم كل طفل أو فريقنا. لو ظهر عليه رقم، يبقى في رد جديد.',
      ),
      position: 'top',
      pose: 'love',
    },
    {
      targetId: ['nav-account-link-desktop'],
      phone: ['student-account'],
      open: 'more',
      title: t('Your account', 'حسابك'),
      description: t(
        "Add a child, see each child's teacher and ask to change one, your contact details, and signing out.",
        'من هنا تضيف طفل، وتشوف معلم كل طفل وتطلب تغييره لو حبيت، وبيانات التواصل، وتسجيل الخروج.',
      ),
      position: 'bottom',
      pose: 'point',
    },
    {
      targetId: ['student-notifications'],
      title: t('Notifications', 'التنبيهات'),
      description: t(
        'Reminders before every lesson, for every child, land on this bell.',
        'تنبيهات قبل كل حصة، لكل طفل، بتوصل على الجرس ده.',
      ),
      position: 'bottom',
      pose: 'wow',
    },
    {
      targetId: ['student-header-tour-btn'],
      phone: ['student-tour-btn-mobile'],
      open: 'more',
      title: t("You're all set", 'كده جاهزين'),
      description: t(
        'To watch this tour again, tap here any time.',
        'ولو حبيت تشوف الجولة تاني، اضغط هنا في أي وقت.',
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
      description: t('Tap search (or press Ctrl K) to find any account, child, booking reference or payment.', 'اضغط البحث (أو Ctrl K) ودوّر على أي حساب أو طفل أو رقم حجز أو دفعة.'),
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
