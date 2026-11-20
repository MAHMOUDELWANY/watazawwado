/**
 * Classroom teaching tools (BUILD-LIST 2.10, 2.11): the shared state the teacher drives and the learner follows.
 * Pure, shared by the browser (live) and the server (the room snapshot, so a rejoin gets the tools back).
 */

/** The four stages of a lesson, in order. */
export const STAGES = ['review', 'lesson', 'practice', 'close'] as const;
export type Stage = (typeof STAGES)[number];

/** Curriculum stations (docs/curriculum/RULES.md §1.5) mapped to the room's stages: the bar suggests one from the slide. */
const STATION_STAGE: Record<string, Stage> = { spark: 'lesson', zad: 'lesson', athar: 'practice', ahd: 'close' };
export const stageForStation = (station: string | null | undefined): Stage | null => (station && STATION_STAGE[station]) || null;

export const PRACTICE_KINDS = ['none', 'tashkeel', 'blanks', 'unscramble', 'wheel', 'match', 'roleplay'] as const;
export type PracticeKind = (typeof PRACTICE_KINDS)[number];

/**
 * One practice activity on screen. `text`: the passage (tashkeel, blanks, unscramble). `items`: wheel questions, or
 * [teacher card, learner card] for role-play. `pairs`: word matching. `show`: answers (or tashkeel) shown. `index`: the
 * wheel's current question (-1 none). `seed`: which words are blanked or how they are shuffled, the same on both sides.
 */
export type Practice = { kind: PracticeKind; text?: string; items?: string[]; pairs?: [string, string][]; show?: boolean; index?: number; seed?: number };

export type MediaKind = 'audio' | 'youtube' | 'none';
/** A shared audio file or YouTube video: where it was and whether it played when sent. `savedAt` is added by the server. */
export type MediaState = { kind: MediaKind; src: string; playing: boolean; pos: number; savedAt?: number };

export type CheckLevel = 'green' | 'amber' | 'red';
export type CheckState = { id: string; part: string; open: boolean; answer?: CheckLevel };

export type ToolsState = {
  stage?: Stage;
  check?: CheckState;
  media?: MediaState;
  practice?: Practice;
  /** The teacher's last recorded line for shadowing ('' none). */
  shadow?: string;
};

/** Every tool event; the full RoomEvent union in roomEvents.ts includes these. */
export type ToolEvent =
  | { t: 'correction'; id: string; said: string; correct: string; note?: string }
  | { t: 'check'; id: string; part: string; open: boolean }
  | { t: 'check_answer'; id: string; part: string; level: CheckLevel }
  | { t: 'stage'; stage: Stage }
  | { t: 'media'; kind: MediaKind; src: string; playing: boolean; pos: number }
  | { t: 'practice'; practice: Practice }
  | { t: 'practice_answer'; kind: PracticeKind; answer: string[] }
  | { t: 'shadow'; fileId: string };

/** Tool events that change the room snapshot. */
export const TOOL_STATE_TYPES: ReadonlySet<string> = new Set(['check', 'check_answer', 'stage', 'media', 'practice', 'shadow']);

/** Applies one event to the tools state (returns the same object when nothing changes). `now` stamps shared media. */
export function reduceTools(s: ToolsState, e: { t: string } & Record<string, any>, now: number): ToolsState {
  switch (e.t) {
    case 'stage': return { ...s, stage: e.stage };
    case 'check': return { ...s, check: { id: e.id, part: e.part, open: e.open, ...(s.check?.id === e.id && s.check.answer ? { answer: s.check.answer } : {}) } };
    // An answer counts once for the question it belongs to, and closes the card.
    case 'check_answer': return s.check?.id === e.id ? { ...s, check: { ...s.check, open: false, answer: e.level } } : s;
    case 'media': return { ...s, media: e.kind === 'none' ? { kind: 'none', src: '', playing: false, pos: 0, savedAt: now } : { kind: e.kind, src: e.src, playing: e.playing, pos: e.pos, savedAt: now } };
    case 'practice': return { ...s, practice: e.practice };
    case 'shadow': return { ...s, shadow: e.fileId };
    default: return s;
  }
}

/** Where shared media should be now (seconds): a playing one has moved on since it was sent. */
export function mediaPosition(m: MediaState, now: number): number {
  if (!m.playing || m.savedAt == null) return m.pos;
  return m.pos + Math.max(0, now - m.savedAt) / 1000;
}

// ---- checks used by isRoomEvent -----------------------------------------------------------------------------------
const str = (min: number, max: number) => (v: unknown) => typeof v === 'string' && v.length >= min && v.length <= max;
const AUDIO_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|m4a|ogg|webm|wav)$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
export const isAudioFileId = (v: unknown) => typeof v === 'string' && AUDIO_FILE.test(v);
export const isYouTubeId = (v: unknown) => typeof v === 'string' && YOUTUBE_ID.test(v);
export const isMediaSrc = (v: unknown) => v === '' || isYouTubeId(v) || isAudioFileId(v);

export function isPractice(v: any): v is Practice {
  if (!v || typeof v !== 'object' || !(PRACTICE_KINDS as readonly string[]).includes(v.kind)) return false;
  const allowed = ['kind', 'text', 'items', 'pairs', 'show', 'index', 'seed'];
  if (!Object.keys(v).every((k) => allowed.includes(k))) return false;
  return (v.text === undefined || str(0, 4000)(v.text))
    && (v.items === undefined || (Array.isArray(v.items) && v.items.length <= 30 && v.items.every(str(0, 300))))
    && (v.pairs === undefined || (Array.isArray(v.pairs) && v.pairs.length <= 12 && v.pairs.every((p: any) => Array.isArray(p) && p.length === 2 && p.every(str(1, 120)))))
    && (v.show === undefined || typeof v.show === 'boolean')
    && (v.index === undefined || (Number.isInteger(v.index) && v.index >= -1 && v.index < 30))
    && (v.seed === undefined || (Number.isInteger(v.seed) && v.seed >= 0 && v.seed < 2 ** 31));
}

export const TOOL_EVENT_KEYS: Record<ToolEvent['t'], Record<string, (v: any) => boolean>> = {
  correction: { id: str(1, 40), said: str(1, 300), correct: str(1, 300), note: (v) => v === undefined || str(0, 500)(v) },
  check: { id: str(1, 40), part: str(0, 120), open: (v) => typeof v === 'boolean' },
  check_answer: { id: str(1, 40), part: str(0, 120), level: (v) => v === 'green' || v === 'amber' || v === 'red' },
  stage: { stage: (v) => (STAGES as readonly unknown[]).includes(v) },
  media: { kind: (v) => v === 'audio' || v === 'youtube' || v === 'none', src: isMediaSrc, playing: (v) => typeof v === 'boolean', pos: (v) => Number.isFinite(v) && v >= 0 && v < 86_400 },
  practice: { practice: isPractice },
  practice_answer: { kind: (v) => (PRACTICE_KINDS as readonly unknown[]).includes(v), answer: (v) => Array.isArray(v) && v.length <= 30 && v.every(str(0, 200)) },
  shadow: { fileId: (v) => v === '' || isAudioFileId(v) },
};
