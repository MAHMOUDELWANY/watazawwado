import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS, GROUPS, tracksOf } from '../src/curriculum/catalog';

// docs/superpowers/specs/2026-10-25-subjects-curricula-design.md §2: the curricula beyond the Zad Path.
describe('Curriculum catalog', () => {
  it('new groups exist', () => {
    const ids = GROUPS.map((g) => g.id);
    for (const id of ['literacy', 'quran', 'fusha', 'seerah']) assert.ok(ids.includes(id), `missing group ${id}`);
  });

  it('every track belongs to a group', () => {
    for (const s of SUBJECTS) assert.ok(GROUPS.some((g) => g.id === s.group), `${s.id} has unknown group ${s.group}`);
  });

  it('every group shows at least one track or planned version', () => {
    for (const g of GROUPS) assert.ok(tracksOf(g.id).length + g.planned.length > 0, `${g.id} would be an empty door`);
  });

  it('Seerah plans two versions', () => {
    const seerah = GROUPS.find((g) => g.id === 'seerah')!;
    const all = [...seerah.planned.map((p) => [p.version, p.audience]), ...tracksOf('seerah').map((t) => [t.version, t.audience])];
    assert.deepEqual(all.map(([v, a]) => `${v}|${a}`).sort(), ['Kids|6–11', 'Teens & Adults|12+']);
  });
});
