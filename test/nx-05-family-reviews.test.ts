import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { parseReview, newInviteToken } from '../server/routes/reviews.js';

const ok = { rating: 5, body: 'The teacher was patient and kind.', displayName: 'Amina K.', role: 'parent', consent: true };

describe('NX-05 family reviews: what a writer sends', () => {
  it('accepts a normal review and detects Arabic', () => {
    const r = parseReview(ok);
    assert.ok(r.ok);
    const ar = parseReview({ ...ok, body: 'المعلمة صبورة جداً وبنتي بتحب الحصة.' });
    assert.ok(ar.ok && ar.value.lang === 'ar');
  });

  it('needs consent, a rating 1-5, a role, a name and real text', () => {
    for (const bad of [{ ...ok, consent: false }, { ...ok, rating: 0 }, { ...ok, rating: 6 }, { ...ok, role: 'teacher' }, { ...ok, displayName: ' ' }, { ...ok, body: 'short' }]) {
      assert.strictEqual(parseReview(bad).ok, false, JSON.stringify(bad));
    }
  });

  it('refuses links, emails and phone numbers', () => {
    for (const body of ['Visit www.example.com for more', 'email me at a@b.co please', 'call +44 7700 900123 any time']) {
      assert.strictEqual(parseReview({ ...ok, body }).ok, false, body);
    }
  });

  it('invite tokens are long and random', () => {
    const a = newInviteToken();
    assert.match(a, /^[A-Za-z0-9_-]{32}$/);
    assert.notStrictEqual(a, newInviteToken());
  });

  it('the home page shows reviews only with real published ones, and says we never reward reviews', () => {
    const src = fs.readFileSync('src/components/public/homepage/FamilyVoices.tsx', 'utf8');
    assert.match(src, /MIN_REVIEWS = 3/);
    assert.match(src, /data\.count > 0 \|\|/); // section shows from the first published review
    assert.match(src, /data\.count >= MIN_REVIEWS && data\.average/); // the average waits for 3
    assert.match(src, /never reward reviews/);
  });
});

describe('NX-05 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('admin and portal routes need sign-in; a bad link is refused', async () => {
    assert.strictEqual((await fetch(`${base}/api/dashboard/reviews`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/review-status`)).status, 401);
    const bad = await fetch(`${base}/api/reviews/invite/not-a-token`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ok) });
    assert.ok([404, 503].includes(bad.status), String(bad.status));
  });
});
