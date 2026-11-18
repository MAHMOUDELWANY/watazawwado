import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../LangLink';
import { NewToIslamDoor } from '../NewToIslamDoor';
import { useReveal, rv } from './useReveal';

/**
 * "Where will you begin?": the four tracks we teach (RULES.md §2b), each with the painting of its own course banner
 * (public/curriculum/banners). Wide screens: a list of large names beside one painting that changes with the track
 * under the pointer or the keyboard. Phones: each track carries its painting.
 */

type L = { en: string; ar: string };
type Track = { key: string; to: string; art: string; title: L; body: L; price: L };

const TRACKS: Track[] = [
  {
    key: 'quran', to: '/learning?family=quran', art: '/curriculum/banners/quran.webp',
    title: { en: 'Quran', ar: 'القرآن' },
    body: { en: 'Reading from the first letter, Tajweed, and memorization with steady revision.', ar: 'القراءة من أول حرف، والتجويد، والحفظ مع مراجعة ثابتة.' },
    price: { en: '$10 an hour', ar: '١٠$ للساعة' },
  },
  {
    key: 'zad', to: '/learning?family=islamic_studies', art: '/curriculum/banners/seerah-teens.webp',
    title: { en: 'The Zad Path', ar: 'مسار الأثر' },
    body: { en: 'Our own curriculum: Zad Essentials and the Seerah, in a version for children, teens and adults.', ar: 'منهجنا الخاص: أول الزاد والسيرة، بنسخة للأطفال والشباب والكبار.' },
    price: { en: '$10 an hour', ar: '١٠$ للساعة' },
  },
  {
    key: 'arabic', to: '/learning?family=arabic', art: '/curriculum/banners/fusha-12-3.webp',
    title: { en: 'Arabic', ar: 'العربية' },
    body: { en: 'Fusha from the letters to real conversation, and Egyptian Arabic the way people speak it.', ar: 'الفصحى من الحروف إلى المحادثة، والعامية المصرية كما يتكلّمها الناس.' },
    price: { en: '$13 an hour', ar: '١٣$ للساعة' },
  },
  {
    key: 'english', to: '/learning?family=english', art: '/curriculum/banners/english.webp',
    title: { en: 'English', ar: 'الإنجليزية' },
    body: { en: 'Phonics and first reading for children; from twelve, level by level up to C1.', ar: 'للأطفال: أصوات الحروف وأول قراءة. ومن ١٢ سنة: مستوى بعد مستوى حتى C1.' },
    price: { en: '$13 an hour', ar: '١٣$ للساعة' },
  },
];

export const SUBJECT_COUNT = { en: '8 subjects, your own teacher.', ar: '٨ مواد، ومعلم لك أنت.' };

export function Tracks({ isEn }: { isEn: boolean }) {
  const ref = useReveal<HTMLElement>(0.1);
  const [active, setActive] = React.useState(0);
  const t = (l: L) => (isEn ? l.en : l.ar);

  return (
    <section ref={ref} id="home-tracks" className="scroll-mt-24" aria-labelledby="home-tracks-title">
      <div className="public-container py-20 sm:py-28 lg:py-36">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="home-tracks-title" {...rv(0)} className={`rv lg:col-span-7 home-display text-foreground text-[2.6rem] sm:text-6xl lg:text-[4.4rem] ${isEn ? 'font-medium' : ''}`}>
            {isEn ? 'Where will you begin?' : 'من أين تبدأ؟'}
          </h2>
          <p {...rv(1)} className="rv lg:col-span-5 text-lg sm:text-xl leading-relaxed text-foreground">
            {isEn
              ? 'Four tracks, one way of teaching: one to one, at your pace, with a teacher who knows you.'
              : 'أربعة مسارات، وطريقة واحدة: حصة فردية، على قدر خطوتك، مع معلّم يعرفك.'}
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* The painting of the track in focus (wide screens). */}
          <div className="hidden lg:block lg:col-span-5 lg:order-2" aria-hidden="true">
            <div className="sticky top-28 aspect-[4/5] overflow-hidden rounded-[var(--r-4)] bg-[#1C1411]">
              {TRACKS.map((tr, i) => (
                <img
                  key={tr.key}
                  src={tr.art}
                  alt=""
                  width={1000}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className="track-art absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: i === active ? 1 : 0, transform: i === active ? 'scale(1)' : 'scale(1.06)' }}
                />
              ))}
            </div>
          </div>

          <ul className="lg:col-span-7 lg:order-1 divide-y-0">
            {TRACKS.map((tr, i) => (
              <li key={tr.key} {...rv(i + 2)}>
                <Link
                  to={tr.to}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="track-row group block py-6 sm:py-8 focus-ring rounded-[var(--r-3)]"
                >
                  {/* Phones: the painting as a wide band above the name. */}
                  <span className="lg:hidden block aspect-[16/9] overflow-hidden rounded-[var(--r-3)] mb-5 bg-[#1C1411]" aria-hidden="true">
                    <img src={tr.art} alt="" width={1000} height={1000} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </span>
                  <span className="flex items-baseline justify-between gap-6">
                    <span className={`home-display text-[2.4rem] sm:text-6xl lg:text-[4rem] transition-colors ${i === active ? 'lg:text-foreground' : 'lg:text-foreground/35'} text-foreground group-hover:text-foreground ${isEn ? 'font-medium' : ''}`}>
                      {t(tr.title)}
                    </span>
                    <span className="shrink-0 text-sm sm:text-base font-semibold text-muted-foreground">{t(tr.price)}</span>
                  </span>
                  <span className="mt-3 flex items-start justify-between gap-6">
                    <span className="text-lg leading-relaxed text-foreground max-w-[32rem]">{t(tr.body)}</span>
                    <ArrowRight className="track-arrow w-6 h-6 mt-1 shrink-0 text-[var(--crimson)]" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div {...rv(7)} className="rv mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <Link to="/learning" className="inline-flex items-center gap-2 min-h-11 font-bold text-foreground underline decoration-[var(--gold)] decoration-2 underline-offset-[6px] hover:decoration-[var(--crimson)] focus-ring rounded-md">
            {t(SUBJECT_COUNT)} {isEn ? 'See them all' : 'شوفها كلها'}
          </Link>
          <Link to="/pricing" className="inline-flex items-center min-h-11 text-muted-foreground hover:text-foreground underline underline-offset-4 focus-ring rounded-md">
            {isEn ? 'Packages bring the hour lower' : 'الباقات تقلّل سعر الساعة'}
          </Link>
        </div>
        <div {...rv(8)} className="rv [&>*]:!mx-0">
          <NewToIslamDoor isEn={isEn} />
        </div>
      </div>
    </section>
  );
}
