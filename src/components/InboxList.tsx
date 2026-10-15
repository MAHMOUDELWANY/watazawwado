import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { authedJson } from '../lib/authedJson';

interface InboxItem {
  id: string;
  kind: string;
  title_en: string;
  title_ar: string;
  body_en: string | null;
  body_ar: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Messages the server sent to this account (refunds, admin questions, placement results).
 * Shown at the top of the notifications page; opening the page marks them read.
 */
export function InboxList({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    let alive = true;
    authedJson<{ notifications: InboxItem[]; unreadCount: number }>('/api/me/notifications')
      .then((d) => {
        if (!alive) return;
        setItems(d.notifications || []);
        if (d.unreadCount > 0) authedJson('/api/me/notifications/read', { method: 'POST', body: '{}' }).catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={isAr ? 'رسائل من فريقنا' : 'Messages from our team'}>
      {items.slice(0, 10).map((n) => {
        const body = isAr ? n.body_ar : n.body_en;
        const content = (
          <div className={`p-4 rounded-2xl border flex gap-3 text-start ${n.read_at ? 'glass-surface border-border' : 'bg-primary/5 border-primary/30'}`}>
            <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">{isAr ? n.title_ar : n.title_en}</div>
              {body && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">{body}</p>}
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(n.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
        // Only links inside the site are followed.
        return n.link && n.link.startsWith('/') ? (
          <Link key={n.id} to={n.link} className="block hover:opacity-90">{content}</Link>
        ) : (
          <div key={n.id}>{content}</div>
        );
      })}
    </section>
  );
}
