import React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import type { Lesson, LessonPage } from '../../types';
import { DepthStill } from '../DepthStill';
import { asset } from '../Art';
import { KineticTitle, Khatam, TextCard, Subtitle, Grade, ease, BONE, GOLD } from './Cinema';
import type { Scene } from './scenes';
import { StagePage } from '../motion/Stage';

type Seen = { lines: number; items: number; evidence: boolean; interaction: boolean };

/**
 * One Adults page as a full-screen scene (owner, 2026-10-24: "the window is too small for motion graphics"). The page's
 * still fills the 1600 × 900 canvas and moves in depth; the title rises huge and steps back to the corner once the page
 * starts; an ayah or hadith arrives as the hero, then docks; commentary plays as one subtitle at a time; narration
 * (pages without a text) stays as a short block; the question card and the scene's motion graphics sit on top.
 */
export function CinemaPage({ page, v, lesson, scene, interaction, cover = false, next = false }: {
  page: LessonPage; v: Seen; lesson: Lesson; scene: Scene; interaction: React.ReactNode; cover?: boolean; next?: boolean;
}) {
  const reduce = Boolean(useReducedMotion());
  if (scene.stage) return <StagePage page={page} v={v} lesson={lesson} stage={scene.stage} interaction={interaction} cover={cover} next={next} />;
  const k = (v.evidence ? 1 : 0) + v.lines + v.items + (v.interaction ? 1 : 0);
  const shot = scene.shots[Math.max(0, Math.min(k, scene.shots.length - 1))];
  const started = k > 0;
  const commentary = Boolean(page.evidence) && !page.contextFirst;
  // Commentary pages dock the text once the first comment arrives; scene-setting pages (contextFirst) keep it as the hero
  // until the question comes.
  const docked = v.evidence && (commentary ? v.lines > 0 || v.items > 0 || v.interaction : v.interaction);
  const labels = page.items ?? [];
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#120C09' }}>
      <DepthStill img={asset(`zad-adults/l01/${scene.still}.webp`)} depth={asset(`zad-adults/l01/${scene.still}-depth.webp`)} shot={shot} light={scene.light} grade={scene.grade} still={reduce} />
      <Grade side="both" />

      {/* Title: huge on the opening beat, then it steps back to the top corner (cover and next time keep it big). */}
      <motion.div className="absolute origin-top-left" style={{ left: 110, top: 118, width: cover ? 900 : 1100 }} initial={false}
        animate={{ scale: started && !cover ? 0.5 : 1, y: started || cover ? 0 : 150 }} transition={{ duration: 0.6, ease }}>
        {cover ? (
          <>
            <p lang="ar" dir="rtl" className="m-0 w-fit font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 52, color: GOLD }}>{lesson.titleAr}</p>
            <KineticTitle text={lesson.title} size={128} />
            <p className="m-0 mt-8 max-w-[640px] font-sans" style={{ fontSize: 28, lineHeight: 1.45, color: 'rgba(246,241,232,0.85)' }}>{lesson.goal}</p>
          </>
        ) : (
          <>
            {next && <p className="m-0 mb-3 font-serif italic" style={{ fontSize: 32, color: GOLD }}>Next time on Zad Essentials…</p>}
            <KineticTitle key={page.title} text={page.title} size={112} />
          </>
        )}
      </motion.div>

      {/* The hero object: the khatam star settles in the corner of every page, like a signature. */}
      <motion.div className="absolute" style={{ right: 300, top: 72 }} initial={reduce ? false : { x: 260, y: -40, rotate: -120, scale: 0.3, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.2, duration: 1.2, delay: 0.3 }}>
        <Khatam size={34} />
      </motion.div>

      {scene.overlay?.({ k, items: v.items, labels })}

      {/* While the scene's own graphics take the items, the card steps aside so it never covers them. */}
      {page.evidence && v.evidence && !(scene.overlay && v.items > 0) && (
        <TextCard arabic={page.evidence.arabic} meaning={page.evidence.meaning} reference={page.evidence.reference} docked={Boolean(docked)} />
      )}

      {/* Words give way when the scene's own graphics take the items, and narration gives way to the text it sets up. */}
      {commentary ? (
        <Subtitle text={v.lines > 0 && v.items === 0 && !v.interaction ? page.lines[v.lines - 1] : null} style={{ left: 720, right: 110, bottom: 170 }} />
      ) : (
        !v.evidence && !(scene.overlay && v.items > 0) && <Narration lines={page.lines.slice(0, v.lines)} />
      )}

      <AnimatePresence>
        {interaction && (
          <motion.div className="absolute" style={{ right: 110, bottom: 140, width: 640 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }}>
            {interaction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Story narration: the lines stay together in a short block (they set a scene rather than comment on a text). */
function Narration({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="absolute space-y-3" style={{ left: 110, bottom: 150, width: 720 }}>
      {lines.map((l, i) => (
        <motion.p key={i} className="m-0 font-sans font-semibold" style={{ fontSize: 34, lineHeight: 1.32, color: i === lines.length - 1 ? BONE : 'rgba(246,241,232,0.62)', textShadow: '0 4px 26px rgba(0,0,0,0.7)' }}
          initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease }}>
          {l}
        </motion.p>
      ))}
    </div>
  );
}
