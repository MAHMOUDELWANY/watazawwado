import React from 'react';
import { useReveal, rv } from './useReveal';

/**
 * What we promise, and only what we can prove (docs/marketing/BRAND.md §2–3). The title is the mission verse
 * ﴿وأما ما ينفع الناس فيمكث في الأرض﴾: we measure the work by what stays. The report promise is shown, not told, with
 * an example shaped like the real lesson timeline families see in the portal (LessonTimeline: summary, achievements,
 * "For next time"). It is labelled as an example; no real learner appears.
 */

type L = { en: string; ar: string };
const PROMISES: { title: L; body: L }[] = [
  {
    title: { en: 'Your teacher stays.', ar: 'معلّمك يبقى.' },
    body: {
      en: 'We never change your teacher on our side. If a teacher decides to leave, they give two months’ notice, and the next teacher reads every report before the first lesson.',
      ar: 'لا نغيّر معلّمك من جهتنا أبدًا. وإن قرّر معلّم أن يغادر، يُبلغنا قبلها بشهرين، ويقرأ المعلّم الجديد كل التقارير قبل أول حصة.',
    },
  },
  {
    title: { en: 'A report after every class.', ar: 'تقرير بعد كل حصة.' },
    body: {
      en: 'What was learned, what went well, and what to do before next time. You know how it went before you have to ask.',
      ar: 'ماذا تعلّم، وما الذي أحسن فيه، وما المطلوب قبل الحصة القادمة. تعرف كيف كانت الحصة قبل ما تسأل.',
    },
  },
  {
    title: { en: 'Every lesson fits the learner.', ar: 'كل حصة على مقاس صاحبها.' },
    body: {
      en: 'Our teachers learn the person first: what they enjoy, how long they focus, how they like things explained. Then the lesson is shaped around them.',
      ar: 'معلّمونا يتعرّفون على الشخص أولًا: ماذا يحب، وكم يركّز، وكيف يحب أن يُشرح له. ثم تُبنى الحصة على مقاسه.',
    },
  },
];

const MISSION_VERSE = '﴿ وَأَمَّا مَا يَنفَعُ النَّاسَ فَيَمْكُثُ فِي الْأَرْضِ ﴾';

function ReportExample({ isEn }: { isEn: boolean }) {
  const t = (en: string, ar: string) => (isEn ? en : ar);
  return (
    <figure className="mt-7 max-w-md rounded-[var(--r-3)] bg-surface p-5 sm:p-6 text-start shadow-[0_24px_48px_-28px_rgba(59,34,25,0.45)] dark:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.7)]" data-ui>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">{t('Tuesday, 5:00 pm', 'الثلاثاء، ٥:٠٠ م')}<span className="font-normal text-muted-foreground"> · {t('Quran memorization', 'حفظ القرآن')}</span></p>
        <span className="shrink-0 rounded-full bg-[var(--gold)]/20 px-2.5 py-0.5 text-xs font-bold text-[#7A4E09] dark:text-[#F6D58E]">{t('Example', 'مثال')}</span>
      </div>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground">
        {t(
          'Yusuf recited Al-Fil from memory today, with the rules of noon sakinah we practised last week. He asked why the birds came, so we read the story together.',
          'سمّع يوسف سورة الفيل اليوم من حفظه، مع أحكام النون الساكنة التي تدرّبنا عليها الأسبوع الماضي. وسأل لماذا جاءت الطير، فقرأنا القصة معًا.',
        )}
      </p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {[t('Al-Fil memorized', 'حفظ سورة الفيل'), t('Clear noon sakinah', 'نون ساكنة واضحة')].map((a) => (
          <li key={a} className="text-xs px-2.5 py-1 rounded-full bg-[#E5A93C]/14 text-[#8B4935] dark:text-[#F6D58E]">{a}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{t('For next time: ', 'المطلوب للحصة القادمة: ')}</span>
        {t('Recite Quraysh twice a day, slowly, to someone at home.', 'يقرأ سورة قريش مرتين في اليوم، على مهل، لأحد في البيت.')}
      </p>
      <figcaption className="sr-only">{t('An example of the lesson report families receive.', 'مثال على تقرير الحصة الذي يصل للأسرة.')}</figcaption>
    </figure>
  );
}

export function Promises({ isEn }: { isEn: boolean }) {
  const ref = useReveal<HTMLElement>(0.12);
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <section ref={ref} className="bg-surface-warm/70 dark:bg-surface-subtle" aria-labelledby="home-promises">
      <div className="public-container py-20 sm:py-28 lg:py-36 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <h2 id="home-promises" {...rv(0)} className={`rv home-display text-foreground text-[2.3rem] sm:text-5xl lg:text-[3.6rem] ${isEn ? 'font-medium' : ''}`}>
              {isEn ? 'We measure our work by what stays.' : 'نقيس عملنا بما يبقى.'}
            </h2>
            <p {...rv(1)} lang="ar" dir="rtl" className="rv mt-8 text-[1.3rem] min-[400px]:text-[1.45rem] sm:text-[1.85rem] leading-[1.9] text-ribbon" style={{ ...rv(1).style, fontFamily: "'Amiri Quran', var(--font-serif)" }}>
              {MISSION_VERSE}
            </p>
            <p {...rv(2)} className="rv mt-2 text-base text-muted-foreground max-w-sm">
              {isEn
                ? '“But as for that which benefits the people, it remains on the earth.” Ar-Ra‘d 13:17'
                : 'الرعد ١٧'}
            </p>
          </div>
        </div>

        <ol className="lg:col-span-7 space-y-16 sm:space-y-20">
          {PROMISES.map((p, i) => (
            <li key={p.title.en} {...rv(i + 2)}>
              <h3 className={`home-display text-foreground text-[2rem] sm:text-[2.6rem] lg:text-[3.1rem] ${isEn ? 'font-medium' : ''}`}>
                {t(p.title)}
              </h3>
              <p className="mt-4 text-lg sm:text-xl leading-relaxed text-foreground max-w-[36rem]">{t(p.body)}</p>
              {i === 1 && <ReportExample isEn={isEn} />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
