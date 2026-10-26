import type { SeriesOpening } from '../../types';

// Series opening for Reading Arabic · Kids: the neutral literacy cast (docs/curriculum/CAST-PROMPTS.md §B), introduced
// like the Zad openings before Lesson 1. Neutral and modest: the course is for every child (DECISIONS-2026-10-26 §7, §13).
export const literacyKidsOpening: SeriesOpening = {
  tagline: 'All aboard the Letter Train!',
  taglineAr: 'يلا نركب قطار الحروف!',
  cast: [
    { id: 'rami', name: 'Rami', nameAr: 'رامي', age: 8, line: 'Spots letters everywhere. On signs, on boxes, on his cereal.', traits: ['Curious', 'Fast', 'Loves a challenge'], img: 'literacy-a-kids/characters/rami-point.webp', color: '#0E7C86' },
    { id: 'dalia', name: 'Dalia', nameAr: 'داليا', age: 7, line: 'Wants to read every book on the shelf. Every single one.', traits: ['Bookworm', 'Patient', 'Big questions'], img: 'literacy-a-kids/characters/dalia-read.webp', color: '#E0603F' },
    { id: 'hibr', name: 'Hibr', nameAr: 'حِبْر', line: 'An owl who knows every letter. Still falls over his own ribbon.', traits: ['Clever', 'A bit clumsy', 'Carries the letter cards'], img: 'literacy-a-kids/characters/hibr-glasses.webp', color: '#2B4FA8' },
  ],
};
