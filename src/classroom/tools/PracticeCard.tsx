import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, EyeOff, Shuffle, X } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import type { Practice } from '../../lib/roomTools';
import type { RoomEvent } from '../../lib/roomEvents';
import { isUnscrambled, makeBlanks, matchColumns, nextWheel, sameWord, scramble, stripTashkeel } from './practice';

/** The learner's answers reach the teacher at most this often (live only, H6). */
const ANSWER_EVERY_MS = 500;
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

const TITLES: Record<Practice['kind'], { en: string; ar: string }> = {
  none: { en: '', ar: '' },
  tashkeel: { en: 'Read it', ar: 'اقرأ' },
  blanks: { en: 'Fill the blanks', ar: 'املأ الفراغات' },
  unscramble: { en: 'Put the words in order', ar: 'رتّب الكلمات' },
  wheel: { en: 'Question', ar: 'سؤال' },
  match: { en: 'Match the pairs', ar: 'وصّل كل كلمة بمعناها' },
  roleplay: { en: 'Role-play', ar: 'تمثيل أدوار' },
};

/**
 * One practice activity (BUILD-LIST 2.11) on both screens. The teacher controls it (show answers, shuffle again, next
 * question, close); the learner answers on their own screen and the teacher sees those answers live.
 */
export function PracticeCard({ practice, teacher, send, publish, learnerAnswer, style, kid }: {
  practice: Practice;
  teacher: boolean;
  send: (e: RoomEvent) => void;
  publish: (e: RoomEvent) => void;
  /** Teacher: what the learner has entered so far. */
  learnerAnswer?: string[] | null;
  /** Learner comfort (size, warmth). */
  style?: React.CSSProperties;
  kid?: boolean;
}) {
  const { t, isAr } = useT();
  const L = (x: { en: string; ar: string }) => (isAr ? x.ar : x.en);
  const [answer, setAnswer] = useState<string[]>([]);
  // Matching: the left word the learner picked, waiting for its meaning.
  const [pick, setPick] = useState(-1);
  const asked = useRef<number[]>([]);
  const key = `${practice.kind}|${practice.seed}|${practice.text}|${(practice.items || []).join('|')}`;
  useEffect(() => { setAnswer([]); setPick(-1); }, [key]);

  // Learner → teacher, trailing, at most every 500 ms.
  const timer = useRef<number | null>(null);
  const latest = useRef<string[]>([]);
  const answerTo = (next: string[]) => {
    setAnswer(next);
    if (teacher) return;
    latest.current = next;
    if (timer.current != null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      publish({ t: 'practice_answer', kind: practice.kind, answer: latest.current.slice(0, 30).map((a) => a.slice(0, 200)) });
    }, ANSWER_EVERY_MS);
  };
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  const set = (patch: Partial<Practice>) => send({ t: 'practice', practice: { ...practice, ...patch } });
  const shown = practice.show === true;
  const text = practice.text || '';
  const blanks = useMemo(() => makeBlanks(text, practice.seed ?? 0), [text, practice.seed]);
  const tiles = useMemo(() => scramble(text, practice.seed ?? 0), [text, practice.seed]);
  const columns = useMemo(() => matchColumns(practice.pairs || [], practice.seed ?? 0), [practice.pairs, practice.seed]);
  const view = teacher && learnerAnswer ? learnerAnswer : answer;

  let body: React.ReactNode = null;
  switch (practice.kind) {
    case 'tashkeel':
      body = <p dir="auto" className="whitespace-pre-wrap text-center font-editorial text-[1.6em] leading-[2.1]">{shown ? text : stripTashkeel(text)}</p>;
      break;
    case 'blanks': {
      let n = -1;
      body = (
        <p dir="auto" className="text-[1.25em] leading-[2.4]">
          {blanks.map((p, i) => {
            if (!p.blank) return <React.Fragment key={i}>{p.word} </React.Fragment>;
            const k = ++n;
            const v = view[k] ?? '';
            const right = v && sameWord(p.word, v);
            if (shown) return <mark key={i} className="mx-0.5 rounded bg-[#F0B54A]/25 px-1 text-foreground">{p.word} </mark>;
            return (
              <React.Fragment key={i}>
                <input aria-label={t(`Blank ${k + 1}`, `فراغ ${k + 1}`)} dir="auto" value={v} readOnly={teacher}
                  onChange={(e) => { const next = [...answer]; next[k] = e.target.value; answerTo(next); }}
                  style={{ width: `${Math.max(3, p.word.length + 1)}ch` }}
                  className={cn('mx-0.5 rounded-md border-b-2 bg-white/10 px-1 text-center outline-none focus:ring-2 focus:ring-[var(--focus)]',
                    right ? 'border-teal' : 'border-white/40')} />{' '}
              </React.Fragment>
            );
          })}
        </p>
      );
      break;
    }
    case 'unscramble': {
      const used = view.map((w) => w);
      const pool = [...tiles];
      for (const w of used) { const i = pool.indexOf(w); if (i >= 0) pool.splice(i, 1); }
      const done = used.length === tiles.length && isUnscrambled(text, used);
      body = (
        <div className="grid gap-3" dir="auto">
          <div className={cn('flex min-h-14 flex-wrap items-center gap-2 rounded-[var(--r-2)] border border-dashed border-white/25 p-2', done && 'border-teal')}>
            {used.map((w, i) => (
              <button key={i} type="button" disabled={teacher} onClick={() => answerTo(used.filter((_, j) => j !== i))}
                className="room-press min-h-11 rounded-[var(--r-pill)] bg-white/15 px-3 text-[1.1em] focus-ring">{w}</button>
            ))}
            {done && <Check className="h-5 w-5 text-teal" aria-label={t('Right order', 'الترتيب صح')} />}
          </div>
          <div className="flex flex-wrap gap-2">
            {pool.map((w, i) => (
              <button key={i} type="button" disabled={teacher} onClick={() => answerTo([...used, w])}
                className="room-press min-h-11 rounded-[var(--r-pill)] bg-[#3A332D] px-3 text-[1.1em] ring-1 ring-white/10 focus-ring">{w}</button>
            ))}
          </div>
          {shown && <p className="text-[0.95em] text-[#F0B54A]">{text}</p>}
        </div>
      );
      break;
    }
    case 'wheel': {
      const items = practice.items || [];
      const i = practice.index ?? -1;
      body = (
        <div className="grid gap-3 text-center">
          <p dir="auto" className="min-h-16 text-[1.4em] font-semibold leading-snug">{i >= 0 && items[i] ? items[i] : t('Your teacher will pick a question.', 'المعلم هيختار سؤال.')}</p>
          {teacher && (
            <>
              <p className="text-[0.82rem] text-muted-foreground">{t(`${asked.current.length} of ${items.length} asked. No points or prizes: it only picks the next question.`, `اتسأل ${asked.current.length} من ${items.length}. مفيش نقط ولا جوايز: بيختار السؤال الجاي بس.`)}</p>
              <Button size="sm" onClick={() => { const n = nextWheel(items.length, asked.current); asked.current = asked.current.length >= items.length ? [n] : [...asked.current, n]; set({ index: n }); }}>
                {t('Next question', 'السؤال الجاي')}
              </Button>
            </>
          )}
        </div>
      );
      break;
    }
    case 'match': {
      // answer[i]: the meaning the learner joined to left word i ('' none).
      const pairs = practice.pairs || [];
      body = (
        <div className="grid grid-cols-2 gap-2" dir="auto">
          <div className="grid gap-2">
            {columns.left.map((w, i) => {
              const joined = view[i] || '';
              const right = joined && pairs[i]?.[1] === joined;
              return (
                <button key={i} type="button" disabled={teacher} aria-pressed={pick === i} onClick={() => setPick(pick === i ? -1 : i)}
                  className={cn('room-press grid min-h-11 rounded-[var(--r-2)] px-3 py-1 text-start ring-1 focus-ring', pick === i ? 'bg-[#F0B54A]/25 ring-[#F0B54A]' : 'bg-white/10 ring-white/10')}>
                  <span>{w}</span>
                  {(joined || shown) && <span className={cn('text-[0.85em]', shown ? 'text-[#F0B54A]' : right ? 'text-teal' : 'text-muted-foreground')}>→ {shown ? pairs[i]?.[1] : joined}</span>}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2">
            {columns.right.map((w, i) => (
              <button key={i} type="button" disabled={teacher || pick < 0}
                onClick={() => { answerTo(columns.left.map((_, j) => (j === pick ? w : answer[j] === w ? '' : answer[j] ?? ''))); setPick(-1); }}
                className="room-press min-h-11 rounded-[var(--r-2)] bg-[#3A332D] px-3 text-start ring-1 ring-white/10 focus-ring disabled:opacity-60">{w}</button>
            ))}
          </div>
        </div>
      );
      break;
    }
    case 'roleplay': {
      const [mine, theirs] = teacher ? [practice.items?.[0], practice.items?.[1]] : [practice.items?.[1], practice.items?.[0]];
      body = (
        <div className="grid gap-2">
          <div className="rounded-[var(--r-2)] bg-[#F0B54A]/15 p-3 ring-1 ring-[#F0B54A]/40">
            <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-[#F0B54A]">{t('Your role', 'دورك')}</p>
            <p dir="auto" className="whitespace-pre-wrap text-[1.1em] leading-relaxed">{mine || '—'}</p>
          </div>
          {teacher && theirs && (
            <p dir="auto" className="whitespace-pre-wrap text-[0.85em] text-muted-foreground">{t('The learner sees: ', 'الطالب شايف: ')}{theirs}</p>
          )}
        </div>
      );
      break;
    }
    default:
  }

  const canShow = ['tashkeel', 'blanks', 'unscramble', 'match'].includes(practice.kind);
  const canShuffle = ['blanks', 'unscramble', 'match'].includes(practice.kind);
  return (
    <section aria-label={L(TITLES[practice.kind])} style={style}
      className="glass-2 pointer-events-auto grid max-h-[55svh] w-[min(40rem,100%)] gap-3 overflow-y-auto rounded-[var(--r-3)] p-4 text-foreground shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-sm font-semibold text-[#F0B54A]">{kid && practice.kind === 'blanks' ? t('Find the missing words!', 'لاقي الكلمات الناقصة!') : L(TITLES[practice.kind])}</h2>
        {teacher && canShow && (
          <Button size="sm" variant="ghost" onClick={() => set({ show: !shown })} aria-pressed={shown}>
            {shown ? <EyeOff className="me-1.5 h-4 w-4" aria-hidden="true" /> : <Eye className="me-1.5 h-4 w-4" aria-hidden="true" />}
            {practice.kind === 'tashkeel' ? (shown ? t('Hide tashkeel', 'اخفي التشكيل') : t('Show tashkeel', 'اظهر التشكيل')) : (shown ? t('Hide answers', 'اخفي الإجابات') : t('Show answers', 'اظهر الإجابات'))}
          </Button>
        )}
        {teacher && canShuffle && (
          <Button size="sm" variant="ghost" onClick={() => set({ seed: newSeed(), show: false })}><Shuffle className="me-1.5 h-4 w-4" aria-hidden="true" />{t('New round', 'جولة جديدة')}</Button>
        )}
        {teacher && (
          <button type="button" onClick={() => send({ t: 'practice', practice: { kind: 'none' } })} aria-label={t('Close the practice', 'اقفل التمرين')}
            className="room-press grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 focus-ring"><X className="h-4 w-4" aria-hidden="true" /></button>
        )}
      </header>
      {body}
      {teacher && !learnerAnswer?.length && ['blanks', 'unscramble', 'match'].includes(practice.kind) && (
        <p className="text-[0.82rem] text-muted-foreground">{t('The learner’s answers show here as they type.', 'إجابات الطالب بتظهر هنا وهو بيكتب.')}</p>
      )}
    </section>
  );
}

export { newSeed };
