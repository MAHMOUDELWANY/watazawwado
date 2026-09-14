const fs = require('fs');
let code = fs.readFileSync('src/dashboard/lib/dashboardApi.ts', 'utf8');

code = code.replace(/sessionStorage\.getItem\('teacher_auth_diagnostic'\)/g, "null");
code = code.replace(/sessionStorage\.getItem\('mahmoud_teacher_authenticated'\)/g, "null");

fs.writeFileSync('src/dashboard/lib/dashboardApi.ts', code);
console.log('Patched src/dashboard/lib/dashboardApi.ts');
