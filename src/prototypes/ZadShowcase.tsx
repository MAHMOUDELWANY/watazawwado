import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { ZadRig, type ZadPose } from '../components/zad/ZadRig';
import { useTheme } from '../components/ThemeProvider';
import { useT } from '../lib/language';
import { hideBootSplash } from '../lib/bootSplash';

/** DEV-ONLY showcase (route /prototype/zad): Zad's poses and a tiny lesson where Zad reacts. Nothing is saved. */

const POSES: [ZadPose, string][] = [['idle', 'Waiting'], ['wave', 'Salam'], ['cheer', 'Celebrates'], ['excited', 'Excited'], ['clap', 'Claps for you'], ['love', 'Loves it'], ['proud', 'Proud of you'], ['thanks', 'Thanks you'], ['dua', 'Makes dua'], ['point', 'Shows the way'], ['think', 'Thinking'], ['wow', 'Surprised'], ['shy', 'Shy'], ['sad', 'Feels it with you'], ['sleepy', 'Sleepy'], ['peek', 'Peeks']];
const Q = [
  { ask: 'Which letter is ب?', options: ['Baa', 'Taa', 'Thaa'], right: 0 },
  { ask: 'Which letter is ت?', options: ['Baa', 'Taa', 'Noon'], right: 1 },
  { ask: 'Which letter is ن?', options: ['Yaa', 'Baa', 'Noon'], right: 2 },
];
const PRAISE = ['Excellent!', 'Beautiful!', 'MashaAllah!'];

export default function ZadShowcase() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useT();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [moment, setMoment] = useState<'think' | 'right' | 'wrong'>('think');
  useEffect(() => { hideBootSplash(); }, []);

  const q = Q[i % Q.length];
  const check = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === q.right) { setCombo((c) => c + 1); setMoment('right'); } else { setCombo(0); setMoment('wrong'); }
  };
  const next = () => { setI((x) => x + 1); setPicked(null); setMoment('think'); };

  return (
    <div className="min-h-[100svh] bg-background text-foreground" dir="ltr" lang="en">
      <main className="mx-auto max-w-[440px] px-5 pb-16 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-editorial text-[26px] tracking-tight">Meet Zad</p>
          <button onClick={toggleTheme} aria-label={t('Switch light or dark', 'بدّل بين الفاتح والغامق')} className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {POSES.map(([p, label]) => (
            <div key={p} className="flex flex-col items-center rounded-3xl border border-border bg-surface pb-3 pt-5">
              <div className="flex h-[118px] items-end"><ZadRig pose={p} size={92} /></div>
              <p className="mt-2 text-[13px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* a tiny lesson: Zad peeks while you think, jumps when you're right, comes alongside when you miss */}
        <section className="relative mt-8 overflow-hidden rounded-[32px] border border-border bg-surface px-5 pb-5 pt-4" style={{ minHeight: 540 }}>
          <div className="flex h-6 items-center justify-between">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div className="h-full rounded-full bg-[#E5A93C]" animate={{ width: `${((i % Q.length) + (picked !== null ? 1 : 0)) / Q.length * 100}%` }} />
            </div>
            <AnimatePresence>
              {combo > 1 && (
                <motion.span key={combo} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                  className="ms-3 text-[12px] font-bold text-[#B9782A]">{combo} in a row</motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-5 text-[19px] font-medium">{q.ask}</p>
          <div className="mt-4 grid gap-2.5">
            {q.options.map((o, n) => {
              const state = picked === null ? '' : n === q.right ? 'right' : n === picked ? 'wrong' : '';
              return (
                <motion.button key={o + i} whileTap={{ scale: 0.98 }} onClick={() => check(n)}
                  animate={state === 'wrong' ? { x: [0, -6, 6, -4, 0] } : {}}
                  className={`rounded-2xl border-2 px-4 py-3.5 text-start text-[16px] font-medium transition-colors ${
                    state === 'right' ? 'border-[#3E9B5B] bg-[#3E9B5B]/10' : state === 'wrong' ? 'border-[#C51F24] bg-[#C51F24]/8' : 'border-border'}`}>{o}</motion.button>
              );
            })}
          </div>

          {/* thinking: Zad peeks from the bottom edge */}
          <AnimatePresence>
            {moment === 'think' && (
              <motion.div key="peek" className="absolute bottom-[-38px] right-6" initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.3 }}>
                <ZadRig pose="peek" size={86} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* right: Zad jumps up with a big word */}
          <AnimatePresence>
            {moment === 'right' && (
              <motion.div key={'r' + i} className="absolute inset-x-0 bottom-0 flex flex-col items-center rounded-t-[28px] bg-[#3E9B5B]/12 pb-4 pt-3"
                initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
                <motion.p initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 14 }}
                  className="font-editorial text-[30px] text-[#2F7A47] dark:text-[#7FD49A]">{PRAISE[i % PRAISE.length]}</motion.p>
                <ZadRig pose="cheer" size={96} />
                <button onClick={next} className="mt-2 w-[85%] rounded-full bg-[#3E9B5B] py-3.5 text-[15px] font-bold text-white">Continue</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* wrong: Zad comes in from the side, feels it, then encourages */}
          <AnimatePresence>
            {moment === 'wrong' && (
              <motion.div key={'w' + i} className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-[#C51F24]/8 px-4 pb-4 pt-3"
                initial={{ y: 220 }} animate={{ y: 0 }} exit={{ y: 220 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
                <div className="flex items-end gap-2">
                  <motion.div initial={{ x: -120 }} animate={{ x: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 16 }}>
                    <WrongZad />
                  </motion.div>
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="mb-10 rounded-2xl rounded-es-sm border border-border bg-background px-3 py-2 text-[14px] leading-snug">
                    Almost! It's {q.options[q.right]}. Let's try the next one together.
                  </motion.p>
                </div>
                <button onClick={next} className="mt-1 w-full rounded-full bg-[#C51F24] py-3.5 text-[15px] font-bold text-white">Got it</button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">Answer right, then wrong, to see Zad react.</p>
      </main>
    </div>
  );
}

/* sad for a moment, then back to pointing the way forward */
function WrongZad() {
  const [pose, setPose] = useState<ZadPose>('sad');
  useEffect(() => { const t = setTimeout(() => setPose('point'), 1400); return () => clearTimeout(t); }, []);
  return <ZadRig pose={pose} size={92} />;
}
