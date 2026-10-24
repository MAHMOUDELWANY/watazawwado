// Prints a lesson's pages as text (title, ayah/hadith meaning, lines, items, question) for an audit.
// Usage: tsx scripts/curriculum/dump.ts zad-kids:1 zad-teens:2
import { SUBJECTS } from '../../src/curriculum/catalog';
const want = process.argv.slice(2);
for (const s of SUBJECTS) for (const l of Object.values(s.lessons)) {
  if (!want.includes(`${l.subject}:${l.number}`)) continue;
  console.log(`\n## ${l.subject} L${l.number} ${l.title}`);
  l.pages.forEach((p, i) => {
    console.log(`p${i} ${p.title} [${p.layout}/${p.scene}]`);
    if (p.evidence) console.log(`   EV ${p.evidence.reference}: ${p.evidence.meaning}`);
    p.lines.forEach((x) => console.log(`   - ${x}`));
    if (p.items) console.log(`   items: ${p.items.join(' | ')}`);
    if (p.interaction) console.log(`   ? ${p.interaction.kind}: ${p.interaction.prompt}`);
  });
}
