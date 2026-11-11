/**
 * P3 integration tests: the real app in this process, acting as the project's QA accounts (docs/testing/RULES.md),
 * with the service role used only to read results. Nothing here needs a server on a port.
 *
 *   const q = await qa();           // null when the QA accounts or the env files are missing: skip the suite
 *   await q.call(token, 'POST', '/api/bookings/create', body)
 *
 * Accounts: QA_PROJECT (default p3), made by `npx tsx scripts/qa/create-accounts.ts p3`.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { loadEnv } from '../../scripts/qa/lib.js';

type Helpers = typeof import('../../e2e/helpers.js');
export type Qa = Helpers & { base: string; skipReason?: undefined };

let cached: Promise<Qa | null> | null = null;
export let skipReason = '';

export function qa(): Promise<Qa | null> {
  return (cached ||= (async () => {
    process.env.QA_PROJECT ||= 'p3';
    // Dev tokens stay available to the wider suite; these tests use real QA sessions.
    process.env.ALLOW_DEV_AUTH = 'true';
    if (process.env.NODE_ENV === 'production') process.env.NODE_ENV = 'development';
    try {
      loadEnv();
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_ANON_KEY) throw new Error('no Supabase keys in the env files');
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
