# Production Reminder Scheduler Configuration Guide

**Application:** Watazawwado  
**Target Endpoint:** `POST /api/cron/process-reminders`  
**Hosting Environment:** Vercel (Hobby Plan)  
**Recommended External Scheduler:** [cron-job.org](https://cron-job.org) (Free HTTP Cron Service)  

---

## Overview

Because Vercel's Hobby plan restricts native Vercel Crons to running at most once per day, an external HTTP cron service is required to invoke the lesson reminder engine at the required 10-minute interval (`*/10 * * * *`).

The external scheduler is **only** responsible for triggering the endpoint. The Express application server on Vercel remains responsible for:
- Authenticating requests
- Selecting due 24-hour and 1-hour reminders
- Executing atomic database claims (`claim_reminder`)
- Dispatching email notifications via Brevo
- Enforcing idempotency and retry semantics

---

## Endpoint Configuration Specification

When creating the cron job in your `cron-job.org` dashboard (or any equivalent HTTP cron provider), use the following exact settings:

| Parameter | Configuration Value | Notes |
|---|---|---|
| **Title / Name** | `Watazawwado Lesson Reminders` | Descriptive name for your dashboard |
| **URL** | `https://<APP_URL>/api/cron/process-reminders` | Replace `<APP_URL>` with your canonical Vercel production domain |
| **HTTP Method** | `POST` | Must be `POST` |
| **Schedule** | Every 10 minutes (`*/10 * * * *`) | Ensures 24h and 1h reminders fire accurately |
| **Request Timeout** | 30 seconds | Default standard timeout |

---

## Authentication & Headers

The endpoint requires a custom HTTP header for security. **Never pass the secret as a query parameter in the URL.**

### Headers Configuration

1. In the cron job settings, navigate to **Headers** / **HTTP Headers**.
2. Add a new request header:
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer <CRON_SECRET>`

> **CRITICAL SECURITY RULES:**
> - Replace `<CRON_SECRET>` with the exact value configured in your Vercel Environment Variables (`CRON_SECRET`).
> - Do **NOT** commit the secret string to Git or paste it in documentation/chats.
> - Ensure the secret is supplied **only** via the `Authorization` header. Query-string parameters (`?secret=...`) are rejected by the server with `401 Unauthorized`.

---

## Expected Response Format

Upon successful execution, the endpoint returns an **HTTP 200 OK** response with a JSON summary payload:

```json
{
  "success": true,
  "timestamp": "2026-09-06T12:00:00.000Z",
  "summary": {
    "processed": 0,
    "sent24h": 0,
    "sent1h": 0,
    "skipped": 0,
    "failed": 0
  }
}
```

### Unsuccessful Response Codes

- **HTTP 401 Unauthorized:** Missing, invalid, or malformed `Authorization` header.
- **HTTP 503 Service Unavailable:** `CRON_SECRET` environment variable is not configured on the Vercel server.

---

## Setup & Verification Checklist

1. Log in to [cron-job.org](https://cron-job.org).
2. Click **Console** → **Create Cronjob**.
3. Set **URL** to `https://<APP_URL>/api/cron/process-reminders`.
4. Set **Request Method** to `POST`.
5. Set **Execution Schedule** to **Every 10 minutes**.
6. Under **Headers**, click **Add Header** and enter:
   - Name: `Authorization`
   - Value: `Bearer <CRON_SECRET>`
7. Click **Create**.
8. Click **Test Run** to verify initial connection. Ensure the execution log records **HTTP 200 OK**.
9. Enable email notifications for failed executions (optional but recommended).
