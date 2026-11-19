/**
 * A confirmed lesson for the classroom tests, written straight to the database (no payment rows: the room only reads
 * the booking). Its contact email is the QA learner's, so scripts/qa/purge.ts removes it with everything that cascades
 * (room state, seats, timeline, quality, incidents, observations, late reasons) and its classroom files.
 *
 * Usage: npx tsx scripts/qa/classroom-booking.ts <p1..p9> [--offset-min=2] [--duration=30] [--learner=student|kid]
 *        npx tsx scripts/qa/classroom-booking.ts <p1..p9> --cancel=<bookingId>
 *        npx tsx scripts/qa/classroom-booking.ts <p1..p9> --delete=<bookingId>
 * Prints the booking as JSON. The learner's own teacher teaches: student-1 -> teacher-1, the kid -> teacher-2.
 */
import { adminClient, assertProject, isMain, listAllUsers, qaEmail } from './lib.js';

export type ClassroomBooking = { id: string; teacherId: string; studentId: string; start: string; durationMinutes: number };

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

export async function createClassroomBooking(project: string, opts: { offsetMin?: number; duration?: 30 | 45 | 60; learner?: 'student' | 'kid' } = {}): Promise<ClassroomBooking> {
  const db = adminClient();
  const tag = project.toUpperCase();
  const learner = opts.learner ?? 'student';
  const duration = opts.duration ?? 30;
  const users = await listAllUsers(db);
  const authId = (role: 'student' | 'parent' | 'teacher', n = 1) => {
    const id = users.find((u) => u.email?.toLowerCase() === qaEmail(project, role, n))?.id;
    if (!id) throw new Error(`No QA ${role}-${n}. Run: npx tsx scripts/qa/create-accounts.ts ${project}`);
    return id as string;
  };
  const q = learner === 'kid'
    ? db.from('students').select('id, name').eq('name', `QA Kid ${tag}`)
    : db.from('students').select('id, name').eq('auth_user_id', authId('student'));
  const { data: s, error: sErr } = await q.single();
  if (sErr || !s) throw new Error(`learner: ${sErr?.message}`);
  const teacherId = authId('teacher', learner === 'kid' ? 2 : 1);
  // One teacher cannot hold two lessons at once (bookings_no_overlap_excl): earlier test lessons of this teacher go.
  const { data: old } = await db.from('bookings').select('id').eq('teacher_id', teacherId).like('reference_code', 'QA-CL-%');
  for (const o of old || []) await deleteClassroomBooking(project, o.id);
  const start = new Date(Date.now() + (opts.offsetMin ?? 2) * 60_000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + duration * 60_000);
  const contactEmail = qaEmail(project, learner === 'kid' ? 'parent' : 'student');
  const { data, error } = await db.from('bookings').insert({
    reference_code: `QA-CL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    service_id: 'quran-reading', booking_type: 'regular', duration_minutes: duration,
    scheduled_start: start.toISOString(), scheduled_end: end.toISOString(), student_timezone: 'Europe/London',
    status: 'confirmed', contact_name: s.name, contact_email: contactEmail, fee_amount_usd: 0,
    student_id: s.id, teacher_id: teacherId,
  }).select('id').single();
  if (error || !data) throw new Error(`booking: ${error?.message}`);
  return { id: data.id, teacherId, studentId: s.id, start: start.toISOString(), durationMinutes: duration };
}

/** Only QA bookings (contact email of this project) can be changed here. */
async function qaBookingOnly(project: string, id: string) {
  const db = adminClient();
  const { data } = await db.from('bookings').select('id, contact_email').eq('id', id).maybeSingle();
  if (!data || !String(data.contact_email).includes(`+qa-${project}-`)) throw new Error(`Not a QA ${project} booking: ${id}`);
  return db;
}

export async function cancelClassroomBooking(project: string, id: string) {
  const db = await qaBookingOnly(project, id);
  const { error } = await db.from('bookings').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteClassroomBooking(project: string, id: string) {
  const db = await qaBookingOnly(project, id);
  const { data: files } = await db.storage.from('classroom-files').list(id);
  if (files?.length) await db.storage.from('classroom-files').remove(files.map((f) => `${id}/${f.name}`));
  const { error } = await db.from('bookings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

if (isMain(import.meta.url)) {
  const project = assertProject(process.argv[2]);
  const cancel = arg('cancel');
  const del = arg('delete');
  const run = cancel ? cancelClassroomBooking(project, cancel).then(() => ({ cancelled: cancel }))
    : del ? deleteClassroomBooking(project, del).then(() => ({ deleted: del }))
      : createClassroomBooking(project, {
        offsetMin: Number(arg('offset-min') ?? 2),
        duration: Number(arg('duration') ?? 30) as 30 | 45 | 60,
        learner: (arg('learner') as 'student' | 'kid') ?? 'student',
      });
  run.then((r) => console.log(JSON.stringify(r))).catch((e) => { console.error(e.message); process.exit(1); });
}
