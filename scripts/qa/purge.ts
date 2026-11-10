/**
 * Deletes QA accounts (email contains `+qa-`) and every row that references them. Dry-run by default.
 * Usage: npx tsx scripts/qa/purge.ts <p1..p9|all> [--yes]
 *
 * Built from the live foreign keys (2026-11-10): rows that CASCADE from students / bookings / auth.users / profiles
 * go with their parent; the rest (RESTRICT, SET NULL or no foreign key at all) are listed explicitly below, in an
 * order that never trips a RESTRICT. Never touches an account whose email lacks `+qa-`.
 * Not covered: events already created in an outside service (Google Calendar, Zoom, Stripe, Brevo).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, assertProject, isMain, isQaEmail, listAllUsers } from './lib.js';

type Ids = Record<string, string[]>;
type Step = { table: string; by: Ids; emailCols?: string[]; nameFilter?: string[]; action?: 'delete' | { set: Record<string, null> } };

const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];

async function selectCol(db: SupabaseClient, table: string, col: string, build: (q: any) => any): Promise<any[]> {
  const { data, error } = await build(db.from(table).select(col));
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

function orFilter(by: Ids, emailCols: string[] = [], pattern: string): string | null {
  const parts = Object.entries(by).filter(([, ids]) => ids.length).map(([col, ids]) => `${col}.in.(${ids.join(',')})`);
  for (const col of emailCols) parts.push(`${col}.ilike.*${pattern}*`);
  return parts.length ? parts.join(',') : null;
}

export async function purge(project: string, apply: boolean, log: (s: string) => void = console.log) {
  const db = adminClient();
  const pattern = project === 'all' ? '+qa-' : `+qa-${project}-`;
  const matches = (email: string | null | undefined) => isQaEmail(email) && String(email).toLowerCase().includes(pattern);

  const users = (await listAllUsers(db)).filter(u => matches(u.email));
  const U = users.map(u => u.id);
  const emails = users.map(u => String(u.email).toLowerCase());

  // Learners: own rows plus children whose every guardian is a QA account of this scope.
  const own = await selectCol(db, 'students', 'id, email, auth_user_id', q => q.or(orFilter({ auth_user_id: U }, ['email'], pattern)!));
  const guardianRows = await selectCol(db, 'guardians', 'student_id, parent_email', q => q.ilike('parent_email', `%${pattern}%`));
  const childIds = uniq(guardianRows.map(g => g.student_id));
  const allGuardians = childIds.length ? await selectCol(db, 'guardians', 'student_id, parent_email', q => q.in('student_id', childIds)) : [];
  const children = childIds.length ? await selectCol(db, 'students', 'id, auth_user_id', q => q.in('id', childIds)) : [];
  const safeChildren = children.filter(c =>
    allGuardians.filter(g => g.student_id === c.id).every(g => matches(g.parent_email)) && (!c.auth_user_id || U.includes(c.auth_user_id)));
  const S = uniq([...own.filter(s => !s.auth_user_id || U.includes(s.auth_user_id)).map(s => s.id), ...safeChildren.map(c => c.id)]);

  const B = uniq((await selectCol(db, 'bookings', 'id', q => q.or(orFilter({ student_id: S, teacher_id: U }, ['contact_email'], pattern)!))).map(r => r.id));
  const ent = orFilter({ purchaser_account_id: U, learner_student_id: S }, [], pattern);
  const En = ent ? uniq((await selectCol(db, 'package_entitlements', 'id', q => q.or(ent))).map(r => r.id)) : [];
  const teachers = await selectCol(db, 'teacher_accounts', 'email, id_card_path, photo_url', q => q.ilike('email', `%${pattern}%`));
  const teacherEmails = teachers.map(t => String(t.email)).filter(matches);

  log(`Scope ${pattern}: ${users.length} auth users, ${S.length} learners, ${teacherEmails.length} staff rows, ${B.length} bookings, ${En.length} packages.`);
  for (const e of emails) log(`  - ${e}`);

  // Files in storage that belong to these rows.
  const files: Record<string, string[]> = { recitations: [], 'honor-photos': [], 'teacher-documents': [], 'teacher-photos': [] };
  if (S.length) {
    files.recitations = uniq((await selectCol(db, 'recitation_recordings', 'storage_path', q => q.in('student_id', S))).map(r => r.storage_path));
    files['honor-photos'] = uniq((await selectCol(db, 'honor_entries', 'photo_path', q => q.in('student_id', S))).map(r => r.photo_path));
  }
  files['teacher-documents'] = uniq(teachers.map(t => t.id_card_path));
  files['teacher-photos'] = uniq(teachers.map(t => String(t.photo_url || '').split('/teacher-photos/')[1]?.split('?')[0]));

  const steps: Step[] = [
    { table: 'payments', by: { booking_id: B, student_id: S, entitlement_id: En } },
    { table: 'package_credit_ledger', by: { booking_id: B, learner_student_id: S, package_entitlement_id: En } },
    { table: 'referrals', by: { referrer_user_id: U, referred_user_id: U, qualifying_booking_id: B } },
    { table: 'account_credit_ledger', by: { account_user_id: U } },
    { table: 'discount_redemptions', by: { account_user_id: U } },
    { table: 'referral_codes', by: { owner_user_id: U } },
    { table: 'sponsorship_grants', by: { entitlement_id: En, account_user_id: U, learner_student_id: S } },
    { table: 'sponsorship_donations', by: { donor_user_id: U }, emailCols: ['donor_email'] },
    { table: 'bookings', by: { id: B } },
    { table: 'package_entitlements', by: { id: En } },
    { table: 'chat_messages', by: { sender_user_id: U } },
    { table: 'chat_threads', by: { owner_user_id: U, teacher_id: U } },
    { table: 'user_notifications', by: { recipient_user_id: U } },
    { table: 'teacher_change_requests', by: { student_id: S, account_user_id: U, initiator_user_id: U, from_teacher_id: U, to_teacher_id: U, preferred_teacher_id: U } },
    { table: 'booking_teacher_moves', by: { from_teacher_id: U, to_teacher_id: U, moved_by: U } },
    { table: 'crm_notes', by: { account_student_id: S, child_student_id: S, author_id: U } },
    { table: 'crm_tags', by: { account_student_id: S, created_by: U } },
    { table: 'crm_tasks', by: { account_student_id: S, created_by: U } },
    { table: 'placement_tests', by: { auth_user_id: U, learner_student_id: S } },
    { table: 'homework_sets', by: { student_id: S, teacher_id: U } },
    { table: 'family_achievements', by: { account_user_id: U, nominated_by: U } },
    { table: 'honor_entries', by: { student_id: S, nominated_by: U } },
    { table: 'app_errors', by: { last_account_id: U }, action: { set: { last_account_id: null } } },
    { table: 'leads', by: {}, emailCols: ['email'] },
    { table: 'waitlist_entries', by: {}, emailCols: ['email'] },
    { table: 'guardians', by: { student_id: S }, emailCols: ['parent_email'] },
    { table: 'students', by: { id: S } },
    { table: 'teacher_accounts', by: {}, emailCols: ['email'] },
  ];

  // In-app notices sent to real staff about QA people ("A new student chose you"): QA names all start with "QA ".
  const names = uniq([
    ...(S.length ? await selectCol(db, 'students', 'name', q => q.in('id', S)) : []).map(r => r.name),
    ...(await selectCol(db, 'teacher_accounts', 'display_name', q => q.ilike('email', `%${pattern}%`))).map(r => r.display_name),
  ]).filter(n => /^QA /.test(n) && !/[,()*]/.test(n));
  if (names.length) steps.unshift({ table: 'user_notifications', by: {}, nameFilter: names });

  let total = 0;
  for (const step of steps) {
    const f = step.nameFilter ? step.nameFilter.map(n => `body_en.ilike."*${n}*"`).join(',') : orFilter(step.by, step.emailCols, pattern);
    if (!f) continue;
    const { count, error } = await db.from(step.table).select('*', { count: 'exact', head: true }).or(f);
    if (error) throw new Error(`${step.table}: ${error.message}`);
    if (!count) continue;
    total += count;
    const verb = step.action && step.action !== 'delete' ? 'clear' : 'delete';
    log(`${apply ? (verb === 'clear' ? 'cleared' : 'deleted') : `would ${verb}`} ${count} ${step.table}`);
    if (!apply) continue;
    const q = step.action && step.action !== 'delete' ? db.from(step.table).update(step.action.set) : db.from(step.table).delete();
    const { error: delErr } = await (q as any).or(f);
    if (delErr) throw new Error(`${step.table}: ${delErr.message}`);
  }

  for (const [bucket, paths] of Object.entries(files)) {
    if (!paths.length) continue;
    log(`${apply ? 'removed' : 'would remove'} ${paths.length} file(s) from storage/${bucket}`);
    if (apply) {
      const { error } = await db.storage.from(bucket).remove(paths);
      if (error) log(`  storage/${bucket}: ${error.message}`);
    }
  }

  // Last: the auth users (profiles, availability, preferences, calendar links... cascade from here).
  for (const u of users) {
    if (!isQaEmail(u.email)) throw new Error(`Safety stop: ${u.email} is not a QA account.`);
    log(`${apply ? 'deleted' : 'would delete'} auth user ${u.email}`);
    if (apply) {
      const { error } = await db.auth.admin.deleteUser(u.id);
      if (error) throw new Error(`auth user ${u.email}: ${error.message}`);
    }
  }
  if (!apply) log(`Dry run: ${total} rows and ${users.length} users. Add --yes to delete.`);
  return { users: users.length, rows: total };
}

/** Rows still matching after a purge, per table (empty object = clean). */
export async function remaining(project: string): Promise<Record<string, number>> {
  const db = adminClient();
  const pattern = project === 'all' ? '+qa-' : `+qa-${project}-`;
  const out: Record<string, number> = {};
  const users = (await listAllUsers(db)).filter(u => isQaEmail(u.email) && String(u.email).toLowerCase().includes(pattern));
  if (users.length) out['auth.users'] = users.length;
  for (const [table, col] of [['students', 'email'], ['guardians', 'parent_email'], ['teacher_accounts', 'email'], ['profiles', 'email'],
    ['leads', 'email'], ['bookings', 'contact_email'], ['user_language_preferences', 'email'], ['waitlist_entries', 'email']] as const) {
    const { count, error } = await db.from(table).select('*', { count: 'exact', head: true }).ilike(col, `%${pattern}%`);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (count) out[table] = count;
  }
  if (project !== 'all') return out;
  const { count: kids } = await db.from('students').select('*', { count: 'exact', head: true }).like('name', 'QA %');
  if (kids) out['students named "QA ..."'] = kids;
  return out;
}

if (isMain(import.meta.url)) {
  const project = assertProject(process.argv[2], true);
  const apply = process.argv.includes('--yes');
  purge(project, apply)
    .then(async () => {
      if (!apply) return;
      const left = await remaining(project);
      console.log(Object.keys(left).length ? `Left behind: ${JSON.stringify(left)}` : 'Clean: no QA rows left.');
    })
    .catch(err => { console.error(err.message); process.exit(1); });
}
