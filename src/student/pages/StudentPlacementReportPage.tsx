import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer, MessageCircle } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { ErrorState } from '../../components/ErrorState';
import { BOOKING_SERVICES } from '../../booking/mockData';

/**
 * Placement result in the site's identity, laid out like a formal report (it is not a certificate).
 * Printable: only the report prints (see #placement-report rules in index.css).
 */

interface Skill { en: string; ar: string }
interface Report {
  id: string;
  learnerName: string | null;
  serviceId: string;
  statedLevel: string | null;
  suggestedLevel: string | null;
  score: number;
  maxScore: number;
  status: 'submitted' | 'reviewed';
  adminReply: string | null;
  submittedAt: string;
  strengths: Skill[];
  toImprove: Skill[];
}

const LEVELS: { id: string; en: string; ar: string }[] = [
  { id: 'beginner', en: 'Beginner', ar: 'مبتدئ' },
  { id: 'elementary', en: 'Elementary', ar: 'أساسي' },
  { id: 'intermediate', en: 'Intermediate', ar: 'متوسط' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم' }
];

export default function StudentPlacementReportPage({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setError(null);
    authedJson<{ report: Report }>(`/api/placement/${id}/report`)
      .then((d) => setReport(d.report))
      .catch((err) => setError(err.message));
  }, [id, attempt]);

  if (error) return <ErrorState isAr={isAr} message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!report) return <div className="py-16 flex justify-center"><BrandSpinner size={28} /></div>;

  const service = BOOKING_SERVICES.find((s) => s.id === report.serviceId);
  const levelIdx = Math.max(0, LEVELS.findIndex((l) => l.id === report.suggestedLevel));
  const stated = LEVELS.find((l) => l.id === report.statedLevel);
  const pct = report.maxScore ? Math.round((report.score / report.maxScore) * 100) : 0;
  const date = new Date(report.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <div className="max-w-3xl mx-auto space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /><span className="ms-1.5">{t('Print / save as PDF', 'اطبع أو احفظ PDF')}</span>
        </Button>
        <Link to="/student/messages" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg btn-primary-material text-sm font-medium">
          <MessageCircle className="w-4 h-4" />{t('Ask our team', 'اسأل فريقنا')}
        </Link>
      </div>

      <article id="placement-report" className="relative bg-[#FFFDF8] text-[#1F1A17] rounded-3xl p-2 shadow-xl" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <div className="rounded-[20px] border-2 border-[#087D91]/70 p-1.5">
          <div className="relative overflow-hidden rounded-2xl border border-[#D8C6AE] px-5 py-8 sm:px-12 sm:py-12">
            <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#087D91,#D8C6AE,#C51F24)]" aria-hidden="true" />
            <div className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full bg-[#087D91]/5" aria-hidden="true" />

            <header className="text-center space-y-3">
              <div className="flex justify-center"><BrandLogo variant="large" /></div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#087D91]">{t('Watazawwado Academy', 'أكاديمية وتزودوا')}</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">{t('Placement Report', 'تقرير تحديد المستوى')}</h1>
              <div className="mx-auto w-24 h-px bg-[#C51F24]/60" />
            </header>

            <section className="mt-8 text-center space-y-1">
              <p className="text-sm text-[#6B5E55]">{t('Prepared for', 'تقرير خاص بـ')}</p>
              <p className="font-display text-3xl sm:text-4xl font-bold text-[#087D91]">{report.learnerName || t('Student', 'الطالب')}</p>
              <p className="text-sm text-[#6B5E55]">{service ? (isAr ? service.arabicName : service.name) : report.serviceId} · {date}</p>
            </section>

            <section className="mt-8 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="mx-auto relative w-32 h-32 rounded-full grid place-items-center" style={{ background: `conic-gradient(#087D91 ${pct * 3.6}deg, #EFE6DA 0deg)` }} aria-label={t(`Score ${report.score} of ${report.maxScore}`, `النتيجة ${report.score} من ${report.maxScore}`)}>
                <div className="w-24 h-24 rounded-full bg-[#FFFDF8] grid place-items-center text-center">
                  <div>
                    <div className="font-display text-2xl font-bold">{report.score}/{report.maxScore}</div>
                    <div className="text-[11px] text-[#6B5E55]">{t('correct answers', 'إجابات صحيحة')}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-[#6B5E55]">{t('Level suggested by the result', 'المستوى حسب النتيجة')}</p>
                <ol className="grid grid-cols-4 gap-1.5" aria-label={t('Level', 'المستوى')}>
                  {LEVELS.map((l, i) => (
                    <li key={l.id} className={`rounded-lg px-1 py-2 text-center text-xs font-semibold border ${
                      i === levelIdx ? 'bg-[#087D91] text-white border-[#087D91]' : i < levelIdx ? 'bg-[#087D91]/15 text-[#087D91] border-[#087D91]/30' : 'bg-white text-[#6B5E55] border-[#E6DACB]'
                    }`} aria-current={i === levelIdx ? 'true' : undefined}>
                      {isAr ? l.ar : l.en}
                    </li>
                  ))}
                </ol>
                {stated && (
                  <p className="text-xs text-[#6B5E55]">{t('Level chosen at sign-up', 'المستوى اللي اخترته في التسجيل')}: {isAr ? stated.ar : stated.en}</p>
                )}
              </div>
            </section>

            {(report.strengths.length > 0 || report.toImprove.length > 0) && (
              <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#E6DACB] bg-white/70 p-4">
                  <h2 className="text-sm font-bold text-[#087D91] mb-2">{t('Strengths', 'نقاط قوتك')}</h2>
                  <ul className="flex flex-wrap gap-1.5">
                    {report.strengths.length ? report.strengths.map((s) => <li key={s.en} className="px-2.5 py-1 rounded-full text-xs bg-[#087D91]/10 text-[#087D91]">{isAr ? s.ar : s.en}</li>) : <li className="text-xs text-[#6B5E55]">—</li>}
                  </ul>
                </div>
                <div className="rounded-xl border border-[#E6DACB] bg-white/70 p-4">
                  <h2 className="text-sm font-bold text-[#C51F24] mb-2">{t('We will work on', 'هنشتغل على')}</h2>
                  <ul className="flex flex-wrap gap-1.5">
                    {report.toImprove.length ? report.toImprove.map((s) => <li key={s.en} className="px-2.5 py-1 rounded-full text-xs bg-[#C51F24]/10 text-[#C51F24]">{isAr ? s.ar : s.en}</li>) : <li className="text-xs text-[#6B5E55]">—</li>}
                  </ul>
                </div>
              </section>
            )}

            <section className="mt-6 rounded-xl border border-dashed border-[#D8C6AE] p-4">
              <h2 className="text-sm font-bold mb-1">{t('Note from our team', 'ملاحظة فريقنا')}</h2>
              <p className="text-sm text-[#3B322D] whitespace-pre-wrap leading-relaxed">
                {report.status === 'reviewed' && report.adminReply
                  ? report.adminReply
                  : t('Our team is reviewing your answers and will add a note here soon. Your teacher will use this report to prepare your lesson.', 'فريقنا بيراجع إجاباتك وهيضيف ملاحظته هنا قريب. معلمك هيستخدم التقرير ده في تجهيز حصتك.')}
              </p>
            </section>

            <footer className="mt-8 pt-4 border-t border-[#E6DACB] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6B5E55]">
              <span>{t('This is a placement report, not a certificate.', 'هذا تقرير لتحديد المستوى، وليس شهادة.')}</span>
              <span dir="ltr">watazawwado.academy · {report.id.slice(0, 8).toUpperCase()}</span>
            </footer>
          </div>
        </div>
      </article>
    </div>
  );
}
