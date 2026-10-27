import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronRight, Lock } from 'lucide-react';

/* The arched door cards of the curriculum (the homepage's door design), shared by the teacher workspace and the
   student portal. */

const DOOR_COLORS: [string, string][] = [['#0A5866', '#05363F'], ['#8B4935', '#3B2219'], ['#C51F24', '#5E1214'], ['#9A6A12', '#3B2A0C']];

/** One arched door: a painting (or a soft glow when there is none yet) in the portal, then title, tagline and facts.
 *  A door without `to` is a "coming soon" door: shown, dimmed, not clickable. */
export function Door({ to, onOpen, art, title, tagline, facts, enter, soon, index }: {
  to?: string; onOpen?: () => void; art?: string; title: string; tagline: string; facts: string[]; enter: string; soon?: string; index: number;
}) {
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState(false);
  const [a, b] = DOOR_COLORS[index % DOOR_COLORS.length];
  const body = (
    <>
      <span className="door-portal khatam-window" style={{ ['--door-a' as string]: a, ['--door-b' as string]: b } as React.CSSProperties}>
        {art && !broken ? (
          <img src={art} alt="" loading="lazy" draggable={false} onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        ) : (
          <span className="door-glow" aria-hidden="true" />
        )}
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" aria-hidden="true" />
        {soon && (
          <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />{soon}
          </span>
        )}
      </span>
      <span className="door-title">{title}</span>
      <span className="door-tagline">{tagline}</span>
      {facts.length > 0 && (
        <span className="mb-3 flex flex-wrap justify-center gap-1.5 px-2">
          {facts.map((f) => <span key={f} className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{f}</span>)}
        </span>
      )}
      {(to || onOpen) && <span className="door-enter">{enter}<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" /></span>}
    </>
  );
  return (
    <motion.li className="door-slot" initial={reduce ? false : { opacity: 0, transform: 'translateY(14px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}>
      {to ? <Link to={to} className="door-card group">{body}</Link>
        : onOpen ? <button type="button" onClick={onOpen} className="door-card group w-full text-center">{body}</button>
        : <div className="door-card opacity-70" aria-disabled="true">{body}</div>}
    </motion.li>
  );
}

export const DOORS = 'grid grid-cols-[repeat(auto-fit,minmax(240px,290px))] justify-center gap-6 sm:gap-8';
