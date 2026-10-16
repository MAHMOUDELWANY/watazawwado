import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import type { Lesson } from '../../curriculum/types';
import type { GameResult } from '../../curriculum/LessonPlayer';
import { StudentMap, type MapSubject } from '../../curriculum/StudentMap';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

type Mark = 'strong' | 'reinforce' | null;

interface Props {
  lesson: Lesson;
  lang: 'ar' | 'en';
  /** Pages the teacher showed in this session (1-based), from the player. */
  firstPage: number;
  lastPage: number;
  gameResult: GameResult | null;
}

/** After class: pages covered + evaluation + game result → saved report and the student's map (PLAN §4.1). */
export function CurriculumReportPanel({ lesson, lang, firstPage, lastPage, gameResult }: Props) {
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [studentId, setStudentId] = useState('');
  const [fromPage, setFromPage] = useState(firstPage);
  const [toPage, setToPage] = useState(lastPage);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [map, setMap] = useState<MapSubject | null>(null);

  useEffect(() => {
    dashboardFetch('/api/dashboard/students')
      .then((d: any) => setStudents((d?.students || []).map((s: any) => ({ id: s.id, name: s.name || s.email || '—' }))))
      .catch(() => setStudents([]));
  }, []);

  // Follow the player until the teacher edits the range by hand.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) {
      setFromPage(firstPage);
      setToPage(lastPage);
    }
  }, [firstPage, lastPage, touched]);

  const loadMap = (id: string) => {
    setMap(null);
    if (!id) return;
    dashboardFetch(`/api/dashboard/curriculum/students/${id}`)
      .then((d: any) => setMap((d?.map || []).find((s: MapSubject) => s.id === lesson.subject) || null))
      .catch(() => setMap(null));
  };

  const cycle = (outcome: string) =>
    setMarks((m) => ({ ...m, [outcome]: m[outcome] === null || m[outcome] === undefined ? 'strong' : m[outcome] === 'strong' ? 'reinforce' : null }));

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await dashboardFetch('/api/dashboard/curriculum/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          subject: lesson.subject,
          lessonNumber: lesson.number,
          fromPage,
          toPage,
          strengths: Object.keys(marks).filter((o) => marks[o] === 'strong'),
          toReinforce: Object.keys(marks).filter((o) => marks[o] === 'reinforce'),
          note,
          gameResult,
        }),
      });
      setMessage({ ok: true, text: L('Report saved. The pages are now in the student’s map.', 'التقرير اتحفظ، والصفحات اتضافت لخريطة الطالب.') });
      setNote('');
      setMarks({});
      loadMap(studentId);
    } catch (e: any) {
      setMessage({ ok: false, text: e?.message || L('Could not save the report.', 'التقرير ما اتحفظش.') });
    } finally {
      setBusy(false);
    }
  };

  const pageOptions = lesson.pages.map((p, i) => ({ value: String(i + 1), label: `${i + 1}. ${p.title}` }));

  return (
    <section className="glass-2 rounded-[var(--r-3,20px)] p-5 space-y-4" aria-labelledby="report-title">
      <h2 id="report-title" className="font-display text-xl font-bold text-foreground">{L('Lesson report', 'تقرير الحصة')}</h2>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-foreground">{L('Student', 'الطالب')}</span>
        <Select
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            loadMap(e.target.value);
          }}
        >
          <option value="">{L('Choose a student', 'اختار الطالب')}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-foreground">{L('From page', 'من صفحة')}</span>
          <Select value={String(fromPage)} onChange={(e) => { setTouched(true); const v = Number(e.target.value); setFromPage(v); if (toPage < v) setToPage(v); }}>
            {pageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-foreground">{L('To page', 'لحد صفحة')}</span>
          <Select value={String(toPage)} onChange={(e) => { setTouched(true); setToPage(Math.max(fromPage, Number(e.target.value))); }}>
            {pageOptions.filter((o) => Number(o.value) >= fromPage).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">
          {L('Evaluation (tap: strong → practise more → clear)', 'التقييم (دوس: شاطر ← يحتاج تأكيد ← مسح)')}
        </legend>
        {lesson.outcomes.map((o) => {
          const m = marks[o] ?? null;
          return (
            <button
              key={o}
              type="button"
              onClick={() => cycle(o)}
              aria-pressed={m !== null}
              dir="ltr"
              className={`w-full text-start rounded-2xl px-4 py-2.5 text-sm border-2 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                m === 'strong' ? 'border-teal bg-teal/10' : m === 'reinforce' ? 'border-[var(--gold)] bg-[var(--gold)]/10' : 'border-border bg-surface'
              }`}
            >
              <span className="font-bold me-2">{m === 'strong' ? '✓' : m === 'reinforce' ? '↻' : '·'}</span>
              {o}
            </button>
          );
        })}
      </fieldset>

      {gameResult && (
        <p className="text-sm text-muted-foreground" dir="ltr">
          {L('Game result attached: ', 'نتيجة اللعبة مرفقة: ')}
          {Object.entries(gameResult).map(([bin, r]) => `${bin} ${r.correct}/${r.total}`).join(' · ')}
        </p>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-foreground">{L('Note for the family (optional)', 'ملاحظة للأهل (اختياري)')}</span>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={3} />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!studentId || busy} isLoading={busy}>
          <Send className="w-4 h-4 me-2 rtl:rotate-180" /> {L('Save report', 'احفظ التقرير')}
        </Button>
        {message && (
          <p role="status" className={`text-sm font-semibold ${message.ok ? 'text-teal' : 'text-crimson'}`}>{message.text}</p>
        )}
      </div>

      {map && <StudentMap subject={map} lang={lang} />}
    </section>
  );
}
