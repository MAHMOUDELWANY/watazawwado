import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * The line under the hero h1. Motion users see one subject at a time, swapped with a soft blur;
 * screen readers, search engines (prerendered HTML) and reduced-motion users get the full static sentence.
 */

const SUBJECTS = {
  ar: ['القرآن', 'التجويد', 'العربية', 'العلوم الشرعية', 'الإنجليزية'],
  en: ['Quran', 'Tajweed', 'Arabic', 'Islamic studies', 'English'],
};

const STATIC = {
  ar: 'القرآن والتجويد، والعربية، والعلوم الشرعية، والإنجليزية. حصص فردية على Zoom، مع معلّم يعرفك باسمك.',
  en: 'Quran, Tajweed, Arabic, Islamic studies and English. One-on-one on Zoom, with a teacher who knows you by name.',
};

const INTERVAL_MS = 2600;

export function HeroSubjects({ isEn, className }: { isEn: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const words = isEn ? SUBJECTS.en : SUBJECTS.ar;

  React.useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % words.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduce, words.length]);

  return (
    <p className={className}>
      <span className="rotator-static">{isEn ? STATIC.en : STATIC.ar}</span>
      {/* The rotating word ends its line, so swapping it never reflows the rest of the sentence. */}
      <span className="rotator-live" aria-hidden="true">
        {isEn ? 'One-on-one lessons in ' : 'حصص فردية في '}
        <span className="relative inline-block font-bold">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={words[index]}
              // The rotating subject wears the brand ribbon (crimson, copper, gold, teal).
              className="inline-block text-ribbon"
              initial={{ opacity: 0, filter: 'blur(10px)', y: 6 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(10px)', y: -6 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {words[index]}
            </motion.span>
          </AnimatePresence>
          <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-gradient-to-r from-[#087D91] via-[#E5A93C] to-[#C51F24] opacity-70" />
        </span>
        {isEn ? ',' : '،'}
        <br />
        {isEn ? 'on Zoom, with a teacher who knows you by name.' : 'على Zoom، مع معلّم يعرفك باسمك.'}
      </span>
    </p>
  );
}
