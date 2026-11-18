import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Pause, Play, RotateCcw } from 'lucide-react';
import { TeachersEmblem } from '../emblems/DoorEmblems';
import { ZadRigSvg, type ZadPose } from '../../zad/ZadRig';

/**
 * The homepage intro film (docs/marketing/HOMEPAGE-INTRO-FILM.md, docs/design/LANDING-LESSONS-2026-11-18.md).
 * No people on camera. Kinetic typography timed to the owner's voice clone: one phrase on screen at a time, one word
 * lifted on a crimson bar, named moves (mask reveal, zoom through, whip pan, slice), Zad in every scene, film grain.
 * Nothing loads until play: the voice-over (~430 KB) is the only download. A caption line keeps it readable muted.
 */

type L = { en: string; ar: string };
type Lang = 'en' | 'ar';
type Beat = { at: number; text: string; hl?: boolean; slice?: boolean };

// Scene start times in seconds, measured from the silences in each take (marketing/intro-film/vo/*-take1.mp3).
const STARTS: Record<Lang, number[]> = { ar: [0, 2.3, 8.3, 13.5, 19.1, 23.0], en: [0, 2.4, 8.8, 14.0, 20.0, 24.0] };
const LINES: L[] = [
  { en: 'Every journey needs provision.', ar: 'لكلِّ رحلةٍ زاد.' },
  { en: 'At Watazawwado, your own teacher sits with you, just you, one lesson at a time.', ar: 'في وتزوّدوا، يجلسُ معك معلّمُك، أنتَ وحدك، حصّةً بعد حصّة.' },
  { en: 'Quran, Tajweed and memorisation, the Zad Path, Arabic and English.', ar: 'قرآنٌ وتجويدٌ وحفظ، ومنهجُ زاد، والعربيّةُ والإنجليزيّة.' },
  { en: 'A male or female teacher you choose, who knows where you are and never starts from zero.', ar: 'معلّمٌ أو معلّمة تختارُه أنت، يعرفُ أين وصلت، ولا يبدأُ من الصفر.' },
  { en: 'After every lesson, we tell you how it went, before you ask.', ar: 'وبعد كلِّ حصّة، نخبرُك كيف كانت، قبل أن تسأل.' },
  { en: 'The first lesson is on us. Come and meet us.', ar: 'الحصّةُ الأولى علينا. تعالَ نتعرّف.' },
];

// The words on screen, by seconds from the start of each scene, following the voice.
const BEATS: Record<Lang, Beat[][]> = {
  ar: [
    [{ at: 0, text: 'لكلِّ رحلة' }, { at: 0.75, text: 'زاد', hl: true }],
    [{ at: 0, text: 'في وتزوّدوا' }, { at: 1.1, text: 'معلّمُك', hl: true }, { at: 2.5, text: 'أنتَ وحدك', hl: true }, { at: 4.1, text: 'حصّةً بعد حصّة' }],
    [{ at: 0, text: 'قرآن' }, { at: 0.8, text: 'تجويد' }, { at: 1.5, text: 'حفظ' }, { at: 2.3, text: 'منهج زاد', hl: true }, { at: 3.4, text: 'العربيّة' }, { at: 4.2, text: 'الإنجليزيّة' }],
    [{ at: 0, text: 'معلّم أو معلّمة' }, { at: 1.6, text: 'تختاره أنت', hl: true }, { at: 2.9, text: 'يعرف أين وصلت' }, { at: 4.3, text: 'لا يبدأ من الصفر', slice: true }],
    [{ at: 0, text: 'بعد كلِّ حصّة' }, { at: 1.4, text: 'نخبرُك', hl: true }, { at: 2.5, text: 'قبل أن تسأل' }],
    [{ at: 0, text: 'الحصّة الأولى' }, { at: 0.9, text: 'علينا', hl: true }, { at: 1.7, text: 'تعالَ نتعرّف' }],
  ],
  en: [
    [{ at: 0, text: 'Every journey needs' }, { at: 1.0, text: 'provision', hl: true }],
    [{ at: 0, text: 'At Watazawwado' }, { at: 1.3, text: 'your own teacher', hl: true }, { at: 3.0, text: 'just you', hl: true }, { at: 4.3, text: 'one lesson at a time' }],
    [{ at: 0, text: 'Quran' }, { at: 0.7, text: 'Tajweed' }, { at: 1.4, text: 'Memorisation' }, { at: 2.5, text: 'the Zad Path', hl: true }, { at: 3.5, text: 'Arabic' }, { at: 4.3, text: 'English' }],
    [{ at: 0, text: 'A male or female teacher' }, { at: 1.6, text: 'you choose', hl: true }, { at: 2.8, text: 'knows where you are' }, { at: 4.4, text: 'never starts from zero', slice: true }],
    [{ at: 0, text: 'After every lesson' }, { at: 1.4, text: 'we tell you', hl: true }, { at: 2.6, text: 'before you ask' }],
    [{ at: 0, text: 'The first lesson' }, { at: 1.0, text: 'is on us', hl: true }, { at: 1.8, text: 'Come and meet us' }],
  ],
};
const ZAD: ZadPose[] = ['wave', 'point', 'excited', 'think', 'proud', 'cheer'];

const EASE = [0.22, 1, 0.36, 1] as const;
const GOLD = '#F6D58E';

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

/** A simple figure: a teacher (plain) or a female teacher (head covered). */
function Figure({ covered, className }: { covered?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {covered ? <path d="M13 21c0-8 5-13 11-13s11 5 11 13v5c-3 3-7 4-11 4s-8-1-11-4z" fill="currentColor" opacity=".9" /> : null}
      <circle cx="24" cy={covered ? 19 : 17} r={covered ? 6 : 7.5} fill={covered ? '#FAF7F2' : 'currentColor'} />
      <path d="M8 46c0-10 7-15 16-15s16 5 16 15z" fill="currentColor" />
    </svg>
  );
}

function Glow({ size = '60%', strength = 0.55, top = '50%' }: { size?: string; strength?: number; top?: string }) {
  return (
    <div
      className="absolute left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{ top, width: size, background: `radial-gradient(closest-side, rgba(246,213,142,${strength}), rgba(229,169,60,0.18) 55%, transparent)` }}
    />
  );
}

/** One phrase at a time: mask reveal from a gold line, a crimson bar under the lifted word, a slice for the turn. */
function Kinetic({ beat, reduce, zoomOut }: { beat: Beat; reduce: boolean; zoomOut?: boolean }) {
  return (
    <motion.div
      key={beat.text}
      className="relative inline-block overflow-hidden px-2 pb-1"
      exit={reduce ? { opacity: 0 } : zoomOut ? { scale: 7, opacity: 0, filter: 'blur(6px)' } : { y: '-40%', opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: zoomOut ? 0.45 : 0.22, ease: 'easeIn' }}
    >
      {beat.hl && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[8%] top-[18%] -z-0 rounded-lg bg-[#C51F24]"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.28, ease: EASE, delay: 0.08 }}
        />
      )}
      <motion.span
        className={`relative block font-editorial font-bold leading-[1.15] ${beat.hl ? 'text-[#FAF7F2]' : 'text-[#F6D58E]'}`}
        initial={reduce ? { opacity: 0 } : { y: '105%' }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        transition={{ duration: 0.38, ease: EASE }}
      >
        {beat.text}
      </motion.span>
      {beat.slice && !reduce && (
        // Slice: a bright diagonal cut sweeps across the phrase.
        <motion.span
          aria-hidden="true"
          className="absolute -inset-y-4 w-[14%] bg-[#FAF7F2] mix-blend-overlay"
          style={{ rotate: 18 }}
          initial={{ left: '-20%', opacity: 0.9 }}
          animate={{ left: '120%', opacity: 0.9 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeInOut' }}
        />
      )}
      <motion.span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-[#E5A93C]" initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }} />
    </motion.div>
  );
}

/** The picture under the words, one per scene; `t` is seconds since the scene began. */
function Picture({ i, t, isEn, reduce }: { i: number; t: number; isEn: boolean; reduce: boolean }) {
  const tr = (l: L) => (isEn ? l.en : l.ar);
  if (i === 0) return (
    <motion.div className="w-[130px] sm:w-[180px]" initial={reduce ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}><Bag /></motion.div>
  );
  if (i === 1) return (
    <div className="flex items-end gap-8 sm:gap-16">
      {[{ who: { en: 'Your teacher', ar: 'معلّمك' }, el: <TeachersEmblem className="w-14 h-14 sm:w-20 sm:h-20" /> }, { who: { en: 'You', ar: 'أنت' }, el: <Figure className="w-10 h-10 sm:w-16 sm:h-16 text-[#F6D58E]" /> }].map((p, k) => (
        <motion.div key={k} className="flex flex-col items-center gap-1.5" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 + k * 0.5, ease: EASE }}>
          <span className="grid place-items-center w-16 h-20 sm:w-28 sm:h-36 rounded-t-full rounded-b-2xl border border-[#F6D58E]/30 bg-[#FAF7F2]/[0.06]">{p.el}</span>
          <span className="text-xs sm:text-sm font-bold text-[#FAF7F2]/80">{tr(p.who)}</span>
        </motion.div>
      ))}
    </div>
  );
  if (i === 2) {
    const filled = Math.min(6, Math.floor(t / 0.75) + 1);
    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div className="w-[120px] sm:w-[160px]" animate={reduce ? undefined : { y: [0, 5, 0] }} transition={{ duration: 0.25, repeat: 5, repeatDelay: 0.55 }}><Bag /></motion.div>
        <div className="flex gap-1.5" aria-hidden="true">{Array.from({ length: 6 }, (_, k) => <span key={k} className={`w-2 h-2 rounded-full transition-colors duration-300 ${k < filled ? 'bg-[#F6D58E]' : 'bg-[#F6D58E]/20'}`} />)}</div>
      </div>
    );
  }
  if (i === 3) return (
    <div className="w-full max-w-[480px] space-y-6">
      <div className="flex justify-center gap-4 sm:gap-8">
        {[{ c: false, l: { en: 'Male teacher', ar: 'معلّم' } }, { c: true, l: { en: 'Female teacher', ar: 'معلّمة' } }].map((p, k) => (
          <div key={k} className={`relative flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 sm:px-6 bg-[#FAF7F2]/[0.06] transition-colors duration-500 ${k === 1 && t > 1.6 ? 'border-[#F6D58E]' : 'border-[#F6D58E]/25'}`}>
            <Figure covered={p.c} className="w-9 h-9 sm:w-12 sm:h-12 text-[#F6D58E]" />
            <span className="text-[11px] sm:text-xs font-bold text-[#FAF7F2]/85">{tr(p.l)}</span>
            {k === 1 && t > 1.6 && (
              <motion.span className="absolute -top-2.5 -end-2.5 grid place-items-center w-6 h-6 rounded-full bg-[#087D91] text-[#FAF7F2]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              </motion.span>
            )}
          </div>
        ))}
      </div>
      {/* Knows where you are: the bookmark moves on from where it stopped, not from the start. */}
      <div className="relative mx-auto w-[90%] h-6" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#F6D58E]/30" />
        {Array.from({ length: 6 }, (_, k) => <span key={k} className={`absolute top-1/2 w-2 h-2 -translate-y-1/2 -translate-x-1/2 rounded-full ${k <= 3 ? 'bg-[#F6D58E]' : 'bg-[#F6D58E]/30'}`} style={{ insetInlineStart: `${k * 20}%` }} />)}
        <motion.span className="absolute -top-2 w-3.5 h-[18px] -translate-x-1/2 bg-[#C51F24] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" initial={{ insetInlineStart: '60%' }} animate={{ insetInlineStart: t > 2.9 ? '80%' : '60%' }} transition={{ duration: 1, ease: EASE }} />
      </div>
    </div>
  );
  if (i === 4) return (
    <motion.div
      className="w-[130px] sm:w-[160px] aspect-[9/14] rounded-[1.4rem] border-[5px] border-[#3B2219] bg-[#FAF7F2] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
      initial={reduce ? false : { y: '35%', opacity: 0, rotate: -6 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="px-3 pt-3 space-y-2 text-start" dir={isEn ? 'ltr' : 'rtl'}>
        <p className="text-[9px] sm:text-[11px] font-bold text-[#1C1411]">{isEn ? 'After the lesson' : 'بعد الحصة'}</p>
        {[86, 64, 78, 50].map((w, k) => <motion.div key={k} className="h-1.5 rounded-full bg-[#1C1411]/15" initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: 0.5 + k * 0.3, duration: 0.4 }} />)}
        {t > 2.2 && (
          <motion.p className="flex items-center gap-1 pt-1 text-[9px] sm:text-[11px] font-bold text-[#087D91]" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
            <span className="grid place-items-center w-4 h-4 rounded-full bg-[#087D91] text-[#FAF7F2]"><Check className="w-2.5 h-2.5" aria-hidden="true" /></span>
            {isEn ? 'Sent to you' : 'وصلك'}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
  return (
    <motion.p lang="ar" dir="rtl" className="text-xl sm:text-3xl text-[#F6D58E]/90 leading-[1.8]" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>
      ﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾
    </motion.p>
  );
}

// Film grain: a tiny noise tile, drawn once.
export const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")";

export function IntroFilm({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const reduce = !!useReducedMotion();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [state, setState] = React.useState<'idle' | 'playing' | 'paused' | 'done'>('idle');
  const [now, setNow] = React.useState(0);
  const lang: Lang = isEn ? 'en' : 'ar';
  const starts = STARTS[lang];

  // A language switch mid-film starts over in the new language.
  React.useEffect(() => { audioRef.current?.pause(); setState('idle'); setNow(0); }, [isEn]);

  // While playing, follow the audio clock every frame so the words land on the voice.
  React.useEffect(() => {
    if (state !== 'playing') return;
    let raf = 0;
    const tick = () => { setNow(audioRef.current?.currentTime ?? 0); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    if (state === 'done' || state === 'idle') { a.currentTime = 0; setNow(0); }
    void a.play().then(() => setState('playing')).catch(() => setState('idle'));
  };

  let scene = 0;
  starts.forEach((st, k) => { if (now >= st) scene = k; });
  const local = now - starts[scene];
  const beats = BEATS[lang][scene];
  let beatIdx = 0;
  beats.forEach((b, k) => { if (local >= b.at) beatIdx = k; });
  const beat = beats[beatIdx];
  const running = state === 'playing' || state === 'paused';
  // The hook: the first word flies into the camera before the second scene (zoom through).
  const zoomOut = scene === 0;

  return (
    <figure className="relative mx-auto w-full max-w-5xl" aria-label={isEn ? 'Our story in 30 seconds' : 'قصتنا في ٣٠ ثانية'}>
      <div className="absolute -inset-4 sm:-inset-8 rounded-[3rem] opacity-60 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(229,169,60,0.28), rgba(197,31,36,0.12), transparent)' }} aria-hidden="true" />
      <div
        className="relative overflow-hidden aspect-[4/5] sm:aspect-video rounded-[1.75rem] sm:rounded-[2.25rem] ring-1 ring-[#F6D58E]/25 shadow-[0_40px_90px_-40px_rgba(28,20,17,0.75)]"
        style={{ background: 'radial-gradient(75% 65% at 50% 45%, #4A2A1E 0%, #2A1A14 55%, #140E0B 100%)' }}
      >
        <audio ref={audioRef} src={isEn ? '/media/intro-film/en.mp3' : '/media/intro-film/ar.mp3'} preload="none" onEnded={() => setState('done')} onPause={() => setState((s) => (s === 'playing' ? 'paused' : s))} />

        {running ? (
          <AnimatePresence mode="wait" initial={false}>
            {/* Whip pan between scenes: a fast slide with motion blur. */}
            <motion.div
              key={scene}
              className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] px-6 pb-[14%]"
              initial={reduce ? { opacity: 0 } : { x: isEn ? '35%' : '-35%', filter: 'blur(14px)', opacity: 0 }}
              animate={{ x: 0, filter: 'blur(0px)', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { x: isEn ? '-35%' : '35%', filter: 'blur(14px)', opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <Glow size="60%" strength={0.45} top="40%" />
              <div className="relative text-center text-[2rem] leading-tight sm:text-6xl lg:text-7xl min-h-[1.4em]">
                <AnimatePresence mode="wait" initial={false}>
                  <Kinetic key={beat.text} beat={beat} reduce={reduce} zoomOut={zoomOut && beatIdx === beats.length - 1} />
                </AnimatePresence>
              </div>
              <div className="relative w-full flex justify-center"><Picture i={scene} t={local} isEn={isEn} reduce={reduce} /></div>
            </motion.div>
          </AnimatePresence>
        ) : (
          // Poster: Zad waves next to the title and the play button. Painted on first load, nothing else to fetch.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 px-6 text-center">
            <Glow size="62%" strength={0.5} top="45%" />
            <div className="relative"><ZadRigSvg pose={state === 'done' ? 'cheer' : 'wave'} size={120} /></div>
            <p className="relative font-editorial font-bold text-3xl sm:text-5xl text-[#FAF7F2] leading-tight">
              {state === 'done'
                ? (isEn ? <>The first lesson is <span className="text-[#F6D58E]">on us</span></> : <>الحصّة الأولى <span className="text-[#F6D58E]">علينا</span></>)
                : (isEn ? <>Our story in <span className="text-[#F6D58E]">30 seconds</span></> : <>قصّتنا في <span className="text-[#F6D58E]">٣٠ ثانية</span></>)}
            </p>
            <div className="relative flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={play}
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#FAF7F2] ps-2 pe-5 py-2 min-h-11 text-[#1C1411] font-bold text-sm sm:text-base shadow-[0_12px_40px_-8px_rgba(229,169,60,0.6)] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60"
                aria-label={state === 'done' ? (isEn ? 'Watch again' : 'شاهد مرة أخرى') : (isEn ? 'Play our story, 30 seconds, with sound' : 'شغّل قصتنا، ٣٠ ثانية بالصوت')}
              >
                <span className="grid place-items-center w-9 h-9 rounded-full bg-[#C51F24] text-[#FAF7F2]">
                  {state === 'done' ? <RotateCcw className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
                </span>
                {state === 'done' ? (isEn ? 'Watch again' : 'شاهد مرة أخرى') : (isEn ? 'Play with sound' : 'شغّل بالصوت')}
              </button>
              {state === 'done' && (
                <button type="button" onClick={onTrial} className="rounded-full bg-[#C51F24] px-5 py-2.5 min-h-11 text-sm sm:text-base font-bold text-[#FAF7F2] shadow-lg hover:bg-[#A8191E] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
                  {isEn ? 'Book the free first lesson' : 'احجز الحصة الأولى مجانًا'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Zad rides along in a corner of every scene. */}
        {running && (
          <div className="absolute top-3 start-3 sm:top-5 sm:start-5 pointer-events-none" aria-hidden="true">
            <ZadRigSvg pose={ZAD[scene]} size={64} glow={false} />
          </div>
        )}

        {/* Caption line: the whole sentence, for watching muted. */}
        {running && (
          <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-10 sm:px-10 sm:pb-6 bg-gradient-to-t from-[#140E0B]/95 to-transparent pointer-events-none">
            <p className="mx-auto max-w-3xl text-center text-sm sm:text-lg leading-snug text-[#FAF7F2]/85">{isEn ? LINES[scene].en : LINES[scene].ar}</p>
          </figcaption>
        )}

        {/* Film grain and a soft vignette over everything. */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.09] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" />

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
