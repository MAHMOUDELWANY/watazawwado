import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { HANGOVER_MS, createTalkClock, rmsOf, talkShare, vadStep } from '../src/classroom/talkTime.js';
import { isRoomEvent } from '../src/lib/roomEvents.js';
import { PERSISTED } from '../src/classroom/timeline.js';

const src = (f: string) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('CL-23 talk time (2.8)', () => {
  it('rms of silence is 0, of a full-scale wave is high', () => {
    assert.strictEqual(rmsOf(new Uint8Array(64).fill(128)), 0);
    assert.ok(rmsOf(Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 0 : 255))) > 0.9);
  });

  it('the voice detector holds through short pauses and lets go after the hangover', () => {
    let s = { on: false, quietSince: 0 };
    s = vadStep(s, 0.2, 1000);
    assert.strictEqual(s.on, true);
    s = vadStep(s, 0.01, 1100);
    assert.strictEqual(s.on, true, 'a pause between words still counts');
    s = vadStep(s, 0.01, 1100 + HANGOVER_MS + 1);
    assert.strictEqual(s.on, false);
    assert.strictEqual(vadStep({ on: false, quietSince: 0 }, 0.01, 5).on, false, 'quiet from the start is not talk');
  });

  it('the clock adds time to whoever spoke, skips long gaps and restarts after a pause', () => {
    const c = createTalkClock();
    c.tick(0, false, false);
    c.tick(250, true, false);
    c.tick(500, true, true);
    c.tick(750, false, true);
    assert.deepStrictEqual(c.totals(), { teacherMs: 500, learnerMs: 500 });
    c.tick(60_000, true, false); // a frozen tab counts at most 2 s
    assert.strictEqual(c.totals().teacherMs, 2500);
    c.pause();
    c.tick(90_000, true, true); // first tick after a pause counts nothing
    assert.deepStrictEqual(c.totals(), { teacherMs: 2500, learnerMs: 500 });
  });

  it('share is in whole percent and waits for a second of talk', () => {
    assert.strictEqual(talkShare(300, 200), null);
    assert.deepStrictEqual(talkShare(6_000, 4_000), { teacher: 60, learner: 40 });
    assert.deepStrictEqual(talkShare(1_000, 2_000), { teacher: 33, learner: 67 });
  });

  it('the talk event is checked and saved', () => {
    assert.ok(isRoomEvent({ t: 'talk', teacherMs: 120_000, learnerMs: 45_000 }));
    assert.ok(!isRoomEvent({ t: 'talk', teacherMs: -1, learnerMs: 0 }));
    assert.ok(!isRoomEvent({ t: 'talk', teacherMs: 1.5, learnerMs: 0 }));
    assert.ok(!isRoomEvent({ t: 'talk', teacherMs: 1 }));
    assert.ok(!isRoomEvent({ t: 'talk', teacherMs: 1, learnerMs: 1, extra: 1 }));
    assert.ok(PERSISTED.has('talk'));
    // Only the teacher's page measures both sides, so only the teacher's talk event is stored.
    assert.match(src('server/routes/classroom.ts'), /case 'slide': case 'pdf': case 'layout': case 'talk': case 'end': return role === 'teacher';/);
    assert.match(src('src/types/database.ts'), /'layout' \| 'talk' \| 'end'/);
  });

  it('a migration widens the timeline type check with talk', () => {
    const file = fs.readdirSync(new URL('../supabase/migrations/', import.meta.url)).find((f) => /timeline_talk_event\.sql$/.test(f));
    assert.ok(file, 'migration file present');
    const sql = src(`supabase/migrations/${file}`);
    assert.match(sql, /DROP CONSTRAINT IF EXISTS lesson_timeline_events_type_check/);
    const types = /lesson_timeline_events_type_check CHECK \(type IN \(([^)]*)\)\)/.exec(sql)![1].split(',').map((s) => s.trim().replace(/'/g, ''));
    assert.deepStrictEqual(types, ['slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'talk', 'end']);
  });

  it('the room shows the ratio to the teacher only and saves talk before the last flush', () => {
    const p = src('src/classroom/ClassroomPage.tsx');
    assert.match(p, /\{isTeacher && <TalkRatio /);
    assert.match(p, /useTalkTime\(isTeacher && joined && !over, selfSpeaking, studentSpeaking\)/);
    // end lesson, hard close and leaving all save it before the batcher's final flush
    assert.match(p, /saveTalk\(\);\r?\n\s+send\(\{ t: 'end' \}\);\r?\n\s+await batcher\.current\?\.stop\(\);/);
    assert.match(p, /saveTalk\(\);\r?\n\s+void batcher\.current\?\.stop\(\); \/\/ flushes what is left/);
    assert.match(p, /saveTalk\(\); void batcher\.current\?\.flush\(true\);/);
    // muted is not talking: the own speaking flag comes from the real track only while unmuted
    assert.match(p, /const selfSpeaking = useSpeaking\(phase === 'room' && !muted \? micTrack : null\);/);
  });
});
