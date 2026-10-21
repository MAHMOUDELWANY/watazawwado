import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';

describe('CRM-06 search everything', () => {
  it('Ctrl/Cmd+K opens it for the super admin only; the hook runs before any early return', () => {
    const shell = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');
    assert.ok(shell.includes("(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'"));
    assert.ok(shell.includes('{isSuperAdmin && <CommandSearch open={commandOpen}'));
    assert.ok(shell.indexOf('CRM-06: Ctrl/Cmd+K') < shell.indexOf('if (isTeacherAuthenticated && agreementRequired)'), 'hooks before early returns');
  });
  it('the panel is a focus-trapped dialog with arrow keys and Enter', () => {
    const ui = fs.readFileSync('src/dashboard/components/CommandSearch.tsx', 'utf8');
    assert.ok(ui.includes('<FocusTrap onEscape={onClose}>') && ui.includes("e.key === 'ArrowDown'") && ui.includes("e.key === 'Enter' && hits[active]"));
    assert.ok(ui.includes('role="listbox"') && ui.includes('aria-activedescendant'));
  });
  it('searches with escaped values only', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const route = api.slice(api.indexOf("app.get('/api/dashboard/admin/search'"), api.indexOf('// AD-01: what needs the admin today'));
    assert.ok(route.includes('const pattern = pgrstValue(`%${escapeLike(q)}%`)'));
    assert.ok(route.includes('`id.eq.${q},payment_reference.ilike.${pattern}`') && route.includes('const isUuid = /^[0-9a-f]{8}-'), 'a raw id is used only after a UUID check');
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('is admin only, ignores one-letter queries and survives filter syntax in the query', async () => {
      const url = `${base}/api/dashboard/admin/search?q=`;
      assert.strictEqual((await fetch(`${url}ab`)).status, 401);
      assert.strictEqual((await fetch(`${url}ab`, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
      const admin = { headers: { Authorization: 'Bearer dev-super-admin-token' } };
      const short = await fetch(`${url}a`, admin);
      if (short.status === 503) return;
      assert.deepStrictEqual(await short.json(), { results: [] });
      for (const q of ['a,b),status.eq.x', '%_*"\back', 'WZ-']) {
        const r = await fetch(`${url}${encodeURIComponent(q)}`, admin);
        assert.strictEqual(r.status, 200, q);
        assert.ok(Array.isArray(((await r.json()) as any).results));
      }
    });
  });
});
