import React from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { findSubjectPage, SUBJECT_PAGES_PATH } from '../../../data/subjectPages';
import { localizedPath } from '../../../lib/language';

const STEPS_EN = ['Create a free account and choose your teacher.', 'Book a free 30-minute trial lesson.', 'Take a short placement test, then book lessons at times that suit you.'];
const STEPS_AR = ['اعمل حساب مجاني واختار معلمك.', 'احجز حصة تجريبية مجانية ٣٠ دقيقة.', 'خد اختبار تحديد مستوى قصير، وبعدين احجز حصصك في المواعيد اللي تناسبك.'];

/** One subject-and-audience landing page (/learning/<slug>), in the page's language. */
export function SubjectLandingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const { slug = '' } = useParams();
  const isEn = lang === 'en';
  const page = findSubjectPage(slug);
  if (!page) return <Navigate to={localizedPath(SUBJECT_PAGES_PATH, lang)} replace />;
  const Back = isEn ? ArrowLeft : ArrowRight;
  const Arrow = isEn ? ArrowRight : ArrowLeft;
  const related = page.related.map(findSubjectPage).filter((p) => p !== null);
  const cta = isEn ? 'Book a free trial lesson' : 'احجز حصة تجريبية مجانية';

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <article className="max-w-2xl mx-auto space-y-10">
          <PageHero
            title={isEn ? page.h1En : page.h1Ar}
            meta={isEn ? `1-on-1 on Zoom · from $${page.rateUsd}/hour · free trial` : `حصص فردية على Zoom · من ${page.rateUsd} دولار للساعة · حصة تجريبية مجانية`}
          >
            <div className="mt-6"><Button onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">{cta}</Button></div>
          </PageHero>

          <div className="space-y-5 text-base sm:text-lg text-foreground/90 leading-relaxed">
            {(isEn ? page.introEn : page.introAr).map((p) => <p key={p}>{p}</p>)}
          </div>

          <section className="space-y-4">
            <h2 className="font-editorial font-bold text-2xl text-foreground">{isEn ? 'What you learn' : 'هتتعلم إيه'}</h2>
            <ul className="space-y-3">
              {(isEn ? page.learnEn : page.learnAr).map((item) => (
                <li key={item} className="flex gap-3 text-foreground/90 leading-relaxed">
                  <Check className="mt-1 w-5 h-5 shrink-0 text-[#087D91] dark:text-[#12A4BC]" aria-hidden="true" />{item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-editorial font-bold text-2xl text-foreground">{isEn ? 'How to start' : 'تبدأ إزاي'}</h2>
            <ol className="list-decimal ps-6 space-y-2 text-foreground/90 leading-relaxed">
              {(isEn ? STEPS_EN : STEPS_AR).map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="font-editorial font-bold text-2xl text-foreground">{isEn ? 'Questions families ask' : 'أسئلة بتتسأل كتير'}</h2>
            <div className="space-y-3">
              {(isEn ? page.faqEn : page.faqAr).map((f) => (
                <Card key={f.q} className="p-5 space-y-1">
                  <h3 className="font-bold text-foreground">{f.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                </Card>
              ))}
            </div>
          </section>

          <Card className="p-5 sm:p-6 text-center space-y-3">
            <p className="font-bold text-foreground">{isEn ? 'See how a lesson feels before you decide.' : 'شوف الحصة هتبقى عاملة إزاي قبل ما تقرر.'}</p>
            <Button onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">{cta}</Button>
          </Card>

          <nav aria-label={isEn ? 'Related classes' : 'حصص تانية'} className="space-y-3">
            <h2 className="font-editorial font-bold text-xl text-foreground">{isEn ? 'You may also like' : 'ممكن يعجبك كمان'}</h2>
            <ul className="grid gap-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link to={`${SUBJECT_PAGES_PATH}/${r.slug}`} className="inline-flex items-center gap-1 min-h-11 font-semibold text-primary">
                    {isEn ? r.h1En : r.h1Ar}<Arrow className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to={SUBJECT_PAGES_PATH} className="inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-muted-foreground">
              <Back className="w-4 h-4" aria-hidden="true" />{isEn ? 'All subjects' : 'كل المواد'}
            </Link>
          </nav>
        </article>
      </PublicSection>
    </main>
  );
}
