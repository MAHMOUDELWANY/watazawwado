import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { confirmAction } from '../../components/ui/Feedback';

interface PrivacyRequest { id: string; status: string; reason: string | null; created_at: string; resolved_at: string | null; name: string | null; email: string | null; studentId: string | null }

/** ST-06: account deletion requests. The deletion itself is done by hand; this only tracks the answer (one month). */
export function AdminPrivacyRequests() {
  const { t, isAr } = useT();
  const [items, setItems] = useState<PrivacyRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    dashboardFetch<{ requests: PrivacyRequest[] }>('/api/dashboard/admin/privacy-requests').then((d) => setItems(d.requests)).catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);

  const markDone = async (id: string) => {
    if (!await confirmAction(t('Mark this request as handled? Do this only after the data has been deleted by hand.', 'تعلّم الطلب إنه اتنفّذ؟ اعمل كده بس بعد ما البيانات تتحذف بإيدك.'))) return;
    try { await dashboardFetch(`/api/dashboard/admin/privacy-requests/${id}/done`, { method: 'POST' }); load(); } catch { setFailed(true); }
  };

  const open = (items || []).filter((r) => r.status === 'open');
  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="privacy-requests-title" data-testid="admin-privacy-requests">
      <div>
        <h2 id="privacy-requests-title" className="text-lg font-display font-bold text-foreground">{t('Account deletion requests', 'طلبات حذف الحسابات')}</h2>
        <p className="text-sm text-muted-foreground">{t('Answer within one month (privacy policy). Nothing is deleted automatically.', 'لازم نرد خلال شهر (سياسة الخصوصية). مفيش حاجة بتتحذف لوحدها.')}</p>
      </div>
      {failed && <p className="text-sm text-destructive" role="alert">{t('Could not load the requests.', 'معرفناش نحمّل الطلبات.')}</p>}
      {items && items.length === 0 && <p className="text-sm text-muted-foreground">{t('No requests.', 'مفيش طلبات.')}</p>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-border text-sm">
          {items.map((r) => {
            const due = DateTime.fromISO(r.created_at).plus({ months: 1 });
            return (
              <li key={r.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">{r.name || r.email || '—'}</span>
                {r.email && <span className="text-muted-foreground" dir="ltr">{r.email}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-warning/15' : 'bg-success/15'}`}>
                  {r.status === 'open' ? t(`Open · due ${due.setLocale(isAr ? 'ar' : 'en').toFormat('d LLL')}`, `مفتوح · آخر ميعاد ${due.setLocale('ar').toFormat('d LLL')}`) : t('Handled', 'اتنفّذ')}
                </span>
                {r.studentId && <Link to={`/dashboard/students/${r.studentId}`} className="text-primary text-xs underline min-h-11 inline-flex items-center">{t('Open the student', 'افتح الطالب')}</Link>}
                {r.status === 'open' && <Button size="sm" variant="ghost" onClick={() => markDone(r.id)}>{t('Mark handled', 'اتنفّذ')}</Button>}
                {r.reason && <p className="w-full text-muted-foreground whitespace-pre-line">{r.reason}</p>}
              </li>
            );
          })}
        </ul>
      )}
      {open.length > 0 && <p className="text-xs text-muted-foreground">{t(`${open.length} open`, `${open.length} مفتوح`)}</p>}
    </section>
  );
}
