import type { SeriesOpening } from '../../types';

// Series opening for Reading Arabic · Teens: the neutral literacy cast (docs/curriculum/CAST-PROMPTS.md §C), introduced
// like the Zad openings before Lesson 1. Neutral and modest: the course is for everyone (DECISIONS-2026-10-26 §7, §13).
export const literacyTeensOpening: SeriesOpening = {
  tagline: 'Every sign in the city is a code. Let\'s crack it.',
  taglineAr: 'كل لافتة في المدينة شفرة. يلا نفكّها',
  cast: [
    { id: 'karim', name: 'Karim', nameAr: 'كريم', age: 15, line: 'Gets messages in Arabic he can\'t read. Yet.', traits: ['Gamer', 'Quick learner', 'Hates being left out'], img: 'literacy-a-teens/characters/karim-phone.webp', color: '#0E7C86' },
    { id: 'lina', name: 'Lina', nameAr: 'لينا', age: 14, line: 'Treats every word like a puzzle. Never stops till it\'s solved.', traits: ['Code breaker', 'Notebook always open', 'Confident'], img: 'literacy-a-teens/characters/lina-decode.webp', color: '#C51F24' },
  ],
};
