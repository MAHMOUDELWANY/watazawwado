// Curriculum lessons are data (docs/curriculum/PLAN.md §4.7). The player renders them; content never lives in components.

export type SceneId =
  | 'classroom'
  | 'jiddo'
  | 'madinah'
  | 'sitting'
  | 'islam'
  | 'iman'
  | 'ihsan'
  | 'reveal'
  | 'doors'
  | 'backpack'
  | 'lego';

/** Arabic evidence shown on a page: copied unchanged from a verified source, with our own English meaning. */
export interface Evidence {
  arabic: string;
  meaning: string;
  reference: string;
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
  scene: SceneId;
  lines: string[];
  /** Shown as a list; hidden behind an 'ask' interaction until it is revealed. */
  items?: string[];
  evidence?: Evidence;
  interaction?: Interaction;
  /** Only the teacher sees this. */
  teacherNote?: string;
}

export interface Lesson {
  subject: string;
  subjectTitle: string;
  number: number;
  title: string;
  part: string;
  minutes: number;
  outcomes: string[];
  /** False until the owner approves the content (PLAN §3.4). Unreviewed lessons are teacher-only drafts. */
  reviewed: boolean;
  pages: LessonPage[];
}
