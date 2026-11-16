import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUBJECTS, GROUPS } from '../src/curriculum/catalog';

// Owner (2026-10-27, again 2026-11-16): every door has its own picture, no two versions or levels share a cover,
// and every road-map stage has its own landmark (docs/curriculum/BANNER-PROMPTS.md, LANDMARK-PROMPTS.md).
describe('Curriculum art', () => {
  const doors = [...SUBJECTS, ...GROUPS] as { id: string; art?: string }[];

  it('no two doors share a cover', () => {
    const seen = new Map<string, string>();
    for (const d of doors) {
      if (!d.art) continue;
      assert.ok(!seen.has(d.art), `${d.id} reuses the cover of ${seen.get(d.art)} (${d.art})`);
      seen.set(d.art, d.id);
    }
  });

  it('every cover file exists', () => {
    for (const d of doors) if (d.art) assert.ok(fs.existsSync(`public${d.art}`), `${d.id}: missing ${d.art}`);
  });

  it('every road-map stage has its landmark', () => {
    for (const s of SUBJECTS) (s.parts ?? []).forEach((_, i) => {
      const f = `public/curriculum/landmarks/${s.id}-s${i + 1}.webp`;
      assert.ok(fs.existsSync(f), `${s.id}: missing landmark ${f}`);
    });
  });
});
