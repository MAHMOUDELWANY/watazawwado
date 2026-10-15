/**
 * On-site notifications (user_notifications) with an optional matching email.
 * Used for things a person must not miss: refunds, admin questions, placement-test results.
 * Never throws: a failed notice must not fail the action that triggered it.
 */
import { sendEmail, OFFICIAL_ADMIN_EMAIL } from './emailService.js';
import { renderSimpleNotice, type EmailLang } from './emailTemplates.js';
import { resolveEmailLanguage } from './dispatcher.js';

type L = { en: string; ar: string };

/** The account that owns a learner's lessons: the learner's own, or the parent's for a child. */
export async function resolveLearnerAccount(
  client: any,
  studentId: string | null | undefined
): Promise<{ userId: string | null; email: string | null; name: string | null; viaParent: boolean }> {
  if (!studentId) return { userId: null, email: null, name: null, viaParent: false };
  const { data: st } = await client.from('students').select('auth_user_id, email, name').eq('id', studentId).maybeSingle();
  let userId: string | null = st?.auth_user_id || null;
  let email: string | null = st?.email || null;
  const name: string | null = st?.name || null;
  let viaParent = false;
  if (!userId) {
    const { data: g } = await client.from('guardians').select('parent_email').eq('student_id', studentId).limit(1);
    const parentEmail = g?.[0]?.parent_email;
    if (parentEmail) {
      // Escape LIKE wildcards so the email matches literally.
      const safe = String(parentEmail).replace(/[\\%_]/g, (c: string) => '\\' + c);
      const { data: parent } = await client.from('students').select('auth_user_id').ilike('email', safe).not('auth_user_id', 'is', null).limit(1);
      userId = parent?.[0]?.auth_user_id || null;
      email = parentEmail;
      viaParent = true;
    }
  }
  return { userId, email, name, viaParent };
}

export interface InboxNotice {
  kind: string;
  title: L;
  body: L;
  /** Path on the site, e.g. /student/messages */
  link?: string;
}

export async function notifyUser(
  client: any,
  recipient: { userId?: string | null; email?: string | null; name?: string | null; staff?: boolean },
  notice: InboxNotice,
  options: { email?: boolean } = {}
): Promise<void> {
  try {
    if (recipient.userId) {
      const { error } = await client.from('user_notifications').insert({
        recipient_user_id: recipient.userId,
        kind: notice.kind,
        title_en: notice.title.en,
        title_ar: notice.title.ar,
        body_en: notice.body.en,
        body_ar: notice.body.ar,
        link: notice.link || null
      });
      if (error) console.warn('[Inbox] insert failed:', error.message);
    }
    if (options.email && recipient.email) {
      const lang: EmailLang = await resolveEmailLanguage(recipient.email);
      const mail = renderSimpleNotice({ name: recipient.name, title: notice.title, body: notice.body, buttonPath: notice.link, staff: recipient.staff, lang });
      // Refund notices come from finance@; everything else from support@.
      await sendEmail({ to: recipient.email, toName: recipient.name || undefined, ...mail, from: notice.kind.startsWith('refund') ? 'finance' : 'support' });
    }
  } catch (err) {
    console.warn('[Inbox] notify failed:', err);
  }
}

/** Every active super admin gets the on-site notice; the admin inbox email gets one copy. */
export async function notifySuperAdmins(client: any, notice: InboxNotice, options: { email?: boolean } = {}): Promise<void> {
  try {
    const { data: admins } = await client.from('teacher_accounts').select('email').eq('role', 'super_admin').eq('is_active', true);
    const emails = (admins || []).map((a: any) => String(a.email || '').toLowerCase()).filter(Boolean);
    if (emails.length) {
      const { data: profiles } = await client.from('profiles').select('id, email').in('email', emails);
      for (const p of profiles || []) await notifyUser(client, { userId: p.id, staff: true }, notice);
    }
    if (options.email) await notifyUser(client, { email: OFFICIAL_ADMIN_EMAIL, staff: true }, notice, { email: true });
  } catch (err) {
    console.warn('[Inbox] admin notify failed:', err);
  }
}
