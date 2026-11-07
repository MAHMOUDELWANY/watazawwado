import React, { useEffect, useRef, useState } from 'react';
import { Camera, IdCard } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { notify } from '../../components/ui/Feedback';

type Kind = 'photo' | 'id_card';

/** The teacher's own photo (on their card) and ID card (for the academy only), uploaded here (owner review 2026-11-07). */
export function TeacherFilesCard() {
  const { t } = useT();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [idCardAt, setIdCardAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<Kind | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dashboardFetch<{ photoUrl: string | null; idCardUploadedAt: string | null }>('/api/dashboard/me/files')
      .then((d) => { setPhotoUrl(d.photoUrl); setIdCardAt(d.idCardUploadedAt); })
      .catch(() => {});
    // The first-week checklist links straight here.
    if (window.location.hash === '#teacher-files') setTimeout(() => document.getElementById('teacher-files')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, []);

  const upload = async (kind: Kind, file: File | undefined) => {
    if (!file) return;
    const max = kind === 'photo' ? 3 : 5;
    if (file.size > max * 1024 * 1024) return notify(t(`The file is over ${max} MB.`, `الملف أكبر من ${max} ميجا.`), 'error');
    setBusy(kind);
    try {
      const up = await dashboardFetch<{ path: string; uploadUrl: string }>('/api/dashboard/me/files/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, contentType: file.type })
      });
      const put = await fetch(up.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error(t('The upload failed. Please try again.', 'الرفع فشل، جرّب تاني.'));
      const done = await dashboardFetch<{ photoUrl?: string; idCardUploadedAt?: string }>('/api/dashboard/me/files', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, path: up.path })
      });
      if (done.photoUrl) setPhotoUrl(done.photoUrl);
      if (done.idCardUploadedAt) setIdCardAt(done.idCardUploadedAt);
      notify(kind === 'photo'
        ? t('Your photo is on your card now.', 'صورتك ظهرت على الكارت بتاعك.')
        : t('ID card received. Only the academy admin can see it.', 'البطاقة وصلت. الإدارة بس اللي تقدر تشوفها.'), 'success');
    } catch (e: any) {
      notify(e?.message || t('Could not upload.', 'معرفناش نرفع الملف.'), 'error');
    } finally {
      setBusy(null);
      if (photoRef.current) photoRef.current.value = '';
      if (idRef.current) idRef.current.value = '';
    }
  };

  return (
    <section id="teacher-files" className="glass-card rounded-2xl border border-border p-6 space-y-4 shadow-2xs scroll-mt-24" aria-labelledby="teacher-files-title">
      <div>
        <h2 id="teacher-files-title" className="text-lg font-display font-semibold text-foreground">{t('Your photo and ID card', 'صورتك وبطاقتك')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Families see your photo on your card. Your ID card stays private: only the academy admin sees it.',
            'الأسر بتشوف صورتك على الكارت بتاعك. البطاقة خاصة: الإدارة بس اللي بتشوفها.')}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          {photoUrl
            ? <img src={photoUrl} alt={t('Your photo', 'صورتك')} className="w-14 h-14 rounded-full object-cover shrink-0" />
            : <span className="w-14 h-14 rounded-full bg-surface-subtle grid place-items-center shrink-0"><Camera className="w-6 h-6 text-muted-foreground" aria-hidden="true" /></span>}
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('Photo', 'الصورة')}</p>
            <p className="text-xs text-muted-foreground">{t('JPG, PNG or WebP, up to 3 MB.', 'JPG أو PNG أو WebP، لحد ٣ ميجا.')}</p>
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="tf-photo" onChange={(e) => upload('photo', e.target.files?.[0])} />
            <Button size="sm" variant="outline" isLoading={busy === 'photo'} onClick={() => photoRef.current?.click()}>
              {photoUrl ? t('Change photo', 'غيّر الصورة') : t('Upload photo', 'ارفع الصورة')}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <span className="w-14 h-14 rounded-xl bg-surface-subtle grid place-items-center shrink-0"><IdCard className={`w-6 h-6 ${idCardAt ? 'text-success' : 'text-muted-foreground'}`} aria-hidden="true" /></span>
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('ID card', 'البطاقة')}</p>
            <p className="text-xs text-muted-foreground">
              {idCardAt ? t('Received. You can send a newer one.', 'وصلت. تقدر تبعت أحدث.') : t('A photo or PDF, up to 5 MB.', 'صورة أو PDF، لحد ٥ ميجا.')}
            </p>
            <input ref={idRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" id="tf-id" onChange={(e) => upload('id_card', e.target.files?.[0])} />
            <Button size="sm" variant="outline" isLoading={busy === 'id_card'} onClick={() => idRef.current?.click()}>
              {idCardAt ? t('Replace ID card', 'استبدل البطاقة') : t('Upload ID card', 'ارفع البطاقة')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
