import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { EXPORT_COLUMNS, NEVER_EXPORTED } from '../server/routes/privacy.js';

describe('ST-06 privacy requests', () => {
  it('the export never includes tokens, meeting ids, teachers\' private notes or payment references', () => {
    for (const [table, cols] of Object.entries(EXPORT_COLUMNS)) {
      const list = cols.split(',').map((c) => c.trim());
      for (const banned of NEVER_EXPORTED) assert.ok(!list.includes(banned), `${table} exports ${banned}`);
    }
    const src = fs.readFileSync('server/routes/privacy.ts', 'utf8');
    assert.ok(!/select\('\*'\)/.test(src), 'no select *');
    assert.ok(src.includes(".select('thread_id, sender_role, body, created_at')"), 'messages without sender ids');
  });

  it('nothing is deleted automatically; the request is recorded once and the admin marks it handled', () => {
    const src = fs.readFileSync('server/routes/privacy.ts', 'utf8');
    assert.ok(!/\.delete\(\)/.test(src), 'no delete calls anywhere in the privacy routes');
    const sql = fs.readFileSync('supabase/migrations/20261021000005_privacy_requests.sql', 'utf8');
    assert.match(sql, /UNIQUE INDEX IF NOT EXISTS privacy_requests_one_open_idx ON public\.privacy_requests \(user_id\) WHERE status = 'open'/);
    assert.match(sql, /REVOKE ALL ON public\.privacy_requests FROM anon, authenticated/);
    assert.ok(src.includes("app.get('/api/dashboard/admin/privacy-requests', deps.verifyTeacherAuth, deps.requireSuperAdmin"));
    assert.ok(src.includes("app.post('/api/dashboard/admin/privacy-requests/:id/done', deps.verifyTeacherAuth, deps.requireSuperAdmin"));
  });

  it('the team email goes out from production only', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes("if (process.env.VERCEL_ENV !== 'production') return;\n    const html") || api.includes("if (process.env.VERCEL_ENV !== 'production') return;\r\n    const html"));
  });

  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('export and deletion need a real signed-in account; the dev account gets nothing', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/privacy/export`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/privacy/delete-request`, { method: 'POST' })).status, 401);
    const dev = { Authorization: 'Bearer dev-student-token', 'Content-Type': 'application/json' };
    const exp = await fetch(`${base}/api/student/privacy/export`, { headers: dev });
    if (exp.status !== 503) assert.strictEqual(exp.status, 401);
    const del = await fetch(`${base}/api/student/privacy/delete-request`, { method: 'POST', headers: dev, body: JSON.stringify({ confirm: true }) });
    if (del.status !== 503) assert.strictEqual(del.status, 401);
    const admin = await fetch(`${base}/api/dashboard/admin/privacy-requests`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
    assert.strictEqual(admin.status, 403);
  });
});
