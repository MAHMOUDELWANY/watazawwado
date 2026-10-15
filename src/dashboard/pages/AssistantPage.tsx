import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';

/**
 * Teacher AI assistant — first version (owner request 2026-10-16): lesson plans, progress reports,
 * homework, or any free request, optionally using one of the teacher's students as context.
 * Later versions can save outputs to the student file, schedule reports, etc.
 */

type Task = 'lesson_plan' | 'report' | 'homework' | 'free';

export default function AssistantPage() {
  const { t, isAr, lang } = useT();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState('');
  const [task, setTask] = useState<Task>('lesson_plan');
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dashboardFetch<any>('/api/dashboard/students')
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.students || [];
        setStudents(list.map((s: any) => ({ id: s.id, name: s.name })).filter((s: any) => s.id));
      })
      .catch(() => {});
  }, []);

  const tasks: { key: Task; label: string }[] = [
    { key: 'lesson_plan', label: t('Lesson plan', 'خطة حصة') },
    { key: 'report', label: t('Progress report', 'تقرير متابعة') },
    { key: 'homework', label: t('Homework', 'واجب') },
    { key: 'free', label: t('Anything else', 'أي طلب تاني') }
  ];

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setReply('');
    try {
      const d = await dashboardFetch<{ reply: string }>('/api/dashboard/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, prompt, studentId: studentId || undefined, lang })
      });
      setReply(d.reply);
    } catch (err: any) {
      setError(err.message || t('Jalila could not answer.', 'جليلة مقدرتش ترد.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> {t('Jalila — your teaching assistant', 'جليلة — مساعدتك في التدريس')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Jalila prepares lessons, reports and homework in seconds. Always review before you use it.', 'جليلة بتجهّزلك الحصص والتقارير والواجبات في ثواني. راجع الناتج دايماً قبل ما تستخدمه.')}
        </p>
      </div>

      <form onSubmit={ask} className="space-y-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('Task', 'المطلوب')}>
          {tasks.map((x) => (
            <button
              key={x.key}
              type="button"
              role="radio"
              aria-checked={task === x.key}
              onClick={() => setTask(x.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${task === x.key ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-subtle'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} aria-label={t('Student', 'الطالب')}>
          <option value="">{t('No specific student', 'من غير طالب معيّن')}</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          maxLength={3000}
          aria-label={t('Your request', 'طلبك')}
          placeholder={t('e.g. Next lesson: Surat Al-Mulk ayat 1–10, focus on madd rules, 45 minutes.', 'مثال: الحصة الجاية: سورة الملك من 1 لـ 10، التركيز على أحكام المد، 45 دقيقة.')}
        />
        <Button type="submit" isLoading={busy} disabled={task === 'free' && !prompt.trim()}>
          {t('Prepare', 'جهّز')}
        </Button>
      </form>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {reply && (
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(reply).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="ms-1.5">{copied ? t('Copied', 'اتنسخ') : t('Copy', 'انسخ')}</span>
              </Button>
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reply}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
