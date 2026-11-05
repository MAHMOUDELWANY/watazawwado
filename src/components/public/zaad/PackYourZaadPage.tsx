import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, animate } from 'motion/react';
import { Moon, Sun, ChevronLeft } from 'lucide-react';
import { SubjectMark } from '../../onboarding/SubjectMark';
import { useTheme } from '../../ThemeProvider';
import { hideBootSplash } from '../../../lib/bootSplash';
import { useT } from '../../../lib/language';
import { supabase } from '../../../lib/supabase';
import { ZaadiRig, type ZaadiPose } from '../../zaadi/ZaadiRig';

/**
 * "Pack your zaad": the waitlist (RULES.md §2 "Launch in waves", BRAND.md §5–8). One track, who it is for, an email
 * or Google, then an honest place in line, the "your voice" card and a share card. Zaadi reacts at each step.
 * Spec: docs/superpowers/specs/2026-11-05-pack-your-zaad-waitlist-design.md
 */

type Mood = ZaadiPose | 'party';
type Track = { id: string; emblem: string; color: string; spine: string; spineAr: string; title: string; titleAr: string; line: string; lineAr: string; cheer: string; cheerAr: string };

const TRACKS: Track[] = [
  { id: 'quran', emblem: 'quran-reading', color: '#087D91', spine: 'Quran', spineAr: 'القرآن', title: 'Quran', titleAr: 'القرآن الكريم', line: 'Reading, Tajweed and memorization', lineAr: 'القراءة والتجويد والحفظ', cheer: 'The Quran first. The best zaad there is.', cheerAr: 'القرآن الأول. وده أحسن زاد.' },
  { id: 'zad', emblem: 'zad-essentials', color: '#8B4935', spine: 'Zad Path', spineAr: 'مسار الزاد', title: 'The Zad Path', titleAr: 'مسار الزاد', line: 'Islamic studies and the Seerah', lineAr: 'الدراسات الإسلامية والسيرة', cheer: 'The Zad Path. Stories that stay with you.', cheerAr: 'مسار الزاد. حكايات بتفضل معاك.' },
  { id: 'arabic', emblem: 'modern-standard-arabic', color: '#C51F24', spine: 'Arabic', spineAr: 'العربية', title: 'Arabic', titleAr: 'اللغة العربية', line: 'Fusha, or Egyptian for the family', lineAr: 'الفصحى، أو المصري للعيلة', cheer: 'Arabic. The language of the Quran, and of home.', cheerAr: 'العربي. لغة القرآن، ولغة البيت.' },
  { id: 'english', emblem: 'english', color: '#B9782A', spine: 'English', spineAr: 'الإنجليزية', title: 'English', titleAr: 'الإنجليزية', line: 'For children and adults', lineAr: 'للأطفال والكبار', cheer: 'English. A good door to open.', cheerAr: 'الإنجليزي. باب حلو يتفتح.' },
];
const HEIGHTS = [188, 200, 180, 194];
const PAINS = [
  { key: 'teacher_stays', en: 'A teacher who stays', ar: 'مدرس بيفضل معايا' },
  { key: 'clear_plan', en: 'A clear plan', ar: 'خطة واضحة' },
  { key: 'see_progress', en: 'Seeing progress', ar: 'أشوف التقدم' },
  { key: 'child_enjoys', en: 'Lessons my child enjoys', ar: 'حصص ابني يحبها' },
  { key: 'times_fit', en: 'Times that fit us', ar: 'مواعيد مناسبة لينا' },
  { key: 'clear_prices', en: 'Clear prices', ar: 'أسعار واضحة' },
];

/* ---------- Zaadi: an abstract khatam star that shows feeling through motion only (no face) ---------- */
function Zaadi({ mood, size = 56 }: { mood: Mood; size?: number }) {
  // the premium rig; party is a cheer, the greeting is a wave
  const pose: ZaadiPose = mood === 'party' ? 'cheer' : mood;
  return <ZaadiRig pose={pose} size={size} />;
}

function Bubble({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p key={text} role="status"
        initial={{ opacity: 0, y: 6, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="relative max-w-[220px] rounded-2xl rounded-es-sm bg-surface border border-border px-3.5 py-2.5 text-[14px] leading-snug text-foreground shadow-[0_10px_24px_-14px_rgba(60,30,10,.45)]">
        {text}
      </motion.p>
    </AnimatePresence>
  );
}

/* ---------- the bag ---------- */
function Bag({ open, zipped, bump, width = 210 }: { open: boolean; zipped: boolean; bump: number; width?: number }) {
  return (
    <motion.svg key={bump} viewBox="0 0 210 190" width={width} aria-hidden="true"
      animate={bump ? { scaleX: [1, 1.05, 0.98, 1], scaleY: [1, 0.95, 1.02, 1] } : undefined} transition={{ duration: 0.45 }}
      style={{ filter: 'drop-shadow(0 24px 26px rgba(90,42,16,.28))', overflow: 'visible' }}>
      <defs>
        <linearGradient id="leather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3363C" /><stop offset="1" stopColor="#951419" /></linearGradient>
      </defs>
      <path d="M70 66c0-38 70-38 70 0" fill="none" stroke="#951419" strokeWidth="10" strokeLinecap="round" />
      <rect x="18" y="66" width="174" height="118" rx="26" fill="url(#leather)" />
      <rect x="28" y="76" width="154" height="98" rx="20" fill="none" stroke="#F6D58E" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="5 5" />
      {/* zipper across the mouth: teeth draw closed at the end */}
      <motion.path d="M34 70 H176" stroke="#F6D58E" strokeWidth="4" strokeDasharray="3 3" fill="none"
        initial={false} animate={{ pathLength: zipped ? 1 : 0, opacity: zipped ? 1 : 0 }} transition={{ duration: 0.9, ease: 'easeInOut' }} />
      <motion.g initial={false} animate={{ rotate: open ? -9 : 0, y: open ? -10 : 0 }} style={{ originX: '20px', originY: '70px' }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <path d="M18 92c0-14 12-26 26-26h122c14 0 26 12 26 26v14c0 4-3 7-7 8l-80 18-80-18c-4-1-7-4-7-8z" fill="url(#leather)" />
        <path d="M30 100c0-9 7-16 16-16h118c9 0 16 7 16 16v4l-75 17-75-17z" fill="none" stroke="#F6D58E" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="5 5" />
        <g transform="translate(105 122)">
          <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" />
          <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" transform="rotate(45)" />
          <circle r="5.5" fill="#951419" />
        </g>
      </motion.g>
    </motion.svg>
  );
}

/* ---------- celebration: gold khatams and sparkles burst from the bag ---------- */
function Burst({ fire }: { fire: number }) {
  const reduce = useReducedMotion();
  if (!fire || reduce) return null;
  const bits = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
    const d = 90 + (i % 5) * 26;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d - 40, c: ['#E5A93C', '#C51F24', '#087D91', '#F6D58E'][i % 4], s: 6 + (i % 4) * 3, r: (i % 2 ? 1 : -1) * 220 };
  });
  return (
    <div key={fire} className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span key={i} className="absolute block"
          style={{ width: b.s, height: b.s, background: b.c, borderRadius: i % 3 ? 2 : 999, rotate: 45 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 140], opacity: [1, 1, 0], scale: 1, rotate: b.r }}
          transition={{ duration: 1.5, ease: 'easeOut', times: [0, 0.45, 1] }} />
      ))}
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { if (ref.current) ref.current.textContent = String(to); return; }
    const c = animate(40, to, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = String(Math.round(v)); } });
    return () => c.stop();
  }, [to, reduce]);
  return <span ref={ref}>{to}</span>;
}

/* ---------- the share card (story 9:16) ---------- */
const CARD_TEXT = {
  en: { brand: 'Watazawwado', title: ['I packed', 'my zaad'], place: (n: number) => `Number ${n} in line for wave 1`, next: 'Near the front of the next wave', when: 'Opening in early December', cta: 'Pack yours at', tracks: { quran: 'Quran', zad: 'The Zad Path', arabic: 'Arabic', english: 'English' } as Record<string, string> },
  ar: { brand: 'وتزوّدوا', title: ['جهّزتُ', 'زادي'], place: (n: number) => `رقم ${n} في انتظار الدفعة الأولى`, next: 'من أوائل الدفعة الجاية', when: 'تبدأ أوائل ديسمبر', cta: 'جهّز زادك على', tracks: { quran: 'القرآن الكريم', zad: 'مسار الزاد', arabic: 'اللغة العربية', english: 'الإنجليزية' } as Record<string, string> },
};
const CARD_SKIN = {
  dark: { bg: 'radial-gradient(130% 70% at 50% 0%, #3B2219 0%, #1B1816 45%, #110F0E 75%)', ink: '#FAF7F2', soft: '#E8DCC8', line: '#F6D58E', pill: 'rgba(255,255,255,.08)', glow: 'rgba(229,169,60,.28)' },
  light: { bg: 'radial-gradient(130% 70% at 50% 0%, #FFFFFF 0%, #FAF7F2 45%, #EFE7DC 100%)', ink: '#12100E', soft: '#5A5046', line: '#B9782A', pill: 'rgba(139,73,53,.08)', glow: 'rgba(229,169,60,.22)' },
};

/* a mihrab arch, the frame the whole card sits in */
const ARCH = 'M8 470 V170 C8 80 70 26 135 8 C200 26 262 80 262 170 V470 Z';

function ShareCard({ track, skin, lang, place, inWave }: { track: Track; skin: 'dark' | 'light'; lang: 'en' | 'ar'; place: number; inWave: boolean }) {
  const s = CARD_SKIN[skin];
  const t = CARD_TEXT[lang];
  const ar = lang === 'ar';
  return (
    <div dir={ar ? 'rtl' : 'ltr'} lang={lang}
      className="relative mx-auto w-[270px] aspect-[9/16] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(40,20,10,.6)]"
      style={{ background: s.bg, color: s.ink }}>
      {/* khatam lattice, very quiet */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id={`lat-${skin}`} width="34" height="34" patternUnits="userSpaceOnUse">
            <g fill="none" stroke={s.line} strokeOpacity={skin === 'dark' ? 0.09 : 0.12} strokeWidth="0.8">
              <rect x="10" y="10" width="14" height="14" /><rect x="10" y="10" width="14" height="14" transform="rotate(45 17 17)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#lat-${skin})`} />
      </svg>
      {/* the arch */}
      <svg viewBox="0 0 270 480" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={ARCH} transform="translate(0 6) scale(1 .975)" fill={skin === 'dark' ? 'rgba(17,15,14,.55)' : 'rgba(255,255,255,.55)'} stroke={s.line} strokeOpacity=".55" strokeWidth="1.2" />
        <path d={ARCH} transform="translate(9 16) scale(.933 .94)" fill="none" stroke={s.line} strokeOpacity=".25" strokeWidth=".8" />
      </svg>
      {/* a soft light behind the bag */}
      <div className="absolute left-1/2 top-[46%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" style={{ background: s.glow }} />

      <div className="relative flex h-full flex-col items-center px-7 pb-8 pt-12 text-center">
        <p className={`text-[12px] ${ar ? 'font-bold' : 'tracking-wide'}`} style={{ color: s.soft }}>{t.brand}</p>
        <p className={`mt-3 leading-[1.02] ${ar ? 'text-[38px] font-bold' : 'font-editorial text-[36px] tracking-tight'}`}>{t.title[0]}<br />{t.title[1]}</p>

        <div className="relative mt-5">
          {/* the chosen book peeks out of the bag */}
          <div className="absolute left-[38px] top-[14px] h-[54px] w-[26px] -rotate-[10deg] rounded-[4px_4px_2px_2px]"
            style={{ background: `linear-gradient(90deg, ${track.color}E6, ${track.color} 30%, ${track.color}C0)` }}>
            <span className="absolute inset-x-0 top-1.5 h-[2px] bg-[#D8C6AE]/80" />
          </div>
          <div className="relative"><Bag open={false} zipped bump={0} width={138} /></div>
          <div className={`absolute -top-6 ${ar ? '-left-7' : '-right-7'}`}><Zaadi mood="wave" size={58} /></div>
        </div>

        <div className="mt-5 flex items-center gap-2.5 rounded-full py-1.5 pe-4 ps-1.5" style={{ background: s.pill }}>
          <SubjectMark subjectId={track.emblem} color={track.color} size={32} rounded="rounded-full" />
          <span className={`text-[14px] ${ar ? 'font-bold' : 'font-medium'}`}>{t.tracks[track.id]}</span>
        </div>
        <p className="mt-3 text-[13px]" style={{ color: s.soft }}>{inWave ? t.place(place) : t.next}</p>

        <div className="mt-auto w-full border-t pt-3.5" style={{ borderColor: `${s.line}55` }}>
          <p className="text-[12.5px] font-medium">{t.when}</p>
          <p className="mt-0.5 text-[12px]" style={{ color: s.soft }}>{t.cta} <span dir="ltr">watazawwado.academy</span></p>
        </div>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-border p-1">
      {options.map(([v, l]) => (
        <button key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`relative flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${value === v ? 'text-background' : 'text-muted-foreground'}`}>
          {value === v && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-full bg-foreground" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- page ---------- */
const PENDING_KEY = 'wz-zaad-pending';
const ENTRY_KEY = 'wz-zaad-entry';
type Entry = { place: number; waveSize: number; entryId: string; secret: string; track: string };

function readJSON<T>(key: string, store: 'local' | 'session'): T | null {
  try { const v = (store === 'local' ? localStorage : sessionStorage).getItem(key); return v ? JSON.parse(v) as T : null; } catch { return null; }
}
function writeJSON(key: string, value: unknown, store: 'local' | 'session') {
  try { (store === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* private mode: the flow still works */ }
}
function utmSource(): string | null {
  try { const p = new URLSearchParams(window.location.search); const s = p.get('utm_source'); return s ? [s, p.get('utm_campaign')].filter(Boolean).join(':').slice(0, 80) : null; } catch { return null; }
}

export default function PackYourZaadPage() {
  const reduce = useReducedMotion();
  const { theme, toggleTheme } = useTheme();
  const { isAr, t } = useT();
  const lang: 'en' | 'ar' = isAr ? 'ar' : 'en';
  const [step, setStep] = useState(1);
  const [track, setTrack] = useState<Track | null>(null);
  const [rising, setRising] = useState<string | null>(null);
  const [who, setWho] = useState<'me' | 'child' | null>(null);
  const [email, setEmail] = useState('');
  const [honey, setHoney] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [mood, setMood] = useState<Mood>('wave');
  const [say, setSay] = useState(t("Assalamu alaikum, I'm Zaadi. Pick one, and I'll pack it for you.", 'السلام عليكم، أنا زادي. اختار حاجة، وأنا هجهّزهالك.'));
  const [bump, setBump] = useState(0);
  const [fire, setFire] = useState(0);
  const [pains, setPains] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardSkin, setCardSkin] = useState<'light' | 'dark'>(theme === 'dark' ? 'dark' : 'light');
  const [cardLang, setCardLang] = useState<'en' | 'ar'>(lang);
  const bagRef = useRef<HTMLDivElement>(null);
  const [flyer, setFlyer] = useState<{ t: Track; x: number; y: number; dx: number; dy: number } | null>(null);

  const react = (m: Mood, text: string) => { setMood('idle'); requestAnimationFrame(() => setMood(m)); setSay(text); };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const trackText = (tr: Track) => ({ title: isAr ? tr.titleAr : tr.title, line: isAr ? tr.lineAr : tr.line, spine: isAr ? tr.spineAr : tr.spine, cheer: isAr ? tr.cheerAr : tr.cheer });

  const finish = (e: Entry, tr: Track) => {
    setEntry(e); setTrack(tr); writeJSON(ENTRY_KEY, e, 'local');
    setStep(4); setBump((n) => n + 1); setFire((n) => n + 1);
    react('party', e.place <= e.waveSize
      ? t('Your zaad is packed. JazakAllahu khayran for waiting with us!', 'زادك جاهز. جزاك الله خيرًا إنك مستني معانا!')
      : t('Your zaad is packed. Wave 1 is full, so you are first in line for the next one.', 'زادك جاهز. الدفعة الأولى اكتملت، فإنت من أوائل الدفعة اللي بعدها.'));
  };

  useEffect(() => {
    hideBootSplash();
    const timer = setTimeout(() => setMood((m) => (m === 'wave' ? 'idle' : m)), 3200);
    // back from Google: finish the join with the verified email
    const params = new URLSearchParams(window.location.search);
    const pending = readJSON<{ track: string; who: 'me' | 'child' }>(PENDING_KEY, 'session');
    const saved = readJSON<Entry>(ENTRY_KEY, 'local');
    const savedTrack = saved && TRACKS.find((x) => x.id === saved.track);
    if (params.get('google') === '1' && pending) {
      const tr = TRACKS.find((x) => x.id === pending.track);
      supabase.auth.getSession().then(async ({ data }) => {
        const token = data.session?.access_token;
        if (!token || !tr) return;
        const res = await fetch('/api/waitlist/google', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ track: pending.track, who: pending.who, lang, source: utmSource() }) });
        const body = await res.json().catch(() => ({}));
        if (res.ok) { setWho(pending.who); finish({ ...body, track: pending.track }, tr); }
        else { setTrack(tr); setWho(pending.who); setStep(3); setError(body.error || t('Something went wrong. Please try again.', 'حصلت مشكلة. جرّب تاني.')); }
      });
    } else if (saved && savedTrack && !params.has('invited')) {
      // already in line: show the place again instead of a second join
      setEntry(saved); setTrack(savedTrack); setStep(4);
    }
    return () => clearTimeout(timer);
  }, []);

  const pickTrack = (tr: Track, el: HTMLElement) => {
    setTrack(tr); setRising(tr.id);
    const r = el.getBoundingClientRect(); const b = bagRef.current!.getBoundingClientRect();
    setTimeout(() => {
      setFlyer({ t: tr, x: r.left + r.width / 2 - 26, y: r.top + 30, dx: b.left + b.width / 2 - (r.left + r.width / 2), dy: b.top + b.height * 0.55 - (r.top + 30) });
      setTimeout(() => { setFlyer(null); setBump((n) => n + 1); react('excited', trackText(tr).cheer); setTimeout(() => setStep(2), 900); }, reduce ? 0 : 650);
    }, reduce ? 0 : 280);
  };
  const pickWho = (w: 'me' | 'child') => {
    setWho(w); setBump((n) => n + 1);
    react(w === 'me' ? 'proud' : 'dua', w === 'me'
      ? t('For you. Learning as a grown-up takes courage.', 'ليك إنت. التعلّم وإنت كبير محتاج شجاعة.')
      : t('For your child. May Allah make it a blessing for them.', 'لابنك. ربنا يجعله بركة ليه.'));
    setTimeout(() => { setStep(3); react('point', t('Just your email. No password, no payment.', 'إيميلك بس. من غير باسورد ولا دفع.')); }, 1400);
  };
  const save = async () => {
    if (!track || !who || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), track: track.id, who, lang, source: utmSource(), website: honey }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || t('Something went wrong. Please try again.', 'حصلت مشكلة. جرّب تاني.')); react('sad', t("That didn't go through. Let's try once more.", 'ما وصلتش. يلا نجرّب تاني.')); return; }
      if (body.already) { setError(null); setSay(t('This email is already in line. We just emailed you your place.', 'الإيميل ده في الدور بالفعل. بعتنالك مكانك على الإيميل.')); react('wow', t('This email is already in line. We just emailed you your place.', 'الإيميل ده في الدور بالفعل. بعتنالك مكانك على الإيميل.')); return; }
      finish({ ...body, track: track.id }, track);
    } catch {
      setError(t('No connection. Please try again.', 'مفيش اتصال. جرّب تاني.'));
    } finally { setBusy(false); }
  };
  const google = async () => {
    if (!track || !who) return;
    writeJSON(PENDING_KEY, { track: track.id, who }, 'session');
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${isAr ? '/ar' : ''}/zaad?google=1` } });
    if (err) setError(t('Google sign-in is not available right now. Use your email instead.', 'الدخول بجوجل مش متاح دلوقتي. استخدم إيميلك.'));
  };
  const togglePain = (p: string) => setPains((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const sendVoice = async () => {
    if (!entry) return;
    const res = await fetch(`/api/waitlist/${entry.entryId}/voice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: entry.secret, pains, note }) }).catch(() => null);
    if (!res?.ok) { setError(t('Could not send it. Please try again.', 'ما اتبعتش. جرّب تاني.')); return; }
    setSent(true); setError(null);
    react('love', t('Got it. Your words go straight to our team. Thank you!', 'وصلت. كلامك رايح لفريقنا على طول. شكرًا ليك!'));
  };
  const share = async () => {
    const url = `https://watazawwado.academy${isAr ? '/ar' : ''}/zaad?utm_source=share&utm_medium=referral&utm_campaign=pack-your-zaad`;
    const text = t('I packed my zaad for Watazawwado. Pack yours:', 'جهّزت زادي مع وتزوّدوا. جهّز زادك:');
    try {
      if (navigator.share) { await navigator.share({ title: 'Watazawwado', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true);
    } catch { /* the person closed the share sheet */ }
  };
  useEffect(() => {
    if (step !== 4 || sent) return;
    const timer = setTimeout(() => react('point', t('Your voice is heard here. Tell us what you missed before.', 'صوتك مسموع هنا. قولّنا كان ناقصك إيه قبل كده.')), 3200);
    return () => clearTimeout(timer);
  }, [step]);
  const back = () => { setStep((s) => Math.max(1, s - 1)); setError(null); setSay(t('Take your time.', 'خد وقتك.')); setMood('idle'); };

  const place = entry?.place ?? 0;
  const size = entry?.waveSize ?? 20;
  const inWave = place > 0 && place <= size;
  const seats = Math.min(size, 40);

  return (
    <div className="min-h-[100svh] bg-background text-foreground transition-colors duration-500" dir={isAr ? 'rtl' : 'ltr'} lang={lang}>
      <main className="mx-auto flex min-h-[100svh] max-w-[440px] flex-col px-5 pb-12 pt-4">
        <div className="flex h-10 items-center justify-between">
          {step > 1 && step < 4 ? (
            <button onClick={back} className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t('Back', 'رجوع')}
            </button>
          ) : (
            <a href={isAr ? '/ar' : '/'} className="text-sm font-medium text-muted-foreground">{t('Watazawwado', 'وتزوّدوا')}</a>
          )}
          <button onClick={toggleTheme} aria-label={t('Switch light or dark', 'بدّل بين الفاتح والغامق')} className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* zipper progress: the first stage already counts (they opened it) */}
        <div className="mt-1 flex justify-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.i key={i} className="block h-1.5 w-[9px] rounded-[2px]"
              animate={{ backgroundColor: i < step * 3 ? '#E5A93C' : 'rgba(128,112,96,.22)', scaleY: i < step * 3 ? 1.25 : 1 }}
              transition={{ delay: (i % 3) * 0.06 }} />
          ))}
        </div>

        <div className="relative mt-3 flex flex-col items-center">
          <div className="flex w-full items-end justify-center gap-2">
            <Zaadi mood={mood} size={step === 4 ? 104 : 92} />
            <Bubble text={say} />
          </div>
          <div ref={bagRef} className="relative mt-1">
            <Bag open={step < 4} zipped={step === 4} bump={bump} width={step === 1 ? 190 : 150} />
            <Burst fire={fire} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h1 className={`mt-5 text-center leading-[1.05] ${isAr ? 'text-[38px] font-bold' : 'font-editorial text-[42px] font-medium tracking-tight'}`}>{t('Pack your zaad', 'جهّز زادك')}</h1>
              <p className="mx-auto mt-2.5 max-w-[32ch] text-center text-[16px] leading-relaxed text-muted-foreground">
                {t(`Our first wave opens in early December, with ${size} places. Choose what you'll carry first.`, `دفعتنا الأولى بتفتح أوائل ديسمبر، وفيها ${size} مكانًا. اختار أول حاجة هتاخدها معاك.`)}
              </p>
              <div role="radiogroup" aria-label={t('Track', 'المسار')} className="mt-6 flex h-[214px] items-end justify-center gap-2.5">
                {TRACKS.map((tr, i) => {
                  const tx = trackText(tr);
                  return (
                    <motion.button key={tr.id} type="button" role="radio" aria-checked={track?.id === tr.id} aria-label={`${tx.title}: ${tx.line}`}
                      onClick={(e) => pickTrack(tr, e.currentTarget)}
                      animate={{ y: rising === tr.id ? -26 : 0, opacity: rising && rising !== tr.id ? 0.55 : 1 }}
                      whileHover={reduce ? undefined : { y: rising === tr.id ? -26 : -8 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                      className="relative w-[70px] shrink-0 rounded-[7px_7px_3px_3px] text-white"
                      style={{ height: HEIGHTS[i], background: `linear-gradient(90deg, ${tr.color}E6 0%, ${tr.color} 18%, ${tr.color} 80%, ${tr.color}C0 100%)`,
                        boxShadow: 'inset -3px 0 6px rgba(0,0,0,.18), inset 0 0 0 1px rgba(255,255,255,.1)' }}>
                      <span className="absolute inset-x-0 top-3 h-[3px] bg-[#D8C6AE]/80" />
                      <span className="absolute inset-x-0 bottom-3 h-[3px] bg-[#D8C6AE]/80" />
                      <span className="absolute inset-x-0 top-5 flex justify-center">
                        <SubjectMark subjectId={tr.emblem} size={56} rounded="rounded-full" className="bg-white/10" />
                      </span>
                      <span className="absolute left-1/2 top-[86px] -translate-x-1/2 whitespace-nowrap text-[14px] font-semibold" style={{ writingMode: 'vertical-rl' }}>{tx.spine}</span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="h-3 rounded-full bg-[linear-gradient(180deg,#D8C6AE,#8B4935)] shadow-[0_8px_14px_-6px_rgba(139,73,53,.55)]" />
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                {TRACKS.map((tr) => { const tx = trackText(tr); return <li key={tr.id}><b className="font-medium text-foreground">{tx.title}</b>: {tx.line}</li>; })}
              </ul>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2 className={`mt-6 leading-tight ${isAr ? 'text-[30px] font-bold' : 'font-editorial text-[32px] font-medium tracking-tight'}`}>{t('Who is this zaad for?', 'الزاد ده لمين؟')}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {([['me', t('For me', 'ليّا'), t('18 or older', '18 سنة أو أكتر')], ['child', t('For my child', 'لابني أو بنتي'), t('Ages 6 to 17', 'من 6 لـ 17 سنة')]] as const).map(([k, label, d]) => (
                  <motion.button key={k} whileTap={{ scale: 0.97 }} onClick={() => pickWho(k)}
                    className={`rounded-3xl border p-5 text-start transition-colors ${who === k ? 'border-[#E5A93C] bg-[#E5A93C]/10' : 'border-border bg-surface'}`}>
                    <svg viewBox="0 0 48 32" className="mb-6 h-8 w-12" aria-hidden="true">
                      {(k === 'me' ? [[16, 16, 22]] : [[14, 14, 20], [36, 20, 13]]).map(([x, y, s], i) => (
                        <g key={i} fill="#E5A93C" opacity={i ? 0.75 : 1}>
                          <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx="2.5" />
                          <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx="2.5" transform={`rotate(45 ${x} ${y})`} />
                        </g>
                      ))}
                    </svg>
                    <b className="block text-[17px] font-medium">{label}</b>
                    <small className="text-[13px] text-muted-foreground">{d}</small>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2 className={`mt-6 leading-tight ${isAr ? 'text-[30px] font-bold' : 'font-editorial text-[32px] font-medium tracking-tight'}`}>{t('Where should we write to you?', 'نكتبلك فين؟')}</h2>
              <button onClick={google} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-surface py-4 text-[15px] font-medium">
                <span className="text-[17px] font-bold text-[#4285F4]">G</span>{t('Continue with Google', 'كمّل بجوجل')}
              </button>
              <div className="my-4 flex items-center gap-3 text-[13px] text-muted-foreground"><span className="h-px flex-1 bg-border" />{t('or', 'أو')}<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={(e) => { e.preventDefault(); if (emailOk) save(); }}>
                <input type="email" inputMode="email" autoComplete="email" dir="ltr" placeholder={t('Your email', 'إيميلك')} aria-label={t('Your email', 'إيميلك')} value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-0 border-b-[1.5px] border-border bg-transparent px-1 py-4 text-[17px] outline-none focus:border-[#E5A93C]" />
                {/* honeypot: hidden from people, filled by bots */}
                <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={honey} onChange={(e) => setHoney(e.target.value)} name="website" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={!emailOk || busy}
                  className="mt-6 w-full rounded-full bg-primary py-4 text-[16px] font-bold text-white disabled:opacity-35">{busy ? t('Saving…', 'بنحفظ…') : t('Save my spot', 'احجز مكاني')}</motion.button>
              </form>
              {error && <p role="alert" className="mt-3 text-center text-[14px] text-[#C51F24]">{error}</p>}
              <p className="mt-3.5 text-center text-[13px] text-muted-foreground">{t('No password and no payment. We write once your wave opens.', 'من غير باسورد ولا دفع. هنكتبلك لما دفعتك تفتح.')}</p>
            </motion.section>
          )}

          {step === 4 && track && entry && (
            <motion.section key="s4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="mt-4 text-[15px] text-muted-foreground">{t('Your place in line', 'مكانك في الدور')}</p>
              <p className="font-editorial text-[96px] leading-[.9] tracking-tight" dir="ltr"><CountUp to={place} /></p>
              {inWave ? (
                <>
                  <div className="mx-auto mt-5 grid max-w-[250px] grid-cols-10 gap-[7px]" aria-hidden="true">
                    {Array.from({ length: seats }, (_, i) => (
                      <motion.i key={i} className="block aspect-square rounded-full border-[1.5px]"
                        initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + i * 0.035 }}
                        style={i < place - 1 ? { background: 'color-mix(in srgb, var(--muted-foreground) 35%, transparent)', borderColor: 'transparent' }
                          : i === place - 1 ? { background: '#C51F24', borderColor: 'transparent', boxShadow: '0 0 0 4px rgba(197,31,36,.2)' } : { borderColor: 'rgba(128,112,96,.3)' }} />
                    ))}
                  </div>
                  <p className="mt-2.5 text-[13px] text-muted-foreground">
                    {t(`Wave 1 has ${size} places. ${place - 1} ${place - 1 === 1 ? 'is' : 'are'} ahead of you.`, `الدفعة الأولى فيها ${size} مكانًا، وقدامك ${place - 1}.`)}
                  </p>
                </>
              ) : (
                <p className="mx-auto mt-4 max-w-[32ch] text-[14px] text-muted-foreground">
                  {t(`Wave 1's ${size} places are taken, so you're near the front of the next wave. We'll write to you as soon as it has a date.`, `أماكن الدفعة الأولى الـ ${size} اكتملت، فإنت في أول الدفعة اللي بعدها. هنكتبلك أول ما يتحدد ميعادها.`)}
                </p>
              )}

              <div className="mt-7 rounded-3xl border border-border bg-surface p-5 text-start">
                <div className="flex items-center gap-3">
                  <Zaadi mood={sent ? 'love' : 'think'} size={50} />
                  <div>
                    <p className="text-[16px] font-medium leading-snug">{t('Your voice shapes what we build', 'صوتك بيشكّل اللي بنبنيه')}</p>
                    <p className="text-[13px] text-muted-foreground">{t('What was missing for you before? Tap any, or tell us.', 'إيه اللي كان ناقصك قبل كده؟ اختار أو اكتب.')}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PAINS.map((p) => {
                    const on = pains.includes(p.key);
                    return (
                      <motion.button key={p.key} whileTap={{ scale: 0.96 }} onClick={() => togglePain(p.key)} aria-pressed={on} disabled={sent}
                        className={`flex min-h-[48px] items-center rounded-2xl border px-3 text-start text-[14px] leading-tight transition-colors ${on ? 'border-[#E5A93C] bg-[#E5A93C]/15 font-medium' : 'border-border'}`}>
                        {isAr ? p.ar : p.en}
                      </motion.button>
                    );
                  })}
                </div>
                {sent ? (
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-[14px] text-muted-foreground">
                    {t('Sent to our team. We read every word.', 'وصلت لفريقنا. وبنقرا كل كلمة.')}
                  </motion.p>
                ) : (
                  <>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
                      placeholder={t('Or in your own words: what would make this the right place for you?', 'أو بكلامك إنت: إيه اللي يخلّي المكان ده مناسب ليك؟')} aria-label={t('Tell us in your own words', 'قولّنا بكلامك')}
                      className="mt-3 w-full resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-[15px] outline-none focus:border-[#E5A93C]" />
                    <motion.button whileTap={{ scale: 0.98 }} disabled={!pains.length && !note.trim()} onClick={sendVoice}
                      className="mt-3 w-full rounded-full border border-foreground py-3 text-[15px] font-medium disabled:opacity-35">{t('Send to the team', 'ابعت للفريق')}</motion.button>
                  </>
                )}
                {error && step === 4 && <p role="alert" className="mt-2 text-[13px] text-[#C51F24]">{error}</p>}
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setShareOpen(true); react('clap', t('Show them your bag!', 'ورّيهم شنطتك!')); }}
                className="mt-7 w-full rounded-full bg-primary py-4 text-[16px] font-bold text-white">{t('Share my bag', 'شارك شنطتي')}</motion.button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {flyer && (
          <motion.div className="pointer-events-none fixed z-50" style={{ left: flyer.x, top: flyer.y }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }} animate={{ x: flyer.dx, y: [0, flyer.dy - 120, flyer.dy], scale: 0.35, rotate: -25 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.62, ease: [0.5, 0, 0.3, 1] }}>
            <SubjectMark subjectId={flyer.t.emblem} color={flyer.t.color} size={52} rounded="rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareOpen && track && entry && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShareOpen(false)}>
            <motion.div role="dialog" aria-label={t('Share my bag', 'شارك شنطتي')} onClick={(e) => e.stopPropagation()} initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-[440px] rounded-t-[32px] bg-background px-5 pb-8 pt-5 sm:rounded-[32px]">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <AnimatePresence mode="wait">
                <motion.div key={cardSkin + cardLang} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
                  <ShareCard track={track} skin={cardSkin} lang={cardLang} place={place} inWave={inWave} />
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Segmented label={t('Card colour', 'لون الكارت')} value={cardSkin} onChange={setCardSkin} options={[['light', t('Light', 'فاتح')], ['dark', t('Dark', 'غامق')]]} />
                <Segmented label={t('Card language', 'لغة الكارت')} value={cardLang} onChange={setCardLang} options={[['en', 'English'], ['ar', 'عربي']]} />
              </div>
              <button onClick={share} className="mt-4 w-full rounded-full bg-primary py-3.5 text-[15px] font-bold text-white">
                {copied ? t('Link copied', 'اتنسخ اللينك') : t('Share the link', 'شارك اللينك')}
              </button>
              <p className="mt-2.5 text-center text-[12px] text-muted-foreground">{t('Tip: take a screenshot of the card for your story.', 'نصيحة: خد سكرين شوت للكارت وحطه في الستوري.')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
