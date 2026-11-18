import React from 'react';
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { Check, Pause, Play, RotateCcw } from 'lucide-react';
import { MushafEmblem, PathEmblem, TeachersEmblem } from '../emblems/DoorEmblems';

/**
 * The homepage intro film (docs/marketing/HOMEPAGE-INTRO-FILM.md). No people on camera (owner, 2026-11-17): six
 * motion scenes drawn in the page, timed to the owner's voice clone (Fusha for Arabic, English clone for English).
 * Nothing heavy loads until the visitor taps play: the audio file (~430 KB) is the only download.
 * Captions are burned in, so the film reads with the sound off too.
 */

type L = { en: string; ar: string };

// Scene start times in seconds, measured from the silences in each take (marketing/intro-film/vo/*-take1.mp3).
const STARTS = { ar: [0, 2.3, 8.3, 13.5, 19.1, 23.0], en: [0, 2.4, 8.8, 14.0, 20.0, 24.0] };
const LINES: L[] = [
  { en: 'Every journey needs provision.', ar: 'لكلِّ رحلةٍ زاد.' },
  { en: 'At Watazawwado, your own teacher sits with you, just you, one lesson at a time.', ar: 'في وتزوّدوا، يجلسُ معك معلّمُك، أنتَ وحدك، حصّةً بعد حصّة.' },
  { en: 'Quran, Tajweed and memorisation, the Zad Path, Arabic and English.', ar: 'قرآنٌ وتجويدٌ وحفظ، ومنهجُ زاد، والعربيّةُ والإنجليزيّة.' },
  { en: 'A male or female teacher you choose, who knows where you are and never starts from zero.', ar: 'معلّمٌ أو معلّمة تختارُه أنت، يعرفُ أين وصلت، ولا يبدأُ من الصفر.' },
  { en: 'After every lesson, we tell you how it went, before you ask.', ar: 'وبعد كلِّ حصّة، نخبرُك كيف كانت، قبل أن تسأل.' },
  { en: 'The first lesson is on us. Come and meet us.', ar: 'الحصّةُ الأولى علينا. تعالَ نتعرّف.' },
];

/** Zad's travel bag: crimson leather, gold stitching, the khatam clasp. */
export function Bag() {
  return (
    <svg viewBox="0 0 210 190" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="hero-bag-leather" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3363C" /><stop offset="1" stopColor="#951419" /></linearGradient>
      </defs>
      <path d="M70 66c0-38 70-38 70 0" fill="none" stroke="#951419" strokeWidth="10" strokeLinecap="round" />
      <rect x="18" y="66" width="174" height="118" rx="26" fill="url(#hero-bag-leather)" />
      <rect x="28" y="76" width="154" height="98" rx="20" fill="none" stroke="#F6D58E" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" />
      <path d="M34 70 H176" stroke="#F6D58E" strokeWidth="4" strokeDasharray="3 3" />
      <path d="M18 92c0-14 12-26 26-26h122c14 0 26 12 26 26v14c0 4-3 7-7 8l-80 18-80-18c-4-1-7-4-7-8z" fill="url(#hero-bag-leather)" />
      <path d="M30 100c0-9 7-16 16-16h118c9 0 16 7 16 16v4l-75 17-75-17z" fill="none" stroke="#F6D58E" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="5 5" />
      <g transform="translate(105 122)">
        <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" />
        <rect x="-13" y="-13" width="26" height="26" rx="4" fill="#E5A93C" transform="rotate(45)" />
        <circle r="5.5" fill="#951419" />
      </g>
    </svg>
  );
}

const POSTER = [
  { x: 22, y: 32, l: { en: 'Quran', ar: 'القرآن' }, g: <MushafEmblem className="w-11 h-11 lg:w-14 lg:h-14" /> },
  { x: 78, y: 32, l: { en: 'Zad Path', ar: 'منهج زاد' }, g: <PathEmblem className="w-11 h-11 lg:w-14 lg:h-14" /> },
  { x: 16, y: 66, l: { en: 'Arabic', ar: 'العربية' }, g: <span lang="ar" className="font-editorial font-bold text-4xl text-[#F6D58E]">ض</span> },
  { x: 84, y: 66, l: { en: 'English', ar: 'الإنجليزية' }, g: <span lang="en" className="font-editorial font-bold text-3xl text-[#F6D58E]">Aa</span> },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const GOLD = '#F6D58E';

/** A simple figure: a teacher (plain) or a female teacher (head covered). */
function Figure({ covered, className }: { covered?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {covered
        ? <path d="M13 21c0-8 5-13 11-13s11 5 11 13v5c-3 3-7 4-11 4s-8-1-11-4z" fill="currentColor" opacity=".9" />
        : null}
      <circle cx="24" cy={covered ? 19 : 17} r={covered ? 6 : 7.5} fill={covered ? '#FAF7F2' : 'currentColor'} />
      <path d="M8 46c0-10 7-15 16-15s16 5 16 15z" fill="currentColor" />
    </svg>
  );
}

function Glow({ size = '60%', strength = 0.55 }: { size?: string; strength?: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{ width: size, background: `radial-gradient(closest-side, rgba(246,213,142,${strength}), rgba(229,169,60,0.18) 55%, transparent)` }}
    />
  );
}

/** Each scene fills the stage; `reduce` drops the movement and keeps the fades. */
function Scene({ i, isEn, reduce }: { i: number; isEn: boolean; reduce: boolean }) {
  const m = (v: TargetAndTransition): TargetAndTransition | false => (reduce ? false : v);
  const t = (l: L) => (isEn ? l.en : l.ar);

  if (i === 0) return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}><Glow size="55%" /></motion.div>
      <motion.div className="relative w-[30%] max-w-[220px]" initial={m({ scale: 0.6, y: 30, opacity: 0 })} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: EASE }}>
        <Bag />
      </motion.div>
    </div>
  );

  if (i === 1) return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative w-[78%] max-w-[560px] flex items-end justify-between">
        {[{ who: { en: 'Your teacher', ar: 'معلّمك' }, el: <TeachersEmblem className="w-16 h-16 sm:w-24 sm:h-24" /> }, { who: { en: 'You', ar: 'أنت' }, el: <Figure className="w-12 h-12 sm:w-20 sm:h-20 text-[#F6D58E]" /> }].map((p, k) => (
          <motion.div key={k} className="flex flex-col items-center gap-2" initial={m({ opacity: 0, y: 24 })} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 + k * 0.35, ease: EASE }}>
            <span className="grid place-items-center w-20 h-24 sm:w-32 sm:h-40 rounded-t-full rounded-b-2xl border border-[#F6D58E]/30 bg-[#FAF7F2]/[0.06]">{p.el}</span>
            <span className="text-xs sm:text-sm font-bold text-[#FAF7F2]/85">{t(p.who)}</span>
          </motion.div>
        ))}
        {/* The thread between the two: one teacher, one learner. */}
        <svg viewBox="0 0 100 10" className="absolute left-[22%] right-[22%] top-[38%] w-[56%] h-4 overflow-visible" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M0 5 C 30 -3, 70 13, 100 5" fill="none" stroke={GOLD} strokeWidth="1.2" strokeDasharray="3 2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.9, ease: 'easeInOut' }} />
        </svg>
      </div>
      {/* One lesson at a time: the dots fill one by one. */}
      <div className="absolute bottom-[24%] flex gap-2 sm:gap-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, k) => (
          <motion.span key={k} className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F6D58E]" initial={{ opacity: 0.18 }} animate={{ opacity: 1 }} transition={{ delay: 2 + k * 0.45, duration: 0.3 }} />
        ))}
      </div>
    </div>
  );

  if (i === 2) {
    const items = [
      { l: { en: 'Quran', ar: 'القرآن' }, g: <MushafEmblem className="w-8 h-8 sm:w-12 sm:h-12" /> },
      { l: { en: 'Zad Path', ar: 'منهج زاد' }, g: <PathEmblem className="w-8 h-8 sm:w-12 sm:h-12" /> },
      { l: { en: 'Arabic', ar: 'العربية' }, g: <span lang="ar" className="font-editorial font-bold text-3xl sm:text-5xl text-[#F6D58E]">ض</span> },
      { l: { en: 'English', ar: 'الإنجليزية' }, g: <span lang="en" className="font-editorial font-bold text-2xl sm:text-4xl text-[#F6D58E]">Aa</span> },
    ];
    return (
      <div className="absolute inset-0">
        <motion.div className="absolute inset-0" initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 4.5 }}><div className="absolute inset-x-0 top-[38%] bottom-0"><Glow size="50%" /></div></motion.div>
        <div className="absolute left-1/2 top-[60%] w-[24%] max-w-[180px] -translate-x-1/2"><Bag /></div>
        {items.map((it, k) => {
          const left = 18 + k * 21.3;
          const timing = { duration: 1.25, delay: 0.6 + k * 1.05, times: [0, 0.2, 0.55, 1], ease: 'easeInOut' as const };
          return (
            // The layer is the size of the stage, so its % moves are % of the stage .
            <motion.div
              key={k}
              className="absolute inset-0"
              initial={false}
              animate={reduce ? undefined : { x: ['0%', '0%', '0%', `${50 - left}%`], y: ['0%', '0%', '0%', '46%'] }}
              transition={timing}
            >
              <motion.div
                className="absolute top-[16%] flex flex-col items-center gap-1 -translate-x-1/2"
                style={{ left: `${left}%` }}
                // All four wait on the shelf from the start; each drops into the bag in turn.
                initial={{ opacity: 1, scale: 1 }}
                animate={reduce ? { opacity: 1 } : { opacity: [1, 1, 1, 0], scale: [1, 1, 1.1, 0.3] }}
                transition={timing}
              >
                <span className="grid place-items-center w-12 h-12 sm:w-20 sm:h-20 rounded-2xl border border-[#F6D58E]/30 bg-[#FAF7F2]/[0.08]">{it.g}</span>
                <span className="text-[10px] sm:text-sm font-bold text-[#FAF7F2]/90 whitespace-nowrap">{t(it.l)}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (i === 3) return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="w-[80%] max-w-[600px] space-y-[8%]">
        <div className="flex justify-center gap-4 sm:gap-8">
          {[{ c: false, l: { en: 'Male teacher', ar: 'معلّم' } }, { c: true, l: { en: 'Female teacher', ar: 'معلّمة' } }].map((p, k) => (
            <motion.div
              key={k}
              className="relative flex flex-col items-center gap-2 rounded-2xl border bg-[#FAF7F2]/[0.06] px-5 py-4 sm:px-8 sm:py-5"
              initial={m({ opacity: 0, y: 20 })}
              animate={{ opacity: 1, y: 0, borderColor: k === 1 ? ['rgba(246,213,142,0.25)', 'rgba(246,213,142,0.25)', 'rgba(246,213,142,1)'] : 'rgba(246,213,142,0.25)' }}
              transition={{ duration: 1.4, delay: k * 0.2, times: [0, 0.6, 1] }}
            >
              <Figure covered={p.c} className="w-10 h-10 sm:w-16 sm:h-16 text-[#F6D58E]" />
              <span className="text-xs sm:text-sm font-bold text-[#FAF7F2]/90">{t(p.l)}</span>
              {k === 1 && (
                <motion.span className="absolute -top-2.5 -end-2.5 grid place-items-center w-7 h-7 rounded-full bg-[#087D91] text-[#FAF7F2]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.3, type: 'spring', stiffness: 380, damping: 18 }}>
                  <Check className="w-4 h-4" aria-hidden="true" />
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
        {/* Knows where you are: the marker picks up from the bookmark, not from the start. */}
        <div className="relative mx-auto w-[90%] h-8" aria-hidden="true">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[#F6D58E]/30" />
          {Array.from({ length: 6 }, (_, k) => (
            <span key={k} className={`absolute top-1/2 w-2.5 h-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full ${k <= 3 ? 'bg-[#F6D58E]' : 'bg-[#F6D58E]/30'}`} style={{ insetInlineStart: `${k * 20}%` }} />
          ))}
          <motion.span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-[#F6D58E]" style={{ insetInlineStart: 0 }} initial={{ width: '60%' }} animate={{ width: '80%' }} transition={{ delay: 2.6, duration: 1.4, ease: EASE }} />
          <motion.span className="absolute -top-3 w-4 h-5 -translate-x-1/2 bg-[#C51F24] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" initial={{ insetInlineStart: '60%' }} animate={{ insetInlineStart: '80%' }} transition={{ delay: 2.6, duration: 1.4, ease: EASE }} />
        </div>
      </div>
    </div>
  );

  if (i === 4) return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div
        className="relative w-[34%] max-w-[210px] aspect-[9/16] rounded-[1.6rem] border-[5px] border-[#3B2219] bg-[#FAF7F2] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
        initial={m({ y: '40%', opacity: 0 })} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="px-3 pt-4 space-y-2.5 text-start" dir={isEn ? 'ltr' : 'rtl'}>
          <p className="text-[9px] sm:text-xs font-bold text-[#1C1411]">{isEn ? 'After the lesson' : 'بعد الحصة'}</p>
          {[88, 70, 80, 52].map((w, k) => (
            <motion.div key={k} className="h-1.5 sm:h-2 rounded-full bg-[#1C1411]/15" initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: 0.7 + k * 0.4, duration: 0.5 }} />
          ))}
          <motion.div className="flex items-center gap-1.5 pt-1" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.5, type: 'spring', stiffness: 320, damping: 16 }}>
            <span className="grid place-items-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#087D91] text-[#FAF7F2]"><Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" /></span>
            <span className="text-[9px] sm:text-[11px] font-bold text-[#087D91]">{isEn ? 'Sent to you' : 'وصلك'}</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}><Glow size="70%" strength={0.7} /></motion.div>
      <div className="relative flex flex-col items-center gap-[6%] w-full">
        <motion.p lang="ar" dir="rtl" className="text-2xl sm:text-5xl text-[#F6D58E] leading-[1.7]" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }} initial={m({ opacity: 0, y: 12 })} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}>
          ﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾
        </motion.p>
        <motion.div className="w-[20%] max-w-[150px]" initial={m({ scale: 0.8, opacity: 0 })} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }}><Bag /></motion.div>
        <motion.p className="font-editorial font-bold text-lg sm:text-2xl text-[#FAF7F2]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}>
          {isEn ? 'Watazawwado Academy' : 'أكاديمية وتزوّدوا'}
        </motion.p>
      </div>
    </div>
  );
}

export function IntroFilm({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const reduce = !!useReducedMotion();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [state, setState] = React.useState<'idle' | 'playing' | 'paused' | 'done'>('idle');
  const [scene, setScene] = React.useState(0);
  const starts = isEn ? STARTS.en : STARTS.ar;

  // A language switch mid-film starts over in the new language.
  React.useEffect(() => { audioRef.current?.pause(); setState('idle'); setScene(0); }, [isEn]);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    if (state === 'done' || state === 'idle') { a.currentTime = 0; setScene(0); }
    void a.play().then(() => setState('playing')).catch(() => setState('idle'));
  };
  const onTime = () => {
    const now = audioRef.current?.currentTime ?? 0;
    let s = 0;
    starts.forEach((st, k) => { if (now >= st) s = k; });
    if (s !== scene) setScene(s);
  };

  const t = (l: L) => (isEn ? l.en : l.ar);
  const running = state === 'playing' || state === 'paused';

  return (
    <figure className="relative mx-auto w-full max-w-5xl" aria-label={isEn ? 'Our story in 30 seconds' : 'قصتنا في ٣٠ ثانية'}>
      <div className="absolute -inset-4 sm:-inset-8 rounded-[3rem] opacity-60 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(229,169,60,0.28), rgba(197,31,36,0.12), transparent)' }} aria-hidden="true" />
      <div
        className="khatam-window relative overflow-hidden aspect-[4/5] sm:aspect-video rounded-[1.75rem] sm:rounded-[2.25rem] ring-1 ring-[#F6D58E]/25 shadow-[0_40px_90px_-40px_rgba(28,20,17,0.75)]"
        style={{ background: 'radial-gradient(70% 60% at 50% 55%, #4A2A1E 0%, #2A1A14 55%, #1C1411 100%)' }}
      >
        <audio ref={audioRef} src={isEn ? '/media/intro-film/en.mp3' : '/media/intro-film/ar.mp3'} preload="none" onTimeUpdate={onTime} onEnded={() => setState('done')} onPause={() => setState((s) => (s === 'playing' ? 'paused' : s))} />

        {running ? (
          <AnimatePresence mode="wait">
            <motion.div key={scene} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <Scene i={scene} isEn={isEn} reduce={reduce} />
            </motion.div>
          </AnimatePresence>
        ) : (
          // Poster: Zad's bag with the four kinds of learning around it, and the play button.
          <div className="absolute inset-0">
            <div className="absolute inset-0"><Glow size="58%" strength={0.5} /></div>
            <div className="absolute left-1/2 top-[46%] w-[30%] sm:w-[20%] max-w-[190px] -translate-x-1/2 -translate-y-1/2"><Bag /></div>
            {/* The four kinds of learning wait around the bag. */}
            {POSTER.map((p) => (
              <span key={p.l.en} className="absolute hidden sm:flex flex-col items-center gap-1.5 -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <span className="grid place-items-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl border border-[#F6D58E]/25 bg-[#FAF7F2]/[0.07]">{p.g}</span>
                <span className="text-xs font-bold text-[#FAF7F2]/80">{t(p.l)}</span>
              </span>
            ))}
            <button
              type="button"
              onClick={play}
              className="absolute inset-0 grid place-items-center group focus-visible:outline-none"
              aria-label={state === 'done' ? (isEn ? 'Watch again' : 'شاهد مرة أخرى') : (isEn ? 'Play our story, 30 seconds, with sound' : 'شغّل قصتنا، ٣٠ ثانية بالصوت')}
            >
              <span className="relative mt-[52%] sm:mt-[24%] inline-flex items-center gap-2.5 rounded-full bg-[#FAF7F2] ps-2 pe-5 py-2 text-[#1C1411] font-bold text-sm sm:text-base shadow-[0_12px_40px_-8px_rgba(229,169,60,0.6)] transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-[0.97] group-focus-visible:ring-4 group-focus-visible:ring-[#E5A93C]/60">
                <span className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C51F24] text-[#FAF7F2]">
                  {state === 'done' ? <RotateCcw className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
                </span>
                {state === 'done' ? (isEn ? 'Watch again' : 'شاهد مرة أخرى') : (isEn ? 'Our story · 30 s' : 'قصتنا · ٣٠ ثانية')}
              </span>
            </button>
            {state === 'done' && (
              <div className="absolute inset-x-0 top-[10%] flex justify-center">
                <button type="button" onClick={onTrial} className="rounded-full bg-[#C51F24] px-5 py-2.5 min-h-11 text-sm sm:text-base font-bold text-[#FAF7F2] shadow-lg hover:bg-[#A8191E] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
                  {isEn ? 'Book the free first lesson' : 'احجز الحصة الأولى مجانًا'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Burned-in captions. */}
        {running && (
          <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-14 sm:px-10 sm:pb-8 bg-gradient-to-t from-[#1C1411]/90 to-transparent pointer-events-none">
            <p className="mx-auto max-w-3xl text-center font-editorial text-base sm:text-2xl leading-snug text-[#FAF7F2]">{t(LINES[scene])}</p>
          </figcaption>
        )}
        {running && (
          <button
            type="button"
            onClick={() => (state === 'playing' ? audioRef.current?.pause() : play())}
            className="absolute top-3 end-3 sm:top-5 sm:end-5 grid place-items-center w-11 h-11 rounded-full bg-[#FAF7F2]/15 text-[#FAF7F2] backdrop-blur hover:bg-[#FAF7F2]/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6D58E]"
            aria-label={state === 'playing' ? (isEn ? 'Pause' : 'إيقاف مؤقت') : (isEn ? 'Play' : 'تشغيل')}
          >
            {state === 'playing' ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
          </button>
        )}
      </div>
    </figure>
  );
}
