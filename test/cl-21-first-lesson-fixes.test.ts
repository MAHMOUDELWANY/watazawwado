import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { isChildRoute } from '../server/routes/childDevices.js';
import { startingLesson } from '../src/classroom/parts/Curriculum.js';

// Fixes from the owner's first real lesson, 2026-11-19 (docs/classroom/AUDIT-2026-11-20.md, A1, A3, A6).
describe('CL-21 first real lesson fixes', () => {
  it('A1: the site allows camera, mic and screen share for itself', () => {
    const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const policy = cfg.headers.flatMap((h: any) => h.headers).find((h: any) => h.key === 'Permissions-Policy')?.value || '';
    for (const p of ['camera=(self)', 'microphone=(self)', 'display-capture=(self)']) assert.ok(policy.includes(p), `${p} in ${policy}`);
    assert.ok(!policy.includes('camera=()'));
  });

  it("A3: a child's own phone may enter the lesson room, and still cannot watch or call other routes", () => {
    assert.ok(isChildRoute('GET', '/api/student/classroom/18bcf800-b298-4a4e-a5cd-3c2a73426403/enter'));
    assert.ok(!isChildRoute('GET', '/api/dashboard/classroom/18bcf800/enter'));
    assert.ok(!isChildRoute('POST', '/api/student/classroom/18bcf800/enter'));
  });

  const tracks = [
    { id: 'fusha-kids', group: 'fusha', lessons: { 1: {}, 2: {} } },
    { id: 'fusha-12', group: 'fusha', lessons: { 3: {}, 1: {} } },
    { id: 'zad-kids', group: 'zad-essentials', lessons: { 1: {} } },
  ];

  it('A6: a first lesson opens lesson 1 of the booked subject, kids version for a child', () => {
    assert.deepStrictEqual(startingLesson(tracks, undefined, { serviceId: 'modern-standard-arabic', learnerType: 'adult', lastReport: null }), { track: 'fusha-12', number: 1, page: 0 });
    assert.deepStrictEqual(startingLesson(tracks, undefined, { serviceId: 'modern-standard-arabic', learnerType: 'child', lastReport: null }), { track: 'fusha-kids', number: 1, page: 0 });
  });

  it('A6: a returning learner opens where the last report stopped; a rejoin opens the saved slide', () => {
    const last = { track: 'fusha-kids', number: 2, page: 7 };
    assert.deepStrictEqual(startingLesson(tracks, undefined, { serviceId: 'modern-standard-arabic', learnerType: 'child', lastReport: last }), last);
    const saved = { track: 'zad-kids', number: 1, page: 3, step: 1 } as any;
    assert.deepStrictEqual(startingLesson(tracks, saved, { serviceId: 'modern-standard-arabic', learnerType: 'child', lastReport: last }), { track: 'zad-kids', number: 1, page: 3 });
  });

  it('A6: a service with no curriculum opens nothing in particular', () => {
    assert.strictEqual(startingLesson(tracks, undefined, { serviceId: 'fiqh', learnerType: 'adult', lastReport: null }), null);
  });
});
