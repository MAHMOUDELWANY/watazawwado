import React, { useEffect, useState } from 'react';
import { Star, BadgeCheck } from 'lucide-react';

type Review = { id: string; verified: boolean; rating: number; body: string; lang: 'ar' | 'en'; display_name: string; reviewer_role: 'parent' | 'adult_learner'; country: string | null; created_at: string };
type Proof = { id: string; url: string; captionEn: string | null; captionAr: string | null };

/** Shown only with real published reviews: at least this many, so a lone review is never presented as a "wall". */
export const MIN_REVIEWS = 3;
const FIRST_SHOWN = 6;

function Stars({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 ${i <= n ? 'fill-[#E5A93C] text-[#E5A93C]' : 'text-muted-foreground/50'}`} aria-hidden="true" />)}
    </span>
  );
}

/**
 * NX-05: what families say. Real reviews the admin published (none written by us), plus screenshots families agreed to
 * share. Renders nothing until there are enough, so the page never shows an empty or thin section.
 */
export function FamilyVoices({ isEn }: { isEn: boolean }) {
  const [data, setData] = useState<{ reviews: Review[]; count: number; average: number | null; proofs: Proof[] } | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    fetch('/api/reviews').then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);

  const enough = data && (data.count >= MIN_REVIEWS || data.proofs.length >= MIN_REVIEWS);
  if (!enough) return null;
  const shown = all ? data.reviews : data.reviews.slice(0, FIRST_SHOWN);
  const L = (en: string, ar: string) => (isEn ? en : ar);

  return (
    <section className="public-container py-16 lg:py-24" aria-labelledby="family-voices" data-testid="family-voices">
      <div className="max-w-6xl mx-auto">
        <h2 id="family-voices" className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground">
          {L('What families say', 'كلام الأهالي')}
        </h2>
        {data.count >= MIN_REVIEWS && data.average && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-foreground">
            <Stars n={Math.round(data.average)} label={L(`Average ${data.average} of 5`, `المتوسط ${data.average} من ٥`)} />
            <span className="font-bold">{isEn ? data.average.toFixed(1) : data.average.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
            <span className="text-muted-foreground">{L(`from ${data.count} reviews`, `من ${data.count.toLocaleString('ar-EG')} رأي`)}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground max-w-[70ch]">
          {L('Written by families, published as they wrote them. We show every genuine review, good or bad, and never reward reviews.',
            'كتبتها العيلات بنفسها، وبننشرها زي ما هي. بنعرض كل رأي حقيقي حلو أو وحش، ومش بندّي أي مقابل لأي رأي.')}
        </p>

        {data.count >= MIN_REVIEWS && (
          <ul className="mt-10 columns-1 sm:columns-2 lg:columns-3 gap-5 [&>li]:mb-5">
            {shown.map((r) => (
              <li key={r.id} className="break-inside-avoid rounded-2xl border border-border bg-surface p-5 space-y-3">
                <Stars n={r.rating} label={L(`${r.rating} of 5`, `${r.rating} من ٥`)} />
                <blockquote className="text-foreground leading-relaxed whitespace-pre-line" dir={r.lang === 'ar' ? 'rtl' : 'ltr'} lang={r.lang}>
                  {r.body}
                </blockquote>
                <p className="text-sm">
                  <span className="font-semibold text-foreground">{r.display_name}</span>
                  <span className="text-muted-foreground"> · {r.reviewer_role === 'parent' ? L('Parent', 'ولي أمر') : L('Adult learner', 'طالب كبير')}{r.country ? ` · ${r.country}` : ''}</span>
                </p>
                {r.verified && (
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-[#087D91] dark:text-[#12A4BC]">
                    <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />{L('Studied with us', 'درس معانا')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {data.reviews.length > FIRST_SHOWN && !all && (
          <button type="button" onClick={() => setAll(true)} className="btn-glass is-pill">{L(`Show all ${data.count} reviews`, `اعرض كل الآراء (${data.count.toLocaleString('ar-EG')})`)}</button>
        )}

        {data.proofs.length > 0 && (
          <div className="mt-12">
            <h3 className="font-editorial text-xl font-bold text-foreground">{L('Messages from our families', 'رسايل من عيلاتنا')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{L('Shared with their permission; names hidden.', 'بإذنهم، ومن غير أسماء.')}</p>
            <ul className="mt-5 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3" aria-label={L('Screenshots of messages', 'صور رسايل')}>
              {data.proofs.map((p) => (
                <li key={p.id} className="snap-start shrink-0 w-64 space-y-2">
                  <img src={p.url} loading="lazy" alt={(isEn ? p.captionEn : p.captionAr) || L('A message from a family', 'رسالة من عيلة')} className="w-full rounded-2xl border border-border" />
                  {(isEn ? p.captionEn : p.captionAr) && <p className="text-xs text-muted-foreground">{isEn ? p.captionEn : p.captionAr}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
