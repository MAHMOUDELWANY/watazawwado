import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMonthlyPrompt, cleanDraft, MAX_MONTHLY } from '../server/routes/summaryDraft';

describe('Jalila monthly note', () => {
  it('builds the prompt from shared summaries, milestones and the lesson count, in the family language', () => {
    const p = buildMonthlyPrompt({ firstName: 'Yusuf', lang: 'ar', lessons: 4, summaries: [{ date: '2026-10-20', text: 'Finished the noon sakinah rules.', next: 'Meem sakinah' }], milestones: ['Juz Amma'] });
    assert.ok(p.includes('"Yusuf"'));
    assert.ok(p.includes('Lessons attended in the last 30 days: 4'));
    assert.ok(p.includes('Finished the noon sakinah rules. (next: Meem sakinah)'));
    assert.ok(p.includes('Juz Amma'));
    assert.ok(p.includes('Arabic'));
  });

  it('never reads private notes and only lets the teacher of the student draft', () => {
    const route = fs.readFileSync('server/routes/summaryDraft.ts', 'utf8');
    const monthly = route.slice(route.indexOf("'/api/dashboard/students/:id/monthly-draft'"));
    assert.ok(monthly.includes("select('family_summary, next_steps, created_at')"));
    assert.ok(!monthly.includes('observations') && !monthly.includes('content'), 'private note fields are not selected');
    assert.ok(monthly.includes('canTeacherAccessStudent'));
  });

  it('cleans and caps the draft', () => {
    assert.equal(cleanDraft('**Hello**  world'), 'Hello world');
    assert.ok(cleanDraft('x'.repeat(2000), MAX_MONTHLY).length <= MAX_MONTHLY);
  });
});
