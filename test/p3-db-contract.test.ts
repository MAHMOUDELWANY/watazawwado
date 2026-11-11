import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { anonClient, supabaseUrl } from '../scripts/qa/lib.js';
import { qa, skipReason, type Qa } from './helpers/qa.js';
import { DB_FUNCTIONS, PENDING_LOCKDOWN, PRIVATE_COLUMNS, PUBLIC_TABLES } from './helpers/dbContract.js';

/**
 * P3 (carry-over from P2-009 and P2-003): the code and the database agree, and the database refuses the browser.
 *  1. every function the source calls is in the list kept in test/helpers/dbContract.ts;
 *  2. every listed function really exists in the database (PostgREST's own description, read only);
 *  3. the anon key reads no private table and runs no server function;
 *  4. a signed-in family and a signed-in teacher, talking to the database directly with the key that ships in the
 *     browser bundle, see only their own rows and can change nothing that matters.
 */

function sourceRpcNames(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        for (const m of fs.readFileSync(full, 'utf8').matchAll(/\.rpc\(\s*['"`]([a-z_0-9]+)['"`]/g)) {
          found.set(m[1], [...(found.get(m[1]) || []), full.replace(/\\/g, '/')]);
        }
      }
    }
  };
  ['api', 'server', 'src'].forEach(walk);
  return found;
}

describe('P3 the code and the database agree', () => {
  it('every database function the source calls is in the list kept in test/', () => {
    const names = sourceRpcNames();
    assert.ok(names.size >= 20, `only ${names.size} rpc calls found`);
    const unknown = [...names].filter(([name]) => !DB_FUNCTIONS[name]).map(([name, files]) => `${name} (${files[0]})`);
    assert.deepStrictEqual(unknown, [], 'add the function to test/helpers/dbContract.ts after its migration is applied');
  });

  it('no call uses a function name the source builds at run time', () => {
    const dynamic: string[] = [];
    for (const dir of ['api', 'server']) {
      for (const file of fs.readdirSync(dir, { recursive: true }) as string[]) {
        if (!/\.ts$/.test(file)) continue;
        const src = fs.readFileSync(path.join(dir, file), 'utf8');
        for (const m of src.matchAll(/\.rpc\(\s*([^'"`\s)][^,)]*)/g)) dynamic.push(`${dir}/${file}: rpc(${m[1]})`);
      }
    }
    assert.deepStrictEqual(dynamic, []);
  });
});

describe('P3 the database itself (production, read with the keys the roles really have)', () => {
  let q: Qa, ids: Awaited<ReturnType<Qa['qaIds']>>, anon: SupabaseClient, family: SupabaseClient, teacher: SupabaseClient;
  let tables: string[] = [], exposedRpcs: string[] = [];
  /** The database as a signed-in browser sees it: the public key plus that account's session. */
  const as = (token: string) => createClient(supabaseUrl(), process.env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });

  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    ids = await q.qaIds();
    anon = anonClient();
    family = as(await q.tokenFor('student'));
    teacher = as(await q.tokenFor('teacher', 2));
    // PostgREST describes every table and function the service role can reach. Read only.
    const res = await fetch(`${supabaseUrl()}/rest/v1/`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } });
    const spec = await res.json() as { paths?: Record<string, unknown> };
    const paths = Object.keys(spec.paths || {});
    exposedRpcs = paths.filter(p => p.startsWith('/rpc/')).map(p => p.slice(5));
    tables = paths.filter(p => p !== '/' && !p.startsWith('/rpc/')).map(p => p.slice(1));
  });

  it('every listed function exists in the database', async (t) => {
    if (!q) return t.skip(skipReason);
    assert.ok(exposedRpcs.length >= 20, `the database described only ${exposedRpcs.length} functions`);
    const missing = Object.keys(DB_FUNCTIONS).filter(name => !exposedRpcs.includes(name));
    assert.deepStrictEqual(missing, [], 'in the list but not in the database (P2-009 was exactly this)');
  });

  it('the anon key reads nothing but public content', async (t) => {
    if (!q) return t.skip(skipReason);
    assert.ok(tables.length >= 60, `only ${tables.length} tables described`);
    const leaks: string[] = [];
    await Promise.all(tables.filter(name => !PUBLIC_TABLES.includes(name)).map(async (name) => {
      const { data } = await anon.from(name).select('*').limit(1);
      if (data && data.length) leaks.push(`${name}: ${Object.keys(data[0]).slice(0, 6).join(',')}`);
    }));
    assert.deepStrictEqual(leaks, []);
    // Public content is the active catalogue only, and it carries no account data.
    const { data: services } = await anon.from('services').select('*');
    assert.ok(services && services.length > 0 && services.every((s: any) => s.is_active === true), 'only active subjects');
  });

  it('the anon key and a signed-in family write nothing and run no server function', async (t) => {
    if (!q) return t.skip(skipReason);
    for (const [who, client] of [['anon', anon], ['family', family]] as const) {
      const allowed: string[] = [];
      for (const [name, fn] of Object.entries(DB_FUNCTIONS)) {
        if (fn.browser || PENDING_LOCKDOWN.includes(name)) continue;
        const { error } = await client.rpc(name, fn.args());
        // 42501 = permission denied; PGRST202 = not visible to this role at all. Anything else means it ran.
        if (!error || !['42501', 'PGRST202', 'PGRST301', 'PGRST302'].includes(error.code)) allowed.push(`${who} ran ${name}: ${error ? `${error.code} ${error.message}` : 'ok'}`);
      }
      assert.deepStrictEqual(allowed, []);
      const row = { student_id: ids.student.id, teacher_id: ids.teacher1, service_id: 'quran-reading', booking_type: 'regular', duration_minutes: 30, scheduled_start: '2031-01-01T10:00:00Z', scheduled_end: '2031-01-01T10:30:00Z', status: 'confirmed', reference_code: 'MHM-P3HACK', contact_name: 'x', contact_email: 'x@example.com' };
      assert.ok((await client.from('bookings').insert(row)).error, `${who} inserted a confirmed lesson`);
      assert.ok((await client.from('payments').insert({ booking_id: ids.student.id, amount: 1, currency: 'USD', payment_method: 'other', status: 'confirmed' })).error, `${who} inserted a payment`);
      assert.ok((await client.from('account_credit_ledger').insert({ account_user_id: ids.student.authId, amount_usd: 500, reason: 'admin_adjust' })).error, `${who} gave itself credit`);
      assert.ok((await client.from('teacher_accounts').insert({ email: 'x@example.com', role: 'super_admin', is_active: true })).error, `${who} made itself an admin`);
    }
    const { count } = await q.db.from('bookings').select('id', { count: 'exact', head: true }).eq('reference_code', 'MHM-P3HACK');
    assert.strictEqual(count, 0);
  });

  it('a signed-in family sees only its own rows, straight from the database', async (t) => {
    if (!q) return t.skip(skipReason);
    const others = new RegExp(`${ids.parent.id}|${ids.parent.authId}|${ids.kid}|${ids.teen}|qa-${q.QA_PROJECT}-(parent|teacher|admin)`, 'i');
    const leaks: string[] = [];
    let seen = 0;
    await Promise.all(tables.map(async (name) => {
      const { data } = await family.from(name).select('*').limit(500);
      if (!data) return;
      seen += data.length;
      const text = JSON.stringify(data);
      if (others.test(text)) leaks.push(`${name}: ${text.match(others)?.[0]}`);
      if (name === 'students' && data.some((r: any) => r.auth_user_id !== ids.student.authId)) leaks.push('students: a row of another account');
      if (name === 'bookings' && data.some((r: any) => r.student_id !== ids.student.id)) leaks.push('bookings: a lesson of another learner');
      if (['payments', 'teacher_accounts', 'discount_codes', 'leads', 'crm_notes', 'settings', 'teacher_pay_rates', 'teacher_payouts', 'user_notifications', 'chat_messages'].includes(name) && data.length) leaks.push(`${name}: ${data.length} rows`);
    }));
    assert.deepStrictEqual(leaks, []);
    assert.ok(seen > 0, 'the session is real: it read its own profile');
  });

  it('a signed-in family cannot change what the academy decides', async (t) => {
    if (!q) return t.skip(skipReason);
    const mine = () => q.db.from('students').select('*').eq('id', ids.student.id).single();
    const before = (await mine()).data!;
    const tries: Record<string, unknown>[] = [
      { assigned_teacher_id: ids.teacher2 }, { age: 5 }, { current_level: 'advanced' }, { email: 'taken@example.com' }, { auth_user_id: ids.parent.authId },
      { status: 'vip' }, { learner_type: 'child' }, { onboarding_completed: false }, { level_set_by: 'teacher' }, { notes: 'free lessons approved' },
    ];
    for (const patch of tries) await family.from('students').update(patch).eq('id', ids.student.id);
    // Another family's row, and a lesson: not even the columns a family may edit on its own row.
    await family.from('students').update({ name: 'Hacked' }).eq('id', ids.kid);
    await family.from('bookings').update({ status: 'confirmed', fee_amount_usd: 0 }).eq('student_id', ids.student.id);
    await family.from('bookings').delete().eq('student_id', ids.student.id);
    await family.from('package_entitlements').update({ remaining_credits: 99, status: 'active' }).eq('purchaser_account_id', ids.student.authId);
    assert.deepStrictEqual((await mine()).data, before, 'my own row is as it was');
    assert.strictEqual((await q.db.from('students').select('name').eq('id', ids.kid).single()).data?.name, `QA Kid ${q.TAG}`);
  });

  it('a signed-in teacher sees their own learners only, and no money, straight from the database', async (t) => {
    if (!q) return t.skip(skipReason);
    const { data: students } = await teacher.from('students').select('id, assigned_teacher_id');
    assert.ok((students || []).every((s: any) => s.assigned_teacher_id === ids.teacher2), 'only the learners assigned to this teacher');
    for (const table of ['payments', 'package_entitlements', 'account_credit_ledger', 'discount_codes', 'discount_redemptions', 'teacher_pay_rates', 'teacher_payouts', 'teacher_accounts', 'leads', 'settings']) {
      const { data } = await teacher.from(table).select('*').limit(1);
      assert.ok(!data || data.length === 0, `a teacher read ${table}`);
    }
    for (const column of ['fee_amount_usd', 'management_token_hash', 'management_token']) {
      assert.ok((await teacher.from('bookings').select(column).limit(1)).error, `a teacher may not select bookings.${column}`);
    }
    const { data: lessons } = await teacher.from('bookings').select('id, teacher_id').limit(500);
    assert.ok((lessons || []).every((b: any) => b.teacher_id === ids.teacher2), 'only this teacher\'s lessons');
    assert.ok((await teacher.from('students').update({ assigned_teacher_id: ids.teacher2 }).eq('id', ids.student.id).select('id')).data?.length !== 1, 'a teacher cannot take a learner');
  });

  // Migration 20261111000001 (applied 2026-11-11) made the intake and offer tables API only.
  it('P3-012: internal notes and pricing notes are not readable from the browser', async (t) => {
    if (!q) return t.skip(skipReason);
    const readable: string[] = [];
    for (const [table, column] of PRIVATE_COLUMNS) {
      const { error } = await family.from(table).select(column).limit(1);
      if (!error) readable.push(`${table}.${column}`);
    }
    for (const column of ['payment_plan', 'hold_expires_at']) {
      if (!(await teacher.from('bookings').select(column).limit(1)).error) readable.push(`teacher: bookings.${column}`);
    }
    assert.deepStrictEqual(readable, []);
  });
});
