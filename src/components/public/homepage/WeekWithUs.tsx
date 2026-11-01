import React from 'react';

type L = { en: string; ar: string };

// What a family actually gets around the lesson, in the order a week goes. Each line is a feature that exists today
// (lesson room, homework, today's review, recitations, weekly email, progress and certificates); keep it that way.
const STEPS: Array<{ when: L; title: L; body: L }> = [
  {
    when: { en: 'In the lesson', ar: 'في الحصة' },
    title: { en: 'One teacher, one learner, live', ar: 'معلم واحد وطالب واحد، مباشر' },
    body: { en: 'On Zoom, with our lesson slides on your screen. They move as the teacher teaches.', ar: 'على Zoom، وشرائح الدرس قدامك على الشاشة، بتتحرك مع شرح المعلم.' },
  },
  {
    when: { en: 'After the lesson', ar: 'بعد الحصة' },
    title: { en: 'Homework, short and clear', ar: 'واجب قصير وواضح' },
    body: { en: 'One to three small tasks from the teacher. You tick them off at home, and the teacher sees it.', ar: 'من مهمة لتلات مهام صغيرة من المعلم. بتعلّم عليها في البيت، والمعلم بيشوفها.' },
  },
  {
    when: { en: 'Every day', ar: 'كل يوم' },
    title: { en: 'Five minutes of review', ar: 'خمس دقايق مراجعة' },
    body: { en: 'What you memorized comes back on a growing gap, so it stays with you.', ar: 'اللي حفظته بيرجعلك على مسافات بتكبر، عشان يفضل معاك.' },
  },
  {
    when: { en: 'Any time', ar: 'في أي وقت' },
    title: { en: 'Recite, and hear back', ar: 'سمّع، وخد الرد' },
    body: { en: 'Record a recitation on your phone. Your teacher listens and replies.', ar: 'سجّل تلاوتك من الموبايل، والمعلم بيسمعها ويرد عليك.' },
  },
  {
    when: { en: 'Every week', ar: 'كل أسبوع' },
    title: { en: 'A note for parents', ar: 'رسالة للأهل' },
    body: { en: 'The week’s lessons, the teacher’s words and the homework, in one email.', ar: 'حصص الأسبوع وكلام المعلم والواجب، في إيميل واحد.' },
  },
  {
    when: { en: 'At each milestone', ar: 'عند كل إنجاز' },
    title: { en: 'Progress you can see', ar: 'تقدّم تشوفه' },
    body: { en: 'A progress page for every learner, and a certificate when a milestone is reached.', ar: 'صفحة تقدّم لكل طالب، وشهادة لما يوصل لإنجاز.' },
  },
];

/** Homepage: the week around the lesson, as one ribbon timeline (not a grid of cards). */
export function WeekWithUs({ isEn }: { isEn: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <section className="public-container py-16 lg:py-24" aria-labelledby="week-with-us">
      <div className="max-w-3xl mx-auto">
        <h2 id="week-with-us" className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground">
          {isEn ? 'A week with Watazawwado' : 'أسبوع مع وتزودوا'}
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4 max-w-2xl">
          {isEn ? 'The lesson is the heart of it. This is what happens around it.' : 'الحصة هي القلب. وده اللي بيحصل حواليها.'}
        </p>
        <ol className="week-line relative mt-10 space-y-8 ps-10">
          {STEPS.map((s) => (
            <li key={s.title.en} className="relative">
              <span aria-hidden="true" className="week-dot absolute -start-10 top-1 w-5 h-5 rounded-full border-2 border-[var(--background)]" />
              <h3 className="font-editorial text-xl sm:text-2xl font-bold text-foreground">{t(s.title)}</h3>
              <p className="mt-1 text-muted-foreground leading-relaxed max-w-[60ch]">
                <span className="font-semibold text-[#087D91] dark:text-[#12A4BC]">{t(s.when)}</span>
                <span aria-hidden="true"> · </span>
                {t(s.body)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
