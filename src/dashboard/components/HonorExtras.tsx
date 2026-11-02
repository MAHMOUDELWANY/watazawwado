import React, { useCallback, useEffect, useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { notify, confirmAction } from '../../components/ui/Feedback';

/**
 * CM-04 on the admin's Hall of Honor page: what the system suggests (rhythm milestones per learner, lessons together
 * per family), the family achievements already sent, and photos waiting for review. Nothing goes to a family on its
 * own: each suggestion waits for "Ask the family" here.
 */
type LearnerSuggestion = { studentId: string; name: string; key: string; lessons: number; weeks: number; titleEn: string; titleAr: string };
type FamilySuggestion = { accountUserId: string; holderName: string | null; key: string; lessons: number; totalLessons: number; learners: string[] };
type FamilyEntry = { id: string; holder_name: string | null; title_en: string; title_ar: string; status: string; display_name: string | null };
type Photo = { id: string; displayName: string | null; url: string | null };

const json = { 'Content-Type': 'application/json' };

export function HonorExtras({ isAr, onNominated }: { isAr: boolean; onNominated: () => void }) {
  const [data, setData] = useState<{ learners: LearnerSuggestion[]; families: FamilySuggestion[]; familyEntries: FamilyEntry[] } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    dashboardFetch<any>('/api/dashboard/honor/suggestions').then(setData).catch((e) => notify(e.message, 'error'));
    dashboardFetch<{ photos: Photo[] }>('/api/dashboard/honor/photos').then((d) => setPhotos(d.photos)).catch(() => setPhotos([]));
  }, []);
  useEffect(load, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try { await fn(); notify(done); load(); onNominated(); }
    catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(null); }
  };
  const sent = isAr ? 'اتبعت للأسرة. مش هيظهر حاجة قبل ما يوافقوا.' : 'Sent to the family. Nothing is shown before they agree.';

  const askLearner = (s: LearnerSuggestion) => run(`${s.studentId}|${s.key}`, async () => {
    const { milestoneId } = await dashboardFetch<{ milestoneId: string }>('/api/dashboard/honor/suggestions/learner', { method: 'POST', headers: json, body: JSON.stringify({ studentId: s.studentId, key: s.key }) });
    await dashboardFetch('/api/dashboard/honor/nominate', { method: 'POST', headers: json, body: JSON.stringify({ milestoneId }) });
  }, sent);
  const askFamily = (s: FamilySuggestion) => run(`${s.accountUserId}|${s.key}`, () =>
    dashboardFetch('/api/dashboard/honor/suggestions/family', { method: 'POST', headers: json, body: JSON.stringify({ accountUserId: s.accountUserId, key: s.key }) }), sent);
  const removeFamily = async (f: FamilyEntry) => {
    if (!(await confirmAction(isAr ? 'نشيل إنجاز الأسرة ده؟ مش هيرجع تاني.' : 'Take this family achievement down? It will not come back.', { danger: true }))) return;
    run(f.id, () => dashboardFetch(`/api/dashboard/honor/family/${f.id}/remove`, { method: 'POST' }), isAr ? 'اتشال.' : 'Taken down.');
  };
  const review = (p: Photo, decision: 'approve' | 'reject') => run(p.id, () =>
    dashboardFetch(`/api/dashboard/honor/${p.id}/photo`, { method: 'POST', headers: json, body: JSON.stringify({ decision }) }),
    decision === 'approve' ? (isAr ? 'الصورة ظهرت.' : 'The photo is shown.') : (isAr ? 'الصورة اتشالت والأسرة اتبلغت.' : 'The photo was removed and the family told.'));

  const familyStatus = (s: string) => ({
    awaiting_consent: isAr ? 'مستني رد الأسرة' : 'Waiting for the family', published: isAr ? 'ظاهر' : 'Shown',
    declined: isAr ? 'الأسرة رفضت' : 'Family said no', withdrawn: isAr ? 'الأسرة شالته' : 'Family took it down', removed: isAr ? 'إحنا شلناه' : 'Taken down by us',
  } as Record<string, string>)[s] || s;

  return (
    <>
      {photos.length > 0 && (
        <section className="space-y-3" aria-labelledby="honor-photos">
          <h2 id="honor-photos" className="font-display text-lg font-bold text-foreground">{isAr ? 'صور مستنية مراجعة' : 'Photos to review'}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {photos.map((p) => (
              <li key={p.id}>
                <Card className="p-3 grid gap-2">
                  {p.url && <img src={p.url} alt={p.displayName || ''} className="w-full max-h-64 object-contain rounded-xl bg-surface-subtle" />}
                  <p className="text-sm font-semibold">{p.displayName}</p>
                  <div className="flex gap-2">
                    <Button size="sm" isLoading={busy === p.id} onClick={() => review(p, 'approve')}>{isAr ? 'اعرضها' : 'Show it'}</Button>
                    <Button size="sm" variant="ghost" disabled={busy === p.id} onClick={() => review(p, 'reject')}>{isAr ? 'متنفعش' : 'Not suitable'}</Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data && (
        <section className="space-y-3" aria-labelledby="honor-suggestions">
          <h2 id="honor-suggestions" className="font-display text-lg font-bold text-foreground">{isAr ? 'اقتراحات من النظام' : 'Suggested by the system'}</h2>
          <p className="text-sm text-muted-foreground">{isAr
            ? 'طلاب وصلوا ١٠٠ أو ٢٠٠ حصة أو سنة كاملة من الحصص كل أسبوع، وأسر أتمّت ١٠٠ أو ٢٥٠ أو ٥٠٠ حصة معًا. محدش بيتبعتله حاجة غير لما تدوس.'
            : 'Learners who reached 100 or 200 lessons or a full year of weekly lessons, and families who completed 100, 250 or 500 lessons together. Nothing is sent until you press.'}</p>
          {data.learners.length === 0 && data.families.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? 'مفيش اقتراحات دلوقتي.' : 'No suggestions right now.'}</p>}
          <ul className="grid gap-2">
            {data.learners.map((s) => (
              <li key={`${s.studentId}|${s.key}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{isAr ? s.titleAr : s.titleEn}</p>
                  <p className="text-xs text-muted-foreground">{s.name} · {isAr ? `${s.lessons} حصة · أطول مدة ${s.weeks} أسبوع` : `${s.lessons} lessons · longest run ${s.weeks} weeks`}</p>
                </div>
                <Button size="sm" onClick={() => askLearner(s)} isLoading={busy === `${s.studentId}|${s.key}`}>{isAr ? 'ابعته للأسرة' : 'Ask the family'}</Button>
              </li>
            ))}
            {data.families.map((s) => (
              <li key={`${s.accountUserId}|${s.key}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5A93C]/40 bg-[#E5A93C]/5 p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{isAr ? `أسرة أتمّت ${s.lessons} حصة معًا` : `A family completed ${s.lessons} lessons together`}</p>
                  <p className="text-xs text-muted-foreground">{s.holderName || '—'} · {s.learners.join('، ')} · {isAr ? `${s.totalLessons} حصة` : `${s.totalLessons} lessons`}</p>
                </div>
                <Button size="sm" onClick={() => askFamily(s)} isLoading={busy === `${s.accountUserId}|${s.key}`}>{isAr ? 'ابعته للأسرة' : 'Ask the family'}</Button>
              </li>
            ))}
          </ul>
          {data.familyEntries.filter((f) => f.status !== 'removed').length > 0 && (
            <>
              <h3 className="text-sm font-semibold pt-2">{isAr ? 'إنجازات الأسر اللي اتبعتت' : 'Family achievements sent'}</h3>
              <ul className="grid gap-2">
                {data.familyEntries.filter((f) => f.status !== 'removed').map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3 text-sm">
                    <span>{f.holder_name || '—'} · {isAr ? f.title_ar : f.title_en}{f.display_name ? ` · «${f.display_name}»` : ''}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant={f.status === 'published' ? 'success' : f.status === 'awaiting_consent' ? 'warning' : 'outline'}>{familyStatus(f.status)}</Badge>
                      {(f.status === 'published' || f.status === 'awaiting_consent') && <Button size="sm" variant="ghost" isLoading={busy === f.id} onClick={() => removeFamily(f)}>{isAr ? 'شيله' : 'Take down'}</Button>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}
