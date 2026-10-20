import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

interface Item { key: string; count: number; link: string }

/** AD-01: the admin overview leads with what needs the admin today; the numbers come after. */
export function ActionItems() {
  const { t } = useT();
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    dashboardFetch('/api/dashboard/admin/action-items')
      .then((d: any) => setItems(d.items || []))
      .catch(() => setFailed(true));
  }, []);

  const label: Record<string, (n: number) => string> = {
    follow_ups: (n) => t(`${n} follow-up(s) due today`, `${n} متابعة النهارده`),
    pay_later: (n) => t(`${n} pay-later request(s)`, `${n} طلب ادفع لاحقاً`),
    refunds: (n) => t(`${n} refund request(s)`, `${n} طلب استرداد`),
    placements: (n) => t(`${n} placement result(s) to review`, `${n} نتيجة اختبار مستوى للمراجعة`),
    unread_chats: (n) => t(`${n} unread conversation(s)`, `${n} محادثة مش مقروءة`),
    health: (n) => t(`${n} system health warning(s)`, `${n} تنبيه في صحة النظام`),
    no_zoom_24h: (n) => t(`${n} lesson(s) in the next 24 h without a Zoom link`, `${n} حصة خلال 24 ساعة من غير لينك زووم`)
  };

  if (failed || !items) return null;
  const open = items.filter((i) => i.count > 0);

  return (
    <section aria-labelledby="action-items-heading" className="rounded-2xl border border-border p-5 glass-card space-y-3">
      <h2 id="action-items-heading" className="text-lg font-display font-bold text-foreground flex items-center gap-2">
        <BellRing className="w-5 h-5 text-accent" />
        {t('Needs you today', 'محتاجك النهارده')}
      </h2>
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          {t('Nothing needs you right now.', 'مفيش حاجة محتاجاك دلوقتي.')}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {open.map((i) => (
            <li key={i.key}>
              <Link to={i.link} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border-subtle hover:border-primary/40 transition-colors">
                <span className="text-sm font-semibold text-foreground">{(label[i.key] || ((n: number) => `${i.key}: ${n}`))(i.count)}</span>
                <span className="text-xs text-muted-foreground rtl:rotate-180" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
