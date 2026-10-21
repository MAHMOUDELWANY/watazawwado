import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Check, ListTodo, MessageCircle } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DASH_CARD } from './DashboardCards';

export type Bucket = 'overdue' | 'today' | 'week';

/** Overdue (before today), today, the next 7 days, in the admin's own time zone; later tasks are not listed. */
export function bucketTask(dueIso: string, now: Date = new Date()): Bucket | null {
  const due = new Date(dueIso);
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);
  const endOfWeek = new Date(startOfDay); endOfWeek.setDate(endOfWeek.getDate() + 7);
  if (due < startOfDay) return 'overdue';
  if (due < endOfDay) return 'today';
  if (due < endOfWeek) return 'week';
  return null;
}

/** Greeting from the team, never from one teacher (CLAUDE.md). */
export function followUpMessage(contactName: string | null, isAr: boolean): string {
  const name = contactName ? ` ${contactName}` : '';
  return isAr
    ? `السلام عليكم${name}، معاك فريق أكاديمية وتزودوا. حبينا نطمّن عليك ونشوف لو تحب نساعدك في حاجة.`
    : `Assalamu alaikum${name}, this is the Watazawwado Academy team. We wanted to check in and see if we can help with anything.`;
}

interface Task { id: string; account_student_id: string; title: string; due_at: string; source: string; studentName: string | null; contactName: string | null; whatsapp: string | null }

/** CRM-04 "My follow-ups" on the admin overview: overdue, today, this week; WhatsApp in one tap and mark done. */
export function FollowUpsCard() {
  const { t, isAr } = useT();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    dashboardFetch('/api/dashboard/admin/crm/tasks')
      .then((d: any) => setTasks(d.tasks || []))
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const done = async (id: string) => {
    setBusyId(id);
    try {
      await dashboardFetch(`/api/dashboard/admin/crm/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done: true }) });
      setTasks((list) => (list || []).filter((x) => x.id !== id));
    } catch {
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  };

  const groups: { key: Bucket; label: string }[] = [
    { key: 'overdue', label: t('Overdue', 'متأخرة') },
    { key: 'today', label: t('Today', 'النهارده') },
    { key: 'week', label: t('This week', 'الأسبوع ده') }
  ];
  const now = new Date();

  return (
    <div className={`${DASH_CARD} p-6 space-y-4 min-w-0`}>
      <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
        <ListTodo className="w-5 h-5 text-accent" />
        {t('My follow-ups', 'متابعاتي')}
      </h2>
      {failed && <p className="text-sm text-muted-foreground">{t("Couldn't load the follow-ups. Please refresh.", 'تعذر تحميل المتابعات. حدّث الصفحة.')}</p>}
      {tasks && tasks.length === 0 && <p className="text-sm text-muted-foreground">{t('Nothing to follow up this week.', 'مفيش متابعات الأسبوع ده.')}</p>}
      {tasks && groups.map((g) => {
        const items = tasks.filter((x) => bucketTask(x.due_at, now) === g.key);
        if (!items.length) return null;
        return (
          <section key={g.key} className="space-y-2">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${g.key === 'overdue' ? 'text-warning' : 'text-muted-foreground'}`}>{g.label} ({items.length})</h3>
            {items.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle p-3">
                <div className="min-w-0">
                  <Link to={`/dashboard/students/${task.account_student_id}`} className="text-sm font-semibold text-foreground hover:underline">
                    {task.studentName || t('Student', 'طالب')}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {task.title} · {DateTime.fromISO(task.due_at).setLocale(isAr ? 'ar' : 'en').toRelativeCalendar()}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {task.whatsapp && (
                    <a
                      href={buildWhatsAppUrl(followUpMessage(task.contactName, isAr), task.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-44 relative inline-flex items-center gap-1 px-3 py-1.5 rounded-xl btn-whatsapp-solid text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {t('WhatsApp', 'واتساب')}
                    </a>
                  )}
                  <Button variant="outline" size="sm" disabled={busyId === task.id} onClick={() => done(task.id)}>
                    <Check className="w-3.5 h-3.5" />
                    {t('Done', 'تم')}
                  </Button>
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** Student page (admin): add a follow-up for this family and see its open ones. */
export function StudentFollowUps({ studentId }: { studentId: string }) {
  const { t, isAr } = useT();
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(() => DateTime.now().plus({ days: 1 }).toISODate() || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/dashboard/admin/students/${studentId}/crm/tasks`;

  useEffect(() => {
    dashboardFetch(base).then((d: any) => setTasks(d.tasks || [])).catch(() => setError(t("Couldn't load the follow-ups.", 'تعذر تحميل المتابعات.')));
  }, [base]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Due at 9:00 local time on the chosen day.
      const dueAt = DateTime.fromISO(due).set({ hour: 9 }).toUTC().toISO();
      const d: any = await dashboardFetch(base, { method: 'POST', body: JSON.stringify({ title, dueAt }) });
      setTasks((list) => [...list, d.task].sort((a, b) => a.due_at.localeCompare(b.due_at)));
      setTitle('');
    } catch (err: any) {
      setError(err?.message || t('Something went wrong. Please try again.', 'حصلت مشكلة، حاول تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const open = tasks.filter((x) => !x.done_at);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ListTodo className="w-4 h-4 text-accent" />
        {t('Follow-ups', 'المتابعات')}
      </h3>
      {error && <div role="status" className="p-3 rounded-xl text-sm text-foreground bg-warning/10">{error}</div>}
      {open.map((x) => (
        <div key={x.id} className="text-sm text-foreground">
          {x.title} · <span className="text-muted-foreground">{DateTime.fromISO(x.due_at).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED)}</span>
        </div>
      ))}
      <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder={t('What to follow up', 'هتتابع إيه')} aria-label={t('Follow-up', 'المتابعة')} className="h-9 text-sm" />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={t('Due date', 'الميعاد')} className="h-9 text-sm sm:w-44" />
        <Button type="submit" size="sm" variant="outline" disabled={busy || !title.trim() || !due}>{t('Add', 'إضافة')}</Button>
      </form>
    </div>
  );
}
