import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { isRoomEvent } from '../src/lib/roomEvents.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));

describe('CL-09 room screen', () => {
  it('the learner timer starts closed', () => {
    const src = read('src/classroom/parts/Timer.tsx');
    assert.match(src, /const \[open, setOpen\] = useState\(false\)/);
  });

  it('the focus warning waits 10 seconds', () => {
    assert.match(read('src/classroom/parts/FocusNotice.tsx'), /export const FOCUS_GRACE_MS = 10_000/);
  });

  it('screen share is offered only where getDisplayMedia exists', () => {
    const src = read('src/classroom/parts/ScreenShare.tsx');
    assert.match(src, /typeof navigator\.mediaDevices\?\.getDisplayMedia === 'function'/);
    assert.match(src, /getDisplayMedia\(\{ video: true, audio: true \}\)/);
  });

  it('nothing in the classroom records', () => {
    for (const f of walk('src/classroom')) assert.doesNotMatch(read(f), /MediaRecorder/, f);
  });

  it('the kid app never offers the observer entry or the guardian mark', () => {
    const kid = read('src/kid/KidApp.tsx');
    assert.match(kid, /<ClassroomGate portal="kid"/);
    assert.doesNotMatch(kid, /observe|GuardianChip/i);
    // The kid app never passes ?observe=1 on to the server (parent mode and the admin dashboard may).
    assert.match(read('src/classroom/ClassroomGate.tsx'), /portal !== 'kid' && search\.get\('observe'\) === '1'/);
    // The chip is drawn for the teacher only.
    assert.match(read('src/classroom/ClassroomPage.tsx'), /isTeacher && guardianHere && <GuardianChip/);
  });

  it('a rejected play() shows a "Tap to hear" control', () => {
    const src = read('src/classroom/parts/VideoTiles.tsx');
    assert.match(src, /\.play\(\)\.catch\(/);
    assert.match(src, /Tap to hear/);
    assert.match(src, /setSinkId/);
  });

  it('the room page is a lazy chunk in all three apps, with the NX-12 page as fallback', () => {
    assert.match(read('src/classroom/ClassroomGate.tsx'), /lazy\(\(\) => import\('\.\/ClassroomPage'\)\)/);
    for (const f of ['src/dashboard/DashboardApp.tsx', 'src/student/StudentApp.tsx', 'src/kid/KidApp.tsx']) {
      const src = read(f);
      assert.match(src, /<ClassroomGate portal="(teacher|student|kid)" fallback=\{</, f);
      assert.doesNotMatch(src, /import ClassroomPage/, f);
    }
  });

  it('room events: recitation, layout pane and quality stats are checked', () => {
    assert.strictEqual(isRoomEvent({ t: 'recitation', on: true }), true);
    assert.strictEqual(isRoomEvent({ t: 'recitation', on: 'yes' }), false);
    assert.strictEqual(isRoomEvent({ t: 'layout', mode: 'content', pane: 'board' }), true);
    assert.strictEqual(isRoomEvent({ t: 'layout', mode: 'content', pane: 'video' }), false);
    const stats = { outLossPct: 1, inLossPct: 0, availableInKbps: 900, availableOutKbps: -1, rttMs: 80 };
    assert.strictEqual(isRoomEvent({ t: 'quality', side: 'student', layer: 'h', link: 'good', stats }), true);
    assert.strictEqual(isRoomEvent({ t: 'quality', side: 'student', layer: 'h', link: 'good', stats: { ...stats, rttMs: 'x' } }), false);
    assert.strictEqual(isRoomEvent({ t: 'quality', side: 'student', layer: 'h', link: 'good', stats: { ...stats, extra: 1 } }), false);
  });
});
