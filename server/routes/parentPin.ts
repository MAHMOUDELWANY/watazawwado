import crypto from 'node:crypto';
import express from 'express';
import { roomSecret } from './lessonRoom.js';
import { isUuid } from './progress.js';

/**
 * BUILD-LIST 1.6: a parent's 4-digit PIN. A child using the parent's signed-in device cannot open parent-only things
 * (watching a lesson) without it. The PIN is stored as a salted scrypt hash; 5 wrong tries lock it for 15 minutes.
 * A right PIN gives a short-lived signed proof that the observer enter asks for. Child phones (kid tokens) never
 * reach these routes (not in CHILD_ROUTES).
 */
type Middleware = (req: any, res: any, next: any) => any;

export const PIN_MAX_FAILS = 5;
export const PIN_LOCK_MS = 15 * 60_000;
export const PIN_PROOF_MS = 10 * 60_000;
const PIN = /^\d{4}$/;

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(pin, salt, 32).toString('hex')}`;
}

export function pinMatches(pin: string, stored: string): boolean {
  const [kind, salt, hash] = String(stored).split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const want = Buffer.from(hash, 'hex');
  const got = crypto.scryptSync(pin, Buffer.from(salt, 'hex'), want.length || 32);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

// The room secret, with its own label so a proof can never pass as a room ticket or the other way round.
const mac = (body: string, secret: string) => crypto.createHmac('sha256', `parent-pin:${secret}`).update(body).digest('base64url');

export function signParentProof(userId: string, secret: string, now: number): string {
  const body = Buffer.from(JSON.stringify({ u: userId, exp: now + PIN_PROOF_MS })).toString('base64url');
  return `${body}.${mac(body, secret)}`;
}

export function verifyParentProof(token: unknown, userId: string, secret: string, now: number): boolean {
  if (typeof token !== 'string' || !secret) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const want = Buffer.from(mac(body, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return false;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p?.u === userId && typeof p.exp === 'number' && p.exp > now;
  } catch {
    return false;
  }
}

export function registerParentPinRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
  secret?: () => string;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const secret = deps.secret ?? roomSecret;
  const iso = () => new Date(now()).toISOString();
  const ownerOf = (req: any) => (!req.childDevice && isUuid(req.studentUser?.auth_id) ? req.studentUser.auth_id as string : null);
  const load = async (client: any, owner: string) => {
    const { data, error } = await client.from('parent_pins').select('pin_hash, failed_count, locked_until').eq('user_id', owner).maybeSingle();
    if (error) throw new Error(`parent_pins: ${error.message}`);
    return data as { pin_hash: string; failed_count: number; locked_until: string | null } | null;
  };
  const lockedUntil = (row: { locked_until: string | null } | null) => (row?.locked_until && Date.parse(row.locked_until) > now() ? row.locked_until : null);

  /** Checks a PIN against the stored one and counts the try. Sends the refusal and returns false when it is wrong. */
  const check = async (client: any, owner: string, row: { pin_hash: string; failed_count: number; locked_until: string | null }, pin: unknown, res: any) => {
    const until = lockedUntil(row);
    if (until) { res.status(423).json({ error: 'Too many wrong tries. Please wait and try again.', lockedUntil: until }); return false; }
    if (typeof pin === 'string' && PIN.test(pin) && pinMatches(pin, row.pin_hash)) {
      if (row.failed_count || row.locked_until) {
        const { error } = await client.from('parent_pins').update({ failed_count: 0, locked_until: null, updated_at: iso() }).eq('user_id', owner);
        if (error) throw new Error(`parent_pins: ${error.message}`);
      }
      return true;
    }
    // shortcut: read-then-write, so tries sent at the same moment may count once; the per-IP route limit caps them.
    // Upgrade to an atomic increment RPC if this ever guards more than parent pages.
    const fails = (row.failed_count || 0) + 1;
    const lock = fails >= PIN_MAX_FAILS;
    const { error } = await client.from('parent_pins')
      .update({ failed_count: lock ? 0 : fails, locked_until: lock ? new Date(now() + PIN_LOCK_MS).toISOString() : null, updated_at: iso() })
      .eq('user_id', owner);
    if (error) throw new Error(`parent_pins: ${error.message}`);
    if (lock) res.status(423).json({ error: 'Too many wrong tries. Please wait and try again.', lockedUntil: new Date(now() + PIN_LOCK_MS).toISOString() });
    else res.status(401).json({ error: 'That PIN is not right.', attemptsLeft: PIN_MAX_FAILS - fails });
    return false;
  };

  const guard = (handler: (req: any, res: any, client: any, owner: string) => Promise<any>) => async (req: any, res: any) => {
    try {
      const owner = ownerOf(req);
      if (!owner) return res.status(403).json({ error: 'Only the parent account can do this.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      return await handler(req, res, client, owner);
    } catch (err) {
      console.error('[parent-pin]', err);
      return res.status(500).json({ error: 'Could not check the PIN right now.' });
    }
  };

  app.get('/api/student/parent-pin', deps.verifyStudentAuth, guard(async (_req, res, client, owner) => {
    const row = await load(client, owner);
    return res.json({ hasPin: !!row, lockedUntil: lockedUntil(row) });
  }));

  // Set the PIN the first time, or change it (the current PIN is checked and counted like a verify).
  app.put('/api/student/parent-pin', deps.rateLimit, deps.verifyStudentAuth, guard(async (req, res, client, owner) => {
    const pin = req.body?.pin;
    if (typeof pin !== 'string' || !PIN.test(pin)) return res.status(400).json({ error: 'The PIN must be 4 digits.' });
    const row = await load(client, owner);
    if (row && !(await check(client, owner, row, req.body?.currentPin, res))) return;
    const { error } = await client.from('parent_pins').upsert(
      { user_id: owner, pin_hash: hashPin(pin), failed_count: 0, locked_until: null, updated_at: iso() },
      { onConflict: 'user_id' },
    );
    if (error) throw new Error(`parent_pins: ${error.message}`);
    return res.json({ ok: true, proof: signParentProof(owner, secret(), now()) });
  }));

  app.post('/api/student/parent-pin/verify', deps.rateLimit, deps.verifyStudentAuth, guard(async (req, res, client, owner) => {
    const row = await load(client, owner);
    if (!row) return res.status(404).json({ error: 'Set a parent PIN first.', needsSetup: true });
    if (!(await check(client, owner, row, req.body?.pin, res))) return;
    return res.json({ proof: signParentProof(owner, secret(), now()) });
  }));
}
