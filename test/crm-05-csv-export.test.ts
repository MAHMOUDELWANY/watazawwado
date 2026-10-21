import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { csvCell, toCsv, CSV_BOM, STUDENT_COLUMNS, LEAD_COLUMNS, PAYMENT_COLUMNS } from '../server/routes/exports.js';

describe('CRM-05 CSV building', () => {
  it('quotes commas, quotes and new lines; keeps Arabic as is', () => {
    assert.strictEqual(csvCell('مريم أحمد'), 'مريم أحمد');
    assert.strictEqual(csvCell('a,b'), '"a,b"');
    assert.strictEqual(csvCell('say "hi"'), '"say ""hi"""');
    assert.strictEqual(csvCell('line1\nline2'), '"line1\nline2"');
    assert.strictEqual(csvCell(null), '');
    assert.strictEqual(csvCell(-25), '-25', 'real numbers are not touched');
  });
  it('neutralises spreadsheet formulas (CSV injection)', () => {
    for (const evil of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)', '\t=1']) {
      assert.ok(csvCell(evil).replace(/^"/, '').startsWith("'"), evil);
    }
  });
  it('starts with a BOM so Excel reads Arabic as UTF-8', () => {
    const csv = toCsv([{ key: 'n', label: 'name' }], [{ n: 'يوسف' }]);
    assert.ok(csv.startsWith(CSV_BOM));
    assert.strictEqual(csv, `${CSV_BOM}name\r\nيوسف\r\n`);
  });
  it('never exports notes or secrets', () => {
    for (const cols of [STUDENT_COLUMNS, LEAD_COLUMNS, PAYMENT_COLUMNS]) {
      assert.ok(!cols.some((c) => /note|token|secret|password/i.test(c.key)), JSON.stringify(cols.map((c) => c.key)));
    }
    const src = fs.readFileSync('server/routes/exports.ts', 'utf8');
    for (const m of src.matchAll(/\.select\('([^']+)'\)/g)) assert.ok(!/\bnotes\b|private_notes|management_token/.test(m[1]), m[1]);
  });
});

describe('CRM-05 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('are admin only and return a UTF-8 CSV download', async () => {
    for (const kind of ['students', 'leads', 'payments']) {
      const url = `${base}/api/dashboard/admin/export/${kind}.csv`;
      assert.strictEqual((await fetch(url)).status, 401, kind);
      assert.strictEqual((await fetch(url, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403, kind);
      const r = await fetch(url, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
      if (r.status === 503) continue;
      assert.strictEqual(r.status, 200, kind);
      assert.match(r.headers.get('content-type') || '', /text\/csv; charset=utf-8/);
      assert.match(r.headers.get('content-disposition') || '', new RegExp(`attachment; filename="watazawwado-${kind}-`));
      const buf = new Uint8Array(await r.arrayBuffer());
      assert.deepStrictEqual([...buf.slice(0, 3)], [0xef, 0xbb, 0xbf], 'UTF-8 BOM');
    }
  });
});
