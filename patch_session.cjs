const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.tsx', 'utf8');

code = code.replace(/sessionStorage\.getItem\('mahmoud_teacher_authenticated'\)/g, "null");
code = code.replace(/sessionStorage\.getItem\('student_authenticated'\)/g, "null");
code = code.replace(/sessionStorage\.setItem\('mahmoud_teacher_authenticated', 'true'\);/g, "");
code = code.replace(/sessionStorage\.setItem\('student_authenticated', 'true'\);/g, "");
code = code.replace(/sessionStorage\.removeItem\('mahmoud_teacher_authenticated'\);/g, "");
code = code.replace(/sessionStorage\.removeItem\('student_authenticated'\);/g, "");

fs.writeFileSync('src/lib/auth.tsx', code);
console.log('Patched src/lib/auth.tsx');
