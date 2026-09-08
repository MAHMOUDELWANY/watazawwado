const fs = require('fs');

const file = 'api/index.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `const summary = await processDueReminders();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary
    });`;

const replacementStr = `const summary = await processDueReminders();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      integrationsProcessed
    });`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Target string not found');
}
