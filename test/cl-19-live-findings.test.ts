import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { isAutoplayBlock } from '../src/classroom/roomWiring.js';
import { classifyLink, createLayerPicker, pickLayer } from '../src/classroom/engine/quality.js';
import type { LinkStats } from '../src/classroom/engine/types.js';

const read = (ain: number, extra: Partial<LinkStats> = {}): LinkStats => ({ outLossPct: 0, inLossPct: 0, availableInKbps: ain, availableOutKbps: 3700, rttMs: 28, ...extra });

// Bugs found by the live two-browser run (docs/classroom/TEST-REPORT.md).
describe('CL-19 live-run findings', () => {
  it('only a NotAllowedError asks for a tap to hear; a play() interrupted by a new stream does not', () => {
    assert.equal(isAutoplayBlock({ name: 'NotAllowedError' }), true);
    assert.equal(isAutoplayBlock({ name: 'AbortError' }), false);
    assert.equal(isAutoplayBlock(undefined), false);
  });

  // Chrome's availableIncomingBitrate follows what already flows: 347 kbps two seconds after joining, then a plateau
  // near 650-770 kbps while the 360p layer flows (live run 2026-11-19). It is not a limit until the link shows stress.
  it('a low incoming estimate on a clean link (no loss, short delay) does not step down or say poor', () => {
    assert.equal(pickLayer(read(347), 'b'), 'b');
    assert.equal(pickLayer(read(90), 'b'), 'b');
    assert.equal(classifyLink(read(90)), 'good');
  });

  it('the estimate plateau under the top layer does not block the climb to 720p', () => {
    let t = 0;
    const pick = createLayerPicker(undefined, () => t);
    for (; t <= 24_000; t += 3000) pick(read(647));
    assert.equal(pick(read(647)), 'a');
  });

  it('with loss or long delay the estimate counts again', () => {
    assert.equal(pickLayer(read(300, { inLossPct: 3 }), 'a'), 'c');
    assert.equal(pickLayer(read(100, { rttMs: 350 }), 'b'), 'audio_only');
    assert.equal(classifyLink(read(100, { inLossPct: 3 })), 'poor');
  });

  it("Zad's tour never opens over the late-reason gate", () => {
    const app = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');
    assert.match(app, /<LateReasonGate onPendingChange=\{setLateGateUp\} \/>/);
    assert.match(app, /if \(showWelcome \|\| lateGateUp\) return;/);
    assert.match(app, /isOpen=\{showGlobalTour && !lateGateUp\}/);
    assert.match(fs.readFileSync('src/dashboard/components/LateReasonGate.tsx', 'utf8'), /onPendingChange\?\.\(pending\.length > 0\)/);
  });

  it('a room that cannot open on our side (blocked network, media service down) reports an incident for the Zoom fallback', () => {
    const page = fs.readFileSync('src/classroom/ClassroomPage.tsx', 'utf8');
    assert.match(page, /detector\.onError\(\{ code: typeof e\?\.code === 'string' \? e\.code : 'join_failed'/);
  });

  it('a media call that hears "ended" asks the server why, so a cancelled lesson says cancelled (not "time is over")', () => {
    const page = fs.readFileSync('src/classroom/ClassroomPage.tsx', 'utf8');
    assert.match(page, /else if \(s === 'ended'\) void checkState\(\)\.finally\(\(\) => setOver\(\(o\) => o \?\? 'closed'\)\);/);
  });
});
