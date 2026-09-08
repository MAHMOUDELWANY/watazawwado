const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');
code = code.replace(/summary: \{/g, 'summary,'); // Revert the blind sed
code = code.replace(/summary,\n      integrationsProcessed: \{/g, 'summary: {');
fs.writeFileSync('api/index.ts', code);
