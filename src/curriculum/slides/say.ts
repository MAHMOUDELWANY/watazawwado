import type { Clip } from '../types';

// Husary (muallim, the teaching recitation), streamed: the URL the Quran Foundation API gives for recitation 12.
const RECITER = 'https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/';
const pad = (n: number, w: number) => String(n).padStart(w, '0');

export function clipUrl(subject: string, lesson: number, clip: Clip): string {
  if (clip.quran && clip.ayah) {
    const [s, a] = clip.ayah.split(':').map(Number);
    return `${RECITER}${pad(s, 3)}${pad(a, 3)}.mp3`;
  }
  return `/curriculum/${subject}/audio/l${pad(lesson, 2)}-${clip.id}.mp3`;
}

/** Plays and never throws: a clip not recorded yet just reports 'missing'. */
export async function playClip(audio: { play: () => Promise<void> }): Promise<'played' | 'missing'> {
  try {
    await audio.play();
    return 'played';
  } catch {
    return 'missing';
  }
}
