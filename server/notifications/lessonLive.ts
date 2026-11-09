/**
 * Owner review 2026-11-09: notices while a lesson is running, sent from the Zoom webhook.
 * - "Waiting for you": one side is in the Zoom room during the lesson and the other is not yet.
 * - Unstable connection: someone joined 4+ times in one lesson. Teacher and student are asked what happened and
 *   pointed to their chat to agree on a new time; the super admin is told so they can follow it.
 * Each notice goes once per lesson and person (checked against user_notifications). Never throws.
 */
import { notifyUser, notifySuperAdmins, resolveLearnerAccount } from './inbox.js';
import { analyzeAttendance, inRoomNow } from '../routes/attendance.js';
import { ensureTeacherThreads } from '../routes/community.js';

type Booking = {
  id: string; student_id: string | null; teacher_id: string | null; scheduled_start: string; scheduled_end: string | null;
  duration_minutes: number | null; reference_code?: string | null; contact_name?: string | null;
};

/** bookings.teacher_id is the teacher's auth user (profiles.id). */
async function teacherUser(client: any, teacherId: string | null) {
  if (!teacherId) return null;
  const { data: p } = await client.from('profiles').select('id, email, display_name').eq('id', teacherId).maybeSingle();
  return p ? { userId: p.id as string, email: (p.email as string) || null, name: (p.display_name as string) || null } : null;
}

async function alreadySent(client: any, userId: string | null, kind: string, bookingId: string) {
  if (!userId) return true;
  const { data } = await client.from('user_notifications').select('id').eq('recipient_user_id', userId).eq('kind', kind).like('link', `%${bookingId}%`).limit(1);
  return Boolean(data?.length);
}

async function lessonThreadLink(client: any, ownerUserId: string | null, teacherId: string | null, side: 'student' | 'teacher') {
  const base = side === 'student' ? '/student/messages' : '/dashboard/messages';
  if (!ownerUserId || !teacherId) return base;
  await ensureTeacherThreads(client, ownerUserId, [teacherId]);
  const { data } = await client.from('chat_threads').select('id').eq('kind', 'lesson').eq('owner_user_id', ownerUserId).eq('teacher_id', teacherId).maybeSingle();
  return data?.id ? `${base}?thread=${data.id}` : base;
}

export async function handleLiveLessonEvent(client: any, booking: Booking, eventName: string): Promise<void> {
  try {
    if (eventName !== 'joined') return;
    const now = Date.now();
    const start = new Date(booking.scheduled_start).getTime();
    const end = booking.scheduled_end ? new Date(booking.scheduled_end).getTime() : start + (booking.duration_minutes || 60) * 60_000;
    if (now < start - 10 * 60_000 || now > end) return;

    const { data: events } = await client.from('lesson_attendance_events').select('event, role, occurred_at').eq('booking_id', booking.id).order('occurred_at', { ascending: true }).limit(500);
    const evs = events || [];
    const room = inRoomNow(evs);
    const analysis = analyzeAttendance(evs, booking);
    const learner = await resolveLearnerAccount(client, booking.student_id);
    const teacher = await teacherUser(client, booking.teacher_id);
    const who = learner.name || booking.contact_name || '';
    const studentLink = `/student/lessons?lesson=${booking.id}`;
    const teacherLink = `/dashboard?lesson=${booking.id}`;

    // "Waiting for you": tell the side that is not in the room yet, once.
    if (room.studentIn && !room.teacherIn && teacher?.userId && !(await alreadySent(client, teacher.userId, 'lesson_waiting', booking.id))) {
      await notifyUser(client, { userId: teacher.userId, email: teacher.email, staff: true }, {
        kind: 'lesson_waiting',
        title: { en: `${who || 'Your student'} is waiting for you`, ar: `${who || 'الطالب'} مستنيك في الحصة` },
        body: { en: 'Your student is in the lesson room. Tap Start lesson to join.', ar: 'الطالب دخل غرفة الحصة. اضغط «ابدأ الحصة» وادخل.' },
        link: teacherLink,
      });
    }
    if (room.teacherIn && !room.studentIn && learner.userId && !(await alreadySent(client, learner.userId, 'lesson_waiting', booking.id))) {
      await notifyUser(client, { userId: learner.userId, email: learner.email, name: learner.name }, {
        kind: 'lesson_waiting',
        title: { en: 'Your teacher is waiting for you', ar: 'معلمك مستنيك في الحصة' },
        body: { en: 'Your lesson has started and your teacher is in the room. Tap to join.', ar: 'الحصة بدأت ومعلمك في الغرفة. اضغط وادخل.' },
        push: { body: { en: 'Your teacher is in the room and waiting for you. Jump in!', ar: 'معلمك في الغرفة ومستنيك. يلا ادخل!' } },
        link: studentLink,
      });
    }

    // Unstable connection: ask both sides once, and tell the admin.
    if (!analysis.unstable) return;
    const sideAr = analysis.unstable === 'teacher' ? 'المعلم' : analysis.unstable === 'student' ? 'الطالب' : 'المعلم والطالب';
    const sideEn = analysis.unstable === 'both' ? 'the teacher and the student' : `the ${analysis.unstable}`;
    if (teacher?.userId && !(await alreadySent(client, teacher.userId, 'lesson_unstable', booking.id))) {
      const chat = await lessonThreadLink(client, learner.userId, booking.teacher_id, 'teacher');
      await notifyUser(client, { userId: teacher.userId, email: teacher.email, staff: true }, {
        kind: 'lesson_unstable',
        title: { en: 'Is something wrong with the connection?', ar: 'في مشكلة في الاتصال؟' },
        body: {
          en: `The lesson with ${who || 'your student'} keeps dropping (${sideEn} joined ${Math.max(analysis.joins.teacher, analysis.joins.student)} times). If it can't go on, agree on a new time with the student in your chat. The admin is following it.`,
          ar: `حصة ${who || 'الطالب'} بتقطع كتير (${sideAr} دخل ${Math.max(analysis.joins.teacher, analysis.joins.student)} مرات). لو الحصة مش هتكمل، اتفقوا على ميعاد جديد في الشات. الإدارة متابعة معاكم.`,
        },
        link: `${chat}${chat.includes('?') ? '&' : '?'}lesson=${booking.id}`,
      });
    }
    if (learner.userId && !(await alreadySent(client, learner.userId, 'lesson_unstable', booking.id))) {
      const chat = await lessonThreadLink(client, learner.userId, booking.teacher_id, 'student');
      await notifyUser(client, { userId: learner.userId, email: learner.email, name: learner.name }, {
        kind: 'lesson_unstable',
        title: { en: 'Is the lesson connection OK?', ar: 'الاتصال في الحصة تمام؟' },
        body: {
          en: 'The lesson keeps dropping. If something came up or the connection is bad, message your teacher and agree on a new time together. Our team is following it too.',
          ar: 'الحصة بتقطع كتير. لو حصل ظرف أو النت ضعيف، كلّم معلمك في الشات واتفقوا على ميعاد جديد. فريقنا متابع معاكم.',
        },
        push: { body: { en: 'The lesson keeps dropping. Want to agree on a new time with your teacher?', ar: 'الحصة بتقطع. تحب تتفق مع معلمك على ميعاد جديد؟' } },
        link: `${chat}${chat.includes('?') ? '&' : '?'}lesson=${booking.id}`,
      });
      // The admin hears once per lesson (the learner's notice above is the once-only marker).
      await notifySuperAdmins(client, {
        kind: 'lesson_unstable',
        title: { en: 'Unstable lesson connection', ar: 'اتصال غير مستقر في حصة' },
        body: {
          en: `${who || 'A lesson'} (${booking.reference_code || booking.id.slice(0, 8)}): teacher joined ${analysis.joins.teacher}×, student ${analysis.joins.student}×, together ${analysis.togetherMinutes} min so far. Both were asked to agree on a new time in their chat.`,
          ar: `${who || 'حصة'} (${booking.reference_code || booking.id.slice(0, 8)}): المعلم دخل ${analysis.joins.teacher} مرات، والطالب ${analysis.joins.student} مرات، ومع بعض ${analysis.togetherMinutes} دقيقة لحد دلوقتي. اتطلب منهم يتفقوا على ميعاد في الشات.`,
        },
        link: `/dashboard/bookings?lesson=${booking.id}`,
      });
    }
  } catch (err) {
    console.warn('[lessonLive] notice failed:', err);
  }
}
