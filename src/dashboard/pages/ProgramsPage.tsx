import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { notify } from '../../components/ui/Feedback';

/** NX-08, super admin: create dated programs (Ramadan challenge, summer revision, a shared khatma) and see who joined. */
type Program = {
  id: string; title_en: string; title_ar: string; description_en: string | null; description_ar: string | null;
  starts_on: string; ends_on: string; is_published: boolean;
  signups: Array<{ studentId: string; name: string | null; email: string | null; at: string }>;
};
type Draft = Omit<Program, 'id' | 'signups'>;
const empty: Draft = { title_en: '', title_ar: '', description_en: '', description_ar: '', starts_on: '', ends_on: '', is_published: false };

function ProgramForm({ initial, onSaved, onCancel, id }: { initial: Draft; onSaved: () => void; onCancel?: () => void; id?: string }) {
  const { t } = useT();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const save = async () => {
    setBusy(true);
    try {
      await dashboardFetch(id ? `/api/dashboard/programs/${id}` : '/api/dashboard/programs', {
        method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d),
      });
      notify(t('Saved.', 'اتحفظ.'));
      onSaved();
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-3" data-testid="program-form">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={d.title_ar} onChange={(e) => set({ title_ar: e.target.value })} maxLength={120} dir="rtl" aria-label={t('Title (Arabic)', 'العنوان بالعربي')} placeholder={t('Title (Arabic)', 'العنوان بالعربي')} />
        <Input value={d.title_en} onChange={(e) => set({ title_en: e.target.value })} maxLength={120} dir="ltr" aria-label={t('Title (English)', 'العنوان بالإنجليزي')} placeholder={t('Title (English)', 'العنوان بالإنجليزي')} />
        <Textarea value={d.description_ar || ''} onChange={(e) => set({ description_ar: e.target.value })} maxLength={1500} rows={3} dir="rtl" aria-label={t('Description (Arabic)', 'الوصف بالعربي')} placeholder={t('What happens, who it is for (Arabic)', 'إيه اللي هيحصل ولمين (بالعربي)')} />
        <Textarea value={d.description_en || ''} onChange={(e) => set({ description_en: e.target.value })} maxLength={1500} rows={3} dir="ltr" aria-label={t('Description (English)', 'الوصف بالإنجليزي')} placeholder={t('What happens, who it is for (English)', 'إيه اللي هيحصل ولمين (بالإنجليزي)')} />
        <label className="grid gap-1 text-xs text-muted-foreground">{t('Starts', 'يبدأ')}
          <Input type="date" value={d.starts_on} onChange={(e) => set({ starts_on: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t('Ends (sign-up closes)', 'ينتهي (والتسجيل يقفل)')}
          <Input type="date" value={d.ends_on} onChange={(e) => set({ ends_on: e.target.value })} />
        </label>
      </div>
      <Switch checked={d.is_published} onChange={(v) => set({ is_published: v })} hint={t('Families see it on their home page until it ends.', 'الأسر تشوفه في صفحتها الرئيسية لحد ما يخلص.')}>
        {t('Show to families', 'يظهر للأسر')}
      </Switch>
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} isLoading={busy}>{t('Save', 'احفظ')}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={busy}>{t('Cancel', 'إلغاء')}</Button>}
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  const { t, isAr } = useT();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => {
    dashboardFetch<{ programs: Program[] }>('/api/dashboard/programs').then((d) => { setPrograms(d.programs); setFailed(false); }).catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);
  const day = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy');
  const today = DateTime.utc().toISODate()!;

  return (
    <div className="space-y-6" data-testid="programs-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t('Seasonal programs', 'البرامج الموسمية')}</h1>
          <p className="text-sm text-muted-foreground">{t('Ramadan challenge, summer revision, a shared khatma: families sign a learner up from their home page.', 'تحدي رمضان، مراجعة الصيف، ختمة جماعية: الأسر بتسجّل من صفحتها الرئيسية.')}</p>
        </div>
        {!adding && <Button onClick={() => setAdding(true)}>{t('New program', 'برنامج جديد')}</Button>}
      </div>

      {adding && (
        <Card className="p-5"><ProgramForm initial={empty} onSaved={() => { setAdding(false); load(); }} onCancel={() => setAdding(false)} /></Card>
      )}

      {failed && <p role="alert" className="text-sm text-destructive">{t('Could not load the programs.', 'معرفناش نحمّل البرامج.')}</p>}
      {programs && programs.length === 0 && !adding && (
        <Card className="p-6 text-center text-sm text-muted-foreground">{t('No programs yet. Create the first one for the next season.', 'لسه مفيش برامج. اعمل أول برنامج للموسم الجاي.')}</Card>
      )}

      <ul className="space-y-4">
        {(programs || []).map((p) => (
          <li key={p.id}>
            <Card className="p-5 space-y-3" data-testid="program-item">
              {editing === p.id ? (
                <ProgramForm id={p.id} initial={p} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">{isAr ? p.title_ar : p.title_en}</h2>
                      <p className="text-xs text-muted-foreground">{day(p.starts_on)} → {day(p.ends_on)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.is_published ? (p.ends_on >= today ? 'success' : 'outline') : 'warning'}>
                        {!p.is_published ? t('Hidden', 'مخفي') : p.ends_on >= today ? t('Open', 'مفتوح') : t('Ended', 'خلص')}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => setEditing(p.id)}>{t('Edit', 'عدّل')}</Button>
                    </div>
                  </div>
                  {(isAr ? p.description_ar : p.description_en) && <p className="text-sm text-foreground whitespace-pre-line">{isAr ? p.description_ar : p.description_en}</p>}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">{t(`${p.signups.length} joined`, `${p.signups.length} مسجّلين`)}</summary>
                    <ul className="mt-2 space-y-1">
                      {p.signups.map((s) => (
                        <li key={s.studentId} className="flex flex-wrap gap-x-2"><span className="font-medium text-foreground">{s.name || '—'}</span><span className="text-muted-foreground" dir="ltr">{s.email}</span></li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
