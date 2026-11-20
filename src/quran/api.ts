import { authedJson } from '../lib/authedJson';
import type { QuranAudio, QuranChapter, QuranPage, QuranWord } from '../../server/quran/foundation';

export type { QuranAudio, QuranChapter, QuranPage, QuranWord };
export type Reciter = { id: number; en: string; ar: string };
export type MarkType = 'wrong_word' | 'missed' | 'added' | 'tajweed';
export type Mark = { id: string; bookingId: string; verseKey: string; word: number; type: MarkType; note: string | null; createdAt: string };
/** "2:255:3": surah, ayah, word position. */
export const wordKey = (verseKey: string, word: number) => `${verseKey}:${word}`;

/**
 * Classroom 4.1: the mushaf reads go through our server (the Quran Foundation keys never reach the browser).
 * Families and child phones use /api/student/quran, staff /api/dashboard/quran. Results are kept for the visit.
 */
export function quranApi(scope: 'student' | 'dashboard') {
  const base = `/api/${scope}/quran`;
  const memo = new Map<string, Promise<any>>();
  const get = <T,>(path: string): Promise<T> => {
    if (!memo.has(path)) memo.set(path, authedJson<T>(base + path).catch((e) => { memo.delete(path); throw e; }));
    return memo.get(path)!;
  };
  return {
    page: (n: number) => get<QuranPage>(`/page/${n}`),
    chapters: () => get<{ chapters: QuranChapter[]; reciters: Reciter[] }>('/chapters'),
    pageOf: async (verseKey: string) => (await get<{ page: number }>(`/verse/${verseKey}`)).page,
    audio: (reciter: number, chapter: number) => get<QuranAudio>(`/audio/${reciter}/${chapter}`),
    /** Every word of an ayah range, in order, with its simple spelling (for the detector). */
    async rangeWords(surah: number, from: number, to: number): Promise<Array<{ key: string; text: string }>> {
      const [first, last] = await Promise.all([this.pageOf(`${surah}:${from}`), this.pageOf(`${surah}:${to}`)]);
      const pages = await Promise.all(Array.from({ length: last - first + 1 }, (_, i) => this.page(first + i)));
      return pages.flatMap((p) => p.verses)
        .filter((v) => v.chapter === surah && v.verse >= from && v.verse <= to)
        .flatMap((v) => v.words.map((w) => ({ key: wordKey(v.key, w.p), text: w.s })));
    },
  };
}
export type QuranApi = ReturnType<typeof quranApi>;

const shared: Partial<Record<'student' | 'dashboard', QuranApi>> = {};
export const sharedQuranApi = (scope: 'student' | 'dashboard') => (shared[scope] ??= quranApi(scope));
