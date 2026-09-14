const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const search = `      // If still no student record exists, create exactly one student profile`;
const replace = `      // Only create a new student record if NO matching record exists at all (genuine new user).`;

code = code.replace(search, replace);

fs.writeFileSync('api/index.ts', code);
console.log('Patched api/index.ts');
