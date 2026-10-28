import { BOOKABLE_SERVICES } from './mockData';

/** The bookable subject for a learner's onboarding interest. A retired subject falls back to the default instead of a refused booking. */
export function serviceIdForInterest(rawInterest?: string | null): string {
  if (!rawInterest) return 'quran-reading';
  const interest = String(rawInterest).toLowerCase();
  const found = BOOKABLE_SERVICES.find(
    (s) =>
      s.id === interest ||
      s.group.toLowerCase() === interest ||
      s.name.toLowerCase().includes(interest) ||
      (interest.includes('reading') && s.id === 'quran-reading') ||
      (interest.includes('tajweed') && s.id === 'tajweed') ||
      (interest.includes('hifz') && s.id === 'quran-memorization') ||
      (interest.includes('memorization') && s.id === 'quran-memorization') ||
      (interest.includes('islamic') && s.id === 'islamic-studies') ||
      (interest.includes('arabic') && s.id === 'arabic') ||
      (interest.includes('english') && s.id === 'english')
  );
  return found ? found.id : 'quran-reading';
}
