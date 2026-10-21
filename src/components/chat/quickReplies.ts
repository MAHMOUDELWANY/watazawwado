/**
 * AD-03: saved replies for the admin inbox, in both languages. The built-in ones speak for the academy ("we");
 * the admin's own replies are kept in this browser.
 * shortcut: own replies live in localStorage (one admin today); move them to a table if several admins share them.
 */
export interface QuickReply { id: string; label: string; text: string; lang: 'ar' | 'en'; custom?: boolean }

export const BUILT_IN_REPLIES: QuickReply[] = [
  { id: 'greet-ar', lang: 'ar', label: 'ترحيب', text: 'السلام عليكم ورحمة الله، أهلاً بيك! إزاي نقدر نساعدك؟' },
  { id: 'greet-en', lang: 'en', label: 'Greeting', text: 'Assalamu alaikum, and welcome! How can we help?' },
  { id: 'checking-ar', lang: 'ar', label: 'بنراجع', text: 'شكرًا إنك كتبت لنا. بنراجع الموضوع وهنرد عليك النهارده إن شاء الله.' },
  { id: 'checking-en', lang: 'en', label: 'Looking into it', text: 'Thank you for writing to us. We are looking into it and will reply today, in sha Allah.' },
  { id: 'done-ar', lang: 'ar', label: 'تم', text: 'تمام، اتعمل. لو احتجت أي حاجة تانية اكتب لنا هنا في أي وقت.' },
  { id: 'done-en', lang: 'en', label: 'Done', text: 'All done. If you need anything else, write to us here any time.' },
  { id: 'teacher-ar', lang: 'ar', label: 'هنبلّغ المعلم', text: 'وصلتنا رسالتك، وهنبلّغ المعلم ونرجع لك بالرد.' },
  { id: 'teacher-en', lang: 'en', label: 'Passing to the teacher', text: 'We have your message and will pass it to the teacher, then get back to you.' }
];

const KEY = 'wz.quickReplies.v1';
const MAX_CUSTOM = 30;

export function loadCustomReplies(storage: Pick<Storage, 'getItem'> | null): QuickReply[] {
  try {
    const raw = storage?.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((r: any) => r && typeof r.id === 'string' && typeof r.text === 'string' && r.text.trim()).slice(0, MAX_CUSTOM)
          .map((r: any) => ({ id: r.id, text: String(r.text).slice(0, 2000), label: String(r.label || r.text).slice(0, 40), lang: r.lang === 'en' ? 'en' : 'ar', custom: true }))
      : [];
  } catch {
    return [];
  }
}

export function saveCustomReplies(storage: Pick<Storage, 'setItem'> | null, replies: QuickReply[]): void {
  try { storage?.setItem(KEY, JSON.stringify(replies.slice(0, MAX_CUSTOM))); } catch { /* storage blocked */ }
}

/** Arabic letters in the text → an Arabic reply. */
export const replyLang = (text: string): 'ar' | 'en' => (/[؀-ۿ]/.test(text) ? 'ar' : 'en');

export function filterThreads<T extends { kind: string; ownerName: string | null; teacherName: string | null; unread: boolean; lastMessageAt: string | null }>(
  threads: T[],
  f: { query: string; teacher: string; kind: 'all' | 'support' | 'lesson' }
): T[] {
  const q = f.query.trim().toLowerCase();
  return threads
    .filter((t) => f.kind === 'all' || t.kind === f.kind)
    .filter((t) => !f.teacher || t.teacherName === f.teacher)
    .filter((t) => !q || `${t.ownerName || ''} ${t.teacherName || ''}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => Number(b.unread) - Number(a.unread) || String(b.lastMessageAt || '').localeCompare(String(a.lastMessageAt || '')));
}
