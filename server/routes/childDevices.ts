import crypto from 'crypto';
import express from 'express';
import { notifyUser } from '../notifications/inbox.js';
import { isUuid } from './progress.js';

/**
 * NX-16: a child's own phone, linked to the parent's account (owner approved the design 2026-11-02).
 * The parent stays the account holder; the child has no email and no password. The parent creates a one-time
 * 10-digit code (15 minutes) in the Family tab; the child's phone trades it for a long-lived device token
 * ("kid_..."). verifyStudentAuth accepts that token only for CHILD_ROUTES and narrows the account's learners to
 * that one child, so the phone sees only that child's lessons, homework, review, recitations and lesson room:
 * no payments, booking, settings or other children. The parent removes a phone at once.
 */
type Middleware = (req: any, res: any, next: any) => any;

export const KID_TOKEN_PREFIX = 'kid_';
export const CODE_MINUTES = 15;
const MAX_DEVICES = 10;

export const hashSecret = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const CODE_DIGITS = 10;
// Ten digits (10^10): guessing any family's live code in its 15 minutes is out of reach even past the per-IP limit.
export const newLinkCode = () => String(crypto.randomInt(0, 100_000)).padStart(5, '0') + String(crypto.randomInt(0, 100_000)).padStart(5, '0');
export const newDeviceToken = () => KID_TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');

/** The only API routes a child phone may call (method + path, no query). */
const CHILD_ROUTES: Array<[string, RegExp]> = [
  ['GET', /^\/api\/kid\/me$/],
  ['GET', /^\/api\/student\/homework$/],
  ['POST', /^\/api\/student\/homework\/[^/]+\/done$/],
  ['GET', /^\/api\/student\/review$/],
  ['POST', /^\/api\/student\/review\/[^/]+$/],
  ['GET', /^\/api\/student\/recitations$/],
  ['POST', /^\/api\/student\/recitations$/],
  ['POST', /^\/api\/student\/recitations\/upload-url$/],
  ['GET', /^\/api\/student\/lesson-room\/[^/]+$/],
];

export function isChildRoute(method: string, path: string): boolean {
  return CHILD_ROUTES.some(([m, re]) => m === method && re.test(path));
}

/**
 * Called by verifyStudentAuth for a "kid_" token. Sets req.studentUser to the parent's account (so every existing
 * check runs unchanged) and req.childDevice, which narrows the learners to the one child.
 */
export async function authenticateChildDevice(client: any, req: any, res: any, next: any, token: string) {
  const path = String(req.originalUrl || req.url || '').split('?')[0];
  if (!isChildRoute(req.method, path)) return res.status(403).json({ error: 'This page is not available on a child device.' });
  if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
  const { data: device } = await client.from('child_devices')
    .select('id, owner_user_id, learner_id, last_seen_at').eq('token_hash', hashSecret(token)).is('revoked_at', null).maybeSingle();
  if (!device) return res.status(401).json({ error: 'This device is no longer linked. Ask your parent for a new code.', code: 'CHILD_DEVICE_UNLINKED' });
  const { data: owner } = await client.from('students')
    .select('id, name, email, timezone, learner_type, current_level, status, assigned_teacher_id').eq('auth_user_id', device.owner_user_id).maybeSingle();
  if (!owner) return res.status(401).json({ error: 'This device is no longer linked. Ask your parent for a new code.', code: 'CHILD_DEVICE_UNLINKED' });
  // "Last used" for the parent's list, written at most every 10 minutes.
  if (!device.last_seen_at || Date.now() - Date.parse(device.last_seen_at) > 10 * 60 * 1000) {
    await client.from('child_devices').update({ last_seen_at: new Date().toISOString() }).eq('id', device.id);
  }
  req.studentUser = {
    auth_id: device.owner_user_id,
    email: String(owner.email || '').toLowerCase(),
    student_id: owner.id,
    assigned_teacher_id: owner.assigned_teacher_id || null,
    name: owner.name || 'Student',
    studentProfile: owner,
  };
  req.childDevice = { id: device.id, learnerId: device.learner_id };
  return next();
}

export function registerChildDeviceRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string; isPrimary?: boolean }>>;
}) {
  const db = (res: any) => {
    const client = deps.getClient();
    if (!client) res.status(503).json({ error: 'Database service unavailable.' });
    return client;
  };
  const ownerOf = (req: any) => (isUuid(req.studentUser?.auth_id) ? req.studentUser.auth_id as string : null);

  // Parent: linked phones (paired, not removed).
  app.get('/api/student/child-devices', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const owner = ownerOf(req);
    if (!owner) return res.json({ devices: [] });
    const [{ data, error }, learners] = await Promise.all([
      client.from('child_devices').select('id, learner_id, name, paired_at, last_seen_at')
        .eq('owner_user_id', owner).is('revoked_at', null).not('paired_at', 'is', null).order('paired_at', { ascending: false }),
      deps.getLearners(client, req),
    ]);
    if (error) { console.error('[child-devices list]', error.message); return res.status(500).json({ error: 'Could not load the devices.' }); }
    const names = new Map(learners.map((l) => [l.id, l.name]));
    return res.json({ devices: (data || []).map((d: any) => ({ id: d.id, learnerId: d.learner_id, learnerName: names.get(d.learner_id) || null, name: d.name, pairedAt: d.paired_at, lastSeenAt: d.last_seen_at })) });
  });

  // Parent: a one-time code for one child.
  app.post('/api/student/child-devices', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const owner = ownerOf(req);
    if (!owner) return res.status(403).json({ error: 'Please sign in with your own account.' });
    const learnerId = typeof req.body?.learnerId === 'string' ? req.body.learnerId : '';
    const learners = await deps.getLearners(client, req);
    const child = learners.find((l) => l.id === learnerId && !l.isPrimary);
    if (!child) return res.status(403).json({ error: 'This child is not on your account.' });
    const name = (typeof req.body?.name === 'string' ? req.body.name.trim() : '').slice(0, 60) || `${child.name}`;
    const now = new Date();
    // Old codes that were never used go; a code is only good once and for 15 minutes.
    await client.from('child_devices').delete().eq('owner_user_id', owner).is('paired_at', null);
    const { count } = await client.from('child_devices').select('id', { count: 'exact', head: true }).eq('owner_user_id', owner).is('revoked_at', null);
    if ((count || 0) >= MAX_DEVICES) return res.status(409).json({ error: 'Remove a device you no longer use first.' });
    const code = newLinkCode();
    const expiresAt = new Date(now.getTime() + CODE_MINUTES * 60 * 1000).toISOString();
    const { data, error } = await client.from('child_devices')
      .insert({ owner_user_id: owner, learner_id: child.id, name, code_hash: hashSecret(code), code_expires_at: expiresAt }).select('id').single();
    if (error) { console.error('[child-devices create]', error.message); return res.status(500).json({ error: 'Could not create a code.' }); }
    return res.status(201).json({ id: data.id, code, expiresAt, learnerName: child.name });
  });

  // Parent: remove a phone (it stops working at its next request).
  app.delete('/api/student/child-devices/:id', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const owner = ownerOf(req);
    if (!owner || !isUuid(req.params.id)) return res.status(404).json({ error: 'Device not found.' });
    const { data, error } = await client.from('child_devices').update({ revoked_at: new Date().toISOString(), code_hash: null })
      .eq('id', req.params.id).eq('owner_user_id', owner).is('revoked_at', null).select('id').maybeSingle();
    if (error) { console.error('[child-devices revoke]', error.message); return res.status(500).json({ error: 'Could not remove the device.' }); }
    if (!data) return res.status(404).json({ error: 'Device not found.' });
    return res.json({ removed: true });
  });

  // Child phone: trade the parent's code for this phone's token.
  app.post('/api/kid/pair', deps.rateLimit, async (req: any, res: any) => {
    const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\D/g, '') : '';
    if (code.length !== CODE_DIGITS) return res.status(400).json({ error: 'Type the 10-digit code from your parent.' });
    const client = db(res); if (!client) return;
    const { data: row } = await client.from('child_devices').select('id, owner_user_id, learner_id, name')
      .eq('code_hash', hashSecret(code)).is('paired_at', null).is('revoked_at', null).gt('code_expires_at', new Date().toISOString()).maybeSingle();
    if (!row) return res.status(404).json({ error: 'This code is wrong or has expired. Ask your parent for a new one.' });
    const token = newDeviceToken();
    const { data: paired, error } = await client.from('child_devices')
      .update({ token_hash: hashSecret(token), paired_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), code_hash: null, code_expires_at: null })
      .eq('id', row.id).is('paired_at', null).select('id').maybeSingle();
    if (error || !paired) return res.status(409).json({ error: 'This code was already used. Ask your parent for a new one.' });
    const { data: learner } = await client.from('students').select('name').eq('id', row.learner_id).maybeSingle();
    await notifyUser(client, { userId: row.owner_user_id }, {
      kind: 'child_device_linked',
      title: { en: 'A device was linked', ar: 'تم ربط جهاز' },
      body: {
        en: `"${row.name}" now opens ${learner?.name || 'your child'}'s lessons. You can remove it from the Family tab.`,
        ar: `"${row.name}" بقى بيفتح حصص ${learner?.name || 'ابنك'}. تقدر تشيله من تبويب العيلة.`,
      },
      link: '/student/account?tab=family',
    });
    return res.json({ token, learnerName: learner?.name || null });
  });

  // Child phone: who this phone belongs to and the next lessons (time, subject, Zoom link only).
  app.get('/api/kid/me', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const learnerId = req.childDevice?.learnerId;
    if (!learnerId) return res.status(403).json({ error: 'This page is for a linked child device.' });
    const learner = (await deps.getLearners(client, req)).find((l) => l.id === learnerId);
    if (!learner) return res.status(401).json({ error: 'This device is no longer linked. Ask your parent for a new code.', code: 'CHILD_DEVICE_UNLINKED' });
    const { data, error } = await client.from('bookings')
      .select('id, scheduled_start, scheduled_end, duration_minutes, status, zoom_meeting_link, services:service_id(title, arabic_title)')
      .eq('student_id', learnerId).in('status', ['confirmed', 'rescheduled']).gt('scheduled_end', new Date().toISOString())
      .order('scheduled_start', { ascending: true }).limit(10);
    if (error) { console.error('[kid me]', error.message); return res.status(500).json({ error: 'Could not load your lessons.' }); }
    return res.json({
      learner: { id: learner.id, name: learner.name },
      lessons: (data || []).map((b: any) => {
        const s = Array.isArray(b.services) ? b.services[0] : b.services;
        return {
          id: b.id, start: b.scheduled_start, end: b.scheduled_end, minutes: b.duration_minutes,
          title: s?.title || 'Lesson', titleAr: s?.arabic_title || '',
          zoomUrl: typeof b.zoom_meeting_link === 'string' && b.zoom_meeting_link.trim() ? b.zoom_meeting_link.trim() : null,
        };
      }),
    });
  });
}
