const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

// Find the block for `PATCH /api/dashboard/bookings/:id`
const startIdx = code.indexOf(`app.patch('/api/dashboard/bookings/:id'`);
const endIdx = code.indexOf(`// 16d. DASHBOARD: Fetch all payments`);

let patchBlock = code.substring(startIdx, endIdx);

// The patch block logic needs to be rewritten to support the new RPC.
// I will just use regex to replace the specific block.
