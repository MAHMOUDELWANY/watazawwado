import { it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// 2026-11-20 outage: one extensionless value import (`from './roomTools'`) reachable from api/index.ts crashed every
// production API route (Vercel runs real Node ESM; tsx resolves it, so local tests passed). Every relative value import
// the server reaches must name its `.js` file.
it('every relative value import reachable from api/index.ts has a .js extension', () => {
  const seen = new Set<string>();
  const bad: string[] = [];
  const resolve = (from: string, spec: string) => {
    const b = path.resolve(path.dirname(from), spec);
    for (const c of [b, b.replace(/\.js$/, '.ts'), b.replace(/\.js$/, '.tsx'), `${b}.ts`, `${b}.tsx`, `${b}/index.ts`]) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
  };
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/^(?:import|export)\s+(?!type\b)([^;]*?)\s+from\s+'(\.[^']+)'/gms)) {
      const clause = m[1].trim();
      const spec = m[2];
      const onlyTypes = /^\{[^}]*\}$/s.test(clause) && clause.slice(1, -1).split(',').every((x) => !x.trim() || /^type\s/.test(x.trim()));
      if (onlyTypes) continue;
      if (!/\.(js|json)$/.test(spec)) bad.push(`${path.relative('.', file)} -> ${spec}`);
      const next = resolve(file, spec);
      if (next && /\.tsx?$/.test(next)) walk(next);
    }
  };
  walk(path.resolve('api/index.ts'));
  assert.ok(seen.size > 100, `walked ${seen.size} files`);
  assert.deepStrictEqual(bad, []);
});
