import express from 'express';

/**
 * ST-06: self-service privacy requests (privacy policy: answered within one month).
 * - Download my data: a JSON copy of the signed-in account's own data and its children's. Internal fields (tokens,
 *   calendar/Zoom ids, teachers' private notes) are left out; the file says how to ask privacy@ for anything else.
 * - Delete my account: records a request for the super admin and tells privacy@. Nothing is deleted automatically.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Columns that may leave the server in an export. Anything not listed here stays out. */
export const EXPORT_COLUMNS = {
  students: 'id, name, email, whatsapp, learner_type, country, timezone, current_level, status, learning_interest, learning_goal, learning_needs, booking_preference, gender, teacher_gender_preference, age, heard_about, onboarding_completed, created_at',
  guardians: 'student_id, parent_name, parent_email, parent_whatsapp, relationship_type, created_at',
  student_goals: 'student_id, service_id, goal_text, is_primary, status, created_at',
  bookings: 'id, reference_code, student_id, service_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, contact_name, contact_email, contact_whatsapp, parent_name, cancellation_reason, fee_amount_usd, payment_plan, reschedule_count, terms_version, terms_accepted_at, created_at',
  payments: 'id, booking_id, student_id, amount, currency, payment_method, status, confirmed_at, created_at',
  package_entitlements: 'id, learner_student_id, purchased_quantity, price_paid, currency, acquired_at, status, remaining_credits, used_credits, created_at',
  lesson_notes: 'student_id, family_summary, next_steps, achievements, created_at',
  placement_tests: 'learner_student_id, learner_name, service_id, stated_level, score, max_score, suggested_level, status, admin_reply, admin_level, submitted_at, reviewed_at',
  lesson_feedback: 'booking_id, rating, comment, created_at',
  user_notifications: 'kind, title_en, title_ar, body_en, body_ar, link, read_at, created_at',
  notification_preferences: 'progress_emails, renewal_reminders, follow_ups, updated_at',
  user_language_preferences: 'language, updated_at'
} as const;

/** Never exported, whatever the column lists above say (checked by a test). */
export const NEVER_EXPORTED = ['management_token', 'management_token_hash', 'zoom_meeting_link', 'zoom_meeting_id', 'google_calendar_event_id', 'sync_metadata', 'private_notes', 'observations', 'payment_reference', 'questions', 'answers', 'ai_summary'];

type Middleware = (req: any, res: any, next: any) => any;

export function registerPrivacyRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  notifyAdmins: (client: any, notice: any) => Promise<void>;
  emailPrivacyTeam: (subject: string, text: string) => Promise<void>;
}) {
  const realUser = (req: any) => {
    const id = req.studentUser?.auth_id;
    return id && UUID_RE.test(id) ? String(id) : null;
  };

  app.get('/api/student/privacy/export', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = realUser(req);
    if (!userId) return res.status(401).json({ error: 'Please sign in again.' });
    try {
      const learners = await deps.getLearners(client, req);
      const ids = learners.map((l) => l.id);
      const none = { data: [] as any[] };
      const byLearners = (table: keyof typeof EXPORT_COLUMNS, col: string) =>
        ids.length ? client.from(table).select(EXPORT_COLUMNS[table]).in(col, ids).limit(2000) : Promise.resolve(none);
      const { data: threads } = await client.from('chat_threads').select('id, kind, created_at').eq('owner_user_id', userId);
      const threadIds = (threads || []).map((t: any) => t.id);
      const [students, guardians, goals, bookings, payments, packages, notes, placements, feedback, notifications, prefs, lang, messages] = await Promise.all([
        byLearners('students', 'id'),
        byLearners('guardians', 'student_id'),
        byLearners('student_goals', 'student_id'),
        byLearners('bookings', 'student_id'),
        byLearners('payments', 'student_id'),
        byLearners('package_entitlements', 'learner_student_id'),
        byLearners('lesson_notes', 'student_id'),
        byLearners('placement_tests', 'learner_student_id'),
        client.from('lesson_feedback').select(EXPORT_COLUMNS.lesson_feedback).eq('submitted_by', userId),
        client.from('user_notifications').select(EXPORT_COLUMNS.user_notifications).eq('recipient_user_id', userId).limit(2000),
        client.from('notification_preferences').select(EXPORT_COLUMNS.notification_preferences).eq('user_id', userId),
        client.from('user_language_preferences').select(EXPORT_COLUMNS.user_language_preferences).eq('user_id', userId),
        threadIds.length
          ? client.from('chat_messages').select('thread_id, sender_role, body, created_at').in('thread_id', threadIds).order('created_at').limit(5000)
          : Promise.resolve(none)
      ]);
      const failed = [students, guardians, goals, bookings, payments, packages, notes, placements, feedback, notifications, prefs, lang, messages].find((r: any) => r?.error);
      if (failed) return res.status(500).json({ error: 'Could not prepare your data.' });
      const payload = {
        exportedAt: new Date().toISOString(),
        about: 'A copy of the personal data Watazawwado Academy holds for this account and its children. For anything not included here (for example internal teacher notes or email logs), write to privacy@watazawwado.academy.',
        account: { userId, email: req.studentUser?.email || null },
        learners: students.data, guardians: guardians.data, goals: goals.data,
        lessons: bookings.data, payments: payments.data, packages: packages.data,
        teacherNotesForFamily: notes.data, placementTests: placements.data, lessonRatings: feedback.data,
        conversations: (threads || []).map((t: any) => ({ ...t, messages: (messages.data || []).filter((m: any) => m.thread_id === t.id).map(({ thread_id, ...m }: any) => m) })),
        siteNotifications: notifications.data, emailPreferences: prefs.data?.[0] || null, language: lang.data?.[0] || null
      };
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="watazawwado-my-data-${new Date().toISOString().slice(0, 10)}.json"`);
      res.setHeader('Cache-Control', 'no-store');
      return res.send(JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('[GET /api/student/privacy/export]', err);
      return res.status(500).json({ error: 'Could not prepare your data.' });
    }
  });

  app.get('/api/student/privacy/delete-request', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = realUser(req);
    if (!userId) return res.json({ request: null });
    const { data } = await client.from('privacy_requests').select('id, status, created_at').eq('user_id', userId).eq('status', 'open').maybeSingle();
    return res.json({ request: data ? { status: data.status, createdAt: data.created_at } : null });
  });

  app.post('/api/student/privacy/delete-request', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = realUser(req);
    if (!userId) return res.status(401).json({ error: 'Please sign in again.' });
    if (req.body?.confirm !== true) return res.status(400).json({ error: 'Please confirm the request.' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 1000) || null : null;
    try {
      const { data: open } = await client.from('privacy_requests').select('created_at').eq('user_id', userId).eq('status', 'open').maybeSingle();
      if (open) return res.json({ request: { status: 'open', createdAt: open.created_at }, alreadyOpen: true });
      const { data, error } = await client.from('privacy_requests').insert({ user_id: userId, kind: 'deletion', reason }).select('created_at').single();
      if (error) {
        console.error('[POST delete-request]', error.message);
        return res.status(500).json({ error: 'Could not record your request.' });
      }
      const email = String(req.studentUser?.email || '');
      const name = String(req.studentUser?.name || '');
      await deps.notifyAdmins(client, {
        kind: 'privacy_request',
        title: { en: 'Account deletion request', ar: 'طلب حذف حساب' },
        body: { en: `${name || email} asked us to delete their account. Answer within one month.`, ar: `${name || email} طلب حذف حسابه. لازم نرد خلال شهر.` },
        link: '/dashboard/analytics'
      });
      await deps.emailPrivacyTeam(
        'Account deletion request',
        `An account asked for deletion on the website.\nAccount: ${email}\nUser id: ${userId}\nRequested at: ${data.created_at}\nReason: ${reason || '(none given)'}\n\nThe privacy policy promises an answer within one month. Nothing has been deleted automatically.`
      );
      return res.status(201).json({ request: { status: 'open', createdAt: data.created_at } });
    } catch (err) {
      console.error('[POST /api/student/privacy/delete-request]', err);
      return res.status(500).json({ error: 'Could not record your request.' });
    }
  });

  // Super admin: open and recent requests, and marking one handled (the deletion itself is done by hand).
  app.get('/api/dashboard/admin/privacy-requests', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data, error } = await client.from('privacy_requests').select('id, user_id, status, reason, created_at, resolved_at').order('created_at', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: 'Could not load requests.' });
    const ids = [...new Set((data || []).map((r: any) => r.user_id))];
    const { data: students } = ids.length ? await client.from('students').select('id, auth_user_id, name, email').in('auth_user_id', ids) : { data: [] as any[] };
    const who = new Map<string, any>((students || []).map((s: any) => [s.auth_user_id, s]));
    return res.json({
      requests: (data || []).map((r: any) => ({ ...r, name: who.get(r.user_id)?.name || null, email: who.get(r.user_id)?.email || null, studentId: who.get(r.user_id)?.id || null }))
    });
  });

  app.post('/api/dashboard/admin/privacy-requests/:id/done', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(404).json({ error: 'Request not found.' });
    const { data, error } = await client.from('privacy_requests').update({ status: 'done', resolved_at: new Date().toISOString() }).eq('id', req.params.id).eq('status', 'open').select('id').maybeSingle();
    if (error) return res.status(500).json({ error: 'Could not update the request.' });
    if (!data) return res.status(404).json({ error: 'Request not found or already handled.' });
    return res.json({ done: true });
  });
}
