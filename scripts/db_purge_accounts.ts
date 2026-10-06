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

const WHITELIST_EMAILS = [
  'mahmoudelwany98@gmail.com',
  'mhmwdlwany4222@gmail.com'
].map(e => e.toLowerCase().trim());

async function purgeAccounts() {
  console.log('=== STARTING DATABASE ACCOUNT PURGE ===');
  console.log('Allowed emails to KEEP:', WHITELIST_EMAILS);

  // 1. Fetch all auth users
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) {
    console.error('Failed to list auth users:', usersErr);
    return;
  }

  const usersToDelete = usersData.users.filter(u => {
    const email = (u.email || '').toLowerCase().trim();
    return !WHITELIST_EMAILS.includes(email);
  });

  const usersToKeep = usersData.users.filter(u => {
    const email = (u.email || '').toLowerCase().trim();
    return WHITELIST_EMAILS.includes(email);
  });

  console.log(`Found ${usersData.users.length} total auth users.`);
  console.log(`Users to KEEP (${usersToKeep.length}):`, usersToKeep.map(u => u.email));
  console.log(`Users to DELETE (${usersToDelete.length}):`, usersToDelete.map(u => u.email));

  // 2. Clean teacher_accounts (remove any non-whitelisted email or placeholder like afnan)
  console.log('\n--- Cleaning teacher_accounts ---');
  const { data: allTeachers } = await supabase.from('teacher_accounts').select('email');
  if (allTeachers) {
    for (const t of allTeachers) {
      const email = (t.email || '').toLowerCase().trim();
      if (!WHITELIST_EMAILS.includes(email)) {
        console.log(`Deleting teacher_account: ${email}`);
        await supabase.from('teacher_accounts').delete().eq('email', t.email);
      }
    }
  }

  // 3. Find students to delete
  const { data: allStudents } = await supabase.from('students').select('id, email, auth_user_id');
  const studentIdsToDelete: string[] = [];
  if (allStudents) {
    for (const s of allStudents) {
      const email = (s.email || '').toLowerCase().trim();
      if (!WHITELIST_EMAILS.includes(email)) {
        studentIdsToDelete.push(s.id);
      }
    }
  }
  console.log(`\nFound ${studentIdsToDelete.length} students to delete.`);

  // 4. Delete payments associated with these students or non-whitelisted
  if (studentIdsToDelete.length > 0) {
    console.log(`Deleting payments for ${studentIdsToDelete.length} students...`);
    for (const sId of studentIdsToDelete) {
      await supabase.from('payments').delete().eq('student_id', sId);
    }
  }

  // 5. Delete bookings associated with these students
  if (studentIdsToDelete.length > 0) {
    console.log(`Deleting bookings for ${studentIdsToDelete.length} students...`);
    for (const sId of studentIdsToDelete) {
      await supabase.from('bookings').delete().eq('student_id', sId);
    }
  }

  // Delete any bookings where contact_email is not whitelisted
  const { data: allBookings } = await supabase.from('bookings').select('id, contact_email');
  if (allBookings) {
    for (const b of allBookings) {
      const email = (b.contact_email || '').toLowerCase().trim();
      if (email && !WHITELIST_EMAILS.includes(email)) {
        console.log(`Deleting booking ${b.id} with contact_email ${email}`);
        await supabase.from('bookings').delete().eq('id', b.id);
      }
    }
  }

  // 6. Delete guardians
  if (studentIdsToDelete.length > 0) {
    console.log(`Deleting guardians for ${studentIdsToDelete.length} students...`);
    for (const sId of studentIdsToDelete) {
      await supabase.from('guardians').delete().eq('student_id', sId);
    }
  }
  const { data: allGuardians } = await supabase.from('guardians').select('id, parent_email');
  if (allGuardians) {
    for (const g of allGuardians) {
      const email = (g.parent_email || '').toLowerCase().trim();
      if (email && !WHITELIST_EMAILS.includes(email)) {
        await supabase.from('guardians').delete().eq('id', g.id);
      }
    }
  }

  // 7. Delete students
  if (studentIdsToDelete.length > 0) {
    console.log(`Deleting ${studentIdsToDelete.length} students...`);
    for (const sId of studentIdsToDelete) {
      await supabase.from('students').delete().eq('id', sId);
    }
  }

  // 8. Delete profiles
  const { data: allProfiles } = await supabase.from('profiles').select('id, email');
  if (allProfiles) {
    for (const p of allProfiles) {
      const email = (p.email || '').toLowerCase().trim();
      if (!WHITELIST_EMAILS.includes(email)) {
        console.log(`Deleting profile ${p.id} (${email})`);
        await supabase.from('profiles').delete().eq('id', p.id);
      }
    }
  }

  // 9. Delete auth users
  console.log(`\n--- Deleting ${usersToDelete.length} Auth Users ---`);
  for (const u of usersToDelete) {
    console.log(`Deleting auth user: ${u.id} (${u.email})`);
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
    if (delErr) {
      console.error(`Error deleting user ${u.email}:`, delErr.message);
    } else {
      console.log(`Successfully deleted auth user: ${u.email}`);
    }
  }

  // 10. Final Verification
  console.log('\n=== FINAL VERIFICATION ===');
  const { data: remainingUsers } = await supabase.auth.admin.listUsers();
  console.log('Remaining Auth Users:', remainingUsers?.users.map(u => ({ id: u.id, email: u.email })));

  const { data: remainingStudents } = await supabase.from('students').select('id, email, name');
  console.log('Remaining Students:', remainingStudents);

  const { data: remainingTeachers } = await supabase.from('teacher_accounts').select('email, display_name, role');
  console.log('Remaining Teachers:', remainingTeachers);

  const { data: remainingBookings } = await supabase.from('bookings').select('id, contact_email');
  console.log('Remaining Bookings count:', remainingBookings?.length || 0);

  const { data: remainingPayments } = await supabase.from('payments').select('id');
  console.log('Remaining Payments count:', remainingPayments?.length || 0);

  console.log('\n=== PURGE COMPLETED SUCCESSFULLY ===');
}

purgeAccounts().catch(console.error);
