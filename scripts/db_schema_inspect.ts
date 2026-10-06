import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function inspectTables() {
  const tables = ['students', 'teacher_accounts', 'guardians', 'bookings', 'payments', 'student_intakes', 'user_roles', 'profiles', 'teacher_availability', 'packages', 'student_packages'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table [${table}]: error ->`, error.message);
    } else {
      console.log(`Table [${table}]: exists, columns ->`, data.length > 0 ? Object.keys(data[0]) : '(empty table)');
    }
  }
}

inspectTables();
