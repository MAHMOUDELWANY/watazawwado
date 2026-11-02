import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { defaultFamilyName, familyKeysReached, learnerKeysReached } from '../server/routes/communityLater.js';
import { newPhotoPath, photoPathBelongsTo } from '../server/routes/honor.js';

const E = '11111111-2222-3333-4444-555555555555';

describe('CM-04 suggestions and family achievements', () => {
  it('suggests rhythm milestones only once they are reached', () => {
    assert.deepStrictEqual(learnerKeysReached(99, 51), []);
    assert.deepStrictEqual(learnerKeysReached(100, 10), ['lessons_100']);
    assert.deepStrictEqual(learnerKeysReached(230, 52), ['lessons_100', 'lessons_200', 'weekly_year']);
  });

  it('a family needs two learners who attended, and counts their lessons together', () => {
    assert.deepStrictEqual(familyKeysReached([150]), [], 'one learner is not a family achievement');
    assert.deepStrictEqual(familyKeysReached([150, 0]), []);
    assert.deepStrictEqual(familyKeysReached([60, 45]), ['family_lessons_100']);
    assert.deepStrictEqual(familyKeysReached([300, 260]), ['family_lessons_100', 'family_lessons_250', 'family_lessons_500']);
  });

  it('the default family name uses the account holder first name only', () => {
    assert.strictEqual(defaultFamilyName('Ahmad Ali Hassan', false), 'The Ahmad family');
    assert.strictEqual(defaultFamilyName('أحمد علي', true), 'أسرة أحمد');
    assert.strictEqual(defaultFamilyName('', true), 'أسرة من أسرنا');
  });

  it('photos are images under their own entry only', () => {
    const p = newPhotoPath(E, 'image/jpeg')!;
    assert.match(p, new RegExp(`^${E}/[0-9a-f-]{36}\\.jpg$`));
    assert.strictEqual(photoPathBelongsTo(p, E), true);
    assert.strictEqual(photoPathBelongsTo(p, '22222222-2222-3333-4444-555555555555'), false);
    assert.strictEqual(photoPathBelongsTo(`${E}/../x.jpg`, E), false);
    assert.strictEqual(newPhotoPath(E, 'image/gif'), null);
    assert.strictEqual(newPhotoPath('nope', 'image/png'), null);
  });

  it('the new data is server-only and the photo bucket is private', () => {
    const sql = fs.readFileSync('supabase/migrations/20261102000004_community_later.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.family_achievements FROM anon, authenticated/);
    assert.match(sql, /'honor-photos', 'honor-photos', false/);
    assert.doesNotMatch(sql, /ON storage\.objects/);
  });
});

describe('CM-04 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('guests get nothing', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/community/family`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/community/honor/${E}/photo-url`, { method: 'POST' })).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/honor/suggestions`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/honor/photos`)).status, 401);
  });
});
