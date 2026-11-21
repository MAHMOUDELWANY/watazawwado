import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (f: string) => readFileSync(f, 'utf8');

test('More menu: main page plus pushed devices, fixes and keys pages (owner-approved 2026-11-21)', () => {
  const m = read('src/classroom/parts/MoreMenu.tsx');
  for (const page of ["page === 'main'", "page === 'devices'", "page === 'help'", "page === 'keys'"]) assert.match(m, new RegExp(page.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(m, /FocusTrap onEscape=\{p\.onClose\}/, 'Esc closes the menu');
  assert.match(m, /role="switch"/);
  // Palette rule: no green anywhere.
  assert.doesNotMatch(m, /#(?:16A34A|22C55E|10B981|0F766E|15803D)|\bgreen-/i);
});

test('the bar opens the new menu; raise hand stays on the bar, the other signals move into More', () => {
  const tb = read('src/classroom/parts/Toolbar.tsx');
  assert.match(tb, /renderMore\?\.\(close,/);
  assert.match(tb, /onReact\('hand'\)/);
  assert.doesNotMatch(tb, /moreItems/);
  const room = read('src/classroom/ClassroomPage.tsx');
  assert.match(room, /<MoreMenu kind=/);
  assert.match(room, /replaceLocalTrack\(kind, track\)/, 'devices swap mid-lesson');
  assert.match(room, /speakerId=\{speakerId \?\? ready\?\.speakerId\}/, 'the speaker picked in More is used');
});

test("teacher's Zoom switch reuses an accepted incident kind (no migration)", () => {
  const room = read('src/classroom/ClassroomPage.tsx');
  assert.match(room, /kind: 'engine_error', detail: \{ manual: true \}/);
  assert.match(read('server/classroom/incidents.ts'), /CLIENT_INCIDENT_KINDS[^\n]*'engine_error'/);
});
