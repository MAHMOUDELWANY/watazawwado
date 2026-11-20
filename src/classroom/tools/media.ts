/**
 * Shared audio and YouTube (BUILD-LIST 2.10), pure parts: reading a YouTube link, when a follower must seek, and the
 * ducking volume under the teacher's voice.
 */

/** A follower more than this many seconds away from the teacher's position seeks. */
export const DRIFT_SECONDS = 1.5;
/** While a video or audio plays, the teacher repeats its position this often (live only, well inside H6's budget). */
export const MEDIA_HEARTBEAT_MS = 5000;
/** Shared sound drops to this while the teacher speaks, so the teacher is always heard over it. */
export const DUCK_LEVEL = 0.25;

export const needsSeek = (current: number, target: number) => Math.abs(current - target) > DRIFT_SECONDS;
export const duckedVolume = (teacherSpeaking: boolean, base = 1) => (teacherSpeaking ? base * DUCK_LEVEL : base);

/** The 11-character video id from a youtube.com, youtu.be, shorts, embed or music link, or a bare id. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  let url: URL;
  try { url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v');
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    if (!id && m) id = m[1];
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/** Audio files the teacher can play in the room (the server checks the real type from the first bytes). */
export const AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-wav'];
/** A recorder's type without its codecs ("audio/webm;codecs=opus" → "audio/webm"), as Storage and the server expect. */
export const baseType = (type: string) => type.split(';')[0].trim().toLowerCase().replace('audio/x-m4a', 'audio/mp4').replace('audio/x-wav', 'audio/wav');
