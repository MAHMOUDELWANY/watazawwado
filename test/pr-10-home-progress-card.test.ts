import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('PR-10 progress on the student home page', () => {
  const card = fs.readFileSync('src/student/components/progress/HomeProgressCard.tsx', 'utf8');
  const home = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');

  it('shows rhythm, current level and newest milestone for the learner chosen in the header', () => {
    assert.ok(card.includes('useActiveLearner()') && card.includes('/api/student/progress${q}'));
    assert.ok(card.includes('data.overall.weeklyRhythm.current') && card.includes('subject.currentLevel') && card.includes('newest'));
  });
  it('opens the progress page for that learner and stays away when progress cannot load', () => {
    assert.ok(card.includes('`/student/progress${activeId ?'));
    assert.ok(card.includes('if (!data?.learner) return null;'));
  });
  it('is lazy-loaded on home, right after the lesson-day card', () => {
    assert.ok(home.includes("lazy(() => import('../components/progress/HomeProgressCard')"));
    assert.ok(home.indexOf('<HomeProgressCard isAr={isAr} />') > home.indexOf('<LessonDayCard booking={nextBooking}'));
  });
});
