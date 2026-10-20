import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { normalizeTags } from '../server/routes/crm.js';

describe('CRM-03 admin notes and tags', () => {
  it('normalizes tags and refuses bad input', () => {
    assert.deepStrictEqual(normalizeTags([' Sibling  Likely ', 'sibling likely', '', 'Time zone tricky']), ['sibling likely', 'time zone tricky']);
    assert.strictEqual(normalizeTags('x'), null);
    assert.strictEqual(normalizeTags(['a'.repeat(61)]), null);
    assert.strictEqual(normalizeTags(Array.from({ length: 21 }, (_, i) => `t${i}`)), null);
    assert.deepStrictEqual(normalizeTags([]), []);
  });

  it('keeps the tables server-only (RLS on, service_role policy only)', () => {
    const sql = fs.readFileSync('supabase/migrations/20261020000001_crm_notes_tags.sql', 'utf8');
    for (const table of ['crm_notes', 'crm_tags']) {
      assert.ok(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`), `${table} RLS`);
      assert.match(sql, new RegExp(`ON public\\.${table} FOR ALL TO service_role`));
    }
    assert.ok(!/TO (anon|authenticated)/.test(sql), 'no family or teacher access');
  });

  describe('endpoints', () => {
    let server: http.Server;
    let base: string;
    const id = '00000000-0000-4000-8000-000000000000';
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('are for the super admin only', async () => {
      const calls: [string, string, any?][] = [
        ['GET', `/api/dashboard/admin/students/${id}/crm`],
        ['POST', `/api/dashboard/admin/students/${id}/crm/notes`, { body: 'x' }],
        ['DELETE', `/api/dashboard/admin/students/${id}/crm/notes/${id}`],
        ['PUT', `/api/dashboard/admin/students/${id}/crm/tags`, { tags: ['x'] }]
      ];
      for (const [method, path, body] of calls) {
        const init = (token?: string) => ({
          method,
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: body ? JSON.stringify(body) : undefined
        });
        assert.strictEqual((await fetch(base + path, init())).status, 401, `${method} ${path} without a token`);
        assert.strictEqual((await fetch(base + path, init('dev-teacher-token'))).status, 403, `${method} ${path} as a teacher`);
      }
    });

    it('validates input before touching the database', async () => {
      const admin = { 'Content-Type': 'application/json', Authorization: 'Bearer dev-super-admin-token' };
      const r1 = await fetch(`${base}/api/dashboard/admin/students/${id}/crm/notes`, { method: 'POST', headers: admin, body: JSON.stringify({ body: '   ' }) });
      assert.ok([400, 503].includes(r1.status));
      const r2 = await fetch(`${base}/api/dashboard/admin/students/not-an-id/crm`, { headers: admin });
      assert.ok([400, 503].includes(r2.status));
      const r3 = await fetch(`${base}/api/dashboard/admin/students/${id}/crm/tags`, { method: 'PUT', headers: admin, body: JSON.stringify({ tags: 'nope' }) });
      assert.ok([400, 503].includes(r3.status));
    });
  });
});
