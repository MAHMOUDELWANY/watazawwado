const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const oldFallback = `      // Safe deterministic linking if an unlinked historical record exists for this verified email
      if (!studentRecord && userEmail) {
        const { data: matchingStudents, error: matchError } = await supabaseAdmin
          .from('students')
          .select('id, name, email, timezone, learner_type, current_level, status, auth_user_id')
          .ilike('email', userEmail);

        if (!matchError && matchingStudents) {
          const unlinked = matchingStudents.filter((s: any) => !s.auth_user_id);
          // Only auto-link if exactly 1 unlinked record exists and no other records exist for this email
          if (unlinked.length === 1 && matchingStudents.length === 1) {
            const candidate = unlinked[0];
            const { data: linkedStudent, error: linkError } = await supabaseAdmin
              .from('students')
              .update({ auth_user_id: user.id })
              .eq('id', candidate.id)
              .is('auth_user_id', null)
              .select('id, name, email, timezone, learner_type, current_level, status')
              .single();

            if (!linkError && linkedStudent) {
              console.log(\`[verifyStudentAuth] Safely linked existing student profile \${candidate.id} to auth user \${user.id}\`);
              studentRecord = linkedStudent;
            }
          }
        }
      }

      // If still no student record exists, create exactly one student profile
      if (!studentRecord) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0] || 'Student';
        const { data: newStudent, error: insertError } = await supabaseAdmin
          .from('students')
          .insert({
            auth_user_id: user.id,
            name: fullName,
            email: userEmail,
            status: 'active',
            timezone: 'UTC',
            learner_type: 'adult',
            current_level: 'beginner'
          })
          .select('id, name, email, timezone, learner_type, current_level, status')
          .single();

        if (!insertError && newStudent) {
          studentRecord = newStudent;
        } else {
          // Retry select in case of concurrent creation
          const { data: retryStudent } = await supabaseAdmin
            .from('students')
            .select('id, name, email, timezone, learner_type, current_level, status')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (retryStudent) {
            studentRecord = retryStudent;
          }
        }
      }`;

const newFallback = `      // Safe deterministic linking if an unlinked historical record exists for this verified email
      if (!studentRecord && userEmail) {
        const { data: matchingStudents, error: matchError } = await supabaseAdmin
          .from('students')
          .select('id, name, email, timezone, learner_type, current_level, status, auth_user_id')
          .ilike('email', userEmail);

        if (!matchError && matchingStudents && matchingStudents.length > 0) {
          const unlinked = matchingStudents.filter((s: any) => !s.auth_user_id);
          
          if (unlinked.length === 1 && matchingStudents.length === 1) {
            // Only auto-link if exactly 1 unlinked record exists and no other records exist for this email
            const candidate = unlinked[0];
            const { data: linkedStudent, error: linkError } = await supabaseAdmin
              .from('students')
              .update({ auth_user_id: user.id })
              .eq('id', candidate.id)
              .is('auth_user_id', null)
              .select('id, name, email, timezone, learner_type, current_level, status')
              .single();

            if (!linkError && linkedStudent) {
              console.log(\`[verifyStudentAuth] Safely linked existing student profile \${candidate.id} to auth user \${user.id}\`);
              studentRecord = linkedStudent;
            }
          } else {
            // A student record exists for this email but is either already linked to another auth_user_id,
            // or there are multiple records. We must NOT silently create a duplicate.
            console.error('[verifyStudentAuth] Identity conflict. Email is already associated with a student record but cannot be linked to this auth user.');
            return res.status(409).json({ error: 'Identity conflict. This email is already associated with an account.' });
          }
        }
      }

      // Only create a new student record if NO matching record exists at all (genuine new user).
      if (!studentRecord) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0] || 'Student';
        const { data: newStudent, error: insertError } = await supabaseAdmin
          .from('students')
          .insert({
            auth_user_id: user.id,
            name: fullName,
            email: userEmail,
            status: 'active',
            timezone: 'UTC',
            learner_type: 'adult',
            current_level: 'beginner'
          })
          .select('id, name, email, timezone, learner_type, current_level, status')
          .single();

        if (!insertError && newStudent) {
          studentRecord = newStudent;
        } else {
          // If insert failed, it might be due to a unique constraint (e.g. concurrent creation).
          const { data: retryStudent } = await supabaseAdmin
            .from('students')
            .select('id, name, email, timezone, learner_type, current_level, status')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (retryStudent) {
            studentRecord = retryStudent;
          } else {
            console.error('[verifyStudentAuth] Failed to resolve or create student profile:', insertError?.message);
            return res.status(500).json({ error: 'Failed to resolve student identity.' });
          }
        }
      }`;

if (code.includes(oldFallback)) {
  code = code.replace(oldFallback, newFallback);
  fs.writeFileSync('api/index.ts', code);
  console.log('Patched api/index.ts successfully');
} else {
  console.log('Could not find old fallback logic in api/index.ts');
}
