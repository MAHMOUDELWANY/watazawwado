/**
 * In-memory stand-in for the Supabase query builder, covering the calls the classroom after-lesson code makes
 * (select/insert/upsert/update/delete with eq/in/not/gte/lte/lt/order/limit, maybeSingle, rpc, storage).
 */
export function fakeDb(tables: Record<string, any[]>, opts: { rpc?: Record<string, (args: any) => any>; files?: Record<string, string[]> } = {}) {
  const rows = (t: string) => (tables[t] ||= []);
  const calls: Array<{ fn: string; args: any }> = [];
  return {
    tables,
    calls,
    async rpc(fn: string, args: any) {
      calls.push({ fn, args });
      const impl = opts.rpc?.[fn];
      if (!impl) return { data: null, error: { message: `no rpc ${fn}` } };
      try { return { data: impl(args), error: null }; } catch (e: any) { return { data: null, error: { message: e.message } }; }
    },
    storage: {
      from: (_bucket: string) => ({
        list: async (prefix: string) => ({ data: (opts.files?.[prefix] || []).map((name) => ({ name, metadata: { size: 1000, mimetype: name.endsWith('.pdf') ? 'application/pdf' : 'image/png' } })), error: null }),
        createSignedUrl: async (path: string, seconds: number) => ({ data: { signedUrl: `https://signed/${path}?s=${seconds}` }, error: null }),
      }),
    },
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let op: 'select' | 'update' | 'delete' = 'select';
      let patch: any = null;
      let sortBy: { c: string; asc: boolean } | null = null;
      let max = Infinity;
      const run = () => {
        let out = rows(t).filter((r) => filters.every((f) => f(r)));
        if (op === 'update') for (const r of out) Object.assign(r, patch);
        if (op === 'delete') tables[t] = rows(t).filter((r) => !out.includes(r));
        if (sortBy) { const { c, asc } = sortBy; out = [...out].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
        return out.slice(0, max).map((r) => ({ ...r }));
      };
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        neq: (c: string, v: any) => { filters.push((r) => r[c] !== v); return b; },
        in: (c: string, v: any[]) => { filters.push((r) => v.includes(r[c])); return b; },
        not: (c: string, _op: string, v: any) => { filters.push((r) => r[c] !== v && r[c] !== undefined); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        gte: (c: string, v: any) => { filters.push((r) => r[c] >= v); return b; },
        lte: (c: string, v: any) => { filters.push((r) => r[c] <= v); return b; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return b; },
        order: (c: string, o?: { ascending?: boolean }) => { sortBy = { c, asc: o?.ascending !== false }; return b; },
        limit: (n: number) => { max = n; return b; },
        maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
        insert: async (row: any) => { rows(t).push(...(Array.isArray(row) ? row : [row]).map((r) => ({ ...r }))); return { error: null }; },
        upsert: async (row: any, o: { onConflict: string; ignoreDuplicates?: boolean }) => {
          const keys = o.onConflict.split(',');
          for (const r of Array.isArray(row) ? row : [row]) {
            const i = rows(t).findIndex((x) => keys.every((k) => x[k] === r[k]));
            if (i < 0) rows(t).push({ ...r }); else if (!o.ignoreDuplicates) rows(t)[i] = { ...rows(t)[i], ...r };
          }
          return { error: null };
        },
        update: (p: any) => { op = 'update'; patch = p; return b; },
        delete: () => { op = 'delete'; return b; },
        then: (ok: any, ko: any) => Promise.resolve().then(() => ({ data: run(), error: null })).then(ok, ko),
      };
      return b;
    },
  };
}
