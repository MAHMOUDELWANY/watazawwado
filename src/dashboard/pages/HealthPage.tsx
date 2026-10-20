import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Activity, AlertTriangle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type Status = 'green' | 'amber' | 'red';
interface Check { key: string; status: Status; at?: string | null; count?: number; active?: number }
interface Health { checkedAt: string; placementBeforeBooking: boolean; checks: Check[] }
interface AppError { fingerprint: string; source: 'client' | 'api'; message: string; path: string | null; stack: string | null; occurrences: number; first_seen: string; last_seen: string }

/** Super admin: system health (OPS-02), the placement test mode reminder (OPS-05) and captured errors (OPS-01). */
export default function HealthPage() {
  const { t, isAr } = useT();
  const [health, setHealth] = useState<Health | null>(null);
  const [errors, setErrors] = useState<AppError[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [h, e]: any[] = await Promise.all([dashboardFetch('/api/dashboard/health'), dashboardFetch('/api/dashboard/app-errors')]);
      setHealth(h);
      setErrors(e.errors || []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ago = (iso?: string | null) =>
    iso ? DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toRelative() : t('never', 'ولا مرة');

  // Label, current value and the fix in one sentence, per check key.
  const describe = (c: Check): { label: string; value: string; fix: string } => {
    switch (c.key) {
      case 'cron':
        return {
          label: t('Reminder cron', 'مهمة التذكيرات (cron)'),
          value: t(`Last run ${ago(c.at)}`, `آخر تشغيل ${ago(c.at)}`),
          fix: t('Open cron-job.org and check the job is enabled and its last result is 200.', 'افتح cron-job.org واتأكد إن المهمة شغالة وآخر نتيجة ليها 200.')
        };
      case 'email_last_sent':
        return {
          label: t('Last email sent (Brevo)', 'آخر إيميل اتبعت (Brevo)'),
          value: ago(c.at) || '',
          fix: t('If no email went out in a week, check BREVO_API_KEY in Vercel and the Brevo account.', 'لو مفيش إيميل خرج من أسبوع، راجع BREVO_API_KEY في Vercel وحساب Brevo.')
        };
      case 'email_failed_24h':
        return {
          label: t('Failed emails (24 h)', 'إيميلات فشلت (24 ساعة)'),
          value: String(c.count ?? 0),
          fix: t('Check the Brevo dashboard for blocked or bounced sends.', 'شوف لوحة Brevo لو في إيميلات اتمنعت أو رجعت.')
        };
      case 'integration_jobs_pending':
        return {
          label: t('Oldest waiting calendar/Zoom job', 'أقدم مهمة تقويم/زوم مستنية'),
          value: c.at ? ago(c.at) || '' : t('none waiting', 'مفيش حاجة مستنية'),
          fix: t('Jobs run with the cron; if this is old, fix the cron row first.', 'المهام دي بتشتغل مع الـ cron؛ لو قديمة صلّح سطر الـ cron الأول.')
        };
      case 'zoom_calendar_failures_24h':
        return {
          label: t('Zoom/calendar failures (24 h)', 'أخطاء زوم/التقويم (24 ساعة)'),
          value: String(c.count ?? 0),
          fix: t('Open the affected bookings and add the Zoom link by hand; check the Zoom keys in Vercel.', 'افتح الحجوزات اللي فيها مشكلة وحط لينك الزوم بإيدك، وراجع مفاتيح Zoom في Vercel.')
        };
      case 'calendar_tokens':
        return {
          label: t('Google Calendar connections', 'ربط تقويم جوجل'),
          value: t(`${c.active ?? 0} active · ${c.count ?? 0} lost access (30 days)`, `${c.active ?? 0} شغال · ${c.count ?? 0} فقد الصلاحية (30 يوم)`),
          fix: t('The teacher reconnects Google Calendar from Settings → Integrations.', 'المعلم يعيد ربط تقويم جوجل من الإعدادات ← الربط.')
        };
      case 'stripe_webhook':
        return {
          label: t('Last Stripe webhook', 'آخر إشعار من Stripe'),
          value: ago(c.at) || '',
          fix: t('In Stripe → Developers → Webhooks, check the endpoint is enabled and STRIPE_WEBHOOK_SECRET matches.', 'في Stripe ← Developers ← Webhooks اتأكد إن الـ endpoint شغال وإن STRIPE_WEBHOOK_SECRET مطابق.')
        };
      case 'app_errors_24h':
        return {
          label: t('Distinct errors seen (24 h)', 'أخطاء مختلفة ظهرت (24 ساعة)'),
          value: String(c.count ?? 0),
          fix: t('Read the error list below and send the top one to Claude.', 'اقرا قايمة الأخطاء تحت وابعت أول واحد لـ Claude.')
        };
      default:
        return { label: c.key, value: '', fix: '' };
    }
  };

  const badge = (s: Status) => (
    <Badge variant={s === 'green' ? 'success' : s === 'amber' ? 'warning' : 'destructive'}>
      {s === 'green' ? t('OK', 'تمام') : s === 'amber' ? t('Check', 'راجع') : t('Problem', 'مشكلة')}
    </Badge>
  );

  const clearError = async (fingerprint: string) => {
    try {
      await dashboardFetch(`/api/dashboard/app-errors/${encodeURIComponent(fingerprint)}`, { method: 'DELETE' });
      setErrors((list) => list.filter((e) => e.fingerprint !== fingerprint));
    } catch {
      setFailed(true);
    }
  };

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('Loading…', 'جارٍ التحميل…')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t('System health', 'صحة النظام')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {health ? t(`Checked ${ago(health.checkedAt)}`, `اتفحص ${ago(health.checkedAt)}`) : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={loading}>
          <RefreshCw className="w-4 h-4" />
          {t('Refresh', 'تحديث')}
        </Button>
      </div>

      {failed && (
        <div role="status" className="p-3 rounded-xl text-sm text-foreground bg-warning/10">
          {t("Couldn't load the health checks. Please refresh.", 'تعذر تحميل الفحوصات. حدّث الصفحة.')}
        </div>
      )}

      {health?.placementBeforeBooking && (
        <div role="status" className="p-4 rounded-2xl border border-warning/40 bg-warning/10 text-sm text-foreground flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <span>
            {t(
              'Placement test mode is ON: every student must take the placement test before booking. This is temporary; ask Claude to switch it off when you are ready.',
              'وضع اختبار المستوى شغال: كل طالب لازم يعمل اختبار المستوى قبل ما يحجز. ده مؤقت؛ اطلب من Claude يقفله لما تكون جاهز.'
            )}
          </span>
        </div>
      )}

      {health && (
        <section className="space-y-3">
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            {t('Checks', 'الفحوصات')}
          </h2>
          <div className="grid gap-3">
            {health.checks.map((c) => {
              const d = describe(c);
              return (
                <Card key={c.key} className="p-4 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{d.label}</span>
                    {badge(c.status)}
                  </div>
                  <div className="text-sm text-foreground">{d.value}</div>
                  {c.status !== 'green' && <div className="text-xs text-muted-foreground">{d.fix}</div>}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          {t('Errors', 'الأخطاء')} ({errors.length})
        </h2>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No errors recorded.', 'مفيش أخطاء متسجلة.')}</p>
        ) : errors.map((e) => (
          <Card key={e.fingerprint} className="p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <button
                type="button"
                className="text-start font-mono text-sm text-foreground break-all cursor-pointer"
                onClick={() => setOpenError(openError === e.fingerprint ? null : e.fingerprint)}
                aria-expanded={openError === e.fingerprint}
              >
                {e.message}
              </button>
              <Button variant="ghost" size="sm" onClick={() => clearError(e.fingerprint)} aria-label={t('Clear', 'مسح')}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <bdi>{e.source === 'api' ? 'API' : t('Browser', 'المتصفح')}</bdi> · ×{e.occurrences} · {t('last', 'آخر مرة')} {ago(e.last_seen)}
              {e.path ? <> · <bdi className="font-mono">{e.path}</bdi></> : null}
            </div>
            {openError === e.fingerprint && e.stack && (
              <pre dir="ltr" className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-64 overflow-auto">{e.stack}</pre>
            )}
          </Card>
        ))}
      </section>
    </div>
  );
}
