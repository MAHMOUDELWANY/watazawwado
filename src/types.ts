export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark';

export interface ServiceItem {
  id: string;
  name: string;
  arabicName?: string;
  category: 'quran' | 'islamic_studies' | 'arabic' | 'english';
  tagline: string;
  arabicTagline?: string;
  description: string;
  arabicDescription?: string;
  whoIsItFor: string;
  arabicWhoIsItFor?: string;
  whatYouWillLearn: string[];
  arabicWhatYouWillLearn?: string[];
  durations: (30 | 45 | 60)[];
  recommendedFrequency: string;
  arabicRecommendedFrequency?: string;
}

export interface ServicePillar {
  id: 'quran' | 'islamic_studies' | 'arabic' | 'english';
  title: string;
  arabicTitle: string;
  description: string;
  arabicDescription?: string;
  services: ServiceItem[];
}

export interface TestimonialItem {
  id: string;
  quote: string;
  arabicQuote?: string;
  author: string;
  arabicAuthor?: string;
  role: string;
  arabicRole?: string;
  location: string;
  arabicLocation?: string;
  subject: string;
  arabicSubject?: string;
  durationWithMahmoud: string;
  arabicDurationWithMahmoud?: string;
}

export interface FAQItem {
  question: string;
  arabicQuestion?: string;
  answer: string;
  arabicAnswer?: string;
  category: 'general' | 'trial' | 'booking' | 'teaching';
}
