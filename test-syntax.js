const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
  const code = fs.readFileSync('api/index.ts', 'utf8');
  if (code.includes('students:student_id(id, name, current_level)')) {
    console.log("Syntax is present");
  }
}
test();
