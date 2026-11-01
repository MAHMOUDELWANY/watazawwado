import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { Star, Link2, Copy, Upload } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { notify } from '../../components/ui/Feedback';

/**
 * NX-05, super admin: review links to send, reviews to publish, screenshots of families' messages.
 * Declining is only for spam, abuse, personal data or a review not about us (docs/marketing/RULES.md §3.6).
 */
type Review = {
  id: string; source: 'invite' | 'portal'; verified: boolean; rating: number; body: string; lang: 'ar' | 'en';
  display_name: string; reviewer_role: 'parent' | 'adult_learner'; country: string | null;
  status: 'pending' | 'published' | 'declined'; decline_reason: string | null; created_at: string;
};
type Invite = { id: string; label: string | null; expires_at: string; used_at: string | null; created_at: string };
type Proof = { id: string; url: string | null; caption_en: string | null; caption_ar: string | null; consent_note: string; status: 'published' | 'hidden'; created_at: string };

const REASONS: Array<[string, string, string]> = [
  ['spam', 'Spam', 'سبام'],
  ['abuse', 'Abuse or insults', 'إساءة أو شتيمة'],
  ['personal_data', 'Personal data (phone, full child name)', 'بيانات شخصية (تليفون، اسم طفل كامل)'],
  ['not_ours', 'Not about our academy', 'مش عن الأكاديمية'],
];

export default function ReviewsPage() {
  const { t, isAr } = useT();
  const [data, setData] = useState<{ reviews: Review[]; invites: Invite[]; proofs: Proof[] } | null>(null);
  const [label, setLabel] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [proof, setProof] = useState({ captionEn: '', captionAr: '', consentNote: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    dashboardFetch<{ reviews: Review[]; invites: Invite[]; proofs: Proof[] }>('/api/dashboard/reviews').then(setData).catch((e) => notify(e.message, 'error'));
  }, []);
  useEffect(load, [load]);

  const makeLink = async () => {
    setBusy('link');
    try {
      const r = await dashboardFetch<{ url: string }>('/api/dashboard/review-invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) });
      setLink(r.url); setLabel('');
      try { await navigator.clipboard.writeText(r.url); notify(t('Link copied.', 'اللينك اتنسخ.')); } catch { /* the link stays visible to copy by hand */ }
      load();
    } catch (e: any) { notify(e.message, 'error'); } finally { setBusy(null); }
  };

  const setStatus = async (r: Review, status: Review['status']) => {
    if (status === 'declined' && !reasons[r.id]) return notify(t('Choose why it is declined.', 'اختار سبب الرفض.'), 'error');
    setBusy(r.id);
    try {
      await dashboardFetch(`/api/dashboard/reviews/${r.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason: reasons[r.id] }) });
      load();
    } catch (e: any) { notify(e.message, 'error'); } finally { setBusy(null); }
  };

  const uploadProof = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return notify(t('Choose an image first.', 'اختار صورة الأول.'), 'error');
    setBusy('proof');
    try {
      const up = await dashboardFetch<{ path: string; uploadUrl: string }>('/api/dashboard/review-proofs/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: file.type }) });
      const put = await fetch(up.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error(t('The upload failed.', 'الرفع فشل.'));
      await dashboardFetch('/api/dashboard/review-proofs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: up.path, ...proof }) });
      setProof({ captionEn: '', captionAr: '', consentNote: '' });
      if (fileRef.current) fileRef.current.value = '';
      notify(t('Screenshot added.', 'الصورة اتضافت.'));
      load();
    } catch (e: any) { notify(e.message, 'error'); } finally { setBusy(null); }
  };

  const toggleProof = async (p: Proof) => {
    setBusy(p.id);
    try {
      await dashboardFetch(`/api/dashboard/review-proofs/${p.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: p.status === 'published' ? 'hidden' : 'published' }) });
      load();
    } catch (e: any) { notify(e.message, 'error'); } finally { setBusy(null); }
  };

  const day = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy');
  const published = data?.reviews.filter((r) => r.status === 'published').length ?? 0;

  return (
    <div className="space-y-6" data-testid="reviews-admin">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t('Family reviews', 'آراء الأهالي')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('The home page shows reviews once 3 are published. Publish every genuine review, good or bad; decline only spam, abuse or personal data. Never offer anything for a review.',
            'الصفحة الرئيسية بتعرض الآراء لما يبقى فيه ٣ منشورين. انشر كل رأي حقيقي حلو أو وحش، وارفض بس السبام أو الإساءة أو البيانات الشخصية. وماتدّيش أي مقابل لأي رأي.')}
          {' '}{t(`Published now: ${published}.`, `المنشور دلوقتي: ${published.toLocaleString('ar-EG')}.`)}
        </p>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2"><Link2 className="w-4 h-4 text-teal" aria-hidden="true" />{t('Send a review link', 'ابعت لينك رأي')}</h2>
        <p className="text-sm text-muted-foreground">{t('One link per person, valid for 60 days. Send it on WhatsApp or by email.', 'لينك لكل شخص، صالح ٦٠ يوم. ابعته على واتساب أو بالإيميل.')}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} placeholder={t('Who is it for? (only you see this)', 'لمين؟ (إنت بس اللي بتشوفها)')} aria-label={t('Label', 'ملاحظة')} />
          <Button onClick={makeLink} isLoading={busy === 'link'} className="shrink-0">{t('Make link', 'اعمل لينك')}</Button>
        </div>
        {link && (
          <div className="flex items-center gap-2 rounded-xl bg-surface-subtle p-3 text-sm">
            <code className="flex-1 break-all text-foreground" dir="ltr">{link}</code>
            <Button size="icon" variant="ghost" aria-label={t('Copy link', 'انسخ اللينك')} onClick={() => navigator.clipboard.writeText(link).then(() => notify(t('Link copied.', 'اللينك اتنسخ.')))}><Copy className="w-4 h-4" /></Button>
          </div>
        )}
        {!!data?.invites.length && (
          <ul className="text-xs text-muted-foreground space-y-1">
            {data.invites.slice(0, 8).map((i) => (
              <li key={i.id}>{i.label || t('(no label)', '(من غير ملاحظة)')} · {day(i.created_at)} · {i.used_at ? t('used', 'اتكتب') : new Date(i.expires_at) < new Date() ? t('expired', 'انتهى') : t('waiting', 'مستني')}</li>
            ))}
          </ul>
        )}
      </Card>

      <section className="space-y-3" aria-labelledby="reviews-list">
        <h2 id="reviews-list" className="font-bold text-foreground">{t('Reviews', 'الآراء')}</h2>
        {!data ? null : data.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No reviews yet.', 'لسه مفيش آراء.')}</p>
        ) : data.reviews.map((r) => (
          <Card key={r.id} className="p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex" aria-label={t(`${r.rating} of 5`, `${r.rating} من ٥`)}>
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= r.rating ? 'fill-[#E5A93C] text-[#E5A93C]' : 'text-muted-foreground'}`} aria-hidden="true" />)}
              </span>
              <span className="font-semibold text-foreground">{r.display_name}</span>
              <span className="text-xs text-muted-foreground">{r.reviewer_role === 'parent' ? t('Parent', 'ولي أمر') : t('Adult learner', 'طالب كبير')}{r.country ? ` · ${r.country}` : ''} · {day(r.created_at)}</span>
              {r.verified && <Badge variant="success">{t('Studied with us', 'درس معانا')}</Badge>}
              <Badge variant={r.status === 'published' ? 'success' : r.status === 'declined' ? 'destructive' : 'warning'}>
                {r.status === 'published' ? t('Published', 'منشور') : r.status === 'declined' ? t('Declined', 'مرفوض') : t('Waiting', 'مستني')}
              </Badge>
            </div>
            <p className="text-sm text-foreground whitespace-pre-line" dir={r.lang === 'ar' ? 'rtl' : 'ltr'}>{r.body}</p>
            <div className="flex flex-wrap items-center gap-2">
              {r.status !== 'published' && <Button size="sm" onClick={() => setStatus(r, 'published')} isLoading={busy === r.id}>{t('Publish', 'انشر')}</Button>}
              {r.status === 'published' && <Button size="sm" variant="outline" onClick={() => setStatus(r, 'pending')} isLoading={busy === r.id}>{t('Unpublish', 'شيل من الموقع')}</Button>}
              {r.status !== 'declined' && (
                <>
                  <Select aria-label={t('Reason to decline', 'سبب الرفض')} value={reasons[r.id] || ''} onChange={(e) => setReasons((x) => ({ ...x, [r.id]: e.target.value }))} className="sm:w-64">
                    <option value="">{t('Decline because…', 'ارفض لأن…')}</option>
                    {REASONS.map(([v, en, ar]) => <option key={v} value={v}>{isAr ? ar : en}</option>)}
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r, 'declined')} disabled={!reasons[r.id]}>{t('Decline', 'ارفض')}</Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </section>

      <Card className="p-5 space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2"><Upload className="w-4 h-4 text-teal" aria-hidden="true" />{t('Screenshots of messages', 'سكرين شوت من رسايل الأهالي')}</h2>
        <p className="text-sm text-muted-foreground">{t('Only with the family’s permission. Hide names, phone numbers and photos before uploading. JPG, PNG or WebP, up to 3 MB.', 'بإذن العيلة بس. خبّي الأسماء والأرقام والصور قبل الرفع. JPG أو PNG أو WebP، لحد ٣ ميجا.')}</p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="block text-sm" aria-label={t('Screenshot image', 'صورة السكرين شوت')} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={proof.captionEn} maxLength={160} onChange={(e) => setProof((p) => ({ ...p, captionEn: e.target.value }))} placeholder={t('Caption in English (optional)', 'تعليق بالإنجليزي (اختياري)')} aria-label={t('English caption', 'تعليق إنجليزي')} />
          <Input value={proof.captionAr} maxLength={160} onChange={(e) => setProof((p) => ({ ...p, captionAr: e.target.value }))} placeholder={t('Caption in Arabic (optional)', 'تعليق بالعربي (اختياري)')} aria-label={t('Arabic caption', 'تعليق عربي')} />
        </div>
        <Input value={proof.consentNote} maxLength={200} onChange={(e) => setProof((p) => ({ ...p, consentNote: e.target.value }))} placeholder={t('How did the family agree? e.g. "Asked on WhatsApp, 1 Nov"', 'العيلة وافقت إزاي؟ مثلاً: «سألتهم على واتساب ١ نوفمبر»')} aria-label={t('Consent note', 'ملاحظة الموافقة')} />
        <Button onClick={uploadProof} isLoading={busy === 'proof'}>{t('Add screenshot', 'ضيف الصورة')}</Button>
        {!!data?.proofs.length && (
          <ul className="grid gap-3 sm:grid-cols-3">
            {data.proofs.map((p) => (
              <li key={p.id} className="space-y-1.5">
                {p.url && <img src={p.url} alt={(isAr ? p.caption_ar : p.caption_en) || t('Message from a family', 'رسالة من عيلة')} className={`rounded-xl border border-border w-full ${p.status === 'hidden' ? 'opacity-40' : ''}`} />}
                <p className="text-xs text-muted-foreground">{p.consent_note}</p>
                <Button size="sm" variant="outline" onClick={() => toggleProof(p)} isLoading={busy === p.id}>{p.status === 'published' ? t('Hide', 'خبّي') : t('Show', 'اعرض')}</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
