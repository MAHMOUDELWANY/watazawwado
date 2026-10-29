import React, { useCallback, useEffect, useId, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authedJson } from '../../../lib/authedJson';
import { AchievementEmblem } from '../achievements/AchievementEmblems';
import { emblemForKind } from '../achievements/achievements';
import { effortLine } from './effortText';

/**
 * One learner's choices on the community page (plan: docs/superpowers/plans/2026-10-29-community-honor.md).
 * The family decides here whether an achievement goes on the Hall of Honor and whether the learner joins the
 * class board. Nothing is shown to anyone else until they say yes, and both can be undone here.
 */

interface HonorItem {
  id: string;
  status: 'awaiting_consent' | 'published' | 'declined' | 'withdrawn';
  displayName: string | null;
  milestone: { titleEn: string; titleAr: string; kind: string; reachedAt: string } | null;
}
interface BoardRow { name: string; lessonsThisMonth: number; rhythm: number; isYou: boolean }
interface CommunityData {
  learner: { id: string; firstName: string };
  canDecide: boolean;
  decidesAs: 'guardian' | 'learner' | null;
  honor: HonorItem[];
  classBoard: { available: boolean; joined: boolean; displayName: string | null; rows: BoardRow[] | null; waitingForMore: boolean };
}


function errorText(err: any, isAr: boolean): string {
  if (err?.status === 400) return isAr ? 'اكتبوا اسم بس، من غير إيميل أو رقم، وفي حدود ٤٠ حرف.' : err.message;
  if (err?.status === 409) return isAr ? 'الاختيار ده اتسجل قبل كده. حدّثوا الصفحة.' : err.message;
  if (err?.status === 403) return isAr ? 'ولي الأمر هو اللي يختار ده من حسابه.' : err.message;
  return isAr ? 'مقدرناش نحفظ اختياركم. جرّبوا تاني.' : 'We could not save your choice. Please try again.';
}

/** First name, or a short name the family types. */
function NamePicker({ firstName, choice, setChoice, custom, setCustom, isAr, idPrefix }: {
  firstName: string; choice: 'first' | 'custom'; setChoice: (c: 'first' | 'custom') => void;
  custom: string; setCustom: (v: string) => void; isAr: boolean; idPrefix: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-foreground mb-1">{isAr ? 'الاسم اللي يظهر' : 'Name to show'}</legend>
      {firstName && (
        <label className="flex items-center gap-2 min-h-11 text-sm cursor-pointer">
          <input type="radio" name={`${idPrefix}-name`} checked={choice === 'first'} onChange={() => setChoice('first')} className="accent-teal w-4 h-4" />
          <span>{isAr ? `الاسم الأول بس: ${firstName}` : `First name only: ${firstName}`}</span>
        </label>
      )}
      <label className="flex items-center gap-2 min-h-11 text-sm cursor-pointer">
        <input type="radio" name={`${idPrefix}-name`} checked={choice === 'custom'} onChange={() => setChoice('custom')} className="accent-teal w-4 h-4" />
        <span>{isAr ? 'اسم تاني نكتبه (كنية أو الاسم كامل)' : 'Another name we type (a nickname or the full name)'}</span>
      </label>
      {choice === 'custom' && (
        <Input
          aria-label={isAr ? 'الاسم اللي يظهر' : 'Name to show'}
          value={custom}
          maxLength={40}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={isAr ? 'مثلًا: أم يوسف' : 'For example: Umm Yusuf'}
        />
      )}
    </fieldset>
  );
}

function HonorDecision({ item, data, isAr, onDone }: { item: HonorItem; data: CommunityData; isAr: boolean; onDone: () => void }) {
  const [choice, setChoice] = useState<'first' | 'custom'>(data.learner.firstName ? 'first' : 'custom');
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState('');
  const send = async (decision: 'yes' | 'no') => {
    setError('');
    if (decision === 'yes' && choice === 'custom' && !custom.trim()) {
      setError(isAr ? 'اكتبوا الاسم اللي يظهر.' : 'Type the name to show.');
      return;
    }
    setBusy(decision);
    try {
      await authedJson(`/api/student/community/honor/${item.id}/decision`, {
        method: 'POST', body: JSON.stringify({ decision, nameChoice: choice, customName: custom })
      });
      onDone();
    } catch (err) {
      setError(errorText(err, isAr));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="grid gap-3">
      <NamePicker firstName={data.learner.firstName} choice={choice} setChoice={setChoice} custom={custom} setCustom={setCustom} isAr={isAr} idPrefix={item.id} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => send('yes')} isLoading={busy === 'yes'} disabled={busy !== null}>{isAr ? 'أيوه، اعرضوه' : 'Yes, show it'}</Button>
        {item.status === 'awaiting_consent' && (
          <Button variant="outline" onClick={() => send('no')} isLoading={busy === 'no'} disabled={busy !== null}>{isAr ? 'لا، خلّيه لنا' : 'No, keep it private'}</Button>
        )}
      </div>
    </div>
  );
}

function HonorRow({ item, data, isAr, reload }: { item: HonorItem; data: CommunityData; isAr: boolean; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const m = item.milestone;
  if (!m) return null;
  const withdraw = async () => {
    setBusy(true); setError('');
    try {
      await authedJson(`/api/student/community/honor/${item.id}/withdraw`, { method: 'POST' });
      reload();
    } catch (err) {
      setError(errorText(err, isAr));
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="rounded-2xl border border-[#E5A93C]/35 bg-[#E5A93C]/5 p-4 grid gap-3" data-testid={`honor-${item.status}`}>
      <div className="flex items-start gap-3">
        <AchievementEmblem id={emblemForKind(m.kind)} className="w-12 h-12 shrink-0" />
        <div className="min-w-0 grid gap-1">
          <p className="font-semibold text-foreground leading-snug">{isAr ? m.titleAr : m.titleEn}</p>
          {item.status === 'awaiting_consent' && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'نحب نحتفل بالإنجاز ده في لوحة الشرف. اللوحة جوه الحسابات، وبيشوفها أسر وطلاب الأكاديمية بس، وممكن ننشره كمان في مجموعات أسرنا. مش هيظهر غير الاسم اللي تختاروه وعنوان الإنجاز، من غير صورة ولا بلد ولا سن، وتقدروا تشيلوه في أي وقت.'
                : 'We would love to celebrate this on the Hall of Honor. It lives inside the accounts, where only families and students of the academy see it, and we may share it in our families’ groups too. Only the name you choose and the achievement are shown, with no photo, country or age, and you can take it down any time.'}
            </p>
          )}
          {item.status === 'published' && (
            <p className="text-sm text-muted-foreground">
              {isAr ? `ظاهر في لوحة الشرف باسم «${item.displayName}».` : `On the Hall of Honor as “${item.displayName}”.`}{' '}
              <a href="#hall" className="underline underline-offset-2 text-foreground focus-ring rounded">
                {isAr ? 'شوفوا اللوحة' : 'See it'}
              </a>
            </p>
          )}
          {(item.status === 'declined' || item.status === 'withdrawn') && (
            <p className="text-sm text-muted-foreground">{isAr ? 'خاص، مش ظاهر لحد.' : 'Private. Not shown to anyone.'}</p>
          )}
        </div>
      </div>

      {item.status === 'awaiting_consent' && (data.canDecide
        ? <HonorDecision item={item} data={data} isAr={isAr} onDone={reload} />
        : <p className="text-sm text-muted-foreground">{isAr ? 'هنسأل ولي الأمر عن ده، ومش هيظهر حاجة قبل ما يوافق.' : 'We will ask the parent or guardian. Nothing is shown before they agree.'}</p>)}

      {(item.status === 'declined' || item.status === 'withdrawn') && data.canDecide && (
        open
          ? <HonorDecision item={item} data={data} isAr={isAr} onDone={reload} />
          : <div><Button variant="ghost" size="sm" onClick={() => setOpen(true)}>{isAr ? 'غيّرنا رأينا، اعرضوه' : 'We changed our mind, show it'}</Button></div>
      )}

      {item.status === 'published' && (
        confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">{isAr ? 'نشيله من لوحة الشرف؟' : 'Take it off the Hall of Honor?'}</span>
            <Button size="sm" variant="outline" onClick={withdraw} isLoading={busy}>{isAr ? 'أيوه، شيله' : 'Yes, take it down'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)} disabled={busy}>{isAr ? 'رجوع' : 'Keep it'}</Button>
          </div>
        ) : (
          <div><Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>{isAr ? 'شيله من اللوحة' : 'Take it down'}</Button></div>
        )
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </li>
  );
}

function ClassBoard({ data, isAr, reload, uid }: { data: CommunityData; isAr: boolean; reload: () => void; uid: string }) {
  const board = data.classBoard;
  const [choice, setChoice] = useState<'first' | 'custom'>(data.learner.firstName ? 'first' : 'custom');
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (join: boolean) => {
    setError('');
    if (join && choice === 'custom' && !custom.trim()) {
      setError(isAr ? 'اكتبوا الاسم اللي يظهر.' : 'Type the name to show.');
      return;
    }
    setBusy(true);
    try {
      await authedJson('/api/student/community/class-board', {
        method: 'POST', body: JSON.stringify({ learnerId: data.learner.id, join, nameChoice: choice, customName: custom })
      });
      reload();
    } catch (err) {
      setError(errorText(err, isAr));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby={`${uid}-board`} className="grid gap-3" data-testid="class-board">
      <div className="grid gap-1">
        <h3 id={`${uid}-board`} className="font-display text-base font-bold text-foreground">{isAr ? 'لوحة الحلقة' : 'Class board'}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isAr
            ? 'طلاب نفس المعلم ونفس المرحلة بيشوفوا مجهود بعض: حصص الشهر والأسابيع ورا بعض. اللوحة بتعرض الاسم الأول أو الاسم اللي تختاروه، ومن غير ترتيب ولا درجات.'
            : 'Learners with the same teacher and of the same age see each other’s effort: lessons this month and weeks in a row. The board shows first names or the name you choose, never a rank or a score.'}
        </p>
      </div>

      {!board.joined && (data.canDecide ? (
        <div className="grid gap-3">
          <NamePicker firstName={data.learner.firstName} choice={choice} setChoice={setChoice} custom={custom} setCustom={setCustom} isAr={isAr} idPrefix={`${uid}-board`} />
          <div><Button onClick={() => save(true)} isLoading={busy}>{isAr ? 'انضم للوحة' : 'Join the board'}</Button></div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{isAr ? 'ولي الأمر يقدر يختار ده من حسابه.' : 'A parent or guardian can choose this from their account.'}</p>
      ))}

      {board.joined && (
        <>
          {board.rows ? (
            <div className="rounded-2xl border border-border p-4 grid gap-3">
              <p className="text-center font-serif text-lg leading-loose text-foreground" lang="ar" dir="rtl">﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾</p>
              <p className="text-center text-xs text-muted-foreground">{isAr ? 'المطففين: ٢٦' : '“For this let the competitors compete” (al-Mutaffifin 83:26)'}</p>
              <ul className="grid gap-1.5">
                {board.rows.map((r, i) => (
                  <li key={`${r.name}-${i}`} className={`grid gap-0.5 sm:flex sm:items-center sm:justify-between sm:gap-3 rounded-xl px-3 py-2 ${r.isYou ? 'bg-teal/10 ring-1 ring-teal/30' : 'bg-surface-subtle'}`}>
                    <span className="font-semibold text-foreground break-words">{r.name}{r.isYou && <span className="text-xs text-muted-foreground font-normal">{isAr ? ' (أنت)' : ' (you)'}</span>}</span>
                    <span className="text-xs text-muted-foreground">{effortLine(r.lessonsThisMonth, r.rhythm, isAr)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `انضممتوا باسم «${board.displayName}». اللوحة بتظهر لما ينضم ٣ طلاب على الأقل.`
                : `You joined as “${board.displayName}”. The board appears once at least 3 learners have joined.`}
            </p>
          )}
          <div><Button variant="ghost" size="sm" onClick={() => save(false)} isLoading={busy}>{isAr ? 'اخرج من اللوحة' : 'Leave the board'}</Button></div>
        </>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}

/** One learner's choices. Without a learnerId it is the account's own learner. `onChanged` runs after any choice. */
export function CommunityPanel({ learnerId, isAr, onChanged }: { learnerId?: string; isAr: boolean; onChanged?: () => void }) {
  const [data, setData] = useState<CommunityData | null>(null);
  const uid = useId();
  const fetchData = useCallback(async () => {
    try {
      setData(await authedJson<CommunityData>(`/api/student/community${learnerId ? `?learnerId=${encodeURIComponent(learnerId)}` : ''}`));
    } catch {
      setData(null);
    }
  }, [learnerId]);
  useEffect(() => { void fetchData(); }, [fetchData]);
  const load = useCallback(() => { void fetchData(); onChanged?.(); }, [fetchData, onChanged]);

  if (!data || (data.honor.length === 0 && !data.classBoard.available)) return null;
  return (
    <Card className="p-5 sm:p-6" data-testid="community-panel">
      <section aria-labelledby={`${uid}-title`} className="grid gap-5">
        <h2 id={`${uid}-title`} className="font-display text-lg sm:text-xl font-bold text-foreground">
          {data.learner.firstName
            ? (isAr ? `اختيارات ${data.learner.firstName}` : `${data.learner.firstName}’s choices`)
            : (isAr ? 'اختياراتك' : 'Your choices')}
        </h2>
        {data.honor.length > 0 && (
          <section aria-labelledby={`${uid}-honor`} className="grid gap-3">
            <h3 id={`${uid}-honor`} className="font-display text-base font-bold text-foreground">{isAr ? 'لوحة الشرف' : 'Hall of Honor'}</h3>
            <ul className="grid gap-3">
              {data.honor.map((item) => <HonorRow key={item.id} item={item} data={data} isAr={isAr} reload={load} />)}
            </ul>
          </section>
        )}
        {data.classBoard.available && <ClassBoard data={data} isAr={isAr} reload={load} uid={uid} />}
      </section>
    </Card>
  );
}
