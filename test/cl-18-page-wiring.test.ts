import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { addQualityStep, clockOffsetMs, readRoomAnswer, subscribeRetryMs, SUBSCRIBE_RETRY_MAX_MS, type QualityTotals } from '../src/classroom/roomWiring.js';
import { CONNECT_TIMEOUT_MS, createFallbackDetector } from '../src/classroom/engine/fallbackDetector.js';

const page = fs.readFileSync('src/classroom/ClassroomPage.tsx', 'utf8');

describe('CL-18 room page wiring (review 2026-11-18)', () => {
  it('H2: subscribe retries back off 1 s, 2 s, 4 s ... up to 15 s', () => {
    assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 9].map(subscribeRetryMs), [1000, 2000, 4000, 8000, 15_000, 15_000, 15_000]);
    assert.strictEqual(SUBSCRIBE_RETRY_MAX_MS, 15_000);
    assert.match(page, /subscribeRetryMs\(retry\.n\+\+\)/);
    assert.match(page, /wanted\.current\[side\] === subscribed\.current\[side\]\) return;\s+retry\.timer = window\.setTimeout/);
  });

  it('M5: the clock offset uses the midpoint of the request', () => {
    assert.strictEqual(clockOffsetMs(10_500, 1000, 2000), 9000);
    assert.strictEqual(clockOffsetMs(1000, 1000, 1000), 0);
    assert.match(page, /const serverNow = now \+ skew/);
    assert.match(page, /serverNow >= hardCloseMs/);
  });

  it('M6/B1: answers map to over reasons, superseded, or open', () => {
    for (const reason of ['cancelled', 'moved', 'reassigned', 'closed', 'ended']) {
      assert.deepStrictEqual(readRoomAnswer(423, { ended: true, reason }), { kind: 'over', reason });
    }
    assert.deepStrictEqual(readRoomAnswer(409, { ended: true, reason: 'weird' }), { kind: 'over', reason: 'closed' });
    assert.deepStrictEqual(readRoomAnswer(409, { superseded: true }), { kind: 'superseded' });
    assert.deepStrictEqual(readRoomAnswer(401, {}), { kind: 'over', reason: 'closed' });
    assert.deepStrictEqual(readRoomAnswer(200, { snapshot: {}, remainingMs: 5, serverNow: 42 }), { kind: 'open', serverNow: 42 });
    // The end call's own 200 { ended: true } is success, not "the room is over".
    assert.deepStrictEqual(readRoomAnswer(200, { ended: true }), { kind: 'open', serverNow: null });
    assert.deepStrictEqual(readRoomAnswer(502, {}), { kind: 'unknown' });
    for (const r of ['cancelled', 'moved', 'reassigned']) assert.match(page, new RegExp(`\\n\\s+${r}: \\{ title: t\\(`));
  });

  it('M4: with my uplink to blame, the layer the other side receives lands on my record', () => {
    const q: QualityTotals = { degradedSeconds: 0, audioOnlySeconds: 0, reconnects: 0, minHeight: null };
    addQualityStep(q, 'a', 3);
    addQualityStep(q, null, 3);
    assert.deepStrictEqual(q, { degradedSeconds: 0, audioOnlySeconds: 0, reconnects: 0, minHeight: 720 });
    addQualityStep(q, 'c', 3);
    addQualityStep(q, 'audio_only', 3);
    assert.deepStrictEqual(q, { degradedSeconds: 6, audioOnlySeconds: 3, reconnects: 0, minHeight: 180 });
    assert.match(page, /if \(blame === 'me'\) addQualityStep\(totals\.current, remoteLayer\.current,/);
  });

  it('M3: the connect clock starts on the first publish or subscribe, and never after media connected', () => {
    let t = 0;
    const timers: Array<{ at: number; fn: () => void }> = [];
    const reports: string[] = [];
    const d = createFallbackDetector({ side: 'student', history: [], report: (k) => reports.push(k), now: () => t,
      setTimer: (fn, ms) => { const x = { at: t + ms, fn }; timers.push(x); return x; },
      clearTimer: (x) => { const i = timers.indexOf(x); if (i >= 0) timers.splice(i, 1); } });
    const advance = (ms: number) => { t += ms; for (const x of [...timers]) if (x.at <= t) { timers.splice(timers.indexOf(x), 1); x.fn(); } };
    advance(5 * CONNECT_TIMEOUT_MS); // waiting for the teacher, nothing armed
    assert.deepStrictEqual(reports, []);
    d.arm(); d.onState('connected'); d.arm(); advance(5 * CONNECT_TIMEOUT_MS);
    assert.deepStrictEqual(reports, []);
    assert.doesNotMatch(page, /detector\.start\(\)/);
    assert.match(page, /detector\.arm\(\); await engine\.publishCamera/);
    assert.match(page, /detectorRef\.current\?\.arm\(\)/);
  });

  it('B1: announce, stats, heartbeat and session replies stop once the room is over; my side elsewhere is checked with the server', () => {
    assert.match(page, /if \(!joined \|\| !room\.connected \|\| over\) return;/);
    assert.match(page, /if \(!joined \|\| over\) return;\s+const picker/);
    assert.match(page, /if \(!joined \|\| observer \|\| over\) return;/);
    assert.match(page, /case 'session': \{\s+if \(overRef\.current\) return;/);
    assert.match(page, /e\.side === mySide\) \{\s+if \(e\.sessionId !== engineRef\.current\?\.sessionId\) void checkState\(\);/);
  });

  it('H3/L4: End lesson posts end before broadcasting; a learner confirms a broadcast end with /state', () => {
    const end = page.slice(page.indexOf('const endLesson'), page.indexOf('const leave ='));
    assert.ok(end.indexOf("roomCall('end'") < end.indexOf("send({ t: 'end' })"));
    assert.match(page, /case 'end':\s+\/\/[^\n]*\s+if \(!isTeacher\) void checkState\(\);/);
  });

  it('M2, M7, H4/L3, L1 and the observer notes are wired', () => {
    assert.match(page, /s === 'connected' && !told && !observer\) \{ told = true; void roomCall\('connected'/);
    assert.match(page, /useEffect\(\(\) => onHello\(shareShown\), \[onHello, shareShown\]\)/);
    assert.match(page, /s\.layout === 'screen' && isTeacher \? 'content' : s\.layout/);
    assert.match(page, /engine\.on\('device'/);
    assert.match(page, /engine\.on\('remote-mute'/);
    assert.match(page, /Waiting for video…/);
    assert.match(page, /e\.persisted\) window\.location\.reload\(\)/);
    assert.match(page, /<ObserverNotes bookingId=\{bookingId\} ticket=\{ticket\} startMs=\{startMs\} onOpenChange=\{setNotesOpen\} \/>/);
    assert.match(page, /notesOpen && 'lg:ps-\[24rem\]'/);
    assert.match(page, /t\(entry\.subjectLabel\.en, entry\.subjectLabel\.ar\)/);
  });
});
