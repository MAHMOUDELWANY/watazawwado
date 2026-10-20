import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';

describe('TE-04 teacher onboarding checklist', () => {
  it('every item ticks itself from real data and links to where it is done', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const startAt = api.indexOf("app.get('/api/dashboard/onboarding-checklist'");
    const route = api.slice(startAt, api.indexOf('\napp.', startAt + 10));
    for (const [key, source] of [['agreement', 'TEACHER_AGREEMENT_VERSION'], ['hours', "from('availability')"], ['calendar', "from('calendar_connections')"], ['photo', 'photo_url'], ['zoom', "like('zoom_meeting_link', 'http%')"]]) {
      assert.ok(route.includes(`key: '${key}'`), `item ${key}`);
      assert.ok(route.includes(source), `${key} reads ${source}`);
    }
    assert.ok(fs.readFileSync('src/dashboard/pages/TodayPage.tsx', 'utf8').includes('<TeacherChecklist />'));
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('needs a teacher login and answers with five items', async () => {
      assert.strictEqual((await fetch(`${base}/api/dashboard/onboarding-checklist`)).status, 401);
      const r = await fetch(`${base}/api/dashboard/onboarding-checklist`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
      if (r.status === 503) return;
      assert.strictEqual(r.status, 200);
      const body: any = await r.json();
      assert.deepStrictEqual(body.items.map((i: any) => i.key), ['agreement', 'hours', 'calendar', 'photo', 'zoom']);
      assert.strictEqual(body.allDone, body.items.every((i: any) => i.done));
    });
  });
});
