import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vercel runs api/index.ts as unbundled Node ESM ("type": "module"), so every runtime relative import
 * reachable from it needs an explicit .js extension. A missing one crashes the whole API at startup
 * (FUNCTION_INVOCATION_FAILED), while the local tsx dev server still works.
 */
describe('Server ESM imports', () => {
  it('every runtime relative import reachable from api/index.ts resolves under Node ESM', () => {
    const root = process.cwd();
    const seen = new Set<string>();
    const bad: string[] = [];
    // Skips `import type` / `export type`; write type-only imports that way so this check stays exact.
    const re = /^\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm;

    const walk = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const m of fs.readFileSync(file, 'utf8').matchAll(re)) {
        const spec = m[1];
        if (spec.endsWith('.json')) continue;
        const abs = path.resolve(path.dirname(file), spec);
        const target = spec.endsWith('.js')
          ? ['.ts', '.tsx', '.js'].map((ext) => abs.replace(/\.js$/, ext)).find((p) => fs.existsSync(p))
          : undefined;
        if (!target) bad.push(`${path.relative(root, file)} -> ${spec}`);
        else walk(target);
      }
    };

    walk(path.join(root, 'api/index.ts'));
    assert.deepStrictEqual(bad, [], `Add .js (or use import type) for these imports:\n${bad.join('\n')}`);
  });
});
