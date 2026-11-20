import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// The browser bits kidMode.tsx touches, before it loads.
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } };
const events: string[] = [];
(globalThis as any).window ??= { dispatchEvent: (e: Event) => { events.push(e.type); return true; }, addEventListener() {}, removeEventListener() {} };

const { readKidMode, setKidMode } = await import('../src/student/kidMode.js');
const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('CL-25 kid mode on the parent\'s device', () => {
  it('turns on and off in this browser, and ignores junk', () => {
    assert.strictEqual(readKidMode(), null);
    setKidMode({ learnerId: 'child-1', name: 'Yusuf' });
    assert.deepStrictEqual(readKidMode(), { learnerId: 'child-1', name: 'Yusuf' });
    assert.ok(events.includes('wz-kid-mode-changed'));
    setKidMode(null);
    assert.strictEqual(readKidMode(), null);
    store.set('wz-kid-mode', '{"learnerId":5}');
    assert.strictEqual(readKidMode(), null);
    store.set('wz-kid-mode', 'not json');
    assert.strictEqual(readKidMode(), null);
  });

  it('in kid mode the portal routes only the kid app\'s page set; everything else goes to the child\'s lessons', () => {
    const app = read('src/student/StudentApp.tsx');
    const start = app.indexOf('<KidModeShell');
    const block = app.slice(start, app.indexOf('</KidModeShell>', start));
    const paths = [...block.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(paths, ['/lessons', '/room/:id', '/curriculum', '/curriculum/:learner/:subject/:number', '/homework', '/progress',
      '/progress/report', '/certificate/:id', '/community', '/placement', '/placement/report/:id', '*']);
    assert.match(block, /<Route path="\*" element=\{<Navigate to="\/student\/lessons" replace \/>\} \/>/);
    assert.doesNotMatch(block, /StudentLessonsPage|Booking|Wallet|ChatPanel|Account|Watch/);
    // Checked before the full family shell is drawn.
    assert.ok(start < app.indexOf('<ActiveLearnerProvider profile={profile}>'));
  });

  it('kid mode hides Watch, never observes, scopes pages to the one child, and leaving needs the PIN', () => {
    assert.match(read('src/student/components/WatchLessonButton.tsx'), /readKidMode\(\)\) return null/);
    assert.match(read('src/classroom/ClassroomGate.tsx'), /!\(portal === 'student' && readKidMode\(\)\)/);
    const km = read('src/student/kidMode.tsx');
    assert.match(km, /<SingleLearnerScope learner=/);
    assert.match(km, /<ParentPinDialog isOpen=\{asking\}.*onDone=\{\(\) => \{ setAsking\(false\); setKidMode\(null\)/);
    // Turning it on also goes through the PIN (made there if missing), so the parent can always come back.
    assert.match(km, /<ParentPinDialog isOpen=\{!!pick\}/);
    assert.match(read('src/student/pages/StudentProfilePage.tsx'), /<KidModeSwitch /);
  });
});
