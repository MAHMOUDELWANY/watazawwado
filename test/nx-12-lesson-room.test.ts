import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { roomKey } from '../server/routes/lessonRoom.js';
import { isRoomState } from '../src/lib/lessonRoom.js';

describe('NX-12 lesson room', () => {
  it('each lesson gets its own unguessable key, stable for that lesson', () => {
    const a = roomKey('4049fa58-7428-44e4-926b-5e3eb315c5cb', 's3cret');
    assert.strictEqual(a, roomKey('4049fa58-7428-44e4-926b-5e3eb315c5cb', 's3cret'));
    assert.notStrictEqual(a, roomKey('5049fa58-7428-44e4-926b-5e3eb315c5cb', 's3cret'));
    assert.notStrictEqual(a, roomKey('4049fa58-7428-44e4-926b-5e3eb315c5cb', 'other'));
    assert.match(a, /^[0-9a-f]{40}$/);
  });

  it('only a lesson position is accepted from the channel', () => {
    assert.strictEqual(isRoomState({ track: 'zad-kids', number: 1, page: 2, step: 3 }), true);
    for (const bad of [null, {}, { track: 'x', number: 1, page: -1, step: 0 }, { track: 'x', number: 1.5, page: 0, step: 0 }, { track: 'x'.repeat(80), number: 1, page: 0, step: 0 }, { track: 1, number: 1, page: 0, step: 0 }]) {
      assert.strictEqual(isRoomState(bad), false, JSON.stringify(bad));
    }
  });

  it('the room uses its own public-key client, never the user token', () => {
    assert.match(fs.readFileSync('src/lib/lessonRoom.ts', 'utf8'), /lessonRoomClient\(\)/);
    assert.match(fs.readFileSync('src/lib/supabase.ts', 'utf8'), /persistSession: false, autoRefreshToken: false/);
  });
});

describe('NX-12 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('the key needs sign-in', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    assert.strictEqual((await fetch(`${base}/api/student/lesson-room/${id}`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/dashboard/lesson-room/${id}`)).status, 401);
  });
});
