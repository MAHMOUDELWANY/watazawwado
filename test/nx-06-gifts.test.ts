import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { giftSeason, currentGiftSeason, makeGiftCode, normalizeGiftCode, giftLocked, cleanGiftText } from '../server/gifts.js';
import { giftShareText } from '../src/student/components/GiftsPanel.js';

describe('NX-06 gift rules', () => {
  it('gifts open two weeks before Ramadan to Eid al-Fitr, and in the first 13 days of Dhul Hijjah', () => {
    const at = (d: string) => giftSeason(new Date(`${d}T12:00:00Z`));
    assert.strictEqual(at('2026-02-05'), 'ramadan', 'mid Shaban');
    assert.strictEqual(at('2026-03-01'), 'ramadan');
    assert.strictEqual(at('2026-03-21'), 'eid-fitr');
    assert.strictEqual(at('2026-03-24'), null);
    assert.strictEqual(at('2026-05-20'), 'dhul-hijjah');
    assert.strictEqual(at('2026-11-01'), null);
  });

  it('the local preview switch never opens the season on production', () => {
    const off = new Date('2026-11-01T12:00:00Z');
    assert.strictEqual(currentGiftSeason({ GIFT_SEASON_PREVIEW: 'on' }, off), 'ramadan');
    assert.strictEqual(currentGiftSeason({ GIFT_SEASON_PREVIEW: 'on', VERCEL_ENV: 'production' }, off), null);
    assert.strictEqual(currentGiftSeason({ GIFT_SEASON_PREVIEW: 'on', NODE_ENV: 'production' }, off), null);
    assert.strictEqual(currentGiftSeason({}, off), null);
  });

  it('codes are easy to read and type, and typing mistakes in spacing or case still match', () => {
    const c = makeGiftCode();
    assert.match(c, /^WZ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    assert.strictEqual(normalizeGiftCode(c.toLowerCase().replace(/-/g, ' ')), c);
    assert.strictEqual(normalizeGiftCode('7KQ4M9TP'), 'WZ-7KQ4-M9TP');
    assert.strictEqual(normalizeGiftCode('WZ-0000-1111'), null, '0 and 1 are never used');
    assert.strictEqual(normalizeGiftCode('nope'), null);
  });

  it('a gift is locked until redeemed; normal packages are never locked', () => {
    assert.strictEqual(giftLocked({ gift: { code: 'x', redeemed_at: null } }), true);
    assert.strictEqual(giftLocked({ gift: { code: 'x', redeemed_at: '2026-11-01' } }), false);
    assert.strictEqual(giftLocked({ hourly_rate: 9 }), false);
    assert.strictEqual(giftLocked(null), false);
    assert.strictEqual(cleanGiftText('  Eid   Mubarak  ', 60), 'Eid Mubarak');
    assert.strictEqual(cleanGiftText('x'.repeat(400), 300)!.length, 300);
  });

  it('the share message names the season, the lessons and the code', () => {
    const t = giftShareText({ purchasedQuantity: 8, code: 'WZ-AAAA-BBBB', toName: 'Sara', message: null, season: 'eid-fitr' }, false, 'https://watazawwado.academy');
    assert.match(t, /Sara, Eid al-Fitr gift: 8 lessons/);
    assert.match(t, /student\/wallet and enter the code: WZ-AAAA-BBBB/);
  });

  it('the server keeps gifts out of the usable packages and blocks booking with them', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.match(api, /if \(giftLocked\(entitlement\.metadata\)\) \{\s*return res\.status\(403\)/);
    assert.match(api, /\.filter\(\(ent: any\) => !giftLocked\(ent\.metadata\)\)/);
    assert.match(api, /const familyDiscount = !asGift &&/);
    const routes = fs.readFileSync('server/routes/gifts.ts', 'utf8');
    assert.match(routes, /\.is\('metadata->gift->>redeemed_at', null\)/, 'one redemption per code');
    assert.match(routes, /purchaser_account_id: accountId,/, 'the receiver becomes the purchaser, so the giver sees nothing after redemption');
  });
});

describe('NX-06 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('redeeming needs sign-in and a well-formed code', async () => {
    const post = (headers: any, body: any) => fetch(`${base}/api/student/gifts/redeem`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    assert.strictEqual((await post({}, { code: 'WZ-AAAA-BBBB' })).status, 401);
    const bad = await post({ Authorization: 'Bearer dev-student-token' }, { code: 'hello' });
    if (bad.status !== 401) assert.strictEqual(bad.status, 400);
    const fake = await post({ Authorization: 'Bearer dev-student-token' }, { code: 'WZ-AAAA-BBBB' });
    if (fake.status !== 401) assert.strictEqual(fake.status, 403, 'a test account without a real id cannot redeem');
  });
});
