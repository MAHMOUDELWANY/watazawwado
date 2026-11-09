import express from 'express';
import { parseSubscription, pushConfigured } from '../notifications/push.js';
import { isUuid } from './progress.js';

/** NX-09: a family or a teacher turns phone notifications on or off for this device. */
type Middleware = (req: any, res: any, next: any) => any;

export function registerPushRoutes(app: express.Express, deps: { getClient: () => any; verifyStudentAuth: Middleware; verifyTeacherAuth: Middleware; rateLimit: Middleware }) {
  // The public VAPID key the browser needs to subscribe (null until the keys are set).
  app.get('/api/push/public-key', (_req: any, res: any) => {
    res.json({ key: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null });
  });

  // Teacher notices are sent to the teacher's auth id (bookings.teacher_id), the same id verifyTeacherAuth sets.
  const roles = [
    { role: 'student', verify: deps.verifyStudentAuth, userIdOf: (req: any) => req.studentUser?.auth_id },
    { role: 'teacher', verify: deps.verifyTeacherAuth, userIdOf: (req: any) => req.teacherUser?.id },
  ];

  for (const { role, verify, userIdOf } of roles) {
    app.post(`/api/${role}/push/subscribe`, deps.rateLimit, verify, async (req: any, res: any) => {
      const userId = userIdOf(req);
      if (!isUuid(userId)) return res.status(403).json({ error: 'Please sign in with your own account.' });
      const sub = parseSubscription(req.body?.subscription);
      if (!sub) return res.status(400).json({ error: 'This browser sent an invalid subscription.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const { error } = await client.from('push_subscriptions').upsert({
        user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth,
        user_agent: String(req.headers['user-agent'] || '').slice(0, 300) || null,
      }, { onConflict: 'endpoint' });
      if (error) { console.error('[push subscribe]', error.message); return res.status(500).json({ error: 'Could not turn notifications on.' }); }
      return res.json({ on: true });
    });

    app.post(`/api/${role}/push/unsubscribe`, deps.rateLimit, verify, async (req: any, res: any) => {
      const userId = userIdOf(req);
      const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
      if (!isUuid(userId) || !endpoint) return res.status(400).json({ error: 'Nothing to turn off.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      // Only this account's own subscription for that device.
      await client.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
      return res.json({ on: false });
    });
  }
}
