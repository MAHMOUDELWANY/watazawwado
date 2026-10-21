import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { buildSummaryPrompt, cleanDraft, firstName, MAX_DRAFT } from '../server/routes/summaryDraft.js';

describe('TE-05 Jalila drafts the family summary', () => {
  it('sends the first name only, and the rules that keep private things private', () => {
    assert.strictEqual(firstName('  Yusuf Ahmed Ali '), 'Yusuf');
    assert.strictEqual(firstName(null), '');
    const prompt = buildSummaryPrompt({ firstName: firstName('Yusuf Ahmed Ali'), notes: 'Struggled with idgham, improved by the end.', lang: 'en' });
    assert.ok(prompt.includes('"Yusuf"') && !prompt.includes('Ahmed'));
    assert.match(prompt, /Leave out anything not meant for the family/);
    assert.match(prompt, /Do not invent/);
    assert.match(buildSummaryPrompt({ firstName: 'Maryam', notes: 'x', lang: 'ar' }), /Arabic/);
  });

  it('cleans the reply into short plain text', () => {
    assert.strictEqual(cleanDraft('**Great lesson** today.\n\n'), 'Great lesson today.');
    assert.strictEqual(cleanDraft('«درس جميل»'), 'درس جميل');
    assert.ok(cleanDraft('a'.repeat(900)).length <= MAX_DRAFT);
  });

  it('only the student\'s own teacher (or the admin) can draft, and nothing is saved by the draft route', () => {
    const src = fs.readFileSync('server/routes/summaryDraft.ts', 'utf8');
    assert.ok(src.includes('canTeacherAccessStudent(client, req.teacherUser, studentId)'));
    assert.ok(!/\.insert\(|\.update\(|\.upsert\(/.test(src), 'no writes');
    const editor = fs.readFileSync('src/dashboard/components/PostLessonSummaryEditor.tsx', 'utf8');
    assert.ok(editor.includes('setFamilySummary(res.draft)'), 'the draft goes into the editor for review');
  });
});
