const fs = require('fs');
let api = fs.readFileSync('api/index.ts', 'utf8');
const match = api.match(/app\.post\('\/api\/integrations\/cancel', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Internal server error\.' \}\);\n  \}\n\}\);/);
console.log(match ? "Matched!" : "No match");
