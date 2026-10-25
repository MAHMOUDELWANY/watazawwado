// Prints the preview query of every build step of a lesson, for shots.mjs: npx tsx scripts/curriculum/steps.ts <subject> <lesson>
import { findLesson } from '../../src/curriculum/catalog';
const [subject, n] = process.argv.slice(2);
const l = findLesson(subject, Number(n))!;
const out: string[] = [];
l.pages.forEach((p, i) => { const t = p.lines.length + (p.items?.length || 0) + (p.evidence ? 1 : 0) + (p.interaction ? 1 : 0); for (let s = 0; s <= t; s++) out.push(`subject=${subject}&lesson=${n}&p=${i}&s=${s}`); });
console.log(out.join('\n'));
