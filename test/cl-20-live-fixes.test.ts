import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { isRoomEvent, isRoomState } from '../src/lib/roomEvents.js';
import { blameSide, classifyLink } from '../src/classroom/engine/quality.js';
import type { LinkStats } from '../src/classroom/engine/types.js';

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

describe('CL-20 a starved link with no loss is flagged on the right side', () => {
  // Live run scenario 12: the learner's video capped at 40 kbps reached the teacher at 1-2 frames a second, no loss.
  const clean = (extra: Partial<LinkStats> = {}): LinkStats => ({ outLossPct: 0, inLossPct: 0, availableInKbps: 650, availableOutKbps: 3700, rttMs: 30, ...extra });
  const learner = clean({ outFps: 2, inFps: 24 });
  const teacher = clean({ outFps: 24, inFps: 2 });

  it('the starved sender sees its own link as poor; few frames sent but not none is weak', () => {
    assert.equal(classifyLink(learner), 'poor');
    assert.equal(classifyLink(clean({ outFps: 8 })), 'weak');
    assert.equal(classifyLink(clean({ outFps: 24, inFps: 24 })), 'good');
    // the receiver's own link is not marked for what its sender cannot send
    assert.equal(classifyLink(teacher), 'good');
  });

  it("blame lands on the starved sender: 'me' for the learner, 'them' for the teacher", () => {
    assert.equal(blameSide(learner, teacher), 'me');
    assert.equal(blameSide(teacher, learner), 'them');
  });

  it("a receiver that gets few frames while the sender sends plenty has the weak downlink", () => {
    const slowDown = clean({ outFps: 24, inFps: 2 });
    const fineSender = clean({ outFps: 24, inFps: 24 });
    assert.equal(blameSide(slowDown, fineSender), 'me');
    assert.equal(blameSide(fineSender, slowDown), 'them');
  });

  it('a camera that is off reports no frame rate (-1), so it is never called weak', () => {
    const off = clean({ outFps: -1, inFps: 24 });
    assert.equal(classifyLink(off), 'good');
    assert.equal(blameSide(off, clean({ outFps: 24, inFps: -1 })), 'unknown');
    // older clients send no frame rate at all
    assert.equal(blameSide(clean(), clean()), 'unknown');
  });

  it('long delay or heavy jitter counts too, and the early incoming estimate alone still does not', () => {
    assert.equal(classifyLink(clean({ jitterMs: 80 })), 'weak');
    assert.equal(classifyLink(clean({ jitterMs: 200 })), 'poor');
    assert.equal(classifyLink(clean({ rttMs: 700 })), 'poor');
    assert.equal(classifyLink(clean({ availableInKbps: 90 })), 'good');
  });

  it('the stats event accepts the frame rates and jitter, and still refuses unknown keys', () => {
    const base = { outLossPct: 0, inLossPct: 0, availableInKbps: -1, availableOutKbps: -1, rttMs: 20 };
    const q = (stats: unknown) => isRoomEvent({ t: 'quality', side: 'student', layer: 'b', link: 'good', stats });
    assert.equal(q(base), true);
    assert.equal(q({ ...base, outFps: 2, inFps: 24, jitterMs: 12 }), true);
    assert.equal(q({ ...base, outFps: 'x' }), false);
    assert.equal(q({ ...base, extra: 1 }), false);
  });

  it('the engine measures the frame rates, and only for a camera that is on', () => {
    const e = src('src/classroom/engine/cloudflareEngine.ts');
    assert.match(e, /framesPerSecond/);
    assert.match(e, /framesDecoded/);
    assert.match(e, /videoSender\?\.track\?\.enabled/);
  });
});
