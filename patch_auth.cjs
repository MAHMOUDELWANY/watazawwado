const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

// We want to add the else block for Identity Conflict
const searchString = `            if (!linkError && linkedStudent) {
              console.log(\`[verifyStudentAuth] Safely linked existing student profile \${candidate.id} to auth user \${user.id}\`);
              studentRecord = linkedStudent;
            }
          }
        }
      }`;

const replaceString = `            if (!linkError && linkedStudent) {
              console.log(\`[verifyStudentAuth] Safely linked existing student profile \${candidate.id} to auth user \${user.id}\`);
              studentRecord = linkedStudent;
            }
          } else if (matchingStudents.length > 0) {
            console.error('[verifyStudentAuth] Identity conflict. Email is already associated with a student record but cannot be linked to this auth user.');
            return res.status(409).json({ error: 'Identity conflict. This email is already associated with an account.' });
          }
        }
      }`;

code = code.replace(searchString, replaceString);

const searchString2 = `          if (retryStudent) {
            studentRecord = retryStudent;
          }
        }
      }

      req.studentUser = {`;

const replaceString2 = `          if (retryStudent) {
            studentRecord = retryStudent;
          } else {
            console.error('[verifyStudentAuth] Database error resolving student profile:', insertError?.message);
            return res.status(500).json({ error: 'Internal server error resolving student profile.' });
          }
        }
      }

      req.studentUser = {`;

code = code.replace(searchString2, replaceString2);

fs.writeFileSync('api/index.ts', code);
console.log('Patched api/index.ts');
