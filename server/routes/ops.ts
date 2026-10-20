import type express from 'express';

/**
 * Launch operations (docs/backlog/BACKLOG.md OPS-01..05): error capture, background heartbeats and the
 * admin health page. Everything here is best effort: monitoring must never break a real request.
 */

type Client = any;
type Middleware = (req: any, res: any, next: any) => any;

export interface OpsDeps {
  getClient: () => Client | null;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  placementBeforeBooking: boolean;
}

export type HealthStatus = 'green' | 'amber' | 'red';

export const HEARTBEAT_REMINDER_CRON = 'reminder_cron';
export const HEARTBEAT_STRIPE_WEBHOOK = 'stripe_webhook';

/** Removes query strings/fragments from URLs and masks emails and JWTs, so stored errors carry no personal data. */
export function scrubErrorText(text: string): string {
  return String(text)
    .replace(/((?:https?:\/\/|\/)[^\s?#'"()]*)[?#][^\s'"()]*/g, '$1')
    .replace(/[^\s@'"()<>]+@[^\s@'"()<>]+\.[a-z]{2,}/gi, '[email]')
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[token]');
}

/** Path part of a URL or path, without query string or fragment. */
export function pathOnly(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    return new URL(value, 'https://x.invalid').pathname.slice(0, 300);
  } catch {
    return null;
  }
}

export async function recordAppError(
  client: Client | null,
  e: { source: 'client' | 'api'; message: string; path?: string | null; stack?: string | null; accountId?: string | null }
): Promise<void> {
  // Local dev and the test suite share the production database; only the live site's errors belong in the list.
  if (!client || process.env.VERCEL_ENV !== 'production') return;
  try {
    const accountId = typeof e.accountId === 'string' && /^[0-9a-f-]{36}$/i.test(e.accountId) ? e.accountId : null;
    const { error } = await client.rpc('record_app_error', {
      p_source: e.source,
      p_message: scrubErrorText(e.message).slice(0, 500),
      p_path: e.path ? scrubErrorText(e.path) : null,
      p_stack: e.stack ? scrubErrorText(e.stack).slice(0, 4000) : null,
      p_account_id: accountId
    });
    if (error) console.warn('[Ops] record_app_error failed:', error.message);
  } catch (err) {
    console.warn('[Ops] record_app_error failed:', err);
  }
}

/** Marks that a background process ran now. Never throws. */
export async function recordHeartbeat(client: Client | null, key: string, detail: Record<string, unknown> = {}): Promise<void> {
  // A test run hitting the cron route must not make a dead production cron look healthy.
  if (!client || process.env.VERCEL_ENV !== 'production') return;
  try {
    const { error } = await client
      .from('ops_heartbeats')
      .upsert({ key, last_at: new Date().toISOString(), detail }, { onConflict: 'key' });
    if (error) console.warn('[Ops] heartbeat failed:', key, error.message);
  } catch (err) {
    console.warn('[Ops] heartbeat failed:', key, err);
  }
}

/** Records every /api response with a 5xx status, grouped by route pattern (ids never reach the message). */
export function apiErrorMonitor(getClient: () => Client | null): Middleware {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 500) return;
      // All /api routes are registered on the app with their full path, so req.route.path is the pattern.
      const route = typeof req.route?.path === 'string' ? req.route.path : pathOnly(req.originalUrl);
      void recordAppError(getClient(), {
        source: 'api',
        message: `${req.method} ${route} returned ${res.statusCode}`,
        path: route,
        accountId: req.teacherUser?.id || req.studentUser?.auth_id || null
      });
    });
    next();
  };
}

// Per instance, like the main limiter in api/index.ts: slows a flood; the fingerprint grouping keeps the table small anyway.
const CLIENT_ERROR_LIMIT = 10;
const CLIENT_ERROR_WINDOW_MS = 60_000;
const clientErrorHits = new Map<string, { count: number; resetAt: number }>();

export function clientErrorRateLimited(ip: string, now = Date.now()): boolean {
  if (clientErrorHits.size > 5000) {
    for (const [key, v] of clientErrorHits) if (now > v.resetAt) clientErrorHits.delete(key);
  }
  let hit = clientErrorHits.get(ip);
  if (!hit || now > hit.resetAt) hit = { count: 0, resetAt: now + CLIENT_ERROR_WINDOW_MS };
  hit.count++;
  clientErrorHits.set(ip, hit);
  return hit.count > CLIENT_ERROR_LIMIT;
}

function clientIp(req: any): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ageMs(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? now - t : null;
}

/** The reminder cron runs every 10 minutes (docs/production-reminder-scheduler.md). */
export function cronStatus(lastRunAt: string | null, now = Date.now()): HealthStatus {
  const age = ageMs(lastRunAt, now);
  if (age === null || age >= 2 * HOUR) return 'red';
  return age >= 30 * MINUTE ? 'amber' : 'green';
}

export function countStatus(count: number, amberAt: number, redAt: number): HealthStatus {
  if (count >= redAt) return 'red';
  return count >= amberAt ? 'amber' : 'green';
}

export function registerOpsRoutes(app: express.Express, deps: OpsDeps) {
  const { getClient, verifyTeacherAuth, requireSuperAdmin } = deps;

  // OPS-01: front-end errors. Public (errors happen before sign-in too), rate limited, no account data trusted from the body.
  app.post('/api/client-errors', async (req: any, res: any) => {
    if (clientErrorRateLimited(clientIp(req))) return res.status(429).json({ error: 'Too many reports.' });
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'message is required.' });
    await recordAppError(getClient(), {
      source: 'client',
      message,
      path: pathOnly(req.body?.path),
      stack: typeof req.body?.stack === 'string' ? req.body.stack : null
    });
    return res.status(204).end();
  });

  app.get('/api/dashboard/app-errors', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const { data, error } = await client
      .from('app_errors')
      .select('fingerprint, source, message, path, stack, occurrences, first_seen, last_seen')
      .order('last_seen', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: 'Failed to load errors.' });
    return res.json({ errors: data || [] });
  });

  app.delete('/api/dashboard/app-errors/:fingerprint', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const { error } = await client.from('app_errors').delete().eq('fingerprint', String(req.params.fingerprint));
    if (error) return res.status(500).json({ error: 'Failed to clear the error.' });
    return res.json({ success: true });
  });

  // OPS-02 / OPS-05: one row per check; the page holds the labels and the one-sentence fixes.
  app.get('/api/dashboard/health', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const now = Date.now();
    const since24h = new Date(now - DAY).toISOString();
    const since30d = new Date(now - 30 * DAY).toISOString();

    const [lastSent, failedEmails, openJobs, failedJobs, deadJobs, calendars, beats, errors24h] = await Promise.all([
      client.from('notification_events').select('updated_at').eq('status', 'sent').order('updated_at', { ascending: false }).limit(1),
      client.from('notification_events').select('idempotency_key', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', since24h),
      client.from('integration_jobs').select('created_at').in('status', ['pending', 'processing', 'failed']).order('created_at', { ascending: true }).limit(1),
      client.from('integration_jobs').select('id', { count: 'exact', head: true }).in('status', ['failed', 'dead_letter']).gte('updated_at', since24h),
      client.from('integration_jobs').select('last_error').eq('status', 'dead_letter').gte('updated_at', since30d).limit(200),
      client.from('calendar_connections').select('id', { count: 'exact', head: true }).eq('provider', 'google_calendar').eq('is_active', true),
      client.from('ops_heartbeats').select('key, last_at, detail'),
      client.from('app_errors').select('fingerprint', { count: 'exact', head: true }).gte('last_seen', since24h)
    ]);

    const beat = (key: string) => (beats.data || []).find((b: any) => b.key === key)?.last_at || null;
    const lastSentAt = lastSent.data?.[0]?.updated_at || null;
    const oldestOpenJobAt = openJobs.data?.[0]?.created_at || null;
    const oldestOpenAge = ageMs(oldestOpenJobAt, now);
    const lostTokens = (deadJobs.data || []).filter((j: any) => /invalid_grant|unauthorized|\(401\)/i.test(j.last_error || '')).length;
    const cronAt = beat(HEARTBEAT_REMINDER_CRON);
    const webhookAt = beat(HEARTBEAT_STRIPE_WEBHOOK);
    const webhookAge = ageMs(webhookAt, now);
    const lastSentAge = ageMs(lastSentAt, now);

    const checks = [
      { key: 'cron', status: cronStatus(cronAt, now), at: cronAt },
      { key: 'email_last_sent', status: lastSentAge !== null && lastSentAge < 7 * DAY ? 'green' : 'amber', at: lastSentAt },
      { key: 'email_failed_24h', status: countStatus(failedEmails.count || 0, 1, 5), count: failedEmails.count || 0 },
      {
        key: 'integration_jobs_pending',
        status: oldestOpenAge === null ? 'green' : oldestOpenAge >= 2 * HOUR ? 'red' : oldestOpenAge >= 30 * MINUTE ? 'amber' : 'green',
        at: oldestOpenJobAt
      },
      { key: 'zoom_calendar_failures_24h', status: countStatus(failedJobs.count || 0, 1, 3), count: failedJobs.count || 0 },
      {
        key: 'calendar_tokens',
        status: lostTokens > 0 ? 'red' : (calendars.count || 0) === 0 ? 'amber' : 'green',
        count: lostTokens,
        active: calendars.count || 0
      },
      { key: 'stripe_webhook', status: webhookAge !== null && webhookAge < 30 * DAY ? 'green' : 'amber', at: webhookAt },
      { key: 'app_errors_24h', status: countStatus(errors24h.count || 0, 1, 20), count: errors24h.count || 0 }
    ];

    return res.json({
      checkedAt: new Date(now).toISOString(),
      placementBeforeBooking: deps.placementBeforeBooking,
      checks
    });
  });
}
