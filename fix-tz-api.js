const fs = require('fs');

let c = fs.readFileSync('api/index.ts', 'utf8');

c = c.replace(
  `    if (!DateTime.local().setZone(timezone).isValid) {
      return res.status(400).json({ error: 'Invalid timezone.', code: 'INVALID_AVAILABILITY_REQUEST' });
    }`,
  `    let safeTimezone = timezone;
    if (!DateTime.local().setZone(safeTimezone).isValid) {
      console.warn('Invalid timezone received, falling back to Africa/Cairo: ', timezone);
      safeTimezone = 'Africa/Cairo';
    }`
);

c = c.replace(
  `const days = await computeAvailableSlots(timezone, daysCount, duration, teacherId);`,
  `const days = await computeAvailableSlots(safeTimezone, daysCount, duration, teacherId);`
);

c = c.replace(
  `res.json({ success: true, days, timezone });`,
  `res.json({ success: true, days, timezone: safeTimezone });`
);

fs.writeFileSync('api/index.ts', c);
