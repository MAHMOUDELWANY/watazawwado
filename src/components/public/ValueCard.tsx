import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * A card with a deep mihrab portal and an animated emblem on top (the subject-card portal),
 * then a small label, a title and a short text. Used for steps, principles and philosophy.
 */
export function ValueCard({ emblem: Emblem, portal, label, title, text, index = 0, headingLevel = 3 }: {
  emblem: React.ComponentType<{ className?: string }>;
  /** Portal gradient, top → bottom. */
  portal: [string, string];
  label?: React.ReactNode;
  title: string;
  text: string;
  index?: number;
  headingLevel?: 2 | 3;
}) {
  const reduce = useReducedMotion();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="subject-card value-card group"
    >
      <div className="subject-portal khatam-window" style={{ '--door-a': portal[0], '--door-b': portal[1] } as React.CSSProperties}>
        <span className="subject-arch" aria-hidden="true" />
        <span className="door-glow" aria-hidden="true" />
        <Emblem className="subject-emblem" />
      </div>
      <div className="flex-1 px-5 pt-5 pb-6">
        {label && <p className="text-xs font-bold text-[var(--teal)] mb-1.5">{label}</p>}
        <Heading className="font-editorial text-xl font-bold text-foreground leading-snug">{title}</Heading>
        <p className="mt-2 text-[0.95rem] text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </motion.article>
  );
}

// Teal, crimson, copper and gold take turns across a row of cards.
export const PORTALS: Array<[string, string]> = [
  ['#0B7183', '#05363F'],
  ['#A3201F', '#4E2219'],
  ['#9C5A33', '#4A2619'],
  ['#C98A2A', '#5E321F'],
];
