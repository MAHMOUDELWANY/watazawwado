import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Users, CalendarCheck, CreditCard, Sparkles } from 'lucide-react';
import FocusTrap from '../../components/FocusTrap';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

interface Hit { type: 'student' | 'child' | 'booking' | 'payment' | 'lead'; id: string; title: string; subtitle: string; link: string }

const ICONS = { student: User, child: Users, booking: CalendarCheck, payment: CreditCard, lead: Sparkles };

/**
 * CRM-06: Ctrl/Cmd+K opens one search across accounts, children, emails, phones, booking references, payments and
 * leads (admin only). Arrow keys move, Enter opens, Escape closes.
 */
export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => { if (!open) { setQ(''); setHits([]); setActive(0); } }, [open]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setHits([]); return; }
    const mine = ++seq.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      dashboardFetch<{ results: Hit[] }>(`/api/dashboard/admin/search?q=${encodeURIComponent(query)}`)
        .then((d) => { if (mine === seq.current) { setHits(d.results || []); setActive(0); } })
        .catch(() => { if (mine === seq.current) setHits([]); })
        .finally(() => { if (mine === seq.current) setLoading(false); });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  if (!open) return null;
  const go = (h: Hit) => { onClose(); navigate(h.link); };
  const typeLabel: Record<Hit['type'], string> = {
    student: t('Account', 'حساب'), child: t('Child', 'طفل'), booking: t('Booking', 'حجز'), payment: t('Payment', 'دفعة'), lead: t('Lead', 'مهتم')
  };

  return (
    <FocusTrap onEscape={onClose}>
      <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t('Search everything', 'ابحث في كل حاجة')}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-xl rounded-2xl glass-dialog border border-border shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                if (e.key === 'Enter' && hits[active]) { e.preventDefault(); go(hits[active]); }
              }}
              placeholder={t('Name, email, phone, booking reference or payment…', 'اسم، إيميل، رقم، رقم حجز أو دفعة…')}
              aria-label={t('Search everything', 'ابحث في كل حاجة')}
              aria-controls="command-search-results"
              aria-activedescendant={hits[active] ? `cs-${hits[active].type}-${hits[active].id}` : undefined}
              className="flex-1 h-14 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            />
            <kbd className="hidden sm:inline text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5">Esc</kbd>
          </div>
          <ul id="command-search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {q.trim().length >= 2 && !loading && hits.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">{t('Nothing found.', 'مفيش نتايج.')}</li>
            )}
            {hits.map((h, i) => {
              const Icon = ICONS[h.type] || User;
              return (
                <li
                  key={`${h.type}-${h.id}-${i}`}
                  id={`cs-${h.type}-${h.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${i === active ? 'bg-surface-subtle' : ''}`}
                >
                  <Icon className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{h.title}</p>
                    {h.subtitle && <p className="text-xs text-muted-foreground truncate" dir="auto">{h.subtitle}</p>}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{typeLabel[h.type]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </FocusTrap>
  );
}
