import React from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ARTICLES, findArticle, type Block } from '../../../data/articles';
import { ARTICLES_PATH } from '../../../data/seo';
import { localizedPath } from '../../../lib/language';

const dateLabel = (iso: string, isEn: boolean) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(isEn ? 'en-GB' : 'ar-EG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** NX-11: the list of articles. */
export function ArticlesIndexPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const Arrow = isEn ? ArrowRight : ArrowLeft;

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <div className="max-w-3xl mx-auto space-y-10">
          <PageHero
            title={isEn ? <>Articles for <span className="text-ribbon">families</span></> : <>مقالات <span className="text-ribbon">للأسرة</span></>}
            intro={isEn ? 'Practical reading for Muslim families raising children in the West.' : 'قراية عملية للأسرة المسلمة اللي بتربّي ولادها برّه.'}
          />
          <ul className="grid gap-4">
            {ARTICLES.map((a) => (
              <li key={a.slug}>
                <Link to={`${ARTICLES_PATH}/${a.slug}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Card className="p-5 sm:p-6 space-y-2 transition-colors group-hover:border-primary/40">
                    <p className="text-xs text-muted-foreground"><time dateTime={a.date}>{dateLabel(a.date, isEn)}</time></p>
                    <h2 className="font-editorial font-bold text-xl sm:text-2xl text-foreground leading-snug">{isEn ? a.titleEn : a.titleAr}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{isEn ? a.descEn : a.descAr}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {isEn ? 'Read' : 'اقرا'}<Arrow className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PublicSection>
    </main>
  );
}

function BlockView({ block }: { block: Block }) {
  if ('h' in block) return <h2 className="font-editorial font-bold text-2xl text-foreground pt-4">{block.h}</h2>;
  if ('list' in block) {
    return (
      <ul className="list-disc ps-6 space-y-2">
        {block.list.map((item) => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  return <p>{block.p}</p>;
}

/** NX-11: one article, in the page's language. */
export function ArticlePage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const { slug = '' } = useParams();
  const isEn = lang === 'en';
  const article = findArticle(slug);
  if (!article) return <Navigate to={localizedPath(ARTICLES_PATH, lang)} replace />;
  const Back = isEn ? ArrowLeft : ArrowRight;

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <article className="max-w-2xl mx-auto space-y-8">
          <PageHero
            title={isEn ? article.titleEn : article.titleAr}
            meta={<time dateTime={article.date}>{dateLabel(article.date, isEn)}</time>}
          />
          <div className="space-y-5 text-base sm:text-lg text-foreground/90 leading-relaxed">
            {(isEn ? article.bodyEn : article.bodyAr).map((b, i) => <BlockView key={i} block={b} />)}
          </div>
          <Card className="p-5 sm:p-6 text-center space-y-3">
            <p className="font-bold text-foreground">{isEn ? 'See how a lesson feels for your child.' : 'شوف الحصة هتبقى عاملة إزاي مع ابنك.'}</p>
            <Button onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">{isEn ? 'Book a free trial lesson' : 'احجز حصة تجريبية مجانية'}</Button>
          </Card>
          <Link to={ARTICLES_PATH} className="inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-primary">
            <Back className="w-4 h-4" aria-hidden="true" />{isEn ? 'All articles' : 'كل المقالات'}
          </Link>
        </article>
      </PublicSection>
    </main>
  );
}
