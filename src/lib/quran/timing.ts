import type { QuranAudio } from '../../../server/quran/foundation';

/** The word being recited at `ms`, from the API's [position, startMs, endMs] timings; key is null between words. */
export function wordAt(audio: Pick<QuranAudio, 'verses'>, ms: number): { verseKey: string; key: string | null } | null {
  const v = audio.verses.find((x) => ms >= x.from && ms < x.to);
  if (!v) return null;
  const w = v.words.find(([, a, b]) => ms >= a && ms < b);
  return { verseKey: v.key, key: w ? `${v.key}:${w[0]}` : null };
}
