import React from 'react';
import { Check } from 'lucide-react';
import { findSubject, levelsFor } from '../../onboarding/subjects';

/**
 * PU-01: what a family sees after the lessons start: the learning path and the monthly report. Every value here is a
 * clearly labelled example (no names, no results presented as real); the level names are the real ones from the
 * subject catalogue.
 */
const EXAMPLE_SUBJECT = 'tajweed';

function ExampleBadge({ isEn }: { isEn: boolean }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#E5A93C]/20 text-[#7A4E09] dark:text-[#F6D58E]">
      {isEn ? 'EXAMPLE' : 'مثال'}
    </span>
  );
}

export function ProgressShowcase({ isEn }: { isEn: boolean }) {
  const subject = findSubject(EXAMPLE_SUBJECT)?.subject;
  const levels = levelsFor(EXAMPLE_SUBJECT);
  const current = 1; // example: first level done, second under way
  const t = (en: string, ar: string) => (isEn ? en : ar);

  return (
    <section aria-labelledby="progress-showcase-title" className="space-y-8" data-testid="progress-showcase">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 id="progress-showcase-title" className="font-editorial text-3xl sm:text-4xl text-foreground font-bold">
          {t('You always know where things stand', 'دايمًا عارف وصلتوا لفين')}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          {t(
            'In your account, every subject has a clear path, and each month has a short report you can print.',
            'في حسابك، كل مادة ليها طريق واضح، وكل شهر ليه تقرير قصير تقدر تطبعه.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* The learning path */}
        <article className="p-6 rounded-[var(--r-3)] border border-border bg-surface shadow-[var(--shadow-1)] space-y-5" aria-label={t('Example: the learning path', 'مثال: طريق التعلّم')}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-foreground">{t('The learning path', 'طريق التعلّم')}{subject ? ` · ${isEn ? subject.en : subject.ar}` : ''}</h3>
            <ExampleBadge isEn={isEn} />
          </div>
          <ol className="space-y-4">
            {levels.map((lvl, i) => {
              const done = i < current;
              const now = i === current;
              return (
                <li key={lvl.id} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 w-8 h-8 shrink-0 rounded-full grid place-items-center text-sm font-bold ${
                      done ? 'bg-[#087D91] text-white' : now ? 'bg-[#E5A93C] text-[#2A1A04]' : 'bg-surface-subtle text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      {isEn ? lvl.en : lvl.ar}
                      <span className="ms-2 text-xs font-medium text-muted-foreground">
                        {done ? t('done', 'خلص') : now ? t('in progress', 'شغالين فيه') : t('next', 'الجاي')}
                      </span>
                    </span>
                    <span className="block text-sm text-muted-foreground">{isEn ? lvl.descEn : lvl.descAr}</span>
                    {now && (
                      <span className="mt-2 block h-2 rounded-full bg-surface-subtle overflow-hidden" role="img" aria-label={t('About halfway', 'تقريبًا في النص')}>
                        <span className="block h-full w-1/2 rounded-full bg-gradient-to-r rtl:bg-gradient-to-l from-[#C51F24] via-[#E5A93C] to-[#087D91]" />
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </article>

        {/* The monthly report */}
        <article className="p-6 rounded-[var(--r-3)] border border-border bg-surface shadow-[var(--shadow-1)] space-y-4" aria-label={t('Example: the monthly report', 'مثال: التقرير الشهري')}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-foreground">{t('The monthly report', 'التقرير الشهري')}</h3>
            <ExampleBadge isEn={isEn} />
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              [t('Lessons attended', 'دروس حضرها'), '7'],
              [t('Weeks in a row', 'أسابيع ورا بعض'), '4'],
              [t('New milestone', 'إنجاز جديد'), '1']
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-subtle p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-editorial text-2xl font-bold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-xl border-s-4 border-[#E5A93C] bg-[#FBF4E6] dark:bg-[#E5A93C]/10 p-4 text-sm">
            <p className="text-xs font-semibold text-muted-foreground mb-1">{t("From the teacher's notes", 'من ملاحظات المعلم')}</p>
            <p className="text-foreground leading-relaxed">
              {t(
                'Clear progress on the rules of noon sakinah this month, applied well while reciting. Next: practise the rules of meem sakinah at home, a few minutes a day.',
                'تقدّم واضح في أحكام النون الساكنة الشهر ده، وبيطبّقها كويس وهو بيقرأ. الجاي: يتمرّن على أحكام الميم الساكنة في البيت، كام دقيقة كل يوم.'
              )}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('Sample figures to show the layout, not a real student.', 'أرقام للتوضيح بس، مش لطالب حقيقي.')}
          </p>
        </article>
      </div>
    </section>
  );
}
