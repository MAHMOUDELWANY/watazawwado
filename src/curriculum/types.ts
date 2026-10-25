// Curriculum lessons are data (docs/curriculum/PLAN.md §4.7). The player renders them; content never lives in components.

export type SceneId =
  // Literacy look options (plan Task 3; removed after the owner's pick)
  | 'lkA1' | 'lkA2' | 'lkB1' | 'lkB2' | 'lkC1' | 'lkC2'
  // Literacy B · Lesson 1 (all drawn in code, slides/motion/g-lb1.tsx)
  | 'lbCover' | 'lbStuck' | 'lbGuess' | 'lbBest' | 'lbMap' | 'lbCircle' | 'lbHelpers' | 'lbUthman' | 'lbSpot' | 'lbSort' | 'lbAlong' | 'lbMission' | 'lbNext'
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
  | 'lego'
  // Lesson 2 (paintings in public/curriculum/zad-kids/l02; threeWays and castleClues are drawn in code)
  | 'threeWays'
  | 'castleClues'
  | 'window'
  | 'hand'
  | 'baby'
  | 'desert'
  | 'crash'
  | 'sky'
  | 'lock'
  | 'look'
  | 'camel'
  | 'park'
  | 'boat'
  // Lesson 3 (paintings in public/curriculum/zad-kids/l03; twoCaptains, orbits, shahada, oneHeart, starPieces and needs
  // are drawn in code)
  | 'oneSun'
  | 'twoCaptains'
  | 'sunrise'
  | 'orbits'
  | 'shahada'
  | 'oneHeart'
  | 'recite'
  | 'starPieces'
  | 'needs'
  | 'masjidNight'
  | 'dua'
  | 'football'
  // Teens Lesson 1 (anime look, docs/curriculum/style/teens.md; paintings arrive at the built-pages step)
  | 'tDoors'
  | 'tCanteen'
  | 'tWhyList'
  | 'tMadinah'
  | 'tStranger'
  | 'tSitting'
  | 'tPillars'
  | 'tTruth'
  | 'tSix'
  | 'tIhsan'
  | 'tReveal'
  | 'tFathers'
  | 'tKnowWhy'
  | 'tNight'
  | 'tNext'
  // Teens Lesson 2 (paintings in public/curriculum/zad-teens/l02; tl2Chain, tl2Expand, tl2Three, tl2Tur, tl2Yaqeen and
  // tl2First are drawn in code)
  | 'tl2Cover'
  | 'tl2Science'
  | 'tl2Chain'
  | 'tl2Expand'
  | 'tl2Three'
  | 'tl2Tur'
  | 'tl2Yaqeen'
  | 'tl2Kitchen'
  | 'tl2Fitrah'
  | 'tl2First'
  | 'tl2Pitch'
  | 'tl2Bench'
  | 'tl2Gaming'
  // Teens Lesson 3 (paintings in public/curriculum/zad-teens/l03; tl3Orbits and tl3Shahada reuse the Kids Lesson 3 scenes;
  // tl3Recall, tl3Bosses, tl3Team, tl3Hawa, tl3Ikhlas, tl3Loved and tl3Center are drawn in code)
  | 'tl3Cover'
  | 'tl3Recall'
  | 'tl3Gaming'
  | 'tl3Bosses'
  | 'tl3Team'
  | 'tl3Orbits'
  | 'tl3Shahada'
  | 'tl3Likes'
  | 'tl3Hawa'
  | 'tl3Ikhlas'
  | 'tl3Loved'
  | 'tl3Center'
  | 'tl3Prayer'
  | 'tl3Library'
  // Adults Lesson 1 (documentary look, docs/curriculum/style/adults.md; paintings and code scenes arrive at the
  // built-pages step)
  | 'a1Cover'
  | 'a1Gap'
  | 'a1Madinah'
  | 'a1Stranger'
  | 'a1Cushions'
  | 'a1Pillars'
  | 'a1Six'
  | 'a1Ihsan'
  | 'a1Hour'
  | 'a1Reveal'
  | 'a1Levels'
  | 'a1Graves'
  | 'a1Count'
  | 'a1Know'
  | 'a1See'
  | 'a1Inside'
  | 'a1Horizon'
  | 'a1Lane'
  | 'a1Monday'
  | 'a1Case'
  | 'a1Case2'
  | 'a1Case3'
  | 'a1Case4'
  | 'a1Review'
  | 'a1Notebook'
  | 'a1Next'
  // Adults Lesson 2 (motion stages drawn in code, slides/motion/g-a2.tsx)
  | 'a2Cover'
  | 'a2Recall'
  | 'a2Question'
  | 'a2Hawking'
  | 'a2Cause'
  | 'a2Began'
  | 'a2Three'
  | 'a2Nothing'
  | 'a2Itself'
  | 'a2Tur'
  | 'a2Jubayr'
  | 'a2Yaqeen'
  | 'a2Back'
  | 'a2How'
  | 'a2First'
  | 'a2Order'
  | 'a2Signs'
  | 'a2Now'
  | 'a2Case'
  | 'a2Case2'
  | 'a2Case3'
  | 'a2Case4'
  | 'a2Review'
  | 'a2Notebook'
  | 'a2Next'
  // Adults Lesson 3 (motion stages drawn in code, slides/motion/g-a3.tsx)
  | 'a3Cover'
  | 'a3Recall'
  | 'a3Question'
  | 'a3Brady'
  | 'a3Carrey'
  | 'a3Hunger'
  | 'a3Fitrah'
  | 'a3Born'
  | 'a3Noise'
  | 'a3Sea'
  | 'a3Ikrimah'
  | 'a3Feel'
  | 'a3Dank'
  | 'a3Ghina'
  | 'a3Rest'
  | 'a3Night'
  | 'a3Two'
  | 'a3Case'
  | 'a3Case2'
  | 'a3Case3'
  | 'a3Case4'
  | 'a3Review'
  | 'a3Notebook'
  | 'a3Next';

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

/** The four mandatory stations of every lesson, in this order (docs/curriculum/RULES.md §1.5). */
export type Station = 'spark' | 'zad' | 'athar' | 'ahd';
export const STATIONS: Station[] = ['spark', 'zad', 'athar', 'ahd'];

/** Tadabbur stop required on every page that shows an ayah (RULES.md §1.6). */
export interface Tadabbur {
  /** Key word from the ayah, in Arabic. */
  word: string;
  root: string;
  meaning: string;
  /** "What is this ayah telling me?" phrased for the age band. */
  question: string;
  action: string;
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
  | { kind: 'sort'; prompt: string; look?: 'rings' | 'row'; bins: { id: string; label: string; hint: string }[]; cards: { label: string; bin: string; why?: string }[] };

/** Who speaks a clip (design §3a): the owner's ElevenLabs clones, the owner himself, or a Quran reciter. */
export type Voice = 'en' | 'eg' | 'fusha' | 'owner' | 'reciter';

/** A sound the learner can play again from the page. Fusha text is fully diacritized (owner, 2026-10-25). */
export interface Clip {
  /** Kebab-case; the file is public/curriculum/<subject>/audio/l<NN>-<id>.mp3. */
  id: string;
  text: string;
  voice: Voice;
  /** How it is said, for the ElevenLabs script ("warm", "curious"). */
  emotion?: string;
  /** An ayah: always the reciter, never a clone, streamed by surah:ayah. */
  quran?: boolean;
  ayah?: string;
}

export interface LessonPage {
  title: string;
  station: Station;
  layout: Layout;
  scene: SceneId;
  /** Big, short lines on the slide. Each one is a build step (the teacher reveals them one by one). */
  lines: string[];
  /** Labelled items on a concept slide; each is a build step after the lines. */
  items?: string[];
  evidence?: Evidence;
  tadabbur?: Tadabbur;
  vocab?: Vocab[];
  /** Sounds on this page the learner can replay (letters, words, lines, dialogues, ayat). */
  say?: Clip[];
  interaction?: Interaction;
  /** Ask the question before the items appear (a prediction), instead of after. */
  askFirst?: boolean;
  /** Adults show the ayah or hadith first and the lines after it, as what we draw from it (owner, 2026-10-23: never
   *  restate the text before it appears). Set this when the lines are the scene-setting the text needs before it. */
  contextFirst?: boolean;
  /** Read-aloud detail for the teacher: the fuller explanation behind the slide (owner, 2026-10-16). */
  explain: string[];
  /** Short tip on how to teach this page. Only the teacher sees it. */
  teacherNote?: string;
  /** Extra slide content for a 60-minute lesson; the teacher skips it in a 30-minute one (RULES.md §1.7). */
  optional?: boolean;
}

/** Arabic version of a page's teacher notes (the slide stays English). */
export interface TeacherNotesAr {
  title: string;
  explain: string[];
  note?: string;
}

export interface Lesson {
  subject: string;
  /** Age version (RULES.md §3): kids 6–11, teens 12–17, adults 18+. */
  version: 'kids' | 'teens' | 'adults';
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
  /** Arabic teacher notes, one per page, shown when the interface is Arabic. */
  teacherAr?: TeacherNotesAr[];
  /** The series opening ("meet the cast") that plays before the first lesson of a version (RULES.md §1.10). */
  opening?: SeriesOpening;
}

/** One recurring character, introduced in the series opening like the opening of an anime. */
export interface CastMember {
  id: string;
  name: string;
  nameAr: string;
  /** Shown as a chip when the story gives one. */
  age?: number;
  /** One line that makes you want to meet them. */
  line: string;
  traits: string[];
  /** Transparent character image (asset path). */
  img: string;
  /** Their colour in the opening. */
  color: string;
}

export interface SeriesOpening {
  cast: CastMember[];
  tagline: string;
  taglineAr: string;
}
