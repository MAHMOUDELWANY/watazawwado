import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Headphones, Lightbulb, Mic, Music2, PictureInPicture2, Play, Send, Shapes, Square, X } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { findLesson } from '../../curriculum/catalog';
import type { LessonPage } from '../../curriculum/types';
import type { CheckLevel, Practice, PracticeKind, Stage, ToolsState } from '../../lib/roomTools';
import type { RoomEvent } from '../../lib/roomEvents';
import { AUDIO_TYPES, parseYouTubeId } from './media';
import { lines, parsePairs } from './practice';
import { newSeed } from './PracticeCard';
import { CHECK_TEXT, STAGE_LABELS } from './RoomCards';
import { useRecorder } from './Shadowing';
import { uploadRoomAudio } from './useRoomFile';

type Tab = 'correct' | 'check' | 'practice' | 'media' | 'shadow' | 'warmup';
const rid = () => Math.random().toString(36).slice(2, 10);

/** What a curriculum slide gives the practice tools: its text, word pairs and questions. */
export function slideMaterial(page: LessonPage | undefined): { text: string; pairs: [string, string][]; questions: string[] } {
  if (!page) return { text: '', pairs: [], questions: [] };
  const text = page.evidence?.arabic || page.say?.map((c) => c.text).join(' ') || page.lines.join(' ');
  const pairs = (page.vocab || []).slice(0, 12).map((v) => [v.arabic, v.meaning] as [string, string]);
  const questions = [page.interaction && 'prompt' in page.interaction ? page.interaction.prompt : null, page.tadabbur?.question ?? null].filter((q): q is string => !!q);
  return { text: text.slice(0, 4000), pairs, questions };
}

const KINDS: Array<{ kind: Exclude<PracticeKind, 'none'>; en: string; ar: string; hintEn: string; hintAr: string }> = [
  { kind: 'tashkeel', en: 'Tashkeel', ar: 'التشكيل', hintEn: 'The text, with tashkeel you hide or show.', hintAr: 'النص، والتشكيل تخفيه أو تظهره.' },
  { kind: 'blanks', en: 'Blanks', ar: 'فراغات', hintEn: 'A sentence or passage; some words become blanks.', hintAr: 'جملة أو فقرة؛ كلمات منها بتبقى فراغات.' },
  { kind: 'unscramble', en: 'Unscramble', ar: 'رتّب', hintEn: 'One sentence; its words are shuffled.', hintAr: 'جملة واحدة؛ كلماتها بتتلخبط.' },
  { kind: 'wheel', en: 'Question wheel', ar: 'عجلة الأسئلة', hintEn: 'One question per line. It only picks the next question: no points or prizes.', hintAr: 'سؤال في كل سطر. بتختار السؤال الجاي بس: مفيش نقط ولا جوايز.' },
  { kind: 'match', en: 'Matching', ar: 'توصيل', hintEn: 'One pair per line: word = meaning.', hintAr: 'زوج في كل سطر: كلمة = معنى.' },
  { kind: 'roleplay', en: 'Role-play', ar: 'أدوار', hintEn: 'Line 1: your role. Line 2: the learner’s role.', hintAr: 'السطر الأول: دورك. السطر التاني: دور الطالب.' },
];

/**
 * The teacher's tools (BUILD-LIST 2.10, 2.11) in one side sheet: corrections, understanding checks, practice, shared
 * audio and video, shadowing and the warm-up. Everything here is sent with `send` (live and saved).
 */
export function TeacherTools({ tools, send, slide, bookingId, ticket, mic, warmup, checks, onFloat, canFloat, onClose }: {
  tools: ToolsState;
  send: (e: RoomEvent) => void;
  slide: { track: string; number: number; page: number } | null;
  bookingId: string;
  ticket: string;
  mic: MediaStreamTrack | undefined;
  warmup: Array<{ en: string; ar: string }>;
  checks: Array<{ part: string; level: CheckLevel }>;
  onFloat: () => void;
  canFloat: boolean;
  onClose: () => void;
}) {
  const { t, isAr } = useT();
  const L = (x: { en: string; ar: string }) => (isAr ? x.ar : x.en);
  const [tab, setTab] = useState<Tab>('correct');
  const page = useMemo(() => (slide ? findLesson(slide.track, slide.number)?.pages[slide.page] : undefined), [slide]);
  const material = useMemo(() => slideMaterial(page), [page]);

  // ---- correction ----
  const [said, setSaid] = useState('');
  const [correct, setCorrect] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState<Array<{ said: string; correct: string }>>([]);
  const saidRef = useRef<HTMLInputElement | null>(null);
  const sendCorrection = (e?: React.FormEvent) => {
    e?.preventDefault();
    const s = said.trim().slice(0, 300);
    const c = correct.trim().slice(0, 300);
    if (!s || !c) return;
    send({ t: 'correction', id: rid(), said: s, correct: c, ...(note.trim() ? { note: note.trim().slice(0, 500) } : {}) });
    setSent((x) => [{ said: s, correct: c }, ...x].slice(0, 8));
    setSaid(''); setCorrect(''); setNote('');
    saidRef.current?.focus();
  };

  // ---- check ----
  const defaultPart = `${tools.stage ? L(STAGE_LABELS[tools.stage as Stage]) : t('Lesson', 'الدرس')}${slide ? ` · ${t('page', 'صفحة')} ${slide.page + 1}` : ''}`;
  const [part, setPart] = useState('');
  const open = tools.check?.open;

  // ---- practice ----
  const [kind, setKind] = useState<Exclude<PracticeKind, 'none'>>('blanks');
  const [input, setInput] = useState('');
  const fromSlide = () => {
    if (kind === 'match') setInput(material.pairs.map(([a, b]) => `${a} = ${b}`).join('\n'));
    else if (kind === 'wheel') setInput(material.questions.join('\n'));
    else setInput(material.text);
  };
  const startPractice = () => {
    const v = input.trim();
    let p: Practice | null = null;
    if (kind === 'tashkeel' || kind === 'blanks' || kind === 'unscramble') p = v ? { kind, text: v.slice(0, 4000), seed: newSeed(), show: false } : null;
    if (kind === 'wheel') { const items = lines(v).map((x) => x.slice(0, 300)); p = items.length ? { kind, items, index: -1 } : null; }
    if (kind === 'match') { const pairs = parsePairs(v); p = pairs.length >= 2 ? { kind, pairs, seed: newSeed(), show: false } : null; }
    if (kind === 'roleplay') { const items = lines(v, 2).map((x) => x.slice(0, 300)); p = items.length === 2 ? { kind, items } : null; }
    if (p) send({ t: 'practice', practice: p });
  };
  const slideHas = kind === 'match' ? material.pairs.length > 1 : kind === 'wheel' ? material.questions.length > 0 : kind !== 'roleplay' && !!material.text;

  // ---- media ----
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shareAudio = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const { fileId } = await uploadRoomAudio(bookingId, ticket, file, file.name);
      send({ t: 'media', kind: 'audio', src: fileId, playing: false, pos: 0 });
    } catch (e: any) {
      setError(e?.message || t('The audio could not be added.', 'الصوت ما اتضافش.'));
    } finally { setBusy(false); }
  };
  const shareVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseYouTubeId(link);
    if (!id) { setError(t('That is not a YouTube link.', 'ده مش لينك يوتيوب.')); return; }
    setError('');
    send({ t: 'media', kind: 'youtube', src: id, playing: false, pos: 0 });
    setLink('');
  };

  // ---- shadow ----
  const rec = useRecorder(mic);
  const preview = useRef<HTMLAudioElement | null>(null);
  const sendShadow = async () => {
    if (!rec.clip) return;
    setBusy(true); setError('');
    try {
      const { fileId } = await uploadRoomAudio(bookingId, ticket, rec.clip.blob, 'shadow');
      send({ t: 'shadow', fileId });
      rec.clear();
    } catch (e: any) {
      setError(e?.message || t('The recording could not be sent.', 'التسجيل ما اتبعتش.'));
    } finally { setBusy(false); }
  };

  const TABS: Array<[Tab, React.ComponentType<{ className?: string }>, string]> = [
    ['correct', CheckCircle2, t('Correct', 'تصحيح')],
    ['check', Circle, t('Check', 'فهم')],
    ['practice', Shapes, t('Practice', 'تدريب')],
    ['media', Music2, t('Media', 'صوت وفيديو')],
    ['shadow', Headphones, t('Shadow', 'كرّر ورايا')],
    ['warmup', Lightbulb, t('Warm-up', 'بداية')],
  ];

  return (
    <aside aria-label={t('Teaching tools', 'أدوات التدريس')}
      className="glass-3 pointer-events-auto flex max-h-full w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[var(--r-4)] text-foreground shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      <header className="flex items-center gap-2 px-3 pt-3">
        <h2 className="flex-1 text-sm font-semibold">{t('Teaching tools', 'أدوات التدريس')}</h2>
        {canFloat && (
          <button type="button" onClick={onFloat} title={t('Float the learner’s video (stays on top when you switch tab)', 'خلّي فيديو الطالب عايم (بيفضل قدامك لما تغيّر التاب)')}
            className="room-press flex min-h-9 items-center gap-1.5 rounded-[var(--r-pill)] px-3 text-[0.8rem] font-medium hover:bg-white/10 focus-ring">
            <PictureInPicture2 className="h-4 w-4" aria-hidden="true" />{t('Float video', 'فيديو عايم')}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label={t('Close the tools', 'اقفل الأدوات')} className="room-press grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 focus-ring"><X className="h-4 w-4" aria-hidden="true" /></button>
      </header>
      <div role="tablist" aria-label={t('Tools', 'الأدوات')} className="flex flex-wrap gap-1 px-3 py-2">
        {TABS.map(([id, Icon, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setError(''); }}
            className={cn('room-press flex min-h-9 items-center gap-1.5 rounded-[var(--r-pill)] px-3 text-[0.8rem] font-medium focus-ring',
              tab === id ? 'bg-[#3A332D] text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <Icon className={cn('h-4 w-4', tab === id && 'text-[#F0B54A]')} />{label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="grid min-h-0 gap-3 overflow-y-auto px-3 pb-3 text-sm">
        {tab === 'correct' && (
          <>
            <form onSubmit={sendCorrection} className="grid gap-2">
              <p className="text-[0.8rem] text-muted-foreground">{t('Log it without stopping: the learner sees a gentle card, and it goes to their mistake bank.', 'سجّلها من غير ما توقف: الطالب بيشوف كارت لطيف، وبتتحفظ في بنك أخطائه.')}</p>
              <Input ref={saidRef} dir="auto" value={said} onChange={(e) => setSaid(e.target.value)} maxLength={300} aria-label={t('What they said', 'قال إيه')} placeholder={t('They said…', 'قال…')} />
              <Input dir="auto" value={correct} onChange={(e) => setCorrect(e.target.value)} maxLength={300} aria-label={t('The right way', 'الصح')} placeholder={t('The right way…', 'الصح…')} />
              <Input dir="auto" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} aria-label={t('Note (optional)', 'ملاحظة (اختياري)')} placeholder={t('Note (optional)', 'ملاحظة (اختياري)')} />
              <Button type="submit" size="sm" disabled={!said.trim() || !correct.trim()}><Send className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Send (Enter)', 'ابعت (Enter)')}</Button>
            </form>
            {sent.length > 0 && (
              <ul className="grid gap-1 text-[0.85rem]">
                {sent.map((c, i) => <li key={i}><bdi className="text-muted-foreground line-through">{c.said}</bdi> → <bdi className="font-semibold">{c.correct}</bdi></li>)}
              </ul>
            )}
          </>
        )}

        {tab === 'check' && (
          <div className="grid gap-2">
            <p className="text-[0.8rem] text-muted-foreground">{t('The learner taps understood, partly or not yet. It is saved for this part of the lesson and shows in your report.', 'الطالب بيدوس فاهم، نص نص، أو لسه. بيتحفظ للجزء ده من الحصة وبيظهر في تقريرك.')}</p>
            <Input dir="auto" value={part} onChange={(e) => setPart(e.target.value)} maxLength={120} placeholder={defaultPart} aria-label={t('Which part', 'أنهي جزء')} />
            {open ? (
              <Button size="sm" variant="outline" onClick={() => send({ t: 'check', id: tools.check!.id, part: tools.check!.part, open: false })}>{t('Waiting for the answer… close it', 'مستني الإجابة… اقفله')}</Button>
            ) : (
              <Button size="sm" onClick={() => send({ t: 'check', id: rid(), part: (part.trim() || defaultPart).slice(0, 120), open: true })}>{t('Ask now', 'اسأل دلوقتي')}</Button>
            )}
            {checks.length > 0 && (
              <ul className="grid gap-1 text-[0.85rem]">
                {checks.map((c, i) => <li key={i}><bdi>{c.part}</bdi>: <span className={cn('font-semibold', CHECK_TEXT[c.level].cls)}>{L(CHECK_TEXT[c.level])}</span></li>)}
              </ul>
            )}
          </div>
        )}

        {tab === 'practice' && (
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-1">
              {KINDS.map((k) => (
                <button key={k.kind} type="button" aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}
                  className={cn('room-press min-h-9 rounded-[var(--r-pill)] px-3 text-[0.8rem] font-medium ring-1 focus-ring', kind === k.kind ? 'bg-[#3A332D] ring-[#F0B54A]/60' : 'ring-white/10 text-muted-foreground hover:text-foreground')}>
                  {L(k)}
                </button>
              ))}
            </div>
            <p className="text-[0.8rem] text-muted-foreground">{L({ en: KINDS.find((k) => k.kind === kind)!.hintEn, ar: KINDS.find((k) => k.kind === kind)!.hintAr })}</p>
            <Textarea dir="auto" rows={5} value={input} onChange={(e) => setInput(e.target.value)} maxLength={4000} aria-label={t('Text for the practice', 'نص التمرين')} />
            <div className="flex flex-wrap gap-2">
              {slideHas && <Button size="sm" variant="ghost" onClick={fromSlide}><BookOpen className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Use the slide', 'خد من الشريحة')}</Button>}
              <Button size="sm" onClick={startPractice} disabled={!input.trim()}>{t('Show it', 'اعرضه')}</Button>
              {tools.practice && tools.practice.kind !== 'none' && <Button size="sm" variant="outline" onClick={() => send({ t: 'practice', practice: { kind: 'none' } })}>{t('Close the practice', 'اقفل التمرين')}</Button>}
            </div>
          </div>
        )}

        {tab === 'media' && (
          <div className="grid gap-3">
            <label className={cn('room-press flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--r-2)] border border-dashed border-white/25 px-3 hover:bg-white/[0.06] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]', busy && 'pointer-events-none opacity-60')}>
              <Music2 className="h-4 w-4 text-[#F0B54A]" aria-hidden="true" />{busy ? t('Adding…', 'بنضيف…') : t('Play an audio file (MP3, M4A, OGG, WAV)', 'شغّل ملف صوت (MP3، M4A، OGG، WAV)')}
              <input type="file" accept={AUDIO_TYPES.join(',')} className="sr-only" onChange={(e) => { void shareAudio(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <form onSubmit={shareVideo} className="flex gap-2">
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t('YouTube link', 'لينك يوتيوب')} aria-label={t('YouTube link', 'لينك يوتيوب')} />
              <Button type="submit" size="sm" disabled={!link.trim()}>{t('Share', 'شارك')}</Button>
            </form>
            <p className="text-[0.8rem] text-muted-foreground">{t('Both of you hear it; it goes quieter while you speak. You play, pause and seek; the learner follows.', 'انتو الاتنين بتسمعوه؛ وبيوطى لما تتكلم. إنت بتشغّل وتوقّف وتقدّم؛ والطالب بيتبعك.')}</p>
            {tools.media && tools.media.kind !== 'none' && <Button size="sm" variant="outline" onClick={() => send({ t: 'media', kind: 'none', src: '', playing: false, pos: 0 })}>{t('Stop sharing', 'وقّف المشاركة')}</Button>}
          </div>
        )}

        {tab === 'shadow' && (
          <div className="grid gap-2">
            <p className="text-[0.8rem] text-muted-foreground">{t('Record a short line (up to 15 seconds). The learner hears it, records a repeat and compares.', 'سجّل جملة قصيرة (لحد 15 ثانية). الطالب بيسمعها، ويسجّل تكراره، ويقارن.')}</p>
            <audio ref={preview} className="hidden" />
            <div className="flex flex-wrap gap-2">
              {rec.recording ? (
                <Button size="sm" onClick={rec.stop}><Square className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Stop', 'وقّف')}</Button>
              ) : (
                <Button size="sm" variant="glass" disabled={!mic} onClick={() => rec.start()}><Mic className="me-1.5 h-4 w-4" aria-hidden="true" />{rec.clip ? t('Record again', 'سجّل تاني') : t('Record a line', 'سجّل جملة')}</Button>
              )}
              {rec.clip && !rec.recording && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => { if (preview.current) { preview.current.src = rec.clip!.url; void preview.current.play(); } }}><Play className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Listen', 'اسمع')}</Button>
                  <Button size="sm" disabled={busy} onClick={() => void sendShadow()}><Send className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Send to the learner', 'ابعته للطالب')}</Button>
                </>
              )}
              {tools.shadow && <Button size="sm" variant="outline" onClick={() => send({ t: 'shadow', fileId: '' })}>{t('Close it for the learner', 'اقفله عند الطالب')}</Button>}
            </div>
            {rec.recording && <p role="status" className="text-[0.8rem]"><Circle className="me-1 inline h-3 w-3 fill-crimson text-crimson" aria-hidden="true" />{t('Recording…', 'بنسجّل…')}</p>}
          </div>
        )}

        {tab === 'warmup' && (
          warmup.length
            ? <ul className="grid list-disc gap-1.5 ps-5 leading-relaxed">{warmup.map((p, i) => <li key={i}><bdi>{L(p)}</bdi></li>)}</ul>
            : <p className="text-muted-foreground">{t('No warm-up ideas yet.', 'مفيش أفكار للبداية لسه.')}</p>
        )}
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </div>
    </aside>
  );
}
