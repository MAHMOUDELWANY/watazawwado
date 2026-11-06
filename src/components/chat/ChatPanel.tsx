import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { MessageCircle, Send, ArrowLeft, Search, BookmarkPlus, X, Check, CheckCheck } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../ui/Button';
import { BrandSpinner } from '../ui/BrandLoader';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BUILT_IN_REPLIES, filterThreads, loadCustomReplies, replyLang, saveCustomReplies, type QuickReply } from './quickReplies';

const safeStorage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

/**
 * Text-only chat for every account (owner request 2026-10-16; visual pass 2026-11-02 in the site's own look).
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
  lastMessage?: { text: string; mine: boolean } | null;
  /** When the other side last opened the conversation; my messages up to then show as seen. */
  otherReadAt?: string | null;
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
const MAX_LEN = 2000;
// Messages from the same person within this gap read as one group (one label, tight spacing).
const GROUP_GAP_MS = 5 * 60 * 1000;
// Initials take one of the brand colours, steady per name.
const AVATAR_TONES = ['#087D91', '#C51F24', '#A06E14', '#8B4935', '#5E544A'];

const toneFor = (name: string) => AVATAR_TONES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_TONES.length];

function Avatar({ name, team, size = 40 }: { name: string; team?: boolean; size?: number }) {
  if (team) {
    return (
      <span className="shrink-0 rounded-full grid place-items-center bg-[#F9F7F1] dark:bg-[#EDE7DC] ring-1 ring-[#E5A93C]/50 shadow-[0_2px_6px_-2px_rgba(5,54,63,0.35)]" style={{ width: size, height: size }} aria-hidden="true">
        <img src="/logo-256.png" alt="" className="w-[70%] h-auto" />
      </span>
    );
  }
  const letter = [...(name.replace(/^(أستاذة?|ا?لأستاذة?|Ustadha?|Mr\.?|Mrs\.?)\s+/i, '').trim() || '?')][0];
  return (
    <span
      className="shrink-0 rounded-full grid place-items-center text-white font-bold shadow-[0_2px_6px_-2px_rgba(5,54,63,0.35)]"
      style={{ width: size, height: size, background: toneFor(name), fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function ChatPanel({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const locale = isAr ? 'ar-EG' : 'en-GB';
  const reduce = Boolean(useReducedMotion());
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  // ?thread=<id> opens that conversation (e.g. the admin's "Continue in chat" button).
  const [searchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('thread'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const lastAtRef = useRef<string | null>(null);
  // Messages already on screen when a conversation opens do not animate in; only new ones do.
  const settledRef = useRef(false);
  // AD-03: admin inbox filters and quick replies.
  const [filter, setFilter] = useState<{ query: string; teacher: string; kind: 'all' | 'support' | 'lesson' }>({ query: '', teacher: '', kind: 'all' });
  const [customReplies, setCustomReplies] = useState<QuickReply[]>(() => loadCustomReplies(safeStorage()));
  const updateCustom = (next: QuickReply[]) => { setCustomReplies(next); saveCustomReplies(safeStorage(), next); };

  const threadTitle = (t: Thread) => {
    if (t.kind === 'support') {
      if (role === 'admin') return t.ownerName || (isAr ? 'مستخدم' : 'User');
      return isAr ? 'فريق وتزودوا' : 'Watazawwado team';
    }
    if (role === 'student') return t.teacherName || (isAr ? 'المعلم' : 'Teacher');
    if (role === 'teacher') return t.ownerName || (isAr ? 'طالب' : 'Student');
    return `${t.ownerName || '?'} ↔ ${t.teacherName || '?'}`;
  };
  const threadSubtitle = (t: Thread) => t.kind === 'support'
    ? (role === 'admin' ? (isAr ? 'دعم ومتابعة' : 'Support') : (isAr ? 'الإدارة، لأي سؤال' : 'Our admin team, for any question'))
    : (isAr ? 'محادثة الحصص' : 'Lessons');
  // The academy's own conversation shows the academy mark instead of initials (not for the admin's list of families).
  const isTeamThread = (t: Thread) => t.kind === 'support' && role !== 'admin';

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
    settledRef.current = false;
    const pull = async () => {
      try {
        const after = lastAtRef.current ? `?after=${encodeURIComponent(lastAtRef.current)}` : '';
        const data = await authedJson<{ messages: Message[] }>(`/api/chat/threads/${activeId}/messages${after}`);
        if (!alive) return;
        if (data.messages.length === 0) { settledRef.current = true; return; }
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
    pull().then(() => { window.setTimeout(() => { settledRef.current = true; }, 50); });
    const id = window.setInterval(pull, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [activeId]);

  // Stay at the latest message (instant on open, smooth for new ones).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: settledRef.current && !reduce ? 'smooth' : 'auto' });
  }, [messages.length, reduce]);

  // The composer grows with the text, up to a few lines.
  useLayoutEffect(() => {
    const el = draftRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

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
      setThreads((prev) => prev?.map((t) => (t.id === activeId ? { ...t, lastMessageAt: data.message.created_at, lastMessage: { text: body.replace(/\s+/g, ' ').slice(0, 90), mine: true } } : t)) || prev);
      setDraft('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const senderLabel = (m: Message) =>
    m.sender_role === 'admin' ? (isAr ? 'الإدارة' : 'Admin')
      : m.sender_role === 'teacher' ? (isAr ? 'المعلم' : 'Teacher')
      : (isAr ? 'الطالب' : 'Student');

  const listTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    if (sameDay(d, now)) return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, y)) return isAr ? 'امبارح' : 'Yesterday';
    if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString(locale, { weekday: 'long' });
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };
  const dayLabel = (d: Date) => {
    const now = new Date();
    if (sameDay(d, now)) return isAr ? 'النهارده' : 'Today';
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, y)) return isAr ? 'امبارح' : 'Yesterday';
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
  };

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
    draftRef.current?.focus();
  };
  const unreadCount = shown.filter((t) => t.unread).length;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-4 h-[calc(100dvh-13rem)] min-h-[480px] max-h-[860px]"
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="chat-panel"
    >
      {/* Conversations */}
      <aside className={`${active ? 'hidden md:flex' : 'flex'} glass-card rounded-2xl flex-col min-h-0 overflow-hidden`}>
        <div className="px-4 pt-4 pb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-foreground">{isAr ? 'المحادثات' : 'Conversations'}</h2>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold tabular-nums text-[var(--teal)]">
              {isAr ? `${unreadCount} جديدة` : `${unreadCount} new`}
            </span>
          )}
        </div>
        {isAdmin && (
          <div className="px-3 pb-3 space-y-2 border-b border-border/60" data-testid="admin-inbox-filters">
            <div className="relative">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                value={filter.query}
                onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
                placeholder={isAr ? 'دوّر باسم الأسرة أو المعلم' : 'Search family or teacher'}
                aria-label={isAr ? 'بحث في المحادثات' : 'Search conversations'}
                className="ps-9 h-10 rounded-full"
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
            <p className="text-xs text-muted-foreground px-1">{isAr ? 'الجديد الأول' : 'Unread first'}</p>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {shown.length === 0 && (
            <div className="flex flex-col items-center text-center gap-3 px-6 py-14">
              <span className="w-16 h-16 rounded-full bg-[var(--teal-light)] text-[var(--teal)] grid place-items-center" aria-hidden="true">
                <MessageCircle className="w-7 h-7" />
              </span>
              <p className="font-display font-bold text-foreground">{isAr ? 'لسه مفيش محادثات' : 'No conversations yet'}</p>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {role === 'student'
                  ? (isAr
                    ? 'لما تحجز حصة، هتلاقي هنا محادثة مع معلمك، ومحادثة مع فريقنا لأي سؤال.'
                    : 'Once you book a lesson, your chat with your teacher shows here, along with one with our team for any question.')
                  : (isAr ? 'أول ما حد يبعت رسالة، هتظهر هنا.' : 'Messages show here as soon as someone writes.')}
              </p>
            </div>
          )}
          <ul className="grid gap-0.5">
            {shown.map((t) => {
              const selected = t.id === activeId;
              const title = threadTitle(t);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={`group relative w-full text-start px-3 py-3 rounded-xl flex items-center gap-3 transition-colors duration-150 cursor-pointer focus-ring ${
                      selected ? 'bg-[var(--teal-light)]' : 'hover:bg-surface-subtle'
                    }`}
                  >
                    {selected && <span aria-hidden="true" className="absolute inset-y-3 start-0 w-[3px] rounded-full bg-[var(--teal)]" />}
                    <Avatar name={title} team={isTeamThread(t)} size={44} />
                    <span className="flex-1 min-w-0 grid gap-0.5">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`text-sm truncate ${t.unread ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>{title}</span>
                        <span className={`text-[11px] shrink-0 tabular-nums ${t.unread ? 'text-[var(--teal)] font-semibold' : 'text-muted-foreground'}`}>{listTime(t.lastMessageAt)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`text-xs truncate ${t.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {t.lastMessage
                            ? <>{t.lastMessage.mine && <span className="text-muted-foreground">{isAr ? 'أنت: ' : 'You: '}</span>}{t.lastMessage.text}</>
                            : threadSubtitle(t)}
                        </span>
                        {t.unread && <span className="w-2.5 h-2.5 rounded-full bg-[var(--teal)] shrink-0 shadow-[0_0_0_3px_var(--teal-light)]" role="img" aria-label={isAr ? 'رسالة جديدة' : 'New message'} />}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Messages */}
      <section className={`${active ? 'flex' : 'hidden md:flex'} glass-card rounded-2xl flex-col min-h-0 overflow-hidden`}>
        {active ? (
          <>
            <header className="px-3 sm:px-4 py-3 border-b border-border/60 flex items-center gap-3 bg-surface/80 backdrop-blur-sm">
              <button type="button" onClick={() => setActiveId(null)} className="md:hidden w-11 h-11 -ms-1 grid place-items-center rounded-full hover:bg-surface-subtle cursor-pointer focus-ring" aria-label={isAr ? 'رجوع' : 'Back'}>
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <Avatar name={threadTitle(active)} team={isTeamThread(active)} size={40} />
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-foreground truncate leading-tight">{threadTitle(active)}</h2>
                <p className="text-xs text-muted-foreground truncate">{threadSubtitle(active)}</p>
              </div>
              {isAdmin && active.ownerStudentId && (
                <Link to={`/dashboard/students/${active.ownerStudentId}`} className="text-xs font-semibold text-primary hover:underline underline-offset-4 shrink-0 min-h-11 inline-flex items-center px-2 rounded-lg focus-ring">
                  {isAr ? 'سجل الأسرة' : 'Family timeline'}
                </Link>
              )}
            </header>

            <div ref={scrollRef} className="khatam-field flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
                  <Avatar name={threadTitle(active)} team={isTeamThread(active)} size={64} />
                  <p className="font-display font-bold text-foreground">{threadTitle(active)}</p>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    {active.kind === 'support' && role !== 'admin'
                      ? (isAr ? 'اكتب أي سؤال، وفريقنا هيرد عليك هنا.' : 'Ask anything, and our team replies here.')
                      : (isAr ? 'ابدأ المحادثة.' : 'Start the conversation.')}
                  </p>
                </div>
              )}
              <ol className="grid">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => {
                    const at = new Date(m.created_at);
                    const prev = messages[i - 1];
                    const next = messages[i + 1];
                    const newDay = !prev || !sameDay(new Date(prev.created_at), at);
                    const joinsPrev = !newDay && prev && prev.mine === m.mine && prev.sender_role === m.sender_role && at.getTime() - new Date(prev.created_at).getTime() < GROUP_GAP_MS;
                    const joinsNext = next && next.mine === m.mine && next.sender_role === m.sender_role && sameDay(new Date(next.created_at), at) && new Date(next.created_at).getTime() - at.getTime() < GROUP_GAP_MS;
                    const seen = m.mine && active.otherReadAt && active.otherReadAt >= m.created_at;
                    return (
                      <motion.li
                        key={m.id}
                        layout={reduce ? false : 'position'}
                        initial={settledRef.current && !reduce ? { opacity: 0, y: 10, scale: 0.98 } : false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className={joinsPrev ? 'mt-0.5' : 'mt-3'}
                      >
                        {newDay && (
                          <div className="flex justify-center my-3" role="separator" aria-label={dayLabel(at)}>
                            <span className="text-[11px] font-semibold text-muted-foreground bg-surface/90 border border-border/70 rounded-full px-3 py-1 shadow-[0_1px_2px_rgba(5,54,63,0.06)]">{dayLabel(at)}</span>
                          </div>
                        )}
                        <div className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`relative max-w-[82%] sm:max-w-[72%] px-3.5 pt-2 pb-1.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-[0_1px_2px_rgba(5,54,63,0.08)] ${
                              m.mine
                                ? `bg-[var(--teal)] text-white rounded-2xl ${joinsNext ? '' : 'rounded-ee-md'}`
                                : `bg-surface text-foreground border border-border/70 rounded-2xl ${joinsNext ? '' : 'rounded-es-md'}`
                            }`}
                          >
                            {!m.mine && !joinsPrev && (isAdmin || m.sender_role === 'admin' || active.kind === 'support') && (
                              <span className={`block text-[11px] font-bold mb-0.5 ${m.sender_role === 'admin' ? 'text-[#A06E14] dark:text-[#E5A93C]' : 'text-[var(--teal)]'}`}>{senderLabel(m)}</span>
                            )}
                            <span>{m.body}</span>
                            <span className={`flex items-center justify-end gap-1 mt-0.5 text-[10.5px] tabular-nums ${m.mine ? 'text-white/80' : 'text-muted-foreground'}`}>
                              <time dateTime={m.created_at}>{at.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</time>
                              {m.mine && (seen
                                ? <CheckCheck className="w-3.5 h-3.5" aria-label={isAr ? 'اتشافت' : 'Seen'} />
                                : <Check className="w-3.5 h-3.5" aria-label={isAr ? 'اتبعتت' : 'Sent'} />)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
            </div>

            <form onSubmit={send} className="p-2.5 sm:p-3 border-t border-border/60 bg-surface/80 backdrop-blur-sm">
              <div className="flex items-end gap-2 rounded-[22px] border border-border bg-background/70 ps-4 pe-1.5 py-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--teal-border)] focus-within:shadow-[0_0_0_4px_var(--teal-light)]">
                <textarea
                  ref={draftRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                    }
                  }}
                  maxLength={MAX_LEN}
                  rows={1}
                  placeholder={isAr ? 'اكتب رسالتك…' : 'Write a message…'}
                  aria-label={isAr ? 'رسالتك' : 'Your message'}
                  className="flex-1 min-w-0 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground outline-none max-h-40"
                />
                <Button type="submit" isLoading={sending} disabled={!draft.trim()} size="icon" aria-label={isAr ? 'إرسال' : 'Send'} className="!rounded-full !w-11 !h-11 shrink-0">
                  <Send className="w-[18px] h-[18px] rtl:-scale-x-100" />
                </Button>
              </div>
              <div className="flex justify-between gap-2 px-3 pt-1.5 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">{isAr ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Enter to send · Shift+Enter for a new line'}</span>
                {draft.length > MAX_LEN - 200 && <span className="tabular-nums ms-auto">{draft.length}/{MAX_LEN}</span>}
              </div>
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
          <div className="khatam-field flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
            <span className="w-16 h-16 rounded-full bg-[var(--teal-light)] text-[var(--teal)] grid place-items-center" aria-hidden="true">
              <MessageCircle className="w-7 h-7" />
            </span>
            <p className="font-display font-bold text-foreground">{isAr ? 'اختار محادثة' : 'Choose a conversation'}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{isAr ? 'كل رسايلك مع فريقنا ومعلمينك في مكان واحد.' : 'All your messages with our team and your teachers, in one place.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
