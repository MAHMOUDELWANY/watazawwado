import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { boardPayload } from '../src/classroom/board/Board.js';
import { MAX_BOARD_BYTES } from '../src/lib/roomEvents.js';

const el = (id: string, version: number, extra: Record<string, unknown> = {}) => ({ id, version, ...extra });
const src = (f: string) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('CL-17 board sync (H5)', () => {
  it('sends only elements changed since the last send', () => {
    const sent = new Map([['a', 1], ['b', 2]]);
    const p = boardPayload([el('a', 1), el('b', 3), el('c', 1)], sent, 3);
    assert.deepStrictEqual(p.delta.map((e) => e.id), ['b', 'c']);
    assert.deepStrictEqual(p.scene.map((e) => e.id), ['a', 'b', 'c']);
  });

  it('a deletion goes out once as a tombstone and is pruned from the saved scene', () => {
    const sent = new Map([['a', 1], ['b', 1]]);
    const p = boardPayload([el('a', 1), el('b', 2, { isDeleted: true }), el('never-sent', 2, { isDeleted: true })], sent, 2);
    assert.deepStrictEqual(p.delta.map((e) => e.id), ['b']);
    assert.deepStrictEqual(p.scene.map((e) => e.id), ['a']);
  });

  it('sceneVersion never goes down even when pruning lowers the version sum', () => {
    assert.strictEqual(boardPayload([el('a', 1)], new Map(), 40).sceneVersion, 41);
    assert.strictEqual(boardPayload([el('a', 50)], new Map(), 40).sceneVersion, 50);
  });

  it("a scene over the cap is 'full' instead of being dropped silently", () => {
    const big = el('t', 1, { text: 'x'.repeat(MAX_BOARD_BYTES) });
    assert.strictEqual(boardPayload([big], new Map(), 0).full, true);
    assert.strictEqual(boardPayload([el('a', 1)], new Map(), 0).full, false);
  });

  it('the board shows the full notice, turns the image tool off and refuses pasted images', () => {
    const b = src('src/classroom/board/Board.tsx');
    assert.match(b, /The board is full/);
    assert.match(b, /tools: \{ image: false \}/);
    assert.match(b, /onPaste=\{onPaste\}/);
    assert.ok(!/shortcut: a board past the size cap is not sent/.test(b));
  });
});

describe('CL-17 realtime message rates (H6)', () => {
  it('pointer at 150-200 ms and only inside the content; ink at 150 ms', () => {
    const ms = (f: string, name: string) => Number(new RegExp(`${name} = (\\d+)`).exec(src(f))![1]);
    const pointer = ms('src/classroom/parts/Pointer.tsx', 'SEND_EVERY_MS');
    assert.ok(pointer >= 150 && pointer <= 200, String(pointer));
    assert.strictEqual(ms('src/lib/lessonRoom.ts', 'INK_EVERY_MS'), 150);
    // The throttle slot is taken only by a position inside the box.
    const p = src('src/classroom/parts/Pointer.tsx');
    assert.ok(p.indexOf('x > SCALE') < p.indexOf('last.current = now'));
  });
});
