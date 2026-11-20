/** Spec §9: Quran tracks (reading, tajweed, memorisation and revision), Islamic studies and Fusha see the Quran tab. Nobody else. */
export const QURAN_TAB_SUBJECTS = ['quran-reading', 'tajweed', 'quran-memorization', 'zad-essentials', 'seerah', 'modern-standard-arabic'] as const;
export const quranTabAllowed = (subjects: Array<string | null | undefined>) =>
  subjects.some((s) => typeof s === 'string' && (QURAN_TAB_SUBJECTS as readonly string[]).includes(s));
