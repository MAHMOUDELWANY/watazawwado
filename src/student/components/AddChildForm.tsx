import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { SUBJECT_FAMILIES, levelsFor, asksLevel, firstLevel } from '../../components/onboarding/subjects';
import { CHILD_MIN_AGE, CHILD_MAX_AGE, isChildAge } from '../../lib/ageRules';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PROFILE_CHANGED_EVENT } from '../activeLearner';
import { GuideChoice } from '../../components/onboarding/TravelPass';
import { teachersFor, type TeacherCard } from '../../components/onboarding/teachers';

/**
 * PA-02: a parent adds another child after onboarding (name, age 6-17, subject, level, teacher).
 * Subject first, then the teachers who teach it, as at sign-up (owner review 2026-11-07). The server checks the age
 * and that the picked teacher teaches the subject.
 */
export function AddChildForm({ isAr, onAdded }: { isAr: boolean; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [subject, setSubject] = useState('quran-reading');
  const [level, setLevel] = useState<string>(firstLevel('quran-reading'));
  const [allTeachers, setAllTeachers] = useState<TeacherCard[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // The home page's "Add a child" links here with #add-child: open the form and bring it into view.
  useEffect(() => {
    if (window.location.hash !== '#add-child') return;
    setOpen(true);
    requestAnimationFrame(() => document.getElementById('add-child')?.scrollIntoView({ block: 'center' }));
  }, []);

  useEffect(() => {
    if (!open || allTeachers.length) return;
    authedJson<{ teachers: TeacherCard[] }>('/api/student/teachers')
      .then((d) => setAllTeachers((d.teachers || []).filter((t) => t?.id && t?.nameEn)))
      .catch(() => {});
  }, [open, allTeachers.length]);

  const subjects = useMemo(() => SUBJECT_FAMILIES.flatMap((f) => f.subjects), []);
  const teachers = useMemo(() => teachersFor(allTeachers, subject), [allTeachers, subject]);
  // Keep a valid pick: a teacher of this subject, preferring one matching the child (a girl starts on a female teacher).
  useEffect(() => {
    if (!teachers.length || teachers.some((t) => t.id === teacherId)) return;
    setTeacherId((teachers.find((t) => t.gender === gender) || teachers[0]).id);
  }, [teachers, teacherId, gender]);
  const levels = levelsFor(subject);
  const ageOk = isChildAge(age);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await authedJson('/api/student/children', {
        method: 'POST',
        body: JSON.stringify({ name, age: Number(age), gender, learningInterest: subject, currentLevel: level,
          ...(teacherId ? { teacherId, teacherGenderPreference: teachers.find((t) => t.id === teacherId)?.gender === 'female' ? 'female_teacher' : 'male_teacher' } : {}) })
      });
      setMessage({ ok: true, text: isAr ? `أُضيف ${name}. يمكنك الحجز له الآن.` : `${name} has been added. You can book for them now.` });
      setName('');
      setAge('');
      setOpen(false);
      onAdded();
      window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || (isAr ? 'حدثت مشكلة، حاول مرة أخرى.' : 'Something went wrong. Please try again.') });
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
              <span>{isAr ? 'المادة' : 'Subject'}</span>
              <Select value={subject} onChange={(e) => { setSubject(e.target.value); setLevel(firstLevel(e.target.value)); }}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{isAr ? s.ar : s.en}</option>)}
              </Select>
            </label>
            {asksLevel(subject) && (
              <label className="space-y-1 text-sm text-foreground">
                <span>{isAr ? 'المستوى' : 'Level'}</span>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  {levels.map((l) => <option key={l.id} value={l.id}>{isAr ? l.ar : l.en}</option>)}
                </Select>
              </label>
            )}
          </div>
          {teachers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">{isAr ? 'اختار المعلم' : 'Choose the teacher'}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'دول المعلمين اللي بيدرّسوا المادة دي ووقتهم فاضي.' : 'These teachers teach this subject and have free time.'}
              </p>
              <GuideChoice key={`${subject}-${teacherId ? 1 : 0}`} teachers={teachers} value={teacherId} onChange={setTeacherId} isAr={isAr} />
            </div>
          )}
          {age && !ageOk && (
            <p className="text-xs text-warning">
              {isAr
                ? `يجب أن يكون العمر من ${CHILD_MIN_AGE} إلى ${CHILD_MAX_AGE}. ومن ${CHILD_MAX_AGE + 1} سنة فأكثر يفتح المتعلّم حسابه بنفسه.`
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
