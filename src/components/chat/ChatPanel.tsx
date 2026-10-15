import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, ShieldCheck, GraduationCap, ArrowLeft } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { BrandSpinner } from '../ui/BrandLoader';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-[60vh]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Conversations */}
      <aside className={`${active ? 'hidden md:block' : ''} glass-card rounded-2xl p-2 space-y-1 overflow-y-auto max-h-[70vh]`}>
        {threads.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{isAr ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p>
        )}
        {threads.map((t) => (
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
              <h2 className="font-display font-bold text-foreground truncate">{threadTitle(active)}</h2>
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
