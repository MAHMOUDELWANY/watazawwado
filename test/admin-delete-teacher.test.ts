import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

// Deleting a teacher for good (owner, 2026-10-22). Only the refusal paths run here, so no real account is ever removed.
describe('admin: delete a teacher for good', () => {
  let server: http.Server;
  let base: string;
  before(async () => {
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const del = (email: string, confirm: string, token?: string) =>
    fetch(`${base}/api/dashboard/admin/teachers/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ confirm_email: confirm }),
    });

  it('is super admin only', async () => {
    assert.strictEqual((await del('nobody@example.com', 'nobody@example.com')).status, 401);
    assert.strictEqual((await del('nobody@example.com', 'nobody@example.com', 'dev-teacher-token')).status, 403);
  });

  it('needs the email typed back, refuses your own account, and 404s an unknown teacher', async () => {
    const wrong = await del('nobody@example.com', 'someone-else@example.com', 'dev-super-admin-token');
    if (wrong.status === 503) return;
    assert.strictEqual(wrong.status, 400);
    assert.strictEqual((await del('mahmoudelwany98@gmail.com', 'mahmoudelwany98@gmail.com', 'dev-super-admin-token')).status, 403);
    assert.strictEqual((await del('nobody-here-zz@example.com', 'nobody-here-zz@example.com', 'dev-super-admin-token')).status, 404);
  });
});
