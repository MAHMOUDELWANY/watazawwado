import React, { useEffect, useState } from 'react';
import { X, PartyPopper } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { useActiveLearner } from '../activeLearner';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

type Pending = { learnerId: string; learnerName: string | null; milestone: string; kind: 'part' | 'track'; title: string; titleAr: string; trackTitle: string; trackTitleAr: string };

/**
 * Owner 2026-11-20: after a curriculum part or a whole track, a short survey about the academy (0-10, what you like,
 * what to improve). Not blocking; closing it counts as "no thanks" for that milestone, so it shows once.
 */
export function PlatformSurveyCard({ isAr }: { isAr: boolean }) {
  const { activeId } = useActiveLearner();
  const [pending, setPending] = useState<Pending | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [liked, setLiked] = useState('');
  const [improve, setImprove] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPending(null); setScore(null); setLiked(''); setImprove(''); setDone(false);
    const q = activeId ? `?learnerId=${encodeURIComponent(activeId)}` : '';
    authedJson<{ pending: Pending | null }>(`/api/student/platform-survey/pending${q}`).then((d) => { if (!cancelled) setPending(d.pending); }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeId]);

  if (!pending) return null;

  const send = async (extra: object) => {
    setBusy(true); setError('');
    try {
      await authedJson('/api/student/platform-survey', { method: 'POST', body: JSON.stringify({ learnerId: pending.learnerId, milestone: pending.milestone, ...extra }) });
      return true;
    } catch (e: any) {
      setError(isAr ? 'ما اتحفظش، جرّب تاني.' : e?.message || 'Could not save. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const close = async () => { if (done || await send({ dismissed: true })) setPending(null); };

  const what = isAr ? (pending.kind === 'track' ? `خلّص ${pending.trackTitleAr} كله` : `خلّص جزء «${pending.titleAr}»`) : (pending.kind === 'track' ? `finished all of ${pending.trackTitle}` : `finished the part “${pending.title}”`);
  const who = pending.learnerName || (isAr ? 'الطالب' : 'Your learner');

  return (
    <section className="relative p-4 rounded-2xl glass-card border border-border space-y-3" aria-labelledby="platform-survey-title" data-testid="platform-survey">
      <div className="flex items-start gap-3">
        <PartyPopper className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
        <h2 id="platform-survey-title" className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          {done ? (isAr ? 'شكرًا، كلامك بيفرق معانا' : 'Thank you, this really helps us') : isAr ? `مبروك! ${who} ${what}` : `Congratulations! ${who} ${what}.`}
        </h2>
        <button type="button" onClick={close} disabled={busy} aria-label={isAr ? 'إخفاء' : 'Hide'} className="tap-44 relative w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer shrink-0">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {!done && (
        <>
          <fieldset className="space-y-1.5">
            <legend className="text-sm text-foreground">{isAr ? 'قد إيه ممكن ترشّحنا لصاحب أو قريب؟' : 'How likely are you to recommend us to a friend or relative?'}</legend>
            <div className="flex flex-wrap gap-1" dir="ltr">
              {Array.from({ length: 11 }, (_, v) => (
                <button key={v} type="button" aria-pressed={score === v} onClick={() => setScore(v)}
                  className={`h-10 w-10 rounded-lg border text-sm font-semibold tabular-nums cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${score === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-surface-subtle'}`}>{v}</button>
              ))}
            </div>
            <p className="flex justify-between text-xs text-muted-foreground" dir="ltr"><span>{isAr ? 'مستحيل' : 'Not likely'}</span><span>{isAr ? 'أكيد' : 'Very likely'}</span></p>
          </fieldset>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">{isAr ? 'إيه أكتر حاجة عاجباك؟ (اختياري)' : 'What do you like most? (optional)'}</span>
            <Textarea value={liked} maxLength={1000} rows={2} onChange={(e) => setLiked(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">{isAr ? 'إيه اللي نحسّنه؟ (اختياري)' : 'What should we improve? (optional)'}</span>
            <Textarea value={improve} maxLength={1000} rows={2} onChange={(e) => setImprove(e.target.value)} />
          </label>
          <Button size="sm" disabled={score === null} isLoading={busy} onClick={async () => { if (await send({ recommend: score, liked, improve })) setDone(true); }}>{isAr ? 'ابعت' : 'Send'}</Button>
        </>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
