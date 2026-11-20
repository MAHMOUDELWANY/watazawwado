import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { isRoomEvent, MAX_EVENT_BYTES } from '../src/lib/roomEvents.js';
import { mediaPosition, reduceTools, stageForStation, STAGES, TOOL_STATE_TYPES, type ToolsState } from '../src/lib/roomTools.js';
import { PERSISTED } from '../src/classroom/timeline.js';
import { buildReportDraft } from '../server/classroom/reportDraft.js';
import { warmupPrompts, MAX_PROMPTS } from '../src/classroom/tools/warmup.js';
import { duckedVolume, DUCK_LEVEL, needsSeek, parseYouTubeId, baseType } from '../src/classroom/tools/media.js';
import { comfortStyle, readComfort } from '../src/classroom/tools/comfort.js';
import { pickBlurMode, pickPipMode, tooSlow, BLUR_SAMPLE } from '../src/classroom/tools/effectsModel.js';

const AUDIO = '11111111-2222-4333-8444-555555555555.webm';

describe('CL-30 tool events: validators', () => {
  it('accepts every tool event in its right shape', () => {
    const ok = [
      { t: 'correction', id: 'c1', said: 'ana ruht', correct: 'ana rohtu', note: 'past tense' },
      { t: 'correction', id: 'c2', said: 'x', correct: 'y' },
      { t: 'check', id: 'k1', part: 'lesson · p.4', open: true },
      { t: 'check_answer', id: 'k1', part: 'lesson · p.4', level: 'amber' },
      { t: 'stage', stage: 'practice' },
      { t: 'media', kind: 'youtube', src: 'dQw4w9WgXcQ', playing: true, pos: 12.5 },
      { t: 'media', kind: 'audio', src: AUDIO, playing: false, pos: 0 },
      { t: 'media', kind: 'none', src: '', playing: false, pos: 0 },
      { t: 'practice', practice: { kind: 'blanks', text: 'بِسْمِ اللَّهِ الرَّحْمَنِ', seed: 7, show: false } },
      { t: 'practice', practice: { kind: 'wheel', items: ['q1', 'q2'], index: -1 } },
      { t: 'practice', practice: { kind: 'match', pairs: [['kitab', 'book'], ['qalam', 'pen']], seed: 3 } },
      { t: 'practice', practice: { kind: 'none' } },
      { t: 'practice_answer', kind: 'blanks', answer: ['اللَّهِ'] },
      { t: 'shadow', fileId: AUDIO },
      { t: 'shadow', fileId: '' },
    ];
    for (const e of ok) assert.ok(isRoomEvent(e), JSON.stringify(e));
  });

  it('refuses wrong, extra or oversized fields', () => {
    const bad = [
      { t: 'correction', id: 'c1', said: '', correct: 'y' },
      { t: 'correction', id: 'c1', said: 'x', correct: 'y', extra: 1 },
      { t: 'correction', id: 'c1', said: 'x'.repeat(301), correct: 'y' },
      { t: 'check_answer', id: 'k1', part: 'p', level: 'blue' },
      { t: 'stage', stage: 'homework' },
      { t: 'media', kind: 'youtube', src: 'https://evil.example/x', playing: true, pos: 1 },
      { t: 'media', kind: 'audio', src: '../etc/passwd', playing: true, pos: 1 },
      { t: 'media', kind: 'audio', src: AUDIO, playing: true, pos: -1 },
      { t: 'practice', practice: { kind: 'spin_for_prize' } },
      { t: 'practice', practice: { kind: 'wheel', items: Array(31).fill('q') } },
      { t: 'practice', practice: { kind: 'blanks', text: 'x', reward: 10 } },
      { t: 'shadow', fileId: 'a.pdf' },
      { t: 'practice', practice: { kind: 'blanks', text: 'x'.repeat(4001) } },
    ];
    for (const e of bad) assert.ok(!isRoomEvent(e), JSON.stringify(e).slice(0, 80));
  });

  it('a full practice stays under the event size cap', () => {
    const e = { t: 'practice', practice: { kind: 'wheel', items: Array(30).fill('س'.repeat(250)), index: 3 } };
    assert.ok(JSON.stringify(e).length <= MAX_EVENT_BYTES);
    assert.ok(isRoomEvent(e));
  });

  it('the timeline saves the tools but never the learner\'s live practice answers', () => {
    for (const t of ['correction', 'check', 'check_answer', 'stage', 'media', 'practice', 'shadow'] as const) assert.ok(PERSISTED.has(t), t);
    assert.ok(!PERSISTED.has('practice_answer'));
  });

  it('the migration allows every persisted type in the timeline CHECK', () => {
    const sql = fs.readFileSync('supabase/migrations/20261120200000_classroom_teaching_tools.sql', 'utf8');
    const list = sql.match(/lesson_timeline_events_type_check CHECK \(type IN \(([^)]*)\)\)/)![1].split(',').map((x) => x.trim().replace(/'/g, ''));
    for (const t of PERSISTED) assert.ok(list.includes(t), t);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.learner_mistakes/);
    assert.match(sql, /ALTER TABLE public\.learner_mistakes ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON public\.learner_mistakes FROM anon, authenticated/);
    assert.match(sql, /UNIQUE \(booking_id, client_id\)/);
    assert.match(sql, /'audio\/webm'/);
  });
});

describe('CL-30 tools state (shared reducer)', () => {
  it('stage, practice, shadow and media replace; media is stamped with the time', () => {
    let s: ToolsState = {};
    s = reduceTools(s, { t: 'stage', stage: 'review' }, 1000);
    s = reduceTools(s, { t: 'practice', practice: { kind: 'tashkeel', text: 'x', show: true } }, 1000);
    s = reduceTools(s, { t: 'shadow', fileId: AUDIO }, 1000);
    s = reduceTools(s, { t: 'media', kind: 'youtube', src: 'dQw4w9WgXcQ', playing: true, pos: 10 }, 5000);
    assert.deepStrictEqual(s, { stage: 'review', practice: { kind: 'tashkeel', text: 'x', show: true }, shadow: AUDIO, media: { kind: 'youtube', src: 'dQw4w9WgXcQ', playing: true, pos: 10, savedAt: 5000 } });
    s = reduceTools(s, { t: 'media', kind: 'none', src: '', playing: false, pos: 0 }, 6000);
    assert.strictEqual(s.media!.kind, 'none');
  });

  it('a check answer closes only its own question, and live-only events change nothing', () => {
    let s = reduceTools({}, { t: 'check', id: 'k1', part: 'p1', open: true }, 0);
    const same = reduceTools(s, { t: 'check_answer', id: 'other', part: 'p1', level: 'red' }, 0);
    assert.strictEqual(same, s);
    s = reduceTools(s, { t: 'check_answer', id: 'k1', part: 'p1', level: 'green' }, 0);
    assert.deepStrictEqual(s.check, { id: 'k1', part: 'p1', open: false, answer: 'green' });
    assert.strictEqual(reduceTools(s, { t: 'practice_answer', kind: 'blanks', answer: [] }, 0), s);
    assert.strictEqual(reduceTools(s, { t: 'correction', id: 'c', said: 'a', correct: 'b' }, 0), s);
    assert.ok(!TOOL_STATE_TYPES.has('correction') && !TOOL_STATE_TYPES.has('practice_answer'));
  });

  it('a playing video has moved on since it was sent; a paused one stays', () => {
    assert.strictEqual(mediaPosition({ kind: 'youtube', src: 'x', playing: true, pos: 10, savedAt: 1000 }, 4000), 13);
    assert.strictEqual(mediaPosition({ kind: 'youtube', src: 'x', playing: false, pos: 10, savedAt: 1000 }, 4000), 10);
    assert.strictEqual(mediaPosition({ kind: 'audio', src: 'x', playing: true, pos: 2 }, 4000), 2);
  });

  it('stages follow the curriculum stations', () => {
    assert.deepStrictEqual([...STAGES], ['review', 'lesson', 'practice', 'close']);
    assert.strictEqual(stageForStation('spark'), 'lesson');
    assert.strictEqual(stageForStation('athar'), 'practice');
    assert.strictEqual(stageForStation('ahd'), 'close');
    assert.strictEqual(stageForStation(undefined), null);
  });
});

describe('CL-30 media sync, warm-up, comfort, effects', () => {
  it('reads YouTube links and refuses others', () => {
    assert.strictEqual(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3'), 'dQw4w9WgXcQ');
    assert.strictEqual(parseYouTubeId('youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(parseYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(parseYouTubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(parseYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.strictEqual(parseYouTubeId('https://vimeo.com/12345678901'), null);
    assert.strictEqual(parseYouTubeId('https://youtube.com.evil.io/watch?v=dQw4w9WgXcQ'), null);
  });

  it('seeks only past the drift, and ducks under the teacher\'s voice', () => {
    assert.ok(!needsSeek(10, 11));
    assert.ok(needsSeek(10, 12));
    assert.strictEqual(duckedVolume(true), DUCK_LEVEL);
    assert.strictEqual(duckedVolume(false), 1);
    assert.strictEqual(baseType('audio/webm;codecs=opus'), 'audio/webm');
    assert.strictEqual(baseType('audio/x-m4a'), 'audio/mp4');
  });

  it('warm-up prompts come from the last report, corrections and level, at most six', () => {
    const p = warmupPrompts({
      level: 'beginner',
      report: { lessonTitle: 'Who is Allah?', toPage: 6, strengths: ['reads alif'], toReinforce: ['baa', 'taa', 'thaa'], note: 'Shy at first' },
      mistakes: [{ said: 'ب', correct: 'ت' }],
    });
    assert.strictEqual(p.length, MAX_PROMPTS);
    assert.match(p[0].en, /Who is Allah\?.*page 6/);
    assert.ok(p.every((x) => x.en && x.ar));
    assert.ok(p.some((x) => x.en.includes('"ب" → "ت"')));
    const empty = warmupPrompts({ level: null, report: null, mistakes: [] });
    assert.strictEqual(empty.length, 1);
  });

  it('comfort is read safely and styles only the learner\'s paper', () => {
    assert.deepStrictEqual(readComfort('not json'), { size: 0, tone: 'default' });
    assert.deepStrictEqual(readComfort(JSON.stringify({ size: 2, tone: 'warm' })), { size: 2, tone: 'warm' });
    assert.deepStrictEqual(readComfort(JSON.stringify({ size: 9, tone: 'neon' })), { size: 0, tone: 'default' });
    assert.deepStrictEqual(comfortStyle({ size: 0, tone: 'default' }), {});
    assert.ok(comfortStyle({ size: 1, tone: 'warm' }).zoom! > 1);
    assert.match(comfortStyle({ size: 0, tone: 'warm' }).filter!, /sepia/);
  });

  it('picture-in-picture and blur pick the best the device can do', () => {
    assert.strictEqual(pickPipMode({ documentPip: true, videoPip: true }), 'document');
    assert.strictEqual(pickPipMode({ documentPip: false, videoPip: true }), 'video');
    assert.strictEqual(pickPipMode({ documentPip: false, videoPip: false }), 'none');
    assert.strictEqual(pickBlurMode({ nativeBlur: true, cores: 2, webgl: false }), 'native');
    assert.strictEqual(pickBlurMode({ nativeBlur: false, cores: 8, webgl: true, memoryGb: 8 }), 'segment');
    assert.strictEqual(pickBlurMode({ nativeBlur: false, cores: 2, webgl: true }), 'none');
    assert.strictEqual(pickBlurMode({ nativeBlur: false, cores: 8, webgl: true, memoryGb: 2 }), 'none');
    assert.ok(!tooSlow(Array(BLUR_SAMPLE - 1).fill(100)));
    assert.ok(tooSlow(Array(BLUR_SAMPLE).fill(60)));
    assert.ok(!tooSlow(Array(BLUR_SAMPLE).fill(20)));
  });
});

describe('CL-30 report draft lists corrections and checks', () => {
  const at = (s: number) => new Date(Date.parse('2026-11-10T10:00:00Z') + s * 1000).toISOString();
  it('one per id, in order', () => {
    const rows = [
      { type: 'correction', occurred_at: at(10), payload: { id: 'c1', said: 'a', correct: 'b' } },
      { type: 'correction', occurred_at: at(10), payload: { id: 'c1', said: 'a', correct: 'b' } },
      { type: 'correction', occurred_at: at(20), payload: { id: 'c2', said: 'c', correct: 'd', note: 'n' } },
      { type: 'check_answer', occurred_at: at(30), payload: { id: 'k1', part: 'lesson', level: 'amber' } },
      { type: 'check_answer', occurred_at: at(31), payload: { id: 'k1', part: 'lesson', level: 'amber' } },
      { type: 'check_answer', occurred_at: at(40), payload: { id: 'k2', part: 'practice', level: 'purple' } },
    ];
    const d = buildReportDraft({ rows, stopMs: Date.parse(at(60)), fileIds: [AUDIO], sharedIds: [] });
    assert.deepStrictEqual(d.corrections, [{ said: 'a', correct: 'b', note: null }, { said: 'c', correct: 'd', note: 'n' }]);
    assert.deepStrictEqual(d.checks, [{ part: 'lesson', level: 'amber' }]);
    assert.deepStrictEqual(d.files, [], 'audio files are not report files');
  });
});
