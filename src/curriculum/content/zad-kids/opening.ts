import type { SeriesOpening } from '../../types';

// Series opening for Zad Essentials · Kids: the family from MAP.md, introduced like a cartoon opening before Lesson 1.
export const kidsOpening: SeriesOpening = {
  tagline: 'Pack your Zad. The adventure starts now!',
  taglineAr: 'جهّز زادك، المغامرة بدأت',
  cast: [
    { id: 'yusuf', name: 'Yusuf', nameAr: 'يوسف', age: 9, line: 'Asks "why?" about everything. Everything!', traits: ['Curious', 'Football fan', 'Brave'], img: 'characters/yusuf-point.webp', color: '#0E7C86' },
    { id: 'maryam', name: 'Maryam', nameAr: 'مريم', age: 7, line: 'Spots what everyone else misses.', traits: ['Clever', 'Kind', 'Sharp eyes'], img: 'characters/maryam-happy.webp', color: '#C51F24' },
    { id: 'jiddo', name: 'Jiddo', nameAr: 'جدّو', line: 'Has a story for every question.', traits: ['Grandpa', 'Wise', 'The old backpack'], img: 'characters/jiddo-explain.webp', color: '#8B4935' },
    { id: 'mishmish', name: 'Mishmish', nameAr: 'مشمش', line: 'The cat. Officially. Secretly, the boss.', traits: ['Fluffy', 'Fast', 'Always hungry'], img: 'characters/mishmish-leap.webp', color: '#E58A2B' },
  ],
};
