// Lists voice clips as scripts to paste into ElevenLabs (design §3a), grouped by voice.
// Usage: npx tsx scripts/curriculum/clips.ts <subjectId> <lessonNo>   (one lesson, e.g. literacy-b-kids 1)
//        npx tsx scripts/curriculum/clips.ts --all > docs/curriculum/voice/RECORDING-SCRIPTS.md   (every built lesson)
// One take per lesson and voice (owner-feedback.md): the lines go in one prompt with breaks, then are cut on the silences.
import fs from 'fs';
import { SUBJECTS, findLesson } from '../../src/curriculum/catalog';
import type { Lesson, Voice } from '../../src/curriculum/types';

const NAMES: Record<Voice, string> = {
  en: 'ElevenLabs: mahmoud (English)', fusha: 'ElevenLabs: Mahmoud Fusha', eg: 'ElevenLabs: Mahmoud Egyptian',
  owner: 'Recorded by the owner himself (not ElevenLabs)', reciter: 'Reciter (streamed, nothing to record)',
};

function lessonScript(subject: string, lesson: Lesson, h = '#'): string[] {
  const pad = String(lesson.number).padStart(2, '0');
  const clips = lesson.pages.flatMap((p, i) => (p.say ?? []).map((c) => ({ ...c, page: i + 1 })));
  // A clip reused on several pages is recorded once.
  const seen = new Set<string>();
  const unique = clips.filter((c) => c.voice !== 'reciter' && !seen.has(c.id) && seen.add(c.id));
  if (!unique.length) return [];
  const out = [`${h} ${lesson.subjectTitle} · Lesson ${lesson.number}: ${lesson.title}`, '',
    `Folder: \`public/curriculum/${subject}/audio/\`.`, ''];
  for (const v of ['en', 'fusha', 'eg', 'owner'] as Voice[]) {
    const list = unique.filter((c) => c.voice === v);
    if (!list.length) continue;
    out.push(`${h}# ${NAMES[v]} (${list.length})`, '', '| # | File | Page | How to say it | Text |', '|---|---|---|---|---|');
    list.forEach((c, i) => out.push(`| ${i + 1} | l${pad}-${c.id}.mp3 | ${c.page} | ${c.emotion ?? ''} | ${c.text} |`));
    if (v !== 'owner') {
      out.push('', 'One take: paste this whole block as one generation; I cut it into the files above, in this order.', '', '```text');
      out.push(list.map((c) => c.text).join(' <break time="1.2s" /> '), '```');
    }
    out.push('');
  }
  return out;
}

/**
 * What the voice should actually say. A line ends on a stop, and Arabic drops the tanween at a stop (بَابٌ is said
 * "baab"; ـًا becomes a long "aa"), so the take text leaves it out wherever a pause follows: before punctuation and at
 * the end. The lesson keeps its written form; only the recording text changes (owner, 2026-11-03).
 */
export function spoken(text: string): string {
  // The last word before a pause loses its final short vowel or tanween (keeps a shadda); ـًا keeps its alif ("aa").
  // A one-letter word (a letter with its vowel, like بَ) is kept as written.
  return text.replace(/([\u0621-\u064A][\u0621-\u064A\u0651\u0652\u064B-\u0650\u0670]*?[\u0621-\u064A])([\u064B-\u0652]+)(?=[\s]*(?:[.!؟?،,:…]|$))/g,
    (_, word: string, marks: string) => word + (marks.includes('\u0651') ? '\u0651' : ''));
}

/**
 * Every clip of every lesson, one numbered list per voice (owner, 2026-11-03): identical lines are recorded once and
 * copied to every file that uses them. Each voice is split into short parts (at most 12 lines, about 600 characters)
 * so one ElevenLabs v3 generation stays on script. Each line carries its tone as an audio tag in square brackets, and
 * a [long pause] separates the lines so the take can be cut on the silences.
 * Writes BY-VOICE.md (to read and paste) and by-voice.json (the frozen order, used to cut the takes).
 */
/** How each letter sound is said (owner, 2026-11-03: the sound of the letter, not its name). */
const SOUND: Record<string, string> = {
  'ا': 'آ: a long "aa", as in "father"', 'ب': 'بَ: ba', 'ت': 'تَ: ta', 'ث': 'ثَ: tha, the tongue between the teeth',
  'ج': 'جَ: ja, as in "jam"', 'ح': 'حَ: a breathy ḥa from the throat', 'خ': 'خَ: kha, a soft gargle', 'د': 'دَ: da',
  'ذ': 'ذَ: dha, as in "this"', 'ع': 'عَ: the squeezed-throat ʿa', 'ق': 'قَ: a deep qa from the back of the mouth',
  'ء': 'أَ: the little stop in "uh-oh"', s: 'a hiss, "sss", not the name "ess"', a: 'the short a of "apple", not "ay"',
  t: 'a short "t", not the name "tee"',
};
const SAY: Record<string, string> = {
  'ا': 'آ', 'ب': 'بَ', 'ت': 'تَ', 'ث': 'ثَ', 'ج': 'جَ', 'ح': 'حَ', 'خ': 'خَ', 'د': 'دَ', 'ذ': 'ذَ', 'ع': 'عَ', 'ق': 'قَ', 'ء': 'أَ',
  s: 'sss', a: 'a', t: 't',
};

function byVoice(maxLines = 12, maxChars = 600) {
  const groups = new Map<string, { voice: Voice; text: string; emotion: string; files: string[] }>();
  for (const s of SUBJECTS) {
    if (s.id === 'egyptian-franco') continue; // plays the Egyptian Adults files
    for (const l of Object.values(s.lessons)) {
      const pad = String(l.number).padStart(2, '0');
      for (const p of l.pages) for (const c of p.say ?? []) {
        if (c.voice === 'reciter') continue;
        const key = `${c.voice}|${spoken(c.text)}`;
        const file = `${s.id}/audio/l${pad}-${c.id}.mp3`;
        const g = groups.get(key) ?? { voice: c.voice, text: spoken(c.text), emotion: c.emotion ?? '', files: [] };
        if (!g.files.includes(file)) g.files.push(file);
        groups.set(key, g);
      }
    }
  }
  const tag = (e: string) => `[${(e || 'clear').split(',')[0].trim()}] `;
  const json: Record<string, { n: number; part: number; text: string; emotion: string; files: string[] }[]> = {};
  const md = ['# Voice takes, one list per voice', '',
    'Generated by `npx tsx scripts/curriculum/clips.ts --by-voice` (owner, 2026-11-03). For ElevenLabs v3 (audio tags).',
    '',
    '- Each voice is one numbered list; a line used in several lessons is recorded once.',
    '- Each part is one generation: copy the whole box into ElevenLabs as it is. The word in [square brackets] is the',
    '  tone of the line after it; [long pause] is the silence between lines. Do not add numbers or titles.',
    '- Save each generation as `<voice>-part-<n>.mp3` and send it. Claude cuts it on the pauses, in this order',
    '  (`by-voice.json`), and copies each line to every lesson that uses it.',
    '- Arabic is written as it is said at a stop: no tanween where the line pauses (بَاب, not بَابٌ), as a teacher reads it.',
    '- Quran ayat are never recorded (the reciter streams them). The "owner" list is the owner\'s own voice.', ''];
  const titles: Record<string, string> = { fusha: 'Fusha (Mahmoud Fusha)', eg: 'Egyptian (Mahmoud Egyptian)', en: 'English (mahmoud)', owner: 'Owner, recorded himself (letter sounds)' };
  for (const v of ['fusha', 'eg', 'en'] as Voice[]) {
    const all = [...groups.values()].filter((g) => g.voice === v);
    if (!all.length) continue;
    const parts: (typeof all)[] = [[]];
    let chars = 0;
    for (const g of all) {
      const len = tag(g.emotion).length + g.text.length + 14;
      if (parts[parts.length - 1].length >= maxLines || (chars + len > maxChars && parts[parts.length - 1].length)) { parts.push([]); chars = 0; }
      parts[parts.length - 1].push(g);
      chars += len;
    }
    json[v] = [];
    md.push(`## ${titles[v]} · ${all.length} lines · ${parts.length} parts`, '');
    let n = 0;
    parts.forEach((part, pi) => {
      const first = n + 1;
      const rows = part.map((g) => ({ n: ++n, part: pi + 1, text: g.text, emotion: g.emotion, files: g.files }));
      json[v].push(...rows);
      md.push(`### ${v}-part-${pi + 1} (lines ${first}–${n})`, '', '```text');
      md.push(rows.map((r) => `${tag(r.emotion)}${r.text}`).join('\n[long pause]\n'), '```', '');
    });
  }
  // Letter sounds: the SOUND of each letter, never its name (بَ, not «باء»). Arabic in one take, English in another.
  const letters = [...groups.values()].filter((g) => g.voice === 'owner');
  const isAr = (t: string) => /[؀-ۿ]/.test(t);
  json.owner = [];
  let k = 0;
  md.push(`## Letter sounds · ${letters.length} sounds · 2 takes`, '',
    'The **sound** of each letter, not its name: ب is said «بَ» (ba), never «باء». A letter that stops (ب ت د ج ق) is',
    'said with a short a so it can be heard; a letter that can be held (ث ح خ ذ ع) is held a moment. Arabic letters in',
    'one take (`letters-ar.mp3`), English letters in another (`letters-en.mp3`).', '');
  for (const [name, list] of [['letters-ar', letters.filter((g) => isAr(g.text))], ['letters-en', letters.filter((g) => !isAr(g.text))]] as const) {
    if (!list.length) continue;
    md.push(`### ${name} (${list.length})`, '', '| # | Letter | Say it like this |', '|---|---|---|');
    const rows = list.map((g) => ({ n: ++k, part: name === 'letters-ar' ? 1 : 2, text: g.text, emotion: SOUND[g.text] ?? g.emotion, files: g.files }));
    rows.forEach((r) => md.push(`| ${r.n} | ${r.text} | ${r.emotion} |`));
    json.owner.push(...rows);
    md.push('', '```text', rows.map((r) => SAY[r.text] ?? r.text).join('\n[long pause]\n'), '```', '');
  }
  fs.writeFileSync('docs/curriculum/voice/BY-VOICE.md', md.join('\n'));
  fs.writeFileSync('docs/curriculum/voice/by-voice.json', JSON.stringify(json, null, 1));
  console.log(Object.entries(json).map(([v, l]) => `${v}: ${l.length} lines, ${l[l.length - 1].part} parts`).join(', '));
}

const [subject, n] = process.argv.slice(2);
if (subject === '--by-voice') {
  byVoice();
} else if (subject === '--all') {
  const out = ['# Voice recording scripts (every built lesson)', '',
    'Generated by `npx tsx scripts/curriculum/clips.ts --all`. Every older clip was deleted on 2026-11-02 at the owner\'s',
    'request; until a file exists the page shows "recording coming" and works without it. Quran ayat are never recorded:',
    'they stream from the reciter (Husary, muallim). Fusha lines are diacritized to the last letter; read them as written.',
    'Send the finished take; Claude cuts it on the silences into the files listed.', ''];
  for (const s of SUBJECTS) for (const l of Object.values(s.lessons)) out.push(...lessonScript(s.id, l, '##'));
  console.log(out.join('\n'));
} else {
  const lesson = findLesson(subject, Number(n));
  if (!lesson) { console.error(`No lesson ${subject} ${n}`); process.exit(1); }
  console.log(lessonScript(subject, lesson).join('\n'));
}
