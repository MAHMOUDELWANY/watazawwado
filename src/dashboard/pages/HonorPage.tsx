import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { notify, confirmAction } from '../../components/ui/Feedback';

/**
 * Super admin: Hall of Honor (plan: docs/superpowers/plans/2026-10-29-community-honor.md).
 * Put a teacher-recorded milestone forward (the family is asked in their portal and by email), record an answer the
 * family gave on WhatsApp, take an entry down, and copy the text to post in our community groups by hand.
 */

type Milestone = { id: string; kind: string; titleEn: string; titleAr: string; reachedAt: string; learnerName: string | null; ageGroup: string; subject: { en: string; ar: string } | null };
type Entry = {
  id: string; status: 'awaiting_consent' | 'published' | 'declined' | 'withdrawn' | 'removed';
  displayName: string | null; consentKind: string | null; consentNote: string | null; decidedAt: string | null;
  publishedAt: string | null; nominatedAt: string; milestone: Milestone | null; postText: { en: string; ar: string } | null;
};

const json = { 'Content-Type': 'application/json' };

function StatusBadge({ status, isAr }: { status: Entry['status']; isAr: boolean }) {
  const map: Record<Entry['status'], { en: string; ar: string; v: 'warning' | 'success' | 'outline' }> = {
    awaiting_consent: { en: 'Waiting for the family', ar: 'مستني رد الأسرة', v: 'warning' },
    published: { en: 'On the Hall of Honor', ar: 'ظاهر في لوحة الشرف', v: 'success' },
    declined: { en: 'Family said no', ar: 'الأسرة رفضت', v: 'outline' },
    withdrawn: { en: 'Family took it down', ar: 'الأسرة شالته', v: 'outline' },
    removed: { en: 'Taken down by us', ar: 'إحنا شلناه', v: 'outline' }
  };
  const s = map[status];
  return <Badge variant={s.v} className="text-xs">{isAr ? s.ar : s.en}</Badge>;
}

function RecordConsent({ entry, isAr, onDone }: { entry: Entry; isAr: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (decision: 'yes' | 'no') => {
    if (note.trim().length < 3) { notify(isAr ? 'اكتب إمتى وإزاي الأسرة ردّت.' : 'Write how and when the family answered.', 'error'); return; }
    setBusy(true);
    try {
      await dashboardFetch(`/api/dashboard/honor/${entry.id}/record-consent`, { method: 'POST', headers: json, body: JSON.stringify({ decision, displayName: name, note }) });
      notify(isAr ? 'اتسجل.' : 'Saved.');
      onDone();
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  if (!open) return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>{isAr ? 'الأسرة ردّت برّه الموقع' : 'The family answered elsewhere'}</Button>;
  return (
    <div className="grid gap-2 rounded-xl border border-border p-3">
      <Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} aria-label={isAr ? 'الاسم اللي يظهر' : 'Name to show'}
        placeholder={isAr ? 'الاسم اللي اختاروه (فاضي = الاسم الأول)' : 'Name they chose (empty = first name)'} />
      <Textarea value={note} maxLength={500} rows={2} onChange={(e) => setNote(e.target.value)} aria-label={isAr ? 'إزاي وإمتى' : 'How and when'}
        placeholder={isAr ? 'مثلًا: الأم وافقت على واتساب يوم ٢٨ أكتوبر' : 'For example: the mother agreed on WhatsApp on 28 October'} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => save('yes')} isLoading={busy}>{isAr ? 'وافقوا، اعرضه' : 'They agreed, publish'}</Button>
        <Button size="sm" variant="outline" onClick={() => save('no')} disabled={busy}>{isAr ? 'رفضوا' : 'They said no'}</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <Button size="sm" variant="outline" onClick={() => {
      navigator.clipboard?.writeText(text).then(() => notify('✓'), () => notify(text, 'error'));
    }}>{label}</Button>
  );
}

export default function HonorPage() {
  const { isAr } = useT();
  const [data, setData] = useState<{ entries: Entry[]; candidates: Milestone[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    dashboardFetch<any>('/api/dashboard/honor').then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const date = (iso: string | null) => (iso ? DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED) : '');
  const title = (m: Milestone | null) => (m ? (isAr ? m.titleAr : m.titleEn) : '');

  const nominate = async (m: Milestone) => {
    setBusyId(m.id);
    try {
      await dashboardFetch('/api/dashboard/honor/nominate', { method: 'POST', headers: json, body: JSON.stringify({ milestoneId: m.id }) });
      notify(isAr ? 'اتبعت للأسرة. مش هيظهر حاجة قبل ما يوافقوا.' : 'Sent to the family. Nothing is shown before they agree.');
      load();
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };
  const remove = async (e: Entry) => {
    const ok = await confirmAction(isAr ? 'نشيل ده من لوحة الشرف؟ مش هيرجع تاني.' : 'Take this off the Hall of Honor? It will not come back.', { danger: true, confirmLabel: isAr ? 'شيله' : 'Take down' });
    if (!ok) return;
    setBusyId(e.id);
    try {
      await dashboardFetch(`/api/dashboard/honor/${e.id}/remove`, { method: 'POST' });
      load();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const active = (data?.entries || []).filter((e) => e.status !== 'removed');

  return (
    <div className="space-y-8 pb-12 max-w-4xl" data-testid="honor-page">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'لوحة الشرف' : 'Hall of Honor'}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {isAr
            ? 'اختار إنجاز سجّله المعلم وابعته للأسرة. ولي الأمر (أو الطالب الكبير) هو اللي يوافق ويختار الاسم، ويقدر يشيله في أي وقت. اللوحة مقفولة: بيشوفها أسر وطلاب الأكاديمية بس من جوه حساباتهم. النشر في مجموعات الأسر يدوي: انسخ النص بعد الموافقة.'
            : 'Pick a milestone a teacher recorded and send it to the family. The guardian (or the adult learner) agrees and chooses the name, and can take it down any time. The hall is closed: only families and students of the academy see it, inside their accounts. Posting in our families’ groups is by hand: copy the text once they agree.'}
        </p>
        <a href={isAr ? '/ar/community' : '/community'} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm underline underline-offset-2 text-foreground">
          {isAr ? 'الصفحة اللي بتعرّف الزوار بالمجتمع' : 'The page that tells visitors about the community'}
        </a>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!data && !error && <p className="text-sm text-muted-foreground">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}

      {data && (
        <section className="space-y-3" aria-labelledby="honor-entries">
          <h2 id="honor-entries" className="font-display text-lg font-bold text-foreground">{isAr ? 'اللي اتبعت للأسر' : 'Sent to families'}</h2>
          {active.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? 'لسه مفيش.' : 'Nothing yet.'}</p>}
          {active.map((e) => (
            <Card key={e.id} className="p-4 grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{title(e.milestone)}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.milestone?.learnerName}{e.displayName ? ` · ${isAr ? 'يظهر باسم' : 'shown as'} «${e.displayName}»` : ''} · {date(e.publishedAt || e.decidedAt || e.nominatedAt)}
                  </p>
                  {e.consentKind === 'admin_recorded' && e.consentNote && <p className="text-xs text-muted-foreground mt-1">{isAr ? 'سجّلناه: ' : 'Recorded by us: '}{e.consentNote}</p>}
                </div>
                <StatusBadge status={e.status} isAr={isAr} />
              </div>
              <div className="flex flex-wrap gap-2">
                {e.status === 'awaiting_consent' && <RecordConsent entry={e} isAr={isAr} onDone={load} />}
                {e.postText && <CopyButton text={e.postText.ar} label={isAr ? 'انسخ المنشور بالعربي' : 'Copy Arabic post'} />}
                {e.postText && <CopyButton text={e.postText.en} label={isAr ? 'انسخ المنشور بالإنجليزي' : 'Copy English post'} />}
                {(e.status === 'published' || e.status === 'awaiting_consent') && (
                  <Button size="sm" variant="ghost" onClick={() => remove(e)} isLoading={busyId === e.id}>
                    {e.status === 'published' ? (isAr ? 'شيله' : 'Take down') : (isAr ? 'اسحب الطلب' : 'Withdraw the request')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </section>
      )}

      {data && (
        <section className="space-y-3" aria-labelledby="honor-candidates">
          <h2 id="honor-candidates" className="font-display text-lg font-bold text-foreground">{isAr ? 'إنجازات آخر ٦ شهور' : 'Milestones from the last 6 months'}</h2>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'اختار الإنجازات الكبيرة بس: ختم جزء، سورة طويلة، إتمام مستوى أو كتاب أو منهج زاد، أو تقدير خاص من المعلم.'
              : 'Pick the big ones only: a juz, a long surah, a level, a book or the Zad Path completed, or a special recognition from the teacher.'}
          </p>
          {data.candidates.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? 'مفيش إنجازات جديدة.' : 'No new milestones.'}</p>}
          <ul className="grid gap-2">
            {data.candidates.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{title(m)}</p>
                  <p className="text-xs text-muted-foreground">{m.learnerName} · {m.subject ? (isAr ? m.subject.ar : m.subject.en) : ''} · {date(m.reachedAt)}</p>
                </div>
                <Button size="sm" onClick={() => nominate(m)} isLoading={busyId === m.id}>{isAr ? 'ابعته للأسرة' : 'Ask the family'}</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
