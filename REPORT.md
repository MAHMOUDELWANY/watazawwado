### Root Cause
The Vercel Serverless function at `/api/cron/process-reminders` failed to load and consistently returned HTTP 500 (with `FUNCTION_INVOCATION_FAILED` in the Vercel logs) due to an `ERR_MODULE_NOT_FOUND` error. The backend entrypoint `api/index.ts` was improperly importing `../src/lib/supabase`, a frontend-specific module which relies on Vite's `import.meta.env` pattern. Since Vercel's Node.js runtime compiles the backend to CommonJS, `import.meta` is unavailable and the module resolution correctly aborted startup.

### Exact files changed
- `api/index.ts`: Removed the frontend module import `import { supabase, isSupabaseConfigured } from '../src/lib/supabase';`. Modified the `/api/packages` endpoint to use the existing `getSupabaseAdminClient()` function instead.

### Why the fix is architecturally correct
This fix removes a leaky architectural boundary where backend/serverless API code relied on a frontend-bundled module. By using the dedicated `getSupabaseAdminClient()` already initialized at the top of the file, the server-side code correctly uses standard Node environment variables (`process.env`) instead of Vite's frontend build tooling (`import.meta.env`).

### DB Change Required
None. This was purely a server runtime/module packaging issue.

### Local Validations
- **Lint result**: Passed (`npm run lint` -> `tsc --noEmit`).
- **Build result**: Passed (`npm run build`). Warning about `import.meta` now only pertains to the actual frontend code inside `dist`.
- **Test result**: Passed.
- **Serverless/Vercel artifact validation**: Verifying `npm run build` esbuild outputs confirms the backend API bundled output `dist/server.cjs` no longer crashes on initialization due to `ERR_MODULE_NOT_FOUND` on startup since it uses Node environment modules appropriately.

### Production Deployment Result
PENDING DEPLOYMENT (Awaiting human PR merge).

### Production Cron endpoint HTTP status
UNTESTED (Awaiting deployment).

### Testing cron-job.org
The `cron-job.org` scheduler should ONLY be tested once the deployed `/api/cron/process-reminders` endpoint can successfully be hit manually and returns `HTTP 200` (or `401` if requested without headers) rather than `500 FUNCTION_INVOCATION_FAILED`.

### Any NEW error
None observed during build.
