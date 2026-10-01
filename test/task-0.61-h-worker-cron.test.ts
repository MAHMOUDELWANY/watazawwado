import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const vercelConfig = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('Task 0.61-H: Production worker cron route is configured', () => {
  const cron = Array.isArray(vercelConfig.crons)
    ? vercelConfig.crons.find((entry) => entry?.path === '/api/cron/process-reminders')
    : null;

  assert.ok(cron, 'Expected integration worker cron route to be configured');
  assert.equal(cron.schedule, '0 * * * *', 'Expected an hourly production trigger on Hobby plan');
});

test('Task 0.61-H: cron route is protected by the existing cron endpoint', () => {
  const source = fs.readFileSync(new URL('../api/index.ts', import.meta.url), 'utf8');

  assert.match(source, /app\.all\('\/api\/cron\/process-reminders'/);
  assert.match(source, /CRON_SECRET/);
  assert.match(source, /processIntegrationJobs\(\)/);
});
