import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// QA-03: margins/paddings follow the reading direction, and accessible names follow the language.
function tsx(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? tsx(p) : p.endsWith('.tsx') ? [p] : [];
  });
}
// The curriculum slides are a fixed 16:9 canvas laid out on purpose; everything else uses logical sides.
const files = tsx('src').filter((f) => !f.includes(`${path.sep}curriculum${path.sep}`));

describe('QA-03 RTL and bilingual', () => {
  it('no physical ml-/mr-/pl-/pr- or text-left/right outside rtl: overrides', () => {
    const bad: string[] = [];
    for (const f of files) {
      fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
        for (const m of line.matchAll(/(?<![-\w:[])((?:sm|md|lg|xl|hover|group-hover):)*(ml|mr|pl|pr)-[\w.[\]]+|(?<![-\w:])text-(left|right)\b/g)) {
          // Select.tsx pairs pr-10 with rtl:pl-10 explicitly.
          if (/rtl:(pl|pr|ml|mr)-/.test(line)) continue;
          bad.push(`${f}:${i + 1} ${m[0]}`);
        }
      });
    }
    assert.deepStrictEqual(bad, []);
  });

  it('accessible names are not hard-coded in English', () => {
    const bad: string[] = [];
    for (const f of files) {
      if (f.includes('TeacherAuthDiagnosticPanel')) continue; // internal diagnostics, opt-in only
      fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
        const m = line.match(/aria-label="([A-Za-z][^"]*)"/);
        if (m && !/^Watazawwado/.test(m[1])) bad.push(`${f}:${i + 1} ${m[0]}`);
      });
    }
    assert.deepStrictEqual(bad, []);
  });
});
