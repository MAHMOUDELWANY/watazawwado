// Lists a lesson's voice clips as a script to paste into ElevenLabs (design §3a), grouped by voice.
// Usage: npx tsx scripts/curriculum/clips.ts <subjectId> <lessonNo>   (e.g. literacy-b-kids 1)
import { findLesson } from '../../src/curriculum/catalog';
import type { Voice } from '../../src/curriculum/types';

const [subject, n] = process.argv.slice(2);
const lesson = findLesson(subject, Number(n));
if (!lesson) { console.error(`No lesson ${subject} ${n}`); process.exit(1); }

const NAMES: Record<Voice, string> = {
  en: 'ElevenLabs: mahmoud (English)', fusha: 'ElevenLabs: Mahmoud Fusha', eg: 'ElevenLabs: Mahmoud Egyptian',
  owner: 'The owner records these himself', reciter: 'Reciter (streamed, nothing to record)',
};
const pad = String(Number(n)).padStart(2, '0');
const clips = lesson.pages.flatMap((p, i) => (p.say ?? []).map((c) => ({ ...c, page: i + 1 })));
const out = [`# ${lesson.subjectTitle} · Lesson ${lesson.number}: voice clips`, '',
  `Save each file as \`public/curriculum/${subject}/audio/<file>\`.`, ''];
for (const v of Object.keys(NAMES) as Voice[]) {
  const list = clips.filter((c) => c.voice === v);
  if (!list.length) continue;
  out.push(`## ${NAMES[v]} (${list.length})`, '', '| File | Page | Text |', '|---|---|---|');
  for (const c of list) out.push(`| ${v === 'reciter' ? c.ayah : `l${pad}-${c.id}.mp3`} | ${c.page} | ${c.emotion ? `[${c.emotion}] ` : ''}${c.text} |`);
  out.push('');
}
console.log(out.join('\n'));
