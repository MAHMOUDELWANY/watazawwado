import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { BrandLoader } from '../components/ui/BrandLoader';
import { CertificateSheet, type CertificateData } from '../components/certificate/CertificateSheet';
import { useT } from '../lib/language';

/** NX-04: public check of a certificate link: first name, milestone and date only. */
export default function CertificateCheckPage() {
  const { isAr, t } = useT();
  const { id = '' } = useParams();
  const [data, setData] = useState<CertificateData | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');
  useEffect(() => {
    fetch(`/api/certificates/${encodeURIComponent(id)}`)
      .then(async (r) => { if (!r.ok) throw new Error(); setData(await r.json()); setState('ok'); })
      .catch(() => setState('missing'));
  }, [id]);

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-4">
        {state === 'loading' && <div className="py-16 flex justify-center"><BrandLoader size="md" /></div>}
        {state === 'missing' && (
          <div className="rounded-2xl border border-border p-6 text-center space-y-2" role="alert">
            <h1 className="font-display text-xl font-bold text-foreground">{t('We could not find this certificate', 'لم نجد هذه الشهادة')}</h1>
            <p className="text-sm text-muted-foreground">{t('Check the link, or contact us on WhatsApp.', 'تأكد من الرابط، أو راسلنا على واتساب.')}</p>
          </div>
        )}
        {state === 'ok' && data && (
          <>
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-teal" data-testid="certificate-verified">
              <BadgeCheck className="w-5 h-5" aria-hidden="true" />
              {t('This certificate was issued by Watazawwado Academy.', 'هذه الشهادة صادرة عن أكاديمية وتزودوا.')}
            </p>
            <CertificateSheet data={data} isAr={isAr} />
          </>
        )}
        <p className="text-center"><Link to={isAr ? '/ar' : '/'} className="text-sm text-teal underline underline-offset-4">{t('Visit the academy', 'زور الأكاديمية')}</Link></p>
      </div>
    </main>
  );
}
