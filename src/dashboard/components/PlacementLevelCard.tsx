import React, { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { GraduationCap } from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { levelsFor, subjectLabel } from '../../components/onboarding/subjects';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { notify } from '../../components/ui/Feedback';

type Test = {
  id: string; serviceId: string; status: 'submitted' | 'reviewed'; statedLevel: string | null; suggestedLevel: string | null;
  chosenLevel: string | null; score: number | null; maxScore: number | null; submittedAt: string | null; startLesson: number | null;
};
type Placement = { currentLevel: string | null; levelSetAt: string | null; levelSetByMe: boolean; levelSetByName: string | null; tests: Test[] };

const GENERIC: Record<string, [string, string]> = {
  beginner: ['Beginner', 'مبتدئ'], elementary: ['Elementary', 'أساسي'], intermediate: ['Intermediate', 'متوسط'], advanced: ['Advanced', 'متقدم'],
};

/**
 * Owner review 2026-11-07 (item 34): the teacher sees the student's placement result and sets the level;
 * the card says who changed the level and when, and the family is told.
 */
export function PlacementLevelCard({ studentId, serviceId }: { studentId: string; serviceId?: string | null }) {
  const { t, isAr } = useT();
  const [data, setData] = useState<Placement | null>(null);
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    dashboardFetch<Placement>(`/api/dashboard/students/${studentId}/placement`)
      .then((d) => { setData(d); setLevel(d.tests[0]?.suggestedLevel || d.currentLevel || 'beginner'); })
      .catch(() => setData({ currentLevel: null, levelSetAt: null, levelSetByMe: false, levelSetByName: null, tests: [] }));
  }, [studentId]);
  useEffect(load, [load]);

  if (!data) return null;
  const latest = data.tests[0];
  const subject = latest?.serviceId || serviceId || '';
  const label = (lv: string | null) => {
    if (!lv) return t('not set', 'مش متحدد');
    const own = levelsFor(subject).find((x) => x.id === lv);
    return own ? t(own.en, own.ar) : t(GENERIC[lv]?.[0] || lv, GENERIC[lv]?.[1] || lv);
  };
  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy');
  const waiting = latest && latest.status === 'submitted';

  const save = async () => {
    setSaving(true);
    try {
      await dashboardFetch(`/api/dashboard/students/${studentId}/level`, {
        method: 'POST', body: JSON.stringify({ level, testId: waiting ? latest.id : undefined }),
      });
      notify(t('Level saved. The family was told.', 'المستوى اتحفظ، والأسرة اتبلغت.'));
      load();
    } catch (e: any) {
      notify(e?.message || t('Could not save the level.', 'معرفناش نحفظ المستوى.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5 border border-border shadow-2xs space-y-3" aria-labelledby="placement-level-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="placement-level-title" className="text-base font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-teal" aria-hidden="true" />{t('Placement and level', 'تحديد المستوى')}
        </h2>
        {waiting && <Badge variant="warning">{t('New result: set the level', 'نتيجة جديدة: حدد المستوى')}</Badge>}
      </div>

      {latest ? (
        <p className="text-sm text-muted-foreground">
          {subject && <>{subjectLabel(subject, isAr)} · </>}
          {t('Test result: ', 'نتيجة الاختبار: ')}<strong className="text-foreground">{label(latest.suggestedLevel)}</strong>
          {latest.startLesson ? t(`, from Lesson ${latest.startLesson}`, `، من الدرس ${latest.startLesson}`) : ''}
          {latest.score != null && latest.maxScore ? ` · ${latest.score}/${latest.maxScore}` : ''}
          {latest.submittedAt ? ` · ${fmt(latest.submittedAt)}` : ''}
          {latest.statedLevel && latest.statedLevel !== latest.suggestedLevel ? t(` (the family picked ${label(latest.statedLevel)})`, ` (الأسرة اختارت ${label(latest.statedLevel)})`) : ''}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('No placement test yet. You can still set the level yourself.', 'لسه معملش اختبار مستوى. تقدر تحدد المستوى بنفسك.')}</p>
      )}

      <p className="text-sm text-foreground">
        {t('Current level: ', 'المستوى الحالي: ')}<strong>{label(data.currentLevel)}</strong>
        {data.levelSetAt && (
          <span className="text-muted-foreground">
            {' · '}{data.levelSetByMe
              ? t(`changed by you on ${fmt(data.levelSetAt)}`, `إنت غيّرته يوم ${fmt(data.levelSetAt)}`)
              : t(`changed by ${data.levelSetByName || 'the team'} on ${fmt(data.levelSetAt)}`, `غيّره ${data.levelSetByName || 'الفريق'} يوم ${fmt(data.levelSetAt)}`)}
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium text-foreground space-y-1">
          <span className="block">{t('Set the level', 'حدد المستوى')}</span>
          <Select value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 min-w-[12rem]">
            {Object.keys(GENERIC).map((lv) => <option key={lv} value={lv}>{label(lv)}</option>)}
          </Select>
        </label>
        <Button onClick={save} isLoading={saving} disabled={!level || (level === data.currentLevel && !waiting)}>
          {waiting ? t('Confirm level', 'أكّد المستوى') : t('Save level', 'احفظ المستوى')}
        </Button>
      </div>
    </section>
  );
}
