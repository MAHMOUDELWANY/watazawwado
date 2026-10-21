import express from 'express';
import { loadPreferences, sanitizePreferences } from '../notifications/preferences.js';

/** QA-07 step 2: the signed-in account's site language and optional-email choices, moved out of api/index.ts unchanged. */

type Middleware = (req: any, res: any, next: any) => any;

export function registerAccountPreferenceRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
}) {
  // Any signed-in user saves the language they chose on the site; emails use it (RULES.md §6).
  app.put('/api/me/language', deps.rateLimit, async (req: any, res: any) => {
    try {
      const supabase = deps.getClient();
      if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
      const language = req.body?.language;
      if (language !== 'en' && language !== 'ar') return res.status(400).json({ error: 'Language must be en or ar.' });
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const { data } = token ? await supabase.auth.getUser(token) : { data: null as any };
      const user = data?.user;
      if (!user?.id || !user.email) return res.status(401).json({ error: 'Please sign in.' });
      const { error } = await supabase
        .from('user_language_preferences')
        .upsert({ user_id: user.id, email: user.email.toLowerCase(), language, updated_at: new Date().toISOString() });
      if (error) throw error;
      res.json({ success: true, language });
    } catch (err) {
      console.error('[PUT /api/me/language]', err);
      res.status(500).json({ error: 'Could not save your language.' });
    }
  });

  // RN-07: the signed-in account's optional emails (progress, renewal reminders, follow-ups). Booking and payment
  // emails are not optional. Stored per account (auth user), so a parent's choice covers all their children.
  app.get('/api/student/notification-preferences', deps.verifyStudentAuth, async (req: any, res: any) => {
    const supabaseAdmin = deps.getClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
    return res.json({ preferences: await loadPreferences(supabaseAdmin, req.studentUser?.auth_id) });
  });

  app.put('/api/student/notification-preferences', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    try {
      const supabaseAdmin = deps.getClient();
      if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
      const userId = req.studentUser?.auth_id;
      if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
      const changes = sanitizePreferences(req.body);
      if (!changes) return res.status(400).json({ error: 'Send at least one of progress_emails, renewal_reminders, follow_ups as true or false.' });
      const merged = { ...(await loadPreferences(supabaseAdmin, userId)), ...changes };
      const { error } = await supabaseAdmin
        .from('notification_preferences')
        .upsert({ user_id: userId, ...merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) {
        console.error('[PUT /api/student/notification-preferences]', error.message);
        return res.status(500).json({ error: 'Could not save your choices. Please try again.' });
      }
      return res.json({ preferences: merged });
    } catch (err) {
      console.error('[PUT /api/student/notification-preferences]', err);
      return res.status(500).json({ error: 'Could not save your choices. Please try again.' });
    }
  });
}
