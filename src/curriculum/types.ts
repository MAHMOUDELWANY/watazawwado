// Curriculum lessons are data (docs/curriculum/PLAN.md §4.7). The player renders them; content never lives in components.

export type SceneId =
  | 'chalkboard'
  | 'doorsHero'
  | 'jiddo'
  | 'madinah'
  | 'stranger'
  | 'sitting'
  | 'pillars'
  | 'roots'
  | 'drawing'
  | 'reveal'
  | 'doors'
  | 'backpack'
  | 'lego';

/** How a page is laid out on the slide (docs/curriculum/PLAN.md §7, slide system v2). */
export type Layout =
  /** Lesson opener: big title, Arabic subtitle, goal, hero art. */
  | 'cover'
  /** Big scene with narration lines that build one by one. */
  | 'story'
  /** Arabic evidence written large, then its meaning. */
  | 'evidence'
  /** A labelled diagram: items appear one by one around the art. */
  | 'concept'
  /** One big question with a reveal. */
  | 'question'
  /** Game checkpoint, full slide. */
  | 'game'
  /** Home mission and the Zad backpack. */
  | 'mission'
  /** Cliffhanger to the next lesson. */
  | 'next';

/** Arabic evidence shown on a page: copied unchanged from a verified source, with our own English meaning. */
export interface Evidence {
  arabic: string;
  meaning: string;
  reference: string;
}

export interface Vocab {
  arabic: string;
  translit: string;
  meaning: string;
}

export type Interaction =
  /** The teacher asks; the answer is revealed on tap. */
  | { kind: 'ask'; prompt: string; reveal?: string }
  /** Tap the right clues in a set. */
  | { kind: 'clues'; prompt: string; clues: { label: string; correct: boolean }[] }
  /** The learner picks one option (no right answer). */
  | { kind: 'choose'; prompt: string; options: string[] }
  /** Game checkpoint: put each card in the right bin. Results feed the teacher report (PLAN §3a.3b). */
  | { kind: 'sort'; prompt: string; bins: { id: string; label: string; hint: string }[]; cards: { label: string; bin: string }[] };

export interface LessonPage {
  title: string;
  layout: Layout;
  scene: SceneId;
  /** Big, short lines on the slide. Each one is a build step (the teacher reveals them one by one). */
  lines: string[];
  /** Labelled items on a concept slide; each is a build step after the lines. */
  items?: string[];
  evidence?: Evidence;
  vocab?: Vocab[];
  interaction?: Interaction;
  /** Ask the question before the items appear (a prediction), instead of after. */
  askFirst?: boolean;
  /** Read-aloud detail for the teacher: the fuller explanation behind the slide (owner, 2026-10-16). */
  explain: string[];
  /** Short tip on how to teach this page. Only the teacher sees it. */
  teacherNote?: string;
}

export interface Lesson {
  subject: string;
  subjectTitle: string;
  number: number;
  title: string;
  titleAr: string;
  part: string;
  minutes: number;
  goal: string;
  outcomes: string[];
  /** Short names for the steps shown in the "In this lesson" tracker, with the page index where each starts. */
  chapters: { label: string; page: number }[];
  /** False until the owner approves the content (PLAN §3.4). Unreviewed lessons are teacher-only drafts. */
  reviewed: boolean;
  pages: LessonPage[];
}
