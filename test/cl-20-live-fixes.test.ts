import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { isRoomState } from '../src/lib/roomEvents.js';

const src = (f: string) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// The four "found, not fixed" items of docs/classroom/TEST-REPORT.md (live run 2026-11-19).
describe('CL-20 the series opening plays on both screens', () => {
  it('the slide state carries the opening', () => {
    assert.equal(isRoomState({ track: 'zad-kids', number: 1, page: 0, step: 0, opening: true }), true);
    assert.equal(isRoomState({ track: 'zad-kids', number: 1, page: 0, step: 0, opening: 'yes' }), false);
  });

  it("the teacher's player reports the opening and the learner's follows it instead of closing it", () => {
    const p = src('src/curriculum/LessonPlayer.tsx');
    assert.match(p, /onPosition\?\.\(page, step, opening\)/);
    assert.match(p, /setOpening\(Boolean\(follow\.opening && lesson\.opening\)\)/);
    assert.ok(!/setOpening\(false\);\r?\n  \}, \[follow/.test(p));
    const c = src('src/classroom/parts/Curriculum.tsx');
    assert.match(c, /opening: state\.opening/);
    assert.match(c, /\(p: number, step: number, opening: boolean\)/);
  });
});

describe("CL-20 the learner's room player has no slide controls", () => {
  it('in follow mode: no tool rail, no back/next, no swipe and no shortcuts, on every screen size', () => {
    const p = src('src/curriculum/LessonPlayer.tsx');
    assert.match(p, /const following = !teacher && follow != null;/);
    assert.match(p, /\{following \? null : fullscreen \? \(/);
    assert.match(p, /\$\{opening \|\| following \? 'hidden' : ''\}/);
    assert.match(p, /if \(following \|\| opening \|\| e\.pointerType/);
    assert.match(p, /const onKey = \(e: KeyboardEvent\) => \{\r?\n      if \(following\) return;/);
  });
});
