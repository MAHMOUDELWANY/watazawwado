// Prints every page of a lesson with its build shape and any 5-word run a line shares with the page's ayah/hadith.
import { SUBJECTS } from '../../src/curriculum/catalog';
const LESSONS = SUBJECTS.flatMap((s) => Object.values(s.lessons));
const words = (t: string) => t.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
const want = process.argv.slice(2);
for (const l of LESSONS) {
  if (want.length && !want.includes(`${l.subject}:${l.number}`)) continue;
  console.log(`\n## ${l.subject} L${l.number} ${l.title} (${l.pages.length} pages, reviewed ${l.reviewed})`);
  l.pages.forEach((p, i) => {
    const m = p.evidence ? words(p.evidence.meaning) : [];
    const runs = new Set(m.map((_, k) => m.slice(k, k + 5).join(' ')).filter((r) => r.split(' ').length === 5));
    const hits = p.lines.flatMap((line) => { const w = words(line); const h = w.map((_, k) => w.slice(k, k + 5).join(' ')).find((r) => runs.has(r)); return h ? [h] : []; });
    console.log(`p${i} [${p.station}/${p.layout}/${p.scene}] ${p.title} | lines ${p.lines.length} items ${p.items?.length ?? 0} ev ${p.evidence ? 'Y' : '-'} ia ${p.interaction?.kind ?? '-'}${p.optional ? ' OPT' : ''}${hits.length ? ' REPEAT: ' + hits.join(' / ') : ''}`);
  });
}
