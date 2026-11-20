import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Repeat } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useT } from '../lib/language';
import { wordKey, type QuranApi, type QuranAudio, type Reciter } from './api';

/** The word being recited at `ms`, from the API's [position, start, end] timings; null between words. */
export function wordAt(audio: QuranAudio, ms: number): { verseKey: string; key: string | null } | null {
  const v = audio.verses.find((x) => ms >= x.from && ms < x.to);
  if (!v) return null;
  const w = v.words.find(([, a, b]) => ms >= a && ms < b);
  return { verseKey: v.key, key: w ? wordKey(v.key, w[0]) : null };
}

/**
 * 4.3: listen and repeat. A known reciter plays the assigned ayat with each word highlighted from the audio timings;
 * "repeat each ayah" plays every ayah `times` times before moving on.
 */
export function Recite({ api, surah, from, to, reciters, onWord }: {
  api: QuranApi; surah: number; from: number; to: number; reciters: Reciter[];
  onWord: (key: string | null, verseKey: string | null) => void;
}) {
  const { t, isAr } = useT();
  const [reciter, setReciter] = useState(reciters[0]?.id ?? 7);
  const [audio, setAudio] = useState<QuranAudio | null>(null);
  const [playing, setPlaying] = useState(false);
  const [times, setTimes] = useState(1);
  const [error, setError] = useState('');
  const el = useRef<HTMLAudioElement | null>(null);
  const loop = useRef<{ verse: string | null; count: number }>({ verse: null, count: 0 });
  const timesRef = useRef(times);
  timesRef.current = times;

  useEffect(() => {
    let live = true;
    setAudio(null); setError('');
    api.audio(reciter, surah).then((a) => { if (live) setAudio(a); }).catch(() => { if (live) setError(t('The recitation could not load.', 'التلاوة ما اتحملتش.')); });
    return () => { live = false; };
  }, [api, reciter, surah]);

  const span = audio && {
    start: audio.verses.find((v) => v.key === `${surah}:${from}`)?.from ?? 0,
    end: audio.verses.find((v) => v.key === `${surah}:${to}`)?.to ?? Infinity,
  };

  // A frame loop (timeupdate is too slow for word-by-word highlighting).
  useEffect(() => {
    if (!playing || !audio || !span) return;
    let raf = 0;
    const tick = () => {
      const a = el.current;
      if (!a) return;
      const ms = a.currentTime * 1000;
      const at = wordAt(audio, ms);
      const verse = at && audio.verses.find((v) => v.key === at.verseKey);
      // Repeat: at the end of an ayah, go back to its start until it has played `times` times.
      const cur = audio.verses.find((v) => v.key === loop.current.verse);
      if (cur && ms >= cur.to - 40 && loop.current.count + 1 < timesRef.current) {
        loop.current.count += 1;
        a.currentTime = cur.from / 1000;
      } else if (verse && verse.key !== loop.current.verse) {
        loop.current = { verse: verse.key, count: 0 };
      }
      if (ms >= span.end) { a.pause(); a.currentTime = span.start / 1000; setPlaying(false); onWord(null, null); return; }
      onWord(at?.key ?? null, at?.verseKey ?? null);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, audio, span?.start, span?.end]);

  const toggle = async () => {
    const a = el.current;
    if (!a || !span) return;
    if (playing) { a.pause(); setPlaying(false); return; }
    const ms = a.currentTime * 1000;
    if (ms < span.start || ms >= span.end) { a.currentTime = span.start / 1000; loop.current = { verse: null, count: 0 }; }
    try { await a.play(); setPlaying(true); } catch { setError(t('Tap play again to start the sound.', 'دوس تشغيل تاني عشان الصوت يبدأ.')); }
  };

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-surface p-3" aria-label={t('Listen and repeat', 'اسمع وردد')}>
      <div className="flex flex-wrap items-end gap-2">
        <Button type="button" size="sm" onClick={toggle} disabled={!audio} aria-pressed={playing}>
          {playing ? <Pause className="me-1 h-4 w-4" aria-hidden="true" /> : <Play className="me-1 h-4 w-4" aria-hidden="true" />}
          {playing ? t('Pause', 'وقّف') : t('Listen', 'اسمع')}
        </Button>
        <label className="grid gap-1 text-xs text-muted-foreground">
          {t('Reciter', 'القارئ')}
          <Select value={reciter} onChange={(e) => { el.current?.pause(); setPlaying(false); setReciter(Number(e.target.value)); }} className="h-10 min-w-48">
            {reciters.map((r) => <option key={r.id} value={r.id}>{isAr ? r.ar : r.en}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" aria-hidden="true" />{t('Repeat each ayah', 'كرر كل آية')}</span>
          <Select value={times} onChange={(e) => setTimes(Number(e.target.value))} className="h-10 min-w-24">
            {[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n === 1 ? t('Once', 'مرة') : t(`${n} times`, `${n} مرات`)}</option>)}
          </Select>
        </label>
      </div>
      {audio && <audio ref={el} src={audio.url} preload="auto" onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); onWord(null, null); }} />}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
