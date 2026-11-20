import { describe, it } from 'node:test';
import assert from 'node:assert';
import { wordAt } from '../src/lib/quran/timing.js';
import { decideSupport, MIN_MEMORY_GB } from '../src/quran/detectorModel.js';
import { isRoomEvent } from '../src/lib/roomEvents.js';

// Timings as /chapter_recitations/7/1?segments=true returns them (al-Fatihah, first two ayat).
const AUDIO = { verses: [
  { key: '1:1', from: 0, to: 6090, words: [[1, 0, 580], [2, 580, 1409], [3, 1409, 2502], [4, 2502, 5840]] as Array<[number, number, number]> },
  { key: '1:2', from: 6090, to: 11680, words: [[1, 6025, 7025], [2, 7025, 7885]] as Array<[number, number, number]> },
] };

describe('CL-43 word highlighting', () => {
  it('finds the word being recited, and the ayah between words', () => {
    assert.deepStrictEqual(wordAt(AUDIO, 600), { verseKey: '1:1', key: '1:1:2' });
    assert.deepStrictEqual(wordAt(AUDIO, 6000), { verseKey: '1:1', key: null });
    assert.deepStrictEqual(wordAt(AUDIO, 7100), { verseKey: '1:2', key: '1:2:2' });
    assert.strictEqual(wordAt(AUDIO, 20000), null);
  });
});

describe('CL-43 detector device check', () => {
  it('runs on WebGPU or WASM, never without WASM, audio decoding or enough memory', () => {
    assert.deepStrictEqual(decideSupport({ wasm: true, audio: true, webgpu: true }), { ok: true, device: 'webgpu' });
    assert.deepStrictEqual(decideSupport({ wasm: true, audio: true, webgpu: false, memoryGb: 8 }), { ok: true, device: 'wasm' });
    assert.deepStrictEqual(decideSupport({ wasm: true, audio: true, webgpu: false, memoryGb: MIN_MEMORY_GB - 2 }), { ok: false, reason: 'memory' });
    assert.deepStrictEqual(decideSupport({ wasm: false, audio: true, webgpu: true }), { ok: false, reason: 'no-wasm' });
    assert.deepStrictEqual(decideSupport({ wasm: true, audio: false, webgpu: true }), { ok: false, reason: 'no-audio' });
  });
});

describe('CL-43 room events', () => {
  it('the mushaf page and pane travel on the room channel; out-of-range pages are refused', () => {
    assert.ok(isRoomEvent({ t: 'quran', page: 1 }));
    assert.ok(isRoomEvent({ t: 'quran', page: 604 }));
    assert.ok(!isRoomEvent({ t: 'quran', page: 0 }));
    assert.ok(!isRoomEvent({ t: 'quran', page: 605 }));
    assert.ok(!isRoomEvent({ t: 'quran', page: 3, marks: [] }));
    assert.ok(isRoomEvent({ t: 'layout', mode: 'content', pane: 'quran' }));
  });
});
