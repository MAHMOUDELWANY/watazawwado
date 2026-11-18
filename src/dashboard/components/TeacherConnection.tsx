import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Side = { precheck_720: boolean | null; start_height: number | null; min_height: number | null; degraded_seconds: number; audio_only_seconds: number; reconnects: number };
type Lesson = { bookingId: string; scheduledStart: string; learner: string | null; teacher: Side | null; student: Side | null; teacherFailed: boolean };

const thisMonth = () => new Date().toISOString().slice(0, 7);
const mins = (s: number) => `${Math.round(s / 60)}m`;

/** Classroom Task 11: one teacher's room connection numbers for a month (super admin). */
export function TeacherConnection({ teacher, onClose }: { teacher: { id: string; display_name: string } | null; onClose: () => void }) {
  const { t } = useT();
  const [month, setMonth] = useState(thisMonth);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teacher || !/^\d{4}-\d{2}$/.test(month)) return;
    let live = true;
    setLessons(null);
    setError('');
    dashboardFetch<{ lessons: Lesson[] }>(`/api/admin/teachers/${encodeURIComponent(teacher.id)}/connection?month=${month}`)
      .then((d) => live && setLessons(d.lessons || []))
      .catch((e: any) => live && setError(e?.message || t("Couldn't load the connection numbers.", 'معرفناش نجيب أرقام الاتصال.')));
    return () => { live = false; };
  }, [teacher?.id, month]);

  const side = (s: Side | null) => (s
    ? <span dir="ltr">{s.min_height ?? '–'}p · {mins(s.degraded_seconds)} / {mins(s.audio_only_seconds)} · {s.reconnects}×</span>
    : <span className="text-muted-foreground">–</span>);

  return (
    <Modal isOpen={Boolean(teacher)} onClose={onClose} title={t(`Connection: ${teacher?.display_name ?? ''}`, `الاتصال: ${teacher?.display_name ?? ''}`)}>
      <div className="space-y-4 text-sm text-foreground">
        <label className="block space-y-1.5">
          <span className="font-semibold">{t('Month', 'الشهر')}</span>
          <Input type="month" dir="ltr" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <p className="text-muted-foreground">
          {t('Each side: lowest video, minutes of weak video / sound only, reconnects. A lesson is marked when the teacher side failed.', 'لكل طرف: أقل جودة فيديو، دقايق الفيديو الضعيف / الصوت بس، ومرات إعادة الاتصال. الحصة بتتعلّم لو طرف المعلم وقع.')}
        </p>
        {error && <p role="alert" className="font-semibold text-destructive">{error}</p>}
        {!error && !lessons && <p className="text-muted-foreground">{t('Loading…', 'جاري التحميل…')}</p>}
        {lessons && lessons.length === 0 && <p className="text-muted-foreground">{t('No lessons in the room this month.', 'مفيش حصص في الغرفة الشهر ده.')}</p>}
        {lessons && lessons.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-[13px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1.5 pe-3 text-start font-medium">{t('Lesson', 'الحصة')}</th>
                  <th className="py-1.5 pe-3 text-start font-medium">{t('Teacher', 'المعلم')}</th>
                  <th className="py-1.5 text-start font-medium">{t('Learner', 'الطالب')}</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.bookingId} className={`border-t border-border ${l.teacherFailed ? 'bg-destructive/5' : ''}`}>
                    <td className="py-1.5 pe-3">
                      <span dir="ltr" className="whitespace-nowrap">{l.scheduledStart.slice(0, 16).replace('T', ' ')}</span>
                      <span className="block text-muted-foreground">{l.learner || ''}</span>
                      {l.teacherFailed && <span className="block font-semibold text-destructive">{t('Teacher connection failed', 'اتصال المعلم وقع')}</span>}
                    </td>
                    <td className="py-1.5 pe-3">{side(l.teacher)}</td>
                    <td className="py-1.5">{side(l.student)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
