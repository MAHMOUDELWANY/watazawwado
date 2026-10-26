// Curriculum lessons are data (docs/curriculum/PLAN.md §4.7). The player renders them; content never lives in components.

export type SceneId =
  // Literacy look options (plan Task 3; removed after the owner's pick)
  | 'lkA1' | 'lkA2' | 'lkB1' | 'lkB2' | 'lkC1' | 'lkC2'
  // Literacy B · Lesson 1 (all drawn in code, slides/motion/g-lb1.tsx)
  // Literacy A · Kids · Lesson 1 and Fusha · Kids · Lesson 1 (drawn in code)
  | 'la1Cover' | 'la1Note' | 'la1Guess' | 'la1Alif' | 'la1Baa' | 'la1Taa' | 'la1Thaa' | 'la1Trick' | 'la1Find' | 'la1Sort' | 'la1Word' | 'la1Mission' | 'la1Next'
  | 'fk1Cover' | 'fk1Game' | 'fk1Story' | 'fk1Haadha' | 'fk1Maa' | 'fk1Man' | 'fk1Words' | 'fk1Talk' | 'fk1Spot' | 'fk1Sort' | 'fk1Mission' | 'fk1Next'
  // English · Kids · Lesson 1 (drawn in code, slides/motion/g-en1.tsx)
  | 'en1Cover' | 'en1Garden' | 'en1S' | 'en1A' | 'en1T' | 'en1Blend' | 'en1Find' | 'en1Sort' | 'en1Read' | 'en1Mission' | 'en1Next'
  // Quran Reading · Lesson 1 (drawn in code, slides/motion/g-qr1.tsx)
  | 'qr1Cover' | 'qr1Seventeen' | 'qr1Moves' | 'qr1Ayah1' | 'qr1Ayah2' | 'qr1Ayah4' | 'qr1Ayah5' | 'qr1Ayah6' | 'qr1Review' | 'qr1Read' | 'qr1Mission' | 'qr1Next'
  // Tajweed · Level 1 · Lesson 1 (drawn in code, slides/motion/g-tj1.tsx)
  | 'tj1Cover' | 'tj1Qalb' | 'tj1Tarteel' | 'tj1Right' | 'tj1Stumble' | 'tj1Mistakes' | 'tj1Layers' | 'tj1Istiadha' | 'tj1Basmalah' | 'tj1Review' | 'tj1Recite' | 'tj1Mission' | 'tj1Next'
  // Literacy A · Adults · Lesson 1 (drawn in code, slides/motion/g-lt1.tsx)
  | 'lt1Cover' | 'lt1Sign' | 'lt1Guess' | 'lt1Alif' | 'lt1Baa' | 'lt1Taa' | 'lt1Thaa' | 'lt1System' | 'lt1Find' | 'lt1Review' | 'lt1Word' | 'lt1Mission' | 'lt1Next'
  // Egyptian Arabic · Adults · Lesson 1 (drawn in code, slides/motion/g-ea1.tsx)
  | 'ea1Cover' | 'ea1Book' | 'ea1Door' | 'ea1Pairs' | 'ea1Eh' | 'ea1Mona' | 'ea1Suffix' | 'ea1Hadra' | 'ea1Sorry' | 'ea1Bye' | 'ea1Review' | 'ea1Talk' | 'ea1Mission' | 'ea1Next'
  // Fusha · 12+ · Lesson 1 (drawn in code, slides/motion/g-ft1.tsx)
  | 'ft1Cover' | 'ft1Arrive' | 'ft1Listen' | 'ft1Haadhihi' | 'ft1MaaMan' | 'ft1NoIs' | 'ft1Words' | 'ft1Sort' | 'ft1Talk' | 'ft1Mission' | 'ft1Next'
  // Literacy A · Teens · Lesson 1 (drawn in code, slides/motion/g-lq1.tsx)
  | 'lq1Cover' | 'lq1Message' | 'lq1Guess' | 'lq1Alif' | 'lq1Three' | 'lq1Speed' | 'lq1Rule' | 'lq1Sort' | 'lq1Word' | 'lq1Write' | 'lq1Mission' | 'lq1Next'
  // Egyptian Arabic · Kids · Lesson 1 (drawn in code, slides/motion/g-egy.tsx)
  | 'ek1Cover' | 'ek1Door' | 'ek1Listen' | 'ek1Hello' | 'ek1Ismi' | 'ek1AkIk' | 'ek1Bye' | 'ek1Sort' | 'ek1Talk' | 'ek1Mission' | 'ek1Next'
  // Egyptian Arabic · Teens · Lesson 1 (drawn in code, slides/motion/g-egy.tsx)
  | 'et1Cover' | 'et1Club' | 'et1Listen' | 'et1How' | 'et1Ending' | 'et1Hi' | 'et1Names' | 'et1Sort' | 'et1Talk' | 'et1Mission' | 'et1Next'
  // English · General · Lesson 1 (drawn in code, slides/motion/g-eng.tsx)
  | 'eg1Cover' | 'eg1Cafe' | 'eg1Listen' | 'eg1Im' | 'eg1Youre' | 'eg1Name' | 'eg1Bye' | 'eg1Sort' | 'eg1Talk' | 'eg1Mission' | 'eg1Next'
  // English · Exams · Lesson 1 (drawn in code, slides/motion/g-eng.tsx)
  | 'ex1Cover' | 'ex1Short' | 'ex1Bands' | 'ex1Part1' | 'ex1Are' | 'ex1Length' | 'ex1Link' | 'ex1Sort' | 'ex1Timed' | 'ex1Mission' | 'ex1Next'
  // Seerah · Kids · Episode 1 (drawn in code, slides/motion/g-sk1.tsx)
  | 'sk1Cover' | 'sk1Makkah' | 'sk1Abraha' | 'sk1Scales' | 'sk1March' | 'sk1Hills' | 'sk1Kneel' | 'sk1Birds' | 'sk1Fil' | 'sk1Sort' | 'sk1Baby' | 'sk1Mission' | 'sk1Next'
  // Seerah · Teens & Adults · Episode 1 (the owner's stills + code motion)
  | 'se1Cover' | 'se1Empires' | 'se1Jahiliyyah' | 'se1Makkah' | 'se1Abraha' | 'se1Qullays' | 'se1Scales' | 'se1March' | 'se1Camp' | 'se1Walk' | 'se1Tent' | 'se1Trust' | 'se1Kneel' | 'se1Spear' | 'se1Birds' | 'se1Fil' | 'se1Aftermath' | 'se1Sort' | 'se1Cradle' | 'se1Mission' | 'se1Next'
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
