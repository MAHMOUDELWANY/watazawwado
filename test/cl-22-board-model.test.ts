import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  BOARD_COLORS, SEND_EVERY_MS, boardPayload, bounds, createHistory, createPump, fitRect, hits, isRtl, keepScene,
  simplify, topHit, translate, type BoardEl,
} from '../src/classroom/board/model.js';
import { readFileSync } from 'node:fs';
import { MAX_BOARD_BYTES, isRoomEvent } from '../src/lib/roomEvents.js';

const stroke = (id: string, pts: number[], extra: Partial<BoardEl> = {}) =>
  ({ id, version: 1, type: 'stroke', tool: 'pen', color: '#1E1410', pts, ...extra }) as BoardEl;

describe('CL-22 board model (2.7)', () => {
  it('palette is ours: no green', () => {
    for (const c of BOARD_COLORS) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
      assert.ok(!(g > r && g > b), `${c} reads as green`);
    }
  });

  it('simplify keeps the ends and drops points on a straight line', () => {
    const line = [0, 0, 1, 0, 2, 0, 3, 0, 4, 0];
    assert.deepStrictEqual(simplify(line), [0, 0, 4, 0]);
    const corner = [0, 0, 5, 0, 10, 0, 10, 5, 10, 10];
    assert.deepStrictEqual(simplify(corner), [0, 0, 10, 0, 10, 10]);
  });

  it('the stroke eraser hits strokes, shape edges and text boxes, not empty space', () => {
    const s = stroke('s', [0, 0, 100, 0]);
    assert.ok(hits(s, 50, 5, 4));
    assert.ok(!hits(s, 50, 30, 4));
    const rect = { id: 'r', version: 1, type: 'rect', color: '#000', pts: [0, 0, 100, 100] } as BoardEl;
    assert.ok(hits(rect, 100, 50, 3));
    assert.ok(!hits(rect, 50, 50, 3), 'inside an empty rectangle is not its edge');
    const ell = { id: 'e', version: 1, type: 'ellipse', color: '#000', pts: [0, 0, 200, 100] } as BoardEl;
    assert.ok(hits(ell, 200, 50, 3));
    assert.ok(!hits(ell, 100, 50, 3));
    const text = { id: 't', version: 1, type: 'text', color: '#000', pts: [500, 100], text: 'سلام', size: 32 } as BoardEl;
    const b = bounds(text);
    assert.ok(b.x < 500 && b.x + b.w === 500, 'Arabic text grows to the left of where it was placed');
    assert.ok(hits(text, 480, 110, 0));
    assert.ok(!hits({ id: 'l', version: 1, type: 'laser', pts: [0, 0] } as BoardEl, 0, 0, 10));
  });

  it('topHit picks the newest live element on the current page only', () => {
    const els = [stroke('a', [0, 0, 100, 0]), stroke('b', [0, 0, 100, 0]), stroke('c', [0, 0, 100, 0], { page: 2 }), stroke('d', [0, 0, 100, 0], { isDeleted: true })];
    assert.strictEqual(topHit(els, 1, 50, 0, 2)?.id, 'b');
    assert.strictEqual(topHit(els, 2, 50, 0, 2)?.id, 'c');
  });

  it('isRtl follows the first letter', () => {
    assert.ok(isRtl('بِسْمِ اللَّهِ'));
    assert.ok(isRtl('1. كتاب'));
    assert.ok(!isRtl('book كتاب'));
  });

  it('translate moves every point', () => {
    assert.deepStrictEqual(translate(stroke('a', [0, 0, 10, 10]), 5, -2).pts, [5, -2, 15, 8]);
  });

  it('fitRect letterboxes the board into its box', () => {
    assert.deepStrictEqual(fitRect(1600, 1000, 16 / 9), { x: 0, y: 50, w: 1600, h: 900 });
    assert.deepStrictEqual(fitRect(800, 900, 16 / 9), { x: 0, y: 225, w: 800, h: 450 });
  });

  it('undo removes what I drew, redo brings it back, each as a newer version', () => {
    const h = createHistory();
    const store = new Map<string, BoardEl>();
    const a = stroke('a', [0, 0, 1, 1]);
    store.set('a', a);
    h.record([{ before: null, after: a }]);
    const [u] = h.undo((id) => store.get(id));
    assert.strictEqual(u.isDeleted, true);
    assert.ok(u.version > a.version);
    store.set('a', u);
    const [r] = h.redo((id) => store.get(id));
    assert.ok(!r.isDeleted && r.version > u.version);
    assert.strictEqual(h.canRedo, false);
  });

  it('undo of a move puts the element back', () => {
    const h = createHistory();
    const a = stroke('a', [0, 0, 1, 1]);
    const moved = { ...translate(a, 10, 10), version: 2 };
    h.record([{ before: a, after: moved }]);
    const [u] = h.undo(() => moved);
    assert.deepStrictEqual(u.pts, [0, 0, 1, 1]);
    assert.strictEqual(u.version, 3);
  });

  it('lasers travel live but are never saved', () => {
    const laser = { id: 'L', version: 4, type: 'laser', pts: [1, 1] } as BoardEl;
    const p = boardPayload([stroke('a', [0, 0]), laser], new Map(), 0);
    assert.deepStrictEqual(p.delta.map((e) => e.id), ['a', 'L']);
    assert.deepStrictEqual(p.scene.map((e) => e.id), ['a']);
    assert.deepStrictEqual(keepScene(undefined, { sceneVersion: 1, elements: [laser] }).elements, []);
  });

  it('the teacher page travels with the scene', () => {
    const s = keepScene(undefined, { sceneVersion: 1, elements: [], page: 3 });
    assert.strictEqual(s.page, 3);
    assert.strictEqual(keepScene(s, { sceneVersion: 2, elements: [] }).page, 3);
  });

  it('a whiteboard of 160 long pen strokes (each a 300-point loop) still fits the 200 kB save (H5)', () => {
    const els: BoardEl[] = [];
    for (let i = 0; i < 160; i++) {
      const pts: number[] = [];
      for (let j = 0; j < 300; j++) pts.push(Math.round(500 + 400 * Math.cos(j / 20 + i)), Math.round(280 + 250 * Math.sin(j / 13 + i)));
      els.push(stroke(`s${i}`, simplify(pts), { page: 1 + (i % 3) }));
    }
    const p = boardPayload(els, new Map(), 0);
    assert.strictEqual(p.full, false, `scene is ${JSON.stringify(p.scene).length} bytes`);
    assert.ok(JSON.stringify(p.scene).length < MAX_BOARD_BYTES);
  });
});

describe('CL-22 send pump (H6)', () => {
  const fake = () => {
    let t = 0;
    const timers = new Map<number, { at: number; fn: () => void }>();
    let n = 0;
    return {
      clock: { now: () => t, set: (fn: () => void, ms: number) => { timers.set(++n, { at: t + ms, fn }); return n; }, clear: (id: unknown) => { timers.delete(id as number); } },
      advance(ms: number) {
        t += ms;
        for (const [id, x] of [...timers]) if (x.at <= t) { timers.delete(id); x.fn(); }
      },
    };
  };

  it('sends at once, then at most once per window, and the last change always goes', () => {
    const f = fake();
    let sent = 0;
    const p = createPump(SEND_EVERY_MS, () => sent++, f.clock);
    p.kick();
    assert.strictEqual(sent, 1);
    // 60 pointer moves over one second (a 60 Hz pen)
    for (let i = 0; i < 60; i++) { f.advance(1000 / 60); p.kick(); }
    f.advance(SEND_EVERY_MS);
    assert.ok(sent <= Math.ceil(1000 / SEND_EVERY_MS) + 2, `sent ${sent} messages in a second`);
    const before = sent;
    p.kick();
    f.advance(SEND_EVERY_MS);
    assert.strictEqual(sent, before + 1);
  });

  it('flush sends what is waiting now; stop drops it', () => {
    const f = fake();
    let sent = 0;
    const p = createPump(SEND_EVERY_MS, () => sent++, f.clock);
    p.kick(); p.kick();
    assert.strictEqual(sent, 1);
    p.flush();
    assert.strictEqual(sent, 2);
    p.kick(); p.stop(); f.advance(1000);
    assert.strictEqual(sent, 2);
  });

  it('two sides drawing stay far under the Realtime limit', () => {
    assert.ok(2 * (1000 / SEND_EVERY_MS) < 15);
  });
});

describe('CL-22 board wiring (2.7)', () => {
  const src = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

  it('the whiteboard page travels on board events and is kept in the save', () => {
    assert.ok(isRoomEvent({ t: 'board', sceneVersion: 1, elements: [], page: 2 }));
    assert.ok(!isRoomEvent({ t: 'board', sceneVersion: 1, elements: [], page: 0 }));
    assert.ok(!isRoomEvent({ t: 'board', sceneVersion: 1, elements: [], page: 1.5 }));
    assert.match(src('server/routes/classroom.ts'), /t\.role === 'teacher' \? e\.page : /);
    assert.match(src('src/classroom/ClassroomPage.tsx'), /learnerDraw: learnerDraw\.current, page: scene\?\.page/);
  });

  it('pictures are written on by the board itself, PDF pages by the transparent board; the page wheel scrolls', () => {
    const page = src('src/classroom/ClassroomPage.tsx');
    assert.match(page, /sync=\{board\} image=\{pdf\.url\}/);
    assert.match(page, /sync=\{board\} transparent \/>/);
    assert.ok(!/onWheelCapture/.test(src('src/classroom/board/PdfPages.tsx')));
  });

  it('draws in requestAnimationFrame from native pointer listeners with coalesced points', () => {
    const b = src('src/classroom/board/Board.tsx');
    assert.match(b, /requestAnimationFrame\(paint\)/);
    assert.match(b, /getCoalescedEvents/);
    assert.match(b, /addEventListener\('pointermove', move\)/);
    assert.match(b, /<ArabicKeyboard \/>/);
    // only the teacher has the laser and clear page; the learner draws only when allowed
    assert.match(b, /teacher \|\| k !== 'laser'/);
    assert.match(b, /const canDraw = teacher \|\| \(role === 'learner' && learnerDraw\);/);
  });
});
