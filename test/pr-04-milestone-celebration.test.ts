import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { islamicSeasonFor } from '../src/lib/islamicSeason.js';
import {
  ageGroupFor, buildShelf, earnedCelebrations, pickCelebration, praiseFor, SEEN_STORAGE_PREFIX, type StorageLike
} from '../src/student/components/achievements/achievements.js';
import { buildLearnerProgressReadModel } from '../server/routes/progress.js';

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
};
const NOW = new Date('2026-10-21T12:00:00Z');
const ms = (id: string, kind: string, daysAgo: number) => ({
  id, kind, title_en: `Milestone ${id}`, title_ar: `إنجاز ${id}`,
  reached_at: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString()
});

describe('PR-04 Islamic season (Umm al-Qura)', () => {
  it('knows Ramadan, both Eids and the first days of Dhul Hijjah', () => {
    assert.strictEqual(islamicSeasonFor(new Date('2026-02-20T12:00:00Z'), 'Africa/Cairo'), 'ramadan');
    assert.strictEqual(islamicSeasonFor(new Date('2026-03-20T12:00:00Z'), 'Africa/Cairo'), 'eid-fitr');
    assert.strictEqual(islamicSeasonFor(new Date('2026-05-20T12:00:00Z'), 'Africa/Cairo'), 'dhul-hijjah');
    assert.strictEqual(islamicSeasonFor(new Date('2026-05-27T12:00:00Z'), 'Africa/Cairo'), 'eid-adha');
    assert.strictEqual(islamicSeasonFor(NOW, 'Europe/London'), 'normal');
  });
  it('falls back safely on a bad time zone', () => {
    assert.strictEqual(islamicSeasonFor(new Date('2026-02-20T12:00:00Z'), 'Not/AZone'), 'ramadan');
  });
});

describe('PR-04 achievements shelf', () => {
  it('a new learner sees 12 emblems, all in outline, each saying what earns it', () => {
    const shelf = buildShelf({ lessonsTotal: 0, longestRhythm: 0, milestones: [] });
    assert.strictEqual(shelf.length, 12);
    assert.ok(shelf.every((s) => !s.earned && s.earnBy.en && s.earnBy.ar));
  });
  it('counts effort and teacher milestones; a book uses the level emblem; custom ones are added as recognitions', () => {
    const shelf = buildShelf({ lessonsTotal: 18, longestRhythm: 7, milestones: [ms('a', 'surah_memorized', 3), ms('b', 'book_completed', 40), ms('c', 'custom', 5)] });
    const earned = shelf.filter((s) => s.earned).map((s) => s.emblem);
    assert.deepStrictEqual(earned, ['first-lesson', 'lessons-10', 'rhythm-4', 'surah', 'level', 'teacher']);
    assert.strictEqual(shelf.find((s) => s.emblem === 'surah')!.detail!.en, 'Milestone a');
  });
});

describe('PR-04 one celebration, once', () => {
  it('first visit: old achievements are seen silently, a teacher milestone from the last 14 days still plays', () => {
    const store = memory();
    const input = { lessonsTotal: 30, longestRhythm: 5, milestones: [ms('old', 'juz_completed', 60), ms('new', 'surah_memorized', 2)] };
    const first = pickCelebration('L1', input, store, NOW);
    assert.strictEqual(first.celebrate?.key, 'ms:new');
    assert.strictEqual(first.alsoNew, 0);
    first.markSeen();
    assert.strictEqual(pickCelebration('L1', input, store, NOW).celebrate, null, 'never twice');
  });
  it('crossing a threshold later celebrates it; several new ones play one and count the rest', () => {
    const store = memory();
    pickCelebration('L2', { lessonsTotal: 9, longestRhythm: 3, milestones: [] }, store, NOW).markSeen();
    const next = pickCelebration('L2', { lessonsTotal: 10, longestRhythm: 4, milestones: [] }, store, NOW);
    assert.strictEqual(next.celebrate?.key, 'lessons:10');
    assert.strictEqual(next.alsoNew, 1);
  });
  it('each learner keeps their own memory (a parent with several children misses nobody)', () => {
    const store = memory();
    pickCelebration('kid-a', { lessonsTotal: 1, longestRhythm: 0, milestones: [] }, store, NOW).markSeen();
    assert.ok(store.data.has(SEEN_STORAGE_PREFIX + 'kid-a'));
    assert.ok(!store.data.has(SEEN_STORAGE_PREFIX + 'kid-b'));
  });
  it('without storage nothing plays (it would repeat on every visit)', () => {
    assert.strictEqual(pickCelebration('L3', { lessonsTotal: 0, longestRhythm: 0, milestones: [ms('x', 'custom', 1)] }, null, NOW).celebrate, null);
  });
  it('teacher milestones come first, newest first', () => {
    const keys = earnedCelebrations({ lessonsTotal: 25, longestRhythm: 4, milestones: [ms('a', 'custom', 9), ms('b', 'rule_mastered', 1)] }).map((e) => e.key);
    assert.deepStrictEqual(keys.slice(0, 3), ['ms:b', 'ms:a', 'lessons:25']);
  });
});

describe('PR-04 words', () => {
  it('age groups: under 12 kids, 12–17 teens, 18+ adults; a child without an age is a kid', () => {
    assert.strictEqual(ageGroupFor(9, 'child'), 'kids');
    assert.strictEqual(ageGroupFor(15, 'child'), 'teens');
    assert.strictEqual(ageGroupFor(30, 'adult'), 'adults');
    assert.strictEqual(ageGroupFor(null, 'child'), 'kids');
    assert.strictEqual(ageGroupFor(null, 'adult'), 'adults');
  });
  it('fits the praise to age, gender, the guardian and the season', () => {
    assert.strictEqual(praiseFor({ ageGroup: 'kids', gender: 'female', audience: 'learner', season: 'normal' }).headline.ar, 'ما شاء الله! أحسنتِ يا بطلة!');
    assert.strictEqual(praiseFor({ ageGroup: 'kids', gender: 'male', audience: 'learner', season: 'normal' }).headline.ar, 'ما شاء الله! أحسنت يا بطل!');
    const parent = praiseFor({ ageGroup: 'adults', gender: 'female', audience: 'guardian', name: 'Maryam', season: 'ramadan' });
    assert.match(parent.headline.ar, /^Maryam حققت إنجاز جديد/);
    assert.ok(parent.season && parent.season.en.includes('blessed month'));
    assert.strictEqual(praiseFor({ ageGroup: 'teens', gender: 'female', audience: 'learner', season: 'ramadan' }).season!.ar, 'تقبّل الله منكِ في هذا الشهر المبارك');
    assert.strictEqual(praiseFor({ ageGroup: 'adults', audience: 'learner', season: 'normal' }).season, null);
  });
});

describe('PR-04 wiring', () => {
  it('the progress read model carries age and gender; the API adds the season', () => {
    const model = buildLearnerProgressReadModel({
      learnerProfile: { id: 'x', name: 'Y', learnerType: 'child', currentLevel: null, learningInterest: null, timezone: 'UTC', age: 9, gender: 'female' },
      bookings: [], lessonSessions: [], lessonNotes: [], milestones: [], placementTests: []
    });
    assert.strictEqual(model.learner.age, 9);
    assert.strictEqual(model.learner.gender, 'female');
    const route = fs.readFileSync('server/routes/progress.ts', 'utf8');
    assert.ok(route.includes('assigned_teacher_id, age, gender') && route.includes('currentIslamicSeason: islamicSeasonFor('));
  });
  it('the celebration is a dismissible, focus-trapped dialog with a reduced-motion path and no sound', () => {
    const c = fs.readFileSync('src/student/components/achievements/MilestoneCelebration.tsx', 'utf8');
    assert.ok(c.includes('<FocusTrap onEscape={onClose}>') && c.includes('role="dialog"') && c.includes('useReducedMotion()'));
    for (const f of fs.readdirSync('src/student/components/achievements')) {
      assert.ok(!/new Audio|\.mp3|\.wav|<audio/.test(fs.readFileSync(`src/student/components/achievements/${f}`, 'utf8')), f);
    }
    const page = fs.readFileSync('src/student/pages/StudentProgressPage.tsx', 'utf8');
    assert.ok(page.indexOf('useProgressAchievements(data, isAr)') < page.indexOf('if (loading) {'), 'hook above the early returns');
  });
});
