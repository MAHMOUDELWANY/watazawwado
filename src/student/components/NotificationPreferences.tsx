import React, { useEffect, useState } from 'react';
import { authedJson } from '../../lib/authedJson';

type Key = 'progress_emails' | 'renewal_reminders' | 'follow_ups';
type Prefs = Record<Key, boolean>;

const ROWS: Array<{ key: Key; en: [string, string]; ar: [string, string] }> = [
  { key: 'progress_emails', en: ['Progress emails', 'A short monthly note on how the lessons are going.'], ar: ['إيميلات التقدّم', 'رسالة قصيرة كل شهر عن سير الحصص.'] },
  { key: 'renewal_reminders', en: ['Renewal reminders', 'When a package has 2 lessons left, and when it is done.'], ar: ['تذكير التجديد', 'لما يفضل في الباقة حصتين، ولما تخلص.'] },
  { key: 'follow_ups', en: ['Follow-ups', 'After a free trial, and a gentle hello if we have not seen you in a while.'], ar: ['رسائل المتابعة', 'بعد الحصة التجريبية، وسلام لطيف لو غبت عننا فترة.'] }
];

/**
 * RN-07: which optional emails this account gets. Each switch saves at once. Booking, reminder and payment emails
 * always go; a switch only stops the email, the notice on the site stays.
 */
export function NotificationPreferences({ isAr }: { isAr: boolean }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState<Key | null>(null);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    authedJson<{ preferences: Prefs }>('/api/student/notification-preferences')
      .then((d) => setPrefs(d.preferences))
      .catch(() => setPrefs({ progress_emails: true, renewal_reminders: true, follow_ups: true }));
  }, []);

  const toggle = async (key: Key) => {
    if (!prefs || saving) return;
    const next = !prefs[key];
    setPrefs({ ...prefs, [key]: next });
    setSaving(key);
    setStatus('idle');
    try {
      const d = await authedJson<{ preferences: Prefs }>('/api/student/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next })
      });
      setPrefs(d.preferences);
      setStatus('saved');
    } catch {
      setPrefs((p) => (p ? { ...p, [key]: !next } : p));
      setStatus('error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="email-prefs-title" data-testid="notification-preferences">
      <div>
        <h3 id="email-prefs-title" className="text-sm font-semibold text-foreground">{isAr ? 'الإيميلات اللي تحب توصلك' : 'Emails you would like'}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isAr ? 'إيميلات الحجز والتذكير بالحصص والدفع بتوصل دايماً.' : 'Booking, lesson reminder and payment emails always arrive.'}
        </p>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {ROWS.map((r) => {
          const on = prefs ? prefs[r.key] : true;
          const [title, desc] = isAr ? r.ar : r.en;
          return (
            <li key={r.key} className="flex items-center justify-between gap-4 p-3.5">
              <div className="min-w-0">
                <p id={`pref-${r.key}`} className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-labelledby={`pref-${r.key}`}
                disabled={!prefs || saving !== null}
                onClick={() => toggle(r.key)}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors focus-ring cursor-pointer disabled:opacity-60 tap-44 ${on ? 'bg-[var(--teal)]' : 'bg-muted-foreground/30'}`}
              >
                <span aria-hidden="true" className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-[inset-inline-start] ${on ? 'start-6' : 'start-1'}`} />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs min-h-4" aria-live="polite">
        {status === 'saved' && <span className="text-success">{isAr ? 'اتحفظ.' : 'Saved.'}</span>}
        {status === 'error' && <span className="text-destructive">{isAr ? 'معرفناش نحفظ. جرّب تاني.' : 'Could not save. Please try again.'}</span>}
      </p>
    </section>
  );
}
