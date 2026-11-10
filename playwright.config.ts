import { defineConfig, devices } from '@playwright/test';

// docs/testing/RULES.md: each testing project runs its own server (qa-p1 on 3001 ... qa-p5 on 3005).
// QA_PROJECT picks the project (default p1); PORT or QA_BASE_URL override its port.
const project = process.env.QA_PROJECT || 'p1';
const port = process.env.PORT || String(3000 + Number(project.replace(/\D/g, '') || 1));
const baseURL = (process.env.QA_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');

const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: devices['iPhone 13'].userAgent };
const desktop = { viewport: { width: 1440, height: 900 } };
const API_SPECS = /\.api\.spec\.ts$/;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    browserName: 'chromium',
  },
  // `*.api.spec.ts` drive the server and check the database with no browser, so they run once (project `api`),
  // before the browser projects, which run every other spec on phone/desktop x Arabic/English.
  projects: [
    { name: 'api', testMatch: API_SPECS },
    { name: 'desktop-ar', testIgnore: API_SPECS, dependencies: ['api'], use: { ...desktop, locale: 'ar' } },
    { name: 'desktop-en', testIgnore: API_SPECS, dependencies: ['api'], use: { ...desktop, locale: 'en' } },
    { name: 'phone-ar', testIgnore: API_SPECS, dependencies: ['api'], use: { ...phone, locale: 'ar' } },
    { name: 'phone-en', testIgnore: API_SPECS, dependencies: ['api'], use: { ...phone, locale: 'en' } },
  ],
});
