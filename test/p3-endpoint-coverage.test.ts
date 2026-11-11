import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { listRoutes } from './helpers/routes.js';

/**
 * P3 step 6: which endpoints does no test name? Every route is called by the permission matrix
 * (p3-auth-matrix), which proves its guard; this counts the routes whose own behaviour no test or e2e spec touches.
 * The number may only go down: a new route arrives with a test, or this fails.
 *
 *   npx tsx --test test/p3-endpoint-coverage.test.ts     prints the list (also kept in docs/testing/findings/P3.md)
 */

const BASELINE_UNNAMED = 85; // 2026-11-11: 285 routes, 200 named. Lower it when you cover a route.

const sources = ['test', 'e2e'].flatMap(dir => (fs.readdirSync(dir, { recursive: true }) as string[])
  .filter(f => /\.ts$/.test(f) && !/p3-(auth-matrix|endpoint-coverage)|helpers[\\/]routes/.test(f))
  .map(f => fs.readFileSync(path.join(dir, f), 'utf8'))).join('\n');

/** The route path as it appears in a test: literal, or with `${id}` / a real id where the route has `:param`. */
const mentioned = (routePath: string) => new RegExp(
  routePath.split(/(:\w+)/).map(part => part.startsWith(':') ? '(?:\\$\\{[^}]+\\}|[^/\'"`?\\s]+)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '(?![\\w/-])',
).test(sources);

test('P3 endpoint coverage: routes that no test names', () => {
  const routes = listRoutes();
  const unnamed = routes.filter(r => !mentioned(r.path));
  const share = Math.round(100 * (routes.length - unnamed.length) / routes.length);
  console.log(`\n${routes.length} routes, ${routes.length - unnamed.length} named by a test (${share}%), ${unnamed.length} only by the permission matrix:`);
  for (const r of unnamed) console.log(`  ${r.method.padEnd(6)} ${r.path}  [${r.guard}]  ${r.file}:${r.line}`);
  assert.ok(unnamed.length <= BASELINE_UNNAMED, `${unnamed.length} routes have no test of their own (baseline ${BASELINE_UNNAMED}). Add a test for the new route.`);
});
