import type { SeriesOpening } from '../../types';

// Series opening for Zad Essentials · Teens: the cast from MAP.md, introduced like an anime opening before Lesson 1.
export const teensOpening: SeriesOpening = {
  tagline: 'Every question deserves a real answer.',
  taglineAr: 'كل سؤال يستاهل إجابة حقيقية',
  cast: [
    { id: 'zayn', name: 'Zayn', nameAr: 'زين', age: 15, line: 'Muslim by family. About to find out why.', traits: ['Football', 'Gamer', 'Big questions'], img: 'zad-teens/characters/zayn-point.webp', color: '#0E7C86' },
    { id: 'noor', name: 'Noor', nameAr: 'نور', age: 13, line: 'Writes down every question nobody answers.', traits: ['Sharp', 'Keeps the Why List', 'Never lets it go'], img: 'zad-teens/characters/noor-happy.webp', color: '#C51F24' },
    { id: 'ethan', name: 'Ethan', nameAr: 'إيثان', line: "Zayn's best friend. Not Muslim. Asks the honest questions.", traits: ['Curious', 'Fair', 'Zero filter'], img: 'zad-teens/characters/ethan-ask.webp', color: '#2B5DA8' },
    { id: 'amira', name: 'Amira', nameAr: 'أميرة', line: 'Was told what to do. Never told why.', traits: ["Noor's best friend", 'Quiet', 'Searching'], img: 'zad-teens/characters/amira-smile.webp', color: '#6B4C9A' },
    { id: 'hamza', name: 'Hamza', nameAr: 'حمزة', age: 22, line: 'The cousin who answers a question with a better question.', traits: ['University', 'Patient', 'Always online'], img: 'zad-teens/characters/hamza-explain.webp', color: '#8B4935' },
    { id: 'salma', name: 'Aunt Salma', nameAr: 'خالة سلمى', line: 'The one Noor can ask about the real stuff.', traits: ['Warm', 'Honest', 'Never shocked'], img: 'zad-teens/characters/salma-explain.webp', color: '#B7821A' },
  ],
};
