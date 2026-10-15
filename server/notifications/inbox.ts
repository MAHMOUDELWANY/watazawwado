/**
 * On-site notifications (user_notifications) with an optional matching email.
 * Used for things a person must not miss: refunds, admin questions, placement-test results.
 * Never throws: a failed notice must not fail the action that triggered it.
 */
import { sendEmail, OFFICIAL_ADMIN_EMAIL } from './emailService.js';
import { renderSimpleNotice, type EmailLang } from './emailTemplates.js';
import { resolveEmailLanguage } from './dispatcher.js';

type L = { en: string; ar: string };

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
      await sendEmail({ to: recipient.email, toName: recipient.name || undefined, ...mail });
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
