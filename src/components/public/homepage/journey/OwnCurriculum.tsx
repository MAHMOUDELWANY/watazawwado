import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { Gamepad2, Map, Sparkles } from 'lucide-react';
import { EXPO, type L } from './Journey';

/**
 * Our own curriculum (owner, 2026-11-19: the page never said we have our own). The lesson covers are the real ones
 * from the curriculum (public/curriculum/banners); they fan out as the card scrolls into view.
 */

const COVERS: { src: string; l: L }[] = [
  { src: '/curriculum/banners/quran-reading.webp', l: { en: 'Quran reading', ar: 'القراءة' } },
  { src: '/curriculum/banners/tajweed.webp', l: { en: 'Tajweed', ar: 'التجويد' } },
  { src: '/curriculum/banners/seerah.webp', l: { en: 'Seerah', ar: 'السيرة' } },
  { src: '/curriculum/banners/fusha-kids.webp', l: { en: 'Fusha', ar: 'الفصحى' } },
];

const POINTS: { I: typeof Sparkles; t: L; b: L }[] = [
  { I: Sparkles, t: { en: 'Every lesson is a small story', ar: 'كل درس حكاية صغيرة' }, b: { en: 'Pictures, sound and movement carry the idea, so a child remembers it after the screen is off.', ar: 'صور وصوت وحركة بتشيل الفكرة، فالطفل يفتكرها بعد ما الشاشة تتقفل.' } },
  { I: Gamepad2, t: { en: 'They play with what they learn', ar: 'بيلعبوا باللي اتعلموه' }, b: { en: 'Short games inside the lesson turn practice into something they ask for.', ar: 'ألعاب قصيرة جوه الدرس بتخلّي المراجعة حاجة يطلبوها.' } },
  { I: Map, t: { en: 'A map you can see', ar: 'خريطة قدامك' }, b: { en: 'Levels laid out from the first letter onward, for kids, teens and adults. You always know where you are.', ar: 'مستويات مرسومة من أول حرف، للأطفال والشباب والكبار. دايمًا عارف أنت فين.' } },
];

export function OwnCurriculum({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const spread = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <div ref={ref} className="mt-8 max-w-6xl mx-auto relative overflow-hidden rounded-[2.25rem] ring-1 ring-[#E5A93C]/30 bg-[radial-gradient(44rem_24rem_at_90%_10%,rgba(229,169,60,0.22),transparent_60%),linear-gradient(160deg,#FFFFFF,#F7EEDD)] dark:bg-none dark:bg-card p-6 sm:p-10 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] items-center">
        <div>
          <p className="font-editorial text-base text-[#B4552F] dark:text-[#E5A93C]">{isEn ? 'Our own curriculum' : 'منهجنا الخاص'}</p>
          <h3 className="mt-2 font-editorial font-bold text-3xl sm:text-5xl leading-tight text-foreground">
            {isEn ? <>Lessons they <span className="text-ribbon">look forward to.</span></> : <>دروس <span className="text-ribbon">يستنّوها.</span></>}
          </h3>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            {isEn
              ? 'We wrote and drew our own lessons for every subject, so the teacher spends the class teaching, and the child sees, hears and plays with what they learn.'
              : 'كتبنا ورسمنا دروسنا بنفسنا لكل مادة، عشان المعلّم يقضي الحصة في التعليم، والطفل يشوف ويسمع ويلعب باللي بيتعلمه.'}
          </p>
          <ul className="mt-6 space-y-4">
            {POINTS.map(({ I, t: title, b }, k) => (
              <motion.li key={title.en} className="flex gap-4" initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.6, ease: EXPO, delay: k * 0.1 }}>
                <span className="grid place-items-center shrink-0 w-11 h-11 rounded-2xl bg-[linear-gradient(145deg,#E3343A,#951419)] text-[#FAF7F2] shadow-[0_10px_20px_-10px_rgba(197,31,36,0.8)]"><I className="w-5 h-5" aria-hidden="true" /></span>
                <div>
                  <p className="font-bold text-foreground">{t(title)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{t(b)}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* The real lesson covers, fanned like cards in a hand. */}
        <div className="relative h-[300px] sm:h-[380px]" aria-hidden="true">
          {COVERS.map((c, k) => <Cover key={c.src} src={c.src} label={t(c.l)} o={k - (COVERS.length - 1) / 2} spread={spread} reduce={!!reduce} />)}
        </div>
      </div>
    </div>
  );
}

function Cover({ src, label, o, spread, reduce }: { src: string; label: string; o: number; spread: MotionValue<number>; reduce: boolean }) {
  const rotate = useTransform(spread, [0, 1], [o * 2, o * 9]);
  const x = useTransform(spread, [0, 1], ['0%', `${o * 40}%`]);
  const y = useTransform(spread, [0, 1], ['6%', `${Math.abs(o) * 8}%`]);
  return (
    <motion.figure
      className="absolute left-1/2 top-1/2 w-[46%] sm:w-[42%] -ml-[23%] sm:-ml-[21%] -mt-[34%] sm:-mt-[30%] rounded-[1.4rem] overflow-hidden ring-4 ring-white dark:ring-[#2A1A14] shadow-[0_30px_50px_-24px_rgba(28,20,17,0.6)] bg-white"
      style={reduce ? { rotate: o * 8, x: `${o * 36}%`, zIndex: 10 - Math.round(Math.abs(o) * 2) } : { rotate, x, y, zIndex: 10 - Math.round(Math.abs(o) * 2) }}
      whileHover={reduce ? undefined : { y: '-8%', scale: 1.05, zIndex: 20 }}
    >
      <img src={src} alt="" width={1000} height={1000} loading="lazy" decoding="async" className="block w-full aspect-square object-cover" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-center text-sm font-bold text-[#FAF7F2]">{label}</figcaption>
    </motion.figure>
  );
}
