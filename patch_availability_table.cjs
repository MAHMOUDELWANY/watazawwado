const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/integrations/availabilityEngine.ts');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  `.from('availability')`,
  `.from('teacher_availability')`
);

// We must also revert the heuristic teacher selection we added back to how it was before if it's there.
// But the user told us "Do not add is_primary or any new DB schema/migration. Do not make any heuristic teacher-selection changes."
// Wait, the diff showed we had heuristic selection added in a previous commit. We need to revert that.

code = code.replace(
  `    // Public flow without teacherId (multiple connections) -> Resolve intended teacher dynamically.
    // Query public.teacher_accounts for the primary active super_admin.
    const { data: authoritativeTeacher, error: authErr } = await supabase
      .from('profiles')
      .select('id, email, teacher_accounts!inner(role, is_active)')
      .eq('teacher_accounts.is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!authErr && authoritativeTeacher?.id) {
       const teacherIdMatch = conns.find(c => c.teacher_id === authoritativeTeacher.id);
       if (teacherIdMatch) {
         return authoritativeTeacher.id;
       }
    }`,
  ``
);

fs.writeFileSync(filePath, code);
