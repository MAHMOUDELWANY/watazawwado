import React, { useEffect, useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

export type TeacherOption = { id: string | null; email: string; display_name: string; is_active: boolean };

/** AD-02b: active teachers the super admin can move lessons to. */
export function useActiveTeachers(enabled: boolean) {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    dashboardFetch('/api/dashboard/admin/teachers')
      .then((data: any) => { if (alive && Array.isArray(data?.teachers)) setTeachers(data.teachers.filter((tc: TeacherOption) => tc.is_active)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [enabled]);
  return teachers;
}

/** AD-02b: one request per lesson; the server checks the lesson, the new teacher's time and does the move. */
export const moveLessonToTeacher = (bookingId: string, teacherId: string, reason: string) =>
  dashboardFetch(`/api/dashboard/admin/bookings/${bookingId}/move-teacher`, { method: 'POST', body: JSON.stringify({ teacherId, reason: reason.trim() }) });

export const teacherValue = (tc: TeacherOption) => tc.id || tc.email;

export function TeacherPicker({ id, teachers, value, onChange, excludeId, disabled }: {
  id: string; teachers: TeacherOption[]; value: string; onChange: (v: string) => void; excludeId?: string | null; disabled?: boolean;
}) {
  const { t } = useT();
  return (
    <Select id={id} aria-label={t('Teacher to move the lessons to', 'المدرس اللي هتنقل له الحصص')} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">{t('Choose a teacher', 'اختار مدرس')}</option>
      {teachers.filter((tc) => !excludeId || tc.id !== excludeId).map((tc) => (
        <option key={teacherValue(tc)} value={teacherValue(tc)}>{tc.display_name}</option>
      ))}
    </Select>
  );
}

/**
 * AD-02b, lesson screen: move this one lesson to another teacher. Super admin only (the caller renders it only
 * for the super admin, and the server refuses everyone else).
 */
export function MoveTeacherControl({ bookingId, currentTeacherId, onMoved }: { bookingId: string; currentTeacherId: string | null; onMoved: () => void }) {
  const { t } = useT();
  const teachers = useActiveTeachers(true);
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    if (!teacherId || reason.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const res: any = await moveLessonToTeacher(bookingId, teacherId, reason);
      setDone(t(`Moved to ${res?.teacher?.name || 'the new teacher'}. Same time, same price, same Zoom link.`, `اتنقلت لـ ${res?.teacher?.name || 'المدرس الجديد'}. نفس الميعاد ونفس السعر ونفس رابط Zoom.`));
      setOpen(false);
      setReason('');
      setTeacherId('');
      onMoved();
    } catch (err: any) {
      setError(err?.message || t('The lesson could not be moved.', 'معرفناش ننقل الحصة.'));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="space-y-2" data-testid="move-teacher-control">
        {done && <p role="status" className="text-sm text-foreground">{done}</p>}
        <Button size="sm" variant="outline" onClick={() => { setDone(null); setOpen(true); }}>{t('Move to another teacher', 'انقلها لمدرس تاني')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border p-4" data-testid="move-teacher-control">
      <p className="text-sm text-muted-foreground">{t('Same time, same price and the same Zoom link. The family and both teachers are told.', 'نفس الميعاد ونفس السعر ونفس رابط Zoom. الأسرة والمدرسين الاتنين هيوصلهم إشعار.')}</p>
      <label className="block text-xs text-muted-foreground" htmlFor="move-teacher-pick">{t('New teacher', 'المدرس الجديد')}</label>
      <TeacherPicker id="move-teacher-pick" teachers={teachers} value={teacherId} onChange={setTeacherId} excludeId={currentTeacherId} disabled={busy} />
      <label className="block text-xs text-muted-foreground" htmlFor="move-teacher-reason">{t('Reason (kept in the record, not shown to the family)', 'السبب (بيتسجل عندنا، الأسرة مش بتشوفه)')}</label>
      <Input id="move-teacher-reason" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} disabled={busy} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={submit} isLoading={busy} disabled={!teacherId || reason.trim().length < 3}>{t('Move the lesson', 'انقل الحصة')}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setError(null); }} disabled={busy}>{t('Back', 'رجوع')}</Button>
      </div>
    </div>
  );
}
