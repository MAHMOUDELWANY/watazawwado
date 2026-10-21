import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Download, Trash2 } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { getFreshAccessToken } from '../../lib/auth';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

/** ST-06: download my data, and ask for the account to be deleted (handled by our team within one month). */
export function PrivacyRequests({ isAr }: { isAr: boolean }) {
  const [request, setRequest] = useState<{ status: string; createdAt: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authedJson<{ request: typeof request }>('/api/student/privacy/delete-request').then((d) => setRequest(d.request)).catch(() => {});
  }, []);

  const download = async () => {
    setDownloading(true); setError('');
    try {
      const token = await getFreshAccessToken();
      const res = await fetch('/api/student/privacy/export', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `watazawwado-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(isAr ? 'معرفناش نجهّز ملفك، جرّب تاني بعد شوية.' : 'Could not prepare your file. Please try again shortly.');
    } finally {
      setDownloading(false);
    }
  };

  const ask = async () => {
    setSending(true); setError('');
    try {
      const d = await authedJson<{ request: { status: string; createdAt: string } }>('/api/student/privacy/delete-request', {
        method: 'POST',
        body: JSON.stringify({ confirm: true, reason: reason.trim() || null })
      });
      setRequest(d.request);
    } catch {
      setError(isAr ? 'معرفناش نسجّل طلبك. ابعتلنا على privacy@watazawwado.academy.' : 'Could not record your request. Please write to privacy@watazawwado.academy.');
    } finally {
      setSending(false);
    }
  };

  const when = request ? DateTime.fromISO(request.createdAt).setLocale(isAr ? 'ar' : 'en').toFormat('d LLLL yyyy') : '';

  return (
    <div className="space-y-6" data-testid="privacy-requests">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{isAr ? 'نزّل نسخة من بياناتك' : 'Download a copy of your data'}</h3>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? 'ملف واحد فيه بيانات حسابك وأولادك: الدروس والمدفوعات والرسائل والتقييمات وملاحظات المعلم للأسرة.'
            : 'One file with your account and your children\'s data: lessons, payments, messages, ratings and the teacher\'s notes for the family.'}
        </p>
        <Button size="sm" variant="outline" onClick={download} isLoading={downloading}>
          <Download className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'نزّل بياناتي' : 'Download my data'}
        </Button>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground">{isAr ? 'حذف الحساب' : 'Delete my account'}</h3>
        {request ? (
          <p role="status" className="text-sm rounded-xl bg-surface-subtle p-3 text-foreground">
            {isAr
              ? `وصلنا طلب حذف حسابك يوم ${when}. فريقنا هيتواصل معاك ويخلّصه خلال شهر بالكتير. لو غيّرت رأيك، كلّمنا.`
              : `We received your deletion request on ${when}. Our team will contact you and complete it within one month at the latest. If you change your mind, just tell us.`}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'هنحذف حسابك وبيانات أولادك من أنظمتنا خلال شهر، ما عدا اللي القانون بيلزمنا نحتفظ بيه (زي الفواتير). '
                : 'We will delete your account and your children\'s data from our systems within one month, except what the law requires us to keep (such as invoices). '}
              <Link to="/privacy" className="underline text-primary">{isAr ? 'سياسة الخصوصية' : 'Privacy policy'}</Link>
            </p>
            <label htmlFor="privacy-delete-reason" className="text-xs text-muted-foreground">{isAr ? 'تحب تقول لنا السبب؟ (اختياري)' : 'Would you like to tell us why? (optional)'}</label>
            <Textarea id="privacy-delete-reason" rows={2} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
            <label className="flex items-start gap-2 text-sm min-h-11 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              <span>{isAr ? 'أيوه، عايز أحذف حسابي وبيانات أولادي.' : 'Yes, I want my account and my children\'s data deleted.'}</span>
            </label>
            <Button size="sm" variant="outline" onClick={ask} disabled={!confirm} isLoading={sending} className="text-destructive border-destructive/40">
              <Trash2 className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'ابعت طلب الحذف' : 'Send the deletion request'}
            </Button>
          </>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
