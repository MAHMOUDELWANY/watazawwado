/**
 * Classroom 4.1/4.3: the Quran Foundation Content API, called only from our server (OAuth2 client credentials; the
 * browser never sees the secret). Tokens are cached until a minute before they expire; responses are cached in memory
 * because Quran text, page layout and recitation timings do not change. The routes pass the compact shapes below on.
 * Docs: https://api-docs.quran.foundation (granular scopes: content.quran.read for text, content.audio.read for audio).
 */
type Fetch = (url: string, init?: any) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

export const SCOPES = 'content.quran.read content.audio.read';
export const PAGES = 604;
/** Reciters with word timings: Mishari al-Afasy, Mahmoud Khalil al-Husary, and al-Husary's teaching (muallim) recitation. */
export const RECITERS = [
  { id: 7, en: 'Mishari al-Afasy', ar: 'مشاري العفاسي' },
  { id: 6, en: 'Mahmoud Khalil al-Husary', ar: 'محمود خليل الحصري' },
  { id: 12, en: 'al-Husary (teaching, slow)', ar: 'الحصري (المعلم)' },
] as const;
const CACHE_MAX = 1000;
const CACHE_MS = 7 * 86_400_000;

export type QuranWord = { p: number; line: number; t: string; s: string };
export type QuranVerse = { key: string; chapter: number; verse: number; words: QuranWord[] };
export type QuranPage = { page: number; verses: QuranVerse[] };
export type QuranChapter = { n: number; ar: string; en: string; ayat: number; pages: [number, number]; bismillah: boolean };
export type QuranAudio = { reciter: number; chapter: number; url: string; verses: Array<{ key: string; from: number; to: number; words: Array<[number, number, number]> }> };

export class QuranApiError extends Error { constructor(msg: string, public status: number) { super(msg); } }

export function createQuranFoundation(opts: {
  clientId: string; clientSecret: string; fetch?: Fetch; now?: () => number;
  oauthBase?: string; apiBase?: string;
}) {
  const fetchFn: Fetch = opts.fetch ?? ((u, i) => fetch(u, i) as any);
  const now = opts.now ?? Date.now;
  const oauth = opts.oauthBase ?? 'https://oauth2.quran.foundation';
  const api = opts.apiBase ?? 'https://apis.quran.foundation/content/api/v4';
  let token: { value: string; until: number } | null = null;
  let pending: Promise<string> | null = null;
  const cache = new Map<string, { at: number; data: any }>();

  const getToken = async (): Promise<string> => {
    if (token && token.until > now()) return token.value;
    pending ??= (async () => {
      try {
        const res = await fetchFn(`${oauth}/oauth2/token`, {
          method: 'POST',
          headers: { authorization: `Basic ${Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'client_credentials', scope: SCOPES }).toString(),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || typeof body?.access_token !== 'string') throw new QuranApiError(`token ${res.status} ${body?.error || ''}`.trim(), 502);
        const life = Number(body.expires_in) > 0 ? Number(body.expires_in) : 3600;
        token = { value: body.access_token, until: now() + Math.max(60, life - 60) * 1000 };
        return token.value;
      } finally { pending = null; }
    })();
    return pending;
  };

  /** A cached GET; a 401 drops the token and tries once more. */
  const get = async (path: string): Promise<any> => {
    const hit = cache.get(path);
    if (hit && now() - hit.at < CACHE_MS) return hit.data;
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetchFn(api + path, { headers: { 'x-auth-token': await getToken(), 'x-client-id': opts.clientId, accept: 'application/json' } });
      if (res.status === 401 && attempt === 0) { token = null; continue; }
      if (!res.ok) throw new QuranApiError(`content ${res.status} ${path}`, res.status === 404 ? 404 : 502);
      const data = await res.json();
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
      cache.set(path, { at: now(), data });
      return data;
    }
    throw new QuranApiError('content unauthorized', 502);
  };

  return {
    get,
    /** One mushaf page (1-604): verses with words, each word's tajweed markup (t) and simple spelling (s). */
    async page(n: number): Promise<QuranPage> {
      if (!Number.isInteger(n) || n < 1 || n > PAGES) throw new QuranApiError('page out of range', 400);
      const d = await get(`/verses/by_page/${n}?words=true&word_fields=text_uthmani_tajweed,text_imlaei_simple,line_number&fields=chapter_id&per_page=50`);
      return {
        page: n,
        verses: (d?.verses || []).map((v: any) => ({
          key: String(v.verse_key),
          chapter: Number(v.chapter_id ?? String(v.verse_key).split(':')[0]),
          verse: Number(v.verse_number),
          words: (v.words || []).filter((w: any) => w.char_type_name === 'word').map((w: any) => ({
            p: Number(w.position), line: Number(w.line_number), t: String(w.text_uthmani_tajweed ?? w.text ?? ''), s: String(w.text_imlaei_simple ?? ''),
          })),
        })),
      };
    },
    async chapters(): Promise<QuranChapter[]> {
      const [ar, en] = await Promise.all([get('/chapters?language=ar'), get('/chapters?language=en')]);
      const enOf = new Map((en?.chapters || []).map((c: any) => [c.id, c.name_simple]));
      return (ar?.chapters || []).map((c: any) => ({
        n: c.id, ar: c.name_arabic, en: String(enOf.get(c.id) ?? c.name_simple), ayat: c.verses_count, pages: c.pages, bismillah: Boolean(c.bismillah_pre),
      }));
    },
    /** The mushaf page of one ayah ("2:255"). */
    async pageOf(key: string): Promise<number> {
      const d = await get(`/verses/by_key/${key}?fields=page_number`);
      const p = Number(d?.verse?.page_number);
      if (!Number.isInteger(p)) throw new QuranApiError('verse not found', 404);
      return p;
    },
    /** A whole-surah recitation with each ayah's time span and each word's [position, startMs, endMs]. */
    async audio(reciter: number, chapter: number): Promise<QuranAudio> {
      if (!RECITERS.some((r) => r.id === reciter)) throw new QuranApiError('unknown reciter', 400);
      if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114) throw new QuranApiError('surah out of range', 400);
      const d = await get(`/chapter_recitations/${reciter}/${chapter}?segments=true`);
      const f = d?.audio_file;
      if (!f?.audio_url) throw new QuranApiError('no audio', 404);
      return {
        reciter, chapter, url: String(f.audio_url),
        verses: (f.timestamps || []).map((t: any) => ({
          key: String(t.verse_key), from: Number(t.timestamp_from), to: Number(t.timestamp_to),
          words: (t.segments || []).filter((s: any) => Array.isArray(s) && s.length >= 3).map((s: number[]) => [s[0], s[1], s[2]] as [number, number, number]),
        })),
      };
    },
  };
}

export type QuranFoundation = ReturnType<typeof createQuranFoundation>;

let shared: QuranFoundation | null = null;
/** The server's client from QURAN_FOUNDATION_CLIENT_ID / _SECRET, or null when they are not set. */
export function quranFoundation(): QuranFoundation | null {
  const clientId = process.env.QURAN_FOUNDATION_CLIENT_ID, clientSecret = process.env.QURAN_FOUNDATION_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  shared ??= createQuranFoundation({ clientId, clientSecret });
  return shared;
}
