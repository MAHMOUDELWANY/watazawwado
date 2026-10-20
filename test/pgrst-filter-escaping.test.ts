import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// A value placed inside a PostgREST or() filter must be quoted (pgrstValue) and, for ilike, have its wildcards
// escaped (escapeLike). Otherwise a stored email like "a_b@x.com" matches other families' rows, and a comma or
// parenthesis in the value can add filter clauses.
function sources(): string[] {
  const files = ['api/index.ts'];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.ts')) files.push(p);
    }
  };
  walk('server');
  return files;
}

describe('PostgREST filter values are escaped', () => {
  it('every ilike.${...} inside a filter string goes through pgrstValue', () => {
    const bad: string[] = [];
    for (const f of sources()) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/\.ilike\.\$\{([^}]*)\}/g)) {
          if (!m[1].includes('pgrstValue(') && !/^pattern$/.test(m[1].trim())) bad.push(`${f}:${i + 1} ${m[0]}`);
        }
      });
    }
    assert.deepStrictEqual(bad, []);
  });

  it('the teacher student-detail lookup escapes the stored email', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes('`contact_email.ilike.${pgrstValue(escapeLike(emailLower))}`'));
  });
});
