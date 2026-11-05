import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { ErrorState } from '../../components/ErrorState';
import { authedJson } from '../../lib/authedJson';
import { CertificateSheet, type CertificateData } from '../../components/certificate/CertificateSheet';
import { ZaadiRig } from '../../components/zaadi/ZaadiRig';

/** NX-04: the family's printable certificate for one teacher-recorded milestone. */
export default function StudentCertificatePage({ lang = 'ar' }: { lang?: 'en' | 'ar' }) {
  const isAr = lang === 'ar';
  const { id = '' } = useParams();
  const [data, setData] = useState<CertificateData | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try { setData(await authedJson<CertificateData>(`/api/student/certificates/${encodeURIComponent(id)}`)); } catch { setFailed(true); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-3xl mx-auto space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        {data && (
          <div className="me-auto flex items-center gap-2">
            <ZaadiRig pose="proud" size={64} />
            <span className="font-display text-lg font-bold">{isAr ? 'مبارك! نحن فخورون بك.' : 'Mabrook! We are proud of you.'}</span>
          </div>
        )}
        <Link to="/student/progress" className="inline-flex items-center h-11 px-4 rounded-lg border border-border text-sm font-medium hover:bg-surface-subtle">
          {isAr ? 'العودة إلى المسيرة' : 'Back to progress'}
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!data} className="h-11">
          <Printer className="w-4 h-4" /><span className="ms-1.5">{isAr ? 'اطبع أو احفظ PDF' : 'Print / save as PDF'}</span>
        </Button>
      </div>
      {failed ? (
        <ErrorState isAr={isAr} onRetry={load} message={isAr ? 'تعذّر تحميل هذه الشهادة.' : 'We could not load this certificate.'} />
      ) : !data ? (
        <div className="py-16 flex justify-center"><BrandLoader size="md" /></div>
      ) : (
        <CertificateSheet data={data} isAr={isAr} />
      )}
    </div>
  );
}
