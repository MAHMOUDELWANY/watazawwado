import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useAppLanguage } from '../../lib/language';

interface Interval {
  weekday: number;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
}

// weekday follows the DB/engine convention: 0 = Sunday … 6 = Saturday.
const DAYS = [
  { en: 'Sunday', ar: 'الأحد' },
  { en: 'Monday', ar: 'الاثنين' },
  { en: 'Tuesday', ar: 'الثلاثاء' },
  { en: 'Wednesday', ar: 'الأربعاء' },
  { en: 'Thursday', ar: 'الخميس' },
  { en: 'Friday', ar: 'الجمعة' },
  { en: 'Saturday', ar: 'السبت' }
];

/**
 * Each teacher sets their own weekly teaching hours (RULES.md §1).
 * Students can only book inside these hours; Google Calendar busy times are subtracted on top.
 */
export default function AvailabilityPage() {
  const { lang } = useAppLanguage();
  const isAr = lang === 'ar';
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    dashboardFetch('/api/dashboard/availability')
      .then((res: any) => {
        setIntervals(
          (res.availability || [])
            .filter((a: any) => a.is_active !== false)
            .map((a: any) => ({ weekday: a.weekday, start_time: a.start_time.slice(0, 5), end_time: a.end_time.slice(0, 5) }))
        );
      })
      .catch(() => setMessage({ kind: 'error', text: isAr ? 'تعذر تحميل مواعيدك.' : "Couldn't load your hours." }))
      .finally(() => setLoading(false));
  }, []);

  const update = (index: number, patch: Partial<Interval>) =>
    setIntervals(prev => prev.map((iv, i) => (i === index ? { ...iv, ...patch } : iv)));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await dashboardFetch('/api/dashboard/availability', {
        method: 'PUT',
        body: JSON.stringify({ schedule: intervals.map(iv => ({ ...iv, is_active: true })) })
      });
      setMessage({ kind: 'ok', text: isAr ? 'تم حفظ مواعيدك. يمكن للطلاب الآن الحجز فيها.' : 'Saved! Students can now book in these hours.' });
    } catch (err: any) {
      setMessage({ kind: 'error', text: err?.message || (isAr ? 'تعذر الحفظ، حاول مرة أخرى.' : "Couldn't save. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        {isAr ? 'جارٍ التحميل…' : 'Loading…'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{isAr ? 'مواعيد التدريس' : 'My teaching hours'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? 'حدّد الأوقات التي يمكن للطلاب الحجز فيها كل أسبوع (بتوقيت القاهرة). إذا ربطت تقويم جوجل، نخفي تلقائياً الأوقات المشغولة فيه.'
            : "Set the times students can book each week (Cairo time). If you've connected Google Calendar, busy times there are hidden automatically."}
        </p>
      </div>

      {message && (
        <div role="status" className={`p-3 rounded-xl text-sm ${message.kind === 'ok' ? 'bg-success/10' : 'bg-warning/10'} text-foreground`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {DAYS.map((day, weekday) => {
          const rows = intervals.map((iv, index) => ({ iv, index })).filter(r => r.iv.weekday === weekday);
          return (
            <div key={weekday} className="glass-card p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{isAr ? day.ar : day.en}</span>
                <button
                  type="button"
                  onClick={() => setIntervals(prev => [...prev, { weekday, start_time: '16:00', end_time: '20:00' }])}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة فترة' : 'Add hours'}
                </button>
              </div>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{isAr ? 'لا يوجد تدريس في هذا اليوم.' : 'Not teaching on this day.'}</p>
              ) : (
                rows.map(({ iv, index }) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <label className="text-sm text-muted-foreground">
                      {isAr ? 'من' : 'From'}
                      <input
                        type="time"
                        value={iv.start_time}
                        onChange={e => update(index, { start_time: e.target.value })}
                        className="ms-2 px-2 py-1 rounded-lg border border-border bg-background text-foreground"
                      />
                    </label>
                    <label className="text-sm text-muted-foreground">
                      {isAr ? 'إلى' : 'To'}
                      <input
                        type="time"
                        value={iv.end_time}
                        onChange={e => update(index, { end_time: e.target.value })}
                        className="ms-2 px-2 py-1 rounded-lg border border-border bg-background text-foreground"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={isAr ? 'حذف الفترة' : 'Remove these hours'}
                      onClick={() => setIntervals(prev => prev.filter((_, i) => i !== index))}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground font-semibold cursor-pointer disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isAr ? 'حفظ المواعيد' : 'Save hours'}
      </button>
    </div>
  );
}
