import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Send, RotateCcw } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export const MAX_SECONDS = 180;

/** The best audio format this browser records in (Chrome/Firefox: webm/opus; Safari: mp4/aac). */
export function pickMime(isSupported: (t: string) => boolean): string | null {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (isSupported(t)) return t;
  return null;
}

/**
 * NX-03: record a recitation (up to 3 minutes), listen back, send it to the teacher. The audio goes straight to
 * private storage through a one-time link from our server; nobody else can play it.
 */
export function RecitationRecorder({ learnerId, homeworkId, isAr, onSent }: { learnerId: string; homeworkId?: string; isAr: boolean; onSent?: () => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'review' | 'sending' | 'sent'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);
  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); if (url) URL.revokeObjectURL(url); }, [url]);
  if (!supported) return null;

  const stop = () => { if (rec.current?.state === 'recording') rec.current.stop(); };

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) window.clearInterval(timer.current);
        const b = new Blob(chunks, { type: (r.mimeType || mime || 'audio/webm').split(';')[0] });
        setBlob(b); setUrl(URL.createObjectURL(b)); setState('review');
      };
      rec.current = r;
      r.start();
      setSeconds(0); setState('recording');
      timer.current = window.setInterval(() => setSeconds((s) => { if (s + 1 >= MAX_SECONDS) stop(); return s + 1; }), 1000);
    } catch {
      setError(isAr ? 'نحتاج إلى إذن الميكروفون للتسجيل. اسمح به من إعدادات المتصفح.' : 'We need microphone access to record. Allow it in your browser settings.');
    }
  };

  const send = async () => {
    if (!blob) return;
    setState('sending'); setError('');
    try {
      const { path, token } = await authedJson<{ path: string; token: string }>('/api/student/recitations/upload-url', {
        method: 'POST', body: JSON.stringify({ learnerStudentId: learnerId, contentType: blob.type }),
      });
      const { error: upErr } = await supabase.storage.from('recitations').uploadToSignedUrl(path, token, blob, { contentType: blob.type });
      if (upErr) throw upErr;
      await authedJson('/api/student/recitations', { method: 'POST', body: JSON.stringify({ learnerStudentId: learnerId, path, homeworkId, durationSec: seconds }) });
      setState('sent');
      onSent?.();
    } catch {
      setState('review');
      setError(isAr ? 'تعذّر إرسال التسجيل، حاول مرة أخرى.' : 'Could not send the recording. Please try again.');
    }
  };

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <div className="grid gap-2" data-testid="recitation-recorder">
      {state === 'idle' && (
        <Button type="button" size="sm" variant="outline" onClick={start} className="w-fit"><Mic className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'سجّل تلاوتك' : 'Record your recitation'}</Button>
      )}
      {state === 'recording' && (
        <div className="flex items-center gap-2" role="status">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-sm tabular-nums" dir="ltr">{mmss}</span>
          <Button type="button" size="sm" onClick={stop}><Square className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'وقّف' : 'Stop'}</Button>
        </div>
      )}
      {(state === 'review' || state === 'sending') && url && (
        <div className="grid gap-2">
          <audio controls src={url} className="w-full h-10" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={send} isLoading={state === 'sending'}><Send className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'ابعته للمعلم' : 'Send to your teacher'}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setState('idle'); setBlob(null); }} disabled={state === 'sending'}><RotateCcw className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'سجّل مرة أخرى' : 'Record again'}</Button>
          </div>
        </div>
      )}
      {state === 'sent' && <p role="status" className="text-xs text-teal">{isAr ? 'وصل إلى المعلم، وسيردّ عليك قبل الحصة القادمة بإذن الله.' : 'Sent. Your teacher will reply before the next lesson, in sha Allah.'}</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
