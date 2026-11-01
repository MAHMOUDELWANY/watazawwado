import React from 'react';
import { DateTime } from 'luxon';
import { BrandLogo } from '../ui/BrandLogo';

export interface CertificateData {
  id: string;
  firstName: string | null;
  learnerName?: string | null;
  title_en: string;
  title_ar: string;
  reached_at: string;
  teacherName?: string | null;
}

/**
 * NX-04: the certificate itself, in the site's identity (paper, teal frame, ribbon gradient), the same in print.
 * Both languages on the sheet so it reads for any family; neutral wording (we do not know if the learner is a boy or a girl);
 * no photos, no ranking.
 */
export function CertificateSheet({ data, isAr }: { data: CertificateData; isAr: boolean }) {
  const name = data.learnerName || data.firstName || '';
  const date = DateTime.fromISO(data.reached_at).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_FULL);
  const checkUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://watazawwado.academy'}/certificate/${data.id}`;
  return (
    <article
      id="certificate"
      dir={isAr ? 'rtl' : 'ltr'}
      className="relative bg-[#FFFDF8] text-[#1F1A17] rounded-3xl p-2 shadow-xl"
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      data-testid="certificate-sheet"
    >
      <div className="rounded-[20px] border-2 border-[#087D91]/70 p-1.5">
        <div className="relative overflow-hidden rounded-2xl border border-[#D8C6AE] px-5 py-8 sm:px-12 sm:py-12 text-center">
          <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#087D91,#D8C6AE,#C51F24)]" aria-hidden="true" />
          <div className="flex justify-center"><BrandLogo variant="compact" /></div>
          <p className="mt-3 text-xs font-semibold tracking-[0.2em] uppercase text-[#087D91]">
            {isAr ? 'أكاديمية وتزودوا · Watazawwado Academy' : 'Watazawwado Academy · أكاديمية وتزودوا'}
          </p>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold">{isAr ? 'شهادة إنجاز' : 'Certificate of achievement'}</h1>
          <p className="mt-6 text-sm text-[#6B5E55]">{isAr ? 'تُمنح هذه الشهادة بفضل الله إلى' : 'With thanks to Allah, this certificate is presented to'}</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#087D91] break-words">{name}</p>
          <p className="mt-4 text-sm text-[#6B5E55]">{isAr ? 'تقديرًا لإنجاز' : 'in recognition of'}</p>
          <p className="mt-2 font-display text-xl sm:text-2xl font-bold">{isAr ? data.title_ar : data.title_en}</p>
          <p className="mt-1 text-sm text-[#6B5E55]" dir={isAr ? 'ltr' : 'rtl'}>{isAr ? data.title_en : data.title_ar}</p>
          <p className="mt-6 text-sm">{date}</p>
          {data.teacherName && <p className="mt-1 text-sm text-[#6B5E55]">{isAr ? `مع ${data.teacherName}` : `with ${data.teacherName}`}</p>}
          <p className="mt-6 font-display text-lg text-[#9A6B1F]">{isAr ? 'نسأل الله أن يبارك في هذا العلم وينفع به' : 'May Allah bless this knowledge and make it of benefit'}</p>
          <p className="mt-8 text-[11px] text-[#6B5E55] break-all" dir="ltr">
            {isAr ? 'للتأكد من الشهادة: ' : 'Check this certificate: '}{checkUrl}
          </p>
        </div>
      </div>
    </article>
  );
}
