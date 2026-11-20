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

  it('nothing in the classroom records the lesson (RULES: no lesson recording)', () => {
    // 2.10 shadowing (spec §5) is the one exception: a short line of up to 15 s, started by hand, from the mic only.
    const SHADOW = 'src/classroom/tools/Shadowing.tsx'.replace(/\//g, path.sep);
    for (const f of walk('src/classroom')) if (!f.endsWith(SHADOW)) assert.doesNotMatch(read(f), /MediaRecorder/, f);
    const shadow = read('src/classroom/tools/Shadowing.tsx');
    assert.match(shadow, /SHADOW_MAX_MS = 15_000/);
    assert.match(shadow, /new MediaStream\(\[copy\]\)/, 'records one microphone track, never the call or the camera');
    // The learner's repeat stays on the device: the learner's card never uploads.
    assert.doesNotMatch(shadow.slice(shadow.indexOf('export function LearnerShadow')), /upload/i);
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

  it('quality totals count only time this side is to blame (its own uplink), with the layer the other side receives (M4)', () => {
    const src = read('src/classroom/ClassroomPage.tsx');
    assert.match(src, /const blame = blameSide\(s, remoteStats\.current\);\s*setBlame\(blame\);/);
    assert.match(src, /if \(blame === 'me'\) addQualityStep\(totals\.current, remoteLayer\.current, STATS_EVERY_MS \/ 1000\);/);
  });

  it('room events: recitation, layout pane and quality stats are checked', () => {
    assert.strictEqual(isRoomEvent({ t: 'recitation', on: true }), true);
    assert.strictEqual(isRoomEvent({ t: 'recitation', on: 'yes' }), false);
    assert.strictEqual(isRoomEvent({ t: 'layout', mode: 'content', pane: 'board' }), true);
    assert.strictEqual(isRoomEvent({ t: 'layout', mode: 'content', pane: 'video' }), false);
    const stats = { outLossPct: 1, inLossPct: 0, availableInKbps: 900, availableOutKbps: -1, rttMs: 80 };
    assert.strictEqual(isRoomEvent({ t: 'quality', side: 'student', layer: 'b', link: 'good', stats }), true);
    assert.strictEqual(isRoomEvent({ t: 'quality', side: 'student', layer: 'b', link: 'good', stats: { ...stats, rttMs: 'x' } }), false);
    assert.strictEqual(isRoomEvent({ t: 'quality', side: 'student', layer: 'b', link: 'good', stats: { ...stats, extra: 1 } }), false);
  });
});
