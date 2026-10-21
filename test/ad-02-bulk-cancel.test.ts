import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { bulkCancelable } from '../src/dashboard/components/BulkCancelBar.js';

const now = Date.parse('2026-10-21T12:00:00Z');

describe('AD-02 bulk cancel', () => {
  it('only lessons still ahead and not finished can be picked', () => {
    assert.strictEqual(bulkCancelable({ status: 'confirmed', scheduled_start: '2026-10-22T10:00:00Z' }, now), true);
    assert.strictEqual(bulkCancelable({ status: 'pending', scheduled_start: '2026-10-22T10:00:00Z' }, now), true);
    assert.strictEqual(bulkCancelable({ status: 'confirmed', scheduled_start: '2026-10-20T10:00:00Z' }, now), false, 'past');
    for (const s of ['cancelled', 'completed', 'no_show']) assert.strictEqual(bulkCancelable({ status: s, scheduled_start: '2026-10-22T10:00:00Z' }, now), false, s);
  });

  it('reuses the single-lesson request for each lesson, with a reason, for the super admin only', () => {
    const bar = fs.readFileSync('src/dashboard/components/BulkCancelBar.tsx', 'utf8');
    assert.ok(bar.includes("dashboardFetch(`/api/dashboard/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', cancellation_reason: reason.trim() }) })"));
    assert.ok(bar.includes('if (reason.trim().length < 3) return;'));
    const page = fs.readFileSync('src/dashboard/pages/BookingsPage.tsx', 'utf8');
    assert.ok(page.includes('{isSuperAdmin && bulkCancelable(b) && ('));
    assert.ok(page.includes('{isSuperAdmin && (\n                <BulkCancelBar') || page.includes('{isSuperAdmin && (\r\n                <BulkCancelBar'));
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes("if (!isAdminActor && status === 'cancelled')"), 'the server still refuses cancels from teachers');
  });
});
