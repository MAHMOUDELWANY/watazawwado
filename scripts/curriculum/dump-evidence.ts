// Prints every page that carries an ayah or hadith, with its lines, items, question and teacher notes (for text audits).
import { SUBJECTS } from '../../src/curriculum/catalog';
const want = process.argv.slice(2);
for (const s of SUBJECTS) for (const l of Object.values(s.lessons)) {
  if (!want.includes(`${l.subject}:${l.number}`)) continue;
  l.pages.forEach((p, i) => {
    if (!p.evidence) return;
    console.log(`\n### ${l.subject} L${l.number} p${i} ${p.title} [${p.layout}${p.contextFirst ? ' ctx' : ''}]`);
    console.log(`EV ${p.evidence.meaning}`);
    p.lines.forEach((x) => console.log(`- ${x}`));
    if (p.items) console.log(`items: ${p.items.join(' | ')}`);
    if (p.interaction) console.log(`? ${p.interaction.kind}: ${p.interaction.prompt}${'reveal' in p.interaction && p.interaction.reveal ? ' => ' + p.interaction.reveal : ''}`);
    p.explain.forEach((x) => console.log(`  ex: ${x}`));
  });
}
