import React, { useEffect, useState } from 'react';
import { ArrowRight, BellRing, Check, CheckCheck, ChevronUp, Mic, Paperclip, Search, Send, Smile } from 'lucide-react';
import { ZaadiRig, type ZaadiPose } from '../components/zaadi/ZaadiRig';
import { hideBootSplash } from '../lib/bootSplash';

/**
 * DEV-ONLY prototype (route /prototype/messages), owner review 2026-11-09: phone notifications in the Duolingo layout
 * (short title with an emoji, one line, Zaadi or the teacher's photo on the side) and a WhatsApp-style inbox and chat
 * for every account type, in our colours. Nothing here talks to the server.
 */

type Role = 'student' | 'teacher' | 'admin';
type Thread = { id: string; name: string; sub: string; photo?: string; initials?: string; last: string; time: string; unread?: number; mine?: boolean; read?: boolean; tag: string };

const PHOTO = { mahmoud: '/teacher-mahmoud-avatar.jpg', afnan: '/teacher-afnan-avatar.jpg', team: '/logo-256.png' };

const PUSHES: { who: Role; emoji: string; title: string; body: string; side: { pose?: ZaadiPose; photo?: string }; action: string }[] = [
  { who: 'student', emoji: '⏰', title: 'يوسف، حصتك بعد ساعتين', body: 'تجويد مع أ. عفنان · 7:00 م', side: { pose: 'point' }, action: 'افتح الحصة' },
  { who: 'student', emoji: '💬', title: 'أ. محمود', body: 'تمام، نكمّل سورة الملك بكرة إن شاء الله', side: { photo: PHOTO.mahmoud }, action: 'رد' },
  { who: 'student', emoji: '📚', title: 'واجب جديد مستنيك', body: '3 آيات تحفظهم قبل الحصة الجاية', side: { pose: 'think' }, action: 'افتح الواجب' },
  { who: 'student', emoji: '🎧', title: 'أ. عفنان ردّت على تلاوتك', body: 'ما شاء الله، تحسّن واضح في المدود', side: { pose: 'love' }, action: 'اسمع الرد' },
  { who: 'teacher', emoji: '🎉', title: 'حصة جديدة اتحجزت', body: 'مريم · الأحد 5:00 م', side: { pose: 'cheer' }, action: 'شوف الجدول' },
  { who: 'teacher', emoji: '🙋', title: 'طالب جديد انضم لك', body: 'عمر، 9 سنين · نور البيان', side: { pose: 'wave' }, action: 'اعرفه' },
  { who: 'admin', emoji: '📝', title: 'طلب انضمام جديد', body: 'عائلة سارة · تحفيظ للأطفال', side: { pose: 'wow' }, action: 'راجع' },
  { who: 'admin', emoji: '💬', title: 'أ. عفنان', body: 'ممكن أنقل حصة الخميس لساعة بدري؟', side: { photo: PHOTO.afnan }, action: 'رد' },
];

const THREADS: Record<Role, Thread[]> = {
  student: [
    { id: 'm', name: 'أ. محمود', sub: 'تحفيظ', photo: PHOTO.mahmoud, last: 'تمام، نكمّل سورة الملك بكرة إن شاء الله', time: '9:41 م', unread: 2, tag: 'teachers' },
    { id: 'a', name: 'أ. عفنان', sub: 'تجويد', photo: PHOTO.afnan, last: 'جزاكِ الله خيرًا يا أستاذة', time: 'أمس', mine: true, read: true, tag: 'teachers' },
    { id: 't', name: 'فريق وتزودوا', sub: 'لأي سؤال', photo: PHOTO.team, last: 'تم تأكيد باقة الشهر، بالتوفيق', time: 'الإثنين', tag: 'team' },
  ],
  teacher: [
    { id: 's1', name: 'يوسف أحمد', sub: 'ولي الأمر: أحمد', initials: 'ي', last: 'يوسف عنده امتحان، ممكن نأجل؟', time: '9:12 م', unread: 1, tag: 'families' },
    { id: 's2', name: 'مريم خالد', sub: 'طالبة', initials: 'م', last: 'حفظت الواجب الحمد لله', time: '8:40 م', unread: 3, tag: 'families' },
    { id: 's3', name: 'عمر', sub: 'ولية الأمر: سارة', initials: 'ع', last: 'تمام، الأحد مناسب', time: 'أمس', mine: true, read: false, tag: 'families' },
    { id: 't', name: 'فريق وتزودوا', sub: 'الإدارة', photo: PHOTO.team, last: 'جدول الأسبوع الجاي جاهز', time: 'الإثنين', tag: 'team' },
  ],
  admin: [
    { id: 'a', name: 'أ. عفنان', sub: 'معلمة', photo: PHOTO.afnan, last: 'ممكن أنقل حصة الخميس لساعة بدري؟', time: '9:50 م', unread: 1, tag: 'teachers' },
    { id: 'm', name: 'أ. محمود', sub: 'معلم', photo: PHOTO.mahmoud, last: 'رفعت تقرير الشهر', time: '7:15 م', mine: true, read: true, tag: 'teachers' },
    { id: 'f1', name: 'سارة (ولية أمر)', sub: 'عمر، 9 سنين', initials: 'س', last: 'عاوزة أغيّر الباقة لـ 12 حصة', time: '6:02 م', unread: 2, tag: 'families' },
    { id: 'f2', name: 'يوسف أحمد', sub: 'طالب', initials: 'ي', last: 'شكرًا، وصلت', time: 'أمس', tag: 'families' },
    { id: 'v1', name: 'زائر جديد', sub: 'لسه ما حجزش', initials: 'ز', last: 'هل فيه معلمات للبنات؟', time: 'أمس', unread: 1, tag: 'support' },
  ],
};

const CHIPS: Record<Role, [string, string][]> = {
  student: [['all', 'الكل'], ['unread', 'غير مقروءة'], ['teachers', 'معلميني'], ['team', 'الإدارة']],
  teacher: [['all', 'الكل'], ['unread', 'غير مقروءة'], ['families', 'طلابي'], ['team', 'الإدارة']],
  admin: [['all', 'الكل'], ['unread', 'غير مقروءة'], ['teachers', 'المعلمين'], ['families', 'الطلاب والأهالي'], ['support', 'الدعم']],
};

const ROLES: [Role, string][] = [['student', 'طالب / ولي أمر'], ['teacher', 'معلم'], ['admin', 'السوبر أدمن']];

function Avatar({ t, size = 48 }: { t: Pick<Thread, 'photo' | 'initials' | 'name'>; size?: number }) {
  if (t.photo) return <img src={t.photo} alt="" width={size} height={size} className="rounded-full object-cover shrink-0 bg-sand-light border border-border-subtle" style={{ width: size, height: size }} />;
  return <span className="rounded-full shrink-0 grid place-items-center bg-sand text-sand-foreground font-semibold" style={{ width: size, height: size, fontSize: size * 0.38 }}>{t.initials}</span>;
}

/** Android-style notification card, laid out like the owner's Duolingo reference. */
function PushCard({ p }: { p: (typeof PUSHES)[number] }) {
  return (
    <div className="rounded-[26px] bg-[#F1EFEC] text-[#1C1B1A] px-4 pt-3.5 pb-3 shadow-sm" dir="rtl">
      <div className="flex items-start gap-3">
        <img src="/android-chrome-192x192.png" alt="" className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] text-[#5B5752] flex items-center gap-1.5">وتزودوا <span>·</span> الآن <BellRing className="w-3.5 h-3.5" aria-hidden="true" /></p>
          <p className="mt-1.5 text-[16.5px] font-bold leading-snug">{p.emoji} {p.title}</p>
          <p className="mt-0.5 text-[14px] text-[#4A4642] leading-snug">{p.body}</p>
          <p className="mt-3 text-[14px] font-semibold text-teal">{p.action}</p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-black/5 grid place-items-center self-end"><ChevronUp className="w-4 h-4" aria-hidden="true" /></span>
          {p.side.photo
            ? <img src={p.side.photo} alt="" className="w-14 h-14 rounded-full object-cover" />
            : <div className="w-16 h-16 -mt-1 grid place-items-center"><ZaadiRig pose={p.side.pose!} size={64} glow={false} /></div>}
        </div>
      </div>
    </div>
  );
}

function ChatList({ role, onOpen }: { role: Role; onOpen: (t: Thread) => void }) {
  const [chip, setChip] = useState('all');
  useEffect(() => setChip('all'), [role]);
  const all = THREADS[role];
  const shown = all.filter((t) => chip === 'all' || (chip === 'unread' ? t.unread : t.tag === chip));
  const count = (k: string) => all.filter((t) => (k === 'unread' ? t.unread : t.tag === k) && t.unread).length;
  return (
    <div className="bg-surface min-h-[560px]">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="font-display text-[26px] text-foreground">الرسائل</h2>
        <img src="/logo-256.png" alt="" className="w-9 h-9 rounded-full" />
      </div>
      <div className="px-4">
        <div className="h-11 rounded-full bg-surface-subtle border border-border-subtle flex items-center gap-2 px-4 text-muted-foreground text-sm">
          <Search className="w-4 h-4" aria-hidden="true" /> ابحث
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        {CHIPS[role].map(([k, label]) => (
          <button key={k} onClick={() => setChip(k)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-[13px] font-medium border transition-colors ${chip === k ? 'bg-teal text-white border-teal' : 'bg-surface text-muted-foreground border-border'}`}>
            {label}{k !== 'all' && count(k) > 0 && <span className={`ms-1.5 ${chip === k ? 'text-white/85' : 'text-teal'}`}>{count(k)}</span>}
          </button>
        ))}
      </div>
      <ul>
        {shown.map((t) => (
          <li key={t.id}>
            <button onClick={() => onOpen(t)} className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-surface-subtle active:bg-surface-warm transition-colors">
              <Avatar t={t} size={52} />
              <span className="flex-1 min-w-0 border-b border-border-subtle pb-2.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-[15.5px] text-foreground truncate">{t.name} <span className="text-[12px] font-normal text-muted-foreground">· {t.sub}</span></span>
                  <span className={`text-[12px] shrink-0 ${t.unread ? 'text-teal font-semibold' : 'text-muted-foreground'}`}>{t.time}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="text-[14px] text-muted-foreground truncate flex items-center gap-1">
                    {t.mine && (t.read ? <CheckCheck className="w-4 h-4 text-teal shrink-0" aria-label="اتقرت" /> : <Check className="w-4 h-4 shrink-0" aria-label="اتبعتت" />)}
                    {t.last}
                  </span>
                  {t.unread ? <span className="min-w-5 h-5 px-1.5 rounded-full bg-teal text-white text-[11.5px] font-bold grid place-items-center">{t.unread}</span> : null}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const KHATAM_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cpath d='M28 10l5 5h7v7l5 5-5 5v7h-7l-5 5-5-5h-7v-7l-5-5 5-5v-7h7z' fill='none' stroke='%23C9B79C' stroke-opacity='.35' stroke-width='1'/%3E%3C/svg%3E")`;

function ChatView({ t, role, onBack }: { t: Thread; role: Role; onBack: () => void }) {
  const msgs = role === 'teacher'
    ? [{ me: false, text: 'السلام عليكم يا أستاذ', at: '9:10 م' }, { me: false, text: t.last, at: '9:12 م' }, { me: true, text: 'وعليكم السلام، أكيد. نخليها السبت نفس الميعاد؟', at: '9:15 م', read: true }]
    : [{ me: true, text: 'السلام عليكم، خلّصت الواجب', at: '9:30 م', read: true }, { me: false, text: 'وعليكم السلام، ما شاء الله عليك 👏', at: '9:38 م' }, { me: false, text: t.last, at: '9:41 م' }];
  return (
    <div className="min-h-[560px] flex flex-col" style={{ backgroundColor: '#F4EEE4', backgroundImage: KHATAM_BG }}>
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#2A1710] text-white">
        <button onClick={onBack} aria-label="رجوع" className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10"><ArrowRight className="w-5 h-5" /></button>
        <Avatar t={t} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15.5px] truncate">{t.name}</p>
          <p className="text-[12px] text-white/70 truncate">{t.sub} · {t.tag === 'team' ? 'بنرد خلال ساعات العمل' : 'آخر ظهور 9:41 م'}</p>
        </div>
      </div>
      <div className="flex-1 px-3 py-4 space-y-1.5">
        <p className="mx-auto w-fit text-[12px] px-3 py-1 rounded-lg bg-surface/90 text-muted-foreground shadow-sm">اليوم</p>
        {msgs.map((m, i) => (
          // WhatsApp in Arabic: your own messages sit on the left, the other person's on the right.
          <div key={i} className={`flex ${m.me ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] rounded-2xl px-3 pt-2 pb-1 shadow-sm text-[14.5px] leading-relaxed ${m.me ? 'bg-[#E3F1F3] rounded-se-md' : 'bg-surface rounded-ss-md'}`}>
              <p className="text-foreground">{m.text}</p>
              <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">{m.at}{m.me && <CheckCheck className={`w-3.5 h-3.5 ${m.read ? 'text-teal' : ''}`} aria-hidden="true" />}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-2">
        <div className="flex-1 h-12 rounded-full bg-surface flex items-center gap-3 px-4 text-muted-foreground shadow-sm">
          <Smile className="w-5 h-5" aria-hidden="true" /><span className="flex-1 text-sm">اكتب رسالة</span><Paperclip className="w-5 h-5" aria-hidden="true" />
        </div>
        <button aria-label="إرسال" className="w-12 h-12 rounded-full bg-crimson text-white grid place-items-center shadow-sm"><Send className="w-5 h-5 -scale-x-100" /></button>
      </div>
    </div>
  );
}

/** ?assets: the phone-notification pictures, captured once into public/push (Zaadi poses and the status-bar badge). */
const PUSH_POSES: ZaadiPose[] = ['point', 'sad', 'think', 'love', 'wave', 'proud', 'wow', 'thanks', 'dua', 'excited', 'idle'];
function PushAssets() {
  return (
    <div className="flex flex-wrap gap-2 p-2" style={{ background: 'transparent' }}>
      {PUSH_POSES.map((p) => (
        <div key={p} data-pose={p} className="w-[192px] h-[192px] grid place-items-center"><ZaadiRig pose={p} size={150} glow={false} /></div>
      ))}
      <div data-pose="badge" className="w-[96px] h-[96px] grid place-items-center">
        <svg viewBox="21 20 80 80" width="84" height="84"><path d="M61 20 L72.8 31.6 L89.3 31.7 L89.4 48.2 L101 60 L89.4 71.8 L89.3 88.3 L72.8 88.4 L61 100 L49.2 88.4 L32.7 88.3 L32.6 71.8 L21 60 L32.6 48.2 L32.7 31.7 L49.2 31.6 Z" fill="#fff" /></svg>
      </div>
    </div>
  );
}

export default function MessagesPrototype() {
  const assets = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('assets');
  const [role, setRole] = useState<Role>('student');
  const [open, setOpen] = useState<Thread | null>(null);
  useEffect(() => { hideBootSplash(); }, []);
  useEffect(() => setOpen(null), [role]);
  if (assets) return <PushAssets />;

  return (
    <div className="min-h-[100svh] bg-background text-foreground" dir="rtl" lang="ar">
      <main className="mx-auto max-w-[440px] px-4 pb-16 pt-5 space-y-6">
        <header className="space-y-1">
          <p className="font-display text-[28px] leading-tight">نموذج الإشعارات والرسائل</p>
          <p className="text-sm text-muted-foreground">اختار نوع الحساب وشوف هيوصله إيه وشكل الرسائل عنده.</p>
        </header>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-surface-warm" role="tablist">
          {ROLES.map(([r, label]) => (
            <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
              className={`h-10 rounded-full text-[13.5px] font-semibold transition-colors ${role === r ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground'}`}>{label}</button>
          ))}
        </div>

        <section className="space-y-3">
          <h3 className="font-semibold text-[15px]">إشعارات الموبايل</h3>
          <div className="rounded-[30px] bg-[#1F1B19] p-3 space-y-2.5" data-testid="push-previews">
            {PUSHES.filter((p) => p.who === role).map((p, i) => <PushCard key={i} p={p} />)}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-[15px]">{open ? 'المحادثة' : 'صندوق الرسائل'}</h3>
          <div className="rounded-[28px] overflow-hidden border border-border shadow-sm" data-testid="inbox">
            {open ? <ChatView t={open} role={role} onBack={() => setOpen(null)} /> : <ChatList role={role} onOpen={setOpen} />}
          </div>
        </section>
      </main>
    </div>
  );
}
