import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseJoin, parseVoice, signupMode, waveSize } from '../server/routes/waitlist';

const BASE = 'http://127.0.0.1:3000';
const serverUp = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false);

describe('Waitlist input', () => {
  it('accepts one track, who, a lowercased email and a safe source', () => {
    const r = parseJoin({ email: ' Mum@Example.COM ', track: 'quran', who: 'child', lang: 'ar', source: 'instagram:building-watazawwado' });
    assert.deepEqual(r, { email: 'mum@example.com', track: 'quran', who: 'child', lang: 'ar', source: 'instagram:building-watazawwado' });
  });

  it('refuses a bad email, an unknown track or who, and the honeypot', () => {
    assert.ok('error' in parseJoin({ email: 'nope', track: 'quran', who: 'me' }));
    assert.ok('error' in parseJoin({ email: 'a@b.co', track: 'fiqh', who: 'me' }));
    assert.ok('error' in parseJoin({ email: 'a@b.co', track: 'quran', who: 'family' }));
    assert.ok('error' in parseJoin({ email: 'a@b.co', track: 'quran', who: 'me', website: 'bot' }));
  });

  it('drops an unsafe source and defaults the language to English', () => {
    const r = parseJoin({ email: 'a@b.co', track: 'zad', who: 'me', source: '<script>', lang: 'fr' });
    assert.ok(!('error' in r) && r.source === null && r.lang === 'en');
  });

  it('keeps only known pains, caps the note and needs one of them', () => {
    assert.deepEqual(parseVoice({ pains: ['clear_plan', 'hack', 'clear_plan'], note: ' hi ' }), { pains: ['clear_plan'], note: 'hi' });
    assert.ok('error' in parseVoice({ pains: [], note: '' }));
    assert.ok('error' in parseVoice({ note: 'x'.repeat(501) }));
  });

  it('is open by default with 20 places', () => {
    const prev = [process.env.LEARNER_SIGNUP_MODE, process.env.WAVE_SIZE];
    delete process.env.LEARNER_SIGNUP_MODE; delete process.env.WAVE_SIZE;
    assert.equal(signupMode(), 'open');
    assert.equal(waveSize(), 20);
    process.env.LEARNER_SIGNUP_MODE = 'waitlist'; process.env.WAVE_SIZE = '30';
    assert.equal(signupMode(), 'waitlist');
    assert.equal(waveSize(), 30);
    [process.env.LEARNER_SIGNUP_MODE, process.env.WAVE_SIZE] = prev as [string, string];
    if (prev[0] === undefined) delete process.env.LEARNER_SIGNUP_MODE;
    if (prev[1] === undefined) delete process.env.WAVE_SIZE;
  });

  it('never tells an unverified caller anything about an existing email', () => {
    const src = fs.readFileSync('server/routes/waitlist.ts', 'utf8');
    assert.ok(src.includes('if (preexisting && !verified)'));
    assert.ok(src.includes("return res.json({ already: true, waveSize: waveSize() });"));
  });

  it('guards new learner onboarding behind the waitlist', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const onboarding = api.slice(api.indexOf("app.post('/api/student/onboarding'"));
    assert.ok(onboarding.slice(0, 1500).includes('onboardingAllowed('));
  });
});

// These write to the configured (production) waitlist, so they run only on request: WAITLIST_ROUTE_TESTS=1.
describe('Waitlist routes', { skip: (!serverUp && 'dev server not running') || (!process.env.WAITLIST_ROUTE_TESTS && 'set WAITLIST_ROUTE_TESTS=1 to run') }, () => {
  const email = `waitlist-test-${Date.now()}@example.com`;
  let entry: any;

  it('joins once and keeps the same entry private on a second unverified join', async () => {
    const res = await fetch(`${BASE}/api/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, track: 'arabic', who: 'me' }) });
    entry = await res.json();
    assert.equal(res.status, 200, JSON.stringify(entry));
    assert.ok(entry.place >= 1 && entry.secret && entry.entryId);
    const again = await fetch(`${BASE}/api/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, track: 'quran', who: 'child' }) }).then((r) => r.json());
    assert.deepEqual(Object.keys(again).sort(), ['already', 'waveSize']);
  });

  it('saves the voice only with the right secret', async () => {
    const bad = await fetch(`${BASE}/api/waitlist/${entry.entryId}/voice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: 'wrong', pains: ['clear_plan'] }) });
    assert.equal(bad.status, 404);
    const ok = await fetch(`${BASE}/api/waitlist/${entry.entryId}/voice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: entry.secret, pains: ['clear_plan'], note: 'test' }) });
    assert.equal(ok.status, 200);
  });

  it('keeps the admin list for the super admin', async () => {
    const anon = await fetch(`${BASE}/api/dashboard/waitlist`);
    assert.ok(anon.status === 401 || anon.status === 403);
    const teacher = await fetch(`${BASE}/api/dashboard/waitlist`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
    assert.equal(teacher.status, 403);
    const admin = await fetch(`${BASE}/api/dashboard/waitlist`, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
    assert.equal(admin.status, 200);
    const body = await admin.json();
    assert.ok(body.entries.some((e: any) => e.id === entry.entryId));
  });
});
