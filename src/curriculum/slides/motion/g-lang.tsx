import React from 'react';
import { motion } from 'motion/react';
import { CRIMSON } from '../cinema/Cinema';
import { INK_TEXT } from './Stage';
import { Bubble, Icon } from './kit';
import { Hear } from '../Say';

/**
 * Shared pieces for the language lessons (Fusha, Egyptian, Literacy, English): Arabic text, speech bubbles and word
 * tiles that play their clip on tap, and object cards drawn with the kit's icons.
 */

export const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };

export function ArText({ children, size, color = INK_TEXT }: { children: React.ReactNode; size: number; color?: string }) {
  return <span lang="ar" style={{ ...AR, fontSize: size, lineHeight: 1.35, color, whiteSpace: 'nowrap' }}>{children}</span>;
}

/** A speech bubble pointing down to (x, y); Arabic by default; plays `id` on tap. */
export function SayBubble({ x, y, id, text, align = 'left', delay = 0, width = 260, accent = false, thought = false, size = 34, latin = false }: {
  x: number; y: number; id?: string; text: React.ReactNode; align?: 'left' | 'right'; delay?: number; width?: number; accent?: boolean; thought?: boolean; size?: number; latin?: boolean;
}) {
  const color = accent ? '#fff' : INK_TEXT;
  const t = latin
    ? <span className="font-sans font-bold" style={{ fontSize: size * 0.8, color }}>{text}</span>
    : <ArText size={size} color={color}>{text}</ArText>;
  return <Bubble x={x} y={y} width={width} align={align} delay={delay} accent={accent} thought={thought} text={<div style={{ textAlign: 'center' }}>{id ? <Hear id={id}>{t}</Hear> : t}</div>} />;
}

/** A word tile centred at (x, y). `from` slides it in from an offset; `hot` frames it in crimson. */
export function WordTile({ x, y, children, size = 56, hot = false, color = INK_TEXT, delay = 0, from, id, latin = false }: {
  x: number; y: number; children: React.ReactNode; size?: number; hot?: boolean; color?: string; delay?: number; from?: { x: number; y: number }; id?: string; latin?: boolean;
}) {
  const body = latin ? <span className="font-sans font-black" style={{ fontSize: size * 0.85, color }}>{children}</span> : <ArText size={size} color={color}>{children}</ArText>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div className="flex items-center justify-center rounded-[22px]" style={{ padding: '4px 24px', background: '#FFFDF8', boxShadow: hot ? `0 0 0 4px ${CRIMSON}, 0 0 30px 6px ${CRIMSON}44` : '0 18px 34px -24px rgba(60,30,10,0.6)' }}
        initial={from ? { x: from.x, y: from.y, opacity: 0.6 } : { opacity: 0, y: 18, scale: 0.9 }} animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 1, delay }}>
        {id ? <Hear id={id}>{body}</Hear> : body}
      </motion.div>
    </div>
  );
}

/** An object card: an icon from the kit, with an optional playable label under it. */
export function ObjectCard({ x, y, icon, label, id, color = CRIMSON, size = 120, delay = 0, latin = false }: {
  x: number; y: number; icon: string; label?: React.ReactNode; id?: string; color?: string; size?: number; delay?: number; latin?: boolean;
}) {
  const text = label ? (latin ? <span className="font-sans font-black" style={{ fontSize: size * 0.24, color: INK_TEXT }}>{label}</span> : <ArText size={size * 0.26}>{label}</ArText>) : null;
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x - size / 2, top: y - size / 2, width: size }}
      initial={{ opacity: 0, y: 20, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay }}>
      <div className="flex items-center justify-center rounded-[26px]" style={{ width: size, height: size, background: '#FFFDF8', boxShadow: '0 18px 34px -22px rgba(60,30,10,0.55)' }}>
        <Icon name={icon} size={size * 0.55} color={color} width={1.6} />
      </div>
      {text && <div className="mt-1">{id ? <Hear id={id}>{text}</Hear> : text}</div>}
    </motion.div>
  );
}
