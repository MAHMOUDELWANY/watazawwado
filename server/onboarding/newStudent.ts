/**
 * A new student finished onboarding (owner decision 2026-10-16): each teacher they chose gets an
 * email and an on-site notice with the onboarding details, a lesson chat opens between the account
 * and that teacher, and the super admin gets an on-site notice. Never throws.
 */
import { sendEmail } from '../notifications/emailService.js';
import { renderTeacherNotification } from '../notifications/emailTemplates.js';
import { resolveEmailLanguage } from '../notifications/dispatcher.js';
import { notifyUser, notifySuperAdmins } from '../notifications/inbox.js';
import { ensureTeacherThreads } from '../routes/community.js';

export interface NewLearner {
  name: string;
  age: number | null;
  gender: string | null;
  subject: string | null;
  level: string | null;
  goal?: string | null;
  notes?: string | null;
  teacherId: string | null;
}

export interface NewStudentAccount {
  /** Auth user id of the account that signed up (the parent for a family). */
  ownerUserId: string | null;
  name: string;
  email: string | null;
  whatsapp: string | null;
  country: string | null;
  timezone: string | null;
  isFamily: boolean;
  guardianAge?: number | null;
}

export interface TeacherContact { id: string; email: string; name: string }

/** Email rows for one teacher: the account, then each learner they will teach. */
export function newStudentDetails(account: NewStudentAccount, learners: NewLearner[]): Array<[string, string, unknown]> {
  const rows: Array<[string, string, unknown]> = [
    [account.isFamily ? 'Parent / guardian' : 'Student', account.isFamily ? 'ولي الأمر' : 'الطالب', account.name],
    ['Guardian age', 'سن ولي الأمر', account.isFamily ? account.guardianAge : null],
    ['Email', 'الإيميل', account.email],
    ['WhatsApp', 'واتساب', account.whatsapp],
    ['Country', 'الدولة', account.country],
    ['Time zone', 'المنطقة الزمنية', account.timezone]
  ];
  learners.forEach((l, i) => {
    const n = learners.length > 1 ? ` ${i + 1}` : '';
    const label = account.isFamily ? `Child${n}` : 'Learner';
    const labelAr = account.isFamily ? `الطفل${n}` : 'الدارس';
    const who = [l.name, l.age != null ? `${l.age}` : null, l.gender].filter(Boolean).join(' · ');
    rows.push([label, labelAr, who]);
    rows.push([`${label}: subject`, `${labelAr}: المادة`, [l.subject, l.level].filter(Boolean).join(' · ')]);
    if (l.goal) rows.push([`${label}: goal`, `${labelAr}: الهدف`, l.goal]);
    if (l.notes) rows.push([`${label}: notes`, `${labelAr}: ملاحظات`, l.notes]);
  });
  return rows;
}

export async function announceNewStudent(
  client: any,
  account: NewStudentAccount,
  learners: NewLearner[],
  teachers: TeacherContact[]
): Promise<void> {
  try {
    const teacherById = new Map(teachers.map(t => [t.id, t]));
    const teacherIds = [...new Set(learners.map(l => l.teacherId).filter((id): id is string => Boolean(id && teacherById.has(id))))];

    if (account.ownerUserId) await ensureTeacherThreads(client, account.ownerUserId, teacherIds);

    for (const teacherId of teacherIds) {
      const teacher = teacherById.get(teacherId)!;
      const theirs = learners.filter(l => l.teacherId === teacherId);
      const names = theirs.map(l => l.name).join(', ');
      const title = { en: 'A new student chose you', ar: 'طالب جديد اختارك' };
      const body = account.isFamily
        ? { en: `${account.name} signed up their family: ${names}. The chat with them is open.`, ar: `${account.name} سجّل أسرته: ${names}. المحادثة معاهم مفتوحة.` }
        : { en: `${names} signed up and chose you as their teacher. The chat with them is open.`, ar: `${names} سجّل واختارك معلمًا ليه. المحادثة معاه مفتوحة.` };
      await notifyUser(client, { userId: teacher.id, staff: true }, { kind: 'new_student', title, body, link: '/dashboard/messages' });
      try {
        const lang = await resolveEmailLanguage(teacher.email);
        const mail = renderTeacherNotification({
          eventType: 'new_student',
          summary: body.en,
          summaryAr: body.ar,
          details: newStudentDetails(account, theirs),
          lang
        });
        await sendEmail({ to: teacher.email, toName: teacher.name, ...mail });
      } catch (err) {
        console.warn('[Onboarding] teacher email failed', err);
      }
    }

    const allNames = learners.map(l => l.name).join(', ');
    await notifySuperAdmins(client, {
      kind: 'new_student',
      title: { en: 'New student signed up', ar: 'طالب جديد سجّل' },
      body: {
        en: `${account.name}${account.isFamily ? ` (family: ${allNames})` : ''} finished signing up.`,
        ar: `${account.name}${account.isFamily ? ` (أسرة: ${allNames})` : ''} خلّص التسجيل.`
      },
      link: '/dashboard/students'
    });
  } catch (err) {
    console.warn('[Onboarding] announce new student failed', err);
  }
}
