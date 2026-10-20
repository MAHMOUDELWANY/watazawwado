import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { nextStages } from '../src/dashboard/components/LeadsBoard.js';
import { ALLOWED_LEAD_TRANSITIONS, VALID_LEAD_STATUSES, isAllowedLeadTransition } from '../server/leadTransitions.js';

describe('CRM-02 pipeline board', () => {
  it('only offers moves the server accepts, never a move to the same stage', () => {
    for (const from of VALID_LEAD_STATUSES) {
      const next = nextStages(from);
      assert.ok(!next.includes(from), `${from} offers itself`);
      for (const to of next) assert.ok(isAllowedLeadTransition(from, to), `${from} → ${to} offered but refused by the server`);
      assert.strictEqual(next.length, ALLOWED_LEAD_TRANSITIONS[from].filter((s) => s !== from).length);
    }
    assert.deepStrictEqual(nextStages('trial_booked'), ['trial_completed', 'lost']);
    assert.deepStrictEqual(nextStages('nonsense'), []);
  });

  it('shows one column per lead status and a list/board switch', () => {
    const board = fs.readFileSync('src/dashboard/components/LeadsBoard.tsx', 'utf8');
    assert.ok(board.includes('VALID_LEAD_STATUSES.map('));
    assert.ok(board.includes("method: 'PATCH'"), 'moves go through the validated lead PATCH route');
    const page = fs.readFileSync('src/dashboard/pages/LeadsPage.tsx', 'utf8');
    assert.ok(page.includes('<LeadsBoard') && page.includes("t('Board', 'لوحة المراحل')"));
  });
});
