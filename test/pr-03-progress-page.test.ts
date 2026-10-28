import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import StudentProgressPage, {
  type ProgressApiResponse,
} from '../src/student/pages/StudentProgressPage';

describe('PR-03: Progress page — the learning path', () => {
  const rootDir = process.cwd();
  const studentAppPath = path.join(rootDir, 'src/student/StudentApp.tsx');
  const progressPagePath = path.join(rootDir, 'src/student/pages/StudentProgressPage.tsx');

  const studentAppSource = fs.readFileSync(studentAppPath, 'utf-8');
  const progressPageSource = fs.readFileSync(progressPagePath, 'utf-8');

  it('1. registers /student/progress in StudentApp navigation, header info, and routes', () => {
    assert.ok(
      studentAppSource.includes("path: '/student/progress'"),
      'Sidebar navigation must include /student/progress'
    );
    assert.match(studentAppSource, /const railItems = \[[^\]]*progress/, 'Progress is on the tablet/desktop rail');
    assert.match(studentAppSource, /const moreItems = \[[^\]]*progress/, 'Progress is in the phone More sheet');
    assert.ok(
      studentAppSource.includes('<Route path="/progress" element={<StudentProgressPage lang={lang} />} />'),
      'Routes must mount StudentProgressPage at /progress'
    );
  });

  it('2. adults and parents get the calm board, children the road; never fire emojis; reduced motion respected', () => {
    const calm = fs.readFileSync(path.join(rootDir, 'src/student/components/progress/ProgressCalm.tsx'), 'utf-8');
    const road = fs.readFileSync(path.join(rootDir, 'src/student/components/progress/ProgressRoad.tsx'), 'utf-8');
    assert.ok(!progressPageSource.includes('🔥') && !calm.includes('🔥') && !road.includes('🔥'), 'No fire emoji for the weekly rhythm');
    assert.match(progressPageSource, /isChildLearner\s*\?\s*<ProgressRoad[\s\S]*:\s*<ProgressCalm/, 'Children get the road, everyone else the calm board');
    assert.ok(road.includes('useReducedMotion'), 'The road respects prefers-reduced-motion');
    assert.match(road, /scrollIntoView\?\.\(\{\s*behavior:\s*reduceMotion\s*\?\s*'auto'\s*:\s*'smooth'/, 'Scroll to "you are here" is instant under reduced motion');
    assert.ok(road.includes('KhatamStarMilestoneEmblem'), 'The road marks "you are here" with the khatam star');
  });

  it('3. renders the calm board for adults and the road for children, with levels, milestones, teacher note and subject switcher', () => {
    const richData: ProgressApiResponse = {
      learner: {
        id: '11111111-2222-3333-4444-555555555555',
        name: 'Yusuf Al-Ansari',
        learnerType: 'adult',
        currentLevel: 'intermediate',
        learningInterest: 'tajweed',
        timezone: 'Europe/London',
        assignedTeacherName: 'Sheikh Ibrahim',
      },
      learners: [
        {
          id: '11111111-2222-3333-4444-555555555555',
          name: 'Yusuf Al-Ansari',
          learnerType: 'adult',
          isPrimary: true,
        },
      ],
      overall: {
        lessonsAttended: { total: 14, thisMonth: 3 },
        weeklyRhythm: { current: 4, longest: 6 },
        milestonesCount: 2,
        nextBookedLesson: null,
      },
      subjects: [
        {
          subject: 'tajweed',
          subjectMeta: {
            id: 'tajweed',
            glyph: 'ج',
            en: 'Tajweed',
            ar: 'التجويد',
            spineEn: 'Tajweed',
            spineAr: 'التجويد',
            familyKey: 'quran',
            familyColor: '#087D91',
            familyEn: 'Quran',
            familyAr: 'القرآن الكريم',
          },
          currentLevel: {
            id: 'intermediate',
            en: 'Level 2',
            ar: 'المستوى الثاني',
            descEn: 'Where each letter comes from and its qualities.',
            descAr: 'مخارج الحروف وصفاتها.',
          },
          currentLevelIndex: 1,
          levels: [
            {
              id: 'beginner',
              en: 'Level 1',
              ar: 'المستوى الأول',
              descEn: 'The essential rules, applied as you recite.',
              descAr: 'الأحكام الأساسية، وتطبيقها وانت بتقرأ.',
            },
            {
              id: 'intermediate',
              en: 'Level 2',
              ar: 'المستوى الثاني',
              descEn: 'Where each letter comes from and its qualities.',
              descAr: 'مخارج الحروف وصفاتها.',
            },
            {
              id: 'advanced',
              en: 'Level 3',
              ar: 'المستوى الثالث',
              descEn: 'The advanced rules, until the whole picture is complete.',
              descAr: 'الأحكام المتقدمة، لحد ما الصورة تكمل.',
            },
          ],
          lessonsAttended: { total: 12, thisMonth: 3 },
          weeklyRhythm: { current: 4, longest: 6 },
          milestones: [
            {
              id: 'ms-1',
              student_id: '11111111-2222-3333-4444-555555555555',
              subject: 'tajweed',
              kind: 'level_completed',
              title_ar: 'إتمام المستوى الأول',
              title_en: 'Completed Level 1',
              reached_at: '2026-10-01T12:00:00.000Z',
              lesson_session_id: null,
            },
            {
              id: 'ms-2',
              student_id: '11111111-2222-3333-4444-555555555555',
              subject: 'tajweed',
              kind: 'rule_mastered',
              title_ar: 'إتقان مخارج الحلق',
              title_en: 'Mastered Throat Articulation',
              reached_at: '2026-10-15T12:00:00.000Z',
              lesson_session_id: null,
            },
          ],
          familySummaries: [
            {
              id: 'note-1',
              student_id: '11111111-2222-3333-4444-555555555555',
              session_id: null,
              family_summary: 'أتقن مخارج الحلق بتلاوة متزنة.',
              achievements: ['مخارج الحلق'],
              homework: null,
              next_steps: 'مخارج اللسان',
              created_at: '2026-10-18T12:00:00.000Z',
              updated_at: '2026-10-18T12:00:00.000Z',
            },
          ],
          placementResult: null,
          nextBookedLesson: null,
        },
        {
          subject: 'modern-standard-arabic',
          subjectMeta: {
            id: 'modern-standard-arabic',
            glyph: 'ض',
            en: 'Fusha Arabic',
            ar: 'العربية الفصحى',
            spineEn: 'Fusha',
            spineAr: 'الفصحى',
            familyKey: 'languages',
            familyColor: '#C51F24',
            familyEn: 'Languages',
            familyAr: 'اللغات',
          },
          currentLevel: {
            id: 'beginner',
            en: 'Foundations',
            ar: 'التأسيس',
            descEn: 'The alphabet, reading and writing, from zero.',
            descAr: 'الحروف والقراءة والكتابة، من الصفر.',
          },
          currentLevelIndex: 0,
          levels: [
            {
              id: 'beginner',
              en: 'Foundations',
              ar: 'التأسيس',
              descEn: 'The alphabet, reading and writing, from zero.',
              descAr: 'الحروف والقراءة والكتابة، من الصفر.',
            },
          ],
          lessonsAttended: { total: 2, thisMonth: 0 },
          weeklyRhythm: { current: 1, longest: 2 },
          milestones: [],
          familySummaries: [],
          placementResult: null,
          nextBookedLesson: null,
        },
      ],
    };

    const htmlAr = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/student/progress'] },
        React.createElement(StudentProgressPage, { lang: 'ar', initialData: richData })
      )
    );

    assert.ok(htmlAr.includes('data-testid="progress-calm"'), 'An adult learner sees the calm board');
    assert.ok(htmlAr.includes('انت في'), 'The headline speaks to the learner directly');
    assert.ok(htmlAr.includes('data-testid="subject-switcher"'), 'Must render subject switcher when >1 subject');
    assert.ok(htmlAr.includes('data-level-state="completed"'), 'Must render completed level');
    assert.ok(htmlAr.includes('data-level-state="current"'), 'Must render current level');
    assert.ok(htmlAr.includes('data-level-state="future"'), 'Must render future level');
    assert.ok(htmlAr.includes('data-testid="path-milestone-emblem"'), 'Must list the latest milestones');
    assert.ok(htmlAr.includes('data-testid="latest-teacher-note"'), 'Must show the newest note from the teacher');
    assert.ok(htmlAr.includes('data-testid="progress-book-cta"'), 'Without a booked lesson, one button books the next');
    assert.ok(!htmlAr.includes('data-testid="new-learner-empty-state"'), 'Active learner must not see zero-lesson empty state');

    const htmlEn = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/student/progress'] },
        React.createElement(StudentProgressPage, { lang: 'en', initialData: richData })
      )
    );
    assert.ok(htmlEn.includes('weeks in a row'), 'Must render the weekly rhythm in English');

    const childData: ProgressApiResponse = { ...richData, learner: { ...richData.learner!, learnerType: 'child' } };
    const htmlChild = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/student/progress'] },
        React.createElement(StudentProgressPage, { lang: 'ar', initialData: childData })
      )
    );
    assert.ok(htmlChild.includes('data-testid="progress-road"'), 'A child sees the road');
    assert.ok(htmlChild.includes('data-current-level="true"'), 'The road marks the current level');
    assert.ok(htmlChild.includes('انت هنا'), 'The road says "you are here"');
    assert.ok(htmlChild.includes('زادك الله علمًا ونورًا'), 'The road carries the praise phrase');
  });

  it('4. renders warm empty state inviting the first lesson for a new learner and calm resting copy when rhythm is paused', () => {
    const newLearnerData: ProgressApiResponse = {
      learner: {
        id: '22222222-2222-3333-4444-555555555555',
        name: 'Aisha',
        learnerType: 'child',
        currentLevel: 'beginner',
        learningInterest: 'quran-reading',
        timezone: 'UTC',
        assignedTeacherName: null,
      },
      learners: [],
      overall: {
        lessonsAttended: { total: 0, thisMonth: 0 },
        weeklyRhythm: { current: 0, longest: 0 },
        milestonesCount: 0,
        nextBookedLesson: null,
      },
      subjects: [
        {
          subject: 'quran-reading',
          subjectMeta: {
            id: 'quran-reading',
            glyph: 'ق',
            en: 'Quran reading',
            ar: 'قراءة القرآن',
            spineEn: 'Reading',
            spineAr: 'القراءة',
            familyKey: 'quran',
            familyColor: '#087D91',
            familyEn: 'Quran',
            familyAr: 'القرآن الكريم',
          },
          currentLevel: {
            id: 'beginner',
            en: 'Foundations',
            ar: 'التأسيس',
            descEn: 'The letters, their sounds and the qaida, from zero.',
            descAr: 'الحروف وأصواتها والقاعدة، من الصفر.',
          },
          currentLevelIndex: 0,
          levels: [
            {
              id: 'beginner',
              en: 'Foundations',
              ar: 'التأسيس',
              descEn: 'The letters, their sounds and the qaida, from zero.',
              descAr: 'الحروف وأصواتها والقاعدة، من الصفر.',
            },
            {
              id: 'intermediate',
              en: 'Reading the Mushaf',
              ar: 'القراءة من المصحف',
              descEn: 'Knows the letters; reading from the Mushaf until it flows.',
              descAr: 'بيعرف الحروف، وبيقرأ من المصحف لحد ما يقرأ بطلاقة.',
            },
          ],
          lessonsAttended: { total: 0, thisMonth: 0 },
          weeklyRhythm: { current: 0, longest: 0 },
          milestones: [],
          familySummaries: [],
          placementResult: null,
          nextBookedLesson: null,
        },
      ],
    };

    const emptyHtml = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/student/progress'] },
        React.createElement(StudentProgressPage, { lang: 'en', initialData: newLearnerData })
      )
    );
    assert.ok(emptyHtml.includes('data-testid="new-learner-empty-state"'), 'Must render empty state for 0-lesson learner');
    assert.ok(emptyHtml.includes('Book your first lesson'), 'Empty state must invite booking the first lesson');
    assert.ok(emptyHtml.includes('data-learner-mode="child"'), 'Must adapt learner mode for child learners');

    // Paused streak: current = 0, longest = 3 -> "resting", never "lost"
    const restingData: ProgressApiResponse = {
      ...newLearnerData,
      subjects: newLearnerData.subjects.map((sub) => ({ ...sub, lessonsAttended: { total: 5, thisMonth: 0 }, weeklyRhythm: { current: 0, longest: 3 } })),
      overall: {
        lessonsAttended: { total: 5, thisMonth: 0 },
        weeklyRhythm: { current: 0, longest: 3 },
        milestonesCount: 0,
        nextBookedLesson: null,
      },
    };
    const restingHtml = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/student/progress'] },
        React.createElement(StudentProgressPage, { lang: 'en', initialData: restingData })
      )
    );
    assert.ok(
      restingHtml.includes('Resting. One lesson starts it again'),
      'Paused streak must use calm resting copy rather than shame or loss framing'
    );
  });
});
