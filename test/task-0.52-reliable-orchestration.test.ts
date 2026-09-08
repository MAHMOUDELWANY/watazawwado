import assert from 'node:assert';
import { describe, it } from 'node:test';
import { processIntegrationJobs } from '../server/integrations/worker.js';

describe('Task 0.52: Reliable Server-Side Orchestration', () => {
  it('should expose processIntegrationJobs', () => {
    assert.strictEqual(typeof processIntegrationJobs, 'function');
  });

  it('should return 0 when admin supabase is unavailable locally', async () => {
    const result = await processIntegrationJobs();
    assert.strictEqual(result, 0); // Since VITE_SUPABASE_URL isn't mocked here
  });
});
