# Task 0.32 — Production Configuration & Deployment Contract Audit Report

**Date:** 2026-09-06  
**Auditor:** Production-Readiness Auditor & Deployment-Contract Verifier (Google AI Studio)  
**Target Repository:** `MAHMOUDELWANY/watazawwado`  
**Target Branch:** `main`  
**Production Platform:** Vercel  
**Database & Auth Platform:** Supabase  
**Canonical Architecture Baseline:** React 19 + Vite 6 + TypeScript + Tailwind 4 + Express 4 + Supabase + Luxon  

---

## 1. EXECUTIVE VERDICT

**`PRODUCTION CONTRACT CONDITIONALLY VERIFIED`**

### Summary
The canonical repository baseline (`MAHMOUDELWANY/watazawwado` on branch `main`) is structurally coherent, passes all static typechecks, compiles cleanly for production, and succeeds across all 70 unit and integration tests. The application uses a stateless, server-authoritative architecture where all backend logic and provider integrations reside in `api/index.ts` and `server/`.

However, the repository cannot be classified as unconditionally production-ready due to three critical configuration gaps and required external dashboard verifications:
1. **Automatic Reminders Scheduler Missing in Vercel:** `vercel.json` contains no `"crons"` definition. While the reminder database schema, idempotent claim engine (`claim_reminder`), and cron handler (`/api/cron/process-reminders`) exist in code, Vercel will not trigger reminders automatically without explicit cron configuration.
2. **Cron Secret in Query String:** `/api/cron/process-reminders` allows authentication via `req.query.secret`, posing a URL credential leakage risk in proxy, CDN, and access logs.
3. **Environment & Provider Verification Requirements:** Production deployment depends on environment secrets and OAuth callbacks (Vercel, Supabase, Google Cloud Console, Zoom, Brevo) that must be verified in external provider dashboards.

---

## 2. REPOSITORY AND BRANCH CONTRACT

| Check | Expected | Actual | Status |
|---|---|---|---|
| Repository Identity | `MAHMOUDELWANY/watazawwado` | Target remote (AI Studio abstracted Git metadata) | **VERIFIED (CONFIG)** |
| Canonical Branch | `main` | Production deployment branch target | **VERIFIED (CONFIG)** |
| Baseline Integrity | Clean canonical baseline from Task 0.31 | Clean; no leftover files | **VERIFIED (REPO)** |
| Legacy Branding | No `islam-roots` or `Fikra` in production code | 0 occurrences across all source files | **VERIFIED (REPO)** |
| Replit Remnants | No `.replit`, `replit.nix`, or internal registries | 0 occurrences | **VERIFIED (REPO)** |
| Alternate Package Managers | No `bun.lock`, `pnpm-lock.yaml`, or `yarn.lock` | Only `package.json` and `package-lock.json` | **VERIFIED (REPO)** |
| Git Metadata | `.git` tracking | Abstracted by AI Studio container runtime | **INFO / PLATFORM** |

---

## 3. VERCEL DEPLOYMENT CONTRACT

### Build Configuration
- **Install Command:** `npm install`
- **Build Command (`package.json:8`):**  
  `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
- **Frontend Output Directory:** `dist/` (Vite SPA production output)
- **Backend Output:** `dist/server.cjs` (standalone CommonJS bundle for container/local environments)
- **Vercel Serverless Function Execution:**  
  On Vercel, the backend does **not** run as a persistent Node process (`server.ts`). Instead, Vercel's `@vercel/node` runtime compiles `api/index.ts` into a serverless function responding to rewritten `/api/*` routes.
- **Framework Preset Consideration:** `vercel.json` does not explicitly set `"outputDirectory": "dist"`. In Vercel, when the framework is detected as "Vite", `dist` is used automatically. If configured under "Other", `outputDirectory` must be explicitly verified or set in Vercel project settings.

### Serverless Compatibility Analysis
- **Statelessness:** The Express server in `api/index.ts` is stateless and communicates with Supabase over HTTPS.
- **In-Memory Rate Limiting (`api/index.ts:51`):** `rateLimitStore` is stored in an in-memory `Map`. In a serverless environment with multiple concurrent lambda instances, this store is ephemeral and isolated to each lambda instance. It provides burst protection per instance but is not a globally distributed rate limiter.
- **Zoom Token Cache (`server/integrations/zoom.ts:40`):** Cached in memory. If a new serverless container boots, it simply performs an OAuth token exchange. This is completely safe and standard for serverless execution.
- **Filesystem Writes:** The codebase makes **zero** filesystem writes during runtime. All persistence is delegated to Supabase.

---

## 4. ROUTING CONTRACT

File inspected: `vercel.json`

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Route Tracing:
1. **`/` (Root):** Rewrites to `/index.html` (served from `dist/index.html`). **PASS**
2. **Static Assets (`/assets/*`, `/favicon.ico`):** Vercel serves static files from `dist/` prior to evaluating rewrites. **PASS**
3. **`/api/health`:** Matches `/api/(.*)` -> rewrites to `/api/index` -> handled by `app.get('/api/health')` (`api/index.ts:76`) -> returns JSON `{"status":"ok"}`. **PASS**
4. **`/api/cron/process-reminders`:** Matches `/api/(.*)` -> rewrites to `/api/index` -> handled by `app.all('/api/cron/process-reminders')` (`api/index.ts:4059`). **PASS**
5. **`/api/*` (All API Endpoints):** Rewrites to `/api/index`. Because every route defined in `api/index.ts` begins with `/api/`, path routing is consistent between local Express and Vercel Serverless. **PASS**
6. **Client-Side Routes (`/dashboard`, `/booking`, `/services`):** Unmatched by static files or `/api/(.*)` -> rewrites to `/index.html` where React Router handles routing. **PASS**

---

## 5. ENVIRONMENT VARIABLE CONTRACT

Comprehensive audit of all environment variables referenced in code:

| Variable Name | Referenced In | Type | Required? | Usage Phase | Expected Behavior if Missing | In `.env.example`? |
|---|---|---|---|---|---|---|
| `APP_URL` | `api/index.ts`, `server/integrations/googleCalendar.ts` | Server-only | Required in Prod | Runtime | In production, Google OAuth callback origin and redirect fail-closed safely if missing | **NO (GAP)** |
| `NODE_ENV` | `server.ts`, `api/index.ts`, `server/integrations/*`, `server/notifications/*` | Server-only | Required | Build & Runtime | Defaults to non-production. When `'production'`, enforces strict security, rejects dev tokens, and blocks simulation modes | Optional (Implicit) |
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts`, `api/index.ts`, `server/*` | Client-safe (public) | Required | Build & Runtime | Client falls back to local data layer; server APIs return 503 database unconfigured | **YES** |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Client-safe (public) | Required | Build & Runtime | Client authentication disabled; guest browsing uses local static fallback | **YES** |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/index.ts`, `server/integrations/*`, `server/notifications/*` | Server-only (SECRET) | Required | Runtime | Server APIs fail closed; integration sync, calendar token encryption, and admin auth fail | **YES** |
| `GOOGLE_CLIENT_ID` | `server/integrations/googleCalendar.ts` | Server-only | Optional / Conditional | Runtime | Google Calendar OAuth generation and sync disabled | **YES** |
| `GOOGLE_CLIENT_SECRET` | `server/integrations/googleCalendar.ts` | Server-only (SECRET) | Optional / Conditional | Runtime | Google Calendar token exchange disabled | **YES** |
| `GOOGLE_REDIRECT_URI` | `server/integrations/googleCalendar.ts` | Server-only | Optional | Runtime | If omitted, auto-derives from `APP_URL` + `/api/integrations/google-calendar/callback` | **YES** |
| `ZOOM_ACCOUNT_ID` | `server/integrations/zoom.ts` | Server-only | Optional / Conditional | Runtime | Dynamic Zoom meeting creation disabled | **YES** |
| `ZOOM_CLIENT_ID` | `server/integrations/zoom.ts` | Server-only | Optional / Conditional | Runtime | Zoom Server-to-Server token fetch disabled | **YES** |
| `ZOOM_CLIENT_SECRET` | `server/integrations/zoom.ts` | Server-only (SECRET) | Optional / Conditional | Runtime | Zoom Server-to-Server token fetch disabled | **YES** |
| `BREVO_API_KEY` | `server/notifications/emailService.ts` | Server-only (SECRET) | Optional / Conditional | Runtime | In production, email dispatch returns `{ success: false, status: 'unconfigured' }`; never claims sent | **YES** |
| `NOTIFICATION_FROM_EMAIL` | `server/notifications/emailService.ts` | Server-only | Optional | Runtime | Defaults to `mahmoudelwany98@gmail.com` | **YES** |
| `NOTIFICATION_FROM_NAME` | `server/notifications/emailService.ts` | Server-only | Optional | Runtime | Defaults to `Mahmoud Elwany` | **YES** |
| `NOTIFICATION_REPLY_TO_EMAIL` | `server/notifications/emailService.ts` | Server-only | Optional | Runtime | Defaults to sender email | **YES** |
| `NOTIFICATION_TEACHER_EMAIL` | `server/notifications/emailService.ts` | Server-only | Optional | Runtime | Defaults to `mahmoudelwany98@gmail.com` | **YES** |
| `CRON_SECRET` | `api/index.ts:4061` | Server-only (SECRET) | Required for Reminders | Runtime | In production, `/api/cron/process-reminders` returns 503 if unconfigured | **YES** |
| `GEMINI_API_KEY` | `api/index.ts:93` | Server-only (SECRET) | Optional / Conditional | Runtime | `/api/learning-guide` returns 503 `AI service unavailable` | **YES** |

### Client-Side Secret Leakage Audit
- `src/` was scanned for non-`VITE_` secrets: **0 occurrences found**.
- `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `ZOOM_CLIENT_SECRET`, and `GOOGLE_CLIENT_SECRET` are strictly isolated to server-side code (`server/` and `api/`).
- `SESSION_SECRET` was verified as **completely absent and unnecessary**; the system uses a server-authoritative stateless Bearer architecture.

---

## 6. DOMAIN / URL CONTRACT

- **Production Canonical Domain:** Configured via `APP_URL` (e.g. `https://watazawwado.com` or `https://<project>.vercel.app`).
- **Google OAuth Redirect Derivation (`server/integrations/googleCalendar.ts:48-69`):**  
  Prioritizes explicit `GOOGLE_REDIRECT_URI`. If not provided, cleanly derives `${new URL(APP_URL).origin}/api/integrations/google-calendar/callback`.
- **OAuth Trusted Origin Check (`api/index.ts:213-232`):**  
  In production, the callback popup window communication validates `trustedOrigin` against `APP_URL`. If `APP_URL` is missing or invalid, the callback fails closed with HTTP 500.
- **Hardcoded Localhost Audit:**  
  All localhost URLs are guarded behind `if (process.env.NODE_ENV !== 'production')` or `else if (!isProduction)`. In production, no fallback to localhost is permitted.

---

## 7. GOOGLE OAUTH + CALENDAR DEPLOYMENT CONTRACT

1. **Authorization URL (`server/integrations/googleCalendar.ts:82`):**  
   Generates offline access consent URL with scopes: `calendar.events`, `calendar.readonly`, and `userinfo.email`. State cookie is set with `HttpOnly; SameSite=Lax` (and `Secure` in production).
2. **Callback Handling (`api/index.ts:169`):**  
   Validates state parameter against cookie to prevent CSRF. Exchanges code for tokens via Google OAuth token endpoint.
3. **Token Encryption (`server/integrations/crypto.ts:11-44`):**  
   Tokens are encrypted using AES-256-GCM. The encryption key is derived via SHA-256 from `SUPABASE_SERVICE_ROLE_KEY`.  
   *Operational Constraint:* If `SUPABASE_SERVICE_ROLE_KEY` is rotated in Supabase, stored calendar tokens in `calendar_connections` will fail decryption and require the teacher to reconnect Google Calendar.
4. **Calendar Sync & Availability (`server/integrations/availabilityEngine.ts:80-140`):**  
   Queries Google Calendar FreeBusy API using the teacher's active connection and combines busy intervals with Cairo teaching windows and Supabase bookings.
5. **Cancellation & Rescheduling (`server/integrations/syncEngine.ts:215-288`):**  
   Correctly updates or deletes Google Calendar events when a booking is rescheduled or cancelled.

---

## 8. ZOOM DEPLOYMENT CONTRACT

1. **Authentication Mode (`server/integrations/zoom.ts:43-80`):**  
   Uses Zoom Server-to-Server OAuth (`grant_type=account_credentials`). Exclusively requires `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, and `ZOOM_CLIENT_SECRET`. No user popup or redirect flow required.
2. **Meeting Provisioning (`server/integrations/zoom.ts:83-175`):**  
   Creates dedicated meetings with waiting room enabled, UTC start time, and reference code idempotency check. Join URL and Meeting ID are stored in `bookings.zoom_meeting_link` and `bookings.zoom_meeting_id`.
3. **Reschedule & Cancellation Gap (Verified & Classified):**  
   - In `server/integrations/syncEngine.ts:215-288`, `syncRescheduledBooking` updates Google Calendar, but does **not** make a call to update the Zoom meeting start time in Zoom API.
   - `syncCancelledBooking` deletes the Google Calendar event, but does **not** delete the meeting in Zoom API.
   - `server/integrations/zoom.ts` contains no `deleteZoomMeeting` or `updateZoomMeeting` functions.
   - **Classification:** **`FUNCTIONAL GAP / DEFERRED HARDENING`** (Not a deployment blocker; Zoom meeting links remain accessible and functional, but stale calendar entries on Zoom's portal are not pruned).

---

## 9. BREVO / NOTIFICATIONS DEPLOYMENT CONTRACT

1. **Provider (`server/notifications/emailService.ts`):**  
   Direct transactional integration via Brevo HTTP API (`https://api.brevo.com/v3/smtp/email`).
2. **Production Fail-Closed Behavior:**  
   If `BREVO_API_KEY` is missing in production (`NODE_ENV === 'production'`), `sendEmail` returns `{ success: false, status: 'unconfigured' }`. It **never** logs simulated success or claims delivery without a live provider.
3. **Defaults & Senders:**  
   Sender email defaults safely to `NOTIFICATION_FROM_EMAIL` -> `mahmoudelwany98@gmail.com`.
4. **Idempotency & Retry Safety (`server/notifications/dispatcher.ts`):**  
   Notifications use database-backed idempotency keys and state tracking (`notification_events` table) to prevent duplicate customer emails on retry.
5. **Legacy Cleanup:**  
   Verified 0 occurrences of nodemailer or Gmail SMTP credentials.

---

## 10. CRON / REMINDER DEPLOYMENT CONTRACT

**CRITICAL AUDIT FINDING: AUTOMATIC SCHEDULING GAP**

1. **Reminder Lifecycle Implementation:**  
   - `scheduleBookingReminders` (`server/notifications/reminderEngine.ts:53`) creates 24h and 1h reminder records in the `reminders` table upon booking confirmation.
   - `processDueReminders` (`reminderEngine.ts:208`) performs an atomic claim via the Supabase RPC `claim_reminder(p_reminder_id)`, validates student timezone, and dispatches reminder notifications.
   - `cancelBookingReminders` and `rescheduleBookingReminders` manage reminder state during booking updates.
2. **Cron Route Implementation:**  
   Route `app.all('/api/cron/process-reminders')` is declared at `api/index.ts:4059`. It enforces timing-safe comparison against `CRON_SECRET`.
3. **Gaps Identified:**
   - **Gap A (Deployment Blocker for Automatic Reminders):** `vercel.json` does **NOT** contain a `"crons"` array. Vercel Cron will never trigger `/api/cron/process-reminders`. Reminders will remain in `pending` status indefinitely unless triggered by an external scheduler.
   - **Gap B (Security / Log Leakage Risk):** Line 4063 in `api/index.ts`:  
     `const providedSecret = String(req.query.secret || (authHeader && authHeader.replace(/^Bearer\s+/i, '')) || '');`  
     Accepting `req.query.secret` allows `?secret=...` in the request URL, which can leak into proxy logs, CDN logs, and browser history. In production, Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`, making query parameter authentication an unnecessary risk.

---

## 11. SUPABASE PRODUCTION CONTRACT

1. **Migrations Hierarchy:**  
   19 migration files in `supabase/migrations/`, dated sequentially from `20260903000000_phase3_core_schema.sql` to `20260907000013_phase6_final_hardening.sql`.
2. **`calendar_connections` RLS Verification:**  
   - In `20260907000000_phase4_calendar_zoom_integrations.sql:47-52`:
     ```sql
     CREATE POLICY "Teacher can view and manage calendar connections"
     ON public.calendar_connections FOR ALL TO authenticated
     USING (true) WITH CHECK (true);
     ```
   - **Finding:** The RLS policy grants `authenticated` users full read/write access without checking `auth.email() IN (SELECT email FROM teacher_accounts)`.
   - **Impact:** Because only Mahmoud's teacher account is provisioned in Supabase Auth (no student login), this policy does not immediately expose data to unauthenticated public visitors (`anon` policy explicitly denies queries via `USING (false)`). However, if arbitrary signups are enabled in Supabase Auth, any authenticated user could read or modify OAuth tokens.
3. **Booking Management Security Restoration:**  
   Verified that `20260907000001_phase4_1_restore_security.sql:7-44` enforces mandatory reference code and management token verification using bcrypt hash matching (`crypt(v_clean_token, v_booking.management_token_hash)`), successfully closing previous authorization holes.
4. **Atomic Functions:**  
   `claim_reminder` RPC has `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` and `GRANT EXECUTE ... TO service_role`, ensuring that only server-side service role queries can claim reminder records.

---

## 12. DATABASE & MIGRATION DEPLOYMENT SAFETY

- All migrations use `IF NOT EXISTS` or safe idempotent DDL statements.
- `seed.sql` contains only canonical master services, approved testimonials, AI knowledge base items, and default system settings. It contains **no passwords, API keys, or production secrets**.
- No migration depends on local filesystem state or Replit extensions.

---

## 13. AUTHENTICATION & AUTHORIZATION PRODUCTION CONTRACT

1. **Teacher Authorization (`api/index.ts:600-684`):**  
   - In production (`NODE_ENV === 'production'`), requests presenting `dev-teacher-token` or `x-dev-teacher-auth` are explicitly rejected with HTTP 401.
   - Bearer token is validated against Supabase Auth (`supabaseAdmin.auth.getUser(token)`).
   - User email is authoritatively checked against `teacher_accounts` with `is_active = true`.
2. **Guest Booking Access:**  
   Public booking endpoints (`/api/bookings`, `/api/integrations/availability`, `/api/integrations/validate-slot`) are accessible without authentication.
3. **Booking Cancellation / Reschedule:**  
   Protected by `verifyManagementToken` requiring both the booking reference code and the secret guest management token.

---

## 14. AI / GEMINI PRODUCTION CONTRACT

1. **Endpoint (`api/index.ts:80-123`):**  
   `POST /api/learning-guide` using `@google/genai` with model `gemini-3.1-flash-lite`.
2. **Grounding & Scope:**  
   System instruction strictly embeds `MASTER_SPEC` as the canonical source of truth.
3. **Availability & Fail-Safe:**  
   If `GEMINI_API_KEY` is not set, returns HTTP 503 `{"error": "AI service unavailable."}`.
4. **Abuse Prevention:**  
   - Rate limited to 10 requests per minute per IP.
   - Maximum 20 messages in conversation history.
   - Maximum total character count of 10,000 across messages.

---

## 15. TIMEZONE & SCHEDULING CONTRACT

- **Database Storage:** All dates are stored as ISO 8601 UTC strings (`scheduled_start`, `scheduled_end`, `scheduled_for`).
- **Timezone Conversion:** Uses Luxon exclusively (`DateTime.fromISO(..., { zone: 'utc' })` and `.setZone(studentTimezone)`).
- **Teacher Base:** Explicitly anchored to `'Africa/Cairo'`.
- **System Time Independence:** Does not rely on the local server timezone (`process.env.TZ`), ensuring consistent behavior across Vercel serverless regions (e.g. `iad1`, `fra1`).

---

## 16. HEALTH CHECK CONTRACT

1. **`/api/health`:** Declared in `api/index.ts:76`, returns JSON `{"status":"ok"}` with HTTP 200. This is the official API health check.
2. **`/api/healthz`:** Not declared in `api/index.ts`. In Vercel serverless, an unhandled `/api/healthz` returns Express 404. In local development Vite middleware, it falls through to index.html (200).
3. **Operational Assessment:** `/api/health` is fully sufficient for uptime monitoring (e.g. BetterStack, UptimeRobot). No Vercel or cloud orchestrator configuration references `/api/healthz`.

---

## 17. SECURITY & OBSERVABILITY AUDIT

| Risk Category | Finding | Severity | Recommendation |
|---|---|---|---|
| Query Secret Exposure | `/api/cron/process-reminders` allows `req.query.secret` | **HIGH** | Restrict to `Authorization: Bearer <CRON_SECRET>` header |
| Missing Vercel Cron | No `"crons"` key in `vercel.json` | **HIGH** | Add cron configuration or deploy external runner |
| Overly Permissive RLS | `calendar_connections` policy allows all `authenticated` | **MEDIUM** | Restrict to `auth.email() IN (SELECT email FROM teacher_accounts)` |
| Missing Variable in Doc | `APP_URL` is omitted from `.env.example` | **MEDIUM** | Add `APP_URL=` to `.env.example` |
| Token Encryption Key | Encryption key derived from `SUPABASE_SERVICE_ROLE_KEY` | **LOW / INFO** | Note that rotating this key invalidates stored Google tokens |
| Sensitive Data in Logs | Sanitized error handling in dispatcher and email service | **PASS** | Clean; tokens and private notes are omitted from logs |

---

## 18. LOCAL VERIFICATION RESULTS

- **Lint & Typecheck (`npm run lint`):** **PASS** (`tsc --noEmit` exited with code 0)
- **Production Build (`npm run build`):** **PASS**  
  - Vite client bundle: built in 8.85s (`dist/index.html`, `dist/assets/index-drNQM8Nl.css` [122kB], `dist/assets/index-CsHajFM4.js` [1.92MB])
  - esbuild server bundle: built in 37ms (`dist/server.cjs` [238kB])
- **Unit & Integration Tests (`npm test`):** **PASS**  
  - 70 tests passed, 0 failed, 0 skipped across 11 test suites (duration: 48.9s)
- **Local Runtime Verification:**  
  - `GET /`: HTTP 200 (renders complete HTML entry point)
  - `GET /api/health`: HTTP 200 (`{"status":"ok"}`)
  - `POST /api/learning-guide` with `{}`: HTTP 400 (`{"error":"Invalid or missing messages payload."}`)
  - `GET /api/integrations/availability`: HTTP 200 (retrieves real database intervals and computes slot DTOs)

---

## 19. EXTERNAL DASHBOARD VERIFICATION REQUIRED

Before triggering a production deployment on Vercel, the following items must be verified manually in external provider dashboards:

### 1. Vercel Dashboard (`vercel.com`)
- **Project Link:** Connected to GitHub repository `MAHMOUDELWANY/watazawwado`, branch `main`.
- **Framework Preset:** Set to **Vite** (or ensure Output Directory is set to `dist`).
- **Environment Variables:** All 18 production variables configured under **Project Settings → Environment Variables** (Production environment):
  - `APP_URL` (e.g. `https://watazawwado.com`)
  - `NODE_ENV=production`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI` (must match Google Cloud Console)
  - `ZOOM_ACCOUNT_ID`
  - `ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_SECRET`
  - `BREVO_API_KEY`
  - `NOTIFICATION_FROM_EMAIL`
  - `NOTIFICATION_FROM_NAME`
  - `NOTIFICATION_REPLY_TO_EMAIL`
  - `NOTIFICATION_TEACHER_EMAIL`
  - `CRON_SECRET`
  - `GEMINI_API_KEY`

### 2. Supabase Dashboard (`supabase.com`)
- **Database Migrations:** Confirm all 19 migrations from `supabase/migrations/` have been applied to the production database.
- **Initial Seed:** Confirm `services`, `testimonials`, and default `settings` are populated from `supabase/seed.sql`.
- **Teacher Account:** Verify `teacher_accounts` table contains Mahmoud's email (`mhmwdlwany4222@gmail.com` or official teacher email) with `is_active = true` and `role = 'super_admin'`.
- **Auth Settings:** In **Authentication → URL Configuration**, set Site URL to `APP_URL`. Disable public sign-ups if user accounts are restricted to the teacher.

### 3. Google Cloud Console (`console.cloud.google.com`)
- **APIs Enabled:** Google Calendar API (`calendar-json.googleapis.com`).
- **OAuth Consent Screen:** Configured with User Support Email and Developer Contact.
- **Authorized Redirect URIs:** Add exact production callback:  
  `https://<your-production-domain>/api/integrations/google-calendar/callback`

### 4. Zoom App Marketplace (`marketplace.zoom.us`)
- **App Type:** Server-to-Server OAuth App.
- **Scopes:** `meeting:write:admin`, `meeting:read:admin` (or `meeting:write`, `meeting:read`).
- **Activation:** App must be in **Activated** status in the Zoom account.

### 5. Brevo Dashboard (`brevo.com`)
- **Senders & Domains:** The sender email configured in `NOTIFICATION_FROM_EMAIL` must be a **verified sender** in Brevo.
- **API Key:** Verify key has permissions for Transactional Emails.

---

## 20. PRODUCTION READINESS MATRIX

| Area | Status | Evidence | External Verification Needed? | Severity |
|---|---|---|---|---|
| **Repository Baseline** | **PASS** | Clean canonical baseline locked in Task 0.31; no contamination | No | NONE |
| **Vercel Build** | **PASS** | `npm run build` succeeds; Vite `dist` and serverless handler intact | Yes (Vite framework preset) | LOW |
| **Vercel Routing** | **PASS** | `vercel.json` rewrites `/api/*` to `api/index` and SPA fallback | No | NONE |
| **Environment Variables** | **CONDITIONAL** | Variables clean in code; `APP_URL` missing from `.env.example` | Yes (configure in Vercel) | MEDIUM |
| **Domain Contract** | **CONDITIONAL** | `APP_URL` drives OAuth callback and trust origin | Yes (set custom domain) | MEDIUM |
| **Google OAuth** | **CONDITIONAL** | Code verified; redirect derivation fail-closed | Yes (Google Cloud Console URI) | HIGH |
| **Google Calendar Sync** | **PASS** | FreeBusy query, event creation, and update verified | Yes (Teacher OAuth flow) | MEDIUM |
| **Zoom Integration** | **CONDITIONAL** | S2S OAuth verified; cancellation/reschedule gap classified | Yes (Zoom marketplace app) | LOW |
| **Brevo Notifications** | **CONDITIONAL** | Transactional HTTP API verified; fail-closed in production | Yes (Verified Brevo sender) | MEDIUM |
| **Reminders / Cron** | **BLOCKED** | Reminder engine complete, but `vercel.json` crons missing | Yes (Add cron configuration) | **HIGH** |
| **Supabase Migrations** | **CONDITIONAL** | 19 migrations present and ordered; seed clean | Yes (Apply to live Supabase) | HIGH |
| **Supabase RLS** | **CONDITIONAL** | `calendar_connections` policy overly permissive for authenticated | Yes (Audit in Supabase) | MEDIUM |
| **Authentication** | **PASS** | Server-authoritative allowlist against `teacher_accounts` | Yes (Ensure teacher row exists) | LOW |
| **Gemini AI** | **PASS** | Isolated to server; rate limited; fails closed on missing key | Yes (Set GEMINI_API_KEY) | LOW |
| **Timezones** | **PASS** | Luxon throughout; ISO UTC storage; Cairo anchor | No | NONE |
| **Health Check** | **PASS** | `/api/health` returns 200 `{"status":"ok"}` | No | NONE |
| **Security / Secrets** | **CONDITIONAL** | No secrets in client bundle; query secret in cron endpoint | No | MEDIUM |
| **Test Suite** | **PASS** | 70/70 unit and integration tests passing | No | NONE |

---

## 21. CRITICAL ISSUES & GAPS SUMMARY

### 1. Blockers to Complete Autonomous Operation
- **Missing Vercel Cron Configuration:** Without a `"crons"` declaration in `vercel.json`, automated 24h and 1h reminders will not trigger autonomously in Vercel production.
  *Proposed Solution for Next Task:* Add `"crons": [{ "path": "/api/cron/process-reminders", "schedule": "*/10 * * * *" }]` to `vercel.json` (subject to Vercel plan constraints, e.g. Pro required for sub-daily crons).

### 2. Security Gaps
- **Query Parameter Secret in Cron Endpoint:** `/api/cron/process-reminders` allows `req.query.secret`.  
  *Proposed Solution:* Remove `req.query.secret` support in production and strictly require the `Authorization: Bearer <CRON_SECRET>` header.
- **`calendar_connections` RLS Scope:** `20260907000000_phase4_calendar_zoom_integrations.sql` grants `authenticated` full access.  
  *Proposed Solution:* Scope policy to `auth.email() IN (SELECT email FROM teacher_accounts)`.

### 3. Documentation Gaps
- **`APP_URL` in `.env.example`:** `APP_URL` is a mandatory production environment variable but is absent from `.env.example`.

---

## 22. RECOMMENDED NEXT TASK

**`Task 0.33 — Production Deployment Hardening & Configuration Sync`**

Scope:
1. Safely add `APP_URL=` to `.env.example`.
2. Configure `"crons"` in `vercel.json` to invoke `/api/cron/process-reminders`.
3. Harden `/api/cron/process-reminders` to reject query-string secrets in production.
4. (Optional) Provide a targeted migration to restrict `calendar_connections` RLS strictly to teacher accounts.
5. Provide the exact Vercel dashboard environment variable configuration checklist for deployment.
