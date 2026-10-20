import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { SUBJECT_FAMILIES, levelsFor } from '../../components/onboarding/subjects';
import { CHILD_MIN_AGE, CHILD_MAX_AGE, isChildAge } from '../../lib/ageRules';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PROFILE_CHANGED_EVENT } from '../activeLearner';

/**
 * PA-02: a parent adds another child after onboarding (name, age 6-17, subject, level, teacher preference).
 * The server checks the age and picks the teacher; this form only collects the choice.
 */
export function AddChildForm({ isAr, onAdded }: { isAr: boolean; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [subject, setSubject] = useState('quran-reading');
  const [level, setLevel] = useState('beginner');
  const [teacherPref, setTeacherPref] = useState('no_preference');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // The home page's "Add a child" links here with #add-child: open the form and bring it into view.
  useEffect(() => {
    if (window.location.hash !== '#add-child') return;
    setOpen(true);
    requestAnimationFrame(() => document.getElementById('add-child')?.scrollIntoView({ block: 'center' }));
  }, []);

  const subjects = useMemo(() => SUBJECT_FAMILIES.flatMap((f) => f.subjects), []);
  const levels = levelsFor(subject);
  const ageOk = isChildAge(age);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await authedJson('/api/student/children', {
        method: 'POST',
        body: JSON.stringify({ name, age: Number(age), gender, learningInterest: subject, currentLevel: level, teacherGenderPreference: teacherPref })
      });
      setMessage({ ok: true, text: isAr ? `اتضاف ${name}. تقدر تحجزله دلوقتي.` : `${name} has been added. You can book for them now.` });
      setName('');
      setAge('');
      setOpen(false);
      onAdded();
      window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || (isAr ? 'حصلت مشكلة، حاول تاني.' : 'Something went wrong. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" id="add-child">
      {message && (
        <div role="status" className={`p-3 rounded-xl text-sm text-foreground ${message.ok ? 'bg-success/10' : 'bg-warning/10'}`}>{message.text}</div>
      )}
      {!open ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="w-4 h-4" />
          {isAr ? 'إضافة ابن أو بنت' : 'Add a child'}
        </Button>
      ) : (
        <form onSubmit={submit} className="p-4 rounded-2xl glass-surface border border-border-subtle space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm text-foreground">
              <span>{isAr ? 'الاسم' : 'Name'}</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
            </label>
            <label className="space-y-1 text-sm text-foreground">
              <span>{isAr ? `السن (${CHILD_MIN_AGE} إلى ${CHILD_MAX_AGE})` : `Age (${CHILD_MIN_AGE} to ${CHILD_MAX_AGE})`}</span>
              <Input type="number" inputMode="numeric" min={CHILD_MIN_AGE} max={CHILD_MAX_AGE} value={age} onChange={(e) => setAge(e.target.value)} required />
            </label>
            <label className="space-y-1 text-sm text-foreground">
              <span>{isAr ? 'ولد أو بنت' : 'Boy or girl'}</span>
              <Select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
                <option value="male">{isAr ? 'ولد' : 'Boy'}</option>
                <option value="female">{isAr ? 'بنت' : 'Girl'}</option>
              </Select>
            </label>
            <label className="space-y-1 text-sm text-foreground">
              <span>{isAr ? 'المعلم' : 'Teacher'}</span>
              <Select value={teacherPref} onChange={(e) => setTeacherPref(e.target.value)}>
                <option value="no_preference">{isAr ? 'أي معلم' : 'No preference'}</option>
                <option value="male_teacher">{isAr ? 'معلم' : 'A male teacher'}</option>
                <option value="female_teacher">{isAr ? 'معلمة' : 'A female teacher'}</option>
              </Select>
            </label>
            <label className="space-y-1 text-sm text-foreground">
              <span>{isAr ? 'المادة' : 'Subject'}</span>
              <Select value={subject} onChange={(e) => { setSubject(e.target.value); setLevel('beginner'); }}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{isAr ? s.ar : s.en}</option>)}
              </Select>
            </label>
            {levels.length > 0 && (
              <label className="space-y-1 text-sm text-foreground">
                <span>{isAr ? 'المستوى' : 'Level'}</span>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  {levels.map((l) => <option key={l.id} value={l.id}>{isAr ? l.ar : l.en}</option>)}
                </Select>
              </label>
            )}
          </div>
          {age && !ageOk && (
            <p className="text-xs text-warning">
              {isAr
                ? `السن لازم يكون من ${CHILD_MIN_AGE} لـ ${CHILD_MAX_AGE}. من ${CHILD_MAX_AGE + 1} سنة وطالع، المتعلم يفتح حسابه بنفسه.`
                : `The age must be ${CHILD_MIN_AGE} to ${CHILD_MAX_AGE}. From ${CHILD_MAX_AGE + 1}, learners open their own account.`}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || name.trim().length < 2 || !ageOk} isLoading={busy}>
              {isAr ? 'إضافة' : 'Add'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
