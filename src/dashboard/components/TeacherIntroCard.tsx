import React, { useEffect, useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { notify } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';

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

const NL = String.fromCharCode(10);
type Profile = { studies: string | null; credentials: string[]; experienceYears: number | null; languages: string[] };

/**
 * The rest of the teacher's card for families: studies, certificates and ijazahs, years of experience, languages they
 * explain in. Families read it in "About this teacher" before choosing (owner review 2026-11-10).
 */
export function TeacherProfileCard() {
  const { t } = useT();
  const [studies, setStudies] = useState('');
  const [credentials, setCredentials] = useState('');
  const [years, setYears] = useState('');
  const [languages, setLanguages] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dashboardFetch<{ profile: Profile }>('/api/dashboard/me/profile')
      .then(({ profile: p }) => {
        setStudies(p.studies || '');
        setCredentials((p.credentials || []).join(NL));
        setYears(p.experienceYears === null || p.experienceYears === undefined ? '' : String(p.experienceYears));
        setLanguages((p.languages || []).join(', '));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const profile = {
        studies: studies.trim() || null,
        credentials: credentials.split(NL).map((c) => c.trim()).filter(Boolean),
        experienceYears: years.trim() === '' ? null : Number(years),
        languages: languages.split(/[,،]/).map((l) => l.trim()).filter(Boolean)
      };
      await dashboardFetch('/api/dashboard/me/profile', { method: 'PUT', body: JSON.stringify({ profile }) });
      notify(t('Saved. Families see it under "More about" your name.', 'اتحفظت. الأسر بتشوفها في «اعرف أكتر» على بطاقتك.'), 'success');
    } catch (e: any) {
      notify(e?.message || t('Could not save.', 'معرفناش نحفظ.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const field = 'space-y-1.5';
  const label = 'block text-sm font-semibold text-foreground';
  return (
    <section className="glass-card rounded-2xl border border-border p-6 space-y-4 shadow-2xs" aria-labelledby="teacher-profile-title">
      <div>
        <h2 id="teacher-profile-title" className="text-lg font-display font-semibold text-foreground">{t('Your profile for families', 'ملفك للأسر')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Families open this before they choose a teacher. Leave out anything you prefer not to share.', 'الأسر بتفتحه قبل ما تختار المعلم. سيب أي حاجة مش حابب تكتبها.')}
        </p>
      </div>
      <div className={field}>
        <label htmlFor="tp-studies" className={label}>{t('What you studied', 'دراستك')}</label>
        <Input id="tp-studies" maxLength={400} value={studies} disabled={!loaded} onChange={(e) => setStudies(e.target.value)} placeholder={t('e.g. Islamic Studies, Al-Azhar University', 'مثال: دراسات إسلامية، جامعة الأزهر')} />
      </div>
      <div className={field}>
        <label htmlFor="tp-credentials" className={label}>{t('Certificates and ijazahs (one per line)', 'الشهادات والإجازات (كل واحدة في سطر)')}</label>
        <Textarea id="tp-credentials" rows={3} value={credentials} disabled={!loaded} onChange={(e) => setCredentials(e.target.value)} placeholder={t('e.g. Ijazah in Hafs an Asim', 'مثال: إجازة برواية حفص عن عاصم')} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={field}>
          <label htmlFor="tp-years" className={label}>{t('Years of teaching', 'سنين التدريس')}</label>
          <Input id="tp-years" type="number" inputMode="numeric" min={0} max={60} value={years} disabled={!loaded} onChange={(e) => setYears(e.target.value)} />
        </div>
        <div className={field}>
          <label htmlFor="tp-languages" className={label}>{t('Languages you explain in', 'اللغات اللي بتشرح بيها')}</label>
          <Input id="tp-languages" value={languages} disabled={!loaded} onChange={(e) => setLanguages(e.target.value)} placeholder={t('Arabic, English', 'العربية، الإنجليزية')} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={save} isLoading={saving} disabled={!loaded}>{t('Save', 'احفظ')}</Button>
      </div>
    </section>
  );
}
