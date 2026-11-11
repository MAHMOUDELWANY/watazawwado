/**
 * P3 integration tests: the real app in this process, acting as the project's QA accounts (docs/testing/RULES.md),
 * with the service role used only to read results. Nothing here needs a server on a port.
 *
 *   const q = await qa();           // null when the QA accounts or the env files are missing: skip the suite
 *   await q.call(token, 'POST', '/api/bookings/create', body)
 *
 * Accounts: QA_PROJECT (default p3), made by `npx tsx scripts/qa/create-accounts.ts p3`.
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { loadEnv } from '../../scripts/qa/lib.js';

type Helpers = typeof import('../../e2e/helpers.js');
export type Qa = Helpers & { base: string; skipReason?: undefined };

let cached: Promise<Qa | null> | null = null;
export let skipReason = '';

/**
 * `node --test` runs the test files side by side, and every file here books, pays and resets as the same few QA
 * accounts. One file at a time: a lock folder per project, held until this process ends.
 */
async function takeTurn(project: string): Promise<void> {
  const lock = path.join(os.tmpdir(), `watazawwado-qa-${project}.lock`);
  for (let waited = 0; ; waited += 500) {
    try {
      fs.mkdirSync(lock);
      process.on('exit', () => { try { fs.rmdirSync(lock); } catch { /* already gone */ } });
      return;
    } catch {
      // A run that was killed leaves its lock behind; no file here needs more than a few minutes.
      const age = Date.now() - (fs.statSync(lock, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
      if (age > 10 * 60_000) { try { fs.rmdirSync(lock); } catch { /* another file took it */ } continue; }
      if (waited > 20 * 60_000) throw new Error('another QA test run holds the accounts');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

export function qa(): Promise<Qa | null> {
  return (cached ||= (async () => {
    process.env.QA_PROJECT ||= 'p3';
    // Dev tokens stay available to the wider suite; these tests use real QA sessions.
    process.env.ALLOW_DEV_AUTH = 'true';
    if (process.env.NODE_ENV === 'production') process.env.NODE_ENV = 'development';
    try {
      loadEnv();
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_ANON_KEY) throw new Error('no Supabase keys in the env files');
      await takeTurn(process.env.QA_PROJECT);
      const app = (await import('../../api/index.js')).default;
      const server = http.createServer(app);
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      server.unref();
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      process.env.QA_BASE_URL = base;
      const h = await import('../../e2e/helpers.js');
      await h.qaIds();
      return { ...h, base } as Qa;
    } catch (err: any) {
      skipReason = `QA accounts unavailable (${String(err?.message || err).slice(0, 120)})`;
      return null;
    }
  })());
}

/** Routes only Stripe's API to `handler`; everything else (Supabase, our own server) goes out as usual. */
export function stubStripe(handler: (path: string, init: RequestInit | undefined) => { status?: number; json: unknown }): () => void {
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input?.url || String(input);
    if (!url.startsWith('https://api.stripe.com/')) return real(input, init);
    const r = handler(url.slice('https://api.stripe.com'.length), init);
    return new Response(JSON.stringify(r.json), { status: r.status || 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
  return () => { globalThis.fetch = real; };
}
