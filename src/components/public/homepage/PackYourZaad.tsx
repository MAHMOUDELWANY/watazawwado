import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../LangLink';
import { PublicButton } from '../PublicDesignSystem';
import { findSubjectPage, SUBJECT_PAGES_PATH } from '../../../data/subjectPages';
import { useReveal, rv } from './useReveal';

/**
 * "What will you pack?": the page's one live thing (owner, 2026-11-18; the "Pack your zaad" idea, BRAND.md §5–6).
 * The visitor says who is learning, then taps subjects into the zaad bag. Each tap flies the subject into the bag;
 * the bag shows what it holds and where to read more, and the button starts the free lesson with the first subject
 * preselected. Replaces the "Who is the learning for?" finder. Works without motion (no flight) and with a keyboard
 * (the subjects are toggle buttons).
 */

type L = { en: string; ar: string };
type Who = 'me' | 'child' | 'teen' | 'family';
type Subject = { id: string; glyph: string; name: L; page: (who: Who) => string | null };

const kids = (who: Who) => who === 'child';
const SUBJECTS: Subject[] = [
  { id: 'quran-reading', glyph: 'ق', name: { en: 'Quran reading', ar: 'قراءة القرآن' }, page: (w) => (kids(w) ? 'online-quran-classes-for-kids' : 'online-quran-classes-for-adults') },
  { id: 'tajweed', glyph: 'ج', name: { en: 'Tajweed', ar: 'التجويد' }, page: () => 'online-tajweed-classes' },
  { id: 'quran-memorization', glyph: 'ح', name: { en: 'Memorization', ar: 'الحفظ والمراجعة' }, page: () => 'online-quran-memorization' },
  { id: 'zad-essentials', glyph: 'ز', name: { en: 'Zad Essentials', ar: 'أول الزاد' }, page: (w) => (w === 'me' ? null : 'islamic-classes-for-kids') },
  { id: 'seerah', glyph: 'س', name: { en: 'Seerah', ar: 'السيرة' }, page: (w) => (w === 'me' ? null : 'islamic-classes-for-kids') },
  { id: 'modern-standard-arabic', glyph: 'ض', name: { en: 'Fusha Arabic', ar: 'الفصحى' }, page: () => 'learn-arabic-online' },
  { id: 'egyptian-arabic', glyph: 'م', name: { en: 'Egyptian Arabic', ar: 'العامية المصرية' }, page: () => 'learn-egyptian-arabic-online' },
  { id: 'english', glyph: 'E', name: { en: 'English', ar: 'الإنجليزية' }, page: () => 'online-english-classes' },
];

const WHO: { id: Who; label: L }[] = [
  { id: 'me', label: { en: 'Me', ar: 'أنا' } },
  { id: 'child', label: { en: 'My child', ar: 'طفلي' } },
  { id: 'teen', label: { en: 'My teen', ar: 'ابني المراهق' } },
  { id: 'family', label: { en: 'Our family', ar: 'العائلة كلها' } },
];

const NOTE: Record<Who, L> = {
  me: { en: 'Lessons for adults, at your pace, with a male or female teacher.', ar: 'حصص للكبار، على قدر وقتك، مع معلّم أو معلّمة.' },
  child: { en: 'Ages 6 to 11. The Zad Path has its own children’s version, and a report reaches you after every lesson.', ar: 'من ٦ إلى ١١ سنة. لمسار الأثر نسخة خاصة بالأطفال، وتقرير يصلك بعد كل حصة.' },
  teen: { en: 'Ages 12 to 17. The Zad Path has a teens’ version that meets their real questions; you still get every report.', ar: 'من ١٢ إلى ١٧ سنة. لمسار الأثر نسخة للشباب تجاوب عن أسئلتهم الحقيقية، والتقارير تصلك كذلك.' },
  family: { en: 'One account for everyone: each learner gets their own teacher, plan and reports.', ar: 'حساب واحد للجميع: لكل متعلّم معلّمه وخطته وتقاريره.' },
};

/** The zaad bag (brand asset, BRAND.md §5.3): crimson leather, gold stitching, the khatam clasp. Back and front are
 *  separate layers so what you pack sits inside it. */
function BagBack() {
  return (
    <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="zb-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9C161C" /><stop offset="1" stopColor="#4A0A0D" /></linearGradient>
        <linearGradient id="zb-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6D58E" /><stop offset="1" stopColor="#B9782A" /></linearGradient>
      </defs>
      <ellipse cx="160" cy="306" rx="128" ry="10" fill="#000" opacity=".35" />
      {/* Handle: leather strap on two gold rings. */}
      <path d="M104 104 C 104 30, 216 30, 216 104" fill="none" stroke="#6E0F13" strokeWidth="15" strokeLinecap="round" />
      <path d="M104 104 C 104 30, 216 30, 216 104" fill="none" stroke="#E5A93C" strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="4 5" />
      <circle cx="104" cy="106" r="9" fill="none" stroke="url(#zb-ring)" strokeWidth="4" />
      <circle cx="216" cy="106" r="9" fill="none" stroke="url(#zb-ring)" strokeWidth="4" />
      {/* The inside back wall, and the dark of the open mouth. */}
      <path d="M40 132 C 40 112, 56 100, 76 100 H 244 C 264 100, 280 112, 280 132 V 280 H 40 Z" fill="url(#zb-back)" />
      <path d="M52 140 C 120 128, 200 128, 268 140 L 268 168 C 200 182, 120 182, 52 168 Z" fill="#2A0507" opacity=".55" />
    </svg>
  );
}

function BagFront() {
  return (
    <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="zb-front" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stopColor="#DE3D43" /><stop offset=".5" stopColor="#B3191F" /><stop offset="1" stopColor="#771014" /></linearGradient>
        <radialGradient id="zb-sheen" cx=".28" cy=".05" r=".75"><stop offset="0" stopColor="#fff" stopOpacity=".26" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="zb-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6D58E" /><stop offset=".5" stopColor="#E5A93C" /><stop offset="1" stopColor="#B9782A" /></linearGradient>
      </defs>
      {/* Front panel with a scooped mouth. */}
      <path d="M26 156 C 92 182, 228 182, 294 156 L 294 268 C 294 290, 276 306, 254 306 L 66 306 C 44 306, 26 290, 26 268 Z" fill="url(#zb-front)" />
      <path d="M26 156 C 92 182, 228 182, 294 156 L 294 268 C 294 290, 276 306, 254 306 L 66 306 C 44 306, 26 290, 26 268 Z" fill="url(#zb-sheen)" />
      <path d="M26 156 C 92 182, 228 182, 294 156" fill="none" stroke="#F6D58E" strokeOpacity=".35" strokeWidth="2" />
      {/* Gold stitching that follows the panel. */}
      <path d="M40 172 C 100 194, 220 194, 280 172 L 280 264 C 280 280, 268 292, 252 292 L 68 292 C 52 292, 40 280, 40 264 Z" fill="none" stroke="#F6D58E" strokeOpacity=".6" strokeWidth="1.6" strokeDasharray="5 5" />
      {/* Side seams. */}
      <path d="M58 196 V 280 M262 196 V 280" stroke="#5E0D10" strokeOpacity=".35" strokeWidth="2" />
      {/* The khatam clasp. */}
      <g transform="translate(160 238)">
        <circle r="34" fill="#5E0D10" opacity=".35" />
        <rect x="-22" y="-22" width="44" height="44" rx="6" fill="url(#zb-gold)" />
        <rect x="-22" y="-22" width="44" height="44" rx="6" fill="url(#zb-gold)" transform="rotate(45)" />
        <circle r="10" fill="#8E1419" />
        <circle r="4.5" fill="#F6D58E" />
      </g>
    </svg>
  );
}

export function PackYourZaad({ isEn, onTrial }: { isEn: boolean; onTrial: (serviceId?: string) => void }) {
  const ref = useReveal<HTMLElement>(0.12);
  const bagRef = React.useRef<HTMLDivElement>(null);
  const [who, setWho] = React.useState<Who>('child');
  const [packed, setPacked] = React.useState<string[]>([]);
  const [bump, setBump] = React.useState(0);
  const t = (l: L) => (isEn ? l.en : l.ar);

  function fly(from: HTMLElement) {
    const bag = bagRef.current;
    if (!bag || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const a = from.getBoundingClientRect();
    const b = bag.getBoundingClientRect();
    const ghost = from.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('id');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: '0', zIndex: '60', pointerEvents: 'none' });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height * 0.42 - (a.top + a.height / 2);
    const anim = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 90}px) scale(0.8) rotate(-8deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.3) rotate(6deg)`, opacity: 0 },
      ],
      { duration: 720, easing: 'cubic-bezier(.45,0,.25,1)' },
    );
    anim.onfinish = () => ghost.remove();
    anim.oncancel = () => ghost.remove();
  }

  function toggle(id: string, el: HTMLElement) {
    setPacked((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      fly(el);
      window.setTimeout(() => setBump((n) => n + 1), 560);
      return [...list, id];
    });
  }

  const inBag = SUBJECTS.filter((s) => packed.includes(s.id));
  const first = packed[0];

  return (
    <section ref={ref} className="band-espresso relative overflow-hidden" aria-labelledby="home-pack">
      <div className="public-container py-20 sm:py-28 lg:py-36 flex flex-col lg:grid lg:grid-cols-12 lg:gap-16 lg:items-start">
        {/* Phones read: question, who, the bag, the subjects, then what is packed. Wide screens: two columns. */}
        <div className="contents lg:block lg:col-span-7">
          <h2 id="home-pack" {...rv(0)} className={`rv order-1 lg:order-none home-display text-[#FAF7F2] text-[2.6rem] sm:text-6xl lg:text-[4.4rem] ${isEn ? 'font-medium' : ''}`}>
            {isEn ? 'What will you pack?' : 'ماذا ستحمل في زادك؟'}
          </h2>
          <p {...rv(1)} className="rv order-1 lg:order-none mt-5 text-lg sm:text-xl leading-relaxed text-[#FAF7F2]/85 max-w-xl">
            {isEn ? 'Say who is learning, then tap what they need into the bag. We will show you where to start.' : 'قل لنا من سيتعلّم، ثم ضع ما يحتاجه في الحقيبة. ونريك من أين تبدأ.'}
          </p>

          <div {...rv(2)} className="rv order-1 lg:order-none mt-10" role="radiogroup" aria-label={isEn ? 'Who is learning?' : 'من سيتعلّم؟'}>
            <div className="grid grid-cols-4 sm:inline-flex gap-1 sm:gap-2 rounded-full bg-[#FAF7F2]/[0.07] p-1.5">
              {WHO.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="radio"
                  aria-checked={who === w.id}
                  onClick={() => setWho(w.id)}
                  className={`min-h-11 px-1.5 sm:px-5 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6D58E] cursor-pointer ${who === w.id ? 'bg-[#FAF7F2] text-[#1C1411]' : 'text-[#FAF7F2]/80 hover:text-[#FAF7F2]'}`}
                >
                  {t(w.label)}
                </button>
              ))}
            </div>
            <p className="mt-4 text-base text-[#FAF7F2]/75 max-w-xl min-h-[3rem]" aria-live="polite">{t(NOTE[who])}</p>
          </div>

          <ul {...rv(3)} className="rv order-3 lg:order-none mt-8 lg:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label={isEn ? 'Subjects' : 'المواد'}>
            {SUBJECTS.map((s) => {
              const on = packed.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={(e) => toggle(s.id, e.currentTarget)}
                    className={`pack-token w-full min-h-[6.5rem] rounded-[var(--r-3)] p-4 flex flex-col items-start justify-between gap-3 text-start cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6D58E] ${on ? 'bg-[#E5A93C] text-[#1C1411]' : 'bg-[#FAF7F2]/[0.07] text-[#FAF7F2] hover:bg-[#FAF7F2]/[0.13]'}`}
                  >
                    <span lang={s.glyph === 'E' ? 'en' : 'ar'} className={`font-editorial text-3xl leading-none ${on ? 'text-[#5E0D10]' : 'text-[#F6D58E]'}`}>{s.glyph}</span>
                    <span className="text-[0.95rem] font-bold leading-snug">{t(s.name)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="contents lg:block lg:col-span-5 lg:sticky lg:top-28">
          <div {...rv(4)} className="rv contents lg:block">
            <div ref={bagRef} key={bump} className={`order-2 lg:order-none mt-8 lg:mt-0 relative mx-auto w-full max-w-[15rem] sm:max-w-[22rem] lg:max-w-[27rem] aspect-square ${bump ? 'pack-bag-bump' : ''}`}>
              <div className="absolute -inset-10 rounded-full opacity-70 blur-3xl" style={{ background: `radial-gradient(closest-side, rgba(229,169,60,${0.12 + Math.min(packed.length, 6) * 0.06}), transparent)` }} aria-hidden="true" />
              <BagBack />
              {/* What you packed peeks out of the bag's mouth. */}
              <div className="absolute inset-x-[14%] top-[26%] h-[26%] flex items-end justify-center" aria-hidden="true">
                {inBag.slice(-6).map((s, i, arr) => {
                  const mid = (arr.length - 1) / 2;
                  return (
                    <span
                      key={s.id}
                      className="-mx-1.5 grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#F6D58E] text-[#5E0D10] font-editorial text-xl sm:text-2xl shadow-[0_6px_14px_rgba(0,0,0,0.35)] ring-2 ring-[#B9782A]/60"
                      style={{ transform: `translateY(${Math.abs(i - mid) * 8}px) rotate(${(i - mid) * 7}deg)` }}
                    >
                      {s.glyph}
                    </span>
                  );
                })}
              </div>
              <BagFront />
            </div>

            <div className="order-4 lg:order-none mt-8 lg:mt-6 text-center" aria-live="polite">
              {inBag.length === 0 ? (
                <p className="text-[#FAF7F2]/75 text-base">{isEn ? 'Your bag is empty. Tap a subject to pack it.' : 'حقيبتك فارغة. اضغط على مادة لتضعها فيها.'}</p>
              ) : (
                <>
                  <p className="font-editorial text-2xl text-[#FAF7F2]">
                    {isEn ? `Your zaad: ${inBag.length} ${inBag.length === 1 ? 'subject' : 'subjects'}` : `زادك: ${inBag.length === 1 ? 'مادة واحدة' : inBag.length === 2 ? 'مادتان' : `${inBag.length.toLocaleString('ar-EG')} مواد`}`}
                  </p>
                  <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                    {inBag.map((s) => {
                      const slug = s.page(who);
                      const page = slug ? findSubjectPage(slug) : null;
                      const to = page ? `${SUBJECT_PAGES_PATH}/${page.slug}` : '/learning?family=islamic_studies';
                      return (
                        <li key={s.id}>
                          <Link to={to} className="inline-flex items-center gap-1 min-h-11 text-[#F6D58E] font-semibold underline underline-offset-4 decoration-[#F6D58E]/40 hover:decoration-[#F6D58E] focus-visible:outline-2 focus-visible:outline-[#F6D58E] rounded">
                            {t(s.name)}
                            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <PublicButton
                variant="primary"
                size="lg"
                onClick={() => onTrial(first)}
                className="liquid-cta !rounded-full mt-6 w-full sm:w-auto px-8"
              >
                {first
                  ? (isEn ? 'Start with a free lesson' : 'ابدأ بحصة مجانية')
                  : (isEn ? 'Not sure? Start with a free lesson' : 'مش متأكد؟ ابدأ بحصة مجانية')}
              </PublicButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
