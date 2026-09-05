import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Phase 5F — Final Closure Verification Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // 1. Integration Status Security & Response Privacy
  describe('Integration Status Endpoint Security & Privacy', () => {
    it('rejects unauthenticated GET /api/integrations/status with 401', async () => {
      const res = await fetch(`${baseUrl}/api/integrations/status`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.ok(body.error && body.error.toLowerCase().includes('authentication required'));
    });

    it('rejects unauthenticated GET /api/integrations/google-calendar/auth-url with 401', async () => {
      const res = await fetch(`${baseUrl}/api/integrations/google-calendar/auth-url`);
      assert.strictEqual(res.status, 401);
    });

    it('rejects unauthenticated POST /api/integrations/google-calendar/disconnect with 401', async () => {
      const res = await fetch(`${baseUrl}/api/integrations/google-calendar/disconnect`, { method: 'POST' });
      assert.strictEqual(res.status, 401);
    });

    it('allows teacher access to /api/integrations/status with dev-teacher-token', async () => {
      const res = await fetch(`${baseUrl}/api/integrations/status`, {
        headers: { Authorization: 'Bearer dev-teacher-token' }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.ok(data.googleCalendar !== undefined);
      assert.ok(data.zoom !== undefined);
      assert.strictEqual(typeof data.zoom.isConfigured, 'boolean');

      // CRITICAL: Ensure defaultRoomUrl is NOT exposed in status
      assert.strictEqual(data.zoom.defaultRoomUrl, undefined);
    });
  });

  // 2. Analytics Conversion Integrity
  describe('Analytics Endpoint Security & Conversion Integrity', () => {
    it('rejects unauthenticated GET /api/dashboard/analytics with 401', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/analytics`);
      assert.strictEqual(res.status, 401);
    });

    it('allows teacher access and returns structured cohort analytics', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/analytics`, {
        headers: { Authorization: 'Bearer dev-teacher-token' }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.ok(data.funnel !== undefined);
      assert.ok(data.funnel.rates !== undefined);
      
      const { lead_to_trial_rate, trial_to_student_rate, overall_conversion_rate } = data.funnel.rates;

      // Ensure conversion rates are either null or valid numbers (no NaN, Infinity)
      if (lead_to_trial_rate !== null) {
        assert.ok(!isNaN(lead_to_trial_rate) && isFinite(lead_to_trial_rate));
      }
      if (trial_to_student_rate !== null) {
        assert.ok(!isNaN(trial_to_student_rate) && isFinite(trial_to_student_rate));
      }
      if (overall_conversion_rate !== null) {
        assert.ok(!isNaN(overall_conversion_rate) && isFinite(overall_conversion_rate));
      }

      assert.ok(data.current_pipeline !== undefined);
      assert.strictEqual(typeof data.current_pipeline.lead, 'number');
    });
  });

  // 3. Settings Validation & Security
  describe('Settings Validation & Security', () => {
    it('rejects unauthenticated GET /api/dashboard/settings with 401', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/settings`);
      assert.strictEqual(res.status, 401);
    });

    it('rejects settings update with unknown setting key', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer dev-teacher-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: [{ key: 'unauthorized_key_xyz', value: 'malicious', category: 'Profile' }]
        })
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.ok(body.error);
    });

    it('rejects settings update with invalid trial duration > 45 minutes', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer dev-teacher-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: [{ key: 'trial_duration', value: 90, category: 'Policies' }]
        })
      });
      assert.strictEqual(res.status, 400);
    });

    it('rejects settings update with invalid timezone', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer dev-teacher-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: [{ key: 'timezone', value: 'Invalid/City', category: 'Timezone' }]
        })
      });
      assert.strictEqual(res.status, 400);
    });
  });

  // 4. Currency Validation Tests
  describe('Payment Currency Validation', () => {
    it('rejects manual payment creation without a valid currency', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/payments`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dev-teacher-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 50,
          currency: '',
          payment_method: 'paypal'
        })
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.ok(body.error && body.error.toLowerCase().includes('currency'));
    });

    it('rejects manual payment creation with invalid 2-letter currency', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/payments`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dev-teacher-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 50,
          currency: 'US',
          payment_method: 'paypal'
        })
      });
      assert.strictEqual(res.status, 400);
    });
  });
});
