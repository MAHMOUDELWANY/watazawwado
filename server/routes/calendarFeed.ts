import express from 'express';
import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { buildIcs } from '../../src/lib/ics.js';
import { normalizeSubjectSlug, resolveSubjectMeta } from './progress.js';

/** QA-07 pilot: the PA-03 family calendar routes, moved out of api/index.ts unchanged. */
// PA-03: one secret calendar-subscription link per account (only its SHA-256 is stored; regenerating revokes the old
// link). The feed lists the family's lessons with subject and first name, never a Zoom link.
const FEED_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const feedTokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const siteOrigin = (req: any) => (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

type Middleware = (req: any, res: any, next: any) => any;

export function registerCalendarFeedRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
  escapeLike: (value: string) => string;
}) {
  app.get('/api/student/calendar-feed', deps.verifyStudentAuth, async (req: any, res: any) => {
    const supabaseAdmin = deps.getClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = req.studentUser?.auth_id;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return res.json({ active: false });
    const { data } = await supabaseAdmin.from('calendar_feed_tokens').select('created_at').eq('user_id', userId).maybeSingle();
    return res.json({ active: Boolean(data), createdAt: data?.created_at || null });
  });

  app.post('/api/student/calendar-feed', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const supabaseAdmin = deps.getClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = req.studentUser?.auth_id;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
    const token = crypto.randomBytes(32).toString('base64url');
    const { error } = await supabaseAdmin
      .from('calendar_feed_tokens')
      .upsert({ user_id: userId, token_hash: feedTokenHash(token), created_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('[POST /api/student/calendar-feed]', error.message);
      return res.status(500).json({ error: 'Could not create the calendar link.' });
    }
    // Shown once: the server keeps only the hash.
    return res.status(201).json({ url: `${siteOrigin(req)}/api/calendar/family/${token}.ics` });
  });

  app.delete('/api/student/calendar-feed', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const supabaseAdmin = deps.getClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = req.studentUser?.auth_id;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
    const { error } = await supabaseAdmin.from('calendar_feed_tokens').delete().eq('user_id', userId);
    if (error) return res.status(500).json({ error: 'Could not turn the calendar link off.' });
    return res.json({ active: false });
  });

  app.get('/api/calendar/family/:file', deps.rateLimit, async (req: any, res: any) => {
    try {
      const token = String(req.params.file || '').replace(/\.ics$/, '');
      if (!FEED_TOKEN_RE.test(token)) return res.status(404).send('Not found');
      const supabaseAdmin = deps.getClient();
      if (!supabaseAdmin) return res.status(503).send('Unavailable');
      const { data: row } = await supabaseAdmin.from('calendar_feed_tokens').select('user_id').eq('token_hash', feedTokenHash(token)).maybeSingle();
      if (!row?.user_id) return res.status(404).send('Not found');

      const { data: own } = await supabaseAdmin.from('students').select('id, name, email').eq('auth_user_id', row.user_id).maybeSingle();
      const email = String(own?.email || '').toLowerCase();
      const { data: guardianRows } = email ? await supabaseAdmin.from('guardians').select('student_id').ilike('parent_email', deps.escapeLike(email)) : { data: [] as any[] };
      const ids = [...new Set([own?.id, ...(guardianRows || []).map((g: any) => g.student_id)].filter(Boolean))] as string[];
      if (!ids.length) return res.status(404).send('Not found');

      const now = DateTime.utc();
      const [{ data: learners }, { data: bookings }] = await Promise.all([
        supabaseAdmin.from('students').select('id, name').in('id', ids),
        supabaseAdmin.from('bookings').select('id, student_id, service_id, scheduled_start, scheduled_end, duration_minutes, status')
          .in('student_id', ids).in('status', ['confirmed', 'rescheduled'])
          .gte('scheduled_start', now.minus({ days: 30 }).toISO()).lte('scheduled_start', now.plus({ days: 180 }).toISO())
          .order('scheduled_start', { ascending: true }).limit(500)
      ]);
      const firstName = new Map((learners || []).map((l: any) => [l.id, String(l.name || '').trim().split(/\s+/)[0] || '']));
      const origin = siteOrigin(req);
      const events = (bookings || []).map((b: any) => {
        const slug = normalizeSubjectSlug(b.service_id);
        const subject = slug ? resolveSubjectMeta(slug).en : 'Lesson';
        const who = firstName.get(b.student_id);
        return {
          uid: `${b.id}@watazawwado.academy`,
          startIso: b.scheduled_start,
          endIso: b.scheduled_end || DateTime.fromISO(b.scheduled_start).plus({ minutes: b.duration_minutes || 45 }).toISO(),
          title: `${subject}${who ? ` · ${who}` : ''} · Watazawwado`,
          description: 'Join from your Watazawwado lessons page.',
          url: `${origin}/student/lessons`
        };
      });
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Cache-Control', 'private, max-age=900');
      res.setHeader('X-Robots-Tag', 'noindex');
      return res.send(buildIcs(events, 'Watazawwado lessons'));
    } catch (err) {
      console.error('[GET /api/calendar/family]', err);
      return res.status(500).send('Error');
    }
  });
}
