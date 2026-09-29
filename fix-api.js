const fs = require('fs');

let c = fs.readFileSync('api/index.ts', 'utf8');

c = c.replace(
  `      if (error || !inserted) {
        console.error('[POST /api/intake/complete] Insert error:', error?.message);
        return res.status(500).json({ error: 'Could not save the intake.' });
      }`,
  `      if (error || !inserted) {
        console.error('[POST /api/intake/complete] Insert error:', error?.message);
        return res.status(500).json({ error: 'Could not save the intake. ' + (error?.message || '') });
      }`
);

fs.writeFileSync('api/index.ts', c);
