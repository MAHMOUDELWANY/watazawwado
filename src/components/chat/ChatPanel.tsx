import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, ShieldCheck, GraduationCap, ArrowLeft, Search, BookmarkPlus, X } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { BrandSpinner } from '../ui/BrandLoader';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BUILT_IN_REPLIES, filterThreads, loadCustomReplies, replyLang, saveCustomReplies, type QuickReply } from './quickReplies';

const safeStorage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

/**
 * Text-only chat for every account (owner request 2026-10-16).
 * Students and teachers see a pinned conversation with the admin team; students also get one per
 * teacher they booked with. The super admin sees every conversation. New messages are fetched every
 * few seconds while the page is open (no realtime service needed on the free plan).
 */

interface Thread {
  id: string;
  kind: 'support' | 'lesson';
  ownerRole: 'student' | 'teacher';
  ownerName: string | null;
  teacherName: string | null;
  isMine: boolean;
  lastMessageAt: string | null;
  unread: boolean;
  ownerStudentId?: string | null; // admin only
}

interface Message {
  id: string;
  sender_role: 'student' | 'teacher' | 'admin';
  body: string;
  created_at: string;
  mine: boolean;
}

const POLL_MS = 5000;

export function ChatPanel({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  // ?thread=<id> opens that conversation (e.g. the admin's "Continue in chat" button).
  const [searchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('thread'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string | null>(null);
  // AD-03: admin inbox filters and quick replies.
  const [filter, setFilter] = useState<{ query: string; teacher: string; kind: 'all' | 'support' | 'lesson' }>({ query: '', teacher: '', kind: 'all' });
  const [customReplies, setCustomReplies] = useState<QuickReply[]>(() => loadCustomReplies(safeStorage()));
  const updateCustom = (next: QuickReply[]) => { setCustomReplies(next); saveCustomReplies(safeStorage(), next); };

  const threadTitle = (t: Thread) => {
    if (t.kind === 'support') {
      if (role === 'admin') return t.ownerName || (isAr ? 'مستخدم' : 'User');
      return isAr ? 'فريق وتزودوا (الإدارة)' : 'Watazawwado team (admin)';
    }
    if (role === 'student') return t.teacherName || (isAr ? 'المعلم' : 'Teacher');
    if (role === 'teacher') return t.ownerName || (isAr ? 'طالب' : 'Student');
    return `${t.ownerName || '?'} ↔ ${t.teacherName || '?'}`;
  };

  const loadThreads = useCallback(async () => {
    try {
      const data = await authedJson<{ threads: Thread[]; role: 'student' | 'teacher' | 'admin' }>('/api/chat/threads');
      setThreads(data.threads);
      setRole(data.role);
      setActiveId((cur) => cur ?? (window.matchMedia('(min-width: 768px)').matches ? data.threads[0]?.id ?? null : null));
    } catch (err: any) {
      setError(err.message);
      setThreads([]);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const id = window.setInterval(loadThreads, 30000);
    return () => window.clearInterval(id);
  }, [loadThreads]);

  // Load the open conversation, then poll for new messages.
  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    setMessages([]);
    lastAtRef.current = null;
    const pull = async () => {
      try {
        const after = lastAtRef.current ? `?after=${encodeURIComponent(lastAtRef.current)}` : '';
        const data = await authedJson<{ messages: Message[] }>(`/api/chat/threads/${activeId}/messages${after}`);
        if (!alive || data.messages.length === 0) return;
        lastAtRef.current = data.messages[data.messages.length - 1].created_at;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
        setThreads((prev) => prev?.map((t) => (t.id === activeId ? { ...t, unread: false } : t)) || prev);
      } catch {
        /* the next poll retries */
      }
    };
    pull();
    const id = window.setInterval(pull, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;
    setSending(true);
    setError(null);
    try {
      const data = await authedJson<{ message: Message }>(`/api/chat/threads/${activeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body })
      });
      setMessages((prev) => [...prev, data.message]);
      lastAtRef.current = data.message.created_at;
      setDraft('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const senderLabel = (m: Message) =>
    m.mine ? (isAr ? 'أنت' : 'You')
      : m.sender_role === 'admin' ? (isAr ? 'الإدارة' : 'Admin')
      : m.sender_role === 'teacher' ? (isAr ? 'المعلم' : 'Teacher')
      : (isAr ? 'الطالب' : 'Student');

  if (threads === null) {
    return <div className="py-16 flex justify-center"><BrandSpinner size={28} /></div>;
  }

  const active = threads.find((t) => t.id === activeId) || null;
  const isAdmin = role === 'admin';
  const shown = isAdmin ? filterThreads(threads, filter) : threads;
  const teacherNames = isAdmin ? [...new Set(threads.map((t) => t.teacherName).filter(Boolean) as string[])].sort() : [];
  const replies = [...BUILT_IN_REPLIES, ...customReplies];
  const insertReply = (id: string) => {
    const r = replies.find((x) => x.id === id);
    if (r) setDraft((d) => (d.trim() ? `${d.trimEnd()}\n${r.text}` : r.text));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[60vh]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Conversations */}
      <aside className={`${active ? 'hidden md:block' : ''} glass-card rounded-2xl p-2 space-y-1 overflow-y-auto max-h-[70vh]`}>
        {isAdmin && (
          <div className="p-1 space-y-2" data-testid="admin-inbox-filters">
            <div className="relative">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                value={filter.query}
                onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
                placeholder={isAr ? 'دوّر باسم الأسرة أو المعلم' : 'Search family or teacher'}
                aria-label={isAr ? 'بحث في المحادثات' : 'Search conversations'}
                className="ps-9 h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filter.kind} onChange={(e) => setFilter((f) => ({ ...f, kind: e.target.value as 'all' | 'support' | 'lesson' }))} aria-label={isAr ? 'نوع المحادثة' : 'Conversation type'} className="h-10 text-xs">
                <option value="all">{isAr ? 'الكل' : 'All'}</option>
                <option value="support">{isAr ? 'دعم' : 'Support'}</option>
                <option value="lesson">{isAr ? 'الحصص' : 'Lessons'}</option>
              </Select>
              <Select value={filter.teacher} onChange={(e) => setFilter((f) => ({ ...f, teacher: e.target.value }))} aria-label={isAr ? 'المعلم' : 'Teacher'} className="h-10 text-xs">
                <option value="">{isAr ? 'كل المعلمين' : 'All teachers'}</option>
                {teacherNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              {isAr ? `${shown.filter((t) => t.unread).length} غير مقروءة · الجديد الأول` : `${shown.filter((t) => t.unread).length} unread · unread first`}
            </p>
          </div>
        )}
        {shown.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{isAr ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p>
        )}
        {shown.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={`w-full text-start px-3 py-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
              t.id === activeId ? 'bg-primary/10 text-foreground' : 'hover:bg-surface-subtle text-foreground'
            }`}
          >
            <span className="w-9 h-9 rounded-full bg-secondary/40 text-primary flex items-center justify-center shrink-0">
              {t.kind === 'support' ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold truncate">{threadTitle(t)}</span>
              <span className="block text-xs text-muted-foreground truncate">
                {t.kind === 'support' ? (isAr ? 'دعم ومتابعة' : 'Support') : (isAr ? 'محادثة الحصص' : 'Lessons')}
              </span>
            </span>
            {t.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" aria-label={isAr ? 'رسالة جديدة' : 'New message'} />}
          </button>
        ))}
      </aside>

      {/* Messages */}
      <section className={`${active ? '' : 'hidden md:flex'} glass-card rounded-2xl flex flex-col min-h-[60vh] max-h-[75vh]`}>
        {active ? (
          <>
            <header className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
              <button type="button" onClick={() => setActiveId(null)} className="md:hidden p-1.5 rounded-lg hover:bg-surface-subtle cursor-pointer" aria-label={isAr ? 'رجوع' : 'Back'}>
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <h2 className="font-display font-bold text-foreground truncate flex-1 min-w-0">{threadTitle(active)}</h2>
              {isAdmin && active.ownerStudentId && (
                <Link to={`/dashboard/students/${active.ownerStudentId}`} className="text-xs font-semibold text-primary hover:underline shrink-0 min-h-11 inline-flex items-center">
                  {isAr ? 'سجل الأسرة' : 'Family timeline'}
                </Link>
              )}
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {active.kind === 'support' && role !== 'admin'
                    ? (isAr ? 'اكتب أي سؤال، وفريقنا هيرد عليك هنا.' : 'Ask anything — our team replies here.')
                    : (isAr ? 'ابدأ المحادثة.' : 'Start the conversation.')}
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    m.mine ? 'bg-primary text-primary-foreground' : 'bg-surface-subtle text-foreground'
                  }`}>
                    <div className="text-[11px] opacity-75 mb-0.5">
                      {senderLabel(m)} · {new Date(m.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                    {m.body}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-border/60 flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                  }
                }}
                maxLength={2000}
                rows={2}
                placeholder={isAr ? 'اكتب رسالتك…' : 'Write a message…'}
                aria-label={isAr ? 'رسالتك' : 'Your message'}
                className="flex-1 resize-none"
              />
              <Button type="submit" isLoading={sending} disabled={!draft.trim()} size="icon" aria-label={isAr ? 'إرسال' : 'Send'}>
                <Send className="w-4 h-4 rtl:-scale-x-100" />
              </Button>
            </form>
            {isAdmin && (
              <div className="px-3 pb-3 flex flex-wrap items-center gap-2" data-testid="quick-replies">
                <Select value="" onChange={(e) => insertReply(e.target.value)} aria-label={isAr ? 'ردود جاهزة' : 'Quick replies'} className="h-10 text-xs w-auto max-w-full">
                  <option value="">{isAr ? 'ردود جاهزة…' : 'Quick replies…'}</option>
                  <optgroup label="العربية">
                    {replies.filter((r) => r.lang === 'ar').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </optgroup>
                  <optgroup label="English">
                    {replies.filter((r) => r.lang === 'en').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </optgroup>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!draft.trim()}
                  onClick={() => {
                    const text = draft.trim();
                    updateCustom([...customReplies, { id: `c-${Date.now()}`, text, label: text.slice(0, 40), lang: replyLang(text), custom: true }]);
                  }}
                >
                  <BookmarkPlus className="w-4 h-4 me-1" aria-hidden="true" />
                  {isAr ? 'احفظ كرد جاهز' : 'Save as quick reply'}
                </Button>
                {customReplies.length > 0 && (
                  <details className="w-full text-xs">
                    <summary className="cursor-pointer text-muted-foreground min-h-11 inline-flex items-center">{isAr ? `ردودي (${customReplies.length})` : `My replies (${customReplies.length})`}</summary>
                    <ul className="mt-1 space-y-1">
                      {customReplies.map((r) => (
                        <li key={r.id} className="flex items-center gap-2">
                          <span className="flex-1 min-w-0 truncate">{r.text}</span>
                          <button type="button" onClick={() => updateCustom(customReplies.filter((x) => x.id !== r.id))} aria-label={isAr ? 'احذف الرد' : 'Remove reply'} className="tap-44 relative w-7 h-7 grid place-items-center rounded-full hover:bg-surface-subtle cursor-pointer">
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
            {error && <p role="alert" className="px-4 pb-3 text-sm text-destructive">{error}</p>}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-8">
            <MessageCircle className="w-8 h-8" />
            <p className="text-sm">{isAr ? 'اختار محادثة' : 'Choose a conversation'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
