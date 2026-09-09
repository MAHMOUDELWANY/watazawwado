# TASK 0.55.4-C: GOOGLE CALENDAR OAUTH CALLBACK TEACHER AUTHORIZATION CORRECTION AUDIT & VERIFICATION

**Document Version:** 1.0.0  
**Date:** 2026-09-08  
**Scope:** Server-Side Teacher Identity Resolution & OAuth Callback Authorization  
**Production Supabase Project:** `fmwxqyroyxgigvpahpri`  
**Classification:** Security Architecture & Authorization Remediation  

---

## 1. Executive Summary

During Google Calendar OAuth integration, the authorization URL generator embeds the authenticated teacher's Supabase Auth user UUID into an HMAC-SHA256 signed state parameter. Upon Google OAuth redirection back to `/api/integrations/google-calendar/callback`, the server verifies the state signature, extracts the embedded `teacherId` (Auth user UUID), and invokes `isTeacherCurrentlyAuthorized(teacherId)`.

Previously, `isTeacherCurrentlyAuthorized` attempted to map the UUID to an email address exclusively via the `public.profiles` table. In production, teacher accounts are authoritative in `public.teacher_accounts` (which does not use an `id` column or require `public.profiles`). Consequently, any authenticated teacher lacking a row in `public.profiles` was erroneously rejected with `403 Unauthorized: Teacher account is not authorized or has been deactivated.`

Task 0.55.4-C remediates this issue by updating `isTeacherCurrentlyAuthorized` to authoritatively resolve the Supabase Auth user's email via `supabase.auth.admin.getUserById(cleanId)` and verify active status against `public.teacher_accounts`.

---

## 2. Root Cause & Architectural Analysis

### 2.1 The Teacher Identity Model
In Watazawwado, the teacher authorization architecture is defined as follows:
- **`public.teacher_accounts`**: Contains `email` (text, primary identifier), `role` (text), `is_active` (boolean), `created_at` (timestamptz). There is NO `id` or `user_id` column.
- **Supabase Auth (`auth.users`)**: The source of truth for user authentication and credentials, assigning a unique UUID (`auth.uid()`) to each registered user.
- **`public.profiles`**: A user profile table that may or may not exist for newly invited or pre-seeded teacher accounts.

### 2.2 The Previous Implementation Flaw
When `isTeacherCurrentlyAuthorized` received an Auth user UUID:
```typescript
// Legacy flawed path:
const { data: profile } = await supabase
  .from('profiles')
  .select('id, email, role')
  .eq('id', cleanId)
  .maybeSingle();

if (profile && profile.email) {
  // checked teacher_accounts...
}
```
If `public.profiles` contained no matching row for the teacher's Auth UUID, `profile` returned `null`, causing the check to fail closed and reject valid, active teachers during OAuth callback processing.

---

## 3. Remediation Details

### 3.1 Direct Auth Admin Resolution
`isTeacherCurrentlyAuthorized` in `server/integrations/syncEngine.ts` was updated to implement a three-tier authorization hierarchy:

1. **Direct Email Resolution**: If the input string is an email (contains `@`), it directly queries `public.teacher_accounts` matching `ilike('email', normalizedEmail).eq('is_active', true)`.
2. **Authoritative Supabase Auth Resolution (Primary UUID Flow)**: If the input is a UUID, it queries the Supabase Admin Auth API (`supabase.auth.admin.getUserById(cleanId)`) to retrieve the user's verified email from `auth.users`, and then verifies active status against `public.teacher_accounts`.
3. **Profiles Table Fallback**: Retained as a secondary fallback for environments or mock configurations where `public.profiles` is populated.

### 3.2 Security & Scoping Invariants Maintained
- **HMAC State Verification**: OAuth state parameter remains HMAC-SHA256 signed with `SUPABASE_SERVICE_ROLE_KEY` to prevent tampering and identity spoofing.
- **CSRF Protection**: HttpOnly `oauth_state` cookie matching is enforced prior to state payload decoding.
- **Connection Isolation**: Successful OAuth token persistence (`calendar_connections`) remains strictly scoped to `teacher_id = teacherAuthUuid`, ensuring one teacher's connection never overwrites or deactivates another teacher's integration.

---

## 4. Test Verification Suite

A dedicated regression test suite was implemented in `test/task-0.55.4-c-google-calendar-oauth-callback-teacher-auth.test.ts`:

| Test Case | Description | Result |
| :--- | :--- | :--- |
| **Test A** | Authorizes teacher with Auth UUID and active `teacher_accounts` row, with **ZERO profile rows** (exact production scenario) | **PASS** |
| **Test B** | Authorizes teacher when `public.profiles` row is also present | **PASS** |
| **Test C** | Rejects authenticated non-teacher student UUID | **PASS** |
| **Test D** | Rejects deactivated teacher account (`is_active = false`) | **PASS** |
| **Test E** | Rejects user whose auth record has no email address | **PASS** |
| **Test F** | Rejects when Supabase Auth `getUserById` fails or user does not exist | **PASS** |
| **Test G** | Callback rejects missing state, mismatched state, and invalid HMAC signature with HTTP 403 | **PASS** |
| **Test H** | Callback rejects valid state signature if embedded Auth UUID is not an active teacher (HTTP 403) | **PASS** |
| **Test I** | Callback securely scopes `calendar_connections` insertion to authenticated teacher Auth UUID without cross-teacher leakage | **PASS** |

**Summary:** 9 passed, 0 failed (100% pass rate).

---

## 5. Deployment & Production Verification Instructions

1. Deploy the updated repository to Vercel via standard Git push.
2. Log into the Teacher Portal (`/staff/login`) using the authorized teacher credentials (`mhmwdlwany4222@gmail.com` or `mahmoudelwany98@gmail.com`).
3. Navigate to **Teacher Dashboard > Integrations > Google Calendar**.
4. Click **Connect Google Calendar**.
5. Complete the Google OAuth consent screen.
6. The popup will redirect to `/api/integrations/google-calendar/callback`, successfully authorize the teacher Auth UUID via `supabase.auth.admin.getUserById`, store the connection in `calendar_connections`, post the `GOOGLE_CALENDAR_CONNECTED` message to the opener window, and close cleanly.
