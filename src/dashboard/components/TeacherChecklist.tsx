import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

interface Item { key: string; done: boolean; link: string }

/** TE-04: shown on Today until every item is done. Each item ticks itself on the server from real data. */
export function TeacherChecklist() {
  const { t } = useT();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    dashboardFetch('/api/dashboard/onboarding-checklist')
      .then((d: any) => setItems(d.allDone ? [] : d.items || []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  const label: Record<string, { title: string; how: string }> = {
    agreement: { title: t('Accept the teacher agreement', 'وافق على اتفاقية المعلم'), how: t('Read it and accept.', 'اقراها ووافق عليها.') },
    hours: { title: t('Set your weekly hours', 'حدد مواعيدك الأسبوعية'), how: t('Families can only book the hours you open.', 'الأسر بتحجز بس في المواعيد اللي تفتحها.') },
    calendar: { title: t('Connect Google Calendar', 'اربط تقويم جوجل'), how: t('Settings, then Integrations.', 'من الإعدادات، وبعدين الربط.') },
    photo: { title: t('Add your photo and card', 'ضيف صورتك وبطاقتك'), how: t('Send your photo to the admin in Messages.', 'ابعت صورتك للإدارة في الرسائل.') },
    zoom: { title: t('Test your Zoom host link', 'جرّب لينك زووم كمضيف'), how: t('Ticks itself once a lesson has a Zoom link; open it with "Start lesson".', 'بتتعلّم لوحدها أول ما حصة يبقى ليها لينك زووم؛ افتحه من "ابدأ الحصة".') }
  };
  const done = items.filter((i) => i.done).length;

  return (
    <section aria-labelledby="teacher-checklist-heading" className="glass-card rounded-2xl border border-border p-5 space-y-3">
      <h2 id="teacher-checklist-heading" className="text-base font-display font-semibold text-foreground flex items-center gap-2">
        <ListChecks className="w-5 h-5 text-accent" />
        {t(`Your first week (${done}/${items.length})`, `أسبوعك الأول (${done}/${items.length})`)}
      </h2>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.key}>
            <Link to={i.link} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-subtle">
              {i.done
                ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-label={t('Done', 'تم')} />
                : <Circle className="w-5 h-5 text-muted-foreground shrink-0" aria-label={t('To do', 'لسه')} />}
              <span>
                <span className={`block text-sm font-semibold ${i.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{label[i.key]?.title || i.key}</span>
                {!i.done && <span className="block text-xs text-muted-foreground">{label[i.key]?.how}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
