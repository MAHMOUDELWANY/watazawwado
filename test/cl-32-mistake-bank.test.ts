import { describe, it } from 'node:test';
import assert from 'node:assert';
import { recentMistakes, recordCorrections, resolveMistake } from '../server/classroom/mistakeBank.js';
import { correctionsText, buildHomeworkPrompt } from '../server/homework/sets.js';
import { detectFileType } from '../server/routes/classroom.js';
import { fakeDb } from './helpers/fakeDb.js';

const S1 = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const S2 = '5049fa58-7428-44e4-926b-5e3eb315c5cb';
const B1 = '6049fa58-7428-44e4-926b-5e3eb315c5cb';

describe('CL-32 mistake bank', () => {
  it('saves each correction once per lesson, trimmed, for the lesson\'s learner', async () => {
    const db = fakeDb({ learner_mistakes: [] });
    const at = { bookingId: B1, studentId: S1, teacherId: 't1' };
    const n = await recordCorrections(db, at, [
      { id: 'c1', said: '  ana ruht ', correct: 'ana rohtu', note: '  ' },
      { id: 'c2', said: 'x', correct: 'y', note: 'tense' },
    ]);
    assert.strictEqual(n, 2);
    await recordCorrections(db, at, [{ id: 'c1', said: 'changed', correct: 'changed' }]);
    const rows = db.tables.learner_mistakes;
    assert.strictEqual(rows.length, 2);
    assert.deepStrictEqual(rows.map((r: any) => [r.client_id, r.said, r.correct, r.note, r.student_id, r.booking_id]), [
      ['c1', 'ana ruht', 'ana rohtu', null, S1, B1],
      ['c2', 'x', 'y', 'tense', S1, B1],
    ]);
  });

  it('a lesson without a learner saves nothing', async () => {
    const db = fakeDb({ learner_mistakes: [] });
    assert.strictEqual(await recordCorrections(db, { bookingId: B1, studentId: null, teacherId: null }, [{ id: 'c', said: 'a', correct: 'b' }]), 0);
    assert.strictEqual(db.tables.learner_mistakes.length, 0);
  });

  it('review, homework and the warm-up read only open corrections of their learners, newest first', async () => {
    const db = fakeDb({ learner_mistakes: [
      { id: 'm1', student_id: S1, said: 'a', correct: 'b', note: null, created_at: '2026-11-01', resolved_at: null },
      { id: 'm2', student_id: S1, said: 'c', correct: 'd', note: null, created_at: '2026-11-05', resolved_at: null },
      { id: 'm3', student_id: S1, said: 'e', correct: 'f', note: null, created_at: '2026-11-06', resolved_at: '2026-11-07' },
      { id: 'm4', student_id: S2, said: 'g', correct: 'h', note: null, created_at: '2026-11-08', resolved_at: null },
    ] });
    const list = await recentMistakes(db, [S1]);
    assert.deepStrictEqual(list.map((m) => m.id), ['m2', 'm1']);
    assert.deepStrictEqual(await recentMistakes(db, []), []);
  });

  it('a family can mark only its own learner\'s correction as learned', async () => {
    const db = fakeDb({ learner_mistakes: [{ id: 'm1', student_id: S1, resolved_at: null }, { id: 'm2', student_id: S2, resolved_at: null }] });
    assert.strictEqual(await resolveMistake(db, 'm2', [S1], '2026-11-20T00:00:00Z'), false);
    assert.strictEqual(db.tables.learner_mistakes[1].resolved_at, null);
    assert.strictEqual(await resolveMistake(db, 'm1', [S1], '2026-11-20T00:00:00Z'), true);
    assert.strictEqual(db.tables.learner_mistakes[0].resolved_at, '2026-11-20T00:00:00Z');
  });

  it('homework reads the lesson\'s corrections into its prompt, only when there are some', () => {
    assert.strictEqual(correctionsText([]), '');
    assert.match(correctionsText([{ said: 'ب', correct: 'ت' }]), /said "ب", correct: "ت"/);
    const lesson: any = { subjectTitle: 'S', number: 1, title: 'T', version: 'adults', pages: [{ title: 'P1', lines: ['x'] }] };
    const p = buildHomeworkPrompt({ lesson, from: 1, to: 1, kind: 'part', count: 4, variants: 3, corrections: [{ said: 'a', correct: 'b' }] });
    assert.match(p, /Corrections the teacher made/);
    assert.doesNotMatch(buildHomeworkPrompt({ lesson, from: 1, to: 1, kind: 'part', count: 4, variants: 3 }), /Corrections/);
  });
});

describe('CL-32 room audio files', () => {
  it('tells audio types from their first bytes', () => {
    assert.strictEqual(detectFileType(Buffer.from('ID3\x04\x00', 'latin1')), 'audio/mpeg');
    assert.strictEqual(detectFileType(Buffer.from([0xff, 0xfb, 0x90, 0x00])), 'audio/mpeg');
    assert.strictEqual(detectFileType(Buffer.from('\x00\x00\x00\x20ftypM4A ', 'latin1')), 'audio/mp4');
    assert.strictEqual(detectFileType(Buffer.from('OggS\x00', 'latin1')), 'audio/ogg');
    assert.strictEqual(detectFileType(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01])), 'audio/webm');
    assert.strictEqual(detectFileType(Buffer.from('RIFF\x10\x00\x00\x00WAVEfmt ', 'latin1')), 'audio/wav');
    assert.strictEqual(detectFileType(Buffer.from('RIFF\x10\x00\x00\x00AVI ', 'latin1')), null);
    assert.strictEqual(detectFileType(Buffer.from('<html>', 'latin1')), null);
    assert.strictEqual(detectFileType(Buffer.from('%PDF-1.7', 'latin1')), 'application/pdf');
  });
});
