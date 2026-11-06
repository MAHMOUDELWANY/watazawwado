import React, { useEffect, useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { notify } from '../../components/ui/Feedback';

/** The teacher's own words on their card at onboarding: families read it before they choose (owner, 2026-11-06). */
export function TeacherIntroCard() {
  const { t } = useT();
  const [intro, setIntro] = useState('');
  const [max, setMax] = useState(600);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dashboardFetch<{ intro: string; max: number }>('/api/dashboard/me/intro')
      .then((d) => { setIntro(d.intro || ''); setMax(d.max || 600); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await dashboardFetch('/api/dashboard/me/intro', { method: 'PUT', body: JSON.stringify({ intro }) });
      notify(t('Saved. Families see it when they choose a teacher.', 'اتحفظت. الأسر بتشوفها وهي بتختار المعلم.'), 'success');
    } catch (e: any) {
      notify(e?.message || t('Could not save.', 'معرفناش نحفظ.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card rounded-2xl border border-border p-6 space-y-3 shadow-2xs" aria-labelledby="teacher-intro-title">
      <div>
        <h2 id="teacher-intro-title" className="text-lg font-display font-semibold text-foreground">{t('Your introduction for families', 'نبذتك للأسر')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('A few honest lines: what you teach, how you teach, who you love teaching. The first sentence shows on your card when a family picks a teacher.',
            'كام سطر بصدق: بتدرّس إيه، وبتدرّس إزاي، وبتحب تدرّس لمين. أول جملة بتظهر على بطاقتك لما الأسرة بتختار معلم.')}
        </p>
      </div>
      <label htmlFor="teacher-intro" className="sr-only">{t('Your introduction', 'نبذتك')}</label>
      <Textarea id="teacher-intro" rows={4} maxLength={max} value={intro} disabled={!loaded} onChange={(e) => setIntro(e.target.value)} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground" aria-live="polite">{intro.length}/{max}</span>
        <Button size="sm" onClick={save} isLoading={saving} disabled={!loaded}>{t('Save', 'احفظ')}</Button>
      </div>
    </section>
  );
}
