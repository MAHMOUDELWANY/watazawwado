import React, { useEffect, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useT } from '../lib/language';
import { authedJson } from '../lib/authedJson';
import { alignWords, flaggedKeys, type AlignOp } from '../lib/quran/align';
import { RecitationRecorder } from '../student/components/RecitationRecorder';
import { DETECTOR_MODEL, detectorSupport, transcribe, type Support } from './detectorModel';
import type { QuranApi } from './api';

type Flag = { key: string; kind: 'missing' | 'changed' | 'extra' };

/**
 * 4.4: record the assigned part, check it on this device, see the flagged words on the mushaf, and send the recording
 * to the teacher (NX-03). The check is only a helper: the teacher's ear decides. A device that cannot run the model
 * still records and sends.
 */
export function Detector({ api, learnerId, homeworkId, surah, from, to, onFlags }: {
  api: QuranApi; learnerId: string; homeworkId?: string; surah: number; from: number; to: number;
  onFlags: (flags: Flag[]) => void;
}) {
  const { t, isAr } = useT();
  const [support, setSupport] = useState<Support | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'checking' | 'done' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [ops, setOps] = useState<AlignOp[] | null>(null);
  const [flags, setFlags] = useState<Flag[] | null>(null);

  useEffect(() => { void detectorSupport().then(setSupport); }, []);
  useEffect(() => { onFlags(flags || []); }, [flags]);

  const check = async () => {
    if (!blob || !support?.ok) return;
    setState('loading'); setProgress(0);
    try {
      const [expected, text] = await Promise.all([
        api.rangeWords(surah, from, to),
        transcribe(blob, support.device, (p) => { setProgress(p); }).then((x) => { setState('checking'); return x; }),
      ]);
      const result = alignWords(expected, text);
      setOps(result);
      setFlags(flaggedKeys(result));
      setState('done');
    } catch {
      setState('failed');
    }
  };

  const onRecorded = (b: Blob | null) => { setBlob(b); setOps(null); setFlags(null); setState('idle'); };
  const onSent = async (rec: { id: string } | null) => {
    if (!rec || !flags) return;
    // The result travels with the recording, for the teacher's accuracy check (4.5). Never blocks the send.
    try {
      await authedJson('/api/student/quran/detector-runs', { method: 'POST', body: JSON.stringify({ learnerId, recordingId: rec.id, surah, ayahFrom: from, ayahTo: to, model: DETECTOR_MODEL, flags }) });
    } catch { /* the recording itself was sent */ }
  };

  const word = (k: string) => k.split(':').slice(1).join(':');
  const counts = flags ? { missing: flags.filter((f) => f.kind === 'missing').length, changed: flags.filter((f) => f.kind === 'changed').length, extra: flags.filter((f) => f.kind === 'extra').length } : null;

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-surface p-3" aria-label={t('Record and check', 'سجّل واتأكد')}>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold"><ScanSearch className="h-4 w-4 text-teal" aria-hidden="true" />{t('Record the assigned part', 'سجّل الجزء المطلوب')}</h3>
      <RecitationRecorder learnerId={learnerId} homeworkId={homeworkId} isAr={isAr} onRecorded={onRecorded} onSent={onSent} />
      {blob && support && !support.ok && (
        <p className="text-sm text-muted-foreground">{t('This device cannot check recordings. Send your recording to your teacher; they will listen to it.', 'الجهاز ده ما يقدرش يراجع التسجيل. ابعت تسجيلك للمعلم وهو هيسمعه.')}</p>
      )}
      {blob && support?.ok && state !== 'done' && (
        <div className="grid gap-2">
          <Button type="button" size="sm" variant="outline" className="w-fit" onClick={check} isLoading={state === 'loading' || state === 'checking'}>
            {t('Check my words', 'راجع كلماتي')}
          </Button>
          {state === 'loading' && <p className="text-xs text-muted-foreground" role="status">{progress > 0 && progress < 1 ? t(`Getting the checker ready the first time… ${Math.round(progress * 100)}%`, `بنجهز المراجعة لأول مرة… ${Math.round(progress * 100)}٪`) : t('Listening…', 'بنسمع…')}</p>}
          {state === 'checking' && <p className="text-xs text-muted-foreground" role="status">{t('Comparing with the mushaf…', 'بنقارن بالمصحف…')}</p>}
          {state === 'failed' && <p role="alert" className="text-xs text-destructive">{t('The check did not work on this device. You can still send the recording to your teacher.', 'المراجعة ما اشتغلتش على الجهاز ده. تقدر برضه تبعت التسجيل للمعلم.')}</p>}
        </div>
      )}
      {state === 'done' && counts && ops && (
        <div className="grid gap-2 text-sm" role="status">
          {flags!.length === 0 ? (
            <p className="text-teal">{t('No word mistakes found. Your teacher still listens for tajweed.', 'مفيش أخطاء في الكلمات. المعلم هيسمع التجويد برضه.')}</p>
          ) : (
            <>
              <p>{t(`Words to look at: ${counts.missing} missing, ${counts.changed} changed, ${counts.extra} extra. They are marked on the page.`, `كلمات تراجعها: ${counts.missing} ناقصة، ${counts.changed} متغيرة، ${counts.extra} زيادة. معلّمة في الصفحة.`)}</p>
              <ul className="flex flex-wrap gap-1.5">
                {ops.filter((o) => o.kind !== 'ok').slice(0, 30).map((o, i) => (
                  <li key={i} className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs">
                    {o.kind === 'missing' ? t(`Missing · word ${word(o.key)}`, `ناقصة · كلمة ${word(o.key)}`)
                      : o.kind === 'changed' ? <>{t(`Changed · word ${word(o.key)} · heard `, `متغيرة · كلمة ${word(o.key)} · اتسمعت `)}<bdi dir="rtl" lang="ar">{o.heard}</bdi></>
                        : <>{t('Extra · heard ', 'زيادة · اتسمعت ')}<bdi dir="rtl" lang="ar">{o.heard}</bdi></>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-xs text-muted-foreground">{t('This is a computer check and can be wrong. Send the recording so your teacher can listen.', 'دي مراجعة كمبيوتر وممكن تغلط. ابعت التسجيل عشان المعلم يسمعه.')}</p>
        </div>
      )}
    </section>
  );
}
