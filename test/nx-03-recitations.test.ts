import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import app from '../api/index.js';
import { newRecordingPath, pathBelongsTo, purgeOldRecitations, RETENTION_DAYS } from '../server/routes/recitations.js';
import { pickMime } from '../src/student/components/RecitationRecorder.js';

const L = '11111111-2222-3333-4444-555555555555';

describe('NX-03 recitation recordings', () => {
  it('a recording lives under its learner, audio only', () => {
    const p = newRecordingPath(L, 'audio/webm;codecs=opus')!;
    assert.match(p, new RegExp(`^${L}/[0-9a-f-]{36}\.webm$`));
    assert.strictEqual(pathBelongsTo(p, L), true);
    assert.strictEqual(pathBelongsTo(p, '22222222-2222-3333-4444-555555555555'), false, 'another learner cannot claim it');
    assert.strictEqual(pathBelongsTo(`${L}/../x.webm`, L), false);
    assert.strictEqual(newRecordingPath(L, 'audio/mp4')!.endsWith('.m4a'), true);
    assert.strictEqual(newRecordingPath(L, 'text/html'), null);
    assert.strictEqual(newRecordingPath('not-a-uuid', 'audio/webm'), null);
  });

  it('the recorder picks a format the browser supports (Safari: mp4)', () => {
    assert.strictEqual(pickMime((t) => t === 'audio/mp4'), 'audio/mp4');
    assert.strictEqual(pickMime((t) => t.startsWith('audio/webm')), 'audio/webm;codecs=opus');
    assert.strictEqual(pickMime(() => false), null);
  });

  it('recordings older than 30 days are deleted, audio first', async () => {
    assert.strictEqual(RETENTION_DAYS, 30);
    const removed: string[][] = []; const deleted: string[][] = [];
    const q: any = { select: () => q, lt: () => q, limit: async () => ({ data: [{ id: 'r1', storage_path: `${L}/a.webm` }] }), delete: () => ({ in: async (_c: string, ids: string[]) => { deleted.push(ids); return {}; } }) };
    const client = { from: () => q, storage: { from: () => ({ remove: async (paths: string[]) => { removed.push(paths); return { error: null }; } }) } };
    assert.strictEqual(await purgeOldRecitations(client, DateTime.utc()), 1);
    assert.deepStrictEqual(removed, [[`${L}/a.webm`]]);
    assert.deepStrictEqual(deleted, [['r1']]);
  });

  it('the bucket is private and the table server-only', () => {
    const sql = fs.readFileSync('supabase/migrations/20261101000004_recitation_recordings.sql', 'utf8');
    assert.match(sql, /'recitations', 'recitations', false/);
    assert.match(sql, /REVOKE ALL ON public\.recitation_recordings FROM anon, authenticated/);
    assert.doesNotMatch(sql, /ON storage\.objects/, 'no storage policies: browsers never touch the bucket directly');
  });
});

describe('NX-03 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('guests get nothing', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/recitations`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/recitations/upload-url`, { method: 'POST' })).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/students/${L}/recitations`)).status, 401);
  });
});
