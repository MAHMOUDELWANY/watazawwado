import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, animate } from 'motion/react';
import { Moon, Sun, ChevronLeft } from 'lucide-react';
import { SubjectMark } from '../components/onboarding/SubjectMark';
import { useTheme } from '../components/ThemeProvider';
import { hideBootSplash } from '../lib/bootSplash';

/**
 * DEV-ONLY prototype (route /prototype/zaad, never in production builds) of the "Pack your zaad" waitlist,
 * for the owner to choose the design before the real waitlist is built. Nothing is saved or sent.
 * shortcut: fixed place in line (14) and fake Google button; the real flow reads the waitlist table.
 */

type Mood = 'idle' | 'cheer' | 'thanks' | 'party';
type Track = { id: string; emblem: string; color: string; spine: string; title: string; line: string; cheer: string };

const TRACKS: Track[] = [
  { id: 'quran', emblem: 'quran-reading', color: '#087D91', spine: 'Quran', title: 'Quran', line: 'Reading, Tajweed and memorization', cheer: 'The Quran first. The best zaad there is.' },
  { id: 'zad', emblem: 'zad-essentials', color: '#8B4935', spine: 'Zad Path', title: 'The Zad Path', line: 'Islamic studies and the Seerah', cheer: 'The Zad Path. Stories that stay with you.' },
  { id: 'arabic', emblem: 'modern-standard-arabic', color: '#C51F24', spine: 'Arabic', title: 'Arabic', line: 'Fusha, or Egyptian for the family', cheer: 'Arabic. The language of the Quran, and of home.' },
  { id: 'english', emblem: 'english', color: '#B9782A', spine: 'English', title: 'English', line: 'For children and adults', cheer: 'English. A good door to open.' },
];
const HEIGHTS = [188, 200, 180, 194];
const PAINS = ['A teacher who stays', 'A clear plan', 'Seeing progress', 'Lessons my child enjoys', 'Times that fit us', 'Clear prices'];
const PLACE = 14;

/* ---------- Zaadi: an abstract khatam star that shows feeling through motion only (no face) ---------- */
function Zaadi({ mood, size = 56 }: { mood: Mood; size?: number }) {
  const reduce = useReducedMotion();
  const moves: Record<Mood, any> = {
    idle: { y: [0, -6, 0], rotate: [0, 8, 0], scale: [1, 1.04, 1], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
    cheer: { y: [0, -26, 0, -10, 0], rotate: [0, 180, 360], scaleX: [1, 0.85, 1.15, 1], scaleY: [1, 1.2, 0.85, 1], transition: { duration: 0.9, ease: 'easeOut' } },
    thanks: { rotate: [0, -18, 0], y: [0, 6, 0], scaleY: [1, 0.86, 1], transition: { duration: 0.8, ease: 'easeInOut' } },
    party: { y: [0, -34, 0, -16, 0, -6, 0], rotate: [0, 360, 720], scale: [1, 1.25, 1, 1.1, 1], transition: { duration: 1.6, ease: 'easeOut' } },
  };
  return (
    <motion.svg key={mood} viewBox="10 10 80 80" width={size} height={size} aria-hidden="true"
      animate={reduce ? undefined : moves[mood]} style={{ filter: 'drop-shadow(0 0 16px rgba(229,169,60,.55))', overflow: 'visible' }}>
      <defs>
        <radialGradient id="zaadi-g" cx="50%" cy="38%" r="65%">
          <stop offset="0" stopColor="#FFF4D6" /><stop offset=".55" stopColor="#E5A93C" /><stop offset="1" stopColor="#B9782A" />
        </radialGradient>
      </defs>
      <rect x="22" y="22" width="56" height="56" rx="8" fill="url(#zaadi-g)" />
      <rect x="22" y="22" width="56" height="56" rx="8" fill="url(#zaadi-g)" transform="rotate(45 50 50)" />
      <circle cx="50" cy="51" r="17" fill="#FFF8E8" />
      {/* eyes: open and blinking at rest, happy arcs when cheering, closed and soft when thanking */}
      {mood === 'idle' && (
        <motion.g animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
          style={{ originX: '50px', originY: '50px' }} fill="#2B1A12">
          <ellipse cx="43.5" cy="50" rx="2.8" ry="4" /><ellipse cx="56.5" cy="50" rx="2.8" ry="4" />
          <circle cx="44.4" cy="48.6" r="1" fill="#fff" /><circle cx="57.4" cy="48.6" r="1" fill="#fff" />
        </motion.g>
      )}
      {(mood === 'cheer' || mood === 'party') && (
        <g fill="none" stroke="#2B1A12" strokeWidth="2.6" strokeLinecap="round"><path d="M40 51.5 q3.5 -5 7 0" /><path d="M53 51.5 q3.5 -5 7 0" /></g>
      )}
      {mood === 'thanks' && (
        <g fill="none" stroke="#2B1A12" strokeWidth="2.6" strokeLinecap="round"><path d="M40 49 q3.5 4 7 0" /><path d="M53 49 q3.5 4 7 0" /></g>
      )}
      <ellipse cx="38" cy="57" rx="3.2" ry="1.8" fill="#F4A3A3" opacity=".55" /><ellipse cx="62" cy="57" rx="3.2" ry="1.8" fill="#F4A3A3" opacity=".55" />
    </motion.svg>
  );
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
function ShareCard({ track }: { track: Track }) {
  return (
    <div className="relative mx-auto w-[270px] aspect-[9/16] overflow-hidden rounded-[28px] text-[#FAF7F2]"
      style={{ background: 'radial-gradient(120% 60% at 50% 0%, #3B2219 0%, #110F0E 62%)' }}>
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(1.4px 1.4px at 18% 12%,#F6D58E,transparent),radial-gradient(1px 1px at 72% 8%,#fff9,transparent),radial-gradient(1.2px 1.2px at 86% 26%,#F6D58E,transparent),radial-gradient(1px 1px at 30% 34%,#fff7,transparent),radial-gradient(1.3px 1.3px at 9% 48%,#F6D58E,transparent)' }} />
      <div className="relative flex h-full flex-col items-center px-6 pt-10 pb-7 text-center">
        <p className="text-[13px] text-[#E8DCC8]">Watazawwado</p>
        <p className="font-editorial mt-6 text-[34px] leading-[1.02] tracking-tight">I packed<br />my zaad</p>
        <div className="relative mt-6">
          <div className="absolute -right-6 -top-5"><Zaadi mood="idle" size={40} /></div>
          <Bag open={false} zipped bump={0} width={150} />
        </div>
        <div className="mt-5 flex items-center gap-2.5 rounded-full bg-white/10 py-1.5 pe-4 ps-1.5">
          <SubjectMark subjectId={track.emblem} color={track.color} size={34} rounded="rounded-full" />
          <span className="text-[14px] font-medium">{track.title}</span>
        </div>
        <p className="mt-auto text-[13px] leading-relaxed text-[#E8DCC8]">Waiting for wave 1, early December.<br />Pack yours at watazawwado.academy</p>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function PackYourZaadPrototype() {
  const reduce = useReducedMotion();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [track, setTrack] = useState<Track | null>(null);
  const [rising, setRising] = useState<string | null>(null);
  const [who, setWho] = useState<'me' | 'child' | null>(null);
  const [email, setEmail] = useState('');
  const [mood, setMood] = useState<Mood>('idle');
  const [say, setSay] = useState("Assalamu alaikum, I'm Zaadi. Pick one, and I'll pack it for you.");
  const [bump, setBump] = useState(0);
  const [fire, setFire] = useState(0);
  const [pains, setPains] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const bagRef = useRef<HTMLDivElement>(null);
  const [flyer, setFlyer] = useState<{ t: Track; x: number; y: number; dx: number; dy: number } | null>(null);

  useEffect(() => { hideBootSplash(); }, []);
  const react = (m: Mood, text: string) => { setMood('idle'); requestAnimationFrame(() => setMood(m)); setSay(text); };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const pickTrack = (t: Track, el: HTMLElement) => {
    setTrack(t); setRising(t.id);
    const r = el.getBoundingClientRect(); const b = bagRef.current!.getBoundingClientRect();
    setTimeout(() => {
      setFlyer({ t, x: r.left + r.width / 2 - 26, y: r.top + 30, dx: b.left + b.width / 2 - (r.left + r.width / 2), dy: b.top + b.height * 0.55 - (r.top + 30) });
      setTimeout(() => { setFlyer(null); setBump((n) => n + 1); react('cheer', t.cheer); setTimeout(() => setStep(2), 700); }, reduce ? 0 : 650);
    }, reduce ? 0 : 280);
  };
  const pickWho = (w: 'me' | 'child') => {
    setWho(w); setBump((n) => n + 1);
    react('thanks', w === 'me' ? 'For you. Learning as a grown-up takes courage.' : 'For your child. May Allah make it a blessing for them.');
    setTimeout(() => setStep(3), 650);
  };
  const save = () => {
    setStep(4); setBump((n) => n + 1); setFire((n) => n + 1);
    react('party', 'Your zaad is packed. JazakAllahu khayran for waiting with us!');
  };
  const togglePain = (p: string) => setPains((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  const sendVoice = () => { setSent(true); react('thanks', 'Got it. Your words go straight to our team. Thank you!'); };
  // after the celebration, Zaadi invites the learner's voice
  useEffect(() => {
    if (step !== 4) return;
    const t = setTimeout(() => react('idle', 'Your voice is heard here. Tell us what you missed before.'), 3200);
    return () => clearTimeout(t);
  }, [step]);
  const back = () => { setStep((s) => Math.max(1, s - 1)); setSay('Take your time.'); setMood('idle'); };

  return (
    <div className="min-h-[100svh] bg-background text-foreground transition-colors duration-500" dir="ltr" lang="en">
      <main className="mx-auto flex min-h-[100svh] max-w-[440px] flex-col px-5 pb-12 pt-4">
        <div className="flex h-10 items-center justify-between">
          <button onClick={back} className={`flex items-center gap-1 text-sm text-muted-foreground ${step > 1 && step < 4 ? '' : 'invisible'}`}>
            <ChevronLeft className="h-4 w-4" />Back
          </button>
          <button onClick={toggleTheme} aria-label="Switch light or dark" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground">
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

        {/* stage: Zaadi talks, the bag is the hero */}
        <div className="relative mt-3 flex flex-col items-center">
          <div className="flex w-full items-end justify-center gap-2">
            <Zaadi mood={mood} size={step === 4 ? 84 : 72} />
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
              <h1 className="font-editorial mt-5 text-center text-[42px] font-medium leading-[1.02] tracking-tight">Pack your zaad</h1>
              <p className="mx-auto mt-2.5 max-w-[32ch] text-center text-[16px] leading-relaxed text-muted-foreground">
                Our first wave opens in early December, with 20 places. Choose what you'll carry first.
              </p>
              <div role="radiogroup" aria-label="Track" className="mt-6 flex h-[214px] items-end justify-center gap-2.5">
                {TRACKS.map((t, i) => (
                  <motion.button key={t.id} type="button" role="radio" aria-checked={track?.id === t.id} aria-label={`${t.title}: ${t.line}`}
                    onClick={(e) => pickTrack(t, e.currentTarget)}
                    animate={{ y: rising === t.id ? -26 : 0, opacity: rising && rising !== t.id ? 0.55 : 1 }}
                    whileHover={reduce ? undefined : { y: rising === t.id ? -26 : -8 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                    className="relative w-[70px] shrink-0 rounded-[7px_7px_3px_3px] text-white"
                    style={{ height: HEIGHTS[i], background: `linear-gradient(90deg, ${t.color}E6 0%, ${t.color} 18%, ${t.color} 80%, ${t.color}C0 100%)`,
                      boxShadow: 'inset -3px 0 6px rgba(0,0,0,.18), inset 0 0 0 1px rgba(255,255,255,.1)' }}>
                    <span className="absolute inset-x-0 top-3 h-[3px] bg-[#D8C6AE]/80" />
                    <span className="absolute inset-x-0 bottom-3 h-[3px] bg-[#D8C6AE]/80" />
                    <span className="absolute inset-x-0 top-5 flex justify-center">
                      <SubjectMark subjectId={t.emblem} size={56} rounded="rounded-full" className="bg-white/10" />
                    </span>
                    <span className="absolute left-1/2 top-[86px] -translate-x-1/2 whitespace-nowrap text-[14px] font-semibold" style={{ writingMode: 'vertical-rl' }}>{t.spine}</span>
                  </motion.button>
                ))}
              </div>
              <div className="h-3 rounded-full bg-[linear-gradient(180deg,#D8C6AE,#8B4935)] shadow-[0_8px_14px_-6px_rgba(139,73,53,.55)]" />
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                {TRACKS.map((t) => <li key={t.id}><b className="font-medium text-foreground">{t.title}</b> · {t.line}</li>)}
              </ul>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2 className="font-editorial mt-6 text-[32px] font-medium leading-tight tracking-tight">Who is this zaad for?</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {([['me', 'For me', '18 or older'], ['child', 'For my child', 'Ages 6 to 17']] as const).map(([k, t, d]) => (
                  <motion.button key={k} whileTap={{ scale: 0.97 }} onClick={() => pickWho(k)}
                    className={`rounded-3xl border p-5 text-start transition-colors ${who === k ? 'border-[#E5A93C] bg-[#E5A93C]/10' : 'border-border bg-surface'}`}>
                    <svg viewBox="0 0 48 32" className="mb-6 h-8 w-12" aria-hidden="true">
                      {/* one khatam for me, a big and a small one for a guardian and child */}
                      {(k === 'me' ? [[16, 16, 22]] : [[14, 14, 20], [36, 20, 13]]).map(([x, y, s], i) => (
                        <g key={i} fill="#E5A93C" opacity={i ? 0.75 : 1}>
                          <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx="2.5" />
                          <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx="2.5" transform={`rotate(45 ${x} ${y})`} />
                        </g>
                      ))}
                    </svg>
                    <b className="block text-[17px] font-medium">{t}</b>
                    <small className="text-[13px] text-muted-foreground">{d}</small>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2 className="font-editorial mt-6 text-[32px] font-medium leading-tight tracking-tight">Where should we write to you?</h2>
              <button onClick={save} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-surface py-4 text-[15px] font-medium">
                <span className="text-[17px] font-bold text-[#4285F4]">G</span>Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-[13px] text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <input type="email" inputMode="email" autoComplete="email" placeholder="Your email" aria-label="Your email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border-0 border-b-[1.5px] border-border bg-transparent px-1 py-4 text-[17px] outline-none focus:border-[#E5A93C]" />
              <motion.button whileTap={{ scale: 0.98 }} disabled={!emailOk} onClick={save}
                className="mt-6 w-full rounded-full bg-primary py-4 text-[16px] font-bold text-white disabled:opacity-35">Save my spot</motion.button>
              <p className="mt-3.5 text-center text-[13px] text-muted-foreground">No password and no payment. We write once your wave opens.</p>
            </motion.section>
          )}

          {step === 4 && track && (
            <motion.section key="s4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="mt-4 text-[15px] text-muted-foreground">Your place in line</p>
              <p className="font-editorial text-[96px] leading-[.9] tracking-tight"><CountUp to={PLACE} /></p>
              <div className="mx-auto mt-5 grid max-w-[250px] grid-cols-10 gap-[7px]" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => (
                  <motion.i key={i} className="block aspect-square rounded-full border-[1.5px]"
                    initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 + i * 0.035 }}
                    style={i < PLACE - 1 ? { background: 'color-mix(in srgb, var(--muted-foreground) 35%, transparent)', borderColor: 'transparent' }
                      : i === PLACE - 1 ? { background: '#C51F24', borderColor: 'transparent', boxShadow: '0 0 0 4px rgba(197,31,36,.2)' } : { borderColor: 'rgba(128,112,96,.3)' }} />
                ))}
              </div>
              <p className="mt-2.5 text-[13px] text-muted-foreground">Wave 1 has 20 places. Thirteen are ahead of you.</p>

              <div className="mt-7 rounded-3xl border border-border bg-surface p-5 text-start">
                <div className="flex items-center gap-3">
                  <Zaadi mood={sent ? 'thanks' : 'idle'} size={38} />
                  <div>
                    <p className="text-[16px] font-medium leading-snug">Your voice shapes what we build</p>
                    <p className="text-[13px] text-muted-foreground">What was missing for you before? Tap any, or tell us.</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PAINS.map((p) => {
                    const on = pains.includes(p);
                    return (
                      <motion.button key={p} whileTap={{ scale: 0.96 }} onClick={() => togglePain(p)} aria-pressed={on} disabled={sent}
                        className={`flex min-h-[48px] items-center rounded-2xl border px-3 text-start text-[14px] leading-tight transition-colors ${on ? 'border-[#E5A93C] bg-[#E5A93C]/15 font-medium' : 'border-border'}`}>
                        {p}
                      </motion.button>
                    );
                  })}
                </div>
                {sent ? (
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-[14px] text-muted-foreground">
                    Sent to our team. We read every word.
                  </motion.p>
                ) : (
                  <>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
                      placeholder="Or in your own words: what would make this the right place for you?" aria-label="Tell us in your own words"
                      className="mt-3 w-full resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-[15px] outline-none focus:border-[#E5A93C]" />
                    <motion.button whileTap={{ scale: 0.98 }} disabled={!pains.length && !note.trim()} onClick={sendVoice}
                      className="mt-3 w-full rounded-full border border-foreground py-3 text-[15px] font-medium disabled:opacity-35">Send to the team</motion.button>
                  </>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setShareOpen(true); react('cheer', 'Show them your bag!'); }}
                className="mt-7 w-full rounded-full bg-primary py-4 text-[16px] font-bold text-white">Share my bag</motion.button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* the book flying into the bag */}
      <AnimatePresence>
        {flyer && (
          <motion.div className="pointer-events-none fixed z-50" style={{ left: flyer.x, top: flyer.y }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0 }} animate={{ x: flyer.dx, y: [0, flyer.dy - 120, flyer.dy], scale: 0.35, rotate: -25 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.62, ease: [0.5, 0, 0.3, 1] }}>
            <SubjectMark subjectId={flyer.t.emblem} color={flyer.t.color} size={52} rounded="rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* share sheet */}
      <AnimatePresence>
        {shareOpen && track && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShareOpen(false)}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-[440px] rounded-t-[32px] bg-background px-5 pb-8 pt-5 sm:rounded-[32px]">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <ShareCard track={track} />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button className="rounded-full border border-border py-3.5 text-[15px] font-medium">Save image</button>
                <button className="rounded-full bg-primary py-3.5 text-[15px] font-bold text-white">Share to story</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
