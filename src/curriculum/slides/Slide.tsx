import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Interaction, Lesson, LessonPage } from '../types';
import { SceneArt, P } from './Art';

/** Correct answers per bin of a game checkpoint, for the teacher report (PLAN §3a.3b). */
export type GameResult = Record<string, { correct: number; total: number }>;

export const CANVAS_W = 1600;
export const CANVAS_H = 900;

/** How many build steps a page has: each line, each item, the evidence, then the interaction. */
export function stepsFor(page: LessonPage): number {
  return page.lines.length + (page.items?.length || 0) + (page.evidence ? 1 : 0) + (page.interaction ? 1 : 0);
}

/** What is visible at build step `step` (0 = nothing yet, stepsFor = everything). */
function visibility(page: LessonPage, step: number) {
  let rest = step;
  const take = (n: number) => { const t = Math.min(Math.max(rest, 0), n); rest -= n; return t; };
  const lines = take(page.lines.length);
  let interaction = false;
  if (page.askFirst && page.interaction) interaction = take(1) === 1;
  const items = take(page.items?.length || 0);
  const evidence = Boolean(page.evidence) && take(1) === 1;
  if (!page.askFirst && page.interaction) interaction = take(1) === 1;
  return { lines, items, evidence, interaction };
}

const ease = [0.22, 1, 0.36, 1] as const;
const build = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease } };

interface SlideProps {
  lesson: Lesson;
  pageIndex: number;
  step: number;
  onCorrect: () => void;
  onGameResult: (r: GameResult) => void;
}

/** One slide on the fixed 1600 × 900 notebook canvas. */
export function Slide({ lesson, pageIndex, step, onCorrect, onGameResult }: SlideProps) {
  const page = lesson.pages[pageIndex];
  const v = visibility(page, step);
  const chapter = [...lesson.chapters].reverse().find((c) => c.page <= pageIndex);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: P.paper, color: P.ink }} dir="ltr" lang="en">
      <Paper />
      <header className="absolute left-[120px] right-[230px] top-[44px] flex items-center gap-4">
        <span className="h-[3px] w-10 rounded-full" style={{ background: P.gold }} />
        <span className="font-sans font-bold text-[22px] tracking-[0.12em]" style={{ color: P.inkSoft }}>
          LESSON {lesson.number} · {chapter?.label.toUpperCase()}
        </span>
        <span lang="ar" dir="rtl" className="font-serif text-[30px] leading-none" style={{ color: P.inkSoft }}>{lesson.titleAr}</span>
      </header>
      <div className="absolute right-[90px] top-0 rounded-b-[22px] px-7 pb-4 pt-3 text-center shadow-[0_14px_30px_-14px_rgba(10,61,69,0.6)]" style={{ background: P.ink }}>
        <div className="font-sans text-[15px] font-bold tracking-[0.2em]" style={{ color: P.gold }}>LESSON</div>
        <div className="font-serif text-[52px] font-bold leading-none text-white">{String(lesson.number).padStart(2, '0')}</div>
      </div>

      <Body page={page} v={v} lesson={lesson} onCorrect={onCorrect} onGameResult={onGameResult} />

      <ChapterTracker lesson={lesson} pageIndex={pageIndex} />
    </div>
  );
}

function Paper() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 59px, rgba(8,125,145,0.10) 59px 60px)', backgroundPosition: '0 30px' }}
      />
      <div className="absolute top-0 bottom-0 left-[80px] w-[2px]" style={{ background: 'rgba(197,31,36,0.28)' }} />
    </>
  );
}

function ChapterTracker({ lesson, pageIndex }: { lesson: Lesson; pageIndex: number }) {
  return (
    <footer className="absolute left-[120px] right-[90px] bottom-[34px] flex items-center gap-8">
      <span className="font-sans text-[17px] font-bold tracking-[0.14em]" style={{ color: P.inkSoft }}>IN THIS LESSON</span>
      {lesson.chapters.map((c, i) => {
        const next = lesson.chapters[i + 1]?.page ?? lesson.pages.length;
        const state = pageIndex >= next ? 'done' : pageIndex >= c.page ? 'now' : 'later';
        return (
          <span key={c.label} className="flex items-center gap-3 font-sans text-[20px] font-bold" style={{ color: state === 'later' ? '#8A9A9C' : P.ink }}>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[17px]"
              style={{
                background: state === 'now' ? P.gold : state === 'done' ? P.ink : 'transparent',
                color: state === 'later' ? '#8A9A9C' : state === 'now' ? P.ink : '#fff',
                border: state === 'later' ? '2px solid #B7C2C3' : 'none',
              }}
            >
              {state === 'done' ? '✓' : i + 1}
            </span>
            {c.label}
          </span>
        );
      })}
      <span className="ml-auto font-sans text-[18px] font-bold" style={{ color: '#8A9A9C' }}>
        {pageIndex + 1} / {lesson.pages.length}
      </span>
    </footer>
  );
}

function ArtCard({ page, className = '' }: { page: LessonPage; className?: string }) {
  return (
    <div className={`absolute overflow-hidden rounded-[36px] bg-white shadow-[0_30px_60px_-30px_rgba(91,58,30,0.45)] ring-1 ring-black/5 ${className}`}>
      <SceneArt id={page.scene} label={page.title} />
    </div>
  );
}

function Title({ children, size = 84 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2 className="font-serif font-bold leading-[1.02] tracking-[-0.01em]" style={{ fontSize: size, color: P.ink }}>
      {children}
    </h2>
  );
}

function Lines({ lines, count, size = 40 }: { lines: string[]; count: number; size?: number }) {
  return (
    <div className="space-y-4">
      {lines.slice(0, count).map((l, i) => (
        <motion.p key={i} {...build} className="font-sans font-medium leading-[1.3]" style={{ fontSize: size, color: i === count - 1 ? P.ink : P.inkSoft }}>
          {l}
        </motion.p>
      ))}
    </div>
  );
}

/** Arabic evidence: written in from right to left like a pen, then its meaning and source. */
function EvidenceBlock({ page, big = false }: { page: LessonPage; big?: boolean }) {
  const e = page.evidence!;
  return (
    <motion.figure initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[28px] border-2 bg-white/80 px-10 py-7" style={{ borderColor: P.goldSoft }}>
      <motion.blockquote
        lang="ar"
        dir="rtl"
        className="font-serif leading-[1.7]"
        style={{ fontSize: big ? 52 : 38, color: P.ink }}
        initial={{ clipPath: 'inset(0 0 0 100%)' }}
        animate={{ clipPath: 'inset(0 0 0 0%)' }}
        transition={{ duration: Math.min(4, 1 + e.arabic.length / 40), ease: 'easeInOut' }}
      >
        «{e.arabic}»
      </motion.blockquote>
      <motion.figcaption initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-3 font-sans" style={{ fontSize: big ? 28 : 23, color: P.inkSoft }}>
        “{e.meaning}”
        <span className="mt-2 block text-[20px] font-bold" style={{ color: P.copper }}>{e.reference}</span>
      </motion.figcaption>
    </motion.figure>
  );
}

function VocabChips({ page }: { page: LessonPage }) {
  if (!page.vocab?.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {page.vocab.map((w) => (
        <span key={w.translit} className="inline-flex items-center gap-3 rounded-full border-2 bg-white/70 px-5 py-2 font-sans text-[22px]" style={{ borderColor: P.tealSoft, color: P.ink }}>
          <span lang="ar" dir="rtl" className="font-serif text-[30px]">{w.arabic}</span>
          <b>{w.translit}</b>
          <span style={{ color: P.inkSoft }}>{w.meaning}</span>
        </span>
      ))}
    </div>
  );
}

function Body({ page, v, lesson, onCorrect, onGameResult }: { page: LessonPage; v: ReturnType<typeof visibility>; lesson: Lesson; onCorrect: () => void; onGameResult: (r: GameResult) => void }) {
  const interaction = page.interaction && v.interaction ? <InteractionView interaction={page.interaction} onCorrect={onCorrect} onGameResult={onGameResult} /> : null;

  switch (page.layout) {
    case 'cover':
      return (
        <>
          <div className="absolute left-[120px] top-[130px] w-[700px] space-y-6">
            <motion.div {...build}><Title size={104}>{lesson.title}</Title></motion.div>
            <motion.p {...build} transition={{ ...build.transition, delay: 0.25 }} lang="ar" dir="rtl" className="font-serif text-[64px] leading-none text-right" style={{ color: P.copper }}>
              {lesson.titleAr}
            </motion.p>
            <motion.p {...build} transition={{ ...build.transition, delay: 0.5 }} className="font-sans text-[34px] leading-[1.35]" style={{ color: P.inkSoft }}>
              {lesson.goal}
            </motion.p>
            <motion.div {...build} transition={{ ...build.transition, delay: 0.75 }} className="flex gap-4">
              {[[String(lesson.pages.length), 'pages'], ['3', 'big questions'], [String(lesson.minutes), 'minutes']].map(([n, l]) => (
                <span key={l} className="rounded-[22px] border-2 border-dashed px-6 py-3 text-center" style={{ borderColor: '#C9B98F' }}>
                  <b className="block font-serif text-[46px] leading-none">{n}</b>
                  <span className="font-sans text-[18px] font-bold tracking-[0.1em]" style={{ color: P.inkSoft }}>{l.toUpperCase()}</span>
                </span>
              ))}
            </motion.div>
          </div>
          <ArtCard page={page} className="left-[880px] top-[150px] w-[620px] h-[600px]" />
        </>
      );

    case 'story':
      return (
        <>
          <ArtCard page={page} className="left-[860px] top-[140px] w-[640px] h-[600px]" />
          <div className="absolute left-[120px] top-[130px] bottom-[110px] w-[690px] space-y-6 overflow-hidden">
            <Title size={76}>{page.title}</Title>
            {!v.evidence && <Lines lines={page.lines} count={v.lines} size={34} />}
            {v.evidence && <EvidenceBlock page={page} />}
            {interaction}
          </div>
        </>
      );

    case 'evidence':
      return (
        <>
          <ArtCard page={page} className="left-[1060px] top-[150px] w-[440px] h-[440px]" />
          <div className="absolute left-[120px] top-[130px] bottom-[110px] w-[900px] space-y-6 overflow-hidden">
            <Title size={62}>{page.title}</Title>
            {!v.interaction && <Lines lines={page.lines} count={v.lines} size={36} />}
            {v.evidence && <EvidenceBlock page={page} big />}
            <VocabChips page={page} />
            {interaction}
          </div>
        </>
      );

    case 'concept':
      return (
        <>
          <div className="absolute left-[120px] top-[130px] bottom-[110px] w-[560px] space-y-6 overflow-hidden">
            <Title size={76}>{page.title}</Title>
            <Lines lines={page.lines} count={v.lines} size={36} />
            <VocabChips page={page} />
            {interaction}
          </div>
          <ArtCard page={page} className="left-[740px] top-[150px] w-[520px] h-[600px]" />
          <ol className="absolute left-[1290px] top-[170px] w-[260px] space-y-4">
            {(page.items || []).slice(0, v.items).map((item, i) => (
              <motion.li key={item} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }} className="flex items-center gap-3">
                <span className="h-[3px] w-8 shrink-0" style={{ background: P.crimson }} />
                <span className="font-sans text-[28px] font-bold leading-tight" style={{ color: P.crimson }}>{item}</span>
              </motion.li>
            ))}
          </ol>
        </>
      );

    case 'question':
      return (
        <>
          <ArtCard page={page} className="left-[1100px] top-[150px] w-[400px] h-[400px]" />
          <div className="absolute left-[120px] top-[130px] bottom-[110px] w-[940px] space-y-6 overflow-hidden">
            <Title size={72}>{page.title}</Title>
            {!v.evidence && <Lines lines={page.lines} count={v.lines} size={38} />}
            {v.evidence && <EvidenceBlock page={page} />}
            {interaction}
          </div>
        </>
      );

    case 'game':
      return (
        <div className="absolute left-[120px] right-[90px] top-[130px] space-y-6">
          <Title size={58}>{page.title}</Title>
          {interaction}
        </div>
      );

    case 'mission':
      return (
        <>
          <ArtCard page={page} className="left-[980px] top-[140px] w-[520px] h-[600px]" />
          <div className="absolute left-[120px] top-[130px] bottom-[110px] w-[820px] space-y-6 overflow-hidden">
            <Title>{page.title}</Title>
            <Lines lines={page.lines} count={v.lines} size={36} />
            <VocabChips page={page} />
            {interaction}
          </div>
        </>
      );

    case 'next':
      return (
        <>
          <ArtCard page={page} className="left-[860px] top-[140px] w-[640px] h-[600px]" />
          <div className="absolute left-[120px] top-[130px] bottom-[110px] w-[680px] space-y-6 overflow-hidden">
            <span className="font-sans text-[26px] font-bold tracking-[0.14em]" style={{ color: P.crimson }}>NEXT TIME ON ZAD ESSENTIALS</span>
            <Title>{page.title}</Title>
            <Lines lines={page.lines} count={v.lines} />
            {interaction}
          </div>
        </>
      );
  }
}

/* ---------- interactions (sized for the canvas) ---------- */

function InteractionView({ interaction, onCorrect, onGameResult }: { interaction: Interaction; onCorrect: () => void; onGameResult: (r: GameResult) => void }) {
  switch (interaction.kind) {
    case 'ask':
      return <Ask prompt={interaction.prompt} reveal={interaction.reveal} />;
    case 'clues':
      return <Clues interaction={interaction} onCorrect={onCorrect} />;
    case 'choose':
      return <Choose interaction={interaction} />;
    case 'sort':
      return <SortGame interaction={interaction} onCorrect={onCorrect} onResult={onGameResult} />;
  }
}

function Ask({ prompt, reveal }: { prompt: string; reveal?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...build} className="rounded-[28px] px-8 py-6 shadow-[0_20px_40px_-26px_rgba(10,61,69,0.7)]" style={{ background: P.ink }}>
      <p className="font-sans text-[30px] font-bold leading-snug text-white">{prompt}</p>
      {reveal && (
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.p key="a" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 font-sans text-[27px] leading-snug" style={{ color: P.goldSoft }}>
              {reveal}
            </motion.p>
          ) : (
            <motion.button key="b" type="button" onClick={() => setOpen(true)} className="mt-4 rounded-full px-6 py-2 font-sans text-[22px] font-bold" style={{ background: P.gold, color: P.ink }}>
              Show the answer
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function Clues({ interaction, onCorrect }: { interaction: Extract<Interaction, { kind: 'clues' }>; onCorrect: () => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const needed = interaction.clues.filter((c) => c.correct).length;
  const found = picked.filter((i) => interaction.clues[i].correct).length;
  const pick = (i: number) => {
    if (picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (interaction.clues[i].correct && next.filter((j) => interaction.clues[j].correct).length === needed) onCorrect();
  };
  return (
    <motion.div {...build} className="space-y-3">
      <p className="font-sans text-[26px] font-bold">{interaction.prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {interaction.clues.map((clue, i) => {
          const state = picked.includes(i) ? (clue.correct ? 'right' : 'wrong') : 'idle';
          return (
            <motion.button
              key={clue.label}
              type="button"
              onClick={() => pick(i)}
              animate={state === 'wrong' ? { x: [0, -10, 10, -5, 0] } : {}}
              aria-pressed={picked.includes(i)}
              className="rounded-[20px] border-[3px] px-5 py-3 text-left font-sans text-[23px] font-bold transition-colors"
              style={{
                borderColor: state === 'right' ? P.teal : state === 'wrong' ? '#E7B2B3' : '#E3D6B8',
                background: state === 'right' ? '#DDF1F2' : state === 'wrong' ? '#FBEDED' : '#FFFDF7',
                color: state === 'wrong' ? '#A0807F' : P.ink,
              }}
            >
              {state === 'right' ? '✓ ' : ''}{clue.label}
            </motion.button>
          );
        })}
      </div>
      <p className="font-sans text-[22px] font-bold" style={{ color: found === needed ? P.teal : P.inkSoft }} aria-live="polite">
        {found === needed ? 'You found both clues. Great detective work!' : `Clues found: ${found} of ${needed}`}
      </p>
    </motion.div>
  );
}

function Choose({ interaction }: { interaction: Extract<Interaction, { kind: 'choose' }> }) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <motion.div {...build} className="space-y-4">
      <p className="font-sans text-[28px] font-bold">{interaction.prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {interaction.options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => setChoice(i)}
            aria-pressed={choice === i}
            className="rounded-[20px] border-[3px] px-5 py-3 text-left font-sans text-[24px] font-bold"
            style={{ borderColor: choice === i ? P.gold : '#E3D6B8', background: choice === i ? '#FCEFD2' : '#FFFDF7' }}
          >
            {choice === i ? '★ ' : ''}{o}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

const DOOR_COLORS: Record<number, string> = { 0: P.teal, 1: P.crimson, 2: P.gold };

/** Tap a card, then tap a door. Works by touch, mouse and keyboard (no drag needed). */
function SortGame({ interaction, onCorrect, onResult }: { interaction: Extract<Interaction, { kind: 'sort' }>; onCorrect: () => void; onResult: (r: GameResult) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const done = Object.keys(placed).length === interaction.cards.length;

  const place = (bin: string) => {
    if (selected === null || checked) return;
    setPlaced((p) => ({ ...p, [selected]: bin }));
    setSelected(null);
  };
  const check = () => {
    const r = scoreSort(interaction, placed);
    setChecked(true);
    onResult(r);
    if (Object.values(r).every((x) => x.correct === x.total)) onCorrect();
  };

  return (
    <div className="space-y-6">
      <p className="font-sans text-[30px] font-bold">{interaction.prompt}</p>
      <div className="flex min-h-[64px] flex-wrap gap-3">
        {interaction.cards.map((card, i) =>
          placed[i] ? null : (
            <motion.button
              layout
              key={card.label}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              className="rounded-[18px] border-[3px] px-5 py-3 font-sans text-[24px] font-bold"
              style={{ borderColor: selected === i ? P.gold : '#E3D6B8', background: selected === i ? '#FCEFD2' : '#FFFDF7', transform: selected === i ? 'translateY(-4px)' : undefined }}
            >
              {card.label}
            </motion.button>
          ),
        )}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {interaction.bins.map((bin, bi) => (
          <button
            key={bin.id}
            type="button"
            onClick={() => place(bin.id)}
            disabled={selected === null || checked}
            aria-label={`${bin.label}: ${bin.hint}`}
            className="flex min-h-[300px] flex-col items-center gap-2 rounded-t-[999px] rounded-b-[24px] px-4 pb-4 pt-10 text-center enabled:cursor-pointer"
            style={{ background: DOOR_COLORS[bi] ?? P.teal }}
          >
            <span className="font-serif text-[40px] font-bold text-white">{bin.label}</span>
            <span className="font-sans text-[20px] font-bold text-white/85">{bin.hint}</span>
            {interaction.cards.map((card, i) =>
              placed[i] === bin.id ? (
                <motion.span
                  key={card.label}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full rounded-[14px] px-3 py-2 font-sans text-[19px] font-bold"
                  style={{ background: checked ? (card.bin === bin.id ? '#E8F7F2' : '#FDE7E7') : '#FFFDF7', color: P.ink }}
                >
                  {checked && (card.bin === bin.id ? '✓ ' : '✗ ')}
                  {card.label}
                </motion.span>
              ) : null,
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        {done && !checked && (
          <button type="button" onClick={check} className="rounded-full px-8 py-3 font-sans text-[24px] font-bold text-white" style={{ background: P.crimson }}>
            Check my doors
          </button>
        )}
        {Object.keys(placed).length > 0 && (
          <button type="button" onClick={() => { setPlaced({}); setChecked(false); setSelected(null); }} className="rounded-full border-[3px] px-7 py-3 font-sans text-[22px] font-bold" style={{ borderColor: '#E3D6B8' }}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function scoreSort(interaction: Extract<Interaction, { kind: 'sort' }>, placed: Record<number, string>): GameResult {
  const result: GameResult = {};
  for (const bin of interaction.bins) result[bin.id] = { correct: 0, total: 0 };
  interaction.cards.forEach((card, i) => {
    result[card.bin].total += 1;
    if (placed[i] === card.bin) result[card.bin].correct += 1;
  });
  return result;
}
