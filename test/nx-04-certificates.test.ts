import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { publicCertificate } from '../server/routes/certificates.js';
import { buildShelf } from '../src/student/components/achievements/achievements.js';

describe('NX-04 certificates', () => {
  it('the public check shows the first name, milestone and date only', () => {
    const out = publicCertificate({ id: 'm1', title_en: 'Memorized Al-Mulk', title_ar: 'حفظ الملك', reached_at: '2026-11-01T00:00:00Z', student_id: 's1', created_by: 't1' } as any, 'Amina Hassan Ali');
    assert.deepStrictEqual(out, { id: 'm1', firstName: 'Amina', title_en: 'Memorized Al-Mulk', title_ar: 'حفظ الملك', reached_at: '2026-11-01T00:00:00Z' });
  });

  it('every teacher milestone on the shelf carries its certificate id', () => {
    const shelf = buildShelf({ lessonsTotal: 3, longestRhythm: 0, milestones: [
      { id: 'a', kind: 'surah_memorized', title_en: 'x', title_ar: 'x', reached_at: '2026-10-01' },
      { id: 'b', kind: 'custom', title_en: 'y', title_ar: 'y', reached_at: '2026-10-02' },
    ] });
    assert.deepStrictEqual(shelf.filter((i) => i.milestoneId).map((i) => i.milestoneId).sort(), ['a', 'b']);
    assert.ok(shelf.filter((i) => !i.earned).every((i) => !i.milestoneId));
  });

  it('the sheet uses wording that fits a boy or a girl, and prints alone', () => {
    const sheet = fs.readFileSync('src/components/certificate/CertificateSheet.tsx', 'utf8');
    assert.doesNotMatch(sheet, /قد أتمّ|زادك/);
    assert.match(fs.readFileSync('src/index.css', 'utf8'), /#certificate, #certificate \* \{ visibility: visible; \}/);
  });
});

describe('NX-04 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('a bad id is not found, and the family copy needs sign-in', async () => {
    assert.strictEqual((await fetch(`${base}/api/certificates/not-a-uuid`)).status, 404);
    assert.strictEqual((await fetch(`${base}/api/student/certificates/00000000-0000-4000-8000-000000000000`)).status, 401);
  });
});
