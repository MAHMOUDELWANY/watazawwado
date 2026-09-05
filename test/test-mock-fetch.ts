import { test } from 'node:test';
import * as assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';

test('mock fetch works with supabase', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    return {
      ok: false,
      status: 400,
      json: async () => ({ message: 'SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT' }),
      text: async () => JSON.stringify({ message: 'SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT' }),
      headers: new Headers({
        'content-type': 'application/json'
      })
    } as any;
  };

  const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key', {
    global: { fetch: globalThis.fetch }
  });
  const { error } = await supabase.from('payments').insert({ amount: 10 });
  
  globalThis.fetch = originalFetch;
  console.log(error);
});
