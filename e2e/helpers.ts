/**
 * API + database helpers for the workflow specs (docs/testing/projects/P2-e2e-workflows.md).
 * Everything acts as the project's own QA accounts; the database is read with the service role only to check results.
 */
import { adminClient, baseUrl, listAllUsers, mintSession, qaEmail, type QaRole } from '../scripts/qa/lib.js';

export const QA_PROJECT = process.env.QA_PROJECT || 'p1';
export const BASE = baseUrl(QA_PROJECT);
export const TAG = QA_PROJECT.toUpperCase();
export const db = adminClient();

const tokens = new Map<string, { token: string; at: number }>();
/** A fresh access token for a QA account (cached 30 minutes per worker). */
export async function tokenFor(role: QaRole, n = 1): Promise<string> {
  const email = qaEmail(QA_PROJECT, role, n);
  const hit = tokens.get(email);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.token;
  const token = (await mintSession(email)).access_token;
  tokens.set(email, { token, at: Date.now() });
  return token;
}

let ipSeq = 0;
/**
 * One API call. Each call comes from its own made-up client address, because the server's limiter (10 a minute per
 * address and route) would otherwise stop a spec that books more than ten times. Pass `ip` to test the limiter itself.
 */
export async function call(token: string | null, method: string, route: string, body?: unknown, ip?: string) {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json',
      'x-real-ip': ip || `10.${process.pid % 250}.${Math.floor(++ipSeq / 250) % 250}.${ipSeq % 250}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json, text };
}

export type QaIds = {
  student: { authId: string; id: string }; parent: { authId: string; id: string };
  kid: string; teen: string; teacher1: string; teacher2: string; admin: string;
};
let ids: QaIds | null = null;
/** Row ids of the QA accounts made by scripts/qa/create-accounts.ts. */
export async function qaIds(): Promise<QaIds> {
  if (ids) return ids;
  const users = await listAllUsers(db);
  const auth = (role: QaRole, n = 1) => {
    const id = users.find(u => u.email?.toLowerCase() === qaEmail(QA_PROJECT, role, n))?.id;
    if (!id) throw new Error(`No QA ${role}-${n}. Run: npx tsx scripts/qa/create-accounts.ts ${QA_PROJECT}`);
    return id as string;
  };
  const row = async (authId: string) => (await db.from('students').select('id').eq('auth_user_id', authId).single()).data!.id as string;
  const child = async (name: string) => (await db.from('students').select('id').eq('name', name).single()).data!.id as string;
  ids = {
    student: { authId: auth('student'), id: await row(auth('student')) },
    parent: { authId: auth('parent'), id: await row(auth('parent')) },
    kid: await child(`QA Kid ${TAG}`), teen: await child(`QA Teen ${TAG}`),
    teacher1: auth('teacher', 1), teacher2: auth('teacher', 2), admin: auth('admin'),
  };
  return ids;
}

export type Slot = { utcStartIso: string; date: string; time24: string };
/** Free slots of a teacher from the real availability endpoint, soonest first, starting `fromDay` days ahead. */
export async function freeSlots(teacherId: string, opts: { timezone?: string; duration?: number; fromDay?: number; days?: number } = {}): Promise<Slot[]> {
  const tz = opts.timezone || 'Europe/London';
  const r = await call(null, 'GET', `/api/integrations/availability?timezone=${encodeURIComponent(tz)}&days=${opts.days || 21}&duration=${opts.duration || 30}&teacherId=${teacherId}`);
  if (!r.ok) throw new Error(`availability ${r.status}`);
  const out: Slot[] = [];
  for (const day of (r.json.days || []).slice(opts.fromDay ?? 2)) {
    for (const s of day.slots || day.timeSlots || []) {
      if (s.available === false || s.isAvailable === false) continue;
      out.push({ utcStartIso: s.utcStartIso || s.utcStart || s.startUtc, date: day.dateString || day.date, time24: s.time24 || s.time });
    }
  }
  return out;
}

/** The body the booking page sends, for a learner of the QA student or parent. */
export function bookingBody(slot: Slot, over: Record<string, unknown> = {}) {
  return {
    serviceId: 'quran-reading', duration: 30, date: slot.date, timeSlot: { utcStartIso: slot.utcStartIso, time24: slot.time24 },
    timezone: 'Europe/London', contactName: `QA Student ${TAG}`, contactEmail: qaEmail(QA_PROJECT, 'student'), audience: 'adult',
    mode: 'trial', acceptedTerms: true, acceptedEarlyStart: true, ...over,
  };
}

/** Removes every booking, payment, package and credit of this project's QA learners; the accounts stay. */
export async function resetLearnerData(): Promise<void> {
  const q = await qaIds();
  const S = [q.student.id, q.parent.id, q.kid, q.teen];
  const U = [q.student.authId, q.parent.authId];
  const B = ((await db.from('bookings').select('id').or(`student_id.in.(${S.join(',')}),contact_email.ilike.*+qa-${QA_PROJECT}-*`)).data || []).map(r => r.id);
  const En = ((await db.from('package_entitlements').select('id').or(`purchaser_account_id.in.(${U.join(',')}),learner_student_id.in.(${S.join(',')})`)).data || []).map(r => r.id);
  const del = async (table: string, col: string, vals: string[]) => {
    if (!vals.length) return;
    const { error } = await db.from(table).delete().in(col, vals);
    if (error) throw new Error(`reset ${table}.${col}: ${error.message}`);
  };
  await del('payments', 'booking_id', B); await del('payments', 'entitlement_id', En); await del('payments', 'student_id', S);
  await del('package_credit_ledger', 'booking_id', B); await del('package_credit_ledger', 'package_entitlement_id', En);
  await del('account_credit_ledger', 'account_user_id', U); await del('discount_redemptions', 'account_user_id', U);
  await del('bookings', 'id', B); await del('package_entitlements', 'id', En);
}

export const booking = async (id: string) => (await db.from('bookings').select('*').eq('id', id).single()).data as any;
