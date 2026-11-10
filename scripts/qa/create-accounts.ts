/**
 * Creates (or tops up) the QA accounts of one testing project, through the app's own API wherever the app has one.
 * Usage: npx tsx scripts/qa/create-accounts.ts <p1..p9>   (needs the project's local server, e.g. qa-p1 on :3001)
 *
 * Per project:
 *   admin-1    super_admin "QA Admin"        bootstrap row in teacher_accounts (the app has no API for the first admin)
 *   teacher-1  male teacher "QA Ustadh"      POST /api/dashboard/admin/teachers as the QA admin, licensed for every
 *   teacher-2  female teacher "QA Ustadha"   subject, agreement accepted, availability set, all through the API
 *   student-1  adult learner (30)            sign-up trigger + POST /api/student/onboarding, teacher-1
 *   parent-1   family account (guardian 40)  same onboarding with a kid (8, girl, teacher-2) and a teen (14, boy, teacher-1)
 * Idempotent: an existing account is reused and finished steps are skipped.
 */
import { adminClient, api, assertProject, baseUrl, findUserByEmail, isMain, mintSession, qaEmail } from './lib.js';

const SUBJECTS = ['quran-reading', 'tajweed', 'quran-memorization', 'zad-essentials', 'seerah', 'modern-standard-arabic', 'egyptian-arabic', 'english'];
const AGREEMENT_VERSION = '2026-10-28.1'; // api/index.ts TEACHER_AGREEMENT_VERSION
// Wide hours in the teacher's own zone (RULES.md §1) so every learner zone finds slots.
const SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, start_time: '06:00', end_time: '23:00', is_active: true }));

export type QaAccount = { role: string; email: string; userId: string; name: string };

async function ensureUser(email: string, fullName: string) {
  const db = adminClient();
  const existing = await findUserByEmail(db, email);
  if (existing) {
    if (!existing.email_confirmed_at) await db.auth.admin.updateUserById(existing.id, { email_confirm: true });
    return existing;
  }
  // Random password nobody types; sign-in is always a minted session (scripts/qa/session.ts).
  const { data, error } = await db.auth.admin.createUser({
    email, email_confirm: true, password: `Qa!${crypto.randomUUID()}`.replace(/[a-f]/, c => c.toUpperCase()), user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  return data.user;
}

function must(step: string, r: { status: number; ok: boolean; json: any }) {
  if (!r.ok) throw new Error(`${step} failed (${r.status}): ${JSON.stringify(r.json).slice(0, 300)}`);
  return r.json;
}

export async function createAccounts(project: string, log: (s: string) => void = console.log): Promise<QaAccount[]> {
  const db = adminClient();
  const base = baseUrl(project);
  const health = await fetch(`${base}/api/health`).catch(() => null);
  if (!health?.ok) throw new Error(`No server at ${base}. Start the qa-${project} launch entry first (docs/testing/RULES.md).`);
  const tag = project.toUpperCase();
  const accounts: QaAccount[] = [];

  // 1. Super admin. The only direct write: the app cannot create its first admin through its own API.
  const adminEmail = qaEmail(project, 'admin');
  const { error: adminRowErr } = await db.from('teacher_accounts').upsert(
    { email: adminEmail, role: 'super_admin', is_active: true, display_name: `QA Admin ${tag}`, gender: 'male', updated_at: new Date().toISOString() },
    { onConflict: 'email' });
  if (adminRowErr) throw new Error(`admin row: ${adminRowErr.message}`);
  const adminUser = await ensureUser(adminEmail, `QA Admin ${tag}`);
  const adminToken = (await mintSession(adminEmail)).access_token;
  accounts.push({ role: 'super_admin', email: adminEmail, userId: adminUser.id, name: `QA Admin ${tag}` });
  log(`admin    ${adminEmail}`);

  // 2. Teachers, added by the admin like the real "Add teacher" form (the row exists before the auth user,
  //    so the sign-up trigger does not make them a learner).
  const teacherIds: Record<'male' | 'female', string> = { male: '', female: '' };
  for (const [n, gender, name, nameAr] of [[1, 'male', `QA Ustadh ${tag}`, `أ. اختبار ${tag}`], [2, 'female', `QA Ustadha ${tag}`, `أ. اختبارة ${tag}`]] as const) {
    const email = qaEmail(project, 'teacher', n);
    must('add teacher', await api(base, adminToken, 'POST', '/api/dashboard/admin/teachers', { email, role: 'teacher', display_name: name, gender }));
    await db.from('teacher_accounts').update({ display_name_ar: nameAr }).eq('email', email); // no API field for it yet
    const user = await ensureUser(email, name);
    teacherIds[gender] = user.id;
    for (const subject of SUBJECTS) {
      must(`license ${subject}`, await api(base, adminToken, 'POST', `/api/dashboard/admin/university/${encodeURIComponent(email)}/${subject}`, { action: 'license' }));
    }
    const token = (await mintSession(email)).access_token;
    must('accept agreement', await api(base, token, 'POST', '/api/dashboard/agreement/accept', { version: AGREEMENT_VERSION, accepted: true }));
    must('availability', await api(base, token, 'PUT', '/api/dashboard/availability', { schedule: SCHEDULE, timezone: 'Africa/Cairo' }));
    accounts.push({ role: `teacher (${gender})`, email, userId: user.id, name });
    log(`teacher  ${email}`);
  }

  // 3. Learners: the sign-up trigger makes the students row, onboarding fills it like the real form.
  const onboard = async (email: string, fullName: string, body: Record<string, unknown>) => {
    const user = await ensureUser(email, fullName);
    const token = (await mintSession(email)).access_token;
    const { data: row } = await db.from('students').select('onboarding_completed').eq('auth_user_id', user.id).maybeSingle();
    if (!row?.onboarding_completed) must(`onboarding ${email}`, await api(base, token, 'POST', '/api/student/onboarding', body));
    return user;
  };

  const studentEmail = qaEmail(project, 'student');
  const student = await onboard(studentEmail, `QA Student ${tag}`, {
    name: `QA Student ${tag}`, learnerType: 'adult', age: 30, gender: 'male', country: 'United Kingdom', timezone: 'Europe/London',
    learningInterest: 'quran-reading', currentLevel: 'beginner', learningGoal: 'QA: read fluently', teacherId: teacherIds.male,
    teacherGenderPreference: 'male_teacher', whatsapp: '+447700900001', heardAbout: 'friend_family',
  });
  accounts.push({ role: 'student (adult)', email: studentEmail, userId: student.id, name: `QA Student ${tag}` });
  log(`student  ${studentEmail}`);

  const parentEmail = qaEmail(project, 'parent');
  const parent = await onboard(parentEmail, `QA Parent ${tag}`, {
    name: `QA Parent ${tag}`, parentName: `QA Parent ${tag}`, learnerType: 'child', guardianAge: 40, gender: 'female',
    country: 'United States', timezone: 'America/New_York', parentWhatsapp: '+12025550101', heardAbout: 'search',
    children: [
      { name: `QA Kid ${tag}`, age: 8, gender: 'female', learningInterest: 'quran-reading', currentLevel: 'beginner', teacherId: teacherIds.female, teacherGenderPreference: 'female_teacher' },
      { name: `QA Teen ${tag}`, age: 14, gender: 'male', learningInterest: 'zad-essentials', currentLevel: 'beginner', teacherId: teacherIds.male, teacherGenderPreference: 'male_teacher' },
    ],
  });
  accounts.push({ role: 'parent (kid 8 + teen 14)', email: parentEmail, userId: parent.id, name: `QA Parent ${tag}` });
  log(`parent   ${parentEmail}`);
  return accounts;
}

if (isMain(import.meta.url)) {
  const project = assertProject(process.argv[2]);
  createAccounts(project)
    .then(list => console.table(list.map(a => ({ role: a.role, email: a.email, name: a.name }))))
    .catch(err => { console.error(err.message); process.exit(1); });
}
