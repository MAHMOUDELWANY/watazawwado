# P5: Security, attacker mindset

Last: after P2 and P3 fixes are on `main`, so it attacks the fixed code. Suggested model: Opus 5.5, effort xhigh.

Authorized by the owner (2026-11-10) against our own app. Read first: `docs/testing/RULES.md`, root `RULES.md`,
P2/P3 findings. QA accounts: `qa-p5` (two of each role, to attack each other).

## Rules of engagement
- Attack `localhost:3005` (same code, same production database). Never the live domain: no scans, floods or
  brute force there. One read-only check of live headers/CSP/TLS is fine.
- No denial-of-service. Rate-limit tests stay small (enough to prove the limit exists).
- Do not touch non-QA data; prove access with QA accounts only. Never print or commit secrets you find; report
  where they are.

## Attack list (OWASP Top 10 + API Top 10, and ours)
1. **Access**: IDOR on every id in every endpoint (student A reads/edits/cancels B's booking, homework, chat,
   payment, child); parent reaches a non-linked child; student calls teacher/admin routes; teacher reaches
   another teacher's students; dev tokens and `x-dev-teacher-auth` refused when `ALLOW_DEV_AUTH` is off.
2. **Money**: change price/currency/duration/package in requests, reuse or stack discount codes, self-referral,
   replay or forge Stripe/PayPal webhooks, confirm a paid booking without payment, refund twice, negative
   credits, race two redemptions of the last credit.
3. **Supabase**: call tables and RPCs directly with the anon key and with a user session; RLS gaps; `SECURITY
   DEFINER` functions without owner checks; storage buckets readable by anyone.
4. **Injection**: SQL/filter injection in search and CRM, XSS in names, chat, notes, homework and emails (stored
   and reflected), header/email injection, CSV formula injection in exports, open redirects, SSRF in any URL
   field.
5. **AI**: prompt injection in the intake chat and learning guide (leak system prompt, other users' data,
   change prices, run up cost); output rendered unsafely.
6. **Auth/session**: token reuse after sign-out, password reset and magic-link abuse, account enumeration, age
   rules bypass, CSRF on state-changing routes, cron endpoints without `CRON_SECRET`.
7. **Files and config**: upload type/size abuse, path traversal, secrets in the client bundle or `dist/`,
   source maps, CORS, CSP and security headers, dependency audit (`npm audit`), Vercel/Supabase advisors.
8. Use the `security-review`, `cso` and `claude-security` skills for a full static scan as well.

## Output
`docs/testing/findings/P5.md` with a working proof for every finding (request + response, QA data only),
severity, fix. Fix Critical/High with a regression test that fails before the fix.

## Done when
Every item above tried and recorded as safe or finding; all Critical/High fixed and re-attacked; summary sent.
