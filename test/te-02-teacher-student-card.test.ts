import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app, { getSupabaseAdminClient } from '../api/index.js';

const DEV_TEACHER_ID = '9cd86044-eb13-4547-88e4-567c4f6a57d8';
/** Any key that would carry money. */
const MONEY_KEY = /fee|price|amount|payment|paid|refund|currency|usd|stripe|invoice/i;

function moneyKeys(value: unknown, path = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => [
    ...(MONEY_KEY.test(k) ? [`${path}${k}`] : []),
    ...moneyKeys(v, `${path}${k}.`)
  ]);
}

describe('TE-02 student card for teachers', () => {
  it('the card shows goals, placement, milestones, lesson history and a chat shortcut', () => {
    const page = fs.readFileSync('src/dashboard/pages/StudentDetailPage.tsx', 'utf8');
    for (const s of ['goals', 'studentDetail.placement', 'studentDetail.milestones', "t('Lesson history', 'سجل الحصص')", '/dashboard/messages?thread=${studentDetail.chat_thread_id}']) {
      assert.ok(page.includes(s), `missing ${s}`);
    }
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('a teacher sees no money anywhere in the student view', async (t) => {
      const db = getSupabaseAdminClient();
      if (!db) return t.skip('no database');
      const { data } = await db.from('students').select('id').eq('assigned_teacher_id', DEV_TEACHER_ID).limit(1);
      const studentId = data?.[0]?.id;
      if (!studentId) return t.skip('no student assigned to the dev teacher');
      const r = await fetch(`${base}/api/dashboard/students/${studentId}`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
      assert.strictEqual(r.status, 200);
      const body = await r.json();
      assert.deepStrictEqual(moneyKeys(body), [], 'money fields reached a teacher');
      assert.ok('placement' in body && 'chat_thread_id' in body);
    });
  });
});
