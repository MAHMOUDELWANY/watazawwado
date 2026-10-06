import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspect() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('List users error:', error);
    return;
  }
  console.log('--- AUTH USERS (' + users.users.length + ') ---');
  for (const u of users.users) {
    console.log(u.id, '|', u.email, '|', u.created_at);
  }

  const { data: students, error: sErr } = await supabase.from('students').select('*');
  console.log('\n--- STUDENTS (' + (students?.length || 0) + ') ---');
  if (sErr) console.error('Students err:', sErr);
  else students?.forEach(s => console.log(s.id, '|', s.email, '|', s.full_name, '| teacher_assignment_status:', s.teacher_assignment_status));

  const { data: teachers, error: tErr } = await supabase.from('teacher_accounts').select('*');
  console.log('\n--- TEACHERS (' + (teachers?.length || 0) + ') ---');
  if (tErr) console.error('Teachers err:', tErr);
  else teachers?.forEach(t => console.log(t.id, '|', t.email, '|', t.full_name, '|', t.is_active));

  const { data: guardians, error: gErr } = await supabase.from('guardians').select('*');
  console.log('\n--- GUARDIANS (' + (guardians?.length || 0) + ') ---');
  if (gErr) console.error('Guardians err:', gErr);
  else guardians?.forEach(g => console.log(g.id, '|', g.email, '|', g.full_name));

  const { data: bookings, error: bErr } = await supabase.from('bookings').select('id, student_email, student_name, teacher_id, status, scheduled_at');
  console.log('\n--- BOOKINGS (' + (bookings?.length || 0) + ') ---');
  if (bErr) console.error('Bookings err:', bErr);
  else bookings?.forEach(b => console.log(b.id, '|', b.student_email, '|', b.student_name, '|', b.status));

  const { data: payments, error: pErr } = await supabase.from('payments').select('id, student_id, amount, status');
  console.log('\n--- PAYMENTS (' + (payments?.length || 0) + ') ---');
  if (pErr) console.error('Payments err:', pErr);
  else payments?.forEach(p => console.log(p.id, '|', p.student_id, '|', p.amount, '|', p.status));
}

inspect();
